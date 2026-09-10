const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("userId");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { name, studentNumber, departmentId, level, isActive } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      updates.name = name.trim();
    }

    if (studentNumber !== undefined) {
      const normalizedNumber = String(studentNumber).trim();

      if (!/^\d{8}$/.test(normalizedNumber)) {
        return res.status(400).json({
          message:
            "Student number must be exactly 8 digits. Email format: 8-digit ID + @stud.nu.edu"
        });
      }

      updates.studentNumber = normalizedNumber;
    }

    if (departmentId !== undefined) {
      if (!(await Department.exists({ _id: departmentId }))) {
        return res.status(400).json({ message: "Department not found" });
      }

      updates.departmentId = departmentId;
    }

    if (level !== undefined) updates.level = level;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("userId departmentId");

    if (updates.name !== undefined) {
      await User.findByIdAndUpdate(
        student.userId._id,
        { name: updates.name },
        { runValidators: true }
      );
    }

    if (updates.studentNumber !== undefined) {
      await User.findByIdAndUpdate(
        student.userId._id,
        {
          email: `${updates.studentNumber.toLowerCase()}@stud.nu.edu`
        },
        { runValidators: true }
      );
    }

    if (isActive !== undefined) {
      await User.findByIdAndUpdate(
        student.userId._id,
        { isActive },
        { runValidators: true }
      );
    }

    res.status(200).json(
      await Student.findById(updatedStudent._id).populate(
        "userId departmentId"
      )
    );
  } catch (error) {
    res
      .status(error.code === 11000 ? 409 : 400)
      .json({
        message:
          error.code === 11000
            ? "Student number already exists"
            : error.message
      });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Delete all data related to the student
    await Enrollment.deleteMany({
      studentId: student._id
    });

    await CourseRequest.deleteMany({
      studentId: student._id
    });

    await CourseworkGrade.deleteMany({
      studentId: student._id
    });

    await Attendance.deleteMany({
      studentId: student._id
    });

    // Delete student profile
    await Student.findByIdAndDelete(student._id);

    // Delete user account
    await User.findByIdAndDelete(student.userId);

    res.status(200).json({
      message: "Student and all related data deleted successfully"
    });
  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      message: "Server error while deleting student"
    });
  }
};

const getOverview = async (req, res) => {
  try {
    const [
      departments,
      users,
      instructors,
      students,
      courses,
      sections,
      enrollments,
      courseRequests
    ] = await Promise.all([
      Department.find().sort({ code: 1 }),

      User.find({
        role: { $in: ["student", "instructor"] }
      })
        .select("-password")
        .sort({ name: 1 }),

      Instructor.find({ isActive: { $ne: false } })
        .populate("userId departmentId")
        .sort({ employeeNumber: 1 }),

      Student.find({ isActive: { $ne: false } })
        .populate("userId departmentId")
        .sort({ studentNumber: 1 }),

      Course.find()
        .populate("departmentId", "name code")
        .sort({ code: 1 }),

      Section.find()
        .populate({
          path: "courseId",
          populate: { path: "departmentId" }
        })
        .populate({
          path: "instructorId",
          populate: { path: "userId departmentId" }
        })
        .sort({ semester: -1, sectionNumber: 1 }),

      Enrollment.find().populate("studentId sectionId"),

      CourseRequest.find({ status: "pending" }).populate(
        "studentId courseId"
      )
    ]);

    res.status(200).json({
      departments,
      users,
      instructors,
      students,
      courses,
      sections,
      enrollments,
      courseRequests
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const reviewCourseRequest = async (req, res) => {
  const request = await CourseRequest.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      reviewedAt: new Date()
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!request) {
    return res.status(404).json({
      message: "Course request not found"
    });
  }

  res.status(200).json(request);
};

const reviewEnrollment = async (req, res) => {
  const status =
    req.body.status === "approved"
      ? "approved"
      : req.body.status === "rejected"
      ? "rejected"
      : null;

  if (!status) {
    return res.status(400).json({
      message: "Status must be approved or rejected"
    });
  }

  const enrollment = await Enrollment.findById(req.params.id).populate({
    path: "sectionId",
    populate: {
      path: "courseId"
    }
  });

  if (!enrollment) {
    return res.status(404).json({
      message: "Enrollment request not found"
    });
  }

  if (enrollment.requestType === "drop") {
    enrollment.status =
      status === "approved" ? "dropped" : "enrolled";

    await enrollment.save();

    return res.status(200).json(enrollment);
  }

  enrollment.status =
    status === "approved" ? "enrolled" : "rejected";

  await enrollment.save();

  res.status(200).json(enrollment);
};

module.exports = {
  getOverview,
  reviewCourseRequest,
  reviewEnrollment,
  updateStudent,
  deleteStudent
};