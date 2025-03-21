import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Get menu
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM food_menu ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu
router.put('/', async (req, res) => {
  try {
    const { menu } = req.body;

    // Clear existing menu
    await db.query('DELETE FROM food_menu');

    // Insert new menu
    for (const item of menu) {
      await db.query(
        'INSERT INTO food_menu (day, breakfast, lunch, dinner) VALUES (?, ?, ?, ?)',
        [item.day, item.breakfast, item.lunch, item.dinner]
      );
    }

    res.json({ message: 'Menu updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;