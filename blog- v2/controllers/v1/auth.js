const userModel = require("./../../models/user");
const banUserModel = require("./../../models/ban-phone");
const registerValidator = require("./../../validators/register");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const validationResult = registerValidator(req.body);
    if (validationResult !== true) {
      return res.status(422).json(validationResult);
    }
    const { name, username, email, phone, password } = req.body;
    const isUserExist = await userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (isUserExist) {
      return res.status(409).json({
        message: "username or email is duplicated",
      });
    }

    const isUserBan = await banUserModel.find({ phone });
    if (isUserBan.length) {
      return res.status(409).json({
        message: "This Phone Number Ban !!!",
      });
    }
    const countOfUsers = await userModel.count();

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      username,
      email,
      phone,
      password: hashedPassword,
      role: countOfUsers > 0 ? "USER" : "ADMIN",
    });

    const userObject = user.toObject();
    Reflect.deleteProperty(userObject, "password");

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30 day",
    });
    return res.status(201).json({ user: userObject, accessToken });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const user = await userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
    if (!user) {
      return res
        .status(401)
        .json({ message: "There is no user with that email or username" });
    }
    const isUserBan = await banUserModel.find({ phone: user.phone });
    if (isUserBan.length) {
      return res.status(409).json({
        message: "This User is Ban!! ,you are not allowed to login!!!",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password is not valid !!" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30 day",
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    return next(error);
  }
};
exports.getMe = async (req, res) => {};
