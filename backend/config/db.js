import mysql from 'mysql2/promise';

// First create a connection without database selected
const initialPool = mysql.createPool({
  host: 'mysql.railway.internal',
  user: 'root',
  password: 'YuPuuCHIPiJxkcumGuFMdHTsrfoIGPXg',  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  try {
    // Create database if it doesn't exist
    await initialPool.query('CREATE DATABASE IF NOT EXISTS pg_management');
    
    // Create a new pool with database selected
    const pool = mysql.createPool({
      host: 'mysql.railway.internal',
      user: 'root',
      password: 'YuPuuCHIPiJxkcumGuFMdHTsrfoIGPXg',
      database: 'pg_management',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create admin table first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        otp VARCHAR(6),
        otp_expiry TIMESTAMP
      )
    `);
    console.log('Admin table initialized');

    // Insert default admin if not exists
    await pool.query(`
      INSERT IGNORE INTO admin (email, password) 
      VALUES ('naveenbasireddy2001@gmail.com', 'Naveen#6305')
    `);
    console.log('Default admin user created');

    // Create other tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(15) NOT NULL,
        joining_date DATE NOT NULL,
        room_number INT NOT NULL,
        rent_amount DECIMAL(10,2) NOT NULL,
        address_proof TEXT NOT NULL
      )
    `);
    console.log('Tenants table initialized');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS due_amounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT,
        due_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
        paid_date DATE DEFAULT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);
    console.log('Due_amounts table initialized');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_menu (
        id INT PRIMARY KEY AUTO_INCREMENT,
        day VARCHAR(20) NOT NULL,
        breakfast TEXT NOT NULL,
        lunch TEXT NOT NULL,
        dinner TEXT NOT NULL
      )
    `);
    console.log('Food_menu table initialized');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenditures (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Expenditures table initialized');

    console.log('Database and tables initialized successfully');
    return pool;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database and export the pool
let pool;
try {
  pool = await initializeDatabase();
  console.log('Database connection successful');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

export default pool;
