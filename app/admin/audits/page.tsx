// Enhanced Audits Management Page - Complete Fixed Version with Response Structure Fix
"use client";

import React, { useState, useEffect, useMemo } from "react";

// HeroUI Components
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { Skeleton } from "@heroui/skeleton";
import { Textarea } from "@heroui/input";
import { Progress } from "@heroui/progress";

// Icons
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Building as BuildingIcon,
  User as UserIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Target,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  AlertCircle,
} from "lucide-react";

// API and Types - Using exact API system types
import {
  auditsAPI,
  buildingsAPI,
  authAPI,
  dashboardAPI,
  complianceAPI,
} from "@/lib/api";
import type {
  Audit,
  Building,
  User,
  AuditSummary,
  DashboardOverview,
  ApiResponse,
  ComplianceCheck,
  ApiError,
} from "@/types/api-types";
import { AxiosResponse, AxiosError } from "axios";

// Enhanced interfaces based on actual API responses
interface EnhancedAudit extends Audit {
  urgencyStatus?: "normal" | "urgent" | "critical";
  localStatus?: string;
  uiFlags?: {
    isExpanded: boolean;
    isSelected: boolean;
  };
}

// Define exact audit types from API
type AuditType =
  | "comprehensive"
  | "focused"
  | "compliance"
  | "energy_efficiency"
  | "safety";
type AuditStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "on_hold";

// Form data interface matching API expectations
interface AuditFormData {
  title: string;
  description: string;
  building_id: string;
  audit_type: AuditType;
  auditor_id: string;
  planned_start_date: string;
  planned_end_date: string;
  priority?: "low" | "medium" | "high" | "critical";
  compliance_standards: string[];
  estimated_duration_hours: string;
}

// Safe option interface for dropdowns
interface SelectOption {
  key: string;
  label: string;
  icon?: string;
  color?: string;
}

// Audit types with proper typing
const auditTypes: { key: AuditType; label: string; icon: string }[] = [
  { key: "comprehensive", label: "Comprehensive", icon: "🔍" },
  { key: "focused", label: "Focused", icon: "🎯" },
  { key: "compliance", label: "Compliance", icon: "📋" },
  { key: "energy_efficiency", label: "Energy Efficiency", icon: "⚡" },
  { key: "safety", label: "Safety", icon: "🛡️" },
];

const statusOptions: { key: AuditStatus; label: string; color: string }[] = [
  { key: "planned", label: "Planned", color: "default" },
  { key: "in_progress", label: "In Progress", color: "primary" },
  { key: "completed", label: "Completed", color: "success" },
  { key: "cancelled", label: "Cancelled", color: "danger" },
  { key: "on_hold", label: "On Hold", color: "warning" },
];

const priorityOptions = [
  { key: "low", label: "Low", color: "default" },
  { key: "medium", label: "Medium", color: "warning" },
  { key: "high", label: "High", color: "danger" },
  { key: "critical", label: "Critical", color: "danger" },
];

const complianceStandards = [
  { key: "IEEE519", label: "IEEE 519 - Power Quality" },
  { key: "PEC2017", label: "PEC 2017 - Philippine Electrical Code" },
  { key: "OSHS", label: "OSHS - Occupational Safety & Health Standards" },
  { key: "ISO25010", label: "ISO 25010 - System Quality" },
  { key: "RA11285", label: "RA 11285 - Energy Efficiency & Conservation" },
];

// ✅ Utility functions for error handling and data loading
const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Unknown error occurred";
};

// ✅ FIXED: Response extraction functions for your API's double-nested structure
const extractAuditsFromResponse = (response: any): Audit[] => {
  console.log("🎯 Extracting audits from response...");

  // Your API structure: response.data.data.data
  if (
    response?.data?.success &&
    response?.data?.data &&
    Array.isArray(response.data.data.data)
  ) {
    console.log(
      `✅ Found ${response.data.data.data.length} audits in response.data.data.data`
    );
    return response.data.data.data.filter((item: any) => item && item.id);
  }

  console.warn("⚠️ Could not extract audits from response", {
    hasData: !!response?.data,
    success: response?.data?.success,
    hasNestedData: !!response?.data?.data,
    nestedDataType: typeof response?.data?.data,
    nestedDataKeys: response?.data?.data
      ? Object.keys(response.data.data)
      : "none",
  });

  return [];
};

const extractBuildingsFromResponse = (response: any): Building[] => {
  console.log("🏢 Extracting buildings from response...");

  // Your API structure: response.data.data.data
  if (
    response?.data?.success &&
    response?.data?.data &&
    Array.isArray(response.data.data.data)
  ) {
    console.log(
      `✅ Found ${response.data.data.data.length} buildings in response.data.data.data`
    );
    return response.data.data.data.filter((item: any) => item && item.id);
  }

  console.warn("⚠️ Could not extract buildings from response", response?.data);
  return [];
};

