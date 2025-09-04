// Time utilities for Libya timezone (UTC+2)

export const LIBYA_TIMEZONE = 'Asia/Dubai'; // UTC+4

/**
 * Get current time in UTC+4 timezone
 */
export const getCurrentTime = (): Date => {
  // Create a date object with UTC+4 timezone
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get UTC+4 time
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
 * Check if current time is within operating hours for a specific branch
 */
export const isWithinOperatingHours = async (branchId?: string): Promise<boolean> => {
  if (!branchId) {
    // Default fallback hours if no branch specified
    return isTimeWithinOperatingHours(11, 0, 23, 59);
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('operating_hours')
      .select('*')
      .eq('branch_id', branchId)
      .single();

    if (error || !data) {
      // Fallback to default hours if no data found
      const defaultClosingHour = branchId === 'dollar' ? 3 : 23;
      const defaultClosingMinute = branchId === 'dollar' ? 0 : 59;
      return isTimeWithinOperatingHours(11, 0, defaultClosingHour, defaultClosingMinute);
    }

    // Check if branch is closed or 24 hours
    if (data.is_closed) return false;
    if (data.is_24_hours) return true;

    // Parse opening and closing times
    const [openHour, openMinute] = data.opening_time.split(':').map(Number);
    const [closeHour, closeMinute] = data.closing_time.split(':').map(Number);

    return isTimeWithinOperatingHours(openHour, openMinute, closeHour, closeMinute);
  } catch (error) {
    console.error('Error checking operating hours:', error);
    // Fallback to default hours
    const defaultClosingHour = branchId === 'dollar' ? 3 : 23;
    const defaultClosingMinute = branchId === 'dollar' ? 0 : 59;
    return isTimeWithinOperatingHours(11, 0, defaultClosingHour, defaultClosingMinute);
  }
};

/**
 * Check if current time is within operating hours (synchronous version for backward compatibility)
 */
export const isWithinOperatingHoursSync = (): boolean => {
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Default hours: 11:00 - 23:59
  if (currentHour < 11) {
    return false; // Before opening
  }
  
  if (currentHour > 23) {
    return false; // After closing
  }
  
  if (currentHour === 23 && currentMinute > 59) {
    return false; // After 23:59
  }
  
  return true;
};

/**
 * Get formatted current time in UTC+4 timezone
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
 */
export const getTimeUntilOpening = async (branchId?: string): Promise<string | null> => {
  if (await isWithinOperatingHours(branchId)) {
    return null;
  }
  
  let openingHour = 11;
  let closingHour = 23;
  
  // Get branch-specific hours
  if (branchId) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('branch_id', branchId)
        .single();

      if (data && !data.is_closed && !data.is_24_hours) {
        openingHour = parseInt(data.opening_time.split(':')[0]);
        closingHour = parseInt(data.closing_time.split(':')[0]);
      }
    } catch (error) {
      console.error('Error getting branch hours:', error);
    }
  }
  
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  if (currentHour < openingHour) {
    // Before opening today
    const hoursUntilOpen = openingHour - currentHour;
    const minutesUntilOpen = 60 - currentMinute;
    
    if (minutesUntilOpen === 60) {
      return `${hoursUntilOpen} ساعة`;
    } else {
      return `${hoursUntilOpen - 1} ساعة و ${minutesUntilOpen} دقيقة`;
    }
  } else {
    // After closing, opens tomorrow
    const hoursUntilOpen = (24 - currentHour) + openingHour;
    return `${hoursUntilOpen} ساعة (غداً)`;
  }
};

/**
 * Get time until closing (if open)
 */
export const getTimeUntilClosing = async (branchId?: string): Promise<string | null> => {
  if (!(await isWithinOperatingHours(branchId))) {
    return null;
  }
  
  let closingHour = 23;
  let closingMinute = 59;
  
  // Get branch-specific hours
  if (branchId) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('branch_id', branchId)
        .single();

      if (data && !data.is_closed && !data.is_24_hours) {
        const [closeHour, closeMin] = data.closing_time.split(':').map(Number);
        closingHour = closeHour;
        closingMinute = closeMin;
      } else if (data && data.is_24_hours) {
        return null; // 24 hours, never closes
      }
    } catch (error) {
      console.error('Error getting branch hours:', error);
    }
  }
  
  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Calculate time until closing
  let hoursUntilClose, minutesUntilClose;
  
  // Handle next-day closing (e.g., closes at 3:00 AM)
  if (closingHour < 12) { // Assuming closing hours before noon are next day
    // Check if we're already past midnight but before closing time
    if (currentHour < closingHour || (currentHour === closingHour && currentMinute <= closingMinute)) {
      // We're in the same "day" as closing (after midnight but before closing)
      hoursUntilClose = closingHour - currentHour;
      minutesUntilClose = closingMinute - currentMinute;
      
      if (minutesUntilClose < 0) {
        hoursUntilClose -= 1;
        minutesUntilClose += 60;
      }
    } else {
      // We're before midnight, need to calculate time until next day's closing
      const hoursUntilMidnight = 24 - currentHour;
      hoursUntilClose = hoursUntilMidnight + closingHour;
      minutesUntilClose = closingMinute - currentMinute;
      
      if (minutesUntilClose < 0) {
        hoursUntilClose -= 1;
        minutesUntilClose += 60;
      }
    }
  } else {
    // Same day closing
    hoursUntilClose = closingHour - currentHour;
    minutesUntilClose = closingMinute - currentMinute;
    
    if (minutesUntilClose < 0) {
      hoursUntilClose -= 1;
      minutesUntilClose += 60;
    }
  }
  
  if (hoursUntilClose === 0) {
    return `${minutesUntilClose} دقيقة`;
  } else {
    return `${hoursUntilClose} ساعة و ${minutesUntilClose} دقيقة`;
  }
};

/**
 * Get UTC+4 time (alias for getCurrentTime for backward compatibility)
 */
export const getLibyaTime = (): Date => {
  return getCurrentTime();
};

/**
 * Get current UTC+4 date and time as a formatted string
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
export const isTimeWithinOperatingHours = (
  openHour: number, 
  openMinute: number, 
  closeHour: number, 
  closeMinute: number,
  currentHour?: number,
  currentMinute?: number
): boolean => {
  const now = getCurrentTime();
  const checkHour = currentHour !== undefined ? currentHour : now.getHours();
  const checkMinute = currentMinute !== undefined ? currentMinute : now.getMinutes();
  
  // Handle next day closing (e.g., closes at 3:00 AM)
  if (closeHour < openHour) {
    // For next-day closing: open from openHour until 23:59, then from 00:00 until closeHour
    if (checkHour > openHour || (checkHour === openHour && checkMinute >= openMinute)) {
      return true; // After opening time same day
    }
    if (checkHour < closeHour || (checkHour === closeHour && checkMinute <= closeMinute)) {
      return true; // Before closing time next day
    }
    return false;
  }
  
  // Same day closing
  if (checkHour < openHour || (checkHour === openHour && checkMinute < openMinute)) {
    return false;
  }
  
  if (checkHour > closeHour || (checkHour === closeHour && checkMinute > closeMinute)) {
    return false;
  }
  
  return true;
};