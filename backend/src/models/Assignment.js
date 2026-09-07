const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    deadline: { type: Date, default: null },
    deadline: { type: Date, required: false, default: null },
    originalName: { type: String, required: true },
    storageName: { type: String, required: true, unique: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true, enum: ["application/pdf"] },
    size: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);