const { isValidObjectId } = require("mongoose");
const Actor = require("../models/Actor");
const {
  sendError,
  uploadImageToCloudinary,
  formatActor,
} = require("../utils/helper");
const cloudinary = require("../cloudinary/index");

exports.createActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const imageFile = req.file;

  const newActor = new Actor({ name, about, gender });

  if (imageFile) {
    const { url, public_id } = await uploadImageToCloudinary(
      imageFile.path,
      newActor._id
    );
    newActor.avatar = { url, public_id };
  }

  await newActor.save();
  res.status(201).json({ actor: formatActor(newActor) });
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
    const { url, public_id } = await uploadImageToCloudinary(
      imageFile.path,
      actor._id
    );
    actor.avatar = { url, public_id };
  }
  actor.name = name;
  actor.about = about;
  actor.gender = gender;

  await actor.save();
  res.status(200).json({ actor: formatActor(actor) });
};

exports.removeActor = async (req, res) => {
  const { actorId } = req.params;

  if (!isValidObjectId(actorId)) return sendError(res, "Invalid request.");
  const actor = await Actor.findById(actorId);
  if (!actor) return sendError(res, "Invalid request, record not found.", 404);

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

exports.searchActor = async (req, res) => {
  const { name } = req.query;
  // const result = await Actor.find({ $text: { $search: `"${query.name}"` } });
  if (!name) return sendError(res, "Invalid request.");
  const result = await Actor.find({ name: new RegExp(`${name}`, "i") });
  const actorsCount = await Actor.countDocuments({
    name: new RegExp(`${name}`, "i"),
  });
  const actors = result.map((actor) => formatActor(actor));
  res.status(200).json({ results: actors, count: actorsCount });
};

exports.getLatestActors = async (req, res) => {
  const result = await Actor.find().sort({ createdAt: "-1" }).limit(12);
  const actors = result.map((actor) => formatActor(actor));
  res.status(200).json(actors);
};

exports.getSingleActor = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return sendError(res, "Invalid request.");

  const actor = await Actor.findById(id);
  if (!actor) return sendError(res, "Invalid request, record not found.", 404);

  res.status(200).json({ actor: formatActor(actor) });
};

exports.getActors = async (req, res) => {
  const { pageNumber, limit } = req.query;
  const actors = await Actor.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNumber) * parseInt(limit))
    .limit(parseInt(limit));
  const actorsCount = await Actor.countDocuments({});
  const profiles = actors.map((actor) => {
    return formatActor(actor);
  });

  // console.log(pageNumber);

  res.status(200).json({ profiles, actorsCount });
};
