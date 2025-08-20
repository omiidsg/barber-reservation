const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
require('moment-jalaali');
const jMoment = require('moment-jalaali');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database('./reservations.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS working_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS disabled_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    time TEXT NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Helper function to convert Gregorian to Jalali
function toJalali(date) {
  try {
    if (!date) {
      console.error('Empty date provided to toJalali');
      return null;
    }
    
    // Convert Gregorian to Jalali using jMoment
    const gregorianMoment = moment(date);
    const jalaliDate = jMoment(gregorianMoment).format('jYYYY/jMM/jDD');
    console.log('Converted Gregorian to Jalali:', date, '->', jalaliDate);
    return jalaliDate;
  } catch (error) {
    console.error('Error converting Gregorian to Jalali:', error);
    console.error('Input date:', date);
    return null;
  }
}

// Helper function to convert Jalali to Gregorian
function toGregorian(jalaliDate) {
  try {
    console.log('Converting Jalali date:', jalaliDate);
    
    if (!jalaliDate) {
      console.error('Empty date provided');
      return null;
    }
    
    const jalaliParts = jalaliDate.split('/');
    if (jalaliParts.length !== 3) {
      console.error('Invalid Jalali date format:', jalaliDate);
      return null;
    }
    
    const [year, month, day] = jalaliParts;
    
    // Remove 'j' prefix if present
    const cleanYear = year.replace('j', '');
    const cleanMonth = month.replace('j', '');
    const cleanDay = day.replace('j', '');
    
    // Convert Jalali to Gregorian using moment-jalaali
    const jalaliMoment = jMoment(`${cleanYear}/${cleanMonth}/${cleanDay}`, 'jYYYY/jMM/jDD');
    
    if (!jalaliMoment.isValid()) {
      console.error('Invalid Jalali date:', jalaliDate);
      return null;
    }
    
    const gregorianDate = jalaliMoment.format('YYYY-MM-DD');
    console.log('Converted to Gregorian:', gregorianDate);
    return gregorianDate;
  } catch (error) {
    console.error('Error converting Jalali to Gregorian:', error);
    console.error('Input date:', jalaliDate);
    return null;
  }
}

// Authentication middleware
function authenticateAdmin(req, res, next) {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
  }
}

function authenticateAdminHeader(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'احراز هویت مورد نیاز است' });
  }
  
  try {
    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    const [username, password] = credentials.split(':');
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      next();
    } else {
      res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'خطا در احراز هویت' });
  }
}

// Routes
app.post('/api/admin/login', authenticateAdmin, (req, res) => {
  res.json({ 
    message: 'ورود موفقیت‌آمیز',
    authenticated: true 
  });
});

