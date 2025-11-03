import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Save, X, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../hooks/usePermission';

interface AdminUserManagementProps {
  currentUserEmail?: string;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ currentUserEmail }) => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserRole | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    user_email: '',
    user_name: '',
    user_phone: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (user: UserRole) => {
    try {
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({
          user_name: user.user_name,
          user_phone: user.user_phone,
          can_view_orders: user.can_view_orders,
          can_update_order_status: user.can_update_order_status,
          can_delete_orders: user.can_delete_orders,
          can_manage_menu_items: user.can_manage_menu_items,
          can_manage_categories: user.can_manage_categories,
          can_manage_restaurants: user.can_manage_restaurants,
          can_manage_branches: user.can_manage_branches,
          can_view_reports: user.can_view_reports,
          can_manage_users: user.can_manage_users,
          is_owner: user.is_owner,
          is_active: user.is_active,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchUsers();
      setEditingUser(null);
      alert('User permissions updated successfully!');
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.user_email || !newUser.user_name) {
      alert('Email and name are required');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{
          user_email: newUser.user_email,
          user_name: newUser.user_name,
          user_phone: newUser.user_phone || null,
          created_by: currentUserEmail,
        }]);

      if (insertError) throw insertError;

      await fetchUsers();
      setShowAddForm(false);
      setNewUser({ user_email: '', user_name: '', user_phone: '' });
      alert('User added successfully!');
    } catch (err) {
      console.error('Error adding user:', err);
      alert(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const togglePermission = (user: UserRole, permission: keyof UserRole) => {
    if (editingUser?.id === user.id) {
      setEditingUser({
        ...editingUser,
        [permission]: !editingUser[permission],
      });
    }
  };

  const PermissionCheckbox: React.FC<{
    user: UserRole;
    permission: keyof UserRole;
    label: string;
    disabled?: boolean;
  }> = ({ user, permission, label, disabled }) => {
    const isEditing = editingUser?.id === user.id;
    const value = isEditing ? editingUser[permission] : user[permission];
    const isBoolean = typeof value === 'boolean';

    if (!isBoolean) return null;

    return (
      <label className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
        isEditing ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
      } ${disabled ? 'opacity-50' : ''}`}>
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={() => togglePermission(user, permission)}
          disabled={!isEditing || disabled}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">إدارة المستخدمين والصلاحيات</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مستخدم</span>
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">إضافة مستخدم جديد</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                value={newUser.user_email}
                onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                الاسم *
              </label>
              <input
                type="text"
                value={newUser.user_name}
                onChange={(e) => setNewUser({ ...newUser, user_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="الاسم الكامل"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={newUser.user_phone}
                onChange={(e) => setNewUser({ ...newUser, user_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0912345678"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-lg shadow-md border-2 transition-all ${
              editingUser?.id === user.id ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <div className="p-6">
              {/* User Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${user.is_owner ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    {user.is_owner ? (
                      <Shield className="w-6 h-6 text-purple-600" />
                    ) : (
                      <Users className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{user.user_name}</h3>
                    <p className="text-sm text-gray-600">{user.user_email}</p>
                    {user.user_phone && (
                      <p className="text-sm text-gray-500">{user.user_phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.is_owner && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      مالك
                    </span>
                  )}
                  {!user.is_active && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      غير نشط
                    </span>
                  )}
                  {editingUser?.id === user.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateUser(editingUser)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingUser(user)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      تعديل
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4 p-4 bg-gray-50 rounded-lg">
                <PermissionCheckbox user={user} permission="can_view_orders" label="عرض الطلبات" />
                <PermissionCheckbox user={user} permission="can_update_order_status" label="تحديث حالة الطلب" />
                <PermissionCheckbox user={user} permission="can_delete_orders" label="حذف الطلبات" />
                <PermissionCheckbox user={user} permission="can_manage_menu_items" label="إدارة قائمة الطعام" />
                <PermissionCheckbox user={user} permission="can_manage_categories" label="إدارة الفئات" />
                <PermissionCheckbox user={user} permission="can_manage_restaurants" label="إدارة المطاعم" />
                <PermissionCheckbox user={user} permission="can_manage_branches" label="إدارة الفروع" />
                <PermissionCheckbox user={user} permission="can_view_reports" label="عرض التقارير" />
                <PermissionCheckbox user={user} permission="can_manage_users" label="إدارة المستخدمين" />
                <PermissionCheckbox
                  user={user}
                  permission="is_owner"
                  label="مالك (جميع الصلاحيات)"
                  disabled={user.user_email === currentUserEmail}
                />
                <PermissionCheckbox user={user} permission="is_active" label="نشط" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">لا يوجد مستخدمون حالياً</p>
        </div>
      )}
    </div>
  );
};
