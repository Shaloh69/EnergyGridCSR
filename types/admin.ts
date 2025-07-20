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
  MaintenanceRecord,
  MaintenancePrediction,
  EquipmentPerformanceMetrics,
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
  MaintenanceRecord,
  MaintenancePrediction,
  EquipmentPerformanceMetrics,
} from "@/types/api-types";

// ✅ FIXED: Enhanced User Profile with server-computed activity statistics
export interface UserProfile {
  user: User;
  activityStatistics: {
    auditsConducted: number;
    maintenancePerformed: number;
    energyReadingsCreated: number;
    powerQualityReadingsCreated: number;
    alertsResolved: number;
  };
  performanceMetrics: {
    auditCompletionRate: number;
    averageAlertResponseTimeMinutes: number;
  };
  recentActivity?: {
    lastLogin: string;
    recentAudits: number;
    recentReadings: number;
  };
}

// ✅ FIXED: Enhanced Building with all server-computed performance metrics
export interface BuildingWithMetrics extends Building {
  // ✅ Server always provides these computed fields
  equipmentCount: number;
  auditCount: number;
  avgComplianceScore: number;
  lastEnergyReading: string;
  totalConsumptionKwh: number;
  avgPowerFactor: number;
  efficiencyScore: number;
  monthlyCostPhp: number;
  alertCount: number;
  maintenanceDueCount: number;

  // ✅ Additional server-computed fields from actual controller responses
  activeEquipment?: number;
  maintenanceEquipment?: number;
  faultyEquipment?: number;
  inactiveEquipment?: number;
  criticalAlerts?: number;
  highAlerts?: number;
  mediumAlerts?: number;
  lowAlerts?: number;
  energyEfficiencyRank?: number;
  carbonFootprintKgCo2?: number;
  renewableEnergyPercentage?: number;
  peakDemandKw?: number;
  offPeakConsumptionKwh?: number;
  powerQualityScore?: number;
  ieee519ComplianceRate?: number;
  iticComplianceRate?: number;
  violationsLast24h?: number;
}

// ✅ FIXED: Enhanced Equipment with all server maintenance insights
export interface EquipmentWithMaintenance extends Equipment {
  // ✅ Performance metrics (server-computed)
  maintenanceCostYtd: number;
  downtimeHoursYtd: number;
  efficiencyTrend: "improving" | "stable" | "declining";

  // ✅ Related data (server-provided)
  maintenanceHistory: MaintenanceRecord[];
  maintenancePredictions: MaintenancePrediction[];
  relatedAlerts: Alert[];
  performanceMetrics: EquipmentPerformanceMetrics;

  // ✅ Additional server-computed maintenance fields
  totalMaintenanceEvents?: number;
  preventiveMaintenancePercentage?: number;
  emergencyMaintenanceCount?: number;
  averageRepairTimeHours?: number;
  reliabilityScore?: number; // 0-100
  costPerOperationalHour?: number;
  failureRate?: number; // failures per year
  mtbfHours?: number; // Mean Time Between Failures
  mttrHours?: number; // Mean Time To Repair

  // ✅ Industry benchmarks (server-computed)
  industryBenchmarks?: {
    sampleSize: number;
    industryAvgUptime: number;
    industryAvgMaintenanceEfficiency: number;
    industryAvgMaintenanceCost: number;
    industryAvgEmergencyRate: number;
    performanceRanking:
      | "top_quartile"
      | "above_average"
      | "average"
      | "below_average";
    improvementPotential: number;
  };
}

// ✅ FIXED: Enhanced Energy Data with comprehensive analytics
export interface EnergyConsumptionData {
  buildingId: number;
  period: {
    startDate: string;
    endDate: string;
    interval: "hourly" | "daily" | "weekly" | "monthly";
  };
  summary: {
    totalConsumptionKwh: number;
    totalCostPhp: number;
    averageDailyConsumption: number;
    peakDemandKw: number;
    averagePowerFactor: number;
    carbonFootprintKgCo2: number;
  };
  dailyData: DailyEnergyData[];
  analytics: {
    efficiencyRating: string;
    baselineComparison: {
      variancePercentage: number;
      trend: "increasing" | "decreasing" | "stable";
    };
    costOptimization: {
      potentialMonthlySavings: number;
      recommendations: string[];
    };
  };

