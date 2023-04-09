const express = require("express");
const {
  create,
  verifyEmail,
  resendEmailVerificationToken,
  forgotPassword,
  sendResetPasswordTokenStatus,
  resetPassword,
  signIn,
} = require("../controllers/user");
const {
  userValidator,
  validate,
  validatePassword,
  signInValidator,
} = require("../middlewares/validator");
const { isValidPasswordResetToken } = require("../middlewares/user");

const router = express.Router();

router.post("/create", userValidator, validate, create);

router.post("/sign-in", signInValidator, validate, signIn);

router.post("/verify-email", verifyEmail);

router.post("/resend-email-verification-token", resendEmailVerificationToken);

router.post("/forgot-password", forgotPassword);

router.post(
  "/verify-password-reset-token",
  isValidPasswordResetToken,
  sendResetPasswordTokenStatus
);

router.post(
  "/reset-password",
  validatePassword,
  validate,
  isValidPasswordResetToken,
  resetPassword
);

module.exports = router;
