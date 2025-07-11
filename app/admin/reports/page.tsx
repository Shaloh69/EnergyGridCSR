// app/admin/reports/page.tsx
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
import { Pagination } from "@heroui/pagination";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";

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
} from "lucide-react";

// API and Types
import { reportsAPI, buildingsAPI } from "@/lib/api";
import {
  Report,
  Building,
  ApiResponse,
  Pagination as PaginationType,
} from "@/types/admin";

interface ReportsResponse {
  reports: Report[];
  pagination: PaginationType;
}

interface ReportType {
  key: string;
  label: string;
  icon: any;
  color: string;
  description: string;
}

interface SelectOption {
  key: string;
  label: string;
}

interface StatusOption extends SelectOption {
  color: string;
}

interface FormData {
  title: string;
  type: Set<string>;
  building_id: Set<string>;
  start_date: string;
  end_date: string;
  include_comparison: boolean;
  include_trends: boolean;
  report_format: Set<string>;
  sections: string[];
}

interface SectionOption {
  key: string;
  label: string;
}

const reportTypes: ReportType[] = [
  {
    key: "energy",
    label: "Energy Report",
    icon: Zap,
    color: "primary",
    description: "Energy consumption and efficiency analysis",
  },
  {
    key: "compliance",
    label: "Compliance Report",
    icon: Shield,
    color: "secondary",
    description: "Regulatory compliance status and violations",
  },
  {
    key: "audit",
    label: "Audit Report",
    icon: FileText,
    color: "warning",
    description: "Comprehensive audit findings and recommendations",
  },
  {
    key: "analytics",
    label: "Analytics Report",
    icon: BarChart3,
    color: "success",
    description: "Advanced analytics and insights",
  },
  {
    key: "maintenance",
    label: "Maintenance Report",
    icon: Settings,
    color: "danger",
    description: "Equipment maintenance status and schedules",
  },
];

const statusOptions: StatusOption[] = [
  { key: "generating", label: "Generating", color: "warning" },
  { key: "completed", label: "Completed", color: "success" },
  { key: "failed", label: "Failed", color: "danger" },
];

