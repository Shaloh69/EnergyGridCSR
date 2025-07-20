// lib/api-utils.ts

import { ApiResponse, ApiError, User, Report } from "@/types/api-types";

// Type guards for API responses
export const isApiResponse = <T>(response: any): response is ApiResponse<T> => {
  return (
    typeof response === "object" &&
    response !== null &&
    typeof response.success === "boolean" &&
    typeof response.message === "string" &&
    "data" in response
  );
};

export const isApiError = (response: any): response is ApiError => {
  return (
    typeof response === "object" &&
    response !== null &&
    response.success === false &&
    typeof response.error === "string"
  );
};

// ✅ ENHANCED: All server field transformations (camelCase → snake_case for server requests)
export const transformToServerFields = (
  obj: Record<string, any>
): Record<string, any> => {
  const serverFieldMap: Record<string, string> = {
    // ===== USER FIELDS =====
    firstName: "first_name",
    lastName: "last_name",
    userId: "user_id",
    isActive: "is_active",
    lastLogin: "last_login",
    profilePicture: "profile_picture",
    refreshToken: "refresh_token",
    accessToken: "access_token",
    expiresIn: "expires_in",

    // ===== BUILDING FIELDS =====
    buildingId: "building_id",
    buildingType: "building_type",
    buildingName: "building_name",
    buildingCode: "building_code",
    areaSqm: "area_sqm",
    yearBuilt: "year_built",

    // ===== EQUIPMENT FIELDS =====
    equipmentId: "equipment_id",
    equipmentType: "equipment_type",
    equipmentName: "equipment_name",
    powerRatingKw: "power_rating_kw",
    voltageRating: "voltage_rating",
    currentRatingA: "current_rating_a",
    installationDate: "installation_date",
    warrantyExpiry: "warranty_expiry",
    serialNumber: "serial_number",
    qrCode: "qr_code",
    maintenanceSchedule: "maintenance_schedule",
    conditionScore: "condition_score",

    // ===== MAINTENANCE FIELDS =====
    maintenanceType: "maintenance_type",
    workPerformed: "work_performed",
    technicianId: "technician_id",
    technicianName: "technician_name",
    technicianFirstName: "technician_first_name",
    technicianLastName: "technician_last_name",
    scheduledDate: "scheduled_date",
    completedDate: "completed_date",
    downtimeMinutes: "downtime_minutes",
    durationMinutes: "duration_minutes",
    partsUsed: "parts_used",
    maintenanceNotes: "maintenance_notes",

    // ===== ENERGY FIELDS =====
    consumptionKwh: "consumption_kwh",
    costPhp: "cost_php",
    recordedAt: "recorded_at",
    meterReading: "meter_reading",
    demandKw: "demand_kw",
    powerFactor: "power_factor",
    energyType: "energy_type",
    reactivePowerKvarh: "reactive_power_kvarh",
    apparentPowerKvah: "apparent_power_kvah",
    voltageV: "voltage_v",
    currentA: "current_a",
    frequencyHz: "frequency_hz",
    peakDemandKw: "peak_demand_kw",
    peakConsumptionKwh: "peak_consumption_kwh",
    temperatureC: "temperature_c",
    humidityPercent: "humidity_percent",
    meterId: "meter_id",
    readingType: "reading_type",

    // ===== POWER QUALITY FIELDS =====
    voltageL1: "voltage_l1",
    voltageL2: "voltage_l2",
    voltageL3: "voltage_l3",
    voltageNeutral: "voltage_neutral",
    currentL1: "current_l1",
    currentL2: "current_l2",
    currentL3: "current_l3",
    currentNeutral: "current_neutral",
    thdVoltage: "thd_voltage",
    thdCurrent: "thd_current",
    voltageUnbalance: "voltage_unbalance",
    currentUnbalance: "current_unbalance",
    flickerPst: "flicker_pst",
    flickerPlt: "flicker_plt",
    measurementPoint: "measurement_point",

    // Power Quality Event types aligned with server validation
    eventType: "event_type",
    severityLevel: "severity_level",
    startTime: "start_time",
    endTime: "end_time",
    durationEstimate: "duration_estimate",
    impactScore: "impact_score",
    standardsViolated: "standards_violated",
    affectedPhases: "affected_phases",
    iticCurveViolation: "itic_curve_violation",
    estimatedCost: "estimated_cost",
    rootCause: "root_cause",
    equipmentAffected: "equipment_affected",
    recoveryTimeMs: "recovery_time_ms",

    // ===== ALERT FIELDS =====
    alertId: "alert_id",
    alertType: "alert_type",
    detectedValue: "detected_value",
    thresholdValue: "threshold_value",
    estimatedCostImpact: "estimated_cost_impact",
    estimatedDowntimeHours: "estimated_downtime_hours",
    assignedTo: "assigned_to",
    assignedUserName: "assigned_user_name",
    acknowledgedBy: "acknowledged_by",
    acknowledgedAt: "acknowledged_at",
    resolvedBy: "resolved_by",
    resolvedAt: "resolved_at",
    resolutionNotes: "resolution_notes",
    responseTimeMinutes: "response_time_minutes",
    resolutionTimeMinutes: "resolution_time_minutes",
    escalationLevel: "escalation_level",
    escalatedTo: "escalated_to",
    ageMinutes: "age_minutes",
    notificationSent: "notification_sent",

    // ===== AUDIT FIELDS =====
    auditId: "audit_id",
    auditType: "audit_type",
    auditorId: "auditor_id",
    auditorName: "auditor_name",
    plannedStartDate: "planned_start_date",
    plannedEndDate: "planned_end_date",
    actualStartDate: "actual_start_date",
    actualEndDate: "actual_end_date",
    estimatedDurationHours: "estimated_duration_hours",
    actualDurationHours: "actual_duration_hours",
    complianceScore: "compliance_score",
    energySavingsPotentialKwh: "energy_savings_potential_kwh",
    costSavingsPotentialPhp: "cost_savings_potential_php",
    implementationCostPhp: "implementation_cost_php",
    paybackPeriodMonths: "payback_period_months",
    auditCode: "audit_code",
    progressPercentage: "progress_percentage",
    nextAuditDue: "next_audit_due",

    // ===== COMPLIANCE FIELDS =====
    standardType: "standard_type",
    requirementCode: "requirement_code",
    requirementTitle: "requirement_title",
    requirementDescription: "requirement_description",
    sectionCode: "section_code",
    checkDescription: "check_description",
    measuredValue: "measured_value",
    requiredValue: "required_value",
    assessorId: "assessor_id",
    assessmentDate: "assessment_date",
    responsibleParty: "responsible_party",
    targetCompletionDate: "target_completion_date",
    actualCompletionDate: "actual_completion_date",
    dueDate: "due_date",
    verificationMethod: "verification_method",
    correctiveAction: "corrective_action",
    costToFix: "cost_to_fix",

    // ===== REPORT FIELDS =====
    reportId: "report_id",
    reportType: "report_type",
    requestedBy: "requested_by",
    requesterName: "requester_name",
    generatedBy: "generated_by",
    generatedByName: "generated_by_name",
    generatedByEmail: "generated_by_email",
    fileSizeMb: "file_size_mb",
    filePath: "file_path",
    fileName: "file_name",
    downloadUrl: "download_url",
    downloadCount: "download_count",
    expiresAt: "expires_at",
    generationTimeSeconds: "generation_time_seconds",
    errorMessage: "error_message",
    completedAt: "completed_at",
    fileAvailable: "file_available",

    // ✅ ENHANCED: Report generation fields
    reportFormat: "report_format",
    reportTypes: "report_types",
    includeComparison: "include_comparison",
    includeTrends: "include_trends",
    includeEvents: "include_events",
    includeCompliance: "include_compliance",
    includeRecommendations: "include_recommendations",
    includeGapAnalysis: "include_gap_analysis",
    includeCharts: "include_charts",
    includeRawData: "include_raw_data",

    // Report parameters
    reportParameters: "report_parameters",
    dateRange: "date_range",
    targetStandards: "target_standards",
    complianceStandards: "compliance_standards",

    // Report metadata
    reportTitle: "report_title",
    reportDescription: "report_description",
    reportSections: "report_sections",
    reportFilters: "report_filters",

    // Report scheduling
    scheduleType: "schedule_type",
    scheduleFrequency: "schedule_frequency",
    scheduleTime: "schedule_time",
    nextRunDate: "next_run_date",
    lastRunDate: "last_run_date",

    // Report templates
    templateId: "template_id",
    templateName: "template_name",
    templateConfig: "template_config",
    isDefault: "is_default",
    isPublic: "is_public",

    // ===== BACKGROUND JOB FIELDS =====
    jobId: "job_id",
    jobType: "job_type",
    startedBy: "started_by",
    startedByName: "started_by_name",
    estimatedCompletion: "estimated_completion",
    actualCompletion: "actual_completion",
    executionTimeSeconds: "execution_time_seconds",
    maxRetries: "max_retries",
    startedAt: "started_at",

    // ===== COMMON DATE/TIME FIELDS =====
    createdAt: "created_at",
    updatedAt: "updated_at",
    startDate: "start_date",
    endDate: "end_date",

    // ===== QUERY PARAMETERS =====
    sortBy: "sort_by",
    sortOrder: "sort_order",

    // Pagination Meta Fields
    currentPage: "current_page",
    perPage: "per_page",
    totalPages: "total_pages",
    totalCount: "total_count",
    itemsPerPage: "items_per_page",
    hasNextPage: "has_next_page",
    hasPrevPage: "has_prev_page",

    // ===== ANALYSIS AND MONITORING FIELDS =====
    analysisTypes: "analysis_types",
    dataTypes: "data_types",
    checkData: "check_data",
    monitoringType: "monitoring_type",
    testData: "test_data",
    asyncProcessing: "async_processing",

    // ===== DASHBOARD AND SUMMARY FIELDS =====
    energySummary: "energy_summary",
    powerQualitySummary: "power_quality_summary",
    auditSummary: "audit_summary",
    complianceSummary: "compliance_summary",
    alertStatistics: "alert_statistics",
    realTimeMetrics: "real_time_metrics",
    lastUpdated: "last_updated",

    // Analytics and forecasting fields
    lookbackDays: "lookback_days",
    forecastDays: "forecast_days",
    forecastType: "forecast_type",
    baselineType: "baseline_type",
    parameterName: "parameter_name",
    parameterType: "parameter_type",
    thresholdType: "threshold_type",
    minValue: "min_value",
    maxValue: "max_value",
    escalationMinutes: "escalation_minutes",
    notificationEmails: "notification_emails",

    // ===== SERVER COMPUTED FIELDS =====
    equipmentCount: "equipment_count",
    auditCount: "audit_count",
    avgComplianceScore: "avg_compliance_score",
    lastEnergyReading: "last_energy_reading",
    totalConsumptionKwh: "total_consumption_kwh",
    avgPowerFactor: "avg_power_factor",
    efficiencyScore: "efficiency_score",
    monthlyCostPhp: "monthly_cost_php",
    alertCount: "alert_count",
    maintenanceDueCount: "maintenance_due_count",
    activeEquipment: "active_equipment",
    maintenanceEquipment: "maintenance_equipment",
    faultyEquipment: "faulty_equipment",
    inactiveEquipment: "inactive_equipment",
    criticalAlerts: "critical_alerts",
    highAlerts: "high_alerts",
    mediumAlerts: "medium_alerts",
    lowAlerts: "low_alerts",

    // Equipment computed fields
    ageYears: "age_years",
    maintenanceIntervalDays: "maintenance_interval_days",
    nextMaintenanceDate: "next_maintenance_date",
    lastMaintenanceDate: "last_maintenance_date",
    predictedMaintenanceDate: "predicted_maintenance_date",
    maintenanceRiskLevel: "maintenance_risk_level",
    activeAlerts: "active_alerts",
    healthStatus: "health_status",
    maintenanceUrgency: "maintenance_urgency",
    maintenanceStatus: "maintenance_status",
    scheduledMaintenanceDate: "scheduled_maintenance_date",
    scheduledMaintenanceStatus: "scheduled_maintenance_status",
    maintenanceCostYtd: "maintenance_cost_ytd",
    downtimeHoursYtd: "downtime_hours_ytd",
    efficiencyTrend: "efficiency_trend",
  };

  return transformObjectFields(obj, serverFieldMap);
};

