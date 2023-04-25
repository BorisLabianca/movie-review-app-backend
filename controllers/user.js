const jwt = require("jsonwebtoken");

const User = require("../models/User");
const EmailVerificationToken = require("../models/EmailVerificationToken");
const PasswordResetToken = require("../models/PasswordResetToken");

const { isValidObjectId } = require("mongoose");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { sendError, generateRandomByte } = require("../utils/helper");

exports.create = async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    return sendError(res, "This email is already used.", 409);
  }
  const newUser = new User({ name, email, password });
  await newUser.save();

  let OTP = generateOTP();

  const newEmailVerificationToken = new EmailVerificationToken({
    owner: newUser._id,
    token: OTP,
  });
  await newEmailVerificationToken.save();

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@moviereviewapp.com",
    to: newUser.email,
    subject: "Email Verification",
    html: `<p>Your Verification OTP</p>
    <h1>${OTP}</h1>`,
  });

  res.status(201).json({
    user: { id: newUser._id, name: newUser.name, email: newUser.email },
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user.");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found", 404);

  if (user.isVerified) return sendError(res, "User is already verified.", 409);

  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "Token not found", 404);

  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please submit a valid OTP.");

  user.isVerified = true;
  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@moviereviewapp.com",
    to: user.email,
    subject: "Welcome Email",
    html: "<h1>Welcome to our app and thanks for choosing us.</h1>",
  });

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      isVerified: user.isVerified,
      role: user.role,
    },
    message: "Your email is verified.",
  });
};

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found", 404);

  if (user.isVerified) return sendError(res, "User is already verified.", 409);

  const tokenExists = await EmailVerificationToken.findOne({ owner: userId });
  if (tokenExists)
    return sendError(res, "You can request for another OTP only after 1 hour.");

  let OTP = generateOTP();

  const newEmailVerificationToken = new EmailVerificationToken({
    owner: user._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@moviereviewapp.com",
    to: user.email,
    subject: "Email Verification",
    html: `<p>Your Verification OTP</p>
        <h1>${OTP}</h1>`,
  });

  res.status(201).json({
    message:
      "Please verify your email. A new OTP has been sent to your email address.",
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, "Email is missing.");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found.", 404);

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return sendError(res, "You can request for another OTP only after 1 hour.");

  const token = await generateRandomByte();
  const newPasswordResetToken = await new PasswordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();

  const resetPasswordUrl = `http://localhost:5173/auth/reset-password?token=${token}&id=${user._id}`;

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "security@moviereviewapp.com",
    to: user.email,
    subject: "Reset Password Link",
    html: `<p>Click here to reset your password.</p>
        <a href="${resetPasswordUrl}">Change Password</a>`,
  });
  res.status(201).json({
    message:
      "Please verify your email. We sent you a link to reset your password.",
  });
};

exports.sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true });
};

exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  const user = await User.findById(userId);
  const matched = await user.comparePassword(newPassword);
  if (matched)
    return sendError(
      res,
      "The new password must be different from the old one."
    );
  user.password = newPassword;
  await user.save();

  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "security@moviereviewapp.com",
    to: user.email,
    subject: "Password Reset Successfully",
    html: `<h1>Password Reset Successfully</h1>
        <p>Now you can login with your new password.</p>`,
  });
  res.status(201).json({
    message:
      "Password reset successfully, now you can login with your new password.",
  });
};

exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return sendError(res, "Email/Password combination incorrect.", 409);

  const matched = await user.comparePassword(password);

  if (!matched)
    return sendError(res, "Email/Password combination incorrect.", 409);

  const { _id, name, role, isVerified } = user;
  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

  res.json({
    user: { id: _id, name, email, role, token: jwtToken, isVerified },
  });
};
