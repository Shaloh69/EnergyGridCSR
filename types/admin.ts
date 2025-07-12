// types/admin.ts

import {
  User,
  Building,
  Equipment,
  PowerQualityEvent,
  Alert,
  Audit,
  ComplianceCheck,
  DashboardOverview,
  AlertStatistics,
  MaintenanceSchedule,
  EnergySummary,
  PowerQualitySummary,
  AuditSummary,
  ComplianceSummary,
} from "./api-types";

// Re-export all types from api-types to avoid duplication
export type {
  User,
  AuthResponse,
  Building,
  Equipment,
  EnergyReading,
  PowerQualityReading,
  PowerQualityEvent,
  Alert,
  Audit,
  ComplianceCheck,
  ComplianceStandard,
  Report,
  DashboardOverview,
  BackgroundJob,
  ApiResponse,
  ApiError,
  AlertStatistics,
  EnergyStatsResponse,
  PowerQualityStatsResponse,
  MaintenanceSchedule,
  EnergySummary,
  PowerQualitySummary,
  AuditSummary,
  ComplianceSummary,
  MonitoringActivity,
  SystemHealthStatus,
  AlertQueryParams,
  BuildingQueryParams,
  EquipmentQueryParams,
  EnergyQueryParams,
  PowerQualityQueryParams,
  AuditQueryParams,
  ReportQueryParams,
  JobQueryParams,
  BuildingDeletionCheck,
} from "@/types/api-types";

// ✅ FIXED: Enhanced User Profile with server-aligned activity statistics
export interface UserProfile {
  user: User;
  activity_statistics: {
    audits_conducted: number;
    maintenance_performed: number;
    energy_readings_created: number;
    power_quality_readings_created: number;
    alerts_resolved: number;
  };
  performance_metrics: {
    audit_completion_rate: number;
    average_alert_response_time_minutes: number;
  };
  recent_activity?: {
    last_login: string;
    recent_audits: number;
    recent_readings: number;
  };
}

// ✅ FIXED: Enhanced Building with performance metrics using server structure
export interface BuildingWithMetrics extends Building {
  equipment_count: number;
  audit_count: number;
  avg_compliance_score: number;
  last_energy_reading: string;
  total_consumption_kwh: number;
  avg_power_factor: number;
  efficiency_score: number;
  monthly_cost_php: number;
  alert_count: number;
  maintenance_due_count: number;
}

// ✅ FIXED: Enhanced Equipment with maintenance insights using server fields
export interface EquipmentWithMaintenance extends Equipment {
  age_years: number;
  maintenance_interval_days: number;
  next_maintenance_date: string;
  last_maintenance_date: string;
  predicted_maintenance_date: string;
  maintenance_risk_level: "low" | "medium" | "high" | "critical";
  active_alerts: number;
  health_status: "excellent" | "good" | "fair" | "poor" | "critical";
  maintenance_urgency: number; // 0-100
  maintenance_cost_ytd: number;
  downtime_hours_ytd: number;
  efficiency_trend: "improving" | "stable" | "declining";
}

// ✅ FIXED: Enhanced Energy Data with analytics using server field names
export interface EnergyConsumptionData {
  building_id: number;
  period: {
    start_date: string;
    end_date: string;
    interval: "hourly" | "daily" | "weekly" | "monthly";
  };
  summary: {
    total_consumption_kwh: number;
    total_cost_php: number;
    average_daily_consumption: number;
    peak_demand_kw: number;
    average_power_factor: number;
    carbon_footprint_kg_co2: number;
  };
  daily_data: DailyEnergyData[];
  analytics: {
    efficiency_rating: string;
    baseline_comparison: {
      variance_percentage: number;
      trend: "increasing" | "decreasing" | "stable";
    };
    cost_optimization: {
      potential_monthly_savings: number;
      recommendations: string[];
    };
  };
}

export interface DailyEnergyData {
  date: string;
  consumption_kwh: number;
  reactive_power_kvarh?: number;
  power_factor: number;
  peak_demand_kw: number;
  cost_php: number;
  cost_breakdown: {
    energy_charge: number;
    demand_charge: number;
    taxes_and_fees: number;
  };
}

