// hooks/useApi.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { AxiosResponse, AxiosError } from "axios";
import api, {
  authAPI,
  buildingsAPI,
  equipmentAPI,
  energyAPI,
  powerQualityAPI,
  alertsAPI,
  auditsAPI,
  complianceAPI,
  dashboardAPI,
  monitoringAPI,
  reportsAPI,
  analyticsAPI,
  apiUtils,
} from "@/lib/api";
import { ApiResponse, ApiError, User, Report } from "@/types/api-types";
import {
  transformFromServerFields,
  extractErrorMessage,
  getCacheTTL,
} from "@/lib/api-utils";

/**
 * ✅ ENHANCED: Complete API hooks with perfect reports integration and TypeScript safety
 */

// ✅ Enhanced type utilities for better type safety
type ApiDataType<T> = T extends null | undefined ? never : T;
type SafeApiData<T> = T extends null | undefined ? NonNullable<T> : T;

// ✅ Enhanced response handling interfaces
interface SafeApiResponse<T> {
  success: true;
  data: T;
  error: null;
}

interface SafeApiError {
  success: false;
  data: null;
  error: string;
}

type SafeResponse<T> = SafeApiResponse<T> | SafeApiError;

interface SafeArrayResponse<T> {
  success: true;
  data: T[];
  pagination: any;
  error: null;
}

interface SafeArrayError {
  success: false;
  data: never[];
  pagination: null;
  error: string;
}

type SafeArrayResult<T> = SafeArrayResponse<T> | SafeArrayError;

// ✅ Type guard functions
function isSafeApiSuccess<T>(
  result: SafeResponse<T>
): result is SafeApiResponse<T> {
  return result.success === true;
}

function isSafeApiError<T>(result: SafeResponse<T>): result is SafeApiError {
  return result.success === false;
}

function isSafeArraySuccess<T>(
  result: SafeArrayResult<T>
): result is SafeArrayResponse<T> {
  return result.success === true;
}

function isSafeArrayError<T>(
  result: SafeArrayResult<T>
): result is SafeArrayError {
  return result.success === false;
}

// ✅ Enhanced response handlers
function isNestedResponse(data: any): data is { data: any; pagination?: any } {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "data" in data
  );
}

function isDirectArrayResponse<T>(data: any): data is T[] {
  return Array.isArray(data);
}

function isApiSuccessResponse<T>(response: any): response is ApiResponse<T> {
  return (
    response &&
    typeof response === "object" &&
    response.success === true &&
    "data" in response
  );
}

function extractSafeData<T>(result: SafeResponse<T>): T | null {
  if (result.success && result.data !== null && result.data !== undefined) {
    return result.data;
  }
  return null;
}

// ✅ Enhanced response handler with special blob handling for reports
function handleApiResponseSafe<T>(
  response: AxiosResponse<any>
): SafeResponse<T> {
  try {
    if (!response || !response.data) {
      return {
        success: false,
        data: null,
        error: "No response data received",
      };
    }

    const responseData = response.data;

    // ✅ Special handling for blob responses (report downloads)
    if (responseData instanceof Blob) {
      return {
        success: true,
        data: responseData as T,
        error: null,
      };
    }

    // Check if it's a standard API response format
    if (isApiSuccessResponse<T>(responseData)) {
      if (!responseData.success) {
        return {
          success: false,
          data: null,
          error: responseData.message || responseData.error || "Request failed",
        };
      }

      // Handle nested data structure
      if (isNestedResponse(responseData.data)) {
        const nestedData = responseData.data.data;
        if (nestedData !== null && nestedData !== undefined) {
          return {
            success: true,
            data: nestedData as T,
            error: null,
          };
        }
      }

      // Handle direct data
      if (responseData.data !== null && responseData.data !== undefined) {
        return {
          success: true,
          data: responseData.data as T,
          error: null,
        };
      }
    }

    // Handle direct response (non-ApiResponse format)
    if (responseData !== null && responseData !== undefined) {
      return {
        success: true,
        data: responseData as T,
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      error: "No data in response",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Response processing failed",
    };
  }
}

// ✅ Enhanced array response handler
function handleArrayApiResponseSafe<T>(
  response: AxiosResponse<any>
): SafeArrayResult<T> {
  try {
    if (!response || !response.data) {
      return {
        success: false,
        data: [],
        pagination: null,
        error: "No response data received",
      };
    }

    const responseData = response.data;

    if (isApiSuccessResponse<T[]>(responseData)) {
      if (!responseData.success) {
        return {
          success: false,
          data: [],
          pagination: null,
          error: responseData.message || responseData.error || "Request failed",
        };
      }

      const pagination = responseData.pagination || null;

      if (isNestedResponse(responseData.data)) {
        const nestedData = responseData.data.data;
        const nestedPagination = responseData.data.pagination || pagination;

        if (isDirectArrayResponse<T>(nestedData)) {
          return {
            success: true,
            data: nestedData,
            pagination: nestedPagination,
            error: null,
          };
        }
      }

      if (isDirectArrayResponse<T>(responseData.data)) {
        return {
          success: true,
          data: responseData.data,
          pagination,
          error: null,
        };
      }

      if (responseData.data !== null && responseData.data !== undefined) {
        return {
          success: true,
          data: [responseData.data] as T[],
          pagination,
          error: null,
        };
      }
    }

    if (isDirectArrayResponse<T>(responseData)) {
      return {
        success: true,
        data: responseData,
        pagination: null,
        error: null,
      };
    }

    return {
      success: false,
      data: [],
      pagination: null,
      error: "No array data in response",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      pagination: null,
      error:
        error instanceof Error ? error.message : "Response processing failed",
    };
  }
}

// ✅ Base API hook interfaces
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isError: boolean;
  isSuccess: boolean;
}

