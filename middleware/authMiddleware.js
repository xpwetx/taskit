// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// make sure user is logged in
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) 
    return next();
  
  if (req.flash) 
    req.flash("error", "Please log in to view that resource");
  
  return res.redirect("/login");
}

// protect API routes
async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (err) {
    console.error("JWT auth error:", err);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
}

// ----------------------
// Ownership check middleware (optional utility)
// ----------------------
async function checkTaskOwnership(req, res, next) {
  const Task = require("../models/Task");
  const task = await Task.findById(req.params.id);
  if (!task) {
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(404).json({ message: "Task not found" });
    } else {
      if (req.flash) req.flash("error", "Task not found");
      return res.redirect("/dashboard");
    }
  }

  // Use task.user (not task.owner) to check ownership
  if (!req.user || !task.user.equals(req.user._id)) {
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(403).json({ message: "Forbidden" });
    } else {
      if (req.flash) req.flash("error", "You are not authorized to access this task");
      return res.redirect("/dashboard");
    }
  }


  req.task = task;
  next();
}

module.exports = {
  ensureAuthenticated,
  protect,
  checkTaskOwnership,
};
