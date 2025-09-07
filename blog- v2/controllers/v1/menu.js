const menuModel = require("./../../models/menu");
const menuValidator = require("./../../validators/menu");
const { isValidObjectId } = require("mongoose");

exports.create = async (req, res) => {
  try {
    const validationResult = menuValidator(req.body);
    if (validationResult !== true) {
      return res.status(422).json(validationResult);
    }

    const { title, href, parent } = req.body;
    const isExistMenu = await menuModel
      .findOne({ $or: [{ title }, { href: href.toLowerCase() }] })
      .lean();
    if (isExistMenu) {
      return res.status(409).json({ message: "This Menu already exists" });
    }
    if (parent) {
      if (!isValidObjectId(parent)) {
        return res.status(422).json({ message: "Invalid parent menu ID" });
      }

      const parentMenu = await menuModel.findById(parent);
      if (!parentMenu) {
        return res.status(404).json({ message: "Parent menu not found" });
      }
    }

    const menu = await menuModel.create({
      title,
      href: href.toLowerCase(),
      parent,
    });
    return res.status(201).json(menu);
  } catch (error) {
    return next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    // دریافت تمام دسته‌بندی‌ها و والدین آن‌ها در یک درخواست
    const menus = await menuModel.find({}).lean();

    menus.forEach((menu) => {
      const submenus = [];
      for (let i = 0; i < menus.length; i++) {
        const mainMenu = menus[i];
        if (mainMenu.parent?.equals(menu._id)) {
          submenus.push(menus.splice(i, 1)[0]);
          i = i - 1;
        }
      }
      menu.submenus = submenus;
    });

    return res.status(200).json(menus);
  } catch (error) {
    return next(error);
  }
};

exports.getAllInPanel = async (req, res, next) => {
  try {
    const menus = await menuModel.find({}).lean();

    menus.forEach((menu) => {
      const submenus = [];
      for (let i = 0; i < menus.length; i++) {
        const mainMenu = menus[i];
        if (mainMenu.parent?.equals(menu._id)) {
          submenus.push(menus.splice(i, 1)[0]);
          i = i - 1;
        }
      }
      menu.submenus = submenus;
    });

    return res.status(200).json(menus);
  } catch (error) {
    return next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { href } = req.params;

    const menu = await menuModel
      .findOne({ href: href.toLowerCase() })
      .populate("parent")
      .lean();

    if (!menu) {
      return res.status(404).json({ message: "menu not found" });
    }

    // اگر دسته‌بندی والد ندارد، زیردسته‌ها را پیدا کن
    let submenus = [];
    if (!menu.parent) {
      submenus = await menuModel.find({ parent: menu._id }).lean();
    }
    menu.submenus = submenus;
    return res.status(200).json(menu);
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({ message: "Invalid menu ID" });
    }

    const menu = await menuModel.findById({ _id: id });
    if (!menu) {
      return res.status(404).json({ message: "menu not found" });
    }

    if (menu.parent === null) {
      await menuModel.deleteMany({ parent: id });
    }

    await menuModel.findByIdAndDelete({ _id: id });

    return res.status(200).json({ message: "menu deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({ message: "Invalid menu ID" });
    }

    const { title, href, parent } = req.body;
    const findMenu = await menuModel.findById(id).lean();
    if (parent) {
      if (!isValidObjectId(parent)) {
        return res.status(422).json({ message: "Invalid parent menu ID" });
      }

      const parentMenu = await menuModel.findById(parent);
      if (!parentMenu) {
        return res.status(404).json({ message: "Parent menu not found" });
      }
    }

    const updateMenu = await menuModel
      .findByIdAndUpdate(
        { _id: id },
        {
          title: title ? title : findMenu.title,
          href: href ? href.toLowerCase() : findMenu.href,
          parent: parent ? parent : findMenu.parent,
        },
        { new: true }
      )
      .populate("parent")
      .lean();

    if (!updateMenu) {
      return res.status(401).json({ message: "menu not found" });
    }

    return res.status(201).json({
      message: "menu updated successfully",
      updateMenu,
    });
  } catch (error) {
    return next(error);
  }
};
