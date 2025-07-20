"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

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
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { Divider } from "@heroui/divider";

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
  Activity,
  AlertCircle,
  Play,
  CheckSquare,
  XCircle,
  Settings,
  Award,
  Timer,
  Zap,
  MapPin,
  BookOpen,
  CheckCheck,
  Clock4,
  AlertOctagon,
  Workflow,
  BarChart,
  TrendingDown,
  Star,
  CheckCircle2,
  XOctagon,
  Loader,
  History,
  FileCheck,
  Gauge,
  ClipboardList,
  Lightbulb,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  X,
  Save,
  Bell,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Copy,
  Share,
  Check,
  Wifi,
  WifiOff,
} from "lucide-react";

// API imports
import { auditsAPI, buildingsAPI, complianceAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useApi";
import {
  safeExtractArrayData,
  safeExtractObjectData,
  safeExtractPaginationData,
  handleApiResponse,
  handleArrayApiResponse,
} from "@/lib/api-response-handler";

// Types
import type {
  Audit,
  Building,
  User,
  AuditQueryParams,
  ComplianceCheck,
  ApiResponse,
} from "@/types/api-types";

// Audit Configuration
const AUDIT_TYPES = [
  {
    value: "comprehensive",
    label: "Comprehensive Audit",
    description: "Full facility assessment covering all systems",
    icon: <BookOpen className="w-4 h-4" />,
    color: "primary" as const,
    estimatedDays: "7-14",
  },
  {
    value: "focused",
    label: "Focused Audit",
    description: "Targeted assessment of specific systems",
    icon: <Target className="w-4 h-4" />,
    color: "secondary" as const,
    estimatedDays: "3-5",
  },
  {
    value: "compliance",
    label: "Compliance Audit",
    description: "Regulatory compliance verification",
    icon: <CheckCheck className="w-4 h-4" />,
    color: "success" as const,
    estimatedDays: "5-7",
  },
  {
    value: "energy_efficiency",
    label: "Energy Efficiency",
    description: "Energy performance optimization",
    icon: <Zap className="w-4 h-4" />,
    color: "warning" as const,
    estimatedDays: "4-8",
  },
  {
    value: "safety",
    label: "Safety Audit",
    description: "Safety standards verification",
    icon: <Shield className="w-4 h-4" />,
    color: "danger" as const,
    estimatedDays: "2-4",
  },
];

const AUDIT_STATUSES = [
  {
    value: "planned",
    label: "Planned",
    icon: <Calendar className="w-4 h-4" />,
    color: "default" as const,
  },
  {
    value: "in_progress",
    label: "In Progress",
    icon: <Activity className="w-4 h-4" />,
    color: "primary" as const,
  },
  {
    value: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "success" as const,
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: <XOctagon className="w-4 h-4" />,
    color: "danger" as const,
  },
  {
    value: "on_hold",
    label: "On Hold",
    icon: <Clock4 className="w-4 h-4" />,
    color: "warning" as const,
  },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "default" as const },
  { value: "medium", label: "Medium", color: "warning" as const },
  { value: "high", label: "High", color: "danger" as const },
  { value: "critical", label: "Critical", color: "danger" as const },
];

// Form interfaces
interface AuditFormData {
  title: string;
  description: string;
  buildingId: number | null;
  auditType:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  plannedStartDate: string;
  plannedEndDate: string;
  estimatedDurationHours: number;
}

// Safe data extraction helpers
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "number") return isNaN(value) ? defaultValue : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.trim());
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const safeString = (value: any, defaultValue: string = ""): string => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "string") return value;
  return String(value);
};

// Type guard for audit type
const isValidAuditType = (
  value: any
): value is
  | "comprehensive"
  | "focused"
  | "compliance"
  | "energy_efficiency"
  | "safety" => {
  return [
    "comprehensive",
    "focused",
    "compliance",
    "energy_efficiency",
    "safety",
  ].includes(value);
};

// Type guard for audit status
const isValidAuditStatus = (
  value: any
): value is
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "on_hold" => {
  return [
    "planned",
    "in_progress",
    "completed",
    "cancelled",
    "on_hold",
  ].includes(value);
};

// ✅ FIXED: Utility function to clean query parameters
const cleanQueryParams = (params: AuditQueryParams): AuditQueryParams => {
  const cleaned: AuditQueryParams = {};

  // Only include non-empty, defined values
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      // Special handling for search - don't include if empty string
      if (
        key === "search" &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        return;
      }
      (cleaned as any)[key] = value;
    }
  });

  return cleaned;
};

// Utility functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Not set";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return "Not set";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
};

const getTypeConfig = (type: string) => {
  return AUDIT_TYPES.find((t) => t.value === type) || AUDIT_TYPES[0];
};

const getStatusConfig = (status: string) => {
  return AUDIT_STATUSES.find((s) => s.value === status) || AUDIT_STATUSES[0];
};

