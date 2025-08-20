// Jalali (Persian) date conversion utilities
export function gregorianToJalali(gy, gm, gd) {
  var g_d_m, jy, jm, jd, gy2, days;
  g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  gy2 = (gm > 2) ? (gy + 1) : gy;
  days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  jy = -1595 + (33 * ~~(days / 12053));
  days %= 12053;
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  if (days < 186) {
    jm = 1 + ~~(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + ~~((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

export function jalaliToGregorian(jy, jm, jd) {
  var gy, gm, gd, days;
  jy += 1595;
  days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy = 400 * ~~(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * ~~(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  gd = days + 1;
  if ((gy + 1) % 4 == 0)
    if (gd > 60) gd++;
    else;
  else
    if (gd > 59) gd++;
  if (gd == 60)
    gd = 1;
  if (gd == 31)
    if (gm == 4 || gm == 6 || gm == 9 || gm == 11) {gd = 1; gm++;}
    else if (gm == 2)
      if (gy % 4 == 0) {gd = 29;}
      else {gd = 28;}
    else {gm++;}
  else
    if (gd == 32)
      gm++;
  return [gy, gm, gd];
}

export function formatJalaliDate(date) {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `j${jy}/${jm.toString().padStart(2, '0')}/${jd.toString().padStart(2, '0')}`;
}

export function formatJalaliDatePersian(date) {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  
  // Convert to Persian numbers
  const persianNumbers = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  
  const jyStr = jy.toString().split('').map(char => persianNumbers[char] || char).join('');
  const jmStr = jm.toString().padStart(2, '0').split('').map(char => persianNumbers[char] || char).join('');
  const jdStr = jd.toString().padStart(2, '0').split('').map(char => persianNumbers[char] || char).join('');
  
  return `${jyStr}/${jmStr}/${jdStr}`;
}

export function getPersianDayName(date) {
  const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return dayNames[date.getDay()];
} 