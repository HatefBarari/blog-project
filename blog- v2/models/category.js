const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categories",
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Categories", schema);

module.exports = model;
