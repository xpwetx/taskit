// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const flash = require("connect-flash");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const passport = require("passport");
const passportInit = require("./config/passportInit");
const sanitizeHtml = require("sanitize-html");
require("dotenv").config();
const Task = require("./models/Task");
const { getDashboard } = require("./controllers/taskController");
const { ensureAuthenticated } = require("./middleware/authMiddleware");

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
app.use(limiter);

// ----------------------
// Body Parsers
// ----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {},
        });
      }
    }
  }
  next();
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

// ----------------------
// Sessions + Flash
// ----------------------
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not defined in your environment!");
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false },
  })
);

// Passport
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

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

// API routes
app.use("/",authRoutes);
app.use("/tasks", ensureAuthenticated, taskRoutes);

app.get("/dashboard", ensureAuthenticated, getDashboard);
// Public routes
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
    res.redirect(req.get("Referrer") || "/");
  } else {
    res.status(500).send(err.message || "Server Error");
  }
});

module.exports = app;
