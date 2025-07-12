// lib/api-utils.ts

import { ApiResponse, ApiError, User } from "@/types/api-types";

/**
 * ✅ Server-aligned utility functions for API operations (ERROR-FREE VERSION)
 */

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

// ✅ FIXED: Server field name transformations (NO DUPLICATES)
export const transformToServerFields = (
  obj: Record<string, any>
): Record<string, any> => {
  const serverFieldMap: Record<string, string> = {
    // User fields
    firstName: "first_name",
    lastName: "last_name",
    userId: "user_id",

    // Building fields
    buildingId: "building_id",
    buildingType: "building_type",
    areaSqm: "area_sqm",
    yearBuilt: "year_built",

    // Equipment fields
    equipmentId: "equipment_id",
    equipmentType: "equipment_type",
    powerRatingKw: "power_rating_kw",
    voltageRating: "voltage_rating",
    currentRatingA: "current_rating_a",
    installationDate: "installation_date",
    warrantyExpiry: "warranty_expiry",
    serialNumber: "serial_number",
    qrCode: "qr_code",
    maintenanceSchedule: "maintenance_schedule",
    conditionScore: "condition_score",

    // Energy fields
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
    offPeakConsumptionKwh: "off_peak_consumption_kwh",
    peakConsumptionKwh: "peak_consumption_kwh",
    temperatureC: "temperature_c",
    humidityPercent: "humidity_percent",

    // Power Quality fields
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

    // Alert fields
    alertId: "alert_id",
    severityLevel: "severity_level",
    estimatedCostImpact: "estimated_cost_impact",
    estimatedDowntimeHours: "estimated_downtime_hours",
    detectedValue: "detected_value",
    thresholdValue: "threshold_value",
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

    // Audit fields
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

    // Report fields
    reportId: "report_id",
    reportType: "report_type",
    requestedBy: "requested_by",
    requesterName: "requester_name",
    fileSizeMb: "file_size_mb",
    filePath: "file_path",
    downloadUrl: "download_url",
    downloadCount: "download_count",
    expiresAt: "expires_at",
    generationTimeSeconds: "generation_time_seconds",
    errorMessage: "error_message",
    completedAt: "completed_at",

    // Background Job fields
    jobId: "job_id",
    jobType: "job_type",
    startedBy: "started_by",
    startedByName: "started_by_name",
    estimatedCompletion: "estimated_completion",
    actualCompletion: "actual_completion",
    executionTimeSeconds: "execution_time_seconds",
    maxRetries: "max_retries",
    startedAt: "started_at",

    // Date fields (avoiding duplicates)
    startDate: "start_date",
    endDate: "end_date",
    scheduledDate: "scheduled_date",
    createdAt: "created_at",
    updatedAt: "updated_at",

    // Common query parameters (keep original for server compatibility)
    sortBy: "sortBy",
    sortOrder: "sortOrder",
    page: "page",
    limit: "limit",
    search: "search",
    status: "status",
    severity: "severity",
    priority: "priority",
  };

  const transformed: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    // Skip null, undefined, empty strings, and empty arrays
    if (value === null || value === undefined) return;
    if (typeof value === "string" && value.trim() === "") return;
    if (Array.isArray(value) && value.length === 0) return;

    const serverKey = serverFieldMap[key] || key;
    transformed[serverKey] = value;
  });

  return transformed;
};

// ✅ FIXED: Transform server response to frontend format
export const transformFromServerFields = (
  obj: Record<string, any>
): Record<string, any> => {
  const frontendFieldMap: Record<string, string> = {
    // Reverse mapping from server to frontend
    first_name: "firstName",
    last_name: "lastName",
    user_id: "userId",
    building_id: "buildingId",
    equipment_id: "equipmentId",
    start_date: "startDate",
    end_date: "endDate",
    created_at: "createdAt",
    updated_at: "updatedAt",
    // Add more reverse mappings as needed
  };

  const transformed: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const frontendKey = frontendFieldMap[key] || key;
    transformed[frontendKey] = value;
  });

  return transformed;
};

// ✅ Enhanced validation error formatter
export const formatValidationErrors = (
  errors: Array<{ field: string; message: string; value?: any }>
): string => {
  return errors.map((error) => `${error.field}: ${error.message}`).join(", ");
};

// ✅ Server-aligned date formatter
export const formatDateForServer = (date: Date | string): string => {
  if (typeof date === "string") {
    return new Date(date).toISOString();
  }
  return date.toISOString();
};

// ✅ Safe number parser for server responses
export const parseServerNumber = (value: any): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// ✅ Safe boolean parser for server responses
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

// ✅ Pagination helper for server responses
export const parsePagination = (pagination: any) => {
  if (!pagination) return null;

  return {
    currentPage: pagination.current_page || pagination.page || 1,
    perPage: pagination.per_page || pagination.limit || 20,
    totalPages: pagination.total_pages || 1,
    totalCount: pagination.total_count || pagination.total || 0,
    hasNext: pagination.has_next_page || pagination.hasNext || false,
    hasPrev: pagination.has_prev_page || pagination.hasPrev || false,
  };
};

// ✅ URL builder for complex queries
export const buildServerUrl = (
  baseUrl: string,
  params: Record<string, any>
): string => {
  const serverParams = transformToServerFields(params);
  const urlParams = new URLSearchParams();

  Object.entries(serverParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => urlParams.append(key, String(item)));
    } else {
      urlParams.append(key, String(value));
    }
  });

  const queryString = urlParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// ✅ Error message extractor
export const extractErrorMessage = (error: any): string => {
  // Check for API error format
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for validation errors
  if (error?.response?.data?.validation_errors) {
    return formatValidationErrors(error.response.data.validation_errors);
  }

  // Check for generic error message
  if (error?.message) {
    return error.message;
  }

  // Default fallback
  return "An unexpected error occurred";
};

// ✅ Server status checker
export const getServerStatus = (
  statusCode: number
): "success" | "error" | "warning" => {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  return "error";
};

// ✅ Retry logic helper
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

// ✅ JWT token validator
export const validateJWT = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9_-]+$/;
    if (!parts.every((part) => base64Regex.test(part))) return false;

    // Validate header
    const header = JSON.parse(atob(parts[0]));
    if (!header.alg || !header.typ) return false;

    // Validate payload structure
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp || !payload.iat) return false;

    return true;
  } catch {
    return false;
  }
};

// ✅ Token expiry checker
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

// ✅ Server environment detector
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

// ✅ API configuration validator
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

// ✅ FIXED: Response data normalizer with proper generic types
export const normalizeApiResponse = <T>(response: any): ApiResponse<T> => {
  // Handle different response formats from server
  if (isApiResponse<T>(response)) {
    return response;
  }

  // Handle direct data responses
  if (response?.data && !response.success) {
    return {
      success: true,
      message: "Success",
      data: response.data as T,
    };
  }

  // Handle raw data
  return {
    success: true,
    message: "Success",
    data: response as T,
  };
};

// ✅ Request ID generator for tracking
export const generateRequestId = (): string => {
  const timestamp = Date.now().toString();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `req_${timestamp}_${randomStr}`;
};

// ✅ Cache key generator for API responses
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

// ✅ Server field validation
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

// ✅ Export all utilities
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
  isApiResponse,
  isApiError,
};
