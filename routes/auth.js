const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body } = require("express-validator");
const User = require('../models/User');
const validate = require("../middleware/validate");

const registerRules = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

//generate tokens
function generateAccessToken(id){
  return jwt.sign({id},process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRE});
}

function generateRefreshToken(id){
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRE,
  });
}

//Register
router.post('/register',registerRules, validate, async function(req,res,next){
  try{
    const {name, email, password} = req.body;
    
    const existingUser = await User.findOne({email});
    if(existingUser){
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    const user = await User.create({name, email, password});

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken
    });

  }catch(err){
    next(err);
  }
});

//Login
router.post('/login',loginRules, validate, async function(req,res,next){
  try{
    const {email, password} = req.body;

    const user = await User.findOne({email}).select('+password');
    if(!user) return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });

    const isMatch = await user.matchPassword(password);
    if(!isMatch){
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken
    });
  }catch(err){
    next(err);
  }
});

//Refresh
router.post('/refresh', async function(req,res,next){
  try{
    const {refreshToken} = req.body;

    if(!refreshToken){
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id).select('+refreshToken');
    if(!user || user.refreshToken !== refreshToken){
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    const newAccessToken = generateAccessToken(user._id);
    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  }catch(err){
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Refresh token expired, please login again",
      });
    }
    next(err);
  }
});

//Logout
router.post('/logout', async function(req,res,next){
  try{
    const {refreshToken} = req.body;

    await User.findOneAndUpdate(
      {refreshToken},
      {refreshToken: null}
    );
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }catch(err){
    next(err);
  }
});
module.exports = router;