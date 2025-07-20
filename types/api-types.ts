// types/api-types.ts - Enhanced with Complete Report Generation Types

/**
 * ✅ ENHANCED: Complete API types with comprehensive report generation support
 * All types aligned with backend implementation and new report generation features
 */

// ===== CORE API TYPES =====

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "energy_manager" | "facility_engineer" | "staff" | "student";
  status?: "active" | "inactive" | "suspended";
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  profilePicture?: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType?: string;
  };
}

export interface Building {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  areaSqm?: number;
  floors?: number;
  yearBuilt?: number;
  buildingType?: "commercial" | "industrial" | "residential" | "institutional";
  status?: "active" | "maintenance" | "inactive";
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt?: string;
  updatedAt?: string;

  // Server-computed fields
  equipmentCount?: number;
  auditCount?: number;
  avgComplianceScore?: number;
  lastEnergyReading?: string;
  totalConsumptionKwh?: number;
  avgPowerFactor?: number;
  efficiencyScore?: number;
  monthlyCostPhp?: number;
  alertCount?: number;
  maintenanceDueCount?: number;
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
  offPeakConsumptionKwh?: number;
  powerQualityScore?: number;
  ieee519ComplianceRate?: number;
  iticComplianceRate?: number;
  violationsLast24h?: number;
}

export interface Equipment {
  id: number;
  name: string;
  code?: string;
  buildingId: number;
  buildingName?: string;
  buildingCode?: string;
  buildingType?: string;
  equipmentType:
    | "hvac"
    | "lighting"
    | "electrical"
    | "manufacturing"
    | "security"
    | "other";
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  powerRatingKw?: number;
  voltageRating?: number;
  currentRatingA?: number;
  installationDate?: string;
  warrantyExpiry?: string;
  location?: string;
  floor?: number;
  room?: string;
  status?: "active" | "maintenance" | "faulty" | "inactive";
  conditionScore?: number;
  qrCode?: string;
  barcode?: string;
  notes?: string;
  maintenanceSchedule?: "weekly" | "monthly" | "quarterly" | "annually";
  createdAt?: string;
  updatedAt?: string;

  // Server-computed fields
  ageYears?: number;
  maintenanceIntervalDays?: number;
  nextMaintenanceDate?: string;
  lastMaintenanceDate?: string;
  predictedMaintenanceDate?: string;
  maintenanceRiskLevel?: "low" | "medium" | "high" | "critical";
  activeAlerts?: number;
  healthStatus?: "excellent" | "good" | "fair" | "poor" | "critical";
  maintenanceUrgency?: number;
  maintenanceStatus?:
    | "overdue"
    | "due_soon"
    | "current"
    | "overdue_by_schedule";
  scheduledMaintenanceDate?: string;
  scheduledMaintenanceStatus?: string;
  maintenanceCostYtd?: number;
  downtimeHoursYtd?: number;
  efficiencyTrend?: "improving" | "stable" | "declining";
  totalMaintenanceEvents?: number;
  preventiveMaintenancePercentage?: number;
  emergencyMaintenanceCount?: number;
  averageRepairTimeHours?: number;
  reliabilityScore?: number;
  costPerOperationalHour?: number;
  failureRate?: number;
  mtbfHours?: number;
  mttrHours?: number;
}

export interface MaintenanceRecord {
  id: number;
  equipmentId: number;
  maintenanceType:
    | "preventive"
    | "corrective"
    | "emergency"
    | "predictive"
    | "inspection";
  description: string;
  workPerformed?: string;
  technicianId?: number;
  technicianName?: string;
  technicianFirstName?: string;
  technicianLastName?: string;
  scheduledDate?: string;
  completedDate?: string;
  downtimeMinutes?: number;
  cost?: number;
  partsUsed?: string[];
  maintenanceNotes?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt?: string;
}

export interface MaintenancePrediction {
  id: number;
  equipmentId: number;
  predictedDate: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidenceScore: number;
  failureProbability: number;
  recommendedAction: string;
  timeline: string;
  estimatedCost: number;
  createdAt: string;
}

