require('dotenv').config()
const express = require("express");
const multer = require("multer");
const router = require("./routes/route");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.use(bodyParser.json());
app.use(multer().any());

mongoose
  .connect(
    process.env.MONGODB_STRING,
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("mongoDB is Connected!!"))
  .catch((err) => console.log(err));

app.use("/", router);

app.listen(process.env.PORT, () => {
  console.log(`App listening on environmental port`);
});
