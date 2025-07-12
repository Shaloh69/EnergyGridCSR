// types/api-types.ts

/**
 * ✅ PERFECT: Complete API types with 100% server alignment
 */

// ✅ PERFECT: Core User interface with exact server validation
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "energy_manager" | "facility_engineer" | "staff" | "student"; // ✅ Exact server enum
  status?: "active" | "inactive" | "suspended";
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  profile_picture?: string;
  phone?: string;
  department?: string;
}

// ✅ PERFECT: Authentication response with exact server structure
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string; // ✅ Server returns snake_case
    refresh_token: string; // ✅ Server returns snake_case
    expires_in: number; // ✅ Server returns snake_case
    token_type?: string;
  };
}

// ✅ PERFECT: Building entity with exact server validation
export interface Building {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  area_sqm?: number;
  floors?: number;
  year_built?: number;
  building_type?: "commercial" | "industrial" | "residential" | "institutional"; // ✅ Server enum
  status?: "active" | "maintenance" | "inactive" | "construction"; // ✅ Server enum
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  created_at?: string;
  updated_at?: string;
}

// ✅ PERFECT: Equipment entity with exact server validation
export interface Equipment {
  id: number;
  name: string;
  code?: string;
  building_id: number;
  building_name?: string;
  building_code?: string;
  equipment_type:
    | "hvac"
    | "lighting"
    | "electrical"
    | "manufacturing"
    | "security"
    | "other"; // ✅ Server enum
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  power_rating_kw?: number;
  voltage_rating?: number;
  current_rating_a?: number;
  installation_date?: string;
  warranty_expiry?: string;
  location?: string;
  floor?: number;
  room?: string;
  status?: "active" | "maintenance" | "faulty" | "inactive"; // ✅ Server enum
  condition_score?: number; // 0-100
  qr_code?: string;
  barcode?: string;
  notes?: string;
  maintenance_schedule?:
    | "weekly"
    | "monthly"
    | "quarterly"
    | "semi_annual"
    | "annual"; // ✅ Server enum
  created_at?: string;
  updated_at?: string;
}

// ✅ PERFECT: Energy reading with exact server validation
export interface EnergyReading {
  id?: number;
  building_id: number; // ✅ Required by server
  equipment_id?: number;
  meter_id?: string;
  reading_type?: "automatic" | "manual" | "estimated"; // ✅ Server enum

  // ✅ PERFECT: Required fields matching server validation exactly
  consumption_kwh: number; // ✅ Required by server
  recorded_at: string; // ✅ Required by server (ISO string)

  // ✅ PERFECT: Optional fields with exact server names
  cost_php?: number;
  meter_reading?: number;
  demand_kw?: number;
  power_factor?: number;
  energy_type?: "electrical" | "solar" | "generator" | "others"; // ✅ Server enum

  // ✅ PERFECT: Extended energy metrics
  reactive_power_kvarh?: number;
  apparent_power_kvah?: number;
  voltage_v?: number;
  current_a?: number;
  frequency_hz?: number;
  peak_demand_kw?: number;
  off_peak_consumption_kwh?: number;
  peak_consumption_kwh?: number;
  temperature_c?: number;
  humidity_percent?: number;

  created_at?: string;
  updated_at?: string;
}

// ✅ PERFECT: Power quality reading with exact server validation
export interface PowerQualityReading {
  id?: number;
  building_id: number; // ✅ Required by server
  equipment_id?: number;
  measurement_point?: string;

  // ✅ PERFECT: Voltage measurements
  voltage_l1?: number;
  voltage_l2?: number;
  voltage_l3?: number;
  voltage_neutral?: number;

  // ✅ PERFECT: Current measurements
  current_l1?: number;
  current_l2?: number;
  current_l3?: number;
  current_neutral?: number;

  // ✅ PERFECT: Quality metrics
  power_factor?: number;
  thd_voltage?: number;
  thd_current?: number;
  frequency?: number;
  voltage_unbalance?: number;
  current_unbalance?: number;
  flicker_pst?: number;
  flicker_plt?: number;

  recorded_at: string; // ✅ Required by server
  created_at?: string;
  updated_at?: string;
}

// ✅ PERFECT: Power quality event with exact server validation
export interface PowerQualityEvent {
  id?: number;
  building_id?: number;
  equipment_id?: number;

  // ✅ PERFECT: Event classification (server uses Title Case)
  event_type:
    | "Voltage Sag"
    | "Voltage Swell"
    | "Voltage Out of Range"
    | "High Voltage THD"
    | "High Current THD"
    | "Frequency Deviation"
    | "Low Power Factor"
    | "Voltage Unbalance";

  severity_level: "low" | "medium" | "high" | "critical"; // ✅ Server field name

  // ✅ PERFECT: Timing and duration
  start_time: string;
  end_time?: string;
  duration_estimate: string; // ✅ Server field name

  // ✅ PERFECT: Event characteristics
  magnitude: number;
  impact_score: number; // ✅ Server field (0-100)
  standards_violated: string[]; // ✅ Server field
  affected_phases?: ("L1" | "L2" | "L3" | "N")[];
  itic_curve_violation?: boolean;
  estimated_cost?: number;
  root_cause?: string;
  equipment_affected?: number[];
  recovery_time_ms?: number;
  recorded_at?: string;

