const Validator = require("fastest-validator");
const v = new Validator();

const schema = {
  title: { type: "string", min: 3, max: 120 },
  time: {
    type: "string",
    pattern: /^(?:[0-5]?[0-9]):(?:[0-5]?[0-9])$/,
    messages: {
      stringPattern: "زمان باید در فرمت دقیقه و ثانیه (MM:SS) باشد.",
    },
  },
  free: {
    type: "string",
  },
};

const check = v.compile(schema);

module.exports = check;
