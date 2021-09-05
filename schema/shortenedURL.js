const mongoose = require("mongoose");

const shortenedURLSchema = new mongoose.Schema({
  id: Number,
  url: String,
  code: String,
  visited: Number,
});

const ShortenedURL = mongoose.model("shortened_urls", shortenedURLSchema);
module.exports = ShortenedURL;
