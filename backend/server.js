import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import duesRoutes from './routes/dues.js';
import menuRoutes from './routes/menu.js';
import expenditureRoutes from './routes/expenditures.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/dues', duesRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/expenditures', expenditureRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});