const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const router = express.Router();
const {
  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getMyProfile,
  updateMyProfile,
  getMyDashboard,
  recordAttendance,
  recordCourseworkGrade,
} = require("../controllers/instructorController");

router.use(authMiddleware);
router.get("/me", roleMiddleware("instructor"), getMyProfile);
router.patch("/me", roleMiddleware("instructor"), updateMyProfile);
router.get("/me/dashboard", roleMiddleware("instructor"), getMyDashboard);
router.put("/me/sections/:sectionId/attendance", roleMiddleware("instructor"), recordAttendance);
router.put("/me/sections/:sectionId/students/:studentId/coursework", roleMiddleware("instructor"), recordCourseworkGrade);
router.get("/", roleMiddleware("admin"), getAllInstructors);
router.get("/:id", roleMiddleware("admin"), getInstructorById);
router.post("/", roleMiddleware("admin"), createInstructor);
router.put("/:id", roleMiddleware("admin"), updateInstructor);
router.delete("/:id", roleMiddleware("admin"), deleteInstructor);

module.exports = router;