-- ==========================================
-- 001_CORE_SCHEMA.SQL
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Trigger for updated_at (defined first)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'standard',
  business_type TEXT DEFAULT 'medical_oxygen',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_business_type CHECK (business_type IN ('medical_oxygen', 'bakery', 'retail', 'services', 'general'))
);

-- Organization Members (User-Tenant mapping)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '[]',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(organization_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'manager', 'operator', 'viewer'))
);

-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL,
  description TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Coordinates for mapping
  coordinates GEOGRAPHY(POINT, 4326),
  
  -- Capacity & Constraints
  total_capacity INTEGER DEFAULT 0,
  max_weight_capacity DECIMAL(10,2),
  has_dangerous_goods_storage BOOLEAN DEFAULT false,
  requires_certification BOOLEAN DEFAULT false,
  
  -- Operating configuration
  operating_hours JSONB DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_facility_type CHECK (type IN ('plant', 'warehouse', 'distribution_center', 'hospital', 'clinic', 'vehicle_base', 'depot')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'maintenance', 'closed'))
);

-- Facility Zones (sub-locations)
CREATE TABLE IF NOT EXISTS facility_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  zone_code TEXT NOT NULL,
  zone_name TEXT,
  zone_type TEXT DEFAULT 'storage',
  capacity INTEGER,
  current_stock INTEGER DEFAULT 0,
  coordinates_position TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(facility_id, zone_code),
  CONSTRAINT valid_zone_type CHECK (zone_type IN ('storage', 'loading', 'staging', 'maintenance', 'quarantine', 'shipping', 'receiving'))
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

CREATE POLICY "Admins can insert organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Organization owners can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Org admins can manage members"
  ON organization_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.is_active = true
    )
  );

-- RLS Policies for facilities
CREATE POLICY "Users can view facilities in their organizations"
  ON facilities FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Managers can create facilities"
  ON facilities FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Managers can update facilities"
  ON facilities FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Admins can delete facilities"
  ON facilities FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- RLS Policies for facility_zones
CREATE POLICY "Users can view zones in accessible facilities"
  ON facility_zones FOR SELECT
  TO authenticated
  USING (
    facility_id IN (
      SELECT f.id FROM facilities f
      JOIN organization_members om ON om.organization_id = f.organization_id
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Managers can manage zones"
  ON facility_zones FOR ALL
  TO authenticated
  USING (
    facility_id IN (
      SELECT f.id FROM facilities f
      JOIN organization_members om ON om.organization_id = f.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'manager') AND om.is_active = true
    )
  )
  WITH CHECK (
    facility_id IN (
      SELECT f.id FROM facilities f
      JOIN organization_members om ON om.organization_id = f.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'manager') AND om.is_active = true
    )
  );

-- Indexes for performance
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_facilities_organization ON facilities(organization_id);
CREATE INDEX idx_facilities_type ON facilities(type);
CREATE INDEX idx_facilities_status ON facilities(status);
CREATE INDEX idx_facility_zones_facility ON facility_zones(facility_id);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 002_ASSET_MANAGEMENT.SQL
-- ==========================================

-- Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  
  -- Category configuration
  lifecycle_stages JSONB DEFAULT '["procurement", "active", "maintenance", "retired"]',
  custom_fields JSONB DEFAULT '{}',
  requires_certification BOOLEAN DEFAULT false,
  requires_maintenance BOOLEAN DEFAULT true,
  maintenance_interval_days INTEGER DEFAULT 90,
  
  -- Gas-specific (nullable, only for gas cylinders)
  gas_type TEXT,
  standard_capacity DECIMAL(10,2),
  standard_pressure DECIMAL(10,2),
  unit_of_measure TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, code)
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES asset_categories(id),
  
  -- Identification
  asset_number TEXT NOT NULL,
  qr_code TEXT UNIQUE,
  barcode TEXT,
  serial_number TEXT,
  
  -- Name/Description
  name TEXT,
  description TEXT,
  
  -- Current State
  status TEXT NOT NULL DEFAULT 'available',
  sub_status TEXT,
  
  -- Location
  current_facility_id UUID REFERENCES facilities(id),
  current_zone_id UUID REFERENCES facility_zones(id),
  current_custodian_id UUID REFERENCES auth.users(id),
  
  -- Ownership/Financial
  ownership_type TEXT DEFAULT 'owned',
  owner_organization_id UUID REFERENCES organizations(id),
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  warranty_expiry_date DATE,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insured_value DECIMAL(12,2),
  
  -- Physical Properties (varies by category)
  weight DECIMAL(10,3),
  dimensions JSONB,
  color TEXT,
  material TEXT,
  
  -- Gas-specific properties (for cylinders)
  gas_type_id UUID REFERENCES asset_categories(id),
  capacity DECIMAL(10,3),
  max_pressure DECIMAL(10,2),
  current_fill_percentage DECIMAL(5,2),
  last_fill_date DATE,
  last_hydrostatic_test DATE,
  next_hydrostatic_test DATE,
  
  -- Medical-specific properties
  model_number TEXT,
  manufacturer TEXT,
  manufactured_date DATE,
  installation_date DATE,
  
  -- Digital Twin Metrics (computed/updated)
  health_score DECIMAL(5,2) DEFAULT 100.00,
  risk_score DECIMAL(5,2) DEFAULT 0.00,
  reliability_score DECIMAL(5,2) DEFAULT 100.00,
  utilization_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Lifecycle
  lifecycle_stage TEXT DEFAULT 'active',
  total_rental_days INTEGER DEFAULT 0,
  total_distance_traveled_km DECIMAL(10,2) DEFAULT 0.00,
  total_fills_cycles INTEGER DEFAULT 0,
  
  -- IoT/Telemetry
  iot_device_id TEXT,
  last_telemetry_at TIMESTAMPTZ,
  telemetry_data JSONB DEFAULT '{}',
  
  -- Notes and custom data
  notes TEXT,
  custom_attributes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Photos
  primary_photo_url TEXT,
  photos JSONB DEFAULT '[]',
  
  -- Dates
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_date DATE,
  last_inspection_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ,
  
  CONSTRAINT valid_asset_status CHECK (status IN (
    'available', 'reserved', 'in_transit', 'delivered', 'in_use',
    'maintenance', 'damaged', 'lost', 'retired', 'quarantined'
  )),
  CONSTRAINT valid_ownership_type CHECK (ownership_type IN ('owned', 'leased', 'rented', 'customer_owned', 'consignment'))
);

-- Asset Events (Event Sourcing)
CREATE TABLE IF NOT EXISTS asset_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_source TEXT,
  
  -- State Changes
  previous_status TEXT,
  new_status TEXT,
  previous_facility_id UUID REFERENCES facilities(id),
  new_facility_id UUID REFERENCES facilities(id),
  previous_custodian_id UUID REFERENCES auth.users(id),
  new_custodian_id UUID REFERENCES auth.users(id),
  
  -- Context
  order_id UUID,
  route_id UUID,
  trip_id UUID,
  related_event_id UUID REFERENCES asset_events(id),
  
  -- Location at event
  event_location GEOGRAPHY(POINT, 4326),
  event_facility_id UUID REFERENCES facilities(id),
  
  -- Data
  event_data JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Audit
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_event_category CHECK (event_category IN (
    'lifecycle', 'movement', 'maintenance', 'ownership', 'reservation',
    'incident', 'telemetry', 'inspection', 'certification', 'financial'
  ))
);

-- Maintenance Records
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  -- Maintenance Details
  maintenance_type TEXT NOT NULL,
  maintenance_category TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_date DATE,
  completed_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  
  -- Cost
  labor_cost DECIMAL(10,2) DEFAULT 0,
  parts_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Work Details
  performed_by_name TEXT,
  performed_by_id UUID REFERENCES auth.users(id),
  vendor_id UUID,
  hours_spent DECIMAL(5,2),
  
  -- Results
  findings TEXT,
  work_performed TEXT,
  parts_replaced JSONB DEFAULT '[]',
  next_maintenance_date DATE,
  
  -- Documents
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_maintenance_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'deferred')),
  CONSTRAINT valid_maintenance_type CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'inspection', 'certification', 'calibration', 'overhaul'))
);

-- Asset Certifications
CREATE TABLE IF NOT EXISTS asset_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  certification_type TEXT NOT NULL,
  certification_name TEXT NOT NULL,
  certifying_body TEXT,
  certificate_number TEXT,
  
  -- Dates
  issue_date DATE,
  expiry_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Documents
  certificate_url TEXT,
  supporting_documents JSONB DEFAULT '[]',
  
  -- Audit
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_cert_status CHECK (status IN ('active', 'expired', 'pending_renewal', 'revoked', 'pending'))
);

