const mongoose = require("mongoose");
const { answer } = require("../controllers/v1/comment");
const { timeStamp } = require("console");

const schema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please fill a valid email address",
      ],
    },
    phone: {
      type: String,
      required: true,
      match: [/^(\+98|0)?9\d{9}$/, "Please fill a valid phone number"],
    },
    answer: {
      type: Number, //0 - 1
      enum: [0, 1],
      default: 0,
    },
    body: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Contact", schema);

module.exports = model;