  // ✅ Additional server-computed energy analytics
  trends: {
    consumptionTrend: "increasing" | "decreasing" | "stable";
    costTrend: "increasing" | "decreasing" | "stable";
    efficiencyTrend: "improving" | "declining" | "stable";
    seasonalPatterns: Array<{
      month: number;
      avgConsumption: number;
      avgCost: number;
    }>;
  };

  forecasts?: {
    nextMonthConsumptionKwh: number;
    nextMonthCostPhp: number;
    confidenceLevel: number;
    forecastAccuracy: number;
  };

  anomalies?: Array<{
    date: string;
    type: "consumption" | "demand" | "cost" | "efficiency";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
  }>;
}

export interface DailyEnergyData {
  date: string;
  consumptionKwh: number;
  reactivePowerKvarh?: number;
  powerFactor: number;
  peakDemandKw: number;
  costPhp: number;
  costBreakdown: {
    energyCharge: number;
    demandCharge: number;
    taxesAndFees: number;
  };

  // ✅ Additional server-computed daily metrics
  efficiencyScore?: number;
  weatherImpact?: number;
  occupancyFactor?: number;
  baselineDeviation?: number;
  anomalyFlags?: string[];
}

// ✅ FIXED: Enhanced Power Quality Data with comprehensive analysis
export interface PowerQualityData {
  buildingId: number;
  summary: {
    totalReadings: number;
    ieee519ComplianceRate: number;
    iticComplianceRate: number;
    powerQualityScore: number;
    eventsDetected: number;
  };
  latestReading: {
    voltageQuality: {
      voltageL1: number;
      voltageL2: number;
      voltageL3: number;
      voltageUnbalance: number;
      thdVoltage: number;
      ieee519VoltageLimit: number;
      complianceStatus: "compliant" | "non_compliant";
    };
    currentQuality: {
      thdCurrent: number;
      ieee519CurrentLimit: number;
      complianceStatus: "compliant" | "non_compliant";
    };
  };
  events: PowerQualityEvent[];

  // ✅ Additional server-computed power quality analytics
  trends: {
    qualityTrend: "improving" | "declining" | "stable";
    violationTrend: "increasing" | "decreasing" | "stable";
    monthlyAnalysis: Array<{
      month: string;
      avgQualityScore: number;
      violationCount: number;
      complianceRate: number;
    }>;
  };

  recommendations: string[];

  costImpact: {
    estimatedAnnualCost: number;
    equipmentDamageRisk: "low" | "medium" | "high" | "critical";
    productivityImpact: number; // percentage
    potentialSavings: number;
  };

  equipmentVulnerability: Array<{
    equipmentId: number;
    equipmentName: string;
    vulnerabilityScore: number; // 0-100
    riskFactors: string[];
    protectionRecommendations: string[];
  }>;
}

// ✅ FIXED: Analytics and Insights with comprehensive server data
export interface AnalyticsData {
  analysisId: string;
  buildingId: number;
  energyAnalysis: {
    totalConsumptionKwh: number;
    efficiencyScore: number;
    costAnalysis: {
      totalCostPhp: number;
      potentialSavingsPhp: number;
    };
  };
  anomalyDetection: {
    anomaliesDetected: number;
    severityBreakdown: {
      high: number;
      medium: number;
      low: number;
      critical: number;
    };
  };
  efficiencyOpportunities: EfficiencyOpportunity[];
  recommendations: string[];

  // ✅ Additional server-computed analytics
  predictiveInsights: {
    maintenanceAlerts: Array<{
      equipmentId: number;
      equipmentName: string;
      predictedFailureDate: string;
      probability: number;
      recommendedAction: string;
    }>;
    energyForecasts: Array<{
      period: string;
      predictedConsumption: number;
      confidenceLevel: number;
    }>;
    costProjections: Array<{
      month: string;
      projectedCost: number;
      savingsOpportunities: number;
    }>;
  };

  benchmarkComparisons: {
    industryAverage: number;
    bestInClass: number;
    currentPerformance: number;
    improvementPotential: number;
    ranking: "top_10" | "top_25" | "average" | "below_average";
  };

  sustainabilityMetrics: {
    carbonReduction: number; // kg CO2
    renewableEnergyGoal: number; // percentage
    currentRenewablePercentage: number;
    sustainabilityScore: number; // 0-100
    certificationReadiness: {
      leed: number; // percentage ready
      breeam: number;
      energyStar: number;
    };
  };
}

