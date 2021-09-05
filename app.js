const express = require("express");
const app = express();
const port = 7500;

const mongoose = require("mongoose");
mongoose.connect("mongodb://mongo:27017/testing");
const db = mongoose.connection;

db.on("error", (err) => {
  console.log(err);
});

db.on("open", () => {
  console.log("Database Connection Established!");
});

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const jsend = require("jsend");
app.use(jsend.middleware);

const cors = require("cors");
app.use(cors());

const ShortenedURL = require("./schema/shortenedURL");

app.post("/shorten", async (req, res) => {
  if (!req.body.url || req.body.url === "") {
    res.jsend.fail({ error: "The url cannot be empty" });
    return;
  }

  if (!isValidUrl(req.body.url)) {
    res.jsend.fail({ error: "The provided url is invalid" });
    return;
  }

  const result = await ShortenedURL.findOne({ url: req.body.url });

  if (result) {
    res.jsend.success({ code: result.code });
    return;
  }

  const shortenedUrl = await createShortenedURL(req.body.url);
  res.jsend.success({
    code: shortenedUrl.code,
  });
});

function isValidUrl(url) {
  const regex =
    /^(?:(?:https?|ftp):\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  return regex.test(req.body.url);
}

async function createShortenedURL(url) {
  const newId = await ShortenedURL.countDocuments();
  const shortenedUrl = new ShortenedURL({
    id: newId,
    code: idToShortURL(newId),
    url: url,
    visited: 0,
  });
  await shortenedUrl.save();

  return shortenedUrl;
}

function idToShortURL(n) {
  const map = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const code = [];

  while (n >= 0) {
    code.push(map[n % 62]);
    n = Math.floor(n / 62 - 1);
  }

  code.reverse();
  return code.join("");
}

app.get("/popular", async (req, res) => {
  res.jsend.success({
    popularUrls: (
      await ShortenedURL.find().sort({ visited: -1 }).limit(100)
    ).map(shortenedUrlToPopularResult),
  });
});

function shortenedUrlToPopularResult({ code, visited }) {
  return { code, visited };
}

app.get("/v1/:code", async (req, res) => {
  const result = await ShortenedURL.findOne({ code: req.params.code });

  if (result) {
    result.visited += 1;
    await result.save();
    res.redirect(result.url);
    return;
  }

  res.send("Invalid URL");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
