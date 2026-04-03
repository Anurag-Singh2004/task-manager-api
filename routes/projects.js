const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const protect = require('../middleware/auth');

const { body } = require("express-validator");
const validate = require("../middleware/validate");

const projectRules = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 2 })
    .withMessage("Title must be at least 2 characters"),
];

router.get('/', protect, async function(req,res,next){
  try{
    const projects = await Project.find({
      $or:[
        {owner: req.user._id},
        {members: req.user._id}
      ]
    }).populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  }catch(err){
    next(err);
  }
});

router.post('/',protect,projectRules, validate, async function(req,res,next){
  try{
    const {title, description} = req.body;
    const project = await Project.create({
      title,
      description,
      owner: req.user._id
    });
    res.status(201).json({
      success: true,
      data: project
    });
  }catch(err){
    next(err);
  }
});

//Get single project
router.get('/:id',protect,async function(req,res,next){
  try{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(400).json({
        success: false,
        error: 'Invalid project id'
      })
    }
    const project = await Project.findById(req.params.id)
      .populate('owner','name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    //check if user is owner or member
    const isOwner = project.owner._id.toString()=== req.user._id.toString();
    const isMember = project.members.some(m=> m._id.toString()===req.user._id.toString());

    if(!isOwner && !isMember){
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this project'
      });
    }
    res.status(200).json({
      success: true,
      data: project
    });
  }catch(err){
    next(err);
  }
});

//put update project - owner only
router.put('/:id',protect,projectRules, validate, async function (req,res,next){
  try{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(400).json({
        success: false,
        error: 'Invalid project id'
      });
    }
    const project = await Project.findById(req.params.id);
    if(!project){
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    //owner only
    if(project.owner.toString() !== req.user._id.toString()){
      return res.status(403).json({
        success: false,
        error: 'Only project owner can update'
      });
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {title: req.body.title, description: req.body.description},
      {new: true, runValidators: true}
    );

    res.status(200).json({
      success: true,
      data: updated
    });
  }catch(err){
    next(err);
  }
});

//Delete project- owner only
router.delete('/:id',protect, async function(req,res,next){
  try{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(400).json({
        success: false,
        error: 'Invalid project id'
      });
    }

    const project = await Project.findById(req.params.id);
    if(!project){
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    //owner only
    if(project.owner.toString() !== req.user._id.toString()){
      return res.status(403).json({
        success: false,
        error: 'Only project owner can delete'
      });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  }catch(err){
    next(err);
  }
});

//post add members - owner only

router.post('/:id/members', protect, async function(req,res,next){
  try{
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project id'
      });
    }
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    // owner only
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can add members'
      });
    }

    const {userId} = req.body;

    if(project.members.includes(userId)){
      return res.status(400).json({
        success: false,
        error: 'User is already a member'
      });
    }
    project.members.push(userId);
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  }catch(err){
    next(err);
  }
});

//delete remove member - owner only
router.delete('/:id/members/:userId', protect, async function(req,res,next){
  try{
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project id'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // owner only
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can remove members'
      });
    }
    //remove member
    project.members = project.members.filter(m=> m.toString() != req.params.userId);
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  }catch(err){
    next(err);
  }
});

module.exports = router;