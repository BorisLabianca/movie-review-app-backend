const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { getAppInfo, getMostRated } = require("../controllers/admin");

const router = express.Router();

router.get("/app-info", isAuth, isAdmin, getAppInfo);
router.get("/most-rated", isAuth, isAdmin, getMostRated);

module.exports = router;
