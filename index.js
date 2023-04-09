const express = require("express");
require("express-async-errors");
require("dotenv").config();
require("./db");
const { errorHandler } = require("./middlewares/error");

const app = express();
app.use(express.json());

const userRoutes = require("./routes/user");
app.use("/api/user", userRoutes);

app.use(errorHandler);
app.listen(process.env.PORT, () => {
  console.log("Server has started. 🎥 🎬 ⭐️");
});
