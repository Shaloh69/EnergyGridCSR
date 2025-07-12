// lib/api-config.ts

import { validateApiConfig } from "./api-utils";

/**
 * ✅ Centralized API configuration with server alignment validation
 */

export interface ApiConfiguration {
  baseUrl: string;
  version: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableRequestId: boolean;
  enableLogging: boolean;
  enableCaching: boolean;
  authTokenKey: string;
  refreshTokenKey: string;
  tokenExpiryKey: string;
  userDataKey: string;
  environment: "development" | "staging" | "production";
}

// ✅ Default configuration aligned with server expectations
export const defaultApiConfig: ApiConfiguration = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001",
  version: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  timeout: parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || "30000"),
  retries: 3,
  retryDelay: 1000,
  enableRequestId: process.env.NEXT_PUBLIC_ENABLE_REQUEST_ID === "true",
  enableLogging: process.env.NODE_ENV === "development",
  enableCaching: process.env.NEXT_PUBLIC_ENABLE_CACHING === "true",
  authTokenKey: "access_token", // ✅ Server uses snake_case
  refreshTokenKey: "refresh_token", // ✅ Server uses snake_case
  tokenExpiryKey: "token_expires_at",
  userDataKey: "user",
  environment: (process.env.NODE_ENV as any) || "development",
};

// ✅ Environment-specific configurations
export const environmentConfigs: Record<string, Partial<ApiConfiguration>> = {
  development: {
    baseUrl: "http://localhost:3001",
    enableLogging: true,
    timeout: 10000,
  },
  staging: {
    baseUrl:
      process.env.NEXT_PUBLIC_STAGING_API_URL ||
      "https://api-staging.yourapp.com",
    enableLogging: false,
    timeout: 20000,
  },
  production: {
    baseUrl:
      process.env.NEXT_PUBLIC_PRODUCTION_API_URL || "https://api.yourapp.com",
    enableLogging: false,
    timeout: 30000,
    enableCaching: true,
  },
};

