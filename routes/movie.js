const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { uploadVideo, uploadImage } = require("../middlewares/multer");
const {
  uploadTrailer,
  createMovie,
  updateMovie,
  removeMovie,
  getMovies,
  getMovieForUpdate,
  searchMovies,
  getLatestUploads,
  getSingleMovie,
  getRelatedMovies,
} = require("../controllers/movie");
const { parseData } = require("../utils/helper");
const {
  validateMovie,
  validate,
  validateTrailer,
} = require("../middlewares/validator");

const router = express.Router();

router.post(
  "/upload-trailer",
  isAuth,
  isAdmin,
  uploadVideo.single("video"),
  uploadTrailer
);

router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validateTrailer,
  validate,
  createMovie
);

router.get("/movies", isAuth, isAdmin, getMovies);

router.get("/for-update/:movieId", isAuth, isAdmin, getMovieForUpdate);

// router.patch(
//   "/update-movie-without-poster/:movieId",
//   isAuth,
//   isAdmin,
//   parseData,
//   validateMovie,
//   validate,
//   updateMovieWithoutPoster
// );

// router.patch(
//   "/update-movie-with-poster/:movieId",
//   isAuth,
//   isAdmin,
//   uploadImage.single("poster"),
//   parseData,
//   validateMovie,
//   validate,
//   updateMovieWithPoster
// );

router.get("/search", isAuth, isAdmin, searchMovies);

// For normal users
router.get("/latest-uploads", getLatestUploads);
router.get("/single/:movieId", getSingleMovie);
router.get("/related/:movieId", getRelatedMovies);

router.patch(
  "/update/:movieId",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validate,
  updateMovie
);

router.delete("/delete/:movieId", isAuth, isAdmin, removeMovie);

module.exports = router;
