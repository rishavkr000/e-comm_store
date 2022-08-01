const express = require("express");
const multer = require("multer");
const { AppConfig } = require("aws-sdk");
const router = require("./routes/route");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = 4000;

const app = express();
app.use(bodyParser.json());
app.use(multer().any());

mongoose
  .connect(
    "mongodb+srv://group15_project:EDHBqxqKYJaki5EJ@cluster0.i9alz.mongodb.net/Rishav5th",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("mongoDB is Connected!!"))
  .catch((err) => console.log(err));

app.use("/", router);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