// ✅ Server endpoint mappings with correct paths
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
    PROFILE: "/api/auth/profile",
    USERS: "/api/auth/users",
    PASSWORD_RESET_REQUEST: "/api/auth/password-reset-request",
    PASSWORD_RESET: "/api/auth/password-reset",
    CHANGE_PASSWORD: "/api/auth/change-password",
  },

  // Building management endpoints
  BUILDINGS: {
    BASE: "/api/buildings",
    BY_ID: (id: number) => `/api/buildings/${id}`,
    DELETION_CHECK: (id: number) => `/api/buildings/${id}/deletion-check`,
    ENERGY_PERFORMANCE: (id: number) =>
      `/api/buildings/${id}/energy-performance`,
    COMPLIANCE_STATUS: (id: number) => `/api/buildings/${id}/compliance-status`,
  },

  // Equipment management endpoints
  EQUIPMENT: {
    BASE: "/api/equipment",
    BY_ID: (id: number) => `/api/equipment/${id}`,
    BY_QR: (qrCode: string) => `/api/equipment/qr/${qrCode}`,
    MAINTENANCE: (id: number) => `/api/equipment/${id}/maintenance`,
    PERFORMANCE: (id: number) => `/api/equipment/${id}/performance`,
    MAINTENANCE_SCHEDULE: "/api/equipment/maintenance/schedule",
    MAINTENANCE_SCHEDULE_BY_BUILDING: (buildingId: number) =>
      `/api/equipment/maintenance/schedule/${buildingId}`,
  },

  // Energy monitoring endpoints
  ENERGY: {
    BASE: "/api/energy",
    STATS: (buildingId: number) => `/api/energy/stats/${buildingId}`,
    TRENDS: (buildingId: number) => `/api/energy/trends/${buildingId}`,
    COMPARISON: "/api/energy/comparison",
    COST_ANALYSIS: "/api/energy/cost-analysis",
    BENCHMARKING: (buildingId: number) =>
      `/api/energy/benchmarking/${buildingId}`,
  },

  // Power quality endpoints
  POWER_QUALITY: {
    BASE: "/api/power-quality",
    STATS: (buildingId: number) => `/api/power-quality/stats/${buildingId}`,
    EVENTS: "/api/power-quality/events",
    TRENDS: "/api/power-quality/trends",
    HARMONICS: "/api/power-quality/harmonics",
    ITIC_ANALYSIS: (buildingId: number) =>
      `/api/power-quality/itic-analysis/${buildingId}`,
  },

  // Alert management endpoints
  ALERTS: {
    BASE: "/api/alerts",
    BY_ID: (id: number) => `/api/alerts/${id}`,
    ACKNOWLEDGE: (id: number) => `/api/alerts/${id}/acknowledge`,
    RESOLVE: (id: number) => `/api/alerts/${id}/resolve`,
    ESCALATE: (id: number) => `/api/alerts/${id}/escalate`,
    ANALYTICS: "/api/alerts/analytics",
    STATISTICS: "/api/alerts/statistics",
    TEST_MONITORING: (buildingId: number) =>
      `/api/alerts/test-monitoring/${buildingId}`,
    THRESHOLDS: "/api/alerts/thresholds",
    PROCESS_ESCALATIONS: "/api/alerts/process-escalations",
  },

  // Analytics endpoints
  ANALYTICS: {
    ANALYSIS: "/api/analytics/analysis",
    DASHBOARD: "/api/analytics/dashboard",
    ANOMALIES: "/api/analytics/anomalies",
    BASELINE: (buildingId: number) => `/api/analytics/baseline/${buildingId}`,
    POWER_QUALITY: (buildingId: number, readingId: number) =>
      `/api/analytics/power-quality/${buildingId}/${readingId}`,
  },

  // Audit management endpoints
  AUDITS: {
    BASE: "/api/audits",
    BY_ID: (id: number) => `/api/audits/${id}`,
    START: (id: number) => `/api/audits/${id}/start`,
    COMPLETE: (id: number) => `/api/audits/${id}/complete`,
    SUMMARY: "/api/audits/summary",
    FINDINGS: (id: number) => `/api/audits/${id}/findings`,
  },

  // Compliance endpoints
  COMPLIANCE: {
    AUDIT: (auditId: number) => `/api/compliance/audit/${auditId}`,
    CHECK: "/api/compliance/check",
    REPORT: (auditId: number) => `/api/compliance/report/${auditId}`,
    TRENDS: "/api/compliance/trends",
    TRENDS_BY_BUILDING: (buildingId: number) =>
      `/api/compliance/trends/${buildingId}`,
    STANDARDS: "/api/compliance/standards",
    REQUIREMENTS: (standard: string) =>
      `/api/compliance/standards/${standard}/requirements`,
    REPORTS: (auditId: number) => `/api/compliance/reports/${auditId}`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    OVERVIEW: "/api/dashboard/overview",
    REAL_TIME: "/api/dashboard/real-time",
    KPIS: "/api/dashboard/kpis",
    ENERGY_SUMMARY: "/api/dashboard/energy-summary",
    POWER_QUALITY_SUMMARY: "/api/dashboard/power-quality-summary",
    AUDIT_SUMMARY: "/api/dashboard/audit-summary",
    COMPLIANCE_SUMMARY: "/api/dashboard/compliance-summary",
    ALERTS: "/api/dashboard/alerts",
    COST_ANALYSIS: "/api/dashboard/cost-analysis",
    ENVIRONMENTAL_IMPACT: "/api/dashboard/environmental-impact",
  },

  // Monitoring endpoints
  MONITORING: {
    DASHBOARD: "/api/monitoring/dashboard",
    ACTIVITIES: "/api/monitoring/activities",
    BUILDING_RECENT: (buildingId: number) =>
      `/api/monitoring/building/${buildingId}/recent`,
    JOBS: "/api/monitoring/jobs",
    JOB_BY_ID: (jobId: number) => `/api/monitoring/jobs/${jobId}`,
    SYSTEM_STATUS: "/api/monitoring/system-status",
    CACHE_CLEAR: "/api/monitoring/cache/clear",
    DATA_COLLECTION: "/api/monitoring/data-collection",
  },

  // Report generation endpoints
  REPORTS: {
    BASE: "/api/reports",
    BY_ID: (id: number) => `/api/reports/${id}`,
    DOWNLOAD: (id: number) => `/api/reports/${id}/download`,
    STATUS: (id: number) => `/api/reports/${id}/status`,
    REGENERATE: (id: number) => `/api/reports/${id}/regenerate`,
    SCHEDULE: (id: number) => `/api/reports/${id}/schedule`,
    STATS: "/api/reports/stats",
    ENERGY: "/api/reports/energy",
    COMPLIANCE: "/api/reports/compliance",
    POWER_QUALITY: "/api/reports/power-quality",
    AUDIT: "/api/reports/audit",
    MONITORING: "/api/reports/monitoring",
    CUSTOM: "/api/reports/custom",
  },

  // Health check endpoint
  HEALTH: "/health",
} as const;

