import { createClient } from '@supabase/supabase-js';

export const LIBYA_TIMEZONE = 'Africa/Tripoli';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const getCurrentTime = (): Date => {
  const now = new Date();

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

  const year = parseInt(libyaTime.find(part => part.type === 'year')?.value || '0');
  const month = parseInt(libyaTime.find(part => part.type === 'month')?.value || '0') - 1;
  const day = parseInt(libyaTime.find(part => part.type === 'day')?.value || '0');
  const hour = parseInt(libyaTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(libyaTime.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(libyaTime.find(part => part.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
};

const isTimeWithinOperatingHours = (
  openHour: number,
  openMinute: number,
  closeHour: number,
  closeMinute: number
): boolean => {
  const currentTime = getCurrentTime();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const openMinutes = openHour * 60 + openMinute;
  let closeMinutes = closeHour * 60 + closeMinute;

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (currentMinutes < openMinutes) {
      return currentMinutes + 24 * 60 <= closeMinutes;
    }
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

export const isWithinOperatingHours = async (branchId?: string): Promise<boolean> => {
  if (!branchId) {
    console.log('[timeUtils] No branchId provided, using default hours');
    return isTimeWithinOperatingHours(11, 0, 23, 59);
  }

  const currentTime = getCurrentTime();
  const dayOfWeek = currentTime.getDay();

  console.log('[timeUtils] Checking operating hours:', { branchId, dayOfWeek, libyaTime: currentTime.toLocaleString() });

  // Debug: Show ALL hours for this branch
  const { data: allHours } = await supabase
    .from('branch_operating_hours')
    .select('*')
    .eq('branch_id', branchId);
  console.log('[timeUtils] ALL hours for this branch:', allHours);

  const { data, error } = await supabase
    .from('branch_operating_hours')
    .select('*')
    .eq('branch_id', branchId)
    .eq('day_of_week', dayOfWeek)
    .single();

  console.log('[timeUtils] Query result for today (day ' + dayOfWeek + '):', { data, error });

  if (error || !data) {
    console.log('[timeUtils] No data found, defaulting to open');
    return isTimeWithinOperatingHours(11, 0, 23, 59);
  }

  if (data.is_closed) {
    console.log('[timeUtils] Branch is CLOSED for today');
    return false;
  }

  if (data.is_24_hours) {
    console.log('[timeUtils] Branch is 24 hours');
    return true;
  }

  const [openHour, openMinute] = data.opening_time.split(':').map(Number);
  const [closeHour, closeMinute] = data.closing_time.split(':').map(Number);

  const isOpen = isTimeWithinOperatingHours(openHour, openMinute, closeHour, closeMinute);
  console.log('[timeUtils] Branch hours:', { openHour, openMinute, closeHour, closeMinute, isOpen });

  return isOpen;
};

export const isDeliveryAvailable = async (branchId?: string): Promise<boolean> => {
  return true;
};

export const getTimeUntilOpening = async (branchId?: string): Promise<string | null> => {
  if (!branchId) return null;

  const currentTime = getCurrentTime();
  const dayOfWeek = currentTime.getDay();

  const { data, error } = await supabase
    .from('branch_operating_hours')
    .select('*')
    .eq('branch_id', branchId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (error || !data || data.is_closed || data.is_24_hours) {
    return null;
  }

  const [openHour, openMinute] = data.opening_time.split(':').map(Number);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const openMinutes = openHour * 60 + openMinute;

  if (currentMinutes >= openMinutes) {
    return null;
  }

  const minutesUntilOpen = openMinutes - currentMinutes;
  const hours = Math.floor(minutesUntilOpen / 60);
  const minutes = minutesUntilOpen % 60;

  if (hours > 0) {
    return `${hours} ساعة و ${minutes} دقيقة`;
  }
  return `${minutes} دقيقة`;
};

export const clearBranchOperatingHoursCache = (branchId: string): void => {
  // No caching anymore
};

export const getTimeUntilClosing = async (branchId?: string): Promise<string | null> => {
  if (!branchId) return null;

  const currentTime = getCurrentTime();
  const dayOfWeek = currentTime.getDay();

  const { data, error } = await supabase
    .from('branch_operating_hours')
    .select('*')
    .eq('branch_id', branchId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (error || !data || data.is_closed || data.is_24_hours) {
    return null;
  }

  const [closeHour, closeMinute] = data.closing_time.split(':').map(Number);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const closeMinutes = closeHour * 60 + closeMinute;

  const minutesUntilClose = closeMinutes - currentMinutes;

  if (minutesUntilClose <= 0) {
    return null;
  }

  const hours = Math.floor(minutesUntilClose / 60);
  const minutes = minutesUntilClose % 60;

  if (hours > 0) {
    return `${hours} ساعة و ${minutes} دقيقة`;
  }
  return `${minutes} دقيقة`;
};
