const articleModel = require("../../models/article");
const categoryModel = require("../../models/category");
const commentArticleModel = require("../../models/comment-article");
const userModel = require("../../models/user");
const validator = require("./../../validators/article");
const fs = require("fs");
const { isValidObjectId } = require("mongoose");
const path = require("path");
const pathArticleCovers = require("../../utils/path-article-covers");
const pathArticleImages = require("../../utils/path-article-images");
const { deleteFiles } = require("./../../utils/remove-article-image&cover");

exports.create = async (req, res, next) => {
  try {
    const validationResult = validator(req.body);
    const files = req.files;

    // console.log(files);
    if (validationResult !== true) {
      deleteFiles(files, pathArticleCovers, pathArticleImages);
      return res.status(422).json(validationResult);
    }

    const { title, description, body, href, categoryID } = req.body;

    const isArticleExist = await articleModel.findOne({
      $or: [{ title }, { href }],
    });

    if (isArticleExist) {
      if (req.files) {
        deleteFiles(files, pathArticleCovers, pathArticleImages);
      }
      return res.status(409).json({
        message: "Article title or href is duplicated",
      });
    }
    // ابتدا سند دوره را می‌سازیم
    const article = await articleModel.create({
      title,
      description,
      body,
      href: href.toLowerCase(),
      categoryID,
      creator: req.user._id,
      cover:
        req.files.cover && req.files.cover.length > 0
          ? req.files.cover[0].filename
          : null, // کاور
      images:
        req.files.images && req.files.images.length > 0
          ? req.files.images.map((image) => image.filename)
          : [], // آرایه تصاویر
      publish: 1,
    });
    if (!article) {
      // در صورت عدم موفقیت در ایجاد دوره، فایل آپلود شده را حذف می‌کنیم
      if (req.files) {
        deleteFiles(files, pathArticleCovers, pathArticleImages);
      }
      return res.status(500).json({
        message: "Server Error!!!",
      });
    }

    const mainArticle = await articleModel
      .findById(article._id)
      .populate("creator", "name username email")
      .populate("categoryID")
      .lean();

    if (mainArticle) {
      return res.status(200).json(mainArticle);
    }

    return res.status(500).json({
      message: "Server Error!!!",
    });
  } catch (error) {
    return next(error);
  }
};

exports.getArticlesByCategory = async (req, res, next) => {
  try {
    const { href } = req.params;
    const category = await categoryModel
      .findOne({ href: href.toLowerCase() })
      .lean();

    if (category) {
      const childCategories = await categoryModel
        .find({ parent: category._id })
        .lean();

      // استخراج آیدی دسته‌های فرزند
      const categoryIds = [
        category._id,
        ...childCategories.map((cat) => cat._id),
      ];

      // جستجوی دوره‌ها براساس دسته‌های پیدا شده
      const article = await articleModel
        .find({ categoryID: { $in: categoryIds } })
        .populate("categoryID")
        .populate("creator", "name username email")
        .lean();
      if (article.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }
      return res.status(200).json(article);
    }
    return res.status(404).json({ message: "Category not found" });
  } catch (error) {
    return next(error);
  }
};
exports.getRelated = async (req, res, next) => {
  try {
    const { href } = req.params;

    // پیدا کردن دوره‌ی فعلی براساس href
    const article = await articleModel.findOne({ href: href.toLowerCase() });
    if (!article) {
      return res.status(404).json({ message: "Article not Found !!" });
    }

    // پیدا کردن دسته‌بندی مربوط به دوره
    const category = await categoryModel.findById(article.categoryID).lean();
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // پیدا کردن والد دسته‌بندی (اگر دارد)
    const parentCategoryID = category.parent ? category.parent : category._id;

    // پیدا کردن تمام زیردسته‌های مرتبط با دسته‌بندی والد
    const relatedCategories = await categoryModel
      .find({
        $or: [{ _id: parentCategoryID }, { parent: parentCategoryID }],
      })
      .lean();

    // استخراج آیدی تمام دسته‌بندی‌ها (والد و زیردسته‌ها)
    const relatedCategoryIds = relatedCategories.map((cat) => cat._id);

    // پیدا کردن دوره‌های مرتبط براساس آیدی دسته‌بندی‌های پیدا شده
    let relatedCourses = await articleModel
      .find({
        categoryID: { $in: relatedCategoryIds },
      })
      .lean();

    if (relatedCourses.length === 0) {
      return res.status(404).json({ message: "No related courses found !!" });
    }

    relatedCourses = relatedCourses.filter(
      (article) => article.href !== href.toLowerCase()
    );

    return res.status(200).json(relatedCourses);
  } catch (error) {
    return next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const articles = await articleModel
      .find({})
      .populate("categoryID")
      .populate("creator", "name username")
      .lean();

    return res.status(200).json(articles);
  } catch (error) {
    return next(error);
  }
};

