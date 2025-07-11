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
  EnergyTrendsParams,
  EnergyComparisonParams,
  BuildingEnergyComparison,
  EnergyTrendDataPoint,
  PowerQualityStatsResponse,
  PowerQualityEventsResponse,
  PowerQualityEventsParams,
  AlertStatistics,
  AlertThreshold,
  AlertThresholdParams,
  MonitoringTestParams,
  MonitoringTestResult,
  EscalationResult,
  MaintenanceSchedule,
  EnergySummary,
  PowerQualitySummary,
  AuditSummary,
  ComplianceSummary,
  MonitoringActivity,
  MonitoringActivityParams,
  SystemHealthStatus,
  BaselineCalculationParams,
  EnergyBaseline,
  AnomalyDetectionParams,
  DetectedAnomaly,
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
    if (parts.length !== 3) {
      console.error("❌ Invalid JWT: Wrong number of parts", parts.length);
      return false;
    }

    const validBase64Regex = /^[A-Za-z0-9_-]+$/;
    for (let i = 0; i < parts.length; i++) {
      if (!validBase64Regex.test(parts[i])) {
        console.error(`❌ Invalid JWT: Part ${i} contains invalid characters`);
        return false;
      }
    }

    try {
      const header = JSON.parse(atob(parts[0]));
      if (!header.alg || !header.typ) {
        console.error("❌ Invalid JWT: Missing required header fields");
        return false;
      }
    } catch {
      console.error("❌ Invalid JWT: Malformed header");
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

const extractTokens = (
  responseData: any
): {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  expiresIn?: number;
} => {
  console.log("🔍 Extracting tokens from response data");

  const possibleAccessTokens = [
    responseData?.access_token,
    responseData?.accessToken,
    responseData?.token,
    responseData?.tokens?.access_token,
    responseData?.tokens?.accessToken,
    responseData?.data?.access_token,
    responseData?.data?.accessToken,
  ];

  const possibleRefreshTokens = [
    responseData?.refresh_token,
    responseData?.refreshToken,
    responseData?.tokens?.refresh_token,
    responseData?.tokens?.refreshToken,
    responseData?.data?.refresh_token,
    responseData?.data?.refreshToken,
  ];

  const possibleUsers = [
    responseData?.user,
    responseData?.userData,
    responseData?.data?.user,
    responseData?.data?.userData,
  ];

  const possibleExpiresIn = [
    responseData?.expires_in,
    responseData?.expiresIn,
    responseData?.data?.expires_in,
    responseData?.data?.expiresIn,
  ];

  const accessToken = possibleAccessTokens.find(
    (token) => token && typeof token === "string" && token.trim().length > 0
  );

  const refreshToken = possibleRefreshTokens.find(
    (token) => token && typeof token === "string" && token.trim().length > 0
  );

  const user = possibleUsers.find(
    (userData) => userData && typeof userData === "object"
  );

  const expiresIn = possibleExpiresIn.find(
    (exp) => exp && typeof exp === "number"
  );

  console.log("🔍 Token extraction results:");
  console.log("- accessToken found:", !!accessToken);
  console.log("- refreshToken found:", !!refreshToken);
  console.log("- user found:", !!user);
  console.log("- expiresIn found:", !!expiresIn);

  return { accessToken, refreshToken, user, expiresIn };
};

const cleanParams = (params: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (
        trimmed !== "" &&
        trimmed !== "undefined" &&
        trimmed !== "null" &&
        trimmed !== "NaN"
      ) {
        cleaned[key] = trimmed;
      }
      return;
    }

    if (Array.isArray(value)) {
      const cleanArray = value.filter(
        (v) =>
          v !== null &&
          v !== undefined &&
          v !== "" &&
          String(v).trim() !== "" &&
          String(v).trim() !== "undefined" &&
          String(v).trim() !== "null"
      );
      if (cleanArray.length > 0) {
        cleaned[key] = cleanArray;
      }
      return;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      cleaned[key] = value;
      return;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const cleanedObj = cleanParams(value);
      if (Object.keys(cleanedObj).length > 0) {
        cleaned[key] = cleanedObj;
      }
      return;
    }

    cleaned[key] = value;
  });

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Parameter cleaning:");
    console.log("- Original params:", params);
    console.log("- Cleaned params:", cleaned);
  }

  return cleaned;
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
      console.log(
        "🔑 Token added to request:",
        `Bearer ${token.substring(0, 20)}...`
      );
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
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      const config = response.config as CustomAxiosRequestConfig;
      const responseTime = Date.now() - (config.metadata?.startTime || 0);
      console.log(
        `✅ API Success [${response.config?.method?.toUpperCase()}] ${response.config?.url} (${responseTime}ms)`
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig;
    const responseTime = config?.metadata
      ? Date.now() - config.metadata.startTime
      : 0;

    console.error("🚨 API Error:", {
      method: config?.method?.toUpperCase(),
      url: config?.url,
      status: error.response?.status,
      message: (error.response?.data as any)?.message || error.message,
      retryCount: config?.metadata?.retryCount || 0,
      responseTime: `${responseTime}ms`,
      requestId: config?.headers?.["X-Request-ID"],
    });

    if (error.response?.status === 401) {
      console.log("🔄 Authentication failed, clearing tokens and redirecting");
      clearTokens();

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      console.warn("⚠️ Access forbidden - insufficient permissions");
      return Promise.reject(error);
    }

    if (
      config &&
      config.metadata &&
      config.metadata.retryCount < retryConfig.retries &&
      retryConfig.retryCondition(error)
    ) {
      config.metadata.retryCount = (config.metadata.retryCount || 0) + 1;
      const delay = retryConfig.retryDelay(config.metadata.retryCount);

      console.log(
        `🔄 Retrying request (${config.metadata.retryCount}/${retryConfig.retries}) after ${delay}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      config.metadata.startTime = Date.now();

      return api.request(config);
    }

    if (config?.metadata && config.metadata.retryCount >= retryConfig.retries) {
      console.error(`❌ Request failed after ${retryConfig.retries} retries`);
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (
    email: string,
    password: string
  ): Promise<AxiosResponse<AuthResponse>> => {
    try {
      console.log("🔑 Initiating user authentication...");

      const credentials: LoginCredentials = { email, password };
      const response = await api.post<AuthResponse>(
        "/api/auth/login",
        credentials
      );

      if (response.data?.success) {
        console.log("✅ Authentication successful, processing tokens...");

        const { accessToken, refreshToken, user, expiresIn } = extractTokens(
          response.data.data || response.data
        );

        if (!accessToken || !refreshToken) {
          throw new Error("Authentication response missing required tokens");
        }

        const tokensStored = storeTokens(
          accessToken,
          refreshToken,
          user!,
          expiresIn
        );
        if (!tokensStored) {
          throw new Error("Failed to store authentication tokens securely");
        }

        console.log(
          `✅ User authenticated: ${user?.first_name} ${user?.last_name} (${user?.role})`
        );
      } else {
        throw new Error(response.data?.message || "Authentication failed");
      }

      return response;
    } catch (error: any) {
      console.error(
        "❌ Authentication failed:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  },

  register: async (
    userData: RegisterData
  ): Promise<AxiosResponse<AuthResponse>> => {
    try {
      console.log("📝 Creating new user account...");

      const response = await api.post<AuthResponse>(
        "/api/auth/register",
        userData
      );

      if (response.data?.success) {
        console.log("✅ Registration successful, processing tokens...");

        const { accessToken, refreshToken, user, expiresIn } = extractTokens(
          response.data.data || response.data
        );

        if (!accessToken || !refreshToken) {
          throw new Error("Registration response missing required tokens");
        }

        const tokensStored = storeTokens(
          accessToken,
          refreshToken,
          user!,
          expiresIn
        );
        if (!tokensStored) {
          throw new Error("Failed to store authentication tokens securely");
        }

        console.log(
          `✅ User registered: ${user?.first_name} ${user?.last_name}`
        );
      } else {
        throw new Error(response.data?.message || "Registration failed");
      }

      return response;
    } catch (error: any) {
      console.error(
        "❌ Registration failed:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  },

  getProfile: (): Promise<
    AxiosResponse<
      ApiResponse<{
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
      }>
    >
  > => {
    console.log("👤 Fetching user profile...");
    return api.get("/api/auth/profile");
  },

  getUsers: (): Promise<AxiosResponse<ApiResponse<User[]>>> => {
    console.log("👥 Fetching user list...");
    return api.get("/api/auth/users");
  },

  refreshToken: async (): Promise<AxiosResponse<AuthResponse>> => {
    console.log("🔄 Refreshing authentication token...");

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available for token refresh");
    }

    const response = await api.post<AuthResponse>("/api/auth/refresh", {
      refresh_token: refreshToken,
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
        console.log("✅ Token refreshed successfully");
      }
    }

    return response;
  },

  requestPasswordReset: (
    email: string
  ): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    console.log("📧 Requesting password reset...");
    const resetData: PasswordResetRequest = { email };
    return api.post("/api/auth/password-reset-request", resetData);
  },

  resetPassword: (
    resetData: PasswordReset
  ): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    console.log("🔒 Resetting password...");
    return api.post("/api/auth/password-reset", resetData);
  },

  updateProfile: (
    profileData: ProfileUpdate
  ): Promise<AxiosResponse<ApiResponse<User>>> => {
    console.log("✏️ Updating user profile...");
    return api.put("/api/auth/profile", profileData);
  },

  changePassword: (
    passwordData: PasswordChange
  ): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    console.log("🔐 Changing password...");
    return api.put("/api/auth/change-password", passwordData);
  },

  logout: async (): Promise<void> => {
    console.log("👋 Logging out user...");

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
    console.log("🏢 Fetching buildings list...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/buildings", { params: cleanedParams });
  },

  create: (
    buildingData: Partial<Building>
  ): Promise<
    AxiosResponse<
      ApiResponse<
        Building & {
          initialization_results: {
            energy_baseline_created: boolean;
            monitoring_thresholds_configured: boolean;
            compliance_standards_assigned: string[];
          };
        }
      >
    >
  > => {
    console.log("🏗️ Creating new building...");
    return api.post("/api/buildings", buildingData);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Building>>> => {
    console.log(`🏢 Fetching building details for ID: ${id}`);
    return api.get(`/api/buildings/${id}`);
  },

  update: (
    id: number,
    data: Partial<Building>
  ): Promise<AxiosResponse<ApiResponse<Building>>> => {
    console.log(`✏️ Updating building ID: ${id}`);
    return api.put(`/api/buildings/${id}`, data);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    console.log(`🗑️ Deleting building ID: ${id}`);
    return api.delete(`/api/buildings/${id}`);
  },

  getEnergyPerformance: (
    id: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📊 Fetching energy performance for building ID: ${id}`);
    const params = period ? { period } : {};
    return api.get(`/api/buildings/${id}/energy-performance`, { params });
  },

  getComplianceStatus: (
    id: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📋 Fetching compliance status for building ID: ${id}`);
    return api.get(`/api/buildings/${id}/compliance-status`);
  },
};

export const equipmentAPI = {
  getAll: (
    params?: EquipmentQueryParams
  ): Promise<AxiosResponse<ApiResponse<Equipment[]>>> => {
    console.log("⚙️ Fetching equipment inventory...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/equipment", { params: cleanedParams });
  },

  create: (
    equipmentData: Partial<Equipment>
  ): Promise<
    AxiosResponse<
      ApiResponse<
        Equipment & {
          monitoring_setup: {
            thresholds_configured: boolean;
            alerts_enabled: boolean;
            maintenance_schedule_created: boolean;
          };
        }
      >
    >
  > => {
    console.log("🔧 Registering new equipment...");
    return api.post("/api/equipment", equipmentData);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Equipment>>> => {
    console.log(`⚙️ Fetching equipment details for ID: ${id}`);
    return api.get(`/api/equipment/${id}`);
  },

  getByQR: (
    qrCode: string
  ): Promise<
    AxiosResponse<
      ApiResponse<
        Equipment & {
          quick_actions: {
            action: string;
            label: string;
            available: boolean;
          }[];
        }
      >
    >
  > => {
    console.log(`📱 Accessing equipment via QR code: ${qrCode}`);
    return api.get(`/api/equipment/qr/${qrCode}`);
  },

  update: (
    id: number,
    data: Partial<Equipment>
  ): Promise<AxiosResponse<ApiResponse<Equipment>>> => {
    console.log(`✏️ Updating equipment ID: ${id}`);
    return api.put(`/api/equipment/${id}`, data);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    console.log(`🗑️ Removing equipment ID: ${id}`);
    return api.delete(`/api/equipment/${id}`);
  },

  getMaintenanceHistory: (
    id: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`🔧 Fetching maintenance history for equipment ID: ${id}`);
    return api.get(`/api/equipment/${id}/maintenance`);
  },

  logMaintenance: (
    id: number,
    maintenanceData: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📝 Logging maintenance for equipment ID: ${id}`);
    return api.post(`/api/equipment/${id}/maintenance`, maintenanceData);
  },

  getPerformanceAnalytics: (
    id: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📊 Fetching performance analytics for equipment ID: ${id}`);
    const params = period ? { period } : {};
    return api.get(`/api/equipment/${id}/performance`, { params });
  },

  getMaintenanceSchedule: (
    buildingId?: number
  ): Promise<AxiosResponse<ApiResponse<MaintenanceSchedule>>> => {
    console.log(
      `🔧 Fetching maintenance schedule${buildingId ? ` for building ID: ${buildingId}` : ""}`
    );
    const endpoint = buildingId
      ? `/api/equipment/maintenance/schedule/${buildingId}`
      : "/api/equipment/maintenance/schedule";
    return api.get(endpoint);
  },
};

export const energyAPI = {
  getConsumption: (
    params: EnergyQueryParams
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        building_id: number;
        period: {
          start_date: string;
          end_date: string;
          interval: string;
        };
        summary: {
          total_consumption_kwh: number;
          total_cost_php: number;
          average_daily_consumption: number;
          peak_demand_kw: number;
          average_power_factor: number;
          carbon_footprint_kg_co2: number;
        };
        daily_data?: any[];
        hourly_data?: any[];
        analytics: {
          efficiency_rating: string;
          baseline_comparison: {
            variance_percentage: number;
            trend: string;
          };
          cost_optimization: {
            potential_monthly_savings: number;
            recommendations: string[];
          };
        };
      }>
    >
  > => {
    console.log("⚡ Fetching energy consumption data...");
    const cleanedParams = cleanParams(params);
    return api.get("/api/energy", { params: cleanedParams });
  },

  createReading: (
    readingData: Partial<EnergyReading>
  ): Promise<
    AxiosResponse<
      ApiResponse<
        EnergyReading & {
          cost_analysis: {
            total_cost_php: number;
            cost_breakdown: {
              energy_charge: number;
              demand_charge: number;
              power_factor_bonus?: number;
              power_factor_penalty?: number;
            };
          };
          quality_assessment: {
            data_quality_score: number;
            anomaly_detected: boolean;
            baseline_variance: number;
          };
          alerts_generated: any[];
        }
      >
    >
  > => {
    console.log("📊 Recording energy consumption reading...");
    return api.post("/api/energy", readingData);
  },

  getStats: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<EnergyStatsResponse>>> => {
    console.log(`📊 Fetching energy statistics for building ID: ${buildingId}`);
    return api.get(`/api/energy/stats/${buildingId}`);
  },

  getTrends: (
    buildingId: number,
    params?: EnergyTrendsParams
  ): Promise<AxiosResponse<ApiResponse<EnergyTrendDataPoint[]>>> => {
    console.log(`📈 Fetching energy trends for building ID: ${buildingId}`);
    const cleanedParams = cleanParams({
      building_id: buildingId,
      ...(params || {}),
    });
    return api.get("/api/energy/trends", { params: cleanedParams });
  },

  getComparison: (
    params?: EnergyComparisonParams
  ): Promise<AxiosResponse<ApiResponse<BuildingEnergyComparison[]>>> => {
    console.log("📊 Fetching building energy comparison...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/energy/comparison", { params: cleanedParams });
  },

  getCostAnalysis: (
    buildingId: number,
    startDate: string,
    endDate: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`💰 Analyzing energy costs for building ID: ${buildingId}`);
    const params = cleanParams({
      building_id: buildingId,
      start_date: startDate,
      end_date: endDate,
    });
    return api.get("/api/energy/cost-analysis", { params });
  },

  getBenchmarking: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(
      `🎯 Fetching energy benchmarking for building ID: ${buildingId}`
    );
    return api.get(`/api/energy/benchmarking/${buildingId}`);
  },
};

export const powerQualityAPI = {
  getData: (
    params: PowerQualityQueryParams
  ): Promise<
    AxiosResponse<
      ApiResponse<{
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
            compliance_status: string;
          };
          current_quality: {
            thd_current: number;
            ieee519_current_limit: number;
            compliance_status: string;
          };
        };
        events: PowerQualityEvent[];
      }>
    >
  > => {
    console.log("⚡ Fetching power quality data...");
    const cleanedParams = cleanParams(params);
    return api.get("/api/power-quality", { params: cleanedParams });
  },

  createReading: (
    readingData: Partial<PowerQualityReading>
  ): Promise<
    AxiosResponse<
      ApiResponse<
        PowerQualityReading & {
          power_quality_score: number;
          compliance_analysis: {
            ieee519: {
              voltage_thd: {
                measured: number;
                limit: number;
                status: string;
              };
              current_thd: {
                measured: number;
                limit: number;
                status: string;
              };
            };
          };
          events_detected: PowerQualityEvent[];
          alerts_generated: any[];
        }
      >
    >
  > => {
    console.log("📊 Recording power quality measurement...");
    return api.post("/api/power-quality", readingData);
  },

  getStats: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<PowerQualityStatsResponse>>> => {
    console.log(
      `📊 Fetching power quality statistics for building ID: ${buildingId}`
    );
    return api.get(`/api/power-quality/stats/${buildingId}`);
  },

  getEvents: (
    buildingId: number,
    params: PowerQualityEventsParams
  ): Promise<AxiosResponse<ApiResponse<PowerQualityEventsResponse>>> => {
    console.log(
      `⚡ Analyzing power quality events for building ID: ${buildingId}`
    );
    const cleanedParams = cleanParams({
      building_id: buildingId,
      ...params,
    });
    return api.get("/api/power-quality/events", { params: cleanedParams });
  },

  getTrends: (
    buildingId: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(
      `📈 Fetching power quality trends for building ID: ${buildingId}`
    );
    const params = cleanParams({ building_id: buildingId, period });
    return api.get("/api/power-quality/trends", { params });
  },

  getHarmonicsAnalysis: (
    buildingId: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`🌊 Analyzing harmonics for building ID: ${buildingId}`);
    const params = cleanParams({ building_id: buildingId, period });
    return api.get("/api/power-quality/harmonics", { params });
  },

  getITICAnalysis: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📊 Analyzing ITIC compliance for building ID: ${buildingId}`);
    return api.get(`/api/power-quality/itic-analysis/${buildingId}`);
  },
};

