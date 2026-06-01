export const APP_NAME = 'HealthLogix OS';
export const APP_VERSION = '1.0.0';
export const DEVELOPER = 'AndresTaker';

export const ASSET_STATUSES = [
  { value: 'available', label: 'Disponible', color: 'success' },
  { value: 'reserved', label: 'Reservado', color: 'warning' },
  { value: 'in_transit', label: 'En Transito', color: 'primary' },
  { value: 'delivered', label: 'Entregado', color: 'success' },
  { value: 'in_use', label: 'En Uso', color: 'primary' },
  { value: 'maintenance', label: 'Mantenimiento', color: 'warning' },
  { value: 'damaged', label: 'Danado', color: 'error' },
  { value: 'lost', label: 'Perdido', color: 'error' },
  { value: 'retired', label: 'Retirado', color: 'secondary' },
] as const;

export const ORDER_STATUSES = [
  { value: 'draft', label: 'Borrador', color: 'secondary' },
  { value: 'pending', label: 'Pendiente', color: 'warning' },
  { value: 'approved', label: 'Aprobado', color: 'success' },
  { value: 'scheduled', label: 'Programado', color: 'primary' },
  { value: 'assigned', label: 'Asignado', color: 'primary' },
  { value: 'in_transit', label: 'En Transito', color: 'primary' },
  { value: 'delivered', label: 'Entregado', color: 'success' },
  { value: 'completed', label: 'Completado', color: 'success' },
  { value: 'cancelled', label: 'Cancelado', color: 'error' },
] as const;

export const VEHICLE_STATUSES = [
  { value: 'active', label: 'Activo', color: 'success' },
  { value: 'in_use', label: 'En Uso', color: 'primary' },
  { value: 'maintenance', label: 'Mantenimiento', color: 'warning' },
  { value: 'out_of_service', label: 'Fuera de Servicio', color: 'error' },
] as const;

export const PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'secondary' },
  { value: 'normal', label: 'Normal', color: 'primary' },
  { value: 'high', label: 'Alta', color: 'warning' },
  { value: 'critical', label: 'Critica', color: 'error' },
  { value: 'emergency', label: 'Emergencia', color: 'error' },
] as const;

export const LIFECYCLE_STAGES = [
  'Nuevo',
  'En Servicio',
  'Mantenimiento',
  'Reparacion',
  'Retirado',
] as const;

export const OWNERSHIP_TYPES = [
  { value: 'owned', label: 'Propio' },
  { value: 'leased', label: 'Arrendado' },
  { value: 'rented', label: 'Rentado' },
  { value: 'consignment', label: 'Consignacion' },
] as const;

export const FACILITY_TYPES = [
  { value: 'warehouse', label: 'Almacen' },
  { value: 'distribution_center', label: 'Centro de Distribucion' },
  { value: 'production', label: 'Produccion' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinica' },
  { value: 'office', label: 'Oficina' },
] as const;

export const CUSTOMER_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinica' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'laboratory', label: 'Laboratorio' },
  { value: 'distributor', label: 'Distribuidor' },
  { value: 'government', label: 'Gobierno' },
  { value: 'other', label: 'Otro' },
] as const;

export const PAGE_SIZE = 50;
export const MAX_ITEMS_PER_PAGE = 100;

export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';
