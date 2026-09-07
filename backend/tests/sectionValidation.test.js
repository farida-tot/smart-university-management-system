const test = require("node:test");
const assert = require("node:assert/strict");
const { toMinutes, schedulesOverlap, validateSchedule, getSlotTimes } = require("../src/utils/sectionValidation");

test("schedule validation uses the fixed 45-minute slots", () => {
  assert.equal(toMinutes("09:30"), 570);
  assert.deepEqual(getSlotTimes(1), { startTime: "08:00", endTime: "08:45" });
  assert.equal(validateSchedule([
    { day: "Monday", slot: 15, room: "A1" }
  ]), "Slot must be an integer from 1 to 14");
});

test("schedule overlap detects same-day collisions only", () => {
  const first = { day: "Monday", startTime: "09:00", endTime: "10:00", room: "A1" };
  const overlapping = { day: "Monday", startTime: "09:30", endTime: "10:30", room: "A2" };
  const differentDay = { day: "Tuesday", startTime: "09:30", endTime: "10:30", room: "A1" };
  assert.equal(schedulesOverlap(first, overlapping), true);
  assert.equal(schedulesOverlap(first, differentDay), false);
});