export const alertsAPI = {
  getAll: (
    params?: AlertQueryParams
  ): Promise<AxiosResponse<ApiResponse<Alert[]>>> => {
    console.log("🚨 Fetching system alerts...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/alerts", { params: cleanedParams });
  },

  create: (
    alertData: Partial<Alert>
  ): Promise<
    AxiosResponse<
      ApiResponse<
        Alert & {
          urgency: string;
          estimated_cost_impact: number;
          notifications_sent: string[];
        }
      >
    >
  > => {
    console.log("🚨 Creating new alert...");
    return api.post("/api/alerts", alertData);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    console.log(`🚨 Fetching alert details for ID: ${id}`);
    return api.get(`/api/alerts/${id}`);
  },

  acknowledge: (
    id: number
  ): Promise<
    AxiosResponse<
      ApiResponse<
        Alert & {
          response_time_minutes: number;
        }
      >
    >
  > => {
    console.log(`✅ Acknowledging alert ID: ${id}`);
    return api.post(`/api/alerts/${id}/acknowledge`);
  },

  resolve: (
    id: number,
    resolutionData?: any
  ): Promise<
    AxiosResponse<
      ApiResponse<
        Alert & {
          resolution_time_minutes: number;
        }
      >
    >
  > => {
    console.log(`✅ Resolving alert ID: ${id}`);
    return api.post(`/api/alerts/${id}/resolve`, resolutionData);
  },

  update: (
    id: number,
    data: Partial<Alert>
  ): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    console.log(`✏️ Updating alert ID: ${id}`);
    return api.put(`/api/alerts/${id}`, data);
  },

  escalate: (
    id: number,
    escalationData: any
  ): Promise<AxiosResponse<ApiResponse<Alert>>> => {
    console.log(`⬆️ Escalating alert ID: ${id}`);
    return api.post(`/api/alerts/${id}/escalate`, escalationData);
  },

  getAnalytics: (
    buildingId?: number,
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("📊 Fetching alert analytics...");
    const params = cleanParams({ building_id: buildingId, period });
    return api.get("/api/alerts/analytics", { params });
  },

  getStatistics: (): Promise<AxiosResponse<ApiResponse<AlertStatistics>>> => {
    console.log("📊 Fetching alert statistics...");
    return api.get("/api/alerts/statistics");
  },

  testMonitoring: (
    buildingId: number,
    data: MonitoringTestParams
  ): Promise<AxiosResponse<ApiResponse<MonitoringTestResult>>> => {
    console.log(`🔬 Testing monitoring for building ID: ${buildingId}`);
    return api.post(`/api/alerts/test-monitoring/${buildingId}`, data);
  },

  getThresholds: (
    params?: AlertThresholdParams
  ): Promise<AxiosResponse<ApiResponse<AlertThreshold[]>>> => {
    console.log("🎯 Fetching alert thresholds...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/alerts/thresholds", { params: cleanedParams });
  },

  processEscalations: (): Promise<
    AxiosResponse<ApiResponse<EscalationResult>>
  > => {
    console.log("⬆️ Processing alert escalations...");
    return api.post("/api/alerts/process-escalations");
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    console.log(`🗑️ Deleting alert ID: ${id}`);
    return api.delete(`/api/alerts/${id}`);
  },
};

