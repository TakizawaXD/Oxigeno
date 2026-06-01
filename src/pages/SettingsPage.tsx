import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import {
  db,
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from '../lib/firebase';
import { useTranslation } from '../lib/translations';
import { cn } from '../lib/utils';
import {
  Settings,
  Save,
  Download,
  Upload,
  Building2,
  LogOut,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader,
} from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const { organization, user, signOut } = useAuthStore();
  const { businessType, setBusinessType } = useUIStore();
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [logoName, setLogoName] = useState(organization?.name || 'HealthLogix OS');
  const [selectedBusinessType, setSelectedBusinessType] = useState(businessType);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveOrganization = async () => {
    if (!organization) return;
    setSaving(true);
    setMessage(null);

    try {
      const orgRef = doc(db, 'organizations', organization.id);
      await updateDoc(orgRef, {
        name: orgName,
        updated_at: serverTimestamp(),
      });

      // Update local storage and Zustand store state for UI adaptation
      setBusinessType(selectedBusinessType);

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al guardar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!organization) return;
    setExporting(true);

    try {
      const [assetsSnap, ordersSnap, customersSnap, inventorySnap, facilitiesSnap] = await Promise.all([
        getDocs(query(collection(db, 'assets'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'orders'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'customers'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'inventory'), where('organization_id', '==', organization.id))),
        getDocs(query(collection(db, 'facilities'), where('organization_id', '==', organization.id))),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        organization: organization.name,
        data: {
          assets: assetsSnap.docs.map(doc => doc.data()),
          orders: ordersSnap.docs.map(doc => doc.data()),
          customers: customersSnap.docs.map(doc => doc.data()),
          inventory: inventorySnap.docs.map(doc => doc.data()),
          facilities: facilitiesSnap.docs.map(doc => doc.data()),
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `healthlogix-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Datos exportados correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al exportar datos'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!organization || !event.target.files?.[0]) return;

    setImporting(true);
    const file = event.target.files[0];

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validar estructura básica
      if (!importedData.data || !importedData.organization) {
        throw new Error('Formato de archivo inválido');
      }

      // Importar cada entidad
      let imported = 0;

      if (importedData.data.customers?.length > 0) {
        for (const customer of importedData.data.customers) {
          const { id, ...customerData } = customer;
          await addDoc(collection(db, 'customers'), {
            ...customerData,
            organization_id: organization.id,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          imported++;
        }
      }

      if (importedData.data.facilities?.length > 0) {
        for (const facility of importedData.data.facilities) {
          const { id, ...facilityData } = facility;
          await addDoc(collection(db, 'facilities'), {
            ...facilityData,
            organization_id: organization.id,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          imported++;
        }
      }

      setMessage({
        type: 'success',
        text: `${imported} registros importados correctamente`
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al importar datos'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">{t.settings.settings}</h1>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">Administra tu organización y preferencias</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={cn(
          'p-4 rounded-lg border flex items-center gap-3',
          message.type === 'success'
            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
            : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
        )}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400" />
          )}
          <span className={message.type === 'success' ? 'text-success-700 dark:text-success-300' : 'text-error-700 dark:text-error-300'}>
            {message.text}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuración General */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              {t.settings.organizationSettings}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">{t.settings.organizationName}</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Nombre del Logo / Marca</label>
                <input
                  type="text"
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  className="input"
                  placeholder="Por ejemplo: HealthLogix OS, Mi Empresa, etc."
                />
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  Este nombre aparecerá en el logo de tu aplicación
                </p>
              </div>

              <div>
                <label className="label">¿Qué vende tu organización? (Adaptación del Sistema)</label>
                <select
                  value={selectedBusinessType}
                  onChange={(e) => setSelectedBusinessType(e.target.value as any)}
                  className="input animate-fade-in"
                >
                  <option value="medical_oxygen">Oxígeno y Gases Médicos (Cilindros, Concentradores)</option>
                  <option value="bakery">Panadería y Pastelería (Ingredientes, Horno, Moldes, Productos)</option>
                  <option value="retail">Comercio y Retail (Productos, Mercancía, Ropa, Electrónica)</option>
                  <option value="services">Servicios Técnicos (Herramientas, Repuestos, Equipos)</option>
                  <option value="general">Logística y Distribución General (Palets, Contenedores, Carga)</option>
                </select>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  El sistema adaptará automáticamente los términos de los activos, estados y categorías sugeridas para adaptarse a tu industria.
                </p>
              </div>

              <button
                onClick={handleSaveOrganization}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t.settings.saveChanges}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Import/Export */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary-600" />
              Importar y Exportar Datos
            </h2>

            <div className="space-y-4">
              {/* Export */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Exportar Datos
                </label>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
                  Descarga todos tus datos en formato JSON (activos, pedidos, clientes, inventario, instalaciones)
                </p>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="btn-secondary w-full"
                >
                  {exporting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Exportar Datos
                    </>
                  )}
                </button>
              </div>

              {/* Import */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Importar Datos
                </label>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
                  Carga datos previamente exportados (solo se importarán clientes e instalaciones)
                </p>
                <label className="btn-secondary w-full cursor-pointer">
                  {importing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Seleccionar Archivo
                    </>
                  )}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Data Info */}
          <div className="card p-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
              Información de Datos
            </h3>
            <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
              <li>• Los datos se exportan en formato JSON para máxima compatibilidad</li>
              <li>• Solo se pueden importar clientes e instalaciones nuevas</li>
              <li>• Los datos importados se asignarán automáticamente a tu organización</li>
              <li>• Los IDs duplicados se ignorarán para evitar conflictos</li>
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="card p-6">
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Información de Cuenta</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase">Email</p>
                <p className="text-sm text-secondary-900 dark:text-white font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase">Organización</p>
                <p className="text-sm text-secondary-900 dark:text-white font-medium">{organization?.name}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase">Rol</p>
                <p className="text-sm text-secondary-900 dark:text-white font-medium capitalize">{organization?.role}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="btn-error w-full mt-4"
              >
                <LogOut className="w-4 h-4" />
                {t.common.signOut}
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="card p-6">
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Enlaces Útiles</h3>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Documentación
              </a>
              <a href="#" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Soporte
              </a>
              <a href="#" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Términos de Servicio
              </a>
              <a href="#" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
