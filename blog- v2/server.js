const app = require("./app");
const mongoose = require("mongoose");
const settings = require("./settings");
require("dotenv").config();

(async () => {
  await mongoose.connect(settings.mongoURI);
  console.log("mongo db connected");
})();

app.listen(settings.port, () => {
  console.log(`server is running on port ${settings.port}`);
});
