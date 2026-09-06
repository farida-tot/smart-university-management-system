const Department = require("../models/Department");
const Course = require("../models/Course");// for safe delete only

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();

    res.status(200).json(departments);
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

    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const createDepartment = async (req, res) => {
  try {
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