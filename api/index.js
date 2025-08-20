const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const jalaliMoment = require('moment-jalaali');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./reservations.db');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Helper function to convert Jalali to Gregorian
function jalaliToGregorian(jalaliDate) {
  const [year, month, day] = jalaliDate.split('/').map(Number);
  const gregorianDate = jalaliMoment.jMoment(`${year}/${month}/${day}`, 'jYYYY/jM/jD');
  return gregorianDate.format('YYYY-MM-DD');
}

// Helper function to convert Gregorian to Jalali
function gregorianToJalali(gregorianDate) {
  return jalaliMoment(gregorianDate).format('jYYYY/jM/jD');
}

// Get all reservations
app.get('/api/reservations', (req, res) => {
  const query = `
    SELECT * FROM reservations 
    ORDER BY date DESC, time ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Convert dates to Jalali for display
    const reservationsWithJalali = rows.map(row => ({
      ...row,
      jalaliDate: gregorianToJalali(row.date)
    }));
    
    res.json(reservationsWithJalali);
  });
});

// Create new reservation
app.post('/api/reservations', (req, res) => {
  const { customer_name, customer_phone, service_type, date, time } = req.body;
  
  if (!customer_name || !customer_phone || !service_type || !date || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Convert Jalali date to Gregorian for storage
  const gregorianDate = jalaliToGregorian(date);
  
  const query = `
    INSERT INTO reservations (customer_name, customer_phone, service_type, date, time)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [customer_name, customer_phone, service_type, gregorianDate, time], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({
      id: this.lastID,
      customer_name,
      customer_phone,
      service_type,
      date: gregorianDate,
      jalaliDate: date,
      time,
      status: 'confirmed'
    });
  });
});

// Update reservation status
app.put('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const query = `UPDATE reservations SET status = ? WHERE id = ?`;
  
  db.run(query, [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json({ message: 'Reservation updated successfully' });
  });
});

// Delete reservation
app.delete('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `DELETE FROM reservations WHERE id = ?`;
  
  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json({ message: 'Reservation deleted successfully' });
  });
});

// Get holidays
app.get('/api/holidays', (req, res) => {
  const query = `SELECT * FROM holidays ORDER BY date ASC`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json(rows);
  });
});

// Add holiday
app.post('/api/holidays', (req, res) => {
  const { date, reason } = req.body;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  // Convert Jalali date to Gregorian for storage
  const gregorianDate = jalaliToGregorian(date);
  
  const query = `INSERT INTO holidays (date, reason) VALUES (?, ?)`;
  
  db.run(query, [gregorianDate, reason], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: 'This date is already marked as a holiday' });
      }
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({
      id: this.lastID,
      date: gregorianDate,
      jalaliDate: date,
      reason
    });
  });
});

// Delete holiday
app.delete('/api/holidays/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `DELETE FROM holidays WHERE id = ?`;
  
  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    res.json({ message: 'Holiday deleted successfully' });
  });
});

// Get statistics
app.get('/api/statistics', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);
  
  const queries = {
    total: 'SELECT COUNT(*) as count FROM reservations',
    today: 'SELECT COUNT(*) as count FROM reservations WHERE date = ?',
    thisMonth: 'SELECT COUNT(*) as count FROM reservations WHERE date LIKE ?',
    confirmed: 'SELECT COUNT(*) as count FROM reservations WHERE status = "confirmed"',
    cancelled: 'SELECT COUNT(*) as count FROM reservations WHERE status = "cancelled"'
  };
  
  const stats = {};
  let completed = 0;
  
  const checkComplete = () => {
    if (completed === Object.keys(queries).length) {
      res.json(stats);
    }
  };
  
  Object.keys(queries).forEach(key => {
    db.get(queries[key], key === 'today' ? [today] : key === 'thisMonth' ? [thisMonth + '%'] : [], (err, row) => {
      if (err) {
        stats[key] = 0;
      } else {
        stats[key] = row.count;
      }
      completed++;
      checkComplete();
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export for Vercel
module.exports = app;
