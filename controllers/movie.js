const { sendError } = require("../utils/helper");
const cloudinary = require("../cloudinary/index");
const Movie = require("../models/Movie");
const { isValidObjectId } = require("mongoose");

exports.uploadTrailer = async (req, res) => {
  const { file } = req;
  if (!file) return sendError(res, "Video file missing.");
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file.path,
    {
      folder: "/movie-review-app/trailers",
      resource_type: "video",
    }
  );
  res.status(201).json({ url, public_id });
};

exports.createMovie = async (req, res) => {
  const { file, body } = req;
  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = body;

  const newMovie = new Movie({
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    trailer,
    language,
  });

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id.");
    }

    newMovie.writers = writers;
  }

  //   Uplaoding poster
  const {
    secure_url: url,
    public_id,
    responsive_breakpoints,
  } = await cloudinary.uploader.upload(file.path, {
    folder: `/movie-review-app/movie/${newMovie._id}`,
    transformation: {
      width: 1920,
      height: 1080,
    },
    responsive_breakpoints: {
      create_derived: true,
      max_width: 640,
      max_images: 3,
    },
  });

  const posterData = { url, public_id, responsive: [] };

  const { breakpoints } = responsive_breakpoints[0];
  if (breakpoints.length) {
    for (let imageObject of breakpoints) {
      const { secure_url } = imageObject;
      posterData.responsive.push(secure_url);
    }
  }

  newMovie.poster = posterData;
  await newMovie.save();

  res.status(201).json({ id: newMovie._id, title });
};
