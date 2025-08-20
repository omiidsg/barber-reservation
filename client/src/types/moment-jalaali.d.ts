declare module 'moment-jalaali' {
  import moment from 'moment';
  
  interface MomentJalaali extends moment.Moment {
    jYear(): number;
    jMonth(): number;
    jDate(): number;
    jDayOfYear(): number;
    jWeek(): number;
    jWeekYear(): number;
    jQuarter(): number;
    
    jYear(year: number): MomentJalaali;
    jMonth(month: number): MomentJalaali;
    jDate(date: number): MomentJalaali;
    jDayOfYear(dayOfYear: number): MomentJalaali;
    jWeek(week: number): MomentJalaali;
    jWeekYear(weekYear: number): MomentJalaali;
    jQuarter(quarter: number): MomentJalaali;
    
    startOf(unit: 'jYear' | 'jMonth' | 'jWeek' | 'jQuarter'): MomentJalaali;
    endOf(unit: 'jYear' | 'jMonth' | 'jWeek' | 'jQuarter'): MomentJalaali;
  }
  
  interface MomentStatic {
    jMoment(input?: any, format?: string, locale?: string, strict?: boolean): MomentJalaali;
    jMoment(input?: any, format?: string, strict?: boolean): MomentJalaali;
    jMoment(input?: any, locale?: string, strict?: boolean): MomentJalaali;
    jMoment(input?: any, strict?: boolean): MomentJalaali;
  }
  
  const momentJalaali: MomentStatic;
  export = momentJalaali;
} 