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
  if (file) {
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
  }

  await newMovie.save();

  res.status(201).json({ id: newMovie._id, title });
};

exports.updateMovieWithoutPoster = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID.");

  const movie = await Movie.findById(movieId);
  if (!movie) return sendError(res, "Movie not found.", 404);

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
  } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.director = director;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id.");
    }

    movie.writers = writers;
  }

  await movie.save();

  res.status(200).json({ message: "Movis is updated." });
};

exports.updateMovieWithPoster = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID.");

  if (!req.file) return sendError(res, "Movie poster missing.");

  const movie = await Movie.findById(movieId);
  if (!movie) return sendError(res, "Movie not found.", 404);

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
  } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.director = director;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id.");
    }

    movie.writers = writers;
  }
  const posterId = movie.poster?.public_id;
  if (posterId) {
    const { result } = await cloudinary.uploader.destroy(posterId);
    if (result !== "ok") {
      return sendError(res, "Could not update the poster.");
    }
  }

  const {
    secure_url: url,
    public_id,
    responsive_breakpoints,
  } = await cloudinary.uploader.upload(req.file.path, {
    folder: `/movie-review-app/movie/${movie._id}`,
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

  movie.poster = posterData;

  await movie.save();

  res.status(200).json({ message: "Movis is updated." });
};

exports.removeMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID.");

  const movie = await Movie.findById(movieId);
  if (!movie) return sendError(res, "Movie not found.", 404);

  // Check if there is a poster or not
  // If yes, we have to remove it

  const posterId = movie?.poster?.public_id;
  if (posterId) {
    const { result } = await cloudinary.uploader.destroy(posterId);
    if (result !== "ok") {
      return sendError(res, "Could not delete the poster from Cloudinary.");
    }
  }

  const trailerId = movie?.trailer?.public_id;
  if (!trailerId) return sendError(res, "Could not find trailer in Cloudinary");

  const { result } = await cloudinary.uploader.destroy(trailerId, {
    resource_type: "video",
  });
  if (result !== "ok") {
    return sendError(res, "Could not delete the trailer from Cloudinary.");
  }

  await cloudinary.api.delete_folder(`movie-review-app/movie/${movie._id}`);

  await Movie.findByIdAndDelete(movieId);

  res.status(200).json({ message: "The movie was removed successfully." });
};