export interface EfficiencyOpportunity {
  category: string;
  potentialSavingsKwh: number;
  potentialSavingsPhp: number;
  paybackMonths: number;
  priority: "low" | "medium" | "high" | "critical";
  description?: string;
  implementationCost?: number;
  annualSavings?: number;

  // ✅ Additional server-computed opportunity data
  feasibilityScore?: number; // 0-100
  riskLevel?: "low" | "medium" | "high";
  implementationComplexity?: "simple" | "moderate" | "complex";
  requiredSpecialists?: string[];
  expectedImplementationTime?: string;
  maintenanceImpact?: string;
  regulatoryConsiderations?: string[];
}

export interface Anomaly {
  id: string;
  type: "energy" | "power_quality" | "equipment";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  description: string;
  detectedValue: number;
  expectedValue: number;
  confidenceScore?: number;
  rootCauseAnalysis: {
    primaryCause: string;
    contributingFactors: string[];
    probabilityScore?: number;
  };
  recommendations: string[];
  status?: "new" | "investigating" | "resolved";

  // ✅ Additional server-computed anomaly data
  impactAssessment?: {
    financialImpact: number;
    operationalImpact: "minimal" | "moderate" | "significant" | "critical";
    safetyRisk: "low" | "medium" | "high" | "critical";
    environmentalImpact: "none" | "low" | "medium" | "high";
  };

  resolutionTracking?: {
    assignedTo: number;
    assignedDate: string;
    targetResolution: string;
    actualResolution?: string;
    resolutionCost?: number;
    lessonsLearned?: string[];
  };
}

// ✅ FIXED: Enhanced Real-time Metrics with comprehensive system data
export interface RealTimeMetrics {
  timestamp: string;
  currentEnergy: {
    totalDemandKw: number;
    totalConsumptionTodayKwh: number;
    averagePowerFactor: number;
  };
  buildingStatus: BuildingStatus[];
  activeAlerts: Alert[];
  systemStatus: {
    dataCollectionRate: number;
    systemUptimePercentage: number;
    activeConnections: number;
  };

  // ✅ Additional server real-time data
  performanceIndicators: {
    overallEfficiency: number;
    powerQualityScore: number;
    maintenanceCompliance: number;
    energyTargetProgress: number;
  };

  environmentalMetrics: {
    carbonFootprintToday: number;
    renewableEnergyPercentage: number;
    sustainabilityScore: number;
  };

  operationalHealth: {
    equipmentOnlinePercentage: number;
    criticalSystemsStatus:
      | "all_operational"
      | "some_issues"
      | "critical_failures";
    maintenanceBacklog: number;
    emergencyResponseReadiness: "ready" | "limited" | "not_ready";
  };
}

export interface BuildingStatus {
  buildingId: number;
  name: string;
  currentDemandKw: number;
  status: "normal" | "warning" | "critical";
  alertCount: number;
  lastReadingTimestamp?: string;
  dataQualityScore?: number;
  equipmentOnline?: number;
  equipmentTotal?: number;

  // ✅ Additional server-computed building status fields
  efficiencyStatus?: "excellent" | "good" | "fair" | "poor";
  powerQualityStatus?: "compliant" | "warning" | "violation";
  maintenanceStatus?: "current" | "due_soon" | "overdue";
  occupancyLevel?: number; // percentage
  securityStatus?: "secure" | "alert" | "breach";
  hvacStatus?: "optimal" | "adjusting" | "fault";
  lightingStatus?: "optimal" | "dimmed" | "fault";
}

// ✅ FIXED: Enhanced Monitoring Dashboard with comprehensive system metrics
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
  performanceMetrics: {
    dataCollectionRate: number;
    systemUptimePercentage: number;
    apiResponseTimeMs?: number;
    databaseQueryTimeMs?: number;
  };

  // ✅ Additional server monitoring metrics
  resourceUtilization: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkThroughput: number;
    databaseConnections: number;
    cacheHitRate: number;
  };

  alertTrends: {
    last24Hours: number[];
    resolutionRate: number;
    averageResponseTime: number;
    escalationRate: number;
  };

  dataQuality: {
    overallScore: number;
    missingDataPoints: number;
    anomalousReadings: number;
    sensorHealthScore: number;
    calibrationStatus: "current" | "due" | "overdue";
  };

  predictiveAlerts: Array<{
    type: "maintenance" | "failure" | "threshold_breach";
    equipmentId: number;
    probability: number;
    timeframe: string;
    recommendation: string;
  }>;
}

