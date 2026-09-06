const express = require("express");
const router = express.Router();
const {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getSectionsByInstructor,
} = require("../controllers/sectionController");

router.get("/", getAllSections);
router.get("/:id", getSectionById);
router.post("/", createSection);
router.put("/:id", updateSection);
router.delete("/:id", deleteSection);
router.get("/instructor/:instructorId", getSectionsByInstructor);

module.exports = router;