export const analyticsAPI = {
  runAnalysis: (params: {
    building_id: number;
    start_date: string;
    end_date: string;
    analysis_types: string[];
  }): Promise<
    AxiosResponse<
      ApiResponse<{
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
        efficiency_opportunities: {
          category: string;
          potential_savings_kwh: number;
          potential_savings_php: number;
          payback_months: number;
          priority: string;
        }[];
        recommendations: string[];
      }>
    >
  > => {
    console.log("📊 Running comprehensive analytics...");
    const cleanedParams = cleanParams(params);
    return api.get("/api/analytics/analysis", { params: cleanedParams });
  },

  getDashboard: (): Promise<
    AxiosResponse<
      ApiResponse<{
        overview: {
          total_buildings: number;
          total_equipment: number;
          analysis_models_active: number;
        };
        energy_analytics: {
          portfolio_efficiency_score: number;
          monthly_consumption_kwh: number;
          cost_savings_identified_php: number;
        };
        predictive_insights: {
          equipment_maintenance_predictions: {
            equipment_id: number;
            failure_probability: number;
            recommended_maintenance_date: string;
          }[];
        };
      }>
    >
  > => {
    console.log("📊 Fetching analytics dashboard...");
    return api.get("/api/analytics/dashboard");
  },

  detectAnomalies: (
    data: AnomalyDetectionParams
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        detection_id: string;
        total_anomalies: number;
        anomalies: DetectedAnomaly[];
      }>
    >
  > => {
    console.log("🔍 Detecting system anomalies...");
    const cleanedData = cleanParams(data);
    return api.post("/api/analytics/anomalies", cleanedData);
  },

  calculateBaseline: (
    buildingId: number,
    data: BaselineCalculationParams
  ): Promise<AxiosResponse<ApiResponse<EnergyBaseline>>> => {
    console.log(
      `📊 Calculating energy baseline for building ID: ${buildingId}`
    );
    return api.post(`/api/analytics/baseline/${buildingId}`, data);
  },

  analyzePowerQuality: (
    buildingId: number,
    readingId: number,
    data?: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(
      `🔌 Analyzing power quality for building ID: ${buildingId}, reading ID: ${readingId}`
    );
    return api.post(
      `/api/analytics/power-quality/${buildingId}/${readingId}`,
      data
    );
  },

  getPredictiveMaintenance: (
    buildingId?: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("🔮 Fetching predictive maintenance insights...");
    const params = buildingId ? { building_id: buildingId } : {};
    return api.get("/api/analytics/predictive-maintenance", { params });
  },

  getOptimizationRecommendations: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(
      `💡 Fetching optimization recommendations for building ID: ${buildingId}`
    );
    return api.get(`/api/analytics/optimization/${buildingId}`);
  },

  getCostBenefitAnalysis: (
    buildingId: number,
    improvements: any[]
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`💰 Analyzing cost-benefit for building ID: ${buildingId}`);
    return api.post(`/api/analytics/cost-benefit/${buildingId}`, {
      improvements,
    });
  },
};

