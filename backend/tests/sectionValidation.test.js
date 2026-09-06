const test = require("node:test");
const assert = require("node:assert/strict");
const { toMinutes, schedulesOverlap, validateSchedule } = require("../src/utils/sectionValidation");

test("schedule validation requires valid ordered HH:mm times", () => {
  assert.equal(toMinutes("09:30"), 570);
  assert.equal(validateSchedule([
    { day: "Monday", startTime: "10:00", endTime: "09:00", room: "A1" }
  ]), "Schedule times must use HH:mm and end after start");
});

test("schedule overlap detects same-day collisions only", () => {
  const first = { day: "Monday", startTime: "09:00", endTime: "10:00", room: "A1" };
  const overlapping = { day: "Monday", startTime: "09:30", endTime: "10:30", room: "A2" };
  const differentDay = { day: "Tuesday", startTime: "09:30", endTime: "10:30", room: "A1" };
  assert.equal(schedulesOverlap(first, overlapping), true);
  assert.equal(schedulesOverlap(first, differentDay), false);
});