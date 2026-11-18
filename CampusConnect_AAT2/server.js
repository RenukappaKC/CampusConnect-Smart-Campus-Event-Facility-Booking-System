import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { URL } from "node:url";
import {
  validateBooking, findBookingConflict, normalizeEmail, isValidEmail,
  safeText, createId
} from "./src/domain.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "store.json");
const PORT = Number(process.env.PORT || 3000);
const sessions = new Map();

const seed = {
  users: [
    { id: "u-admin", name: "Campus Administrator", email: "admin@campus.test",
      passwordHash: hashPassword("Admin@123"), role: "admin" },
    { id: "u-student", name: "Demo Student", email: "student@campus.test",
      passwordHash: hashPassword("Student@123"), role: "student" }
  ],
  facilities: [
    { id: "f-101", name: "Seminar Hall A", type: "Seminar Hall", capacity: 120, location: "Academic Block", equipment: "Projector, sound system" },
    { id: "f-102", name: "Computer Lab 2", type: "Computer Lab", capacity: 60, location: "IT Block, Floor 2", equipment: "60 computers, projector" },
    { id: "f-103", name: "Conference Room", type: "Meeting Room", capacity: 24, location: "Admin Block", equipment: "Video conferencing" },
    { id: "f-104", name: "Classroom 301", type: "Classroom", capacity: 70, location: "Academic Block, Floor 3", equipment: "Smart board" }
  ],
  events: [
    { id: "e-201", title: "Tech Innovation Day", description: "Student project demonstrations and technical talks.", date: "2026-12-05", venue: "Seminar Hall A", capacity: 100, registrations: [] },
    { id: "e-202", title: "Career Readiness Workshop", description: "Resume, interview and placement preparation.", date: "2026-12-12", venue: "Conference Room", capacity: 24, registrations: [] }
  ],
  bookings: []
};

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function verifyPassword(password, stored) {
  const [salt, key] = String(stored || "").split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
function loadStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { throw new Error("Data file is invalid JSON. Back it up and restore a valid store.json."); }
}
let store = loadStore();
function saveStore() { fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2)); }

