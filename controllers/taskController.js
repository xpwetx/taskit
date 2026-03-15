const Task = require("../models/Task");
const xss = require("xss");

// ----------------------
// SSR Controllers
// ----------------------

// Dashboard
const getDashboard = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to view the dashboard");
    return res.redirect("/login");
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    let query = { user: req.user.id };

    // Search
    if (req.query.search) {
      const search = xss(req.query.search);
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
    res.redirect("/login");
  }
};

// Create task form
const getCreateTask = (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to create tasks");
    return res.redirect("/login");
  }

  res.render("createTask", {
    user: req.user,
    messages: req.flash(),
  });
};

// Handle create task
const postCreateTask = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to create tasks");
    return res.redirect("/login");
  }

  try {
    const { title, description, priority, dueDate, tags } = req.body;

    await Task.create({
      title: xss(title),
      description: xss(description),
      priority: xss(priority),
      dueDate,
      tags: tags ? tags.split(",").map((t) => xss(t.trim())) : [],
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
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to edit tasks");
    return res.redirect("/login");
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
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
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to edit tasks");
    return res.redirect("/login");
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }

    const { title, description, priority, dueDate, tags, completed, status } =
      req.body;

    task.title = xss(title);
    task.description = xss(description);
    task.priority = xss(priority);
    task.dueDate = dueDate;
    task.tags = tags ? tags.split(",").map((t) => xss(t.trim())) : [];
    task.completed = completed === "on";
    task.status = xss(status);
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
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in to delete tasks");
    return res.redirect("/login");
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
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

// Update task status (SSR)
const updateStatusSSR = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please log in");
    return res.redirect("/login");
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      req.flash("error", "Unauthorized");
      return res.redirect("/dashboard");
    }

    task.status = xss(req.body.status);
    await task.save();

    req.flash("success", "Status updated successfully!");
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
  if (!req.user) return res.status(403).json({ message: "Not authorized" });

  try {
    const { title, description, priority, dueDate, tags } = req.body;
    const task = await Task.create({
      title: xss(title),
      description: xss(description),
      priority: xss(priority),
      dueDate,
      tags: tags ? tags.map((t) => xss(t.trim())) : [],
      user: req.user.id,
    });
    res.status(201).json({ message: "Task created", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all tasks (API)
const getTasks = async (req, res) => {
  if (!req.user) return res.status(403).json({ message: "Not authorized" });

  try {
    const tasks = await Task.find({ user: req.user.id }).sort("-createdAt");
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single task by ID (API)
const getTaskById = async (req, res) => {
  if (!req.user) return res.status(403).json({ message: "Not authorized" });

  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task (API)
const updateTask = async (req, res) => {
  if (!req.user) return res.status(403).json({ message: "Not authorized" });

  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }
    const { title, description, priority, dueDate, tags, completed, status } =
      req.body;

    task.title = xss(title);
    task.description = xss(description);
    task.priority = xss(priority);
    task.dueDate = dueDate;
    task.tags = tags ? tags.map((t) => xss(t.trim())) : [];
    task.completed = completed;

    await task.save();
    res.status(200).json({ message: "Task updated", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task status (API)
const updateStatusAPI = async (req, res) => {
  if (!req.user) return res.status(403).json({ message: "Not authorized" });

  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }
    task.status = xss(req.body.status);
    await task.save();

    res.status(200).json({ message: "Status updated", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete task (API)
const deleteTask = async (req, res) => {
  if (!req.user) return res.status(403).json({ message: "Not authorized" });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!task || task.user.toString() !== req.user.id) {
      req.flash("error", "Unauthorized");
      return res.redirect("/dashboard");
    }
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
  updateStatusSSR,
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateStatusAPI,
  deleteTask,
};
