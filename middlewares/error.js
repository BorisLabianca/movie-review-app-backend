exports.errorHandler = (err, req, res, next) => {
  console.log("error: ", err);
  res.status(500).json({ error: err.message || err });
};
