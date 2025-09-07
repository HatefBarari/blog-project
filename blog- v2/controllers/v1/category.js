const categoryModel = require("./../../models/category");
const categoryValidator = require("./../../validators/category");
const { isValidObjectId } = require("mongoose");

exports.create = async (req, res) => {
  try {
    const validationResult = categoryValidator(req.body);
    if (validationResult !== true) {
      return res.status(422).json(validationResult);
    }

    const { title, href, parent } = req.body;

    if (parent) {
      if (!isValidObjectId(parent)) {
        return res.status(422).json({ message: "Invalid parent category ID" });
      }

      const parentCategory = await categoryModel.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({ message: "Parent category not found" });
      }
    }

    const category = await categoryModel.create({
      title,
      href: href.toLowerCase(),
      parent,
    });
    return res.status(201).json(category);
  } catch (error) {
    return next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    // دریافت تمام دسته‌بندی‌ها و والدین آن‌ها در یک درخواست
    const categories = await categoryModel.find({}).lean();

    const result = [];

    // دسته‌بندی‌ها را براساس والدین گروه‌بندی می‌کنیم
    const categoriesByParent = categories.reduce((acc, category) => {
      const parentId = category.parent ? category.parent.toString() : "root";
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(category);
      return acc;
    }, {});

    // پیدا کردن دسته‌بندی‌های اصلی (یعنی بدون parent یا parent برابر با null)
    const mainCategories = categoriesByParent["root"] || [];

    // اضافه کردن زیردسته‌ها به دسته‌بندی‌های اصلی
    for (const mainCategory of mainCategories) {
      const subcategories =
        categoriesByParent[mainCategory._id.toString()] || [];
      result.push({ ...mainCategory, subcategories });
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { href } = req.params;

    const category = await categoryModel
      .findOne({ href: href.toLowerCase() })
      .populate("parent")
      .lean();

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // اگر دسته‌بندی والد ندارد، زیردسته‌ها را پیدا کن
    let subcategories = [];
    if (!category.parent) {
      subcategories = await categoryModel.find({ parent: category._id }).lean();
    }
    category.subcategories = subcategories;
    return res.status(200).json(category);
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({ message: "Invalid category ID" });
    }

    const category = await categoryModel.findById({ _id: id });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.parent === null) {
      await categoryModel.deleteMany({ parent: id });
    }

    await categoryModel.findByIdAndDelete({ _id: id });

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({ message: "Invalid category ID" });
    }

    const { title, href, parent } = req.body;
    const findCategory = await categoryModel.findById(id).lean();
    if (parent) {
      if (!isValidObjectId(parent)) {
        return res.status(422).json({ message: "Invalid parent category ID" });
      }

      const parentCategory = await categoryModel.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({ message: "Parent category not found" });
      }
    }

    const category = await categoryModel
      .findByIdAndUpdate(
        { _id: id },
        {
          title: title ? title : findCategory.title,
          href: href ? href.toLowerCase() : findCategory.href,
          parent: parent ? parent : findCategory.parent,
        },
        { new: true }
      )
      .populate("parent")
      .lean();

    if (!category) {
      return res.status(401).json({ message: "Category not found" });
    }

    return res.status(201).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    return next(error);
  }
};
