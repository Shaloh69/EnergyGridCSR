import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type {
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
  Report,
  DashboardOverview,
  BackgroundJob,
  ApiResponse,
  ApiError,
  BuildingQueryParams,
  EquipmentQueryParams,
  EnergyQueryParams,
  PowerQualityQueryParams,
  AlertQueryParams,
  AuditQueryParams,
  ReportQueryParams,
  JobQueryParams,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordReset,
  ProfileUpdate,
  PasswordChange,
  EnergyStatsResponse,
  PowerQualityStatsResponse,
  AlertStatistics,
  MaintenanceSchedule,
  EnergySummary,
  PowerQualitySummary,
  AuditSummary,
  ComplianceSummary,
  MonitoringActivity,
  SystemHealthStatus,
  BuildingDeletionCheck,
} from "@/types/api-types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || "v1";
const REQUEST_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || "30000"
);

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE environment variable is not set");
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    retryCount: number;
    startTime: number;
  };
}

const isValidJWT = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const validBase64Regex = /^[A-Za-z0-9_-]+$/;
    for (let i = 0; i < parts.length; i++) {
      if (!validBase64Regex.test(parts[i])) return false;
    }

    try {
      const header = JSON.parse(atob(parts[0]));
      if (!header.alg || !header.typ) return false;
    } catch {
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ JWT validation error:", error);
    return false;
  }
};

const isTokenExpired = (token: string, bufferMinutes: number = 5): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferSeconds = bufferMinutes * 60;
    return payload.exp && payload.exp - bufferSeconds < currentTime;
  } catch (error) {
    console.error("❌ Token expiration check failed:", error);
    return true;
  }
};

// ✅ FIXED: Simplified token extraction to match server response
const extractTokens = (
  responseData: any
): {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  expiresIn?: number;
} => {
  // ✅ Handle both server response formats (camelCase and snake_case)
  const accessToken = responseData?.accessToken || responseData?.access_token;
  const refreshToken =
    responseData?.refreshToken || responseData?.refresh_token;
  const user = responseData?.user;
  const expiresIn = responseData?.expiresIn || responseData?.expires_in;

  return { accessToken, refreshToken, user, expiresIn };
};

// ✅ FIXED: Server-aligned parameter transformation
const transformToServerParams = (
  params: Record<string, any>
): Record<string, any> => {
  if (!params) return {};

  // ✅ FIXED: Complete mapping of camelCase to snake_case for server
  const keyMap: Record<string, string> = {
    // Building/Equipment IDs
    buildingId: "building_id",
    equipmentId: "equipment_id",

    // User fields
    userId: "user_id",
    firstName: "first_name",
    lastName: "last_name",

    // Type fields
    buildingType: "building_type",
    equipmentType: "equipment_type",
    auditType: "audit_type",
    reportType: "report_type",
    jobType: "job_type",
    energyType: "energy_type",

    // Date fields
    startDate: "start_date",
    endDate: "end_date",
    scheduledDate: "scheduled_date",

    // Other ID fields
    auditId: "audit_id",
    alertId: "alert_id",

    // Keep these as-is (server expects these exact names)
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

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === "string" && value.trim() === "") return;
    if (Array.isArray(value) && value.length === 0) return;

    const serverKey = keyMap[key] || key;
    transformed[serverKey] = value;
  });

  return transformed;
};

const retryConfig = {
  retries: 3,
  retryDelay: (retryCount: number) =>
    Math.min(Math.pow(2, retryCount) * 1000, 10000),
  retryCondition: (error: AxiosError) => {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 && status < 600;
  },
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const customConfig = config as CustomAxiosRequestConfig;

    const token = getCleanToken();
    if (token) {
      customConfig.headers.Authorization = `Bearer ${token}`;
    }

    customConfig.metadata = {
      retryCount: 0,
      startTime: Date.now(),
    };

    if (process.env.NEXT_PUBLIC_ENABLE_REQUEST_ID === "true") {
      customConfig.headers["X-Request-ID"] =
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    Object.keys(customConfig.headers).forEach((key) => {
      if (customConfig.headers[key] === undefined) {
        delete customConfig.headers[key];
      }
    });

    return customConfig;
  },
  (error) => Promise.reject(error)
);

