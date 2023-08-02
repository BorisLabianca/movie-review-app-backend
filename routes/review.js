const express = require("express");
const { isAuth } = require("../middlewares/auth");
const { validateRatings, validate } = require("../middlewares/validator");
const { addReview, updateReview } = require("../controllers/review");

const router = express.Router();

router.post("/add/:movieId", isAuth, validateRatings, validate, addReview);

router.patch("/:reviewId", isAuth, validateRatings, validate, updateReview);

module.exports = router;
