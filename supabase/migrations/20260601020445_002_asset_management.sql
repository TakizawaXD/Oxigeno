/*
  # Asset Management Schema with Digital Twin

  This migration creates the comprehensive asset management system supporting
  multiple asset types (oxygen cylinders, concentrators, ventilators, etc.)
  with full lifecycle tracking and digital twin capabilities.

  ## Tables

  ### 1. asset_categories
  Configurable asset types without schema changes.
  - Supports any asset type defined by organization
  - Custom fields via JSONB
  - Lifecycle stages definition

  ### 2. assets
  Main asset registry with full tracking.
  - Unique identifiers (QR, barcode, serial)
  - Category classification
  - Ownership and custody
  - Complete lifecycle tracking
  - Digital twin fields (health, risk, reliability)

  ### 3. asset_events
  Event sourcing for all asset changes.
  - Complete audit trail
  - Event-driven architecture
  - State machine tracking

  ### 4. asset_documents
  Document storage for certificates, photos, manuals.

  ### 5. maintenance_records
  Complete maintenance history.

  ### 6. asset_certifications
  Compliance and certification tracking.

  ### Asset States
  - available: Ready for use
  - reserved: Reserved for order
  - in_transit: Being transported
  - delivered: At customer location
  - in_use: Currently in use
  - maintenance: Under repair/inspection
  - damaged: Needs repair
  - lost: Cannot be located
  - retired: End of lifecycle
*/

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

-- Updated at triggers
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
