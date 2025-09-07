const express = require("express");
const settings = require("./settings");
const authRoutes = require("./routes/v1/auth");
const usersRouter = require("./routes/v1/user");
const categoriesRouter = require("./routes/v1/category");
const coursesRouter = require("./routes/v1/course");
const commentsRouter = require("./routes/v1/comment");
const contactsRouter = require("./routes/v1/contact");
const newslettersRouter = require("./routes/v1/newsletter");
const searchRouter = require("./routes/v1/search");
const notificationsRouter = require("./routes/v1/notification");
const offsRouter = require("./routes/v1/off");
const articlesRouter = require("./routes/v1/article");
const ordersRouter = require("./routes/v1/order");
const ticketsRouter = require("./routes/v1/ticket");
const menusRouter = require("./routes/v1/menu");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
app.use(
  "/courses/covers",
  express.static(path.join(__dirname, "public", "courses", "covers"))
);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/v1/auth", authRoutes);
app.use("/v1/users", usersRouter);
app.use("/v1/categories", categoriesRouter);
app.use("/v1/courses", coursesRouter);
app.use("/v1/comments", commentsRouter);
app.use("/v1/contacts", contactsRouter);
app.use("/v1/newsletters", newslettersRouter);
app.use("/v1/search", searchRouter);
app.use("/v1/notifications", notificationsRouter);
app.use("/v1/offs", offsRouter);
app.use("/v1/articles", articlesRouter);
app.use("/v1/orders", ordersRouter);
app.use("/v1/tickets", ticketsRouter);
app.use("/v1/menus", menusRouter);

app.use((req, res) => {
  return res.status(404).json({
    error: {
      type: "Not Found",
      message: "404 API Not Found !!!",
    },
  });
});

// app.use((err, req, res, next) => {
//   console.error(err.stack);

//   res.status(err.status || 500).json({
//     message: err.message || "Internal Server Error",
//   });
// });

app.use((err, req, res, next) => {
  // چاپ استک خطا در کنسول برای هر دو حالت
  console.error(err.stack);

  // نمایش پیام خطا بر اساس محیط
  const response = {
    message: settings.errorHandling.showErrors
      ? err.message
      : "Internal Server Error",
  };

  res.status(err.status || 500).json(response);
});

module.exports = app;