// ✅ ENHANCED: All frontend field transformations (snake_case → camelCase for client responses)
export const transformFromServerFields = (obj: any): any => {
  const frontendFieldMap: Record<string, string> = {
    // ===== USER FIELDS =====
    first_name: "firstName",
    last_name: "lastName",
    user_id: "userId",
    is_active: "isActive",
    last_login: "lastLogin",
    profile_picture: "profilePicture",
    refresh_token: "refreshToken",
    access_token: "accessToken",
    expires_in: "expiresIn",

    // ===== BUILDING FIELDS =====
    building_id: "buildingId",
    building_type: "buildingType",
    building_name: "buildingName",
    building_code: "buildingCode",
    area_sqm: "areaSqm",
    year_built: "yearBuilt",

    // ===== EQUIPMENT FIELDS =====
    equipment_id: "equipmentId",
    equipment_type: "equipmentType",
    equipment_name: "equipmentName",
    power_rating_kw: "powerRatingKw",
    voltage_rating: "voltageRating",
    current_rating_a: "currentRatingA",
    installation_date: "installationDate",
    warranty_expiry: "warrantyExpiry",
    serial_number: "serialNumber",
    qr_code: "qrCode",
    maintenance_schedule: "maintenanceSchedule",
    condition_score: "conditionScore",

    // ===== MAINTENANCE FIELDS =====
    maintenance_type: "maintenanceType",
    work_performed: "workPerformed",
    technician_id: "technicianId",
    technician_name: "technicianName",
    technician_first_name: "technicianFirstName",
    technician_last_name: "technicianLastName",
    scheduled_date: "scheduledDate",
    completed_date: "completedDate",
    downtime_minutes: "downtimeMinutes",
    duration_minutes: "durationMinutes",
    parts_used: "partsUsed",
    maintenance_notes: "maintenanceNotes",

    // ===== ENERGY FIELDS =====
    consumption_kwh: "consumptionKwh",
    cost_php: "costPhp",
    recorded_at: "recordedAt",
    meter_reading: "meterReading",
    demand_kw: "demandKw",
    power_factor: "powerFactor",
    energy_type: "energyType",
    reactive_power_kvarh: "reactivePowerKvarh",
    apparent_power_kvah: "apparentPowerKvah",
    voltage_v: "voltageV",
    current_a: "currentA",
    frequency_hz: "frequencyHz",
    peak_demand_kw: "peakDemandKw",
    peak_consumption_kwh: "peakConsumptionKwh",
    temperature_c: "temperatureC",
    humidity_percent: "humidityPercent",
    meter_id: "meterId",
    reading_type: "readingType",

    // ===== POWER QUALITY FIELDS =====
    voltage_l1: "voltageL1",
    voltage_l2: "voltageL2",
    voltage_l3: "voltageL3",
    voltage_neutral: "voltageNeutral",
    current_l1: "currentL1",
    current_l2: "currentL2",
    current_l3: "currentL3",
    current_neutral: "currentNeutral",
    thd_voltage: "thdVoltage",
    thd_current: "thdCurrent",
    voltage_unbalance: "voltageUnbalance",
    current_unbalance: "currentUnbalance",
    flicker_pst: "flickerPst",
    flicker_plt: "flickerPlt",
    measurement_point: "measurementPoint",

    // Power Quality Event fields
    event_type: "eventType",
    severity_level: "severityLevel",
    start_time: "startTime",
    end_time: "endTime",
    duration_estimate: "durationEstimate",
    impact_score: "impactScore",
    standards_violated: "standardsViolated",
    affected_phases: "affectedPhases",
    itic_curve_violation: "iticCurveViolation",
    estimated_cost: "estimatedCost",
    root_cause: "rootCause",
    equipment_affected: "equipmentAffected",
    recovery_time_ms: "recoveryTimeMs",

    // ===== ALERT FIELDS =====
    alert_id: "alertId",
    alert_type: "alertType",
    detected_value: "detectedValue",
    threshold_value: "thresholdValue",
    estimated_cost_impact: "estimatedCostImpact",
    estimated_downtime_hours: "estimatedDowntimeHours",
    assigned_to: "assignedTo",
    assigned_user_name: "assignedUserName",
    acknowledged_by: "acknowledgedBy",
    acknowledged_at: "acknowledgedAt",
    resolved_by: "resolvedBy",
    resolved_at: "resolvedAt",
    resolution_notes: "resolutionNotes",
    response_time_minutes: "responseTimeMinutes",
    resolution_time_minutes: "resolutionTimeMinutes",
    escalation_level: "escalationLevel",
    escalated_to: "escalatedTo",
    age_minutes: "ageMinutes",
    notification_sent: "notificationSent",

    // ===== AUDIT FIELDS =====
    audit_id: "auditId",
    audit_type: "auditType",
    auditor_id: "auditorId",
    auditor_name: "auditorName",
    planned_start_date: "plannedStartDate",
    planned_end_date: "plannedEndDate",
    actual_start_date: "actualStartDate",
    actual_end_date: "actualEndDate",
    estimated_duration_hours: "estimatedDurationHours",
    actual_duration_hours: "actualDurationHours",
    compliance_score: "complianceScore",
    energy_savings_potential_kwh: "energySavingsPotentialKwh",
    cost_savings_potential_php: "costSavingsPotentialPhp",
    implementation_cost_php: "implementationCostPhp",
    payback_period_months: "paybackPeriodMonths",
    audit_code: "auditCode",
    progress_percentage: "progressPercentage",
    next_audit_due: "nextAuditDue",

    // ===== COMPLIANCE FIELDS =====
    standard_type: "standardType",
    requirement_code: "requirementCode",
    requirement_title: "requirementTitle",
    requirement_description: "requirementDescription",
    section_code: "sectionCode",
    check_description: "checkDescription",
    measured_value: "measuredValue",
    required_value: "requiredValue",
    assessor_id: "assessorId",
    assessment_date: "assessmentDate",
    responsible_party: "responsibleParty",
    target_completion_date: "targetCompletionDate",
    actual_completion_date: "actualCompletionDate",
    due_date: "dueDate",
    verification_method: "verificationMethod",
    corrective_action: "correctiveAction",
    cost_to_fix: "costToFix",

    // ===== REPORT FIELDS =====
    report_id: "reportId",
    report_type: "reportType",
    requested_by: "requestedBy",
    requester_name: "requesterName",
    generated_by: "generatedBy",
    generated_by_name: "generatedByName",
    generated_by_email: "generatedByEmail",
    file_size_mb: "fileSizeMb",
    file_path: "filePath",
    file_name: "fileName",
    download_url: "downloadUrl",
    download_count: "downloadCount",
    expires_at: "expiresAt",
    generation_time_seconds: "generationTimeSeconds",
    error_message: "errorMessage",
    completed_at: "completedAt",
    file_available: "fileAvailable",

    // ✅ ENHANCED: Report generation fields
    report_format: "reportFormat",
    report_types: "reportTypes",
    include_comparison: "includeComparison",
    include_trends: "includeTrends",
    include_events: "includeEvents",
    include_compliance: "includeCompliance",
    include_recommendations: "includeRecommendations",
    include_gap_analysis: "includeGapAnalysis",
    include_charts: "includeCharts",
    include_raw_data: "includeRawData",

    // Report parameters
    report_parameters: "reportParameters",
    date_range: "dateRange",
    target_standards: "targetStandards",
    compliance_standards: "complianceStandards",
    analysis_types: "analysisTypes",

    // Report metadata
    report_title: "reportTitle",
    report_description: "reportDescription",
    report_sections: "reportSections",
    report_filters: "reportFilters",

    // Report scheduling
    schedule_type: "scheduleType",
    schedule_frequency: "scheduleFrequency",
    schedule_time: "scheduleTime",
    next_run_date: "nextRunDate",
    last_run_date: "lastRunDate",

    // Report templates
    template_id: "templateId",
    template_name: "templateName",
    template_config: "templateConfig",
    is_default: "isDefault",
    is_public: "isPublic",

    // ===== BACKGROUND JOB FIELDS =====
    job_id: "jobId",
    job_type: "jobType",
    started_by: "startedBy",
    started_by_name: "startedByName",
    estimated_completion: "estimatedCompletion",
    actual_completion: "actualCompletion",
    execution_time_seconds: "executionTimeSeconds",
    max_retries: "maxRetries",
    started_at: "startedAt",

    // ===== COMMON DATE/TIME FIELDS =====
    created_at: "createdAt",
    updated_at: "updatedAt",
    start_date: "startDate",
    end_date: "endDate",

    // Pagination fields
    current_page: "currentPage",
    per_page: "perPage",
    total_pages: "totalPages",
    total_count: "totalCount",
    total_items: "totalItems",
    items_per_page: "itemsPerPage",
    has_next_page: "hasNextPage",
    has_prev_page: "hasPrevPage",
    has_next: "hasNext",
    has_prev: "hasPrev",

    // ===== ANALYSIS AND MONITORING FIELDS =====
    data_types: "dataTypes",
    check_data: "checkData",
    monitoring_type: "monitoringType",
    test_data: "testData",
    async_processing: "asyncProcessing",

    // ===== SYSTEM AND METADATA FIELDS =====
    user_stats: "userStats",
    system_stats: "systemStats",
    maintenance_history: "maintenanceHistory",
    performance_metrics: "performanceMetrics",
    validation_errors: "validationErrors",
    response_time_ms: "responseTimeMs",
    api_version: "apiVersion",
    request_id: "requestId",

    // ===== DASHBOARD AND SUMMARY FIELDS =====
    energy_summary: "energySummary",
    power_quality_summary: "powerQualitySummary",
    audit_summary: "auditSummary",
    compliance_summary: "complianceSummary",
    alert_statistics: "alertStatistics",
    real_time_metrics: "realTimeMetrics",
    last_updated: "lastUpdated",

    // Additional analytics fields
    anomaly_detection: "anomalyDetection",
    compliance_analysis: "complianceAnalysis",
    efficiency_analysis: "efficiencyAnalysis",
    maintenance_prediction: "maintenancePrediction",
    baseline_type: "baselineType",
    forecast_days: "forecastDays",
    forecast_type: "forecastType",
    lookback_days: "lookbackDays",

    // Power quality analysis
    voltage_data: "voltageData",
    current_data: "currentData",
    frequency_data: "frequencyData",
    pq_reading_id: "pqReadingId",

    // Threshold fields
    parameter_name: "parameterName",
    parameter_type: "parameterType",
    min_value: "minValue",
    max_value: "maxValue",
    threshold_type: "thresholdType",
    escalation_minutes: "escalationMinutes",
    notification_emails: "notificationEmails",

    // Alert Statistics fields
    total_alerts: "totalAlerts",
    alerts_today: "alertsToday",
    alerts_this_week: "alertsThisWeek",
    by_severity: "bySeverity",
    by_type: "byType",
    by_status: "byStatus",
    response_times: "responseTimes",
    avg_acknowledgment_time: "avgAcknowledgmentTime",
    avg_resolution_time: "avgResolutionTime",
    escalation_rate: "escalationRate",
    daily_alerts_last_week: "dailyAlertsLastWeek",

    // Energy stats fields
    total_consumption: "totalConsumption",
    average_consumption: "averageConsumption",
    min_consumption: "minConsumption",
    max_consumption: "maxConsumption",
    peak_demand: "peakDemand",
    total_cost: "totalCost",
    power_factor_avg: "powerFactorAvg",
    power_factor_min: "powerFactorMin",
    max_power_factor: "maxPowerFactor",
    consumption_per_sqm: "consumptionPerSqm",
    reading_count: "readingCount",

    // Power quality stats fields
    thd_voltage_avg: "thdVoltageAvg",
    thd_voltage_max: "thdVoltageMax",
    thd_current_avg: "thdCurrentAvg",
    thd_current_max: "thdCurrentMax",
    voltage_unbalance_avg: "voltageUnbalanceAvg",
    voltage_unbalance_max: "voltageUnbalanceMax",
    frequency_avg: "frequencyAvg",
    frequency_min: "frequencyMin",
    frequency_max: "frequencyMax",
    quality_score: "qualityScore",
    total_readings: "totalReadings",

    // Compliance rates
    thd_voltage_violations: "thdVoltageViolations",
    thd_current_violations: "thdCurrentViolations",
    voltage_unbalance_violations: "voltageUnbalanceViolations",
    power_factor_violations: "powerFactorViolations",
    frequency_violations: "frequencyViolations",
    thd_voltage_compliance_rate: "thdVoltageComplianceRate",
    thd_current_compliance_rate: "thdCurrentComplianceRate",
    voltage_unbalance_compliance_rate: "voltageUnbalanceComplianceRate",
    power_factor_compliance_rate: "powerFactorComplianceRate",
    overall_compliance: "overallCompliance",

    // Building info for nested objects
    building_info: "buildingInfo",

    // ===== SERVER COMPUTED FIELDS =====
    equipment_count: "equipmentCount",
    audit_count: "auditCount",
    avg_compliance_score: "avgComplianceScore",
    last_energy_reading: "lastEnergyReading",
    total_consumption_kwh: "totalConsumptionKwh",
    avg_power_factor: "avgPowerFactor",
    efficiency_score: "efficiencyScore",
    alert_count: "alertCount",
    maintenance_due_count: "maintenanceDueCount",
    active_equipment: "activeEquipment",
    maintenance_equipment: "maintenanceEquipment",
    faulty_equipment: "faultyEquipment",
    inactive_equipment: "inactiveEquipment",
    critical_alerts: "criticalAlerts",
    high_alerts: "highAlerts",
    medium_alerts: "mediumAlerts",
    low_alerts: "lowAlerts",
    energy_efficiency_rank: "energyEfficiencyRank",
    off_peak_consumption_kwh: "offPeakConsumptionKwh",
    power_quality_score: "powerQualityScore",
    ieee519_compliance_rate: "ieee519ComplianceRate",
    itic_compliance_rate: "iticComplianceRate",
    violations_last_24h: "violationsLast24h",

    // Equipment computed fields
    age_years: "ageYears",
    maintenance_interval_days: "maintenanceIntervalDays",
    next_maintenance_date: "nextMaintenanceDate",
    last_maintenance_date: "lastMaintenanceDate",
    predicted_maintenance_date: "predictedMaintenanceDate",
    maintenance_risk_level: "maintenanceRiskLevel",
    active_alerts: "activeAlerts",
    health_status: "healthStatus",
    maintenance_urgency: "maintenanceUrgency",
    maintenance_status: "maintenanceStatus",
    scheduled_maintenance_date: "scheduledMaintenanceDate",
    scheduled_maintenance_status: "scheduledMaintenanceStatus",
    maintenance_cost_ytd: "maintenanceCostYtd",
    downtime_hours_ytd: "downtimeHoursYtd",
    efficiency_trend: "efficiencyTrend",

    // Equipment maintenance extended fields
    total_maintenance_events: "totalMaintenanceEvents",
    preventive_maintenance_percentage: "preventiveMaintenancePercentage",
    emergency_maintenance_count: "emergencyMaintenanceCount",
    average_repair_time_hours: "averageRepairTimeHours",
    reliability_score: "reliabilityScore",
    cost_per_operational_hour: "costPerOperationalHour",
    failure_rate: "failureRate",
    mtbf_hours: "mtbfHours",
    mttr_hours: "mttrHours",

    // Maintenance performance metrics
    total_maintenance_count: "totalMaintenanceCount",
    total_downtime_minutes: "totalDowntimeMinutes",
    average_maintenance_cost: "averageMaintenanceCost",
    total_maintenance_cost: "totalMaintenanceCost",
    preventive_maintenance_count: "preventiveMaintenanceCount",
    corrective_maintenance_count: "correctiveMaintenanceCount",
    predictive_maintenance_count: "predictiveMaintenanceCount",
    total_operational_hours: "totalOperationalHours",
    cost_efficiency: "costEfficiency",

    // Dashboard Overview Fields
    system_health: "systemHealth",
    overall_score: "overallScore",
    uptime_percentage: "uptimePercentage",
    data_quality_score: "dataQualityScore",

    building_portfolio: "buildingPortfolio",
    total_buildings: "totalBuildings",
    active_buildings: "activeBuildings",
    buildings_in_maintenance: "buildingsInMaintenance",
    total_area_sqm: "totalAreaSqm",
    average_efficiency_score: "averageEfficiencyScore",

    energy_performance: "energyPerformance",
    total_consumption_today_kwh: "totalConsumptionTodayKwh",
    total_consumption_month_kwh: "totalConsumptionMonthKwh",
    monthly_cost_php: "monthlyCostPhp",
    efficiency_vs_baseline: "efficiencyVsBaseline",
    carbon_footprint_kg_co2: "carbonFootprintKgCo2",
    renewable_energy_percentage: "renewableEnergyPercentage",

    alerts_summary: "alertsSummary",
    active_critical: "activeCritical",
    active_high: "activeHigh",
    active_medium: "activeMedium",
    active_low: "activeLow",
    total_active: "totalActive",
    average_response_time_minutes: "averageResponseTimeMinutes",
    resolution_rate_24h: "resolutionRate24h",

    equipment_status: "equipmentStatus",
    total_equipment: "totalEquipment",
    operational: "operational",
    maintenance_required: "maintenanceRequired",
    offline: "offline",
    average_condition_score: "averageConditionScore",

    compliance_status: "complianceStatus",
    overall_compliance_score: "overallComplianceScore",
    ieee519_compliance: "ieee519Compliance",
    pec2017_compliance: "pec2017Compliance",
    oshs_compliance: "oshsCompliance",
    ra11285_compliance: "ra11285Compliance",
    upcoming_audits: "upcomingAudits",

    cost_optimization: "costOptimization",
    identified_savings_php: "identifiedSavingsPhp",
    implemented_savings_php: "implementedSavingsPhp",
    potential_monthly_savings: "potentialMonthlySavings",
    roi_percentage: "roiPercentage",
  };

  return transformObjectFields(obj, frontendFieldMap);
};

