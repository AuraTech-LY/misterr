import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, GripVertical, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePermission } from '../hooks/usePermission';

interface Category {
  id: string;
  name: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

interface AdminCategoriesProps {
  onCategoriesChange: () => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ onCategoriesChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const { canManageCategories, loading: permissionLoading } = usePermission();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true, nullsLast: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('فشل في تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setError('هذه الفئة موجودة بالفعل');
          return;
        }
        throw error;
      }

      setCategories(prev => [...prev, data]);
      setNewCategoryName('');
      setShowAddForm(false);
      onCategoriesChange();
    } catch (error) {
      console.error('Error adding category:', error);
      setError('حدث خطأ في إضافة الفئة');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    if (!category.name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const { error } = await supabase
        .from('categories')
        .update({ name: category.name.trim() })
        .eq('id', category.id);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setError('هذه الفئة موجودة بالفعل');
          return;
        }
        throw error;
      }

      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
      setEditingCategory(null);
      onCategoriesChange();
    } catch (error) {
      console.error('Error updating category:', error);
      setError('حدث خطأ في تحديث الفئة');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟ سيؤثر هذا على جميع المنتجات المرتبطة بها.')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
      onCategoriesChange();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('حدث خطأ في حذف الفئة');
    }
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedItem(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(categoryId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetCategoryId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    try {
      const draggedIndex = categories.findIndex(cat => cat.id === draggedItem);
      const targetIndex = categories.findIndex(cat => cat.id === targetCategoryId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;

      // Create new array with reordered items
      const newCategories = [...categories];
      const [draggedCategory] = newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, draggedCategory);

      // Update display_order for all categories
      const updates = newCategories.map((category, index) => ({
        id: category.id,
        display_order: index + 1
      }));

      // Update in database
      for (const update of updates) {
        const { error } = await supabase
          .from('categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Update local state
      setCategories(newCategories.map((cat, index) => ({
        ...cat,
        display_order: index + 1
      })));
      
      onCategoriesChange();
    } catch (error) {
      console.error('Error reordering categories:', error);
      setError('حدث خطأ في إعادة ترتيب الفئات');
    } finally {
      setDraggedItem(null);
      setDragOverItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  if (permissionLoading || loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A1120]"></div>
        <p className="mt-4 text-gray-600">جاري تحميل الفئات...</p>
      </div>
    );
  }

  if (!canManageCategories()) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 inline-block">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">ليس لديك صلاحية</h3>
          <p className="text-red-600">ليس لديك صلاحية لإدارة الفئات. يرجى التواصل مع المسؤول.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">إدارة الفئات</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#55421A] hover:bg-[#3d2f12] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>إضافة فئة جديدة</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Add New Category Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">إضافة فئة جديدة</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCategoryName('');
                setError(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="اسم الفئة الجديدة"
              className="flex-1 p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-full focus:border-[#7A1120] text-right"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              disabled={saving || !newCategoryName.trim()}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto ${
                saving || !newCategoryName.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#55421A] hover:bg-[#3d2f12] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {categories.map((category) => (
          <div 
            key={category.id} 
            draggable={!editingCategory}
            onDragStart={(e) => handleDragStart(e, category.id)}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category.id)}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-200 ${
              draggedItem === category.id ? 'opacity-50 scale-95' : ''
            } ${
              dragOverItem === category.id ? 'ring-2 ring-[#55421A] ring-opacity-50 transform scale-105' : ''
            } ${
              !editingCategory ? 'cursor-move hover:shadow-xl' : ''
            }`}
          >
            {editingCategory?.id === category.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-full focus:border-[#7A1120] text-right"
                  onKeyPress={(e) => e.key === 'Enter' && handleUpdateCategory(editingCategory)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateCategory(editingCategory)}
                    disabled={saving || !editingCategory.name.trim()}
                    className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      saving || !editingCategory.name.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#55421A] hover:bg-[#3d2f12] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'حفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setError(null);
                    }}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">لا توجد فئات</div>
          <p className="text-gray-500 mt-2">ابدأ بإضافة فئة جديدة</p>
        </div>
      )}
    </div>
  );
};