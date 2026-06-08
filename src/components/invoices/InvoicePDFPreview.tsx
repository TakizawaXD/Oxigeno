import { useEffect, useRef } from 'react';
import { Building2, Mail, Phone, MapPin, Calendar, DollarSign, Hash } from 'lucide-react';

interface InvoiceItemData {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  payment_method: 'virtual' | 'cash';
  items: InvoiceItemData[];
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  notes: string;
  issued_date: string;
  company_name: string;
}

export function InvoicePDFPreview({ invoice }: { invoice: InvoiceData }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  useEffect(() => {
    // Cargar html2pdf dinámicamente
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      console.log('html2pdf cargado');
    };
    document.body.appendChild(script);
  }, []);

  const generatePDF = async () => {
    if (!containerRef.current) return;

    try {
      // Usar html2pdf desde window
      const element = containerRef.current;
      const opt = {
        margin: 10,
        filename: `${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      // @ts-ignore - html2pdf se carga globalmente
      if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save();
      } else {
        console.error('html2pdf no está disponible');
        // Fallback: crear descarga manual
        downloadAsImage();
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  const downloadAsImage = () => {
    // Fallback a PNG si html2pdf falla
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx && containerRef.current) {
      canvas.width = 800;
      canvas.height = 1000;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${invoice.invoice_number}.png`;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* PDF Preview */}
      <div ref={containerRef} className="bg-white p-12 rounded-lg shadow-lg max-w-2xl mx-auto" style={{ aspectRatio: '8.5/11' }}>
        {/* Header */}
        <div className="border-b-2 border-primary-600 pb-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-primary-600">{invoice.company_name}</h1>
              <p className="text-gray-600 text-sm">Oxisan - Sistema de Logística Sanitaria</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-300">FACTURA</div>
              <p className="text-primary-600 font-bold text-lg mt-2">{invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex justify-between mb-6 text-sm">
          <div>
            <p className="text-gray-600">Fecha de Emisión:</p>
            <p className="font-semibold text-gray-900">{new Date(invoice.issued_date).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <p className="text-gray-600">Método de Pago:</p>
            <p className="font-semibold text-gray-900">{invoice.payment_method === 'virtual' ? 'Pago Virtual' : 'Efectivo'}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold mb-2">Cliente</p>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-gray-900">{invoice.customer_name}</p>
              <p className="text-gray-700">{invoice.customer_address}</p>
              <p className="text-gray-600">{invoice.customer_email}</p>
              <p className="text-gray-600">{invoice.customer_phone}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold mb-2">De</p>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-gray-900">{invoice.company_name}</p>
              <p className="text-gray-600">Oxisan</p>
              <p className="text-gray-600">Sistema de Logística Sanitaria</p>
              <p className="text-primary-600 font-semibold">www.healthlogix.com</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="bg-primary-50 border-b-2 border-primary-600">
              <th className="px-3 py-2 text-left text-xs font-bold text-gray-900">Descripción</th>
              <th className="px-3 py-2 text-right text-xs font-bold text-gray-900 w-16">Cant.</th>
              <th className="px-3 py-2 text-right text-xs font-bold text-gray-900 w-20">Precio</th>
              <th className="px-3 py-2 text-right text-xs font-bold text-gray-900 w-12">IVA</th>
              <th className="px-3 py-2 text-right text-xs font-bold text-gray-900 w-24">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const itemSubtotal = item.quantity * item.unit_price;
              const itemTax = (itemSubtotal * item.tax_rate) / 100;
              return (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-900">{item.quantity}</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-900">${item.unit_price.toFixed(2)}</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-600">{item.tax_rate}%</td>
                  <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">
                    ${(itemSubtotal + itemTax).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Impuestos:</span>
              <span className="font-semibold text-gray-900">${invoice.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Descuento:</span>
              <span className="font-semibold text-gray-900">-${invoice.discount_amount.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-primary-600 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-primary-600">${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-4">
            <p className="font-semibold text-gray-900 mb-1">Notas:</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-6 text-center text-xs text-gray-600">
          <p>Gracias por su negocio • Oxisan - Sistema de Logística Sanitaria</p>
          <p className="mt-1">Factura generada el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={generatePDF}
          className="px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v-7m0 0V5m0 7H5m7 0h7" />
          </svg>
          Descargar PDF
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 rounded-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m2 4H7a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2zm-6-4l-4 4m0 0l4 4m-4-4h8" />
          </svg>
          Imprimir
        </button>
      </div>
    </div>
  );
}