export interface UsePaginatedApiState<T> {
  data: T[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  isError: boolean;
  isSuccess: boolean;
}

export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  transform?: boolean;
  retryCount?: number;
  cacheTtl?: number;
  refreshInterval?: number;
  dependencies?: any[];
  staleTime?: number;
  cacheKey?: string;
}

// ✅ Enhanced useApi hook
export function useApi<T = any>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>,
  options: UseApiOptions = {}
): UseApiState<T> & {
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
} {
  const {
    immediate = false,
    onSuccess,
    onError,
    transform = true,
    retryCount = 0,
    cacheTtl = 0,
    refreshInterval = 0,
    dependencies = [],
    staleTime = 0,
    cacheKey,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryAttempts = useRef(0);
  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(async () => {
    if (cacheTtl > 0 && cacheRef.current) {
      const now = Date.now();
      const age = now - cacheRef.current.timestamp;

      if (age < cacheTtl) {
        setData(cacheRef.current.data);
        return;
      }

      if (staleTime > 0 && age < staleTime) {
        setData(cacheRef.current.data);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      const result = handleApiResponseSafe<T>(response);
      const extractedData = extractSafeData(result);

      if (isSafeApiSuccess(result) && extractedData !== null) {
        let processedData: T = extractedData;

        if (
          transform &&
          processedData !== null &&
          processedData !== undefined
        ) {
          try {
            if (typeof processedData === "object" && processedData !== null) {
              processedData = transformFromServerFields(processedData) as T;
            }
          } catch (transformError) {
            console.warn("⚠️ Response transformation failed:", transformError);
          }
        }

        setData(processedData);

        if (cacheTtl > 0) {
          cacheRef.current = {
            data: processedData,
            timestamp: Date.now(),
          };

          if (cacheKey && typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `api_cache_${cacheKey}`,
                JSON.stringify({
                  data: processedData,
                  timestamp: Date.now(),
                })
              );
            } catch (storageError) {
              console.warn("⚠️ Cache storage failed:", storageError);
            }
          }
        }

        onSuccess?.(processedData);
        retryAttempts.current = 0;
      } else if (isSafeApiError(result)) {
        const errorMessage = result.error;
        setError(errorMessage);
        onError?.(errorMessage);
      } else {
        const fallbackError = "An unexpected error occurred";
        setError(fallbackError);
        onError?.(fallbackError);
      }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      onError?.(errorMessage);

      if (retryAttempts.current < retryCount) {
        retryAttempts.current++;
        const delay = Math.min(
          1000 * Math.pow(2, retryAttempts.current),
          10000
        );
        setTimeout(() => execute(), delay);
      }
    } finally {
      setLoading(false);
    }
  }, [
    apiCall,
    onSuccess,
    onError,
    transform,
    retryCount,
    cacheTtl,
    staleTime,
    cacheKey,
  ]);

  const retry = useCallback(() => {
    retryAttempts.current = 0;
    return execute();
  }, [execute]);

  const refresh = useCallback(() => {
    cacheRef.current = null;
    if (cacheKey && typeof window !== "undefined") {
      localStorage.removeItem(`api_cache_${cacheKey}`);
    }
    return execute();
  }, [execute, cacheKey]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    retryAttempts.current = 0;
    cacheRef.current = null;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (refreshInterval > 0 && data) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, data, refresh]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    isError: !!error,
    isSuccess: !!data && !error,
    execute,
    retry,
    reset,
    refresh,
  };
}