// ✅ Enhanced transformation function with file handling
const transformObjectFields = (
  obj: any,
  fieldMap: Record<string, string>
): any => {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays - transform each element
  if (Array.isArray(obj)) {
    return obj.map((item) => transformObjectFields(item, fieldMap));
  }

  // Handle primitives (string, number, boolean)
  if (typeof obj !== "object") {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // ✅ ENHANCED: Handle File objects (for uploads)
  if (typeof File !== "undefined" && obj instanceof File) {
    return obj;
  }

  // ✅ ENHANCED: Handle Blob objects (for downloads)
  if (typeof Blob !== "undefined" && obj instanceof Blob) {
    return obj;
  }

  // ✅ ENHANCED: Handle ArrayBuffer (for binary data)
  if (obj instanceof ArrayBuffer) {
    return obj;
  }

  // Handle objects
  const transformed: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    // Transform the key
    const transformedKey = fieldMap[key] || key;

    // Preserve null and undefined values for API consistency
    if (value === null || value === undefined) {
      transformed[transformedKey] = value;
      return;
    }

    // Recursively transform the value for nested objects and arrays
    if (value && typeof value === "object") {
      transformed[transformedKey] = transformObjectFields(value, fieldMap);
    } else {
      transformed[transformedKey] = value;
    }
  });

  return transformed;
};

