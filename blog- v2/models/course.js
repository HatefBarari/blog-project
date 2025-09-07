const mongoose = require("mongoose");
const { type } = require("os");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    cover: {
      type: String,
      required: true,
    },
    support: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String, //complete ---- presell
      enum: ["complete", "presell"],
      default: "complete",
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    discountExpirationDate: {
      type: Date,
      default: null,
    },
    categoryID: {
      type: mongoose.Types.ObjectId,
      ref: "Categories",
      required: true,
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

schema.virtual("sessions", {
  ref: "Session",
  localField: "_id",
  foreignField: "course",
});
schema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "course",
});

const model = mongoose.model("Course", schema);

module.exports = model;