exports.getArticleInfo = async (req, res, next) => {
  try {
    const { href } = req.params;

    const article = await articleModel
      .findOne({ href: href.toLowerCase() })
      .populate("categoryID")
      .populate("creator", "name username")
      .lean();
    if (!article) {
      return res.status(401).json({
        message: "There is not course !!",
      });
    }
    const comments = await commentArticleModel
      .find({ article: article._id, isAccept: 1 })
      .lean();
    // جمع‌آوری کامنت‌های اصلی و پاسخ‌ها
    let allComments = [];
    comments.forEach((comment) => {
      // چک می‌کنیم که کامنت اصلی است (کامنتی که mainCommentID ندارد)
      if (!comment.mainCommentID) {
        // پیدا کردن پاسخ‌های این کامنت
        const answers = comments.filter(
          (answerComment) =>
            String(answerComment.mainCommentID) === String(comment._id)
        );

        // اضافه کردن پاسخ‌ها به کامنت اصلی
        allComments.push({
          ...comment,
          article: comment.article.title,
          creator: comment.creator.name,
          answers: answers.map((answer) => ({
            ...answer,
            article: comment.article.title,
            creator: answer.creator.name,
          })),
        });
      }
    });
    return res.status(200).json({
      article,
      comments: allComments,
    });
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(422).json({
        message: "Article ID is not valid",
      });
    }

    const article = await articleModel.findById(id).lean();
    if (!article) {
      return res.status(401).json({
        message: "There is not Article !!",
      });
    }

    if (article.cover) {
      const filePathCover = path.join(pathArticleCovers, article.cover);
      if (fs.existsSync(filePathCover)) {
        fs.unlinkSync(filePathCover);
      }
    }

    // حذف تصاویر در صورت وجود
    if (article.images && article.images.length > 0) {
      article.images.forEach((image) => {
        const filePathImages = path.join(pathArticleImages, image);
        if (fs.existsSync(filePathImages)) {
          fs.unlinkSync(filePathImages);
        }
      });
    }

    const articleDelete = await articleModel.findByIdAndDelete(id);

    if (articleDelete) {
      return res.status(200).json({
        message: "Article deleted successfully",
      });
    }

    return res.status(500).json({
      message: "Server Error!!!",
    });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files || {};
    const coverFile = files.cover?.[0]; // فایل کاور (یک فایل)
    const imageFiles = files.images || []; // فایل‌های تصاویر (ممکن است چندین فایل باشد)

    if (!isValidObjectId(id)) {
      deleteFiles(files, pathArticleCovers, pathArticleImages);
      return res.status(422).json({ message: "Article ID is not valid" });
    }

    const article = await articleModel.findById(id).lean();
    if (!article) {
      deleteFiles(files, pathArticleCovers, pathArticleImages);
      return res.status(401).json({ message: "There is no article!!" });
    }

    const { title, description, body, href, categoryID, creator, publish } =
      req.body;

    // Validate categoryID
    if (categoryID && !isValidObjectId(categoryID)) {
      deleteFiles(files, pathArticleCovers, pathArticleImages);
      return res.status(422).json({ message: "Invalid category ID" });
    }

    // Validate creator ID
    if (creator && !isValidObjectId(creator)) {
      deleteFiles(files, pathArticleCovers, pathArticleImages);
      return res.status(422).json({ message: "Invalid creator ID" });
    }

    // آماده‌سازی داده‌ها برای آپدیت
    const updateData = {
      title: title ? title : article.title,
      description: description ? description : article.description,
      body: body ? body : article.body,
      href: href ? href : article.href,
      categoryID: categoryID ? categoryID : article.categoryID,
      creator: creator ? creator : article.creator,
      publish: publish ? publish : article.publish,
    };

    // اگر کاور جدید ارسال شده باشد
    if (coverFile) {
      updateData.cover = coverFile.filename; // اضافه کردن کاور جدید به داده‌های آپدیت

      // حذف کاور قبلی
      if (article.cover) {
        const oldCoverPath = path.join(pathArticleCovers, article.cover);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath); // حذف کاور قبلی
        }
      }
    }

    // اگر تصاویر جدید ارسال شده باشند
    if (imageFiles.length > 0) {
      updateData.images = imageFiles.map((file) => file.filename); // اضافه کردن لیست تصاویر جدید

      // حذف تصاویر قبلی
      if (article.images && article.images.length > 0) {
        article.images.forEach((image) => {
          const oldImagePath = path.join(pathArticleImages, image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath); // حذف تصاویر قبلی
          }
        });
      }
    }

    // آپدیت مقاله
    const updatedArticle = await articleModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedArticle) {
      deleteFiles(files, pathArticleCovers, pathArticleImages); // حذف فایل‌های جدید در صورت بروز خطا
      return res.status(500).json({ message: "Article update failed !!" });
    }

    return res.status(200).json({
      message: "Article Updated Successfully !!",
      updatedArticle,
    });
  } catch (error) {
    // حذف فایل‌های جدید در صورت بروز خطا
    deleteFiles(files, pathArticleCovers, pathArticleImages);

    return next(error);
  }
};

