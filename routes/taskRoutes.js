// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const {
  ensureAuthenticated,
  protect,
  checkTaskOwnership,
} = require("../middleware/authMiddleware");

const {
  getDashboard,
  getCreateTask,
  postCreateTask,
  getEditTask,
  postEditTask,
  postDeleteTask,
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateStatus,
  deleteTask,
} = require("../controllers/taskController");

// =====================
// SSR / EJS Routes
// =====================

// Dashboard with pagination/search
router.get("/dashboard", ensureAuthenticated, getDashboard);

// Create task form
router.get("/create", ensureAuthenticated, getCreateTask);
router.post(
  "/create",
  ensureAuthenticated,
  body("title").trim().notEmpty().escape(),
  body("description").trim().escape(),
  postCreateTask
);

// Edit task form
router.get("/edit/:id", ensureAuthenticated, getEditTask);
router.post( "/edit/:id",
  ensureAuthenticated,
  body("title").trim().notEmpty().escape(),
  body("description").trim().escape(),
  postEditTask);

// Delete task (POST form)
router.post("/delete/:id", ensureAuthenticated, postDeleteTask);

// Update task status 
router.post("/update-status/:id", ensureAuthenticated, async (req, res, next) => {
  const Task = require("../models/Task");
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }

    task.status = req.body.status; // e.g., "Completed" or "Pending"
    await task.save();

    req.flash("success", "Task status updated!");
    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

// =====================
// API Routes (JWT)
// =====================

// All API routes assume JWT middleware sets req.user
router.post( "/api/tasks",
  protect,
  body("title").trim().notEmpty().escape(),
  body("description").trim().escape(),
  createTask);
router.get("/api/tasks", protect, getTasks);
router.get("/api/tasks/:id", protect, getTaskById);
router.put("/api/tasks/:id", protect, checkTaskOwnership, updateTask);
router.patch("/api/tasks/update-status/:id", protect, checkTaskOwnership, updateStatus);
router.delete("/api/tasks/:id", protect, checkTaskOwnership, deleteTask);

module.exports = router;
