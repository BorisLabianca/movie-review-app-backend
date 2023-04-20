const { isValidObjectId } = require("mongoose");
const Actor = require("../models/Actor");
const { sendError } = require("../utils/helper");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

exports.createActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const imageFile = req.file;

  const newActor = new Actor({ name, about, gender });

  if (imageFile) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      imageFile.path,
      {
        folder: `/movie-review-app/actors/${newActor._id}`,
        aspect_ratio: "5:6",
        gravity: "face",
        height: 500,
        zoom: "0.75",
        crop: "thumb",
      }
    );
    newActor.avatar = { url: secure_url, public_id };
  }

  await newActor.save();
  res.status(201).json({
    id: newActor._id,
    name,
    about,
    gender,
    avatar: newActor?.avatar?.url,
  });
};

exports.updateActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const imageFile = req.file;
  const { actorId } = req.params;

  if (!isValidObjectId(actorId)) return sendError(res, "Invalid request.");
  const actor = await Actor.findById(actorId);
  if (!actor) return sendError(res, "Invalid request, record not found.");

  const public_id = actor?.avatar?.public_id;
  if (public_id && imageFile) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove the image from Cloudinary.");
    }
  }

  if (imageFile) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      imageFile.path,
      {
        folder: `movie-review-app/actors/${actor._id}`,
        aspect_ratio: "5:6",
        gravity: "face",
        height: 500,
        zoom: "0.75",
        crop: "thumb",
      }
    );
    actor.avatar = { url: secure_url, public_id };
  }
  actor.name = name;
  actor.about = about;
  actor.gender = gender;

  await actor.save();
  res.status(200).json({
    id: actor._id,
    name,
    about,
    gender,
    avatar: actor?.avatar?.url,
  });
};

exports.removeActor = async (req, res) => {
  const { actorId } = req.params;

  if (!isValidObjectId(actorId)) return sendError(res, "Invalid request.");
  const actor = await Actor.findById(actorId);
  if (!actor) return sendError(res, "Invalid request, record not found.");

  const public_id = actor?.avatar?.public_id;
  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove the image from Cloudinary.");
    }
    await cloudinary.api.delete_folder(`movie-review-app/actors/${actor._id}`);
  }

  await Actor.findByIdAndDelete(actorId);

  res.status(200).json({ message: "Actor removed successfully." });
};
