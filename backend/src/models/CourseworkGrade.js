const mongoose = require("mongoose");

const courseworkGradeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    attendanceMarks: { type: Number, default: null, min: 0, max: 10 },
    courseworkMarks: { type: Number, default: null, min: 0, max: 30 },
    finalExamMarks: { type: Number, default: null, min: 0, max: 60 },
    totalMarks: { type: Number, default: null, min: 0, max: 100 },
    finalGrade: { type: String, enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F", null], default: null }
  },
  { timestamps: true }
);

courseworkGradeSchema.index({ studentId: 1, sectionId: 1 }, { unique: true });

module.exports = mongoose.model("CourseworkGrade", courseworkGradeSchema);