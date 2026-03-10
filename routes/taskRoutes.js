const express = require("express");
const router = express.Router();
const { ensureAuthenticated, protect } = require("../middleware/authMiddleware");
const Task = require("../models/Task");

const {
  getDashboard,
  getCreateTask,
  postCreateTask,
  getEditTask,
  postEditTask,
  deleteTask, // for EJS
  getTasks,
  createTask,
  getTaskById,
  updateTask,
} = require("../controllers/taskController");

// =====================
// EJS Front-End Routes (session-based)
// =====================

// Dashboard (list all tasks)
router.get("/dashboard", ensureAuthenticated, getDashboard);

// Create task
router.get("/tasks/create", ensureAuthenticated, getCreateTask);
router.post("/tasks/create", ensureAuthenticated, postCreateTask);

// Edit task
router.get("/tasks/edit/:id", ensureAuthenticated, getEditTask);
router.post("/tasks/edit/:id", ensureAuthenticated, postEditTask);

// Delete task
router.get("/tasks/delete/:id", ensureAuthenticated, deleteTask);

// =====================
// New: Inline status update
// =====================
router.post("/tasks/update-status/:id", ensureAuthenticated, async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;

    // Validate status
    if (!["Pending", "Completed", "Delayed"].includes(status)) {
      req.flash("error", "Invalid status value.");
      return res.redirect("/dashboard");
    }

    // Update the task
    await Task.findByIdAndUpdate(taskId, { status });

    req.flash("success", "Task status updated!");
    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

// =====================
// API Routes (JWT-protected)
// =====================

// Get all tasks / Create task
router
  .route("/api/tasks")
  .get(protect, getTasks)
  .post(protect, createTask);

// Single task: Get / Update / Delete
router
  .route("/api/tasks/:id")
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;