// ✅ FIXED: Enhanced error handling for server validation errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig;
    const apiError = error.response?.data as ApiError;

    // ✅ FIXED: Enhanced error logging with validation details
    if (process.env.NODE_ENV === "development") {
      console.error("🚨 API Error:", {
        method: config?.method?.toUpperCase(),
        url: config?.url,
        status: error.response?.status,
        message: apiError?.message || error.message,
        validationErrors: apiError?.validation_errors,
        retryCount: config?.metadata?.retryCount || 0,
      });
    }

    // Handle 401 (Unauthorized)
    if (error.response?.status === 401) {
      clearTokens();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Handle retries for 5xx errors
    if (
      config &&
      config.metadata &&
      config.metadata.retryCount < retryConfig.retries &&
      retryConfig.retryCondition(error)
    ) {
      config.metadata.retryCount = (config.metadata.retryCount || 0) + 1;
      const delay = retryConfig.retryDelay(config.metadata.retryCount);

      await new Promise((resolve) => setTimeout(resolve, delay));
      config.metadata.startTime = Date.now();

      return api.request(config);
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (
    email: string,
    password: string
  ): Promise<AxiosResponse<AuthResponse>> => {
    const credentials: LoginCredentials = { email, password };
    const response = await api.post<AuthResponse>(
      "/api/auth/login",
      credentials
    );

    if (response.data?.success) {
      const { accessToken, refreshToken, user, expiresIn } = extractTokens(
        response.data.data || response.data
      );

      if (!accessToken || !refreshToken) {
        throw new Error("Authentication response missing required tokens");
      }

      storeTokens(accessToken, refreshToken, user!, expiresIn);
    }

    return response;
  },

  register: async (
    userData: RegisterData
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await api.post<AuthResponse>(
      "/api/auth/register",
      userData
    );

    if (response.data?.success) {
      const { accessToken, refreshToken, user, expiresIn } = extractTokens(
        response.data.data || response.data
      );

      if (accessToken && refreshToken) {
        storeTokens(accessToken, refreshToken, user!, expiresIn);
      }
    }

    return response;
  },

  getProfile: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/auth/profile");
  },

  getUsers: (): Promise<AxiosResponse<ApiResponse<User[]>>> => {
    return api.get("/api/auth/users");
  },

  // ✅ FIXED: Refresh token to match server expectation
  refreshToken: async (): Promise<AxiosResponse<AuthResponse>> => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post<AuthResponse>("/api/auth/refresh", {
      refreshToken: refreshToken, // ✅ Server expects camelCase in request body
    });

    if (response.data?.success) {
      const {
        accessToken,
        refreshToken: newRefreshToken,
        user,
        expiresIn,
      } = extractTokens(response.data.data || response.data);

      if (accessToken && newRefreshToken) {
        storeTokens(accessToken, newRefreshToken, user!, expiresIn);
      }
    }

    return response;
  },

  requestPasswordReset: (
    email: string
  ): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    const resetData: PasswordResetRequest = { email };
    return api.post("/api/auth/password-reset-request", resetData);
  },

  resetPassword: (
    resetData: PasswordReset
  ): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    return api.post("/api/auth/password-reset", resetData);
  },

  updateProfile: (
    profileData: ProfileUpdate
  ): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.put("/api/auth/profile", profileData);
  },

  changePassword: (
    passwordData: PasswordChange
  ): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    return api.put("/api/auth/change-password", passwordData);
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.warn("⚠️ Server logout failed, proceeding with local cleanup");
    }

    clearTokens();

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
};

