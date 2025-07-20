// lib/api-response-handler.ts

import type { ApiResponse } from "@/types/api-types";

/**
 * ✅ ENHANCED: API Response Handler with complete blob support and TypeScript safety
 * Enhanced for perfect reports integration with file download capabilities
 */

// ✅ Enhanced type guards for different response structures
export function isApiResponseWithData<T = any>(
  response: any
): response is ApiResponse<T> {
  return (
    response &&
    typeof response === "object" &&
    typeof response.success === "boolean" &&
    response.data !== undefined
  );
}

export function isPaginatedResponse<T = any>(
  data: any
): data is { data: T[]; pagination?: any } {
  return (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray(data.data)
  );
}

export function isDirectArrayResponse<T = any>(data: any): data is T[] {
  return Array.isArray(data);
}

export function isDirectObjectResponse<T = any>(data: any): data is T {
  return (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    !("data" in data)
  );
}

// ✅ ENHANCED: Blob detection and handling
export function isBlobResponse(data: any): data is Blob {
  return data instanceof Blob;
}

export function isFileResponse(data: any): data is File {
  return typeof File !== "undefined" && data instanceof File;
}

export function isBinaryResponse(data: any): data is ArrayBuffer {
  return data instanceof ArrayBuffer;
}

// ✅ Enhanced type guards without generic constraints
export function hasDataProperty(obj: any): obj is { data: any } {
  return obj && typeof obj === "object" && "data" in obj;
}

export function hasArrayData(obj: any): obj is { data: any[] } {
  return hasDataProperty(obj) && Array.isArray(obj.data);
}

export function hasObjectData(obj: any): obj is { data: any } {
  return (
    hasDataProperty(obj) &&
    obj.data &&
    typeof obj.data === "object" &&
    !Array.isArray(obj.data)
  );
}

export function hasPaginationData(obj: any): obj is { pagination: any } {
  return obj && typeof obj === "object" && "pagination" in obj;
}

// ✅ ENHANCED: Safe response result types with blob support
export interface SafeArraySuccess<T> {
  success: true;
  data: T[];
  pagination: any;
  error: null;
}

export interface SafeArrayFailure {
  success: false;
  data: [];
  pagination: null;
  error: string;
}

export interface SafeObjectSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface SafeObjectFailure {
  success: false;
  data: null;
  error: string;
}

// ✅ ENHANCED: Blob response types with fixed metadata typing
export interface SafeBlobSuccess {
  success: true;
  data: Blob;
  error: null;
  metadata?: {
    filename?: string;
    contentType?: string;
    size?: number;
  };
}

export interface SafeBlobFailure {
  success: false;
  data: null;
  error: string;
  metadata?: undefined; // ✅ FIXED: Use undefined instead of null for optional metadata
}

export type SafeArrayResult<T> = SafeArraySuccess<T> | SafeArrayFailure;
export type SafeObjectResult<T> = SafeObjectSuccess<T> | SafeObjectFailure;
export type SafeBlobResult = SafeBlobSuccess | SafeBlobFailure;

// ✅ Enhanced type guard functions
export function isSafeArraySuccess<T>(
  result: SafeArrayResult<T>
): result is SafeArraySuccess<T> {
  return result.success === true;
}

export function isSafeArrayFailure<T>(
  result: SafeArrayResult<T>
): result is SafeArrayFailure {
  return result.success === false;
}

export function isSafeObjectSuccess<T>(
  result: SafeObjectResult<T>
): result is SafeObjectSuccess<T> {
  return result.success === true;
}

export function isSafeObjectFailure<T>(
  result: SafeObjectResult<T>
): result is SafeObjectFailure {
  return result.success === false;
}

export function isSafeBlobSuccess(
  result: SafeBlobResult
): result is SafeBlobSuccess {
  return result.success === true;
}

export function isSafeBlobFailure(
  result: SafeBlobResult
): result is SafeBlobFailure {
  return result.success === false;
}

