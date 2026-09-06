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
    if (req.body.departmentId !== undefined) {
      if (!await Department.exists({ _id: req.body.departmentId })) {
        return res.status(400).json({ message: "Department not found" });
      }
      updates.departmentId = req.body.departmentId;
    }
    if (req.body.employeeNumber !== undefined) {
      const employeeNumber = req.body.employeeNumber.trim();
      if (instructor.userId.email !== `${employeeNumber.toLowerCase()}@gov.nu.edu`) {
        return res.status(400).json({ message: "Instructor email must be employeeNumber@gov.nu.edu" });
      }
      updates.employeeNumber = employeeNumber;
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
      Enrollment.find({ sectionId: { $in: sectionIds }, status: "enrolled" }).populate({
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
    const enrollment = await Enrollment.findOne({ studentId: req.params.studentId, sectionId: section._id, status: "enrolled" });
    if (!enrollment) return res.status(400).json({ message: "Student is not enrolled in this section" });
    const grade = await CourseworkGrade.findOneAndUpdate(
      { studentId: req.params.studentId, sectionId: section._id },
      { studentId: req.params.studentId, sectionId: section._id, marks: req.body.marks, recordedBy: instructor._id },
      { new: true, upsert: true, runValidators: true }
    );
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
