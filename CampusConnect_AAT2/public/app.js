const $ = selector => document.querySelector(selector);
const state = { user: null, facilities: [], events: [], mode: "login" };
const api = async (url, options = {}) => {
  const response = await fetch(url, { credentials: "same-origin", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
};
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
const toast = message => { const el = $("#toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); };
function setAuthMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  $("#nameWrap").classList.toggle("hidden", mode !== "register");
  $("#authSubmit").textContent = mode === "register" ? "Create account" : "Sign in";
}
document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => setAuthMode(button.dataset.mode)));
$("#authForm").addEventListener("submit", async event => {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  const body = Object.fromEntries(form.entries());
  try {
    const result = await api(`/api/auth/${state.mode === "register" ? "register" : "login"}`, { method: "POST", body: JSON.stringify(body) });
    state.user = result.user; $("#authMessage").textContent = ""; await refresh();
    toast(`Welcome, ${state.user.name}`);
  } catch (error) { $("#authMessage").textContent = error.message; }
});
$("#logoutBtn").addEventListener("click", async () => { await api("/api/auth/logout", { method: "POST" }); state.user = null; await refresh(); toast("You have signed out."); });
async function loadPublic() {
  const [facilities, events] = await Promise.all([api("/api/facilities"), api("/api/events")]);
  state.facilities = facilities.facilities; state.events = events.events;
  $("#facilityGrid").innerHTML = state.facilities.map((f, i) => `<article class="facility-card"><div class="facility-icon">${["🏛️","💻","🤝","📚"][i % 4]}</div><h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.equipment)}</p><div class="facility-meta">${escapeHtml(f.type)} · ${f.capacity} seats</div><p>📍 ${escapeHtml(f.location)}</p></article>`).join("");
  $("#facilitySelect").innerHTML = `<option value="">Choose a facility</option>` + state.facilities.map(f => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)} · ${f.capacity} seats</option>`).join("");
  $("#eventGrid").innerHTML = state.events.map(e => `<article class="event-card"><div class="event-date">${escapeHtml(new Date(`${e.date}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}))}</div><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.description)}</p><p>📍 ${escapeHtml(e.venue)} · ${e.registeredCount}/${e.capacity} registered</p><button class="btn btn-primary" data-register="${escapeHtml(e.id)}">Register interest →</button></article>`).join("");
}
async function refresh() {
  await loadPublic();
  const signedIn = Boolean(state.user);
  $("#authPanel").classList.toggle("hidden", signedIn);
  $("#dashboard").classList.toggle("hidden", !signedIn);
  $("#logoutBtn").classList.toggle("hidden", !signedIn);
  $("#bookingForm").querySelectorAll("input,select,textarea,button").forEach(el => el.disabled = !signedIn);
  if (!signedIn) { $("#adminPanel").classList.add("hidden"); $("#eventForm").classList.add("hidden"); return; }
  $("#welcomeTitle").textContent = `Hello, ${state.user.name.split(" ")[0]}`;
  $("#rolePill").textContent = state.user.role === "admin" ? "Administrator" : "Student";
  const [{ bookings }] = await Promise.all([api("/api/bookings")]);
  $("#statBookings").textContent = bookings.length;
  $("#statPending").textContent = bookings.filter(b => b.status === "Pending").length;
  $("#statEvents").textContent = state.events.length;
  $("#bookingList").innerHTML = bookings.length ? bookings.map(b => `<div class="booking-row"><div><b>${escapeHtml(b.facilityName)}</b><small>${escapeHtml(b.date)} · ${escapeHtml(b.startTime)}–${escapeHtml(b.endTime)} · ${escapeHtml(b.purpose)}</small></div><span class="status ${b.status}">${b.status}</span></div>`).join("") : `<p class="muted">No bookings yet. Submit your first facility request below.</p>`;
  const isAdmin = state.user.role === "admin";
  $("#adminPanel").classList.toggle("hidden", !isAdmin); $("#eventForm").classList.toggle("hidden", !isAdmin);
  if (isAdmin) {
    const all = bookings;
    $("#adminQueue").innerHTML = all.length ? all.map(b => `<div class="booking-row"><div><b>${escapeHtml(b.facilityName)} · ${escapeHtml(b.userName)}</b><small>${escapeHtml(b.date)} · ${escapeHtml(b.startTime)}–${escapeHtml(b.endTime)} · ${escapeHtml(b.purpose)}</small></div><div class="mini-actions"><span class="status ${b.status}">${b.status}</span>${b.status === "Pending" ? `<button data-status="Approved" data-id="${b.id}">Approve</button><button data-status="Rejected" data-id="${b.id}">Reject</button>` : ""}</div></div>`).join("") : `<p class="muted">No booking requests to review.</p>`;
  }
}
$("#bookingForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!state.user) return toast("Please sign in before booking.");
  const body = Object.fromEntries(new FormData(event.currentTarget).entries()); body.attendees = Number(body.attendees);
  try { await api("/api/bookings", { method: "POST", body: JSON.stringify(body) }); $("#bookingMessage").textContent = "Booking request submitted for admin review."; event.currentTarget.reset(); await refresh(); }
  catch (error) { $("#bookingMessage").textContent = error.message; }
});
$("#eventGrid").addEventListener("click", async event => {
  const button = event.target.closest("[data-register]"); if (!button) return;
  if (!state.user) { toast("Sign in to register for an event."); $("#authPanel").scrollIntoView(); return; }
  try { await api("/api/events/register", { method: "POST", body: JSON.stringify({ eventId: button.dataset.register }) }); toast("Event registration successful."); await refresh(); }
  catch (error) { toast(error.message); }
});
$("#adminQueue").addEventListener("click", async event => {
  const button = event.target.closest("[data-status]"); if (!button) return;
  try { await api("/api/admin/bookings/status", { method: "POST", body: JSON.stringify({ bookingId: button.dataset.id, status: button.dataset.status }) }); toast(`Booking ${button.dataset.status.toLowerCase()}.`); await refresh(); }
  catch (error) { toast(error.message); }
});
$("#eventForm").addEventListener("submit", async event => {
  event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget).entries()); body.capacity = Number(body.capacity);
  try { await api("/api/admin/events", { method: "POST", body: JSON.stringify(body) }); $("#eventMessage").textContent = "Event published."; event.currentTarget.reset(); await refresh(); }
  catch (error) { $("#eventMessage").textContent = error.message; }
});
(async () => {
  try { const me = await api("/api/auth/me"); state.user = me.user; await refresh(); }
  catch { await refresh(); }
  const date = new Date(); date.setDate(date.getDate() + 1); $("#bookingForm [name=date]").min = date.toISOString().slice(0,10);
})();