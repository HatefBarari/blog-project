const express = require("express");
const commentController = require("./../../controllers/v1/comment");
const authMiddleware = require("./../../middlewares/auth");
const isAdminMiddleware = require("./../../middlewares/isAdmin");

const router = express.Router();

//!!! Course

router
  .route("/")
  .post(authMiddleware, commentController.create)
  .get(authMiddleware, isAdminMiddleware, commentController.getAll);

router
  .route("/:id")
  .delete(authMiddleware, isAdminMiddleware, commentController.remove);

router
  .route("/:id/accept")
  .put(authMiddleware, isAdminMiddleware, commentController.accept);
router
  .route("/:id/reject")
  .put(authMiddleware, isAdminMiddleware, commentController.reject);
router
  .route("/:id/answer")
  .post(authMiddleware, isAdminMiddleware, commentController.answer);

//!!! Article

router
  .route("/article")
  .post(authMiddleware, commentController.createArticle)
  .get(authMiddleware, isAdminMiddleware, commentController.getAllArticle);

router
  .route("/article/:id")
  .delete(authMiddleware, isAdminMiddleware, commentController.removeArticle);

router
  .route("/article/:id/accept")
  .put(authMiddleware, isAdminMiddleware, commentController.acceptArticle);
router
  .route("/article/:id/reject")
  .put(authMiddleware, isAdminMiddleware, commentController.rejectArticle);
router
  .route("/article/:id/answer")
  .post(authMiddleware, isAdminMiddleware, commentController.answerArticle);

module.exports = router;
