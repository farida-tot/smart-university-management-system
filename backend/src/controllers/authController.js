const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Student = require("../models/Student");
const Instructor = require("../models/Instructor");
const Department = require("../models/Department");

const createStudent = async (req, res) => {
  try {
    const {
      name,
      password,
      studentNumber,
      departmentId,
      level
    } = req.body;

    if (
      !name ||
      !password ||
      !studentNumber ||
      !departmentId ||
      level === undefined
    ) {
      return res.status(400).json({
        message:
          "Name, password, student number, department ID, and level are required"
      });
    }

    if (typeof password !== "string" || password.trim() !== password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    if (level < 1 || level > 4) {
      return res.status(400).json({
        message: "Level must be between 1 and 4"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        message: "A valid department ID is required"
      });
    }

    const normalizedStudentNumber = studentNumber.trim();
    if (!/^\d{8}$/.test(normalizedStudentNumber)) {
      return res.status(400).json({
        message: "Student number must be exactly 8 digits. Email format: 8-digit ID + @stud.nu.edu"
      });
    }
    const normalizedEmail = `${normalizedStudentNumber.toLowerCase()}@stud.nu.edu`;

    const [existingUser, existingStudent] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Student.findOne({ studentNumber: normalizedStudentNumber })
    ]);

    const conflictMessages = [];

    if (existingUser) {
      conflictMessages.push(
        "An account with this email already exists. Please log in instead."
      );
    }

    if (existingStudent) {
      conflictMessages.push("Student number already exists.");
    }

    if (conflictMessages.length > 0) {
      return res.status(409).json({
        message: conflictMessages.join(" ")
      });
    }

    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(400).json({
        message: "Department not found"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "student"
    });

    let student;

    try {
      student = await Student.create({
        userId: user._id,
        studentNumber: normalizedStudentNumber,
        departmentId,
        level
      });
    } catch (error) {
      await User.findByIdAndDelete(user._id);

      if (error.code === 11000 && error.keyPattern?.studentNumber) {
        return res.status(409).json({
          message: "Student number already exists"
        });
      }

      throw error;
    }

    res.status(201).json({
      message: "Student account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      student: {
        id: student._id,
        studentNumber: student.studentNumber,
        departmentId: student.departmentId,
        level: student.level
      }
    });
  } catch (error) {
    console.error("Student creation error:", error);

    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(409).json({
          message: "An account with this student number already exists"
        });
      }

      if (error.keyPattern?.studentNumber) {
        return res.status(409).json({
          message: "Student number already exists"
        });
      }
    }

    res.status(500).json({
      message: "Server error while creating student account"
    });
  }
};

const createInstructor = async (req, res) => {
  try {
    const { name, employeeNumber, password, departmentId } = req.body;
    if (!name || !employeeNumber || !password || !departmentId) {
      return res.status(400).json({ message: "Name, employee number, password, and department ID are required" });
    }
    if (typeof password !== "string" || password.trim() !== password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!await Department.exists({ _id: departmentId })) {
      return res.status(400).json({ message: "Department not found" });
    }

    const normalizedEmployeeNumber = employeeNumber.trim().toLowerCase().replace(/@gov\.nu\.edu$/, "");
      if (!/^\d{8}$/.test(normalizedEmployeeNumber)) {
      return res.status(400).json({
        message: "Employee number must be exactly 8 digits. Email format: 8-digit ID + @gov.nu.edu"
      });
    }
    const email = `${normalizedEmployeeNumber}@gov.nu.edu`;
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with this employee number already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email,
      password: await bcrypt.hash(password, 10),
      role: "instructor"
    });

    try {
      const instructor = await Instructor.create({
        userId: user._id,
        employeeNumber: normalizedEmployeeNumber,
        departmentId
      });
      res.status(201).json({
        message: "Instructor account created successfully",
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        instructor
      });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    console.error("Instructor creation error:", error);
    res.status(error.code === 11000 ? 409 : 400).json({
      message: error.code === 11000 ? "Employee number already exists" : error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User.findById(req.user.userId).select("+password");
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error while changing password" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Validate input
    if (!email || !password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    //Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find user
    // password is select:false in User schema,
    // so explicitly select it here
    const user = await User.findOne({
      email: normalizedEmail
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const validEmailDomain = user.role === "student"
      ? /^[0-9]+@stud\.nu\.edu$/.test(normalizedEmail)
      : user.role === "instructor" || user.role === "admin"
        ? /^[0-9]+@gov\.nu\.edu$/.test(normalizedEmail)
        : false;

    if (!validEmailDomain) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is inactive"
      });
    }

    // 5. Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // 6. Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    // 7. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login"
    });
  }
};

module.exports = {
  createStudent,
  createInstructor,
  changePassword,
  login
};