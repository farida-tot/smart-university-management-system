const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{2,5}[0-9]{2,4}$/, "Course code must look like CS01 or CS301"]
    },

    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    creditHours: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },

    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
      }
    ]
  },
  {
    timestamps: true
  }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;