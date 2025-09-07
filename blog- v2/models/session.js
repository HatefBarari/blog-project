const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    free: {
      type: Number, //0=> not free --- 1=> free
      enum: [0, 1],
      default: 0,
    },
    video: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Session", schema);

module.exports = model;
