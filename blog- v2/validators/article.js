const Validator = require("fastest-validator");
const v = new Validator();

const schema = {
  title: {
    type: "string",
    min: 3,
    max: 255,
  },
  description: {
    type: "string",
  },
  body: {
    type: "string",
  },
  href: {
    type: "string",
    min: 3,
    max: 255,
  },
  categoryID: {
    type: "string",
  },
  $$strict: true,
};

const check = v.compile(schema);

module.exports = check;
