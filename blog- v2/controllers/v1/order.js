const courseUserModel = require("./../../models/course-user");
const { isValidObjectId } = require("mongoose");
exports.getAll = async (req, res, next) => {
  try {
    const orders = await courseUserModel
      .find({ user: req.user._id }, "-user")
      .populate("course", "name href")
      .lean();
    return res.status(200).json(orders);
  } catch (error) {
    return next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Course User ID is not valid",
      });
    }
    const order = await courseUserModel
      .findById(id, "-user")
      .populate("course", "name href")
      .lean();
    if (!order) {
      return res.status(404).json({
        message: "Course User not found",
      });
    }
    return res.status(200).json(order);
  } catch (error) {
    return next(error);
  }
};
