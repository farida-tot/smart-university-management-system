const User = require("../models/User");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Section = require("../models/Section");
const Enrollment = require("../models/Enrollment");
const CourseRequest = require("../models/CourseRequest");
const CourseworkGrade = require("../models/CourseworkGrade");
const gradePointValues = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, D: 1, F: 0 };

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const student = await Student.findOne({
      userId: req.user.userId
    }).populate("departmentId", "name code");

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found"
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      student: {
        id: student._id,
        studentNumber: student.studentNumber,
        level: student.level,
        department: student.departmentId
      }
    });

  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Server error while getting profile"
    });
  }
};


const updateMyProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (name === undefined && email === undefined) {
      return res.status(400).json({
        message: "Nothing to update"
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty"
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          message: "Email cannot be empty"
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user.userId }
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Email already exists"
        });
      }

      updates.email = normalizedEmail;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Server error while updating profile"
    });
  }
};

const getMyDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId }).populate("userId departmentId");
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    const [enrollments, courseRequests, courses, courseworkGrades] = await Promise.all([
      Enrollment.find({ studentId: student._id }).populate({
        path: "sectionId",
        populate: [
          {
            path: "courseId",
            populate: {
              path: "departmentId",
              select: "name code"
            }
          },
          {
            path: "instructorId",
            populate: {
              path: "userId",
              select: "name email"
            }
          }
        ]
      }),
      CourseRequest.find({ studentId: student._id }).populate("courseId"),
      Course.find({ departmentId: student.departmentId._id }).populate("departmentId", "name code"),
      CourseworkGrade.find({ studentId: student._id })
    ]);
    const enrollmentData = enrollments.map((enrollment) => {
      const data = enrollment.toObject();
      const grade = courseworkGrades.find((item) => String(item.sectionId) === String(enrollment.sectionId?._id));
      data.attendanceMarks = grade?.attendanceMarks ?? null;
      data.courseworkMarks = grade?.courseworkMarks ?? null;
      data.finalExamMarks = grade?.finalExamMarks ?? null;
      data.totalMarks = grade?.totalMarks ?? null;
      data.finalGrade = enrollment.grade ?? grade?.finalGrade ?? null;
      data.gradePoints = enrollment.gradePoints ?? (grade?.finalGrade ? gradePointValues[grade.finalGrade] : null);
      data.result = data.finalGrade ? data.finalGrade === "F" ? "Failed" : "Passed" : null;
      return data;
    });
    const active = enrollmentData.filter((item) => ["enrolled", "completed"].includes(item.status));
    const graded = active.filter((item) => item.gradePoints !== null);
    const creditHours = active.reduce((total, item) => total + (item.sectionId?.courseId?.creditHours || 0), 0);
    const gradedCreditHours = graded.reduce((total, item) => total + (item.sectionId?.courseId?.creditHours || 0), 0);
    const gpa = gradedCreditHours ? graded.reduce((total, item) => total + item.gradePoints * (item.sectionId?.courseId?.creditHours || 0), 0) / gradedCreditHours : 0;
    const sections = await Section.find({ courseId: { $in: courses.map((course) => course._id) }, isActive: true }).populate([
      {
        path: "courseId",
        populate: {
          path: "departmentId",
          select: "name code"
        }
      },
      {
        path: "instructorId",
        populate: {
          path: "userId",
          select: "name email"
        }
      }
    ]);
    const myCourses = courseRequests.filter((request) => request.status === "approved").map((request) => ({
      ...request.courseId.toObject(),
      requestId: request._id,
      requestStatus: request.status,
      sections: sections.filter((section) => String(section.courseId._id) === String(request.courseId._id))
    }));
    res.status(200).json({ user: student.userId, student, gpa: Number(gpa.toFixed(2)), creditHours, enrollments: enrollmentData, myCourses, courseRequests, courses, sections });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestCourse = async (req, res) => {
  const student = await Student.findOne({ userId: req.user.userId });
  const course = await Course.findOne({ _id: req.params.courseId, departmentId: student?.departmentId });
  if (!student || !course) return res.status(404).json({ message: "Course is not available in your department" });
  try {
    res.status(201).json(await CourseRequest.create({ studentId: student._id, courseId: course._id }));
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "Course request already exists" : error.message });
  }
};