// ✅ ENHANCED: Safe data extraction utilities with blob support
export function safeExtractArrayData<T>(response: any): SafeArrayResult<T> {
  try {
    // Check if response is valid
    if (!response) {
      console.warn("Invalid response: null or undefined");
      return {
        success: false,
        data: [],
        pagination: null,
        error: "Invalid response: null or undefined",
      };
    }

    // Handle direct array response
    if (isDirectArrayResponse<T>(response)) {
      console.log("✅ Direct array response detected");
      return {
        success: true,
        data: response,
        pagination: null,
        error: null,
      };
    }

    // Handle API response wrapper
    if (isApiResponseWithData(response)) {
      if (!response.success) {
        console.warn("API response indicates failure:", response.message);
        return {
          success: false,
          data: [],
          pagination: null,
          error: response.message || response.error || "Request failed",
        };
      }

      const responseData = response.data as any;

      // Handle null or undefined data
      if (responseData === null || responseData === undefined) {
        console.warn("Response data is null or undefined");
        return {
          success: false,
          data: [],
          pagination: null,
          error: "Response data is null or undefined",
        };
      }

      // Case 1: Direct array in data field
      if (Array.isArray(responseData)) {
        console.log("✅ Direct array in data field detected");
        return {
          success: true,
          data: responseData as T[],
          pagination: response.pagination || null,
          error: null,
        };
      }

      // Case 2: Paginated response with nested data
      if (
        responseData &&
        typeof responseData === "object" &&
        "data" in responseData &&
        Array.isArray(responseData.data)
      ) {
        console.log("✅ Paginated response detected");
        return {
          success: true,
          data: (responseData.data as T[]) || [],
          pagination: responseData.pagination || response.pagination || null,
          error: null,
        };
      }

      // Case 3: Object with data property that might be an array
      if (
        responseData &&
        typeof responseData === "object" &&
        "data" in responseData
      ) {
        const nestedData = responseData.data;
        if (Array.isArray(nestedData)) {
          console.log("✅ Nested array response detected");
          return {
            success: true,
            data: nestedData as T[],
            pagination: responseData.pagination || response.pagination || null,
            error: null,
          };
        }
      }

      // Case 4: Single object wrapped in array
      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData) &&
        !("data" in responseData)
      ) {
        console.log("✅ Single object response, wrapping in array");
        return {
          success: true,
          data: [responseData as T],
          pagination: response.pagination || null,
          error: null,
        };
      }
    }

    // Handle raw data
    if (response && typeof response === "object") {
      if ("data" in response) {
        const data = response.data;
        if (Array.isArray(data)) {
          return {
            success: true,
            data: data as T[],
            pagination: response.pagination || null,
            error: null,
          };
        }
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          Array.isArray(data.data)
        ) {
          return {
            success: true,
            data: (data.data as T[]) || [],
            pagination: data.pagination || response.pagination || null,
            error: null,
          };
        }
      }
    }

    // Fallback: empty array
    console.warn(
      "Unrecognized response structure, returning empty array:",
      response
    );
    return {
      success: false,
      data: [],
      pagination: null,
      error: "Unrecognized response structure",
    };
  } catch (error) {
    console.error("Error extracting array data:", error);
    return {
      success: false,
      data: [],
      pagination: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export function safeExtractObjectData<T>(response: any): SafeObjectResult<T> {
  try {
    // Check if response is valid
    if (!response) {
      console.warn("Invalid response: null or undefined");
      return {
        success: false,
        data: null,
        error: "Invalid response: null or undefined",
      };
    }

    // Handle direct object response
    if (isDirectObjectResponse<T>(response)) {
      console.log("✅ Direct object response detected");
      return {
        success: true,
        data: response,
        error: null,
      };
    }

    // Handle API response wrapper
    if (isApiResponseWithData(response)) {
      if (!response.success) {
        console.warn("API response indicates failure:", response.message);
        return {
          success: false,
          data: null,
          error: response.message || response.error || "Request failed",
        };
      }

      const responseData = response.data as any;

      // Handle null or undefined data
      if (responseData === null || responseData === undefined) {
        console.warn("Response data is null or undefined");
        return {
          success: false,
          data: null,
          error: "Response data is null or undefined",
        };
      }

      // Case 1: Direct object response
      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData) &&
        !("data" in responseData)
      ) {
        console.log("✅ Direct object response detected");
        return {
          success: true,
          data: responseData as T,
          error: null,
        };
      }

      // Case 2: Nested object response
      if (
        responseData &&
        typeof responseData === "object" &&
        "data" in responseData
      ) {
        const nestedData = responseData.data;
        if (
          nestedData &&
          typeof nestedData === "object" &&
          !Array.isArray(nestedData)
        ) {
          console.log("✅ Nested object response detected");
          return {
            success: true,
            data: nestedData as T,
            error: null,
          };
        }
      }

      // Case 3: Array with single item
      if (Array.isArray(responseData) && responseData.length > 0) {
        console.log("✅ Array response, extracting first item");
        return {
          success: true,
          data: responseData[0] as T,
          error: null,
        };
      }

      // Case 4: Return the data as-is if it's not null/undefined
      if (responseData !== null && responseData !== undefined) {
        return {
          success: true,
          data: responseData as T,
          error: null,
        };
      }
    }

    // Handle raw object data
    if (response && typeof response === "object") {
      if ("data" in response) {
        const data = response.data;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          return {
            success: true,
            data: data as T,
            error: null,
          };
        }
        if (Array.isArray(data) && data.length > 0) {
          return {
            success: true,
            data: data[0] as T,
            error: null,
          };
        }
      }

      // Return the response object itself if it looks like valid data
      if (!("success" in response) && !("error" in response)) {
        return {
          success: true,
          data: response as T,
          error: null,
        };
      }
    }

    // Fallback: null
    console.warn("Unrecognized response structure, returning null:", response);
    return {
      success: false,
      data: null,
      error: "Unrecognized response structure",
    };
  } catch (error) {
    console.error("Error extracting object data:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ✅ ENHANCED: Blob data extraction for file downloads with fixed metadata typing
export function safeExtractBlobData(
  response: any,
  expectedContentType?: string
): SafeBlobResult {
  try {
    // Check if response is valid
    if (!response) {
      console.warn("Invalid blob response: null or undefined");
      return {
        success: false,
        data: null,
        error: "Invalid response: null or undefined",
        metadata: undefined, // ✅ FIXED: Use undefined instead of null
      };
    }

    // Handle direct blob response
    if (isBlobResponse(response)) {
      console.log("✅ Direct blob response detected");
      return {
        success: true,
        data: response,
        error: null,
        metadata: {
          contentType: response.type,
          size: response.size,
        },
      };
    }

    // Handle AxiosResponse with blob data
    if (response.data && isBlobResponse(response.data)) {
      console.log("✅ Axios blob response detected");

      // Extract metadata from headers if available
      const headers = response.headers || {};
      const contentDisposition =
        headers["content-disposition"] || headers["Content-Disposition"];
      const contentType =
        headers["content-type"] ||
        headers["Content-Type"] ||
        response.data.type;

      let filename: string | undefined;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      return {
        success: true,
        data: response.data,
        error: null,
        metadata: {
          filename,
          contentType,
          size: response.data.size,
        },
      };
    }

    // Handle File response
    if (isFileResponse(response)) {
      console.log("✅ File response detected");
      return {
        success: true,
        data: response,
        error: null,
        metadata: {
          filename: response.name,
          contentType: response.type,
          size: response.size,
        },
      };
    }

    // Handle ArrayBuffer response (convert to blob)
    if (isBinaryResponse(response)) {
      console.log("✅ ArrayBuffer response detected, converting to blob");
      const blob = new Blob([response], {
        type: expectedContentType || "application/octet-stream",
      });
      return {
        success: true,
        data: blob,
        error: null,
        metadata: {
          contentType: blob.type,
          size: blob.size,
        },
      };
    }

    // Handle API response wrapper with blob data
    if (isApiResponseWithData(response)) {
      if (!response.success) {
        console.warn("API response indicates failure:", response.message);
        return {
          success: false,
          data: null,
          error: response.message || response.error || "Request failed",
          metadata: undefined, // ✅ FIXED: Use undefined instead of null
        };
      }

      if (isBlobResponse(response.data)) {
        return {
          success: true,
          data: response.data,
          error: null,
          metadata: {
            contentType: response.data.type,
            size: response.data.size,
          },
        };
      }
    }

    // If we reach here, it's not a blob response
    console.warn("Response is not a blob:", response);
    return {
      success: false,
      data: null,
      error: "Response is not a blob or file",
      metadata: undefined, // ✅ FIXED: Use undefined instead of null
    };
  } catch (error) {
    console.error("Error extracting blob data:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      metadata: undefined, // ✅ FIXED: Use undefined instead of null
    };
  }
}

export function safeExtractPaginationData(response: any) {
  try {
    if (!response) {
      return null;
    }

    // Check for pagination at root level of API response
    if (isApiResponseWithData(response) && response.pagination) {
      return response.pagination;
    }

    // Check for pagination in nested structure
    if (isApiResponseWithData(response)) {
      const responseData = response.data;

      if (isPaginatedResponse(responseData) && responseData.pagination) {
        return responseData.pagination;
      }

      // Check for pagination fields directly in data
      if (responseData && typeof responseData === "object") {
        const paginationFields = [
          "current_page",
          "currentPage",
          "page",
          "total_count",
          "totalCount",
          "total_items",
          "total",
          "per_page",
          "perPage",
          "limit",
          "pageSize",
          "total_pages",
          "totalPages",
          "lastPage",
        ];

        const hasPaginationFields = paginationFields.some(
          (field) => field in responseData
        );

        if (hasPaginationFields) {
          return responseData;
        }
      }
    }

    // Check for pagination in raw response
    if (response && typeof response === "object") {
      if (response.pagination) {
        return response.pagination;
      }

      const paginationFields = [
        "current_page",
        "currentPage",
        "page",
        "total_count",
        "totalCount",
        "total_items",
        "total",
        "per_page",
        "perPage",
        "limit",
        "pageSize",
        "total_pages",
        "totalPages",
        "lastPage",
      ];

      const hasPaginationFields = paginationFields.some(
        (field) => field in response
      );

      if (hasPaginationFields) {
        return response;
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting pagination data:", error);
    return null;
  }
}

// ✅ ENHANCED: Response handler with blob support
export function createSafeResponseHandler<T>() {
  return {
    // For array responses (like lists, paginated data)
    handleArrayResponse: (response: any): SafeArrayResult<T> => {
      return safeExtractArrayData<T>(response);
    },

    // For single object responses
    handleObjectResponse: (response: any): SafeObjectResult<T> => {
      return safeExtractObjectData<T>(response);
    },

    // ✅ ENHANCED: For blob responses (file downloads)
    handleBlobResponse: (
      response: any,
      expectedContentType?: string
    ): SafeBlobResult => {
      return safeExtractBlobData(response, expectedContentType);
    },

    // For responses that could be either array or object
    handleMixedResponse: (
      response: any
    ): {
      data: T | T[] | null;
      pagination: any;
      success: boolean;
      error: string | null;
    } => {
      const arrayResult = safeExtractArrayData<T>(response);

      if (isSafeArraySuccess(arrayResult) && arrayResult.data.length > 0) {
        return {
          data: arrayResult.data,
          pagination: arrayResult.pagination,
          success: true,
          error: null,
        };
      }

      const objectResult = safeExtractObjectData<T>(response);
      if (isSafeObjectSuccess(objectResult)) {
        return {
          data: objectResult.data,
          pagination: null,
          success: true,
          error: null,
        };
      }

      const errorMessage = isSafeObjectFailure(objectResult)
        ? objectResult.error
        : isSafeArrayFailure(arrayResult)
          ? arrayResult.error
          : "Failed to process response";

      return {
        data: null,
        pagination: null,
        success: false,
        error: errorMessage,
      };
    },
  };
}

// ✅ ENHANCED: Utility functions with blob support
export function handleApiResponse<T>(response: any): {
  success: boolean;
  data: T | null;
  error: string | null;
} {
  const result = safeExtractObjectData<T>(response);

  if (isSafeObjectSuccess(result)) {
    return {
      success: true,
      data: result.data,
      error: null,
    };
  } else if (isSafeObjectFailure(result)) {
    return {
      success: false,
      data: null,
      error: result.error,
    };
  } else {
    return {
      success: false,
      data: null,
      error: "Unknown error occurred",
    };
  }
}

export function handleArrayApiResponse<T>(response: any): {
  success: boolean;
  data: T[];
  pagination: any;
  error: string | null;
} {
  const result = safeExtractArrayData<T>(response);

  if (isSafeArraySuccess(result)) {
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      error: null,
    };
  } else if (isSafeArrayFailure(result)) {
    return {
      success: false,
      data: [],
      pagination: null,
      error: result.error,
    };
  } else {
    return {
      success: false,
      data: [],
      pagination: null,
      error: "Unknown error occurred",
    };
  }
}

// ✅ ENHANCED: Blob API response handler with fixed metadata typing
export function handleBlobApiResponse(
  response: any,
  expectedContentType?: string
): {
  success: boolean;
  data: Blob | null;
  error: string | null;
  metadata?: {
    filename?: string;
    contentType?: string;
    size?: number;
  };
} {
  const result = safeExtractBlobData(response, expectedContentType);

  if (isSafeBlobSuccess(result)) {
    return {
      success: true,
      data: result.data,
      error: null,
      metadata: result.metadata,
    };
  } else if (isSafeBlobFailure(result)) {
    return {
      success: false,
      data: null,
      error: result.error,
      metadata: result.metadata, // This will be undefined, which is correct
    };
  } else {
    return {
      success: false,
      data: null,
      error: "Unknown error occurred",
      metadata: undefined,
    };
  }
}

// ✅ ENHANCED: Type-safe response processing for different entity types
export const responseHandlers = {
  buildings: createSafeResponseHandler<any>(),
  equipment: createSafeResponseHandler<any>(),
  alerts: createSafeResponseHandler<any>(),
  reports: createSafeResponseHandler<any>(),
  jobs: createSafeResponseHandler<any>(),
  users: createSafeResponseHandler<any>(),
  audits: createSafeResponseHandler<any>(),

  // ✅ ENHANCED: Specialized handlers for different content types
  blobs: {
    handleResponse: (response: any, expectedContentType?: string) =>
      safeExtractBlobData(response, expectedContentType),
  },

  files: {
    handleDownload: (response: any, filename?: string) => {
      const result = safeExtractBlobData(response);
      if (isSafeBlobSuccess(result)) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            filename: filename || result.metadata?.filename,
          },
        };
      }
      return result;
    },
  },
};