// Chart Data Types for UI Components
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;

  // ✅ Additional chart data properties
  confidence?: number;
  forecast?: boolean;
  anomaly?: boolean;
  threshold?: number;
  target?: number;
}

export interface TimeSeriesData {
  name: string;
  data: ChartDataPoint[];
  color?: string;

  // ✅ Additional time series properties
  unit?: string;
  aggregation?: "sum" | "average" | "max" | "min";
  forecast?: boolean;
  confidence?: number;
  trend?: "increasing" | "decreasing" | "stable";
}

// Navigation Types for Admin Interface
export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  children?: NavItem[];

  // ✅ Additional navigation properties
  permissions?: string[];
  roles?: string[];
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  shortcut?: string;
}

// ✅ FIXED: Enhanced Dashboard Metrics with all server data
export interface DashboardMetrics {
  overview: DashboardOverview;
  energySummary: EnergySummary;
  powerQualitySummary: PowerQualitySummary;
  auditSummary: AuditSummary;
  complianceSummary: ComplianceSummary;
  alertStatistics: AlertStatistics;
  realTimeMetrics: RealTimeMetrics;
  lastUpdated: string;

  // ✅ Additional dashboard metrics
  trends: {
    energyEfficiency: TimeSeriesData;
    costOptimization: TimeSeriesData;
    maintenancePerformance: TimeSeriesData;
    complianceScore: TimeSeriesData;
  };

  targets: {
    energyReduction: number; // percentage
    costSavings: number; // PHP
    maintenanceEfficiency: number; // percentage
    complianceScore: number; // 0-100
  };

  achievements: Array<{
    milestone: string;
    achievedDate: string;
    value: number;
    unit: string;
    impact: string;
  }>;
}

// ✅ FIXED: System Administration Types with comprehensive server data
export interface SystemConfiguration {
  apiVersion: string;
  environment: string;
  featuresEnabled: string[];
  monitoringEnabled: boolean;
  cacheEnabled: boolean;
  realTimeUpdates: boolean;
  backupStatus: {
    lastBackup: string;
    nextBackup: string;
    backupSizeMb: number;
    backupStatus: "completed" | "running" | "failed";
  };
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  security: {
    jwtExpiryMinutes: number;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
    };
  };

  // ✅ Additional system configuration
  integrations: {
    weatherApi: boolean;
    emailService: boolean;
    smsService: boolean;
    pushNotifications: boolean;
    externalAnalytics: boolean;
  };

  maintenance: {
    scheduledDowntime: string[];
    maintenanceWindow: string;
    autoUpdatesEnabled: boolean;
    updateChannel: "stable" | "beta" | "development";
  };

  compliance: {
    dataRetentionDays: number;
    auditLogRetentionDays: number;
    encryptionEnabled: boolean;
    complianceMode: boolean;
    certifications: string[];
  };
}

export interface UserManagement {
  totalUsers: number;
  activeUsers: number;
  userRoles: {
    admin: number;
    energyManager: number;
    facilityEngineer: number;
    staff: number;
    student: number;
  };
  recentLogins: {
    userId: number;
    userName: string;
    loginTime: string;
    ipAddress: string;
    userAgent?: string;
    sessionDuration?: number;
  }[];
  failedLoginAttempts: number;
  lockedAccounts: number;
  passwordResetRequests: number;

  // ✅ Additional user management metrics
  userActivity: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    peakUsageHours: string[];
  };

  securityMetrics: {
    suspiciousActivity: number;
    multiFactorAuthEnabled: number;
    strongPasswords: number;
    lastSecurityAudit: string;
  };

  permissions: {
    totalPermissions: number;
    customRoles: number;
    inheritanceChains: number;
    orphanedPermissions: number;
  };
}

// ✅ Advanced Admin Analytics Types
export interface AdminAnalytics {
  userEngagement: {
    loginFrequency: Record<string, number>;
    featureUsage: Record<string, number>;
    sessionDurations: number[];
    deviceTypes: Record<string, number>;
    browserStats: Record<string, number>;
  };