// ✅ FIXED: Enhanced Power Quality Data with server field names
export interface PowerQualityData {
  building_id: number;
  summary: {
    total_readings: number;
    ieee519_compliance_rate: number;
    itic_compliance_rate: number;
    power_quality_score: number;
    events_detected: number;
  };
  latest_reading: {
    voltage_quality: {
      voltage_l1: number;
      voltage_l2: number;
      voltage_l3: number;
      voltage_unbalance: number;
      thd_voltage: number;
      ieee519_voltage_limit: number;
      compliance_status: "compliant" | "non_compliant";
    };
    current_quality: {
      thd_current: number;
      ieee519_current_limit: number;
      compliance_status: "compliant" | "non_compliant";
    };
  };
  events: PowerQualityEvent[];
}

// ✅ FIXED: Analytics and Insights with server structure
export interface AnalyticsData {
  analysis_id: string;
  building_id: number;
  energy_analysis: {
    total_consumption_kwh: number;
    efficiency_score: number;
    cost_analysis: {
      total_cost_php: number;
      potential_savings_php: number;
    };
  };
  anomaly_detection: {
    anomalies_detected: number;
    severity_breakdown: {
      high: number;
      medium: number;
      low: number;
      critical: number;
    };
  };
  efficiency_opportunities: EfficiencyOpportunity[];
  recommendations: string[];
}

export interface EfficiencyOpportunity {
  category: string;
  potential_savings_kwh: number;
  potential_savings_php: number;
  payback_months: number;
  priority: "low" | "medium" | "high" | "critical";
  description?: string;
  implementation_cost?: number;
  annual_savings?: number;
}

export interface Anomaly {
  id: string;
  type: "energy" | "power_quality" | "equipment";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  description: string;
  detected_value: number;
  expected_value: number;
  confidence_score?: number;
  root_cause_analysis: {
    primary_cause: string;
    contributing_factors: string[];
    probability_score?: number;
  };
  recommendations: string[];
  status?: "new" | "investigating" | "resolved";
}

// ✅ FIXED: Enhanced Real-time Metrics with server structure
export interface RealTimeMetrics {
  timestamp: string;
  current_energy: {
    total_demand_kw: number;
    total_consumption_today_kwh: number;
    average_power_factor: number;
  };
  building_status: BuildingStatus[];
  active_alerts: Alert[];
  system_status: {
    data_collection_rate: number;
    system_uptime_percentage: number;
    active_connections: number;
  };
}

export interface BuildingStatus {
  building_id: number;
  name: string;
  current_demand_kw: number;
  status: "normal" | "warning" | "critical";
  alert_count: number;
  last_reading_timestamp?: string;
  data_quality_score?: number;
  equipment_online?: number;
  equipment_total?: number;
}

// ✅ FIXED: Enhanced Monitoring Dashboard with server structure
export interface MonitoringDashboard {
  systemStats: {
    totalBuildings: number;
    totalAlerts: number;
    criticalAlerts: number;
    faultyEquipment: number;
    connectedUsers: number;
    dataCollectionRate: number;
    systemUptimePercentage: number;
  };
  buildings: BuildingStatus[];
  performance_metrics: {
    data_collection_rate: number;
    system_uptime_percentage: number;
    api_response_time_ms?: number;
    database_query_time_ms?: number;
  };
}

// Chart Data Types for UI Components
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// Navigation Types for Admin Interface
export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  children?: NavItem[];
}

// ✅ FIXED: Enhanced Dashboard Metrics with server structure
export interface DashboardMetrics {
  overview: DashboardOverview;
  energy_summary: EnergySummary;
  power_quality_summary: PowerQualitySummary;
  audit_summary: AuditSummary;
  compliance_summary: ComplianceSummary;
  alert_statistics: AlertStatistics;
  real_time_metrics: RealTimeMetrics;
  last_updated: string;
}

