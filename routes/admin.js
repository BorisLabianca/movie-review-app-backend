const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { getAppInfo } = require("../controllers/admin");

const router = express.Router();

router.get("/app-info", isAuth, isAdmin, getAppInfo);

module.exports = router;