export const auditsAPI = {
  getAll: (
    params?: AuditQueryParams
  ): Promise<AxiosResponse<ApiResponse<Audit[]>>> => {
    console.log("📋 Fetching audit list...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/audits", { params: cleanedParams });
  },

  create: (
    auditData: Partial<Audit>
  ): Promise<
    AxiosResponse<
      ApiResponse<
        Audit & {
          audit_framework: {
            compliance_standards: {
              standard: string;
              scope: string;
              checklist_items: number;
            }[];
          };
          audit_code: string;
        }
      >
    >
  > => {
    console.log("📋 Creating new audit...");
    return api.post("/api/audits", auditData);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    console.log(`📋 Fetching audit details for ID: ${id}`);
    return api.get(`/api/audits/${id}`);
  },

  update: (
    id: number,
    data: Partial<Audit>
  ): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    console.log(`✏️ Updating audit ID: ${id}`);
    return api.put(`/api/audits/${id}`, data);
  },

  start: (id: number): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    console.log(`▶️ Starting audit ID: ${id}`);
    return api.post(`/api/audits/${id}/start`);
  },

  complete: (
    id: number,
    completionData?: any
  ): Promise<AxiosResponse<ApiResponse<Audit>>> => {
    console.log(`✅ Completing audit ID: ${id}`);
    return api.post(`/api/audits/${id}/complete`, completionData);
  },

  getSummary: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("📊 Fetching audit summary...");
    return api.get("/api/audits/summary");
  },

  getFindings: (id: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📊 Fetching findings for audit ID: ${id}`);
    return api.get(`/api/audits/${id}/findings`);
  },

  addFinding: (
    id: number,
    findingData: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📝 Adding finding to audit ID: ${id}`);
    return api.post(`/api/audits/${id}/findings`, findingData);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    console.log(`🗑️ Deleting audit ID: ${id}`);
    return api.delete(`/api/audits/${id}`);
  },
};

