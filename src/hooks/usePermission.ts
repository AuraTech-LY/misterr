import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserRole {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_phone?: string;
  can_view_orders: boolean;
  can_update_order_status: boolean;
  can_delete_orders: boolean;
  can_manage_menu_items: boolean;
  can_manage_categories: boolean;
  can_manage_restaurants: boolean;
  can_manage_branches: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  is_owner: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Permission =
  | 'can_view_orders'
  | 'can_update_order_status'
  | 'can_delete_orders'
  | 'can_manage_menu_items'
  | 'can_manage_categories'
  | 'can_manage_restaurants'
  | 'can_manage_branches'
  | 'can_view_reports'
  | 'can_manage_users';

export const usePermission = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('Fetching user role for:', user?.id);

      if (!user?.id) {
        console.log('No user ID found');
        setUserRole(null);
        setLoading(false);
        return;
      }

      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (roleError) {
        console.error('Role fetch error:', roleError);
        throw roleError;
      }

      console.log('User role fetched:', data);
      setUserRole(data);
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user role');
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    console.log('Checking permission:', permission, 'UserRole:', userRole);
    if (!userRole || !userRole.is_active) {
      console.log('Permission denied: No role or inactive');
      return false;
    }
    if (userRole.is_owner) {
      console.log('Permission granted: User is owner');
      return true;
    }
    const hasPermission = userRole[permission] === true;
    console.log('Permission', permission, ':', hasPermission);
    return hasPermission;
  };

  const isOwner = (): boolean => {
    return userRole?.is_owner === true && userRole?.is_active === true;
  };

  const canViewOrders = () => hasPermission('can_view_orders');
  const canUpdateOrderStatus = () => hasPermission('can_update_order_status');
  const canDeleteOrders = () => hasPermission('can_delete_orders');
  const canManageMenuItems = () => hasPermission('can_manage_menu_items');
  const canManageCategories = () => hasPermission('can_manage_categories');
  const canManageRestaurants = () => hasPermission('can_manage_restaurants');
  const canManageBranches = () => hasPermission('can_manage_branches');
  const canViewReports = () => hasPermission('can_view_reports');
  const canManageUsers = () => hasPermission('can_manage_users');

  return {
    userRole,
    loading,
    error,
    hasPermission,
    isOwner,
    canViewOrders,
    canUpdateOrderStatus,
    canDeleteOrders,
    canManageMenuItems,
    canManageCategories,
    canManageRestaurants,
    canManageBranches,
    canViewReports,
    canManageUsers,
    refreshRole: fetchUserRole,
  };
};