function send(res, status, payload, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers });
  res.end(JSON.stringify(payload));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) { reject(new Error("Request body too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error("Request body must be valid JSON")); }
    });
    req.on("error", reject);
  });
}
function getUser(req) {
  const token = req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith("campus_session="))?.split("=")[1];
  const userId = token ? sessions.get(token) : null;
  return store.users.find(u => u.id === userId) || null;
}
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }
function requireUser(req, res) {
  const user = getUser(req);
  if (!user) { send(res, 401, { error: "Please sign in to continue." }); return null; }
  return user;
}
function requireAdmin(req, res) {
  const user = requireUser(req, res);
  if (user && user.role !== "admin") { send(res, 403, { error: "Administrator access is required." }); return null; }
  return user;
}
function cookie(token, maxAge = 60 * 60 * 8) {
  return `campus_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === "POST /api/auth/register") {
    const body = await readBody(req);
    const name = safeText(body.name, 60);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    if (name.length < 2 || !isValidEmail(email) || password.length < 8) return send(res, 400, { error: "Enter a valid name and email. Password must contain at least 8 characters." });
    if (store.users.some(u => u.email === email)) return send(res, 409, { error: "An account with this email already exists." });
    const user = { id: createId("u"), name, email, passwordHash: hashPassword(password), role: "student" };
    store.users.push(user); saveStore();
    const token = randomBytes(32).toString("hex"); sessions.set(token, user.id);
    return send(res, 201, { user: publicUser(user) }, { "Set-Cookie": cookie(token) });
  }
  if (route === "POST /api/auth/login") {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const user = store.users.find(u => u.email === email);
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) return send(res, 401, { error: "Invalid email or password." });
    const token = randomBytes(32).toString("hex"); sessions.set(token, user.id);
    return send(res, 200, { user: publicUser(user) }, { "Set-Cookie": cookie(token) });
  }
  if (route === "POST /api/auth/logout") {
    const token = req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith("campus_session="))?.split("=")[1];
    if (token) sessions.delete(token);
    return send(res, 200, { message: "Signed out." }, { "Set-Cookie": cookie("", 0) });
  }
  if (route === "GET /api/auth/me") {
    const user = getUser(req);
    return send(res, 200, { user: user ? publicUser(user) : null });
  }
  if (route === "GET /api/facilities") return send(res, 200, { facilities: store.facilities });
  if (route === "GET /api/events") return send(res, 200, { events: store.events.map(({ registrations, ...e }) => ({ ...e, registeredCount: registrations.length })) });

  if (route === "GET /api/bookings") {
    const user = requireUser(req, res); if (!user) return;
    const bookings = user.role === "admin" ? store.bookings : store.bookings.filter(b => b.userId === user.id);
    return send(res, 200, { bookings: bookings.map(b => ({ ...b, userName: store.users.find(u => u.id === b.userId)?.name || "Unknown" })) });
  }
  if (route === "POST /api/bookings") {
    const user = requireUser(req, res); if (!user) return;
    const body = await readBody(req);
    const result = validateBooking(body);
    if (!result.ok) return send(res, 400, { error: result.error });
    const facility = store.facilities.find(f => f.id === body.facilityId);
    if (!facility) return send(res, 404, { error: "Selected facility was not found." });
    const conflict = findBookingConflict(store.bookings, body.facilityId, body.date, body.startTime, body.endTime);
    if (conflict) return send(res, 409, { error: "This facility is already booked for an overlapping time." });
    const booking = { id: createId("b"), userId: user.id, facilityId: facility.id, facilityName: facility.name,
      purpose: safeText(body.purpose, 180), date: body.date, startTime: body.startTime, endTime: body.endTime,
      attendees: Number(body.attendees), status: "Pending", createdAt: new Date().toISOString() };
    store.bookings.push(booking); saveStore();
    return send(res, 201, { booking });
  }
  if (route === "POST /api/events/register") {
    const user = requireUser(req, res); if (!user) return;
    const body = await readBody(req);
    const event = store.events.find(e => e.id === body.eventId);
    if (!event) return send(res, 404, { error: "Event not found." });
    if (event.registrations.includes(user.id)) return send(res, 409, { error: "You are already registered for this event." });
    if (event.registrations.length >= event.capacity) return send(res, 409, { error: "This event is full." });
    event.registrations.push(user.id); saveStore();
    return send(res, 201, { message: "Registration successful." });
  }
  if (route === "POST /api/admin/bookings/status") {
    const admin = requireAdmin(req, res); if (!admin) return;
    const body = await readBody(req);
    if (!["Approved", "Rejected"].includes(body.status)) return send(res, 400, { error: "Status must be Approved or Rejected." });
    const booking = store.bookings.find(b => b.id === body.bookingId);
    if (!booking) return send(res, 404, { error: "Booking not found." });
    if (body.status === "Approved") {
      const conflict = findBookingConflict(store.bookings.filter(b => b.id !== booking.id && b.status === "Approved"),
        booking.facilityId, booking.date, booking.startTime, booking.endTime);
      if (conflict) return send(res, 409, { error: "Another approved booking now conflicts with this request." });
    }
    booking.status = body.status; booking.reviewedBy = admin.id; booking.reviewedAt = new Date().toISOString(); saveStore();
    return send(res, 200, { booking });
  }
  if (route === "POST /api/admin/events") {
    const admin = requireAdmin(req, res); if (!admin) return;
    const body = await readBody(req);
    const title = safeText(body.title, 90), description = safeText(body.description, 300);
    if (title.length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(body.date || "") || !safeText(body.venue, 80) || !Number.isInteger(Number(body.capacity)) || Number(body.capacity) < 1 || Number(body.capacity) > 1000) {
      return send(res, 400, { error: "Provide a title, valid date, venue and capacity between 1 and 1000." });
    }
    const event = { id: createId("e"), title, description, date: body.date, venue: safeText(body.venue, 80), capacity: Number(body.capacity), registrations: [] };
    store.events.push(event); saveStore();
    return send(res, 201, { event: { ...event, registeredCount: 0 } });
  }
  return send(res, 404, { error: "API endpoint not found." });
}

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const filePath = path.resolve(PUBLIC_DIR, requested);
    if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== path.join(PUBLIC_DIR, "index.html")) return send(res, 403, { error: "Forbidden." });
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return send(res, 404, { error: "Page not found." });
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    send(res, 500, { error: error.message || "Unexpected server error." });
  }
});
server.listen(PORT, () => console.log(`CampusConnect running at http://localhost:${PORT}`));
export { server };
