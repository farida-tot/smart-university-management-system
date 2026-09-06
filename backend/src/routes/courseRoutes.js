const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses
} = require("../controllers/courseController");

const router = express.Router();

router.use(authMiddleware);

router.get("/search", roleMiddleware("admin", "instructor", "student"), searchCourses);

router.get("/", roleMiddleware("admin", "instructor", "student"), getAllCourses);

router.get("/:id", roleMiddleware("admin", "instructor", "student"), getCourseById);

router.post("/", roleMiddleware("admin"), createCourse);

router.put("/:id", roleMiddleware("admin"), updateCourse);

router.delete("/:id", roleMiddleware("admin"), deleteCourse);

module.exports = router;