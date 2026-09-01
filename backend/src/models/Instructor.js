const mongoose = require("mongoose");

const instructorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    employeeNumber: {
      type: String,
      required: [true, "Employee number is required"],
      unique: true,
      trim: true
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Instructor = mongoose.model("Instructor", instructorSchema);

module.exports = Instructor;