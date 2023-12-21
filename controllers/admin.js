const Movie = require("../models/Movie");
const Review = require("../models/Review");
const User = require("../models/User");

exports.getAppInfo = async (req, res) => {
  const movieCount = await Movie.countDocuments();
  const reviewCount = await Review.countDocuments();
  const userCount = await User.countDocuments();

  res.status(200).json({ movieCount, reviewCount, userCount });
};