// ✅ Enhanced logging for debugging
export function logResponseStructure(response: any, context: string) {
  if (process.env.NODE_ENV === "development") {
    console.group(`🔍 Response Analysis: ${context}`);
    console.log("Response type:", typeof response);

    if (response) {
      console.log("Has success field:", "success" in response);
      console.log("Has data field:", "data" in response);
      console.log("Has error field:", "error" in response);
      console.log("Is blob:", isBlobResponse(response));
      console.log("Is file:", isFileResponse(response));
      console.log("Is binary:", isBinaryResponse(response));

      if ("data" in response) {
        console.log("Data type:", typeof response.data);
        console.log("Is data array:", Array.isArray(response.data));
        console.log("Is data blob:", isBlobResponse(response.data));

        if (response.data && typeof response.data === "object") {
          console.log("Data keys:", Object.keys(response.data));

          if ("data" in response.data) {
            console.log("Nested data type:", typeof response.data.data);
            console.log(
              "Is nested data array:",
              Array.isArray(response.data.data)
            );
          }
        }
      }

      if (response.pagination || (response.data && response.data.pagination)) {
        console.log("Has pagination:", true);
      }

      // ✅ Enhanced blob information logging
      if (
        isBlobResponse(response) ||
        (response.data && isBlobResponse(response.data))
      ) {
        const blob = isBlobResponse(response) ? response : response.data;
        console.log("Blob info:", {
          type: blob.type,
          size: blob.size,
          sizeInMB: (blob.size / 1024 / 1024).toFixed(2),
        });
      }
    }

    console.groupEnd();
  }
}

