/*
  # Contracts, Billing, and Financial Schema

  Contract management, billing, and financial tracking.

  ## Tables

  ### 1. contracts
  Customer contracts with terms and pricing.

  ### 2. contract_line_items
  Service/pricing line items in contracts.

  ### 3. invoices
  Customer invoices.

  ### 4. invoice_items
  Line items in invoices.

  ### 5. supplier_contracts
  Supplier/vendor contracts.
*/

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

-- Updated at triggers
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_contracts_updated_at
  BEFORE UPDATE ON supplier_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
