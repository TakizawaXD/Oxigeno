/*
  # Workflows, Rules, and System Events Schema

  Workflow engine, business rules, notifications, and system events.

  ## Tables

  ### 1. workflow_definitions
  Reusable workflow templates.

  ### 2. workflow_instances
  Running workflow instances.

  ### 3. workflow_tasks
  Tasks within workflows.

  ### 4. business_rules
  Configurable business automation rules.

  ### 5. notifications
  User notifications.

  ### 6. system_events
  Event log for all system events.

  ### 7. geofences
  Geographic boundaries for automation.

  ### 8. ai_recommendations
  AI-generated insights and recommendations.
*/

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

-- RLS Policies (similar pattern for all)
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

-- Updated at triggers
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
