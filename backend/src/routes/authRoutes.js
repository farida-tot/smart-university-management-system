const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createStudent, createInstructor, changePassword, login } = require("../controllers/authController");


const router = express.Router();

router.post("/login", login);
router.post("/students", authMiddleware, roleMiddleware("admin"), createStudent);
router.post("/instructors", authMiddleware, roleMiddleware("admin"), createInstructor);
router.patch("/password", authMiddleware, changePassword);


module.exports = router;