exports.saveDraft = async (req, res, next) => {
  const files = req.files; // دریافت فایل‌ها از درخواست
  const coverFile = files?.cover?.[0]; // فایل کاور (یک فایل)
  const imageFiles = files?.images || []; // فایل‌های تصاویر (ممکن است چندین فایل باشد)

  try {
    // آماده‌سازی داده‌ها برای ذخیره مقاله جدید به‌صورت پیش‌نویس
    const articleData = {
      title: req.body.title || "", // عنوان مقاله
      description: req.body.description || "", // توضیحات مقاله
      body: req.body.body || "", // متن مقاله
      href: req.body.href || "", // لینک مقاله
      categoryID: req.body.categoryID || "", // شناسه دسته‌بندی
      creator: req.user._id || "", // شناسه نویسنده
      publish: 0, // مقدار publish برای پیش‌نویس
      cover: coverFile ? coverFile.filename : "", // اگر کاور ارسال شده باشد
      images:
        imageFiles.length > 0 ? imageFiles.map((file) => file.filename) : [], // اگر تصاویر ارسال شده باشند
    };

    // ذخیره مقاله جدید به‌صورت پیش‌نویس
    const newArticle = await articleModel.create(articleData);

    return res.status(201).json({
      message: "Draft saved successfully!",
      newArticle,
    });
  } catch (error) {
    // در صورت بروز خطا، حذف فایل‌های جدید (کاور و تصاویر)
    deleteFiles(files, pathArticleCovers, pathArticleImages);
    return next(error);
  }
};

exports.publish = async (req, res, next) => {
  const { href } = req.params; // دریافت href از بدنه درخواست

  try {
    // پیدا کردن مقاله بر اساس href
    const article = await articleModel.findOne({ href }).lean();
    if (!article) {
      return res.status(404).json({ message: "Article not found!" });
    }

    // تغییر وضعیت publish از 0 به 1 یا از 1 به 0
    const updatedPublishStatus = article.publish === 0 ? 1 : 0;

    // به‌روزرسانی مقاله با وضعیت جدید publish
    const updatedArticle = await articleModel.findByIdAndUpdate(
      article._id,
      { publish: updatedPublishStatus },
      { new: true }
    );

    return res.status(200).json({
      message: "Publish status updated successfully!",
      updatedArticle, // ارسال مقاله به‌روز شده
    });
  } catch (error) {
    return next(error); // مدیریت خطا
  }
};
