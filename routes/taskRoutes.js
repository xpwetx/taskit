// routes/taskRoutes.js
const express = require("express");
const router = express.Router();

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
  deleteTask
} = require("../controllers/taskController");

// =====================
// SSR / EJS Routes
// =====================

// Dashboard with pagination/search
router.get("/dashboard", getDashboard);

// Create task form
router.get("/tasks/create", getCreateTask);
router.post("/tasks/create", postCreateTask);

// Edit task form
router.get("/tasks/edit/:id", getEditTask);
router.post("/tasks/edit/:id", postEditTask);

// Delete task (POST form)
router.post("/tasks/delete/:id", postDeleteTask);

// =====================
// API Routes (JWT)
// =====================

// All API routes assume JWT middleware sets req.user
router.post("/api/tasks", createTask);
router.get("/api/tasks", getTasks);
router.get("/api/tasks/:id", getTaskById);
router.put("/api/tasks/:id", updateTask);
router.patch("/api/tasks/update-status/:id", updateStatus);
router.delete("/api/tasks/:id", deleteTask);

module.exports = router;
