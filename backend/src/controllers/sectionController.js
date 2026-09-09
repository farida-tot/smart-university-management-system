const Section = require("../models/Section");
const Enrollment = require("../models/Enrollment");
const { validateSection, getSlotTimes } = require("../utils/sectionValidation");

const normalizeSchedule = (schedule) => schedule?.map((entry) => ({
  ...entry,
  room: typeof entry.room === "string" ? entry.room.trim().replace(/\s+/g, " ") : entry.room,
  ...getSlotTimes(entry.slot)
}));

const getAllSections = async (req, res) => {
  try {
    const sections = await Section.find().populate("courseId instructorId");
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id).populate("courseId instructorId");
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.status(200).json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSection = async (req, res) => {
  try {
    const data = { ...req.body, schedule: normalizeSchedule(req.body.schedule) };
    const validationError = await validateSection(data, null);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const newSection = new Section(data);
    await newSection.save();
    const section = await Section.findById(newSection._id).populate("courseId instructorId");
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateSection = async (req, res) => {
  try {
    const existingSection = await Section.findById(req.params.id);
    if (!existingSection) {
      return res.status(404).json({ message: "Section not found" });
    }

    const candidate = {
      ...existingSection.toObject(),
      ...req.body,
      courseId: req.body.courseId || existingSection.courseId,
      instructorId: req.body.instructorId || existingSection.instructorId,
      schedule: normalizeSchedule(req.body.schedule || existingSection.schedule)
    };
    const validationError = await validateSection(candidate, req.params.id);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      { ...req.body, schedule: candidate.schedule },
      { new: true, runValidators: true }
    );
    if (!updatedSection) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.status(200).json(updatedSection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteSection = async (req, res) => {
  try {
    const enrolledCount = await Enrollment.countDocuments({
      sectionId: req.params.id,
      status: "enrolled"
    });

    if (enrolledCount > 0) {
      return res.status(409).json({
        message: "A section with enrolled students cannot be deleted"
      });
    }

    const deletedSection = await Section.findByIdAndDelete(req.params.id);
    if (!deletedSection) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.status(200).json({ message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSectionsByInstructor = async (req, res) => {
  try {
    const sections = await Section.find({ instructorId: req.params.instructorId }).populate("courseId instructorId");
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getSectionsByInstructor,
};