-- Asset Documents
CREATE TABLE IF NOT EXISTS asset_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- File
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Versioning
  version TEXT DEFAULT '1.0',
  previous_version_id UUID REFERENCES asset_documents(id),
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_confidential BOOLEAN DEFAULT false,
  
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_document_type CHECK (document_type IN (
    'manual', 'certificate', 'photo', 'inspection_report', 'warranty',
    'invoice', 'maintenance_report', 'incident_report', 'contract', 'other'
  ))
);

-- Enable RLS
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_categories
CREATE POLICY "Users can view categories in their organizations"
  ON asset_categories FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Managers can manage categories"
  ON asset_categories FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  );

-- RLS Policies for assets
CREATE POLICY "Users can view assets in their organizations"
  ON assets FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can create assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'operator') AND is_active = true
    )
  );

CREATE POLICY "Operators can update assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Managers can delete assets"
  ON assets FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  );

-- RLS Policies for asset_events
CREATE POLICY "Users can view events for accessible assets"
  ON asset_events FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "System can insert events"
  ON asset_events FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for maintenance_records
CREATE POLICY "Users can view maintenance for accessible assets"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can manage maintenance records"
  ON maintenance_records FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for asset_certifications
CREATE POLICY "Users can view certifications for accessible assets"
  ON asset_certifications FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Managers can manage certifications"
  ON asset_certifications FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'operator') AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'operator') AND is_active = true
    )
  );

-- RLS Policies for asset_documents
CREATE POLICY "Users can view documents for accessible assets"
  ON asset_documents FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can manage documents"
  ON asset_documents FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Indexes
CREATE INDEX idx_assets_organization ON assets(organization_id);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_facility ON assets(current_facility_id);
CREATE INDEX idx_assets_qr_code ON assets(qr_code);
CREATE INDEX idx_assets_barcode ON assets(barcode);
CREATE INDEX idx_assets_serial ON assets(serial_number);
CREATE INDEX idx_asset_events_asset ON asset_events(asset_id);
CREATE INDEX idx_asset_events_type ON asset_events(event_type);
CREATE INDEX idx_asset_events_created ON asset_events(created_at DESC);
CREATE INDEX idx_maintenance_records_asset ON maintenance_records(asset_id);
CREATE INDEX idx_certifications_asset ON asset_certifications(asset_id);
CREATE INDEX idx_certifications_expiry ON asset_certifications(expiry_date);
CREATE INDEX idx_documents_asset ON asset_documents(asset_id);

CREATE TRIGGER update_asset_categories_updated_at
  BEFORE UPDATE ON asset_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_certifications_updated_at
  BEFORE UPDATE ON asset_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 003_ORDERS_INVENTORY.SQL
-- ==========================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Customer Info
  name TEXT NOT NULL,
  code TEXT,
  type TEXT DEFAULT 'hospital',
  industry TEXT,
  description TEXT,
  
  -- Contact
  website TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  
  -- Financial
  credit_limit DECIMAL(12,2),
  payment_terms TEXT DEFAULT 'net_30',
  discount_percentage DECIMAL(5,2),
  tax_id TEXT,
  
  -- Contract
  contract_id UUID,
  contract_start_date DATE,
  contract_end_date DATE,
  pricing_tier TEXT DEFAULT 'standard',
  
  -- Status
  status TEXT DEFAULT 'active',
  is_vip BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Tags and custom
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_customer_status CHECK (status IN ('active', 'inactive', 'pending', 'blocked')),
  CONSTRAINT valid_customer_type CHECK (type IN ('hospital', 'clinic', 'distributor', 'retail', 'manufacturing', 'government', 'other'))
);

