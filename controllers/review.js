const { isValidObjectId } = require("mongoose");
const { sendError } = require("../utils/helper");
const Movie = require("../models/Movie");
const Review = require("../models/Review");

exports.addReview = async (req, res) => {
  const { movieId } = req.params;
  const { content, rating } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie.");

  const movie = await Movie.findOne({ _id: movieId, status: "public" });
  if (!movie) return sendError(res, "Movie not found.", 404);

  const isAlreadyReviewed = await Review.findOne({
    owner: userId,
    parentMovie: movie._id,
  });
  if (isAlreadyReviewed)
    return sendError(res, "Invalid request, user has already posted a review.");
};
