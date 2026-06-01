/*
  # Fleet, Routes, and Operations Schema

  Complete fleet management and route optimization.

  ## Tables

  ### 1. vehicles
  Fleet vehicles with full tracking.

  ### 2. vehicle_maintenance
  Vehicle maintenance records.

  ### 3. drivers
  Driver profiles and performance.

  ### 4. routes
  Delivery routes with optimization.

  ### 5. route_stops
  Individual stops in routes.

  ### 6. trips
  Actual trip execution records.

  ### 7. incidents
  Incident and issue tracking.
*/

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

-- Updated at triggers
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