-- Customer Contacts
CREATE TABLE IF NOT EXISTS customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer Locations
CREATE TABLE IF NOT EXISTS customer_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  location_type TEXT DEFAULT 'delivery',
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  coordinates GEOGRAPHY(POINT, 4326),
  
  -- Delivery Instructions
  delivery_instructions TEXT,
  access_notes TEXT,
  receiving_hours JSONB DEFAULT '{}',
  
  contact_name TEXT,
  contact_phone TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Order Number
  order_number TEXT NOT NULL,
  external_reference TEXT,
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_location_id UUID REFERENCES customer_locations(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  sub_status TEXT,
  priority TEXT DEFAULT 'normal',
  is_emergency BOOLEAN DEFAULT false,
  
  -- Scheduling
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_delivery_date DATE,
  scheduled_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_window_start TIME,
  delivery_window_end TIME,
  
  -- Assignment
  assigned_driver_id UUID REFERENCES auth.users(id),
  assigned_vehicle_id UUID,
  route_id UUID,
  
  -- Location
  delivery_facility_id UUID REFERENCES facilities(id),
  
  -- Totals
  total_items INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  total_weight DECIMAL(10,3),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Fulfillment
  source_facility_id UUID REFERENCES facilities(id),
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  parent_order_id UUID REFERENCES orders(id),
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  cancellation_reason TEXT,
  
  -- SLA
  sla_due_date TIMESTAMPTZ,
  sla_status TEXT DEFAULT 'on_track',
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT valid_order_status CHECK (status IN (
    'draft', 'pending', 'approved', 'scheduled', 'assigned',
    'in_transit', 'delivered', 'partially_delivered', 'cancelled', 'on_hold'
  )),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'critical', 'emergency'))
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Item
  asset_category_id UUID REFERENCES asset_categories(id),
  reserved_asset_id UUID REFERENCES assets(id),
  
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  fulfilled_quantity INTEGER DEFAULT 0,
  
  -- Pricing
  unit_price DECIMAL(10,2),
  line_total DECIMAL(12,2),
  
  -- Scheduling
  scheduled_delivery_date DATE,
  fulfilled_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Notes
  notes TEXT,
  custom_attributes JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_order_item_status CHECK (status IN ('pending', 'reserved', 'in_transit', 'delivered', 'cancelled', 'backordered'))
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  asset_category_id UUID NOT NULL REFERENCES asset_categories(id),
  
  -- Quantities
  total_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  in_transit_quantity INTEGER DEFAULT 0,
  
  -- Limits
  minimum_stock INTEGER DEFAULT 0,
  maximum_stock INTEGER,
  safety_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  
  -- Metrics
  last_restocked_at TIMESTAMPTZ,
  last_stockout_at TIMESTAMPTZ,
  days_of_stock DECIMAL(5,2),
  turnover_rate DECIMAL(5,2),
  
  -- Location
  zone_id UUID REFERENCES facility_zones(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(facility_id, asset_category_id)
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Reference
  facility_id UUID NOT NULL REFERENCES facilities(id),
  asset_category_id UUID REFERENCES asset_categories(id),
  asset_id UUID REFERENCES assets(id),
  
  -- Transaction
  transaction_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  
  -- Source/Destination
  source_facility_id UUID REFERENCES facilities(id),
  destination_facility_id UUID REFERENCES facilities(id),
  
  -- Reference
  order_id UUID REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  reference TEXT,
  reference_type TEXT,
  
  -- Audit
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN (
    'received', 'picked', 'reserved', 'released', 'adjusted',
    'transferred_in', 'transferred_out', 'returned', 'damaged',
    'count_adjustment', 'production', 'disposed'
  ))
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view customers in their organizations"
  ON customers FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'operator') AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for customer_contacts
CREATE POLICY "Users can manage contacts for accessible customers"
  ON customer_contacts FOR ALL
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- RLS Policies for customer_locations
CREATE POLICY "Users can manage locations for accessible customers"
  ON customer_locations FOR ALL
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view orders in their organizations"
  ON orders FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Users can manage items for accessible orders"
  ON order_items FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory in their organizations"
  ON inventory FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for inventory_transactions
