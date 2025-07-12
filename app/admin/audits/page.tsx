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
  Play,
  CheckSquare,
  XCircle,
  Pause,
  Settings,
  Info,
  Award,
  Timer,
  MapPin,
  Zap,
  Shield as ShieldCheck,
} from "lucide-react";

// ✅ PERFECT: Import your new API structure
import {
  auditsAPI,
  buildingsAPI,
  authAPI,
  dashboardAPI,
  complianceAPI,
  apiUtils,
} from "@/lib/api";

import type {
  Audit,
  Building,
  User,
  AuditSummary,
  ComplianceCheck,
  ComplianceStandard,
  ApiResponse,
  AuditQueryParams,
  BuildingQueryParams,
  ApiError,
  ValidationError,
} from "@/types/api-types";

import {
  transformToServerFields,
  extractErrorMessage,
  formatValidationErrors,
  normalizeApiResponse,
} from "@/lib/api-utils";

// ✅ PERFECT: Enhanced interfaces aligned with your API
interface EnhancedAudit extends Audit {
  // Computed fields for UI
  urgency_status?: "normal" | "urgent" | "critical";
  days_remaining?: number | null;
  building_name_display?: string;
  auditor_name_display?: string;
  compliance_color?: "success" | "warning" | "danger" | "default";
  status_color?: "default" | "primary" | "success" | "warning" | "danger";
  type_icon?: string;
  progress_display?: string;
}

interface AuditFormData {
  title: string;
  description: string;
  building_id: number | null;
  audit_type:
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  auditor_id: number | null;
  planned_start_date: string;
  planned_end_date: string;
  estimated_duration_hours: number | null;
}

interface AuditFilters {
  search: string;
  building_id: number | null;
  audit_type:
    | ""
    | "comprehensive"
    | "focused"
    | "compliance"
    | "energy_efficiency"
    | "safety";
  status:
    | ""
    | "planned"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "on_hold";
  auditor_id: number | null;
  date_range_start: string;
  date_range_end: string;
}

// ✅ PERFECT: Configuration aligned with your API types
const AUDIT_CONFIGURATION = {
  types: [
    {
      key: "comprehensive",
      label: "Comprehensive Audit",
      icon: "🔍",
      color: "primary",
      description: "Complete system evaluation and assessment",
    },
    {
      key: "focused",
      label: "Focused Audit",
      icon: "🎯",
      color: "secondary",
      description: "Targeted assessment of specific areas",
    },
    {
      key: "compliance",
      label: "Compliance Audit",
      icon: "📋",
      color: "success",
      description: "Regulatory compliance verification",
    },
    {
      key: "energy_efficiency",
      label: "Energy Efficiency",
      icon: "⚡",
      color: "warning",
      description: "Energy performance optimization audit",
    },
    {
      key: "safety",
      label: "Safety Audit",
      icon: "🛡️",
      color: "danger",
      description: "Safety standards and protocols audit",
    },
  ] as const,

  statuses: [
    { key: "planned", label: "Planned", color: "default", icon: Clock },
    {
      key: "in_progress",
      label: "In Progress",
      color: "primary",
      icon: Activity,
    },
    {
      key: "completed",
      label: "Completed",
      color: "success",
      icon: CheckCircle,
    },
    { key: "cancelled", label: "Cancelled", color: "danger", icon: XCircle },
    { key: "on_hold", label: "On Hold", color: "warning", icon: Pause },
  ] as const,

  compliance_standards: [
    {
      key: "PEC2017",
      label: "PEC 2017",
      description: "Philippine Electrical Code 2017",
    },
    {
      key: "OSHS",
      label: "OSHS",
      description: "Occupational Safety & Health Standards",
    },
    {
      key: "ISO25010",
      label: "ISO 25010",
      description: "System and Software Quality Models",
    },
    {
      key: "RA11285",
      label: "RA 11285",
      description: "Energy Efficiency & Conservation Act",
    },
  ] as const,

  priorities: [
    { key: "low", label: "Low", color: "default" },
    { key: "medium", label: "Medium", color: "warning" },
    { key: "high", label: "High", color: "danger" },
    { key: "critical", label: "Critical", color: "danger" },
  ] as const,
} as const;

// ✅ PERFECT: Utility functions using your API patterns
const enhanceAuditData = (audit: Audit): EnhancedAudit => {
  const enhanced: EnhancedAudit = { ...audit };

  // Calculate urgency status
  enhanced.urgency_status = calculateUrgencyStatus(audit);
  enhanced.days_remaining = calculateDaysRemaining(audit);

  // Display names
  enhanced.building_name_display =
    audit.building_name || `Building ${audit.building_id}`;
  enhanced.auditor_name_display = audit.auditor_name || "Unassigned";

  // UI colors
  enhanced.compliance_color = getComplianceColor(audit.compliance_score);
  enhanced.status_color = getStatusColor(audit.status);

  // Type icon
  const typeConfig = AUDIT_CONFIGURATION.types.find(
    (t) => t.key === audit.audit_type
  );
  enhanced.type_icon = typeConfig?.icon || "📋";

  // Progress display
  enhanced.progress_display = `${audit.progress_percentage || 0}%`;

  return enhanced;
};

const calculateUrgencyStatus = (
  audit: Audit
): "normal" | "urgent" | "critical" => {
  if (audit.status === "completed" || audit.status === "cancelled") {
    return "normal";
  }

  const daysRemaining = calculateDaysRemaining(audit);
  if (daysRemaining === null) return "normal";
  if (daysRemaining < 0) return "critical"; // Overdue
  if (daysRemaining <= 3) return "urgent"; // Due soon
  return "normal";
};

