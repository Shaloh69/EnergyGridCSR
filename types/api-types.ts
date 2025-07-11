// lib/api-types.ts

/**
 * Core User interface representing system users
 */
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "energy_manager" | "auditor" | "technician" | "viewer";
  status?: "active" | "inactive" | "suspended";
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  profile_picture?: string;
  phone?: string;
  department?: string;
}

/**
 * Authentication response structure
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type?: string;
  };
}

/**
 * Building entity with comprehensive performance metrics
 */
export interface Building {
  id: number;
  name: string;
  code: string;
  description?: string;
  address: string;
  area_sqm: number;
  floors: number;
  year_built?: number;
  building_type: "commercial" | "industrial" | "residential" | "institutional";
  status: "active" | "maintenance" | "inactive" | "construction";
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  performance_summary?: {
    efficiency_score: number;
    energy_intensity_kwh_sqm: number;
    monthly_consumption_kwh: number;
    monthly_cost_php: number;
    carbon_footprint_kg_co2: number;
  };
  equipment_summary?: {
    total_equipment: number;
    operational: number;
    maintenance_required: number;
    offline: number;
  };
  compliance_status?: {
    overall_score: number;
    ieee519_compliant: boolean;
    pec2017_compliant: boolean;
    oshs_compliant: boolean;
    ra11285_compliant: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Equipment entity with operational metrics and maintenance info
 */
export interface Equipment {
  id: number;
  name: string;
  code?: string;
  building_id: number;
  building_name?: string;
  building_code?: string;
  building_type?: string;
  equipment_type:
    | "hvac"
    | "lighting"
    | "motor"
    | "transformer"
    | "panel"
    | "ups"
    | "generator"
    | "others";
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  power_rating_kw?: number;
  voltage_rating?: number;
  voltage_rating_v?: number;
  current_rating_a?: number;
  installation_date?: string;
  warranty_expiry?: string;
  location?: string;
  floor?: number;
  room?: string;
  status: "active" | "maintenance" | "faulty" | "inactive";
  condition_score?: number;
  qr_code?: string;
  barcode?: string;
  notes?: string;

  // Added missing API response properties
  age_years?: number;
  maintenance_interval_days?: number;
  next_maintenance_date?: string;
  last_maintenance_date?: string;
  predicted_maintenance_date?: string;
  maintenance_risk_level?: string;
  active_alerts?: number;
  health_status?: "excellent" | "good" | "fair" | "poor" | "critical";
  maintenance_urgency?: number;
  maintenance_schedule?: string;

  performance_metrics?: {
    efficiency_percentage?: number;
    availability_percentage?: number;
    energy_consumption_kwh_day?: number;
    operating_hours_today?: number;
    mtbf_hours?: number;
    mttr_hours?: number;
  };

  maintenance_info?: {
    last_maintenance?: string;
    next_maintenance_due?: string;
    maintenance_type?: "preventive" | "corrective" | "predictive";
    maintenance_frequency_days?: number;
  };

  current_status?: {
    operational_status?: "running" | "idle" | "stopped" | "error";
    condition_score?: number;
    current_load_percentage?: number;
    temperature_c?: number;
    vibration_level?: number;
    pressure_bar?: number;
  };

  specifications?: {
    weight_kg?: number;
    dimensions?: string;
    operating_temperature_range?: string;
    humidity_range?: string;
  };

  created_at?: string;
  updated_at?: string;
}

/**
 * Equipment maintenance schedule item
 */
export interface MaintenanceScheduleItem {
  id: number;
  name: string;
  equipment_type: string;
  building_name: string;
  next_maintenance_date: string;
  last_maintenance: string;
  predicted_maintenance_date: string;
  maintenance_risk_level: string;
  maintenance_status: "overdue" | "due_soon" | "current";
  urgency_score: number; // 0-100
  days_until_due: number;
  active_alerts: number;
}

/**
 * Maintenance schedule summary
 */
export interface MaintenanceSchedule {
  schedule: MaintenanceScheduleItem[];
  summary: {
    total_equipment: number;
    due_soon: number;
    overdue: number;
    faulty_equipment: number;
    in_maintenance: number;
    equipment_with_alerts: number;
  };
}

/**
 * Energy consumption reading with cost and quality analysis
 */
export interface EnergyReading {
  id?: number;
  building_id: number;
  equipment_id?: number;
  meter_id?: string;
  reading_type: "automatic" | "manual" | "estimated";
  active_power_kwh: number;
  reactive_power_kvarh?: number;
  apparent_power_kvah?: number;
  power_factor: number;
  voltage_v?: number;
  current_a?: number;
  frequency_hz?: number;
  peak_demand_kw?: number;
  off_peak_consumption_kwh?: number;
  peak_consumption_kwh?: number;
  temperature_c?: number;
  humidity_percent?: number;
  recorded_at: string;
  cost_analysis?: {
    total_cost_php: number;
    cost_breakdown: {
      energy_charge: number;
      demand_charge: number;
      power_factor_penalty?: number;
      power_factor_bonus?: number;
      taxes_and_fees?: number;
      transmission_charge?: number;
      distribution_charge?: number;
      system_loss_charge?: number;
    };
    tariff_rate?: {
      peak_rate: number;
      off_peak_rate: number;
      demand_rate: number;
    };
  };
  quality_assessment?: {
    data_quality_score: number;
    anomaly_detected: boolean;
    baseline_variance: number;
    confidence_level: number;
    validation_flags?: string[];
  };
  environmental_impact?: {
    carbon_footprint_kg_co2: number;
    emission_factor: number;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Energy statistics response
 */
export interface EnergyStatsResponse {
  total_consumption: number;
  average_consumption: number;
  min_consumption: number;
  max_consumption: number;
  peak_demand: number;
  total_cost: number;
  average_power_factor: number;
  min_power_factor: number;
  max_power_factor: number;
  efficiency_score: number; // 0-100
  consumption_per_sqm: number;
  reading_count: number;
  period: {
    start: string;
    end: string;
  };
  trends: Array<{
    date: string;
    consumption: number;
    avg_power_factor: number;
    readings: number;
  }>;
  performance_metrics: {
    consumption_stability: number;
    power_factor_consistency: number;
    quality_readings_percentage: number;
  };
  building_info: {
    id: number;
    name: string;
    area_sqm: number;
  };
}

/**
 * Energy trends data point
 */
export interface EnergyTrendDataPoint {
  date: string;
  consumption: number;
  cost: number;
  demand: number;
  avg_power_factor: number;
  reading_count: number;
  period_type: string;
  growth_rate: number; // percentage
}

/**
 * Building energy comparison
 */
export interface BuildingEnergyComparison {
  id: number;
  building_name: string;
  building_code: string;
  area_sqm: number;
  building_type: string;
  total_consumption: number;
  avg_consumption: number;
  total_cost: number;
  avg_power_factor: number;
  peak_demand: number;
  reading_count: number;
  consumption_per_sqm: number;
  rank: number;
  efficiency_score: number;
}

/**
 * Power quality measurement with IEEE 519 compliance analysis
 */
export interface PowerQualityReading {
  id?: number;
  building_id: number;
  equipment_id?: number;
  measurement_point?: string;
  voltage_l1: number;
  voltage_l2: number;
  voltage_l3: number;
  voltage_neutral?: number;
  current_l1?: number;
  current_l2?: number;
  current_l3?: number;
  current_neutral?: number;
  power_factor: number;
  thd_voltage: number;
  thd_current: number;
  individual_harmonics?: {
    voltage_harmonics: number[];
    current_harmonics: number[];
  };
  frequency: number;
  voltage_unbalance: number;
  current_unbalance?: number;
  flicker_pst?: number;
  flicker_plt?: number;
  recorded_at: string;
  compliance_analysis?: {
    ieee519: {
      voltage_thd: {
        measured: number;
        limit: number;
        status: "compliant" | "non_compliant" | "warning";
      };
      current_thd: {
        measured: number;
        limit: number;
        status: "compliant" | "non_compliant" | "warning";
      };
      individual_voltage_harmonics?: {
        harmonic_order: number;
        measured_percent: number;
        limit_percent: number;
        status: "compliant" | "non_compliant" | "warning";
      }[];
    };
    itic_curve?: {
      compliant: boolean;
      violations: PowerQualityEvent[];
    };
  };
  power_quality_score?: number;
  events_detected?: PowerQualityEvent[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Power Quality Statistics Response
 */
export interface PowerQualityStatsResponse {
  thd_voltage_avg: number;
  thd_voltage_max: number;
  thd_current_avg: number;
  thd_current_max: number;
  voltage_unbalance_avg: number;
  voltage_unbalance_max: number;
  power_factor_avg: number;
  power_factor_min: number;
  frequency_avg: number;
  frequency_min: number;
  frequency_max: number;
  quality_score: number; // 0-100
  total_readings: number;
  violations: {
    thd_voltage_violations: number;
    thd_current_violations: number;
    voltage_unbalance_violations: number;
    power_factor_violations: number;
    frequency_violations: number;
  };
  compliance: {
    thd_voltage_compliance_rate: number;
    thd_current_compliance_rate: number;
    voltage_unbalance_compliance_rate: number;
    power_factor_compliance_rate: number;
    overall_compliance: number;
  };
  trends: Array<{
    date: string;
    avg_thd_voltage: number;
    avg_power_factor: number;
    violations: number;
  }>;
  building_info: {
    id: number;
    name: string;
  };
}

/**
 * Power quality event (sags, swells, interruptions)
 */
export interface PowerQualityEvent {
  id?: number;
  event_type:
    | "voltage_sag"
    | "voltage_swell"
    | "interruption"
    | "transient"
    | "flicker";
  severity: "low" | "medium" | "high" | "critical";
  start_time: string;
  end_time?: string;
  duration_ms: number;
  magnitude: number; // Per unit or percentage
  affected_phases: ("L1" | "L2" | "L3" | "N")[];
  itic_curve_violation: boolean;
  estimated_cost: number;
  root_cause?: string;
  equipment_affected?: number[];
  recovery_time_ms?: number;
}

/**
 * Power Quality Events Response
 */
export interface PowerQualityEventsResponse {
  events: Array<{
    id: number;
    recorded_at: string;
    event_type: string;
    severity_level: "low" | "medium" | "high" | "critical";
    magnitude: number;
    impact_score: number; // 0-100
    duration_estimate: string;
    standards_violated: string[];
    voltage_l1: number;
    thd_voltage: number;
    frequency: number;
  }>;
  summary: {
    total_events: number;
    voltage_events: number;
    thd_voltage_events: number;
    thd_current_events: number;
    frequency_events: number;
    power_factor_events: number;
  };
}

/**
 * System alert with intelligent prioritization
 */
export interface Alert {
  id: number;
  type:
    | "energy_anomaly"
    | "power_quality"
    | "equipment_failure"
    | "maintenance_due"
    | "compliance_violation"
    | "safety_concern";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved" | "escalated" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  title: string;
  message: string;
  description?: string;
  building_id?: number;
  building_name?: string;
  equipment_id?: number;
  equipment_name?: string;
  detected_value?: number;
  threshold_value?: number;
  unit?: string;
  urgency: string;
  estimated_cost_impact?: number;
  estimated_downtime_hours?: number;
  threshold_config?: {
    standard: string;
    parameter: string;
    limit: number;
    condition: "greater_than" | "less_than" | "equal_to" | "between";
  };
  root_cause_analysis?: {
    primary_cause?: string;
    contributing_factors?: string[];
    probability_score?: number;
  };
  recommended_actions?: {
    action: string;
    priority: "immediate" | "urgent" | "scheduled";
    estimated_duration_hours: number;
    required_skills?: string[];
    estimated_cost?: number;
  }[];
  assigned_to?: number;
  assigned_user_name?: string;
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved_by?: number;
  resolved_at?: string;
  resolution_notes?: string;
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  escalation_level?: number;
  escalated_to?: number;
  age_minutes?: number;
  tags?: string[];
  attachments?: {
    filename: string;
    file_type: string;
    file_size: number;
    uploaded_by: number;
    uploaded_at: string;
  }[];
  created_at: string;
  updated_at?: string;
}

/**
 * Alert Statistics Response
 */
export interface AlertStatistics {
  total: {
    total_alerts: number;
    alerts_today: number;
    alerts_this_week: number;
  };
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_type: {
    energy_anomaly: number;
    power_quality: number;
    equipment_failure: number;
    maintenance_due: number;
    compliance_violation: number;
    safety_concern: number;
  };
  by_status: {
    active: number;
    acknowledged: number;
    resolved: number;
    escalated: number;
    closed: number;
  };
  response_times: {
    avg_acknowledgment_time: number; // minutes
    avg_resolution_time: number; // minutes
  };
  trends: {
    daily_alerts_last_week: number[];
    escalation_rate: number; // percentage
  };
}

/**
 * Alert Threshold Configuration
 */
export interface AlertThreshold {
  id: number;
  building_id?: number;
  equipment_id?: number;
  parameter: string;
  threshold_type: string;
  warning_threshold: number;
  critical_threshold: number;
  unit: string;
  enabled: boolean;
  alerts_generated: number;
  last_alert_timestamp?: string;
  building_name?: string;
  equipment_name?: string;
  effectiveness_score?: number;
}

/**
 * Monitoring Test Result
 */
export interface MonitoringTestResult {
  building_id: number;
  building_name: string;
  monitoring_type: string;
  test_results: {
    success: boolean;
    alerts_generated: number;
    processing_time: number; // milliseconds
    test_results: {
      consumption_check: boolean;
      power_factor_check: boolean;
      baseline_deviation: number;
      compliance_status: string;
    };
    alerts: Alert[];
    background_jobs?: any[]; // if async
    power_quality_events?: PowerQualityEvent[]; // if PQ test
    maintenance_predictions?: any[]; // if equipment test
    cost_impact: number;
    recommended_actions: string[];
  };
  background_job_id?: number; // if async
  processing_mode: "sync" | "async";
  timestamp: string;
}

/**
 * Escalation Processing Result
 */
export interface EscalationResult {
  processed_alerts: number;
  escalated_alerts: number;
  processing_time: number;
  escalation_summary: {
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
  };
  errors: string[];
}

/**
 * Comprehensive energy audit with compliance tracking
 */
export interface Audit {
  id: number;
  title: string;
  description?: string;
  audit_type:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  status: "planned" | "in_progress" | "completed" | "cancelled" | "on_hold";
  building_id: number;
  building_name?: string;
  auditor_id: number;
  auditor_name?: string;
  team_members?: User[];
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  compliance_score?: number;
  energy_savings_potential_kwh?: number;
  cost_savings_potential_php?: number;
  implementation_cost_php?: number;
  payback_period_months?: number;
  compliance_standards?: ComplianceStandard[];
  audit_code?: string;
  audit_framework?: {
    compliance_standards: {
      standard: string;
      scope: string;
      checklist_items: number;
      completed_items?: number;
    }[];
  };
  findings?: {
    total_findings: number;
    critical_findings: number;
    major_findings: number;
    minor_findings: number;
    observations: number;
  };
  recommendations?: {
    id: number;
    category: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    estimated_savings_kwh?: number;
    estimated_savings_php?: number;
    implementation_cost?: number;
    payback_months?: number;
    status: "pending" | "approved" | "rejected" | "implemented";
  }[];
  progress_percentage?: number;
  next_audit_due?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Compliance standard assessment
 */
export interface ComplianceStandard {
  standard: "IEEE519" | "PEC2017" | "OSHS" | "ISO25010" | "RA11285";
  name: string;
  description?: string;
  score: number;
  max_score: number;
  percentage: number;
  status:
    | "compliant"
    | "non_compliant"
    | "partially_compliant"
    | "not_assessed";
  violations?: number;
  critical_violations?: number;
  last_assessment?: string;
  next_assessment_due?: string;
  requirements_met: number;
  total_requirements: number;
}

/**
 * Individual compliance check result
 */
export interface ComplianceCheck {
  id: number;
  audit_id: number;
  standard: string;
  requirement_code: string;
  requirement_title: string;
  requirement_description?: string;
  category: string;
  status: "passed" | "failed" | "warning" | "not_applicable" | "not_checked";
  measured_value?: number;
  required_value?: number;
  tolerance?: number;
  unit?: string;
  evidence?: string;
  notes?: string;
  recommendation?: string;
  corrective_action?: string;
  responsible_party?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  verification_method?: string;
  assessor_id: number;
  assessment_date: string;
  severity?: "low" | "medium" | "high" | "critical";
  cost_to_fix?: number;
  attachments?: string[];
}

/**
 * Generated report metadata
 */
export interface Report {
  id: number;
  title: string;
  description?: string;
  type:
    | "energy"
    | "compliance"
    | "audit"
    | "power_quality"
    | "equipment"
    | "cost_analysis"
    | "custom";
  format: "pdf" | "excel" | "csv" | "html";
  status: "generating" | "completed" | "failed" | "cancelled";
  building_id?: number;
  building_name?: string;
  audit_id?: number;
  requested_by: number;
  requester_name?: string;
  parameters: {
    start_date?: string;
    end_date?: string;
    include_charts?: boolean;
    include_raw_data?: boolean;
    include_recommendations?: boolean;
    sections?: string[];
    filters?: Record<string, any>;
  };
  file_size_mb?: number;
  file_path?: string;
  download_url?: string;
  download_count?: number;
  expires_at?: string;
  generation_time_seconds?: number;
  error_message?: string;
  schedule?: {
    frequency: "once" | "daily" | "weekly" | "monthly" | "quarterly";
    next_generation?: string;
    recipients?: string[];
  };
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

/**
 * Executive dashboard overview metrics
 */
export interface DashboardOverview {
  timestamp: string;
  system_health: {
    overall_score: number;
    status: "excellent" | "good" | "fair" | "poor" | "critical";
    uptime_percentage: number;
    data_quality_score: number;
  };
  building_portfolio: {
    total_buildings: number;
    active_buildings: number;
    buildings_in_maintenance: number;
    total_area_sqm: number;
    average_efficiency_score: number;
  };
  energy_performance: {
    total_consumption_today_kwh: number;
    total_consumption_month_kwh: number;
    monthly_cost_php: number;
    efficiency_vs_baseline: number;
    carbon_footprint_kg_co2: number;
    renewable_energy_percentage: number;
  };
  alerts_summary: {
    active_critical: number;
    active_high: number;
    active_medium: number;
    active_low: number;
    total_active: number;
    average_response_time_minutes: number;
    resolution_rate_24h: number;
  };
  equipment_status: {
    total_equipment: number;
    operational: number;
    maintenance_required: number;
    offline: number;
    average_condition_score: number;
  };
  compliance_status: {
    overall_compliance_score: number;
    ieee519_compliance: number;
    pec2017_compliance: number;
    oshs_compliance: number;
    ra11285_compliance: number;
    upcoming_audits: number;
  };
  cost_optimization: {
    identified_savings_php: number;
    implemented_savings_php: number;
    potential_monthly_savings: number;
    roi_percentage: number;
  };
}

/**
 * Energy Summary for Dashboard
 */
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

/**
 * Power Quality Summary for Dashboard
 */
export interface PowerQualitySummary {
  overall_score: number;
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

/**
 * Audit Summary for Dashboard
 */
export interface AuditSummary {
  completion_metrics: {
    total_audits: number;
    completed_audits: number;
    in_progress_audits: number;
    completion_rate: number;
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
    average_audit_duration: number;
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

/**
 * Compliance Summary for Dashboard
 */
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

/**
 * Background job for long-running operations
 */
export interface BackgroundJob {
  id: number;
  type:
    | "ENERGY_ANALYSIS"
    | "REPORT_GENERATION"
    | "DATA_IMPORT"
    | "COMPLIANCE_CHECK"
    | "ANOMALY_DETECTION";
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  progress_percentage: number;
  started_by: number;
  started_by_name?: string;
  parameters: Record<string, any>;
  result?: any;
  error_message?: string;
  estimated_completion?: string;
  actual_completion?: string;
  execution_time_seconds?: number;
  retries?: number;
  max_retries?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
}

/**
 * Monitoring Activities
 */
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

/**
 * System Health Status
 */
export interface SystemHealthStatus {
  timestamp: string;
  overall_health_score: number;
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  uptime_seconds: number;
  uptime_percentage: number;
  database_health: {
    status: "healthy" | "degraded" | "unavailable";
    connection_pool: {
      active_connections: number;
      idle_connections: number;
      max_connections: number;
      queue_length: number;
    };
    performance_metrics: {
      average_query_time_ms: number;
      slow_queries_count: number;
      failed_queries_count: number;
    };
    last_backup: string;
    disk_usage_percentage: number;
  };
  redis_health: {
    status: "healthy" | "degraded" | "unavailable";
    connection_count: number;
    memory_usage_mb: number;
    memory_usage_percentage: number;
    hit_rate_percentage: number;
    commands_processed_per_second: number;
    average_response_time_ms: number;
  };
  background_processor: {
    status: "running" | "degraded" | "stopped";
    active_jobs: number;
    queued_jobs: number;
    failed_jobs: number;
    completed_jobs_last_hour: number;
    average_job_duration_ms: number;
    queue_depths: {
      high_priority: number;
      normal_priority: number;
      low_priority: number;
    };
  };
  websocket_connections: {
    total_connections: number;
    active_connections: number;
    failed_connections_last_hour: number;
    average_connection_duration_minutes: number;
    message_rate_per_second: number;
    bandwidth_usage_mbps: number;
  };
  api_health: {
    total_requests_last_hour: number;
    average_response_time_ms: number;
    error_rate_percentage: number;
    rate_limit_hits: number;
    slowest_endpoints: {
      endpoint: string;
      average_time_ms: number;
      request_count: number;
    }[];
  };
  alert_summary: {
    total_active_alerts: number;
    critical_alerts: number;
    high_priority_alerts: number;
    alerts_created_last_hour: number;
    alerts_resolved_last_hour: number;
    average_resolution_time_minutes: number;
  };
  system_resources: {
    cpu_usage_percentage: number;
    memory_usage_percentage: number;
    disk_usage_percentage: number;
    network_io_mbps: number;
    disk_io_ops_per_second: number;
    load_average: number[];
  };
  data_collection: {
    buildings_reporting: number;
    total_buildings: number;
    last_reading_timestamp: string;
    data_quality_score: number;
    missing_data_percentage: number;
    collection_rate_per_minute: number;
  };
  service_status: {
    energy_monitoring: "operational" | "degraded" | "down";
    power_quality_analysis: "operational" | "degraded" | "down";
    alert_processing: "operational" | "degraded" | "down";
    report_generation: "operational" | "degraded" | "down";
    compliance_checking: "operational" | "degraded" | "down";
    analytics_engine: "operational" | "degraded" | "down";
  };
  recent_issues: {
    timestamp: string;
    severity: "low" | "medium" | "high" | "critical";
    component: string;
    description: string;
    status: "resolved" | "investigating" | "monitoring";
  }[];
  recommendations: {
    category: string;
    priority: "low" | "medium" | "high" | "urgent";
    description: string;
    estimated_impact: string;
    action_required: string;
  }[];
  next_maintenance_window: string;
  last_system_restart: string;
  version_info: {
    api_version: string;
    database_version: string;
    redis_version: string;
    node_version: string;
  };
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  metadata?: {
    request_id: string;
    response_time_ms: number;
    api_version: string;
    timestamp: string;
  };
}

/**
 * API error response structure
 */
export interface ApiError {
  success: false;
  message: string;
  error: string;
  error_code?: string;
  details?: Record<string, any>;
  validation_errors?: {
    field: string;
    message: string;
    value?: any;
  }[];
  request_id?: string;
  timestamp?: string;
}

// Query parameter interfaces for filtering and pagination

export interface BuildingQueryParams {
  search?: string;
  status?: "active" | "maintenance" | "inactive" | "construction";
  building_type?: "commercial" | "industrial" | "residential" | "institutional";
  sortBy?: "name" | "code" | "area_sqm" | "efficiency_score" | "created_at";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
  min_area?: number;
  max_area?: number;
  year_built_from?: number;
  year_built_to?: number;
}

export interface EquipmentQueryParams {
  building_id?: number;
  equipment_type?:
    | "hvac"
    | "lighting"
    | "electrical"
    | "manufacturing"
    | "security"
    | "other";
  status?: "operational" | "maintenance" | "offline" | "decommissioned";
  manufacturer?: string;
  condition_score_min?: number;
  condition_score_max?: number;
  maintenance_due?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "code" | "condition_score" | "next_maintenance_due";
  sortOrder?: "ASC" | "DESC";
}

export interface EnergyQueryParams {
  building_id: number;
  equipment_id?: number;
  start_date: string;
  end_date: string;
  interval?: "hourly" | "daily" | "weekly" | "monthly";
  include_cost?: boolean;
  include_quality_assessment?: boolean;
  include_environmental_impact?: boolean;
  reading_type?: "automatic" | "manual" | "estimated";
}

export interface EnergyTrendsParams {
  interval?: "hourly" | "daily" | "weekly" | "monthly";
  start_date?: string;
  end_date?: string;
  period?: string;
}

export interface EnergyComparisonParams {
  building_ids?: number[];
  start_date?: string;
  end_date?: string;
  include_rankings?: boolean;
}

export interface PowerQualityQueryParams {
  building_id: number;
  equipment_id?: number;
  start_date: string;
  end_date: string;
  include_events?: boolean;
  include_harmonics?: boolean;
  compliance_standard?: "IEEE519" | "ITIC";
  event_types?: string[];
  severity?: "low" | "medium" | "high" | "critical";
}

export interface PowerQualityEventsParams {
  start_date: string;
  end_date: string;
  event_types?: string[];
  severity?: "low" | "medium" | "high" | "critical";
}

export interface AlertQueryParams {
  severity?: "low" | "medium" | "high" | "critical";
  status?: "active" | "acknowledged" | "resolved" | "escalated" | "closed";
  type?:
    | "energy_anomaly"
    | "power_quality"
    | "equipment_failure"
    | "maintenance_due"
    | "compliance_violation"
    | "safety_concern";
  building_id?: number;
  equipment_id?: number;
  assigned_to?: number;
  start_date?: string;
  end_date?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "severity" | "priority" | "estimated_cost_impact";
  sortOrder?: "ASC" | "DESC";
}

export interface AlertThresholdParams {
  building_id?: number;
  equipment_id?: number;
  threshold_type?: string;
  active_only?: boolean;
  parameter?: string;
}

export interface MonitoringTestParams {
  monitoring_type: "energy" | "power_quality" | "equipment";
  test_data: any;
  async_processing?: boolean;
  enable_anomaly_detection?: boolean;
  enable_efficiency_analysis?: boolean;
  complex_analysis?: boolean;
}

export interface AuditQueryParams {
  building_id?: number;
  audit_type?:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  status?: "planned" | "in_progress" | "completed" | "cancelled" | "on_hold";
  auditor_id?: number;
  compliance_standards?: string[];
  start_date_from?: string;
  start_date_to?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "planned_start_date"
    | "compliance_score"
    | "energy_savings_potential_kwh";
  sortOrder?: "ASC" | "DESC";
}

export interface ReportQueryParams {
  type?:
    | "energy"
    | "compliance"
    | "audit"
    | "power_quality"
    | "equipment"
    | "cost_analysis"
    | "custom";
  status?: "generating" | "completed" | "failed" | "cancelled";
  building_id?: number;
  audit_id?: number;
  requested_by?: number;
  format?: "pdf" | "excel" | "csv" | "html";
  created_from?: string;
  created_to?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "title" | "type";
  sortOrder?: "ASC" | "DESC";
}

export interface JobQueryParams {
  type?:
    | "ENERGY_ANALYSIS"
    | "REPORT_GENERATION"
    | "DATA_IMPORT"
    | "COMPLIANCE_CHECK"
    | "ANOMALY_DETECTION";
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  started_by?: number;
  priority?: "low" | "normal" | "high" | "urgent";
  created_from?: string;
  created_to?: string;
  page?: number;
  limit?: number;
}

export interface MonitoringActivityParams {
  activity_type?: string;
  building_id?: number;
  status?: "success" | "warning" | "error";
  start_date?: string;
  end_date?: string;
  limit?: number;
  page?: number;
}

// Utility types for form handling and validation

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password?: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  department?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  profile_picture?: File;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Analytics and baseline types
export interface EnergyBaseline {
  building_id: number;
  baseline_type: "daily" | "weekly" | "monthly" | "seasonal";
  baseline_consumption: number;
  confidence_interval: number;
  created_at: string;
  valid_until: string;
}

export interface BaselineCalculationParams {
  building_id: number;
  baseline_type: "daily" | "weekly" | "monthly" | "seasonal";
  historical_months: number;
  include_weather_normalization?: boolean;
  exclude_anomalies?: boolean;
}

export interface AnomalyDetectionParams {
  building_id?: number;
  equipment_id?: number;
  analysis_types: ("energy" | "power_quality" | "equipment")[];
  start_date: string;
  end_date: string;
  sensitivity: "low" | "medium" | "high";
  threshold_deviation: number;
  minimum_duration_minutes?: number;
}

export interface DetectedAnomaly {
  id: string;
  type: "energy" | "power_quality" | "equipment";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  description: string;
  detected_value: number;
  expected_value: number;
  root_cause_analysis: {
    primary_cause: string;
    contributing_factors: string[];
  };
  recommendations: string[];
}
