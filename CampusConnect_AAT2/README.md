# CampusConnect – Smart Campus Event & Facility Booking System

A complete Full Stack Technologies AAT-2 project. CampusConnect lets students request campus facility bookings and register for events. Administrators review requests and publish events.

## Technology
- Frontend: HTML5, CSS3, vanilla JavaScript (ES modules)
- Backend: Node.js native HTTP server and REST API
- Storage: JSON file (`data/store.json`)
- Security: password hashing with `scrypt`, HttpOnly/SameSite session cookie, role checks, input validation, output escaping, security headers
- Testing: Node.js built-in test runner; optional Playwright browser tests

## Requirements
- Node.js 20 or later (Node 22 recommended)
- npm

## Run the project
1. Extract the ZIP.
2. Open a terminal in the `CampusConnect_AAT2` folder.
3. Run `npm install` (needed only to install the optional Playwright test dependency).
4. Run `npm start`.
5. Open `http://localhost:3000`.

The application itself uses Node.js built-in modules and does not require third-party runtime packages.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Student | student@campus.test | Student@123 |
| Administrator | admin@campus.test | Admin@123 |

Change demo passwords and use a production database before deployment. Demo credentials are only for local assessment.

## Main workflow
1. Sign in as a student.
2. Browse facilities and submit a booking request.
3. Open the dashboard to see its Pending status.
4. Sign out and sign in as the administrator.
5. Approve or reject the request in the review queue.
6. Create an event using the admin form.
7. Sign in as a student and register for an event.

## Run unit tests
```bash
npm test
```
The test suite covers valid booking data, invalid time ranges, opening hours, attendee limits, purpose validation, overlapping bookings, adjacent bookings, facility separation, email normalization and basic text sanitization.

## Optional browser tests
Install the development dependency and browser:
```bash
npm install
npx playwright install chromium
```
Start the app in another terminal:
```bash
npm start
```
Then run:
```bash
npm run test:browser
```

## Project structure
```text
CampusConnect_AAT2/
├── data/
│   └── store.json             # created automatically on first run
├── public/
│   ├── app.js                 # frontend interactions and API calls
│   ├── index.html             # UI
│   └── styles.css             # responsive styling
├── src/
│   └── domain.js              # reusable validation and booking rules
├── tests/
│   └── domain.test.js         # automated unit tests
├── docs/
│   └── api.md                 # REST API reference
├── report/
│   └── AAT2_Report.md         # report following the uploaded PDF structure
├── package.json
└── server.js
```

## Important implementation notes
- Pending and approved bookings both reserve a time slot to avoid duplicate requests.
- The server rechecks conflicts when an administrator approves a request.
- The frontend escapes user-provided text before inserting it into HTML.
- The backend validates every booking; frontend validation alone is not trusted.
- Sessions are stored in memory, so restarting the server signs users out.
- JSON storage is appropriate for a small academic demo, not concurrent production traffic. A relational database, persistent session store, CSRF protection strategy, HTTPS, rate limiting and audit logging should be added before real deployment.