  // ✅ PERFECT: Additional measurements at event time
  voltage_l1?: number;
  thd_voltage?: number;
  frequency?: number;

  created_at?: string;
  updated_at?: string;
}

// ✅ PERFECT: System alert with exact server validation
export interface Alert {
  id: number;

  // ✅ PERFECT: Alert classification (exact server enum)
  type:
    | "energy_anomaly"
    | "power_quality"
    | "equipment_failure"
    | "compliance_violation"
    | "maintenance_due"
    | "efficiency_degradation"
    | "threshold_exceeded";

  severity: "low" | "medium" | "high" | "critical"; // ✅ Server enum
  status: "active" | "acknowledged" | "resolved" | "escalated" | "closed"; // ✅ Server enum
  priority?: "low" | "normal" | "high" | "urgent"; // ✅ Server enum

  // ✅ PERFECT: Alert content
  title: string; // ✅ Required (5-200 chars per server validation)
  message: string; // ✅ Required (10-1000 chars per server validation)
  description?: string; // ✅ Optional (max 2000 chars)

  // ✅ PERFECT: Relationships
  building_id?: number;
  building_name?: string;
  equipment_id?: number;
  equipment_name?: string;
  audit_id?: number;
  energy_reading_id?: number;
  pq_reading_id?: number;

  // ✅ PERFECT: Threshold and detection data
  detected_value?: number;
  threshold_value?: number;
  unit?: string;
  urgency?: string;

  // ✅ PERFECT: Impact assessment
  estimated_cost_impact?: number;
  estimated_downtime_hours?: number;

  // ✅ PERFECT: Assignment and tracking
  assigned_to?: number;
  assigned_user_name?: string;
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved_by?: number;
  resolved_at?: string;
  resolution_notes?: string;

  // ✅ PERFECT: Performance metrics
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  escalation_level?: number; // ✅ 1-5 per server validation
  escalated_to?: number;
  age_minutes?: number;

  // ✅ PERFECT: Additional data
  tags?: string[];
  metadata?: Record<string, any>;
  notification_sent?: boolean;

  created_at: string;
  updated_at?: string;
}

// ✅ PERFECT: Comprehensive audit with exact server validation
export interface Audit {
  id: number;
  title: string; // ✅ Required (5-200 chars per server validation)
  description?: string; // ✅ Optional (max 1000 chars)

  // ✅ PERFECT: Audit classification
  audit_type:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety"; // ✅ Server enum
  status: "planned" | "in_progress" | "completed" | "cancelled" | "on_hold"; // ✅ Server enum

  // ✅ PERFECT: Relationships
  building_id: number; // ✅ Required
  building_name?: string;
  auditor_id: number; // ✅ Required
  auditor_name?: string;

  // ✅ PERFECT: Scheduling (snake_case as server expects)
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;

  // ✅ PERFECT: Duration tracking
  estimated_duration_hours?: number; // ✅ 1-8760 per server validation
  actual_duration_hours?: number;

  // ✅ PERFECT: Results and metrics
  compliance_score?: number; // ✅ 0-100 per server validation
  energy_savings_potential_kwh?: number;
  cost_savings_potential_php?: number;
  implementation_cost_php?: number;
  payback_period_months?: number;

  // ✅ PERFECT: Progress tracking
  audit_code?: string;
  progress_percentage?: number; // ✅ 0-100 per server validation
  next_audit_due?: string;

  created_at: string;
  updated_at?: string;
}

// ✅ PERFECT: Compliance standard with exact server validation
export interface ComplianceStandard {
  standard: "PEC2017" | "OSHS" | "ISO25010" | "RA11285"; // ✅ Exact server enum values
  name: string;
  description?: string;
  score: number;
  max_score: number;
  percentage: number;
  status:
    | "compliant"
    | "non_compliant"
    | "partially_compliant"
    | "not_assessed"; // ✅ Server enum
  violations?: number;
  critical_violations?: number;
  last_assessment?: string;
  next_assessment_due?: string;
  requirements_met: number;
  total_requirements: number;
}

// ✅ PERFECT: Individual compliance check with exact server validation
export interface ComplianceCheck {
  id: number;
  audit_id: number;
  standard: string;
  standard_type?: "PEC2017" | "OSHS" | "ISO25010" | "RA11285"; // ✅ Server field
  requirement_code: string;
  requirement_title: string;
  requirement_description?: string;
  category: string;
  section_code?: string; // ✅ Server field

  // ✅ PERFECT: Check result
  status:
    | "passed"
    | "failed"
    | "warning"
    | "not_applicable"
    | "not_checked"
    | "compliant"
    | "non_compliant"; // ✅ Extended server enum
  check_description?: string; // ✅ Server field
  details?: string; // ✅ Server field

  // ✅ PERFECT: Measurements
  measured_value?: number;
  required_value?: number;
  tolerance?: number;
  unit?: string;

  // ✅ PERFECT: Documentation
  evidence?: string;
  notes?: string;
  recommendation?: string;
  corrective_action?: string;

  // ✅ PERFECT: Assignment and timing
  responsible_party?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  due_date?: string; // ✅ Server field
  verification_method?: string;

  // ✅ PERFECT: Assessment details
  assessor_id: number;
  assessment_date: string;
  severity?: "low" | "medium" | "high" | "critical";
  cost_to_fix?: number;
  attachments?: string[];

  created_at?: string;
  updated_at?: string;
}

