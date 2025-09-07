const offModel = require("./../../models/off");
const userModel = require("./../../models/user");
const courseModel = require("./../../models/course");
const { isValidObjectId } = require("mongoose");
const cron = require("node-cron");
const { time, timeStamp } = require("console");

exports.create = async (req, res, next) => {
  try {
    const { code, percent, course, max } = req.body;
    if (!isValidObjectId(course)) {
      return res.status(409).json({
        message: "Course ID is not valid",
      });
    }
    const isAdminExist = await courseModel.findById(course).lean();
    if (!isAdminExist) {
      return res.status(409).json({
        message: "Course not found",
      });
    }
    const newOff = await offModel.create({
      code,
      percent,
      course,
      max,
      creator: req.user._id,
    });
    return res.status(201).json(newOff);
  } catch (error) {
    return next(error);
  }
};
exports.getAll = async (req, res, next) => {
  try {
    const offs = await offModel
      .find({}, "-__v")
      .populate("course", "name href")
      .populate("creator", "name username email")
      .lean();
    return res.status(200).json(offs);
  } catch (error) {
    return next(error);
  }
};

// exports.setOnAll = async (req, res, next) => {
//   try {
//     //!! V1
//     const { discount } = req.body;
//     const coursesDiscounts = await courseModel.updateMany({ discount });
//     if (!coursesDiscounts) {
//       return res.status(500).json({ message: "Error Server !!!" });
//     }
//     return res.status(200).json({ message: "Discount set Successfully" });
//   } catch (error) {
//     return next(error);
//   }
// };

////////////////////////
// !! V2
// !! Days
let isCronActive = true; // کرون جاب غیرفعال است تا زمانی که تخفیف اعمال شود

// متغیر global برای نگهداری تعداد روزهای تنظیم‌شده و وضعیت فعال بودن کرون جاب
let discountDays = 1; // مقدار پیش‌فرض

// 1. اعمال تخفیف روی تمام دوره‌ها و به‌روزرسانی فیلد updatedAt
exports.setDiscountForCourses = async (req, res, next) => {
  try {
    const { discount, days } = req.body;

    // به‌روزرسانی تعداد روزها از درخواست
    if (days) {
      discountDays = days;
    }
    const currentDate = new Date();

    // محاسبه تاریخ آستانه با استفاده از مقدار متغیر discountDays
    const thresholdDate = new Date(
      currentDate.setDate(currentDate.getDate() + discountDays) // کسر روزها
    );

    // اعمال تخفیف به تمام دوره‌ها
    const coursesDiscounts = await courseModel.updateMany({
      discount,
      discountExpirationDate: thresholdDate,
    });

    if (coursesDiscounts.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "No courses updated with discount!" });
    }

    // کرون جاب فعال شود
    isCronActive = true;

    return res.status(200).json({ message: "Discount set successfully." });
  } catch (error) {
    return next(error);
  }
};

// 2. کرون جاب برای صفر کردن تخفیف‌ها پس از گذشت تعداد روز تنظیم‌شده از updatedAt
cron.schedule("0 0 * * *", async () => {
  // اجرای این کد هر شب ساعت 12، اما فقط در صورتی که کرون جاب فعال باشد
  if (!isCronActive) return; // اگر غیرفعال است، ادامه نده
  const isSetDiscountExpirationDate = await courseModel
    .find({})
    .select("discountExpirationDate")
    .lean();
  const oneDiscountExpirationDate =
    isSetDiscountExpirationDate[0]?.discountExpirationDate;

  if (oneDiscountExpirationDate === null) {
    isCronActive = false;
    return;
  }
  try {
    // پیدا کردن دوره‌هایی که از آخرین آپدیت آن‌ها بیشتر از discountDays روز گذشته و تخفیفشان را صفر کردن
    const coursesToReset = await courseModel.updateMany(
      { discountExpirationDate: { $lte: new Date() } },
      { discount: 0, discountExpirationDate: null } // تنظیم تخفیف به صفر
    );

    if (coursesToReset.modifiedCount > 0) {
      console.log(`Discounts reset successfully after ${discountDays} days.`);

      // پس از صفر شدن تخفیف‌ها، کرون جاب غیرفعال شود
      isCronActive = false;
    } else {
      console.log("No courses found to reset discounts.");
    }
  } catch (error) {
    console.error("Error resetting discounts:", error);
  }
});