const formatOptions: SelectOption[] = [
  { key: "pdf", label: "PDF" },
  { key: "excel", label: "Excel" },
  { key: "csv", label: "CSV" },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationType>({
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    total_count: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [buildingFilter, setBuildingFilter] = useState<Set<string>>(new Set());

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

  // Selected report
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: new Set(["energy"]),
    building_id: new Set<string>(),
    start_date: "",
    end_date: "",
    include_comparison: true,
    include_trends: true,
    report_format: new Set(["pdf"]),
    sections: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  // Create options arrays - MOVED BEFORE HANDLERS
  const typeFilterOptions: SelectOption[] = [
    { key: "", label: "All Types" },
    ...reportTypes.map((type) => ({ key: type.key, label: type.label })),
  ];

  const statusFilterOptions: SelectOption[] = [
    { key: "", label: "All Statuses" },
    ...statusOptions.map((status) => ({
      key: status.key,
      label: status.label,
    })),
  ];

  const buildingFilterOptions: SelectOption[] = [
    { key: "", label: "All Buildings" },
    ...buildings.map((building) => ({
      key: building.id.toString(),
      label: building.name,
    })),
  ];

  const buildingFormOptions: SelectOption[] = [
    { key: "", label: "All Buildings" },
    ...buildings.map((building) => ({
      key: building.id.toString(),
      label: building.name,
    })),
  ];

  // Selection change handlers - NOW SAFE TO USE OPTIONS ARRAYS
  const handleTypeFilterChange = useCallback(
    (keys: any) => {
      if (!keys) return;
      setTypeFilter(
        new Set(
          keys === "all"
            ? typeFilterOptions.map((o) => o.key).filter((k) => k)
            : Array.from(keys)
        )
      );
    },
    [typeFilterOptions]
  );

  const handleStatusFilterChange = useCallback(
    (keys: any) => {
      if (!keys) return;
      setStatusFilter(
        new Set(
          keys === "all"
            ? statusFilterOptions.map((o) => o.key).filter((k) => k)
            : Array.from(keys)
        )
      );
    },
    [statusFilterOptions]
  );

  const handleBuildingFilterChange = useCallback(
    (keys: any) => {
      if (!keys) return;
      setBuildingFilter(
        new Set(
          keys === "all"
            ? buildingFilterOptions.map((o) => o.key).filter((k) => k)
            : Array.from(keys)
        )
      );
    },
    [buildingFilterOptions]
  );

  const handleFormTypeChange = useCallback((keys: any) => {
    if (!keys) return;
    const keysArray = Array.from(keys);
    if (keysArray.length === 0) return;

    const newType = keysArray[0] as string;
    setFormData((prev) => ({
      ...prev,
      type: new Set([newType]),
      sections: getAvailableSections(newType)
        .slice(0, 3)
        .map((s) => s.key),
    }));
  }, []);

  const handleFormBuildingChange = useCallback((keys: any) => {
    if (!keys) return;
    setFormData((prev) => ({
      ...prev,
      building_id: new Set(keys === "all" ? [] : Array.from(keys)),
    }));
  }, []);

  const handleFormFormatChange = useCallback((keys: any) => {
    if (!keys) return;
    setFormData((prev) => ({
      ...prev,
      report_format: new Set(Array.from(keys)),
    }));
  }, []);

  // Available sections based on report type
  const getAvailableSections = (type: string): SectionOption[] => {
    switch (type) {
      case "energy":
        return [
          { key: "executive_summary", label: "Executive Summary" },
          { key: "consumption_analysis", label: "Consumption Analysis" },
          { key: "cost_analysis", label: "Cost Analysis" },
          { key: "efficiency_metrics", label: "Efficiency Metrics" },
          { key: "recommendations", label: "Recommendations" },
          { key: "forecasting", label: "Energy Forecasting" },
        ];
      case "compliance":
        return [
          { key: "compliance_overview", label: "Compliance Overview" },
          { key: "violations_summary", label: "Violations Summary" },
          { key: "corrective_actions", label: "Corrective Actions" },
          { key: "risk_assessment", label: "Risk Assessment" },
          { key: "regulatory_updates", label: "Regulatory Updates" },
        ];
      case "audit":
        return [
          { key: "audit_methodology", label: "Audit Methodology" },
          { key: "findings_summary", label: "Findings Summary" },
          { key: "compliance_status", label: "Compliance Status" },
          {
            key: "improvement_opportunities",
            label: "Improvement Opportunities",
          },
          { key: "action_plan", label: "Action Plan" },
        ];
      case "analytics":
        return [
          { key: "performance_metrics", label: "Performance Metrics" },
          { key: "trend_analysis", label: "Trend Analysis" },
          { key: "anomaly_detection", label: "Anomaly Detection" },
          { key: "predictive_insights", label: "Predictive Insights" },
          { key: "benchmarking", label: "Benchmarking" },
        ];
      case "maintenance":
        return [
          { key: "equipment_status", label: "Equipment Status" },
          { key: "maintenance_schedule", label: "Maintenance Schedule" },
          { key: "performance_history", label: "Performance History" },
          { key: "cost_tracking", label: "Cost Tracking" },
          { key: "recommendations", label: "Maintenance Recommendations" },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReports();
  }, [
    pagination.current_page,
    searchTerm,
    typeFilter,
    statusFilter,
    buildingFilter,
  ]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const buildingsRes = await buildingsAPI.getAll({ status: "active" });
      if (buildingsRes?.data?.success && buildingsRes.data.data?.buildings) {
        setBuildings(buildingsRes.data.data.buildings);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const params: any = {
        page: pagination.current_page,
        limit: pagination.per_page,
      };

      if (searchTerm) params.search = searchTerm;

      // Safe array access for filters
      const typeArray = Array.from(typeFilter);
      if (typeArray.length > 0 && typeArray[0]) {
        params.type = typeArray[0];
      }

      const statusArray = Array.from(statusFilter);
      if (statusArray.length > 0 && statusArray[0]) {
        params.status = statusArray[0];
      }

      const buildingArray = Array.from(buildingFilter);
      if (buildingArray.length > 0 && buildingArray[0]) {
        params.building_id = buildingArray[0];
      }

      const response = await reportsAPI.getAll(params);

      if (response?.data?.success && response.data.data) {
        const data: ReportsResponse = response.data.data;
        setReports(data.reports || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: new Set(["energy"]),
      building_id: new Set(),
      start_date: "",
      end_date: "",
      include_comparison: true,
      include_trends: true,
      report_format: new Set(["pdf"]),
      sections: ["executive_summary", "consumption_analysis", "cost_analysis"],
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Report title is required";
    if (!formData.start_date) errors.start_date = "Start date is required";
    if (!formData.end_date) errors.end_date = "End date is required";
    if (formData.sections.length === 0)
      errors.sections = "At least one section is required";

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        errors.end_date = "End date must be after start date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    try {
      setGenerating(true);

      const buildingArray = Array.from(formData.building_id);
      const selectedBuildingId =
        buildingArray.length > 0 ? buildingArray[0] : undefined;

      const typeArray = Array.from(formData.type);
      const formatArray = Array.from(formData.report_format);

      const reportData = {
        title: formData.title,
        type: typeArray.length > 0 ? typeArray[0] : "energy",
        building_id:
          selectedBuildingId && selectedBuildingId !== ""
            ? Number(selectedBuildingId)
            : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        include_comparison: formData.include_comparison,
        include_trends: formData.include_trends,
        report_format: formatArray.length > 0 ? formatArray[0] : "pdf",
        sections: formData.sections,
      };

      let response;

      switch (reportData.type) {
        case "energy":
          response = await reportsAPI.generateEnergy(reportData);
          break;
        case "compliance":
          response = await reportsAPI.generateCompliance(reportData);
          break;
        default:
          // For other types, use energy endpoint as fallback
          response = await reportsAPI.generateEnergy(reportData);
      }

      if (response?.data?.success) {
        await loadReports();
        onCreateClose();
        resetForm();
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await reportsAPI.download(report.id);

      // Create blob and download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  const handleDelete = async (report: Report) => {
    if (!confirm(`Are you sure you want to delete "${report.title}"?`)) return;

    try {
      const response = await reportsAPI.delete(report.id);

      if (response?.data?.success) {
        await loadReports();
      }
    } catch (error) {
      console.error("Failed to delete report:", error);
    }
  };

  const openViewModal = (report: Report) => {
    setSelectedReport(report);
    onViewOpen();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "success";
      case "generating":
        return "warning";
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  const getTypeInfo = (type: string) => {
    return (
      reportTypes.find((t) => t.key === type) || {
        key: type,
        label: type,
        icon: FileText,
        color: "default",
        description: "",
      }
    );
  };

  const formatFileSize = (sizeMb?: number): string => {
    if (!sizeMb) return "N/A";
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(0)} KB`;
    return `${sizeMb.toFixed(1)} MB`;
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter(new Set());
    setStatusFilter(new Set());
    setBuildingFilter(new Set());
  };

  // Handle section toggle
  const handleSectionToggle = (sectionKey: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.includes(sectionKey)
        ? prev.sections.filter((s) => s !== sectionKey)
        : [...prev.sections, sectionKey],
    }));
  };

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <FileText className="w-8 h-8 mr-3 text-primary" />
            Reports Management
          </h1>
          <p className="text-default-500 mt-1">
            Generate and manage comprehensive reports for energy, compliance,
            and analytics
          </p>
        </div>
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

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          const count = reports.filter((r) => r.type === type.key).length;

          return (
            <Card
              key={type.key}
              className={`border-l-4 border-l-${type.color} cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 text-${type.color}`} />
                  <Chip color={type.color as any} size="sm" variant="flat">
                    {count}
                  </Chip>
                </div>
                <h3 className="font-semibold text-foreground">{type.label}</h3>
                <p className="text-xs text-default-500 mt-1">
                  {type.description}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-4 h-4 text-default-400" />}
            />

            <Select
              placeholder="Type"
              selectedKeys={typeFilter}
              onSelectionChange={handleTypeFilterChange}
            >
              {typeFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Status"
              selectedKeys={statusFilter}
              onSelectionChange={handleStatusFilterChange}
            >
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Building"
              selectedKeys={buildingFilter}
              onSelectionChange={handleBuildingFilterChange}
            >
              {buildingFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Button
              variant="light"
              startContent={<Filter className="w-4 h-4" />}
              onPress={handleClearFilters}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Reports table">
            <TableHeader>
              <TableColumn>Report</TableColumn>
              <TableColumn>Type</TableColumn>
              <TableColumn>Building</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Size</TableColumn>
              <TableColumn>Created</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-default-300 mx-auto mb-4" />
                      <p className="text-default-500">No reports found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => {
                  const typeInfo = getTypeInfo(report.type);
                  const Icon = typeInfo.icon;

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-foreground">
                            {report.title}
                          </div>
                          <div className="text-sm text-default-500">
                            Report #{report.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Icon
                            className={`w-4 h-4 mr-2 text-${typeInfo.color}`}
                          />
                          <Chip
                            color={typeInfo.color as any}
                            size="sm"
                            variant="flat"
                          >
                            {typeInfo.label}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.building_name ? (
                          <div className="flex items-center">
                            <BuildingIcon className="w-4 h-4 mr-2 text-default-400" />
                            <span className="text-sm">
                              {report.building_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-default-500">System-wide</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {report.status === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : report.status === "generating" ? (
                            <Clock className="w-4 h-4 text-warning" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-danger" />
                          )}
                          <Chip
                            color={getStatusColor(report.status) as any}
                            size="sm"
                            variant="flat"
                          >
                            {report.status}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatFileSize(report.file_size_mb)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(report.created_at).toLocaleDateString()}
                          <div className="text-xs text-default-500">
                            {new Date(report.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openViewModal(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {report.status === "completed" &&
                            report.download_url && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onPress={() => handleDownload(report)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}

                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(report)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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

      {/* Generate Report Modal */}
      <Modal isOpen={isCreateOpen} onOpenChange={onCreateClose} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Generate New Report</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Report Title"
                  placeholder="Enter report title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  errorMessage={formErrors.title}
                  isInvalid={!!formErrors.title}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Report Type"
                    selectedKeys={formData.type}
                    onSelectionChange={handleFormTypeChange}
                  >
                    {reportTypes.map((type) => (
                      <SelectItem key={type.key}>{type.label}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Building (Optional)"
                    placeholder="Select building or leave empty for all"
                    selectedKeys={formData.building_id}
                    onSelectionChange={handleFormBuildingChange}
                  >
                    {buildingFormOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.start_date}
                    isInvalid={!!formErrors.start_date}
                  />

                  <Input
                    type="date"
                    label="End Date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.end_date}
                    isInvalid={!!formErrors.end_date}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Format"
                    selectedKeys={formData.report_format}
                    onSelectionChange={handleFormFormatChange}
                  >
                    {formatOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.include_comparison}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              include_comparison: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Include Comparison</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.include_trends}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              include_trends: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Include Trends</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Report Sections
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {getAvailableSections(
                      Array.from(formData.type)[0] || "energy"
                    ).map((section) => (
                      <Chip
                        key={section.key}
                        variant={
                          formData.sections.includes(section.key)
                            ? "solid"
                            : "bordered"
                        }
                        color="primary"
                        className="cursor-pointer justify-start"
                        onClick={() => handleSectionToggle(section.key)}
                      >
                        {section.label}
                      </Chip>
                    ))}
                  </div>
                  {formErrors.sections && (
                    <p className="text-danger text-xs mt-1">
                      {formErrors.sections}
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
                  onPress={handleGenerate}
                  isLoading={generating}
                >
                  Generate Report
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
                <div className="flex items-center space-x-3">
                  <Chip
                    color={getStatusColor(selectedReport?.status || "") as any}
                    size="sm"
                  >
                    {selectedReport?.status}
                  </Chip>
                  <span>Report Details</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedReport && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Report Information</h4>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <div>
                          <strong>Title:</strong> {selectedReport.title}
                        </div>
                        <div>
                          <strong>Type:</strong>{" "}
                          {getTypeInfo(selectedReport.type).label}
                        </div>
                        <div>
                          <strong>Building:</strong>{" "}
                          {selectedReport.building_name || "System-wide"}
                        </div>
                        <div>
                          <strong>Status:</strong>
                          <Chip
                            color={getStatusColor(selectedReport.status) as any}
                            size="sm"
                            className="ml-2"
                          >
                            {selectedReport.status}
                          </Chip>
                        </div>
                        <div>
                          <strong>Created:</strong>{" "}
                          {new Date(selectedReport.created_at).toLocaleString()}
                        </div>
                        {selectedReport.file_size_mb && (
                          <div>
                            <strong>File Size:</strong>{" "}
                            {formatFileSize(selectedReport.file_size_mb)}
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    {selectedReport.status === "generating" && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Generation Progress</h4>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Processing...</span>
                              <span>Estimated 2-5 minutes</span>
                            </div>
                            <Progress value={65} color="primary" size="lg" />
                            <p className="text-sm text-default-600">
                              Your report is being generated. You will be
                              notified when it's ready for download.
                            </p>
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
                          <p className="text-sm text-danger">
                            The report generation failed. Please try again or
                            contact support if the issue persists.
                          </p>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {selectedReport?.status === "completed" &&
                  selectedReport.download_url && (
                    <Button
                      color="primary"
                      startContent={<Download className="w-4 h-4" />}
                      onPress={() => {
                        if (selectedReport) handleDownload(selectedReport);
                      }}
                    >
                      Download
                    </Button>
                  )}
                <Button onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