// Get available time slots for a specific date
app.get('/api/available-slots/:date', (req, res) => {
  const { date } = req.params;
  const gregorianDate = toGregorian(date);
  
  // Check if date is holiday
  db.get(
    'SELECT * FROM holidays WHERE date = ?',
    [gregorianDate],
    (err, holiday) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در بررسی تعطیلات' });
      }
      
      if (holiday) {
        return res.json({ 
          slots: [],
          isHoliday: true,
          reason: holiday.reason || 'تعطیل'
        });
      }
      
      // Get working hours for specific date first, then default
      db.get(
        'SELECT * FROM working_hours WHERE date = ? AND is_active = 1 ORDER BY id DESC LIMIT 1',
        [gregorianDate],
        (err, specificWorkingHours) => {
          if (err) {
            return res.status(500).json({ error: 'خطا در دریافت ساعات کاری' });
          }
          
          // If no specific hours for this date, get default hours
          if (!specificWorkingHours) {
            db.get(
              'SELECT * FROM working_hours WHERE date IS NULL AND is_active = 1 ORDER BY id DESC LIMIT 1',
              (err, defaultWorkingHours) => {
                if (err) {
                  return res.status(500).json({ error: 'خطا در دریافت ساعات کاری' });
                }
                
                const startHour = defaultWorkingHours ? parseInt(defaultWorkingHours.start_time.split(':')[0]) : 10;
                const endHour = defaultWorkingHours ? parseInt(defaultWorkingHours.end_time.split(':')[0]) : 20;
                
                processTimeSlots(startHour, endHour, defaultWorkingHours);
              }
            );
          } else {
            const startHour = parseInt(specificWorkingHours.start_time.split(':')[0]);
            const endHour = parseInt(specificWorkingHours.end_time.split(':')[0]);
            
            processTimeSlots(startHour, endHour, specificWorkingHours);
          }
          
          function processTimeSlots(startHour, endHour, workingHours) {
            // Get booked times and disabled slots
            db.all(
              'SELECT time FROM reservations WHERE date = ?',
              [gregorianDate],
              (err, bookedRows) => {
                if (err) {
                  return res.status(500).json({ error: 'خطا در دریافت اطلاعات' });
                }
                
                const bookedTimes = bookedRows.map(row => row.time);
                
                // Get disabled slots for specific date only (no global disabled slots)
                db.all(
                  'SELECT time FROM disabled_slots WHERE date = ? AND is_active = 1',
                  [gregorianDate],
                  (err, dateSpecificDisabledRows) => {
                    if (err) {
                      return res.status(500).json({ error: 'خطا در دریافت بازه‌های غیرفعال' });
                    }
                    
                    const dateSpecificDisabledTimes = dateSpecificDisabledRows.map(row => row.time);
                    
                    const allTimeSlots = [];
                    
                    // Generate time slots based on working hours
                    for (let hour = startHour; hour < endHour; hour++) {
                      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                      const isBooked = bookedTimes.includes(timeSlot);
                      const isDisabled = dateSpecificDisabledTimes.includes(timeSlot);
                    
                      allTimeSlots.push({
                        time: timeSlot,
                        available: !isBooked && !isDisabled,
                        disabled: isDisabled
                      });
                    }
                    
                    res.json({ 
                      slots: allTimeSlots,
                      workingHours: { start_time: workingHours?.start_time || '10:00', end_time: workingHours?.end_time || '20:00' }
                    });
                  }
                );
              }
            );
          }
        }
      );
    }
  );
});

// Create a new reservation
app.post('/api/reservations', (req, res) => {
  const { customer_name, phone_number, date, time } = req.body;
  
  if (!customer_name || !phone_number || !date || !time) {
    return res.status(400).json({ error: 'تمام فیلدها الزامی هستند' });
  }
  
  // Validation برای شماره تماس
  const phoneRegex = /^09\d{9}$/;
  if (!phoneRegex.test(phone_number)) {
    return res.status(400).json({ error: 'شماره تماس باید با 09 شروع شود و 11 رقم باشد' });
  }
  
  const gregorianDate = toGregorian(date);
  
  // Check if slot is already booked
  db.get(
    'SELECT id FROM reservations WHERE date = ? AND time = ?',
    [gregorianDate, time],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در بررسی رزرو' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'این زمان قبلاً رزرو شده است' });
      }
      
      // Create reservation
      db.run(
        'INSERT INTO reservations (customer_name, phone_number, date, time) VALUES (?, ?, ?, ?)',
        [customer_name, phone_number, gregorianDate, time],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'خطا در ثبت رزرو' });
          }
          
          res.json({ 
            message: 'رزرو با موفقیت ثبت شد',
            id: this.lastID 
          });
        }
      );
    }
  );
});

// Get all reservations (admin panel) - requires authentication
app.get('/api/admin/reservations', authenticateAdminHeader, (req, res) => {
  db.all(
    'SELECT * FROM reservations ORDER BY date DESC, time ASC',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در دریافت رزروها' });
      }
      
      const reservations = rows.map(row => ({
        ...row,
        date: toJalali(row.date)
      }));
      
      res.json(reservations);
    }
  );
});