export const buildingsAPI = {
  getAll: (
    params?: BuildingQueryParams
  ): Promise<AxiosResponse<ApiResponse<Building[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/buildings", { params: serverParams });
  },

  create: (
    buildingData: Partial<Building>
  ): Promise<AxiosResponse<ApiResponse<Building>>> => {
    return api.post("/api/buildings", buildingData);
  },

  checkDeletion: (
    id: number
  ): Promise<AxiosResponse<ApiResponse<BuildingDeletionCheck>>> => {
    return api.get(`/api/buildings/${id}/deletion-check`);
  },

  delete: async (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/buildings/${id}`);
  },

  setInactive: async (
    id: number
  ): Promise<AxiosResponse<ApiResponse<Building>>> => {
    return buildingsAPI.update(id, { status: "inactive" });
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Building>>> => {
    return api.get(`/api/buildings/${id}`);
  },

  update: (
    id: number,
    data: Partial<Building>
  ): Promise<AxiosResponse<ApiResponse<Building>>> => {
    return api.put(`/api/buildings/${id}`, data);
  },

  getEnergyPerformance: (
    id: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const params = period ? { period } : {};
    return api.get(`/api/buildings/${id}/energy-performance`, { params });
  },

  getComplianceStatus: (
    id: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/buildings/${id}/compliance-status`);
  },
};

export const equipmentAPI = {
  getAll: (
    params?: EquipmentQueryParams
  ): Promise<AxiosResponse<ApiResponse<Equipment[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/equipment", { params: serverParams });
  },

  create: (
    equipmentData: Partial<Equipment>
  ): Promise<AxiosResponse<ApiResponse<Equipment>>> => {
    return api.post("/api/equipment", equipmentData);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Equipment>>> => {
    return api.get(`/api/equipment/${id}`);
  },

  getByQR: (qrCode: string): Promise<AxiosResponse<ApiResponse<Equipment>>> => {
    return api.get(`/api/equipment/qr/${qrCode}`);
  },

  update: (
    id: number,
    data: Partial<Equipment>
  ): Promise<AxiosResponse<ApiResponse<Equipment>>> => {
    return api.put(`/api/equipment/${id}`, data);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/equipment/${id}`);
  },

  getMaintenanceHistory: (
    id: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/equipment/${id}/maintenance`);
  },

  logMaintenance: (
    id: number,
    maintenanceData: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post(`/api/equipment/${id}/maintenance`, maintenanceData);
  },

  getPerformanceAnalytics: (
    id: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const params = period ? { period } : {};
    return api.get(`/api/equipment/${id}/performance`, { params });
  },

  getMaintenanceSchedule: (
    buildingId?: number
  ): Promise<AxiosResponse<ApiResponse<MaintenanceSchedule>>> => {
    const endpoint = buildingId
      ? `/api/equipment/maintenance/schedule/${buildingId}`
      : "/api/equipment/maintenance/schedule";
    return api.get(endpoint);
  },
};

export const energyAPI = {
  // ✅ FIXED: Energy consumption endpoint to use proper server-aligned parameters
  getConsumption: (
    params: EnergyQueryParams
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams(params);
    return api.get("/api/energy", { params: serverParams });
  },

  // ✅ FIXED: Energy reading creation to match server validation
  createReading: (
    readingData: Partial<EnergyReading>
  ): Promise<AxiosResponse<ApiResponse<EnergyReading>>> => {
    return api.post("/api/energy", readingData);
  },

  getStats: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<EnergyStatsResponse>>> => {
    return api.get(`/api/energy/stats/${buildingId}`);
  },

  getTrends: (
    buildingId: number,
    params?: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get(`/api/energy/trends/${buildingId}`, {
      params: serverParams,
    });
  },

  getComparison: (params?: any): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/energy/comparison", { params: serverParams });
  },

  getCostAnalysis: (
    buildingId: number,
    startDate: string,
    endDate: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams({
      building_id: buildingId,
      start_date: startDate,
      end_date: endDate,
    });
    return api.get("/api/energy/cost-analysis", { params: serverParams });
  },

  getBenchmarking: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/energy/benchmarking/${buildingId}`);
  },
};

export const powerQualityAPI = {
  getData: (
    params: PowerQualityQueryParams
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams(params);
    return api.get("/api/power-quality", { params: serverParams });
  },

  createReading: (
    readingData: Partial<PowerQualityReading>
  ): Promise<AxiosResponse<ApiResponse<PowerQualityReading>>> => {
    return api.post("/api/power-quality", readingData);
  },

  getStats: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<PowerQualityStatsResponse>>> => {
    return api.get(`/api/power-quality/stats/${buildingId}`);
  },

  getEvents: (
    buildingId: number,
    params: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams({
      building_id: buildingId,
      ...params,
    });
    return api.get("/api/power-quality/events", { params: serverParams });
  },

  getTrends: (
    buildingId: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams({
      building_id: buildingId,
      period,
    });
    return api.get("/api/power-quality/trends", { params: serverParams });
  },

  getHarmonicsAnalysis: (
    buildingId: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams({
      building_id: buildingId,
      period,
    });
    return api.get("/api/power-quality/harmonics", { params: serverParams });
  },

  getITICAnalysis: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/power-quality/itic-analysis/${buildingId}`);
  },
};

