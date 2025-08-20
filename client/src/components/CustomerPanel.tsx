import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatJalaliDate, formatJalaliDatePersian, getPersianDayName } from '../utils/jalali';
import Notification from './Notification';
import LoadingSpinner from './LoadingSpinner';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

interface TimeSlot {
  time: string;
  available: boolean;
  disabled?: boolean;
}

interface ReservationForm {
  customer_name: string;
  phone_number: string;
  date: string;
  time: string;
}

const CustomerPanel: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning', message: string } | null>(null);
  const [form, setForm] = useState<ReservationForm>({
    customer_name: '',
    phone_number: '',
    date: '',
    time: ''
  });

  // Get today's date in Jalali format
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const response = await axios.get(getApiUrl(API_ENDPOINTS.TODAY));
        const today = response.data.date;
        setSelectedDate(today);
        setForm(prev => ({ ...prev, date: today }));
        fetchTimeSlots(today);
      } catch (error) {
        console.error('خطا در دریافت تاریخ امروز:', error);
      }
    };
    fetchToday();
  }, []);

  const fetchTimeSlots = async (date: string) => {
    try {
      setLoading(true);
      const encodedDate = encodeURIComponent(date);
      const response = await axios.get(getApiUrl(`${API_ENDPOINTS.AVAILABLE_SLOTS}/${encodedDate}`));
      
      if (response.data.isHoliday) {
        setNotification({ 
          type: 'warning', 
          message: `این تاریخ تعطیل است: ${response.data.reason}` 
        });
        setTimeSlots([]);
      } else {
        setTimeSlots(response.data.slots);
        if (response.data.workingHours) {
          setNotification({ 
            type: 'info', 
            message: `ساعات کاری: ${response.data.workingHours.start_time} تا ${response.data.workingHours.end_time}` 
          });
        }
        
        // Check if there are disabled slots
        const disabledSlots = response.data.slots.filter((slot: any) => slot.disabled);
        if (disabledSlots.length > 0) {
          setNotification({ 
            type: 'warning', 
            message: `برخی زمان‌ها غیرفعال هستند: ${disabledSlots.map((slot: any) => slot.time).join(', ')}` 
          });
        }
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'خطا در دریافت زمان‌های موجود' });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setForm(prev => ({ ...prev, date, time: '' }));
    if (date) {
      fetchTimeSlots(date);
    }
  };

  const handleTimeSlotClick = (timeSlot: TimeSlot) => {
    if (timeSlot.available) {
      setForm(prev => ({ ...prev, time: timeSlot.time }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      // فقط اعداد و کاراکترهای مجاز را قبول کن
      const cleanedValue = value.replace(/[^0-9]/g, '');
      
      // حداکثر 11 رقم (09 + 9 رقم)
      if (cleanedValue.length <= 11) {
        setForm(prev => ({ ...prev, [name]: cleanedValue }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.customer_name || !form.phone_number || !form.date || !form.time) {
      setNotification({ type: 'error', message: 'لطفاً تمام فیلدها را پر کنید' });
      return;
    }

    // Validation برای شماره تماس
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(form.phone_number)) {
      setNotification({ type: 'error', message: 'شماره تماس باید با 09 شروع شود و 11 رقم باشد' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(getApiUrl(API_ENDPOINTS.RESERVATIONS), form);
      setNotification({ type: 'success', message: response.data.message });
      
      // Reset form
      setForm({
        customer_name: '',
        phone_number: '',
        date: selectedDate,
        time: ''
      });
      
      // Refresh time slots
      fetchTimeSlots(selectedDate);
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || 'خطا در ثبت رزرو' 
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="card tilt-effect">
      <h2>رزرو وقت</h2>
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="customer_name">نام و نام خانوادگی:</label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            className="form-control"
            value={form.customer_name}
            onChange={handleInputChange}
            placeholder="نام و نام خانوادگی خود را وارد کنید"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone_number">شماره تماس:</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            className="form-control"
            value={form.phone_number}
            onChange={handleInputChange}
            placeholder="09xxxxxxxxx"
            maxLength={11}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">تاریخ:</label>
          <select
            id="date"
            name="date"
            className="form-control"
            value={selectedDate}
            onChange={handleDateChange}
            required
          >
            <option value="">انتخاب تاریخ</option>
            {generateDateOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>زمان:</label>
          {loading ? (
            <LoadingSpinner size="small" text="در حال بارگذاری زمان‌ها..." />
          ) : (
            <>
              <select
                name="time"
                className="form-control"
                value={form.time}
                onChange={handleInputChange}
                required
              >
                <option value="">انتخاب زمان</option>
                {timeSlots.map((slot, index) => (
                  <option 
                    key={index} 
                    value={slot.time}
                    disabled={!slot.available}
                  >
                    {slot.time} {slot.available ? '(موجود)' : slot.disabled ? '(غیرفعال)' : '(رزرو شده)'}
                  </option>
                ))}
              </select>
              
              <div className="time-slots" style={{ marginTop: '1rem' }}>
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`time-slot ${slot.available ? 'available' : slot.disabled ? 'disabled' : 'booked'}`}
                    onClick={() => slot.available && handleTimeSlotClick(slot)}
                    style={{
                      cursor: slot.available ? 'pointer' : 'not-allowed',
                      opacity: slot.available ? 1 : 0.6,
                      background: slot.disabled ? '#ff9800' : slot.available ? '#4caf50' : '#f44336'
                    }}
                  >
                    {slot.time}
                    {slot.disabled && <span style={{ marginRight: '0.5rem', fontSize: '0.8rem' }}>✗</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {form.time && (
          <div className="form-group">
            <label>زمان انتخاب شده:</label>
            <p className="alert alert-info">{form.time}</p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary tilt-effect"
          disabled={loading || !form.time}
        >
          {loading ? 'در حال ثبت...' : 'ثبت رزرو'}
        </button>
      </form>
    </div>
  );
};

export default CustomerPanel; 