// ✅ Enhanced validation error formatting
export const formatValidationErrors = (
  errors: Array<{ field: string; message: string; value?: any }>
): string => {
  return errors.map((error) => `${error.field}: ${error.message}`).join(", ");
};

export const formatDateForServer = (date: Date | string): string => {
  if (typeof date === "string") {
    return new Date(date).toISOString();
  }
  return date.toISOString();
};

export const parseServerNumber = (value: any): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const parseServerBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
};

// ✅ Enhanced pagination parsing
export const parsePagination = (pagination: any) => {
  if (!pagination) return null;

  return {
    currentPage:
      pagination.current_page || pagination.currentPage || pagination.page || 1,
    perPage:
      pagination.per_page || pagination.perPage || pagination.limit || 20,
    totalPages: pagination.total_pages || pagination.totalPages || 1,
    totalCount:
      pagination.total_count ||
      pagination.totalCount ||
      pagination.total_items ||
      pagination.total ||
      0,
    itemsPerPage:
      pagination.items_per_page ||
      pagination.itemsPerPage ||
      pagination.limit ||
      20,
    hasNextPage:
      pagination.has_next_page ||
      pagination.hasNextPage ||
      pagination.has_next ||
      false,
    hasPrevPage:
      pagination.has_prev_page ||
      pagination.hasPrevPage ||
      pagination.has_prev ||
      false,
  };
};