// ✅ Enhanced utility functions
export function safeGetProperty<T>(obj: any, path: string, defaultValue: T): T {
  try {
    if (!obj) return defaultValue;

    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined && current[key] !== null
        ? current[key]
        : defaultValue;
    }, obj);
  } catch {
    return defaultValue;
  }
}

export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;

  if (typeof value === "number") {
    return isNaN(value) || !isFinite(value) ? defaultValue : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return defaultValue;

    const parsed = parseFloat(trimmed);
    return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
}

export function safeString(value: any, defaultValue: string = ""): string {
  if (value === null || value === undefined) return defaultValue;

  if (typeof value === "string") return value;

  if (typeof value === "number") {
    return isNaN(value) ? defaultValue : String(value);
  }

  if (typeof value === "boolean") return String(value);

  try {
    return String(value);
  } catch {
    return defaultValue;
  }
}

export function safeArray<T>(value: any, defaultValue: T[] = []): T[] {
  if (Array.isArray(value)) return value;

  if (value === null || value === undefined) return defaultValue;

  if (value !== null && value !== undefined) {
    return [value] as T[];
  }

  return defaultValue;
}

export function safeBoolean(
  value: any,
  defaultValue: boolean = false
): boolean {
  if (typeof value === "boolean") return value;

  if (value === null || value === undefined) return defaultValue;

  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes";
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return defaultValue;
}

