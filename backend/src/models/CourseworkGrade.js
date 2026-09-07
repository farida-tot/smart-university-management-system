const mongoose = require("mongoose");

const courseworkGradeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    courseworkMarks: { type: Number, required: true, min: 1, max: 40 },
    finalExamMarks: { type: Number, required: true, min: 1, max: 60 },
    totalMarks: { type: Number, required: true, min: 2, max: 100 },
    finalGrade: { type: String, enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"], required: true }
  },
  { timestamps: true }
);

courseworkGradeSchema.index({ studentId: 1, sectionId: 1 }, { unique: true });

module.exports = mongoose.model("CourseworkGrade", courseworkGradeSchema);