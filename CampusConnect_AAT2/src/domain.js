import { randomUUID } from "node:crypto";

export const normalizeEmail = value => String(value ?? "").trim().toLowerCase();
export const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const safeText = (value, max = 200) => String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
export const createId = prefix => `${prefix}-${randomUUID()}`;

const timeToMinutes = value => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value))) return NaN;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

export function validateBooking(body) {
  const date = String(body.date || "");
  const start = timeToMinutes(String(body.startTime || ""));
  const end = timeToMinutes(String(body.endTime || ""));
  const attendees = Number(body.attendees);
  if (!body.facilityId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    return { ok: false, error: "Select a facility and a valid date." };
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { ok: false, error: "End time must be later than start time." };
  if (start < 8 * 60 || end > 20 * 60) return { ok: false, error: "Bookings are available between 08:00 and 20:00." };
  if (!Number.isInteger(attendees) || attendees < 1 || attendees > 1000) return { ok: false, error: "Attendee count must be a whole number between 1 and 1000." };
  if (safeText(body.purpose, 180).length < 5) return { ok: false, error: "Purpose must contain at least 5 characters." };
  return { ok: true };
}

export function findBookingConflict(bookings, facilityId, date, startTime, endTime) {
  const start = timeToMinutes(startTime), end = timeToMinutes(endTime);
  return bookings.find(b => b.facilityId === facilityId && b.date === date &&
    ["Pending", "Approved"].includes(b.status) &&
    start < timeToMinutes(b.endTime) && end > timeToMinutes(b.startTime)) || null;
}