export function safeDate(value: any, defaultValue?: Date): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? defaultValue || null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? defaultValue || null : date;
  }

  return defaultValue || null;
}

// ✅ ENHANCED: Blob and file utilities
export function safeBlobSize(blob: Blob): string {
  const bytes = blob.size;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

export function safeBlobType(blob: Blob): string {
  return blob.type || "application/octet-stream";
}

export function createSafeBlobUrl(blob: Blob): string {
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to create blob URL:", error);
    throw new Error("Failed to create blob URL");
  }
}

export function revokeSafeBlobUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn("Failed to revoke blob URL:", error);
  }
}

// ✅ Enhanced validation helpers with blob support
export function validateResponseStructure(response: any): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  responseType: "object" | "array" | "blob" | "unknown";
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let responseType: "object" | "array" | "blob" | "unknown" = "unknown";

  if (!response) {
    issues.push("Response is null or undefined");
    suggestions.push("Check if the API call completed successfully");
    return { isValid: false, issues, suggestions, responseType };
  }

  // Check for blob response
  if (isBlobResponse(response)) {
    responseType = "blob";

    if (response.size === 0) {
      issues.push("Blob response has zero size");
      suggestions.push("Check if the file was generated correctly");
    }

    if (!response.type) {
      suggestions.push("Consider setting a proper MIME type for the blob");
    }

    return { isValid: issues.length === 0, issues, suggestions, responseType };
  }

  // Check for array response
  if (Array.isArray(response)) {
    responseType = "array";
    return { isValid: true, issues, suggestions, responseType };
  }

  if (typeof response !== "object") {
    issues.push("Response is not an object, array, or blob");
    suggestions.push("Ensure the API returns a valid response format");
    return { isValid: false, issues, suggestions, responseType };
  }

  responseType = "object";

  // Check for common response patterns
  const hasSuccess = "success" in response;
  const hasData = "data" in response;
  const hasError = "error" in response;
  const hasMessage = "message" in response;

  if (hasSuccess && typeof response.success !== "boolean") {
    issues.push("Success field is not a boolean");
    suggestions.push("Ensure the success field is either true or false");
  }

  if (hasSuccess && !response.success && !hasError && !hasMessage) {
    issues.push("Failed response lacks error information");
    suggestions.push("Include error or message field for failed responses");
  }

  if (!hasSuccess && !hasData && !Array.isArray(response)) {
    issues.push("Response doesn't match expected patterns");
    suggestions.push(
      "Use standard API response format with success/data fields"
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    responseType,
  };
}

