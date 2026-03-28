const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  try {
    //check if token exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, no token",
      });
    }

    //extract token
    const token = authHeader.split(" ")[1];

    //verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //attach user to request
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired, please login again",
      });
    }
    return res.status(401).json({
      success: false,
      error: "Not authorized, invalid token",
    });
  }
};
