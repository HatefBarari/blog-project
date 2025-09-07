const courseModel = require("./../../models/course");

exports.result = async (req, res, next) => {
  const { keyword } = req.params;
  const courses = await courseModel
    .find({
      $or: [
        { description: { $regex: ".*" + keyword + ".*" } },
        { name: { $regex: ".*" + keyword + ".*" } },
      ],
    })
    .lean();
  // articles
  return res.status(200).json({ search: keyword, courses: courses });
};
