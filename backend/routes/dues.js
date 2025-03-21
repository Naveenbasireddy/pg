import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Function to generate receipt text
const generateReceipt = (dueDetails) => {
  const receiptDate = new Date().toLocaleDateString();
  const formattedDueDate = new Date(dueDetails.due_date).toLocaleDateString();
  const formattedPaidDate = new Date().toLocaleDateString();
  
  return `🏠 *RAGHAVA BOYS HOSTEL*
----------------------------------
📝 *PAYMENT RECEIPT*
Date: ${receiptDate}

👤 *Tenant Details*
Name: ${dueDetails.name}
Room No: ${dueDetails.room_number}

💰 *Payment Details*
Amount Paid: ₹${dueDetails.amount}
Payment Date: ${formattedPaidDate}
Due Date: ${formattedDueDate}
Status: ✅ Paid

Thank you for your payment! 🙏
----------------------------------
📞 *Contact for queries*
Phone: +91 1234567890`;
};

// Function to generate WhatsApp link
const generateWhatsAppLink = (phoneNumber, text) => {
  // Format phone number (ensure it starts with country code)
  let formattedNumber = phoneNumber.replace(/\D/g, '');
  if (!formattedNumber.startsWith('91')) {
    formattedNumber = '91' + formattedNumber;
  }
  
  // Create WhatsApp click-to-chat link
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${formattedNumber}?text=${encodedText}`;
};

// Get all unpaid dues
router.get('/', async (req, res) => {
  try {
    console.log('Fetching unpaid dues...');
    const [rows] = await db.query(`
      SELECT d.*, t.name, t.phone, t.room_number, t.joining_date 
      FROM due_amounts d 
      JOIN tenants t ON d.tenant_id = t.id 
      WHERE d.status = 'unpaid'
      AND d.due_date <= CURDATE()
      ORDER BY d.due_date ASC
    `);
    console.log('Found dues:', rows);
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching dues:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all dues (including paid)
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, t.name, t.phone, t.room_number, t.joining_date 
      FROM due_amounts d 
      JOIN tenants t ON d.tenant_id = t.id 
      ORDER BY d.due_date DESC
    `);
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching all dues:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark due as paid
router.post('/mark-paid/:id', async (req, res) => {
  const { id } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    // First, get the due details
    const [dueDetails] = await db.query(
      `SELECT d.*, t.name, t.phone, t.room_number, t.joining_date 
       FROM due_amounts d 
       JOIN tenants t ON d.tenant_id = t.id 
       WHERE d.id = ? AND d.status = 'unpaid'`,
      [id]
    );

    if (!dueDetails[0]) {
      return res.status(404).json({ message: 'Due not found or already paid' });
    }

    // Update the due status and paid_date
    await db.query(
      "UPDATE due_amounts SET status = 'paid', paid_date = ? WHERE id = ?",
      [today, id]
    );

    // Generate receipt
    const receipt = generateReceipt({
      ...dueDetails[0],
      paid_date: today
    });
    
    // Generate WhatsApp link
    const whatsappLink = generateWhatsAppLink(dueDetails[0].phone, receipt);

    // Calculate next due date (same day next month)
    const currentDueDate = new Date(dueDetails[0].due_date);
    const nextDueDate = new Date(currentDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    // Check if next month's due already exists
    const [existingDue] = await db.query(
      `SELECT id FROM due_amounts 
       WHERE tenant_id = ? AND due_date = ? AND status = 'unpaid'`,
      [dueDetails[0].tenant_id, nextDueDate.toISOString().split('T')[0]]
    );

    // Create next month's due only if it doesn't exist
    if (!existingDue.length) {
      await db.query(
        'INSERT INTO due_amounts (tenant_id, due_date, amount, status) VALUES (?, ?, ?, "unpaid")',
        [dueDetails[0].tenant_id, nextDueDate.toISOString().split('T')[0], dueDetails[0].amount]
      );
    }

    res.json({ 
      message: 'Due marked as paid successfully',
      nextDueDate,
      receipt,
      whatsappLink
    });
  } catch (error) {
    console.error('Error marking due as paid:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get WhatsApp reminder link
router.get('/whatsapp/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [tenant] = await db.query(`
      SELECT t.phone, d.amount 
      FROM tenants t 
      JOIN due_amounts d ON t.id = d.tenant_id 
      WHERE d.id = ? AND d.status = 'unpaid'
    `, [id]);

    if (tenant.length === 0) {
      return res.status(404).json({ message: 'Tenant not found or due already paid' });
    }

    const message = encodeURIComponent(
      `Your rent due today has arrived. Please pay as early as possible. Amount: Rs.${tenant[0].amount}`
    );
    const whatsappLink = `https://wa.me/${tenant[0].phone}?text=${message}`;

    res.json({ whatsappLink });
  } catch (error) {
    console.error('Error generating WhatsApp link:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;