const express = require("express");
const router = express.Router({ mergeParams: true }); //important line ******************
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const protect = require("../middleware/auth");

async function getProjectAndCheckAccess(projectId, userId){
  const project = await Project.findById(projectId);
  if(!project) return {error: 'Project not found', status: 404};

  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(m=> m.toString() === userId.toString());

  if(!isOwner && !isMember) return { error: "Not authorized to access this project", status: 403 };

  return {project, isOwner};
}

// GET all tasks in project
router.get('/',protect,async function(req,res,next){
  try{
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid project id' });
    }
    const {error, status} = await getProjectAndCheckAccess(req.params.id,req.user._id);
    if(error) return res.status(status).json({ success: false, error });

    const tasks = await Task.find({project: req.params.id})
      .populate('assignedTo', 'name email')
      .populate('category', 'name color');
    
      res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  }catch(err){
    next(err);
  }
});

//POST create task
router.post('/', protect, async function(req,res,next){
  try{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(400).json({ success: false, error: 'Invalid project id' });
    }

    const {error, status} = await getProjectAndCheckAccess(req.params.id, req.user._id);
    if(error) return res.status(status).json({ success: false, error });

    const { title, description, status: taskStatus, priority, dueDate, assignedTo, category } = req.body;

    const task = await Task.create({
      title,
      description,
      status: taskStatus,
      priority,
      dueDate,
      assignedTo,
      category,
      project: req.params.id
    });
    res.status(201).json({
      success: true,
      data: task
    });

  }catch(err){
    next(err);
  }
});

//Get a single task
router.get('/:taskId', protect, async function(req,res,next){
  try{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(400).json({ success: false, error: 'Invalid project id' });
    }
    const {error, status} = await getProjectAndCheckAccess(req.params.id, req.user._id);
    if(error) return res.status(status).json({ success: false, error });

    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email')
      .populate('category', 'name color');
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  }catch(err){
    next(err);
  }
});

// Put update task
router.put('/:taskId', protect, async function(req,res,next){
  try{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(400).json({ success: false, error: 'Invalid project id' });
    }
    const {error, status, isOwner} = await getProjectAndCheckAccess(req.params.id, req.user._id);
    if(error) return res.status(status).json({ success: false, error });

    const task = await Task.findById(req.params.taskId);
    if(!task) return res.status(404).json({ success: false, error: 'Task not found' });

    //owner or asignee can update
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
    if(!isOwner && !isAssignee){
      return res.status(403).json({
        success: false,
        error: 'Only project owner or assignee can update task'
      });
    }
    const updated = await Task.findByIdAndUpdate(
      req.params.taskId,
      req.body,
      {new : true, runValidators: true}
    ).populate('assignedTo', 'name email')
     .populate('category', 'name color');
    
    res.status(200).json({ success: true, data: updated });
  }catch(err){
    next(err);
  }
});

//Patch update task status only
router.patch('/:taskId/status', protect, async function(req,res,next){
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project id" });
    }

    const { error, status, isOwner } = await getProjectAndCheckAccess(
      req.params.id,
      req.user._id,
    );
    if (error) return res.status(status).json({ success: false, error });

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    // owner or assignee can update status
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
    if (!isOwner && !isAssignee) {
      return res.status(403).json({
        success: false,
        error: "Only project owner or assignee can update task status",
      });
    }
    const updated = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: req.body.status },
      { new: true, runValidators: true },
    );
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

//Delete task - owner only
router.delete('/:taskId', protect, async function(req,res,next){
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project id" });
    }

    const { error, status, isOwner } = await getProjectAndCheckAccess(
      req.params.id,
      req.user._id,
    );
    if (error) return res.status(status).json({ success: false, error });

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: "Only project owner can delete tasks",
      });
    }

    const task = await Task.findByIdAndDelete(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
