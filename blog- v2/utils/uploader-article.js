const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
// مسیرهای ذخیره‌سازی فایل‌ها
const pathArticleImages = require("./path-article-images");
const pathArticleCovers = require("./path-article-covers");

// ساختن پوشه در صورت عدم وجود
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ساخت پوشه‌های موردنیاز
ensureDirectoryExists(pathArticleImages);
ensureDirectoryExists(pathArticleCovers);

// ساختن storage برای multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // فقط فایل‌های تصویری مجاز هستند
    if ([".png", ".jpeg", ".jpg", ".webp"].includes(ext)) {
      if (file.fieldname === "cover") {
        cb(null, pathArticleCovers); // مسیر ذخیره‌سازی کاور مقاله
      } else if (file.fieldname === "images") {
        cb(null, pathArticleImages); // مسیر ذخیره‌سازی تصاویر مقاله
      } else {
        cb(new Error("Invalid file field"), null);
      }
    } else {
      cb(new Error("Invalid file type, only images are allowed"), null);
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

// مقداردهی multer فقط برای کاور و تصاویر مقاله
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // محدودیت حجم فایل: 10 مگابایت
});

module.exports = upload;
