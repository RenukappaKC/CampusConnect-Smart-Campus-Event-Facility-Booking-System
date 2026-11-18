import test from "node:test";
import assert from "node:assert/strict";
import { validateBooking, findBookingConflict, normalizeEmail, isValidEmail, safeText } from "../src/domain.js";

const valid = { facilityId: "f-101", date: "2026-12-01", startTime: "10:00", endTime: "11:00", attendees: 20, purpose: "Student club meeting" };

test("accepts a valid booking request", () => assert.equal(validateBooking(valid).ok, true));
test("rejects an end time earlier than start time", () => assert.match(validateBooking({ ...valid, endTime: "09:00" }).error, /later/));
test("rejects bookings outside campus operating hours", () => assert.match(validateBooking({ ...valid, startTime: "07:00" }).error, /08:00/));
test("rejects invalid attendee counts", () => assert.match(validateBooking({ ...valid, attendees: 0 }).error, /Attendee/));
test("rejects a short purpose", () => assert.match(validateBooking({ ...valid, purpose: "Hi" }).error, /5 characters/));
test("detects overlapping bookings for the same facility and date", () => {
  const existing = [{ facilityId: "f-101", date: valid.date, startTime: "10:30", endTime: "11:30", status: "Pending" }];
  assert.ok(findBookingConflict(existing, "f-101", valid.date, "10:00", "11:00"));
});
test("allows adjacent bookings without overlap", () => {
  const existing = [{ facilityId: "f-101", date: valid.date, startTime: "10:00", endTime: "11:00", status: "Approved" }];
  assert.equal(findBookingConflict(existing, "f-101", valid.date, "11:00", "12:00"), null);
});
test("does not conflict with a different facility", () => {
  const existing = [{ facilityId: "f-102", date: valid.date, startTime: "10:00", endTime: "11:00", status: "Approved" }];
  assert.equal(findBookingConflict(existing, "f-101", valid.date, "10:00", "11:00"), null);
});
test("normalizes email and validates format", () => {
  assert.equal(normalizeEmail("  STUDENT@CAMPUS.TEST "), "student@campus.test");
  assert.equal(isValidEmail("student@campus.test"), true);
  assert.equal(isValidEmail("not-an-email"), false);
});
test("strips HTML angle brackets from user text", () => assert.equal(safeText("<script>alert(1)</script>"), "scriptalert(1)/script"));