export interface EquipmentPerformanceMetrics {
  totalMaintenanceCount: number;
  totalDowntimeMinutes: number;
  averageMaintenanceCost: number;
  totalMaintenanceCost: number;
  emergencyMaintenanceCount: number;
  preventiveMaintenanceCount: number;
  correctiveMaintenanceCount: number;
  predictiveMaintenanceCount: number;
  totalOperationalHours: number;
  mtbfHours?: number;
  mttrHours?: number;
  efficiencyScore: number;
  costEfficiency: number;
  failureRate: number;
}

export interface EnergyReading {
  id?: number;
  buildingId: number;
  equipmentId?: number;
  meterId?: string;
  readingType?: "automatic" | "manual" | "estimated";
  consumptionKwh: number;
  recordedAt: string;
  costPhp?: number;
  meterReading?: number;
  demandKw?: number;
  powerFactor?: number;
  energyType?: "electrical" | "solar" | "generator" | "others";
  reactivePowerKvarh?: number;
  apparentPowerKvah?: number;
  voltageV?: number;
  currentA?: number;
  frequencyHz?: number;
  peakDemandKw?: number;
  offPeakConsumptionKwh?: number;
  peakConsumptionKwh?: number;
  temperatureC?: number;
  humidityPercent?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PowerQualityReading {
  id?: number;
  buildingId: number;
  equipmentId?: number;
  measurementPoint?: string;
  voltageL1?: number;
  voltageL2?: number;
  voltageL3?: number;
  voltageNeutral?: number;
  currentL1?: number;
  currentL2?: number;
  currentL3?: number;
  currentNeutral?: number;
  powerFactor?: number;
  thdVoltage?: number;
  thdCurrent?: number;
  frequency?: number;
  voltageUnbalance?: number;
  currentUnbalance?: number;
  flickerPst?: number;
  flickerPlt?: number;
  recordedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PowerQualityEvent {
  id?: number;
  buildingId?: number;
  equipmentId?: number;
  eventType:
    | "Voltage Sag"
    | "Voltage Swell"
    | "Voltage Out of Range"
    | "High Voltage THD"
    | "High Current THD"
    | "Frequency Deviation"
    | "Low Power Factor"
    | "Voltage Unbalance";
  severityLevel: "low" | "medium" | "high" | "critical";
  startTime: string;
  endTime?: string;
  durationEstimate: string;
  magnitude: number;
  impactScore: number;
  standardsViolated: string[];
  affectedPhases?: ("L1" | "L2" | "L3" | "N")[];
  iticCurveViolation?: boolean;
  estimatedCost?: number;
  rootCause?: string;
  equipmentAffected?: number[];
  recoveryTimeMs?: number;
  recordedAt?: string;
  voltageL1?: number;
  thdVoltage?: number;
  frequency?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Alert {
  id: number;
  type:
    | "energy_anomaly"
    | "power_quality"
    | "equipment_failure"
    | "compliance_violation"
    | "maintenance_due"
    | "efficiency_degradation"
    | "threshold_exceeded";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved" | "escalated" | "closed";
  priority?: "low" | "normal" | "high" | "urgent";
  title: string;
  message: string;
  description?: string;
  buildingId?: number;
  buildingName?: string;
  equipmentId?: number;
  equipmentName?: string;
  auditId?: number;
  energyReadingId?: number;
  pqReadingId?: number;
  detectedValue?: number;
  thresholdValue?: number;
  unit?: string;
  urgency?: string;
  estimatedCostImpact?: number;
  estimatedDowntimeHours?: number;
  assignedTo?: number;
  assignedUserName?: string;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  resolutionNotes?: string;
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  escalationLevel?: number;
  escalatedTo?: number;
  ageMinutes?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  notificationSent?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Audit {
  id: number;
  title: string;
  description?: string;
  auditType:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  status: "planned" | "in_progress" | "completed" | "cancelled" | "on_hold";
  buildingId: number;
  buildingName?: string;
  auditorId: number;
  auditorName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedDurationHours?: number;
  actualDurationHours?: number;
  complianceScore?: number;
  energySavingsPotentialKwh?: number;
  costSavingsPotentialPhp?: number;
  implementationCostPhp?: number;
  paybackPeriodMonths?: number;
  auditCode?: string;
  progressPercentage?: number;
  nextAuditDue?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ComplianceStandard {
  standard: "PEC2017" | "OSHS" | "ISO25010" | "RA11285";
  name: string;
  description?: string;
  score: number;
  maxScore: number;
  percentage: number;
  status:
    | "compliant"
    | "non_compliant"
    | "partially_compliant"
    | "not_assessed";
  violations?: number;
  criticalViolations?: number;
  lastAssessment?: string;
  nextAssessmentDue?: string;
  requirementsMet: number;
  totalRequirements: number;
}

export interface ComplianceCheck {
  id: number;
  auditId: number;
  standard: string;
  standardType?: "PEC2017" | "OSHS" | "ISO25010" | "RA11285";
  requirementCode: string;
  requirementTitle: string;
  requirementDescription?: string;
  category: string;
  sectionCode?: string;
  status:
    | "passed"
    | "failed"
    | "warning"
    | "not_applicable"
    | "not_checked"
    | "compliant"
    | "non_compliant";
  checkDescription?: string;
  details?: string;
  measuredValue?: number;
  requiredValue?: number;
  tolerance?: number;
  unit?: string;
  evidence?: string;
  notes?: string;
  recommendation?: string;
  correctiveAction?: string;
  responsibleParty?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  dueDate?: string;
  verificationMethod?: string;
  assessorId: number;
  assessmentDate: string;
  severity?: "low" | "medium" | "high" | "critical";
  costToFix?: number;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ✅ ENHANCED: Complete Report Interface with Comprehensive Support
export interface Report {
  id: number;
  title: string;
  description?: string;
  type:
    | "energy_consumption"
    | "power_quality"
    | "audit_summary"
    | "compliance"
    | "monitoring";
  format: "pdf" | "excel" | "csv" | "html";
  status: "generating" | "completed" | "failed" | "cancelled";

  // Relationships
  buildingId?: number;
  buildingName?: string;
  buildingCode?: string;
  auditId?: number;
  auditTitle?: string;
  auditStatus?: string;
  auditType?: string;

  // Request details
  requestedBy: number;
  requesterName?: string;
  generatedBy?: number;
  generatedByName?: string;
  generatedByEmail?: string;

  // Report parameters - Enhanced for comprehensive reports
  parameters: {
    startDate?: string;
    endDate?: string;
    includeCharts?: boolean;
    includeRawData?: boolean;
    includeRecommendations?: boolean;
    includeComparison?: boolean;
    includeTrends?: boolean;
    includeEvents?: boolean;
    includeCompliance?: boolean;
    includeGapAnalysis?: boolean;
    includeImplementationPlan?: boolean; // New for comprehensive audit reports
    sections?: string[];
    filters?: Record<string, any>;
    reportFormat?: string;
    reportTypes?: string[];
    standards?: string[]; // For compliance reports
  };

  // File details
  fileSizeMb?: number;
  filePath?: string;
  downloadUrl?: string;
  downloadCount?: number;
  expiresAt?: string;
  fileAvailable?: boolean;
  ageMinutes?: number;

  // Generation metrics
  generationTimeSeconds?: number;
  errorMessage?: string;

  // Enhanced data for comprehensive reports
  data?: {
    // Common report data
    total_records?: number;
    total_consumption?: number;
    total_cost?: number;

    // Audit-specific data
    audit_id?: number;
    compliance_checks_count?: number;
    total_ecos?: number; // Energy Conservation Opportunities
    total_annual_savings_php?: number;
    total_implementation_cost_php?: number;
    average_payback_years?: number;
    baseline_consumption_kwh?: number;
    baseline_cost_php?: number;
    overall_score?: number;

    // Power quality data
    readings_count?: number;
    violations_count?: number;
    compliance_score?: number;

    // Compliance data
    non_compliant_count?: number;
    standards_analyzed?: string[];

    // Report generation metadata
    generation_started?: string;
    generation_completed?: string;
    processing_time_ms?: number;
  };

  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

// ✅ ENHANCED: Report Detail Interface for UI
export interface ReportDetailed extends Report {
  // Additional computed fields for UI
  file_available?: boolean;
  file_size_mb?: number;
  age_minutes?: number;
  building_name?: string;
  building_code?: string;
  audit_title?: string;
  audit_status?: string;
  audit_type?: string;
  generated_by_name?: string;
  generated_by_email?: string;

  // Summary information for display
  summary?: {
    report_type: string;
    status: string;
    generated_at: string;
    file_available: boolean;

    // Type-specific summaries
    energy_summary?: {
      total_consumption: number;
      period_days: number;
      buildings_analyzed: number;
    };

    power_quality_summary?: {
      readings_analyzed: number;
      violations_found: number;
      compliance_score: number;
    };

    // Enhanced audit summary for comprehensive reports
    audit_summary?: {
      compliance_checks: number;
      energy_conservation_opportunities: number;
      total_annual_savings_php: number;
      total_implementation_cost_php: number;
      average_payback_years: number;
      baseline_consumption_kwh: number;
      baseline_cost_php: number;
      overall_score: number;
    };

    compliance_summary?: {
      compliance_checks: number;
      non_compliant_items: number;
      overall_score: number;
    };
  };

  // Enhanced metadata
  generation_time?: string;
  status_description?: string;
  download_available?: boolean;
}

export interface BackgroundJob {
  id: number;
  type:
    | "analytics_processing"
    | "maintenance_prediction"
    | "compliance_analysis"
    | "efficiency_analysis"
    | "anomaly_detection";
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  progressPercentage: number;
  startedBy: number;
  startedByName?: string;
  parameters: Record<string, any>;
  result?: any;
  errorMessage?: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  executionTimeSeconds?: number;
  retries?: number;
  maxRetries?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metadata?: {
    requestId: string;
    responseTimeMs: number;
    apiVersion: string;
    timestamp: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  errorCode?: string;
  details?: Record<string, any>;
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  requestId?: string;
  timestamp?: string;
}

export interface DashboardOverview {
  timestamp: string;
  systemHealth: {
    overallScore: number;
    status: "excellent" | "good" | "fair" | "poor" | "critical";
    uptimePercentage: number;
    dataQualityScore: number;
  };
  buildingPortfolio: {
    totalBuildings: number;
    activeBuildings: string | number;
    buildingsInMaintenance: string | number;
    totalAreaSqm: string | number;
    averageEfficiencyScore: string | number;
  };
  energyPerformance: {
    totalConsumptionTodayKwh: string | number;
    totalConsumptionMonthKwh: string | number;
    monthlyCostPhp: string | number;
    efficiencyVsBaseline: number;
    carbonFootprintKgCo2: number;
    renewableEnergyPercentage: number;
  };
  alertsSummary: {
    activeCritical: number;
    activeHigh: number;
    activeMedium: number;
    activeLow: number;
    totalActive: number;
    averageResponseTimeMinutes: number;
    resolutionRate24h: number;
  };
  equipmentStatus: {
    totalEquipment: number;
    operational: string | number;
    maintenanceRequired: string | number;
    offline: string | number;
    averageConditionScore: string | number;
  };
  complianceStatus: {
    overallComplianceScore: string | number;
    ieee519Compliance: string | number;
    pec2017Compliance: number;
    oshsCompliance: number;
    ra11285Compliance: number;
    upcomingAudits: string | number;
  };
  costOptimization: {
    identifiedSavingsPhp: number;
    implementedSavingsPhp: number;
    potentialMonthlySavings: number;
    roiPercentage: number;
  };
}

// ===== QUERY PARAMETER INTERFACES =====

export interface BuildingQueryParams {
  search?: string;
  status?: "active" | "maintenance" | "inactive";
  buildingType?: "commercial" | "industrial" | "residential" | "institutional";
  sortBy?: "name" | "code" | "areaSqm" | "floors" | "yearBuilt" | "createdAt";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
  minArea?: number;
  maxArea?: number;
  yearBuiltFrom?: number;
  yearBuiltTo?: number;
}

export interface EquipmentQueryParams {
  buildingId?: number;
  equipmentType?:
    | "hvac"
    | "lighting"
    | "electrical"
    | "manufacturing"
    | "security"
    | "other";
  status?: "active" | "maintenance" | "faulty" | "inactive";
  manufacturer?: string;
  maintenanceSchedule?: "weekly" | "monthly" | "quarterly" | "annually";
  conditionScoreMin?: number;
  conditionScoreMax?: number;
  maintenanceDue?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "name"
    | "code"
    | "conditionScore"
    | "nextMaintenanceDue"
    | "createdAt";
  sortOrder?: "ASC" | "DESC";
}

export interface EnergyQueryParams {
  buildingId: number;
  startDate: string;
  endDate: string;
  equipmentId?: number;
  interval?: "hourly" | "daily" | "weekly" | "monthly";
  energyType?: "electrical" | "solar" | "generator" | "others";
  readingType?: "automatic" | "manual" | "estimated";
  includeCost?: boolean;
  includeQualityAssessment?: boolean;
  includeEnvironmentalImpact?: boolean;
}

export interface PowerQualityQueryParams {
  buildingId: number;
  startDate: string;
  endDate: string;
  equipmentId?: number;
  severity?: "low" | "medium" | "high" | "critical";
  eventTypes?: (
    | "Voltage Sag"
    | "Voltage Swell"
    | "Voltage Out of Range"
    | "High Voltage THD"
    | "High Current THD"
    | "Frequency Deviation"
    | "Low Power Factor"
    | "Voltage Unbalance"
  )[];
  complianceStandard?: "IEEE519" | "ITIC";
  includeEvents?: boolean;
  includeHarmonics?: boolean;
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
    | "efficiency_degradation"
    | "threshold_exceeded";
  priority?: "low" | "normal" | "high" | "urgent";
  buildingId?: number;
  equipmentId?: number;
  auditId?: number;
  assignedTo?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "createdAt"
    | "severity"
    | "priority"
    | "estimatedCostImpact"
    | "ageMinutes";
  sortOrder?: "ASC" | "DESC";
}

export interface AuditQueryParams {
  buildingId?: number;
  auditorId?: number;
  auditType?:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  status?: "planned" | "in_progress" | "completed" | "cancelled" | "on_hold";
  complianceStandards?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "plannedStartDate"
    | "complianceScore"
    | "energySavingsPotentialKwh"
    | "createdAt";
  sortOrder?: "ASC" | "DESC";
}

// ✅ ENHANCED: Report Query Parameters with New Options
export interface ReportQueryParams {
  type?:
    | "energy_consumption"
    | "power_quality"
    | "audit_summary"
    | "compliance"
    | "monitoring";
  status?: "generating" | "completed" | "failed" | "cancelled";
  format?: "pdf" | "excel" | "csv" | "html";
  buildingId?: number;
  auditId?: number;
  requestedBy?: number;
  generatedBy?: number;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "title" | "type" | "status" | "fileSizeMb";
  sortOrder?: "ASC" | "DESC";
}

export interface JobQueryParams {
  type?:
    | "analytics_processing"
    | "maintenance_prediction"
    | "compliance_analysis"
    | "efficiency_analysis"
    | "anomaly_detection";
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  priority?: "low" | "normal" | "high" | "urgent";
  startedBy?: number;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "startedAt" | "priority" | "progressPercentage";
  sortOrder?: "ASC" | "DESC";
}

// ===== FORM HANDLING INTERFACES =====

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  role: "admin" | "energy_manager" | "facility_engineer" | "staff" | "student";
  phone?: string;
  department?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  profilePicture?: File;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

// ===== ENHANCED REPORT GENERATION INTERFACES =====

// ✅ Energy Report Generation
export interface EnergyReportGenerationData {
  buildingId?: number;
  startDate: string;
  endDate: string;
  title: string;
  includeComparison?: boolean;
  includeTrends?: boolean;
  reportFormat?: string;
  sections?: string[];
}

// ✅ Power Quality Report Generation
export interface PowerQualityReportGenerationData {
  buildingId: number;
  startDate: string;
  endDate: string;
  title: string;
  includeEvents?: boolean;
  includeCompliance?: boolean;
  reportFormat?: string;
}

// ✅ Comprehensive Audit Report Generation
export interface AuditReportGenerationData {
  auditId: number;
  title: string;
  includeCompliance?: boolean;
  includeRecommendations?: boolean;
  includeImplementationPlan?: boolean;
  reportFormat?: string;
}

// ✅ Compliance Report Generation
export interface ComplianceReportGenerationData {
  auditId: number;
  standards: string[];
  title: string;
  includeGapAnalysis?: boolean;
  reportFormat?: string;
}

// ✅ Monitoring Report Generation
export interface MonitoringReportGenerationData {
  buildingId?: number;
  reportTypes: string[];
  startDate: string;
  endDate: string;
  title: string;
  reportFormat?: string;
}

// ===== SPECIALIZED RESPONSE TYPES =====

export interface EnergyStatsResponse {
  totalConsumption: number;
  averageConsumption: number;
  minConsumption: number;
  maxConsumption: number;
  peakDemand: number;
  totalCost: number;
  powerFactorAvg: number;
  powerFactorMin: number;
  maxPowerFactor: number;
  efficiencyScore: number;
  consumptionPerSqm: number;
  readingCount: number;
  period: {
    start: string;
    end: string;
  };
  trends: Array<{
    date: string;
    consumption: number;
    avgPowerFactor: number;
    readings: number;
  }>;
  buildingInfo: {
    id: number;
    name: string;
    areaSqm: number;
  };
}

export interface PowerQualityStatsResponse {
  thdVoltageAvg: number;
  thdVoltageMax: number;
  thdCurrentAvg: number;
  thdCurrentMax: number;
  voltageUnbalanceAvg: number;
  voltageUnbalanceMax: number;
  powerFactorAvg: number;
  powerFactorMin: number;
  frequencyAvg: number;
  frequencyMin: number;
  frequencyMax: number;
  qualityScore: number;
  totalReadings: number;
  violations: {
    thdVoltageViolations: number;
    thdCurrentViolations: number;
    voltageUnbalanceViolations: number;
    powerFactorViolations: number;
    frequencyViolations: number;
  };
  compliance: {
    thdVoltageComplianceRate: number;
    thdCurrentComplianceRate: number;
    voltageUnbalanceComplianceRate: number;
    powerFactorComplianceRate: number;
    overallCompliance: number;
  };
  trends: Array<{
    date: string;
    avgThdVoltage: number;
    avgPowerFactor: number;
    violations: number;
  }>;
  buildingInfo: {
    id: number;
    name: string;
  };
}

export interface AlertStatistics {
  total: {
    totalAlerts: number;
    alertsToday: number;
    alertsThisWeek: number;
  };
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    energyAnomaly: number;
    powerQuality: number;
    equipmentFailure: number;
    maintenanceDue: number;
    complianceViolation: number;
    efficiencyDegradation: number;
    thresholdExceeded: number;
  };
  byStatus: {
    active: number;
    acknowledged: number;
    resolved: number;
    escalated: number;
    closed: number;
  };
  responseTimes: {
    avgAcknowledgmentTime: number;
    avgResolutionTime: number;
  };
  trends: {
    dailyAlertsLastWeek: number[];
    escalationRate: number;
  };
}

// ===== ADDITIONAL SPECIALIZED INTERFACES =====

export interface BuildingDeletionCheck {
  building: {
    id: number;
    name: string;
    status: string;
  };
  canDelete: boolean;
  blockingReasons: string[];
  associatedData: {
    equipment: number;
    audits: number;
    energyConsumption: number;
    alerts: number;
    powerQualityReadings: number;
    reports: number;
  };
  blockingData: {
    equipment: boolean;
    audits: boolean;
    energyConsumption: boolean;
  };
  totalAssociatedRecords: number;
  deletionRecommendation: string;
}

export interface MaintenanceSchedule {
  schedule: Array<{
    id: number;
    name: string;
    equipmentType: string;
    buildingName: string;
    nextMaintenanceDate: string;
    lastMaintenance: string;
    predictedMaintenanceDate: string;
    maintenanceRiskLevel: "low" | "medium" | "high" | "critical";
    maintenanceStatus: "overdue" | "due_soon" | "current";
    urgencyScore: number;
    daysUntilDue: number;
    activeAlerts: number;
  }>;
  summary: {
    totalEquipment: number;
    dueSoon: number;
    overdue: number;
    faultyEquipment: number;
    inMaintenance: number;
    equipmentWithAlerts: number;
  };
}

export interface EnergySummary {
  periodConsumption: {
    currentPeriod: number;
    previousPeriod: number;
    changePercentage: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  costAnalysis: {
    currentCost: number;
    previousCost: number;
    potentialSavings: number;
    costPerKwh: number;
  };
  efficiencyMetrics: {
    overallEfficiencyScore: number;
    powerFactorAverage: number;
    demandFactor: number;
  };
  buildingRankings: Array<{
    buildingId: number;
    buildingName: string;
    consumptionPerSqm: number;
    efficiencyRank: number;
    improvementPotential: number;
  }>;
  trends: Array<{
    date: string;
    consumption: number;
    cost: number;
  }>;
}

export interface PowerQualitySummary {
  overallScore: number;
  complianceStatus: {
    ieee519ComplianceRate: number;
    iticComplianceRate: number;
    violationsLast24h: number;
  };
  qualityMetrics: {
    averageThdVoltage: number;
    averageThdCurrent: number;
    voltageStability: number;
    frequencyStability: number;
  };
  recentEvents: PowerQualityEvent[];
  trends: Array<{
    date: string;
    qualityScore: number;
    violations: number;
  }>;
  improvementRecommendations: string[];
}

export interface AuditSummary {
  completionMetrics: {
    totalAudits: number;
    completedAudits: number;
    inProgressAudits: number;
    completionRate: number;
  };
  complianceOverview: {
    averageComplianceScore: number;
    fullyCompliantAudits: number;
    auditsWithCriticalIssues: number;
  };
  recentActivities: Array<{
    auditId: number;
    title: string;
    status: string;
    completionPercentage: number;
    priority: string;
  }>;
  performanceIndicators: {
    averageAuditDuration: number;
    efficiencyImprovementRate: number;
    issuesResolutionRate: number;
  };
  upcomingAudits: Array<{
    id: number;
    title: string;
    scheduledDate: string;
    buildingName: string;
  }>;
}

export interface ComplianceSummary {
  overallStatus: {
    compliancePercentage: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    totalViolations: number;
    criticalViolations: number;
  };
  byStandard: Array<{
    standard: string;
    complianceRate: number;
    violations: number;
    lastAssessment: string;
  }>;
  recentIssues: Array<{
    id: number;
    description: string;
    severity: string;
    buildingName: string;
    dueDate: string;
  }>;
  improvementAreas: Array<{
    area: string;
    priority: string;
    estimatedCost: number;
    impact: string;
  }>;
}

export interface MonitoringActivity {
  id: number;
  activityType: string;
  buildingId?: number;
  buildingName?: string;
  description: string;
  status: "success" | "warning" | "error";
  processingTimeMs: number;
  anomaliesDetected: number;
  alertsGenerated: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemHealthStatus {
  timestamp: string;
  overallHealthScore: number;
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  uptimeSeconds: number;
  uptimePercentage: number;
  services: {
    database: {
      healthy: boolean;
      responseTimeMs: number;
      activeConnections: number;
    };
    redis: {
      healthy: boolean;
      memoryUsageMb: number;
      connectedClients: number;
    };
    backgroundProcessor: {
      status: "running" | "stopped" | "error";
      activeJobs: number;
      completedJobs24h: number;
      failedJobs24h: number;
    };
    socketConnections: {
      activeConnections: number;
      totalConnections24h: number;
    };
  };
  alerts: Array<{
    severity: string;
    count: number;
  }>;
  system: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
    nodeVersion: string;
    platform: string;
  };
}

// ===== UTILITY TYPE DEFINITIONS =====

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

// ===== PAGINATION UTILITY TYPE =====

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ===== ERROR HANDLING UTILITY TYPES =====

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

// ===== CONSTANTS =====

export const MAINTENANCE_SCHEDULES = {
  weekly: "weekly",
  monthly: "monthly",
  quarterly: "quarterly",
  annually: "annually",
} as const;

export const POWER_QUALITY_EVENT_TYPES = {
  voltageSag: "Voltage Sag",
  voltageSwell: "Voltage Swell",
  voltageOutOfRange: "Voltage Out of Range",
  highVoltageTHD: "High Voltage THD",
  highCurrentTHD: "High Current THD",
  frequencyDeviation: "Frequency Deviation",
  lowPowerFactor: "Low Power Factor",
  voltageUnbalance: "Voltage Unbalance",
} as const;

// ✅ ENHANCED: Report Generation Status Constants
export const REPORT_TYPES = {
  ENERGY_CONSUMPTION: "energy_consumption",
  POWER_QUALITY: "power_quality",
  AUDIT_SUMMARY: "audit_summary",
  COMPLIANCE: "compliance",
  MONITORING: "monitoring",
} as const;

export const REPORT_STATUSES = {
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const REPORT_FORMATS = {
  PDF: "pdf",
  EXCEL: "excel",
  CSV: "csv",
  HTML: "html",
} as const;

// ===== TYPE GUARDS FOR RUNTIME VALIDATION =====

export const isMaintenanceSchedule = (
  value: any
): value is "weekly" | "monthly" | "quarterly" | "annually" => {
  return ["weekly", "monthly", "quarterly", "annually"].includes(value);
};

export const isPowerQualityEventType = (
  value: any
): value is
  | "Voltage Sag"
  | "Voltage Swell"
  | "Voltage Out of Range"
  | "High Voltage THD"
  | "High Current THD"
  | "Frequency Deviation"
  | "Low Power Factor"
  | "Voltage Unbalance" => {
  return [
    "Voltage Sag",
    "Voltage Swell",
    "Voltage Out of Range",
    "High Voltage THD",
    "High Current THD",
    "Frequency Deviation",
    "Low Power Factor",
    "Voltage Unbalance",
  ].includes(value);
};

export const isReportType = (
  value: any
): value is keyof typeof REPORT_TYPES => {
  return Object.values(REPORT_TYPES).includes(value);
};

export const isReportStatus = (
  value: any
): value is keyof typeof REPORT_STATUSES => {
  return Object.values(REPORT_STATUSES).includes(value);
};

export const isReportFormat = (
  value: any
): value is keyof typeof REPORT_FORMATS => {
  return Object.values(REPORT_FORMATS).includes(value);
};

// ===== ADVANCED FILTER AND SEARCH INTERFACES =====

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
  logicalOperator?: "AND" | "OR";
  caseSensitive?: boolean;
}

export interface SearchQuery {
  query: string;
  filters: AdvancedFilter[];
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  page: number;
  limit: number;
  includeInactive?: boolean;
}

// Type Utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// ✅ ENHANCED: Report-specific type utilities
export type ReportGenerationRequest<T extends keyof typeof REPORT_TYPES> =
  T extends "energy_consumption"
    ? EnergyReportGenerationData
    : T extends "power_quality"
      ? PowerQualityReportGenerationData
      : T extends "audit_summary"
        ? AuditReportGenerationData
        : T extends "compliance"
          ? ComplianceReportGenerationData
          : T extends "monitoring"
            ? MonitoringReportGenerationData
            : never;

export type ReportGenerationResponse = Promise<ApiResponse<Report>>;

// ===== EXPORT ALL TYPES =====
export * from "@/lib/api-config";