// ✅ Enhanced usePaginatedApi hook
export function usePaginatedApi<T = any>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T[]>>>,
  options: UseApiOptions = {}
): UsePaginatedApiState<T> & {
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
} {
  const {
    immediate = false,
    onSuccess,
    onError,
    transform = true,
    retryCount = 0,
    cacheTtl = 0,
    refreshInterval = 0,
    dependencies = [],
    staleTime = 0,
    cacheKey,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryAttempts = useRef(0);
  const cacheRef = useRef<{
    data: T[];
    pagination: any;
    timestamp: number;
  } | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(async () => {
    if (cacheTtl > 0 && cacheRef.current) {
      const now = Date.now();
      const age = now - cacheRef.current.timestamp;

      if (age < cacheTtl) {
        setData(cacheRef.current.data);
        setPagination(cacheRef.current.pagination);
        return;
      }

      if (staleTime > 0 && age < staleTime) {
        setData(cacheRef.current.data);
        setPagination(cacheRef.current.pagination);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      const result = handleArrayApiResponseSafe<T>(response);

      if (isSafeArraySuccess(result)) {
        let processedData: T[] = result.data;

        if (transform && processedData.length > 0) {
          try {
            processedData = processedData.map((item) => {
              if (item && typeof item === "object") {
                return transformFromServerFields(item) as T;
              }
              return item;
            });
          } catch (transformError) {
            console.warn("⚠️ Response transformation failed:", transformError);
          }
        }

        setData(processedData);
        setPagination(result.pagination);

        if (cacheTtl > 0) {
          cacheRef.current = {
            data: processedData,
            pagination: result.pagination,
            timestamp: Date.now(),
          };

          if (cacheKey && typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `api_cache_${cacheKey}`,
                JSON.stringify({
                  data: processedData,
                  pagination: result.pagination,
                  timestamp: Date.now(),
                })
              );
            } catch (storageError) {
              console.warn("⚠️ Cache storage failed:", storageError);
            }
          }
        }

        onSuccess?.(processedData);
        retryAttempts.current = 0;

        if (process.env.NODE_ENV === "development") {
          console.log("✅ usePaginatedApi - Data processed:", {
            dataLength: processedData.length,
            hasPagination: !!result.pagination,
            paginationInfo: result.pagination
              ? {
                  currentPage: result.pagination.currentPage,
                  totalCount: result.pagination.totalCount,
                  totalPages: result.pagination.totalPages,
                }
              : null,
          });
        }
      } else if (isSafeArrayError(result)) {
        const errorMessage = result.error;
        setError(errorMessage);
        onError?.(errorMessage);
        setData([]);
        setPagination(null);
      } else {
        const fallbackError = "An unexpected error occurred";
        setError(fallbackError);
        onError?.(fallbackError);
        setData([]);
        setPagination(null);
      }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      onError?.(errorMessage);
      setData([]);
      setPagination(null);

      if (retryAttempts.current < retryCount) {
        retryAttempts.current++;
        const delay = Math.min(
          1000 * Math.pow(2, retryAttempts.current),
          10000
        );
        setTimeout(() => execute(), delay);
      }
    } finally {
      setLoading(false);
    }
  }, [
    apiCall,
    onSuccess,
    onError,
    transform,
    retryCount,
    cacheTtl,
    staleTime,
    cacheKey,
  ]);

  const retry = useCallback(() => {
    retryAttempts.current = 0;
    return execute();
  }, [execute]);

  const refresh = useCallback(() => {
    cacheRef.current = null;
    if (cacheKey && typeof window !== "undefined") {
      localStorage.removeItem(`api_cache_${cacheKey}`);
    }
    return execute();
  }, [execute, cacheKey]);

  const reset = useCallback(() => {
    setData([]);
    setPagination(null);
    setError(null);
    setLoading(false);
    retryAttempts.current = 0;
    cacheRef.current = null;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (refreshInterval > 0 && data.length > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, data, refresh]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    pagination,
    loading,
    error,
    isError: !!error,
    isSuccess: data.length > 0 && !error,
    execute,
    retry,
    reset,
    refresh,
  };
}

// ✅ Authentication hooks
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(apiUtils.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(
    apiUtils.isAuthenticated()
  );

  const login = useApi(
    () => Promise.reject("Use loginWithCredentials instead"),
    {
      immediate: false,
    }
  );

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authAPI.login(email, password);
        const result = handleApiResponseSafe<{
          user: User;
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>(response);
        const extractedData = extractSafeData(result);

        if (isSafeApiSuccess(result) && extractedData !== null) {
          const authData = extractedData;
          const userData = authData.user;

          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          }
        }

        return response;
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await authAPI.refreshToken();
      const result = handleApiResponseSafe<{
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>(response);
      const extractedData = extractSafeData(result);

      if (isSafeApiSuccess(result) && extractedData !== null) {
        const authData = extractedData;
        const userData = authData.user;

        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }

      return response;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (profileData: any) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const result = handleApiResponseSafe<User>(response);
      const extractedData = extractSafeData(result);

      if (isSafeApiSuccess(result) && extractedData !== null) {
        const userData = extractedData;
        setUser(userData);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (passwordData: any) => {
    return authAPI.changePassword(passwordData);
  }, []);

  return {
    user,
    isAuthenticated,
    login: loginWithCredentials,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    isTokenExpiringSoon: apiUtils.isTokenExpiringSoon,
    getTimeUntilExpiry: apiUtils.getTimeUntilExpiry,
    hasPermission: apiUtils.hasPermission,
    hasRole: apiUtils.hasRole,
  };
};

// ✅ Building hooks
export const useBuildings = (params?: any, options?: UseApiOptions) => {
  return usePaginatedApi(() => buildingsAPI.getAll(params), {
    immediate: true,
    cacheTtl: getCacheTTL("/api/buildings"),
    cacheKey: `buildings_${JSON.stringify(params || {})}`,
    ...options,
  });
};

export const useBuilding = (id: number, options?: UseApiOptions) => {
  return useApi(() => buildingsAPI.getById(id), {
    immediate: !!id,
    dependencies: [id],
    cacheTtl: getCacheTTL("/api/buildings"),
    cacheKey: `building_${id}`,
    ...options,
  });
};

export const useBuildingMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBuilding = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await buildingsAPI.create(data);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBuilding = useCallback(async (id: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await buildingsAPI.update(id, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBuilding = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const checkResponse = await buildingsAPI.checkDeletion(id);
      if (!checkResponse.data?.data?.canDelete) {
        throw new Error(
          checkResponse.data?.data?.deletionRecommendation ||
            "Building cannot be deleted due to dependencies"
        );
      }

      const response = await buildingsAPI.delete(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createBuilding,
    updateBuilding,
    deleteBuilding,
    loading,
    error,
  };
};

// ✅ Equipment hooks
export const useEquipment = (params?: any, options?: UseApiOptions) => {
  return usePaginatedApi(() => equipmentAPI.getAll(params), {
    immediate: true,
    cacheTtl: getCacheTTL("/api/equipment"),
    cacheKey: `equipment_${JSON.stringify(params || {})}`,
    dependencies: [params?.buildingId, params?.equipmentType, params?.status],
    ...options,
  });
};

export const useEquipmentById = (id: number, options?: UseApiOptions) => {
  return useApi(() => equipmentAPI.getById(id), {
    immediate: !!id,
    dependencies: [id],
    cacheTtl: getCacheTTL("/api/equipment"),
    cacheKey: `equipment_${id}`,
    ...options,
  });
};

export const useEquipmentMaintenance = (
  id: number,
  params?: any,
  options?: UseApiOptions
) => {
  return usePaginatedApi(() => equipmentAPI.getMaintenanceHistory(id, params), {
    immediate: !!id,
    dependencies: [id],
    cacheTtl: 2 * 60 * 1000,
    cacheKey: `equipment_maintenance_${id}`,
    ...options,
  });
};

export const useEquipmentPerformance = (
  id: number,
  params?: any,
  options?: UseApiOptions
) => {
  return useApi(() => equipmentAPI.getPerformanceAnalytics(id, params), {
    immediate: !!id,
    dependencies: [id, params?.period],
    cacheTtl: 5 * 60 * 1000,
    cacheKey: `equipment_performance_${id}_${params?.period || "default"}`,
    ...options,
  });
};

export const useMaintenanceSchedule = (
  buildingId?: number,
  options?: UseApiOptions
) => {
  return useApi(() => equipmentAPI.getMaintenanceSchedule(buildingId), {
    immediate: true,
    refreshInterval: 5 * 60 * 1000,
    dependencies: [buildingId],
    cacheTtl: 3 * 60 * 1000,
    cacheKey: `maintenance_schedule_${buildingId || "all"}`,
    ...options,
  });
};

export const useEquipmentMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEquipment = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      if (
        data.maintenanceSchedule &&
        !["weekly", "monthly", "quarterly", "annually"].includes(
          data.maintenanceSchedule
        )
      ) {
        throw new Error(
          "Invalid maintenance schedule. Must be: weekly, monthly, quarterly, or annually"
        );
      }

      const response = await equipmentAPI.create(data);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEquipment = useCallback(async (id: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      if (
        data.maintenanceSchedule &&
        !["weekly", "monthly", "quarterly", "annually"].includes(
          data.maintenanceSchedule
        )
      ) {
        throw new Error(
          "Invalid maintenance schedule. Must be: weekly, monthly, quarterly, or annually"
        );
      }

      const response = await equipmentAPI.update(id, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEquipment = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await equipmentAPI.delete(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logMaintenance = useCallback(
    async (id: number, maintenanceData: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await equipmentAPI.logMaintenance(id, maintenanceData);
        return response.data;
      } catch (err: any) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    logMaintenance,
    loading,
    error,
  };
};

// ✅ Energy hooks
export const useEnergyConsumption = (params: any, options?: UseApiOptions) => {
  return usePaginatedApi(() => energyAPI.getConsumption(params), {
    immediate: !!params?.buildingId,
    dependencies: [params?.buildingId, params?.startDate, params?.endDate],
    cacheTtl: 2 * 60 * 1000,
    cacheKey: `energy_consumption_${JSON.stringify(params)}`,
    ...options,
  });
};

export const useEnergyStats = (
  buildingId: number,
  params?: any,
  options?: UseApiOptions
) => {
  return useApi(() => energyAPI.getStats(buildingId, params), {
    immediate: !!buildingId,
    cacheTtl: getCacheTTL("/api/energy/stats"),
    dependencies: [buildingId, params?.startDate, params?.endDate],
    cacheKey: `energy_stats_${buildingId}_${JSON.stringify(params || {})}`,
    ...options,
  });
};

export const useEnergyTrends = (
  buildingId: number,
  params?: any,
  options?: UseApiOptions
) => {
  return useApi(() => energyAPI.getTrends(buildingId, params), {
    immediate: !!buildingId,
    dependencies: [buildingId, params?.period],
    cacheTtl: 5 * 60 * 1000,
    cacheKey: `energy_trends_${buildingId}_${params?.period || "default"}`,
    ...options,
  });
};

// ✅ Power Quality hooks
export const usePowerQualityData = (params: any, options?: UseApiOptions) => {
  return usePaginatedApi(() => powerQualityAPI.getData(params), {
    immediate: !!params?.buildingId,
    dependencies: [params?.buildingId, params?.startDate, params?.endDate],
    cacheTtl: 2 * 60 * 1000,
    cacheKey: `power_quality_data_${JSON.stringify(params)}`,
    ...options,
  });
};

export const usePowerQualityStats = (
  buildingId: number,
  params?: any,
  options?: UseApiOptions
) => {
  return useApi(() => powerQualityAPI.getStats(buildingId, params), {
    immediate: !!buildingId,
    cacheTtl: getCacheTTL("/api/power-quality/stats"),
    dependencies: [buildingId, params?.startDate, params?.endDate],
    cacheKey: `power_quality_stats_${buildingId}_${JSON.stringify(params || {})}`,
    ...options,
  });
};

export const usePowerQualityEvents = (
  buildingId: number,
  params?: any,
  options?: UseApiOptions
) => {
  return usePaginatedApi(() => powerQualityAPI.getEvents(buildingId, params), {
    immediate: !!buildingId,
    refreshInterval: 30 * 1000,
    dependencies: [buildingId, params?.severity, params?.eventType],
    cacheTtl: 60 * 1000,
    cacheKey: `power_quality_events_${buildingId}_${JSON.stringify(params || {})}`,
    ...options,
  });
};

// ✅ Analytics hooks
export const useAnalytics = (params: any, options?: UseApiOptions) => {
  return useApi(() => analyticsAPI.runAnalysis(params), {
    immediate: !!(params?.buildingId && params?.startDate && params?.endDate),
    dependencies: [params?.buildingId, params?.analysisTypes],
    cacheTtl: 10 * 60 * 1000,
    cacheKey: `analytics_${JSON.stringify(params)}`,
    ...options,
  });
};

export const useAnalyticsDashboard = (options?: UseApiOptions) => {
  return useApi(() => analyticsAPI.getDashboard(), {
    immediate: true,
    refreshInterval: 5 * 60 * 1000,
    cacheTtl: getCacheTTL("/api/analytics/dashboard"),
    cacheKey: "analytics_dashboard",
    ...options,
  });
};

export const useMaintenancePrediction = (
  equipmentId: number,
  options?: UseApiOptions
) => {
  return usePaginatedApi(
    () => analyticsAPI.getMaintenancePredictions(equipmentId),
    {
      immediate: !!equipmentId,
      dependencies: [equipmentId],
      cacheTtl: 15 * 60 * 1000,
      cacheKey: `maintenance_predictions_${equipmentId}`,
      ...options,
    }
  );
};

export const useEnergyForecast = (
  buildingId: number,
  params?: any,
  options?: UseApiOptions
) => {
  return useApi(() => analyticsAPI.generateForecast(buildingId, params), {
    immediate: !!buildingId,
    dependencies: [buildingId, params?.forecastDays],
    cacheTtl: 30 * 60 * 1000,
    cacheKey: `energy_forecast_${buildingId}_${params?.forecastDays || 30}`,
    ...options,
  });
};

// ✅ Alert hooks
export const useAlerts = (params?: any, options?: UseApiOptions) => {
  return usePaginatedApi(() => alertsAPI.getAll(params), {
    immediate: true,
    refreshInterval: 30 * 1000,
    dependencies: [params?.severity, params?.status, params?.buildingId],
    cacheTtl: getCacheTTL("/api/alerts"),
    cacheKey: `alerts_${JSON.stringify(params || {})}`,
    ...options,
  });
};

export const useAlert = (id: number, options?: UseApiOptions) => {
  return useApi(() => alertsAPI.getById(id), {
    immediate: !!id,
    dependencies: [id],
    cacheTtl: 2 * 60 * 1000,
    cacheKey: `alert_${id}`,
    ...options,
  });
};

export const useAlertStatistics = (params?: any, options?: UseApiOptions) => {
  return useApi(() => alertsAPI.getStatistics(params), {
    immediate: true,
    refreshInterval: 60 * 1000,
    cacheTtl: 60 * 1000,
    cacheKey: `alert_statistics_${JSON.stringify(params || {})}`,
    ...options,
  });
};

// ✅ Audit hooks
export const useAudits = (params?: any, options?: UseApiOptions) => {
  return usePaginatedApi(() => auditsAPI.getAll(params), {
    immediate: true,
    dependencies: [params?.buildingId, params?.status],
    cacheTtl: getCacheTTL("/api/audits"),
    cacheKey: `audits_${JSON.stringify(params || {})}`,
    ...options,
  });
};

export const useAudit = (id: number, options?: UseApiOptions) => {
  return useApi(() => auditsAPI.getById(id), {
    immediate: !!id,
    dependencies: [id],
    cacheTtl: 5 * 60 * 1000,
    cacheKey: `audit_${id}`,
    ...options,
  });
};

// ✅ Dashboard hooks
export const useDashboardOverview = (options?: UseApiOptions) => {
  return useApi(() => dashboardAPI.getOverview(), {
    immediate: true,
    refreshInterval: 2 * 60 * 1000,
    cacheTtl: getCacheTTL("/api/dashboard/overview"),
    cacheKey: "dashboard_overview",
    ...options,
  });
};

export const useDashboardRealTime = (options?: UseApiOptions) => {
  return useApi(() => dashboardAPI.getRealTimeMetrics(), {
    immediate: true,
    refreshInterval: 30 * 1000,
    cacheTtl: getCacheTTL("/api/dashboard/real-time"),
    cacheKey: "dashboard_real_time",
    ...options,
  });
};

export const useEnergySummary = (params?: any, options?: UseApiOptions) => {
  return useApi(() => dashboardAPI.getEnergySummary(params), {
    immediate: true,
    refreshInterval: 5 * 60 * 1000,
    dependencies: [params?.period, params?.buildingId],
    cacheTtl: 5 * 60 * 1000,
    cacheKey: `energy_summary_${JSON.stringify(params || {})}`,
    ...options,
  });
};

// ✅ ENHANCED: Complete Reports hooks with full functionality
export const useReports = (params?: any, options?: UseApiOptions) => {
  return usePaginatedApi(() => reportsAPI.getAll(params), {
    immediate: true,
    dependencies: [params?.type, params?.status, params?.buildingId],
    cacheTtl: getCacheTTL("/api/reports"),
    cacheKey: `reports_${JSON.stringify(params || {})}`,
    ...options,
  });
};

export const useReport = (id: number, options?: UseApiOptions) => {
  return useApi(() => reportsAPI.getById(id), {
    immediate: !!id,
    dependencies: [id],
    cacheTtl: 5 * 60 * 1000,
    cacheKey: `report_${id}`,
    ...options,
  });
};

export const useReportStats = (options?: UseApiOptions) => {
  return useApi(() => reportsAPI.getStats(), {
    immediate: true,
    cacheTtl: 5 * 60 * 1000,
    cacheKey: "report_stats",
    ...options,
  });
};

// ✅ Enhanced report mutation hooks with comprehensive functionality
export const useReportMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEnergyReport = useCallback(
    async (data: {
      buildingId?: number;
      startDate: string;
      endDate: string;
      title: string;
      includeComparison?: boolean;
      includeTrends?: boolean;
      reportFormat?: string;
      sections?: string[];
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportsAPI.generateEnergy(data);
        return response.data;
      } catch (err: any) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generateComplianceReport = useCallback(
    async (data: {
      auditId: number;
      standards: string[];
      title: string;
      includeGapAnalysis?: boolean;
      reportFormat?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportsAPI.generateCompliance(data);
        return response.data;
      } catch (err: any) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generatePowerQualityReport = useCallback(
    async (data: {
      buildingId: number;
      startDate: string;
      endDate: string;
      title: string;
      includeEvents?: boolean;
      includeCompliance?: boolean;
      reportFormat?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportsAPI.generatePowerQuality(data);
        return response.data;
      } catch (err: any) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generateAuditReport = useCallback(
    async (data: {
      auditId: number;
      title: string;
      includeCompliance?: boolean;
      includeRecommendations?: boolean;
      reportFormat?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportsAPI.generateAudit(data);
        return response.data;
      } catch (err: any) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generateMonitoringReport = useCallback(
    async (data: {
      buildingId?: number;
      reportTypes: string[];
      startDate: string;
      endDate: string;
      title: string;
      reportFormat?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportsAPI.generateMonitoring(data);
        return response.data;
      } catch (err: any) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const downloadReport = useCallback(async (id: number): Promise<Blob> => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsAPI.download(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const regenerateReport = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsAPI.regenerate(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsAPI.delete(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateEnergyReport,
    generateComplianceReport,
    generatePowerQualityReport,
    generateAuditReport,
    generateMonitoringReport,
    downloadReport,
    regenerateReport,
    deleteReport,
    loading,
    error,
  };
};

// ✅ Enhanced report polling hook for tracking generation progress
export const useReportPolling = (
  reportId: number,
  options?: {
    interval?: number;
    onComplete?: (report: Report) => void;
    onError?: (error: string) => void;
    maxAttempts?: number;
  }
) => {
  const {
    interval = 2000,
    onComplete,
    onError,
    maxAttempts = 150, // 5 minutes max
  } = options || {};

  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const attemptCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: report, execute } = useReport(reportId, {
    immediate: false,
    transform: true,
  });

  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    setAttempts(0);
    attemptCountRef.current = 0;

    const poll = async () => {
      try {
        await execute();
        attemptCountRef.current++;
        setAttempts(attemptCountRef.current);

        if (report) {
          if (report.status === "completed") {
            setIsPolling(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onComplete?.(report);
            return;
          }

          if (report.status === "failed" || report.status === "cancelled") {
            setIsPolling(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onError?.(report.errorMessage || "Report generation failed");
            return;
          }
        }

        if (attemptCountRef.current >= maxAttempts) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          onError?.("Report generation timeout");
        }
      } catch (error) {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onError?.(extractErrorMessage(error));
      }
    };

    // Initial poll
    poll();

    // Set up interval polling
    intervalRef.current = setInterval(poll, interval);
  }, [execute, report, interval, maxAttempts, onComplete, onError, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    report,
    isPolling,
    attempts,
    progress:
      report?.status === "generating"
        ? Math.min((attempts / maxAttempts) * 100, 95)
        : 0,
    startPolling,
    stopPolling,
  };
};

// ✅ Enhanced monitoring hooks
export const useMonitoringDashboard = (options?: UseApiOptions) => {
  return useApi(() => monitoringAPI.getDashboard(), {
    immediate: true,
    refreshInterval: 60 * 1000,
    cacheTtl: getCacheTTL("/api/monitoring/dashboard"),
    cacheKey: "monitoring_dashboard",
    ...options,
  });
};

export const useMonitoringActivities = (
  params?: any,
  options?: UseApiOptions
) => {
  return usePaginatedApi(() => monitoringAPI.getActivities(params), {
    immediate: true,
    refreshInterval: 30 * 1000,
    dependencies: [params?.buildingId, params?.activityType],
    cacheTtl: 60 * 1000,
    cacheKey: `monitoring_activities_${JSON.stringify(params || {})}`,
    ...options,
  });
};

export const useSystemHealth = (options?: UseApiOptions) => {
  return useApi(() => monitoringAPI.getSystemHealth(), {
    immediate: true,
    refreshInterval: 30 * 1000,
    cacheTtl: 60 * 1000,
    cacheKey: "system_health",
    ...options,
  });
};

// ✅ Enhanced real-time data hook
export const useRealTimeData = <T = any>(
  endpoint: string,
  interval: number = 30000,
  options?: UseApiOptions
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      const response = await api.get(endpoint);
      const result = handleApiResponseSafe<T>(response);
      const extractedData = extractSafeData(result);

      if (isSafeApiSuccess(result) && extractedData !== null) {
        let responseData: T = extractedData;

        if (options?.transform !== false) {
          if (typeof responseData === "object" && responseData !== null) {
            responseData = transformFromServerFields(responseData) as T;
          }
        }

        if (isActiveRef.current) {
          setData(responseData);
          setLastUpdated(new Date());
          setError(null);
        }
      } else if (isSafeApiError(result)) {
        if (isActiveRef.current) {
          setError(result.error);
        }
      } else {
        if (isActiveRef.current) {
          setError("No data received");
        }
      }
    } catch (err: any) {
      if (isActiveRef.current) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
      }
    } finally {
      if (isActiveRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, options?.transform]);

  useEffect(() => {
    isActiveRef.current = true;
    fetchData();
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

// ✅ Enhanced batch operations hook
export const useBatchOperations = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const executeBatch = useCallback(
    async (operations: (() => Promise<any>)[]) => {
      setLoading(true);
      setResults([]);
      setErrors([]);
      setProgress(0);

      const batchResults: any[] = [];
      const batchErrors: string[] = [];

      for (let i = 0; i < operations.length; i++) {
        try {
          const result = await operations[i]();
          batchResults.push(result);
        } catch (error: any) {
          const errorMessage = extractErrorMessage(error);
          batchErrors.push(errorMessage);
          batchResults.push(null);
        }

        setProgress(((i + 1) / operations.length) * 100);
      }

      setResults(batchResults);
      setErrors(batchErrors);
      setLoading(false);

      return {
        results: batchResults,
        errors: batchErrors,
        success: batchErrors.length === 0,
        successCount: batchResults.filter((r) => r !== null).length,
        totalCount: operations.length,
      };
    },
    []
  );

  return {
    executeBatch,
    loading,
    results,
    errors,
    progress,
  };
};

// ✅ Enhanced optimistic updates hook
export const useOptimisticUpdate = <T extends Record<string, any> = any>(
  data: T[],
  keyField: string = "id"
) => {
  const [optimisticData, setOptimisticData] = useState<T[]>(data);
  const [pendingOperations, setPendingOperations] = useState<Set<any>>(
    new Set()
  );

  useEffect(() => {
    setOptimisticData(data);
  }, [data]);

  const addOptimistic = useCallback(
    (item: T) => {
      const key = (item as any)[keyField];
      setOptimisticData((prev) => [...prev, item]);
      setPendingOperations((prev) => new Set(prev).add(key));
    },
    [keyField]
  );

  const updateOptimistic = useCallback(
    (key: any, updates: Partial<T>) => {
      setOptimisticData((prev) =>
        prev.map((item) =>
          (item as any)[keyField] === key ? { ...item, ...updates } : item
        )
      );
      setPendingOperations((prev) => new Set(prev).add(key));
    },
    [keyField]
  );

  const removeOptimistic = useCallback(
    (key: any) => {
      setOptimisticData((prev) =>
        prev.filter((item) => (item as any)[keyField] !== key)
      );
      setPendingOperations((prev) => new Set(prev).add(key));
    },
    [keyField]
  );

  const confirmOperation = useCallback((key: any) => {
    setPendingOperations((prev) => {
      const updated = new Set(prev);
      updated.delete(key);
      return updated;
    });
  }, []);

  const revertOptimistic = useCallback(() => {
    setOptimisticData(data);
    setPendingOperations(new Set());
  }, [data]);

  return {
    data: optimisticData,
    pendingOperations,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    confirmOperation,
    revertOptimistic,
  };
};

// ✅ API status hook
export const useApiStatus = () => {
  const [status, setStatus] = useState<"connected" | "disconnected" | "error">(
    "connected"
  );
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [responseTime, setResponseTime] = useState<number>(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);

  const checkStatus = useCallback(async () => {
    try {
      const result = await apiUtils.testConnection();
      setStatus(result.success ? "connected" : "error");
      setResponseTime(result.responseTime);
      setLastCheck(new Date());

      if (result.success) {
        setConsecutiveErrors(0);
      } else {
        setConsecutiveErrors((prev) => prev + 1);
      }
    } catch {
      setStatus("disconnected");
      setLastCheck(new Date());
      setConsecutiveErrors((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    status,
    lastCheck,
    responseTime,
    consecutiveErrors,
    checkStatus,
    isConnected: status === "connected",
    hasIssues: consecutiveErrors > 2,
  };
};

// ✅ Enhanced data synchronization hook
export const useDataSync = <T = any>(
  fetchFn: () => Promise<AxiosResponse<ApiResponse<T>>>,
  syncKey: string,
  options?: UseApiOptions & { syncInterval?: number }
) => {
  const { syncInterval = 5 * 60 * 1000, ...apiOptions } = options || {};
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">(
    "idle"
  );

  const apiState = useApi(fetchFn, {
    ...apiOptions,
    onSuccess: (data: T) => {
      setLastSync(new Date());
      setSyncStatus("idle");

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `sync_${syncKey}`,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      }

      apiOptions?.onSuccess?.(data);
    },
    onError: (error: string) => {
      setSyncStatus("error");
      apiOptions?.onError?.(error);
    },
  });

  const sync = useCallback(async () => {
    setSyncStatus("syncing");
    await apiState.execute();
  }, [apiState]);

  useEffect(() => {
    if (syncInterval > 0) {
      const interval = setInterval(sync, syncInterval);
      return () => clearInterval(interval);
    }
  }, [sync, syncInterval]);

  return {
    ...apiState,
    sync,
    lastSync,
    syncStatus,
  };
};
