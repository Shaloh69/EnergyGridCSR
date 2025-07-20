// app/admin/compliance/page.tsx - FIXED COMPLIANCE MANAGEMENT PAGE
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
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";

// Icons
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Building2,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Filter,
  Settings,
  ExternalLink,
} from "lucide-react";

// API and Hooks
import {
  complianceAPI,
  auditsAPI,
  buildingsAPI,
  dashboardAPI,
} from "@/lib/api";

import { useAuth } from "@/hooks/useApi";

// Types
import type {
  ComplianceCheck,
  Audit,
  Building,
  ComplianceSummary,
  ApiResponse,
} from "@/types/api-types";

// Response Handlers
import {
  safeExtractObjectData,
  safeExtractArrayData,
  isSafeObjectSuccess,
  isSafeArraySuccess,
  SafeObjectResult,
  SafeArrayResult,
} from "@/lib/api-response-handler";

// Utilities
import { extractErrorMessage } from "@/lib/api-utils";

// ===== INTERFACES =====

interface ComplianceFilters {
  auditId: string;
  buildingId: string;
  standard: string;
  status: string;
  severity: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

interface ComplianceStats {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  overallScore: number;
  criticalIssues: number;
  dueSoon: number;
}

// ===== CONSTANTS =====

const COMPLIANCE_STANDARDS = [
  {
    key: "PEC2017",
    name: "PEC 2017",
    title: "Philippine Electrical Code 2017",
    description: "Electrical installation and safety standards",
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
    title: "Systems Quality Evaluation",
    description: "Software and system quality standards",
    color: "secondary" as const,
  },
  {
    key: "RA11285",
    name: "RA 11285",
    title: "Energy Efficiency & Conservation Act",
    description: "Philippine energy efficiency requirements",
    color: "success" as const,
  },
] as const;

const STATUS_OPTIONS = [
  { key: "all", label: "All Statuses", color: "default" },
  { key: "passed", label: "Passed", color: "success" },
  { key: "failed", label: "Failed", color: "danger" },
  { key: "warning", label: "Warning", color: "warning" },
  { key: "not_applicable", label: "Not Applicable", color: "default" },
  { key: "not_checked", label: "Not Checked", color: "default" },
  { key: "compliant", label: "Compliant", color: "success" },
  { key: "non_compliant", label: "Non Compliant", color: "danger" },
] as const;

const SEVERITY_OPTIONS = [
  { key: "all", label: "All Severities", color: "default" },
  { key: "critical", label: "Critical", color: "danger" },
  { key: "high", label: "High", color: "warning" },
  { key: "medium", label: "Medium", color: "primary" },
  { key: "low", label: "Low", color: "default" },
] as const;

// ===== MAIN COMPONENT =====

export default function CompliancePage() {
  const { user } = useAuth();

  // ===== STATE MANAGEMENT =====

  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<ComplianceFilters>({
    auditId: "",
    buildingId: "",
    standard: "all",
    status: "all",
    severity: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheck | null>(
    null
  );
  const [editingCheck, setEditingCheck] = useState<ComplianceCheck | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Data states
  const [complianceSummary, setComplianceSummary] =
    useState<ComplianceSummary | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>(
    []
  );
  const [complianceTrends, setComplianceTrends] = useState<any>(null);

  // Loading states
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [checksLoading, setChecksLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Error states
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [auditsError, setAuditsError] = useState<string | null>(null);
  const [buildingsError, setBuildingsError] = useState<string | null>(null);
  const [checksError, setChecksError] = useState<string | null>(null);

  // Form states
  const [newCheckForm, setNewCheckForm] = useState({
    auditId: "",
    standard: "PEC2017",
    requirementCode: "",
    requirementTitle: "",
    requirementDescription: "",
    status: "not_checked",
    severity: "medium",
    notes: "",
    correctiveAction: "",
    targetCompletionDate: "",
    responsibleParty: "",
    evidence: "",
  });

  const [checkOperation, setCheckOperation] = useState({
    auditId: "",
    standardType: "PEC2017" as const,
    checkData: {} as Record<string, any>,
  });

  // Modal controls
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onOpenChange: onDetailOpenChange,
  } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onOpenChange: onCreateOpenChange,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();
  const {
    isOpen: isRunCheckOpen,
    onOpen: onRunCheckOpen,
    onOpenChange: onRunCheckOpenChange,
  } = useDisclosure();
  const {
    isOpen: isTrendsOpen,
    onOpen: onTrendsOpen,
    onOpenChange: onTrendsOpenChange,
  } = useDisclosure();

  // ===== API FUNCTIONS =====

  const loadComplianceSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      console.log("🔄 Loading compliance summary...");
      const response = await dashboardAPI.getComplianceSummary();
      console.log("📥 Raw compliance summary response:", response);

      const result: SafeObjectResult<ComplianceSummary> =
        safeExtractObjectData(response);
      console.log("🔍 Extracted compliance summary result:", result);

      if (isSafeObjectSuccess(result)) {
        setComplianceSummary(result.data);
        console.log("✅ Compliance summary loaded successfully:", result.data);
      } else {
        console.error("❌ Failed to extract compliance summary:", result.error);
        setSummaryError(result.error);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error("❌ Error loading compliance summary:", errorMessage);
      setSummaryError(errorMessage);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadAudits = useCallback(async () => {
    setAuditsLoading(true);
    setAuditsError(null);
    try {
      console.log("🔄 Loading audits...");
      const response = await auditsAPI.getAll({
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      console.log("📥 Raw audits response:", response);

      const result: SafeArrayResult<Audit> = safeExtractArrayData(response);
      console.log("🔍 Extracted audits result:", result);

      if (isSafeArraySuccess(result)) {
        setAudits(result.data);
        console.log(
          "✅ Audits loaded successfully:",
          result.data.length,
          "audits"
        );

        // Auto-select first audit if none selected
        if (result.data.length > 0 && !filters.auditId) {
          setFilters((prev) => ({
            ...prev,
            auditId: result.data[0].id.toString(),
          }));
        }
      } else {
        console.error("❌ Failed to extract audits:", result.error);
        setAuditsError(result.error);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error("❌ Error loading audits:", errorMessage);
      setAuditsError(errorMessage);
    } finally {
      setAuditsLoading(false);
    }
  }, [filters.auditId]);

  const loadBuildings = useCallback(async () => {
    setBuildingsLoading(true);
    setBuildingsError(null);
    try {
      console.log("🔄 Loading buildings...");
      const response = await buildingsAPI.getAll({
        status: "active",
        limit: 100,
        sortBy: "name",
        sortOrder: "ASC",
      });
      console.log("📥 Raw buildings response:", response);

      const result: SafeArrayResult<Building> = safeExtractArrayData(response);
      console.log("🔍 Extracted buildings result:", result);

      if (isSafeArraySuccess(result)) {
        setBuildings(result.data);
        console.log(
          "✅ Buildings loaded successfully:",
          result.data.length,
          "buildings"
        );

        // Auto-select first building if none selected
        if (result.data.length > 0 && !filters.buildingId) {
          setFilters((prev) => ({
            ...prev,
            buildingId: result.data[0].id.toString(),
          }));
        }
      } else {
        console.error("❌ Failed to extract buildings:", result.error);
        setBuildingsError(result.error);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error("❌ Error loading buildings:", errorMessage);
      setBuildingsError(errorMessage);
    } finally {
      setBuildingsLoading(false);
    }
  }, [filters.buildingId]);

  const loadComplianceChecks = useCallback(async () => {
    if (!filters.auditId) {
      console.log("⚠️ No audit selected, skipping compliance checks load");
      setComplianceChecks([]);
      return;
    }

    setChecksLoading(true);
    setChecksError(null);
    try {
      console.log("🔄 Loading compliance checks for audit:", filters.auditId);
      const response = await complianceAPI.getComplianceChecksByAudit(
        Number(filters.auditId)
      );
      console.log("📥 Raw compliance checks response:", response);

      const result: SafeArrayResult<ComplianceCheck> =
        safeExtractArrayData(response);
      console.log("🔍 Extracted compliance checks result:", result);

      if (isSafeArraySuccess(result)) {
        setComplianceChecks(result.data);
        console.log(
          "✅ Compliance checks loaded successfully:",
          result.data.length,
          "checks"
        );
      } else {
        console.error("❌ Failed to extract compliance checks:", result.error);
        setChecksError(result.error);
        setComplianceChecks([]);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error("❌ Error loading compliance checks:", errorMessage);
      setChecksError(errorMessage);
      setComplianceChecks([]);
    } finally {
      setChecksLoading(false);
    }
  }, [filters.auditId]);

  const loadComplianceTrends = useCallback(async () => {
    if (!filters.buildingId) {
      console.log("⚠️ No building selected, skipping trends load");
      return;
    }

    setTrendsLoading(true);
    try {
      console.log(
        "🔄 Loading compliance trends for building:",
        filters.buildingId
      );
      const response = await complianceAPI.getComplianceTrends(
        Number(filters.buildingId),
        filters.standard && filters.standard !== "all"
          ? { standard: filters.standard }
          : undefined
      );
      console.log("📥 Raw compliance trends response:", response);

      const result: SafeObjectResult<any> = safeExtractObjectData(response);
      console.log("🔍 Extracted compliance trends result:", result);

      if (isSafeObjectSuccess(result)) {
        setComplianceTrends(result.data);
        console.log("✅ Compliance trends loaded successfully:", result.data);
      } else {
        console.error("❌ Failed to extract compliance trends:", result.error);
        setComplianceTrends(null);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error("❌ Error loading compliance trends:", errorMessage);
      setComplianceTrends(null);
    } finally {
      setTrendsLoading(false);
    }
  }, [filters.buildingId, filters.standard]);

  // ===== COMPUTED VALUES =====

  const filteredChecks = useMemo(() => {
    if (!complianceChecks || !Array.isArray(complianceChecks)) {
      console.log(
        "⚠️ No compliance checks data or not array:",
        complianceChecks
      );
      return [];
    }

    console.log(
      "🔍 Filtering",
      complianceChecks.length,
      "checks with filters:",
      filters
    );

    return complianceChecks.filter((check) => {
      if (!check) return false;

      // Standard filter
      if (filters.standard && filters.standard !== "all") {
        const checkStandard = check.standardType || check.standard;
        if (checkStandard !== filters.standard) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== "all") {
        if (check.status !== filters.status) {
          return false;
        }
      }

      // Severity filter
      if (filters.severity && filters.severity !== "all") {
        if (check.severity !== filters.severity) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = (check.requirementTitle || "")
          .toLowerCase()
          .includes(searchLower);
        const codeMatch = (check.requirementCode || "")
          .toLowerCase()
          .includes(searchLower);
        const descMatch = (check.requirementDescription || "")
          .toLowerCase()
          .includes(searchLower);

        if (!titleMatch && !codeMatch && !descMatch) {
          return false;
        }
      }

      // Date filters
      if (filters.dateFrom && check.assessmentDate) {
        if (new Date(check.assessmentDate) < new Date(filters.dateFrom)) {
          return false;
        }
      }

      if (filters.dateTo && check.assessmentDate) {
        if (new Date(check.assessmentDate) > new Date(filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [complianceChecks, filters]);

  const complianceStats = useMemo((): ComplianceStats => {
    if (!filteredChecks || filteredChecks.length === 0) {
      return {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0,
        overallScore: 0,
        criticalIssues: 0,
        dueSoon: 0,
      };
    }

    const stats = filteredChecks.reduce(
      (acc, check) => {
        acc.totalChecks++;

        switch (check.status) {
          case "passed":
          case "compliant":
            acc.passedChecks++;
            break;
          case "failed":
          case "non_compliant":
            acc.failedChecks++;
            break;
          case "warning":
            acc.warningChecks++;
            break;
        }

        if (check.severity === "critical") {
          acc.criticalIssues++;
        }

        // Check if due soon (within 7 days)
        if (check.targetCompletionDate) {
          const dueDate = new Date(check.targetCompletionDate);
          const now = new Date();
          const diffDays = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays <= 7 && diffDays >= 0) {
            acc.dueSoon++;
          }
        }

        return acc;
      },
      {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0,
        overallScore: 0,
        criticalIssues: 0,
        dueSoon: 0,
      }
    );

    // Calculate overall score
    if (stats.totalChecks > 0) {
      stats.overallScore = Math.round(
        (stats.passedChecks / stats.totalChecks) * 100
      );
    }

    console.log("📊 Calculated compliance stats:", stats);
    return stats;
  }, [filteredChecks]);

  const paginatedChecks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredChecks.slice(startIndex, endIndex);
  }, [filteredChecks, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredChecks.length / pageSize);

  // ===== HELPER FUNCTIONS =====

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find((opt) => opt.key === status);
    return option?.color || "default";
  };

  const getSeverityColor = (severity: string) => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.key === severity);
    return option?.color || "default";
  };

  const getStandardColor = (standard: string) => {
    const standardInfo = COMPLIANCE_STANDARDS.find((s) => s.key === standard);
    return standardInfo?.color || "default";
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "danger";
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  // ===== EVENT HANDLERS =====

  const handleFilterChange = (key: keyof ComplianceFilters, value: string) => {
    console.log("🔧 Filter change:", key, "=", value);
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleRunComplianceCheck = async () => {
    if (!checkOperation.auditId) {
      alert("Please select an audit");
      return;
    }

    try {
      console.log("🔄 Running compliance check...", checkOperation);
      const response = await complianceAPI.performComplianceCheck({
        auditId: Number(checkOperation.auditId),
        standardType: checkOperation.standardType,
        checkData: checkOperation.checkData,
      });

      const result: SafeObjectResult<any> = safeExtractObjectData(response);
      if (isSafeObjectSuccess(result)) {
        await loadComplianceChecks();
        onRunCheckOpenChange();
        alert("Compliance check completed successfully");
      } else {
        alert(`Failed to run compliance check: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      alert(`Error running compliance check: ${errorMessage}`);
    }
  };

  const handleCreateCheck = async () => {
    if (!newCheckForm.auditId || !newCheckForm.requirementCode) {
      alert("Please fill in required fields");
      return;
    }

    try {
      console.log("🔄 Creating compliance check...", newCheckForm);
      const response = await complianceAPI.createComplianceCheck({
        auditId: Number(newCheckForm.auditId),
        standard: newCheckForm.standard,
        requirementCode: newCheckForm.requirementCode,
        requirementTitle: newCheckForm.requirementTitle,
        requirementDescription: newCheckForm.requirementDescription,
        status: newCheckForm.status as any,
        severity: newCheckForm.severity as any,
        notes: newCheckForm.notes,
        correctiveAction: newCheckForm.correctiveAction,
        targetCompletionDate: newCheckForm.targetCompletionDate || undefined,
        responsibleParty: newCheckForm.responsibleParty,
        evidence: newCheckForm.evidence,
        assessorId: user?.id || 0,
        assessmentDate: new Date().toISOString(),
      });

      const result: SafeObjectResult<ComplianceCheck> =
        safeExtractObjectData(response);
      if (isSafeObjectSuccess(result)) {
        await loadComplianceChecks();
        onCreateOpenChange();
        setNewCheckForm({
          auditId: "",
          standard: "PEC2017",
          requirementCode: "",
          requirementTitle: "",
          requirementDescription: "",
          status: "not_checked",
          severity: "medium",
          notes: "",
          correctiveAction: "",
          targetCompletionDate: "",
          responsibleParty: "",
          evidence: "",
        });
        alert("Compliance check created successfully");
      } else {
        alert(`Failed to create compliance check: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      alert(`Error creating compliance check: ${errorMessage}`);
    }
  };

  const handleUpdateCheck = async () => {
    if (!editingCheck?.id) return;

    try {
      console.log("🔄 Updating compliance check...", editingCheck);
      const response = await complianceAPI.updateComplianceCheck(
        editingCheck.id,
        {
          status: editingCheck.status,
          severity: editingCheck.severity,
          notes: editingCheck.notes,
          correctiveAction: editingCheck.correctiveAction,
          targetCompletionDate: editingCheck.targetCompletionDate,
          responsibleParty: editingCheck.responsibleParty,
          evidence: editingCheck.evidence,
          actualCompletionDate:
            editingCheck.status === "passed" ||
            editingCheck.status === "compliant"
              ? new Date().toISOString()
              : undefined,
        }
      );

      const result: SafeObjectResult<ComplianceCheck> =
        safeExtractObjectData(response);
      if (isSafeObjectSuccess(result)) {
        await loadComplianceChecks();
        onEditOpenChange();
        setEditingCheck(null);
        alert("Compliance check updated successfully");
      } else {
        alert(`Failed to update compliance check: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      alert(`Error updating compliance check: ${errorMessage}`);
    }
  };

  const handleDeleteCheck = async (checkId: number) => {
    if (!confirm("Are you sure you want to delete this compliance check?")) {
      return;
    }

    try {
      console.log("🔄 Deleting compliance check:", checkId);
      const response = await complianceAPI.deleteComplianceCheck(checkId);
      const result: SafeObjectResult<any> = safeExtractObjectData(response);
      if (isSafeObjectSuccess(result)) {
        await loadComplianceChecks();
        alert("Compliance check deleted successfully");
      } else {
        alert(`Failed to delete compliance check: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      alert(`Error deleting compliance check: ${errorMessage}`);
    }
  };

  const openDetailModal = (check: ComplianceCheck) => {
    setSelectedCheck(check);
    onDetailOpen();
  };

  const openEditModal = (check: ComplianceCheck) => {
    setEditingCheck({ ...check });
    onEditOpen();
  };

  const openTrendsModal = () => {
    loadComplianceTrends();
    onTrendsOpen();
  };

  const refreshAllData = useCallback(async () => {
    console.log("🔄 Refreshing all compliance data...");
    await Promise.all([
      loadComplianceSummary(),
      loadAudits(),
      loadBuildings(),
      loadComplianceChecks(),
    ]);
  }, [loadComplianceSummary, loadAudits, loadBuildings, loadComplianceChecks]);

  // ===== EFFECTS =====

  // Initial data load
  useEffect(() => {
    console.log("🚀 Initial data load...");
    loadComplianceSummary();
    loadAudits();
    loadBuildings();
  }, [loadComplianceSummary, loadAudits, loadBuildings]);

  // Load compliance checks when audit changes
  useEffect(() => {
    if (filters.auditId) {
      console.log(
        "🔄 Audit changed, loading compliance checks for:",
        filters.auditId
      );
      loadComplianceChecks();
    }
  }, [filters.auditId, loadComplianceChecks]);

  // ===== LOADING STATE =====

  if (summaryLoading && auditsLoading && buildingsLoading) {
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

  // ===== RENDER =====

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" />
            Compliance Management
          </h1>
          <p className="text-default-500 mt-1">
            Monitor, analyze, and manage compliance across all energy and safety
            standards
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="default"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={refreshAllData}
            isLoading={summaryLoading || auditsLoading || buildingsLoading}
          >
            Refresh
          </Button>
          <Button
            color="secondary"
            variant="flat"
            startContent={<TrendingUp className="w-4 h-4" />}
            onPress={openTrendsModal}
            isDisabled={!filters.buildingId}
          >
            View Trends
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={onRunCheckOpen}
            isDisabled={!filters.auditId}
          >
            Run Check
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
        variant="underlined"
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
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {complianceStats.overallScore}%
                      </div>
                      <div className="text-sm text-default-500">
                        Overall Compliance
                      </div>
                    </div>
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <Progress
                    value={complianceStats.overallScore}
                    color={
                      getComplianceColor(complianceStats.overallScore) as any
                    }
                    size="sm"
                    className="mt-2"
                  />
                </CardBody>
              </Card>

              <Card className="border-l-4 border-l-success">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {complianceStats.passedChecks}
                      </div>
                      <div className="text-sm text-default-500">
                        Passed Checks
                      </div>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <div className="text-xs text-default-400 mt-1">
                    of {complianceStats.totalChecks} total
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-l-danger">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {complianceStats.criticalIssues}
                      </div>
                      <div className="text-sm text-default-500">
                        Critical Issues
                      </div>
                    </div>
                    <AlertCircle className="w-8 h-8 text-danger" />
                  </div>
                  <div className="text-xs text-default-400 mt-1">
                    Immediate attention required
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-l-warning">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {complianceStats.dueSoon}
                      </div>
                      <div className="text-sm text-default-500">Due Soon</div>
                    </div>
                    <Clock className="w-8 h-8 text-warning" />
                  </div>
                  <div className="text-xs text-default-400 mt-1">
                    Within 7 days
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Standards Breakdown */}
            {complianceSummary && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    Standards Compliance
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {COMPLIANCE_STANDARDS.map((standard) => {
                      const standardData = complianceSummary.byStandard?.find(
                        (s: any) => s.standard === standard.key
                      );
                      const score = standardData?.complianceRate || 0;
                      const violations = standardData?.violations || 0;

                      return (
                        <Card
                          key={standard.key}
                          className={`border-l-4 border-l-${standard.color}`}
                        >
                          <CardBody className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-foreground">
                                    {standard.name}
                                  </div>
                                  <div className="text-xs text-default-500">
                                    {standard.title}
                                  </div>
                                </div>
                                <Shield
                                  className={`w-6 h-6 text-${standard.color}`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-default-600">
                                    Score
                                  </span>
                                  <span className="font-medium">
                                    {score.toFixed(1)}%
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
                                  color={getComplianceColor(score) as any}
                                  size="sm"
                                  variant="flat"
                                >
                                  {score >= 90
                                    ? "Excellent"
                                    : score >= 70
                                      ? "Good"
                                      : "Needs Work"}
                                </Chip>
                                {violations > 0 && (
                                  <div className="text-xs text-danger">
                                    {violations} issues
                                  </div>
                                )}
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
            {complianceSummary?.recentIssues && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recent Issues</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {complianceSummary.recentIssues
                      .slice(0, 5)
                      .map((issue: any, index: number) => (
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
                              {issue.severity}
                            </Chip>
                            <span className="text-xs text-default-500">
                              {formatDate(issue.dueDate)}
                            </span>
                          </div>
                          <div className="font-medium text-sm">
                            {issue.description}
                          </div>
                          <div className="text-xs text-default-500">
                            {issue.buildingName}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="checks"
          title={
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Compliance Checks</span>
              {complianceStats.totalChecks > 0 && (
                <Chip size="sm" variant="flat">
                  {complianceStats.totalChecks}
                </Chip>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                  <Select
                    label="Audit"
                    placeholder="Select audit"
                    selectedKeys={filters.auditId ? [filters.auditId] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      handleFilterChange("auditId", selectedKey || "");
                    }}
                    isDisabled={!audits || audits.length === 0}
                    isLoading={auditsLoading}
                  >
                    {audits && audits.length > 0 ? (
                      audits.map((audit) => (
                        <SelectItem key={audit.id.toString()}>
                          {audit.title || `Audit ${audit.id}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-audits" isDisabled>
                        No audits available
                      </SelectItem>
                    )}
                  </Select>

                  <Select
                    label="Standard"
                    placeholder="All standards"
                    selectedKeys={filters.standard ? [filters.standard] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      handleFilterChange("standard", selectedKey || "all");
                    }}
                  >
                    <SelectItem key="all">All Standards</SelectItem>
                    {COMPLIANCE_STANDARDS.map((standard) => (
                      <SelectItem key={standard.key}>
                        {standard.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Status"
                    placeholder="All statuses"
                    selectedKeys={filters.status ? [filters.status] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      handleFilterChange("status", selectedKey || "all");
                    }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Severity"
                    placeholder="All severities"
                    selectedKeys={filters.severity ? [filters.severity] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      handleFilterChange("severity", selectedKey || "all");
                    }}
                  >
                    {SEVERITY_OPTIONS.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="From Date"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />

                  <Input
                    label="To Date"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <Input
                    className="flex-1"
                    placeholder="Search checks..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    startContent={<Search className="w-4 h-4" />}
                  />
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<Plus className="w-4 h-4" />}
                      onPress={onCreateOpen}
                      isDisabled={!filters.auditId}
                    >
                      Add Check
                    </Button>
                    <Button
                      variant="flat"
                      isIconOnly
                      onPress={loadComplianceChecks}
                      isLoading={checksLoading}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="text-sm text-default-600">
                    Showing {paginatedChecks.length} of {filteredChecks.length}{" "}
                    checks
                  </div>
                  <div className="flex gap-2">
                    <Chip color="success" size="sm" variant="dot">
                      {complianceStats.passedChecks} Passed
                    </Chip>
                    <Chip color="danger" size="sm" variant="dot">
                      {complianceStats.failedChecks} Failed
                    </Chip>
                    <Chip color="warning" size="sm" variant="dot">
                      {complianceStats.warningChecks} Warning
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Checks Table */}
            <Card>
              <CardBody className="p-0">
                {checksLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : checksError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
                    <p className="text-danger mb-4">
                      Failed to load compliance checks
                    </p>
                    <p className="text-sm text-default-500 mb-4">
                      {checksError}
                    </p>
                    <Button color="primary" onPress={loadComplianceChecks}>
                      Retry
                    </Button>
                  </div>
                ) : paginatedChecks.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-default-300 mx-auto mb-4" />
                    <p className="text-default-500 mb-4">
                      {filters.auditId
                        ? filteredChecks.length === 0 &&
                          complianceChecks.length > 0
                          ? "No checks match your filters"
                          : "No compliance checks found for this audit"
                        : "Select an audit to view compliance checks"}
                    </p>
                    {filters.auditId &&
                      filteredChecks.length === 0 &&
                      complianceChecks.length === 0 && (
                        <Button color="primary" onPress={onCreateOpen}>
                          Create First Check
                        </Button>
                      )}
                  </div>
                ) : (
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
                    <TableBody>
                      {paginatedChecks.map((check) => (
                        <TableRow key={check.id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-foreground">
                                {check.requirementTitle || "Untitled Check"}
                              </div>
                              <div className="text-sm text-default-500">
                                {check.requirementCode || "No code"}
                              </div>
                              {check.requirementDescription && (
                                <div className="text-xs text-default-400 mt-1 line-clamp-2">
                                  {check.requirementDescription}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={
                                getStandardColor(
                                  check.standardType || check.standard || ""
                                ) as any
                              }
                              size="sm"
                              variant="flat"
                            >
                              {check.standardType ||
                                check.standard ||
                                "Unknown"}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {check.status === "passed" ||
                              check.status === "compliant" ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : check.status === "failed" ||
                                check.status === "non_compliant" ? (
                                <XCircle className="w-4 h-4 text-danger" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-warning" />
                              )}
                              <Chip
                                color={
                                  getStatusColor(check.status || "") as any
                                }
                                size="sm"
                                variant="flat"
                              >
                                {check.status || "Unknown"}
                              </Chip>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={
                                getSeverityColor(
                                  check.severity || "medium"
                                ) as any
                              }
                              size="sm"
                              variant="flat"
                            >
                              {check.severity || "medium"}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {check.targetCompletionDate ? (
                              <div>
                                <div className="text-sm">
                                  {formatDate(check.targetCompletionDate)}
                                </div>
                                {new Date(check.targetCompletionDate) <
                                  new Date() && (
                                  <div className="text-xs text-danger">
                                    Overdue
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-default-400">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {check.responsibleParty || "Not assigned"}
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
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleDeleteCheck(check.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                  showControls
                  showShadow
                />
              </div>
            )}
          </div>
        </Tab>

        <Tab
          key="reports"
          title={
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Reports</span>
            </div>
          }
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Compliance Reports</h3>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-default-300 mx-auto mb-4" />
                <p className="text-default-500 mb-4">
                  Generate compliance reports
                </p>
                <Button color="primary" isDisabled>
                  Generate Report (Coming Soon)
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Modals */}

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onOpenChange={onDetailOpenChange} size="2xl">
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
                          <strong>Standard:</strong>{" "}
                          {selectedCheck.standardType || selectedCheck.standard}
                        </div>
                        <div>
                          <strong>Code:</strong> {selectedCheck.requirementCode}
                        </div>
                        <div>
                          <strong>Title:</strong>{" "}
                          {selectedCheck.requirementTitle}
                        </div>
                        {selectedCheck.requirementDescription && (
                          <div>
                            <strong>Description:</strong>{" "}
                            {selectedCheck.requirementDescription}
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
                            {selectedCheck.severity}
                          </Chip>
                        </div>
                        <div>
                          <strong>Assessed:</strong>{" "}
                          {formatDate(selectedCheck.assessmentDate)}
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Status & Actions</h4>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <div>
                          <strong>Status:</strong> {selectedCheck.status}
                        </div>
                        {selectedCheck.notes && (
                          <div>
                            <strong>Notes:</strong> {selectedCheck.notes}
                          </div>
                        )}
                        {selectedCheck.correctiveAction && (
                          <div>
                            <strong>Corrective Action:</strong>{" "}
                            {selectedCheck.correctiveAction}
                          </div>
                        )}
                        {selectedCheck.targetCompletionDate && (
                          <div>
                            <strong>Due Date:</strong>{" "}
                            {formatDate(selectedCheck.targetCompletionDate)}
                          </div>
                        )}
                        {selectedCheck.responsibleParty && (
                          <div>
                            <strong>Responsible:</strong>{" "}
                            {selectedCheck.responsibleParty}
                          </div>
                        )}
                        {selectedCheck.evidence && (
                          <div>
                            <strong>Evidence:</strong> {selectedCheck.evidence}
                          </div>
                        )}
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
      <Modal isOpen={isCreateOpen} onOpenChange={onCreateOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Create New Compliance Check</ModalHeader>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Audit"
                    placeholder="Select audit"
                    selectedKeys={
                      newCheckForm.auditId ? [newCheckForm.auditId] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setNewCheckForm((prev) => ({
                        ...prev,
                        auditId: selectedKey || "",
                      }));
                    }}
                  >
                    {audits && audits.length > 0 ? (
                      audits.map((audit) => (
                        <SelectItem key={audit.id.toString()}>
                          {audit.title || `Audit ${audit.id}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-audits" isDisabled>
                        No audits available
                      </SelectItem>
                    )}
                  </Select>

                  <Select
                    label="Standard"
                    selectedKeys={[newCheckForm.standard]}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setNewCheckForm((prev) => ({
                        ...prev,
                        standard: selectedKey,
                      }));
                    }}
                  >
                    {COMPLIANCE_STANDARDS.map((standard) => (
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
                    value={newCheckForm.requirementCode}
                    onChange={(e) =>
                      setNewCheckForm((prev) => ({
                        ...prev,
                        requirementCode: e.target.value,
                      }))
                    }
                  />

                  <Select
                    label="Severity"
                    selectedKeys={[newCheckForm.severity]}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setNewCheckForm((prev) => ({
                        ...prev,
                        severity: selectedKey,
                      }));
                    }}
                  >
                    {SEVERITY_OPTIONS.filter(
                      (option) => option.key !== "all"
                    ).map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <Textarea
                  label="Requirement Title"
                  placeholder="Title of the compliance requirement"
                  value={newCheckForm.requirementTitle}
                  onChange={(e) =>
                    setNewCheckForm((prev) => ({
                      ...prev,
                      requirementTitle: e.target.value,
                    }))
                  }
                />

                <Textarea
                  label="Description"
                  placeholder="Detailed description of the requirement"
                  value={newCheckForm.requirementDescription}
                  onChange={(e) =>
                    setNewCheckForm((prev) => ({
                      ...prev,
                      requirementDescription: e.target.value,
                    }))
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Target Completion Date"
                    type="date"
                    value={newCheckForm.targetCompletionDate}
                    onChange={(e) =>
                      setNewCheckForm((prev) => ({
                        ...prev,
                        targetCompletionDate: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Responsible Party"
                    placeholder="Person responsible"
                    value={newCheckForm.responsibleParty}
                    onChange={(e) =>
                      setNewCheckForm((prev) => ({
                        ...prev,
                        responsibleParty: e.target.value,
                      }))
                    }
                  />
                </div>

                <Textarea
                  label="Notes"
                  placeholder="Additional notes"
                  value={newCheckForm.notes}
                  onChange={(e) =>
                    setNewCheckForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleCreateCheck}>
                  Create Check
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Check Modal */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} size="2xl">
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
                            <strong>Standard:</strong>{" "}
                            {editingCheck.standardType || editingCheck.standard}
                          </div>
                          <div>
                            <strong>Code:</strong>{" "}
                            {editingCheck.requirementCode}
                          </div>
                          <div>
                            <strong>Title:</strong>{" "}
                            {editingCheck.requirementTitle}
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Select
                      label="Status"
                      selectedKeys={[editingCheck.status || ""]}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setEditingCheck((prev) =>
                          prev ? { ...prev, status: selectedKey as any } : null
                        );
                      }}
                    >
                      {STATUS_OPTIONS.filter(
                        (option) => option.key !== "all"
                      ).map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>

                    <Select
                      label="Severity"
                      selectedKeys={[editingCheck.severity || "medium"]}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setEditingCheck((prev) =>
                          prev
                            ? { ...prev, severity: selectedKey as any }
                            : null
                        );
                      }}
                    >
                      {SEVERITY_OPTIONS.filter(
                        (option) => option.key !== "all"
                      ).map((option) => (
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
                      value={editingCheck.correctiveAction || ""}
                      onChange={(e) =>
                        setEditingCheck((prev) =>
                          prev
                            ? { ...prev, correctiveAction: e.target.value }
                            : null
                        )
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Target Completion Date"
                        type="date"
                        value={
                          editingCheck.targetCompletionDate
                            ? new Date(editingCheck.targetCompletionDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setEditingCheck((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  targetCompletionDate: e.target.value,
                                }
                              : null
                          )
                        }
                      />

                      <Input
                        label="Responsible Party"
                        value={editingCheck.responsibleParty || ""}
                        onChange={(e) =>
                          setEditingCheck((prev) =>
                            prev
                              ? { ...prev, responsibleParty: e.target.value }
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
                <Button color="primary" onPress={handleUpdateCheck}>
                  Update Check
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Run Check Modal */}
      <Modal
        isOpen={isRunCheckOpen}
        onOpenChange={onRunCheckOpenChange}
        size="3xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Run Compliance Check</ModalHeader>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Audit"
                    placeholder="Select audit"
                    selectedKeys={
                      checkOperation.auditId ? [checkOperation.auditId] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setCheckOperation((prev) => ({
                        ...prev,
                        auditId: selectedKey || "",
                      }));
                    }}
                  >
                    {audits && audits.length > 0 ? (
                      audits.map((audit) => (
                        <SelectItem key={audit.id.toString()}>
                          {audit.title || `Audit ${audit.id}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-audits" isDisabled>
                        No audits available
                      </SelectItem>
                    )}
                  </Select>

                  <Select
                    label="Standard Type"
                    selectedKeys={[checkOperation.standardType]}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setCheckOperation((prev) => ({
                        ...prev,
                        standardType: selectedKey as any,
                      }));
                    }}
                  >
                    {COMPLIANCE_STANDARDS.map((standard) => (
                      <SelectItem key={standard.key}>
                        {standard.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <Card>
                  <CardBody>
                    <div className="text-center py-8">
                      <Settings className="w-12 h-12 text-default-300 mx-auto mb-4" />
                      <p className="text-default-500">
                        Compliance check configuration interface coming soon
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleRunComplianceCheck}>
                  Run Check
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Trends Modal */}
      <Modal isOpen={isTrendsOpen} onOpenChange={onTrendsOpenChange} size="4xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5" />
                  <span>Compliance Trends</span>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Select
                  label="Building"
                  placeholder="Select building"
                  selectedKeys={filters.buildingId ? [filters.buildingId] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleFilterChange("buildingId", selectedKey || "");
                    if (selectedKey) {
                      loadComplianceTrends();
                    }
                  }}
                >
                  {buildings && buildings.length > 0 ? (
                    buildings.map((building) => (
                      <SelectItem key={building.id.toString()}>
                        {building.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-buildings" isDisabled>
                      No buildings available
                    </SelectItem>
                  )}
                </Select>

                {trendsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : complianceTrends ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Trends Overview</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="text-center py-8">
                          <TrendingUp className="w-12 h-12 text-success mx-auto mb-4" />
                          <p className="text-default-500">
                            Trends data will be displayed here
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardBody>
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-default-300 mx-auto mb-4" />
                        <p className="text-default-500">
                          Select a building to view compliance trends
                        </p>
                      </div>
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
                  Export
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
