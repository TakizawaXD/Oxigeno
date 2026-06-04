/*
  # Create Roles, Invoices, and Payment Tables

  1. New Tables
    - `roles` - Define user roles (owner, employee)
    - `invoices` - Facturas de pago
    - `invoice_items` - Items en facturas
    - `payments` - Comprobantes de pago
    - `employee_permissions` - Permisos por empleado

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  permissions text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  customer_address text,
  total_amount decimal(10,2) NOT NULL,
  tax_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  payment_method text NOT NULL, -- 'virtual' o 'cash'
  payment_status text DEFAULT 'pending', -- pending, completed, cancelled
  currency text DEFAULT 'USD',
  notes text,
  issued_date timestamp with time zone DEFAULT now(),
  due_date timestamp with time zone,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  tax_rate decimal(5,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL, -- 'virtual', 'cash', 'check'
  payment_date timestamp with time zone DEFAULT now(),
  reference_number text,
  notes text,
  receipt_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_take_photos boolean DEFAULT true,
  can_upload_receipts boolean DEFAULT true,
  can_view_invoices boolean DEFAULT false,
  can_create_invoices boolean DEFAULT false,
  can_edit_invoices boolean DEFAULT false,
  can_delete_invoices boolean DEFAULT false,
  can_create_payments boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Organization members can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = roles.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for invoices
CREATE POLICY "Owner can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invoices.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

CREATE POLICY "Organization members can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invoices.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invoices.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invoices.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Organization members can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = payments.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for employee_permissions
CREATE POLICY "Organization members can view permissions"
  ON employee_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = employee_permissions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_employee_permissions_org_id ON employee_permissions(organization_id);
CREATE INDEX idx_employee_permissions_user_id ON employee_permissions(user_id);
