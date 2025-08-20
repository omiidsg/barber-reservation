import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatJalaliDate, formatJalaliDatePersian, getPersianDayName, jalaliToGregorian } from '../utils/jalali';
import Notification from './Notification';
import LoadingSpinner from './LoadingSpinner';
import SearchAndFilter from './SearchAndFilter';
import Statistics from './Statistics';
import HolidayManagement from './HolidayManagement';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

interface Reservation {
  id: number;
  customer_name: string;
  phone_number: string;
  date: string;
  time: string;
  created_at: string;
}

interface EditForm {
  customer_name: string;
  phone_number: string;
  date: string;
  time: string;
}

interface LoginForm {
  username: string;
  password: string;
}

const AdminPanel: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning', message: string } | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showHolidayManagement, setShowHolidayManagement] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('adminAuthenticated');
    return saved === 'true';
  });
  const [loginForm, setLoginForm] = useState<LoginForm>(() => {
    const saved = localStorage.getItem('adminCredentials');
    return saved ? JSON.parse(saved) : { username: '', password: '' };
  });
  const [editForm, setEditForm] = useState<EditForm>({
    customer_name: '',
    phone_number: '',
    date: '',
    time: ''
  });
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setFilteredReservations(reservations);
  }, [reservations]);

  // بررسی احراز هویت هنگام focus شدن صفحه
  useEffect(() => {
    const handleFocus = () => {
      const savedAuth = localStorage.getItem('adminAuthenticated');
      if (savedAuth === 'true' && !isAuthenticated) {
        setIsAuthenticated(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await axios.post(getApiUrl(API_ENDPOINTS.ADMIN_LOGIN), loginForm);
      
      if (response.data.authenticated) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminCredentials', JSON.stringify(loginForm));
        setNotification({ type: 'success', message: 'ورود موفقیت‌آمیز' });
      }
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || 'خطا در ورود' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminCredentials');
    setNotification({ type: 'info', message: 'خروج انجام شد' });
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const authHeader = `Basic ${btoa(`${loginForm.username}:${loginForm.password}`)}`;
      const response = await axios.get(getApiUrl(API_ENDPOINTS.ADMIN_RESERVATIONS), {
        headers: { Authorization: authHeader }
      });
      setReservations(response.data);
      setNotification({ type: 'success', message: 'رزروها با موفقیت بروزرسانی شدند' });
    } catch (error) {
      setNotification({ type: 'error', message: 'خطا در دریافت رزروها' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این رزرو را حذف کنید؟')) {
      return;
    }

    try {
      const authHeader = `Basic ${btoa(`${loginForm.username}:${loginForm.password}`)}`;
      await axios.delete(`/api/admin/reservations/${id}`, {
        headers: { Authorization: authHeader }
      });
      setNotification({ type: 'success', message: 'رزرو با موفقیت حذف شد' });
      fetchReservations();
    } catch (error) {
      setNotification({ type: 'error', message: 'خطا در حذف رزرو' });
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setEditForm({
      customer_name: reservation.customer_name,
      phone_number: reservation.phone_number,
      date: reservation.date,
      time: reservation.time
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingReservation) return;

    // Validation برای شماره تماس
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(editForm.phone_number)) {
      setNotification({ type: 'error', message: 'شماره تماس باید با 09 شروع شود و 11 رقم باشد' });
      return;
    }

    try {
      const authHeader = `Basic ${btoa(`${loginForm.username}:${loginForm.password}`)}`;
      await axios.put(`/api/admin/reservations/${editingReservation.id}`, editForm, {
        headers: { Authorization: authHeader }
      });
      setNotification({ type: 'success', message: 'رزرو با موفقیت بروزرسانی شد' });
      setEditingReservation(null);
      fetchReservations();
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || 'خطا در بروزرسانی رزرو' 
      });
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      // فقط اعداد و کاراکترهای مجاز را قبول کن
      const cleanedValue = value.replace(/[^0-9]/g, '');
      
      // حداکثر 11 رقم (09 + 9 رقم)
      if (cleanedValue.length <= 11) {
        setEditForm(prev => ({ ...prev, [name]: cleanedValue }));
      }
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredReservations(reservations);
      return;
    }
    
    const filtered = reservations.filter(reservation =>
      reservation.customer_name.toLowerCase().includes(query.toLowerCase()) ||
      reservation.phone_number.includes(query)
    );
    setFilteredReservations(filtered);
  };

  const handleFilterDate = (dateFilter: string) => {
    let filtered = reservations;
    
    if (dateFilter) {
      // چون تاریخ‌ها در سرور به شمسی تبدیل شده‌اند، مستقیماً مقایسه می‌کنیم
      filtered = reservations.filter(r => r.date === dateFilter);
    }
    
    setFilteredReservations(filtered);
  };

  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    if (date) {
      const filtered = reservations.filter(r => r.date === date);
      setFilteredReservations(filtered);
    } else {
      setFilteredReservations(reservations);
    }
  };

  const handleFilterTime = (timeFilter: string) => {
    if (!timeFilter) {
      setFilteredReservations(reservations);
      return;
    }
    
    const filtered = reservations.filter(r => r.time === timeFilter);
    setFilteredReservations(filtered);
  };

  const handleClearFilters = () => {
    setFilteredReservations(reservations);
  };

  const generateDateOptions = (): Array<{value: string, label: string}> => {
    const options: Array<{value: string, label: string}> = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000));
      const jalaliDate = formatJalaliDate(date);
      const persianJalaliDate = formatJalaliDatePersian(date);
      const dayName = getPersianDayName(date);
      
      options.push({
        value: jalaliDate,
        label: `${dayName} ${persianJalaliDate}`
      });
    }
    
    return options;
  };

  const timeSlots = [];
  for (let hour = 10; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  if (!isAuthenticated) {
    return (
      <div className="card tilt-effect">
        <h2>ورود به پنل مدیریت</h2>
        
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">نام کاربری:</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-control"
              value={loginForm.username}
              onChange={handleLoginInputChange}
              placeholder="نام کاربری را وارد کنید"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">رمز عبور:</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={loginForm.password}
              onChange={handleLoginInputChange}
              placeholder="رمز عبور را وارد کنید"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary tilt-effect"
            disabled={loading}
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>


      </div>
    );
  }

  return (
    <div className="card tilt-effect">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>مدیریت رزروها</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-success tilt-effect"
            onClick={() => setShowStatistics(!showStatistics)}
          >
            {showStatistics ? 'مخفی کردن آمار' : 'نمایش آمار'}
          </button>
          <button
            className="btn btn-warning tilt-effect"
            onClick={() => setShowHolidayManagement(!showHolidayManagement)}
          >
            {showHolidayManagement ? 'مخفی کردن مدیریت' : 'مدیریت تعطیلات'}
          </button>
          <button
            className="btn btn-primary tilt-effect"
            onClick={fetchReservations}
            disabled={loading}
          >
            {loading ? 'در حال بارگذاری...' : 'بروزرسانی'}
          </button>
          <button
            className="btn btn-danger tilt-effect"
            onClick={handleLogout}
          >
            خروج
          </button>
        </div>
      </div>
      
      {showStatistics && (
        <Statistics reservations={reservations} />
      )}

      {showHolidayManagement && (
        <HolidayManagement />
      )}

      <div className="date-selection-container">
        <h4>انتخاب تاریخ برای مشاهده رزروها:</h4>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            className="form-control"
            value={selectedDate}
            onChange={(e) => handleDateSelection(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">همه تاریخ‌ها</option>
            {generateDateOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="btn btn-secondary"
            onClick={() => handleDateSelection('')}
          >
            پاک کردن فیلتر
          </button>
        </div>
        {selectedDate && (
          <p style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            نمایش رزروهای تاریخ: <strong>{generateDateOptions().find(opt => opt.value === selectedDate)?.label}</strong>
          </p>
        )}
      </div>

      <SearchAndFilter
        onSearch={handleSearch}
        onFilterDate={handleFilterDate}
        onFilterTime={handleFilterTime}
        onClearFilters={handleClearFilters}
      />

      {loading ? (
        <LoadingSpinner text="در حال بارگذاری رزروها..." />
      ) : (
        <table className="reservations-table">
          <thead>
            <tr>
              <th>نام مشتری</th>
              <th>شماره تماس</th>
              <th>تاریخ</th>
              <th>زمان</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  هیچ رزروی یافت نشد
                </td>
              </tr>
            ) : (
              filteredReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.customer_name}</td>
                  <td>{reservation.phone_number}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.time}</td>
                  <td>
                    <button
                      className="btn btn-success"
                      onClick={() => handleEdit(reservation)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      ویرایش
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(reservation.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {editingReservation && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">ویرایش رزرو</h3>
              <button
                className="close-btn"
                onClick={() => setEditingReservation(null)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit_customer_name">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  id="edit_customer_name"
                  name="customer_name"
                  className="form-control"
                  value={editForm.customer_name}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_phone_number">شماره تماس:</label>
                <input
                  type="tel"
                  id="edit_phone_number"
                  name="phone_number"
                  className="form-control"
                  value={editForm.phone_number}
                  onChange={handleEditInputChange}
                  placeholder="09xxxxxxxxx"
                  maxLength={11}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_date">تاریخ:</label>
                <select
                  id="edit_date"
                  name="date"
                  className="form-control"
                  value={editForm.date}
                  onChange={handleEditInputChange}
                  required
                >
                  {generateDateOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit_time">زمان:</label>
                <select
                  id="edit_time"
                  name="time"
                  className="form-control"
                  value={editForm.time}
                  onChange={handleEditInputChange}
                  required
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-success">
                  ذخیره تغییرات
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setEditingReservation(null)}
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel; 