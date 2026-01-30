const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login-page.html"));
});

app.listen(4000, () =>
  console.log("Backend running at http://localhost:4000")
);