import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Plus, Download, Eye, Trash2, Loader, FileText, AlertCircle } from 'lucide-react';
import { InvoiceGenerator } from '../components/invoices/InvoiceGenerator';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  issued_date: string;
  created_by: string;
}

export function InvoicesPage() {
  const { user, organization } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!organization) return;
    fetchInvoices();
  }, [organization]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('issued_date', { ascending: false });

      if (fetchError) throw fetchError;
      setInvoices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar factura');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400';
      case 'pending':
        return 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400';
      case 'cancelled':
        return 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400';
      default:
        return 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-400';
    }
  };

  const isOwner = organization?.role === 'owner';

  if (!isOwner) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-warning-600 dark:text-warning-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-warning-900 dark:text-warning-100 mb-1">Acceso Restringido</h3>
            <p className="text-warning-800 dark:text-warning-200 text-sm">Solo los propietarios pueden crear y gestionar facturas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Facturas</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">Gestiona todas tus facturas y comprobantes de pago</p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Nueva Factura
          </button>
        )}
      </div>

      {/* Form or List */}
      {showForm ? (
        <div className="card p-6">
          <button
            onClick={() => setShowForm(false)}
            className="mb-4 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white"
          >
            ← Volver a facturas
          </button>
          <InvoiceGenerator />
        </div>
      ) : (
        <>
          {error && (
            <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0" />
              <p className="text-error-700 dark:text-error-300 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 text-secondary-300 dark:text-secondary-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">Sin facturas</h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">Crea tu primera factura para comenzar</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
              >
                <Plus className="w-5 h-5" />
                Crear Factura
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-800/50">
                      <th className="text-left py-4 px-6 font-semibold text-secondary-900 dark:text-white">Número</th>
                      <th className="text-left py-4 px-6 font-semibold text-secondary-900 dark:text-white">Cliente</th>
                      <th className="text-right py-4 px-6 font-semibold text-secondary-900 dark:text-white">Monto</th>
                      <th className="text-left py-4 px-6 font-semibold text-secondary-900 dark:text-white">Método</th>
                      <th className="text-left py-4 px-6 font-semibold text-secondary-900 dark:text-white">Estado</th>
                      <th className="text-left py-4 px-6 font-semibold text-secondary-900 dark:text-white">Fecha</th>
                      <th className="text-right py-4 px-6 font-semibold text-secondary-900 dark:text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => (
                      <tr key={invoice.id} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/30 transition">
                        <td className="py-4 px-6 font-medium text-secondary-900 dark:text-white">{invoice.invoice_number}</td>
                        <td className="py-4 px-6 text-secondary-700 dark:text-secondary-300">{invoice.customer_name}</td>
                        <td className="py-4 px-6 text-right font-medium text-secondary-900 dark:text-white">
                          ${invoice.total_amount.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                            {invoice.payment_method === 'virtual' ? 'Virtual' : 'Efectivo'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn('inline-flex px-3 py-1 rounded-full text-xs font-medium', getPaymentStatusColor(invoice.payment_status))}>
                            {invoice.payment_status === 'completed' ? 'Completado' : invoice.payment_status === 'pending' ? 'Pendiente' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-secondary-700 dark:text-secondary-300">
                          {new Date(invoice.issued_date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 flex items-center justify-end gap-2">
                          <button
                            title="Ver factura"
                            className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded transition"
                          >
                            <Eye className="w-4 h-4 text-primary-600" />
                          </button>
                          <button
                            title="Descargar PDF"
                            className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded transition"
                          >
                            <Download className="w-4 h-4 text-primary-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            title="Eliminar factura"
                            className="p-2 hover:bg-error-100 dark:hover:bg-error-900/20 rounded transition"
                          >
                            <Trash2 className="w-4 h-4 text-error-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
