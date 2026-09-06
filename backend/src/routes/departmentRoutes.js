const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require("../controllers/departmentController");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin"), getAllDepartments);

router.get("/:id", roleMiddleware("admin"), getDepartmentById);

router.post("/", roleMiddleware("admin"), createDepartment);

router.put("/:id", roleMiddleware("admin"), updateDepartment);

router.delete("/:id", roleMiddleware("admin"), deleteDepartment);

module.exports = router;