// Time utilities for Libya timezone (UTC+2)

export const LIBYA_TIMEZONE = 'Africa/Tripoli'; // Libya/Tripoli timezone

// Cache configuration
const CACHE_EXPIRATION_MINUTES = 30; // Cache operating hours for 30 minutes
const CACHE_KEY_PREFIX = 'operating_hours_';

interface CachedOperatingHours {
  opening_time: string;
  closing_time: string;
  is_24_hours: boolean;
  is_closed: boolean;
  delivery_start_time?: string | null;
  delivery_end_time?: string | null;
  delivery_available: boolean;
  cached_at: number;
}

/**
 * Get current time in Libya/Tripoli timezone
 */
export const getCurrentTime = (): Date => {
  // Create a date object with Libya/Tripoli timezone
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get UTC+3 time
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
 * Get cached operating hours from localStorage
 */
const getCachedOperatingHours = (branchId: string): CachedOperatingHours | null => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${branchId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const data: CachedOperatingHours = JSON.parse(cached);
    const now = Date.now();
    const cacheAge = (now - data.cached_at) / (1000 * 60); // Age in minutes
    
    // Check if cache is still fresh
    if (cacheAge < CACHE_EXPIRATION_MINUTES) {
      return data;
    } else {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (error) {
    console.error('Error reading cached operating hours:', error);
    return null;
  }
};

/**
 * Cache operating hours in localStorage
 */
const setCachedOperatingHours = (branchId: string, data: Omit<CachedOperatingHours, 'cached_at'>): void => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${branchId}`;
    const cachedData: CachedOperatingHours = {
      ...data,
      cached_at: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error caching operating hours:', error);
  }
};

/**
 * Fetch operating hours from Supabase and cache them
 */
const fetchOperatingHoursFromDB = async (branchId: string): Promise<CachedOperatingHours | null> => {
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
      console.log(`No operating hours found for branch ${branchId}`);
      return null;
    }

    const operatingHours = {
      opening_time: data.opening_time,
      closing_time: data.closing_time,
      is_24_hours: data.is_24_hours,
      is_closed: data.is_closed,
      delivery_start_time: data.delivery_start_time,
      delivery_end_time: data.delivery_end_time,
      delivery_available: data.delivery_available
    };

    return { ...operatingHours, cached_at: Date.now() };
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return null;
  }
};

/**
 * Check if current time is within operating hours for a specific branch
 */
export const isWithinOperatingHours = async (branchId?: string): Promise<boolean> => {
  if (!branchId) {
    console.log('No branch ID provided, defaulting to closed');
    return false;
  }

  // Always fetch fresh data from database
  const operatingHours = await fetchOperatingHoursFromDB(branchId);
  
  if (!operatingHours) {
    console.log(`No operating hours found for branch ${branchId}, defaulting to closed`);
    return false;
  }

  console.log(`Operating hours for ${branchId}:`, operatingHours);

  // Check if branch is closed or 24 hours
  if (operatingHours.is_closed) return false;
  if (operatingHours.is_24_hours) return true;

  // Parse opening and closing times
  const [openHour, openMinute] = operatingHours.opening_time.split(':').map(Number);
  const [closeHour, closeMinute] = operatingHours.closing_time.split(':').map(Number);

  return isTimeWithinOperatingHours(openHour, openMinute, closeHour, closeMinute);
};

/**
 * Check if delivery is available for a specific branch at current time
 */
export const isDeliveryAvailable = async (branchId?: string): Promise<boolean> => {
  if (!branchId) {
    return false; // Default to unavailable if no branch specified
  }

  console.log(`[DEBUG] Checking delivery availability for branch: ${branchId}`);
  
  // Always fetch fresh data from database
  const operatingHours = await fetchOperatingHoursFromDB(branchId);
  
  if (!operatingHours) {
    console.log(`[DEBUG] No operating hours found for ${branchId}, defaulting to unavailable`);
    return false;
  }

  console.log(`[DEBUG] Operating hours for ${branchId}:`, operatingHours);
  
  // Check if delivery is disabled for this branch
  if (!operatingHours.delivery_available) {
    console.log(`[DEBUG] Delivery disabled for branch ${branchId}`);
    return false;
  }

  // First check if restaurant is open
  const isRestaurantOpen = await isWithinOperatingHours(branchId);
  console.log(`[DEBUG] Restaurant open: ${isRestaurantOpen}`);
  
  if (!isRestaurantOpen) {
    console.log(`[DEBUG] Restaurant closed, delivery not available`);
    return false;
  }

  // Special handling for مستر كريسبي (dollar branch)
  if (branchId === 'dollar') {
    // For مستر كريسبي, if no specific delivery times are set, use default delivery hours
    if (!operatingHours.delivery_start_time || !operatingHours.delivery_end_time) {
      // Default delivery hours for مستر كريسبي: 11:00 AM to 12:00 AM (midnight)
      const currentTime = getCurrentTime();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      
      console.log(`[DELIVERY] Using default delivery hours for مستر كريسبي: 11:00-00:00`);
      console.log(`[DELIVERY] Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
      
      // Convert to minutes for comparison
      const currentMinutes = currentHour * 60 + currentMinute;
      const deliveryStartMinutes = 11 * 60; // 11:00 AM
      const deliveryEndMinutes = 24 * 60; // 12:00 AM (midnight) = 24:00
      
      console.log(`[DELIVERY] Current: ${currentMinutes} minutes, Start: ${deliveryStartMinutes}, End: ${deliveryEndMinutes}`);
      
      const isWithinDeliveryHours = currentMinutes >= deliveryStartMinutes && currentMinutes < deliveryEndMinutes;
      console.log(`[DELIVERY] Within delivery hours: ${isWithinDeliveryHours}`);
      
      return isWithinDeliveryHours;
    }
  }
  // If no specific delivery times are set, delivery follows regular hours
  if (!operatingHours.delivery_start_time || !operatingHours.delivery_end_time) {
    console.log(`[DEBUG] No specific delivery times set for ${branchId}, following regular hours`);
    return isRestaurantOpen;
  }

  const currentTime = getCurrentTime();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  console.log(`[DEBUG] Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
  console.log(`[DEBUG] Delivery hours: ${operatingHours.delivery_start_time} - ${operatingHours.delivery_end_time}`);
  
  // Parse delivery times
  const [deliveryStartHour, deliveryStartMinute] = operatingHours.delivery_start_time.split(':').map(Number);
  const [deliveryEndHour, deliveryEndMinute] = operatingHours.delivery_end_time.split(':').map(Number);

  console.log(`[DEBUG] Parsed delivery times: ${deliveryStartHour}:${deliveryStartMinute} - ${deliveryEndHour}:${deliveryEndMinute}`);

  // Check if current time is within delivery hours
  // Handle same-day delivery (e.g., 11:00 - 24:00) vs next-day delivery (e.g., 11:00 - 03:00)
  let isWithinDeliveryHours = false;
  
  if (deliveryEndHour === 0 && deliveryEndMinute === 0) {
    // Special case: 00:00 means midnight (24:00)
    if (currentHour > deliveryStartHour || (currentHour === deliveryStartHour && currentMinute >= deliveryStartMinute)) {
      isWithinDeliveryHours = true;
    }
  } else if (deliveryEndHour < deliveryStartHour) {
    // Next-day delivery (e.g., 11:00 - 03:00)
    if (currentHour > deliveryStartHour || (currentHour === deliveryStartHour && currentMinute >= deliveryStartMinute)) {
      isWithinDeliveryHours = true; // After start time same day
    } else if (currentHour < deliveryEndHour || (currentHour === deliveryEndHour && currentMinute <= deliveryEndMinute)) {
      isWithinDeliveryHours = true; // Before end time next day
    }
  } else {
    // Same-day delivery (e.g., 11:00 - 23:00)
    if ((currentHour > deliveryStartHour || (currentHour === deliveryStartHour && currentMinute >= deliveryStartMinute)) &&
        (currentHour < deliveryEndHour || (currentHour === deliveryEndHour && currentMinute <= deliveryEndMinute))) {
      isWithinDeliveryHours = true;
    }
  }
  
  console.log(`[DEBUG] Within delivery hours: ${isWithinDeliveryHours}`);
  return isWithinDeliveryHours;
};

/**
 * Get formatted current time in Libya/Tripoli timezone
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
  
  // Fetch operating hours from database
  const operatingHours = await fetchOperatingHoursFromDB(branchId || '');
  
  if (!operatingHours || operatingHours.is_closed) {
    return 'مغلق';
  }
  
  if (operatingHours.is_24_hours) {
    return null; // 24 hours, never closed
  }
  
  const openingHour = parseInt(operatingHours.opening_time.split(':')[0]);
  const closingHour = parseInt(operatingHours.closing_time.split(':')[0]);
  
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
  
  // Fetch operating hours from database
  const operatingHours = await fetchOperatingHoursFromDB(branchId || '');
  
  if (!operatingHours || operatingHours.is_closed) {
    return null;
  }
  
  if (operatingHours.is_24_hours) {
    return null; // 24 hours, never closes
  }
  
  const [closingHour, closingMinute] = operatingHours.closing_time.split(':').map(Number);
  
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
 * Get Libya/Tripoli time (alias for getCurrentTime for backward compatibility)
 */
export const getLibyaTime = (): Date => {
  return getCurrentTime();
};

/**
 * Get current Libya/Tripoli date and time as a formatted string
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

/**
 * Clear all cached operating hours (useful for debugging or manual cache invalidation)
 */
export const clearOperatingHoursCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing operating hours cache:', error);
  }
};