const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const router = express.Router();
const {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getSectionsByInstructor,
} = require("../controllers/sectionController");

router.use(authMiddleware);
router.get("/", roleMiddleware("admin"), getAllSections);
router.get("/instructor/:instructorId", roleMiddleware("admin"), getSectionsByInstructor);
router.get("/:id", roleMiddleware("admin", "instructor", "student"), getSectionById);
router.post("/", roleMiddleware("admin"), createSection);
router.put("/:id", roleMiddleware("admin"), updateSection);
router.delete("/:id", roleMiddleware("admin"), deleteSection);

module.exports = router;