// ✅ FIXED: System Administration Types with server structure
export interface SystemConfiguration {
  api_version: string;
  environment: string;
  features_enabled: string[];
  monitoring_enabled: boolean;
  cache_enabled: boolean;
  real_time_updates: boolean;
  backup_status: {
    last_backup: string;
    next_backup: string;
    backup_size_mb: number;
    backup_status: "completed" | "running" | "failed";
  };
  rate_limiting: {
    enabled: boolean;
    requests_per_minute: number;
    burst_limit: number;
  };
  security: {
    jwt_expiry_minutes: number;
    password_policy: {
      min_length: number;
      require_special_chars: boolean;
      require_numbers: boolean;
    };
  };
}

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
  recent_logins: {
    user_id: number;
    user_name: string;
    login_time: string;
    ip_address: string;
    user_agent?: string;
    session_duration?: number;
  }[];
  failed_login_attempts: number;
  locked_accounts: number;
  password_reset_requests: number;
}

// ✅ FIXED: Maintenance and Operations with server structure
export interface MaintenanceOverview {
  scheduled_maintenance: MaintenanceSchedule;
  predictive_insights: {
    equipment_at_risk: number;
    predicted_failures: {
      equipment_id: number;
      equipment_name: string;
      building_name: string;
      failure_probability: number;
      recommended_action: string;
      timeline: string;
      estimated_cost: number;
    }[];
  };
  maintenance_costs: {
    monthly_budget: number;
    actual_spending: number;
    projected_savings: number;
    cost_per_equipment_avg: number;
  };
  performance_metrics: {
    mtbf_hours_avg: number;
    mttr_hours_avg: number;
    maintenance_efficiency: number;
    equipment_uptime: number;
  };
}

// ✅ FIXED: Advanced Analytics Dashboard with server structure
export interface AnalyticsDashboard {
  energy_insights: {
    efficiency_trends: TimeSeriesData[];
    cost_optimization_opportunities: EfficiencyOpportunity[];
    baseline_comparisons: {
      building_id: number;
      building_name: string;
      current_vs_baseline: number;
      improvement_potential: number;
      baseline_type: "daily" | "weekly" | "monthly";
    }[];
  };
  power_quality_insights: {
    compliance_trends: TimeSeriesData[];
    event_patterns: {
      event_type: string;
      frequency: number;
      cost_impact: number;
      severity_distribution: Record<string, number>;
    }[];
    improvement_recommendations: string[];
  };
  predictive_analytics: {
    equipment_health_forecast: {
      equipment_id: number;
      equipment_name: string;
      building_name: string;
      health_trajectory: "improving" | "stable" | "declining";
      maintenance_window: string;
      confidence_score: number;
    }[];
    energy_demand_forecast: TimeSeriesData[];
    anomaly_predictions: Anomaly[];
  };
  analysis_metadata: {
    last_updated: string;
    data_quality_score: number;
    models_accuracy: Record<string, number>;
    next_analysis_scheduled: string;
  };
}

// ✅ FIXED: Compliance and Audit Management with server structure
export interface ComplianceManagement {
  standards_overview: {
    standard: "PEC2017" | "OSHS" | "ISO25010" | "RA11285";
    overall_compliance: number;
    buildings_compliant: number;
    total_buildings: number;
    critical_violations: number;
    improvement_trend: "improving" | "stable" | "declining";
    last_assessment: string;
    next_assessment_due: string;
  }[];
  audit_pipeline: {
    scheduled_audits: Audit[];
    in_progress_audits: Audit[];
    overdue_audits: Audit[];
    audit_workload: {
      auditor_id: number;
      auditor_name: string;
      assigned_audits: number;
      completion_rate: number;
      avg_audit_duration: number;
    }[];
  };
  compliance_alerts: {
    critical_issues: ComplianceCheck[];
    upcoming_deadlines: {
      requirement: string;
      due_date: string;
      building_name: string;
      priority: "low" | "medium" | "high" | "critical";
      responsible_person?: string;
    }[];
  };
  performance_metrics: {
    avg_compliance_score: number;
    compliance_trend_30d: number;
    violations_resolved_rate: number;
    audit_efficiency_score: number;
  };
}

