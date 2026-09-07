# Manual MongoDB Compass Setup

The application does not require seed files. Insert the documents manually in Compass, keeping the references consistent.

## Insert order

1. `departments`
2. `users`
3. `instructors`
4. `courses`
5. `sections`
6. `students`
7. `enrollments`
8. `attendance` (optional)
9. `courseworkgrades` (optional)

Use ObjectId values from the records you create. Do not paste an ObjectId as a string; select `ObjectId` in Compass.

Compass's **Insert Document** dialog accepts JSON in its JSON view. Use Extended JSON for IDs:

```json
{
  "userId": { "$oid": "66c0f2000000000000000001" },
  "employeeNumber": "1001",
  "departmentId": { "$oid": "66c0f0000000000000000001" },
  "isActive": true
}
```

Do not paste shell syntax such as `ObjectId("...")`, do not leave a comma after the final field, and do not include Markdown fences or triple quotes inside the Compass editor. If using Compass's shell view instead, `ObjectId("...")` is valid there.

## Create a password hash

Passwords must be bcrypt hashes. Do not insert a plaintext password into the `users` collection. From the `backend` directory, run:

```powershell
node -e "require('bcryptjs').hash('Password123!', 10).then(console.log)"
```

Copy the printed hash into the user's `password` field.

## Admin account

The repository includes a convenience script at `backend/scripts/createAdmin.js`.
It creates the following administrator when the account does not already exist:

- Email: `admin@gov.nu.edu`
- Password: `Admin123`
- Role: `admin`

From the `backend` directory, after configuring `MONGO_URI`, run:

```powershell
npm run create-admin
```

The script stores a bcrypt hash, not the plaintext password, and is safe to run
again because it skips an existing `admin@gov.nu.edu` account. Set
`ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` to use different bootstrap
credentials. The admin can also use the Angular admin dashboard at
`/admin/dashboard` after signing in.

- `/api/instructors`
- `/api/courses` for create, update, and delete
- `/api/sections` for create, update, and delete

Courses can be viewed by all authenticated roles. Instructor and student
operations are protected separately by the role middleware.

## Instructor and student accounts

The admin creates both account types from `/admin/dashboard`, or through these
protected endpoints:

- `POST /api/auth/instructors`
- `POST /api/auth/students`


For Compass-only setup, create an instructor `users` document first:

```json
{
  "name": "Dr. Lina Hassan",
  "email": "1001@gov.nu.edu",
  "password": "PASTE_BCRYPT_HASH_HERE",
  "role": "instructor",
```

Then create the linked `instructors` document:

```json
{
  "userId": { "$oid": "USER_ID_FROM_COMPASS" },
  "employeeNumber": "1001",
  "departmentId": { "$oid": "DEPARTMENT_ID_FROM_COMPASS" },
  "isActive": true
}
```

The instructor email must be exactly `employeeNumber@gov.nu.edu`.

For manual insertion, create a student `users` document with `role: "student"`, then create the linked `students` document. The password must be a bcrypt hash and the email must be exactly `studentNumber@stud.nu.edu`:

```json
{
  "userId": { "$oid": "USER_ID_FROM_COMPASS" },
  "studentNumber": "2024001",
  "departmentId": { "$oid": "DEPARTMENT_ID_FROM_COMPASS" },
  "level": 3
}
```

## Course and section

The course department must match the instructor department:

```json
{
  "code": "CS301",
  "name": "Database Systems",
  "description": "Relational modeling and SQL.",
  "creditHours": 3,
  "departmentId": { "$oid": "DEPARTMENT_ID_FROM_COMPASS" },
  "prerequisites": []
}
```

Create the section through `POST /api/sections` where possible, because the API checks course existence, instructor role, department ownership, time ordering, room conflicts, and instructor conflicts:

```json
{
  "courseId": "COURSE_ID",
  "instructorId": "INSTRUCTOR_ID",
  "semester": "Fall 2026",
  "sectionNumber": "S1",
  "capacity": 30,
  "schedule": [
    {
      "day": "Sunday",
      "slot": 3,
      "room": "B201"
    }
  ]
}
```

Slots are fixed at 45 minutes: slot 1 is 08:00-08:45 and slot 14 is
17:45-18:30. The API derives `startTime` and `endTime`; clients should send
only `day`, `slot`, and `room`.

`courseId + semester + sectionNumber` must be unique.

## Enrollment

Create an enrollment only after both the student and section exist:

```json
{
  "studentId": { "$oid": "STUDENT_ID_FROM_COMPASS" },
  "sectionId": { "$oid": "SECTION_ID_FROM_COMPASS" },
  "status": "enrolled",
  "grade": null,
  "gradePoints": null,
  "enrolledAt": { "$date": "2026-09-06T09:00:00.000Z" }
}
```

The dashboard only counts enrollments whose status is `enrolled`.

## Test sequence

1. Start MongoDB and the backend.
2. Run `npm run create-admin` from `backend`.
3. Log in as the admin at `POST /api/auth/login` using `admin@gov.nu.edu` and `Admin123`.
4. Open `/admin/dashboard` and create a department, instructor account, student account, course, and section. The section API rejects room, time, instructor, and department conflicts.
5. Create an `enrollments` document in Compass with `status: "enrolled"`, linking the student and section.
7. Log in as the instructor at `POST /api/auth/login`.
8. Call `GET /api/instructors/me/dashboard` with the instructor bearer token. Confirm the course, section, roster, and department appear.
9. Record attendance with `PUT /api/instructors/me/sections/:sectionId/attendance`.
10. Record grades with `PUT /api/instructors/me/sections/:sectionId/students/:studentId/coursework`, using coursework marks from `1` to `40` and final exam marks from `1` to `60`. The API calculates the total and final letter grade.
11. Upload an assignment with `POST /api/assignments/courses/:courseId` as multipart form data using field name `file` and a PDF file.
12. Log in as the student and verify `GET /api/students/me` and the assignment list/download endpoints with the student bearer token.
13. Start the Angular frontend with `npm start` from `frontend`, open `/instructor/dashboard`, and verify the instructor workflow in the browser.

The instructor dashboard is implemented at `/instructor/dashboard`, and the
student dashboard is available at `/student/dashboard`. The student profile is
read-only and shows registered courses, sections, coursework, final exam marks,
total marks, and final grades. Final grades use: A+ (90-100), A (85-89), B+
(80-84), B (75-79), C+ (70-74), C (60-69), D (50-59), and F (below 50).

The dashboard needs no seed file and will work with any manually created records that satisfy these relationships.
