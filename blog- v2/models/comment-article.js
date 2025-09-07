const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAccept: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 5,
    },
    isAnswer: {
      type: Number,
      required: true,
      default: 0,
    },
    mainCommentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommentArticle",
    },
  },
  { timestamps: true }
);

const model = mongoose.model("CommentArticle", schema);
module.exports = model;
