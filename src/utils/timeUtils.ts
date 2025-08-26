// Time utilities for Libya Tripoli timezone (UTC+2)

export const LIBYA_TIMEZONE = 'Etc/GMT+2'; // UTC-2 (temporary)
export const OPENING_HOUR = 11; // 11:00 AM
export const CLOSING_HOUR = 23; // 11:00 PM
export const CLOSING_MINUTE = 59; // 11:59 PM

/**
 * Get current time in UTC-2 timezone (temporary)
 */
export const getLibyaTime = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: LIBYA_TIMEZONE }));
};

/**
 * Check if current time is within operating hours (11:00 - 23:59)
 */
export const isWithinOperatingHours = (): boolean => {
  const libyaTime = getLibyaTime();
  const currentHour = libyaTime.getHours();
  const currentMinute = libyaTime.getMinutes();
  
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
 * Get formatted current Libya time
 */
export const getFormattedLibyaTime = (): string => {
  const libyaTime = getLibyaTime();
  return libyaTime.toLocaleString('ar-LY', {
    timeZone: LIBYA_TIMEZONE,
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
  
  const libyaTime = getLibyaTime();
  const currentHour = libyaTime.getHours();
  
  if (currentHour < OPENING_HOUR) {
    // Before opening today
    const hoursUntilOpen = OPENING_HOUR - currentHour;
    const minutesUntilOpen = 60 - libyaTime.getMinutes();
    
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
  
  const libyaTime = getLibyaTime();
  const currentHour = libyaTime.getHours();
  const currentMinute = libyaTime.getMinutes();
  
  const hoursUntilClose = CLOSING_HOUR - currentHour;
  const minutesUntilClose = CLOSING_MINUTE - currentMinute;
  
  if (hoursUntilClose === 0) {
    return `${minutesUntilClose} دقيقة`;
  } else {
    return `${hoursUntilClose} ساعة و ${minutesUntilClose} دقيقة`;
  }
};