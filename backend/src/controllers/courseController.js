const Course = require("../models/Course");
const Department = require("../models/Department");
const Section = require("../models/Section");

// =========================
// 1- Get All Courses
// =========================
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("departmentId", "name code")
      .populate("prerequisites", "code name");

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// =========================
// 2- Get Course By ID
// =========================
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("departmentId", "name code")
      .populate("prerequisites", "code name");

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// =========================
// 3- Create Course
// =========================
const createCourse = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      creditHours,
      departmentId,
      prerequisites
    } = req.body;

    // Check if department exists
    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    // Check prerequisites
    if (prerequisites && prerequisites.length > 0) {
      const prerequisiteCourses = await Course.find({
        _id: { $in: prerequisites }
      });

      if (prerequisiteCourses.length !== prerequisites.length) {
        return res.status(400).json({
          message: "One or more prerequisite courses do not exist"
        });
      }
    }

    const newCourse = new Course({
      code,
      name,
      description,
      creditHours,
      departmentId,
      prerequisites
    });

    await newCourse.save();

    const course = await Course.findById(newCourse._id)
      .populate("departmentId", "name code")
      .populate("prerequisites", "code name");

    res.status(201).json(course);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Course code already exists"
      });
    }

    res.status(400).json({
      message: error.message
    });
  }
};

// =========================
// 4- Update Course
// =========================
const updateCourse = async (req, res) => {
  try {
    const existingCourse = await Course.findById(req.params.id);

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    // If departmentId is being updated
    if (req.body.departmentId) {
      const department = await Department.findById(
        req.body.departmentId
      );

      if (!department) {
        return res.status(404).json({
          message: "Department not found"
        });
      }
    }

    // If prerequisites are being updated
    if (req.body.prerequisites) {
      const prerequisiteCourses = await Course.find({
        _id: { $in: req.body.prerequisites }
      });

      if (
        prerequisiteCourses.length !==
        req.body.prerequisites.length
      ) {
        return res.status(400).json({
          message: "One or more prerequisite courses do not exist"
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate("departmentId", "name code")
      .populate("prerequisites", "code name");

    res.status(200).json(updatedCourse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Course code already exists"
      });
    }

    res.status(400).json({
      message: error.message
    });
  }
};

// =========================
// 5- Delete Course
// =========================
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    // Check if course is used by any section
    const sectionCount = await Section.countDocuments({
      courseId: req.params.id
    });

    if (sectionCount > 0) {
      return res.status(409).json({
        message: "Course cannot be deleted because it has sections"
      });
    }

    // Check if course is a prerequisite for another course
    const dependentCourses = await Course.countDocuments({
      prerequisites: req.params.id
    });

    if (dependentCourses > 0) {
      return res.status(409).json({
        message:
          "Course cannot be deleted because it is a prerequisite for another course"
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Course deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// =========================
// 6- Search / Filter Courses
// =========================
const searchCourses = async (req, res) => {
  try {
    const { search, departmentId } = req.query;

    const filter = {};

    // Search by course code or name
    if (search) {
      filter.$or = [
        {
          code: {
            $regex: search,
            $options: "i"
          }
        },
        {
          name: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    // Filter by department
    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const courses = await Course.find(filter)
      .populate("departmentId", "name code")
      .populate("prerequisites", "code name");

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses
};