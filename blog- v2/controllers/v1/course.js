const courseModel = require("./../../models/course");
const sessionModel = require("./../../models/session");
const categoryModel = require("./../../models/category");
const commentModel = require("./../../models/comment");
const userModel = require("./../../models/user");
const courseUserModel = require("./../../models/course-user");
const courseValidator = require("./../../validators/course");
const sessionValidator = require("./../../validators/session");
const fs = require("fs");
const { isValidObjectId } = require("mongoose");
const path = require("path");
const pathCovers = require("./../../utils/path-course-covers");
const pathVideos = require("./../../utils/path-session-videos");
//Course
exports.createCourse = async (req, res, next) => {
  try {
    const validationResult = courseValidator(req.body);

    if (validationResult !== true) {
      fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
      return res.status(422).json(validationResult);
    }

    const {
      name,
      description,
      support,
      href,
      price,
      status,
      discount,
      categoryID,
    } = req.body;

    const isCourseExist = await courseModel.findOne({
      $or: [{ name }, { href: href.toLowerCase() }],
    });

    if (isCourseExist) {
      // حذف دوره در صورت تکرار دوره
      if (req.files) {
        fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
      }
      return res.status(409).json({
        message: "Course name or href is duplicated",
      });
    }
    // ابتدا سند دوره را می‌سازیم
    const course = await courseModel.create({
      name,
      description,
      creator: req.user._id,
      categoryID,
      support,
      price,
      href: href.toLowerCase(),
      status,
      discount,
      cover: req.files.cover[0].filename,
    });

    if (!course) {
      // در صورت عدم موفقیت در ایجاد دوره، فایل آپلود شده را حذف می‌کنیم
      if (req.files) {
        fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
      }
      return res.status(500).json({
        message: "Server Error!!!",
      });
    }

    const mainCourse = await courseModel
      .findById(course._id)
      .populate("creator", "-password")
      .populate("categoryID")
      .lean();

    if (mainCourse) {
      return res.status(200).json(mainCourse);
    }

    return res.status(500).json({
      message: "Server Error!!!",
    });
  } catch (error) {
    return next(error);
  }
};
exports.registerCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(422).json({
        message: "course ID is not valid",
      });
    }
    const course = await courseModel.findById(id).lean();
    if (!course) {
      return res.status(401).json({
        message: "There is not course !!",
      });
    }
    const isUserAlreadyRegistered = await courseUserModel.findOne({
      user: req.user._id,
      course: course._id,
    });
    if (isUserAlreadyRegistered) {
      return res.status(409).json({
        message: "You are already registered for this course !!",
      });
    }
    const courseUser = await courseUserModel.create({
      course: course._id,
      user: req.user._id,
      price: req.body.price,
    });

    if (!courseUser) {
      return res.status(500).json({
        message: "Server Error!!!",
      });
    }
    return res.status(201).json(courseUser);
  } catch (error) {
    return next(error);
  }
};
exports.getCoursesByCategory = async (req, res, next) => {
  try {
    const { href } = req.params;
    const category = await categoryModel
      .findOne({ href: href.toLowerCase() })
      .lean();

    if (category) {
      const childCategories = await categoryModel
        .find({ parent: category._id })
        .lean();

      // استخراج آیدی دسته‌های فرزند
      const categoryIds = [
        category._id,
        ...childCategories.map((cat) => cat._id),
      ];

      // جستجوی دوره‌ها براساس دسته‌های پیدا شده
      const courses = await courseModel
        .find({ categoryID: { $in: categoryIds } })
        .populate("categoryID")
        .populate("creator", "-password")
        .lean();
      if (courses.length === 0) {
        return res.status(404).json({ message: "Courses not found" });
      }
      return res.status(200).json(courses);
    }
    return res.status(404).json({ message: "Category not found" });
  } catch (error) {
    return next(error);
  }
};
exports.getRelated = async (req, res, next) => {
  try {
    const { href } = req.params;

    // پیدا کردن دوره‌ی فعلی براساس href
    const course = await courseModel.findOne({ href: href.toLowerCase() });
    if (!course) {
      return res.status(404).json({ message: "Course not Found !!" });
    }

    // پیدا کردن دسته‌بندی مربوط به دوره
    const category = await categoryModel.findById(course.categoryID).lean();
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // پیدا کردن والد دسته‌بندی (اگر دارد)
    const parentCategoryID = category.parent ? category.parent : category._id;

    // پیدا کردن تمام زیردسته‌های مرتبط با دسته‌بندی والد
    const relatedCategories = await categoryModel
      .find({
        $or: [{ _id: parentCategoryID }, { parent: parentCategoryID }],
      })
      .lean();

    // استخراج آیدی تمام دسته‌بندی‌ها (والد و زیردسته‌ها)
    const relatedCategoryIds = relatedCategories.map((cat) => cat._id);

    // پیدا کردن دوره‌های مرتبط براساس آیدی دسته‌بندی‌های پیدا شده
    let relatedCourses = await courseModel
      .find({
        categoryID: { $in: relatedCategoryIds },
      })
      .lean();

    if (relatedCourses.length === 0) {
      return res.status(404).json({ message: "No related courses found !!" });
    }

    relatedCourses = relatedCourses.filter(
      (course) => course.href !== href.toLowerCase()
    );

    return res.status(200).json(relatedCourses);
  } catch (error) {
    return next(error);
  }
};

exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await courseModel
      .find({})
      .populate("categoryID")
      .populate("creator", "-password")
      .sort({ _id: -1 })
      .lean();

    const registers = await courseUserModel.find({}).lean();
    const comments = await commentModel.find({}).lean();
    const sessions = await sessionModel.find({}).lean();
    const allCourses = [];
    let allComments = [];
    courses.forEach((course) => {
      comments.forEach((comment) => {
        // چک می‌کنیم که کامنت اصلی است (کامنتی که mainCommentID ندارد)
        if (!comment.mainCommentID) {
          // پیدا کردن پاسخ‌های این کامنت
          const answers = comments.filter(
            (answerComment) =>
              String(answerComment.mainCommentID) === String(comment._id)
          );

          // اضافه کردن پاسخ‌ها به کامنت اصلی
          allComments.push({
            ...comment,
            course: comment.course.name,
            creator: comment.creator.name,
            answers: answers.map((answer) => ({
              ...answer,
              course: answer.course.name,
              creator: answer.creator.name,
            })),
          });
        }
      });
      let courseTotalScore = 5;
      const coursesRegisters = registers.filter(
        (register) => register.course.toString() === course._id.toString()
      );

      const courseComments = comments.filter((comment) => {
        return comment.course.toString() === course._id.toString();
      });
      const courseSessions = sessions.filter((session) => {
        return session.course.toString() === course._id.toString();
      });
      courseComments.forEach(
        (comment) => (courseTotalScore += Number(comment.score))
      );

      allCourses.push({
        ...course,
        categoryID: course.categoryID.title,
        creator: course.creator.name,
        registers: coursesRegisters.length,
        courseAverageScore: Math.floor(
          courseTotalScore / (courseComments.length + 1)
        ),
        countSession: courseSessions.length,
        countComment: courseComments.length,
        sessions: courseSessions,
        comments: allComments,
      });
    });

    return res.status(200).json(allCourses);
  } catch (error) {
    return next(error);
  }
};

exports.getCourseInfo = async (req, res, next) => {
  try {
    const { href } = req.params;

    const course = await courseModel
      .findOne({ href: href.toLowerCase() })
      .populate("categoryID")
      .populate("creator", "name")
      .lean();
    if (!course) {
      return res.status(401).json({
        message: "There is not course !!",
      });
    }
    const sessions = await sessionModel.find({ course: course._id }).lean();
    const comments = await commentModel
      .find({ course: course._id, isAccept: 1 })
      .lean();
    const courseStudentsCount = await courseUserModel
      .find({
        course: course._id,
      })
      .count();

    let courseTotalScore = 5;
    comments.forEach((comment) => (courseTotalScore += Number(comment.score)));

    let isUserRegisterToThisCourse = !!(await courseUserModel.findOne({
      user: req.user._id,
      course: course._id,
    }));
    // جمع‌آوری کامنت‌های اصلی و پاسخ‌ها
    let allComments = [];
    comments.forEach((comment) => {
      // چک می‌کنیم که کامنت اصلی است (کامنتی که mainCommentID ندارد)
      if (!comment.mainCommentID) {
        // پیدا کردن پاسخ‌های این کامنت
        const answers = comments.filter(
          (answerComment) =>
            String(answerComment.mainCommentID) === String(comment._id)
        );

        // اضافه کردن پاسخ‌ها به کامنت اصلی
        allComments.push({
          ...comment,
          course: comment.course.name,
          creator: comment.creator.name,
          answers: answers.map((answer) => ({
            ...answer,
            course: answer.course.name,
            creator: answer.creator.name,
          })),
        });
      }
    });
    return res.status(200).json({
      course,
      courseStudentsCount,
      isUserRegisterToThisCourse,
      courseAverageScore: Math.floor(courseTotalScore / (comments.length + 1)),
      countSession: sessions.length,
      countComments: allComments.length,
      sessions,
      comments: allComments,
    });
  } catch (error) {
    return next(error);
  }
};