// ✅ FIXED: Report Management and Analytics with server structure
export interface ReportAnalytics {
  generation_statistics: {
    total_reports: number;
    reports_this_month: number;
    success_rate: number;
    average_generation_time: number;
    failed_reports: number;
    cancelled_reports: number;
  };
  popular_reports: {
    report_type:
      | "energy_consumption"
      | "power_quality"
      | "audit_summary"
      | "compliance"
      | "monitoring";
    generation_count: number;
    download_count: number;
    user_satisfaction: number;
    avg_generation_time: number;
  }[];
  scheduled_reports: {
    id: number;
    title: string;
    frequency: "once" | "daily" | "weekly" | "monthly" | "quarterly";
    next_generation: string;
    recipients: string[];
    status: "active" | "paused" | "failed";
    last_generated?: string;
  }[];
  storage_utilization: {
    total_storage_mb: number;
    used_storage_mb: number;
    cleanup_recommendations: string[];
    retention_policy_days: number;
  };
}

// ✅ FIXED: Advanced Filtering and Search with server structure
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

// ✅ FIXED: Data Export and Import with server structure
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
  errors: {
    row: number;
    field: string;
    message: string;
    severity: "error" | "warning";
  }[];
  processing_time_ms: number;
  file_size_mb: number;
  import_id: string;
}

// ✅ FIXED: Notification and Alert Management with server structure
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

// ✅ FIXED: Integration and API Management with server structure
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

// ✅ FIXED: Performance and Optimization with server structure
export interface PerformanceMetrics {
  database_performance: {
    query_count: number;
    slow_queries: number;
    average_query_time_ms: number;
    connection_pool_usage: number;
    deadlocks_count: number;
    cache_hit_ratio: number;
  };
  cache_performance: {
    hit_rate: number;
    miss_rate: number;
    eviction_rate: number;
    memory_usage_mb: number;
    key_count: number;
    expired_keys_24h: number;
  };
  api_performance: {
    requests_per_second: number;
    average_response_time_ms: number;
    error_rate: number;
    concurrent_users: number;
    bandwidth_usage_mbps: number;
  };
  system_resources: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: number;
    disk_io_ops_per_second: number;
    load_average_1m: number;
  };
}

export interface OptimizationRecommendation {
  category: "database" | "cache" | "api" | "system";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  expected_improvement: string;
  implementation_effort: "low" | "medium" | "high";
  estimated_cost: number;
  estimated_savings: number;
  timeline_days: number;
  risk_level: "low" | "medium" | "high";
}

// ✅ FIXED: Security and Access Control with server structure
export interface SecurityAuditLog {
  id: number;
  event_type:
    | "login"
    | "logout"
    | "data_access"
    | "configuration_change"
    | "export"
    | "import";
  user_id: number;
  user_name: string;
  ip_address: string;
  user_agent: string;
  resource_accessed?: string;
  action_performed: string;
  status: "success" | "failed" | "blocked";
  risk_level: "low" | "medium" | "high";
  timestamp: string;
  additional_data?: Record<string, any>;
  session_id?: string;
  geolocation?: string;
  threat_score?: number;
}

export interface AccessControlMatrix {
  role: "admin" | "energy_manager" | "facility_engineer" | "staff" | "student";
  permissions: {
    resource: string;
    actions: ("create" | "read" | "update" | "delete" | "export" | "admin")[];
    conditions?: string[];
  }[];
}

// ✅ FIXED: Backup and Recovery with server structure
export interface BackupConfiguration {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly";
  retention_days: number;
  include_files: boolean;
  compression: boolean;
  encryption: boolean;
  remote_storage: {
    enabled: boolean;
    provider: string;
    configuration: Record<string, any>;
  };
  incremental_backups: boolean;
  verification_enabled: boolean;
  max_backup_size_gb: number;
}

export interface BackupStatus {
  id: number;
  type: "full" | "incremental";
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  size_mb: number;
  location: string;
  verification_status: "verified" | "failed" | "pending";
  error_message?: string;
  files_count: number;
  compressed_size_mb?: number;
  encryption_enabled: boolean;
  retention_until: string;
}

// Advanced Types for Complex Operations
export type SortDirection = "ASC" | "DESC";
export type FilterOperator =
  | "equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "between"
  | "in"
  | "not_in";
export type DataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "object";
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
