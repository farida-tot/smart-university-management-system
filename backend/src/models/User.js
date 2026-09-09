const mongoose = require("mongoose");

const emailMatchesRole = (email, role) => {
  const domain = role === "student" ? "stud.nu.edu" : "gov.nu.edu";
  const escapedDomain = domain.replace(/\./g, "\\.");
  const localPartPattern = role === "student" ? "^[0-9]{8}$" : "^[a-z0-9-]{2,12}$";
  const emailRegex = new RegExp(`^(${role === "student" ? "[0-9]{8}" : "[a-z0-9-]{2,12}"})@${escapedDomain}$`);
  return emailRegex.test(email) && new RegExp(localPartPattern).test((email || "").split("@")[0]);
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
    const expected = this.role === "student"
      ? "an 8-digit student ID followed by @stud.nu.edu"
      : "a 2-12 character employee ID followed by @gov.nu.edu";
    this.invalidate("email", `Email must match the ${expected}`);
  }
});

userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  const email = update.email ?? update.$set?.email;
  if (email === undefined) return;

  const role = update.role ?? update.$set?.role ?? (await this.model.findOne(this.getQuery()).select("role"))?.role;
  if (role && !emailMatchesRole(String(email).toLowerCase(), role)) {
    const expected = role === "student"
      ? "an 8-digit student ID followed by @stud.nu.edu"
      : "a 2-12 character employee ID followed by @gov.nu.edu";
    throw new Error(`Email must match the ${expected}`);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;