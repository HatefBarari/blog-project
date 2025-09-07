const Validator = require("fastest-validator");
const v = new Validator();

const schema = {
  title: {
    type: "string",
    min: 3,
    max: 120,
  },
  href: {
    type: "string",
    min: 3,
    max: 120,
  },
  parent: {
    type: "string",
    optional: true,
  },
  $$strict: true,
};

const check = v.compile(schema);

module.exports = check;
