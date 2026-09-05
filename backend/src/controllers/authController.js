const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Student = require("../models/Student");
const Department = require("../models/Department");

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      studentNumber,
      departmentId,
      level
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !studentNumber ||
      !departmentId ||
      level === undefined
    ) {
      return res.status(400).json({
        message:
          "Name, email, password, student number, department ID, and level are required"
      });
    }

    if (typeof password !== "string" || password.length < 6) {
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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStudentNumber = studentNumber.trim();

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
      message: "Student registered successfully",
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
    console.error("Registration error:", error);

    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(409).json({
          message: "An account with this email already exists. Please log in instead."
        });
      }

      if (error.keyPattern?.studentNumber) {
        return res.status(409).json({
          message: "Student number already exists"
        });
      }
    }

    res.status(500).json({
      message: "Server error during registration"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // 2. Normalize email
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
  register,
  login
};