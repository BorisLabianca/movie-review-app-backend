const {
  sendError,
  formatActor,
  averageRatingPipeline,
  relatedMoviesAggregation,
  getAverageRatings,
  topRatedMoviesPipeline,
} = require("../utils/helper");
const cloudinary = require("../cloudinary/index");
const Movie = require("../models/Movie");
const Review = require("../models/Review");
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

  res.status(201).json({ movie: { id: newMovie._id, title } });
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

exports.updateMovie = async (req, res) => {
  const { movieId } = req.params;
  const { file } = req;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID.");

  // if (!req.file) return sendError(res, "Movie poster missing.");

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
  movie.language = language;

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id.");
    }

    movie.writers = writers;
  }

  if (file) {
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
  }

  await movie.save();

  res.status(200).json({
    message: "Movis is updated.",
    movie: {
      id: movie._id,
      title: movie.title,
      poster: movie.poster.url,
      genres: movie.genres,
      status: movie.status,
    },
  });
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

exports.getMovies = async (req, res) => {
  const { pageNumber = 0, limit = 5 } = req.query;
  // console.log(pageNumber);
  const movies = await Movie.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNumber) * parseInt(limit))
    .limit(limit);
  const moviesCount = await Movie.countDocuments({});
  const formatedMovies = movies.map((movie) => {
    return {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      responsivePosters: movie.poster?.responsive,
      genres: movie.genres,
      status: movie.status,
    };
  });

  res.status(200).json({ movies: formatedMovies, moviesCount });
};

exports.getMovieForUpdate = async (req, res) => {
  const { movieId } = req.params;
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid ID.");
  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );
  res.status(200).json({
    movie: {
      id: movie._id,
      title: movie.title,
      storyLine: movie.storyLine,
      poster: movie.poster.url,
      releaseDate: movie.releaseDate,
      status: movie.status,
      type: movie.type,
      language: movie.language,
      genres: movie.genres,
      tags: movie.tags,
      director: formatActor(movie.director),
      writers: movie.writers.map((writer) => formatActor(writer)),
      cast: movie.cast.map((c) => {
        return {
          id: c.id,
          profile: formatActor(c.actor),
          roleAs: c.roleAs,
          leadActor: c.leadActor,
        };
      }),
    },
  });
};

exports.searchMovies = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return sendError(res, "Invalid request.");

  const movies = await Movie.find({ title: { $regex: title, $options: "i" } });
  res.status(200).json({
    results: movies.map((m) => {
      return {
        id: m._id,
        title: m.title,
        poster: m.poster.url,
        genres: m.genres,
        status: m.status,
      };
    }),
  });
};

exports.getLatestUploads = async (req, res) => {
  const { limit = 5 } = req.query;
  // console.log(limit);
  const results = await Movie.find({ status: "public" })
    .sort("-createdAt")
    .limit(parseInt(limit));

  const movies = results.map((m) => {
    return {
      id: m._id,
      title: m.title,
      storyLine: m.storyLine,
      poster: m.poster?.url,
      responsivePosters: m.posters?.responsive,
      trailer: m.trailer?.url,
    };
  });

  res.status(200).json({ movies });
};

exports.getSingleMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID.");

  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  // const [aggregatedResponse] = await Review.aggregate(
  //   averageRatingPipeline(movie._id)
  // );
  // const reviews = {};

  // if (aggregatedResponse) {
  //   const { ratingAverage, reviewCount } = aggregatedResponse;
  //   reviews.ratingAverage = parseFloat(ratingAverage).toFixed(1);
  //   reviews.reviewCount = reviewCount;
  // }
  const reviews = await getAverageRatings(movie._id);
  const {
    _id: id,
    title,
    storyLine,
    cast,
    writers,
    director,
    releaseDate,
    genres,
    tags,
    language,
    poster,
    trailer,
    type,
  } = movie;
  res.status(200).json({
    movie: {
      id,
      title,
      storyLine,
      cast: cast.map((c) => ({
        id: c._id,
        profile: {
          id: c.actor._id,
          name: c.actor.name,
          avatar: c.actor.avatar.url,
        },
        leadActor: c.leadActor,
        roleAs: c.roleAs,
      })),
      writers: writers.map((w) => ({
        id: w._id,
        name: w.name,
        avatar: w.avatar.url,
      })),
      director: {
        id: director._id,
        name: director.name,
        avatar: director.avatar.url,
      },
      releaseDate,
      genres,
      tags,
      language,
      poster: poster.url,
      trailer: trailer.url,
      type,
      reviews: { ...reviews },
    },
  });
};

exports.getRelatedMovies = async (req, res) => {
  const { movieId } = req.params;
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID.");

  const movie = await Movie.findById(movieId);

  const movies = await Movie.aggregate(
    relatedMoviesAggregation(movie.tags, movie._id)
  );

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };
  const relatedMovies = await Promise.all(movies.map(mapMovies));

  res.status(200).json({ relatedMovies });
};

exports.getTopRatedMovies = async (req, res) => {
  const { type = "Film" } = req.query;

  const movies = await Movie.aggregate(topRatedMoviesPipeline(type));
  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };
  const topRatedMovies = await Promise.all(movies.map(mapMovies));
  res.status(200).json({ movies: topRatedMovies });
};

exports.searchPublicMovies = async (req, res) => {
  const { title } = req.query;

  if (!title?.trim()) return sendError(res, "Invalid request.");

  const movies = await Movie.find({
    title: { $regex: title, $options: "i" },
    status: "public",
  });

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster?.url,
      responsivePosters: m.poster?.responsivePosters,
      reviews: { ...reviews },
    };
  };
  const results = await Promise.all(movies.map(mapMovies));

  res.status(200).json({
    results,
  });
};
