const contactModel = require("./../../models/contact");
const nodemailer = require("nodemailer");
const { isValidObjectId } = require("mongoose");

exports.getAll = async (req, res, next) => {
  try {
    const contacts = await contactModel.find({}).lean();
    return res.status(200).json(contacts);
  } catch (error) {
    return next(error);
  }
};
exports.create = async (req, res, next) => {
  try {
    const { fullName, email, phone, body } = req.body;
    const contact = await contactModel.create({
      fullName,
      email,
      phone,
      body,
      answer: 0,
    });
    return res.status(200).json(contact);
  } catch (error) {
    return next(error);
  }
};
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ message: "Contact ID is not valid!" });
    }
    const deleteContact = await contactModel.findByIdAndDelete(id);
    if (!deleteContact) {
      return res.status(401).json({ message: "Contact not found" });
    }
    return res.status(200).json({ message: "Contact Remove Successfully" });
  } catch (error) {
    return next(error);
  }
};
exports.answer = async (req, res, next) => {
  try {
    const { email, answer } = req.body;
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "پاسخ پیغام شما از طرف آکادمی میث لرن",
      text: answer,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        return res.status(401).json({ message: error });
      } else {
        const contact = await contactModel
          .findOneAndUpdate({ email }, { answer: 1 })
          .lean();
        if (!contact) {
          return res.status(401).json({ message: "Contact not found" });
        }
        return res.status(200).json({ message: "Email send successfully :)" });
      }
    });
  } catch (error) {
    return next(error);
  }
};
