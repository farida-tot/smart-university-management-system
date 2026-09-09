const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Saturday",
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday"
      ],
      required: true
    },

    slot: {
      type: Number,
      required: true,
      min: 1,
      max: 14
    },

    startTime: {
      type: String,
      required: true
    },

    endTime: {
      type: String,
      required: true
    },

    room: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const sectionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true
    },

    semester: {
      type: String,
      required: true,
      trim: true
    },

    sectionNumber: {
      type: String,
      required: true,
      trim: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    schedule: {
      type: [scheduleSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "A section must have at least one schedule entry"
      }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

sectionSchema.index(
  {
    courseId: 1,
    semester: 1,
    sectionNumber: 1
  },
  {
    unique: true
  }
);

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;