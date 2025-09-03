// Time utilities for Libya timezone (UTC+2)

export const LIBYA_TIMEZONE = 'Africa/Tripoli';
export const OPENING_HOUR = 11; // 11:00 AM
export const CLOSING_HOUR = 23; // 11:00 PM
export const CLOSING_MINUTE = 59; // 11:59 PM

// Mister Crispy specific hours
export const MISTER_CRISPY_CLOSING_HOUR = 3; // 3:00 AM (next day)
export const MISTER_CRISPY_DELIVERY_CLOSING_HOUR = 23; // 11:59 PM (delivery stops)
export const MISTER_CRISPY_DELIVERY_CLOSING_MINUTE = 59;

/**
 * Get current time in Libya timezone (UTC+2)
 */
export const getCurrentTime = (): Date => {
  // Create a date object with Libya timezone
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get Libya time
  const libyaTime = new Intl.DateTimeFormat('en-US', {
    timeZone: LIBYA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  // Reconstruct the date in Libya timezone
  const year = parseInt(libyaTime.find(part => part.type === 'year')?.value || '0');
  const month = parseInt(libyaTime.find(part => part.type === 'month')?.value || '0') - 1; // Month is 0-indexed
  const day = parseInt(libyaTime.find(part => part.type === 'day')?.value || '0');
  const hour = parseInt(libyaTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(libyaTime.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(libyaTime.find(part => part.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
};

/**
 * Check if current time is within operating hours
 * @param branchId - Optional branch ID for branch-specific hours
 */
export const isWithinOperatingHours = (branchId?: string): boolean => {
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Mister Crispy (dollar branch) has extended hours until 3:00 AM
  if (branchId === 'dollar') {
    // Open from 11:00 AM to 3:00 AM next day
    if (currentHour >= OPENING_HOUR || currentHour < MISTER_CRISPY_CLOSING_HOUR) {
      return true;
    }
    return false;
  }
  
  // Regular branches: 11:00 AM to 11:59 PM
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
 * Check if delivery is available for the current time and branch
 * @param branchId - Optional branch ID for branch-specific delivery hours
 */
export const isDeliveryAvailable = (branchId?: string): boolean => {
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Mister Crispy (dollar branch) doesn't offer delivery from 12:00 AM to 3:00 AM
  if (branchId === 'dollar') {
    // If it's between 12:00 AM (0) and 3:00 AM, no delivery
    if (currentHour >= 0 && currentHour < MISTER_CRISPY_CLOSING_HOUR) {
      return false;
    }
    // If it's after 11:59 PM, no delivery
    if (currentHour > MISTER_CRISPY_DELIVERY_CLOSING_HOUR || 
        (currentHour === MISTER_CRISPY_DELIVERY_CLOSING_HOUR && currentMinute > MISTER_CRISPY_DELIVERY_CLOSING_MINUTE)) {
      return false;
    }
    return true;
  }
  
  // For other branches, delivery is available during regular operating hours
  return isWithinOperatingHours(branchId);
};

/**
 * Get formatted current time in Libya timezone
 */
export const getFormattedLibyaTime = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat('ar-LY', {
    timeZone: LIBYA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
};

/**
 * Get time until opening (if closed)
 * @param branchId - Optional branch ID for branch-specific hours
 */
export const getTimeUntilOpening = (branchId?: string): string | null => {
  if (isWithinOperatingHours(branchId)) {
    return null;
  }
  
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Mister Crispy specific logic
  if (branchId === 'dollar') {
    // If it's between 3:00 AM and 11:00 AM, calculate time until 11:00 AM
    if (currentHour >= MISTER_CRISPY_CLOSING_HOUR && currentHour < OPENING_HOUR) {
      const hoursUntilOpen = OPENING_HOUR - currentHour;
      const minutesUntilOpen = 60 - currentMinute;
      
      if (minutesUntilOpen === 60) {
        return `${hoursUntilOpen} ساعة`;
      } else {
        return `${hoursUntilOpen - 1} ساعة و ${minutesUntilOpen} دقيقة`;
      }
    }
    return null; // Should be open otherwise
  }
  
  // Regular branches logic
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
 * @param branchId - Optional branch ID for branch-specific hours
 */
export const getTimeUntilClosing = (branchId?: string): string | null => {
  if (!isWithinOperatingHours(branchId)) {
    return null;
  }
  
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Mister Crispy specific logic
  if (branchId === 'dollar') {
    // If it's after midnight (0-2 hours), calculate time until 3:00 AM
    if (currentHour >= 0 && currentHour < MISTER_CRISPY_CLOSING_HOUR) {
      const hoursUntilClose = MISTER_CRISPY_CLOSING_HOUR - currentHour;
      const minutesUntilClose = 60 - currentMinute;
      
      if (hoursUntilClose === 0) {
        return `${minutesUntilClose} دقيقة`;
      } else {
        if (minutesUntilClose === 60) {
          return `${hoursUntilClose} ساعة`;
        } else {
          return `${hoursUntilClose - 1} ساعة و ${minutesUntilClose} دقيقة`;
        }
      }
    }
    // If it's during regular hours (11 AM - 11:59 PM), calculate until midnight (then continues until 3 AM)
    const hoursUntilClose = CLOSING_HOUR - currentHour;
    const minutesUntilClose = CLOSING_MINUTE - currentMinute;
    
    if (hoursUntilClose === 0) {
      return `${minutesUntilClose} دقيقة`;
    } else {
      if (minutesUntilClose === 59) {
        return `${hoursUntilClose} ساعة`;
      } else {
        return `${hoursUntilClose} ساعة و ${60 - minutesUntilClose} دقيقة`;
      }
    }
  }
  
  // Regular branches logic
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

/**
 * Get current Libya date and time as a formatted string
 */
export const getLibyaDateTime = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat('ar-LY', {
    timeZone: LIBYA_TIMEZONE,
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
