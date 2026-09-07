require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");

const adminEmail = (process.env.ADMIN_EMAIL || "admin@gov.nu.edu").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123";

const createAdmin = async () => {
  try {
    if (!/^[a-z0-9]+@gov\.nu\.edu$/.test(adminEmail)) {
      throw new Error("ADMIN_EMAIL must use the @gov.nu.edu domain");
    }
    if (adminPassword.length < 6) {
      throw new Error("ADMIN_PASSWORD must be at least 6 characters");
    }
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existingAdmin = await User.findOne({
      email: adminEmail
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      name: "System Admin",
      email: adminEmail,
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