const express = require("express");
require("express-async-errors");
require("dotenv").config();
require("./db");
const { errorHandler } = require("./middlewares/error");
const { handleNotFound } = require("./utils/helper");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/user");
app.use("/api/user", userRoutes);

const actorRoutes = require("./routes/actor");
app.use("/api/actor", actorRoutes);

app.use("/*", handleNotFound);

app.use(errorHandler);
app.listen(process.env.PORT, () => {
  console.log("Server has started. 🎥 🎬 ⭐️");
});