export const buildServerUrl = (
  baseUrl: string,
  params: Record<string, any>
): string => {
  const serverParams = transformToServerFields(params);
  const urlParams = new URLSearchParams();

  Object.entries(serverParams).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => urlParams.append(key, String(item)));
    } else {
      urlParams.append(key, String(value));
    }
  });

  const queryString = urlParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// ✅ Enhanced error message extraction
export const extractErrorMessage = (error: any): string => {
  // Check for API error format
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for validation errors
  if (
    error?.response?.data?.validationErrors ||
    error?.response?.data?.validation_errors
  ) {
    const validationErrors =
      error.response.data.validationErrors ||
      error.response.data.validation_errors;

    const transformedErrors = Array.isArray(validationErrors)
      ? validationErrors.map((err) => ({
          ...err,
          field:
            transformFromServerFields({ [err.field]: null })[
              Object.keys(transformFromServerFields({ [err.field]: null }))[0]
            ] || err.field,
        }))
      : validationErrors;

    return formatValidationErrors(transformedErrors);
  }

  // Check for generic error message
  if (error?.message) {
    return error.message;
  }

  // Default fallback
  return "An unexpected error occurred";
};

export const getServerStatus = (
  statusCode: number
): "success" | "error" | "warning" => {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  return "error";
};

