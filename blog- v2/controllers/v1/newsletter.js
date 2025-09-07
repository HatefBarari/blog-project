const newsletterModel = require("./../../models/newsletter");

exports.getAll = async (req, res, next) => {
  try {
    const newsletters = await newsletterModel.find({}).lean();
    return res.status(200).json(newsletters);
  } catch (error) {
    return next(error);
  }
};
exports.create = async (req, res, next) => {
  try {
    const { email } = req.body;
    const newEmail = await newsletterModel.create({ email });
    return res
      .status(200)
      .json({ message: "email add to newsletter successfully :)", newEmail });
  } catch (error) {
    return next(error);
  }
};
