const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true
    },

    requestType: {
      type: String,
      enum: ["enrollment", "drop"],
      default: "enrollment"
    },

    status: {
      type: String,
      enum: ["pending", "enrolled", "rejected", "dropped", "completed"],
      default: "pending"
    },

    grade: {
      type: String,
      enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F", null],
      default: null
    },

    gradePoints: {
      type: Number,
      default: null,
      min: 0,
      max: 4
    },

    enrolledAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate enrollment in the same section
enrollmentSchema.index(
  {
    studentId: 1,
    sectionId: 1
  },
  {
    unique: true
  }
);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;