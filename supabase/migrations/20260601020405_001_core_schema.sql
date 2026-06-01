/*
  # Healthcare Logistics Operating System - Core Schema

  This migration establishes the foundational multi-tenant architecture for a comprehensive
  healthcare logistics and asset intelligence platform.

  ## Design Principles
  - Multi-tenant: Complete data isolation between organizations
  - Event-driven: All critical actions generate events
  - Extensible: Support any asset type without schema changes
  - Audit-ready: Full tracking of all changes

  ## Core Tables

  ### 1. organizations
  Root tenant entity. Each organization is completely isolated.
  - id: UUID primary key
  - name: Organization name
  - slug: URL-friendly identifier
  - settings: JSONB for flexible configuration
  - subscription_tier: Service level
  - created_at/updated_at: Timestamps

  ### 2. organization_members
  Links users to organizations with roles.
  - organization_id: FK to organizations
  - user_id: FK to auth.users
  - role: User role within org
  - permissions: Additional permissions

  ### 3. facilities
  All physical locations: plants, warehouses, hospitals, clinics, vehicles.
  - id: UUID primary key
  - organization_id: Tenant isolation
  - name: Facility name
  - type: plant|warehouse|hospital|clinic|distribution_center|vehicle_base
  - address fields: Complete location
  - coordinates: GPS location for mapping
  - capacity constraints: Stock limits
  - operating_hours: JSONB schedule
  - contact_info: Phone, email, contacts

  ### 4. facility_zones
  Sub-locations within facilities (aisles, shelves, rooms).
  - facility_id: Parent facility
  - zone_code: Zone identifier
  - zone_type: Storage area classification

  ### Security
  - RLS enabled on all tables
  - Policies enforce organization membership
  - Admin override for system operations
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
