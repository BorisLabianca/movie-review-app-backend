const crypto = require("crypto");
const cloudinary = require("../cloudinary/index");

exports.sendError = (res, error, statusCode = 401) => {
  return res.status(statusCode).json({ error });
};

exports.generateRandomByte = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) reject(err);
      const buffString = buff.toString("hex");
      resolve(buffString);
    });
  });
};

exports.handleNotFound = (req, res) => {
  this.sendError(res, "Not found.", 404);
};

exports.uploadImageToCloudinary = async (filePath, actorId) => {
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    filePath,
    {
      folder: `/movie-review-app/actors/${actorId}`,
      aspect_ratio: "5:6",
      gravity: "face",
      height: 500,
      zoom: "0.75",
      crop: "thumb",
    }
  );

  return { url, public_id };
};

exports.formatActor = (actor) => {
  const { name, about, gender, _id, avatar } = actor;
  return { id: _id, name, about, gender, avatar: avatar?.url };
};
