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
  res.download(assignment.filePath, assignment.originalName);
};

module.exports = { uploadAssignment, listCourseAssignments, downloadAssignment };