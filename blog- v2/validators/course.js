const Validator = require("fastest-validator");
const v = new Validator();

const schema = {
  name: {
    type: "string",
    min: 3,
    max: 120,
  },
  description: {
    type: "string",
    min: 3,
  },
  support: {
    type: "string",
    min: 3,
    max: 120,
  },
  href: {
    type: "string",
    min: 3,
    max: 255,
  },
  price: {
    type: "string",
  },
  status: {
    type: "string",
  },
  discount: {
    type: "string",
    min: 0,
    max: 100,
  },
  categoryID: {
    type: "string",
  },
};

const check = v.compile(schema);

module.exports = check;