const requestSection = async (req, res) => {
  const student = await Student.findOne({ userId: req.user.userId });
  const section = await Section.findById(req.params.sectionId).populate("courseId");
  const requestType = req.body?.requestType === "change" ? "change" : "enrollment";

  if (!student || !section || String(section.courseId.departmentId) !== String(student.departmentId)) return res.status(404).json({ message: "Section not found" });
  if (!await CourseRequest.exists({ studentId: student._id, courseId: section.courseId._id, status: "approved" })) return res.status(403).json({ message: "The course must be approved before requesting a section" });

  try {
    if (requestType === "change") {
      const currentEnrollment = await Enrollment.findOne({
        studentId: student._id,
        status: { $in: ["enrolled", "completed"] },
        requestType: { $ne: "drop" }
      }).populate({ path: "sectionId", populate: { path: "courseId" } });

      if (!currentEnrollment || !currentEnrollment.sectionId?.courseId) {
        return res.status(400).json({ message: "You need an active section to request a change" });
      }

      if (String(currentEnrollment.sectionId.courseId._id) !== String(section.courseId._id)) {
        return res.status(409).json({ message: "Section change requests must stay within the same course and department" });
      }

      const existingRequest = await Enrollment.findOne({
        studentId: student._id,
        sectionId: section._id,
        requestType: "change",
        status: "pending"
      });

      if (existingRequest) return res.status(409).json({ message: "A pending change request already exists for this section" });

      const count = await Enrollment.countDocuments({ sectionId: section._id, status: { $in: ["pending", "enrolled"] } });
      if (count >= section.capacity) return res.status(409).json({ message: "This section is full" });

      const enrollment = await Enrollment.create({
        studentId: student._id,
        sectionId: section._id,
        previousSectionId: currentEnrollment.sectionId._id,
        requestType: "change",
        status: "pending"
      });

      return res.status(201).json(enrollment);
    }

    const sameCourse = await Enrollment.findOne({
      studentId: student._id,
      status: { $in: ["pending", "enrolled"] },
      requestType: { $ne: "drop" }
    }).populate({ path: "sectionId", populate: { path: "courseId" } });

    if (sameCourse?.sectionId?.courseId?._id && String(sameCourse.sectionId.courseId._id) === String(section.courseId._id)) {
      return res.status(409).json({ message: "You may enroll in only one section of this course" });
    }

    const count = await Enrollment.countDocuments({ sectionId: section._id, status: { $in: ["pending", "enrolled"] } });
    if (count >= section.capacity) return res.status(409).json({ message: "This section is full" });

    const existingRequest = await Enrollment.findOne({ studentId: student._id, sectionId: section._id, requestType: { $in: ["enrollment", "change"] } });
    const enrollment = existingRequest
      ? await Enrollment.findByIdAndUpdate(existingRequest._id, { status: "pending", requestType: "enrollment", enrolledAt: new Date() }, { new: true, runValidators: true })
      : await Enrollment.create({ studentId: student._id, sectionId: section._id, status: "pending", requestType: "enrollment" });

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "Section request already exists" : error.message });
  }
};

const dropEnrollment = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    const enrollment = student && await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    if (String(enrollment.studentId) !== String(student._id)) return res.status(403).json({ message: "You can only request to drop your own enrollment" });
    if (!["pending", "enrolled", "completed"].includes(enrollment.status) || enrollment.requestType === "drop") {
      return res.status(400).json({ message: "This enrollment cannot be dropped" });
    }

    const pendingDrop = await Enrollment.findOne({ studentId: student._id, sectionId: enrollment.sectionId, requestType: "drop", status: "pending" });
    if (pendingDrop) return res.status(409).json({ message: "A drop request for this section is already pending approval" });

    enrollment.status = "pending";
    enrollment.requestType = "drop";
    enrollment.previousSectionId = enrollment.sectionId;
    await enrollment.save();
    res.status(200).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyDashboard,
  requestCourse,
  requestSection,
  dropEnrollment
};