exports.removeCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(422).json({
        message: "course ID is not valid",
      });
    }

    const course = await courseModel.findById(id).lean();
    if (!course) {
      return res.status(401).json({
        message: "There is not course !!",
      });
    }

    const sessions = await sessionModel.find({ course: id }).lean();
    if (sessions) {
      for (const session of sessions) {
        if (session.video) {
          const filePathVideo = path.join(pathVideos, session.video);
          if (fs.existsSync(filePathVideo)) {
            fs.unlinkSync(filePathVideo);
          }
        }
        await sessionModel.deleteOne({ _id: session._id });
      }
    }

    if (course.cover) {
      const filePathCover = path.join(pathCovers, course.cover);
      if (fs.existsSync(filePathCover)) {
        fs.unlinkSync(filePathCover);
      }
      const courseDelete = await courseModel.findByIdAndDelete(id);

      if (courseDelete) {
        return res.status(200).json({
          message: "course deleted successfully",
        });
      }
    }
    return res.status(500).json({
      message: "Server Error!!!",
    });
  } catch (error) {
    return next(error);
  }
};
exports.updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
      return res.status(422).json({
        message: "course ID is not valid",
      });
    }
    const course = await courseModel.findById(id).lean();
    if (!course) {
      fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
      return res.status(401).json({
        message: "There is not course !!",
      });
    }
    const {
      name,
      description,
      support,
      href,
      price,
      status,
      discount,
      categoryID,
      creator,
    } = req.body;

    if (categoryID) {
      if (!isValidObjectId(categoryID)) {
        fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
        return res.status(422).json({ message: "Invalid category ID" });
      }

      const isExistCategory = await categoryModel
        .findById({ _id: categoryID ? categoryID : course.categoryID })
        .lean();
      if (!isExistCategory) {
        fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
        return res.status(401).json({ message: "category not found" });
      }
    }
    if (creator) {
      if (!isValidObjectId(creator)) {
        fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
        return res.status(422).json({ message: "Invalid creator ID" });
      }

      const isExistCreator = await userModel
        .findOne({
          $and: [
            { _id: creator ? creator : course.creator },
            { role: "ADMIN" },
          ],
        })
        .lean();
      if (!isExistCreator) {
        fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
        return res
          .status(401)
          .json({ message: "creator not found or not admin" });
      }
    }

    if (req.files) {
      const filePath = path.join(pathCovers, course.cover);

      const updateCourse = await courseModel.findByIdAndUpdate(
        id,
        {
          name: name ? name : course.name,
          description: description ? description : course.description,
          cover: req.files.cover[0].filename,
          support: support ? support : course.support,
          href: href ? href.toLowerCase() : course.href,
          price: price ? price : course.price,
          status: status ? status : course.status,
          discount: discount ? discount : course.discount,
          categoryID: categoryID ? categoryID : course.categoryID,
          creator: creator ? creator : course.creator,
        },
        { new: true }
      );

      if (updateCourse) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return res.status(200).json({
          message: "Course Updated Successfully !!",
          updateCourse,
        });
      }
      fs.unlinkSync(path.join(pathCovers, req.files.cover[0].filename));
      return res.status(500).json({
        message: "Course update failed !!",
      });
    }

    const updateCourse = await courseModel.findByIdAndUpdate(
      id,
      {
        name: name ? name : course.name,
        description: description ? description : course.description,
        cover: course.cover,
        support: support ? support : course.support,
        href: href ? href.toLowerCase() : course.href,
        price: price ? price : course.price,
        status: status ? status : course.status,
        discount: discount ? discount : course.discount,
        categoryID: categoryID ? categoryID : course.categoryID,
        creator: creator ? creator : course.creator,
      },
      { new: true }
    );
    if (!updateCourse) {
      return res.status(500).json({
        message: "Course update failed !!",
      });
    }
    return res.status(200).json({
      message: "Course Update Successfully !!",
      updateCourse,
    });
  } catch (error) {
    return next(error);
  }
};

exports.popular = async (req, res, next) => {
  try {
    // پیدا کردن تمام دوره‌ها
    const courses = await courseModel.find().lean();

    // برای هر دوره، تعداد ثبت‌نام‌ها را محاسبه می‌کنیم
    const popularCourses = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await courseUserModel
          .find({ course: course._id })
          .countDocuments();

        return {
          ...course,
          studentCount,
        };
      })
    );

    // مرتب کردن دوره‌ها بر اساس تعداد ثبت‌نام‌ها (از زیاد به کم)
    popularCourses.sort((a, b) => b.studentCount - a.studentCount);

    // ارسال پاسخ
    return res.status(200).json(popularCourses);
  } catch (error) {
    return next(error);
  }
};

exports.presell = async (req, res, next) => {
  try {
    const presellCourse = await courseModel
      .find({
        status: "presell",
      })
      .lean();
    return res.status(200).json(presellCourse);
  } catch (error) {
    return next(error);
  }
};