export const complianceAPI = {
  getAuditChecks: (
    auditId: number
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        audit_id: number;
        overall_compliance: {
          score: number;
          status: string;
          total_checks: number;
          passed_checks: number;
          failed_checks: number;
        };
        standards_summary: {
          standard: string;
          score: number;
          status: string;
          violations: number;
        }[];
        detailed_checks: ComplianceCheck[];
      }>
    >
  > => {
    console.log(`📋 Fetching compliance checks for audit ID: ${auditId}`);
    return api.get(`/api/compliance/audit/${auditId}`);
  },

  performCheck: (data: {
    audit_id: number;
    building_id: number;
    standards: string[];
    check_type: string;
    data_collection: any;
  }): Promise<
    AxiosResponse<
      ApiResponse<{
        check_id: string;
        overall_results: {
          compliance_score: number;
          status: string;
          critical_violations: number;
        };
        standard_results: {
          standard: string;
          score: number;
          violations: {
            requirement: string;
            severity: string;
            recommendation: string;
          }[];
        }[];
        remediation_plan: {
          immediate_actions: {
            action: string;
            deadline: string;
            cost_php: number;
          }[];
        };
      }>
    >
  > => {
    console.log("📊 Performing compliance assessment...");
    return api.post("/api/compliance/check", data);
  },

  getStandards: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("📋 Fetching compliance standards...");
    return api.get("/api/compliance/standards");
  },

  getRequirements: (
    standard: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📋 Fetching requirements for standard: ${standard}`);
    return api.get(`/api/compliance/standards/${standard}/requirements`);
  },

  getTrends: (
    buildingId: number,
    standard?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📈 Fetching compliance trends for building ID: ${buildingId}`);
    const params = cleanParams({ building_id: buildingId, standard });
    return api.get("/api/compliance/trends", { params });
  },

  generateReport: (
    auditId: number,
    standards: string[]
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(`📄 Generating compliance report for audit ID: ${auditId}`);
    return api.post(`/api/compliance/reports/${auditId}`, { standards });
  },
};

