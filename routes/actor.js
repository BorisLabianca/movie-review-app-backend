const express = require("express");
const {
  createActor,
  updateActor,
  removeActor,
  searchActor,
  getLatestActors,
  getSingleActor,
  getActors,
} = require("../controllers/actor");
const { uploadImage } = require("../middlewares/multer");
const { actorInfoValidator, validate } = require("../middlewares/validator");
const { isAuth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("avatar"),
  actorInfoValidator,
  validate,
  createActor
);

router.get("/search", isAuth, isAdmin, searchActor);

router.get("/latest-uploads", isAuth, isAdmin, getLatestActors);

router.get("/actors", isAuth, isAdmin, getActors);

router.get("/single/:id", getSingleActor);

router.put(
  "/update/:actorId",
  isAuth,
  isAdmin,
  uploadImage.single("avatar"),
  actorInfoValidator,
  validate,
  updateActor
);

router.delete("/delete/:actorId", isAuth, isAdmin, removeActor);

module.exports = router;
