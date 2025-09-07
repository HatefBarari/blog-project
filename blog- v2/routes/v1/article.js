const express = require("express");
const articleController = require("../../controllers/v1/article");
const authMiddleware = require("../../middlewares/auth");
const isAdminMiddleware = require("../../middlewares/isAdmin");
const multer = require("multer");
const upload = require("../../utils/uploader-article");

const router = express.Router();

// آپلود کاور
// const uploadFiles = multer({
//   storage: multerStorage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
//       cb(null, true); // فایل تصویر معتبر است
//     } else {
//       cb(new Error("Only images are allowed"), false);
//     }
//   },
//   limits: { fileSize: 10 * 1024 * 1024 }, // محدودیت 10 مگابایت برای تصاویر
// }).fields([
//   { name: "cover", maxCount: 1 }, // کاور (یک فایل)
//   { name: "images", maxCount: 3 }, // تصاویر (حداکثر 3 فایل)
// ]);

// ایجاد دوره با آپلود کاور (تصویر)
router
  .route("/")
  .post(
    upload.fields([
      // آپلود کاور و تصاویر مقاله
      { name: "cover", maxCount: 1 }, // کاور مقاله (یک فایل)
      { name: "images", maxCount: 3 }, // تصاویر مقاله (حداکثر ۳ فایل)
    ]), // استفاده از آپلودر کاور
    authMiddleware,
    isAdminMiddleware,
    articleController.create
  )
  .get(articleController.getAll);

router.route("/category/:href").get(articleController.getArticlesByCategory);
router.route("/related/:href").get(articleController.getRelated);
router.route("/:href").get(articleController.getArticleInfo);
router.route("/draft").post(
  upload.fields([
    // آپلود کاور و تصاویر مقاله
    { name: "cover", maxCount: 1 }, // کاور مقاله (یک فایل)
    { name: "images", maxCount: 3 }, // تصاویر مقاله (حداکثر ۳ فایل)
  ]),
  authMiddleware,
  isAdminMiddleware,
  articleController.saveDraft
);
router
  .route("/:id")
  .delete(authMiddleware, isAdminMiddleware, articleController.remove)
  .put(
    upload.fields([
      // آپلود کاور و تصاویر مقاله
      { name: "cover", maxCount: 1 }, // کاور مقاله (یک فایل)
      { name: "images", maxCount: 3 }, // تصاویر مقاله (حداکثر ۳ فایل)
    ]),
    authMiddleware,
    isAdminMiddleware,
    articleController.update
  );

router
  .route("/:href/publish")
  .put(authMiddleware, isAdminMiddleware, articleController.publish);

module.exports = router;
