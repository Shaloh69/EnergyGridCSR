// types/admin.ts

import {
  Alert,
  AlertStatistics,
  Audit,
  AuditSummary,
  Building,
  ComplianceCheck,
  ComplianceSummary,
  DashboardOverview,
  EnergySummary,
  Equipment,
  MaintenanceSchedule,
  PowerQualityEvent,
  PowerQualitySummary,
  User,
} from "./api-types";

// Re-export enhanced types from api-types for backward compatibility
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
} from "./api-types";

// Base API Response (maintaining backward compatibility)
export interface Pagination {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
}

// Enhanced User Profile with activity statistics
export interface UserProfile {
  user: User;
  activity_statistics: {
    audits_conducted: number;
    maintenance_performed: number;
    energy_readings_created: number;
    alerts_resolved: number;
  };
  performance_metrics: {
    audit_completion_rate: number;
    average_alert_response_time_minutes: number;
  };
}

// Enhanced Building with performance metrics
export interface BuildingWithMetrics extends Building {
  equipment_count: number;
  audit_count: number;
  avg_compliance_score: number;
  last_energy_reading: string;
  total_consumption_kwh: number;
  avg_power_factor: number;
}

// Enhanced Equipment with maintenance insights
export interface EquipmentWithMaintenance extends Equipment {
  age_years: number;
  maintenance_interval_days: number;
  next_maintenance_date: string;
  last_maintenance_date: string;
  predicted_maintenance_date: string;
  maintenance_risk_level: string;
  active_alerts: number;
  health_status: "excellent" | "good" | "fair" | "poor" | "critical";
  maintenance_urgency: number; // 0-100
}

// Enhanced Energy Data with analytics
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
  active_power_kwh: number;
  reactive_power_kvarh: number;
  power_factor: number;
  peak_demand_kw: number;
  cost_php: number;
  cost_breakdown: {
    energy_charge: number;
    demand_charge: number;
    taxes_and_fees: number;
  };
}

// Enhanced Power Quality Data
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

// Analytics and Insights
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
  priority: "low" | "medium" | "high";
  description?: string;
}

export interface Anomaly {
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

// Enhanced Real-time Metrics
export interface RealTimeMetrics {
  timestamp: string;
  current_energy: {
    total_demand_kw: number;
    total_consumption_today_kwh: number;
    average_power_factor: number;
  };
  building_status: BuildingStatus[];
  active_alerts: Alert[];
}

export interface BuildingStatus {
  building_id: number;
  name: string;
  current_demand_kw: number;
  status: "normal" | "warning" | "critical";
  alert_count: number;
}

// Enhanced Monitoring Dashboard
export interface MonitoringDashboard {
  systemStats: {
    totalBuildings: number;
    totalAlerts: number;
    criticalAlerts: number;
    connectedUsers: number;
  };
  buildings: BuildingStatus[];
  performance_metrics: {
    data_collection_rate: number;
    system_uptime_percentage: number;
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

// Enhanced Dashboard Metrics
export interface DashboardMetrics {
  overview: DashboardOverview;
  energy_summary: EnergySummary;
  power_quality_summary: PowerQualitySummary;
  audit_summary: AuditSummary;
  compliance_summary: ComplianceSummary;
  alert_statistics: AlertStatistics;
  real_time_metrics: RealTimeMetrics;
}

// System Administration Types
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
  };
}

export interface UserManagement {
  total_users: number;
  active_users: number;
  user_roles: {
    admin: number;
    energy_manager: number;
    auditor: number;
    technician: number;
    viewer: number;
  };
  recent_logins: {
    user_id: number;
    user_name: string;
    login_time: string;
    ip_address: string;
  }[];
}

// Maintenance and Operations
export interface MaintenanceOverview {
  scheduled_maintenance: MaintenanceSchedule;
  predictive_insights: {
    equipment_at_risk: number;
    predicted_failures: {
      equipment_id: number;
      equipment_name: string;
      failure_probability: number;
      recommended_action: string;
      timeline: string;
    }[];
  };
  maintenance_costs: {
    monthly_budget: number;
    actual_spending: number;
    projected_savings: number;
  };
}

// Advanced Analytics Dashboard
export interface AnalyticsDashboard {
  energy_insights: {
    efficiency_trends: TimeSeriesData[];
    cost_optimization_opportunities: EfficiencyOpportunity[];
    baseline_comparisons: {
      building_id: number;
      building_name: string;
      current_vs_baseline: number;
      improvement_potential: number;
    }[];
  };
  power_quality_insights: {
    compliance_trends: TimeSeriesData[];
    event_patterns: {
      event_type: string;
      frequency: number;
      cost_impact: number;
    }[];
    improvement_recommendations: string[];
  };
  predictive_analytics: {
    equipment_health_forecast: {
      equipment_id: number;
      health_trajectory: "improving" | "stable" | "declining";
      maintenance_window: string;
    }[];
    energy_demand_forecast: TimeSeriesData[];
    anomaly_predictions: Anomaly[];
  };
}

// Compliance and Audit Management
export interface ComplianceManagement {
  standards_overview: {
    standard: string;
    overall_compliance: number;
    buildings_compliant: number;
    total_buildings: number;
    critical_violations: number;
    improvement_trend: "improving" | "stable" | "declining";
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
    }[];
  };
  compliance_alerts: {
    critical_issues: ComplianceCheck[];
    upcoming_deadlines: {
      requirement: string;
      due_date: string;
      building_name: string;
      priority: string;
    }[];
  };
}

// Report Management and Analytics
export interface ReportAnalytics {
  generation_statistics: {
    total_reports: number;
    reports_this_month: number;
    success_rate: number;
    average_generation_time: number;
  };
  popular_reports: {
    report_type: string;
    generation_count: number;
    download_count: number;
    user_satisfaction: number;
  }[];
  scheduled_reports: {
    id: number;
    title: string;
    frequency: string;
    next_generation: string;
    recipients: string[];
    status: string;
  }[];
  storage_utilization: {
    total_storage_mb: number;
    used_storage_mb: number;
    cleanup_recommendations: string[];
  };
}

// Advanced Filtering and Search
export interface AdvancedFilter {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "between"
    | "in";
  value: any;
  logical_operator?: "AND" | "OR";
}

export interface SearchQuery {
  query: string;
  filters: AdvancedFilter[];
  sort_by: string;
  sort_order: "ASC" | "DESC";
  page: number;
  limit: number;
}

// Data Export and Import
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
  }[];
  processing_time_ms: number;
}

// Notification and Alert Management
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
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
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
}

// Integration and API Management
export interface APIUsageStats {
  endpoint: string;
  total_requests: number;
  success_rate: number;
  average_response_time_ms: number;
  error_rate: number;
  peak_usage_time: string;
  rate_limit_hits: number;
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
}

// Performance and Optimization
export interface PerformanceMetrics {
  database_performance: {
    query_count: number;
    slow_queries: number;
    average_query_time_ms: number;
    connection_pool_usage: number;
  };
  cache_performance: {
    hit_rate: number;
    miss_rate: number;
    eviction_rate: number;
    memory_usage_mb: number;
  };
  api_performance: {
    requests_per_second: number;
    average_response_time_ms: number;
    error_rate: number;
    concurrent_users: number;
  };
  system_resources: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: number;
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
}

// Security and Access Control
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
}

export interface AccessControlMatrix {
  role: string;
  permissions: {
    resource: string;
    actions: ("create" | "read" | "update" | "delete" | "export" | "admin")[];
  }[];
}

// Backup and Recovery
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
