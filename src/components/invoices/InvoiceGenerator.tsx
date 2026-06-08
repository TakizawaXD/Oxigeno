import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import {
  Plus,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader,
  DollarSign,
  CreditCard,
  Banknote,
  Users,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

interface InvoiceFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  payment_method: 'virtual' | 'cash';
  items: InvoiceItem[];
  notes: string;
  discount_amount: number;
}

export function InvoiceGenerator() {
  const navigate = useNavigate();
  const { user, organization } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    payment_method: 'virtual',
    items: [{ id: '1', description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
    notes: '',
    discount_amount: 0,
  });

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const calculateTax = () => {
    return formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + (itemSubtotal * item.tax_rate) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal + tax - formData.discount_amount;
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 0,
        },
      ],
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !user) return;

    setLoading(true);
    setError(null);

    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const total = calculateTotal();

      // Crear factura
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          organization_id: organization.id,
          invoice_number: invoiceNumber,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          customer_address: formData.customer_address,
          total_amount: total,
          tax_amount: calculateTax(),
          discount_amount: formData.discount_amount,
          payment_method: formData.payment_method,
          notes: formData.notes,
          created_by: user.uid,
        })
        .select();

      if (invoiceError) throw invoiceError;

      if (invoice && invoice.length > 0) {
        // Agregar items a la factura
        const invoiceItems = formData.items.map(item => ({
          invoice_id: invoice[0].id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (itemsError) throw itemsError;

        setSuccessMessage(`Factura ${invoiceNumber} creada exitosamente`);
        setFormData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          customer_address: '',
          payment_method: 'virtual',
          items: [{ id: '1', description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
          notes: '',
          discount_amount: 0,
        });

        setTimeout(() => {
          navigate('/invoices');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.customer_name &&
    formData.customer_email &&
    formData.items.length > 0 &&
    formData.items.every(item => item.description && item.quantity > 0 && item.unit_price > 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0" />
          <p className="text-error-700 dark:text-error-300 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" />
          <p className="text-success-700 dark:text-success-300 text-sm">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div className="card p-8 rounded-2xl border-2 border-primary-100 dark:border-primary-900/30">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Información del Cliente
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="label font-semibold mb-2">Nombre del Cliente *</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Juan Pérez"
                className="input rounded-lg border-2 border-secondary-200 dark:border-secondary-700 focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="label font-semibold mb-2">Email *</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={e => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                placeholder="cliente@example.com"
                className="input rounded-lg border-2 border-secondary-200 dark:border-secondary-700 focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="label font-semibold mb-2">Teléfono</label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="input rounded-lg border-2 border-secondary-200 dark:border-secondary-700 focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
              />
            </div>

            <div>
              <label className="label font-semibold mb-2">Dirección</label>
              <input
                type="text"
                value={formData.customer_address}
                onChange={e => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                placeholder="Calle 123, Ciudad"
                className="input rounded-lg border-2 border-secondary-200 dark:border-secondary-700 focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-4">
            <label className="label mb-3 block">Método de Pago *</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, payment_method: 'virtual' }))}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition',
                  formData.payment_method === 'virtual'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                )}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                <span className="font-medium text-secondary-900 dark:text-white">Virtual</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, payment_method: 'cash' }))}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition',
                  formData.payment_method === 'cash'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                )}
              >
                <Banknote className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                <span className="font-medium text-secondary-900 dark:text-white">Efectivo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Líneas de Factura</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left py-3 px-4 font-semibold text-secondary-900 dark:text-white">Descripción</th>
                  <th className="text-right py-3 px-4 font-semibold text-secondary-900 dark:text-white">Cantidad</th>
                  <th className="text-right py-3 px-4 font-semibold text-secondary-900 dark:text-white">Precio</th>
                  <th className="text-right py-3 px-4 font-semibold text-secondary-900 dark:text-white">IVA %</th>
                  <th className="text-right py-3 px-4 font-semibold text-secondary-900 dark:text-white">Subtotal</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map(item => (
                  <tr key={item.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Descripción del producto"
                        className="input input-sm"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                        className="input input-sm text-right"
                        min="1"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                        className="input input-sm text-right"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.tax_rate}
                        onChange={e => updateItem(item.id, 'tax_rate', parseFloat(e.target.value))}
                        className="input input-sm text-right"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-secondary-900 dark:text-white">
                      ${(item.quantity * item.unit_price + (item.quantity * item.unit_price * item.tax_rate) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 hover:bg-error-50 dark:hover:bg-error-900/20 rounded transition"
                      >
                        <Trash2 className="w-4 h-4 text-error-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/40 transition"
          >
            <Plus className="w-4 h-4" />
            Agregar línea
          </button>
        </div>

        {/* Totals */}
        <div className="card p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary-700 dark:text-secondary-300">Subtotal:</span>
              <span className="font-medium text-secondary-900 dark:text-white">${calculateSubtotal().toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-secondary-700 dark:text-secondary-300">Impuestos:</span>
              <span className="font-medium text-secondary-900 dark:text-white">${calculateTax().toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <span className="text-secondary-700 dark:text-secondary-300">Descuento:</span>
              <input
                type="number"
                value={formData.discount_amount}
                onChange={e => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                className="input input-sm w-24"
                min="0"
                step="0.01"
              />
            </div>

            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-secondary-900 dark:text-white">Total:</span>
                <span className="text-lg font-bold text-primary-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <label className="label">Notas</label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas adicionales para la factura"
            rows={4}
            className="input"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generando factura...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Crear y Descargar Factura
            </>
          )}
        </button>
      </form>
    </div>
  );
}
