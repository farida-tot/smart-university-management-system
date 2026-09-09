const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getOverview,
  reviewCourseRequest,
  reviewEnrollment,
  deleteStudent
} = require("../controllers/adminController");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));
router.get("/overview", getOverview);
router.patch("/course-requests/:id", reviewCourseRequest);
router.patch("/enrollments/:id", reviewEnrollment);
router.delete("/students/:id", deleteStudent);

module.exports = router;