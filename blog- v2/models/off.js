const mongoose = require("mongoose");
const { type } = require("os");

const schema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    percent: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    course: {
      type: mongoose.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    max: {
      type: Number,
      required: true,
      min: 1,
    },
    uses: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Off", schema);

module.exports = model;