CREATE POLICY "Users can view transactions in their organizations"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Operators can create transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Indexes
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_orders_organization ON orders(organization_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(scheduled_delivery_date);
CREATE INDEX idx_orders_priority ON orders(priority);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_inventory_facility ON inventory(facility_id);
CREATE INDEX idx_inventory_category ON inventory(asset_category_id);
CREATE INDEX idx_inventory_transactions_facility ON inventory_transactions(facility_id);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 004_FLEET_OPERATIONS.SQL
-- ==========================================

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Vehicle Info
  vehicle_number TEXT NOT NULL,
  license_plate TEXT,
  vin TEXT,
  
  name TEXT,
  vehicle_type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  
  -- Capacity
  max_weight_capacity DECIMAL(10,3),
  max_volume_capacity DECIMAL(10,3),
  max_cylinders INTEGER,
  has_refrigeration BOOLEAN DEFAULT false,
  has_dangerous_goods_cert BOOLEAN DEFAULT false,
  
  -- Registration
  registration_expiry DATE,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  
  -- Metrics
  current_mileage DECIMAL(10,2),
  fuel_capacity DECIMAL(10,2),
  fuel_type TEXT,
  fuel_efficiency DECIMAL(5,2),
  
  -- Status
  status TEXT DEFAULT 'active',
  current_facility_id UUID REFERENCES facilities(id),
  current_driver_id UUID REFERENCES auth.users(id),
  
  -- Telemetry
  iot_device_id TEXT,
  last_telemetry_at TIMESTAMPTZ,
  current_location GEOGRAPHY(POINT, 4326),
  
  -- Photos
  photo_url TEXT,
  
  notes TEXT,
  custom_attributes JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_vehicle_status CHECK (status IN ('active', 'in_use', 'maintenance', 'out_of_service', 'retired')),
  CONSTRAINT valid_vehicle_type CHECK (vehicle_type IN ('truck', 'van', 'trailer', 'container', 'specialized'))
);

-- Vehicle Maintenance
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  maintenance_type TEXT NOT NULL,
  description TEXT,
  
  scheduled_date DATE,
  completed_date DATE,
  odometer_at_service DECIMAL(10,2),
  cost DECIMAL(10,2),
  
  performed_by TEXT,
  vendor TEXT,
  
  status TEXT DEFAULT 'pending',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_vehicle_maint_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Driver Info
  driver_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- License
  license_number TEXT,
  license_class TEXT,
  license_expiry DATE,
  license_state TEXT,
  
  -- Certifications
  certifications JSONB DEFAULT '[]',
  has_hazmat_cert BOOLEAN DEFAULT false,
  has_medical_cert BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active',
  is_available BOOLEAN DEFAULT true,
  current_vehicle_id UUID REFERENCES vehicles(id),
  current_facility_id UUID REFERENCES facilities(id),
  
  -- Performance Metrics
  total_trips INTEGER DEFAULT 0,
  total_distance_km DECIMAL(10,2) DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2),
  customer_rating DECIMAL(3,2),
  
  -- Schedule
  working_hours JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_driver_status CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated'))
);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Route Info
  route_number TEXT NOT NULL,
  name TEXT,
  route_type TEXT DEFAULT 'delivery',
  
  -- Assignment
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  
  -- Schedule
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'planned',
  
  -- Metrics
  total_distance_km DECIMAL(10,2),
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  total_stops INTEGER DEFAULT 0,
  completed_stops INTEGER DEFAULT 0,
  total_weight DECIMAL(10,3),
  
  -- Optimization
  optimization_algorithm TEXT,
  optimization_score DECIMAL(5,2),
  
  -- Start/End
  start_facility_id UUID REFERENCES facilities(id),
  end_facility_id UUID REFERENCES facilities(id),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_route_status CHECK (status IN ('planned', 'assigned', 'in_progress', 'completed', 'cancelled', 'delayed')),
  CONSTRAINT valid_route_type CHECK (route_type IN ('delivery', 'pickup', 'mixed', 'transfer', 'service'))
);

