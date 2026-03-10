// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// =====================
// API: JWT Authentication
// =====================

// Register API
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("registerUser error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Login API
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =====================
// EJS: Session Authentication
// =====================

// Render Register Page
exports.getRegister = (req, res) => {
  res.render("register", { messages: req.flash(), user: req.session.user });
};

// Handle Register Form
exports.postRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      req.flash("error", "Email already registered");
      return res.redirect("/register");
    }

    const user = await User.create({ username, email, password });
    req.session.user = { id: user._id, username: user.username };
    req.flash("success", "Registered successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("postRegister error:", err);
    req.flash("error", err.message);
    res.redirect("/register");
  }
};

// Render Login Page
exports.getLogin = (req, res) => {
  res.render("login", { messages: req.flash(), user: req.session.user });
};

// Handle Login Form
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    req.session.user = { id: user._id, username: user.username };
    req.flash("success", "Logged in successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("postLogin error:", err);
    req.flash("error", err.message);
    res.redirect("/login");
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};