export const dashboardAPI = {
  getOverview: (): Promise<AxiosResponse<ApiResponse<DashboardOverview>>> => {
    console.log("📊 Fetching dashboard overview...");
    return api.get("/api/dashboard/overview");
  },

  getRealTime: (): Promise<
    AxiosResponse<
      ApiResponse<{
        timestamp: string;
        current_energy: {
          total_demand_kw: number;
          total_consumption_today_kwh: number;
          average_power_factor: number;
        };
        building_status: {
          building_id: number;
          name: string;
          current_demand_kw: number;
          status: string;
          alert_count: number;
        }[];
        active_alerts: {
          id: number;
          severity: string;
          title: string;
          age_minutes: number;
        }[];
      }>
    >
  > => {
    console.log("⚡ Fetching real-time metrics...");
    return api.get("/api/dashboard/real-time");
  },

  getKPIs: (buildingId?: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("📊 Fetching KPIs...");
    const params = buildingId ? { building_id: buildingId } : {};
    return api.get("/api/dashboard/kpis", { params });
  },

  getEnergySummary: (params?: {
    period?: string;
    building_id?: number;
  }): Promise<AxiosResponse<ApiResponse<EnergySummary>>> => {
    console.log("⚡ Fetching energy summary...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/dashboard/energy-summary", { params: cleanedParams });
  },

  getPowerQualitySummary: (params?: {
    building_id?: number;
    period?: string;
  }): Promise<AxiosResponse<ApiResponse<PowerQualitySummary>>> => {
    console.log("🔌 Fetching power quality summary...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/dashboard/power-quality-summary", {
      params: cleanedParams,
    });
  },

  getAuditSummary: (): Promise<AxiosResponse<ApiResponse<AuditSummary>>> => {
    console.log("📋 Fetching audit summary...");
    return api.get("/api/dashboard/audit-summary");
  },

  getComplianceSummary: (): Promise<
    AxiosResponse<ApiResponse<ComplianceSummary>>
  > => {
    console.log("✅ Fetching compliance summary...");
    return api.get("/api/dashboard/compliance-summary");
  },

  getAlerts: (params?: {
    severity?: string;
    limit?: number;
    building_id?: number;
  }): Promise<AxiosResponse<ApiResponse<Alert[]>>> => {
    console.log("🚨 Fetching dashboard alerts...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/dashboard/alerts", { params: cleanedParams });
  },

  getCostAnalysis: (
    period?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("💰 Fetching cost analysis...");
    const params = period ? { period } : {};
    return api.get("/api/dashboard/cost-analysis", { params });
  },

  getEnvironmentalImpact: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("🌱 Fetching environmental impact...");
    return api.get("/api/dashboard/environmental-impact");
  },
};

export const monitoringAPI = {
  getDashboard: (): Promise<
    AxiosResponse<
      ApiResponse<{
        systemStats: {
          totalBuildings: number;
          totalAlerts: number;
          criticalAlerts: number;
          connectedUsers: number;
        };
        buildings: {
          id: number;
          name: string;
          status: string;
          active_alerts: number;
          system_health_score: number;
        }[];
        performance_metrics: {
          data_collection_rate: number;
          system_uptime_percentage: number;
        };
      }>
    >
  > => {
    console.log("🖥️ Fetching monitoring dashboard...");
    return api.get("/api/monitoring/dashboard");
  },

  getActivities: (
    params?: MonitoringActivityParams
  ): Promise<AxiosResponse<ApiResponse<MonitoringActivity[]>>> => {
    console.log("📊 Fetching monitoring activities...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/monitoring/activities", { params: cleanedParams });
  },

  getBuildingRecent: (
    buildingId: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log(
      `🏢 Fetching recent monitoring data for building ID: ${buildingId}`
    );
    return api.get(`/api/monitoring/building/${buildingId}/recent`);
  },

  createJob: (jobData: {
    jobType: string;
    buildingId?: number;
    parameters: any;
  }): Promise<
    AxiosResponse<
      ApiResponse<{
        jobId: number;
        status: string;
        estimated_completion: string;
      }>
    >
  > => {
    console.log("🔄 Creating background job...");
    return api.post("/api/monitoring/jobs", jobData);
  },

  getJobs: (
    params?: JobQueryParams
  ): Promise<AxiosResponse<ApiResponse<BackgroundJob[]>>> => {
    console.log("📋 Fetching background jobs...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/monitoring/jobs", { params: cleanedParams });
  },

  getJobStatus: (
    jobId: number
  ): Promise<AxiosResponse<ApiResponse<BackgroundJob>>> => {
    console.log(`📊 Fetching job status for ID: ${jobId}`);
    return api.get(`/api/monitoring/jobs/${jobId}`);
  },

  cancelJob: (
    jobId: number
  ): Promise<AxiosResponse<ApiResponse<BackgroundJob>>> => {
    console.log(`❌ Cancelling job ID: ${jobId}`);
    return api.delete(`/api/monitoring/jobs/${jobId}`);
  },

  getSystemHealth: (): Promise<
    AxiosResponse<ApiResponse<SystemHealthStatus>>
  > => {
    console.log("💊 Fetching comprehensive system health status...");
    return api.get("/api/monitoring/system-status");
  },

  clearCache: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("🧹 Clearing system cache...");
    return api.post("/api/monitoring/cache/clear");
  },

  getDataCollectionStats: (
    buildingId?: number
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("📊 Fetching data collection statistics...");
    const params = buildingId ? { building_id: buildingId } : {};
    return api.get("/api/monitoring/data-collection", { params });
  },
};

