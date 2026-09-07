const mongoose = require("mongoose");
const Course = require("../models/Course");
const Instructor = require("../models/Instructor");
const Section = require("../models/Section");
const Enrollment = require("../models/Enrollment");
const Department = require("../models/Department");

const getSlotTimes = (slot) => {
  const startMinutes = 8 * 60 + (Number(slot) - 1) * 45;
  const endMinutes = startMinutes + 45;
  const format = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return { startTime: format(startMinutes), endTime: format(endMinutes) };
};

const toMinutes = (value) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const schedulesOverlap = (first, second) => (
  first.day === second.day &&
  toMinutes(first.startTime) < toMinutes(second.endTime) &&
  toMinutes(second.startTime) < toMinutes(first.endTime)
);

const validateSchedule = (schedule) => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return "A section must have at least one schedule entry";
  }

  for (const entry of schedule) {
    if (!Number.isInteger(Number(entry.slot)) || Number(entry.slot) < 1 || Number(entry.slot) > 14) {
      return "Slot must be an integer from 1 to 14";
    }
    const slotTimes = getSlotTimes(entry.slot);
    const start = toMinutes(entry.startTime);
    const end = toMinutes(entry.endTime);

    if (start !== null && end !== null && (start !== toMinutes(slotTimes.startTime) || end !== toMinutes(slotTimes.endTime))) {
      return "Slot times must use the fixed 45-minute timetable";
    }
    if (start === null || end === null || start >= end) {
      return "Schedule times must use HH:mm and end after start";
    }
  }

  for (let index = 0; index < schedule.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < schedule.length; nextIndex += 1) {
      if (schedulesOverlap(schedule[index], schedule[nextIndex])) {
        return "A section cannot contain overlapping schedule entries";
      }
    }
  }

  return null;
};

const validateSection = async (data, sectionId) => {
  if (!mongoose.Types.ObjectId.isValid(data.courseId) || !mongoose.Types.ObjectId.isValid(data.instructorId)) {
    return "A valid course ID and instructor ID are required";
  }

  const [course, instructor] = await Promise.all([
    Course.findById(data.courseId),
    Instructor.findById(data.instructorId).populate("userId")
  ]);

  if (!course) {
    return "Course not found";
  }

  if (!await Department.exists({ _id: course.departmentId })) {
    return "Course department not found";
  }

  if (!instructor) {
    return "Instructor not found";
  }

  if (!instructor.userId || instructor.userId.role !== "instructor") {
    return "The linked user must have the instructor role";
  }

  if (String(course.departmentId) !== String(instructor.departmentId)) {
    return "Instructor and course must belong to the same department";
  }

  const scheduleError = validateSchedule(data.schedule);
  if (scheduleError) {
    return scheduleError;
  }

  const conflictingSections = await Section.find({
    _id: { $ne: sectionId },
    isActive: true,
    $or: [
      { instructorId: data.instructorId },
      ...data.schedule.map((entry) => ({
        "schedule.day": entry.day,
        "schedule.room": entry.room
      }))
    ]
  });

  for (const section of conflictingSections) {
    for (const existingEntry of section.schedule) {
      for (const entry of data.schedule) {
        if (!schedulesOverlap(entry, existingEntry)) continue;

        if (String(section.instructorId) === String(data.instructorId)) {
          return "Instructor already has another section at this time";
        }

        if (entry.room === existingEntry.room) {
          return "Room is already booked at this time";
        }
      }
    }
  }

  if (data.capacity !== undefined && data.capacity !== null) {
    const enrolledCount = await Enrollment.countDocuments({
      sectionId,
      status: "enrolled"
    });

    if (Number(data.capacity) < enrolledCount) {
      return "Capacity cannot be lower than the number of enrolled students";
    }
  }

  return null;
};

module.exports = {
  toMinutes,
  getSlotTimes,
  schedulesOverlap,
  validateSchedule,
  validateSection
};