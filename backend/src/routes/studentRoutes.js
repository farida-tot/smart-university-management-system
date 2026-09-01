const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMyProfile,
  updateMyProfile
} = require("../controllers/studentController");

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("student"),
  getMyProfile
);

router.patch(
  "/me",
  authMiddleware,
  roleMiddleware("student"),
  updateMyProfile
);

module.exports = router;