export const reportsAPI = {
  getAll: (
    params?: ReportQueryParams
  ): Promise<AxiosResponse<ApiResponse<Report[]>>> => {
    console.log("📄 Fetching reports library...");
    const cleanedParams = cleanParams(params || {});
    return api.get("/api/reports", { params: cleanedParams });
  },

  generateEnergy: (data: {
    building_id: number;
    start_date: string;
    end_date: string;
    title: string;
    include_comparison?: boolean;
    include_trends?: boolean;
    report_format?: string;
    sections?: string[];
  }): Promise<
    AxiosResponse<
      ApiResponse<
        Report & {
          preview_data: {
            total_consumption_kwh: number;
            total_cost_php: number;
            efficiency_score: number;
          };
        }
      >
    >
  > => {
    console.log("📊 Generating energy report...");
    return api.post("/api/reports/energy", data);
  },

  generateCompliance: (data: {
    audit_id: number;
    standards: string[];
    title: string;
    include_remediation_plan?: boolean;
    report_format?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log("📋 Generating compliance report...");
    return api.post("/api/reports/compliance", data);
  },

  generatePowerQuality: (data: {
    building_id: number;
    start_date: string;
    end_date: string;
    title: string;
    include_events?: boolean;
    include_harmonics?: boolean;
    report_format?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log("🔌 Generating power quality report...");
    return api.post("/api/reports/power-quality", data);
  },

  generateAudit: (data: {
    audit_id: number;
    title: string;
    include_findings?: boolean;
    include_recommendations?: boolean;
    report_format?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log("📋 Generating audit report...");
    return api.post("/api/reports/audit", data);
  },

  generateMonitoring: (data: {
    building_id?: number;
    report_types: string[];
    start_date: string;
    end_date: string;
    title: string;
    report_format?: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log("🖥️ Generating monitoring report...");
    return api.post("/api/reports/monitoring", data);
  },

  generateCustom: (data: {
    title: string;
    template_id?: string;
    data_sources: any[];
    parameters: any;
    format: string;
  }): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log("📄 Generating custom report...");
    return api.post("/api/reports/custom", data);
  },

  getById: (id: number): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log(`📄 Fetching report details for ID: ${id}`);
    return api.get(`/api/reports/${id}`);
  },

  download: (id: number): Promise<AxiosResponse<Blob>> => {
    console.log(`💾 Downloading report ID: ${id}`);
    return api.get(`/api/reports/${id}/download`, { responseType: "blob" });
  },

  getStatus: (
    id: number
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        status: string;
        progress_percentage: number;
        estimated_completion?: string;
        error_message?: string;
      }>
    >
  > => {
    console.log(`📊 Fetching report status for ID: ${id}`);
    return api.get(`/api/reports/${id}/status`);
  },

  regenerate: (id: number): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log(`🔄 Regenerating report ID: ${id}`);
    return api.post(`/api/reports/${id}/regenerate`);
  },

  getStats: (): Promise<AxiosResponse<ApiResponse<any>>> => {
    console.log("📊 Fetching report generation statistics...");
    return api.get("/api/reports/stats");
  },

  scheduleReport: (
    id: number,
    schedule: {
      frequency: string;
      recipients: string[];
      next_generation: string;
    }
  ): Promise<AxiosResponse<ApiResponse<Report>>> => {
    console.log(`⏰ Scheduling report ID: ${id}`);
    return api.put(`/api/reports/${id}/schedule`, schedule);
  },

  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    console.log(`🗑️ Deleting report ID: ${id}`);
    return api.delete(`/api/reports/${id}`);
  },
};

const isBrowser = (): boolean => {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
};

