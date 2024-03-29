const crypto = require("crypto");
const cloudinary = require("../cloudinary/index");
const Review = require("../models/Review");

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

exports.parseData = (req, res, next) => {
  const { trailer, cast, genres, tags, writers } = req.body;

  if (trailer) req.body.trailer = JSON.parse(trailer);
  if (cast) req.body.cast = JSON.parse(cast);
  if (genres) req.body.genres = JSON.parse(genres);
  if (tags) req.body.tags = JSON.parse(tags);
  if (writers) req.body.writers = JSON.parse(writers);

  next();
};

exports.averageRatingPipeline = (movieId) => {
  return [
    {
      $lookup: {
        from: "Review",
        localField: "rating",
        foreignField: "_id",
        as: "averageRating",
      },
    },
    {
      $match: { parentMovie: movieId },
    },
    {
      $group: {
        _id: null,
        ratingAverage: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ];
};

exports.relatedMoviesAggregation = (tags, movieId) => {
  return [
    {
      $lookup: {
        from: "Movie",
        localField: "tags",
        foreignField: "_id",
        as: "relatedMovies",
      },
    },
    {
      $match: {
        tags: { $in: [...tags] },
        _id: { $ne: movieId },
      },
    },
    {
      $project: {
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
      },
    },
    { $limit: 5 },
  ];
};

exports.getAverageRatings = async (movieId) => {
  const [aggregatedResponse] = await Review.aggregate(
    this.averageRatingPipeline(movieId)
  );
  const reviews = {};

  if (aggregatedResponse) {
    const { ratingAverage, reviewCount } = aggregatedResponse;
    reviews.ratingAverage = parseFloat(ratingAverage).toFixed(1);
    reviews.reviewCount = reviewCount;
  }

  return reviews;
};

exports.topRatedMoviesPipeline = (type) => {
  const matchOptions = {
    reviews: { $exists: true },
    status: { $eq: "public" },
  };
  if (type) matchOptions.type = { $eq: type };
  return [
    {
      $lookup: {
        from: "Movie",
        localField: "reviews",
        foreignField: "_id",
        as: "topRated",
      },
    },
    {
      $match: matchOptions,
    },
    {
      $project: {
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
        reviewCount: {
          $size: "$reviews",
        },
      },
    },
    {
      $sort: {
        reviewCount: -1,
      },
    },
    { $limit: 5 },
  ];
};
