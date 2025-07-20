// app/admin/reports/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

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
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { Checkbox } from "@heroui/checkbox";
import { Input, Textarea } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Tooltip } from "@heroui/tooltip";

// Icons
import {
  FileText,
  Download,
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  Building as BuildingIcon,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  Zap,
  Settings,
  RefreshCw,
  FileSpreadsheet,
  Globe,
  X,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";

// API Hooks and Types
import {
  useReports,
  useBuildings,
  useAudits,
  useReportMutation,
  useReportPolling,
  useRealTimeData,
} from "@/hooks/useApi";
import {
  validateReportType,
  validateReportFormat,
  validateDateRange,
  validateComplianceStandards,
  generateReportFilename,
  triggerFileDownload,
  validateBlobForDownload,
  formatFileSize,
} from "@/lib/api-utils";
import type {
  Report,
  Building,
  Audit,
  ReportQueryParams,
  EnergyReportGenerationData,
  PowerQualityReportGenerationData,
  ComplianceReportGenerationData,
  AuditReportGenerationData,
  MonitoringReportGenerationData,
} from "@/types/api-types";

// Types
interface ReportTypeConfig {
  key: string;
  label: string;
  icon: any;
  color: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
  description: string;
  requiresBuilding: boolean;
  requiresAudit: boolean;
  supportedFormats: string[];
}

interface ReportFormData {
  title: string;
  description: string;
  type: string;
  buildingId?: number;
  auditId?: number;
  startDate: string;
  endDate: string;
  reportFormat: string;
  sections: string[];
  includeComparison: boolean;
  includeTrends: boolean;
  includeEvents: boolean;
  includeCompliance: boolean;
  includeRecommendations: boolean;
  includeGapAnalysis: boolean;
  includeCharts: boolean;
  includeRawData: boolean;
  standards: string[];
  reportTypes: string[];
}

interface SectionConfig {
  key: string;
  label: string;
  description?: string;
  required?: boolean;
}

// Enhanced Configuration
const REPORT_TYPES: ReportTypeConfig[] = [
  {
    key: "energy_consumption",
    label: "Energy Report",
    icon: Zap,
    color: "primary",
    description: "Energy consumption analysis and efficiency metrics",
    requiresBuilding: false,
    requiresAudit: false,
    supportedFormats: ["pdf", "excel", "csv"],
  },
  {
    key: "power_quality",
    label: "Power Quality Report",
    icon: BarChart3,
    color: "success",
    description: "Power quality analysis, events, and compliance",
    requiresBuilding: true,
    requiresAudit: false,
    supportedFormats: ["pdf", "excel"],
  },
  {
    key: "compliance",
    label: "Compliance Report",
    icon: Shield,
    color: "secondary",
    description: "Regulatory compliance status and gap analysis",
    requiresBuilding: false,
    requiresAudit: true,
    supportedFormats: ["pdf", "excel"],
  },
  {
    key: "audit_summary",
    label: "Audit Report",
    icon: FileText,
    color: "warning",
    description: "Comprehensive audit findings and recommendations",
    requiresBuilding: false,
    requiresAudit: true,
    supportedFormats: ["pdf", "excel"],
  },
  {
    key: "monitoring",
    label: "Monitoring Report",
    icon: Settings,
    color: "danger",
    description: "System monitoring and performance analytics",
    requiresBuilding: false,
    requiresAudit: false,
    supportedFormats: ["pdf", "excel", "csv"],
  },
];

const FORMAT_OPTIONS = [
  { key: "pdf", label: "PDF", icon: FileText, ext: ".pdf" },
  { key: "excel", label: "Excel", icon: FileSpreadsheet, ext: ".xlsx" },
  { key: "csv", label: "CSV", icon: FileText, ext: ".csv" },
  { key: "html", label: "HTML", icon: Globe, ext: ".html" },
];

const STATUS_CONFIG = {
  generating: { color: "warning", icon: Loader2, label: "Generating" },
  completed: { color: "success", icon: CheckCircle, label: "Completed" },
  failed: { color: "danger", icon: AlertTriangle, label: "Failed" },
  cancelled: { color: "default", icon: X, label: "Cancelled" },
};

const COMPLIANCE_STANDARDS = [
  { key: "PEC2017", label: "PEC 2017 - Philippine Electrical Code" },
  { key: "OSHS", label: "OSHS - Occupational Safety and Health Standards" },
  { key: "ISO25010", label: "ISO 25010 - Software Quality Standards" },
  {
    key: "RA11285",
    label: "RA 11285 - Energy Efficiency and Conservation Act",
  },
];

const MONITORING_REPORT_TYPES = [
  { key: "energy", label: "Energy Monitoring" },
  { key: "power_quality", label: "Power Quality" },
  { key: "alerts", label: "Alert Summary" },
  { key: "maintenance", label: "Maintenance Status" },
  { key: "compliance", label: "Compliance Overview" },
];

// Section configurations by report type
const getSectionConfig = (reportType: string): SectionConfig[] => {
  const configs: Record<string, SectionConfig[]> = {
    energy_consumption: [
      { key: "executive_summary", label: "Executive Summary", required: true },
      {
        key: "consumption_analysis",
        label: "Consumption Analysis",
        required: true,
      },
      { key: "cost_analysis", label: "Cost Analysis" },
      { key: "efficiency_metrics", label: "Efficiency Metrics" },
      { key: "trend_analysis", label: "Trend Analysis" },
      { key: "recommendations", label: "Recommendations" },
      { key: "forecasting", label: "Energy Forecasting" },
      { key: "benchmarking", label: "Benchmarking" },
    ],
    power_quality: [
      { key: "quality_overview", label: "Quality Overview", required: true },
      { key: "events_analysis", label: "Events Analysis" },
      { key: "compliance_assessment", label: "Compliance Assessment" },
      { key: "harmonics_analysis", label: "Harmonics Analysis" },
      { key: "voltage_analysis", label: "Voltage Analysis" },
      { key: "frequency_analysis", label: "Frequency Analysis" },
      { key: "recommendations", label: "Improvement Recommendations" },
    ],
    compliance: [
      {
        key: "compliance_overview",
        label: "Compliance Overview",
        required: true,
      },
      { key: "standards_assessment", label: "Standards Assessment" },
      { key: "violations_summary", label: "Violations Summary" },
      { key: "gap_analysis", label: "Gap Analysis" },
      { key: "corrective_actions", label: "Corrective Actions" },
      { key: "risk_assessment", label: "Risk Assessment" },
      { key: "action_plan", label: "Action Plan" },
    ],
    audit_summary: [
      { key: "audit_methodology", label: "Audit Methodology", required: true },
      { key: "findings_summary", label: "Findings Summary", required: true },
      { key: "compliance_status", label: "Compliance Status" },
      { key: "energy_opportunities", label: "Energy Opportunities" },
      { key: "cost_savings", label: "Cost Savings Analysis" },
      { key: "implementation_plan", label: "Implementation Plan" },
      { key: "roi_analysis", label: "ROI Analysis" },
    ],
    monitoring: [
      { key: "system_overview", label: "System Overview", required: true },
      { key: "performance_metrics", label: "Performance Metrics" },
      { key: "alert_summary", label: "Alert Summary" },
      { key: "maintenance_status", label: "Maintenance Status" },
      { key: "data_quality", label: "Data Quality Assessment" },
      { key: "recommendations", label: "Recommendations" },
    ],
  };

  return configs[reportType] || [];
};

export default function ReportsPage() {
  // State for filters and search
  const [queryParams, setQueryParams] = useState<ReportQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [buildingFilter, setBuildingFilter] = useState<Set<string>>(new Set());

  // API Hooks
  const {
    data: reports,
    pagination,
    loading: reportsLoading,
    error: reportsError,
    execute: loadReports,
    refresh: refreshReports,
  } = useReports(queryParams, {
    immediate: true,
    cacheKey: "reports_list",
    cacheTtl: 2 * 60 * 1000,
  });

  const {
    data: buildings,
    loading: buildingsLoading,
    error: buildingsError,
  } = useBuildings(
    {
      status: "active",
      sortBy: "name",
      sortOrder: "ASC",
      limit: 100,
    },
    {
      immediate: true,
      cacheKey: "buildings_for_reports",
      cacheTtl: 10 * 60 * 1000,
    }
  );

  const {
    data: audits,
    loading: auditsLoading,
    error: auditsError,
  } = useAudits(
    {
      status: "completed",
      sortBy: "actualEndDate",
      sortOrder: "DESC",
      limit: 50,
    },
    {
      immediate: true,
      cacheKey: "audits_for_reports",
      cacheTtl: 10 * 60 * 1000,
    }
  );

  // Report mutation hooks
  const {
    generateEnergyReport,
    generateComplianceReport,
    generatePowerQualityReport,
    generateAuditReport,
    generateMonitoringReport,
    downloadReport,
    deleteReport,
    loading: mutationLoading,
    error: mutationError,
  } = useReportMutation();

  // Real-time updates
  const { data: realTimeMetrics } = useRealTimeData(
    "/api/reports/stats",
    30000,
    { immediate: true }
  );

  // Modal states
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();

  // Form state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<ReportFormData>({
    title: "",
    description: "",
    type: "energy_consumption",
    startDate: "",
    endDate: "",
    reportFormat: "pdf",
    sections: ["executive_summary", "consumption_analysis"],
    includeComparison: true,
    includeTrends: true,
    includeEvents: false,
    includeCompliance: false,
    includeRecommendations: true,
    includeGapAnalysis: false,
    includeCharts: true,
    includeRawData: false,
    standards: ["PEC2017"],
    reportTypes: ["energy", "power_quality"],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [downloadQueue, setDownloadQueue] = useState<Set<number>>(new Set());
  const [pollingReports, setPollingReports] = useState<Set<number>>(new Set());

  // Computed values
  const selectedReportType = useMemo(
    () => REPORT_TYPES.find((type) => type.key === formData.type),
    [formData.type]
  );

  const availableSections = useMemo(
    () => getSectionConfig(formData.type),
    [formData.type]
  );

  const supportedFormats = useMemo(() => {
    const formats = selectedReportType?.supportedFormats || ["pdf"];
    return FORMAT_OPTIONS.filter((format) => formats.includes(format.key));
  }, [selectedReportType]);

  const reportStats = useMemo(() => {
    const stats = REPORT_TYPES.map((type) => ({
      ...type,
      count: reports?.filter((report) => report.type === type.key).length || 0,
    }));
    return stats;
  }, [reports]);

  // Setup polling for generating reports
  const generatingReports = useMemo(
    () => reports?.filter((r) => r.status === "generating") || [],
    [reports]
  );

  // Effect to update query params when filters change
  useEffect(() => {
    const newParams: ReportQueryParams = {
      ...queryParams,
      page: 1,
    };

    if (searchTerm.trim()) {
      newParams.search = searchTerm.trim();
    }

    const typeArray = Array.from(typeFilter);
    if (typeArray.length === 1) {
      newParams.type = typeArray[0] as any;
    }

    const statusArray = Array.from(statusFilter);
    if (statusArray.length === 1) {
      newParams.status = statusArray[0] as any;
    }

    const buildingArray = Array.from(buildingFilter);
    if (buildingArray.length === 1) {
      newParams.buildingId = parseInt(buildingArray[0]);
    }

    setQueryParams(newParams);
  }, [searchTerm, typeFilter, statusFilter, buildingFilter]);

  // Auto-refresh for reports in generating status
  useEffect(() => {
    if (generatingReports.length > 0) {
      const interval = setInterval(() => {
        refreshReports();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [generatingReports.length, refreshReports]);

  // Form handlers
  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      type: "energy_consumption",
      startDate: "",
      endDate: "",
      reportFormat: "pdf",
      sections: ["executive_summary", "consumption_analysis"],
      includeComparison: true,
      includeTrends: true,
      includeEvents: false,
      includeCompliance: false,
      includeRecommendations: true,
      includeGapAnalysis: false,
      includeCharts: true,
      includeRawData: false,
      standards: ["PEC2017"],
      reportTypes: ["energy", "power_quality"],
    });
    setFormErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = "Report title is required";
    } else if (formData.title.length < 5 || formData.title.length > 200) {
      errors.title = "Title must be between 5 and 200 characters";
    }

    // Date validation
    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      errors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const dateValidation = validateDateRange(
        formData.startDate,
        formData.endDate
      );
      if (!dateValidation.isValid) {
        errors.endDate = dateValidation.error || "Invalid date range";
      }
    }

    // Building validation
    if (selectedReportType?.requiresBuilding && !formData.buildingId) {
      errors.buildingId = `Building selection is required for ${selectedReportType.label}`;
    }

    // Audit validation
    if (selectedReportType?.requiresAudit && !formData.auditId) {
      errors.auditId = `Audit selection is required for ${selectedReportType.label}`;
    }

    // Sections validation
    if (formData.sections.length === 0) {
      errors.sections = "At least one section is required";
    }

    const requiredSections = availableSections
      .filter((s) => s.required)
      .map((s) => s.key);
    const missingRequired = requiredSections.filter(
      (s) => !formData.sections.includes(s)
    );
    if (missingRequired.length > 0) {
      errors.sections = `Required sections missing: ${missingRequired.join(", ")}`;
    }

    // Standards validation for compliance reports
    if (
      formData.type === "compliance" &&
      (!formData.standards || formData.standards.length === 0)
    ) {
      errors.standards = "At least one compliance standard is required";
    }

    // Report types validation for monitoring reports
    if (
      formData.type === "monitoring" &&
      (!formData.reportTypes || formData.reportTypes.length === 0)
    ) {
      errors.reportTypes = "At least one report type is required";
    }

    // Report format validation
    if (!validateReportFormat(formData.reportFormat)) {
      errors.reportFormat = "Invalid report format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedReportType, availableSections]);

  const handleGenerate = useCallback(async () => {
    if (!validateForm()) {
      console.log("❌ Form validation failed:", formErrors);
      return;
    }

    try {
      setFormErrors({});

      // Base data that all reports need
      const baseReportData = {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reportFormat: formData.reportFormat,
        sections: formData.sections,
        includeCharts: formData.includeCharts,
        includeRawData: formData.includeRawData,
      };

      // Add description if provided
      if (formData.description?.trim()) {
        Object.assign(baseReportData, { description: formData.description });
      }

      console.log("🔄 Generating report with base data:", baseReportData);
      console.log("📋 Form data:", formData);

      let response;

      switch (formData.type) {
        case "energy_consumption": {
          const energyData: EnergyReportGenerationData = {
            ...baseReportData,
            includeComparison: formData.includeComparison,
            includeTrends: formData.includeTrends,
          };

          // Add buildingId if selected
          if (formData.buildingId) {
            energyData.buildingId = formData.buildingId;
          }

          console.log("⚡ Energy report data:", energyData);
          response = await generateEnergyReport(energyData);
          break;
        }

        case "power_quality": {
          if (!formData.buildingId) {
            throw new Error(
              "Building selection is required for power quality reports"
            );
          }

          const powerQualityData: PowerQualityReportGenerationData = {
            ...baseReportData,
            buildingId: formData.buildingId,
            includeEvents: formData.includeEvents,
            includeCompliance: formData.includeCompliance,
          };

          console.log("📊 Power quality report data:", powerQualityData);
          response = await generatePowerQualityReport(powerQualityData);
          break;
        }

        case "compliance": {
          if (!formData.auditId) {
            throw new Error(
              "Audit selection is required for compliance reports"
            );
          }

          if (!formData.standards || formData.standards.length === 0) {
            throw new Error("At least one compliance standard is required");
          }

          const complianceData: ComplianceReportGenerationData = {
            ...baseReportData,
            auditId: formData.auditId,
            standards: formData.standards,
            includeGapAnalysis: formData.includeGapAnalysis,
          };

          console.log("🛡️ Compliance report data:", complianceData);
          response = await generateComplianceReport(complianceData);
          break;
        }

        case "audit_summary": {
          if (!formData.auditId) {
            throw new Error("Audit selection is required for audit reports");
          }

          const auditData: AuditReportGenerationData = {
            ...baseReportData,
            auditId: formData.auditId,
            includeCompliance: formData.includeCompliance,
            includeRecommendations: formData.includeRecommendations,
          };

          console.log("📝 Audit report data:", auditData);
          response = await generateAuditReport(auditData);
          break;
        }

        case "monitoring": {
          if (!formData.reportTypes || formData.reportTypes.length === 0) {
            throw new Error(
              "At least one report type is required for monitoring reports"
            );
          }

          const monitoringData: MonitoringReportGenerationData = {
            ...baseReportData,
            reportTypes: formData.reportTypes,
          };

          // Add buildingId if selected
          if (formData.buildingId) {
            monitoringData.buildingId = formData.buildingId;
          }

          console.log("📈 Monitoring report data:", monitoringData);
          response = await generateMonitoringReport(monitoringData);
          break;
        }

        default:
          throw new Error(`Invalid report type: ${formData.type}`);
      }

      if (response) {
        console.log("✅ Report generation initiated successfully:", response);
        refreshReports();
        onCreateClose();
        resetForm();
      } else {
        throw new Error("Failed to generate report - no response received");
      }
    } catch (error: any) {
      console.error("❌ Report generation failed:", error);

      // Enhanced error handling
      if (error?.response?.data) {
        const errorData = error.response.data;
        console.error("📋 Error response data:", errorData);

        // Handle validation errors
        if (errorData.errors && typeof errorData.errors === "object") {
          const validationErrors: Record<string, string> = {};

          // Handle different error formats
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              validationErrors[field] = messages[0];
            } else if (typeof messages === "string") {
              validationErrors[field] = messages;
            }
          });

          console.error("📝 Validation errors:", validationErrors);
          setFormErrors(validationErrors);
        } else if (
          errorData.validationErrors &&
          Array.isArray(errorData.validationErrors)
        ) {
          // Handle array format validation errors
          const validationErrors: Record<string, string> = {};
          errorData.validationErrors.forEach((err: any) => {
            if (err.field && err.message) {
              validationErrors[err.field] = err.message;
            }
          });
          setFormErrors(validationErrors);
        } else {
          // Handle general error
          setFormErrors({
            general:
              errorData.message ||
              errorData.error ||
              "Report generation failed",
          });
        }
      } else {
        // Handle network or other errors
        setFormErrors({
          general:
            error?.message || "Failed to generate report. Please try again.",
        });
      }
    }
  }, [
    formData,
    validateForm,
    generateEnergyReport,
    generateComplianceReport,
    generatePowerQualityReport,
    generateAuditReport,
    generateMonitoringReport,
    refreshReports,
    onCreateClose,
    resetForm,
  ]);

  const handleDownload = useCallback(
    async (report: Report) => {
      if (!report.id) {
        console.error("❌ Report ID is missing");
        setFormErrors({
          general: "Report ID is missing - cannot download",
        });
        return;
      }

      try {
        setDownloadQueue((prev) => new Set(prev).add(report.id));

        const blob = await downloadReport(report.id);

        const validation = validateBlobForDownload(blob);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const filename = generateReportFilename(
          report.type,
          report.title,
          report.format,
          new Date(report.createdAt)
        );

        triggerFileDownload(blob, filename);

        console.log(
          `✅ Report downloaded: ${filename} (${formatFileSize(blob.size)})`
        );
      } catch (error: any) {
        console.error("❌ Download failed:", error);
        setFormErrors({
          general: `Download failed: ${error?.message || "Unknown error"}`,
        });
      } finally {
        setDownloadQueue((prev) => {
          const newSet = new Set(prev);
          newSet.delete(report.id);
          return newSet;
        });
      }
    },
    [downloadReport]
  );

  const handleDelete = useCallback(
    async (report: Report) => {
      if (!report.id) {
        console.error("❌ Report ID is missing");
        return;
      }

      if (!confirm(`Are you sure you want to delete "${report.title}"?`))
        return;

      try {
        await deleteReport(report.id);
        console.log("✅ Report deleted successfully");
        refreshReports();
      } catch (error) {
        console.error("❌ Delete failed:", error);
        setFormErrors({
          general: "Failed to delete report. Please try again.",
        });
      }
    },
    [deleteReport, refreshReports]
  );

  const handleViewReport = useCallback(
    (report: Report) => {
      setSelectedReport(report);
      onViewOpen();
    },
    [onViewOpen]
  );

  const handlePageChange = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter(new Set());
    setStatusFilter(new Set());
    setBuildingFilter(new Set());
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleSectionToggle = useCallback(
    (sectionKey: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        sections: checked
          ? [...prev.sections, sectionKey]
          : prev.sections.filter((s) => s !== sectionKey),
      }));
    },
    []
  );

  // Default date range (last 30 days)
  const getDefaultDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }, []);

  // Set default dates when form opens
  useEffect(() => {
    if (isCreateOpen && !formData.startDate && !formData.endDate) {
      const { startDate, endDate } = getDefaultDateRange();
      setFormData((prev) => ({
        ...prev,
        startDate,
        endDate,
      }));
    }
  }, [isCreateOpen, formData.startDate, formData.endDate, getDefaultDateRange]);

  // Loading state
  if (reportsLoading && (!reports || reports.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {(reportsError ||
        buildingsError ||
        mutationError ||
        formErrors.general) && (
        <Card className="border-danger-200 bg-danger-50">
          <CardBody>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-danger mt-0.5" />
                <div>
                  <h4 className="font-semibold text-danger">Error</h4>
                  <p className="text-sm text-danger-600">
                    {formErrors.general ||
                      reportsError ||
                      buildingsError ||
                      mutationError}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="light"
                color="danger"
                startContent={<X className="w-4 h-4" />}
                onPress={() => setFormErrors({})}
              >
                Dismiss
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <FileText className="w-8 h-8 mr-3 text-primary" />
            Reports Management
          </h1>
          <p className="text-default-500 mt-1">
            Generate comprehensive reports for energy consumption, compliance,
            power quality, and system monitoring
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          startContent={<Plus className="w-5 h-5" />}
          onPress={() => {
            resetForm();
            onCreateOpen();
          }}
          isDisabled={mutationLoading}
        >
          Generate Report
        </Button>
      </div>

      {/* Quick Stats */}
      {reports && reports.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-default-600">
                  <span className="font-semibold">
                    {pagination?.totalCount || reports.length}
                  </span>{" "}
                  total reports
                </div>
                <Divider orientation="vertical" className="h-4" />
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>
                      {reports.filter((r) => r.status === "completed").length}{" "}
                      completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span>
                      {reports.filter((r) => r.status === "generating").length}{" "}
                      generating
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-danger rounded-full"></div>
                    <span>
                      {reports.filter((r) => r.status === "failed").length}{" "}
                      failed
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="light"
                  startContent={<RefreshCw className="w-4 h-4" />}
                  onPress={() => refreshReports()}
                  isLoading={reportsLoading}
                >
                  Refresh
                </Button>

                {realTimeMetrics && (
                  <Tooltip
                    content={`Last updated: ${new Date().toLocaleTimeString()}`}
                  >
                    <Chip size="sm" variant="flat" color="primary">
                      Live
                    </Chip>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Report Type Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {reportStats.map((type) => {
          const Icon = type.icon;
          const colorClass = {
            primary: "text-primary",
            secondary: "text-secondary",
            success: "text-success",
            warning: "text-warning",
            danger: "text-danger",
            default: "text-default-500",
          }[type.color];
          const borderClass = {
            primary: "border-l-primary",
            secondary: "border-l-secondary",
            success: "border-l-success",
            warning: "border-l-warning",
            danger: "border-l-danger",
            default: "border-l-default-500",
          }[type.color];
          return (
            <Card
              key={type.key}
              className={`border-l-4 ${borderClass} hover:shadow-lg transition-all duration-200 cursor-pointer`}
              isPressable
              onPress={() => setTypeFilter(new Set([type.key]))}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-6 h-6 ${colorClass}`} />
                  <Chip
                    color={type.color}
                    size="sm"
                    variant="flat"
                    className="font-semibold"
                  >
                    {type.count}
                  </Chip>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {type.label}
                </h3>
                <p className="text-xs text-default-500 leading-tight">
                  {type.description}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              isClearable
              onClear={() => setSearchTerm("")}
            />

            <Select
              placeholder="Report Type"
              selectedKeys={typeFilter}
              onSelectionChange={(keys) => setTypeFilter(keys as Set<string>)}
            >
              {REPORT_TYPES.map((type) => (
                <SelectItem key={type.key} description={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Status"
              selectedKeys={statusFilter}
              onSelectionChange={(keys) => setStatusFilter(keys as Set<string>)}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} description={key}>
                  {config.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Building"
              selectedKeys={buildingFilter}
              onSelectionChange={(keys) =>
                setBuildingFilter(keys as Set<string>)
              }
              isLoading={buildingsLoading}
            >
              {buildings?.map((building) => (
                <SelectItem
                  key={building.id.toString()}
                  description={building.id.toString()}
                >
                  {building.name}
                </SelectItem>
              ))}
            </Select>

            <Button
              variant="light"
              startContent={<Filter className="w-4 h-4" />}
              onPress={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="Reports table"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader>
              <TableColumn>REPORT</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>BUILDING</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>SIZE</TableColumn>
              <TableColumn>CREATED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-default-500 mb-2">
                    No Reports Found
                  </h3>
                  <p className="text-default-400 mb-6">
                    {searchTerm ||
                    typeFilter.size > 0 ||
                    statusFilter.size > 0 ||
                    buildingFilter.size > 0
                      ? "Try adjusting your filters or search terms"
                      : "Generate your first report to get started"}
                  </p>
                  <Button
                    color="primary"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => {
                      resetForm();
                      onCreateOpen();
                    }}
                  >
                    Generate Report
                  </Button>
                </div>
              }
              isLoading={reportsLoading}
              loadingContent={<Skeleton className="w-full h-8 rounded-lg" />}
            >
              {(reports || []).map((report) => {
                const typeConfig = REPORT_TYPES.find(
                  (t) => t.key === report.type
                );
                const statusConfig =
                  STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG];
                const Icon = typeConfig?.icon || FileText;
                const StatusIcon = statusConfig?.icon || Clock;

                return (
                  <TableRow key={report.id || `report-${Math.random()}`}>
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        <Icon
                          className={`w-5 h-5 mt-0.5 ${
                            typeConfig?.color === "primary"
                              ? "text-primary"
                              : typeConfig?.color === "secondary"
                                ? "text-secondary"
                                : typeConfig?.color === "success"
                                  ? "text-success"
                                  : typeConfig?.color === "warning"
                                    ? "text-warning"
                                    : typeConfig?.color === "danger"
                                      ? "text-danger"
                                      : "text-default-500"
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {report.title}
                          </p>
                          <p className="text-sm text-default-500">
                            ID: {report.id} • {report.format.toUpperCase()}
                          </p>
                          {report.description && (
                            <p className="text-xs text-default-400 mt-1 max-w-xs truncate">
                              {report.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Chip
                        color={typeConfig?.color || "default"}
                        size="sm"
                        variant="flat"
                        startContent={<Icon className="w-3 h-3" />}
                      >
                        {typeConfig?.label || report.type}
                      </Chip>
                    </TableCell>

                    <TableCell>
                      {report.buildingName ? (
                        <div className="flex items-center space-x-2">
                          <BuildingIcon className="w-4 h-4 text-default-400" />
                          <span className="text-sm">{report.buildingName}</span>
                        </div>
                      ) : (
                        <Chip size="sm" variant="flat" color="default">
                          System-wide
                        </Chip>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <StatusIcon
                          className={`w-4 h-4 ${
                            statusConfig?.color === "warning"
                              ? "text-warning"
                              : statusConfig?.color === "success"
                                ? "text-success"
                                : statusConfig?.color === "danger"
                                  ? "text-danger"
                                  : "text-default-500"
                          } ${
                            report.status === "generating" ? "animate-spin" : ""
                          }`}
                        />
                        <Chip
                          color={(statusConfig?.color as any) || "default"}
                          size="sm"
                          variant="flat"
                        >
                          {statusConfig?.label || report.status}
                        </Chip>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm font-mono">
                        {report.fileSizeMb
                          ? formatFileSize(report.fileSizeMb)
                          : "N/A"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          {formatDate(report.createdAt)}
                        </p>
                        {report.requesterName && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3 text-default-400" />
                            <span className="text-xs text-default-500">
                              {report.requesterName}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Tooltip content="View Details">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleViewReport(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        {report.status === "completed" && (
                          <Tooltip content="Download Report">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="success"
                              onPress={() => handleDownload(report)}
                              isLoading={
                                report.id ? downloadQueue.has(report.id) : false
                              }
                              disabled={
                                !report.id ||
                                (report.id
                                  ? downloadQueue.has(report.id)
                                  : true)
                              }
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}

                        <Tooltip content="Delete Report">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(report)}
                            isDisabled={mutationLoading || !report.id}
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center p-4 border-t border-divider">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-default-500">
                  Showing{" "}
                  {(pagination.currentPage - 1) * pagination.perPage + 1} to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.perPage,
                    pagination.totalCount
                  )}{" "}
                  of {pagination.totalCount} reports
                </span>
                <Pagination
                  total={pagination.totalPages}
                  page={pagination.currentPage}
                  onChange={handlePageChange}
                  showControls
                  size="sm"
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isCreateOpen}
        onOpenChange={onCreateClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">Generate New Report</h2>
                <p className="text-sm text-default-500">
                  Create a comprehensive report with customizable sections and
                  formats
                </p>
              </ModalHeader>

              <ModalBody className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <Input
                    label="Report Title"
                    placeholder="Enter a descriptive title (5-200 characters)"
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
                    label="Description (Optional)"
                    placeholder="Provide additional context or notes for this report"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    maxRows={3}
                  />
                </div>

                <Divider />

                {/* Report Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Report Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Report Type"
                      selectedKeys={new Set([formData.type])}
                      onSelectionChange={(keys) => {
                        const type = Array.from(keys)[0] as string;
                        if (type) {
                          const sections = getSectionConfig(type)
                            .filter((s) => s.required)
                            .map((s) => s.key);
                          setFormData((prev) => ({
                            ...prev,
                            type,
                            sections:
                              sections.length > 0
                                ? sections
                                : ["executive_summary"],
                            buildingId: undefined,
                            auditId: undefined,
                          }));
                          setFormErrors({}); // Clear errors when type changes
                        }
                      }}
                      isRequired
                    >
                      {REPORT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const colorClass = {
                          primary: "text-primary",
                          secondary: "text-secondary",
                          success: "text-success",
                          warning: "text-warning",
                          danger: "text-danger",
                          default: "text-default-500",
                        }[type.color];
                        return (
                          <SelectItem
                            key={type.key}
                            description={type.description}
                            startContent={
                              <Icon className={`w-4 h-4 ${colorClass}`} />
                            }
                          >
                            {type.label}
                          </SelectItem>
                        );
                      })}
                    </Select>

                    <Select
                      label="Format"
                      selectedKeys={new Set([formData.reportFormat])}
                      onSelectionChange={(keys) => {
                        const format = Array.from(keys)[0] as string;
                        if (format) {
                          setFormData((prev) => ({
                            ...prev,
                            reportFormat: format,
                          }));
                        }
                      }}
                      isRequired
                    >
                      {supportedFormats.map((format) => {
                        const Icon = format.icon;
                        return (
                          <SelectItem
                            key={format.key}
                            startContent={<Icon className="w-4 h-4" />}
                          >
                            {format.label}
                          </SelectItem>
                        );
                      })}
                    </Select>
                  </div>

                  {/* Building Selection */}
                  {(selectedReportType?.requiresBuilding ||
                    formData.type === "energy_consumption" ||
                    formData.type === "monitoring") && (
                    <Select
                      label={`Building ${selectedReportType?.requiresBuilding ? "(Required)" : "(Optional)"}`}
                      placeholder="Select a building or leave empty for system-wide analysis"
                      selectedKeys={
                        formData.buildingId
                          ? new Set([formData.buildingId.toString()])
                          : new Set()
                      }
                      onSelectionChange={(keys) => {
                        const buildingId = Array.from(keys)[0] as string;
                        setFormData((prev) => ({
                          ...prev,
                          buildingId: buildingId
                            ? parseInt(buildingId)
                            : undefined,
                        }));
                        if (formErrors.buildingId) {
                          setFormErrors((prev) => {
                            const { buildingId, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      errorMessage={formErrors.buildingId}
                      isInvalid={!!formErrors.buildingId}
                      isRequired={selectedReportType?.requiresBuilding}
                      isLoading={buildingsLoading}
                    >
                      {buildings?.map((building) => (
                        <SelectItem
                          key={building.id.toString()}
                          description={`${building.buildingType} • ${building.areaSqm} sqm`}
                          startContent={
                            <BuildingIcon className="w-4 h-4 text-default-400" />
                          }
                        >
                          {building.name}
                        </SelectItem>
                      ))}
                    </Select>
                  )}

                  {/* Audit Selection */}
                  {selectedReportType?.requiresAudit && (
                    <Select
                      label="Audit (Required)"
                      placeholder="Select an audit for the report"
                      selectedKeys={
                        formData.auditId
                          ? new Set([formData.auditId.toString()])
                          : new Set()
                      }
                      onSelectionChange={(keys) => {
                        const auditId = Array.from(keys)[0] as string;
                        setFormData((prev) => ({
                          ...prev,
                          auditId: auditId ? parseInt(auditId) : undefined,
                        }));
                        if (formErrors.auditId) {
                          setFormErrors((prev) => {
                            const { auditId, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      errorMessage={formErrors.auditId}
                      isInvalid={!!formErrors.auditId}
                      isRequired
                      isLoading={auditsLoading}
                    >
                      {audits?.map((audit) => (
                        <SelectItem
                          key={audit.id.toString()}
                          description={`${audit.auditType} • Score: ${audit.complianceScore || "N/A"}`}
                          startContent={
                            <FileText className="w-4 h-4 text-default-400" />
                          }
                        >
                          {audit.title}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>

                {/* Date Range */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Date Range</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Start Date"
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }));
                        if (formErrors.startDate) {
                          setFormErrors((prev) => {
                            const { startDate, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      errorMessage={formErrors.startDate}
                      isInvalid={!!formErrors.startDate}
                      isRequired
                    />

                    <Input
                      type="date"
                      label="End Date"
                      value={formData.endDate}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }));
                        if (formErrors.endDate) {
                          setFormErrors((prev) => {
                            const { endDate, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      errorMessage={formErrors.endDate}
                      isInvalid={!!formErrors.endDate}
                      isRequired
                    />
                  </div>
                </div>

                {/* Report Sections */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Report Sections</h4>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => {
                        const allSections = availableSections.map((s) => s.key);
                        setFormData((prev) => ({
                          ...prev,
                          sections: allSections,
                        }));
                      }}
                    >
                      Select All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableSections.map((section) => (
                      <div key={section.key} className="space-y-1">
                        <Checkbox
                          isSelected={formData.sections.includes(section.key)}
                          onValueChange={(checked) =>
                            handleSectionToggle(section.key, checked)
                          }
                          isDisabled={section.required}
                        >
                          <div>
                            <span className="font-medium">{section.label}</span>
                            {section.required && (
                              <Chip
                                size="sm"
                                color="warning"
                                variant="flat"
                                className="ml-2"
                              >
                                Required
                              </Chip>
                            )}
                          </div>
                        </Checkbox>
                        {section.description && (
                          <p className="text-xs text-default-500 ml-6">
                            {section.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {formErrors.sections && (
                    <p className="text-danger text-sm">{formErrors.sections}</p>
                  )}
                </div>

                <Divider />

                {/* Additional Options */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Additional Options</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Common Options */}
                    <div className="space-y-3">
                      <Checkbox
                        isSelected={formData.includeCharts}
                        onValueChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            includeCharts: checked,
                          }))
                        }
                      >
                        Include Charts and Graphs
                      </Checkbox>
                      <Checkbox
                        isSelected={formData.includeRawData}
                        onValueChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            includeRawData: checked,
                          }))
                        }
                      >
                        Include Raw Data Tables
                      </Checkbox>
                    </div>

                    {/* Type-specific Options */}
                    <div className="space-y-3">
                      {formData.type === "energy_consumption" && (
                        <>
                          <Checkbox
                            isSelected={formData.includeComparison}
                            onValueChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                includeComparison: checked,
                              }))
                            }
                          >
                            Include Period Comparison
                          </Checkbox>
                          <Checkbox
                            isSelected={formData.includeTrends}
                            onValueChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                includeTrends: checked,
                              }))
                            }
                          >
                            Include Trend Analysis
                          </Checkbox>
                        </>
                      )}

                      {formData.type === "power_quality" && (
                        <>
                          <Checkbox
                            isSelected={formData.includeEvents}
                            onValueChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                includeEvents: checked,
                              }))
                            }
                          >
                            Include Event Analysis
                          </Checkbox>
                          <Checkbox
                            isSelected={formData.includeCompliance}
                            onValueChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                includeCompliance: checked,
                              }))
                            }
                          >
                            Include Compliance Assessment
                          </Checkbox>
                        </>
                      )}

                      {(formData.type === "compliance" ||
                        formData.type === "audit_summary") && (
                        <>
                          <Checkbox
                            isSelected={formData.includeRecommendations}
                            onValueChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                includeRecommendations: checked,
                              }))
                            }
                          >
                            Include Recommendations
                          </Checkbox>
                          {formData.type === "compliance" && (
                            <Checkbox
                              isSelected={formData.includeGapAnalysis}
                              onValueChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  includeGapAnalysis: checked,
                                }))
                              }
                            >
                              Include Gap Analysis
                            </Checkbox>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Compliance Standards */}
                  {formData.type === "compliance" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Standards to Include:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {COMPLIANCE_STANDARDS.map((standard) => (
                          <Checkbox
                            key={standard.key}
                            isSelected={formData.standards?.includes(
                              standard.key
                            )}
                            onValueChange={(checked) => {
                              const standards = formData.standards || [];
                              setFormData((prev) => ({
                                ...prev,
                                standards: checked
                                  ? [...standards, standard.key]
                                  : standards.filter((s) => s !== standard.key),
                              }));
                              if (formErrors.standards) {
                                setFormErrors((prev) => {
                                  const { standards, ...rest } = prev;
                                  return rest;
                                });
                              }
                            }}
                          >
                            <span className="text-sm">{standard.label}</span>
                          </Checkbox>
                        ))}
                      </div>
                      {formErrors.standards && (
                        <p className="text-danger text-sm">
                          {formErrors.standards}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Monitoring Report Types */}
                  {formData.type === "monitoring" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Report Types to Include:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {MONITORING_REPORT_TYPES.map((type) => (
                          <Checkbox
                            key={type.key}
                            isSelected={formData.reportTypes?.includes(
                              type.key
                            )}
                            onValueChange={(checked) => {
                              const reportTypes = formData.reportTypes || [];
                              setFormData((prev) => ({
                                ...prev,
                                reportTypes: checked
                                  ? [...reportTypes, type.key]
                                  : reportTypes.filter((t) => t !== type.key),
                              }));
                              if (formErrors.reportTypes) {
                                setFormErrors((prev) => {
                                  const { reportTypes, ...rest } = prev;
                                  return rest;
                                });
                              }
                            }}
                          >
                            <span className="text-sm">{type.label}</span>
                          </Checkbox>
                        ))}
                      </div>
                      {formErrors.reportTypes && (
                        <p className="text-danger text-sm">
                          {formErrors.reportTypes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  disabled={mutationLoading}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleGenerate}
                  isLoading={mutationLoading}
                  disabled={mutationLoading}
                  startContent={
                    !mutationLoading ? <Plus className="w-4 h-4" /> : undefined
                  }
                >
                  {mutationLoading ? "Generating Report..." : "Generate Report"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Report Modal */}
      <Modal isOpen={isViewOpen} onOpenChange={onViewClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <span>Report Details</span>
                  </div>
                  {selectedReport && (
                    <Chip
                      color={
                        (STATUS_CONFIG[
                          selectedReport.status as keyof typeof STATUS_CONFIG
                        ]?.color as any) || "default"
                      }
                      size="sm"
                      startContent={
                        <Clock
                          className={`w-3 h-3 ${
                            selectedReport.status === "generating"
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      }
                    >
                      {STATUS_CONFIG[
                        selectedReport.status as keyof typeof STATUS_CONFIG
                      ]?.label || selectedReport.status}
                    </Chip>
                  )}
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedReport && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Report Information</h4>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-default-700">
                              Title
                            </label>
                            <p className="text-sm">{selectedReport.title}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-default-700">
                              Type
                            </label>
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const typeConfig = REPORT_TYPES.find(
                                  (t) => t.key === selectedReport.type
                                );
                                const Icon = typeConfig?.icon || FileText;
                                const colorClass = {
                                  primary: "text-primary",
                                  secondary: "text-secondary",
                                  success: "text-success",
                                  warning: "text-warning",
                                  danger: "text-danger",
                                  default: "text-default-500",
                                }[typeConfig?.color || "default"];
                                return (
                                  <>
                                    <Icon className={`w-4 h-4 ${colorClass}`} />
                                    <span className="text-sm">
                                      {typeConfig?.label || selectedReport.type}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-default-700">
                              Building
                            </label>
                            <p className="text-sm">
                              {selectedReport.buildingName || "System-wide"}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-default-700">
                              Format
                            </label>
                            <p className="text-sm uppercase">
                              {selectedReport.format}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-default-700">
                              Created
                            </label>
                            <p className="text-sm">
                              {formatDate(selectedReport.createdAt)}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-default-700">
                              Requested By
                            </label>
                            <p className="text-sm">
                              {selectedReport.requesterName || "System"}
                            </p>
                          </div>
                        </div>

                        {selectedReport.description && (
                          <div>
                            <label className="text-sm font-medium text-default-700">
                              Description
                            </label>
                            <p className="text-sm">
                              {selectedReport.description}
                            </p>
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    {/* Status-specific Information */}
                    {selectedReport.status === "generating" && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Generation Progress</h4>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">
                                Processing report sections...
                              </span>
                              <span className="text-sm text-default-500">
                                Estimated 2-5 minutes
                              </span>
                            </div>
                            <Progress
                              value={65}
                              color="primary"
                              size="lg"
                              className="max-w-md"
                            />
                            <div className="flex items-start space-x-2">
                              <Info className="w-4 h-4 text-primary mt-0.5" />
                              <p className="text-sm text-default-600">
                                Your report is being generated in the
                                background. You'll receive a notification when
                                it's ready for download.
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {selectedReport.status === "completed" && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">File Information</h4>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-default-700">
                                File Size
                              </label>
                              <p className="text-sm">
                                {selectedReport.fileSizeMb
                                  ? formatFileSize(selectedReport.fileSizeMb)
                                  : "N/A"}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-default-700">
                                Generation Time
                              </label>
                              <p className="text-sm">
                                {selectedReport.generationTimeSeconds
                                  ? `${selectedReport.generationTimeSeconds}s`
                                  : "N/A"}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-default-700">
                                Downloads
                              </label>
                              <p className="text-sm">
                                {selectedReport.downloadCount || 0} times
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-default-700">
                                Status
                              </label>
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span className="text-sm text-success">
                                  Ready for download
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-success-50 rounded-lg border border-success-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span className="text-sm font-medium text-success">
                                  Report is ready
                                </span>
                              </div>
                              <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                startContent={<Download className="w-4 h-4" />}
                                onPress={() => handleDownload(selectedReport)}
                                isLoading={
                                  selectedReport.id
                                    ? downloadQueue.has(selectedReport.id)
                                    : false
                                }
                                disabled={
                                  !selectedReport.id ||
                                  (selectedReport.id
                                    ? downloadQueue.has(selectedReport.id)
                                    : true)
                                }
                              >
                                {selectedReport.id &&
                                downloadQueue.has(selectedReport.id)
                                  ? "Downloading..."
                                  : "Download Now"}
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {selectedReport.status === "failed" && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Generation Failed</h4>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-3">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-danger mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-danger">
                                  Report generation failed
                                </p>
                                <p className="text-sm text-default-600">
                                  {selectedReport.errorMessage ||
                                    "The report generation encountered an error. Please try generating the report again or contact support if the issue persists."}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              startContent={<RefreshCw className="w-4 h-4" />}
                              onPress={() => {
                                onClose();
                                resetForm();
                                setFormData((prev) => ({
                                  ...prev,
                                  title: selectedReport.title,
                                  type: selectedReport.type,
                                  buildingId: selectedReport.buildingId,
                                  auditId: selectedReport.auditId,
                                }));
                                onCreateOpen();
                              }}
                            >
                              Try Again
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                {selectedReport?.status === "completed" &&
                  selectedReport.id && (
                    <Button
                      color="primary"
                      startContent={<Download className="w-4 h-4" />}
                      onPress={() => handleDownload(selectedReport)}
                      isLoading={downloadQueue.has(selectedReport.id)}
                      disabled={downloadQueue.has(selectedReport.id)}
                    >
                      {downloadQueue.has(selectedReport.id)
                        ? "Downloading..."
                        : "Download Report"}
                    </Button>
                  )}
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
