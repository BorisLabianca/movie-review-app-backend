const express = require("express");
require("express-async-errors");
require("dotenv").config();
require("./db");
const { errorHandler } = require("./middlewares/error");
const { handleNotFound } = require("./utils/helper");
const cors = require("cors");
const userRoutes = require("./routes/user");
const actorRoutes = require("./routes/actor");
const movieRoutes = require("./routes/movie");
const reviewRoutes = require("./routes/review");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);

app.use("/api/actor", actorRoutes);

app.use("/api/movie", movieRoutes);

app.use("/api/review", reviewRoutes);

app.use("/api/admin", adminRoutes);

app.use("/*", handleNotFound);

app.use(errorHandler);
app.listen(process.env.PORT, () => {
  console.log("Server has started. 🎥 🎬 ⭐️");
});
