const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [2, "Title must be at least 2 characters"],
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", //ref: 'User' tells Mongoose — "when I populate this field, go look in the User collection"
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Project', projectSchema);