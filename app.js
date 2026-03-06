const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// authRoute
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("API Running");
});

module.exports = app;