import express from 'express';
import multer from 'multer';
import db from '../config/db.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Add tenant
router.post('/', upload.single('addressProof'), async (req, res) => {
  try {
    const { name, phone, joiningDate, roomNumber, rentAmount } = req.body;
    const addressProof = req.file.path;

    const [result] = await db.query(
      'INSERT INTO tenants (name, phone, joining_date, room_number, rent_amount, address_proof) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone, joiningDate, roomNumber, rentAmount, addressProof]
    );

    // Calculate first due date
    const dueDate = new Date(joiningDate);
    dueDate.setMonth(dueDate.getMonth() + 1);

    await db.query(
      'INSERT INTO due_amounts (tenant_id, due_date, amount) VALUES (?, ?, ?)',
      [result.insertId, dueDate, rentAmount]
    );

    res.json({ message: 'Tenant added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tenants
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tenants');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search tenants
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const [rows] = await db.query(
      'SELECT * FROM tenants WHERE name LIKE ? OR room_number = ?',
      [`%${query}%`, query]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, roomNumber } = req.body;

    await db.query(
      'UPDATE tenants SET name = ?, phone = ?, room_number = ? WHERE id = ?',
      [name, phone, roomNumber, id]
    );

    res.json({ message: 'Tenant updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove tenant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Start a transaction to ensure all deletions succeed or none do
    await db.query('START TRANSACTION');
    
    try {
      // Delete from due_amounts table
      await db.query('DELETE FROM due_amounts WHERE tenant_id = ?', [id]);
      
      // Get tenant's address proof file path before deletion
      const [fileResult] = await db.query('SELECT address_proof FROM tenants WHERE id = ?', [id]);
      
      // Finally delete the tenant
      const [result] = await db.query('DELETE FROM tenants WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      // If everything succeeded, commit the transaction
      await db.query('COMMIT');
      res.json({ message: 'Tenant and all related records removed successfully' });
    } catch (error) {
      // If any error occurs, rollback all changes
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error removing tenant:', error);
    res.status(500).json({ message: 'Failed to remove tenant', error: error.message });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get total number of tenants
    const [tenantRows] = await db.query('SELECT COUNT(*) as totalTenants FROM tenants');
    
    // Get count of unique rooms occupied
    const [roomRows] = await db.query('SELECT COUNT(DISTINCT room_number) as occupiedRooms FROM tenants');
    
    res.json({
      totalTenants: tenantRows[0].totalTenants,
      occupiedRooms: roomRows[0].occupiedRooms
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;