-- Route Stops
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  
  -- Order/Customer
  order_id UUID REFERENCES orders(id),
  customer_location_id UUID REFERENCES customer_locations(id),
  
  -- Stop Info
  stop_number INTEGER NOT NULL,
  stop_type TEXT NOT NULL,
  
  -- Location
  facility_id UUID REFERENCES facilities(id),
  location_name TEXT,
  address TEXT,
  coordinates GEOGRAPHY(POINT, 4326),
  
  -- Schedule
  scheduled_arrival_time TIMESTAMPTZ,
  scheduled_departure_time TIMESTAMPTZ,
  estimated_arrival_time TIMESTAMPTZ,
  actual_arrival_time TIMESTAMPTZ,
  actual_departure_time TIMESTAMPTZ,
  
  -- Duration
  planned_duration_minutes INTEGER DEFAULT 15,
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Details
  instructions TEXT,
  notes TEXT,
  
  -- Tracking
  distance_from_previous_km DECIMAL(10,3),
  drive_time_from_previous_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_stop_status CHECK (status IN ('pending', 'en_route', 'arrived', 'in_progress', 'completed', 'skipped', 'failed')),
  CONSTRAINT valid_stop_type CHECK (stop_type IN ('pickup', 'delivery', 'transfer', 'break', 'fuel', 'depot'))
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  
  -- Assignment
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  
  -- Timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  -- Distance
  start_odometer DECIMAL(10,2),
  end_odometer DECIMAL(10,2),
  distance_traveled_km DECIMAL(10,2),
  
  -- Fuel
  fuel_start DECIMAL(5,2),
  fuel_end DECIMAL(5,2),
  fuel_consumed DECIMAL(5,2),
  
  -- Status
  status TEXT DEFAULT 'in_progress',
  
  -- Telemetry
  max_speed DECIMAL(5,2),
  average_speed DECIMAL(5,2),
  idle_time_minutes INTEGER,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Incident Info
  incident_number TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  
  -- Related Entities
  asset_id UUID REFERENCES assets(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  route_id UUID REFERENCES routes(id),
  order_id UUID REFERENCES orders(id),
  facility_id UUID REFERENCES facilities(id),
  
  -- Location
  incident_location GEOGRAPHY(POINT, 4326),
  location_description TEXT,
  
  -- Timing
  incident_date DATE NOT NULL,
  incident_time TIME,
  reported_at TIMESTAMPTZ DEFAULT now(),
  
  -- Description
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  
  -- Impact
  affected_items INTEGER DEFAULT 0,
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  
  -- Resolution
  status TEXT DEFAULT 'reported',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- Assignments
  assigned_to UUID REFERENCES auth.users(id),
  assigned_team TEXT,
  
  -- People
  reported_by UUID REFERENCES auth.users(id),
  witnesses TEXT,
  
  -- Evidence
  attachments JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  
  -- Follow-up
  follow_up_actions JSONB DEFAULT '[]',
  preventive_actions JSONB DEFAULT '[]',
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_incident_type CHECK (incident_type IN (
    'asset_damaged', 'asset_lost', 'asset_stolen', 'delivery_failed',
    'delivery_delayed', 'vehicle_accident', 'vehicle_breakdown',
    'driver_issue', 'customer_complaint', 'safety_incident',
    'compliance_violation', 'quality_issue', 'other'
  )),
  CONSTRAINT valid_incident_severity CHECK (severity IN ('low', 'medium', 'high', 'critical', 'emergency')),
  CONSTRAINT valid_incident_status CHECK (status IN ('reported', 'investigating', 'resolved', 'closed', 'escalated'))
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage vehicles in their organizations"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage vehicle maintenance in their organizations"
  ON vehicle_maintenance FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage drivers in their organizations"
  ON drivers FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage routes in their organizations"
  ON routes FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage route stops in their organizations"
  ON route_stops FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage trips in their organizations"
  ON trips FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage incidents in their organizations"
  ON incidents FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Indexes
CREATE INDEX idx_vehicles_organization ON vehicles(organization_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_drivers_organization ON drivers(organization_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_routes_organization ON routes(organization_id);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_date ON routes(scheduled_date);
CREATE INDEX idx_route_stops_route ON route_stops(route_id);
CREATE INDEX idx_incidents_organization ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_type ON incidents(incident_type);

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON route_stops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 005_CONTRACTS_BILLING.SQL
-- ==========================================

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contract Info
  contract_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  auto_renewal BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Terms
  payment_terms TEXT DEFAULT 'net_30',
  billing_cycle TEXT DEFAULT 'monthly',
  grace_period_days INTEGER DEFAULT 0,
  
  -- Pricing
  pricing_type TEXT DEFAULT 'fixed',
  currency TEXT DEFAULT 'USD',
  
  -- Metrics
  total_value DECIMAL(12,2),
  utilized_value DECIMAL(12,2) DEFAULT 0,
  
  -- SLA
  standard_delivery_days INTEGER DEFAULT 3,
  emergency_delivery_hours INTEGER DEFAULT 4,
  response_time_hours INTEGER DEFAULT 2,
  
  -- Limits
  monthly_delivery_limit INTEGER,
  volume_limit DECIMAL(12,2),
  
  -- Documents
  contract_document_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_contract_status CHECK (status IN ('draft', 'pending', 'active', 'expired', 'terminated', 'renewed')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('weekly', 'bi_weekly', 'monthly', 'quarterly', 'annual', 'on_demand'))
);

-- Contract Line Items
CREATE TABLE IF NOT EXISTS contract_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Item
  asset_category_id UUID REFERENCES asset_categories(id),
  service_type TEXT,
  description TEXT,
  
  -- Pricing
  unit_price DECIMAL(10,2),
  unit TEXT,
  minimum_quantity INTEGER DEFAULT 1,
  maximum_quantity INTEGER,
  
  -- Volume Pricing
  volume_discounts JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invoice Info
  invoice_number TEXT NOT NULL,
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id),
  contract_id UUID REFERENCES contracts(id),
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Amounts
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) DEFAULT 0,
  
  -- Reference
  external_invoice_id TEXT,
  purchase_order_number TEXT,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Document
  invoice_document_url TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'))
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item
  order_id UUID REFERENCES orders(id),
  asset_category_id UUID REFERENCES asset_categories(id),
  asset_id UUID REFERENCES assets(id),
  
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT,
  
  -- Pricing
  unit_price DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) DEFAULT 0,
  
  -- Dates
  service_date DATE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Contracts (for procurement)