// Get holidays
app.get('/api/admin/holidays', authenticateAdminHeader, (req, res) => {
  db.all(
    'SELECT * FROM holidays ORDER BY date ASC',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در دریافت تعطیلات' });
      }
      
      const holidays = rows.map(row => ({
        ...row,
        date: toJalali(row.date)
      }));
      
      res.json(holidays);
    }
  );
});

// Add holiday
app.post('/api/admin/holidays', authenticateAdminHeader, (req, res) => {
  const { date, reason } = req.body;
  
  if (!date || !reason) {
    return res.status(400).json({ error: 'تاریخ و دلیل تعطیلی الزامی است' });
  }
  
  const gregorianDate = toGregorian(date);
  
  if (!gregorianDate) {
    return res.status(400).json({ error: 'فرمت تاریخ نامعتبر است' });
  }
  
  // Check if holiday already exists
  db.get(
    'SELECT id FROM holidays WHERE date = ?',
    [gregorianDate],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در بررسی تعطیلات' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'این تاریخ قبلاً به عنوان تعطیل ثبت شده است' });
      }
      
      // Add holiday
      db.run(
        'INSERT INTO holidays (date, reason) VALUES (?, ?)',
        [gregorianDate, reason],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'خطا در ثبت تعطیل' });
          }
          
          res.json({ 
            message: 'تعطیل با موفقیت ثبت شد',
            id: this.lastID 
          });
        }
      );
    }
  );
});

// Delete holiday
app.delete('/api/admin/holidays/:id', authenticateAdminHeader, (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM holidays WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'خطا در حذف تعطیل' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'تعطیل یافت نشد' });
      }
      
      res.json({ message: 'تعطیل با موفقیت حذف شد' });
    }
  );
});

// Get working hours
app.get('/api/admin/working-hours', authenticateAdminHeader, (req, res) => {
  const { date } = req.query;
  
  if (date) {
    // Get specific date working hours
    db.get(
      'SELECT * FROM working_hours WHERE date = ? AND is_active = 1 ORDER BY id DESC LIMIT 1',
      [date],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'خطا در دریافت ساعات کاری' });
        }
        
        res.json(row || { start_time: '10:00', end_time: '20:00' });
      }
    );
  } else {
    // Get default working hours
    db.get(
      'SELECT * FROM working_hours WHERE date IS NULL AND is_active = 1 ORDER BY id DESC LIMIT 1',
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'خطا در دریافت ساعات کاری' });
        }
        
        res.json(row || { start_time: '10:00', end_time: '20:00' });
      }
    );
  }
});

// Get all working hours
app.get('/api/admin/working-hours/all', authenticateAdminHeader, (req, res) => {
  db.all(
    'SELECT * FROM working_hours WHERE is_active = 1 ORDER BY date ASC, id DESC',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در دریافت ساعات کاری' });
      }
      
      const workingHours = rows.map(row => ({
        ...row,
        date: row.date ? toJalali(row.date) : null
      }));
      
      res.json(workingHours);
    }
  );
});

// Update working hours
app.put('/api/admin/working-hours', authenticateAdminHeader, (req, res) => {
  const { start_time, end_time, date } = req.body;
  
  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'ساعت شروع و پایان الزامی است' });
  }
  
  const gregorianDate = date ? toGregorian(date) : null;
  
  // Deactivate existing working hours for this date (or default)
  db.run(
    'UPDATE working_hours SET is_active = 0 WHERE date IS NULL AND is_active = 1',
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در به‌روزرسانی ساعات کاری' });
      }
      
      // Insert new working hours
      db.run(
        'INSERT INTO working_hours (start_time, end_time, date) VALUES (?, ?, ?)',
        [start_time, end_time, gregorianDate],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'خطا در ثبت ساعات کاری' });
          }
          
          res.json({ 
            message: 'ساعات کاری با موفقیت به‌روزرسانی شد',
            id: this.lastID 
          });
        }
      );
    }
  );
});

