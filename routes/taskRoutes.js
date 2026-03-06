const express = require("express");
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware"); // JWT middleware

router.route("/").get(protect, getTasks).post(protect, createTask);
router.route("/:id").put(protect, updateTask).delete(protect, deleteTask);

module.exports = router;