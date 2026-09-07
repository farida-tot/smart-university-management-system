const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  getMyDashboard,
  requestCourse,
  requestSection
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

module.exports = router;