const mongoose = require("mongoose");

const emailMatchesRole = (email, role) => {
  const domain = role === "student" ? "stud.nu.edu" : "gov.nu.edu";
  const escapedDomain = domain.replace(/\./g, "\\.");
  return new RegExp(`^[a-z0-9]+@${escapedDomain}$`).test(email);
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ["admin", "student", "instructor"],
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("validate", function () {
  if (this.email && this.role && !emailMatchesRole(this.email, this.role)) {
    this.invalidate("email", `Email must use the ${this.role === "student" ? "@stud.nu.edu" : "@gov.nu.edu"} domain`);
  }
});

userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  const email = update.email ?? update.$set?.email;
  if (email === undefined) return;

  const role = update.role ?? update.$set?.role ?? (await this.model.findOne(this.getQuery()).select("role"))?.role;
  if (role && !emailMatchesRole(String(email).toLowerCase(), role)) {
    throw new Error(`Email must use the ${role === "student" ? "@stud.nu.edu" : "@gov.nu.edu"} domain`);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;