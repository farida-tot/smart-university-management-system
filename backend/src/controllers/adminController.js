const Department = require("../models/Department");
const User = require("../models/User");
const Student = require("../models/Student");
const Instructor = require("../models/Instructor");
const Course = require("../models/Course");
const Section = require("../models/Section");
const Enrollment = require("../models/Enrollment");
const CourseRequest = require("../models/CourseRequest");

const getOverview = async (req, res) => {
  try {
    const [departments, users, instructors, students, courses, sections, enrollments, courseRequests] = await Promise.all([
      Department.find().sort({ code: 1 }),
      User.find({ role: { $in: ["student", "instructor"] } }).select("-password").sort({ name: 1 }),
      Instructor.find().populate("userId departmentId").sort({ employeeNumber: 1 }),
      Student.find().populate("userId departmentId").sort({ studentNumber: 1 }),
      Course.find().populate("departmentId", "name code").sort({ code: 1 }),
      Section.find().populate("courseId instructorId").sort({ semester: -1, sectionNumber: 1 }),
      Enrollment.find().populate("studentId sectionId"),
      CourseRequest.find({ status: "pending" }).populate("studentId courseId")
    ]);

    res.status(200).json({ departments, users, instructors, students, courses, sections, enrollments, courseRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewCourseRequest = async (req, res) => {
  const request = await CourseRequest.findByIdAndUpdate(req.params.id, { status: req.body.status, reviewedAt: new Date() }, { new: true, runValidators: true });
  if (!request) return res.status(404).json({ message: "Course request not found" });
  res.status(200).json(request);
};

const reviewEnrollment = async (req, res) => {
  const status = req.body.status === "approved" ? "enrolled" : req.body.status === "rejected" ? "rejected" : null;
  if (!status) return res.status(400).json({ message: "Status must be approved or rejected" });
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!enrollment) return res.status(404).json({ message: "Enrollment request not found" });
  res.status(200).json(enrollment);
};

module.exports = { getOverview, reviewCourseRequest, reviewEnrollment };