// ✅ Server response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ✅ Server error codes matching backend
export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  AUTHORIZATION_FAILED: "AUTHORIZATION_FAILED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
} as const;

// ✅ Request/Response interceptor configurations
export const INTERCEPTOR_CONFIG = {
  REQUEST: {
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_STATUS_CODES: [500, 502, 503, 504],
  },
  RESPONSE: {
    VALIDATE_SCHEMA: true,
    LOG_ERRORS: true,
    EXTRACT_VALIDATION_ERRORS: true,
  },
} as const;

// ✅ Cache configuration for API responses
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  ENDPOINTS: {
    "/api/buildings": 10 * 60 * 1000, // 10 minutes
    "/api/equipment": 10 * 60 * 1000, // 10 minutes
    "/api/dashboard/overview": 2 * 60 * 1000, // 2 minutes
    "/api/auth/profile": 15 * 60 * 1000, // 15 minutes
  },
} as const;

// ✅ Configuration factory function
export const createApiConfig = (
  environment: string = process.env.NODE_ENV || "development"
): ApiConfiguration => {
  const envConfig = environmentConfigs[environment] || {};
  const config = { ...defaultApiConfig, ...envConfig };

  // Validate configuration
  const validation = validateApiConfig(config);
  if (!validation.isValid) {
    console.error("❌ Invalid API configuration:", validation.errors);
    throw new Error(
      `Invalid API configuration: ${validation.errors.join(", ")}`
    );
  }

  return config;
};

// ✅ Runtime configuration validation
export const validateRuntimeConfig = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  if (!process.env.NEXT_PUBLIC_API_BASE) {
    errors.push("NEXT_PUBLIC_API_BASE environment variable is required");
  }

  // Check API base URL format
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (apiBase && !apiBase.match(/^https?:\/\/.+/)) {
    errors.push("NEXT_PUBLIC_API_BASE must be a valid HTTP/HTTPS URL");
  }

  // Check timeout configuration
  const timeout = process.env.NEXT_PUBLIC_REQUEST_TIMEOUT;
  if (timeout && (isNaN(parseInt(timeout)) || parseInt(timeout) < 1000)) {
    warnings.push("NEXT_PUBLIC_REQUEST_TIMEOUT should be at least 1000ms");
  }

  // Check if we're in production with localhost
  if (process.env.NODE_ENV === "production" && apiBase?.includes("localhost")) {
    warnings.push("Production environment should not use localhost API URL");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// ✅ Get current active configuration
export const getActiveConfig = (): ApiConfiguration => {
  const environment = process.env.NODE_ENV || "development";
  return createApiConfig(environment);
};

// ✅ Configuration health check
export const checkConfigHealth = async (): Promise<{
  status: "healthy" | "warning" | "error";
  checks: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    message: string;
  }>;
}> => {
  const checks: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    message: string;
  }> = [];
  const config = getActiveConfig();

  // Environment check
  checks.push({
    name: "Environment Configuration",
    status: config.environment === "production" ? "pass" : "warn",
    message: `Running in ${config.environment} mode`,
  });

  // URL reachability check
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${config.baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    checks.push({
      name: "API Connectivity",
      status: response.ok ? "pass" : "fail",
      message: response.ok
        ? "API is reachable"
        : `API returned ${response.status}`,
    });
  } catch (error) {
    checks.push({
      name: "API Connectivity",
      status: "fail",
      message: "Unable to reach API server",
    });
  }

  // Configuration validation
  const validation = validateRuntimeConfig();
  checks.push({
    name: "Configuration Validation",
    status: validation.isValid ? "pass" : "fail",
    message: validation.isValid
      ? "All configuration is valid"
      : `Configuration errors: ${validation.errors.join(", ")}`,
  });

  // Determine overall status
  const hasErrors = checks.some((check) => check.status === "fail");
  const hasWarnings = checks.some((check) => check.status === "warn");

  const status: "healthy" | "warning" | "error" = hasErrors
    ? "error"
    : hasWarnings
      ? "warning"
      : "healthy";

  return { status, checks };
};

// Export the active configuration
export default getActiveConfig();