const getCleanToken = (): string | null => {
  try {
    if (!isBrowser()) {
      console.log("ℹ️ SSR environment - localStorage not available");
      return null;
    }

    const token = localStorage.getItem("access_token");
    const expiresAt = localStorage.getItem("token_expires_at");

    if (!token) {
      console.log("ℹ️ No access token found in storage");
      return null;
    }

    if (expiresAt && parseInt(expiresAt) < Date.now()) {
      console.log("🔄 Token expired (localStorage), clearing tokens");
      clearTokens();
      return null;
    }

    const cleanToken = token.trim().replace(/\s/g, "");

    if (!isValidJWT(cleanToken)) {
      console.error("❌ Stored token has invalid format, clearing tokens");
      clearTokens();
      return null;
    }

    if (isTokenExpired(cleanToken)) {
      console.log("🔄 JWT token expired, clearing tokens");
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
  if (!isBrowser()) {
    console.log("ℹ️ SSR environment - cannot clear tokens");
    return;
  }

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
  console.log("🧹 Authentication tokens cleared");
};

export const storeTokens = (
  accessToken: string,
  refreshToken: string,
  user: User,
  expiresIn?: number
): boolean => {
  try {
    if (!isBrowser()) {
      console.log("ℹ️ SSR environment - cannot store tokens");
      return false;
    }

    console.log("🔍 Storing authentication tokens...");

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

    console.log("✅ Tokens stored successfully");
    console.log(
      `⏰ Token expires at: ${new Date(expirationTime).toISOString()}`
    );

    return true;
  } catch (error) {
    console.error("❌ Token storage failed:", error);
    clearTokens();
    return false;
  }
};

export const apiUtils = {
  isAuthenticated: (): boolean => {
    const token = getCleanToken();
    const isAuth = !!token;
    console.log(
      `🔍 Authentication check: ${isAuth ? "authenticated" : "not authenticated"}`
    );
    return isAuth;
  },

  getCurrentUser: (): User | null => {
    try {
      if (!isBrowser()) {
        console.log("ℹ️ SSR environment - cannot get current user");
        return null;
      }

      const userStr = localStorage.getItem("user");
      if (!userStr) return null;

      const user = JSON.parse(userStr);
      console.log(
        `👤 Current user: ${user.first_name} ${user.last_name} (${user.role})`
      );
      return user;
    } catch (error) {
      console.error("❌ Error retrieving current user:", error);
      return null;
    }
  },

  hasPermission: (permission: string): boolean => {
    const user = apiUtils.getCurrentUser();
    const hasPermission = user?.permissions?.includes(permission) || false;
    console.log(
      `🔒 Permission check for '${permission}': ${hasPermission ? "granted" : "denied"}`
    );
    return hasPermission;
  },

  hasRole: (role: string): boolean => {
    const user = apiUtils.getCurrentUser();
    const hasRole = user?.role === role;
    console.log(
      `👔 Role check for '${role}': ${hasRole ? "match" : "no match"}`
    );
    return hasRole;
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

    const expiringSoon = timeUntilExpiry < thresholdMs;
    if (expiringSoon) {
      console.log(
        `⏰ Token expires in ${Math.round(timeUntilExpiry / 60000)} minutes`
      );
    }

    return expiringSoon;
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
      console.log("🔄 Force refreshing authentication token...");
      await authAPI.refreshToken();
      return true;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      return false;
    }
  },

  getUserActivityStats: async (): Promise<any> => {
    try {
      const profile = await authAPI.getProfile();
      return profile.data.data.activity_statistics;
    } catch (error) {
      console.error("❌ Failed to get user activity stats:", error);
      return null;
    }
  },

  isLocalStorageAvailable: (): boolean => {
    return isBrowser();
  },

  getVersionInfo: () => ({
    version: "2.1.0",
    apiVersion: API_VERSION,
    buildDate: "2024-07-07",
    environment: process.env.NODE_ENV || "development",
    baseUrl: API_BASE,
    features: [
      "JWT Authentication",
      "Automatic Token Refresh",
      "Request Retry Logic",
      "Parameter Validation",
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

    if (!API_VERSION) {
      recommendations.push(
        "Set NEXT_PUBLIC_API_VERSION for better API versioning"
      );
    }

    const isValid = issues.length === 0;

    console.log(
      `🔍 API Configuration validation: ${isValid ? "PASSED" : "FAILED"}`
    );
    if (issues.length > 0) {
      console.log("❌ Issues found:", issues);
    }
    if (recommendations.length > 0) {
      console.log("💡 Recommendations:", recommendations);
    }

    return { isValid, issues, recommendations };
  },

  testConnection: async (): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> => {
    const startTime = Date.now();

    try {
      console.log("🔍 Testing API connection...");

      const response = await axios.get(`${API_BASE}/health`, {
        timeout: 5000,
        headers: {
          Accept: "application/json",
        },
      });

      const responseTime = Date.now() - startTime;

      console.log(`✅ API connection test successful (${responseTime}ms)`);

      return {
        success: true,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";

      console.error(
        `❌ API connection test failed (${responseTime}ms):`,
        errorMessage
      );

      return {
        success: false,
        responseTime,
        error: errorMessage,
      };
    }
  },

  resetClientState: (): void => {
    console.log("🔄 Resetting API client state...");

    clearTokens();

    if (!isBrowser()) {
      console.log("ℹ️ SSR environment - limited reset capabilities");
      return;
    }

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

    console.log("✅ API client state reset complete");
  },

  getPerformanceStats: (): {
    totalRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastRequestTime: string | null;
  } => {
    return {
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
    };
  },

  setDebugMode: (enabled: boolean): void => {
    if (enabled) {
      console.log("🐛 Debug mode enabled - verbose logging activated");
    } else {
      console.log("🔇 Debug mode disabled - logging minimized");
    }

    if (isBrowser()) {
      try {
        localStorage.setItem("api_debug_mode", enabled.toString());
      } catch (error) {
        console.warn("⚠️ Could not save debug mode preference:", error);
      }
    }
  },

  isDebugMode: (): boolean => {
    if (!isBrowser()) {
      return process.env.NODE_ENV === "development";
    }

    try {
      const debugMode = localStorage.getItem("api_debug_mode");
      return debugMode === "true" || process.env.NODE_ENV === "development";
    } catch (error) {
      return process.env.NODE_ENV === "development";
    }
  },
};

export default api;
