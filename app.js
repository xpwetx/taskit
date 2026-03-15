// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const flash = require("express-flash");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const passport = require("passport");
const passportInit = require("./config/passportInit");
const xss = require('xss');
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// ----------------------
// View Engine
// ----------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); 

// ----------------------
// Serve Static Files
// ----------------------
app.use(express.static(path.join(__dirname, "public"))); 


// ----------------------
// Rate Limiter
// ----------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// ----------------------
// Security Middleware
// ----------------------
app.use(
  helmet({
    contentSecurityPolicy: false, 
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ----------------------
// Sessions + Flash
// ----------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());


// Passport
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());


// ----------------------
// Global Template Vars
// ----------------------
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.messages = req.flash();
  next();
});



// ----------------------
// Routes
// ----------------------
// EJS routes
app.use(authRoutes);
app.use(taskRoutes);

// API routes
app.use("/api/auth", limiter, authRoutes);
app.use("/api/tasks", taskRoutes);

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// ----------------------
// MongoDB
// ----------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ----------------------
// Global Error Handler
// ----------------------
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);

  if (req.xhr || req.headers.accept?.includes("json")) {
    return res
      .status(err.status || 500)
      .json({ message: err.message || "Server Error" });
  }

  if (req.flash) {
    req.flash("error", err.message || "Server Error");
    res.redirect("back");
  } else {
    res.status(500).send(err.message || "Server Error");
  }

});

module.exports = app;