export const shouldRetryRequest = (
  error: any,
  retryCount: number,
  maxRetries: number = 3
): boolean => {
  if (retryCount >= maxRetries) return false;

  const status = error?.response?.status;

  // Retry on 5xx errors (server errors)
  if (status >= 500 && status < 600) return true;

  // Retry on network errors
  if (!status && error?.code === "NETWORK_ERROR") return true;

  // Retry on timeout
  if (error?.code === "ECONNABORTED") return true;

  return false;
};

export const validateJWT = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const base64Regex = /^[A-Za-z0-9_-]+$/;
    if (!parts.every((part) => base64Regex.test(part))) return false;

    const header = JSON.parse(atob(parts[0]));
    if (!header.alg || !header.typ) return false;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp || !payload.iat) return false;

    return true;
  } catch {
    return false;
  }
};

export const isTokenExpired = (
  token: string,
  bufferMinutes: number = 5
): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferSeconds = bufferMinutes * 60;

    return payload.exp && payload.exp - bufferSeconds < currentTime;
  } catch {
    return true;
  }
};

export const getServerEnvironment = ():
  | "development"
  | "staging"
  | "production" => {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return "development";
  }

  if (hostname.includes("staging") || hostname.includes("dev")) {
    return "staging";
  }

  return "production";
};

