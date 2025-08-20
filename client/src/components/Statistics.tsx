import React from 'react';

interface Reservation {
  id: number;
  customer_name: string;
  phone_number: string;
  date: string;
  time: string;
  created_at: string;
}

interface StatisticsProps {
  reservations: Reservation[];
}

const Statistics: React.FC<StatisticsProps> = ({ reservations }) => {
  const getTotalReservations = () => reservations.length;

  const getTodayReservations = () => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter(r => r.date === today).length;
  };

  const getThisWeekReservations = () => {
    const today = new Date();
    const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
    
    return reservations.filter(r => {
      const reservationDate = new Date(r.date);
      return reservationDate >= weekStart && reservationDate <= weekEnd;
    }).length;
  };

  const getMostPopularTime = () => {
    const timeCounts: { [key: string]: number } = {};
    reservations.forEach(r => {
      timeCounts[r.time] = (timeCounts[r.time] || 0) + 1;
    });
    
    const mostPopular = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0];
    return mostPopular ? mostPopular[0] : 'هیچ';
  };

  const getAverageReservationsPerDay = () => {
    const uniqueDates = new Set(reservations.map(r => r.date));
    return uniqueDates.size > 0 ? (reservations.length / uniqueDates.size).toFixed(1) : '0';
  };

  const getReservationsByTime = () => {
    const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    return timeSlots.map(time => ({
      time,
      count: reservations.filter(r => r.time === time).length
    }));
  };

  const timeData = getReservationsByTime();

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '20px',
      padding: '2rem',
      marginBottom: '2rem',
    }}>
      <h3 style={{
        margin: '0 0 2rem 0',
        fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
        fontWeight: 700,
        color: '#333',
        textAlign: 'center',
        fontSize: '1.5rem',
      }}>
        آمار رزروها
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* کارت آمار کلی */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: '15px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#667eea',
            marginBottom: '0.5rem',
          }}>
            {getTotalReservations()}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#666',
            fontWeight: 500,
          }}>
            کل رزروها
          </div>
        </div>

        {/* کارت رزروهای امروز */}
        <div style={{
          background: 'rgba(40, 167, 69, 0.1)',
          border: '1px solid rgba(40, 167, 69, 0.3)',
          borderRadius: '15px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#28a745',
            marginBottom: '0.5rem',
          }}>
            {getTodayReservations()}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#666',
            fontWeight: 500,
          }}>
            رزروهای امروز
          </div>
        </div>

        {/* کارت رزروهای این هفته */}
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '15px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#ffc107',
            marginBottom: '0.5rem',
          }}>
            {getThisWeekReservations()}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#666',
            fontWeight: 500,
          }}>
            رزروهای این هفته
          </div>
        </div>

        {/* کارت میانگین روزانه */}
        <div style={{
          background: 'rgba(220, 53, 69, 0.1)',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          borderRadius: '15px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#dc3545',
            marginBottom: '0.5rem',
          }}>
            {getAverageReservationsPerDay()}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#666',
            fontWeight: 500,
          }}>
            میانگین روزانه
          </div>
        </div>
      </div>

      {/* نمودار زمان‌های محبوب */}
      <div style={{
        marginTop: '2rem',
      }}>
        <h4 style={{
          margin: '0 0 1rem 0',
          fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
          fontWeight: 600,
          color: '#333',
          textAlign: 'center',
        }}>
          توزیع رزروها بر اساس زمان
        </h4>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {timeData.map(({ time, count }) => (
            <div key={time} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
            }}>
              <div style={{
                minWidth: '60px',
                fontWeight: 600,
                color: '#333',
              }}>
                {time}
              </div>
              <div style={{
                flex: 1,
                height: '20px',
                background: 'rgba(102, 126, 234, 0.2)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  width: `${(count / Math.max(...timeData.map(t => t.count))) * 100}%`,
                  borderRadius: '10px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{
                minWidth: '30px',
                textAlign: 'center',
                fontWeight: 600,
                color: '#667eea',
              }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* اطلاعات اضافی */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p style={{
          margin: 0,
          fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif',
          fontWeight: 500,
          color: '#666',
        }}>
          <strong>محبوب‌ترین زمان:</strong> {getMostPopularTime()}
        </p>
      </div>
    </div>
  );
};

export default Statistics; 