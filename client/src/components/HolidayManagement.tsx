import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatJalaliDate, formatJalaliDatePersian, getPersianDayName } from '../utils/jalali';
import Notification from './Notification';
import LoadingSpinner from './LoadingSpinner';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

interface Holiday {
  id: number;
  date: string;
  reason: string;
  created_at: string;
}

interface WorkingHours {
  start_time: string;
  end_time: string;
  date?: string;
}

interface DisabledSlot {
  id: number;
  time: string;
  reason: string;
  date?: string;
  created_at: string;
}

const HolidayManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start_time: '10:00', end_time: '20:00' });
  const [selectedDate, setSelectedDate] = useState('');
  const [isSpecificDate, setIsSpecificDate] = useState(false);
  const [disabledSlots, setDisabledSlots] = useState<DisabledSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning', message: string } | null>(null);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [showAddDisabledSlot, setShowAddDisabledSlot] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });
  const [newDisabledSlot, setNewDisabledSlot] = useState({ time: '', reason: '' });
  const [isSpecificDateDisabled, setIsSpecificDateDisabled] = useState(false);
  const [selectedDisabledDate, setSelectedDisabledDate] = useState('');

  useEffect(() => {
    fetchHolidays();
    fetchWorkingHours();
    fetchDisabledSlots();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl(API_ENDPOINTS.ADMIN_HOLIDAYS), {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`
        }
      });
      setHolidays(response.data);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.response?.data?.error || 'خطا در دریافت تعطیلات' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkingHours = async () => {
    try {
      const response = await axios.get(getApiUrl(API_ENDPOINTS.ADMIN_WORKING_HOURS), {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`
        }
      });
      setWorkingHours(response.data);
    } catch (error: any) {
      console.error('خطا در دریافت ساعات کاری:', error);
    }
  };

  const fetchDisabledSlots = async () => {
    try {
      const response = await axios.get(getApiUrl(API_ENDPOINTS.ADMIN_DISABLED_SLOTS), {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`
        }
      });
      setDisabledSlots(response.data);
    } catch (error: any) {
      console.error('خطا در دریافت بازه‌های غیرفعال:', error);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newHoliday.date) {
      setNotification({ type: 'error', message: 'لطفاً تاریخ را انتخاب کنید' });
      return;
    }

    try {
      setLoading(true);
      console.log('Sending holiday data:', newHoliday); // برای دیباگ
      const response = await axios.post(getApiUrl(API_ENDPOINTS.ADMIN_HOLIDAYS), newHoliday, {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response:', response.data); // برای دیباگ
      setNotification({ type: 'success', message: 'تعطیلی با موفقیت اضافه شد' });
      setNewHoliday({ date: '', reason: '' });
      setShowAddHoliday(false);
      fetchHolidays();
    } catch (error: any) {
      console.error('Error adding holiday:', error); // برای دیباگ
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || 'خطا در اضافه کردن تعطیلی' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!window.confirm('آیا از حذف این تعطیلی اطمینان دارید؟')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/admin/holidays/${id}`, {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`
        }
      });
      
      setNotification({ type: 'success', message: 'تعطیلی با موفقیت حذف شد' });
      fetchHolidays();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.response?.data?.error || 'خطا در حذف تعطیلی' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkingHours = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workingHours.start_time || !workingHours.end_time) {
      setNotification({ type: 'error', message: 'لطفاً ساعت شروع و پایان را وارد کنید' });
      return;
    }

    if (isSpecificDate && !selectedDate) {
      setNotification({ type: 'error', message: 'لطفاً تاریخ را انتخاب کنید' });
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        ...workingHours,
        date: isSpecificDate ? selectedDate : undefined
      };
      
      await axios.put('/api/admin/working-hours', requestData, {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`
        }
      });
      
      const message = isSpecificDate 
        ? `ساعات کاری برای تاریخ ${selectedDate} با موفقیت بروزرسانی شد`
        : 'ساعات کاری پیش‌فرض با موفقیت بروزرسانی شد';
      
      setNotification({ type: 'success', message });
      setSelectedDate('');
      setIsSpecificDate(false);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.response?.data?.error || 'خطا در بروزرسانی ساعات کاری' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDisabledSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDisabledSlot.time) {
      setNotification({ type: 'error', message: 'لطفاً زمان را انتخاب کنید' });
      return;
    }

    if (isSpecificDateDisabled && !selectedDisabledDate) {
      setNotification({ type: 'error', message: 'لطفاً تاریخ را انتخاب کنید' });
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        ...newDisabledSlot,
        date: isSpecificDateDisabled ? selectedDisabledDate : undefined
      };
      
              await axios.post(getApiUrl(API_ENDPOINTS.ADMIN_DISABLED_SLOTS), requestData, {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`
        }
      });
      
      const message = isSpecificDateDisabled 
        ? `بازه غیرفعال برای تاریخ ${selectedDisabledDate} با موفقیت اضافه شد`
        : 'بازه غیرفعال با موفقیت اضافه شد';
      
      setNotification({ type: 'success', message });
      setNewDisabledSlot({ time: '', reason: '' });
      setSelectedDisabledDate('');
      setIsSpecificDateDisabled(false);
      setShowAddDisabledSlot(false);
      fetchDisabledSlots();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.response?.data?.error || 'خطا در اضافه کردن بازه غیرفعال' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDisabledSlot = async (id: number) => {
    if (!window.confirm('آیا از حذف این بازه غیرفعال اطمینان دارید؟')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/admin/disabled-slots/${id}`, {
        headers: {
          'Authorization': `Basic ${btoa('admin:123456')}`
        }
      });
      
      setNotification({ type: 'success', message: 'بازه غیرفعال با موفقیت حذف شد' });
      fetchDisabledSlots();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.response?.data?.error || 'خطا در حذف بازه غیرفعال' });
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

  const timeOptions = [];
  for (let hour = 6; hour <= 23; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Generate time slots based on current working hours for disabled slots
  const workingTimeSlots = [];
  const startHour = parseInt(workingHours.start_time.split(':')[0]);
  const endHour = parseInt(workingHours.end_time.split(':')[0]);
  for (let hour = startHour; hour < endHour; hour++) {
    workingTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return (
    <div className="card">
      <h2>مدیریت تعطیلات و ساعات کاری</h2>
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* مدیریت ساعات کاری */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>ساعات کاری</h3>
        <form onSubmit={handleUpdateWorkingHours}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>ساعت شروع:</label>
              <select
                className="form-control"
                value={workingHours.start_time}
                onChange={(e) => setWorkingHours(prev => ({ ...prev, start_time: e.target.value }))}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>ساعت پایان:</label>
              <select
                className="form-control"
                value={workingHours.end_time}
                onChange={(e) => setWorkingHours(prev => ({ ...prev, end_time: e.target.value }))}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>
                <input
                  type="checkbox"
                  checked={isSpecificDate}
                  onChange={(e) => {
                    setIsSpecificDate(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedDate('');
                    }
                  }}
                  style={{ marginLeft: '0.5rem' }}
                />
                برای تاریخ خاص
              </label>
            </div>
          </div>
          
          {isSpecificDate && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>تاریخ:</label>
              <select
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required={isSpecificDate}
              >
                <option value="">انتخاب تاریخ</option>
                {generateDateOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : isSpecificDate ? 'بروزرسانی ساعات کاری برای تاریخ انتخاب شده' : 'بروزرسانی ساعات کاری پیش‌فرض'}
            </button>
          </div>
        </form>
      </div>

      {/* مدیریت تعطیلات */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>تعطیلات</h3>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => setShowAddHoliday(!showAddHoliday)}
          >
            {showAddHoliday ? 'انصراف' : 'افزودن تعطیلی'}
          </button>
        </div>

        {showAddHoliday && (
          <form onSubmit={handleAddHoliday} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>تاریخ:</label>
                <select
                  className="form-control"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
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
              <div className="form-group" style={{ flex: 1 }}>
                <label>دلیل (اختیاری):</label>
                <input
                  type="text"
                  className="form-control"
                  value={newHoliday.reason}
                  onChange={(e) => setNewHoliday(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="مثل: تعطیل رسمی"
                />
              </div>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? <LoadingSpinner size="small" /> : 'افزودن'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <LoadingSpinner text="در حال بارگذاری..." />
        ) : (
          <div>
            {holidays.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>هیچ تعطیلی ثبت نشده است</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {holidays.map(holiday => (
                  <div
                    key={holiday.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      margin: '0.5rem 0',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div>
                      <strong>{holiday.date}</strong>
                      {holiday.reason && <span style={{ marginRight: '0.5rem', color: '#666' }}> - {holiday.reason}</span>}
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* مدیریت بازه‌های غیرفعال */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>بازه‌های غیرفعال</h3>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => setShowAddDisabledSlot(!showAddDisabledSlot)}
          >
            {showAddDisabledSlot ? 'انصراف' : 'افزودن بازه غیرفعال'}
          </button>
        </div>

        {showAddDisabledSlot && (
          <form onSubmit={handleAddDisabledSlot} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>زمان:</label>
                <select
                  className="form-control"
                  value={newDisabledSlot.time}
                  onChange={(e) => setNewDisabledSlot(prev => ({ ...prev, time: e.target.value }))}
                  required
                >
                  <option value="">انتخاب زمان</option>
                  {workingTimeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>دلیل (اختیاری):</label>
                <input
                  type="text"
                  className="form-control"
                  value={newDisabledSlot.reason}
                  onChange={(e) => setNewDisabledSlot(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="مثل: ناهار"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={isSpecificDateDisabled}
                    onChange={(e) => {
                      setIsSpecificDateDisabled(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedDisabledDate('');
                      }
                    }}
                    style={{ marginLeft: '0.5rem' }}
                  />
                  برای تاریخ خاص
                </label>
              </div>
            </div>
            
            {isSpecificDateDisabled && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>تاریخ:</label>
                <select
                  className="form-control"
                  value={selectedDisabledDate}
                  onChange={(e) => setSelectedDisabledDate(e.target.value)}
                  required={isSpecificDateDisabled}
                >
                  <option value="">انتخاب تاریخ</option>
                  {generateDateOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="btn btn-warning" disabled={loading}>
                {loading ? <LoadingSpinner size="small" /> : isSpecificDateDisabled ? 'افزودن بازه غیرفعال برای تاریخ انتخاب شده' : 'افزودن بازه غیرفعال'}
              </button>
            </div>
          </form>
        )}

        <div>
          {disabledSlots.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>هیچ بازه غیرفعالی ثبت نشده است</p>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {disabledSlots.map(slot => (
                <div
                  key={slot.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    margin: '0.5rem 0',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div>
                    <strong>{slot.time}</strong>
                    {slot.reason && <span style={{ marginRight: '0.5rem', color: '#666' }}> - {slot.reason}</span>}
                    {slot.date && <span style={{ marginRight: '0.5rem', color: '#007bff' }}> (تاریخ: {slot.date})</span>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDeleteDisabledSlot(slot.id)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HolidayManagement; 