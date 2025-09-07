const { title } = require("process");
const departmentsModel = require("./../../models/department");
const departmentsSubsModel = require("./../../models/department-sub");
const ticketsModel = require("./../../models/ticket");
const { isValidObjectId } = require("mongoose");
// ticket
exports.create = async (req, res, next) => {
  try {
    const { departmentID, departmentSubID, priority, title, body, course } =
      req.body;

    if (!isValidObjectId(departmentID)) {
      return res.status(409).json({
        message: "Departments ID is not valid",
      });
    }
    const department = await departmentsModel.findById(departmentID).lean();
    if (!department) {
      return res.status(409).json({
        message: "Department not Found",
      });
    }

    if (!isValidObjectId(departmentSubID)) {
      return res.status(409).json({
        message: "Departments ID is not valid",
      });
    }
    const departmentSubs = await departmentsSubsModel
      .findOne({ _id: departmentSubID, parent: departmentID })
      .lean();
    if (!departmentSubs) {
      return res.status(404).json({
        message: "Departments Sub ID not found",
      });
    }
    const ticket = await ticketsModel.create({
      departmentID,
      departmentSubID,
      priority,
      title,
      body,
      course,
      user: req.user._id,
      answer: 0,
      isAnswer: 0,
    });
    const mainTicket = await ticketsModel
      .findById(ticket._id)
      .populate("departmentID", "title")
      .populate("departmentSubID", "title")
      .populate("user", "name")
      .populate("course", "name")
      .lean();
    return res.status(200).json(mainTicket);
  } catch (error) {
    return next(error);
  }
};
exports.getAll = async (req, res, next) => {
  try {
    const tickets = await ticketsModel
      .find({ answer: 0, isAnswer: 0 })
      .populate("departmentID", "title")
      .populate("departmentSubID", "title")
      .populate("user", "name")
      .populate("course", "name")
      .lean();
    return res.status(200).json(tickets);
  } catch (error) {
    return next(error);
  }
};
exports.userTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsModel
      .find({ user: req.user._id, isAnswer: 0 })
      .sort({ _id: -1 })
      .populate("departmentID", "title")
      .populate("departmentSubID", "title")
      .populate("user", "name")
      .populate("course", "name")
      .lean();
    if (!tickets) {
      return res.status(409).json({
        message: "Ticket not Found",
      });
    }

    return res.status(200).json(tickets);
  } catch (error) {
    return next(error);
  }
};
// department
exports.departments = async (req, res, next) => {
  try {
    const departments = await departmentsModel.find({}).lean();
    return res.status(200).json(departments);
  } catch (error) {
    return next(error);
  }
};
exports.departmentsSubs = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments ID is not valid",
      });
    }
    const departmentSubs = await departmentsSubsModel
      .find({ parent: id })
      .populate("parent", "title")
      .lean();
    if (!departmentSubs) {
      return res.status(404).json({
        message: "Departments ID not found",
      });
    }
    return res.status(200).json(departmentSubs);
  } catch (error) {
    return next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { title } = req.body;
    const isExistDepartment = await departmentsModel.findOne({ title }).lean();
    if (isExistDepartment) {
      return res
        .status(409)
        .json({ message: "This department already exists" });
    }
    const department = await departmentsModel.create({ title });
    return res.status(200).json(department);
  } catch (error) {
    return next(error);
  }
};

exports.createDepartmentSub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments ID is not valid",
      });
    }
    const isExistDepartmentSub = await departmentsSubsModel
      .findOne({ title })
      .lean();
    if (isExistDepartmentSub) {
      return res
        .status(409)
        .json({ message: "This department sub already exists" });
    }
    const isExistDepartment = await departmentsModel.findById(id).lean();
    if (!isExistDepartment) {
      return res.status(404).json({
        message: "Departments not found",
      });
    }
    const departmentSub = await departmentsSubsModel.create({
      title,
      parent: id,
    });
    return res.status(200).json(departmentSub);
  } catch (error) {
    return next(error);
  }
};

