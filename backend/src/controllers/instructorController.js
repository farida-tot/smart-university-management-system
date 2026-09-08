const User = require("../models/User");
const Instructor = require("../models/Instructor");
const Section = require("../models/Section");
const Enrollment = require("../models/Enrollment");
const Attendance = require("../models/Attendance");
const CourseworkGrade = require("../models/CourseworkGrade");
const Assignment = require("../models/Assignment");
const Department = require("../models/Department");

const getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find().populate("userId departmentId");
    res.status(200).json(instructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInstructorById = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id).populate("userId departmentId");
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    res.status(200).json(instructor);
  } catch (error) {
    res.status(400).json({ message: "Invalid instructor ID" });
  }
};

const createInstructor = async (req, res) => {
  try {
    const { userId, employeeNumber, departmentId } = req.body;
    const user = await User.findById(userId).select("role email");

    if (!user || user.role !== "instructor") {
      return res.status(400).json({ message: "userId must belong to an instructor user" });
    }

    if (!await Department.exists({ _id: departmentId })) {
      return res.status(400).json({ message: "Department not found" });
    }

    if (user.email.split("@")[0] !== employeeNumber.trim().toLowerCase() || !user.email.endsWith("@gov.nu.edu")) {
      return res.status(400).json({ message: "Instructor email must be employeeNumber@gov.nu.edu" });
    }

    const newInstructor = await Instructor.create({ userId, employeeNumber, departmentId });
    res.status(201).json(await newInstructor.populate("userId departmentId"));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id).populate("userId");
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    const updates = {};
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      await User.findByIdAndUpdate(instructor.userId._id, { name: req.body.name.trim() }, { runValidators: true });
    }
    if (req.body.departmentId !== undefined) {
      if (!await Department.exists({ _id: req.body.departmentId })) {
        return res.status(400).json({ message: "Department not found" });
      }
      updates.departmentId = req.body.departmentId;
    }
    if (req.body.employeeNumber !== undefined) {
      const employeeNumber = req.body.employeeNumber.trim().toLowerCase().replace(/@gov\.nu\.edu$/, "");
      if (!employeeNumber) {
        return res.status(400).json({ message: "Employee number cannot be empty" });
      }
      if (!/^[a-z0-9-]{2,12}$/.test(employeeNumber)) {
        return res.status(400).json({ message: "Employee number must be 2-12 letters, numbers, or hyphens" });
      }
      const email = `${employeeNumber.toLowerCase()}@gov.nu.edu`;
      const existingUser = await User.findOne({ email, _id: { $ne: instructor.userId._id } });
      if (existingUser) {
        return res.status(409).json({ message: "An account with this employee number already exists" });
      }
      updates.employeeNumber = employeeNumber;
      await User.findByIdAndUpdate(instructor.userId._id, { email }, { runValidators: true });
    }
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    const updatedInstructor = await Instructor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate("userId departmentId");
    res.status(200).json(updatedInstructor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    const assignedSections = await Section.countDocuments({ instructorId: req.params.id });
    if (assignedSections > 0) {
      return res.status(409).json({
        message: "Reassign all active sections before deleting this instructor"
      });
    }

    await Instructor.findByIdAndUpdate(req.params.id, { isActive: false });
    await User.findByIdAndUpdate(instructor.userId, { isActive: false });
    res.status(200).json({ message: "Instructor deactivated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyInstructor = async (userId) => Instructor.findOne({ userId }).populate("userId departmentId");

const getMyProfile = async (req, res) => {
  try {
    const instructor = await getMyInstructor(req.user.userId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }
    res.status(200).json(instructor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const instructor = await getMyInstructor(req.user.userId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    const { name, email } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: "Name cannot be empty" });
      updates.name = name.trim();
    }
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== `${instructor.employeeNumber.toLowerCase()}@gov.nu.edu`) {
        return res.status(400).json({ message: "Instructor email must be employeeNumber@gov.nu.edu" });
      }
      updates.email = normalizedEmail;
    }

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).select("-password");
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyDashboard = async (req, res) => {
  try {
    const instructor = await Instructor.findOne({ userId: req.user.userId }).populate("userId departmentId");
    if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });

    const sections = await Section.find({ instructorId: instructor._id }).populate("courseId");
    const sectionIds = sections.map((section) => section._id);
    const courseIds = [...new Set(sections.map((section) => String(section.courseId._id)))];
    const [enrollments, attendance, grades, assignments] = await Promise.all([
      Enrollment.find({ sectionId: { $in: sectionIds }, status: { $in: ["enrolled", "completed"] } }).populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" }
      }),
      Attendance.find({ sectionId: { $in: sectionIds }, recordedBy: instructor._id }),
      CourseworkGrade.find({ sectionId: { $in: sectionIds }, recordedBy: instructor._id }),
      Assignment.find({ courseId: { $in: courseIds }, uploadedBy: instructor._id })
    ]);

    const sectionData = sections.map((section) => ({
      section,
      students: enrollments.filter((enrollment) => String(enrollment.sectionId) === String(section._id)),
      attendance: attendance.filter((record) => String(record.sectionId) === String(section._id)),
      courseworkGrades: grades.filter((grade) => String(grade.sectionId) === String(section._id)),
      assignments: assignments.filter((assignment) => String(assignment.courseId) === String(section.courseId._id))
    }));

    res.status(200).json({
      instructor,
      totalSections: sections.length,
      totalStudents: new Set(enrollments.map((enrollment) => String(enrollment.studentId._id))).size,
      courses: courseIds.length,
      sections: sectionData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOwnedSection = async (req, sectionId) => {
  const instructor = await Instructor.findOne({ userId: req.user.userId });
  const section = instructor && await Section.findOne({ _id: sectionId, instructorId: instructor._id });
  return { instructor, section };
};

const recordAttendance = async (req, res) => {
  try {
    const { instructor, section } = await getOwnedSection(req, req.params.sectionId);
    if (!section) return res.status(404).json({ message: "Assigned section not found" });
    const { studentId, date, status } = req.body;
    const enrollment = await Enrollment.findOne({ studentId, sectionId: section._id, status: "enrolled" });
    if (!enrollment) return res.status(400).json({ message: "Student is not enrolled in this section" });
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, sectionId: section._id, date: new Date(date) },
      { studentId, sectionId: section._id, date: new Date(date), status, recordedBy: instructor._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const recordCourseworkGrade = async (req, res) => {
  try {
    const { instructor, section } = await getOwnedSection(req, req.params.sectionId);
    if (!section) return res.status(404).json({ message: "Assigned section not found" });
    const enrollment = await Enrollment.findOne({ studentId: req.params.studentId, sectionId: section._id, status: { $in: ["enrolled", "completed"] } });
    if (!enrollment) return res.status(400).json({ message: "Student is not enrolled in this section" });
    const courseworkMarks = Number(req.body.courseworkMarks);
    const finalExamMarks = Number(req.body.finalExamMarks);
    if (!Number.isInteger(courseworkMarks) || courseworkMarks < 1 || courseworkMarks > 40 || !Number.isInteger(finalExamMarks) || finalExamMarks < 1 || finalExamMarks > 60) {
      return res.status(400).json({ message: "Coursework must be 1-40 and final exam must be 1-60" });
    }
    const totalMarks = courseworkMarks + finalExamMarks;
    const finalGrade = totalMarks >= 90 ? "A+" : totalMarks >= 85 ? "A" : totalMarks >= 80 ? "B+" : totalMarks >= 75 ? "B" : totalMarks >= 70 ? "C+" : totalMarks >= 60 ? "C" : totalMarks >= 50 ? "D" : "F";
    const gradePoints = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, D: 1, F: 0 }[finalGrade];
    const grade = await CourseworkGrade.findOneAndUpdate(
      { studentId: req.params.studentId, sectionId: section._id },
      { studentId: req.params.studentId, sectionId: section._id, courseworkMarks, finalExamMarks, totalMarks, finalGrade, recordedBy: instructor._id },
      { new: true, upsert: true, runValidators: true }
    );
    await Enrollment.findByIdAndUpdate(enrollment._id, {
      grade: finalGrade,
      gradePoints,
      status: "completed"
    }, { new: true, runValidators: true });
    res.status(200).json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getMyProfile,
  updateMyProfile,
  getMyDashboard,
  recordAttendance,
  recordCourseworkGrade
};
