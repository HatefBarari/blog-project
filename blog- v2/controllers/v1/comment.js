const commentModel = require("./../../models/comment");
const courseModel = require("./../../models/course");
const validatorComment = require("./../../validators/comment");
const commentArticleModel = require("./../../models/comment-article");
const articleModel = require("./../../models/article");
const validatorCommentArticle = require("./../../validators/commentArticle");
const { isValidObjectId } = require("mongoose");

//!! Course
exports.create = async (req, res, next) => {
  try {
    const validationResult = validatorComment(req.body);
    if (validationResult !== true) {
      return res.status(422).json(validationResult);
    }
    const { body, courseHref, score } = req.body;

    const course = await courseModel.findOne({
      href: courseHref.toLowerCase(),
    });
    if (!course) {
      return res.status(404).json({ message: "course not found" });
    }
    const comment = await commentModel.create({
      body,
      course: course._id,
      creator: req.user._id,
      score,
      isAccept: 0,
      isAnswer: 0,
    });
    return res
      .status(200)
      .json({ message: "comment created successfully", comment });
  } catch (error) {
    return next(error);
  }
};
exports.getAll = async (req, res, next) => {
  try {
    // گرفتن تمام کامنت‌ها
    const comments = await commentModel
      .find({})
      .populate("course", "name")
      .populate("creator", "-password")
      .lean();

    // ایجاد یک آرایه برای ذخیره کامنت‌های اصلی به همراه پاسخ‌ها
    let allComments = [];

    // فیلتر کردن و دسته‌بندی کامنت‌ها
    comments.forEach((comment) => {
      // اگر کامنت اصلی است (یعنی mainCommentID ندارد)
      if (!comment.mainCommentID) {
        // پیدا کردن پاسخ‌ها برای این کامنت
        const answers = comments.filter(
          (answerComment) =>
            String(answerComment.mainCommentID) === String(comment._id)
        );

        // اضافه کردن پاسخ‌ها به کامنت اصلی
        allComments.push({
          ...comment,
          answers: answers.map((answer) => ({
            ...answer,
            course: answer.course.name,
            creator: answer.creator.name,
          })),
        });
      }
    });

    // بازگشت تمام کامنت‌ها و پاسخ‌ها به همراه هم
    return res.status(200).json(allComments);
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({ message: "Invalid Comment ID" });
    }

    const deleteComment = await commentModel.findOneAndDelete({ _id: id });
    if (!deleteComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    return res.status(200).json({ message: "Delete Comment Successfully !!" });
  } catch (error) {
    return next(error);
  }
};

