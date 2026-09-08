const Department = require("../models/Department");
const Course = require("../models/Course");// for safe delete only

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ code: 1 }).lean();
    const courses = await Course.find().sort({ code: 1 }).lean();
    const departmentsWithCourses = departments.map((department) => ({
      ...department,
      courses: courses.filter((course) => String(course.departmentId) === String(department._id))
    }));

    res.status(200).json(departmentsWithCourses);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    const courses = await Course.find({ departmentId: department._id })
      .populate("prerequisites", "code name")
      .sort({ code: 1 });
    const Section = require("../models/Section");
    const sections = await Section.find({ courseId: { $in: courses.map((course) => course._id) } }).populate({
      path: "instructorId",
      populate: { path: "userId", select: "name email" }
    });
    const coursesWithInstructors = courses.map((course) => {
      const instructors = sections
        .filter((section) => String(section.courseId) === String(course._id))
        .map((section) => section.instructorId)
        .filter(Boolean)
        .filter((instructor, index, values) => values.findIndex((item) => String(item._id) === String(instructor._id)) === index);
      return { ...course.toObject(), instructors };
    });
    res.status(200).json({ ...department.toObject(), courses: coursesWithInstructors });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const normalizedName = req.body.name?.trim().toLowerCase();
    if (normalizedName && await Course.exists({ name: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })) {
      return res.status(400).json({ message: "This name matches an existing course. Add it as a course instead." });
    }
    const newDepartment = new Department(req.body);

    await newDepartment.save();

    res.status(201).json(newDepartment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Department name or code already exists"
      });
    }

    res.status(400).json({
      message: error.message
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const existingDepartment = await Department.findById(req.params.id);

    if (!existingDepartment) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    const normalizedName = req.body.name?.trim().toLowerCase();
    if (normalizedName && await Course.exists({ name: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })) {
      return res.status(400).json({ message: "This name matches an existing course. Add it as a course instead." });
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json(updatedDepartment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Department name or code already exists"
      });
    }

    res.status(400).json({
      message: error.message
    });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    const courseCount = await Course.countDocuments({
      departmentId: req.params.id
    });

    if (courseCount > 0) {
      return res.status(409).json({
        message: "Department cannot be deleted because it has courses"
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Department deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};