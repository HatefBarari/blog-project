// const path = require("path");
// const multer = require("multer");
// const crypto = require("crypto");
// const fs = require("fs");
// const pathCovers = require("./path-covers");
// const pathVideos = require("./path-videos");
// const pathArticleImages = require("./path-article-images");
// const pathArticleCovers = require("./path-article-covers");
// // مسیرهای ذخیره‌سازی برای فایل‌های مختلف
// const videoDestination = pathVideos;
// const coverDestination = pathCovers;
// const articleImageDestination = pathArticleImages;
// const articleCoverDestination = pathArticleCovers;
// // const coverDestination = path.join(
// //   __dirname,
// //   "..",
// //   "public",
// //   "courses",
// //   "covers"
// // );

// // ساختن پوشه در صورت عدم وجود
// if (!fs.existsSync(videoDestination)) {
//   fs.mkdirSync(videoDestination, { recursive: true });
// }
// if (!fs.existsSync(coverDestination)) {
//   fs.mkdirSync(coverDestination, { recursive: true });
// }
// if (!fs.existsSync(articleImageDestination)) {
//   fs.mkdirSync(articleImageDestination, { recursive: true });
// }
// if (!fs.existsSync(articleCoverDestination)) {
//   fs.mkdirSync(articleCoverDestination, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // بررسی نوع فایل و انتخاب مسیر ذخیره‌سازی
//     const ext = path.extname(file.originalname).toLowerCase();
//     if ([".mp4", ".mkv", ".avi", ".mov"].includes(ext)) {
//       cb(null, videoDestination); // ذخیره در پوشه ویدیو
//     } else if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
//       cb(null, coverDestination); // ذخیره در پوشه تصاویر
//     } else if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
//       cb(null, articleImageDestination); // ذخیره در پوشه تصاویر
//     } else if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
//       cb(null, articleCoverDestination); // ذخیره در پوشه تصاویر
//     } else {
//       cb(new Error("Invalid file type"), null); // نوع فایل پشتیبانی نمی‌شود
//     }
//   },
//   filename: (req, file, cb) => {
//     const hashedFileName = crypto
//       .createHash("SHA256")
//       .update(file.originalname)
//       .digest("hex");
//     const ext = path.extname(file.originalname);
//     cb(null, hashedFileName + ext);
//   },
// });

// const maxSizeImage = 10 * 1024 * 1024;
// const maxSizeVideo = 300 * 1024 * 1024;

// // فیلتر کردن فایل‌ها بر اساس نوع و محدودیت حجم
// const fileFilter = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase();
//   const fileSize = req.headers["content-length"]; // دریافت حجم فایل

//   if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
//     if (fileSize <= maxSizeImage) {
//       // حداکثر 10 مگابایت برای عکس
//       cb(null, true); // فایل معتبر است
//     } else {
//       cb(new Error("Image file size exceeds the 10MB limit"), false);
//     }
//   } else if ([".mp4", ".mkv", ".avi", ".mov"].includes(ext)) {
//     if (fileSize <= maxSizeVideo) {
//       // حداکثر 300 مگابایت برای ویدیو
//       cb(null, true); // فایل معتبر است
//     } else {
//       cb(new Error("Video file size exceeds the 300MB limit"), false);
//     }
//   } else {
//     cb(new Error("Invalid file type"), false); // نوع فایل پشتیبانی نمی‌شود
//   }
// };

// // ایجاد و تنظیم Multer با محدودیت‌های اندازه برای هر نوع فایل
// module.exports = { multerStorage: storage };

const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
// مسیرهای ذخیره‌سازی فایل‌ها
const pathCourseCovers = require("./path-course-covers"); // مسیر ویدیوهای دوره
const pathSessionVideos = require("./path-session-videos"); // مسیر کاورهای جلسه

// ساختن پوشه در صورت عدم وجود
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ساخت پوشه‌های موردنیاز
ensureDirectoryExists(pathCourseCovers);
ensureDirectoryExists(pathSessionVideos);

// ساختن storage برای multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // فقط فایل‌های مجاز هستند
    if ([".mp4", ".mkv", ".avi"].includes(ext)) {
      if (file.fieldname === "video") {
        cb(null, pathSessionVideos); // مسیر ذخیره‌سازی ویدیوهای دوره
      } else {
        cb(new Error("Invalid file field for video"), null);
      }
    } else if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
      if (file.fieldname === "cover") {
        cb(null, pathCourseCovers); // مسیر ذخیره‌سازی کاورهای جلسه
      } else {
        cb(new Error("Invalid file field for cover"), null);
      }
    } else {
      cb(
        new Error("Invalid file type, only videos or images are allowed"),
        null
      );
    }
  },
  filename: (req, file, cb) => {
    // ایجاد نام فایل با هش کردن نام اصلی
    const hashedFileName = crypto
      .createHash("SHA256")
      .update(file.originalname)
      .digest("hex");
    const ext = path.extname(file.originalname);
    cb(null, hashedFileName + ext);
  },
});

// محدودیت‌ها برای بارگذاری ویدیوها و کاورها
const videoUpload = multer({
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // محدودیت حجم فایل ویدیو: 300 مگابایت
}).fields([{ name: "video", maxCount: 1 }]); // فقط یک ویدیو

const coverUpload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // محدودیت حجم فایل کاور: 1 مگابایت
}).fields([{ name: "cover", maxCount: 1 }]); // فقط یک کاور

// صادر کردن تنظیمات upload
module.exports = { videoUpload, coverUpload };
