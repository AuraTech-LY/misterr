// Time utilities for UTC+5 timezone

export const UTC_PLUS_5_TIMEZONE = 'Asia/Karachi'; // UTC+5 timezone
export const OPENING_HOUR = 11; // 11:00 AM
export const CLOSING_HOUR = 23; // 11:00 PM
export const CLOSING_MINUTE = 59; // 11:59 PM

/**
 * Get current time in UTC+5 timezone
 */
export const getCurrentTime = (): Date => {
  // Create a date object with UTC+5 timezone
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get UTC+5 time
  const utcPlus5Time = new Intl.DateTimeFormat('en-US', {
    timeZone: UTC_PLUS_5_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  // Reconstruct the date in UTC+5 timezone
  const year = parseInt(utcPlus5Time.find(part => part.type === 'year')?.value || '0');
  const month = parseInt(utcPlus5Time.find(part => part.type === 'month')?.value || '0') - 1; // Month is 0-indexed
  const day = parseInt(utcPlus5Time.find(part => part.type === 'day')?.value || '0');
  const hour = parseInt(utcPlus5Time.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(utcPlus5Time.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(utcPlus5Time.find(part => part.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
};

/**
 * Check if current time is within operating hours (11:00 - 23:59)
 */
export const isWithinOperatingHours = (): boolean => {
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Check if time is between 11:00 and 23:59
  if (currentHour < OPENING_HOUR) {
    return false; // Before opening
  }
  
  if (currentHour > CLOSING_HOUR) {
    return false; // After closing
  }
  
  if (currentHour === CLOSING_HOUR && currentMinute > CLOSING_MINUTE) {
    return false; // After 23:59
  }
  
  return true;
};

/**
 * Get formatted current time in UTC+5 timezone
 */
export const getFormattedUTCPlus5Time = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: UTC_PLUS_5_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
};

/**
 * Get time until opening (if closed)
 */
export const getTimeUntilOpening = (): string | null => {
  if (isWithinOperatingHours()) {
    return null;
  }
  
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  if (currentHour < OPENING_HOUR) {
    // Before opening today
    const hoursUntilOpen = OPENING_HOUR - currentHour;
    const minutesUntilOpen = 60 - currentMinute;
    
    if (minutesUntilOpen === 60) {
      return `${hoursUntilOpen} ساعة`;
    } else {
      return `${hoursUntilOpen - 1} ساعة و ${minutesUntilOpen} دقيقة`;
    }
  } else {
    // After closing, opens tomorrow
    const hoursUntilOpen = (24 - currentHour) + OPENING_HOUR;
    return `${hoursUntilOpen} ساعة (غداً)`;
  }
};

/**
 * Get time until closing (if open)
 */
export const getTimeUntilClosing = (): string | null => {
  if (!isWithinOperatingHours()) {
    return null;
  }
  
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  const hoursUntilClose = CLOSING_HOUR - currentHour;
  const minutesUntilClose = CLOSING_MINUTE - currentMinute;
  
  if (hoursUntilClose === 0) {
    return `${minutesUntilClose} دقيقة`;
  } else {
    return `${hoursUntilClose} ساعة و ${minutesUntilClose} دقيقة`;
  }
};

/**
 * Get UTC+5 time (alias for getCurrentTime for backward compatibility)
 */
export const getUTCPlus5Time = (): Date => {
  return getCurrentTime();
};

/**
 * Get current UTC+5 date and time as a formatted string
 */
export const getUTCPlus5DateTime = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: UTC_PLUS_5_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
};

/**
 * Check if a specific time is within operating hours
 */
export const isTimeWithinOperatingHours = (hour: number, minute: number = 0): boolean => {
  if (hour < OPENING_HOUR) {
    return false;
  }
  
  if (hour > CLOSING_HOUR) {
    return false;
  }
  
  if (hour === CLOSING_HOUR && minute > CLOSING_MINUTE) {
    return false;
  }
  
  return true;
};

/**
 * Alias for isWithinOperatingHours for branch-specific checks
 */
export const isBranchOpen = isWithinOperatingHours;