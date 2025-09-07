const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    departmentID: {
      type: mongoose.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    departmentSubID: {
      type: mongoose.Types.ObjectId,
      ref: "DepartmentSub",
      required: true,
    },
    priority: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answer: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    course: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: "Course",
    },
    parent: {
      type: mongoose.Types.ObjectId,
      ref: "Ticket",
      required: false,
    },
    isAnswer: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Ticket", schema);
module.exports = model;
