const Task = require("../models/Task");

// =====================
// API Controllers (JWT)
// =====================

// Create a task
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user.id });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks for logged-in user
exports.getTasks = async (req, res) => {
  try {
    const query = { user: req.user.id };

    // Search title OR description
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || "createdAt";

    const tasks = await Task.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Task.countDocuments(query);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      results: tasks.length,
      tasks,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(updatedTask);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.user.id;

    const task = await Task.findOne({ _id: req.params.id, user: userId });

    if (!task) {
      if (req.xhr || req.headers.accept.includes("json")) {
        return res.status(404).json({ message: "Task not found" });
      } else {
        req.flash("error", "Task not found");
        return res.redirect("/dashboard");
      }
    }

    await task.deleteOne();

    if (req.xhr || req.headers.accept.includes("json")) {
      res.json({ message: "Task removed" });
    } else {
      req.flash("success", "Task deleted successfully!");
      res.redirect("/dashboard");
    }

  } catch (err) {
    if (req.xhr || req.headers.accept.includes("json")) {
      res.status(500).json({ message: err.message });
    } else {
      req.flash("error", err.message);
      res.redirect("/dashboard");
    }
  }
};

// =====================
// EJS Controllers (Session)
// =====================

// Dashboard - list tasks with search
exports.getDashboard = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 5; // tasks per page
    const skip = (page - 1) * limit;

    let query = { user: req.session.user.id };

    // Search
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    res.render("dashboard", {
      user: req.session.user,
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

// Render create task form
exports.getCreateTask = (req, res) => {
  res.render("createTask", {
    user: req.session.user,
    messages: req.flash(),
  });
};

// Handle create task form submission
exports.postCreateTask = async (req, res) => {
  try {
    await Task.create({ ...req.body, user: req.session.user.id });

    req.flash("success", "Task created successfully!");
    res.redirect("/dashboard");

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/tasks/create");
  }
};

// Render edit task form
exports.getEditTask = async (req, res) => {
  try {

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.session.user.id,
    });

    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }

    res.render("editTask", {
      task,
      user: req.session.user,
      messages: req.flash(),
    });

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/dashboard");
  }
};

// Handle edit task form submission
exports.postEditTask = async (req, res) => {
  try {

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.session.user.id,
    });

    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }

    const { title, description, priority, dueDate, tags, completed } = req.body;

    task.title = title;
    task.description = description;
    task.priority = priority;
    task.dueDate = dueDate;
    task.tags = tags ? tags.split(",").map((t) => t.trim()) : [];
    task.completed = completed === "on";

    await task.save();

    req.flash("success", "Task updated successfully!");
    res.redirect("/dashboard");

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/dashboard");
  }
};