// ✅ Response transformation helper with blob support
export function transformResponseData<T>(
  data: any,
  transformer?: (data: any) => T
): T {
  // Don't transform blob data
  if (isBlobResponse(data) || isFileResponse(data) || isBinaryResponse(data)) {
    return data as T;
  }

  if (!transformer) {
    return data as T;
  }

  try {
    return transformer(data);
  } catch (error) {
    console.warn("Response transformation failed:", error);
    return data as T;
  }
}

// ✅ ENHANCED: Comprehensive response processor with blob support
export function processApiResponse<T>(
  response: any,
  options: {
    expectArray?: boolean;
    expectBlob?: boolean;
    allowEmpty?: boolean;
    validateStructure?: boolean;
    logDebug?: boolean;
    expectedContentType?: string;
  } = {}
): {
  success: boolean;
  data: T | T[] | Blob | null;
  pagination?: any;
  error: string | null;
  metadata?: {
    responseType: string;
    hasData: boolean;
    hasPagination: boolean;
    dataLength?: number;
    blobInfo?: {
      size: number;
      type: string;
      filename?: string;
    };
  };
} {
  const {
    expectArray = false,
    expectBlob = false,
    allowEmpty = true,
    validateStructure = false,
    logDebug = false,
    expectedContentType,
  } = options;

  if (logDebug) {
    logResponseStructure(response, "processApiResponse");
  }

  // Validate structure if requested
  if (validateStructure) {
    const validation = validateResponseStructure(response);
    if (!validation.isValid) {
      return {
        success: false,
        data: null,
        error: `Invalid response structure: ${validation.issues.join(", ")}`,
        metadata: {
          responseType: validation.responseType,
          hasData: false,
          hasPagination: false,
        },
      };
    }
  }

  // Handle blob responses
  if (
    expectBlob ||
    isBlobResponse(response) ||
    (response?.data && isBlobResponse(response.data))
  ) {
    const result = safeExtractBlobData(response, expectedContentType);

    if (isSafeBlobSuccess(result)) {
      return {
        success: true,
        data: result.data,
        error: null,
        metadata: {
          responseType: "blob",
          hasData: true,
          hasPagination: false,
          blobInfo: {
            size: result.data.size,
            type: result.data.type,
            filename: result.metadata?.filename,
          },
        },
      };
    } else if (isSafeBlobFailure(result)) {
      return {
        success: false,
        data: null,
        error: result.error,
        metadata: {
          responseType: "blob",
          hasData: false,
          hasPagination: false,
        },
      };
    }
  }

  // Handle array responses
  if (expectArray) {
    const result = safeExtractArrayData<T>(response);

    if (isSafeArraySuccess(result)) {
      const data = result.data;

      if (!allowEmpty && data.length === 0) {
        return {
          success: false,
          data: null,
          error: "Expected non-empty array but received empty array",
          metadata: {
            responseType: "array",
            hasData: false,
            hasPagination: !!result.pagination,
            dataLength: 0,
          },
        };
      }

      return {
        success: true,
        data: data,
        pagination: result.pagination,
        error: null,
        metadata: {
          responseType: "array",
          hasData: data.length > 0,
          hasPagination: !!result.pagination,
          dataLength: data.length,
        },
      };
    } else if (isSafeArrayFailure(result)) {
      return {
        success: false,
        data: null,
        pagination: null,
        error: result.error,
        metadata: {
          responseType: "array",
          hasData: false,
          hasPagination: false,
          dataLength: 0,
        },
      };
    }
  }

  // Handle object responses
  const result = safeExtractObjectData<T>(response);

  if (isSafeObjectSuccess(result)) {
    return {
      success: true,
      data: result.data,
      error: null,
      metadata: {
        responseType: "object",
        hasData: result.data !== null,
        hasPagination: false,
      },
    };
  } else if (isSafeObjectFailure(result)) {
    return {
      success: false,
      data: null,
      error: result.error,
      metadata: {
        responseType: "object",
        hasData: false,
        hasPagination: false,
      },
    };
  }

  return {
    success: false,
    data: null,
    error: "Unknown error occurred while processing response",
    metadata: {
      responseType: "unknown",
      hasData: false,
      hasPagination: false,
    },
  };
}

