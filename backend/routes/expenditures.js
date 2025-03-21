import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Get all expenditures and monthly totals
router.get('/', async (req, res) => {
  try {
    // Get all expenditures
    const [expenditures] = await pool.query(
      'SELECT * FROM expenditures ORDER BY date DESC'
    );
    console.log('Fetched expenditures:', expenditures);

    // Get monthly totals
    const [monthlyTotals] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(amount) as total
      FROM expenditures
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month DESC
    `);
    console.log('Monthly totals:', monthlyTotals);

    // Get current month's total
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [currentMonthResult] = await pool.query(
      'SELECT SUM(amount) as total FROM expenditures WHERE DATE_FORMAT(date, "%Y-%m") = ?',
      [currentMonth]
    );
    const currentMonthTotal = currentMonthResult[0].total || 0;
    console.log('Current month total:', currentMonthTotal);

    res.json({
      expenditures,
      monthlyTotals,
      currentMonthTotal
    });
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    res.status(500).json({ message: 'Failed to fetch expenditures' });
  }
});

// Add new expenditure
router.post('/', async (req, res) => {
  try {
    const { name, amount, date } = req.body;
    console.log('Adding new expenditure:', { name, amount, date });

    const [result] = await pool.query(
      'INSERT INTO expenditures (name, amount, date) VALUES (?, ?, ?)',
      [name, amount, date]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      amount,
      date
    });
  } catch (error) {
    console.error('Error adding expenditure:', error);
    res.status(500).json({ message: 'Failed to add expenditure' });
  }
});

// Delete multiple expenditures by date range
router.delete('/bulk', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    await pool.query(
      'DELETE FROM expenditures WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );
    
    res.json({ message: 'Expenditures deleted successfully' });
  } catch (error) {
    console.error('Error deleting expenditures:', error);
    res.status(500).json({ message: 'Failed to delete expenditures', error: error.message });
  }
});

export default router; 