export const alertsAPI = {
  getAll: (
    params?: AlertQueryParams
  ): Promise<AxiosResponse<ApiResponse<Alert[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/alerts", { params: serverParams });
  },

  create: (
    alertData: Partial<Alert>
  ): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    return api.post("/api/alerts", alertData);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    return api.get(`/api/alerts/${id}`);
  },

  acknowledge: (id: number): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    return api.post(`/api/alerts/${id}/acknowledge`);
  },

  resolve: (
    id: number,
    resolutionData?: any
  ): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    return api.post(`/api/alerts/${id}/resolve`, resolutionData);
  },

  escalate: (
    id: number,
    escalationData?: any
  ): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    return api.post(`/api/alerts/${id}/escalate`, escalationData);
  },

  update: (
    id: number,
    data: Partial<Alert>
  ): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    return api.put(`/api/alerts/${id}`, data);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/alerts/${id}`);
  },

  getAnalytics: (
    buildingId?: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams({
      building_id: buildingId,
      period,
    });
    return api.get("/api/alerts/analytics", { params: serverParams });
  },

  getStatistics: (): Promise<AxiosResponse<ApiResponse<AlertStatistics>>> => {
    return api.get("/api/alerts/statistics");
  },

  testMonitoring: (
    buildingId: number,
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post(`/api/alerts/test-monitoring/${buildingId}`, data);
  },

  getThresholds: (params?: any): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/alerts/thresholds", { params: serverParams });
  },

  createThreshold: (
    thresholdData: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post("/api/alerts/thresholds", thresholdData);
  },

  processEscalations: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post("/api/alerts/process-escalations");
  },
};

export const analyticsAPI = {
  runAnalysis: (params: {
    building_id: number;
    start_date: string;
    end_date: string;
    analysis_types: string[];
  }): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams(params);
    return api.get("/api/analytics/analysis", { params: serverParams });
  },

  getDashboard: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/analytics/dashboard");
  },

  detectAnomalies: (data: any): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post("/api/analytics/anomalies", data);
  },

  calculateBaseline: (
    buildingId: number,
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post(`/api/analytics/baseline/${buildingId}`, data);
  },

  analyzePowerQuality: (
    buildingId: number,
    readingId: number,
    data?: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post(
      `/api/analytics/power-quality/${buildingId}/${readingId}`,
      data
    );
  },
};

export const auditsAPI = {
  getAll: (
    params?: AuditQueryParams
  ): Promise<AxiosResponse<ApiResponse<Audit[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/audits", { params: serverParams });
  },

  create: (
    auditData: Partial<Audit>
  ): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    return api.post("/api/audits", auditData);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    return api.get(`/api/audits/${id}`);
  },

  update: (
    id: number,
    data: Partial<Audit>
  ): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    return api.put(`/api/audits/${id}`, data);
  },

  start: (id: number): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    return api.post(`/api/audits/${id}/start`);
  },

  complete: (
    id: number,
    completionData?: any
  ): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    return api.post(`/api/audits/${id}/complete`, completionData);
  },

  getSummary: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/audits/summary");
  },

  getFindings: (id: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/audits/${id}/findings`);
  },

  addFinding: (
    id: number,
    findingData: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post(`/api/audits/${id}/findings`, findingData);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/audits/${id}`);
  },
};

export const complianceAPI = {
  getAuditChecks: (
    auditId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/compliance/audit/${auditId}`);
  },

  performCheck: (data: {
    auditId: number;
    standardType: string;
    checkData: any;
  }): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post("/api/compliance/check", data);
  },

  getComplianceReport: (
    auditId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/compliance/report/${auditId}`);
  },

  getComplianceTrends: (
    buildingId: number,
    params?: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get(`/api/compliance/trends/${buildingId}`, {
      params: serverParams,
    });
  },

  getStandards: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/compliance/standards");
  },

  getRequirements: (
    standard: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/compliance/standards/${standard}/requirements`);
  },

  getTrends: (
    buildingId: number,
    standard?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const serverParams = transformToServerParams({
      building_id: buildingId,
      standard,
    });
    return api.get("/api/compliance/trends", { params: serverParams });
  },

  generateReport: (
    auditId: number,
    standards: string[]
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post(`/api/compliance/reports/${auditId}`, { standards });
  },
};