export const validateApiConfig = (config: {
  baseUrl?: string;
  timeout?: number;
  apiVersion?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push("Base URL is required");
  } else if (!config.baseUrl.startsWith("http")) {
    errors.push("Base URL must start with http:// or https://");
  }

  if (config.timeout && config.timeout < 1000) {
    errors.push("Timeout should be at least 1000ms");
  }

  if (config.apiVersion && !/^v\d+$/.test(config.apiVersion)) {
    errors.push('API version should follow format "v1", "v2", etc.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const normalizeApiResponse = <T>(response: any): ApiResponse<T> => {
  if (isApiResponse<T>(response)) {
    if (response.data) {
      response.data = transformFromServerFields(response.data) as T;
    }
    return response;
  }

  if (response?.data && !response.success) {
    return {
      success: true,
      message: "Success",
      data: transformFromServerFields(response.data) as T,
    };
  }

  return {
    success: true,
    message: "Success",
    data: transformFromServerFields(response) as T,
  };
};

export const generateRequestId = (): string => {
  const timestamp = Date.now().toString();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `req_${timestamp}_${randomStr}`;
};

export const generateCacheKey = (
  endpoint: string,
  params?: Record<string, any>
): string => {
  const baseKey = endpoint.replace(/[^a-zA-Z0-9]/g, "_");

  if (!params) return baseKey;

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join("&");

  return `${baseKey}_${btoa(sortedParams)}`;
};

export const validateServerFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter(
    (field) =>
      data[field] === undefined || data[field] === null || data[field] === ""
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

export const deepMergeObjects = (target: any, source: any): any => {
  if (!target || !source) return target || source;

  const result = { ...target };

  Object.keys(source).forEach((key) => {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMergeObjects(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  });

  return result;
};

export const extractResponseMetadata = (
  response: any
): {
  requestId?: string;
  responseTime?: number;
  apiVersion?: string;
  timestamp?: string;
} => {
  const metadata = response?.metadata || {};

  return transformFromServerFields({
    request_id: metadata.request_id,
    response_time_ms: metadata.response_time_ms,
    api_version: metadata.api_version,
    timestamp: metadata.timestamp,
  });
};

export const convertServerDataTypes = (data: any): any => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(convertServerDataTypes);
  }

  const converted: any = {};

  Object.entries(data).forEach(([key, value]) => {
    // Convert date strings to Date objects
    if (
      typeof value === "string" &&
      (key.includes("_at") || key.includes("_date") || key.includes("Date"))
    ) {
      const dateValue = new Date(value);
      converted[key] = isNaN(dateValue.getTime()) ? value : dateValue;
    }
    // Convert numeric strings to numbers for numeric fields
    else if (
      typeof value === "string" &&
      (key.includes("_id") ||
        key.includes("score") ||
        key.includes("rating") ||
        key.includes("kwh") ||
        key.includes("cost") ||
        key.includes("percentage") ||
        key.includes("minutes") ||
        key.includes("hours") ||
        key.includes("count"))
    ) {
      const numValue = parseFloat(value);
      converted[key] = isNaN(numValue) ? value : numValue;
    }
    // Recursively convert nested objects
    else if (value && typeof value === "object") {
      converted[key] = convertServerDataTypes(value);
    } else {
      converted[key] = value;
    }
  });

  return converted;
};

// ✅ Enhanced server computed fields validation
export const validateServerComputedFields = (
  data: any,
  entityType: "building" | "equipment" | "alert" | "audit" | "report"
): {
  isValid: boolean;
  missingComputedFields: string[];
  recommendations: string[];
} => {
  const missingComputedFields: string[] = [];
  const recommendations: string[] = [];

  const expectedComputedFields = {
    building: [
      "equipmentCount",
      "auditCount",
      "avgComplianceScore",
      "efficiencyScore",
      "alertCount",
      "lastEnergyReading",
      "totalConsumptionKwh",
      "avgPowerFactor",
      "monthlyCostPhp",
      "maintenanceDueCount",
    ],
    equipment: [
      "ageYears",
      "maintenanceStatus",
      "healthStatus",
      "activeAlerts",
      "maintenanceUrgency",
      "nextMaintenanceDate",
      "lastMaintenanceDate",
      "maintenanceRiskLevel",
    ],
    alert: [
      "ageMinutes",
      "urgency",
      "assignedUserName",
      "buildingName",
      "equipmentName",
    ],
    audit: ["progressPercentage", "auditorName", "buildingName"],
    report: [
      "ageMinutes",
      "fileAvailable",
      "requesterName",
      "generatedByName",
      "buildingName",
      "auditTitle",
    ],
  };

  const expected = expectedComputedFields[entityType] || [];

  expected.forEach((field) => {
    if (data && !(field in data)) {
      missingComputedFields.push(field);
    }
  });

  if (missingComputedFields.length > 0) {
    recommendations.push(
      "Some server-computed fields are missing. Ensure the server is providing all expected computed fields."
    );
    recommendations.push(
      `Missing fields for ${entityType}: ${missingComputedFields.join(", ")}`
    );
  } else {
    recommendations.push(
      `✅ All expected computed fields present for ${entityType}`
    );
  }

  return {
    isValid: missingComputedFields.length === 0,
    missingComputedFields,
    recommendations,
  };
};

// ✅ Enhanced cache configuration per endpoint type
export const getCacheTTL = (endpoint: string): number => {
  const cacheConfig: Record<string, number> = {
    // Real-time data - short cache
    "/api/dashboard/real-time": 30 * 1000,
    "/api/alerts": 60 * 1000,
    "/api/monitoring/dashboard": 60 * 1000,

    // Frequent updates - medium cache
    "/api/dashboard/overview": 2 * 60 * 1000,
    "/api/energy/stats": 2 * 60 * 1000,
    "/api/power-quality/stats": 2 * 60 * 1000,

    // Moderate updates - longer cache
    "/api/buildings": 10 * 60 * 1000,
    "/api/equipment": 10 * 60 * 1000,
    "/api/audits": 5 * 60 * 1000,

    // Static/infrequent updates - long cache
    "/api/auth/profile": 15 * 60 * 1000,
    "/api/compliance/standards": 60 * 60 * 1000,

    // ✅ ENHANCED: Reports caching
    "/api/reports": 2 * 60 * 1000, // Reports list - 2 minutes
    "/api/reports/stats": 5 * 60 * 1000, // Report stats - 5 minutes
    // Note: Individual reports, downloads, and status are not cached
  };

  // Check for exact match first
  if (cacheConfig[endpoint]) {
    return cacheConfig[endpoint];
  }

  // Check for pattern matches
  for (const [pattern, ttl] of Object.entries(cacheConfig)) {
    if (endpoint.includes(pattern.split("/").slice(0, 3).join("/"))) {
      return ttl;
    }
  }

  // Default cache TTL
  return 5 * 60 * 1000;
};

// ✅ Equipment maintenance schedule validation
export const validateMaintenanceSchedule = (schedule: string): boolean => {
  const validSchedules = ["weekly", "monthly", "quarterly", "annually"];
  return validSchedules.includes(schedule.toLowerCase());
};

// ✅ Power quality event type validation
export const validatePowerQualityEventType = (eventType: string): boolean => {
  const validEventTypes = [
    "Voltage Sag",
    "Voltage Swell",
    "Voltage Out of Range",
    "High Voltage THD",
    "High Current THD",
    "Frequency Deviation",
    "Low Power Factor",
    "Voltage Unbalance",
  ];
  return validEventTypes.includes(eventType);
};

// ✅ ENHANCED: Report validation utilities
export const validateReportType = (reportType: string): boolean => {
  const validTypes = [
    "energy_consumption",
    "power_quality",
    "audit_summary",
    "compliance",
    "monitoring",
  ];
  return validTypes.includes(reportType);
};

export const validateReportFormat = (format: string): boolean => {
  const validFormats = ["pdf", "excel", "csv", "html"];
  return validFormats.includes(format.toLowerCase());
};

export const validateReportStatus = (status: string): boolean => {
  const validStatuses = ["generating", "completed", "failed", "cancelled"];
  return validStatuses.includes(status);
};

export const validateDateRange = (
  startDate: string,
  endDate: string
): { isValid: boolean; error?: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { isValid: false, error: "Invalid start date" };
  }

  if (isNaN(end.getTime())) {
    return { isValid: false, error: "Invalid end date" };
  }

  if (start >= end) {
    return { isValid: false, error: "Start date must be before end date" };
  }

  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    return { isValid: false, error: "Date range cannot exceed 365 days" };
  }

  return { isValid: true };
};

