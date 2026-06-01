/*
  # Orders and Inventory Management Schema

  Comprehensive order lifecycle management and inventory tracking.

  ## Tables

  ### 1. customers
  Customer organizations.
  
  ### 2. customer_contacts
  Multiple contacts per customer.

  ### 3. customer_locations
  Delivery locations for customers.

  ### 4. orders
  Full order lifecycle with states.

  ### 5. order_items
  Line items in orders with asset reservations.

  ### 6. inventory
  Real-time inventory tracking by facility/category.

  ### 7. inventory_transactions
  Complete inventory movement history.

  ### Order States
  - draft: Initial creation
  - pending: Awaiting approval
  - approved: Approved for fulfillment
  - scheduled: Delivery scheduled
  - assigned: Driver/vehicle assigned
  - in_transit: Out for delivery
  - delivered: Successfully delivered
  - partially_delivered: Partial fulfillment
  - cancelled: Order cancelled
*/

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
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'operator') AND is_active = true
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

-- Updated at triggers
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
