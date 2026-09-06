require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existingAdmin = await User.findOne({
      email: "admin@nu.edu"
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin123", 10);

    const admin = await User.create({
      name: "System Admin",
      email: "admin@nu.edu",
      password: hashedPassword,
      role: "admin",
      isActive: true
    });

    console.log("Admin created successfully");
    console.log("Admin ID:", admin._id);
    console.log("Email:", admin.email);

  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

createAdmin();