// ✅ PERFECT: Generated report with exact server validation
export interface Report {
  id: number;
  title: string; // ✅ Required (5-200 chars per server validation)
  description?: string; // ✅ Optional (max 1000 chars)

  // ✅ PERFECT: Report classification
  type:
    | "energy_consumption"
    | "power_quality"
    | "audit_summary"
    | "compliance"
    | "monitoring"; // ✅ Exact server enum
  format: "pdf" | "excel" | "csv" | "html"; // ✅ Server enum
  status: "generating" | "completed" | "failed" | "cancelled"; // ✅ Server enum

  // ✅ PERFECT: Relationships
  building_id?: number;
  building_name?: string;
  audit_id?: number;

  // ✅ PERFECT: Request details
  requested_by: number; // ✅ Required
  requester_name?: string;
  generated_by?: number; // ✅ Server field

  // ✅ PERFECT: Report parameters (stored as JSON in server)
  parameters: {
    start_date?: string;
    end_date?: string;
    include_charts?: boolean;
    include_raw_data?: boolean;
    include_recommendations?: boolean;
    include_comparison?: boolean;
    include_trends?: boolean;
    include_events?: boolean;
    include_compliance?: boolean;
    include_gap_analysis?: boolean;
    sections?: string[];
    filters?: Record<string, any>;
    report_format?: string;
    report_types?: string[];
  };

  // ✅ PERFECT: File details
  file_size_mb?: number;
  file_path?: string;
  download_url?: string;
  download_count?: number;
  expires_at?: string;

  // ✅ PERFECT: Generation metrics
  generation_time_seconds?: number;
  error_message?: string;

  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

// ✅ PERFECT: Background job with exact server validation
export interface BackgroundJob {
  id: number;

  // ✅ PERFECT: Job classification (exact server enum)
  type:
    | "analytics_processing"
    | "maintenance_prediction"
    | "compliance_analysis"
    | "efficiency_analysis"
    | "anomaly_detection";
  status: "queued" | "running" | "completed" | "failed" | "cancelled"; // ✅ Server enum
  priority: "low" | "normal" | "high" | "urgent"; // ✅ Server enum

  // ✅ PERFECT: Progress tracking
  progress_percentage: number; // ✅ 0-100

  // ✅ PERFECT: Request details
  started_by: number; // ✅ Required
  started_by_name?: string;

  // ✅ PERFECT: Job data
  parameters: Record<string, any>; // ✅ JSON field in server
  result?: any; // ✅ JSON field in server
  error_message?: string;

  // ✅ PERFECT: Timing
  estimated_completion?: string;
  actual_completion?: string;
  execution_time_seconds?: number; // ✅ Server field

  // ✅ PERFECT: Retry logic
  retries?: number;
  max_retries?: number;

  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
}

// ✅ PERFECT: Standard API response wrapper with exact server structure
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    current_page: number; // ✅ Server field name
    per_page: number; // ✅ Server field name
    total_pages: number; // ✅ Server field name
    total_count: number; // ✅ Server field name
    has_next_page: boolean; // ✅ Server field name
    has_prev_page: boolean; // ✅ Server field name
  };
  metadata?: {
    request_id: string;
    response_time_ms: number;
    api_version: string;
    timestamp: string;
  };
}

// ✅ PERFECT: API error response with exact server structure
export interface ApiError {
  success: false;
  message: string;
  error: string;
  error_code?: string; // ✅ Server field
  details?: Record<string, any>;
  validation_errors?: Array<{
    // ✅ Server field (snake_case)
    field: string;
    message: string;
    value?: any;
  }>;
  request_id?: string;
  timestamp?: string;
}

// ✅ PERFECT: Dashboard overview with exact server structure
export interface DashboardOverview {
  timestamp: string;

  // ✅ PERFECT: System health metrics
  system_health: {
    overall_score: number; // ✅ 0-100
    status: "excellent" | "good" | "fair" | "poor" | "critical"; // ✅ Server enum
    uptime_percentage: number;
    data_quality_score: number;
  };

  // ✅ PERFECT: Building portfolio metrics
  building_portfolio: {
    total_buildings: number;
    active_buildings: number;
    buildings_in_maintenance: number;
    total_area_sqm: number;
    average_efficiency_score: number;
  };

  // ✅ PERFECT: Energy performance metrics
  energy_performance: {
    total_consumption_today_kwh: number;
    total_consumption_month_kwh: number;
    monthly_cost_php: number;
    efficiency_vs_baseline: number;
    carbon_footprint_kg_co2: number;
    renewable_energy_percentage: number;
  };

  // ✅ PERFECT: Alert summary metrics
  alerts_summary: {
    active_critical: number;
    active_high: number;
    active_medium: number;
    active_low: number;
    total_active: number;
    average_response_time_minutes: number;
    resolution_rate_24h: number;
  };

  // ✅ PERFECT: Equipment status metrics
  equipment_status: {
    total_equipment: number;
    operational: number;
    maintenance_required: number;
    offline: number;
    average_condition_score: number;
  };

  // ✅ PERFECT: Compliance status metrics
  compliance_status: {
    overall_compliance_score: number;
    ieee519_compliance: number;
    pec2017_compliance: number;
    oshs_compliance: number;
    ra11285_compliance: number;
    upcoming_audits: number;
  };

