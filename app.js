require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(()=> console.log('MongoDB connected'))
  .catch(err=> console.log(err));

//Test Route
app.get('/',(req,res)=>{
  res.json({message: 'Task Manager API is running'});
});

//404 handler
app.use((req,res,next)=>{
  const error = new Error(`Route ${req.url} not found`);
  error.statusCode = 404;
  next(error);
});

//Error Handler
app.use((err,req,res,next)=>{
  console.error(err.message);
  res.statusCode(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack :undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});