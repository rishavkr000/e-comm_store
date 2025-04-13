require('dotenv').config()
const express = require("express");
const multer = require("multer");
const router = require("./routes/route");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(multer().any());

mongoose.set('strictQuery', true);
mongoose
  .connect(
    process.env.MONGO_URI,
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