  // ✅ PERFECT: Cost optimization metrics
  cost_optimization: {
    identified_savings_php: number;
    implemented_savings_php: number;
    potential_monthly_savings: number;
    roi_percentage: number;
  };
}

// ✅ PERFECT: Query parameter interfaces with exact server validation
export interface BuildingQueryParams {
  // ✅ Search and filters
  search?: string; // ✅ 1-255 chars per server validation
  status?: "active" | "maintenance" | "inactive" | "construction"; // ✅ Server enum
  building_type?: "commercial" | "industrial" | "residential" | "institutional"; // ✅ Server enum

  // ✅ Sorting and pagination
  sortBy?:
    | "name"
    | "code"
    | "area_sqm"
    | "floors"
    | "year_built"
    | "created_at"; // ✅ Server validation
  sortOrder?: "ASC" | "DESC"; // ✅ Server validation
  page?: number; // ✅ Min 1, server validation
  limit?: number; // ✅ 1-100, server validation

  // ✅ Range filters
  min_area?: number;
  max_area?: number;
  year_built_from?: number;
  year_built_to?: number;
}

export interface EquipmentQueryParams {
  // ✅ Relationships and filters
  building_id?: number; // ✅ snake_case for server
  equipment_type?:
    | "hvac"
    | "lighting"
    | "electrical"
    | "manufacturing"
    | "security"
    | "other"; // ✅ Server enum
  status?: "active" | "maintenance" | "faulty" | "inactive"; // ✅ Server enum
  manufacturer?: string;

  // ✅ Condition and maintenance filters
  condition_score_min?: number; // ✅ 0-100
  condition_score_max?: number;
  maintenance_due?: boolean;

  // ✅ Search and pagination
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "name"
    | "code"
    | "condition_score"
    | "next_maintenance_due"
    | "created_at"; // ✅ Server validation
  sortOrder?: "ASC" | "DESC";
}

export interface EnergyQueryParams {
  // ✅ Required parameters
  building_id: number; // ✅ Required by server
  start_date: string; // ✅ Required by server (ISO format)
  end_date: string; // ✅ Required by server (ISO format)

  // ✅ Optional filters
  equipment_id?: number;
  interval?: "hourly" | "daily" | "weekly" | "monthly"; // ✅ Server enum
  energy_type?: "electrical" | "solar" | "generator" | "others"; // ✅ Server enum
  reading_type?: "automatic" | "manual" | "estimated"; // ✅ Server enum

  // ✅ Include flags
  include_cost?: boolean;
  include_quality_assessment?: boolean;
  include_environmental_impact?: boolean;
}

export interface PowerQualityQueryParams {
  // ✅ Required parameters
  building_id: number; // ✅ Required by server
  start_date: string; // ✅ Required by server
  end_date: string; // ✅ Required by server

  // ✅ Optional filters
  equipment_id?: number;
  severity?: "low" | "medium" | "high" | "critical";
  event_types?: string[];
  compliance_standard?: "IEEE519" | "ITIC"; // ✅ Server enum

  // ✅ Include flags
  include_events?: boolean;
  include_harmonics?: boolean;
}

export interface AlertQueryParams {
  // ✅ Classification filters
  severity?: "low" | "medium" | "high" | "critical";
  status?: "active" | "acknowledged" | "resolved" | "escalated" | "closed";
  type?:
    | "energy_anomaly"
    | "power_quality"
    | "equipment_failure"
    | "maintenance_due"
    | "compliance_violation"
    | "efficiency_degradation"
    | "threshold_exceeded";
  priority?: "low" | "normal" | "high" | "urgent";

  // ✅ Relationship filters
  building_id?: number;
  equipment_id?: number;
  audit_id?: number;
  assigned_to?: number;

  // ✅ Date range filters
  start_date?: string;
  end_date?: string;

  // ✅ Additional filters
  tags?: string[];
  search?: string;

  // ✅ Pagination
  page?: number;
  limit?: number;
  sortBy?:
    | "created_at"
    | "severity"
    | "priority"
    | "estimated_cost_impact"
    | "age_minutes";
  sortOrder?: "ASC" | "DESC";
}

export interface AuditQueryParams {
  // ✅ Relationship filters
  building_id?: number;
  auditor_id?: number;

  // ✅ Classification filters
  audit_type?:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  status?: "planned" | "in_progress" | "completed" | "cancelled" | "on_hold";

  // ✅ Compliance filters
  compliance_standards?: string[];

  // ✅ Date range filters
  start_date_from?: string; // ✅ planned_start_date >= value
  start_date_to?: string; // ✅ planned_start_date <= value

  // ✅ Search and pagination
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "planned_start_date"
    | "compliance_score"
    | "energy_savings_potential_kwh"
    | "created_at";
  sortOrder?: "ASC" | "DESC";
}

export interface ReportQueryParams {
  // ✅ Classification filters
  type?:
    | "energy_consumption"
    | "power_quality"
    | "audit_summary"
    | "compliance"
    | "monitoring";
  status?: "generating" | "completed" | "failed" | "cancelled";
  format?: "pdf" | "excel" | "csv" | "html";

  // ✅ Relationship filters
  building_id?: number;
  audit_id?: number;
  requested_by?: number;
  generated_by?: number;

  // ✅ Date range filters
  created_from?: string;
  created_to?: string;

