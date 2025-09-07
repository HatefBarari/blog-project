const userModel = require("./../../models/user");
const banUserModel = require("./../../models/ban-phone");
const registerValidator = require("./../../validators/register");
const bcrypt = require("bcrypt");
const { isValidObjectId } = require("mongoose");

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "User ID is not valid",
      });
    }
    const mainUser = await userModel.findById({ _id: id }).lean();

    const banUserResult = await banUserModel.create({ phone: mainUser.phone });

    if (banUserResult) {
      return res.status(200).json({
        message: "User banned successfully",
      });
    }
    return res.status(500).json({
      message: "Server Error!!!",
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAll = async (req, res) => {
  try {
    const users = await userModel.find({}).lean();
    const usersWithoutPassword = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    return res.status(200).json(usersWithoutPassword);
  } catch (error) {
    return next(error);
  }
};

exports.removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "User ID is not valid",
      });
    }
    const removedUser = await userModel.findByIdAndRemove({ _id: id });
    if (!removedUser) {
      return res.status(404).json({
        message: "There is no user !!",
      });
    }
    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

exports.changeRole = async (req, res) => {
  try {
    const { id } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "User ID is not valid",
      });
    }
    const user = await userModel.findOne({ _id: id });
    let newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const updatedUser = await userModel.findByIdAndUpdate(
      { _id: id },
      {
        role: newRole,
      }
    );

    if (updatedUser) {
      res.status(200).json({
        message: `The user's role was successfully changed! The user's role has been updated to << ${newRole} >>`,
      });
    }
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;
    const findUser = await userModel.findById(req.user._id).lean();
    if (!findUser) {
      return res.status(401).json({
        message: "User Not Found !!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userModel
      .findByIdAndUpdate(
        { _id: req.user._id },
        {
          name: name ? name : findUser.name,
          username: username ? username : findUser.username,
          email: email ? email : findUser.email,
          password: password ? hashedPassword : findUser.password,
          phone: phone ? phone : findUser.phone,
        },
        { new: true }
      )
      .select("-password")
      .lean();
    if (!user) {
      return res.status(201).json({ message: "User update failed !!" });
    }
    return res.status(201).json({
      message: "User updated Info successfully",
      user,
    });
  } catch (error) {
    return next(error);
  }
};
