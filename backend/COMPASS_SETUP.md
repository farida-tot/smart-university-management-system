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

## Instructor account

Create a `users` document first:

```json
{
  "name": "Dr. Lina Hassan",
  "email": "1001@gov.nu.edu",
  "password": "PASTE_BCRYPT_HASH_HERE",
  "role": "instructor",
  "isActive": true
}
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

## Student accounts

Students may use the registration page. Their email must be exactly `studentNumber@stud.nu.edu`.

For manual insertion, create a student `users` document with `role: "student"`, then create the linked `students` document:

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
      "startTime": "09:00",
      "endTime": "10:30",
      "room": "B201"
    }
  ]
}
```

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
2. Log in as the instructor at `POST /api/auth/login`.
3. Call `GET /api/instructors/me/dashboard` with the returned bearer token.
4. Confirm the course, section, roster, and department appear.
5. Record attendance with `PUT /api/instructors/me/sections/:sectionId/attendance`.
6. Record coursework with `PUT /api/instructors/me/sections/:sectionId/students/:studentId/coursework`, using marks from `0` to `40`.
7. Upload an assignment with `POST /api/assignments/courses/:courseId` as multipart form data using field name `file` and a PDF file.

The dashboard needs no seed file and will work with any manually created records that satisfy these relationships.