exports.complete = async (req, res, next) => {
  try {
    const completeCourse = await courseModel
      .find({
        status: "complete",
      })
      .lean();
    return res.status(200).json(completeCourse);
  } catch (error) {
    return next(error);
  }
};

// Session
exports.createSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      return res.status(422).json({
        message: "course ID is not valid",
      });
    }

    const validationResult = sessionValidator(req.body);
    if (validationResult !== true) {
      fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      return res.status(422).json(validationResult);
    }

    const course = await courseModel.findById(id).lean();
    if (!course) {
      // حذف فایل ویدیو در صورت وجود و عدم وجود دوره
      if (req.files) {
        fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      }
      return res.status(401).json({
        message: "There is no course !!",
      });
    }

    const { title, time, free } = req.body;
    const isSessionExist = await sessionModel.findOne({ title });
    if (isSessionExist) {
      // حذف فایل ویدیو در صورت عدم موفقیت در ایجاد جلسه
      if (req.files) {
        fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      }
      return res.status(409).json({
        message: "Session name is duplicated",
      });
    }
    const session = await sessionModel.create({
      title,
      time,
      free,
      video: req.files.video[0].filename,
      course: id,
    });

    if (!session) {
      // حذف فایل ویدیو در صورت عدم موفقیت در ایجاد جلسه
      if (req.files) {
        fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      }
      return res.status(500).json({
        message: "Server Error!!!",
      });
    }

    return res.status(200).json(session);
  } catch (error) {
    return next(error);
  }
};

exports.getAllSessions = async (req, res, next) => {
  try {
    const { href } = req.params;

    const course = await courseModel
      .findOne({ href: href.toLowerCase() }, "name")
      .populate("categoryID", "title")
      .populate("creator", "username")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const sessions = await sessionModel.find({ course: course._id }).lean();

    course.sessions = sessions;

    return res.status(200).json(course);
  } catch (error) {
    return next(error);
  }
};

exports.getSessionInfo = async (req, res, next) => {
  try {
    const { href, sessionID } = req.params;
    const course = await courseModel
      .findOne({ href: href.toLowerCase() })
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!isValidObjectId(sessionID)) {
      return res.status(422).json({ message: "Session ID is not Valid !!" });
    }
    const session = await sessionModel
      .findById(sessionID)
      .populate("course", "name")
      .lean();
    if (!session) {
      return res.status(401).json({ message: "Session not found" });
    }
    return res.status(200).json({ course, session });
  } catch (error) {
    return next(error);
  }
};

exports.removeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(422).json({ message: "Session ID is not Valid !!" });
    }
    const session = await sessionModel.findById(id).lean();
    if (!session) {
      return res.status(401).json({ message: "There is not session" });
    }
    const filePath = path.join(pathVideos, session.video);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(path.join(filePath));
    }
    await sessionModel.deleteOne({ _id: id });

    return res.status(200).json({ message: "Session Delete Successfully" });
  } catch (error) {
    return next(error);
  }
};
exports.updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      return res.status(422).json({
        message: "session ID is not valid !!",
      });
    }
    const session = await sessionModel.findById(id).lean();
    if (!session) {
      fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      return res.status(401).join({ message: "There is not session" });
    }
    const { title, time, free, course } = req.body;
    if (course) {
      if (!isValidObjectId(course)) {
        fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
        return res.status(422).json({ message: "Invalid course ID" });
      }

      const isExistCourse = await courseModel.findById(course);
      if (!isExistCourse) {
        fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
        return res.status(404).json({ message: "course not found" });
      }
    }
    if (req.files) {
      const filePath = path.join(pathVideos, session.video);
      const sessionUpdate = await sessionModel.findByIdAndUpdate(
        id,
        {
          title: title ? title : session.title,
          time: time ? time : session.time,
          free: free ? free : session.free,
          video: req.files.video[0].filename,
          course: course ? course : session.course,
        },
        { new: true }
      );
      if (sessionUpdate) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(path.join(filePath));
        }
        return res.status(200).json({
          message: "Session Update Successfully !!",
        });
      }

      fs.unlinkSync(path.join(pathVideos, req.files.video[0].filename));
      return res.status(500).json({
        message: "Session update failed !!",
      });
    }
    const sessionUpdate = await sessionModel.findByIdAndUpdate(
      id,
      {
        title: title ? title : session.title,
        time: time ? time : session.time,
        free: free ? free : session.free,
        video: session.video,
        course: course ? course : session.course,
      },
      { new: true }
    );
    if (!sessionUpdate) {
      return res.status(500).json({
        message: "Session update failed !!",
      });
    }
    return res
      .status(200)
      .json({ message: "Session Update Successfully!", sessionUpdate });
  } catch (error) {
    return next(error);
  }
};