exports.getOneDepartmentSub = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments Sub ID is not valid",
      });
    }
    const departmentSub = await departmentsSubsModel.findById(id).lean();
    if (!departmentSub) {
      return res.status(409).json({
        message: "Department Sub not Found",
      });
    }
    return res.status(200).json(departmentSub);
  } catch (error) {
    return next(error);
  }
};

exports.updateDepartmentSub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, parent } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments Sub ID is not valid",
      });
    }
    const departmentSub = await departmentsSubsModel.findById(id).lean();
    if (!departmentSub) {
      return res.status(409).json({
        message: "Department Sub not Found",
      });
    }

    const updateDepartmentSub = await departmentsSubsModel.findByIdAndUpdate(
      id,
      {
        title: title ? title : departmentSub.title,
        parent: parent ? parent : departmentSub.parent,
      },
      { new: true }
    );
    return res.status(201).json(updateDepartmentSub);
  } catch (error) {
    return next(error);
  }
};

exports.removeDepartmentSub = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments Sub ID is not valid",
      });
    }

    const deleteDepartmentSub = await departmentsSubsModel.findByIdAndDelete(
      id
    );
    if (!deleteDepartmentSub) {
      return res.status(409).json({
        message: "Department Sub not Found",
      });
    }

    return res
      .status(201)
      .json({ message: "Remove Department Sub Successfully :)" });
  } catch (error) {
    return next(error);
  }
};

exports.getOneDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments ID is not valid",
      });
    }
    const department = await departmentsModel.findById(id).lean();
    if (!department) {
      return res.status(409).json({
        message: "Department not Found",
      });
    }
    return res.status(200).json(department);
  } catch (error) {
    return next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments ID is not valid",
      });
    }
    const department = await departmentsModel.findById(id).lean();
    if (!department) {
      return res.status(409).json({
        message: "Department not Found",
      });
    }

    const updateDepartment = await departmentsModel.findByIdAndUpdate(
      id,
      {
        title: title ? title : department.title,
      },
      { new: true }
    );
    return res.status(201).json(updateDepartment);
  } catch (error) {
    return next(error);
  }
};

exports.removeDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Departments ID is not valid",
      });
    }
    const isExistDepartment = await departmentsModel.findById(id).lean();
    if (!isExistDepartment) {
      return res.status(409).json({
        message: "Department not Found",
      });
    }
    await departmentsSubsModel.deleteMany({ parent: id });
    await departmentsModel.deleteOne({ _id: id });
    return res
      .status(201)
      .json({ message: "Remove Department Sub Successfully :)" });
  } catch (error) {
    return next(error);
  }
};
// Answer
exports.setAnswer = async (req, res, next) => {
  try {
    const { body, ticketID } = req.body;

    if (!isValidObjectId(ticketID)) {
      return res.status(409).json({
        message: "Ticket ID is not valid",
      });
    }
    const ticket = await ticketsModel.findById(ticketID).lean();
    if (!ticket) {
      return res.status(409).json({
        message: "Ticket not Found",
      });
    }

    const answer = await ticketsModel.create({
      title: "پاسخ تیکت شما",
      body,
      parent: ticket._id,
      priority: ticket.priority,
      user: req.user._id,
      isAnswer: 1,
      answer: 0,
      departmentID: ticket.departmentID,
      departmentSubID: ticket.departmentSubID,
    });
    await ticketsModel.updateOne({ _id: ticket._id }, { answer: 1 });
    return res.status(201).json(answer);
  } catch (error) {
    return next(error);
  }
};
exports.getAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Ticket ID is not valid",
      });
    }
    const ticket = await ticketsModel
      .findById(id)
      .populate("departmentID", "title")
      .populate("departmentSubID", "title")
      .populate("user", "name")
      .populate("course", "name")
      .lean();
    if (!ticket) {
      return res.status(409).json({
        message: "Ticket not Found",
      });
    }

    const ticketAnswer = await ticketsModel
      .findOne({ parent: ticket._id })
      .select("title body user")
      .populate("user", "name")
      .lean();
    return res.status(200).json({
      ticket,
      ticketAnswer: ticketAnswer ? ticketAnswer : null,
    });
  } catch (error) {
    return next(error);
  }
};
