const express = require("express");
const menusController = require("./../../controllers/v1/menu");
const authMiddleware = require("./../../middlewares/auth");
const isAdminMiddleware = require("./../../middlewares/isAdmin");

const router = express.Router();

router
  .route("/")
  .post(authMiddleware, isAdminMiddleware, menusController.create)
  .get(menusController.getAll);

router
  .route("/all")
  .get(authMiddleware, isAdminMiddleware, menusController.getAllInPanel);
router.route("/:href").get(menusController.getOne);
router
  .route("/:id")
  .delete(authMiddleware, isAdminMiddleware, menusController.remove)
  .put(authMiddleware, isAdminMiddleware, menusController.update);

module.exports = router;
