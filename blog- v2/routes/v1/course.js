const express = require("express");
const coursesController = require("./../../controllers/v1/course");
const authMiddleware = require("./../../middlewares/auth");
const isAdminMiddleware = require("./../../middlewares/isAdmin");
const multer = require("multer");
// const { multerStorage } = require("./../../utils/uploader");
const { videoUpload, coverUpload } = require("./../../utils/uploader-course");
const path = require("path");

const router = express.Router();

// آپلود کاور
// const uploadCover = multer({
//   storage: multerStorage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only images are allowed"), false);
//     }
//   },
//   limits: { fileSize: 10 * 1024 * 1024 }, // حداکثر 10 مگابایت برای تصاویر
// }).single("cover");

// // آپلود ویدیو
// const uploadVideo = multer({
//   storage: multerStorage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if ([".mp4", ".mkv", ".avi", ".mov"].includes(ext)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only videos are allowed"), false);
//     }
//   },
//   limits: { fileSize: 300 * 1024 * 1024 }, // حداکثر 300 مگابایت برای ویدیو
// }).single("video");

// Course

// ایجاد دوره با آپلود کاور (تصویر)
router
  .route("/")
  .post(
    coverUpload, // استفاده از آپلودر کاور
    authMiddleware,
    isAdminMiddleware,
    coursesController.createCourse
  )
  .get(coursesController.getAllCourses);
router.route("/popular").get(coursesController.popular);
router.route("/presell").get(coursesController.presell);
router.route("/complete").get(coursesController.complete);
router.route("/category/:href").get(coursesController.getCoursesByCategory);
router.route("/related/:href").get(coursesController.getRelated);
router
  .route("/:id/register")
  .post(authMiddleware, coursesController.registerCourse);

router.route("/:href").get(authMiddleware, coursesController.getCourseInfo);
router
  .route("/:id")
  .get(coursesController.getCourseInfo)
  .delete(authMiddleware, isAdminMiddleware, coursesController.removeCourse)
  .put(
    coverUpload,
    authMiddleware,
    isAdminMiddleware,
    coursesController.updateCourse
  );

// Session

// ایجاد جلسه با آپلود ویدیو
router.route("/:id/sessions").post(
  videoUpload, // استفاده از آپلودر ویدیو
  authMiddleware,
  isAdminMiddleware,
  coursesController.createSession
);

router.route("/:href/sessions").get(coursesController.getAllSessions);

router
  .route("/session/:id")
  .delete(authMiddleware, isAdminMiddleware, coursesController.removeSession)
  .put(
    videoUpload,
    authMiddleware,
    isAdminMiddleware,
    coursesController.updateSession
  );

router.route("/:href/:sessionID").get(coursesController.getSessionInfo);
module.exports = router;