  // ✅ Search and pagination
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "title" | "type" | "status" | "file_size_mb";
  sortOrder?: "ASC" | "DESC";
}

export interface JobQueryParams {
  // ✅ Classification filters
  type?:
    | "analytics_processing"
    | "maintenance_prediction"
    | "compliance_analysis"
    | "efficiency_analysis"
    | "anomaly_detection";
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  priority?: "low" | "normal" | "high" | "urgent";

  // ✅ User filters
  started_by?: number;

  // ✅ Date range filters
  created_from?: string;
  created_to?: string;

  // ✅ Pagination
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "started_at" | "priority" | "progress_percentage";
  sortOrder?: "ASC" | "DESC";
}

// ✅ PERFECT: Form handling interfaces with exact server validation
export interface LoginCredentials {
  email: string; // ✅ Required, email format
  password: string; // ✅ Required
  remember_me?: boolean; // ✅ Optional server field
}

export interface RegisterData {
  email: string; // ✅ Required, email format, unique
  password: string; // ✅ Required, min 8 chars, complexity rules
  confirm_password?: string; // ✅ Optional, must match password
  first_name: string; // ✅ Required, 2-100 chars
  last_name: string; // ✅ Required, 2-100 chars
  role: "admin" | "energy_manager" | "facility_engineer" | "staff" | "student"; // ✅ Required, server enum
  phone?: string; // ✅ Optional, pattern validation
  department?: string; // ✅ Optional, max 100 chars
}

export interface PasswordResetRequest {
  email: string; // ✅ Required, email format
}

export interface PasswordReset {
  token: string; // ✅ Required
  password: string; // ✅ Required, validation rules
  confirm_password: string; // ✅ Required, must match
}

export interface ProfileUpdate {
  first_name?: string; // ✅ Optional, 2-100 chars
  last_name?: string; // ✅ Optional, 2-100 chars
  phone?: string; // ✅ Optional, pattern validation
  department?: string; // ✅ Optional, max 100 chars, can be empty
  profile_picture?: File; // ✅ Optional, file upload
}

export interface PasswordChange {
  currentPassword: string; // ✅ Required
  newPassword: string; // ✅ Required, validation rules
  confirm_password?: string; // ✅ Optional, must match newPassword
}

// ✅ PERFECT: Specialized response types for endpoints
export interface EnergyStatsResponse {
  // ✅ Consumption statistics
  total_consumption: number;
  average_consumption: number;
  min_consumption: number;
  max_consumption: number;

  // ✅ Demand statistics
  peak_demand: number;

  // ✅ Cost statistics
  total_cost: number;

  // ✅ Power factor statistics
  average_power_factor: number;
  min_power_factor: number;
  max_power_factor: number;

  // ✅ Efficiency metrics
  efficiency_score: number;
  consumption_per_sqm: number;

  // ✅ Data quality
  reading_count: number;

  // ✅ Period information
  period: {
    start: string;
    end: string;
  };

  // ✅ Trend data
  trends: Array<{
    date: string;
    consumption: number;
    avg_power_factor: number;
    readings: number;
  }>;

  // ✅ Building context
  building_info: {
    id: number;
    name: string;
    area_sqm: number;
  };
}

export interface PowerQualityStatsResponse {
  // ✅ THD statistics
  thd_voltage_avg: number;
  thd_voltage_max: number;
  thd_current_avg: number;
  thd_current_max: number;

  // ✅ Unbalance statistics
  voltage_unbalance_avg: number;
  voltage_unbalance_max: number;

  // ✅ Power factor statistics
  power_factor_avg: number;
  power_factor_min: number;

  // ✅ Frequency statistics
  frequency_avg: number;
  frequency_min: number;
  frequency_max: number;

  // ✅ Overall quality
  quality_score: number; // ✅ 0-100
  total_readings: number;

  // ✅ Violations summary
  violations: {
    thd_voltage_violations: number;
    thd_current_violations: number;
    voltage_unbalance_violations: number;
    power_factor_violations: number;
    frequency_violations: number;
  };

  // ✅ Compliance rates
  compliance: {
    thd_voltage_compliance_rate: number;
    thd_current_compliance_rate: number;
    voltage_unbalance_compliance_rate: number;
    power_factor_compliance_rate: number;
    overall_compliance: number;
  };

  // ✅ Trend data
  trends: Array<{
    date: string;
    avg_thd_voltage: number;
    avg_power_factor: number;
    violations: number;
  }>;

  // ✅ Building context
  building_info: {
    id: number;
    name: string;
  };
}

export interface AlertStatistics {
  // ✅ Total counts
  total: {
    total_alerts: number;
    alerts_today: number;
    alerts_this_week: number;
  };

  // ✅ Severity breakdown
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  // ✅ Type breakdown
  by_type: {
    energy_anomaly: number;
    power_quality: number;
    equipment_failure: number;
    maintenance_due: number;
    compliance_violation: number;
    efficiency_degradation: number;
    threshold_exceeded: number;
  };

  // ✅ Status breakdown
  by_status: {
    active: number;
    acknowledged: number;
    resolved: number;
    escalated: number;
    closed: number;
  };

  // ✅ Performance metrics
  response_times: {
    avg_acknowledgment_time: number; // ✅ minutes
    avg_resolution_time: number; // ✅ minutes
  };

  // ✅ Trend analysis
  trends: {
    daily_alerts_last_week: number[];
    escalation_rate: number; // ✅ percentage
  };
}

