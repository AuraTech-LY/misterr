import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Category {
  id: string;
  name: string;
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A1120]"></div>
        <p className="mt-4 text-gray-600">جاري تحميل الفئات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">إدارة الفئات</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#7A1120] hover:bg-[#5c0d18] text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          إضافة فئة جديدة
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">إضافة فئة جديدة</h3>
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
          <div className="flex gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="اسم الفئة الجديدة"
              className="flex-1 p-3 border border-gray-300 rounded-full focus:border-[#7A1120] text-right"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              disabled={saving || !newCategoryName.trim()}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                saving || !newCategoryName.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#7A1120] hover:bg-[#5c0d18] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl shadow-lg p-6">
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
                        : 'bg-[#7A1120] hover:bg-[#5c0d18] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
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