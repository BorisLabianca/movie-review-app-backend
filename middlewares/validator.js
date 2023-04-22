const { check, validationResult } = require("express-validator");
const genres = require("../utils/genres");
const { isValidObjectId } = require("mongoose");

exports.userValidator = [
  check("name").trim().not().isEmpty().withMessage("Name is missing."),
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid."),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing.")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be between 8 and 20 characters long."),
];

exports.validatePassword = [
  check("newPassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing.")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be between 8 and 20 characters long."),
];

exports.signInValidator = [
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid."),
  check("password").trim().not().isEmpty().withMessage("Password is missing."),
];

exports.actorInfoValidator = [
  check("name")
    .trim()
    .not()
    .isEmpty()
    .withMessage("The actor name is missing."),
  check("about")
    .trim()
    .not()
    .isEmpty()
    .withMessage("The about section is missing."),
  check("gender").trim().not().isEmpty().withMessage("The gender is missing."),
];

exports.validateMovie = [
  check("title")
    .trim()
    .not()
    .isEmpty()
    .withMessage("The movie title is missing."),
  check("storyLine")
    .trim()
    .not()
    .isEmpty()
    .withMessage("The storyLine is missing."),
  check("director").custom((director) => {
    if (!isValidObjectId(director)) throw Error("Invalid director id.");

    return true;
  }),
  check("language")
    .trim()
    .not()
    .isEmpty()
    .withMessage("The language date is missing."),
  check("releaseDate").isDate().withMessage("The release date is missing."),
  check("status")
    .isIn(["public", "private"])
    .withMessage("The movie status must be public or private."),
  check("type")
    .trim()
    .not()
    .isEmpty()
    .withMessage("The movie type is missing."),
  check("genres")
    .isArray()
    .withMessage("Genres must be an array of strings.")
    .custom((value) => {
      for (let g of value) {
        if (!genres.includes(g)) throw Error("Invalid genres.");
      }

      return true;
    }),
  check("tags")
    .isArray({ min: 1 })
    .withMessage("Tags must be an array of strings.")
    .custom((tags) => {
      for (let tag of tags) {
        if (typeof tag !== "string")
          throw Error("Tags must be an array of strings.");
      }

      return true;
    }),
  check("cast")
    .isArray()
    .withMessage("The cast must be an array of objects.")
    .custom((cast) => {
      for (let c of cast) {
        if (!isValidObjectId(c.actor))
          throw Error("Invalid cast id inside cast.");
        if (!c.roleAs?.trim()) throw Error("Role missing inside cast.");
        if (typeof c.leadActor !== "boolean")
          throw Error(
            "Only boolean values are accepted for leadActor inside cast."
          );

        return true;
      }
    }),
  check("trailer")
    .isObject()
    .withMessage(
      "The trailerInfo must be an object with url and public_id keys."
    )
    .custom(({ url, public_id }) => {
      try {
        const result = new URL(url);
        if (!result.protocol.includes("http"))
          throw Error("The trailer url is invalid try.");

        const array = url.split("/");
        const publicId = array[array.length - 1].split(".")[0];

        if (public_id !== publicId)
          throw Error("The trailer public_id is invalid.");

        return true;
      } catch (error) {
        throw Error("The trailer url is invalid catch.");
      }
    }),
  check("poster").custom((_, { req }) => {
    if (!req.file) throw Error("The poster file is missing.");

    return true;
  }),
];

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (error.length) {
    return res.json({ error: error[0].msg });
  }
  next();
};
