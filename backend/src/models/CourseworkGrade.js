const mongoose = require("mongoose");

const courseworkGradeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    marks: { type: Number, required: true, min: 0, max: 40 }
  },
  { timestamps: true }
);

courseworkGradeSchema.index({ studentId: 1, sectionId: 1 }, { unique: true });

module.exports = mongoose.model("CourseworkGrade", courseworkGradeSchema);