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

module.exports = router;

// =====================
// API Routes (JWT Authentication)
// =====================
router.post("/register", registerUser);
router.post("/login", loginUser);


module.exports = router;