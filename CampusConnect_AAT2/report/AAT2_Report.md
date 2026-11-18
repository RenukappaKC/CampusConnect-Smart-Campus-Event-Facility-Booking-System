# FULL STACK TECHNOLOGIES – 22CSE71
## ALTERNATIVE ASSESSMENT TEST – 2 (AAT-2)
### AI-AUGMENTED DEVELOPMENT REPORT

**Project title:** AI-Assisted Code Review, Debugging, Security Hardening and Test Generation for CampusConnect – Smart Campus Event & Facility Booking System

**Student name:** ______________________________  
**University Seat Number (USN):** ______________________________  
**Semester / Section:** 7th Semester / ______  
**Course:** Full Stack Technologies – 22CSE71  
**Academic year:** 2026–2027  
**Date of submission:** ______________________________

---

## 1. TITLE OF THE ACTIVITY / PROBLEM

AI-assisted code review, debugging, security hardening and automated test generation for CampusConnect, a web application for campus facility booking and event registration.

The activity applies an AI assistant as a development aid to inspect a full-stack application, identify defects, verify them, implement focused corrections and create automated tests.

## 2. OBJECTIVE AND PROBLEM / TASK DESCRIPTION

### 2.1 Problem statement
Campus facilities are often requested through informal messages, paper registers or separate spreadsheets. This can cause double bookings, unclear approval status, manual event registration and inconsistent records. CampusConnect provides one portal for facility discovery, booking requests, administrator approval and event registration.

The software must also be checked for edge cases and security weaknesses. A normal successful booking does not prove that overlapping bookings, invalid time ranges, unauthorized administrator actions or unsafe user input are handled correctly.

### 2.2 Objectives
- Review the frontend, backend routes and reusable business logic.
- Identify defects and security risks using AI-assisted code review.
- Reproduce each reported issue before changing code.
- Keep booking validation and conflict detection in reusable server-side functions.
- Protect administrator-only operations with role checks.
- Hash passwords and use HttpOnly session cookies.
- Generate and run automated tests for booking validation and overlap logic.
- Compare expected behavior with actual results after fixes.
- Understand and document AI suggestions rather than accepting them blindly.

### 2.3 Task description
| Function / module | Input | Expected output |
|---|---|---|
| registerAccount | name, email, password | Student account created or validation error |
| login | email, password | Authenticated session or error |
| validateBooking | facility, date, times, attendees, purpose | Valid result or clear validation error |
| findBookingConflict | existing bookings and requested slot | Conflicting booking or null |
| createBooking | booking details | Pending booking or conflict response |
| updateBookingStatus | booking ID, status | Admin-approved/rejected booking |
| registerForEvent | event ID and signed-in user | Registration or capacity/duplicate error |
| createEvent | event details | New event or validation error |

## 3. AI TOOL(S) USED

**AI assistant:** Use an AI assistant such as ChatGPT or Claude to review the source, explain findings, suggest targeted changes and propose test cases.

**Development tools:** Node.js, npm, Visual Studio Code, browser developer tools and Git.

**Testing tools:** Node.js built-in test runner (`node:test`). Playwright is included as an optional browser-testing setup.

*Student must record the actual AI tool and version used during their own review. Do not claim an AI tool executed tests unless the student actually ran those tests.*

## 4. PROMPT(S) GIVEN TO THE AI TOOL

**Prompt 1 – Context and review request**

“I have a full-stack campus facility booking and event registration application built with HTML, CSS, vanilla JavaScript and Node.js. Review the source as a senior full-stack reviewer. Identify only reproducible logic defects, validation gaps, authorization problems and security issues. For each finding, provide the file, exact behavior, impact and a way to reproduce it.”

**Prompt 2 – Prove before fixing**

“For every reported defect, provide a minimal test or manual reproduction procedure. Do not assume a defect is real without evidence. Include boundary cases such as overlapping time slots, adjacent bookings, invalid times and non-admin access.”

**Prompt 3 – Targeted fixes**

“Suggest the smallest clear changes that fix confirmed defects. Keep reusable booking rules in a domain module. Validate data on the server, enforce role-based access and escape user-provided text before rendering.”

**Prompt 4 – Tests and verification**

“Generate Node.js built-in test-runner tests for booking validation, operating hours, attendee limits, purpose length, overlapping bookings and adjacent non-overlapping bookings. Explain how to run the tests and what each test proves.”

## 5. AI-GENERATED RESPONSE / SOLUTION

### 5.1 Review areas and risks to verify
| ID | Area | Risk / behavior to verify | Expected protection |
|---|---|---|---|
| D1 | Booking time validation | End time earlier than start time | Reject invalid range |
| D2 | Booking conflict logic | Two requests overlap for same facility/date | Reject overlapping request |
| D3 | Booking boundaries | Back-to-back bookings are incorrectly treated as conflicts | Allow adjacent slots |
| D4 | Admin API | Student attempts to approve a booking | Return 403 |
| D5 | Event registration | Same student registers more than once | Return 409 |
| D6 | User input | HTML-like input is rendered as markup | Escape output and validate server-side |

These are review scenarios and test targets. The student should record which ones were actually reproduced during their own execution.

### 5.2 Solution design
- `src/domain.js` contains booking validation, email normalization, text cleanup and conflict detection.
- `server.js` implements the REST API, authentication, role checks and JSON persistence.
- `public/app.js` renders the dashboard and sends requests to the API.
- `tests/domain.test.js` verifies the reusable business rules.

