const mongoose = require("mongoose");

const courseRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

courseRequestSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("CourseRequest", courseRequestSchema);
