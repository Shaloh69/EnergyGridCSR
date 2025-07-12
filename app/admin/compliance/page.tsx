// app/admin/compliance/page.tsx - FULLY FIXED VERSION WITH PROPER API INTEGRATION
"use client";

import React, { useState, useEffect, useCallback } from "react";

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
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";

// Icons
import {
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Eye,
  Edit,
  Plus,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Clock,
  Target,
  RefreshCw,
  Download,
  Search,
} from "lucide-react";

// ✅ FIXED: Correct API imports aligned with your system
import {
  complianceAPI,
  auditsAPI,
  buildingsAPI,
  dashboardAPI,
} from "@/lib/api";

// ✅ FIXED: Proper type imports from your API types
import type {
  Audit,
  Building,
  ComplianceCheck,
  AuditSummary,
  ComplianceSummary,
  ApiResponse,
  ApiError,
  AuditQueryParams,
} from "@/types/api-types";

import { AxiosError } from "axios";

// ✅ FIXED: Interfaces aligned with your actual API responses
interface ComplianceOverview {
  audit_id: number;
  overall_compliance: {
    score: number;
    status: string;
    total_checks: number;
    passed_checks: number;
    failed_checks: number;
    warnings: number;
  };
  standards_summary: StandardSummary[];
  detailed_checks: ComplianceCheck[];
  recommendations: string[];
  risk_assessment: {
    level: "low" | "medium" | "high" | "critical";
    critical_issues: number;
    major_issues: number;
    minor_issues: number;
  };
}

interface StandardSummary {
  standard: string;
  score: number;
  status: "compliant" | "non_compliant" | "partially_compliant";
  violations: number;
  last_assessment: string;
  requirements_met: number;
  total_requirements: number;
}

interface ComplianceTrends {
  building_info: {
    id: number;
    name: string;
    code: string;
  };
  trends: TrendDataPoint[];
  analysis: {
    trend_direction: "improving" | "stable" | "declining";
    improvement_rate: number;
    best_performing_standard: string;
    worst_performing_standard: string;
    recent_improvement: boolean;
    target_compliance_rate: number;
    gap_to_target: number;
  };
  performance_metrics: {
    monthly_average: number;
    quarterly_average: number;
    yearly_average: number;
    consistency_score: number;
  };
}

interface TrendDataPoint {
  date: string;
  compliance_rate: number;
  total_checks: number;
  compliant_checks: number;
  critical_violations: number;
  standard_breakdown: Record<string, number>;
}

// ✅ FIXED: Compliance standards based on your API types
const complianceStandards = [
  {
    key: "PEC2017",
    name: "PEC 2017",
    title: "Philippine Electrical Code",
    description:
      "Electrical installation and safety standards for the Philippines",
    color: "primary" as const,
  },
  {
    key: "OSHS",
    name: "OSHS",
    title: "Occupational Safety & Health Standards",
    description: "Workplace safety and health requirements",
    color: "warning" as const,
  },
  {
    key: "ISO25010",
    name: "ISO 25010",
    title: "Quality Evaluation Framework",
    description: "Software and system quality evaluation standards",
    color: "secondary" as const,
  },
  {
    key: "RA11285",
    name: "RA 11285",
    title: "Energy Efficiency & Conservation Act",
    description: "Philippine energy efficiency and conservation requirements",
    color: "success" as const,
  },
];

