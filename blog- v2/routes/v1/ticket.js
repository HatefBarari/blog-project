const express = require("express");
const ticketsController = require("./../../controllers/v1/ticket");
const authMiddleware = require("./../../middlewares/auth");
const isAdminMiddleware = require("./../../middlewares/isAdmin");

const router = express.Router();

router
  .route("/")
  .post(authMiddleware, ticketsController.create)
  .get(authMiddleware, isAdminMiddleware, ticketsController.getAll);

router.route("/user").get(authMiddleware, ticketsController.userTickets);

router
  .route("/departments")
  .get(authMiddleware, ticketsController.departments)
  .post(authMiddleware, isAdminMiddleware, ticketsController.createDepartment);
router
  .route("/departments/:id/subs")
  .get(authMiddleware, ticketsController.departmentsSubs)
  .post(
    authMiddleware,
    isAdminMiddleware,
    ticketsController.createDepartmentSub
  );
router
  .route("/department-sub/:id")
  .get(authMiddleware, ticketsController.getOneDepartmentSub)
  .put(authMiddleware, isAdminMiddleware, ticketsController.updateDepartmentSub)
  .delete(
    authMiddleware,
    isAdminMiddleware,
    ticketsController.removeDepartmentSub
  );
router
  .route("/departments/:id")
  .get(authMiddleware, ticketsController.getOneDepartment)
  .put(authMiddleware, isAdminMiddleware, ticketsController.updateDepartment)
  .delete(
    authMiddleware,
    isAdminMiddleware,
    ticketsController.removeDepartment
  );

router
  .route("/answer")
  .post(authMiddleware, isAdminMiddleware, ticketsController.setAnswer);
router
  .route("/:id/answer")
  .get(authMiddleware, isAdminMiddleware, ticketsController.getAnswer);

module.exports = router;