  systemPerformance: {
    apiResponseTimes: number[];
    databaseQueryTimes: number[];
    cacheHitRates: number[];
    errorRates: Record<string, number>;
    uptimeMetrics: {
      daily: number[];
      weekly: number[];
      monthly: number[];
    };
  };

  businessMetrics: {
    energySavings: {
      totalSavingsKwh: number;
      costSavingsPhp: number;
      carbonReductionKg: number;
      savingsGoalProgress: number;
    };

    operationalEfficiency: {
      maintenanceEfficiencyScore: number;
      alertResolutionTime: number;
      complianceScore: number;
      equipmentUptime: number;
    };

    financialImpact: {
      totalCostSavings: number;
      preventedDowntimeCost: number;
      maintenanceOptimization: number;
      energyOptimization: number;
    };
  };

  predictiveAnalytics: {
    maintenanceForecasts: Array<{
      equipmentId: number;
      predictedFailureDate: string;
      probability: number;
      estimatedCost: number;
    }>;

    energyForecasts: Array<{
      buildingId: number;
      forecastPeriod: string;
      predictedConsumption: number;
      confidenceInterval: [number, number];
    }>;

    alertPredictions: Array<{
      type: string;
      probability: number;
      timeframe: string;
      preventiveActions: string[];
    }>;
  };
}

// ✅ Enhanced Reporting Types
export interface ReportingDashboard {
  reportGeneration: {
    totalReports: number;
    reportsThisMonth: number;
    popularReportTypes: Record<string, number>;
    averageGenerationTime: number;
    successRate: number;
  };

  reportUsage: {
    downloadStats: Record<string, number>;
    viewStats: Record<string, number>;
    shareStats: Record<string, number>;
    userPreferences: Record<string, string[]>;
  };

  automatedReports: {
    scheduledReports: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    subscriptionStats: Record<string, number>;
  };

  customReports: {
    totalCustomReports: number;
    activeTemplates: number;
    mostUsedTemplates: Array<{
      name: string;
      usageCount: number;
      lastUsed: string;
    }>;
  };
}

// ✅ Advanced System Health Types
export interface SystemHealthDashboard {
  infrastructure: {
    serverHealth: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      networkLatency: number;
      loadAverage: number[];
    };

    databaseHealth: {
      connectionCount: number;
      queryPerformance: number;
      diskSpace: number;
      backupStatus: string;
      replicationLag: number;
    };

    cacheHealth: {
      hitRate: number;
      memoryUsage: number;
      evictionRate: number;
      connectionCount: number;
    };
  };

  security: {
    threats: {
      blockedIps: number;
      suspiciousRequests: number;
      rateLimitHits: number;
      authenticationFailures: number;
    };

    compliance: {
      dataEncryption: boolean;
      accessLogging: boolean;
      auditTrail: boolean;
      gdprCompliance: boolean;
    };
  };

  monitoring: {
    alerting: {
      activeAlerts: number;
      resolvedAlerts: number;
      escalatedAlerts: number;
      averageResolutionTime: number;
    };

    dataQuality: {
      missingDataPoints: number;
      anomalousReadings: number;
      validationErrors: number;
      dataFreshness: number;
    };
  };
}

// Continue with remaining types...
// [Rest of the file would continue with the same pattern of enhanced types]

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

// ✅ Enhanced Filter and Search Types
export interface AdvancedFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  dataType: DataType;
  logicalOperator?: "AND" | "OR";
  caseSensitive?: boolean;
  group?: string;
}

export interface SearchConfiguration {
  searchableFields: string[];
  filters: AdvancedFilter[];
  sorting: {
    field: string;
    direction: SortDirection;
  }[];
  pagination: {
    page: number;
    limit: number;
    maxLimit: number;
  };
  aggregations?: {
    field: string;
    type: "count" | "sum" | "avg" | "min" | "max";
  }[];
}

// ✅ Enhanced Notification Types
export interface NotificationPreferences {
  userId: number;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  alertTypes: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  frequency: "immediate" | "hourly" | "daily" | "weekly";
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  customRules: Array<{
    condition: string;
    action: string;
    enabled: boolean;
  }>;
}

