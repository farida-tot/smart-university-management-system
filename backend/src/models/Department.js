const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true
    },

    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{2,8}$/, "Department code must contain 2-8 letters, such as CS"]
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;