// !! minutes
// متغیر global برای نگهداری تعداد دقیقه‌های تنظیم‌شده و وضعیت فعال بودن کرون جاب

// let discountMinutes = 1; // مقدار پیش‌فرض
// // 1. اعمال تخفیف روی تمام دوره‌ها و به‌روزرسانی فیلد updatedAt
// exports.setDiscountForCourses = async (req, res, next) => {
//   try {
//     const { discount, minutes } = req.body;

//     if (minutes) {
//       discountMinutes = minutes;
//     }
//     // به‌روزرسانی تعداد دقیقه‌ها از درخواست
//     const currentDate = new Date();

//     // محاسبه تاریخ آستانه با استفاده از مقدار متغیر discountMinutes
//     const thresholdDate = new Date(
//       currentDate.setMinutes(currentDate.getMinutes() + discountMinutes) // کسر دقیقه‌ها
//     );
//     // اعمال تخفیف به تمام دوره‌ها
//     const coursesDiscounts = await courseModel.updateMany({
//       discount,
//       discountExpirationDate: thresholdDate,
//     }); // تنظیم مقدار تخفیف

//     if (coursesDiscounts.modifiedCount === 0) {
//       return res
//         .status(500)
//         .json({ message: "No courses updated with discount!" });
//     }

//     // کرون جاب فعال شود
//     isCronActive = true;

//     return res.status(200).json({ message: "Discount set successfully." });
//   } catch (error) {
//     return next(error);
//   }
// };

// // 2. کرون جاب برای صفر کردن تخفیف‌ها پس از گذشت تعداد دقیقه تنظیم‌شده از updatedAt
// cron.schedule("* * * * *", async () => {
//   // اجرای این کد هر دقیقه، اما فقط در صورتی که کرون جاب فعال باشد
//   if (!isCronActive) return; // اگر غیرفعال است، ادامه نده
//   const isSetDiscountExpirationDate = await courseModel
//     .find({})
//     .select("discountExpirationDate")
//     .lean();
//   const oneDiscountExpirationDate =
//     isSetDiscountExpirationDate[0]?.discountExpirationDate;

//   if (oneDiscountExpirationDate === null) {
//     isCronActive = false;
//     return;
//   }
//   try {
//     // پیدا کردن دوره‌هایی که از آخرین آپدیت آن‌ها بیشتر از discountMinutes گذشته و تخفیفشان را صفر کردن
//     const coursesToReset = await courseModel.updateMany(
//       { discountExpirationDate: { $lte: new Date() } },
//       { discount: 0, discountExpirationDate: null } // تنظیم تخفیف به صفر
//     );
//     if (coursesToReset.modifiedCount > 0) {
//       console.log(
//         `Discounts reset successfully after ${discountMinutes} minutes.`
//       );

//       // پس از صفر شدن تخفیف‌ها، کرون جاب غیرفعال شود
//       isCronActive = false;
//     } else {
//       console.log("No courses found to reset discounts.");
//     }
//   } catch (error) {
//     console.error("Error resetting discounts:", error);
//   }
// });

///////////////

exports.getOne = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { course } = req.body;
    if (!isValidObjectId(course)) {
      return res.status(409).json({
        message: "Course ID is not valid",
      });
    }
    const off = await offModel.findOne({ code, course });
    if (!off) {
      return res.status(404).json({ message: "Code is not valid" });
    } else if (off.max === off.uses) {
      return res.status(409).json({ message: "This code already used !!" });
    } else {
      var updateOff = await offModel.findOneAndUpdate(
        { code, course },
        { uses: off.uses + 1 },
        { new: true }
      );
    }
    return res.status(200).json(updateOff);
  } catch (error) {
    return next(error);
  }
};
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(409).json({
        message: "Off ID is not valid",
      });
    }
    const deleteOff = await offModel.findByIdAndDelete(id);
    if (!deleteOff) {
      return res.status(404).json({ message: "Off ID not found" });
    }
    return res.status(200).json({ message: "Remove Off Successfully" });
  } catch (error) {
    return next(error);
  }
};