### 5.3 Automated test suite
The included test suite covers:
1. Valid booking.
2. End time earlier than start time.
3. Booking outside operating hours.
4. Invalid attendee count.
5. Short purpose text.
6. Overlapping booking.
7. Adjacent booking slots.
8. Different facility should not conflict.
9. Email normalization and format.
10. Basic user-text sanitization.

Run with `npm test`. Record the actual pass/fail count and attach a screenshot from your own terminal execution.

## 6. STUDENT'S ANALYSIS OF THE AI RESPONSE

The AI assistant can accelerate code inspection and test design, but its suggestions must be checked against the running application.

The student should:
- Read each suggested change and understand the reason.
- Run the reproduction procedure against the original version.
- Compare actual results with expected results.
- Reject changes that alter a required business rule without approval.
- Run the complete test suite after modifying code.
- Record any AI suggestion that was incomplete or incorrect.

**Student verification notes:**  
Original behavior observed: __________________________________________  
Fixes accepted or modified: __________________________________________  
Tests executed and results: __________________________________________  
Additional issues found manually: _____________________________________

## 7. MODIFICATIONS / IMPROVEMENTS MADE BY THE STUDENT

| No. | Improvement in the project | Purpose |
|---|---|---|
| 1 | Centralized booking validation in `src/domain.js` | Avoid duplicated rules |
| 2 | Added time-overlap detection | Prevent facility double booking |
| 3 | Added server-side role checks | Restrict admin actions |
| 4 | Added password hashing with scrypt | Avoid storing plain-text passwords |
| 5 | Added HttpOnly and SameSite session cookie | Reduce client-side session exposure |
| 6 | Added event capacity and duplicate-registration checks | Protect event registration rules |
| 7 | Escaped user-generated text in frontend | Reduce HTML injection risk |
| 8 | Added automated domain tests | Verify boundary cases |
| 9 | Added API documentation and README | Improve maintainability |
| 10 | Added responsive layout | Support desktop and mobile screens |

## 8. FINAL CODE / SOLUTION AND OUTPUT SCREENSHOTS

### 8.1 Main application
Run `npm start` and open `http://localhost:3000`.

### 8.2 Login and registration
The login screen supports student registration and sign-in. For demonstration, use the demo credentials listed in the README.

### 8.3 Student dashboard
The dashboard shows the signed-in user, booking count, pending requests and booking history.

### 8.4 Facility booking
A student selects a facility, date, start time, end time, attendee count and purpose. The server validates the request and checks overlapping bookings.

### 8.5 Administrator dashboard
The administrator can approve or reject pending requests and publish campus events.

### 8.6 Automated test evidence
Run:
```bash
npm test
```
**Insert your own screenshot of the terminal output here.**

### 8.7 Browser output evidence
**Insert your own screenshots here:**
- Figure 8.1: CampusConnect home page.
- Figure 8.2: Student login and dashboard.
- Figure 8.3: Facility booking form.
- Figure 8.4: Booking request in Pending state.
- Figure 8.5: Administrator approval queue.
- Figure 8.6: Event registration.
- Figure 8.7: Automated test results.

## 9. COMPARISON: WITHOUT AI vs WITH AI

| Aspect | Without AI assistance | With AI assistance |
|---|---|---|
| Finding defects | Manual inspection of each route and function | Structured review prompts suggest areas to inspect |
| Test design | Student writes each edge case from scratch | AI proposes boundary and negative test cases |
| Debugging | Search and experiment manually | AI explains likely causes and reproduction steps |
| Security review | Depends on prior security knowledge | AI can highlight common validation and authorization risks |
| Learning | Slower initial discovery | Faster feedback, provided suggestions are verified |
| Final correctness | Depends on manual checks | Still depends on student execution and verification |

## 10. CHALLENGES / LIMITATIONS OF AI

- AI suggestions may be plausible but incorrect; source code and runtime behavior must be checked.
- A passing unit test suite does not prove every browser workflow is correct.
- JSON file storage is suitable only for a small demonstration and is not a production database.
- In-memory sessions are lost when the server restarts.
- A production deployment needs HTTPS, persistent sessions, CSRF protection, rate limiting, audit logging and stronger operational controls.
- The AI cannot decide campus policy, such as which facilities require special approval.
- The student must understand and take responsibility for all submitted code.

## 11. LEARNING OUTCOMES AND CONCLUSION

### 11.1 Learning outcomes
- Full-stack architecture: understand how a browser frontend communicates with Node.js REST endpoints.
- Backend validation: enforce booking rules on the server rather than trusting browser controls.
- Conflict detection: understand interval overlap and adjacent time slots.
- Authentication and authorization: distinguish a signed-in user from an administrator.
- Security basics: password hashing, safe cookies, input validation and output escaping.
- Automated testing: use Node.js test runner to check normal and edge-case behavior.
- Responsible AI use: review, reproduce, modify and verify AI suggestions.

### 11.2 Conclusion
CampusConnect demonstrates a full-stack campus facility and event management workflow. AI-assisted review can help identify edge cases, security concerns and useful tests, but the final quality depends on the student's understanding and verification. The project combines a usable frontend, REST API, server-side validation, role-based actions and automated domain tests.

### 11.3 Future work
- Replace JSON storage with MySQL or PostgreSQL.
- Add email notifications for booking decisions.
- Add recurring bookings and calendar integration.
- Add QR-based event check-in.
- Add persistent session storage and password reset.
- Add end-to-end browser tests and deployment monitoring.
