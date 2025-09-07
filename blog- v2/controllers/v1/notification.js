const notificationModel = require("./../../models/notification");
const userModel = require("./../../models/user");
const { isValidObjectId } = require("mongoose");

exports.create = async (req, res, next) => {
  try {
    const { message, admin } = req.body;
    if (!isValidObjectId(admin)) {
      return res.status(409).json({
        message: "Admin ID is not valid",
      });
    }
    const isAdminExist = await userModel
      .findOne({
        $and: [{ _id: admin }, { role: "ADMIN" }],
      })
      .lean();
    if (!isAdminExist) {
      return res.status(409).json({
        message: "Admin not found",
      });
    }
    const notification = await notificationModel.create({
      message,
      admin,
    });
    return res.status(200).json(notification);
  } catch (error) {
    return next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const notifications = await notificationModel
      .find({})
      .populate("admin", "name username email")
      .lean();
    return res.status(200).json(notifications);
  } catch (error) {
    return next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { adminID } = req.params;
    if (!isValidObjectId(adminID)) {
      return res.status(409).json({
        message: "Admin ID is not valid",
      });
    }
    const isAdminExist = await userModel
      .findOne({
        $and: [{ _id: adminID }, { role: "ADMIN" }],
      })
      .lean();
    if (!isAdminExist) {
      return res.status(409).json({
        message: "Admin not found",
      });
    }
    const notification = await notificationModel
      .find({ admin: adminID })
      .populate("admin", "name username email")
      .lean();
    return res.status(200).json(notification);
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { notificationID } = req.params;
    if (!isValidObjectId(notificationID)) {
      return res.status(409).json({
        message: "NotificationID ID is not valid",
      });
    }
    const deleteNotification = await notificationModel.findByIdAndDelete(
      notificationID
    );

    if (!deleteNotification) {
      return res.status(404).json({ message: "Notification ID not found" });
    }

    return res
      .status(200)
      .json({ message: "Notification Remove Successfully :)" });
  } catch (error) {
    return next(error);
  }
};
exports.seen = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "NotificationID ID is not valid",
      });
    }
    const notification = await notificationModel.findByIdAndUpdate(
      id,
      { seen: 1 },
      { new: true }
    );
    if (!notification) {
      return res.status(409).json({
        message: "NotificationID ID not found",
      });
    }
    return res.status(201).json({
      message: "Notifications were seen",
      notification,
    });
  } catch (error) {
    return next(error);
  }
};
