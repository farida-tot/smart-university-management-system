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

router.get("/", getAllDepartments);

router.get("/:id", getDepartmentById);

router.post("/", authMiddleware, roleMiddleware("admin"), createDepartment);

router.put("/:id", authMiddleware, roleMiddleware("admin"), updateDepartment);

router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDepartment);

module.exports = router;