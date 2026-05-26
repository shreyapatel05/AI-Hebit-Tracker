import Habit from "../models/Habit.js";
import Log from "../models/Log.js";

// @desc    Get all habits for user
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ order: 1, createdAt: 1 });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res) => {
  try {
    const { name, description, category, frequency, targetDays, color, icon, order } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Habit name is required" });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
      order: order || 0,
    });

    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a habit
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const { name, description, category, frequency, targetDays, color, icon, order, isArchived } = req.body;

    if (name !== undefined) habit.name = name;
    if (description !== undefined) habit.description = description;
    if (category !== undefined) habit.category = category;
    if (frequency !== undefined) habit.frequency = frequency;
    if (targetDays !== undefined) habit.targetDays = targetDays;
    if (color !== undefined) habit.color = color;
    if (icon !== undefined) habit.icon = icon;
    if (order !== undefined) habit.order = order;
    if (isArchived !== undefined) habit.isArchived = isArchived;

    await habit.save();
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive/Unarchive a habit
// @route   PUT /api/habits/:id/archive
// @access  Private
export const archiveHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    habit.isArchived = !habit.isArchived;
    await habit.save();
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a habit and its logs
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Delete all completion logs corresponding to this habit
    await Log.deleteMany({ habitId: req.params.id, userId: req.user._id });
    
    // Delete the habit itself
    await habit.deleteOne();

    res.json({ message: "Habit and associated logs deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