exports.accept = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(401).json({ message: "ID is not valid !" });
    }
    const acceptedComment = await commentModel.findByIdAndUpdate(
      id,
      {
        isAccept: 1,
      },
      { new: true }
    );

    if (!acceptedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    return res
      .status(201)
      .json({ acceptedComment, message: "Comment  Accepted Successfully!" });
  } catch (error) {
    return next(error);
  }
};
exports.reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(401).json({ message: "ID is not valid !" });
    }
    const rejectedComment = await commentModel.findByIdAndUpdate(
      id,
      {
        isAccept: 0,
      },
      { new: true }
    );

    if (!rejectedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    return res
      .status(201)
      .json({ rejectedComment, message: "Comment  Rejected Successfully!" });
  } catch (error) {
    return next(error);
  }
};
exports.answer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ message: "ID is not valid !" });
    }

    const acceptedComment = await commentModel.findByIdAndUpdate(
      id,
      {
        isAccept: 1,
      },
      { new: true }
    );
    if (!acceptedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const answerComment = await commentModel.create({
      body,
      course: acceptedComment.course,
      creator: req.user._id,
      isAccept: 1,
      isAnswer: 1,
      mainCommentID: id,
    });
    return res.status(201).json(answerComment);
  } catch (error) {
    return next(error);
  }
};
//!! Article
exports.createArticle = async (req, res, next) => {
  try {
    const validationResult = validatorCommentArticle(req.body);
    if (validationResult !== true) {
      return res.status(422).json(validationResult);
    }
    const { body, articleHref, score } = req.body;

    const article = await articleModel.findOne({
      href: articleHref.toLowerCase(),
    });
    if (!article) {
      return res.status(404).json({ message: "article not found" });
    }
    const commentArticle = await commentArticleModel.create({
      body,
      article: article._id,
      creator: req.user._id,
      score,
      isAccept: 0,
      isAnswer: 0,
    });
    return res
      .status(200)
      .json({
        message: "comment article created successfully",
        commentArticle,
      });
  } catch (error) {
    return next(error);
  }
};
exports.getAllArticle = async (req, res, next) => {
  try {
    // گرفتن تمام کامنت‌ها
    const commentArticles = await commentArticleModel
      .find({})
      .populate("article", "title")
      .populate("creator", "-password")
      .lean();

    // ایجاد یک آرایه برای ذخیره کامنت‌های اصلی به همراه پاسخ‌ها
    let allComments = [];

    // فیلتر کردن و دسته‌بندی کامنت‌ها
    commentArticles.forEach((comment) => {
      // اگر کامنت اصلی است (یعنی mainCommentID ندارد)
      if (!comment.mainCommentID) {
        // پیدا کردن پاسخ‌ها برای این کامنت
        const answers = commentArticles.filter(
          (answerComment) =>
            String(answerComment.mainCommentID) === String(comment._id)
        );

        // اضافه کردن پاسخ‌ها به کامنت اصلی
        allComments.push({
          ...comment,
          answers: answers.map((answer) => ({
            ...answer,
            article: answer.article.title,
            creator: answer.creator.name,
          })),
        });
      }
    });

    // بازگشت تمام کامنت‌ها و پاسخ‌ها به همراه هم
    return res.status(200).json(allComments);
  } catch (error) {
    return next(error);
  }
};

exports.removeArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({ message: "Invalid Comment Article ID" });
    }

    const deleteCommentArticle = await commentArticleModel.findOneAndDelete({
      _id: id,
    });
    if (!deleteCommentArticle) {
      return res.status(404).json({ message: "Comment Article not found" });
    }
    return res
      .status(200)
      .json({ message: "Delete Comment Article Successfully !!" });
  } catch (error) {
    return next(error);
  }
};

exports.acceptArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(401).json({ message: "ID is not valid !" });
    }
    const acceptedCommentArticle = await commentArticleModel.findByIdAndUpdate(
      id,
      {
        isAccept: 1,
      },
      { new: true }
    );

    if (!acceptedCommentArticle) {
      return res.status(404).json({ message: "Comment Article not found" });
    }
    return res
      .status(201)
      .json({
        acceptedCommentArticle,
        message: "Comment Article Accepted Successfully!",
      });
  } catch (error) {
    return next(error);
  }
};
exports.rejectArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(401).json({ message: "ID is not valid !" });
    }
    const rejectedCommentArticle = await commentArticleModel.findByIdAndUpdate(
      id,
      {
        isAccept: 0,
      },
      { new: true }
    );

    if (!rejectedCommentArticle) {
      return res.status(404).json({ message: "Comment Article not found" });
    }
    return res
      .status(201)
      .json({
        rejectedCommentArticle,
        message: "Comment Article Rejected Successfully!",
      });
  } catch (error) {
    return next(error);
  }
};
exports.answerArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ message: "ID is not valid !" });
    }

    const acceptedCommentArticle = await commentArticleModel.findByIdAndUpdate(
      id,
      {
        isAccept: 1,
      },
      { new: true }
    );
    if (!acceptedCommentArticle) {
      return res.status(404).json({ message: "Comment Article not found" });
    }
    const answerCommentArticle = await commentArticleModel.create({
      body,
      article: acceptedCommentArticle.article,
      creator: req.user._id,
      isAccept: 1,
      isAnswer: 1,
      mainCommentID: id,
    });
    return res.status(201).json(answerCommentArticle);
  } catch (error) {
    return next(error);
  }
};
