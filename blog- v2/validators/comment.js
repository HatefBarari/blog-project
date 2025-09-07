const Validator = require("fastest-validator");
const v = new Validator();

const schema = {
  body: {
    type: "string",
    min: 3,
    max: 255,
  },
  courseHref: {
    type: "string",
    min: 3,
    max: 120,
  },
  score: {
    type: "number",
    optional: true,
  },
  $$strict: true,
};

const check = v.compile(schema);

module.exports = check;
