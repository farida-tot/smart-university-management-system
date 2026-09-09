# smart-university-management-system

A university management app built with Node.js, Express.js, MongoDB, and Angular. It supports admin, instructor, and student workflows for academic records, course management, approvals, and profile settings.

## Identity and email rules

The system enforces institutional email formats for all user accounts:

- Student email: 8-digit student ID + @stud.nu.edu
  - Example: 20240001@stud.nu.edu
- Instructor email: employee number + @gov.nu.edu
  - Example: 1001@gov.nu.edu

The backend validates these rules in the user model and the relevant create/update controllers. The admin dashboard enforces the same rules on the frontend before submitting any form.

## Local setup

1. Install backend dependencies:
   - cd backend
   - npm install
2. Install frontend dependencies:
   - cd frontend
   - npm install
3. Start the backend API:
   - cd backend
   - npm start
4. Start the frontend app:
   - cd frontend
   - npm start

## Notes

- Admin users use the gov.nu.edu domain.
- Student IDs must be exactly 8 digits.
- Instructor employee numbers can contain only letters, numbers, or hyphens.
- Password changes show a success alert in the settings screen after a successful request.
