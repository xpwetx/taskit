const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
} = require("../controllers/authController");

// =====================
// EJS Front-End Routes
// =====================
router.get("/register", getRegister);
router.post("/register", postRegister);

router.get("/login", getLogin);
router.post("/login", postLogin);

router.get("/logout", logout);

// =====================
// API Routes (JWT Authentication)
// =====================
router.post("/api/register", registerUser);
router.post("/api/login", loginUser);


module.exports = router;