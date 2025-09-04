import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
 * Check if a specific branch is currently open based on database settings
 */
export const isBranchOpen = async (branchId: string): Promise<boolean> => {
  try {
    // Check if Supabase environment variables are available
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not found, using default hours');
      return isWithinDefaultHours();
    }

    // Check if Supabase environment variables are available
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not found, using default hours');
      return isWithinDefaultHours();
    }

    // Fetch operating hours for specific branch from database
    const { data: operatingHours, error } = await supabase
      .from('operating_hours')
      .select('*')
      .eq('branch_id', branchId)
      .single();

    if (error) {
      console.warn('Error fetching branch operating hours, using default hours:', error);
      // Fallback to default hours if database fails
      return isWithinDefaultOperatingHours();
    }

    if (!operatingHours) {
      // No operating hours set, use default
      return isWithinDefaultOperatingHours();
    }

    const currentTime = getCurrentTime();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Skip if branch is marked as closed
    if (operatingHours.is_closed) return false;

    // If branch is 24 hours, it's always open
    if (operatingHours.is_24_hours) return true;

    // Parse opening and closing times
    const [openHour, openMinute] = operatingHours.opening_time.split(':').map(Number);
    const [closeHour, closeMinute] = operatingHours.closing_time.split(':').map(Number);
    
    const openTimeInMinutes = openHour * 60 + openMinute;
    let closeTimeInMinutes = closeHour * 60 + closeMinute;

    // Handle closing time that goes into next day (e.g., 03:00)
    if (closeHour < openHour || (closeHour <= 6 && openHour >= 10)) {
      // Closing time is next day (early morning hours like 03:00)
      // Branch is open if:
      // 1. Current time is after opening time (same day)
      // 2. OR current time is before closing time (next day - early morning)
      if (currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes) {
        return true;
      }
    } else {
      // Same day closing (normal hours like 23:59)
      if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error checking operating hours for branch ${branchId}:`, error);
    // Fallback to default hours if there's an error
    return isWithinDefaultOperatingHours();
  }
};

/**
 * Check if any branch is currently open based on database settings
 */
export const isWithinOperatingHours = async (): Promise<boolean> => {
  try {
    // Check if Supabase environment variables are available
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not found, using default hours');
      return isWithinDefaultOperatingHours();
    }

    // Check if Supabase environment variables are available
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not found, using default hours');
      return isWithinDefaultOperatingHours();
    }

    // Fetch all operating hours from database
    const { data: operatingHours, error } = await supabase
      .from('operating_hours')
      .select('*');

    if (error) {
      console.warn('Error fetching operating hours, using default hours:', error);
      return isWithinDefaultOperatingHours();
    }

    if (!operatingHours || operatingHours.length === 0) {
      // No operating hours set, use default
      return isWithinDefaultOperatingHours();
    }

    // Check if any branch is open
    for (const hours of operatingHours) {
      const isOpen = await isBranchOpen(hours.branch_id);
      if (isOpen) return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking operating hours:', error);
    // Fallback to default hours if there's an error
    return isWithinDefaultOperatingHours();
  }
};
/**
 * Fallback function for default operating hours (11:00 - 23:59)
 */
export const isWithinDefaultOperatingHours = (): boolean => {
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