CREATE TABLE IF NOT EXISTS supplier_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Supplier Info
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  
  -- Contract
  contract_number TEXT NOT NULL,
  description TEXT,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  status TEXT DEFAULT 'active',
  
  -- Financial
  total_value DECIMAL(12,2),
  
  -- Documents
  contract_document_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_sup_contract_status CHECK (status IN ('active', 'expired', 'terminated'))
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage contracts in their organizations"
  ON contracts FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage contract line items"
  ON contract_line_items FOR ALL
  TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can manage invoices in their organizations"
  ON invoices FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can manage supplier contracts in their organizations"
  ON supplier_contracts FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Indexes
CREATE INDEX idx_contracts_organization ON contracts(organization_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_contracts_updated_at
  BEFORE UPDATE ON supplier_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 006_WORKFLOWS_EVENTS.SQL
-- ==========================================

-- Workflow Definitions
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  
  -- Trigger
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  
  -- Conditions
  conditions JSONB DEFAULT '[]',
  
  -- Actions
  actions JSONB NOT NULL DEFAULT '[]',
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Statistics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_trigger_type CHECK (trigger_type IN (
    'order_created', 'order_approved', 'order_delivered', 'asset_status_change',
    'inventory_low', 'schedule', 'incident_created', 'geofence_enter',
    'geofence_exit', 'manual', 'webhook', 'threshold_breach'
  ))
);

-- Workflow Instances
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
  
  -- Trigger Info
  trigger_type TEXT,
  trigger_id UUID,
  trigger_entity TEXT,
  trigger_entity_id UUID,
  
  -- Status
  status TEXT DEFAULT 'running',
  
  -- Context
  context JSONB DEFAULT '{}',
  variables JSONB DEFAULT '{}',
  
  -- Execution
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Audit
  triggered_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_wf_instance_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused'))
);

-- Workflow Tasks
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  
  -- Task
  task_type TEXT NOT NULL,
  task_name TEXT,
  description TEXT,
  
  -- Order
  task_order INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_team TEXT,
  due_by TIMESTAMPTZ,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_wf_task_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped', 'waiting')),
  CONSTRAINT valid_wf_task_type CHECK (task_type IN (
    'send_notification', 'create_order', 'update_status', 'reserve_inventory',
    'assign_route', 'notify_driver', 'generate_invoice', 'create_task',
    'webhook', 'wait', 'condition', 'loop', 'parallel', 'ai_decision'
  ))
);