export const dashboardAPI = {
  getOverview: (): Promise<AxiosResponse<ApiResponse<DashboardOverview>>> => {
    return api.get("/api/dashboard/overview");
  },

  getRealTime: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/dashboard/real-time");
  },

  getKPIs: (buildingId?: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    const params = buildingId ? { building_id: buildingId } : {};
    return api.get("/api/dashboard/kpis", { params });
  },

  getEnergySummary: (params?: {
    period?: string;
    building_id?: number;
  }): Promise<AxiosResponse<ApiResponse<EnergySummary>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/dashboard/energy-summary", { params: serverParams });
  },

  getPowerQualitySummary: (params?: {
    building_id?: number;
    period?: string;
  }): Promise<AxiosResponse<ApiResponse<PowerQualitySummary>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/dashboard/power-quality-summary", {
      params: serverParams,
    });
  },

  getAuditSummary: (): Promise<AxiosResponse<ApiResponse<AuditSummary>>> => {
    return api.get("/api/dashboard/audit-summary");
  },

  getComplianceSummary: (): Promise<
    AxiosResponse<ApiResponse<ComplianceSummary>>
  > => {
    return api.get("/api/dashboard/compliance-summary");
  },

  getAlerts: (params?: {
    severity?: string;
    limit?: number;
    building_id?: number;
  }): Promise<AxiosResponse<ApiResponse<Alert[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/dashboard/alerts", { params: serverParams });
  },

  getCostAnalysis: (
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const params = period ? { period } : {};
    return api.get("/api/dashboard/cost-analysis", { params });
  },

  getEnvironmentalImpact: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/dashboard/environmental-impact");
  },
};

