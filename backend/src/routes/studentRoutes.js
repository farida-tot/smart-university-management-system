const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  getMyDashboard,
  requestCourse,
  requestSection,
  dropEnrollment
} = require("../controllers/studentController");

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("student"),
  getMyProfile
);

router.patch(
  "/me",
  authMiddleware,
  roleMiddleware("student"),
  updateMyProfile
);

router.get("/me/dashboard", authMiddleware, roleMiddleware("student"), getMyDashboard);
router.post("/me/courses/:courseId/request", authMiddleware, roleMiddleware("student"), requestCourse);
router.post("/me/sections/:sectionId/request", authMiddleware, roleMiddleware("student"), requestSection);
router.patch("/me/enrollments/:id/drop", authMiddleware, roleMiddleware("student"), dropEnrollment);

module.exports = router;