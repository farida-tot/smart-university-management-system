const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const Assignment = require("../models/Assignment");
const Instructor = require("../models/Instructor");
const Section = require("../models/Section");
const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");

const instructorTeachesCourse = async (userId, courseId) => {
  const instructor = await Instructor.findOne({ userId });
  const section = instructor && await Section.findOne({ instructorId: instructor._id, courseId });
  return { instructor, section };
};

const uploadAssignment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "A PDF file is required" });
    const { instructor } = await instructorTeachesCourse(req.user.userId, req.params.courseId);
    if (!instructor) return res.status(403).json({ message: "You are not assigned to this course" });

    const storageName = `${crypto.randomUUID()}.pdf`;
    const uploadDirectory = path.join(__dirname, "../../uploads/assignments");
    await fs.mkdir(uploadDirectory, { recursive: true });
    const filePath = path.join(uploadDirectory, storageName);
    await fs.writeFile(filePath, req.file.buffer);

    const assignment = await Assignment.create({
      courseId: req.params.courseId,
      uploadedBy: instructor._id,
      title: req.body.title,
      description: req.body.description || "",
      deadline: req.body.deadline || null,
      originalName: req.file.originalname,
      storageName,
      filePath,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const listMyAssignments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    const enrollments = await Enrollment.find({ studentId: student._id, status: "enrolled" }).populate("sectionId");
    const courseIds = enrollments.map((enrollment) => enrollment.sectionId?.courseId).filter(Boolean);
    const assignments = await Assignment.find({ courseId: { $in: courseIds } }).populate("courseId uploadedBy").sort({ deadline: 1, createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listCourseAssignments = async (req, res) => {
  try {
    let allowed = false;
    if (req.user.role === "instructor") {
      allowed = Boolean((await instructorTeachesCourse(req.user.userId, req.params.courseId)).section);
    } else if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user.userId });
      const sections = await Section.find({ courseId: req.params.courseId }, "_id");
      allowed = Boolean(student && await Enrollment.exists({
        studentId: student._id,
        sectionId: { $in: sections.map((section) => section._id) },
        status: "enrolled"
      }));
    }
    if (!allowed) return res.status(403).json({ message: "You are not registered for this course" });
    res.status(200).json(await Assignment.find({ courseId: req.params.courseId }).sort({ createdAt: -1 }));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const downloadAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    let allowed = false;
    if (req.user.role === "instructor") {
      allowed = Boolean((await instructorTeachesCourse(req.user.userId, assignment.courseId)).section);
    } else if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user.userId });
      const sections = await Section.find({ courseId: assignment.courseId }, "_id");
      allowed = Boolean(student && await Enrollment.exists({
        studentId: student._id,
        sectionId: { $in: sections.map((section) => section._id) },
        status: "enrolled"
      }));
    }

    if (!allowed) return res.status(403).json({ message: "You are not registered for this course" });

    const fileBuffer = await fs.readFile(assignment.filePath);
    res.status(200);
    res.setHeader("Content-Type", assignment.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${assignment.originalName}"`);
    return res.send(fileBuffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadAssignment, listCourseAssignments, listMyAssignments, downloadAssignment };