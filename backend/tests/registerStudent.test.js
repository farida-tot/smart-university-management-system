const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Department = require('../src/models/Department');
const { register } = require('../src/controllers/authController');

const validDepartmentId = '507f1f77bcf86cd799439011';

const buildResponse = () => {
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  return res;
};

test('register rejects a student when the department does not exist', async () => {
  const originalUserFindOne = User.findOne;
  const originalStudentFindOne = Student.findOne;
  const originalDepartmentFindById = Department.findById;
  const originalUserCreate = User.create;
  const originalStudentCreate = Student.create;

  try {
    let userCreateCalled = false;
    let studentCreateCalled = false;

    User.findOne = async () => null;
    Student.findOne = async () => null;
    Department.findById = async () => null;
    User.create = async (...args) => {
      userCreateCalled = true;
      return { _id: 'user-id', name: 'Ali', email: '2024001@nu.edu', role: 'student', ...args[0] };
    };
    Student.create = async (...args) => {
      studentCreateCalled = true;
      return { _id: 'student-id', studentNumber: '2024001', departmentId: validDepartmentId, level: 1, ...args[0] };
    };

    const req = {
      body: {
        name: 'Ali',
        email: '2024001@nu.edu',
        password: 'secret123',
        studentNumber: '2024001',
        departmentId: validDepartmentId,
        level: 1
      }
    };

    const res = buildResponse();

    await register(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.payload.message, /department/i);
    assert.equal(userCreateCalled, false);
    assert.equal(studentCreateCalled, false);
  } finally {
    User.findOne = originalUserFindOne;
    Student.findOne = originalStudentFindOne;
    Department.findById = originalDepartmentFindById;
    User.create = originalUserCreate;
    Student.create = originalStudentCreate;
  }
});