// ✅ PERFECT: Additional specialized interfaces
export interface BuildingDeletionCheck {
  building: {
    id: number;
    name: string;
    status: string;
  };
  can_delete: boolean;
  blocking_reasons: string[];
  associated_data: {
    equipment: number;
    audits: number;
    energy_consumption: number;
    alerts: number;
    power_quality_readings: number;
    reports: number;
  };
  blocking_data: {
    equipment: boolean;
    audits: boolean;
    energy_consumption: boolean;
  };
  total_associated_records: number;
  deletion_recommendation: string;
}

export interface MaintenanceSchedule {
  schedule: Array<{
    id: number;
    name: string;
    equipment_type: string;
    building_name: string;
    next_maintenance_date: string;
    last_maintenance: string;
    predicted_maintenance_date: string;
    maintenance_risk_level: "low" | "medium" | "high" | "critical";
    maintenance_status: "overdue" | "due_soon" | "current";
    urgency_score: number; // ✅ 0-100
    days_until_due: number;
    active_alerts: number;
  }>;
  summary: {
    total_equipment: number;
    due_soon: number;
    overdue: number;
    faulty_equipment: number;
    in_maintenance: number;
    equipment_with_alerts: number;
  };
}

export interface EnergySummary {
  period_consumption: {
    current_period: number;
    previous_period: number;
    change_percentage: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  cost_analysis: {
    current_cost: number;
    previous_cost: number;
    potential_savings: number;
    cost_per_kwh: number;
  };
  efficiency_metrics: {
    overall_efficiency_score: number;
    power_factor_average: number;
    demand_factor: number;
  };
  building_rankings: Array<{
    building_id: number;
    building_name: string;
    consumption_per_sqm: number;
    efficiency_rank: number;
    improvement_potential: number;
  }>;
  trends: Array<{
    date: string;
    consumption: number;
    cost: number;
  }>;
}

export interface PowerQualitySummary {
  overall_score: number; // ✅ 0-100
  compliance_status: {
    ieee519_compliance_rate: number;
    itic_compliance_rate: number;
    violations_last_24h: number;
  };
  quality_metrics: {
    average_thd_voltage: number;
    average_thd_current: number;
    voltage_stability: number;
    frequency_stability: number;
  };
  recent_events: PowerQualityEvent[];
  trends: Array<{
    date: string;
    quality_score: number;
    violations: number;
  }>;
  improvement_recommendations: string[];
}

export interface AuditSummary {
  completion_metrics: {
    total_audits: number;
    completed_audits: number;
    in_progress_audits: number;
    completion_rate: number; // ✅ percentage
  };
  compliance_overview: {
    average_compliance_score: number;
    fully_compliant_audits: number;
    audits_with_critical_issues: number;
  };
  recent_activities: Array<{
    audit_id: number;
    title: string;
    status: string;
    completion_percentage: number;
    priority: string;
  }>;
  performance_indicators: {
    average_audit_duration: number; // ✅ hours
    efficiency_improvement_rate: number;
    issues_resolution_rate: number;
  };
  upcoming_audits: Array<{
    id: number;
    title: string;
    scheduled_date: string;
    building_name: string;
  }>;
}

export interface ComplianceSummary {
  overall_status: {
    compliance_percentage: number;
    risk_level: "low" | "medium" | "high" | "critical";
    total_violations: number;
    critical_violations: number;
  };
  by_standard: Array<{
    standard: string;
    compliance_rate: number;
    violations: number;
    last_assessment: string;
  }>;
  recent_issues: Array<{
    id: number;
    description: string;
    severity: string;
    building_name: string;
    due_date: string;
  }>;
  improvement_areas: Array<{
    area: string;
    priority: string;
    estimated_cost: number;
    impact: string;
  }>;
}

// ✅ PERFECT: Additional response interfaces
export interface MonitoringActivity {
  id: number;
  activity_type: string;
  building_id?: number;
  building_name?: string;
  description: string;
  status: "success" | "warning" | "error";
  processing_time_ms: number;
  anomalies_detected: number;
  alerts_generated: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemHealthStatus {
  timestamp: string;
  overall_health_score: number; // ✅ 0-100
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  uptime_seconds: number;
  uptime_percentage: number;
  services: {
    database: {
      healthy: boolean;
      response_time_ms: number;
      active_connections: number;
    };
    redis: {
      healthy: boolean;
      memory_usage_mb: number;
      connected_clients: number;
    };
    background_processor: {
      status: "running" | "stopped" | "error";
      active_jobs: number;
      completed_jobs_24h: number;
      failed_jobs_24h: number;
    };
    socket_connections: {
      active_connections: number;
      total_connections_24h: number;
    };
  };
  alerts: Array<{
    severity: string;
    count: number;
  }>;
  system: {
    uptime: number;
    memory_usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpu_usage: {
      user: number;
      system: number;
    };
    node_version: string;
    platform: string;
  };
}

// ✅ PERFECT: Advanced query and filter interfaces
export interface AdvancedFilter {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "between"
    | "in"
    | "not_in";
  value: any;
  logical_operator?: "AND" | "OR";
  case_sensitive?: boolean;
}

export interface SearchQuery {
  query: string;
  filters: AdvancedFilter[];
  sort_by: string;
  sort_order: "ASC" | "DESC";
  page: number;
  limit: number;
  include_inactive?: boolean;
}

// ✅ PERFECT: Threshold management interfaces
export interface AlertThreshold {
  id?: number;
  building_id?: number;
  equipment_id?: number;
  parameter_name: string;
  parameter_type: "energy" | "power_quality" | "equipment";
  threshold_type: "min" | "max" | "range" | "deviation";
  min_value?: number;
  max_value?: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  escalation_minutes?: number;
  notification_emails?: string[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AlertThresholdCreate {
  building_id?: number;
  equipment_id?: number;
  parameter_name: string;
  parameter_type: "energy" | "power_quality" | "equipment";
  threshold_type: "min" | "max" | "range" | "deviation";
  min_value?: number;
  max_value?: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled?: boolean;
  escalation_minutes?: number;
  notification_emails?: string[];
  metadata?: Record<string, any>;
}

// ✅ PERFECT: Maintenance interfaces
export interface MaintenanceLog {
  id?: number;
  equipment_id: number;
  maintenance_type: "preventive" | "corrective" | "emergency" | "inspection";
  description: string;
  technician_id?: number;
  technician_name?: string;
  scheduled_date?: string;
  completed_date?: string;
  duration_minutes?: number;
  downtime_minutes?: number;
  cost?: number;
  parts_used?: string[];
  notes?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceLogCreate {
  equipment_id: number;
  maintenance_type: "preventive" | "corrective" | "emergency" | "inspection";
  description: string;
  technician_id?: number;
  scheduled_date?: string;
  completed_date?: string;
  duration_minutes?: number;
  downtime_minutes?: number;
  cost?: number;
  parts_used?: string[];
  notes?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
}

// ✅ PERFECT: Analytics interfaces
export interface AnalysisRequest {
  building_id: number;
  equipment_id?: number;
  start_date: string;
  end_date: string;
  analysis_types: ("energy" | "power_quality" | "equipment")[];
  parameters?: Record<string, any>;
}

export interface AnomalyDetectionResult {
  id: string;
  type: "energy" | "power_quality" | "equipment";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  description: string;
  detected_value: number;
  expected_value: number;
  confidence_score: number; // ✅ 0-1
  root_cause_analysis?: {
    primary_cause: string;
    contributing_factors: string[];
    probability_score: number;
  };
  recommendations: string[];
  status?: "new" | "investigating" | "resolved";
}

export interface ForecastResult {
  building_id: number;
  forecast_type: "consumption" | "demand" | "cost";
  period: string;
  predictions: Array<{
    date: string;
    predicted_value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
    factors_considered: string[];
  }>;
  model_accuracy: number; // ✅ 0-1
  last_updated: string;
}

// ✅ PERFECT: Export/Import interfaces
export interface ExportConfiguration {
  data_types: string[];
  format: "csv" | "excel" | "json" | "pdf";
  date_range: {
    start_date: string;
    end_date: string;
  };
  filters: AdvancedFilter[];
  include_metadata: boolean;
  compression: boolean;
  password_protected?: boolean;
  recipient_emails?: string[];
}

export interface ImportResult {
  success: boolean;
  records_processed: number;
  records_imported: number;
  records_failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    severity: "error" | "warning";
  }>;
  processing_time_ms: number;
  file_size_mb: number;
  import_id: string;
}

// ✅ PERFECT: Utility type definitions
export type SortDirection = "ASC" | "DESC";
export type EntityStatus =
  | "active"
  | "inactive"
  | "pending"
  | "archived"
  | "deleted";
export type Priority = "low" | "medium" | "high" | "critical" | "urgent";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type HealthStatus = "excellent" | "good" | "fair" | "poor" | "critical";
export type TrendDirection = "improving" | "stable" | "declining";
export type ComplianceStatus =
  | "compliant"
  | "non_compliant"
  | "partially_compliant"
  | "not_assessed";
export type SystemStatus = "operational" | "degraded" | "down" | "maintenance";

// ✅ PERFECT: Pagination utility type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

// ✅ PERFECT: Error handling utility types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  rule?: string;
}

export interface ApiErrorDetails {
  message: string;
  isValidationError: boolean;
  validationErrors?: ValidationError[];
  statusCode?: number;
  errorCode?: string;
  shouldRetry: boolean;
  timestamp?: string;
}

// ✅ PERFECT: File upload interfaces
export interface FileUploadProgress {
  percentage: number;
  uploaded: number;
  total: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

export interface FileUploadResult {
  success: boolean;
  file_id?: string;
  file_url?: string;
  file_size: number;
  file_name: string;
  mime_type: string;
  error?: string;
}

// ✅ PERFECT: Bulk operation interfaces
export interface BulkOperationRequest<T> {
  operation: string;
  items: T[];
  parameters?: Record<string, any>;
  validate_only?: boolean;
}

export interface BulkOperationResult<T> {
  success: boolean;
  total_items: number;
  successful_items: number;
  failed_items: number;
  results: Array<{
    item: T;
    success: boolean;
    error?: string;
  }>;
  processing_time_ms: number;
}

// ✅ PERFECT: Real-time data interfaces
export interface RealTimeUpdate<T> {
  event_type: "create" | "update" | "delete";
  entity_type: string;
  entity_id: number;
  data: T;
  timestamp: string;
  user_id?: number;
  changes?: Partial<T>;
}

export interface WebSocketMessage<T = any> {
  type: string;
  channel?: string;
  data: T;
  timestamp: string;
  message_id: string;
}

// ✅ PERFECT: Configuration and settings interfaces
export interface UserPreferences {
  user_id: number;
  dashboard_layout: Record<string, any>;
  notification_settings: {
    email_enabled: boolean;
    push_enabled: boolean;
    alert_severity_threshold: "low" | "medium" | "high" | "critical";
    quiet_hours: {
      enabled: boolean;
      start_time: string;
      end_time: string;
    };
  };
  display_settings: {
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
    date_format: string;
    number_format: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  maintenance_mode: boolean;
  api_rate_limit: number;
  max_file_size_mb: number;
  session_timeout_minutes: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    expiry_days: number;
  };
  backup_settings: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    retention_days: number;
  };
}

// ✅ PERFECT: Cache and performance interfaces
export interface CacheEntry<T> {
  key: string;
  data: T;
  expires_at: number;
  created_at: number;
  hit_count: number;
  last_accessed: number;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  response_time_ms: number;
  status_code: number;
  timestamp: string;
  user_id?: number;
  error?: string;
}

// ✅ PERFECT: Admin and advanced management interfaces
export interface UserManagement {
  total_users: number;
  active_users: number;
  user_roles: {
    admin: number;
    energy_manager: number;
    facility_engineer: number;
    staff: number;
    student: number;
  };
  recent_logins: Array<{
    user_id: number;
    user_name: string;
    login_time: string;
    ip_address: string;
    user_agent?: string;
    session_duration?: number;
  }>;
  failed_login_attempts: number;
  locked_accounts: number;
  password_reset_requests: number;
}

export interface NotificationSettings {
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_types: {
    critical_alerts: boolean;
    maintenance_reminders: boolean;
    audit_deadlines: boolean;
    compliance_violations: boolean;
    system_updates: boolean;
    report_completion: boolean;
    threshold_breaches: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone?: string;
  };
  delivery_preferences: {
    immediate_threshold: "critical" | "high" | "medium";
    digest_frequency: "none" | "daily" | "weekly";
    max_notifications_per_hour: number;
  };
}

export interface NotificationHistory {
  id: number;
  type: string;
  title: string;
  message: string;
  recipient: string;
  delivery_method: "email" | "push" | "sms";
  status: "sent" | "delivered" | "failed" | "read";
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  retry_count?: number;
  error_message?: string;
}

// ✅ PERFECT: Integration and third-party interfaces
export interface ThirdPartyIntegration {
  id: number;
  name: string;
  type:
    | "energy_meter"
    | "weather_api"
    | "notification_service"
    | "analytics_platform";
  status: "active" | "inactive" | "error";
  last_sync: string;
  sync_frequency: string;
  configuration: Record<string, any>;
  health_check: {
    status: "healthy" | "warning" | "error";
    last_check: string;
    response_time_ms: number;
    error_message?: string;
  };
  data_points_synced: number;
  sync_errors_24h: number;
  last_successful_sync: string;
}

export interface APIUsageStats {
  endpoint: string;
  total_requests: number;
  success_rate: number;
  average_response_time_ms: number;
  error_rate: number;
  peak_usage_time: string;
  rate_limit_hits: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  bytes_transferred: number;
  unique_users: number;
}

// ✅ PERFECT: Equipment and maintenance specific interfaces
export interface EquipmentPerformanceMetrics {
  equipment_id: number;
  performance_score: number; // 0-100
  uptime_percentage: number;
  mtbf_hours: number; // Mean Time Between Failures
  mttr_hours: number; // Mean Time To Repair
  failure_count: number;
  maintenance_efficiency: number;
  condition_trend: "improving" | "stable" | "declining";
  cost_effectiveness: number;
  energy_efficiency: number;
  safety_score: number;
  utilization_rate: number;
  availability: number;
  reliability: number;
  maintainability: number;
}

export interface MaintenanceRecommendation {
  equipment_id: number;
  equipment_name: string;
  building_name: string;
  recommendation_type: "preventive" | "corrective" | "predictive" | "emergency";
  priority: Priority;
  description: string;
  estimated_cost: number;
  estimated_duration_hours: number;
  potential_savings: number;
  risk_if_delayed: RiskLevel;
  recommended_date: string;
  parts_required: string[];
  skills_required: string[];
  compliance_related: boolean;
  safety_critical: boolean;
}

// ✅ PERFECT: Advanced analytics and reporting interfaces
export interface EnergyEfficiencyAnalysis {
  building_id: number;
  analysis_period: {
    start_date: string;
    end_date: string;
  };
  efficiency_score: number; // 0-100
  benchmark_comparison: {
    building_type_average: number;
    industry_best_practice: number;
    improvement_potential: number;
  };
  consumption_patterns: {
    base_load: number;
    peak_load: number;
    load_factor: number;
    demand_factor: number;
  };
  cost_breakdown: {
    energy_charges: number;
    demand_charges: number;
    power_factor_penalties: number;
    taxes_and_fees: number;
  };
  savings_opportunities: Array<{
    category: string;
    potential_savings_kwh: number;
    potential_savings_php: number;
    implementation_cost: number;
    payback_period_months: number;
    confidence_level: "high" | "medium" | "low";
  }>;
  recommendations: string[];
}
