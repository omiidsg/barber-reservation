import React, { useState } from 'react';
import { formatJalaliDate, formatJalaliDatePersian, getPersianDayName } from '../utils/jalali';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilterDate: (date: string) => void;
  onFilterTime: (time: string) => void;
  onClearFilters: () => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearch,
  onFilterDate,
  onFilterTime,
  onClearFilters
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // تابع تولید گزینه‌های تاریخ شمسی
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleTimeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const time = e.target.value;
    setSelectedTime(time);
    onFilterTime(time);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDate('');
    setSelectedTime('');
    onClearFilters();
  };

  const timeSlots = [];
  for (let hour = 10; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '15px',
      padding: '1.5rem',
      marginBottom: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h3 style={{
          margin: 0,
          fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
          fontWeight: 600,
          color: '#333',
        }}>
          جستجو و فیلتر
        </h3>
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          style={{
            background: 'rgba(102, 126, 234, 0.8)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
          }}
        >
          فیلترها
          <span style={{
            transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            fontSize: '1.2rem',
          }}>
            ▼
          </span>
        </button>
      </div>

      {/* جستجو همیشه نمایش داده می‌شود */}
      <div className="form-group">
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: 600,
          color: '#333',
          textAlign: 'center',
          fontSize: '0.95rem',
        }}>
          جستجو:
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="جستجو بر اساس نام یا شماره تماس..."
          value={searchQuery}
          onChange={handleSearch}
          style={{
            textAlign: 'center',
          }}
        />
      </div>

      {/* فیلترها فقط وقتی باز است نمایش داده می‌شوند */}
      {isFilterOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        }}>
          {/* فیلتر تاریخ */}
          <div className="form-group">
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333',
              textAlign: 'center',
              fontSize: '0.95rem',
            }}>
              فیلتر تاریخ:
            </label>
            <select
              className="form-control"
              value={selectedDate}
              onChange={(e) => {
                const date = e.target.value;
                setSelectedDate(date);
                onFilterDate(date);
              }}
              style={{
                textAlign: 'center',
              }}
            >
              <option value="">همه تاریخ‌ها</option>
              {generateDateOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* فیلتر زمان */}
          <div className="form-group">
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333',
              textAlign: 'center',
              fontSize: '0.95rem',
            }}>
              فیلتر زمان:
            </label>
            <select
              className="form-control"
              value={selectedTime}
              onChange={handleTimeFilter}
              style={{
                textAlign: 'center',
              }}
            >
              <option value="">همه زمان‌ها</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* دکمه پاک کردن فیلترها */}
          {(searchQuery || selectedDate || selectedTime) && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearFilters}
              style={{
                marginTop: '1rem',
              }}
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter; 