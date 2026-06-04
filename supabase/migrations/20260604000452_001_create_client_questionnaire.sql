/*
  # Create Client Questionnaire Table

  1. New Tables
    - `client_questionnaires`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `user_id` (uuid)
      - `company_name` (text)
      - `industry` (text)
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `contact_person` (text)
      - `website` (text, nullable)
      - `description` (text)
      - `products` (text array)
      - `target_market` (text)
      - `business_stage` (text)
      - `monthly_revenue` (bigint, nullable)
      - `employee_count` (integer, nullable)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `client_questionnaires` table
    - Add policy for organization members to read questionnaires
    - Add policy for authenticated users to insert questionnaires
*/

CREATE TABLE IF NOT EXISTS client_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid,
  company_name text NOT NULL,
  industry text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  contact_person text NOT NULL,
  website text,
  description text,
  products text[] DEFAULT '{}',
  target_market text,
  business_stage text DEFAULT 'growing',
  monthly_revenue bigint,
  employee_count integer,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE client_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can read questionnaires"
  ON client_questionnaires
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = client_questionnaires.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

CREATE POLICY "Users can insert their own questionnaire"
  ON client_questionnaires
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = client_questionnaires.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

CREATE POLICY "Users can update their own questionnaire"
  ON client_questionnaires
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_client_questionnaires_organization_id 
  ON client_questionnaires(organization_id);

CREATE INDEX idx_client_questionnaires_user_id 
  ON client_questionnaires(user_id);