// ✅ FIXED: Updated loadDataWithFallback for your API response structure
const loadDataWithFallback = async <T,>(
  strategies: (() => Promise<AxiosResponse<ApiResponse<T[]>>>)[]
): Promise<T[]> => {
  for (const [index, strategy] of strategies.entries()) {
    try {
      console.log(`🔄 Attempting strategy ${index + 1}/${strategies.length}`);
      const response = await strategy();

      // 🔍 Log response structure for debugging
      console.log(`📋 Strategy ${index + 1} Response Structure:`, {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : "no data",
        success: response.data?.success,
        message: response.data?.message,
        nestedData: response.data?.data
          ? Object.keys(response.data.data)
          : "no nested data",
      });

      let extractedData: T[] = [];

      // ✅ Structure 1: Your API's double-nested structure
      // response.data.data.data (success → data → data → array)
      if (
        response.data?.success &&
        response.data?.data &&
        Array.isArray(response.data.data.data)
      ) {
        console.log(
          `✅ Strategy ${index + 1}: Found double-nested structure (response.data.data.data)`
        );
        extractedData = response.data.data.data;
      }
      // Structure 2: Standard ApiResponse<T[]> format
      else if (response.data?.success && Array.isArray(response.data.data)) {
        console.log(
          `✅ Strategy ${index + 1}: Found standard ApiResponse structure`
        );
        extractedData = response.data.data;
      }
      // Structure 3: Direct array response
      else if (Array.isArray(response.data)) {
        console.log(`✅ Strategy ${index + 1}: Found direct array response`);
        extractedData = response.data;
      }
      // Structure 4: Nested data without success flag
      else if (response.data?.data && Array.isArray(response.data.data)) {
        console.log(`✅ Strategy ${index + 1}: Found nested data structure`);
        extractedData = response.data.data;
      } else {
        console.warn(
          `⚠️ Strategy ${index + 1}: Unrecognized response structure`,
          {
            responseData: response.data,
            dataKeys: response.data ? Object.keys(response.data) : "no data",
            dataType: typeof response.data,
            hasSuccess: response.data?.success,
            hasData: !!response.data?.data,
            dataDataType: typeof response.data?.data,
            dataDataKeys: response.data?.data
              ? Object.keys(response.data.data)
              : "no nested data",
          }
        );
        continue;
      }

      // Validate and filter extracted data
      if (Array.isArray(extractedData)) {
        console.log(
          `✅ Strategy ${index + 1} succeeded with ${extractedData.length} items`
        );

        // Log sample item for verification
        if (extractedData.length > 0) {
          console.log(`📋 Sample item:`, {
            id: extractedData[0]?.id,
            name: extractedData[0]?.name || extractedData[0]?.title,
            type: typeof extractedData[0],
            keys: Object.keys(extractedData[0] || {}),
          });
        }

        // Filter out invalid items
        const validItems = extractedData.filter((item: any) => {
          if (!item || typeof item !== "object" || !item.id) {
            console.warn(`⚠️ Invalid item filtered out:`, item);
            return false;
          }
          return true;
        }) as T[];

        console.log(
          `✅ Returning ${validItems.length} valid items after filtering`
        );
        return validItems;
      } else {
        console.warn(
          `⚠️ Strategy ${index + 1}: extractedData is not an array`,
          {
            extractedData: extractedData,
            type: typeof extractedData,
            isArray: Array.isArray(extractedData),
          }
        );
        continue;
      }
    } catch (error: unknown) {
      const errorMsg = extractErrorMessage(error);
      console.warn(`❌ Strategy ${index + 1} failed: ${errorMsg}`);

      // Log detailed error for debugging
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as AxiosError<ApiError>;
        console.error(`📋 Strategy ${index + 1} Error Details:`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          url: axiosError.config?.url,
          message: axiosError.message,
        });
      }

      if (index === strategies.length - 1) {
        throw error;
      }
      continue;
    }
  }

  console.warn(`❌ All strategies failed, returning empty array`);
  return [];
};

