const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  uploadAssignment,
  listCourseAssignments,
  downloadAssignment
} = require("../controllers/assignmentController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, file.mimetype === "application/pdf")
});
const router = express.Router();

router.use(authMiddleware);
router.post("/courses/:courseId", roleMiddleware("instructor"), upload.single("file"), uploadAssignment);
router.get("/courses/:courseId", roleMiddleware("student", "instructor"), listCourseAssignments);
router.get("/:id/download", roleMiddleware("student", "instructor"), downloadAssignment);

module.exports = router;