import React, { useState, useEffect } from 'react';
import { FileText, Filter, Download, RefreshCw, Clock, User, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'ROLE_CHANGE';
  old_data: any;
  new_data: any;
  changed_by: string;
  changed_at: string;
}

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTable, setFilterTable] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-700';
      case 'UPDATE':
        return 'bg-[#fcb946]/10 text-[#fcb946]';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'ROLE_CHANGE':
        return 'bg-[#fcb946]/20 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'إضافة';
      case 'UPDATE':
        return 'تعديل';
      case 'DELETE':
        return 'حذف';
      case 'ROLE_CHANGE':
        return 'تغيير صلاحيات';
      default:
        return action;
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      orders: 'الطلبات',
      order_items: 'عناصر الطلب',
      menu_items: 'قائمة الطعام',
      categories: 'الفئات',
      restaurants: 'المطاعم',
      restaurant_branches: 'الفروع',
      user_roles: 'صلاحيات المستخدمين',
    };
    return labels[tableName] || tableName;
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString()}.json`;
    link.click();
  };

  const filteredLogs = logs.filter((log) => {
    if (filterTable && log.table_name !== filterTable) return false;
    if (filterAction && log.action !== filterAction) return false;
    return true;
  });

  const uniqueTables = Array.from(new Set(logs.map((log) => log.table_name)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fcb946] mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل سجل التدقيق...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">خطأ: {error}</p>
        <button
          onClick={fetchLogs}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#fcb946]" />
          <h2 className="text-2xl font-bold text-gray-800">سجل التدقيق (Audit Logs)</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-[#fcb946] text-white rounded-lg hover:bg-[#f5a623] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>تحديث</span>
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>تصدير JSON</span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#fcb946]/5 border border-[#fcb946]/30 rounded-lg p-4">
        <p className="text-sm text-[#f5a623]">
          <strong>ملاحظة:</strong> سجل التدقيق غير قابل للحذف أو التعديل. جميع التغييرات مسجلة بشكل دائم.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-800">تصفية السجلات</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">الجدول</label>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcb946] focus:border-transparent"
            >
              <option value="">الكل</option>
              {uniqueTables.map((table) => (
                <option key={table} value={table}>
                  {getTableLabel(table)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">نوع العملية</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcb946] focus:border-transparent"
            >
              <option value="">الكل</option>
              <option value="INSERT">إضافة</option>
              <option value="UPDATE">تعديل</option>
              <option value="DELETE">حذف</option>
              <option value="ROLE_CHANGE">تغيير صلاحيات</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          عرض {filteredLogs.length} من {logs.length} سجل
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedLog(log)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {getTableLabel(log.table_name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{log.changed_by}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(log.changed_at).toLocaleString('ar-LY')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">لا توجد سجلات</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">تفاصيل السجل</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نوع العملية</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getActionColor(selectedLog.action)}`}>
                    {getActionLabel(selectedLog.action)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الجدول</label>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    {getTableLabel(selectedLog.table_name)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">معرف السجل</label>
                  <span className="text-sm text-gray-600 font-mono">{selectedLog.record_id}</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المستخدم</label>
                  <span className="text-sm text-gray-600">{selectedLog.changed_by}</span>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الوقت</label>
                  <span className="text-sm text-gray-600">{new Date(selectedLog.changed_at).toLocaleString('ar-LY')}</span>
                </div>
              </div>

              {selectedLog.old_data && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البيانات القديمة</label>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs font-mono max-h-60">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البيانات الجديدة</label>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs font-mono max-h-60">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
