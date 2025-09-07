const express = require("express");
const searchController = require("./../../controllers/v1/search");

const router = express.Router();

router.route("/:keyword").get(searchController.result);

module.exports = router;
