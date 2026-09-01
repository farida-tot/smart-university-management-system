const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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

    date: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Only one attendance record for the same student,
// same section, and same day
attendanceSchema.index(
  {
    studentId: 1,
    sectionId: 1,
    date: 1
  },
  {
    unique: true
  }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;  