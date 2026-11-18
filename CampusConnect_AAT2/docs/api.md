# CampusConnect REST API

All request bodies use JSON. Authentication uses an HttpOnly session cookie.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a student account |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/logout` | Signed in | Sign out |
| GET | `/api/auth/me` | Public | Return current session user |
| GET | `/api/facilities` | Public | List facilities |
| GET | `/api/events` | Public | List events and registration counts |
| GET | `/api/bookings` | Signed in | Student's bookings or all bookings for admin |
| POST | `/api/bookings` | Signed in | Request a facility booking |
| POST | `/api/events/register` | Signed in | Register for an event |
| POST | `/api/admin/bookings/status` | Admin | Approve or reject a booking |
| POST | `/api/admin/events` | Admin | Publish an event |

## Booking request example
```json
{
  "facilityId": "f-101",
  "date": "2026-12-01",
  "startTime": "10:00",
  "endTime": "11:00",
  "attendees": 20,
  "purpose": "Student club meeting"
}
```

## Important responses
- `400`: invalid input
- `401`: not signed in
- `403`: signed in but not an administrator
- `404`: requested resource not found
- `409`: duplicate email, duplicate event registration, or booking conflict
- `201`: resource created
- `200`: successful read/update