// ✅ Enhanced utility for safe data extraction
export function extractDataSafely<T>(
  response: any,
  type: "array" | "object" | "blob" = "object",
  options?: {
    expectedContentType?: string;
    validateBlob?: boolean;
  }
): {
  data: T | T[] | Blob | null;
  pagination?: any;
  success: boolean;
  error: string | null;
  metadata?: any;
} {
  const { expectedContentType, validateBlob = false } = options || {};

  if (type === "blob") {
    const result = safeExtractBlobData(response, expectedContentType);
    if (isSafeBlobSuccess(result)) {
      // Additional blob validation if requested
      if (validateBlob && result.data.size === 0) {
        return {
          data: null,
          success: false,
          error: "Blob has zero size",
        };
      }

      return {
        data: result.data,
        success: true,
        error: null,
        metadata: result.metadata,
      };
    } else if (isSafeBlobFailure(result)) {
      return {
        data: null,
        success: false,
        error: result.error,
      };
    }
  } else if (type === "array") {
    const result = safeExtractArrayData<T>(response);
    if (isSafeArraySuccess(result)) {
      return {
        data: result.data,
        pagination: result.pagination,
        success: true,
        error: null,
      };
    } else if (isSafeArrayFailure(result)) {
      return {
        data: null,
        pagination: null,
        success: false,
        error: result.error,
      };
    }
  } else {
    const result = safeExtractObjectData<T>(response);
    if (isSafeObjectSuccess(result)) {
      return {
        data: result.data,
        success: true,
        error: null,
      };
    } else if (isSafeObjectFailure(result)) {
      return {
        data: null,
        success: false,
        error: result.error,
      };
    }
  }

  return {
    data: null,
    success: false,
    error: "Unknown error occurred",
  };
}
