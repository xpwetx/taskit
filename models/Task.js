const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Delayed"],
      default: "Pending",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    dueDate: {
      type: Date,
    },

    tags: [
      {
        type: String,
        default: [],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);