// ✅ Enhanced Audit Trail Types
export interface AuditTrail {
  id: string;
  userId: number;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  outcome: "success" | "failure" | "partial";
  errorMessage?: string;
  metadata: Record<string, any>;
}

// ✅ Enhanced Backup and Recovery Types
export interface BackupConfiguration {
  strategy: "full" | "incremental" | "differential";
  schedule: {
    frequency: "hourly" | "daily" | "weekly" | "monthly";
    time: string;
    daysOfWeek?: number[];
    timezone: string;
  };
  retention: {
    dailyBackups: number;
    weeklyBackups: number;
    monthlyBackups: number;
    yearlyBackups: number;
  };
  storage: {
    location: "local" | "cloud" | "hybrid";
    encryption: boolean;
    compression: boolean;
    verification: boolean;
  };
  monitoring: {
    alertOnFailure: boolean;
    alertEmails: string[];
    healthChecks: boolean;
  };
}

// ✅ Integration Configuration Types
export interface IntegrationConfiguration {
  id: string;
  name: string;
  type: "api" | "webhook" | "database" | "file" | "email";
  status: "active" | "inactive" | "error" | "pending";
  configuration: {
    endpoint?: string;
    authentication: {
      type: "none" | "basic" | "bearer" | "oauth" | "api_key";
      credentials: Record<string, string>;
    };
    headers?: Record<string, string>;
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      retryDelay: number;
      exponentialBackoff: boolean;
    };
  };
  dataMapping: {
    incoming: Record<string, string>;
    outgoing: Record<string, string>;
  };
  monitoring: {
    lastSync: string;
    syncStatus: "success" | "failure" | "partial";
    errorCount: number;
    successRate: number;
  };
}

// ✅ Enhanced Permission System Types
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  inheritance: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[];
  restrictions?: {
    ipWhitelist?: string[];
    timeRestrictions?: {
      allowedHours: string[];
      allowedDays: number[];
    };
  };
}

export interface UserPermissions {
  userId: number;
  roles: Role[];
  directPermissions: Permission[];
  effectivePermissions: Permission[];
  restrictions: {
    dataAccess: string[];
    features: string[];
    timeRestrictions?: {
      allowedHours: string[];
      allowedDays: number[];
    };
  };
}

// ✅ Enhanced API Rate Limiting Types
export interface RateLimitConfiguration {
  global: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  perUser: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  perEndpoint: Record<
    string,
    {
      requestsPerMinute: number;
      requestsPerHour: number;
    }
  >;
  exemptions: {
    userIds: number[];
    ipAddresses: string[];
    endpoints: string[];
  };
  actions: {
    onExceeded: "block" | "throttle" | "queue";
    blockDuration: number;
    notifyAdmins: boolean;
  };
}

// ✅ Data Export/Import Types
export interface DataExportConfiguration {
  format: "json" | "csv" | "xlsx" | "xml" | "sql";
  entities: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: AdvancedFilter[];
  includeMetadata: boolean;
  compression: boolean;
  encryption: boolean;
  delivery: {
    method: "download" | "email" | "ftp" | "api";
    destination?: string;
    schedule?: {
      frequency: "once" | "daily" | "weekly" | "monthly";
      time: string;
    };
  };
}

export interface DataImportConfiguration {
  source: {
    type: "file" | "api" | "database" | "csv" | "json";
    location: string;
    authentication?: Record<string, string>;
  };
  mapping: {
    fieldMappings: Record<string, string>;
    defaultValues: Record<string, any>;
    transformations: Array<{
      field: string;
      type: "format" | "calculate" | "lookup" | "validate";
      configuration: Record<string, any>;
    }>;
  };
  validation: {
    required: string[];
    formats: Record<string, string>;
    ranges: Record<string, [number, number]>;
    customRules: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
  };
  behavior: {
    onDuplicate: "skip" | "update" | "error";
    onError: "continue" | "abort";
    batchSize: number;
    dryRun: boolean;
  };
}

// ✅ Final Export Types
export interface AdminDashboardData {
  systemOverview: SystemHealthDashboard;
  userManagement: UserManagement;
  analytics: AdminAnalytics;
  reporting: ReportingDashboard;
  configuration: SystemConfiguration;
  monitoring: MonitoringDashboard;
  auditTrail: AuditTrail[];
  integrations: IntegrationConfiguration[];
}

// Type Utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