-- Business Rules
CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  
  -- Trigger
  entity_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  
  -- Conditions (JSON Logic)
  conditions JSONB DEFAULT '{}',
  
  -- Actions
  actions JSONB NOT NULL DEFAULT '[]',
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  effective_start_date DATE,
  effective_end_date DATE,
  
  -- Statistics
  total_executions INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_rule_entity CHECK (entity_type IN ('order', 'asset', 'inventory', 'driver', 'vehicle', 'route', 'contract', 'invoice'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  
  -- Related Entity
  entity_type TEXT,
  entity_id UUID,
  
  -- Action
  action_url TEXT,
  action_text TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  delivery_channels JSONB DEFAULT '["in_app"]',
  delivered_email BOOLEAN DEFAULT false,
  delivered_sms BOOLEAN DEFAULT false,
  delivered_push BOOLEAN DEFAULT false,
  
  -- Priority
  priority TEXT DEFAULT 'normal',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_notification_type CHECK (notification_type IN (
    'info', 'success', 'warning', 'error', 'delivery_update',
    'incident', 'maintenance_due', 'inventory_alert', 'sla_breach',
    'system', 'workflow'
  )),
  CONSTRAINT valid_notification_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Geofences
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Geometry
  geometry GEOGRAPHY(GEOMETRY, 4326) NOT NULL,
  geometry_type TEXT DEFAULT 'polygon',
  
  -- Type
  geofence_type TEXT NOT NULL,
  
  -- Related Facility
  facility_id UUID REFERENCES facilities(id),
  customer_location_id UUID REFERENCES customer_locations(id),
  
  -- Actions
  on_enter_actions JSONB DEFAULT '[]',
  on_exit_actions JSONB DEFAULT '[]',
  on_dwell_actions JSONB DEFAULT '[]',
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  min_dwell_time_seconds INTEGER,
  
  -- Alerts
  alert_on_enter BOOLEAN DEFAULT true,
  alert_on_exit BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_geofence_type CHECK (geofence_type IN (
    'facility', 'customer_location', 'restricted_zone',
    'delivery_area', 'service_area', 'custom'
  ))
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Recommendation
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Context
  entity_type TEXT,
  entity_id UUID,
  context_data JSONB DEFAULT '{}',
  
  -- Analysis
  insights JSONB DEFAULT '{}',
  impact_score DECIMAL(5,2),
  confidence_score DECIMAL(5,2),
  
  -- Action
  suggested_actions JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'new',
  
  -- Feedback
  user_feedback TEXT,
  user_rating INTEGER,
  feedback_provided_by UUID REFERENCES auth.users(id),
  feedback_provided_at TIMESTAMPTZ,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_rec_type CHECK (recommendation_type IN (
    'inventory_optimization', 'route_optimization', 'maintenance_prediction',
    'demand_forecast', 'risk_alert', 'cost_reduction', 'asset_utilization',
    'sla_optimization', 'resource_allocation', 'anomaly_detection'
  )),
  CONSTRAINT valid_rec_status CHECK (status IN ('new', 'viewed', 'actioned', 'dismissed', 'expired'))
);

-- System Events (Event Log)
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Event
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  
  -- Entity
  entity_type TEXT,
  entity_id UUID,
  
  -- Data
  event_data JSONB DEFAULT '{}',
  previous_data JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  source TEXT,
  
  -- User
  user_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_event_category CHECK (event_category IN (
    'auth', 'asset', 'order', 'inventory', 'billing', 'route',
    'incident', 'workflow', 'system', 'integration', 'api'
  ))
);

-- Enable RLS
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage workflows in their organizations"
  ON workflow_definitions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view workflow instances"
  ON workflow_instances FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "System can manage workflow instances"
  ON workflow_instances FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage workflow tasks"
  ON workflow_tasks FOR ALL
  TO authenticated
  USING (
    workflow_instance_id IN (
      SELECT id FROM workflow_instances
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can manage business rules in their organizations"
  ON business_rules FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage geofences in their organizations"
  ON geofences FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage AI recommendations in their organizations"
  ON ai_recommendations FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view events in their organizations"
  ON system_events FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Indexes
CREATE INDEX idx_workflow_def_org ON workflow_definitions(organization_id);
CREATE INDEX idx_workflow_inst_org ON workflow_instances(organization_id);
CREATE INDEX idx_workflow_tasks_instance ON workflow_tasks(workflow_instance_id);
CREATE INDEX idx_business_rules_org ON business_rules(organization_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_geofences_org ON geofences(organization_id);
CREATE INDEX idx_ai_recs_org ON ai_recommendations(organization_id);
CREATE INDEX idx_ai_recs_status ON ai_recommendations(status);
CREATE INDEX idx_system_events_org ON system_events(organization_id);
CREATE INDEX idx_system_events_type ON system_events(event_type);
CREATE INDEX idx_system_events_created ON system_events(created_at DESC);

CREATE TRIGGER update_workflow_def_updated_at
  BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_rules_updated_at
  BEFORE UPDATE ON business_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON geofences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_recs_updated_at
  BEFORE UPDATE ON ai_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
