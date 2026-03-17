const Task = require("../models/Task");
const sanitizeHtml = require("sanitize-html");

// Helper to sanitize strings or array of strings
const sanitizeInput = (input) => {
  if (!input) return input;
  if (Array.isArray(input)) return input.map((t) => sanitizeHtml(t));
  if (typeof input === "string") return sanitizeHtml(input);
  return input;
};

// ----------------------
// SSR Controllers
// ----------------------

// Dashboard

const getDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };

    // Search
    if (req.query.search) {
      const search = sanitizeHtml(req.query.search);
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    res.render("dashboard", {
      user: req.user,
      tasks,
      search: req.query.search || "",
      currentPage: page,
      totalPages,
      messages: req.flash(),
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/");
  }
};

// Create task form
const getCreateTask = (req, res) => {
  res.render("createTask", {
    user: req.user,
    messages: req.flash(),
  });
};

// Handle create task
const postCreateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, tags } = req.body;

    await Task.create({
      title: sanitizeHtml(title),
      description: sanitizeInput(description),
      priority: sanitizeInput(priority),
      dueDate,
      tags: tags ? sanitizeInput(tags.split(",").map((t) => t.trim())) : [],
      user: req.user.id,
    });

    req.flash("success", "Task created successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/tasks/create");
  }
};

// Edit task form
const getEditTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }

    res.render("editTask", {
      task,
      user: req.user,
      messages: req.flash(),
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/dashboard");
  }
};

// Handle edit task
const postEditTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }

    const { title, description, priority, dueDate, tags, completed } = req.body;

    task.title = sanitizeInput(title);
    task.description = sanitizeInput(description);
    task.priority = sanitizeInput(priority);
    task.dueDate = dueDate;
    task.tags = tags ? sanitizeInput(tags.split(",").map((t) => t.trim())) : [];
    task.completed = completed === "on";

    await task.save();

    req.flash("success", "Task updated successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/dashboard");
  }
};

// Delete task (SSR)
const postDeleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }

    await task.deleteOne();
    req.flash("success", "Task deleted successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/dashboard");
  }
};

// ----------------------
// API Controllers (JWT / JSON)
// ----------------------

// Create task (API)
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, tags } = req.body;
    const task = await Task.create({
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      priority: sanitizeInput(priority),
      dueDate,
      tags: tags ? sanitizeInput(tags.map((t) => t.trim())) : [],
      user: req.user.id,
    });
    res.status(201).json({ message: "Task created", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all tasks (API)
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort("-createdAt");
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single task by ID (API)
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task (API)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });
    const { title, description, priority, dueDate, tags, completed } = req.body;

    task.title = sanitizeInput(title);
    task.description = sanitizeInput(description);
    task.priority = sanitizeInput(priority);
    task.dueDate = dueDate;
    task.tags = tags ? sanitizeInput(tags.map((t) => t.trim())) : [];
    task.completed = completed;

    await task.save();
    res.status(200).json({ message: "Task updated", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task status (API)
const updateStatus = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = sanitizeInput(req.body.status);
    await task.save();

    res.status(200).json({ message: "Status updated", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete task (API)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------
// Export all functions
// ----------------------
module.exports = {
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
};
