const express = require("express");
const router = express.Router({ mergeParams: true }); //  important!
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Project = require("../models/Project");
const protect = require("../middleware/auth");

const { body } = require("express-validator");
const validate = require("../middleware/validate");

const categoryRules = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
];

//helper- check if user is owner or member
async function getProjectAndCheckAccess(projectId, userId){
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };

  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(m => m.toString() === userId.toString());

  if (!isOwner && !isMember) return { error: 'Not authorized to access this project', status: 403 };

  return { project, isOwner };
}

// GET all categories in project
router.get('/', protect, async function(req,res,next){
  try{
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid project id' });
    }
    const { error, status } = await getProjectAndCheckAccess(
      req.params.id,
      req.user._id,
    );
    if (error) return res.status(status).json({ success: false, error });

    const categories = await Category.find({ project: req.params.id });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });

  
  }catch(err){
    next(err);
  }
});

// POST create category — owner only
router.post('/', protect,categoryRules, validate, async function(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid project id' });
    }

    const { error, status, isOwner } = await getProjectAndCheckAccess(req.params.id, req.user._id);
    if (error) return res.status(status).json({ success: false, error });

    // owner only
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can create categories'
      });
    }

    const { name, color } = req.body;

    const category = await Category.create({
      name,
      color,
      project: req.params.id
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch(err) {
    next(err);
  }
});


// DELETE category — owner only
router.delete('/:categoryId', protect, async function(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid project id' });
    }

    const { error, status, isOwner } = await getProjectAndCheckAccess(req.params.id, req.user._id);
    if (error) return res.status(status).json({ success: false, error });

    // owner only
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can delete categories'
      });
    }

    const category = await Category.findByIdAndDelete(req.params.categoryId);

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch(err) {
    next(err);
  }
});

module.exports = router;