const getComplianceGrade = (
  score?: number | null
): { grade: string; color: string } => {
  if (score === null || score === undefined) {
    return { grade: "N/A", color: "default" };
  }

  const numScore = safeNumber(score, 0);
  if (numScore >= 95) return { grade: "A+", color: "success" };
  if (numScore >= 90) return { grade: "A", color: "success" };
  if (numScore >= 85) return { grade: "B+", color: "primary" };
  if (numScore >= 80) return { grade: "B", color: "primary" };
  if (numScore >= 75) return { grade: "C+", color: "warning" };
  if (numScore >= 70) return { grade: "C", color: "warning" };
  if (numScore >= 60) return { grade: "D", color: "danger" };
  return { grade: "F", color: "danger" };
};

export default function AuditsManagementPage() {
  const { user, isAuthenticated } = useAuth();

  // State
  const [audits, setAudits] = useState<Audit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceCheck[]>([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    perPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ✅ FIXED: Filter state with proper initialization
  const [filters, setFilters] = useState<AuditQueryParams>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  // Internal search state to prevent immediate API calls
  const [searchValue, setSearchValue] = useState("");

  // Form state
  const [formData, setFormData] = useState<AuditFormData>({
    title: "",
    description: "",
    buildingId: null,
    auditType: "comprehensive",
    plannedStartDate: "",
    plannedEndDate: "",
    estimatedDurationHours: 8,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // ✅ FIXED: API Functions with proper error handling and parameter cleaning
  const fetchAudits = useCallback(
    async (showSpinner = false) => {
      try {
        if (showSpinner) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // ✅ Clean the parameters before sending
        const cleanedFilters = cleanQueryParams(filters);
        console.log("📡 Fetching audits with cleaned filters:", cleanedFilters);

        const response = await auditsAPI.getAll(cleanedFilters);
        console.log("📥 Raw audits response:", response);

        const result = handleArrayApiResponse<Audit>(response);
        console.log("🔍 Processed audits result:", result);

        if (result.success) {
          const auditData = result.data || [];
          const paginationData = result.pagination;

          setAudits(auditData);

          // Handle pagination data
          if (paginationData) {
            setPagination({
              currentPage: safeNumber(paginationData.currentPage, 1),
              totalPages: safeNumber(paginationData.totalPages, 1),
              totalCount: safeNumber(paginationData.totalCount, 0),
              perPage: safeNumber(paginationData.perPage, 20),
              hasNextPage: Boolean(paginationData.hasNextPage),
              hasPrevPage: Boolean(paginationData.hasPrevPage),
            });
          } else {
            // Fallback pagination
            setPagination({
              currentPage: 1,
              totalPages: 1,
              totalCount: auditData.length,
              perPage: 20,
              hasNextPage: false,
              hasPrevPage: false,
            });
          }

          console.log("✅ Audits loaded successfully:", {
            count: auditData.length,
            pagination: paginationData,
          });
        } else {
          const errorMessage = result.error || "Failed to fetch audits";
          setError(errorMessage);
          setAudits([]);
          console.error("❌ Failed to fetch audits:", errorMessage);
        }
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch audits";
        console.error("💥 Error fetching audits:", err);
        setError(errorMessage);
        setAudits([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  const fetchBuildings = useCallback(async () => {
    try {
      console.log("📡 Fetching buildings...");

      const response = await buildingsAPI.getAll({
        status: "active",
        sortBy: "name",
        sortOrder: "ASC",
        limit: 100, // Get enough buildings for dropdown
      });

      console.log("📥 Raw buildings response:", response);

      const result = handleArrayApiResponse<Building>(response);
      console.log("🔍 Processed buildings result:", result);

      if (result.success) {
        const buildingData = result.data || [];
        setBuildings(buildingData);
        console.log("✅ Buildings loaded successfully:", buildingData.length);
      } else {
        console.error("❌ Failed to fetch buildings:", result.error);
        setBuildings([]);
      }
    } catch (err: any) {
      console.error("💥 Error fetching buildings:", err);
      setBuildings([]);
    }
  }, []);

  const fetchAuditDetails = useCallback(async (auditId: number) => {
    try {
      console.log("📡 Fetching audit details for ID:", auditId);

      const response = await auditsAPI.getById(auditId);
      console.log("📥 Raw audit details response:", response);

      const result = handleApiResponse<Audit>(response);
      console.log("🔍 Processed audit details result:", result);

      if (result.success && result.data) {
        setSelectedAudit(result.data);

        // Fetch compliance data if audit is completed or in progress
        if (["completed", "in_progress"].includes(result.data.status)) {
          try {
            console.log("📡 Fetching compliance data for audit:", auditId);

            const complianceResponse =
              await complianceAPI.getComplianceChecksByAudit(auditId);
            console.log("📥 Raw compliance response:", complianceResponse);

            const complianceResult =
              handleArrayApiResponse<ComplianceCheck>(complianceResponse);
            console.log("🔍 Processed compliance result:", complianceResult);

            if (complianceResult.success) {
              setComplianceData(complianceResult.data || []);
              console.log(
                "✅ Compliance data loaded:",
                complianceResult.data?.length || 0
              );
            } else {
              console.error(
                "❌ Failed to fetch compliance data:",
                complianceResult.error
              );
              setComplianceData([]);
            }
          } catch (complianceErr) {
            console.error("💥 Error fetching compliance data:", complianceErr);
            setComplianceData([]);
          }
        } else {
          setComplianceData([]);
        }

        console.log("✅ Audit details loaded successfully");
      } else {
        console.error("❌ Failed to fetch audit details:", result.error);
      }
    } catch (err: any) {
      console.error("💥 Error fetching audit details:", err);
    }
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    fetchAudits(true);
  }, [fetchAudits]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length < 5) {
      errors.title = "Title must be at least 5 characters";
    }

    if (!formData.buildingId) {
      errors.buildingId = "Building is required";
    }

    if (!formData.plannedStartDate) {
      errors.plannedStartDate = "Planned start date is required";
    } else if (new Date(formData.plannedStartDate) < new Date()) {
      errors.plannedStartDate = "Planned start date cannot be in the past";
    }

    if (formData.plannedEndDate && formData.plannedStartDate) {
      if (
        new Date(formData.plannedEndDate) <= new Date(formData.plannedStartDate)
      ) {
        errors.plannedEndDate = "End date must be after start date";
      }
    }

    if (formData.estimatedDurationHours < 1) {
      errors.estimatedDurationHours = "Duration must be at least 1 hour";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ FIXED: Event handlers with proper parameter handling
  const handleFilterChange = (key: keyof AuditQueryParams, value: any) => {
    console.log("🔧 Filter changed:", key, value);

    setFilters((prev) => {
      const newFilters = { ...prev };

      // Handle different filter types properly
      if (value === undefined || value === null || value === "") {
        // Remove the filter completely
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }

      // Reset to page 1 when filters change (except for page changes)
      if (key !== "page") {
        newFilters.page = 1;
      }

      return newFilters;
    });
  };

  // ✅ FIXED: Search handler with debouncing
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    // Clear the search filter if empty, otherwise set it
    if (value.trim() === "") {
      handleFilterChange("search", undefined);
    } else {
      // Debounce the search
      const timeoutId = setTimeout(() => {
        handleFilterChange("search", value.trim());
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  };

  const handleCreateAudit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const auditData: Partial<Audit> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        buildingId: formData.buildingId!,
        auditType: formData.auditType,
        auditorId: user?.id,
        plannedStartDate: formData.plannedStartDate,
        plannedEndDate: formData.plannedEndDate || undefined,
        estimatedDurationHours: formData.estimatedDurationHours,
      };

      console.log("📤 Creating audit with data:", auditData);

      const response = await auditsAPI.create(auditData);
      console.log("📥 Create audit response:", response);

      const result = handleApiResponse<Audit>(response);
      console.log("🔍 Processed create result:", result);

      if (result.success) {
        console.log("✅ Audit created successfully");
        onCreateClose();
        resetForm();
        fetchAudits(true); // Refresh the list
      } else {
        const errorMessage = result.error || "Failed to create audit";
        setFormErrors({ general: errorMessage });
        console.error("❌ Failed to create audit:", errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create audit";
      setFormErrors({ general: errorMessage });
      console.error("💥 Error creating audit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAudit = async () => {
    if (!selectedAudit || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const updateData: Partial<Audit> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        auditType: formData.auditType,
        plannedStartDate: formData.plannedStartDate,
        plannedEndDate: formData.plannedEndDate || undefined,
        estimatedDurationHours: formData.estimatedDurationHours,
      };

      console.log("📤 Updating audit with data:", updateData);

      const response = await auditsAPI.update(selectedAudit.id, updateData);
      console.log("📥 Update audit response:", response);

      const result = handleApiResponse<Audit>(response);
      console.log("🔍 Processed update result:", result);

      if (result.success) {
        console.log("✅ Audit updated successfully");
        onEditClose();
        resetForm();
        setSelectedAudit(null);
        fetchAudits(true); // Refresh the list
      } else {
        const errorMessage = result.error || "Failed to update audit";
        setFormErrors({ general: errorMessage });
        console.error("❌ Failed to update audit:", errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update audit";
      setFormErrors({ general: errorMessage });
      console.error("💥 Error updating audit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAudit = async () => {
    if (!selectedAudit) return;

    setIsSubmitting(true);
    try {
      console.log("📤 Deleting audit:", selectedAudit.id);

      const response = await auditsAPI.delete(selectedAudit.id);
      console.log("📥 Delete audit response:", response);

      const result = handleApiResponse<void>(response);
      console.log("🔍 Processed delete result:", result);

      if (result.success) {
        console.log("✅ Audit deleted successfully");
        onDeleteClose();
        setSelectedAudit(null);
        fetchAudits(true); // Refresh the list
      } else {
        console.error("❌ Failed to delete audit:", result.error);
      }
    } catch (err: any) {
      console.error("💥 Error deleting audit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (audit: Audit, newStatus: string) => {
    try {
      if (!isValidAuditStatus(newStatus)) {
        console.error("❌ Invalid audit status:", newStatus);
        return;
      }

      const updateData: Partial<Audit> = { status: newStatus };

      if (newStatus === "in_progress") {
        updateData.actualStartDate = new Date().toISOString();
      } else if (newStatus === "completed") {
        updateData.actualEndDate = new Date().toISOString();
      }

      console.log("📤 Updating audit status:", audit.id, newStatus);

      const response = await auditsAPI.update(audit.id, updateData);
      console.log("📥 Status update response:", response);

      const result = handleApiResponse<Audit>(response);
      console.log("🔍 Processed status update result:", result);

      if (result.success) {
        console.log("✅ Audit status updated successfully");
        fetchAudits(true); // Refresh the list
      } else {
        console.error("❌ Failed to update audit status:", result.error);
      }
    } catch (err: any) {
      console.error("💥 Error updating audit status:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      buildingId: null,
      auditType: "comprehensive",
      plannedStartDate: "",
      plannedEndDate: "",
      estimatedDurationHours: 8,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    onCreateOpen();
  };

  const openEditModal = (audit: Audit) => {
    setSelectedAudit(audit);

    // Safely extract audit type with fallback
    const auditType = isValidAuditType(audit.auditType)
      ? audit.auditType
      : "comprehensive";

    setFormData({
      title: safeString(audit.title),
      description: safeString(audit.description),
      buildingId: audit.buildingId,
      auditType: auditType,
      plannedStartDate: audit.plannedStartDate?.split("T")[0] || "",
      plannedEndDate: audit.plannedEndDate?.split("T")[0] || "",
      estimatedDurationHours: safeNumber(audit.estimatedDurationHours, 8),
    });
    setFormErrors({});
    onEditOpen();
  };

  const openViewModal = (audit: Audit) => {
    setSelectedAudit(audit);
    setComplianceData([]);
    fetchAuditDetails(audit.id);
    onViewOpen();
  };

  const openDeleteModal = (audit: Audit) => {
    setSelectedAudit(audit);
    onDeleteOpen();
  };

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      console.log("🚀 Component mounted, fetching initial data");
      fetchBuildings();
    }
  }, [isAuthenticated, fetchBuildings]);

  useEffect(() => {
    if (isAuthenticated && buildings.length > 0) {
      console.log("🚀 Buildings loaded, fetching audits");
      fetchAudits();
    }
  }, [isAuthenticated, buildings.length, fetchAudits]);

  // Computed values
  const buildingOptions = useMemo(() => {
    return buildings.map((building) => ({
      value: building.id,
      label: `${safeString(building.name)}${building.code ? ` (${building.code})` : ""}`,
      building,
    }));
  }, [buildings]);

  const auditStats = useMemo(() => {
    const stats = {
      total: audits.length,
      planned: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      onHold: 0,
      avgCompliance: 0,
    };

    let complianceSum = 0;
    let complianceCount = 0;

    audits.forEach((audit) => {
      switch (audit.status) {
        case "planned":
          stats.planned++;
          break;
        case "in_progress":
          stats.inProgress++;
          break;
        case "completed":
          stats.completed++;
          break;
        case "cancelled":
          stats.cancelled++;
          break;
        case "on_hold":
          stats.onHold++;
          break;
      }

      if (audit.complianceScore != null) {
        complianceSum += safeNumber(audit.complianceScore);
        complianceCount++;
      }
    });

    stats.avgCompliance =
      complianceCount > 0 ? complianceSum / complianceCount : 0;
    return stats;
  }, [audits]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.buildingId ||
      filters.auditType ||
      filters.status ||
      filters.auditorId
    );
  }, [filters]);

  // Loading state
  if (loading && audits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="h-20 rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
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
            onPress={handleRefresh}
            isLoading={refreshing}
          >
            {refreshing ? "Retrying..." : "Retry"}
          </Button>
        </div>

        <Card className="border-danger">
          <CardBody className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-danger">
              Failed to Load Audits
            </h3>
            <p className="text-default-500 mb-4 max-w-md mx-auto">{error}</p>
            <Button
              color="primary"
              onPress={handleRefresh}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={refreshing}
            >
              {refreshing ? "Retrying..." : "Try Again"}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" />
            Audits Management
          </h1>
          <p className="text-default-500 mt-1">
            Comprehensive audit scheduling, tracking, and compliance management
          </p>
          {auditStats.total > 0 && (
            <div className="flex items-center gap-4 mt-2 text-sm text-default-400">
              <span>{auditStats.total} total audits</span>
              <span>•</span>
              <span>{auditStats.inProgress} in progress</span>
              <span>•</span>
              <span>{auditStats.completed} completed</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="light"
            startContent={
              refreshing ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )
            }
            onPress={handleRefresh}
            isDisabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={openCreateModal}
            isDisabled={buildingOptions.length === 0}
          >
            Create Audit
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Audits</p>
                <p className="text-2xl font-bold">{auditStats.total}</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-default">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Planned</p>
                <p className="text-2xl font-bold">{auditStats.planned}</p>
              </div>
              <Calendar className="w-8 h-8 text-default-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">In Progress</p>
                <p className="text-2xl font-bold text-warning">
                  {auditStats.inProgress}
                </p>
              </div>
              <Activity className="w-8 h-8 text-warning" />
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
                <Progress
                  value={
                    auditStats.total > 0
                      ? (auditStats.completed / auditStats.total) * 100
                      : 0
                  }
                  color="success"
                  size="sm"
                  className="mt-1"
                />
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Avg Compliance</p>
                <p className="text-2xl font-bold">
                  {auditStats.avgCompliance.toFixed(1)}%
                </p>
                <div className="text-lg font-medium mt-1">
                  {getComplianceGrade(auditStats.avgCompliance).grade}
                </div>
              </div>
              <Target className="w-8 h-8 text-secondary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Issues</p>
                <p className="text-2xl font-bold text-danger">
                  {auditStats.cancelled + auditStats.onHold}
                </p>
                <p className="text-xs text-default-400">
                  {auditStats.onHold} on hold
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Chip size="sm" color="primary" variant="flat">
                Active
              </Chip>
            )}
          </div>
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={() => setShowFilters(!showFilters)}
          >
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CardHeader>

        {showFilters && (
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search audits..."
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  isClearable
                  onClear={() => {
                    setSearchValue("");
                    handleFilterChange("search", undefined);
                  }}
                />
              </div>

              <Select
                placeholder="All Buildings"
                selectedKeys={
                  filters.buildingId
                    ? new Set([filters.buildingId.toString()])
                    : new Set()
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleFilterChange(
                    "buildingId",
                    selectedKey ? parseInt(selectedKey) : undefined
                  );
                }}
                startContent={
                  <BuildingIcon className="w-4 h-4 text-default-400" />
                }
              >
                {buildingOptions.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder="All Types"
                selectedKeys={
                  filters.auditType ? new Set([filters.auditType]) : new Set()
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as
                    | "comprehensive"
                    | "focused"
                    | "compliance"
                    | "energy_efficiency"
                    | "safety"
                    | undefined;
                  handleFilterChange("auditType", selectedKey);
                }}
                startContent={<FileText className="w-4 h-4 text-default-400" />}
              >
                {AUDIT_TYPES.map((type) => (
                  <SelectItem key={type.value} startContent={type.icon}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                placeholder="All Statuses"
                selectedKeys={
                  filters.status ? new Set([filters.status]) : new Set()
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleFilterChange("status", selectedKey);
                }}
                startContent={<Activity className="w-4 h-4 text-default-400" />}
              >
                {AUDIT_STATUSES.map((status) => (
                  <SelectItem key={status.value} startContent={status.icon}>
                    {status.label}
                  </SelectItem>
                ))}
              </Select>

              {hasActiveFilters && (
                <div className="flex items-center">
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    startContent={<X className="w-4 h-4" />}
                    onPress={() => {
                      setFilters({
                        page: 1,
                        limit: 20,
                        sortBy: "createdAt",
                        sortOrder: "DESC",
                      });
                      setSearchValue("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        )}
      </Card>

      {/* Audits Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Audits ({pagination.totalCount})
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="light"
              startContent={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table
            aria-label="Audits table"
            classNames={{ wrapper: "min-h-[500px]" }}
          >
            <TableHeader>
              <TableColumn>AUDIT DETAILS</TableColumn>
              <TableColumn>BUILDING & TEAM</TableColumn>
              <TableColumn>TYPE & STATUS</TableColumn>
              <TableColumn>SCHEDULE</TableColumn>
              <TableColumn>PROGRESS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>

            <TableBody
              isLoading={loading}
              loadingContent={<Spinner label="Loading audits..." />}
              emptyContent={
                hasActiveFilters
                  ? "No audits match your current filters."
                  : "No audits found. Create your first audit to get started."
              }
            >
              {audits.map((audit) => {
                const typeConfig = getTypeConfig(audit.auditType);
                const statusConfig = getStatusConfig(audit.status);
                const complianceGrade = getComplianceGrade(
                  audit.complianceScore
                );

                return (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="font-semibold text-foreground line-clamp-2">
                          {safeString(audit.title)}
                        </div>
                        <div className="text-sm text-default-500">
                          ID: {audit.id}
                        </div>
                        {audit.description && (
                          <p className="text-xs text-default-400 line-clamp-2">
                            {safeString(audit.description)}
                          </p>
                        )}
                        <div className="text-xs text-default-500">
                          Created: {formatDate(audit.createdAt)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BuildingIcon className="w-4 h-4 text-default-400 shrink-0" />
                          <div>
                            <div className="text-sm font-medium line-clamp-1">
                              {safeString(audit.buildingName) ||
                                `Building ${audit.buildingId}`}
                            </div>
                            <div className="text-xs text-default-500">
                              ID: {audit.buildingId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-default-400 shrink-0" />
                          <div>
                            <div className="text-sm line-clamp-1">
                              {safeString(audit.auditorName) || "Unassigned"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <Chip
                          size="sm"
                          color={typeConfig.color}
                          variant="flat"
                          startContent={typeConfig.icon}
                        >
                          {typeConfig.label}
                        </Chip>

                        <Chip
                          size="sm"
                          color={statusConfig.color}
                          variant="solid"
                          startContent={statusConfig.icon}
                        >
                          {statusConfig.label}
                        </Chip>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" />
                            <span className="text-xs">
                              {formatDate(audit.plannedStartDate)}
                            </span>
                          </div>
                        </div>

                        {audit.actualStartDate && (
                          <div className="text-xs text-success">
                            Started: {formatDate(audit.actualStartDate)}
                          </div>
                        )}

                        {audit.actualEndDate && (
                          <div className="text-xs text-success">
                            Completed: {formatDate(audit.actualEndDate)}
                          </div>
                        )}

                        {audit.estimatedDurationHours && (
                          <div className="text-xs text-default-400">
                            Est: {safeNumber(audit.estimatedDurationHours)}h
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        {audit.complianceScore !== null &&
                        audit.complianceScore !== undefined ? (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-default-600">
                                Compliance
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium">
                                  {safeNumber(audit.complianceScore).toFixed(1)}
                                  %
                                </span>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={complianceGrade.color as any}
                                >
                                  {complianceGrade.grade}
                                </Chip>
                              </div>
                            </div>
                            <Progress
                              value={safeNumber(audit.complianceScore)}
                              color={complianceGrade.color as any}
                              size="sm"
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-default-400 text-center py-2">
                            Not assessed
                          </div>
                        )}

                        {audit.progressPercentage !== null &&
                          audit.progressPercentage !== undefined && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-default-600">
                                  Progress
                                </span>
                                <span className="text-xs font-medium">
                                  {safeNumber(audit.progressPercentage).toFixed(
                                    0
                                  )}
                                  %
                                </span>
                              </div>
                              <Progress
                                value={safeNumber(audit.progressPercentage)}
                                color="primary"
                                size="sm"
                              />
                            </div>
                          )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Tooltip content="View Details">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openViewModal(audit)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        {audit.status === "planned" && (
                          <Tooltip content="Start Audit">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="success"
                              onPress={() =>
                                handleStatusChange(audit, "in_progress")
                              }
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}

                        {audit.status === "in_progress" && (
                          <Tooltip content="Complete Audit">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() =>
                                handleStatusChange(audit, "completed")
                              }
                            >
                              <CheckSquare className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}

                        {["planned", "in_progress", "on_hold"].includes(
                          audit.status
                        ) && (
                          <Tooltip content="Edit Audit">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openEditModal(audit)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}

                        {["planned", "cancelled", "on_hold"].includes(
                          audit.status
                        ) && (
                          <Tooltip content="Delete Audit">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => openDeleteModal(audit)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-divider">
              <div className="text-sm text-default-500">
                Showing {(pagination.currentPage - 1) * pagination.perPage + 1}{" "}
                to{" "}
                {Math.min(
                  pagination.currentPage * pagination.perPage,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} audits
              </div>
              <Pagination
                total={pagination.totalPages}
                page={pagination.currentPage}
                onChange={(page) => handleFilterChange("page", page)}
                showControls
                showShadow
                color="primary"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onOpenChange={isCreateOpen ? onCreateClose : onEditClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {isCreateOpen ? "Create New Audit" : "Edit Audit"}
                    </h3>
                    <p className="text-sm text-default-500 font-normal">
                      {isCreateOpen
                        ? "Schedule a new audit for your facility"
                        : "Update audit details and schedule"}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="space-y-6">
                {formErrors.general && (
                  <Card className="border-danger bg-danger-50">
                    <CardBody className="p-3">
                      <div className="text-danger-800">
                        {formErrors.general}
                      </div>
                    </CardBody>
                  </Card>
                )}

                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Basic Information</h4>

                  <Input
                    label="Audit Title"
                    placeholder="Enter audit title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.title}
                    isInvalid={!!formErrors.title}
                    isRequired
                  />

                  <Textarea
                    label="Description"
                    placeholder="Enter audit description"
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
                      label="Audit Type"
                      selectedKeys={new Set([formData.auditType])}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as
                          | "comprehensive"
                          | "focused"
                          | "compliance"
                          | "energy_efficiency"
                          | "safety";
                        setFormData((prev) => ({
                          ...prev,
                          auditType: selectedKey,
                        }));
                      }}
                      isRequired
                    >
                      {AUDIT_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          description={type.description}
                          startContent={type.icon}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      label="Estimated Duration (hours)"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.estimatedDurationHours.toString()}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estimatedDurationHours: Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          ),
                        }))
                      }
                      errorMessage={formErrors.estimatedDurationHours}
                      isInvalid={!!formErrors.estimatedDurationHours}
                      startContent={<Timer className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Location & Schedule</h4>

                  <Select
                    label="Building"
                    placeholder="Select building"
                    selectedKeys={
                      formData.buildingId
                        ? new Set([formData.buildingId.toString()])
                        : new Set()
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setFormData((prev) => ({
                        ...prev,
                        buildingId: selectedKey ? parseInt(selectedKey) : null,
                      }));
                    }}
                    errorMessage={formErrors.buildingId}
                    isInvalid={!!formErrors.buildingId}
                    isRequired
                    startContent={<BuildingIcon className="w-4 h-4" />}
                    isDisabled={buildingOptions.length === 0}
                  >
                    {buildingOptions.map((option) => (
                      <SelectItem key={option.value}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Planned Start Date"
                      type="date"
                      value={formData.plannedStartDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          plannedStartDate: e.target.value,
                        }))
                      }
                      errorMessage={formErrors.plannedStartDate}
                      isInvalid={!!formErrors.plannedStartDate}
                      isRequired
                    />

                    <Input
                      label="Planned End Date"
                      type="date"
                      value={formData.plannedEndDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          plannedEndDate: e.target.value,
                        }))
                      }
                      errorMessage={formErrors.plannedEndDate}
                      isInvalid={!!formErrors.plannedEndDate}
                      min={formData.plannedStartDate}
                    />
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={isCreateOpen ? handleCreateAudit : handleUpdateAudit}
                  isLoading={isSubmitting}
                  startContent={
                    !isSubmitting ? (
                      isCreateOpen ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )
                    ) : undefined
                  }
                >
                  {isSubmitting
                    ? isCreateOpen
                      ? "Creating..."
                      : "Saving..."
                    : isCreateOpen
                      ? "Create Audit"
                      : "Save Changes"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Modal */}
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
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold">
                        {safeString(selectedAudit?.title)}
                      </h3>
                      <p className="text-sm text-default-500 font-normal">
                        ID: {selectedAudit?.id} • Created{" "}
                        {formatDate(selectedAudit?.createdAt)}
                      </p>
                    </div>
                  </div>
                  {selectedAudit && (
                    <div className="flex gap-2">
                      <Chip
                        color={getStatusConfig(selectedAudit.status).color}
                        size="sm"
                      >
                        {getStatusConfig(selectedAudit.status).label}
                      </Chip>
                      <Chip
                        color={getTypeConfig(selectedAudit.auditType).color}
                        size="sm"
                        variant="flat"
                      >
                        {getTypeConfig(selectedAudit.auditType).label}
                      </Chip>
                    </div>
                  )}
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedAudit && (
                  <div className="space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardBody className="text-center p-4">
                          <div className="text-2xl font-bold text-primary">
                            {selectedAudit.complianceScore !== null &&
                            selectedAudit.complianceScore !== undefined
                              ? safeNumber(
                                  selectedAudit.complianceScore
                                ).toFixed(1) + "%"
                              : "N/A"}
                          </div>
                          <div className="text-sm text-default-600">
                            Compliance Score
                          </div>
                          {selectedAudit.complianceScore !== null &&
                            selectedAudit.complianceScore !== undefined && (
                              <div className="text-lg font-medium mt-1">
                                {
                                  getComplianceGrade(
                                    selectedAudit.complianceScore
                                  ).grade
                                }
                              </div>
                            )}
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody className="text-center p-4">
                          <div className="text-2xl font-bold text-secondary">
                            {safeNumber(
                              selectedAudit.estimatedDurationHours,
                              0
                            )}
                            h
                          </div>
                          <div className="text-sm text-default-600">
                            Est. Duration
                          </div>
                          <div className="text-sm text-default-500 mt-1">
                            {getTypeConfig(selectedAudit.auditType).label}
                          </div>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody className="text-center p-4">
                          <div className="text-2xl font-bold text-warning">
                            {selectedAudit.progressPercentage !== null &&
                            selectedAudit.progressPercentage !== undefined
                              ? safeNumber(
                                  selectedAudit.progressPercentage
                                ).toFixed(0) + "%"
                              : "0%"}
                          </div>
                          <div className="text-sm text-default-600">
                            Progress
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Audit Information
                          </h4>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-sm text-default-600">
                                Type:
                              </span>
                              <div className="font-medium">
                                {getTypeConfig(selectedAudit.auditType).label}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-default-600">
                                Status:
                              </span>
                              <div className="font-medium">
                                {getStatusConfig(selectedAudit.status).label}
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-default-600">
                              Building:
                            </span>
                            <div className="font-medium flex items-center gap-2">
                              <BuildingIcon className="w-4 h-4 text-default-400" />
                              {safeString(selectedAudit.buildingName) ||
                                `Building ${selectedAudit.buildingId}`}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-default-600">
                              Auditor:
                            </span>
                            <div className="font-medium flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-default-400" />
                              {safeString(selectedAudit.auditorName) ||
                                "Unassigned"}
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Timeline
                          </h4>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div>
                            <span className="text-sm text-default-600">
                              Planned Start:
                            </span>
                            <div className="font-medium">
                              {formatDate(selectedAudit.plannedStartDate)}
                            </div>
                          </div>

                          {selectedAudit.plannedEndDate && (
                            <div>
                              <span className="text-sm text-default-600">
                                Planned End:
                              </span>
                              <div className="font-medium">
                                {formatDate(selectedAudit.plannedEndDate)}
                              </div>
                            </div>
                          )}

                          {selectedAudit.actualStartDate && (
                            <div>
                              <span className="text-sm text-default-600">
                                Actual Start:
                              </span>
                              <div className="font-medium text-success">
                                {formatDateTime(selectedAudit.actualStartDate)}
                              </div>
                            </div>
                          )}

                          {selectedAudit.actualEndDate && (
                            <div>
                              <span className="text-sm text-default-600">
                                Actual End:
                              </span>
                              <div className="font-medium text-success">
                                {formatDateTime(selectedAudit.actualEndDate)}
                              </div>
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
                          <p className="whitespace-pre-wrap">
                            {safeString(selectedAudit.description)}
                          </p>
                        </CardBody>
                      </Card>
                    )}

                    {/* Compliance Data */}
                    {complianceData.length > 0 && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Compliance Checks ({complianceData.length})
                          </h4>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {complianceData.slice(0, 10).map((check, index) => (
                              <div
                                key={check.id || index}
                                className="flex items-start justify-between p-4 border border-content2 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {safeString(check.requirementTitle) ||
                                      `Check ${index + 1}`}
                                  </div>
                                  <div className="text-sm text-default-500 mt-1">
                                    {safeString(check.standardType) ||
                                      safeString(check.standard)}
                                  </div>
                                  {check.details && (
                                    <div className="text-sm text-default-600 mt-2">
                                      {safeString(check.details)}
                                    </div>
                                  )}
                                </div>
                                <Chip
                                  color={
                                    check.status === "passed" ||
                                    check.status === "compliant"
                                      ? "success"
                                      : check.status === "warning"
                                        ? "warning"
                                        : "danger"
                                  }
                                  size="sm"
                                >
                                  {safeString(check.status)}
                                </Chip>
                              </div>
                            ))}
                            {complianceData.length > 10 && (
                              <div className="text-center text-sm text-default-500">
                                And {complianceData.length - 10} more checks...
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
                <div className="flex justify-between w-full">
                  <div className="flex gap-2">
                    {selectedAudit?.status === "planned" && (
                      <Button
                        color="success"
                        startContent={<Play className="w-4 h-4" />}
                        onPress={() => {
                          handleStatusChange(selectedAudit, "in_progress");
                          onClose();
                        }}
                      >
                        Start Audit
                      </Button>
                    )}

                    {selectedAudit?.status === "in_progress" && (
                      <Button
                        color="primary"
                        startContent={<CheckSquare className="w-4 h-4" />}
                        onPress={() => {
                          handleStatusChange(selectedAudit, "completed");
                          onClose();
                        }}
                      >
                        Complete Audit
                      </Button>
                    )}

                    {selectedAudit &&
                      ["planned", "in_progress", "on_hold"].includes(
                        selectedAudit.status
                      ) && (
                        <Button
                          startContent={<Edit className="w-4 h-4" />}
                          variant="flat"
                          onPress={() => {
                            openEditModal(selectedAudit);
                            onClose();
                          }}
                        >
                          Edit
                        </Button>
                      )}
                  </div>

                  <Button onPress={onClose} variant="light">
                    Close
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteClose} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-danger" />
                  <span>Confirm Deletion</span>
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedAudit && (
                  <div className="space-y-4">
                    <p>
                      Are you sure you want to delete this audit? This action
                      cannot be undone.
                    </p>

                    <Card className="border-danger-200 bg-danger-50">
                      <CardBody className="p-3">
                        <div className="font-medium text-danger-800">
                          {safeString(selectedAudit.title)}
                        </div>
                        <div className="text-sm text-danger-700">
                          ID: {selectedAudit.id} •{" "}
                          {getStatusConfig(selectedAudit.status).label}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteAudit}
                  isLoading={isSubmitting}
                  startContent={
                    !isSubmitting ? <Trash2 className="w-4 h-4" /> : undefined
                  }
                >
                  {isSubmitting ? "Deleting..." : "Delete Audit"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