// Get disabled slots
app.get('/api/admin/disabled-slots', authenticateAdminHeader, (req, res) => {
  const { date } = req.query;
  
  if (date) {
    // Get specific date disabled slots
    db.all(
      'SELECT * FROM disabled_slots WHERE date = ? AND is_active = 1 ORDER BY time ASC',
      [date],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'خطا در دریافت بازه‌های غیرفعال' });
        }
        
        const disabledSlots = rows.map(row => ({
          ...row,
          date: toJalali(row.date)
        }));
        
        res.json(disabledSlots);
      }
    );
  } else {
    // Get all disabled slots
    db.all(
      'SELECT * FROM disabled_slots WHERE is_active = 1 ORDER BY date ASC, time ASC',
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'خطا در دریافت بازه‌های غیرفعال' });
        }
        
        const disabledSlots = rows.map(row => ({
          ...row,
          date: row.date ? toJalali(row.date) : null
        }));
        
        res.json(disabledSlots);
      }
    );
  }
});

// Add disabled slot
app.post('/api/admin/disabled-slots', authenticateAdminHeader, (req, res) => {
  const { time, reason, date } = req.body;
  
  if (!time || !reason) {
    return res.status(400).json({ error: 'زمان و دلیل غیرفعال‌سازی الزامی است' });
  }
  
  const gregorianDate = date ? toGregorian(date) : null;
  
  // Insert with date if provided
  const insertQuery = gregorianDate 
    ? 'INSERT INTO disabled_slots (time, reason, date) VALUES (?, ?, ?)'
    : 'INSERT INTO disabled_slots (time, reason) VALUES (?, ?)';
  
  const insertParams = gregorianDate ? [time, reason, gregorianDate] : [time, reason];
  
  db.run(insertQuery, insertParams, function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'خطا در ثبت بازه غیرفعال' });
    }
    
    res.json({ 
      message: 'بازه غیرفعال با موفقیت ثبت شد',
      id: this.lastID 
    });
  });
});

// Delete disabled slot
app.delete('/api/admin/disabled-slots/:id', authenticateAdminHeader, (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM disabled_slots WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'خطا در حذف بازه غیرفعال' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'بازه غیرفعال یافت نشد' });
      }
      
      res.json({ message: 'بازه غیرفعال با موفقیت حذف شد' });
    }
  );
});

// Update reservation
app.put('/api/admin/reservations/:id', authenticateAdminHeader, (req, res) => {
  const { id } = req.params;
  const { customer_name, phone_number, date, time } = req.body;
  
  if (!customer_name || !phone_number || !date || !time) {
    return res.status(400).json({ error: 'تمام فیلدها الزامی هستند' });
  }
  
  const gregorianDate = toGregorian(date);
  
  // Check if slot is already booked by another reservation
  db.get(
    'SELECT id FROM reservations WHERE date = ? AND time = ? AND id != ?',
    [gregorianDate, time, id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'خطا در بررسی رزرو' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'این زمان قبلاً رزرو شده است' });
      }
      
      // Update reservation
      db.run(
        'UPDATE reservations SET customer_name = ?, phone_number = ?, date = ?, time = ? WHERE id = ?',
        [customer_name, phone_number, gregorianDate, time, id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'خطا در به‌روزرسانی رزرو' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'رزرو یافت نشد' });
          }
          
          res.json({ message: 'رزرو با موفقیت به‌روزرسانی شد' });
        }
      );
    }
  );
});

// Delete reservation
app.delete('/api/admin/reservations/:id', authenticateAdminHeader, (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM reservations WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'خطا در حذف رزرو' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'رزرو یافت نشد' });
      }
      
      res.json({ message: 'رزرو با موفقیت حذف شد' });
    }
  );
});

// Get today's date in Jalali format
app.get('/api/today', (req, res) => {
  const today = new Date();
  const jalaliDate = toJalali(today.toISOString().split('T')[0]);
  res.json({ date: jalaliDate });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 