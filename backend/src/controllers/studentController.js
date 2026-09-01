const User = require("../models/User");
const Student = require("../models/Student");

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

module.exports = {
  getMyProfile,
  updateMyProfile
};