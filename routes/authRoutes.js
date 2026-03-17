const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  postLogin,
  getLogin,
  getRegister,
  postRegister,
  logout,
} = require("../controllers/authController");

// =====================
// EJS Front-End Routes
// =====================
router.get("/register", getRegister);
router.post("/register", postRegister);

router.get("/login", getLogin);
router.post( "/login", postLogin)

router.get("/logout", logout);

// API
router.post("/api/register", postRegister); 
router.post("/api/login", postLogin);      

module.exports = router;