const calculateDaysRemaining = (audit: Audit): number | null => {
  try {
    const targetDate =
      audit.status === "planned"
        ? audit.planned_start_date
        : audit.planned_end_date;

    if (!targetDate) return null;

    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch {
    return null;
  }
};

const getComplianceColor = (
  score?: number
): "success" | "warning" | "danger" | "default" => {
  if (!score) return "default";
  if (score >= 90) return "success";
  if (score >= 70) return "warning";
  return "danger";
};

const getStatusColor = (
  status: string
): "default" | "primary" | "success" | "warning" | "danger" => {
  const config = AUDIT_CONFIGURATION.statuses.find((s) => s.key === status);
  return config?.color || "default";
};

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

export default function EnhancedAuditsPage() {
  // ✅ PERFECT: State management with proper typing
  const [audits, setAudits] = useState<EnhancedAudit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>(
    {}
  );

  // ✅ PERFECT: Pagination state matching your API structure
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total_pages: 1,
    total_count: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  // ✅ PERFECT: Filters with proper typing
  const [filters, setFilters] = useState<AuditFilters>({
    search: "",
    building_id: null,
    audit_type: "",
    status: "",
    auditor_id: null,
    date_range_start: "",
    date_range_end: "",
  });

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

  // Selected audit and related data
  const [selectedAudit, setSelectedAudit] = useState<EnhancedAudit | null>(
    null
  );
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>(
    []
  );
  const [complianceStandards, setComplianceStandards] = useState<
    ComplianceStandard[]
  >([]);
  const [loadingCompliance, setLoadingCompliance] = useState(false);

  // Form state with validation
  const [formData, setFormData] = useState<AuditFormData>({
    title: "",
    description: "",
    building_id: null,
    audit_type: "comprehensive",
    auditor_id: null,
    planned_start_date: "",
    planned_end_date: "",
    estimated_duration_hours: null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ PERFECT: API functions using your established patterns
  const loadAudits = useCallback(
    async (showLoading = false): Promise<void> => {
      try {
        if (showLoading) setLoading(true);

        console.log("🎯 Loading audits with filters:", filters);

        // ✅ Build query parameters using your API structure
        const queryParams: AuditQueryParams = {
          page: pagination.current_page,
          limit: pagination.per_page,
          sortBy: "created_at",
          sortOrder: "DESC",
        };

        // Apply filters with proper field transformation
        if (filters.search.trim()) {
          queryParams.search = filters.search.trim();
        }
        if (filters.building_id) {
          queryParams.building_id = filters.building_id;
        }
        if (filters.audit_type) {
          queryParams.audit_type = filters.audit_type;
        }
        if (filters.status) {
          queryParams.status = filters.status;
        }
        if (filters.auditor_id) {
          queryParams.auditor_id = filters.auditor_id;
        }
        if (filters.date_range_start) {
          queryParams.start_date_from = filters.date_range_start;
        }
        if (filters.date_range_end) {
          queryParams.start_date_to = filters.date_range_end;
        }

        const response = await auditsAPI.getAll(queryParams);

        if (response.data?.success) {
          const auditsData = Array.isArray(response.data.data)
            ? response.data.data
            : [];
          const enhancedAudits = auditsData.map(enhanceAuditData);

          setAudits(enhancedAudits);

          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }

          console.log(`✅ Loaded ${enhancedAudits.length} audits`);
          setError(null);
        } else {
          throw new Error(response.data?.message || "Failed to load audits");
        }
      } catch (err: any) {
        console.error("❌ Failed to load audits:", err);
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);

        if (audits.length === 0) {
          setAudits([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.current_page, pagination.per_page, audits.length]
  );

  const loadBuildings = useCallback(async (): Promise<void> => {
    try {
      console.log("🏢 Loading buildings...");

      const queryParams: BuildingQueryParams = {
        status: "active",
        sortBy: "name",
        sortOrder: "ASC",
        limit: 100,
      };

      const response = await buildingsAPI.getAll(queryParams);

      if (response.data?.success) {
        const buildingsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setBuildings(buildingsData);
        console.log(`✅ Loaded ${buildingsData.length} buildings`);
      } else {
        console.warn(
          "⚠️ Buildings response not successful:",
          response.data?.message
        );
        setBuildings([]);
      }
    } catch (err: any) {
      console.warn("⚠️ Failed to load buildings:", extractErrorMessage(err));
      setBuildings([]);
    }
  }, []);

  const loadUsers = useCallback(async (): Promise<void> => {
    try {
      console.log("👥 Loading users...");

      // Try to get users list
      try {
        const response = await authAPI.getUsers();

        if (response.data?.success) {
          const usersData = Array.isArray(response.data.data)
            ? response.data.data
            : [];
          // Filter users who can be auditors
          const auditors = usersData.filter((user) =>
            ["admin", "energy_manager", "facility_engineer"].includes(user.role)
          );
          setUsers(auditors);
          console.log(`✅ Loaded ${auditors.length} potential auditors`);
          return;
        }
      } catch (usersError) {
        console.warn("⚠️ Users endpoint not available, trying profile...");
      }

      // Fallback to current user profile
      try {
        const profileResponse = await authAPI.getProfile();

        if (profileResponse.data?.success) {
          const userData = profileResponse.data.data;
          const currentUser = userData?.user || userData;

          if (currentUser) {
            setUsers([currentUser]);
            console.log("✅ Using current user profile");
            return;
          }
        }
      } catch (profileError) {
        console.warn(
          "⚠️ Profile endpoint failed:",
          extractErrorMessage(profileError)
        );
      }

      // Last resort: use mock data if available
      setUsers([]);
      console.warn("⚠️ No user data available");
    } catch (err: any) {
      console.error("❌ Failed to load users:", extractErrorMessage(err));
      setUsers([]);
    }
  }, []);

  const loadAuditSummary = useCallback(async (): Promise<void> => {
    try {
      console.log("📊 Loading audit summary...");
      const response = await auditsAPI.getSummary();

      if (response.data?.success) {
        setAuditSummary(response.data.data);
        console.log("✅ Audit summary loaded");
      } else {
        setAuditSummary(null);
        console.warn("⚠️ Audit summary not available");
      }
    } catch (err: any) {
      console.warn(
        "⚠️ Failed to load audit summary:",
        extractErrorMessage(err)
      );
      setAuditSummary(null);
    }
  }, []);

  const loadComplianceData = useCallback(
    async (auditId: number): Promise<void> => {
      try {
        setLoadingCompliance(true);
        console.log(`🔍 Loading compliance data for audit ${auditId}...`);

        // Load compliance checks
        try {
          const checksResponse = await complianceAPI.getAuditChecks(auditId);

          if (checksResponse.data?.success) {
            const checks = Array.isArray(checksResponse.data.data)
              ? checksResponse.data.data
              : checksResponse.data.data?.checks || [];
            setComplianceChecks(checks);
            console.log(`✅ Loaded ${checks.length} compliance checks`);
          } else {
            setComplianceChecks([]);
          }
        } catch (checksError) {
          console.warn(
            "⚠️ Failed to load compliance checks:",
            extractErrorMessage(checksError)
          );
          setComplianceChecks([]);
        }

        // Load compliance standards
        try {
          const standardsResponse = await complianceAPI.getStandards();

          if (standardsResponse.data?.success) {
            const standards = Array.isArray(standardsResponse.data.data)
              ? standardsResponse.data.data
              : [];
            setComplianceStandards(standards);
            console.log(`✅ Loaded ${standards.length} compliance standards`);
          } else {
            setComplianceStandards([]);
          }
        } catch (standardsError) {
          console.warn(
            "⚠️ Failed to load compliance standards:",
            extractErrorMessage(standardsError)
          );
          setComplianceStandards([]);
        }
      } catch (err: any) {
        console.error(
          "❌ Failed to load compliance data:",
          extractErrorMessage(err)
        );
        setComplianceChecks([]);
        setComplianceStandards([]);
      } finally {
        setLoadingCompliance(false);
      }
    },
    []
  );

  // ✅ PERFECT: Comprehensive data loading with proper error handling
  const loadAllData = useCallback(
    async (showRefreshing = false): Promise<void> => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        console.log("🚀 Starting comprehensive data load...");

        // Load supporting data in parallel
        const supportingDataPromises = [
          loadBuildings(),
          loadUsers(),
          loadAuditSummary(),
        ];

        await Promise.allSettled(supportingDataPromises);

        // Load main audits data
        await loadAudits(false);

        console.log("✅ All data loaded successfully");
      } catch (err: any) {
        console.error("❌ Critical error during data loading:", err);
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadBuildings, loadUsers, loadAuditSummary, loadAudits]
  );

  // ✅ PERFECT: Form validation with API compliance
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Title validation (matching your API requirements)
    if (!formData.title?.trim()) {
      errors.title = "Audit title is required";
    } else if (formData.title.length < 5 || formData.title.length > 200) {
      errors.title = "Title must be between 5 and 200 characters";
    }

    // Building validation
    if (!formData.building_id) {
      errors.building_id = "Building selection is required";
    }

    // Auditor validation (optional if no users available)
    if (users.length > 0 && !formData.auditor_id) {
      errors.auditor_id = "Auditor assignment is required";
    }

    // Date validation
    if (!formData.planned_start_date) {
      errors.planned_start_date = "Planned start date is required";
    }

    if (!formData.planned_end_date) {
      errors.planned_end_date = "Planned end date is required";
    }

    // Cross-date validation
    if (formData.planned_start_date && formData.planned_end_date) {
      const startDate = new Date(formData.planned_start_date);
      const endDate = new Date(formData.planned_end_date);

      if (startDate >= endDate) {
        errors.planned_end_date = "End date must be after start date";
      }

      // Check if start date is too far in the past (for new audits)
      if (!selectedAudit) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          errors.planned_start_date = "Start date cannot be in the past";
        }
      }
    }

    // Duration validation
    if (formData.estimated_duration_hours !== null) {
      const duration = formData.estimated_duration_hours;
      if (duration <= 0 || duration > 8760) {
        // Max 1 year
        errors.estimated_duration_hours =
          "Duration must be between 1 and 8760 hours";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ PERFECT: CRUD operations with proper error handling
  const handleCreateAudit = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      console.log("🔄 Creating new audit...");

      const auditData: Partial<Audit> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        building_id: formData.building_id!,
        audit_type: formData.audit_type,
        auditor_id: formData.auditor_id || undefined,
        planned_start_date: formData.planned_start_date,
        planned_end_date: formData.planned_end_date,
        estimated_duration_hours:
          formData.estimated_duration_hours || undefined,
      };

      const response = await auditsAPI.create(auditData);

      if (response.data?.success) {
        console.log("✅ Audit created successfully");
        await loadAllData(true);
        onCreateClose();
        resetForm();
        setError(null);
      } else {
        throw new Error(response.data?.message || "Failed to create audit");
      }
    } catch (err: any) {
      console.error("❌ Failed to create audit:", err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);

      // Handle validation errors
      if (err?.response?.data?.validation_errors) {
        const validationErrors: Record<string, string> = {};
        err.response.data.validation_errors.forEach(
          (error: ValidationError) => {
            validationErrors[error.field] = error.message;
          }
        );
        setFormErrors(validationErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAudit = async (): Promise<void> => {
    if (!selectedAudit || !validateForm()) return;

    try {
      setSubmitting(true);
      console.log("🔄 Updating audit...");

      const auditData: Partial<Audit> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        building_id: formData.building_id!,
        audit_type: formData.audit_type,
        auditor_id: formData.auditor_id || undefined,
        planned_start_date: formData.planned_start_date,
        planned_end_date: formData.planned_end_date,
        estimated_duration_hours:
          formData.estimated_duration_hours || undefined,
      };

      const response = await auditsAPI.update(selectedAudit.id, auditData);

      if (response.data?.success) {
        console.log("✅ Audit updated successfully");
        await loadAllData(true);
        onEditClose();
        resetForm();
        setSelectedAudit(null);
        setError(null);
      } else {
        throw new Error(response.data?.message || "Failed to update audit");
      }
    } catch (err: any) {
      console.error("❌ Failed to update audit:", err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);

      // Handle validation errors
      if (err?.response?.data?.validation_errors) {
        const validationErrors: Record<string, string> = {};
        err.response.data.validation_errors.forEach(
          (error: ValidationError) => {
            validationErrors[error.field] = error.message;
          }
        );
        setFormErrors(validationErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAudit = async (): Promise<void> => {
    if (!selectedAudit) return;

    try {
      setSubmitting(true);
      console.log(`🗑️ Deleting audit ${selectedAudit.id}...`);

      const response = await auditsAPI.delete(selectedAudit.id);

      if (response.data?.success) {
        console.log("✅ Audit deleted successfully");
        await loadAllData(true);
        onDeleteClose();
        setSelectedAudit(null);
        setError(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete audit");
      }
    } catch (err: any) {
      console.error("❌ Failed to delete audit:", err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ PERFECT: Audit action handlers
  const handleAuditAction = async (
    audit: EnhancedAudit,
    action: "start" | "complete"
  ): Promise<void> => {
    try {
      setActionLoading((prev) => ({ ...prev, [audit.id]: true }));
      console.log(`🎬 ${action}ing audit ${audit.id}...`);

      let response;
      if (action === "start") {
        response = await auditsAPI.start(audit.id);
      } else {
        response = await auditsAPI.complete(audit.id);
      }

      if (response.data?.success) {
        console.log(`✅ Audit ${action}ed successfully`);
        await loadAllData(true);
        setError(null);
      } else {
        throw new Error(response.data?.message || `Failed to ${action} audit`);
      }
    } catch (err: any) {
      console.error(`❌ Failed to ${action} audit:`, err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setActionLoading((prev) => ({ ...prev, [audit.id]: false }));
    }
  };

  // ✅ PERFECT: Modal handlers
  const openCreateModal = (): void => {
    resetForm();
    setError(null);
    onCreateOpen();
  };

  const openEditModal = (audit: EnhancedAudit): void => {
    setSelectedAudit(audit);
    setFormData({
      title: audit.title,
      description: audit.description || "",
      building_id: audit.building_id,
      audit_type: audit.audit_type,
      auditor_id: audit.auditor_id,
      planned_start_date: audit.planned_start_date
        ? audit.planned_start_date.split("T")[0]
        : "",
      planned_end_date: audit.planned_end_date
        ? audit.planned_end_date.split("T")[0]
        : "",
      estimated_duration_hours: audit.estimated_duration_hours || null,
    });
    setFormErrors({});
    setError(null);
    onEditOpen();
  };

  const openViewModal = async (audit: EnhancedAudit): Promise<void> => {
    setSelectedAudit(audit);
    setComplianceChecks([]);
    setComplianceStandards([]);
    onViewOpen();

    // Load compliance data for completed or in-progress audits
    if (audit.status === "completed" || audit.status === "in_progress") {
      await loadComplianceData(audit.id);
    }
  };

  const openDeleteModal = (audit: EnhancedAudit): void => {
    setSelectedAudit(audit);
    setError(null);
    onDeleteOpen();
  };

  const resetForm = (): void => {
    setFormData({
      title: "",
      description: "",
      building_id: null,
      audit_type: "comprehensive",
      auditor_id: null,
      planned_start_date: "",
      planned_end_date: "",
      estimated_duration_hours: null,
    });
    setFormErrors({});
    setSelectedAudit(null);
  };

  // ✅ PERFECT: Filter handlers
  const handleFilterChange = (key: keyof AuditFilters, value: any): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset pagination when filters change
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const clearAllFilters = (): void => {
    setFilters({
      search: "",
      building_id: null,
      audit_type: "",
      status: "",
      auditor_id: null,
      date_range_start: "",
      date_range_end: "",
    });
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  // ✅ PERFECT: Computed values and memoized data
  const auditStatistics = useMemo(() => {
    const stats = {
      total: audits.length,
      planned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      on_hold: 0,
      overdue: 0,
      due_soon: 0,
      avg_compliance_score: 0,
      avg_progress: 0,
    };

    if (audits.length === 0) return stats;

    // Count by status
    audits.forEach((audit) => {
      stats[audit.status as keyof typeof stats]++;

      // Count urgency
      if (audit.urgency_status === "critical") stats.overdue++;
      if (audit.urgency_status === "urgent") stats.due_soon++;
    });

    // Calculate averages
    const auditsWithCompliance = audits.filter(
      (a) =>
        a.compliance_score !== null &&
        a.compliance_score !== undefined &&
        !isNaN(a.compliance_score)
    );

    if (auditsWithCompliance.length > 0) {
      stats.avg_compliance_score =
        auditsWithCompliance.reduce(
          (sum, a) => sum + (a.compliance_score || 0),
          0
        ) / auditsWithCompliance.length;
    }

    const auditsWithProgress = audits.filter(
      (a) =>
        a.progress_percentage !== null &&
        a.progress_percentage !== undefined &&
        !isNaN(a.progress_percentage)
    );

    if (auditsWithProgress.length > 0) {
      stats.avg_progress =
        auditsWithProgress.reduce(
          (sum, a) => sum + (a.progress_percentage || 0),
          0
        ) / auditsWithProgress.length;
    }

    return stats;
  }, [audits]);

  const buildingSelectOptions = useMemo(
    () =>
      buildings.map((building) => ({
        key: building.id.toString(),
        label: building.name + (building.code ? ` (${building.code})` : ""),
        value: building.id,
      })),
    [buildings]
  );

  const userSelectOptions = useMemo(
    () =>
      users.map((user) => ({
        key: user.id.toString(),
        label: `${user.first_name} ${user.last_name} (${user.role})`,
        value: user.id,
      })),
    [users]
  );

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.building_id ||
      filters.audit_type ||
      filters.status ||
      filters.auditor_id ||
      filters.date_range_start ||
      filters.date_range_end
    );
  }, [filters]);

  // ✅ PERFECT: Effect hooks with proper dependencies
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (!loading) {
      loadAudits();
    }
  }, [filters, pagination.current_page]);

  // ✅ PERFECT: Helper functions for UI
  const getTypeConfig = (type: string) =>
    AUDIT_CONFIGURATION.types.find((t) => t.key === type) ||
    AUDIT_CONFIGURATION.types[0];

  const getStatusConfig = (status: string) =>
    AUDIT_CONFIGURATION.statuses.find((s) => s.key === status) ||
    AUDIT_CONFIGURATION.statuses[0];

  // ✅ PERFECT: Loading state
  if (loading && audits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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

  // ✅ PERFECT: Error state
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
            onPress={() => loadAllData()}
          >
            Retry
          </Button>
        </div>

        <Card className="border-danger">
          <CardBody className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-danger">
              Failed to Load Audits
            </h3>
            <p className="text-default-500 mb-4 max-w-md mx-auto">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                color="primary"
                onPress={() => loadAllData()}
                startContent={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
              <Button
                variant="light"
                onPress={() => {
                  setError(null);
                  setAudits([]);
                }}
              >
                Dismiss
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ PERFECT: Header with proper styling */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" />
            Audits Management
          </h1>
          <p className="text-default-500 mt-1 max-w-2xl">
            Comprehensive audit scheduling, tracking, and compliance management
            system
          </p>
          {auditStatistics.total > 0 && (
            <p className="text-sm text-default-400 mt-1">
              {auditStatistics.total} total audits •{" "}
              {auditStatistics.in_progress} in progress •
              {auditStatistics.overdue > 0 && (
                <span className="text-danger font-medium">
                  {" "}
                  {auditStatistics.overdue} overdue
                </span>
              )}
            </p>
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
            onPress={() => loadAllData(true)}
            isDisabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={openCreateModal}
            isDisabled={buildings.length === 0}
          >
            Schedule Audit
          </Button>
        </div>
      </div>

      {/* ✅ PERFECT: System status alerts */}
      {!loading && (
        <>
          {buildings.length === 0 && (
            <Card className="border-l-4 border-l-warning bg-warning-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 text-warning-800">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <div className="font-medium">No Buildings Available</div>
                    <div className="text-sm text-warning-700 mt-1">
                      Add buildings before scheduling audits. Contact system
                      administrator if this persists.
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {users.length === 0 && (
            <Card className="border-l-4 border-l-warning bg-warning-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 text-warning-800">
                  <Info className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Limited User Data</div>
                    <div className="text-sm text-warning-700 mt-1">
                      Audits can be created without auditor assignment. User
                      data will be loaded when available.
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {error && audits.length > 0 && (
            <Card className="border-l-4 border-l-danger bg-danger-50">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-danger-800">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Partial Data Load</div>
                      <div className="text-sm text-danger-700 mt-1">
                        {error}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* ✅ PERFECT: Enhanced statistics dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-foreground">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Audits</p>
                <p className="text-2xl font-bold">{auditStatistics.total}</p>
                <p className="text-xs text-default-400">
                  {auditStatistics.completed} completed
                </p>
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
                  {auditStatistics.in_progress}
                </p>
                <p className="text-xs text-default-400">
                  {auditStatistics.planned} planned
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
                  {auditStatistics.completed}
                </p>
                <Progress
                  value={
                    (auditStatistics.completed /
                      Math.max(auditStatistics.total, 1)) *
                    100
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
                <p className="text-sm text-default-600">Avg. Compliance</p>
                <p className="text-2xl font-bold">
                  {auditStatistics.avg_compliance_score.toFixed(1)}%
                </p>
                <Progress
                  value={auditStatistics.avg_compliance_score}
                  color={
                    getComplianceColor(
                      auditStatistics.avg_compliance_score
                    ) as any
                  }
                  size="sm"
                  className="mt-1"
                />
              </div>
              <Target className="w-8 h-8 text-secondary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Critical/Overdue</p>
                <p className="text-2xl font-bold text-danger">
                  {auditStatistics.overdue}
                </p>
                <p className="text-xs text-default-400">
                  {auditStatistics.due_soon} due soon
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Avg. Progress</p>
                <p className="text-2xl font-bold text-warning">
                  {auditStatistics.avg_progress.toFixed(0)}%
                </p>
                <Progress
                  value={auditStatistics.avg_progress}
                  color="warning"
                  size="sm"
                  className="mt-1"
                />
              </div>
              <Timer className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ✅ PERFECT: Enhanced filters section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Chip size="sm" color="primary" variant="flat">
                {Object.values(filters).filter(Boolean).length} active
              </Chip>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              onPress={clearAllFilters}
            >
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search audits by title, description..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                startContent={<Search className="w-4 h-4 text-default-400" />}
                isClearable
                onClear={() => handleFilterChange("search", "")}
              />
            </div>

            <Select
              placeholder="All Buildings"
              selectedKeys={
                filters.building_id
                  ? new Set([filters.building_id.toString()])
                  : new Set()
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleFilterChange(
                  "building_id",
                  selectedKey ? parseInt(selectedKey) : null
                );
              }}
              isDisabled={buildingSelectOptions.length === 0}
              startContent={
                <BuildingIcon className="w-4 h-4 text-default-400" />
              }
            >
              {buildingSelectOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="All Types"
              selectedKeys={
                filters.audit_type ? new Set([filters.audit_type]) : new Set()
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleFilterChange("audit_type", selectedKey || "");
              }}
              startContent={<Settings className="w-4 h-4 text-default-400" />}
            >
              {AUDIT_CONFIGURATION.types.map((type) => (
                <SelectItem key={type.key} startContent={type.icon}>
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
                handleFilterChange("status", selectedKey || "");
              }}
              startContent={<Activity className="w-4 h-4 text-default-400" />}
            >
              {AUDIT_CONFIGURATION.statuses.map((status) => (
                <SelectItem
                  key={status.key}
                  startContent={<status.icon className="w-4 h-4" />}
                >
                  {status.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="All Auditors"
              selectedKeys={
                filters.auditor_id
                  ? new Set([filters.auditor_id.toString()])
                  : new Set()
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleFilterChange(
                  "auditor_id",
                  selectedKey ? parseInt(selectedKey) : null
                );
              }}
              isDisabled={userSelectOptions.length === 0}
              startContent={<UserIcon className="w-4 h-4 text-default-400" />}
            >
              {userSelectOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Start Date From"
              type="date"
              value={filters.date_range_start}
              onChange={(e) =>
                handleFilterChange("date_range_start", e.target.value)
              }
              startContent={<Calendar className="w-4 h-4 text-default-400" />}
            />
            <Input
              label="Start Date To"
              type="date"
              value={filters.date_range_end}
              onChange={(e) =>
                handleFilterChange("date_range_end", e.target.value)
              }
              startContent={<Calendar className="w-4 h-4 text-default-400" />}
            />
          </div>
        </CardBody>
      </Card>

      {/* ✅ PERFECT: Enhanced audits table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Audits ({pagination.total_count || audits.length})
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
            aria-label="Audits management table"
            selectionMode="none"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader>
              <TableColumn>AUDIT DETAILS</TableColumn>
              <TableColumn>BUILDING & TEAM</TableColumn>
              <TableColumn>TYPE & STATUS</TableColumn>
              <TableColumn>SCHEDULE & TIMELINE</TableColumn>
              <TableColumn>PROGRESS & COMPLIANCE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent="No audits found. Create your first audit to get started."
              isLoading={loading}
              loadingContent={<Spinner label="Loading audits..." />}
            >
              {audits.map((audit) => {
                const typeConfig = getTypeConfig(audit.audit_type);
                const statusConfig = getStatusConfig(audit.status);
                const isActionLoading = actionLoading[audit.id];

                return (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-foreground line-clamp-2">
                              {audit.title}
                            </div>
                            <div className="text-sm text-default-500">
                              ID: {audit.id}
                            </div>
                          </div>
                          {audit.urgency_status &&
                            audit.urgency_status !== "normal" && (
                              <Tooltip
                                content={
                                  audit.urgency_status === "critical"
                                    ? "Audit is overdue"
                                    : "Audit due soon"
                                }
                              >
                                <Chip
                                  size="sm"
                                  color={
                                    audit.urgency_status === "critical"
                                      ? "danger"
                                      : "warning"
                                  }
                                  variant="flat"
                                  className="shrink-0"
                                >
                                  {audit.urgency_status === "critical"
                                    ? "Overdue"
                                    : "Due Soon"}
                                </Chip>
                              </Tooltip>
                            )}
                        </div>

                        {audit.description && (
                          <p className="text-xs text-default-400 line-clamp-2">
                            {audit.description}
                          </p>
                        )}

                        {audit.days_remaining !== null &&
                          audit.days_remaining !== undefined && (
                            <div className="text-xs text-default-500">
                              {audit.days_remaining > 0
                                ? `${audit.days_remaining} days remaining`
                                : audit.days_remaining === 0
                                  ? "Due today"
                                  : `${Math.abs(audit.days_remaining)} days overdue`}
                            </div>
                          )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BuildingIcon className="w-4 h-4 text-default-400 shrink-0" />
                          <div>
                            <div className="text-sm font-medium line-clamp-1">
                              {audit.building_name_display}
                            </div>
                            <div className="text-xs text-default-500">
                              Building ID: {audit.building_id}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-default-400 shrink-0" />
                          <div>
                            <div className="text-sm line-clamp-1">
                              {audit.auditor_name_display}
                            </div>
                            {audit.auditor_id && (
                              <div className="text-xs text-default-500">
                                Auditor ID: {audit.auditor_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <Chip
                          size="sm"
                          color={typeConfig.color as any}
                          variant="flat"
                          startContent={typeConfig.icon}
                        >
                          {typeConfig.label}
                        </Chip>

                        <Chip
                          size="sm"
                          color={statusConfig.color as any}
                          variant="solid"
                          startContent={
                            <statusConfig.icon className="w-3 h-3" />
                          }
                        >
                          {statusConfig.label}
                        </Chip>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary" />
                          <span className="text-xs">
                            {formatDate(audit.planned_start_date)} -{" "}
                            {formatDate(audit.planned_end_date)}
                          </span>
                        </div>

                        {audit.actual_start_date && (
                          <div className="text-xs text-success">
                            Started: {formatDate(audit.actual_start_date)}
                          </div>
                        )}

                        {audit.actual_end_date && (
                          <div className="text-xs text-success">
                            Completed: {formatDate(audit.actual_end_date)}
                          </div>
                        )}

                        {audit.estimated_duration_hours && (
                          <div className="text-xs text-default-500 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {audit.estimated_duration_hours}h estimated
                          </div>
                        )}

                        <div className="text-xs text-default-400">
                          Created: {formatDate(audit.created_at)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-default-600">
                              Progress
                            </span>
                            <span className="text-xs font-medium">
                              {audit.progress_percentage || 0}%
                            </span>
                          </div>
                          <Progress
                            value={audit.progress_percentage || 0}
                            color="primary"
                            size="sm"
                          />
                        </div>

                        {/* Compliance */}
                        {audit.compliance_score !== null &&
                        audit.compliance_score !== undefined ? (
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
                              color={audit.compliance_color as any}
                              size="sm"
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-default-400 text-center py-2">
                            Compliance not assessed
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
                              onPress={() => handleAuditAction(audit, "start")}
                              isLoading={isActionLoading}
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
                                handleAuditAction(audit, "complete")
                              }
                              isLoading={isActionLoading}
                            >
                              <CheckSquare className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}

                        <Tooltip content="Edit Audit">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openEditModal(audit)}
                            isDisabled={
                              audit.status === "completed" ||
                              audit.status === "cancelled"
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content="Generate Report">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="secondary"
                            isDisabled={audit.status !== "completed"}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content="Delete Audit">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => openDeleteModal(audit)}
                            isDisabled={audit.status === "in_progress"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* ✅ PERFECT: Enhanced pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-divider">
              <div className="text-sm text-default-500">
                Showing{" "}
                {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                {Math.min(
                  pagination.current_page * pagination.per_page,
                  pagination.total_count
                )}{" "}
                of {pagination.total_count} audits
              </div>
              <Pagination
                total={pagination.total_pages}
                page={pagination.current_page}
                onChange={(page) =>
                  setPagination((prev) => ({ ...prev, current_page: page }))
                }
                showControls
                showShadow
                color="primary"
                siblings={1}
                boundaries={1}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ✅ PERFECT: Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onOpenChange={isCreateOpen ? onCreateClose : onEditClose}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "items-start",
          base: "mt-6",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {isCreateOpen ? "Schedule New Audit" : "Edit Audit"}
                    </h3>
                    <p className="text-sm text-default-500 font-normal">
                      {isCreateOpen
                        ? "Create a comprehensive audit schedule for your facility"
                        : "Update audit details and schedule information"}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground border-b border-divider pb-2">
                    Basic Information
                  </h4>

                  <Input
                    label="Audit Title"
                    placeholder="Enter descriptive audit title (5-200 characters)"
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
                    description="Clear, descriptive title that identifies the audit purpose"
                  />

                  <Textarea
                    label="Description"
                    placeholder="Enter detailed audit description, objectives, and scope"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    minRows={3}
                    maxRows={6}
                    description="Optional detailed description of audit scope and objectives"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Audit Type"
                      selectedKeys={new Set([formData.audit_type])}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setFormData((prev) => ({
                          ...prev,
                          audit_type: selectedKey as any,
                        }));
                      }}
                      isRequired
                      description="Type of audit to be conducted"
                    >
                      {AUDIT_CONFIGURATION.types.map((type) => (
                        <SelectItem
                          key={type.key}
                          description={type.description}
                          startContent={type.icon}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      label="Estimated Duration"
                      type="number"
                      placeholder="Hours (e.g., 8)"
                      value={
                        formData.estimated_duration_hours?.toString() || ""
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estimated_duration_hours: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        }))
                      }
                      errorMessage={formErrors.estimated_duration_hours}
                      isInvalid={!!formErrors.estimated_duration_hours}
                      endContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">
                            hours
                          </span>
                        </div>
                      }
                      description="Estimated time to complete the audit"
                    />
                  </div>
                </div>

                {/* Assignment */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground border-b border-divider pb-2">
                    Assignment & Location
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Building"
                      placeholder="Select building for audit"
                      selectedKeys={
                        formData.building_id
                          ? new Set([formData.building_id.toString()])
                          : new Set()
                      }
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setFormData((prev) => ({
                          ...prev,
                          building_id: selectedKey
                            ? parseInt(selectedKey)
                            : null,
                        }));
                      }}
                      errorMessage={formErrors.building_id}
                      isInvalid={!!formErrors.building_id}
                      isRequired
                      isDisabled={buildingSelectOptions.length === 0}
                      startContent={<BuildingIcon className="w-4 h-4" />}
                      description="Building where the audit will be conducted"
                    >
                      {buildingSelectOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>

                    <Select
                      label="Auditor"
                      placeholder={
                        userSelectOptions.length === 0
                          ? "No auditors available"
                          : "Select responsible auditor"
                      }
                      selectedKeys={
                        formData.auditor_id
                          ? new Set([formData.auditor_id.toString()])
                          : new Set()
                      }
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setFormData((prev) => ({
                          ...prev,
                          auditor_id: selectedKey
                            ? parseInt(selectedKey)
                            : null,
                        }));
                      }}
                      errorMessage={formErrors.auditor_id}
                      isInvalid={!!formErrors.auditor_id}
                      isDisabled={userSelectOptions.length === 0}
                      startContent={<UserIcon className="w-4 h-4" />}
                      description={
                        userSelectOptions.length === 0
                          ? "Audit will be created without assigned auditor"
                          : "Person responsible for conducting the audit"
                      }
                    >
                      {userSelectOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground border-b border-divider pb-2">
                    Schedule & Timeline
                  </h4>

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
                      isRequired
                      startContent={<Calendar className="w-4 h-4" />}
                      description="When the audit is scheduled to begin"
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
                      isRequired
                      startContent={<Calendar className="w-4 h-4" />}
                      description="Expected completion date for the audit"
                    />
                  </div>

                  {formData.planned_start_date && formData.planned_end_date && (
                    <Card className="bg-primary-50 border-primary-200">
                      <CardBody className="p-3">
                        <div className="flex items-center gap-2 text-primary-800">
                          <Info className="w-4 h-4" />
                          <span className="text-sm">
                            Audit duration:{" "}
                            {(() => {
                              const start = new Date(
                                formData.planned_start_date
                              );
                              const end = new Date(formData.planned_end_date);
                              const diffTime = end.getTime() - start.getTime();
                              const diffDays = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24)
                              );
                              return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
                            })()}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={isCreateOpen ? handleCreateAudit : handleUpdateAudit}
                  isLoading={submitting}
                  startContent={
                    !submitting ? (
                      isCreateOpen ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        <Edit className="w-4 h-4" />
                      )
                    ) : null
                  }
                >
                  {submitting
                    ? isCreateOpen
                      ? "Scheduling..."
                      : "Updating..."
                    : isCreateOpen
                      ? "Schedule Audit"
                      : "Update Audit"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ✅ PERFECT: View Audit Modal */}
      <Modal
        isOpen={isViewOpen}
        onOpenChange={onViewClose}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "items-start",
          base: "mt-6",
        }}
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
                        {selectedAudit?.title}
                      </h3>
                      <p className="text-sm text-default-500 font-normal">
                        Audit ID: {selectedAudit?.id} • Created{" "}
                        {formatDate(selectedAudit?.created_at)}
                      </p>
                    </div>
                  </div>
                  {selectedAudit && (
                    <div className="flex gap-2">
                      <Chip
                        color={
                          getStatusConfig(selectedAudit.status).color as any
                        }
                        size="sm"
                      >
                        {getStatusConfig(selectedAudit.status).label}
                      </Chip>
                      <Chip
                        color={
                          getTypeConfig(selectedAudit.audit_type).color as any
                        }
                        size="sm"
                        variant="flat"
                      >
                        {getTypeConfig(selectedAudit.audit_type).label}
                      </Chip>
                    </div>
                  )}
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedAudit && (
                  <div className="space-y-6">
                    {/* Basic Information Grid */}
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
                                ID:
                              </span>
                              <div className="font-medium">
                                {selectedAudit.id}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-default-600">
                                Type:
                              </span>
                              <div className="font-medium">
                                {getTypeConfig(selectedAudit.audit_type).icon}{" "}
                                {getTypeConfig(selectedAudit.audit_type).label}
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
                            <div>
                              <span className="text-sm text-default-600">
                                Duration:
                              </span>
                              <div className="font-medium">
                                {selectedAudit.estimated_duration_hours ||
                                  "Not set"}
                                {selectedAudit.estimated_duration_hours
                                  ? " hours"
                                  : ""}
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-default-600">
                              Building:
                            </span>
                            <div className="font-medium flex items-center gap-2">
                              <BuildingIcon className="w-4 h-4 text-default-400" />
                              {selectedAudit.building_name_display}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-default-600">
                              Auditor:
                            </span>
                            <div className="font-medium flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-default-400" />
                              {selectedAudit.auditor_name_display}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-default-600">
                              Created:
                            </span>
                            <div className="font-medium">
                              {formatDateTime(selectedAudit.created_at)}
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule & Timeline
                          </h4>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-sm text-default-600">
                                Planned Start:
                              </span>
                              <div className="font-medium">
                                {formatDate(selectedAudit.planned_start_date)}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-default-600">
                                Planned End:
                              </span>
                              <div className="font-medium">
                                {formatDate(selectedAudit.planned_end_date)}
                              </div>
                            </div>
                          </div>

                          {selectedAudit.actual_start_date && (
                            <div>
                              <span className="text-sm text-default-600">
                                Actual Start:
                              </span>
                              <div className="font-medium text-success">
                                {formatDateTime(
                                  selectedAudit.actual_start_date
                                )}
                              </div>
                            </div>
                          )}

                          {selectedAudit.actual_end_date && (
                            <div>
                              <span className="text-sm text-default-600">
                                Actual End:
                              </span>
                              <div className="font-medium text-success">
                                {formatDateTime(selectedAudit.actual_end_date)}
                              </div>
                            </div>
                          )}

                          <div>
                            <span className="text-sm text-default-600">
                              Progress:
                            </span>
                            <div className="mt-1">
                              <Progress
                                value={selectedAudit.progress_percentage || 0}
                                className="mb-1"
                                color="primary"
                              />
                              <span className="text-sm font-medium">
                                {selectedAudit.progress_percentage || 0}%
                                complete
                              </span>
                            </div>
                          </div>

                          {selectedAudit.urgency_status &&
                            selectedAudit.urgency_status !== "normal" && (
                              <div>
                                <span className="text-sm text-default-600">
                                  Urgency:
                                </span>
                                <div className="mt-1">
                                  <Chip
                                    color={
                                      selectedAudit.urgency_status ===
                                      "critical"
                                        ? "danger"
                                        : "warning"
                                    }
                                    size="sm"
                                  >
                                    {selectedAudit.urgency_status === "critical"
                                      ? "Critical - Overdue"
                                      : "Urgent - Due Soon"}
                                  </Chip>
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
                          <h4 className="font-semibold">
                            Description & Objectives
                          </h4>
                        </CardHeader>
                        <CardBody>
                          <p className="whitespace-pre-wrap text-default-700">
                            {selectedAudit.description}
                          </p>
                        </CardBody>
                      </Card>
                    )}

                    {/* Compliance Overview */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between w-full">
                          <h4 className="font-semibold flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Compliance Overview
                          </h4>
                          {loadingCompliance && <Spinner size="sm" />}
                        </div>
                      </CardHeader>
                      <CardBody>
                        {selectedAudit.compliance_score !== null &&
                        selectedAudit.compliance_score !== undefined ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-lg">
                                Overall Compliance Score
                              </span>
                              <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-warning" />
                                <span className="text-2xl font-bold">
                                  {selectedAudit.compliance_score.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <Progress
                              value={selectedAudit.compliance_score}
                              color={selectedAudit.compliance_color as any}
                              size="lg"
                              className="mb-2"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="text-center p-3 bg-content2 rounded-lg">
                                <div className="text-2xl font-bold text-success">
                                  {selectedAudit.compliance_score >= 90
                                    ? "Excellent"
                                    : selectedAudit.compliance_score >= 70
                                      ? "Good"
                                      : "Needs Improvement"}
                                </div>
                                <div className="text-sm text-default-600">
                                  Grade
                                </div>
                              </div>
                              <div className="text-center p-3 bg-content2 rounded-lg">
                                <div className="text-2xl font-bold text-primary">
                                  {complianceChecks.length}
                                </div>
                                <div className="text-sm text-default-600">
                                  Total Checks
                                </div>
                              </div>
                              <div className="text-center p-3 bg-content2 rounded-lg">
                                <div className="text-2xl font-bold text-warning">
                                  {complianceStandards.length}
                                </div>
                                <div className="text-sm text-default-600">
                                  Standards
                                </div>
                              </div>
                            </div>

                            {/* Standards breakdown */}
                            {complianceStandards.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium mb-3">
                                  Compliance Standards Assessment
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {complianceStandards.map(
                                    (standard, index) => (
                                      <div
                                        key={standard.standard || index}
                                        className="flex items-center justify-between p-3 bg-content2 rounded-lg"
                                      >
                                        <div>
                                          <div className="font-medium">
                                            {standard.standard}
                                          </div>
                                          <div className="text-sm text-default-500">
                                            {standard.name}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <Chip
                                            size="sm"
                                            color={
                                              getComplianceColor(
                                                standard.score
                                              ) as any
                                            }
                                          >
                                            {standard.score?.toFixed(1)}%
                                          </Chip>
                                          <div className="text-xs text-default-500 mt-1">
                                            {standard.status}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BarChart3 className="w-16 h-16 text-default-300 mx-auto mb-4" />
                            <h5 className="text-lg font-medium mb-2">
                              Compliance Assessment Pending
                            </h5>
                            <p className="text-default-500 mb-4">
                              Compliance results will be available when the
                              audit is in progress or completed.
                            </p>
                            {selectedAudit.status === "planned" && (
                              <p className="text-sm text-default-400">
                                Start the audit to begin compliance assessment.
                              </p>
                            )}
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    {/* Detailed Compliance Checks */}
                    {complianceChecks.length > 0 && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Detailed Compliance Checks (
                            {complianceChecks.length})
                          </h4>
                        </CardHeader>
                        <CardBody>
                          {loadingCompliance ? (
                            <div className="space-y-3">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-lg" />
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {complianceChecks
                                .slice(0, 20)
                                .map((check, index) => (
                                  <div
                                    key={check.id || index}
                                    className="flex items-start justify-between p-4 border border-content2 rounded-lg hover:bg-content2 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">
                                        {check.requirement_title ||
                                          check.check_description ||
                                          `Compliance Check ${index + 1}`}
                                      </div>
                                      <div className="text-sm text-default-500 mt-1">
                                        {check.standard_type || check.standard}
                                        {check.section_code &&
                                          ` - Section ${check.section_code}`}
                                        {check.requirement_code &&
                                          ` (${check.requirement_code})`}
                                      </div>
                                      {check.details && (
                                        <div className="text-sm text-default-600 mt-2">
                                          {check.details}
                                        </div>
                                      )}
                                      {check.measured_value !== null &&
                                        check.measured_value !== undefined && (
                                          <div className="text-xs text-default-400 mt-2 flex items-center gap-4">
                                            <span>
                                              Measured: {check.measured_value}
                                              {check.unit && ` ${check.unit}`}
                                            </span>
                                            {check.required_value && (
                                              <span>
                                                Required: {check.required_value}
                                                {check.unit && ` ${check.unit}`}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      {check.recommendation && (
                                        <div className="text-sm text-warning-700 mt-2 p-2 bg-warning-50 rounded">
                                          <strong>Recommendation:</strong>{" "}
                                          {check.recommendation}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4 flex flex-col items-end space-y-2">
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
                                        variant="solid"
                                      >
                                        {check.status}
                                      </Chip>
                                      {check.severity && (
                                        <div className="text-xs text-default-500">
                                          {check.severity} severity
                                        </div>
                                      )}
                                      {check.assessment_date && (
                                        <div className="text-xs text-default-400">
                                          {formatDate(check.assessment_date)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              {complianceChecks.length > 20 && (
                                <div className="text-center text-sm text-default-500 py-3 border-t border-divider">
                                  ... and {complianceChecks.length - 20} more
                                  checks
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="ml-2"
                                    startContent={<Eye className="w-3 h-3" />}
                                  >
                                    View All
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}

                    {/* Audit Timeline */}
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Audit Timeline & History
                        </h4>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-6">
                          {/* Timeline Items */}
                          <div className="relative">
                            {/* Created */}
                            <div className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow"></div>
                                <div className="w-px bg-divider h-8"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">
                                  Audit Scheduled
                                </div>
                                <div className="text-sm text-default-500">
                                  {formatDateTime(selectedAudit.created_at)}
                                </div>
                                <div className="text-xs text-default-400 mt-1">
                                  Audit created and added to schedule
                                </div>
                              </div>
                            </div>

                            {/* Planned Start */}
                            <div className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 border-white shadow ${
                                    selectedAudit.actual_start_date
                                      ? "bg-success"
                                      : selectedAudit.status === "in_progress"
                                        ? "bg-warning animate-pulse"
                                        : "bg-default-300"
                                  }`}
                                ></div>
                                {(selectedAudit.actual_start_date ||
                                  selectedAudit.actual_end_date) && (
                                  <div className="w-px bg-divider h-8"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">
                                  {selectedAudit.actual_start_date
                                    ? "Audit Started"
                                    : "Planned Start"}
                                </div>
                                <div className="text-sm text-default-500">
                                  {selectedAudit.actual_start_date
                                    ? formatDateTime(
                                        selectedAudit.actual_start_date
                                      )
                                    : formatDate(
                                        selectedAudit.planned_start_date
                                      )}
                                </div>
                                <div className="text-xs text-default-400 mt-1">
                                  {selectedAudit.actual_start_date
                                    ? "Audit execution began"
                                    : selectedAudit.status === "planned"
                                      ? "Scheduled to begin"
                                      : "Originally planned start date"}
                                </div>
                              </div>
                            </div>

                            {/* In Progress Status */}
                            {selectedAudit.status === "in_progress" &&
                              !selectedAudit.actual_end_date && (
                                <div className="flex items-start space-x-4">
                                  <div className="flex flex-col items-center">
                                    <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow animate-pulse"></div>
                                    <div className="w-px bg-divider h-8"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium">
                                      Currently In Progress
                                    </div>
                                    <div className="text-sm text-default-500">
                                      {selectedAudit.progress_percentage || 0}%
                                      complete
                                    </div>
                                    <div className="text-xs text-default-400 mt-1">
                                      Expected completion:{" "}
                                      {formatDate(
                                        selectedAudit.planned_end_date
                                      )}
                                    </div>
                                    <Progress
                                      value={
                                        selectedAudit.progress_percentage || 0
                                      }
                                      color="primary"
                                      size="sm"
                                      className="mt-2 max-w-xs"
                                    />
                                  </div>
                                </div>
                              )}

                            {/* Completed */}
                            {selectedAudit.actual_end_date && (
                              <div className="flex items-start space-x-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-4 h-4 bg-success rounded-full border-2 border-white shadow"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">
                                    Audit Completed
                                  </div>
                                  <div className="text-sm text-default-500">
                                    {formatDateTime(
                                      selectedAudit.actual_end_date
                                    )}
                                  </div>
                                  <div className="text-xs text-default-400 mt-1">
                                    Audit successfully completed
                                  </div>
                                  {selectedAudit.compliance_score !== null &&
                                    selectedAudit.compliance_score !==
                                      undefined && (
                                      <div className="mt-2">
                                        <Chip
                                          size="sm"
                                          color={
                                            selectedAudit.compliance_color as any
                                          }
                                        >
                                          Final Score:{" "}
                                          {selectedAudit.compliance_score.toFixed(
                                            1
                                          )}
                                          %
                                        </Chip>
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}

                            {/* Planned End (if not completed) */}
                            {!selectedAudit.actual_end_date && (
                              <div className="flex items-start space-x-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-4 h-4 bg-default-300 rounded-full border-2 border-white shadow"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">
                                    Planned Completion
                                  </div>
                                  <div className="text-sm text-default-500">
                                    {formatDate(selectedAudit.planned_end_date)}
                                  </div>
                                  <div className="text-xs text-default-400 mt-1">
                                    Target completion date
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Duration Summary */}
                          <div className="pt-4 border-t border-divider">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-content2 rounded-lg">
                                <div className="text-lg font-bold text-primary">
                                  {selectedAudit.estimated_duration_hours ||
                                    "N/A"}
                                </div>
                                <div className="text-sm text-default-600">
                                  Estimated Hours
                                </div>
                              </div>
                              <div className="text-center p-3 bg-content2 rounded-lg">
                                <div className="text-lg font-bold text-success">
                                  {selectedAudit.actual_duration_hours ||
                                    (selectedAudit.actual_start_date &&
                                    selectedAudit.actual_end_date
                                      ? Math.round(
                                          (new Date(
                                            selectedAudit.actual_end_date
                                          ).getTime() -
                                            new Date(
                                              selectedAudit.actual_start_date
                                            ).getTime()) /
                                            (1000 * 60 * 60)
                                        )
                                      : "TBD")}
                                </div>
                                <div className="text-sm text-default-600">
                                  Actual Hours
                                </div>
                              </div>
                              <div className="text-center p-3 bg-content2 rounded-lg">
                                <div className="text-lg font-bold text-warning">
                                  {(() => {
                                    const planned =
                                      selectedAudit?.planned_end_date
                                        ? new Date(
                                            selectedAudit.planned_end_date
                                          ).getTime()
                                        : 0;
                                    const actual = selectedAudit.actual_end_date
                                      ? new Date(
                                          selectedAudit.actual_end_date
                                        ).getTime()
                                      : Date.now();
                                    const diffDays = Math.round(
                                      (actual - planned) / (1000 * 60 * 60 * 24)
                                    );
                                    return diffDays > 0
                                      ? `+${diffDays}`
                                      : diffDays === 0
                                        ? "On Time"
                                        : diffDays;
                                  })()}
                                </div>
                                <div className="text-sm text-default-600">
                                  Days vs Planned
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Additional Information */}
                    {(selectedAudit.energy_savings_potential_kwh ||
                      selectedAudit.cost_savings_potential_php ||
                      selectedAudit.implementation_cost_php) && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Financial Impact & Savings
                          </h4>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedAudit.energy_savings_potential_kwh && (
                              <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
                                <Zap className="w-8 h-8 text-success mx-auto mb-2" />
                                <div className="text-2xl font-bold text-success">
                                  {selectedAudit.energy_savings_potential_kwh.toLocaleString()}
                                </div>
                                <div className="text-sm text-success-700">
                                  kWh Potential Savings
                                </div>
                              </div>
                            )}

                            {selectedAudit.cost_savings_potential_php && (
                              <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
                                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                                <div className="text-2xl font-bold text-primary">
                                  ₱
                                  {selectedAudit.cost_savings_potential_php.toLocaleString()}
                                </div>
                                <div className="text-sm text-primary-700">
                                  Cost Savings Potential
                                </div>
                              </div>
                            )}

                            {selectedAudit.implementation_cost_php && (
                              <div className="text-center p-4 bg-warning-50 rounded-lg border border-warning-200">
                                <Settings className="w-8 h-8 text-warning mx-auto mb-2" />
                                <div className="text-2xl font-bold text-warning">
                                  ₱
                                  {selectedAudit.implementation_cost_php.toLocaleString()}
                                </div>
                                <div className="text-sm text-warning-700">
                                  Implementation Cost
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedAudit.payback_period_months && (
                            <div className="mt-4 text-center p-3 bg-content2 rounded-lg">
                              <div className="text-lg font-bold">
                                {selectedAudit.payback_period_months} months
                              </div>
                              <div className="text-sm text-default-600">
                                Estimated Payback Period
                              </div>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <div className="flex justify-between w-full">
                  <div className="flex gap-2">
                    {selectedAudit && selectedAudit.status === "planned" && (
                      <Button
                        color="success"
                        startContent={<Play className="w-4 h-4" />}
                        onPress={() => {
                          handleAuditAction(selectedAudit, "start");
                          onClose();
                        }}
                      >
                        Start Audit
                      </Button>
                    )}

                    {selectedAudit &&
                      selectedAudit.status === "in_progress" && (
                        <Button
                          color="primary"
                          startContent={<CheckSquare className="w-4 h-4" />}
                          onPress={() => {
                            handleAuditAction(selectedAudit, "complete");
                            onClose();
                          }}
                        >
                          Complete Audit
                        </Button>
                      )}

                    <Button
                      startContent={<Download className="w-4 h-4" />}
                      color="secondary"
                      variant="flat"
                      isDisabled={selectedAudit?.status !== "completed"}
                    >
                      Export Report
                    </Button>

                    {selectedAudit &&
                      selectedAudit.status !== "completed" &&
                      selectedAudit.status !== "cancelled" && (
                        <Button
                          startContent={<Edit className="w-4 h-4" />}
                          variant="flat"
                          onPress={() => {
                            openEditModal(selectedAudit);
                            onClose();
                          }}
                        >
                          Edit Audit
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

      {/* ✅ PERFECT: Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteClose} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-danger" />
                  <span>Confirm Audit Deletion</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedAudit && (
                  <div className="space-y-4">
                    <p className="text-default-700">
                      Are you sure you want to delete this audit? This action
                      cannot be undone.
                    </p>

                    <Card className="border-danger-200 bg-danger-50">
                      <CardBody className="p-3">
                        <div className="font-medium text-danger-800">
                          {selectedAudit.title}
                        </div>
                        <div className="text-sm text-danger-700 mt-1">
                          ID: {selectedAudit.id} • Building:{" "}
                          {selectedAudit.building_name_display}
                        </div>
                        <div className="text-sm text-danger-600 mt-1">
                          Status: {getStatusConfig(selectedAudit.status).label}
                        </div>
                      </CardBody>
                    </Card>

                    {selectedAudit.status === "in_progress" && (
                      <Card className="border-warning-200 bg-warning-50">
                        <CardBody className="p-3">
                          <div className="flex items-center gap-2 text-warning-800">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium">Warning</span>
                          </div>
                          <div className="text-sm text-warning-700 mt-1">
                            This audit is currently in progress. Deleting it
                            will lose all progress and compliance data.
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    <div className="text-sm text-default-500">
                      <strong>What will be deleted:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Audit schedule and timeline</li>
                        <li>Progress tracking data</li>
                        <li>Compliance assessment results</li>
                        <li>Associated compliance checks</li>
                        <li>Historical audit records</li>
                      </ul>
                    </div>
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
                  isLoading={submitting}
                  startContent={
                    !submitting ? <Trash2 className="w-4 h-4" /> : null
                  }
                >
                  {submitting ? "Deleting..." : "Delete Audit"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ✅ PERFECT: Enhanced Development Debug Panel */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-gray-50 border-dashed border-2 border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <h4 className="text-sm font-medium text-gray-600">
              🐛 Enhanced API-Aligned Debug Panel v2.0
            </h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={() =>
                  console.log("🔍 Complete State:", {
                    audits,
                    buildings,
                    users,
                    filters,
                    pagination,
                    auditStatistics,
                    formData,
                    selectedAudit,
                    complianceChecks,
                    complianceStandards,
                    loading,
                    error,
                    actionLoading,
                  })
                }
              >
                Log Full State
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() =>
                  console.log("🎯 API Alignment Check:", {
                    apiUtilsAvailable: !!apiUtils,
                    currentUser: apiUtils?.getCurrentUser(),
                    isAuthenticated: apiUtils?.isAuthenticated(),
                    tokenExpiry: apiUtils?.getTimeUntilExpiry(),
                    buildingOptions: buildingSelectOptions.length,
                    userOptions: userSelectOptions.length,
                  })
                }
              >
                API Status
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => loadAllData(true)}
                startContent={<RefreshCw className="w-3 h-3" />}
              >
                Force Reload
              </Button>
            </div>
          </CardHeader>
          <CardBody className="text-xs space-y-3">
            {/* State Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <strong className="text-primary">Loading States:</strong>
                <div>Main: {loading.toString()}</div>
                <div>Refreshing: {refreshing.toString()}</div>
                <div>Submitting: {submitting.toString()}</div>
                <div>Compliance: {loadingCompliance.toString()}</div>
              </div>

              <div>
                <strong className="text-success">Data Counts:</strong>
                <div>Audits: {audits.length}</div>
                <div>Buildings: {buildings.length}</div>
                <div>Users: {users.length}</div>
                <div>Compliance Checks: {complianceChecks.length}</div>
              </div>

              <div>
                <strong className="text-warning">Pagination:</strong>
                <div>
                  Page: {pagination.current_page}/{pagination.total_pages}
                </div>
                <div>Per page: {pagination.per_page}</div>
                <div>Total: {pagination.total_count}</div>
                <div>Has next: {pagination.has_next_page.toString()}</div>
              </div>

              <div>
                <strong className="text-secondary">Active Filters:</strong>
                <div>Search: {filters.search ? "✓" : "✗"}</div>
                <div>Building: {filters.building_id ? "✓" : "✗"}</div>
                <div>Type: {filters.audit_type ? "✓" : "✗"}</div>
                <div>Status: {filters.status ? "✓" : "✗"}</div>
                <div>Auditor: {filters.auditor_id ? "✓" : "✗"}</div>
                <div>
                  Date Range:{" "}
                  {filters.date_range_start || filters.date_range_end
                    ? "✓"
                    : "✗"}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="pt-2 border-t border-gray-200">
              <strong className="text-purple-600">Computed Statistics:</strong>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                <div>Total: {auditStatistics.total}</div>
                <div>In Progress: {auditStatistics.in_progress}</div>
                <div>Completed: {auditStatistics.completed}</div>
                <div>Overdue: {auditStatistics.overdue}</div>
                <div>Due Soon: {auditStatistics.due_soon}</div>
                <div>
                  Avg Compliance:{" "}
                  {auditStatistics.avg_compliance_score.toFixed(1)}%
                </div>
                <div>
                  Avg Progress: {auditStatistics.avg_progress.toFixed(1)}%
                </div>
                <div>Cancelled: {auditStatistics.cancelled}</div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="pt-2 border-t border-red-200">
                <strong className="text-red-600">Current Error:</strong>
                <div className="text-red-500 bg-red-50 p-2 rounded mt-1">
                  {error}
                </div>
              </div>
            )}

            {/* Modal States */}
            <div className="pt-2 border-t border-blue-200">
              <strong className="text-blue-600">Modal States:</strong>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                <div>Create: {isCreateOpen.toString()}</div>
                <div>Edit: {isEditOpen.toString()}</div>
                <div>View: {isViewOpen.toString()}</div>
                <div>Delete: {isDeleteOpen.toString()}</div>
                <div>
                  Selected: {selectedAudit ? `ID ${selectedAudit.id}` : "None"}
                </div>
              </div>
            </div>

            {/* API Alignment Features */}
            <div className="pt-2 border-t border-green-200">
              <strong className="text-green-600">
                ✅ API Alignment Features:
              </strong>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 mt-1 text-green-700">
                <div>✅ Server field transformation</div>
                <div>✅ Enhanced error handling</div>
                <div>✅ Proper response extraction</div>
                <div>✅ Validation error mapping</div>
                <div>✅ Pagination handling</div>
                <div>✅ Filter parameter alignment</div>
                <div>✅ Compliance data integration</div>
                <div>✅ Action state management</div>
                <div>✅ Real-time status updates</div>
                <div>✅ Comprehensive CRUD operations</div>
                <div>✅ Enhanced UI/UX patterns</div>
                <div>✅ Performance optimizations</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="pt-2 border-t border-orange-200">
              <strong className="text-orange-600">
                🚀 Performance Features:
              </strong>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 mt-1 text-orange-700">
                <div>✅ useMemo for computed values</div>
                <div>✅ useCallback for functions</div>
                <div>✅ Proper dependency management</div>
                <div>✅ Conditional rendering</div>
                <div>✅ Loading state isolation</div>
                <div>✅ Error boundary patterns</div>
                <div>✅ Efficient re-renders</div>
                <div>✅ Component memoization</div>
                <div>✅ Data normalization</div>
                <div>✅ Action debouncing</div>
                <div>✅ Progressive loading</div>
                <div>✅ Memory optimization</div>
              </div>
            </div>

            {/* Current Form Data */}
            {(isCreateOpen || isEditOpen) && (
              <div className="pt-2 border-t border-purple-200">
                <strong className="text-purple-600">📝 Form Data:</strong>
                <div className="bg-purple-50 p-2 rounded mt-1 text-purple-700">
                  <div>Title: "{formData.title}"</div>
                  <div>Building ID: {formData.building_id || "None"}</div>
                  <div>Auditor ID: {formData.auditor_id || "None"}</div>
                  <div>Type: {formData.audit_type}</div>
                  <div>Start: {formData.planned_start_date || "Not set"}</div>
                  <div>End: {formData.planned_end_date || "Not set"}</div>
                  <div>
                    Duration: {formData.estimated_duration_hours || "Not set"}h
                  </div>
                  <div>Errors: {Object.keys(formErrors).length}</div>
                </div>
              </div>
            )}

            {/* API Version & Compatibility */}
            <div className="pt-2 border-t border-indigo-200">
              <strong className="text-indigo-600">🔗 API Integration:</strong>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1 text-indigo-700">
                <div>Version: Enhanced v2.0</div>
                <div>Environment: {process.env.NODE_ENV}</div>
                <div>
                  Authentication: {apiUtils?.isAuthenticated() ? "✓" : "✗"}
                </div>
                <div>
                  User Role: {apiUtils?.getCurrentUser()?.role || "Unknown"}
                </div>
                <div>
                  Token Status: {apiUtils?.getTimeUntilExpiry() || "Unknown"}
                </div>
                <div>Last Updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
