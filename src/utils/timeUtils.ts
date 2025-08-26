// Time utilities for UTC-2 timezone

export const TIMEZONE_OFFSET = -2; // UTC-2
export const OPENING_HOUR = 11; // 11:00 AM
export const CLOSING_HOUR = 23; // 11:00 PM
export const CLOSING_MINUTE = 59; // 11:59 PM

/**
 * Get current time in UTC-2 timezone
 */
export const getCurrentTime = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utc + (TIMEZONE_OFFSET * 3600000));
  return targetTime;
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
 * Get formatted current time in UTC-2
 */
export const getFormattedLibyaTime = (): string => {
  const currentTime = getCurrentTime();
  return currentTime.toLocaleString('ar-LY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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
 * Get Libya time (alias for getCurrentTime for backward compatibility)
 */
export const getLibyaTime = (): Date => {
  return getCurrentTime();
};

// Keep the old constant for backward compatibility
export const LIBYA_TIMEZONE = 'UTC-2';