export default function ComprehensiveCompliancePage() {
  // ✅ FIXED: Proper state typing with your API types
  const [complianceData, setComplianceData] =
    useState<ComplianceOverview | null>(null);
  const [complianceTrends, setComplianceTrends] =
    useState<ComplianceTrends | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [dashboardSummary, setDashboardSummary] =
    useState<ComplianceSummary | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Filters and pagination
  const [selectedAudit, setSelectedAudit] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [standardFilter, setStandardFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal states
  const {
    isOpen: isRunCheckOpen,
    onOpen: onRunCheckOpen,
    onClose: onRunCheckClose,
  } = useDisclosure();
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const {
    isOpen: isCreateCheckOpen,
    onOpen: onCreateCheckOpen,
    onClose: onCreateCheckClose,
  } = useDisclosure();
  const {
    isOpen: isEditCheckOpen,
    onOpen: onEditCheckOpen,
    onClose: onEditCheckClose,
  } = useDisclosure();
  const {
    isOpen: isTrendsOpen,
    onOpen: onTrendsOpen,
    onClose: onTrendsClose,
  } = useDisclosure();

  // Selected items
  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheck | null>(
    null
  );
  const [editingCheck, setEditingCheck] = useState<ComplianceCheck | null>(
    null
  );

  // ✅ FIXED: Form data aligned with your API validation
  const [checkParams, setCheckParams] = useState({
    auditId: "", // Changed from audit_id to match frontend naming
    buildingId: "", // Changed from building_id to match frontend naming
    standardType: "PEC2017" as "PEC2017" | "OSHS" | "ISO25010" | "RA11285",
    checkData: {
      power_quality_readings: {
        voltage_thd_l1: "",
        voltage_thd_l2: "",
        voltage_thd_l3: "",
        thd_current: "",
        power_factor: "",
        voltage_unbalance: "",
        frequency: "",
      },
      safety_inspection: {
        electrical_panel_clearance_m: "",
        fire_extinguisher_count: "",
        emergency_exit_clearance: "",
        ground_fault_protection: false,
      },
      energy_efficiency: {
        power_factor_target: "0.95",
        energy_consumption_target: "",
        demand_factor: "",
      },
    },
  });

  const [newCheckData, setNewCheckData] = useState({
    audit_id: "",
    standard: "",
    requirement_code: "",
    requirement_title: "",
    requirement_description: "",
    status: "not_checked" as
      | "passed"
      | "failed"
      | "warning"
      | "not_applicable"
      | "not_checked",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    notes: "",
    corrective_action: "",
    target_completion_date: "",
    responsible_party: "",
    evidence: "",
  });

  // ✅ FIXED: Error handling aligned with your API error structure
  const handleApiError = (error: unknown, operation: string): string => {
    console.error(`${operation} failed:`, error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosError<ApiError>;

      // Handle validation errors
      if (axiosError.response?.data?.validation_errors) {
        const validationMessages = axiosError.response.data.validation_errors
          .map((err) => `${err.field}: ${err.message}`)
          .join(", ");
        return `Validation error: ${validationMessages}`;
      }

      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        `${operation} failed`;
      return message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return `${operation} failed`;
  };

  // ✅ FIXED: Safe number helpers
  const safeToFixed = (value: any, decimals: number = 1): string => {
    if (value === null || value === undefined || value === "") return "0.0";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue) ? "0.0" : numValue.toFixed(decimals);
  };

  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === "")
      return defaultValue;
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue) ? defaultValue : numValue;
  };

  const safeInteger = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === "")
      return defaultValue;
    const numValue = typeof value === "string" ? parseInt(value, 10) : value;
    return isNaN(numValue) ? defaultValue : numValue;
  };

  // ✅ FIXED: API loading with proper error handling and retry logic
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Loading initial data for compliance page...");

      // ✅ FIXED: Load audits with proper fallback strategy
      const loadAudits = async (): Promise<Audit[]> => {
        try {
          console.log("📋 Loading audits...");

          // Use your actual AuditQueryParams structure
          const auditParams: AuditQueryParams = {
            limit: 100,
            sortOrder: "DESC",
            status: "completed", // Focus on completed audits for compliance
          };

          const response = await auditsAPI.getAll(auditParams);

          if (response.data.success && Array.isArray(response.data.data)) {
            console.log(`✅ Loaded ${response.data.data.length} audits`);
            return response.data.data;
          } else {
            console.warn("⚠️ Audits API returned invalid data structure");
            return [];
          }
        } catch (error: unknown) {
          console.error("❌ Failed to load audits:", error);
          return [];
        }
      };

      // ✅ FIXED: Load buildings with proper query params
      const loadBuildings = async (): Promise<Building[]> => {
        try {
          console.log("🏢 Loading buildings...");

          const response = await buildingsAPI.getAll({
            status: "active",
            limit: 100,
          });

          if (response.data.success && Array.isArray(response.data.data)) {
            console.log(`✅ Loaded ${response.data.data.length} buildings`);
            return response.data.data;
          } else {
            console.warn("⚠️ Buildings API returned invalid data structure");
            return [];
          }
        } catch (error: unknown) {
          console.error("❌ Failed to load buildings:", error);
          return [];
        }
      };

      // ✅ FIXED: Load summaries with proper error handling
      const loadAuditSummary = async (): Promise<AuditSummary | null> => {
        try {
          console.log("📊 Loading audit summary...");
          const response = await auditsAPI.getSummary();

          if (response.data.success) {
            console.log("✅ Loaded audit summary");
            return response.data.data;
          } else {
            console.warn("⚠️ Audit summary API returned success:false");
            return null;
          }
        } catch (error: unknown) {
          console.error("❌ Failed to load audit summary:", error);
          return null;
        }
      };

      const loadDashboardSummary =
        async (): Promise<ComplianceSummary | null> => {
          try {
            console.log("📈 Loading compliance summary...");
            const response = await dashboardAPI.getComplianceSummary();

            if (response.data.success) {
              console.log("✅ Loaded compliance summary");
              return response.data.data;
            } else {
              console.warn("⚠️ Compliance summary API returned success:false");
              return null;
            }
          } catch (error: unknown) {
            console.error("❌ Failed to load compliance summary:", error);
            return null;
          }
        };

      // Execute all API calls concurrently
      const [
        auditsData,
        buildingsData,
        auditSummaryData,
        complianceSummaryData,
      ] = await Promise.allSettled([
        loadAudits(),
        loadBuildings(),
        loadAuditSummary(),
        loadDashboardSummary(),
      ]);

      // ✅ FIXED: Process results with proper error handling
      if (auditsData.status === "fulfilled") {
        setAudits(auditsData.value);
        if (auditsData.value.length > 0) {
          setSelectedAudit(auditsData.value[0].id.toString());
        }
      } else {
        console.error("❌ Audits loading failed:", auditsData.reason);
        setAudits([]);
      }

      if (buildingsData.status === "fulfilled") {
        setBuildings(buildingsData.value);
        if (buildingsData.value.length > 0) {
          setSelectedBuilding(buildingsData.value[0].id.toString());
        }
      } else {
        console.error("❌ Buildings loading failed:", buildingsData.reason);
        setBuildings([]);
      }

      if (auditSummaryData.status === "fulfilled" && auditSummaryData.value) {
        setAuditSummary(auditSummaryData.value);
      }

      if (
        complianceSummaryData.status === "fulfilled" &&
        complianceSummaryData.value
      ) {
        setDashboardSummary(complianceSummaryData.value);
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, "Loading initial data");
      setError(errorMessage);
      setAudits([]);
      setBuildings([]);
    } finally {
      setLoading(false);
      console.log("🏁 Initial data loading completed");
    }
  };

  // ✅ FIXED: Load compliance data using your actual API
  const loadComplianceData = useCallback(async () => {
    if (!selectedAudit) return;

    try {
      console.log(`🔍 Loading compliance data for audit ${selectedAudit}`);

      const response = await complianceAPI.getAuditChecks(
        Number(selectedAudit)
      );

      if (response.data.success) {
        setComplianceData(response.data.data);
        console.log("✅ Compliance data loaded successfully");
      } else {
        console.warn(
          "⚠️ Failed to load compliance data:",
          response.data.message
        );
        setComplianceData(null);
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, "Loading compliance data");
      console.error(errorMessage);
      setComplianceData(null);
    }
  }, [selectedAudit]);

  // ✅ FIXED: Load compliance trends using your actual API
  const loadComplianceTrends = useCallback(async () => {
    if (!selectedBuilding) return;

    try {
      console.log(
        `📈 Loading compliance trends for building ${selectedBuilding}`
      );

      const response = await complianceAPI.getTrends(
        Number(selectedBuilding),
        standardFilter || undefined
      );

      if (response.data.success) {
        setComplianceTrends(response.data.data);
        console.log("✅ Compliance trends loaded successfully");
      } else {
        console.warn(
          "⚠️ Failed to load compliance trends:",
          response.data.message
        );
        setComplianceTrends(null);
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, "Loading compliance trends");
      console.error(errorMessage);
      setComplianceTrends(null);
    }
  }, [selectedBuilding, standardFilter]);

  // ✅ FIXED: Run compliance check with proper API structure
  const runComplianceCheck = async () => {
    try {
      setChecking(true);

      // ✅ FIXED: Construct request data according to your API
      const requestData = {
        auditId: Number(checkParams.auditId),
        standardType: checkParams.standardType,
        checkData: {
          // Convert string values to numbers where needed
          power_quality_readings: {
            voltage_thd_l1: checkParams.checkData.power_quality_readings
              .voltage_thd_l1
              ? Number(
                  checkParams.checkData.power_quality_readings.voltage_thd_l1
                )
              : undefined,
            voltage_thd_l2: checkParams.checkData.power_quality_readings
              .voltage_thd_l2
              ? Number(
                  checkParams.checkData.power_quality_readings.voltage_thd_l2
                )
              : undefined,
            voltage_thd_l3: checkParams.checkData.power_quality_readings
              .voltage_thd_l3
              ? Number(
                  checkParams.checkData.power_quality_readings.voltage_thd_l3
                )
              : undefined,
            thd_current: checkParams.checkData.power_quality_readings
              .thd_current
              ? Number(checkParams.checkData.power_quality_readings.thd_current)
              : undefined,
            power_factor: checkParams.checkData.power_quality_readings
              .power_factor
              ? Number(
                  checkParams.checkData.power_quality_readings.power_factor
                )
              : undefined,
            voltage_unbalance: checkParams.checkData.power_quality_readings
              .voltage_unbalance
              ? Number(
                  checkParams.checkData.power_quality_readings.voltage_unbalance
                )
              : undefined,
            frequency: checkParams.checkData.power_quality_readings.frequency
              ? Number(checkParams.checkData.power_quality_readings.frequency)
              : undefined,
          },
          safety_inspection: {
            electrical_panel_clearance_m: checkParams.checkData
              .safety_inspection.electrical_panel_clearance_m
              ? Number(
                  checkParams.checkData.safety_inspection
                    .electrical_panel_clearance_m
                )
              : undefined,
            fire_extinguisher_count: checkParams.checkData.safety_inspection
              .fire_extinguisher_count
              ? Number(
                  checkParams.checkData.safety_inspection
                    .fire_extinguisher_count
                )
              : undefined,
            emergency_exit_clearance: checkParams.checkData.safety_inspection
              .emergency_exit_clearance
              ? Number(
                  checkParams.checkData.safety_inspection
                    .emergency_exit_clearance
                )
              : undefined,
            ground_fault_protection:
              checkParams.checkData.safety_inspection.ground_fault_protection,
          },
          energy_efficiency: {
            power_factor_target: Number(
              checkParams.checkData.energy_efficiency.power_factor_target
            ),
            energy_consumption_target: checkParams.checkData.energy_efficiency
              .energy_consumption_target
              ? Number(
                  checkParams.checkData.energy_efficiency
                    .energy_consumption_target
                )
              : undefined,
            demand_factor: checkParams.checkData.energy_efficiency.demand_factor
              ? Number(checkParams.checkData.energy_efficiency.demand_factor)
              : undefined,
          },
        },
      };

      console.log("🔄 Running compliance check with data:", requestData);

      const response = await complianceAPI.performCheck(requestData);

      if (response.data.success) {
        console.log("✅ Compliance check completed successfully");
        await loadComplianceData();
        onRunCheckClose();
      } else {
        console.error("❌ Compliance check failed:", response.data.message);
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, "Running compliance check");
      console.error(errorMessage);
    } finally {
      setChecking(false);
    }
  };

  // ✅ FIXED: Create compliance check with proper validation
  const createComplianceCheck = async () => {
    try {
      // Basic validation
      if (
        !newCheckData.audit_id ||
        !newCheckData.standard ||
        !newCheckData.requirement_code
      ) {
        console.error(
          "❌ Missing required fields for compliance check creation"
        );
        return;
      }

      console.log("🔄 Creating new compliance check:", newCheckData);

      // Note: This endpoint might need to be implemented on your backend
      // For now, we'll use a generic approach
      const response = await fetch("/api/compliance/checks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          ...newCheckData,
          audit_id: Number(newCheckData.audit_id),
        }),
      });

      if (response.ok) {
        console.log("✅ Compliance check created successfully");
        await loadComplianceData();
        onCreateCheckClose();

        // Reset form
        setNewCheckData({
          audit_id: "",
          standard: "",
          requirement_code: "",
          requirement_title: "",
          requirement_description: "",
          status: "not_checked",
          severity: "medium",
          notes: "",
          corrective_action: "",
          target_completion_date: "",
          responsible_party: "",
          evidence: "",
        });
      } else {
        const errorData = await response.json();
        console.error("❌ Failed to create compliance check:", errorData);
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, "Creating compliance check");
      console.error(errorMessage);
    }
  };

  // ✅ FIXED: Update compliance check
  const updateComplianceCheck = async () => {
    if (!editingCheck) return;

    try {
      console.log("🔄 Updating compliance check:", editingCheck.id);

      const response = await fetch(
        `/api/compliance/checks/${editingCheck.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            status: editingCheck.status,
            notes: editingCheck.notes,
            corrective_action: editingCheck.corrective_action,
            target_completion_date: editingCheck.target_completion_date,
            responsible_party: editingCheck.responsible_party,
            verification_method: editingCheck.notes,
            actual_completion_date:
              editingCheck.status === "passed"
                ? new Date().toISOString()
                : null,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Compliance check updated successfully");
        await loadComplianceData();
        onEditCheckClose();
        setEditingCheck(null);
      } else {
        const errorData = await response.json();
        console.error("❌ Failed to update compliance check:", errorData);
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, "Updating compliance check");
      console.error(errorMessage);
    }
  };

  // Modal handlers
  const openDetailModal = (check: ComplianceCheck) => {
    setSelectedCheck(check);
    onDetailOpen();
  };

  const openEditModal = (check: ComplianceCheck) => {
    setEditingCheck({ ...check });
    onEditCheckOpen();
  };

  const openTrendsModal = () => {
    onTrendsOpen();
  };

  // Helper functions for colors and styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
      case "compliant":
        return "success";
      case "failed":
      case "non_compliant":
        return "danger";
      case "warning":
      case "partially_compliant":
        return "warning";
      case "not_applicable":
      case "not_assessed":
        return "default";
      default:
        return "default";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "danger";
  };

  const getStandardColor = (standard: string) => {
    return (
      complianceStandards.find((s) => s.key === standard)?.color || "default"
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
      case "critical":
        return "danger";
      default:
        return "default";
    }
  };

  // ✅ FIXED: Enhanced filter options with proper data checking
  const auditFilterOptions = audits.map((audit) => ({
    key: audit.id.toString(),
    label: `${audit.title || "Untitled"} - ${audit.building_name || "Unknown Building"}`,
  }));

  const buildingFilterOptions = buildings.map((building) => ({
    key: building.id.toString(),
    label: building.name || "Unnamed Building",
  }));

  const standardFilterOptions = [
    { key: "", label: "All Standards" },
    ...complianceStandards.map((standard) => ({
      key: standard.key,
      label: standard.name,
    })),
  ];

  const statusFilterOptions = [
    { key: "", label: "All Statuses" },
    { key: "passed", label: "Passed" },
    { key: "failed", label: "Failed" },
    { key: "warning", label: "Warning" },
    { key: "not_applicable", label: "Not Applicable" },
    { key: "not_checked", label: "Not Checked" },
  ];

  const severityFilterOptions = [
    { key: "", label: "All Severities" },
    { key: "critical", label: "Critical" },
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
  ];

  // ✅ FIXED: Selection handlers
  const handleAuditChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedAudit(selectedKey || "");
  };

  const handleBuildingChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedBuilding(selectedKey || "");
  };

  const handleStandardFilterChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setStandardFilter(selectedKey || "");
  };

  const handleStatusFilterChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setStatusFilter(selectedKey || "");
  };

  const handleSeverityFilterChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSeverityFilter(selectedKey || "");
  };

  // ✅ FIXED: Filtered checks with comprehensive validation
  const filteredChecks = (() => {
    if (
      !complianceData?.detailed_checks ||
      !Array.isArray(complianceData.detailed_checks)
    ) {
      return [];
    }

    return complianceData.detailed_checks.filter((check) => {
      if (!check || typeof check !== "object") return false;

      if (standardFilter && check.standard !== standardFilter) return false;
      if (statusFilter && check.status !== statusFilter) return false;
      if (severityFilter && check.severity !== severityFilter) return false;

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = (check.requirement_title || "")
          .toLowerCase()
          .includes(searchLower);
        const codeMatch = (check.requirement_code || "")
          .toLowerCase()
          .includes(searchLower);
        const descMatch = (check.requirement_description || "")
          .toLowerCase()
          .includes(searchLower);

        if (!titleMatch && !codeMatch && !descMatch) return false;
      }

      return true;
    });
  })();

  // Pagination
  const totalPages = Math.ceil(filteredChecks.length / itemsPerPage);
  const paginatedChecks = filteredChecks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load compliance data when audit changes
  useEffect(() => {
    if (selectedAudit) {
      loadComplianceData();
    }
  }, [selectedAudit, loadComplianceData]);

  // Load trends when building changes
  useEffect(() => {
    if (selectedBuilding) {
      loadComplianceTrends();
    }
  }, [selectedBuilding, loadComplianceTrends]);

  // ✅ FIXED: Loading state with skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64 rounded-lg" />
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
          <CardBody>
            <Skeleton className="h-80 rounded-lg" />
          </CardBody>
        </Card>
      </div>
    );
  }

  // ✅ FIXED: Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Error Loading Compliance Data
            </h3>
            <p className="text-default-500 mb-4">{error}</p>
            <Button
              color="primary"
              onPress={() => {
                setError(null);
                loadInitialData();
              }}
              startContent={<RefreshCw className="w-4 h-4" />}
            >
              Retry
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
            Compliance Management Center
          </h1>
          <p className="text-default-500 mt-1">
            Comprehensive compliance monitoring, analysis, and management across
            all energy standards
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            startContent={<TrendingUp className="w-4 h-4" />}
            onPress={openTrendsModal}
          >
            View Trends
          </Button>
          <Button
            color="primary"
            startContent={<Play className="w-4 h-4" />}
            onPress={onRunCheckOpen}
          >
            Run Check
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </div>
          }
        >
          {/* Dashboard Summary Cards */}
          {dashboardSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-primary">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {audits.length}
                      </div>
                      <div className="text-sm text-default-500">
                        Total Audits
                      </div>
                    </div>
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-l-success">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {safeToFixed(
                          dashboardSummary.overall_status
                            ?.compliance_percentage,
                          1
                        )}
                        %
                      </div>
                      <div className="text-sm text-default-500">
                        Avg Compliance
                      </div>
                    </div>
                    <Target className="w-8 h-8 text-success" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-l-danger">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {safeInteger(
                          dashboardSummary.overall_status?.critical_violations
                        )}
                      </div>
                      <div className="text-sm text-default-500">
                        Critical Issues
                      </div>
                    </div>
                    <AlertCircle className="w-8 h-8 text-danger" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-l-warning">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {safeInteger(
                          dashboardSummary.overall_status?.total_violations
                        )}
                      </div>
                      <div className="text-sm text-default-500">
                        Total Issues
                      </div>
                    </div>
                    <Clock className="w-8 h-8 text-warning" />
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Standards Breakdown */}
          {dashboardSummary?.by_standard && (
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Standards Compliance Overview
                </h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardSummary.by_standard.map((standard, index) => {
                    const standardInfo = complianceStandards.find(
                      (s) => s.key === standard.standard
                    );
                    const complianceRate = safeNumber(standard.compliance_rate);
                    const violations = safeInteger(standard.violations);

                    return (
                      <Card
                        key={index}
                        className={`border-l-4 border-l-${getStandardColor(standard.standard)}`}
                      >
                        <CardBody className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-foreground">
                                  {standard.standard}
                                </div>
                                <div className="text-xs text-default-500">
                                  {standardInfo?.title}
                                </div>
                              </div>
                              <div className="text-xs text-default-500">
                                {standard.last_assessment || "Not assessed"}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-default-600">
                                  Compliance Rate
                                </span>
                                <span className="font-medium">
                                  {safeToFixed(complianceRate, 1)}%
                                </span>
                              </div>
                              <Progress
                                value={complianceRate}
                                color={
                                  getComplianceColor(complianceRate) as any
                                }
                                size="sm"
                              />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-default-600">
                                Violations: {violations}
                              </span>
                              <Chip
                                color={
                                  violations === 0
                                    ? "success"
                                    : violations <= 5
                                      ? "warning"
                                      : "danger"
                                }
                                size="sm"
                                variant="flat"
                              >
                                {violations === 0
                                  ? "Compliant"
                                  : `${violations} issues`}
                              </Chip>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Issues */}
          {dashboardSummary?.recent_issues && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    Recent Critical Issues
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {dashboardSummary.recent_issues
                      .slice(0, 5)
                      .map((issue, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-l-danger pl-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Chip
                              color={getSeverityColor(issue.severity) as any}
                              size="sm"
                              variant="flat"
                            >
                              {issue.severity || "medium"}
                            </Chip>
                            <span className="text-xs text-default-500">
                              {issue.due_date
                                ? new Date(issue.due_date).toLocaleDateString()
                                : "No due date"}
                            </span>
                          </div>
                          <div className="font-medium text-sm">
                            {issue.description || "No description"}
                          </div>
                          <div className="text-xs text-default-500">
                            {issue.building_name || "Unknown building"}
                          </div>
                        </div>
                      ))}
                    {(!dashboardSummary.recent_issues ||
                      dashboardSummary.recent_issues.length === 0) && (
                      <div className="text-sm text-default-500 italic">
                        No recent issues found
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Improvement Areas</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {(dashboardSummary.improvement_areas || []).map(
                      (area, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-l-primary pl-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Chip
                              color={
                                area.priority === "high"
                                  ? "danger"
                                  : area.priority === "medium"
                                    ? "warning"
                                    : "primary"
                              }
                              size="sm"
                              variant="flat"
                            >
                              {area.priority || "medium"}
                            </Chip>
                            <span className="font-medium text-sm">
                              {area.area || "Unknown area"}
                            </span>
                          </div>
                          <p className="text-sm text-default-600">
                            {area.impact || "No impact description"}
                          </p>
                          <div className="text-xs text-default-500 mt-1">
                            Cost: ₱
                            {safeNumber(
                              area.estimated_cost,
                              0
                            ).toLocaleString()}
                          </div>
                        </div>
                      )
                    )}
                    {(!dashboardSummary.improvement_areas ||
                      dashboardSummary.improvement_areas.length === 0) && (
                      <div className="text-sm text-default-500 italic">
                        No improvement areas identified
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </Tab>

        <Tab
          key="audits"
          title={
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Audits</span>
            </div>
          }
        >
          {/* Audit Selection and Summary */}
          <Card className="mb-6">
            <CardBody>
              {/* Data availability warning */}
              {!loading && (audits.length === 0 || buildings.length === 0) && (
                <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-center gap-2 text-warning-800 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {audits.length === 0 && buildings.length === 0
                        ? "No audits or buildings found. Please ensure data is available before proceeding."
                        : audits.length === 0
                          ? "No audits found. Create an audit first to view compliance data."
                          : "No buildings found. Add buildings to the system to proceed."}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Select
                  label="Select Audit"
                  placeholder={
                    auditFilterOptions.length > 0
                      ? "Choose audit to view compliance"
                      : "No audits available"
                  }
                  selectedKeys={selectedAudit ? [selectedAudit] : []}
                  onSelectionChange={handleAuditChange}
                  isDisabled={auditFilterOptions.length === 0}
                >
                  {auditFilterOptions.length > 0 ? (
                    auditFilterOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-audits" isDisabled>
                      No audits available
                    </SelectItem>
                  )}
                </Select>

                <Select
                  label="Filter by Standard"
                  placeholder="All standards"
                  selectedKeys={standardFilter ? [standardFilter] : []}
                  onSelectionChange={handleStandardFilterChange}
                >
                  {standardFilterOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>

                <div className="flex gap-2">
                  <Button
                    color="success"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={onCreateCheckOpen}
                  >
                    Add Check
                  </Button>
                  <Button
                    isIconOnly
                    variant="flat"
                    onPress={() => loadComplianceData()}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Audit Summary Stats */}
              {auditSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {safeInteger(
                        auditSummary.completion_metrics?.total_audits
                      )}
                    </div>
                    <div className="text-sm text-default-500">Total Audits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {safeToFixed(
                        auditSummary.compliance_overview
                          ?.average_compliance_score,
                        1
                      )}
                      %
                    </div>
                    <div className="text-sm text-default-500">
                      Avg Compliance
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {safeToFixed(
                        auditSummary.completion_metrics?.completion_rate,
                        1
                      )}
                      %
                    </div>
                    <div className="text-sm text-default-500">
                      Completion Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {safeInteger(
                        auditSummary.compliance_overview
                          ?.audits_with_critical_issues
                      )}
                    </div>
                    <div className="text-sm text-default-500">
                      Critical Issues
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Compliance Data Display */}
          {complianceData && (
            <>
              {/* Overall Compliance Summary */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-lg font-semibold">
                      Overall Compliance Status
                    </h3>
                    <Chip
                      color={
                        getComplianceColor(
                          safeNumber(complianceData.overall_compliance?.score)
                        ) as any
                      }
                      size="lg"
                      variant="flat"
                    >
                      {safeToFixed(complianceData.overall_compliance?.score, 1)}
                      %
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {safeInteger(
                          complianceData.overall_compliance?.total_checks
                        )}
                      </div>
                      <div className="text-sm text-default-500">
                        Total Checks
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {safeInteger(
                          complianceData.overall_compliance?.passed_checks
                        )}
                      </div>
                      <div className="text-sm text-default-500">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-danger">
                        {safeInteger(
                          complianceData.overall_compliance?.failed_checks
                        )}
                      </div>
                      <div className="text-sm text-default-500">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {safeInteger(
                          complianceData.overall_compliance?.warnings
                        )}
                      </div>
                      <div className="text-sm text-default-500">Warnings</div>
                    </div>
                  </div>

                  <div>
                    <Progress
                      value={safeNumber(
                        complianceData.overall_compliance?.score
                      )}
                      color={
                        getComplianceColor(
                          safeNumber(complianceData.overall_compliance?.score)
                        ) as any
                      }
                      size="lg"
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-default-500">
                      <span>Non-Compliant</span>
                      <span>Partially Compliant</span>
                      <span>Fully Compliant</span>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  {complianceData.risk_assessment && (
                    <div className="mt-4 p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Risk Level</span>
                        <Chip
                          color={
                            getRiskColor(
                              complianceData.risk_assessment.level
                            ) as any
                          }
                          size="sm"
                          variant="flat"
                        >
                          {complianceData.risk_assessment.level.toUpperCase()}
                        </Chip>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-danger">
                            {complianceData.risk_assessment.critical_issues}
                          </div>
                          <div className="text-default-500">Critical</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-warning">
                            {complianceData.risk_assessment.major_issues}
                          </div>
                          <div className="text-default-500">Major</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-primary">
                            {complianceData.risk_assessment.minor_issues}
                          </div>
                          <div className="text-default-500">Minor</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Standards Summary */}
              {complianceData?.standards_summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {complianceData.standards_summary.map((standard, index) => {
                    const standardInfo = complianceStandards.find(
                      (s) => s.key === standard.standard
                    );
                    const score = safeNumber(standard.score);
                    const violations = safeInteger(standard.violations);

                    return (
                      <Card
                        key={index}
                        className={`border-l-4 border-l-${getStandardColor(standard.standard)}`}
                      >
                        <CardBody className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-foreground">
                                  {standard.standard}
                                </div>
                                <div className="text-xs text-default-500">
                                  {standardInfo?.title}
                                </div>
                              </div>
                              <Shield
                                className={`w-6 h-6 text-${getStandardColor(standard.standard)}`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-default-600">
                                  Score
                                </span>
                                <span className="font-medium">
                                  {safeToFixed(score, 1)}%
                                </span>
                              </div>
                              <Progress
                                value={score}
                                color={getComplianceColor(score) as any}
                                size="sm"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Chip
                                color={getStatusColor(standard.status) as any}
                                size="sm"
                                variant="flat"
                              >
                                {standard.status || "unknown"}
                              </Chip>
                              {violations > 0 && (
                                <div className="text-xs text-danger">
                                  {violations} violations
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-default-500">
                              {standard.requirements_met}/
                              {standard.total_requirements} requirements met
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Recommendations */}
              {complianceData?.recommendations &&
                complianceData.recommendations.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Recommendations</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-2">
                        {complianceData.recommendations.map(
                          (recommendation, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <p className="text-sm text-default-600">
                                {recommendation}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}
            </>
          )}
        </Tab>

        <Tab
          key="checks"
          title={
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Detailed Checks</span>
            </div>
          }
        >
          {/* Filters */}
          <Card className="mb-6">
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Select
                  placeholder="Filter by Standard"
                  selectedKeys={standardFilter ? [standardFilter] : []}
                  onSelectionChange={handleStandardFilterChange}
                >
                  {standardFilterOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  placeholder="Filter by Status"
                  selectedKeys={statusFilter ? [statusFilter] : []}
                  onSelectionChange={handleStatusFilterChange}
                >
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  placeholder="Filter by Severity"
                  selectedKeys={severityFilter ? [severityFilter] : []}
                  onSelectionChange={handleSeverityFilterChange}
                >
                  {severityFilterOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>

                <Input
                  placeholder="Search checks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-default-600">
                    Showing {paginatedChecks.length} of {filteredChecks.length}{" "}
                    checks
                  </span>
                  <div className="flex gap-2">
                    <Chip color="success" size="sm" variant="dot">
                      {
                        filteredChecks.filter((c) => c.status === "passed")
                          .length
                      }{" "}
                      Passed
                    </Chip>
                    <Chip color="danger" size="sm" variant="dot">
                      {
                        filteredChecks.filter((c) => c.status === "failed")
                          .length
                      }{" "}
                      Failed
                    </Chip>
                    <Chip color="warning" size="sm" variant="dot">
                      {
                        filteredChecks.filter((c) => c.status === "warning")
                          .length
                      }{" "}
                      Warning
                    </Chip>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Download className="w-4 h-4" />}
                >
                  Export
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Detailed Checks Table */}
          <Card>
            <CardBody className="p-0">
              <Table aria-label="Compliance checks table">
                <TableHeader>
                  <TableColumn>REQUIREMENT</TableColumn>
                  <TableColumn>STANDARD</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>SEVERITY</TableColumn>
                  <TableColumn>DUE DATE</TableColumn>
                  <TableColumn>RESPONSIBLE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No compliance checks found">
                  {paginatedChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-foreground">
                            {check.requirement_title}
                          </div>
                          <div className="text-sm text-default-500">
                            {check.requirement_code}
                          </div>
                          {check.requirement_description && (
                            <div className="text-xs text-default-400 mt-1">
                              {check.requirement_description.substring(0, 80)}
                              ...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStandardColor(check.standard) as any}
                          size="sm"
                          variant="flat"
                        >
                          {check.standard}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {check.status === "passed" ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : check.status === "failed" ? (
                            <XCircle className="w-4 h-4 text-danger" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          )}
                          <Chip
                            color={getStatusColor(check.status) as any}
                            size="sm"
                            variant="flat"
                          >
                            {check.status}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={
                            getSeverityColor(check.severity || "medium") as any
                          }
                          size="sm"
                          variant="flat"
                        >
                          {check.severity || "medium"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {check.target_completion_date ? (
                          <div>
                            <div className="text-sm">
                              {new Date(
                                check.target_completion_date
                              ).toLocaleDateString()}
                            </div>
                            {new Date(check.target_completion_date) <
                              new Date() && (
                              <div className="text-xs text-danger">Overdue</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-default-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {check.responsible_party || "Not assigned"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openDetailModal(check)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openEditModal(check)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                size="sm"
                isDisabled={currentPage === 1}
                onPress={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-default-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                isDisabled={currentPage === totalPages}
                onPress={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Tab>

        <Tab
          key="analytics"
          title={
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </div>
          }
        >
          {/* Building Performance Analytics */}
          {auditSummary && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    Performance Overview
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {safeToFixed(
                          auditSummary.performance_indicators
                            ?.efficiency_improvement_rate,
                          1
                        )}
                        %
                      </div>
                      <div className="text-sm text-default-500">
                        Improvement Rate
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {safeToFixed(
                          auditSummary.performance_indicators
                            ?.average_audit_duration,
                          1
                        )}
                        hrs
                      </div>
                      <div className="text-sm text-default-500">
                        Avg Duration
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {safeToFixed(
                          auditSummary.performance_indicators
                            ?.issues_resolution_rate,
                          1
                        )}
                        %
                      </div>
                      <div className="text-sm text-default-500">
                        Resolution Rate
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {safeInteger(auditSummary.upcoming_audits?.length)}
                      </div>
                      <div className="text-sm text-default-500">Upcoming</div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recent Activities</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {(auditSummary.recent_activities || []).map(
                      (activity, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">
                                {activity.title || "Untitled Activity"}
                              </h4>
                              <div className="text-sm text-default-500">
                                Status: {activity.status || "Unknown"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                {safeToFixed(activity.completion_percentage, 1)}
                                %
                              </div>
                              <div className="text-sm text-default-500">
                                Complete
                              </div>
                            </div>
                          </div>
                          <Progress
                            value={safeNumber(activity.completion_percentage)}
                            color="primary"
                            size="sm"
                          />
                          <div className="mt-2">
                            <Chip
                              color={
                                activity.priority === "high"
                                  ? "danger"
                                  : activity.priority === "medium"
                                    ? "warning"
                                    : "primary"
                              }
                              size="sm"
                              variant="flat"
                            >
                              {activity.priority || "normal"} priority
                            </Chip>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Upcoming Audits</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {(auditSummary.upcoming_audits || []).map(
                      (audit, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <div className="font-medium">{audit.title}</div>
                            <div className="text-sm text-default-500">
                              {audit.building_name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {audit.scheduled_date
                                ? new Date(
                                    audit.scheduled_date
                                  ).toLocaleDateString()
                                : "Date not set"}
                            </div>
                            <div className="text-xs text-default-500">
                              Scheduled
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </Tab>
      </Tabs>

      {/* Modals */}

      {/* Run Compliance Check Modal */}
      <Modal isOpen={isRunCheckOpen} onOpenChange={onRunCheckClose} size="4xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Run Comprehensive Compliance Check</ModalHeader>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Audit"
                    placeholder={
                      auditFilterOptions.length > 0
                        ? "Select audit"
                        : "No audits available"
                    }
                    selectedKeys={
                      checkParams.auditId ? [checkParams.auditId] : []
                    }
                    onSelectionChange={(keys) =>
                      setCheckParams((prev) => ({
                        ...prev,
                        auditId: Array.from(keys)[0] as string,
                      }))
                    }
                    isDisabled={auditFilterOptions.length === 0}
                  >
                    {auditFilterOptions.length > 0 ? (
                      auditFilterOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-audits" isDisabled>
                        No audits available
                      </SelectItem>
                    )}
                  </Select>

                  <Select
                    label="Standard Type"
                    selectedKeys={[checkParams.standardType]}
                    onSelectionChange={(keys) =>
                      setCheckParams((prev) => ({
                        ...prev,
                        standardType: Array.from(keys)[0] as any,
                      }))
                    }
                  >
                    {complianceStandards.map((standard) => (
                      <SelectItem key={standard.key}>
                        {standard.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">
                    Power Quality Readings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Voltage THD L1 (%)"
                      type="number"
                      step="0.1"
                      value={
                        checkParams.checkData.power_quality_readings
                          .voltage_thd_l1
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            power_quality_readings: {
                              ...prev.checkData.power_quality_readings,
                              voltage_thd_l1: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Voltage THD L2 (%)"
                      type="number"
                      step="0.1"
                      value={
                        checkParams.checkData.power_quality_readings
                          .voltage_thd_l2
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            power_quality_readings: {
                              ...prev.checkData.power_quality_readings,
                              voltage_thd_l2: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Voltage THD L3 (%)"
                      type="number"
                      step="0.1"
                      value={
                        checkParams.checkData.power_quality_readings
                          .voltage_thd_l3
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            power_quality_readings: {
                              ...prev.checkData.power_quality_readings,
                              voltage_thd_l3: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Current THD (%)"
                      type="number"
                      step="0.1"
                      value={
                        checkParams.checkData.power_quality_readings.thd_current
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            power_quality_readings: {
                              ...prev.checkData.power_quality_readings,
                              thd_current: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Power Factor"
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={
                        checkParams.checkData.power_quality_readings
                          .power_factor
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            power_quality_readings: {
                              ...prev.checkData.power_quality_readings,
                              power_factor: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Frequency (Hz)"
                      type="number"
                      step="0.1"
                      value={
                        checkParams.checkData.power_quality_readings.frequency
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            power_quality_readings: {
                              ...prev.checkData.power_quality_readings,
                              frequency: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">
                    Safety Inspection
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Electrical Panel Clearance (m)"
                      type="number"
                      step="0.1"
                      value={
                        checkParams.checkData.safety_inspection
                          .electrical_panel_clearance_m
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            safety_inspection: {
                              ...prev.checkData.safety_inspection,
                              electrical_panel_clearance_m: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Fire Extinguisher Count"
                      type="number"
                      value={
                        checkParams.checkData.safety_inspection
                          .fire_extinguisher_count
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            safety_inspection: {
                              ...prev.checkData.safety_inspection,
                              fire_extinguisher_count: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Emergency Exit Clearance (m)"
                      type="number"
                      step="0.1"
                      value={
                        checkParams.checkData.safety_inspection
                          .emergency_exit_clearance
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            safety_inspection: {
                              ...prev.checkData.safety_inspection,
                              emergency_exit_clearance: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="ground_fault_protection"
                        checked={
                          checkParams.checkData.safety_inspection
                            .ground_fault_protection
                        }
                        onChange={(e) =>
                          setCheckParams((prev) => ({
                            ...prev,
                            checkData: {
                              ...prev.checkData,
                              safety_inspection: {
                                ...prev.checkData.safety_inspection,
                                ground_fault_protection: e.target.checked,
                              },
                            },
                          }))
                        }
                        className="rounded"
                      />
                      <label
                        htmlFor="ground_fault_protection"
                        className="text-sm"
                      >
                        Ground Fault Protection Available
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">
                    Energy Efficiency
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Power Factor Target"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={
                        checkParams.checkData.energy_efficiency
                          .power_factor_target
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            energy_efficiency: {
                              ...prev.checkData.energy_efficiency,
                              power_factor_target: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Energy Consumption Target (kWh)"
                      type="number"
                      value={
                        checkParams.checkData.energy_efficiency
                          .energy_consumption_target
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            energy_efficiency: {
                              ...prev.checkData.energy_efficiency,
                              energy_consumption_target: e.target.value,
                            },
                          },
                        }))
                      }
                    />

                    <Input
                      label="Demand Factor"
                      type="number"
                      step="0.01"
                      value={
                        checkParams.checkData.energy_efficiency.demand_factor
                      }
                      onChange={(e) =>
                        setCheckParams((prev) => ({
                          ...prev,
                          checkData: {
                            ...prev.checkData,
                            energy_efficiency: {
                              ...prev.checkData.energy_efficiency,
                              demand_factor: e.target.value,
                            },
                          },
                        }))
                      }
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
                  onPress={runComplianceCheck}
                  isLoading={checking}
                >
                  Run Compliance Check
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Check Detail Modal */}
      <Modal isOpen={isDetailOpen} onOpenChange={onDetailClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  <Chip
                    color={getStatusColor(selectedCheck?.status || "") as any}
                    size="sm"
                  >
                    {selectedCheck?.status}
                  </Chip>
                  <span>Compliance Check Details</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedCheck && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">
                          Requirement Information
                        </h4>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <div>
                          <strong>Standard:</strong> {selectedCheck.standard}
                        </div>
                        <div>
                          <strong>Requirement Code:</strong>{" "}
                          {selectedCheck.requirement_code}
                        </div>
                        <div>
                          <strong>Title:</strong>{" "}
                          {selectedCheck.requirement_title}
                        </div>
                        {selectedCheck.requirement_description && (
                          <div>
                            <strong>Description:</strong>{" "}
                            {selectedCheck.requirement_description}
                          </div>
                        )}
                        <div>
                          <strong>Severity:</strong>
                          <Chip
                            color={
                              getSeverityColor(
                                selectedCheck.severity || "medium"
                              ) as any
                            }
                            size="sm"
                            className="ml-2"
                          >
                            {selectedCheck.severity || "medium"}
                          </Chip>
                        </div>
                        <div>
                          <strong>Last Assessed:</strong>{" "}
                          {new Date(
                            selectedCheck.assessment_date
                          ).toLocaleString()}
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Current Status</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-2">
                          <div>
                            <strong>Status:</strong> {selectedCheck.status}
                          </div>
                          {selectedCheck.notes && (
                            <div>
                              <strong>Notes:</strong> {selectedCheck.notes}
                            </div>
                          )}
                          {selectedCheck.corrective_action && (
                            <div>
                              <strong>Corrective Action:</strong>{" "}
                              {selectedCheck.corrective_action}
                            </div>
                          )}
                          {selectedCheck.target_completion_date && (
                            <div>
                              <strong>Due Date:</strong>{" "}
                              {new Date(
                                selectedCheck.target_completion_date
                              ).toLocaleDateString()}
                            </div>
                          )}
                          {selectedCheck.responsible_party && (
                            <div>
                              <strong>Responsible Person:</strong>{" "}
                              {selectedCheck.responsible_party}
                            </div>
                          )}
                          {selectedCheck.evidence && (
                            <div>
                              <strong>Evidence:</strong>{" "}
                              {selectedCheck.evidence}
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                    if (selectedCheck) openEditModal(selectedCheck);
                  }}
                >
                  Edit Check
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Create Check Modal */}
      <Modal
        isOpen={isCreateCheckOpen}
        onOpenChange={onCreateCheckClose}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Create New Compliance Check</ModalHeader>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Audit"
                    placeholder={
                      auditFilterOptions.length > 0
                        ? "Select audit"
                        : "No audits available"
                    }
                    selectedKeys={
                      newCheckData.audit_id ? [newCheckData.audit_id] : []
                    }
                    onSelectionChange={(keys) =>
                      setNewCheckData((prev) => ({
                        ...prev,
                        audit_id: Array.from(keys)[0] as string,
                      }))
                    }
                    isDisabled={auditFilterOptions.length === 0}
                  >
                    {auditFilterOptions.length > 0 ? (
                      auditFilterOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-audits" isDisabled>
                        No audits available
                      </SelectItem>
                    )}
                  </Select>

                  <Select
                    label="Standard"
                    placeholder="Select standard"
                    selectedKeys={
                      newCheckData.standard ? [newCheckData.standard] : []
                    }
                    onSelectionChange={(keys) =>
                      setNewCheckData((prev) => ({
                        ...prev,
                        standard: Array.from(keys)[0] as string,
                      }))
                    }
                  >
                    {complianceStandards.map((standard) => (
                      <SelectItem key={standard.key}>
                        {standard.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Requirement Code"
                    placeholder="e.g., 2.1.3.1"
                    value={newCheckData.requirement_code}
                    onChange={(e) =>
                      setNewCheckData((prev) => ({
                        ...prev,
                        requirement_code: e.target.value,
                      }))
                    }
                  />

                  <Select
                    label="Severity"
                    selectedKeys={[newCheckData.severity]}
                    onSelectionChange={(keys) =>
                      setNewCheckData((prev) => ({
                        ...prev,
                        severity: Array.from(keys)[0] as any,
                      }))
                    }
                  >
                    {severityFilterOptions.slice(1).map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <Textarea
                  label="Requirement Title"
                  placeholder="Title of the compliance requirement"
                  value={newCheckData.requirement_title}
                  onChange={(e) =>
                    setNewCheckData((prev) => ({
                      ...prev,
                      requirement_title: e.target.value,
                    }))
                  }
                />

                <Textarea
                  label="Requirement Description"
                  placeholder="Detailed description of the requirement"
                  value={newCheckData.requirement_description}
                  onChange={(e) =>
                    setNewCheckData((prev) => ({
                      ...prev,
                      requirement_description: e.target.value,
                    }))
                  }
                />

                <Textarea
                  label="Notes"
                  placeholder="Additional notes or findings"
                  value={newCheckData.notes}
                  onChange={(e) =>
                    setNewCheckData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Target Completion Date"
                    type="date"
                    value={newCheckData.target_completion_date}
                    onChange={(e) =>
                      setNewCheckData((prev) => ({
                        ...prev,
                        target_completion_date: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Responsible Party"
                    placeholder="Person responsible for this check"
                    value={newCheckData.responsible_party}
                    onChange={(e) =>
                      setNewCheckData((prev) => ({
                        ...prev,
                        responsible_party: e.target.value,
                      }))
                    }
                  />
                </div>

                <Textarea
                  label="Corrective Action"
                  placeholder="Required corrective action (if any)"
                  value={newCheckData.corrective_action}
                  onChange={(e) =>
                    setNewCheckData((prev) => ({
                      ...prev,
                      corrective_action: e.target.value,
                    }))
                  }
                />

                <Textarea
                  label="Evidence"
                  placeholder="Supporting evidence or documentation"
                  value={newCheckData.evidence}
                  onChange={(e) =>
                    setNewCheckData((prev) => ({
                      ...prev,
                      evidence: e.target.value,
                    }))
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={createComplianceCheck}>
                  Create Check
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Check Modal */}
      <Modal
        isOpen={isEditCheckOpen}
        onOpenChange={onEditCheckClose}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Edit Compliance Check</ModalHeader>
              <ModalBody className="space-y-4">
                {editingCheck && (
                  <>
                    <Card>
                      <CardBody>
                        <div className="space-y-2">
                          <div>
                            <strong>Standard:</strong> {editingCheck.standard}
                          </div>
                          <div>
                            <strong>Requirement Code:</strong>{" "}
                            {editingCheck.requirement_code}
                          </div>
                          <div>
                            <strong>Title:</strong>{" "}
                            {editingCheck.requirement_title}
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Select
                      label="Status"
                      selectedKeys={[editingCheck.status]}
                      onSelectionChange={(keys) =>
                        setEditingCheck((prev) =>
                          prev
                            ? { ...prev, status: Array.from(keys)[0] as any }
                            : null
                        )
                      }
                    >
                      {statusFilterOptions.slice(1).map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>

                    <Textarea
                      label="Notes"
                      value={editingCheck.notes || ""}
                      onChange={(e) =>
                        setEditingCheck((prev) =>
                          prev ? { ...prev, notes: e.target.value } : null
                        )
                      }
                    />

                    <Textarea
                      label="Corrective Action"
                      value={editingCheck.corrective_action || ""}
                      onChange={(e) =>
                        setEditingCheck((prev) =>
                          prev
                            ? { ...prev, corrective_action: e.target.value }
                            : null
                        )
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Target Completion Date"
                        type="date"
                        value={
                          editingCheck.target_completion_date
                            ? new Date(editingCheck.target_completion_date)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setEditingCheck((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  target_completion_date: e.target.value,
                                }
                              : null
                          )
                        }
                      />

                      <Input
                        label="Responsible Party"
                        value={editingCheck.responsible_party || ""}
                        onChange={(e) =>
                          setEditingCheck((prev) =>
                            prev
                              ? { ...prev, responsible_party: e.target.value }
                              : null
                          )
                        }
                      />
                    </div>

                    <Textarea
                      label="Evidence"
                      value={editingCheck.evidence || ""}
                      onChange={(e) =>
                        setEditingCheck((prev) =>
                          prev ? { ...prev, evidence: e.target.value } : null
                        )
                      }
                    />
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={updateComplianceCheck}>
                  Update Check
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Trends Modal */}
      <Modal isOpen={isTrendsOpen} onOpenChange={onTrendsClose} size="4xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5" />
                  <span>Compliance Trends Analysis</span>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Select
                  label="Select Building"
                  placeholder={
                    buildingFilterOptions.length > 0
                      ? "Choose building for trends"
                      : "No buildings available"
                  }
                  selectedKeys={selectedBuilding ? [selectedBuilding] : []}
                  onSelectionChange={handleBuildingChange}
                  isDisabled={buildingFilterOptions.length === 0}
                >
                  {buildingFilterOptions.length > 0 ? (
                    buildingFilterOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-buildings" isDisabled>
                      No buildings available
                    </SelectItem>
                  )}
                </Select>

                {complianceTrends && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">
                          Building:{" "}
                          {complianceTrends.building_info?.name ||
                            "Unknown Building"}
                        </h4>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">
                              {complianceTrends.analysis?.trend_direction ||
                                "Unknown"}
                            </div>
                            <div className="text-sm text-default-500">
                              Trend Direction
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-success">
                              +
                              {safeToFixed(
                                complianceTrends.analysis?.improvement_rate,
                                1
                              )}
                              %
                            </div>
                            <div className="text-sm text-default-500">
                              Improvement Rate
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-warning">
                              {safeToFixed(
                                complianceTrends.analysis?.gap_to_target,
                                1
                              )}
                              %
                            </div>
                            <div className="text-sm text-default-500">
                              Gap to Target
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {safeToFixed(
                                complianceTrends.performance_metrics
                                  ?.consistency_score,
                                1
                              )}
                            </div>
                            <div className="text-sm text-default-500">
                              Consistency Score
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Performance Metrics</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">
                              {safeToFixed(
                                complianceTrends.performance_metrics
                                  ?.monthly_average,
                                1
                              )}
                              %
                            </div>
                            <div className="text-sm text-default-500">
                              Monthly Average
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">
                              {safeToFixed(
                                complianceTrends.performance_metrics
                                  ?.quarterly_average,
                                1
                              )}
                              %
                            </div>
                            <div className="text-sm text-default-500">
                              Quarterly Average
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">
                              {safeToFixed(
                                complianceTrends.performance_metrics
                                  ?.yearly_average,
                                1
                              )}
                              %
                            </div>
                            <div className="text-sm text-default-500">
                              Yearly Average
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Historical Trends</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-4">
                          {(complianceTrends.trends || []).map(
                            (trend, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="font-medium">
                                    {trend.date
                                      ? new Date(
                                          trend.date
                                        ).toLocaleDateString()
                                      : "Unknown Date"}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="font-bold">
                                        {safeToFixed(trend.compliance_rate, 1)}%
                                      </div>
                                      <div className="text-sm text-default-500">
                                        Compliance Rate
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">
                                        {safeInteger(trend.critical_violations)}
                                      </div>
                                      <div className="text-sm text-default-500">
                                        Critical Issues
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">
                                        {safeInteger(trend.total_checks)}
                                      </div>
                                      <div className="text-sm text-default-500">
                                        Total Checks
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Progress
                                  value={safeNumber(trend.compliance_rate)}
                                  color={
                                    getComplianceColor(
                                      safeNumber(trend.compliance_rate)
                                    ) as any
                                  }
                                  size="sm"
                                />
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  {trend.standard_breakdown &&
                                    Object.entries(
                                      trend.standard_breakdown
                                    ).map(([standard, score]) => (
                                      <div
                                        key={standard}
                                        className="text-center"
                                      >
                                        <div className="font-medium">
                                          {standard}
                                        </div>
                                        <div className="text-default-500">
                                          {safeToFixed(score, 1)}%
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )
                          )}
                          {(!complianceTrends.trends ||
                            complianceTrends.trends.length === 0) && (
                            <div className="text-sm text-default-500 italic">
                              No trend data available for this building
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Analysis Summary</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Best Performing Standard:</span>
                            <Chip color="success" size="sm">
                              {complianceTrends.analysis
                                ?.best_performing_standard || "Unknown"}
                            </Chip>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Needs Improvement:</span>
                            <Chip color="warning" size="sm">
                              {complianceTrends.analysis
                                ?.worst_performing_standard || "Unknown"}
                            </Chip>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Recent Improvement:</span>
                            <Chip
                              color={
                                complianceTrends.analysis?.recent_improvement
                                  ? "success"
                                  : "danger"
                              }
                              size="sm"
                            >
                              {complianceTrends.analysis?.recent_improvement
                                ? "Yes"
                                : "No"}
                            </Chip>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Target Compliance Rate:</span>
                            <span className="font-medium">
                              {safeNumber(
                                complianceTrends.analysis
                                  ?.target_compliance_rate,
                                95
                              )}
                              %
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Gap to Target:</span>
                            <span
                              className={`font-medium ${
                                safeNumber(
                                  complianceTrends.analysis?.gap_to_target
                                ) > 0
                                  ? "text-danger"
                                  : "text-success"
                              }`}
                            >
                              {safeToFixed(
                                complianceTrends.analysis?.gap_to_target,
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}

                {!complianceTrends && selectedBuilding && (
                  <Card>
                    <CardBody className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-default-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Trends Data Available
                      </h3>
                      <p className="text-default-500">
                        No compliance trends data found for the selected
                        building.
                      </p>
                    </CardBody>
                  </Card>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  startContent={<Download className="w-4 h-4" />}
                  isDisabled={!complianceTrends}
                >
                  Export Trends
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