export default function EnhancedAuditsPage() {
  // ✅ State management with proper typing and array initialization
  const [audits, setAudits] = useState<Audit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total_pages: 1,
    total_count: 0,
  });

  // ✅ Filters with proper typing
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<AuditType | "">("");
  const [statusFilter, setStatusFilter] = useState<AuditStatus | "">("");

  // Modal states
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();

  // Selected audit state with proper typing
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [complianceChecks, setComplianceChecks] = useState<any>(null);

  // ✅ Form state with proper typing matching API expectations
  const [formData, setFormData] = useState<AuditFormData>({
    title: "",
    description: "",
    building_id: "",
    audit_type: "comprehensive",
    auditor_id: "",
    planned_start_date: "",
    planned_end_date: "",
    priority: "medium",
    compliance_standards: ["IEEE519", "PEC2017"],
    estimated_duration_hours: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ FIXED: Updated loading functions using correct response extraction
  const loadAudits = async (): Promise<Audit[]> => {
    console.log("🎯 === LOADING AUDITS ===");

    const params: any = {
      page: pagination.current_page,
      limit: pagination.per_page,
      sortOrder: "DESC",
    };

    // Add filters if they exist
    if (searchTerm) params.search = searchTerm;
    if (buildingFilter) params.building_id = Number(buildingFilter);
    if (typeFilter) params.audit_type = typeFilter;
    if (statusFilter) params.status = statusFilter;

    console.log("📋 Audit request params:", params);

    const strategies = [
      async () => {
        console.log("🔄 Audit Strategy 1: sortBy scheduled_date");
        const response = await auditsAPI.getAll({
          ...params,
          sortBy: "scheduled_date" as any,
        });
        return extractAuditsFromResponse(response);
      },
      async () => {
        console.log("🔄 Audit Strategy 2: sortBy created_at");
        const response = await auditsAPI.getAll({
          ...params,
          sortBy: "created_at" as any,
        });
        return extractAuditsFromResponse(response);
      },
      async () => {
        console.log("🔄 Audit Strategy 3: no sortBy");
        const response = await auditsAPI.getAll({ ...params });
        return extractAuditsFromResponse(response);
      },
    ];

    for (const [index, strategy] of strategies.entries()) {
      try {
        console.log(`🔄 Trying audit strategy ${index + 1}`);
        const auditData = await strategy();

        if (auditData.length >= 0) {
          // Allow 0 items as valid response
          console.log(
            `✅ AUDITS LOADED: ${auditData.length} items via strategy ${index + 1}`
          );
          if (auditData.length > 0) {
            console.log("📋 First audit:", {
              id: auditData[0].id,
              title: auditData[0].title,
              status: auditData[0].status,
              building_name: auditData[0].building_name,
            });
          }
          return auditData;
        }
      } catch (error) {
        console.warn(
          `❌ Audit strategy ${index + 1} failed:`,
          extractErrorMessage(error)
        );
        if (index === strategies.length - 1) {
          console.error("❌ All audit strategies failed");
          return [];
        }
      }
    }

    return [];
  };

  const loadBuildings = async (): Promise<Building[]> => {
    console.log("🎯 === LOADING BUILDINGS ===");

    const strategies = [
      async () => {
        console.log("🔄 Building Strategy 1: status active");
        const response = await buildingsAPI.getAll({ status: "active" });
        return extractBuildingsFromResponse(response);
      },
      async () => {
        console.log("🔄 Building Strategy 2: no filter");
        const response = await buildingsAPI.getAll({});
        return extractBuildingsFromResponse(response);
      },
    ];

    for (const [index, strategy] of strategies.entries()) {
      try {
        console.log(`🔄 Trying building strategy ${index + 1}`);
        const buildingData = await strategy();

        if (buildingData.length >= 0) {
          // Allow 0 items as valid response
          console.log(
            `✅ BUILDINGS LOADED: ${buildingData.length} items via strategy ${index + 1}`
          );
          if (buildingData.length > 0) {
            console.log(
              "🏢 Building names:",
              buildingData.map((b) => b.name)
            );
          }
          return buildingData;
        }
      } catch (error) {
        console.warn(
          `❌ Building strategy ${index + 1} failed:`,
          extractErrorMessage(error)
        );
        if (index === strategies.length - 1) {
          console.error("❌ All building strategies failed");
          return [];
        }
      }
    }

    return [];
  };

  const loadUsers = async (): Promise<User[]> => {
    try {
      console.log("👥 Loading users/auditors...");

      // Try to get users from auth API - handle 404 gracefully
      try {
        const response = await authAPI.getUsers();
        if (response.data?.success && Array.isArray(response.data.data)) {
          const auditors = response.data.data.filter(
            (u) =>
              u.role === "auditor" ||
              u.role === "energy_manager" ||
              u.role === "admin"
          );
          console.log(`👥 Loaded ${auditors.length} auditors from users API`);
          return auditors;
        }
      } catch (userError: any) {
        console.warn(
          "⚠️ Users API not available:",
          userError.response?.status || userError.message
        );

        // Fallback: Try to get user info from profile API
        try {
          const profileResponse = await authAPI.getProfile();
          if (
            profileResponse.data?.success &&
            profileResponse.data.data?.user
          ) {
            const currentUser = profileResponse.data.data.user;
            console.log(`👥 Fallback: Using current user as auditor option`);
            return [currentUser];
          }
        } catch (profileError) {
          console.warn("⚠️ Profile API also failed:", profileError);
        }
      }

      console.warn(
        "⚠️ No user/auditor data available - users will need to be selected manually"
      );
      return [];
    } catch (error) {
      console.error("❌ Failed to load users:", error);
      return [];
    }
  };

  const loadAuditSummary = async (): Promise<AuditSummary | null> => {
    try {
      console.log("📊 Loading audit summary...");
      const response = await auditsAPI.getSummary();
      if (response.data?.success) {
        console.log("✅ Audit summary loaded successfully");
        return response.data.data as AuditSummary;
      } else {
        console.warn("⚠️ Audit summary API returned success: false");
        return null;
      }
    } catch (error: any) {
      console.warn(
        "⚠️ Failed to load audit summary:",
        error.response?.status || error.message
      );
      return null;
    }
  };

  // ✅ FIXED: Updated loadAllData function with correct response handling
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🚀 === STARTING DATA LOAD (FIXED VERSION) ===");

      // Load all data in parallel
      const [auditsRes, buildingsRes, usersRes, summaryRes] =
        await Promise.allSettled([
          loadAudits(),
          loadBuildings(),
          loadUsers(),
          loadAuditSummary(),
        ]);

      console.log("📋 Results Summary:");
      console.log(
        "- Audits:",
        auditsRes.status,
        auditsRes.status === "fulfilled"
          ? `${auditsRes.value.length} items`
          : auditsRes.reason
      );
      console.log(
        "- Buildings:",
        buildingsRes.status,
        buildingsRes.status === "fulfilled"
          ? `${buildingsRes.value.length} items`
          : buildingsRes.reason
      );
      console.log(
        "- Users:",
        usersRes.status,
        usersRes.status === "fulfilled"
          ? `${usersRes.value.length} items`
          : usersRes.reason
      );
      console.log("- Summary:", summaryRes.status);

      // Set state with extracted data
      if (auditsRes.status === "fulfilled") {
        const auditData = auditsRes.value;
        console.log(`🎯 Setting audits state: ${auditData.length} items`);
        setAudits(auditData);
      } else {
        console.error("❌ Failed to load audits:", auditsRes.reason);
        setAudits([]);
      }

      if (buildingsRes.status === "fulfilled") {
        const buildingData = buildingsRes.value;
        console.log(`🏢 Setting buildings state: ${buildingData.length} items`);
        setBuildings(buildingData);
      } else {
        console.error("❌ Failed to load buildings:", buildingsRes.reason);
        setBuildings([]);
      }

      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value);
        console.log(`👥 Set users state: ${usersRes.value.length} items`);
      } else {
        setUsers([]);
      }

      if (summaryRes.status === "fulfilled") {
        setAuditSummary(summaryRes.value);
      } else {
        setAuditSummary(null);
      }

      console.log("✅ === DATA LOADING COMPLETED ===");
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      console.error("❌ CRITICAL: Data loading failed:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load compliance checks for selected audit
  const loadComplianceChecks = async (auditId: number) => {
    try {
      const response = await complianceAPI.getAuditChecks(auditId);
      if (response.data.success) {
        setComplianceChecks(response.data.data);
      }
    } catch (error) {
      console.warn("Failed to load compliance checks:", error);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadAllData();
  }, []);

  // Reload audits when filters change
  useEffect(() => {
    if (!loading) {
      loadAudits().then(setAudits).catch(console.error);
    }
  }, [
    pagination.current_page,
    searchTerm,
    buildingFilter,
    typeFilter,
    statusFilter,
  ]);

  // ✅ Safe options generation with defensive programming and useMemo
  const buildingOptions = useMemo((): SelectOption[] => {
    if (!Array.isArray(buildings)) {
      console.warn(
        "⚠️ Buildings is not an array:",
        typeof buildings,
        buildings
      );
      return [{ key: "", label: "No buildings available" }];
    }

    const options: SelectOption[] = [
      { key: "", label: "All Buildings" },
      ...buildings.map((building) => ({
        key: building.id.toString(),
        label: building.name || "Unnamed Building",
      })),
    ];

    console.log(`🏢 Generated ${options.length - 1} building options`);
    return options;
  }, [buildings]);

  const userOptions = useMemo((): SelectOption[] => {
    if (!Array.isArray(users)) {
      console.warn("⚠️ Users is not an array:", typeof users, users);
      return [{ key: "", label: "No users data available" }];
    }

    if (users.length === 0) {
      return [
        { key: "", label: "No auditors available (check user management)" },
      ];
    }

    const options: SelectOption[] = users.map((user) => ({
      key: user.id.toString(),
      label: `${user.first_name} ${user.last_name} (${user.role})`,
    }));

    console.log(`👥 Generated ${options.length} user options`);
    return options;
  }, [users]);

  // ✅ Fixed dropdown options with unified arrays (solves HeroUI TypeScript errors)
  const typeFilterOptions = useMemo((): SelectOption[] => {
    const options: SelectOption[] = [
      { key: "", label: "All Types" },
      ...auditTypes.map((type) => ({
        key: type.key,
        label: `${type.icon} ${type.label}`,
      })),
    ];
    console.log(`🎯 Generated ${options.length} type filter options`);
    return options;
  }, []);

  const statusFilterOptions = useMemo((): SelectOption[] => {
    const options: SelectOption[] = [
      { key: "", label: "All Statuses" },
      ...statusOptions.map((option) => ({
        key: option.key,
        label: option.label,
      })),
    ];
    console.log(`📊 Generated ${options.length} status filter options`);
    return options;
  }, []);

  // ✅ Form validation with better error handling for missing users
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Audit title is required";
    if (!formData.building_id) errors.building_id = "Building is required";

    // Only require auditor if users are available
    if (!formData.auditor_id && users.length > 0) {
      errors.auditor_id = "Auditor is required";
    }

    if (!formData.planned_start_date)
      errors.planned_start_date = "Start date is required";
    if (!formData.planned_end_date)
      errors.planned_end_date = "End date is required";

    if (formData.planned_start_date && formData.planned_end_date) {
      if (
        new Date(formData.planned_start_date) >=
        new Date(formData.planned_end_date)
      ) {
        errors.planned_end_date = "End date must be after start date";
      }
    }

    if (formData.compliance_standards.length === 0) {
      errors.compliance_standards =
        "At least one compliance standard is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      building_id: "",
      audit_type: "comprehensive",
      auditor_id: "",
      planned_start_date: "",
      planned_end_date: "",
      priority: "medium",
      compliance_standards: ["IEEE519", "PEC2017"],
      estimated_duration_hours: "",
    });
    setFormErrors({});
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const auditData: Partial<Audit> = {
        title: formData.title,
        description: formData.description,
        audit_type: formData.audit_type,
        building_id: Number(formData.building_id),
        planned_start_date: formData.planned_start_date,
        planned_end_date: formData.planned_end_date,
        estimated_duration_hours: formData.estimated_duration_hours
          ? Number(formData.estimated_duration_hours)
          : undefined,
      };

      if (formData.auditor_id) {
        auditData.auditor_id = Number(formData.auditor_id);
      }

      const response = await auditsAPI.create(auditData);

      if (response.data?.success) {
        console.log("✅ Audit created successfully");
        await loadAllData();
        onCreateClose();
        resetForm();
      }
    } catch (error: unknown) {
      console.error("❌ Failed to create audit:", error);
      const errorMessage = extractErrorMessage(error);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAudit || !validateForm()) return;

    try {
      setSubmitting(true);

      const auditData: Partial<Audit> = {
        title: formData.title,
        description: formData.description,
        audit_type: formData.audit_type,
        building_id: Number(formData.building_id),
        planned_start_date: formData.planned_start_date,
        planned_end_date: formData.planned_end_date,
        estimated_duration_hours: formData.estimated_duration_hours
          ? Number(formData.estimated_duration_hours)
          : undefined,
      };

      if (formData.auditor_id) {
        auditData.auditor_id = Number(formData.auditor_id);
      }

      const response = await auditsAPI.update(selectedAudit.id, auditData);

      if (response.data.success) {
        console.log("✅ Audit updated successfully");
        await loadAllData();
        onEditClose();
        resetForm();
        setSelectedAudit(null);
      }
    } catch (error: unknown) {
      console.error("❌ Failed to update audit:", error);
      const errorMessage = extractErrorMessage(error);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (audit: Audit) => {
    setSelectedAudit(audit);
    setFormData({
      title: audit.title,
      description: audit.description || "",
      building_id: audit.building_id.toString(),
      audit_type: audit.audit_type,
      auditor_id: audit.auditor_id.toString(),
      planned_start_date: audit.planned_start_date
        ? audit.planned_start_date.split("T")[0]
        : "",
      planned_end_date: audit.planned_end_date
        ? audit.planned_end_date.split("T")[0]
        : "",
      priority: "medium",
      compliance_standards: audit.compliance_standards
        ? audit.compliance_standards.map((s) => s.standard)
        : ["IEEE519", "PEC2017"],
      estimated_duration_hours:
        audit.estimated_duration_hours?.toString() || "",
    });
    onEditOpen();
  };

  const openViewModal = async (audit: Audit) => {
    setSelectedAudit(audit);
    setComplianceChecks(null);
    onViewOpen();

    if (audit.status === "completed" || audit.status === "in_progress") {
      await loadComplianceChecks(audit.id);
    }
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((s) => s.key === status);
    return statusOption?.color || "default";
  };

  const getComplianceColor = (score?: number) => {
    if (!score) return "default";
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "danger";
  };

  const getDaysRemaining = (audit: Audit) => {
    if (audit.status === "completed" || audit.status === "cancelled")
      return null;

    const targetDate =
      audit.status === "planned"
        ? new Date(audit.planned_start_date || "")
        : audit.actual_start_date
          ? new Date(audit.actual_start_date)
          : new Date(audit.planned_start_date || "");

    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // ✅ Statistics calculation with defensive programming
  const auditStats = useMemo(() => {
    if (!Array.isArray(audits))
      return {
        total: 0,
        planned: 0,
        in_progress: 0,
        completed: 0,
        avgScore: 0,
      };

    const stats = {
      total: audits.length,
      planned: audits.filter((a) => a.status === "planned").length,
      in_progress: audits.filter((a) => a.status === "in_progress").length,
      completed: audits.filter((a) => a.status === "completed").length,
      avgScore:
        audits.filter((a) => a.compliance_score).length > 0
          ? audits
              .filter((a) => a.compliance_score)
              .reduce((sum, a) => sum + (a.compliance_score || 0), 0) /
            audits.filter((a) => a.compliance_score).length
          : 0,
    };
    return stats;
  }, [audits]);

  // ✅ Selection handlers with proper type safety for HeroUI SharedSelection
  const handleBuildingFilterChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") {
      setBuildingFilter("");
      return;
    }
    const selectedKey = Array.from(keys)[0] as string;
    setBuildingFilter(selectedKey || "");
  };

  const handleTypeFilterChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") {
      setTypeFilter("");
      return;
    }
    const selectedKey = Array.from(keys)[0] as string;
    setTypeFilter((selectedKey || "") as AuditType | "");
  };

  const handleStatusFilterChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") {
      setStatusFilter("");
      return;
    }
    const selectedKey = Array.from(keys)[0] as string;
    setStatusFilter((selectedKey || "") as AuditStatus | "");
  };

  // Form selection handlers with proper HeroUI types
  const handleFormBuildingChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") {
      setFormData((prev) => ({ ...prev, building_id: "" }));
      return;
    }
    const selectedKey = Array.from(keys)[0] as string;
    setFormData((prev) => ({ ...prev, building_id: selectedKey || "" }));
  };

  const handleFormAuditTypeChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") {
      setFormData((prev) => ({ ...prev, audit_type: "comprehensive" }));
      return;
    }
    const selectedKey = Array.from(keys)[0] as string;
    setFormData((prev) => ({
      ...prev,
      audit_type: (selectedKey || "comprehensive") as AuditType,
    }));
  };

  const handleFormAuditorChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") {
      setFormData((prev) => ({ ...prev, auditor_id: "" }));
      return;
    }
    const selectedKey = Array.from(keys)[0] as string;
    setFormData((prev) => ({ ...prev, auditor_id: selectedKey || "" }));
  };

  // ✅ Test function for debugging (can be removed in production)
  const testDataExtraction = async () => {
    try {
      const auditResponse = await auditsAPI.getAll({ limit: 5 });
      const buildingResponse = await buildingsAPI.getAll({ limit: 5 });

      console.log("🧪 Test Results:");
      console.log("Audit structure:", {
        path1: auditResponse.data?.data,
        path2: auditResponse.data?.data?.data,
        actualArray: Array.isArray(auditResponse.data?.data?.data)
          ? auditResponse.data.data.data.length
          : "not found",
      });

      console.log("Building structure:", {
        path1: buildingResponse.data?.data,
        path2: buildingResponse.data?.data?.data,
        actualArray: Array.isArray(buildingResponse.data?.data?.data)
          ? buildingResponse.data.data.data.length
          : "not found",
      });
    } catch (error) {
      console.error("Test failed:", error);
    }
  };

  // ✅ Loading state with proper skeleton
  if (loading && audits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <Skeleton className="h-20 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>

        <Card>
          <CardBody className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </CardBody>
        </Card>
      </div>
    );
  }

  // ✅ Error state with retry functionality
  if (error && audits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" />
            Audits Management
          </h1>
          <Button
            color="primary"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={loadAllData}
          >
            Retry
          </Button>
        </div>

        <Card>
          <CardBody className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Failed to Load Audits
            </h3>
            <p className="text-default-500 mb-4">{error}</p>
            <Button color="primary" onPress={loadAllData}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" />
            Audits Management
          </h1>
          <p className="text-default-500 mt-1">
            Plan, conduct, and track energy efficiency and compliance audits
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="light"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={loadAllData}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => {
              resetForm();
              onCreateOpen();
            }}
            isDisabled={buildings.length === 0}
          >
            Schedule Audit
          </Button>
        </div>
      </div>

      {/* ✅ Warning for missing data */}
      {!loading && (buildings.length === 0 || users.length === 0) && (
        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center gap-3 text-warning-800">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <div className="font-medium">System Setup Required</div>
                <div className="text-sm text-warning-700 mt-1">
                  {buildings.length === 0 &&
                    users.length === 0 &&
                    "No buildings or users available. Please add buildings and configure user management."}
                  {buildings.length === 0 &&
                    users.length > 0 &&
                    "No buildings available. Please add buildings to the system first."}
                  {buildings.length > 0 &&
                    users.length === 0 &&
                    "No auditors available. Audits can be created but will need manual auditor assignment."}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-foreground">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Audits</p>
                <p className="text-2xl font-bold">{auditStats.total}</p>
              </div>
              <Shield className="w-8 h-8 text-default-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">In Progress</p>
                <p className="text-2xl font-bold text-primary">
                  {auditStats.in_progress}
                </p>
                <p className="text-xs text-default-400">
                  {auditStats.planned} planned
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Completed</p>
                <p className="text-2xl font-bold text-success">
                  {auditStats.completed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Avg. Score</p>
                <p className="text-2xl font-bold">
                  {auditStats.avgScore.toFixed(1)}%
                </p>
                <Progress
                  value={auditStats.avgScore}
                  color={getComplianceColor(auditStats.avgScore) as any}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <Target className="w-8 h-8 text-secondary" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ✅ Fixed Filters Section */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              placeholder="Search audits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              className="md:col-span-2"
            />

            <Select
              placeholder="Building"
              selectedKeys={
                buildingFilter ? new Set([buildingFilter]) : new Set()
              }
              onSelectionChange={handleBuildingFilterChange}
              isDisabled={buildingOptions.length <= 1}
            >
              {buildingOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Type"
              selectedKeys={typeFilter ? new Set([typeFilter]) : new Set()}
              onSelectionChange={handleTypeFilterChange}
            >
              {typeFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Status"
              selectedKeys={statusFilter ? new Set([statusFilter]) : new Set()}
              onSelectionChange={handleStatusFilterChange}
            >
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Button
              variant="light"
              startContent={<Filter className="w-4 h-4" />}
              onPress={() => {
                setSearchTerm("");
                setBuildingFilter("");
                setTypeFilter("");
                setStatusFilter("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ✅ Safe Audits Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Audits table">
            <TableHeader>
              <TableColumn>Audit</TableColumn>
              <TableColumn>Building</TableColumn>
              <TableColumn>Type & Priority</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Schedule</TableColumn>
              <TableColumn>Performance</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No audits found">
              {Array.isArray(audits) && audits.length > 0
                ? audits.map((audit) => {
                    const typeInfo = auditTypes.find(
                      (t) => t.key === audit.audit_type
                    );
                    const daysRemaining = getDaysRemaining(audit);

                    return (
                      <TableRow key={audit.id}>
                        <TableCell>
                          <div>
                            <div className="font-semibold text-foreground">
                              {audit.title}
                            </div>
                            <div className="text-sm text-default-500">
                              ID: {audit.id}
                            </div>
                            <div className="flex items-center text-xs text-default-400 mt-1">
                              <UserIcon className="w-3 h-3 mr-1" />
                              {audit.auditor_name || "Unknown Auditor"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center">
                            <BuildingIcon className="w-4 h-4 mr-2 text-default-400" />
                            <div>
                              <span className="text-sm font-medium">
                                {audit.building_name || "Unknown Building"}
                              </span>
                              <div className="text-xs text-default-500">
                                Building ID: {audit.building_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <Chip size="sm" variant="flat">
                              {typeInfo?.icon}{" "}
                              {typeInfo?.label || audit.audit_type}
                            </Chip>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <Chip
                              color={getStatusColor(audit.status) as any}
                              size="sm"
                              variant="flat"
                            >
                              {audit.status.replace("_", " ")}
                            </Chip>
                            {daysRemaining !== null && (
                              <div className="text-xs text-default-500">
                                {daysRemaining > 0
                                  ? `${daysRemaining} days`
                                  : daysRemaining === 0
                                    ? "Today"
                                    : `${Math.abs(daysRemaining)} days overdue`}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-xs">
                              <Calendar className="w-3 h-3 mr-1 text-primary" />
                              <span>
                                {audit.planned_start_date
                                  ? new Date(
                                      audit.planned_start_date
                                    ).toLocaleDateString()
                                  : "Not scheduled"}
                              </span>
                            </div>
                            {audit.actual_start_date && (
                              <div className="text-xs text-success">
                                Started:{" "}
                                {new Date(
                                  audit.actual_start_date
                                ).toLocaleDateString()}
                              </div>
                            )}
                            {audit.actual_end_date && (
                              <div className="text-xs text-success">
                                Completed:{" "}
                                {new Date(
                                  audit.actual_end_date
                                ).toLocaleDateString()}
                              </div>
                            )}
                            <div className="text-xs text-default-500">
                              {audit.progress_percentage || 0}% complete
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            {audit.compliance_score !== undefined && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-default-600">
                                    Compliance
                                  </span>
                                  <span className="text-xs font-medium">
                                    {audit.compliance_score.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress
                                  value={audit.compliance_score}
                                  color={
                                    getComplianceColor(
                                      audit.compliance_score
                                    ) as any
                                  }
                                  size="sm"
                                />
                              </div>
                            )}

                            <div className="text-xs text-default-500">
                              Status: {audit.status}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openViewModal(audit)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openEditModal(audit)}
                              isDisabled={audit.status === "completed"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                : []}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination
                total={pagination.total_pages}
                page={pagination.current_page}
                onChange={(page) =>
                  setPagination((prev) => ({ ...prev, current_page: page }))
                }
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ✅ Fixed Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onOpenChange={isCreateOpen ? onCreateClose : onEditClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {isCreateOpen ? "Schedule New Audit" : "Edit Audit"}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Audit Title"
                  placeholder="Enter audit title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  errorMessage={formErrors.title}
                  isInvalid={!!formErrors.title}
                />

                <Textarea
                  label="Description"
                  placeholder="Enter audit description and objectives"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  minRows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Building"
                    placeholder="Select building"
                    selectedKeys={
                      formData.building_id
                        ? new Set([formData.building_id])
                        : new Set()
                    }
                    onSelectionChange={handleFormBuildingChange}
                    errorMessage={formErrors.building_id}
                    isInvalid={!!formErrors.building_id}
                    isDisabled={buildingOptions.length <= 1}
                  >
                    {buildingOptions
                      .filter((option) => option.key !== "")
                      .map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                  </Select>

                  <Select
                    label="Audit Type"
                    selectedKeys={new Set([formData.audit_type])}
                    onSelectionChange={handleFormAuditTypeChange}
                  >
                    {auditTypes.map((type) => (
                      <SelectItem key={type.key}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Auditor"
                    placeholder={
                      users.length === 0
                        ? "No auditors available"
                        : "Select auditor"
                    }
                    selectedKeys={
                      formData.auditor_id
                        ? new Set([formData.auditor_id])
                        : new Set()
                    }
                    onSelectionChange={handleFormAuditorChange}
                    errorMessage={formErrors.auditor_id}
                    isInvalid={!!formErrors.auditor_id}
                    isDisabled={userOptions.length === 0}
                    description={
                      users.length === 0
                        ? "Audit will be created without assigned auditor"
                        : undefined
                    }
                  >
                    {userOptions.length > 0 ? (
                      userOptions
                        .filter((option) => option.key !== "")
                        .map((option) => (
                          <SelectItem key={option.key}>
                            {option.label}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem key="no-users" isDisabled>
                        No auditors available
                      </SelectItem>
                    )}
                  </Select>

                  <Input
                    label="Estimated Duration (hours)"
                    type="number"
                    placeholder="e.g., 4"
                    value={formData.estimated_duration_hours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimated_duration_hours: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Planned Start Date"
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        planned_start_date: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.planned_start_date}
                    isInvalid={!!formErrors.planned_start_date}
                  />

                  <Input
                    label="Planned End Date"
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        planned_end_date: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.planned_end_date}
                    isInvalid={!!formErrors.planned_end_date}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Compliance Standards
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {complianceStandards.map((standard) => (
                      <Chip
                        key={standard.key}
                        variant={
                          formData.compliance_standards.includes(standard.key)
                            ? "solid"
                            : "bordered"
                        }
                        color="primary"
                        className="cursor-pointer justify-start"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            compliance_standards:
                              prev.compliance_standards.includes(standard.key)
                                ? prev.compliance_standards.filter(
                                    (s) => s !== standard.key
                                  )
                                : [...prev.compliance_standards, standard.key],
                          }));
                        }}
                      >
                        {standard.label}
                      </Chip>
                    ))}
                  </div>
                  {formErrors.compliance_standards && (
                    <p className="text-danger text-xs mt-1">
                      {formErrors.compliance_standards}
                    </p>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={isCreateOpen ? handleCreate : handleEdit}
                  isLoading={submitting}
                >
                  {isCreateOpen ? "Schedule Audit" : "Update Audit"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Audit Modal */}
      <Modal
        isOpen={isViewOpen}
        onOpenChange={onViewClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <span>{selectedAudit?.title}</span>
                  <Chip
                    color={getStatusColor(selectedAudit?.status || "") as any}
                    size="sm"
                  >
                    {selectedAudit?.status.replace("_", " ")}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedAudit && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Audit Information</h4>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div>
                            <strong>ID:</strong> {selectedAudit.id}
                          </div>
                          <div>
                            <strong>Type:</strong>{" "}
                            {
                              auditTypes.find(
                                (t) => t.key === selectedAudit.audit_type
                              )?.label
                            }
                          </div>
                          <div>
                            <strong>Building:</strong>{" "}
                            {selectedAudit.building_name || "Unknown"}
                          </div>
                          <div>
                            <strong>Building ID:</strong>{" "}
                            {selectedAudit.building_id}
                          </div>
                          <div>
                            <strong>Auditor:</strong>{" "}
                            {selectedAudit.auditor_name || "Unknown"}
                          </div>
                          <div>
                            <strong>Auditor ID:</strong>{" "}
                            {selectedAudit.auditor_id}
                          </div>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Schedule & Progress</h4>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div>
                            <strong>Planned Start:</strong>{" "}
                            {selectedAudit.planned_start_date
                              ? new Date(
                                  selectedAudit.planned_start_date
                                ).toLocaleDateString()
                              : "Not set"}
                          </div>
                          <div>
                            <strong>Planned End:</strong>{" "}
                            {selectedAudit.planned_end_date
                              ? new Date(
                                  selectedAudit.planned_end_date
                                ).toLocaleDateString()
                              : "Not set"}
                          </div>
                          {selectedAudit.actual_start_date && (
                            <div>
                              <strong>Actual Start:</strong>{" "}
                              {new Date(
                                selectedAudit.actual_start_date
                              ).toLocaleDateString()}
                            </div>
                          )}
                          {selectedAudit.actual_end_date && (
                            <div>
                              <strong>Actual End:</strong>{" "}
                              {new Date(
                                selectedAudit.actual_end_date
                              ).toLocaleDateString()}
                            </div>
                          )}
                          <div>
                            <strong>Progress:</strong>
                            <Progress
                              value={selectedAudit.progress_percentage || 0}
                              className="mt-1"
                              color="primary"
                            />
                            <span className="text-sm text-default-500">
                              {selectedAudit.progress_percentage || 0}% complete
                            </span>
                          </div>
                          {selectedAudit.created_at && (
                            <div>
                              <strong>Created:</strong>{" "}
                              {new Date(
                                selectedAudit.created_at
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </div>

                    {/* Description */}
                    {selectedAudit.description && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Description</h4>
                        </CardHeader>
                        <CardBody>
                          <p>{selectedAudit.description}</p>
                        </CardBody>
                      </Card>
                    )}

                    {/* Compliance Results */}
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Compliance Overview</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {selectedAudit.findings?.total_findings || 0}
                            </div>
                            <div className="text-sm text-default-500">
                              Total Checks
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-success">
                              {selectedAudit.findings?.total_findings
                                ? selectedAudit.findings.total_findings -
                                  (selectedAudit.findings.critical_findings ||
                                    0) -
                                  (selectedAudit.findings.major_findings || 0) -
                                  (selectedAudit.findings.minor_findings || 0)
                                : 0}
                            </div>
                            <div className="text-sm text-default-500">
                              Compliant
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-danger">
                              {(selectedAudit.findings?.critical_findings ||
                                0) +
                                (selectedAudit.findings?.major_findings || 0) +
                                (selectedAudit.findings?.minor_findings || 0)}
                            </div>
                            <div className="text-sm text-default-500">
                              Non-Compliant
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-warning">
                              {selectedAudit.findings?.critical_findings || 0}
                            </div>
                            <div className="text-sm text-default-500">
                              Critical Issues
                            </div>
                          </div>
                        </div>

                        {selectedAudit.compliance_score !== undefined && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">
                                Overall Compliance Score
                              </span>
                              <span className="text-xl font-bold">
                                {selectedAudit.compliance_score.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={selectedAudit.compliance_score}
                              color={
                                getComplianceColor(
                                  selectedAudit.compliance_score
                                ) as any
                              }
                              size="lg"
                            />
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    {/* Compliance Checks Details */}
                    {complianceChecks && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">
                            Detailed Compliance Checks
                          </h4>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-3">
                            {complianceChecks.checks &&
                              complianceChecks.checks
                                .slice(0, 5)
                                .map((check: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 border border-content2 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {check.checkDescription}
                                      </div>
                                      <div className="text-sm text-default-500">
                                        {check.standardType} - Section{" "}
                                        {check.sectionCode}
                                      </div>
                                      {check.details && (
                                        <div className="text-sm text-default-600 mt-1">
                                          {check.details}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <Chip
                                        color={
                                          check.status === "compliant"
                                            ? "success"
                                            : "danger"
                                        }
                                        size="sm"
                                      >
                                        {check.status}
                                      </Chip>
                                      {check.severity && (
                                        <div className="text-xs text-default-500 mt-1">
                                          {check.severity} severity
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            {complianceChecks.checks &&
                              complianceChecks.checks.length > 5 && (
                                <div className="text-center text-sm text-default-500">
                                  ... and {complianceChecks.checks.length - 5}{" "}
                                  more checks
                                </div>
                              )}
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  startContent={<Download className="w-4 h-4" />}
                  color="primary"
                >
                  Export Report
                </Button>
                <Button onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ✅ Enhanced Debug Panel (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-gray-50 border-dashed">
          <CardHeader className="flex flex-row items-center justify-between">
            <h4 className="text-sm font-medium text-gray-600">🐛 Debug Info</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="flat" onPress={testDataExtraction}>
                Test API
              </Button>
              <Button size="sm" variant="flat" onPress={loadAllData}>
                Reload Data
              </Button>
            </div>
          </CardHeader>
          <CardBody className="text-xs space-y-2">
            <div>
              <strong>Loading:</strong> {loading.toString()}
            </div>
            <div>
              <strong>Error:</strong> {error || "None"}
            </div>
            <div>
              <strong>Audits loaded:</strong> {audits.length} items
            </div>
            <div>
              <strong>Buildings loaded:</strong> {buildings.length} items
            </div>
            <div>
              <strong>Users loaded:</strong> {users.length} items
            </div>
            <div>
              <strong>Building options:</strong> {buildingOptions.length}{" "}
              generated
            </div>
            <div>
              <strong>User options:</strong> {userOptions.length} generated
            </div>
            <div>
              <strong>Type filter options:</strong> {typeFilterOptions.length}{" "}
              generated
            </div>
            <div>
              <strong>Status filter options:</strong>{" "}
              {statusFilterOptions.length} generated
            </div>
            {buildings.length > 0 && (
              <div>
                <strong>Building names:</strong>{" "}
                {buildings
                  .slice(0, 3)
                  .map((b) => b.name)
                  .join(", ")}
              </div>
            )}
            {users.length > 0 && (
              <div>
                <strong>User names:</strong>{" "}
                {users
                  .slice(0, 3)
                  .map((u) => `${u.first_name} ${u.last_name}`)
                  .join(", ")}
              </div>
            )}
            <div className="pt-2 border-t">
              <strong>API Response Structure:</strong>
              <div className="ml-2 space-y-1">
                <div>• Expected: response.data.data.data (double-nested)</div>
                <div>
                  • Audits: {audits.length > 0 ? "✅ Found" : "❌ Empty"}
                </div>
                <div>
                  • Buildings: {buildings.length > 0 ? "✅ Found" : "❌ Empty"}
                </div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <strong>API Endpoints Status:</strong>
              <div className="ml-2 space-y-1">
                <div>
                  • /api/audits - ✅ Working (returns {audits.length} items)
                </div>
                <div>
                  • /api/buildings - ✅ Working (returns {buildings.length}{" "}
                  items)
                </div>
                <div>• /api/auth/users - ❌ Not Found (404)</div>
                <div>• /api/auth/profile - 🔄 Used as fallback</div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <strong>Check console for detailed API logs</strong>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