export const monitoringAPI = {
  getDashboard: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/monitoring/dashboard");
  },

  getActivities: (
    params?: any
  ): Promise<AxiosResponse<ApiResponse<MonitoringActivity[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/monitoring/activities", { params: serverParams });
  },

  getBuildingRecent: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/monitoring/building/${buildingId}/recent`);
  },

  createJob: (jobData: {
    jobType: string;
    buildingId?: number;
    parameters: any;
  }): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post("/api/monitoring/jobs", jobData);
  },

  getJobs: (
    params?: JobQueryParams
  ): Promise<AxiosResponse<ApiResponse<BackgroundJob[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/monitoring/jobs", { params: serverParams });
  },

  getJobStatus: (
    jobId: number
  ): Promise<AxiosResponse<ApiResponse<BackgroundJob>>> => {
    return api.get(`/api/monitoring/jobs/${jobId}`);
  },

  cancelJob: (
    jobId: number
  ): Promise<AxiosResponse<ApiResponse<BackgroundJob>>> => {
    return api.delete(`/api/monitoring/jobs/${jobId}`);
  },

  getSystemHealth: (): Promise<
    AxiosResponse<ApiResponse<SystemHealthStatus>>
  > => {
    return api.get("/api/monitoring/system-status");
  },

  clearCache: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.post("/api/monitoring/cache/clear");
  },

  getDataCollectionStats: (
    buildingId?: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const params = buildingId ? { building_id: buildingId } : {};
    return api.get("/api/monitoring/data-collection", { params });
  },
};

export const reportsAPI = {
  getAll: (
    params?: ReportQueryParams
  ): Promise<AxiosResponse<ApiResponse<Report[]>>> => {
    const serverParams = transformToServerParams(params || {});
    return api.get("/api/reports", { params: serverParams });
  },

  // ✅ FIXED: Report generation to use camelCase body structure as server expects
  generateEnergy: (data: {
    buildingId?: number;
    startDate: string;
    endDate: string;
    title: string;
    includeComparison?: boolean;
    includeTrends?: boolean;
    reportFormat?: string;
    sections?: string[];
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.post("/api/reports/energy", data);
  },

  generateCompliance: (data: {
    auditId: number;
    standards: string[];
    title: string;
    includeGapAnalysis?: boolean;
    reportFormat?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.post("/api/reports/compliance", data);
  },

  generatePowerQuality: (data: {
    buildingId: number;
    startDate: string;
    endDate: string;
    title: string;
    includeEvents?: boolean;
    includeCompliance?: boolean;
    reportFormat?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.post("/api/reports/power-quality", data);
  },

  generateAudit: (data: {
    auditId: number;
    title: string;
    includeCompliance?: boolean;
    includeRecommendations?: boolean;
    reportFormat?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.post("/api/reports/audit", data);
  },

  generateMonitoring: (data: {
    buildingId?: number;
    reportTypes: string[];
    startDate: string;
    endDate: string;
    title: string;
    reportFormat?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.post("/api/reports/monitoring", data);
  },

  generateCustom: (data: {
    title: string;
    templateId?: string;
    dataSources: any[];
    parameters: any;
    format: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.post("/api/reports/custom", data);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.get(`/api/reports/${id}`);
  },

  download: (id: number): Promise<AxiosResponse<Blob>> => {
    return api.get(`/api/reports/${id}/download`, { responseType: "blob" });
  },

  getStatus: (id: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/api/reports/${id}/status`);
  },

  regenerate: (id: number): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.post(`/api/reports/${id}/regenerate`);
  },

  getStats: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get("/api/reports/stats");
  },

  scheduleReport: (
    id: number,
    schedule: {
      frequency: string;
      recipients: string[];
      nextGeneration: string;
    }
  ): Promise<AxiosResponse<ApiResponse<Report>>> => {
    return api.put(`/api/reports/${id}/schedule`, schedule);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/reports/${id}`);
  },
};

// ✅ Token management functions
const isBrowser = (): boolean => {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
};

const getCleanToken = (): string | null => {
  try {
    if (!isBrowser()) return null;

    const token = localStorage.getItem("access_token");
    const expiresAt = localStorage.getItem("token_expires_at");

    if (!token) return null;

    if (expiresAt && parseInt(expiresAt) < Date.now()) {
      clearTokens();
      return null;
    }

    const cleanToken = token.trim().replace(/\s/g, "");

    if (!isValidJWT(cleanToken)) {
      clearTokens();
      return null;
    }

    if (isTokenExpired(cleanToken)) {
      clearTokens();
      return null;
    }

    return cleanToken;
  } catch (error) {
    console.error("❌ Token retrieval failed:", error);
    clearTokens();
    return null;
  }
};

export const clearTokens = (): void => {
  if (!isBrowser()) return;

  const keysToRemove = [
    "access_token",
    "refresh_token",
    "user",
    "token_expires_at",
    "login_timestamp",
  ];

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`⚠️ Failed to remove ${key}:`, error);
    }
  });
};

export const storeTokens = (
  accessToken: string,
  refreshToken: string,
  user: User,
  expiresIn?: number
): boolean => {
  try {
    if (!isBrowser()) return false;

    if (!accessToken || typeof accessToken !== "string") {
      throw new Error(
        `Invalid access token: expected string, got ${typeof accessToken}`
      );
    }

    if (!refreshToken || typeof refreshToken !== "string") {
      throw new Error(
        `Invalid refresh token: expected string, got ${typeof refreshToken}`
      );
    }

    if (!user || typeof user !== "object") {
      throw new Error(`Invalid user data: expected object, got ${typeof user}`);
    }

    const cleanAccessToken = accessToken.trim().replace(/\s/g, "");
    const cleanRefreshToken = refreshToken.trim().replace(/\s/g, "");

    if (!isValidJWT(cleanAccessToken)) {
      throw new Error("Invalid access token format");
    }

    if (!isValidJWT(cleanRefreshToken)) {
      throw new Error("Invalid refresh token format");
    }

    const expirationTime = expiresIn
      ? Date.now() + expiresIn * 1000
      : Date.now() + 15 * 60 * 1000;

    localStorage.setItem("access_token", cleanAccessToken);
    localStorage.setItem("refresh_token", cleanRefreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token_expires_at", expirationTime.toString());
    localStorage.setItem("login_timestamp", Date.now().toString());

    return true;
  } catch (error) {
    console.error("❌ Token storage failed:", error);
    clearTokens();
    return false;
  }
};

// ✅ API utilities
export const apiUtils = {
  isAuthenticated: (): boolean => {
    const token = getCleanToken();
    return !!token;
  },

  getCurrentUser: (): User | null => {
    try {
      if (!isBrowser()) return null;

      const userStr = localStorage.getItem("user");
      if (!userStr) return null;

      return JSON.parse(userStr);
    } catch (error) {
      console.error("❌ Error retrieving current user:", error);
      return null;
    }
  },

  hasPermission: (permission: string): boolean => {
    const user = apiUtils.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  },

  hasRole: (role: string): boolean => {
    const user = apiUtils.getCurrentUser();
    return user?.role === role;
  },

  getTokenExpiryTime: (): number | null => {
    if (!isBrowser()) return null;
    const expiresAt = localStorage.getItem("token_expires_at");
    return expiresAt ? parseInt(expiresAt) : null;
  },

  isTokenExpiringSoon: (minutesThreshold: number = 5): boolean => {
    const expiryTime = apiUtils.getTokenExpiryTime();
    if (!expiryTime) return false;

    const timeUntilExpiry = expiryTime - Date.now();
    const thresholdMs = minutesThreshold * 60 * 1000;

    return timeUntilExpiry < thresholdMs;
  },

  getTimeUntilExpiry: (): string => {
    const expiryTime = apiUtils.getTokenExpiryTime();
    if (!expiryTime) return "Unknown";

    const timeUntilExpiry = expiryTime - Date.now();
    if (timeUntilExpiry <= 0) return "Expired";

    const minutes = Math.floor(timeUntilExpiry / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  },

  refreshAuthToken: async (): Promise<boolean> => {
    try {
      await authAPI.refreshToken();
      return true;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      return false;
    }
  },

  isLocalStorageAvailable: (): boolean => {
    return isBrowser();
  },

  getVersionInfo: () => ({
    version: "2.2.0",
    apiVersion: API_VERSION,
    buildDate: "2024-12-27",
    environment: process.env.NODE_ENV || "development",
    baseUrl: API_BASE,
    features: [
      "JWT Authentication",
      "Automatic Token Refresh",
      "Request Retry Logic",
      "Server-Aligned Parameters",
      "Type Safety",
      "Comprehensive Logging",
      "Error Recovery",
      "Real-time Monitoring",
      "SSR Safe",
      "Complete API Coverage",
      "Enhanced Analytics",
      "Power Quality Analysis",
      "Equipment Maintenance",
      "Alert Management",
      "Compliance Tracking",
      "Server Field Alignment",
    ],
  }),

  validateConfiguration: (): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!API_BASE) {
      issues.push("NEXT_PUBLIC_API_BASE environment variable is not set");
    } else if (!API_BASE.startsWith("http")) {
      issues.push("API_BASE should start with http:// or https://");
    }

    if (REQUEST_TIMEOUT < 5000) {
      recommendations.push(
        "Consider increasing REQUEST_TIMEOUT for complex operations"
      );
    }

    if (!apiUtils.isLocalStorageAvailable()) {
      recommendations.push("localStorage not available - running in SSR mode");
    }

    const isValid = issues.length === 0;
    return { isValid, issues, recommendations };
  },

  testConnection: async (): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> => {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${API_BASE}/health`, {
        timeout: 5000,
        headers: { Accept: "application/json" },
      });

      const responseTime = Date.now() - startTime;
      return { success: true, responseTime };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";

      return { success: false, responseTime, error: errorMessage };
    }
  },

  resetClientState: (): void => {
    clearTokens();

    if (!isBrowser()) return;

    const keysToRemove = [
      "cached_buildings",
      "cached_equipment",
      "cached_user_preferences",
      "last_sync_timestamp",
    ];

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`⚠️ Failed to remove ${key}:`, error);
      }
    });
  },
};

export default api;