export const validateComplianceStandards = (standards: string[]): boolean => {
  const validStandards = ["PEC2017", "OSHS", "ISO25010", "RA11285"];
  return standards.every((standard) => validStandards.includes(standard));
};

// ✅ ENHANCED: File and blob utilities
export const formatFileSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB"];

  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

export const getMimeType = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    html: "text/html",
    json: "application/json",
    xml: "application/xml",
    txt: "text/plain",
  };

  return mimeTypes[extension || ""] || "application/octet-stream";
};

export const isValidFileExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};

export const generateReportFilename = (
  reportType: string,
  title: string,
  format: string,
  timestamp?: Date
): string => {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().split("T")[0];
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  const extension = format === "excel" ? "xlsx" : format;

  return `${reportType}_${safeTitle}_${dateStr}.${extension}`;
};

// ✅ ENHANCED: Report progress tracking utilities
export const calculateReportProgress = (
  status: string,
  generationTimeSeconds?: number,
  estimatedTimeSeconds?: number
): number => {
  switch (status) {
    case "generating":
      if (generationTimeSeconds && estimatedTimeSeconds) {
        return Math.min(
          (generationTimeSeconds / estimatedTimeSeconds) * 100,
          95
        );
      }
      return 50; // Default progress for generating status
    case "completed":
      return 100;
    case "failed":
    case "cancelled":
      return 0;
    default:
      return 0;
  }
};

export const getReportStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    generating: "#3B82F6", // blue
    completed: "#10B981", // green
    failed: "#EF4444", // red
    cancelled: "#6B7280", // gray
  };

  return colors[status] || "#6B7280";
};

export const getReportStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    generating: "⏳",
    completed: "✅",
    failed: "❌",
    cancelled: "⚪",
  };

  return icons[status] || "❓";
};

// ✅ ENHANCED: Download utilities
export const triggerFileDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateBlobForDownload = (
  blob: Blob
): { isValid: boolean; error?: string } => {
  if (!blob) {
    return { isValid: false, error: "No file data received" };
  }

  if (blob.size === 0) {
    return { isValid: false, error: "File is empty" };
  }

  // Check for reasonable file size (up to 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (blob.size > maxSize) {
    return { isValid: false, error: "File size exceeds maximum limit" };
  }

  return { isValid: true };
};

// ✅ ENHANCED: Report analytics utilities
export const calculateReportMetrics = (
  reports: Report[]
): {
  totalReports: number;
  completedReports: number;
  failedReports: number;
  averageGenerationTime: number;
  successRate: number;
  totalFileSize: number;
  formatDistribution: Record<string, number>;
} => {
  const totalReports = reports.length;
  const completedReports = reports.filter(
    (r) => r.status === "completed"
  ).length;
  const failedReports = reports.filter((r) => r.status === "failed").length;

  const completedWithTime = reports.filter(
    (r) => r.status === "completed" && r.generationTimeSeconds
  );
  const averageGenerationTime =
    completedWithTime.length > 0
      ? completedWithTime.reduce(
          (sum, r) => sum + (r.generationTimeSeconds || 0),
          0
        ) / completedWithTime.length
      : 0;

  const successRate =
    totalReports > 0 ? (completedReports / totalReports) * 100 : 0;

  const totalFileSize = reports
    .filter((r) => r.fileSizeMb)
    .reduce((sum, r) => sum + (r.fileSizeMb || 0), 0);

  const formatDistribution = reports.reduce(
    (dist, report) => {
      const format = report.format || "unknown";
      dist[format] = (dist[format] || 0) + 1;
      return dist;
    },
    {} as Record<string, number>
  );

  return {
    totalReports,
    completedReports,
    failedReports,
    averageGenerationTime,
    successRate,
    totalFileSize,
    formatDistribution,
  };
};

// Export all utilities
export default {
  transformToServerFields,
  transformFromServerFields,
  formatValidationErrors,
  formatDateForServer,
  parseServerNumber,
  parseServerBoolean,
  parsePagination,
  buildServerUrl,
  extractErrorMessage,
  getServerStatus,
  shouldRetryRequest,
  validateJWT,
  isTokenExpired,
  getServerEnvironment,
  validateApiConfig,
  normalizeApiResponse,
  generateRequestId,
  generateCacheKey,
  validateServerFields,
  validateServerComputedFields,
  isApiResponse,
  isApiError,
  deepMergeObjects,
  extractResponseMetadata,
  convertServerDataTypes,
  getCacheTTL,
  validateMaintenanceSchedule,
  validatePowerQualityEventType,
  validateReportType,
  validateReportFormat,
  validateReportStatus,
  validateDateRange,
  validateComplianceStandards,
  formatFileSize,
  getMimeType,
  isValidFileExtension,
  generateReportFilename,
  calculateReportProgress,
  getReportStatusColor,
  getReportStatusIcon,
  triggerFileDownload,
  validateBlobForDownload,
  calculateReportMetrics,
};
