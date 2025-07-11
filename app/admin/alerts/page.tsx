// app/admin/alerts/page.tsx
"use client";

import React, { useState, useEffect } from "react";

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

// Icons
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  Building as BuildingIcon,
  User,
  ArrowUp,
  Filter,
  Zap,
  Settings,
  Shield,
  Wrench,
  AlertCircle,
  TrendingUp,
  FileText,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  X,
} from "lucide-react";

// API and Types
import { alertsAPI, buildingsAPI, equipmentAPI } from "@/lib/api";
import { Alert, Building, Equipment, ApiResponse } from "@/types/admin";
import { AlertQueryParams } from "@/types/api-types";

const alertTypes = [
  {
    key: "energy_anomaly",
    label: "Energy Anomaly",
    icon: Zap,
    color: "warning",
    description: "Unusual energy consumption patterns detected",
  },
  {
    key: "power_quality",
    label: "Power Quality",
    icon: TrendingUp,
    color: "danger",
    description: "Power quality issues and violations",
  },
  {
    key: "equipment_failure",
    label: "Equipment Failure",
    icon: Settings,
    color: "danger",
    description: "Equipment malfunctions and failures",
  },
  {
    key: "maintenance_due",
    label: "Maintenance Due",
    icon: Wrench,
    color: "warning",
    description: "Scheduled maintenance notifications",
  },
  {
    key: "compliance_violation",
    label: "Compliance Violation",
    icon: Shield,
    color: "danger",
    description: "Regulatory compliance violations",
  },
  {
    key: "safety_concern",
    label: "Safety Concern",
    icon: AlertCircle,
    color: "danger",
    description: "Safety-related issues and concerns",
  },
];

const severityOptions = [
  { key: "low", label: "Low", color: "success" },
  { key: "medium", label: "Medium", color: "warning" },
  { key: "high", label: "High", color: "danger" },
  { key: "critical", label: "Critical", color: "danger" },
];

const statusOptions = [
  { key: "active", label: "Active", color: "danger" },
  { key: "acknowledged", label: "Acknowledged", color: "warning" },
  { key: "resolved", label: "Resolved", color: "success" },
  { key: "escalated", label: "Escalated", color: "danger" },
  { key: "closed", label: "Closed", color: "default" },
];

const priorityOptions = [
  { key: "low", label: "Low" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "High" },
  { key: "urgent", label: "Urgent" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    total_count: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [buildingFilter, setBuildingFilter] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());

  // Selection change handlers
  const handleTypeFilterChange = (keys: any) => {
    setTypeFilter(
      new Set(
        keys === "all"
          ? typeFilterOptions.map((o) => o.key).filter((k) => k)
          : Array.from(keys)
      )
    );
  };

  const handleSeverityFilterChange = (keys: any) => {
    setSeverityFilter(
      new Set(
        keys === "all"
          ? severityFilterOptions.map((o) => o.key).filter((k) => k)
          : Array.from(keys)
      )
    );
  };

  const handleStatusFilterChange = (keys: any) => {
    setStatusFilter(
      new Set(
        keys === "all"
          ? statusFilterOptions.map((o) => o.key).filter((k) => k)
          : Array.from(keys)
      )
    );
  };

  const handleBuildingFilterChange = (keys: any) => {
    setBuildingFilter(
      new Set(
        keys === "all"
          ? buildingFilterOptions.map((o) => o.key).filter((k) => k)
          : Array.from(keys)
      )
    );
  };

  const handlePriorityFilterChange = (keys: any) => {
    setPriorityFilter(
      new Set(
        keys === "all"
          ? priorityFilterOptions.map((o) => o.key).filter((k) => k)
          : Array.from(keys)
      )
    );
  };

  const handleFormTypeChange = (keys: any) => {
    const newType = Array.from(keys)[0] as string;
    setFormData((prev) => ({ ...prev, type: new Set([newType]) }));
  };

  const handleFormSeverityChange = (keys: any) => {
    setFormData((prev) => ({
      ...prev,
      severity: new Set(Array.from(keys)),
    }));
  };

  const handleFormPriorityChange = (keys: any) => {
    setFormData((prev) => ({
      ...prev,
      priority: new Set(Array.from(keys)),
    }));
  };

  const handleFormBuildingChange = (keys: any) => {
    setFormData((prev) => ({
      ...prev,
      building_id: new Set(keys === "all" ? [] : Array.from(keys)),
    }));
  };

  const handleFormEquipmentChange = (keys: any) => {
    setFormData((prev) => ({
      ...prev,
      equipment_id: new Set(keys === "all" ? [] : Array.from(keys)),
    }));
  };

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
  const {
    isOpen: isAcknowledgeOpen,
    onOpen: onAcknowledgeOpen,
    onClose: onAcknowledgeClose,
  } = useDisclosure();
  const {
    isOpen: isResolveOpen,
    onOpen: onResolveOpen,
    onClose: onResolveClose,
  } = useDisclosure();
  const {
    isOpen: isEscalateOpen,
    onOpen: onEscalateOpen,
    onClose: onEscalateClose,
  } = useDisclosure();

  // Selected alert
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    description: "",
    type: new Set(["energy_anomaly"]),
    severity: new Set(["medium"]),
    priority: new Set(["normal"]),
    building_id: new Set<string>(),
    equipment_id: new Set<string>(),
    detected_value: "",
    threshold_value: "",
    unit: "",
    tags: [] as string[],
  });

  const [actionData, setActionData] = useState({
    notes: "",
    escalation_reason: "",
    assigned_to: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Create options arrays for Selects
  const typeFilterOptions = [
    { key: "", label: "All Types" },
    ...alertTypes.map((type) => ({ key: type.key, label: type.label })),
  ];

  const severityFilterOptions = [
    { key: "", label: "All Severities" },
    ...severityOptions.map((severity) => ({
      key: severity.key,
      label: severity.label,
    })),
  ];

  const statusFilterOptions = [
    { key: "", label: "All Statuses" },
    ...statusOptions.map((status) => ({
      key: status.key,
      label: status.label,
    })),
  ];

  const buildingFilterOptions = [
    { key: "", label: "All Buildings" },
    ...(buildings || []).map((building) => ({
      key: building.id.toString(),
      label: building.name,
    })),
  ];

  const priorityFilterOptions = [
    { key: "", label: "All Priorities" },
    ...priorityOptions.map((priority) => ({
      key: priority.key,
      label: priority.label,
    })),
  ];

  const buildingFormOptions = [
    { key: "", label: "Select Building (Optional)" },
    ...(buildings || []).map((building) => ({
      key: building.id.toString(),
      label: building.name,
    })),
  ];

  const equipmentFormOptions = [
    { key: "", label: "Select Equipment (Optional)" },
    ...(equipment || []).map((eq) => ({
      key: eq.id.toString(),
      label: `${eq.name} (${eq.equipment_type})`,
    })),
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [
    pagination.current_page,
    typeFilter,
    severityFilter,
    statusFilter,
    buildingFilter,
    priorityFilter,
  ]);

  // Auto-refresh alerts every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAlerts(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    pagination.current_page,
    typeFilter,
    severityFilter,
    statusFilter,
    buildingFilter,
    priorityFilter,
  ]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [buildingsRes, equipmentRes] = await Promise.all([
        buildingsAPI.getAll({ status: "active" }),
        equipmentAPI.getAll({ status: "operational" }),
      ]);

      if (buildingsRes.data.success) {
        setBuildings(buildingsRes.data.data);
      }

      if (equipmentRes.data.success) {
        setEquipment(equipmentRes.data.data);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params: AlertQueryParams = {
        page: pagination.current_page,
        limit: pagination.per_page,
        sortBy: "created_at",
        sortOrder: "DESC",
      };

      // Remove search parameter since it's not in AlertQueryParams
      // if (searchTerm) params.search = searchTerm;
      if (typeFilter.size > 0) {
        const selectedType = Array.from(typeFilter)[0];
        if (selectedType) params.type = selectedType as any;
      }
      if (severityFilter.size > 0) {
        const selectedSeverity = Array.from(severityFilter)[0];
        if (selectedSeverity) params.severity = selectedSeverity as any;
      }
      if (statusFilter.size > 0) {
        const selectedStatus = Array.from(statusFilter)[0];
        if (selectedStatus) params.status = selectedStatus as any;
      }
      if (buildingFilter.size > 0) {
        const selectedBuilding = Array.from(buildingFilter)[0];
        if (selectedBuilding) params.building_id = Number(selectedBuilding);
      }
      if (priorityFilter.size > 0) {
        const selectedPriority = Array.from(priorityFilter)[0];
        if (selectedPriority) params.priority = selectedPriority as any;
      }

      const response = await alertsAPI.getAll(params);

      if (response.data.success) {
        const data = response.data.data;
        setAlerts(Array.isArray(data) ? data : []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      description: "",
      type: new Set(["energy_anomaly"]),
      severity: new Set(["medium"]),
      priority: new Set(["normal"]),
      building_id: new Set(),
      equipment_id: new Set(),
      detected_value: "",
      threshold_value: "",
      unit: "",
      tags: [],
    });
    setFormErrors({});
  };

  const resetActionData = () => {
    setActionData({
      notes: "",
      escalation_reason: "",
      assigned_to: "",
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Alert title is required";
    if (!formData.message.trim()) errors.message = "Alert message is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setActionLoading(true);

      const selectedBuildingId = Array.from(formData.building_id)[0];
      const selectedEquipmentId = Array.from(formData.equipment_id)[0];

      const alertData = {
        title: formData.title,
        message: formData.message,
        description: formData.description,
        type: Array.from(formData.type)[0] as any,
        severity: Array.from(formData.severity)[0] as any,
        priority: Array.from(formData.priority)[0] as any,
        building_id:
          selectedBuildingId && selectedBuildingId !== ""
            ? Number(selectedBuildingId)
            : undefined,
        equipment_id:
          selectedEquipmentId && selectedEquipmentId !== ""
            ? Number(selectedEquipmentId)
            : undefined,
        detected_value: formData.detected_value
          ? Number(formData.detected_value)
          : undefined,
        threshold_value: formData.threshold_value
          ? Number(formData.threshold_value)
          : undefined,
        unit: formData.unit || undefined,
        tags: formData.tags,
      };

      const response = await alertsAPI.create(alertData);

      if (response.data.success) {
        await loadAlerts();
        onCreateClose();
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create alert:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);

      const response = await alertsAPI.acknowledge(selectedAlert.id);

      if (response.data.success) {
        await loadAlerts();
        onAcknowledgeClose();
        setSelectedAlert(null);
        resetActionData();
      }
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);

      const response = await alertsAPI.resolve(selectedAlert.id, {
        resolution_notes: actionData.notes,
      });

      if (response.data.success) {
        await loadAlerts();
        onResolveClose();
        setSelectedAlert(null);
        resetActionData();
      }
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);

      const response = await alertsAPI.escalate(selectedAlert.id, {
        escalation_reason: actionData.escalation_reason,
        assigned_to: actionData.assigned_to
          ? Number(actionData.assigned_to)
          : undefined,
      });

      if (response.data.success) {
        await loadAlerts();
        onEscalateClose();
        setSelectedAlert(null);
        resetActionData();
      }
    } catch (error) {
      console.error("Failed to escalate alert:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (alert: Alert) => {
    if (!confirm(`Are you sure you want to delete alert "${alert.title}"?`))
      return;

    try {
      const response = await alertsAPI.delete(alert.id);

      if (response.data.success) {
        await loadAlerts();
      }
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  const openViewModal = (alert: Alert) => {
    setSelectedAlert(alert);
    onViewOpen();
  };

  const openActionModal = (alert: Alert, action: string) => {
    setSelectedAlert(alert);
    resetActionData();

    switch (action) {
      case "acknowledge":
        onAcknowledgeOpen();
        break;
      case "resolve":
        onResolveOpen();
        break;
      case "escalate":
        onEscalateOpen();
        break;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "success";
      case "acknowledged":
        return "warning";
      case "escalated":
        return "danger";
      case "active":
        return "danger";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const getTypeInfo = (type: string) => {
    return (
      alertTypes.find((t) => t.key === type) || {
        label: type,
        icon: AlertTriangle,
        color: "default",
      }
    );
  };

  const formatAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  // Filter alerts client-side for search since API doesn't support search
  const filteredAlerts = searchTerm
    ? (alerts || []).filter(
        (alert) =>
          alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (alert.building_name &&
            alert.building_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (alert.equipment_name &&
            alert.equipment_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      )
    : alerts || [];

  const getAlertStats = () => {
    const alertList = filteredAlerts || [];
    const stats = {
      total: alertList.length,
      critical: alertList.filter((a) => a.severity === "critical").length,
      high: alertList.filter((a) => a.severity === "high").length,
      active: alertList.filter((a) => a.status === "active").length,
      acknowledged: alertList.filter((a) => a.status === "acknowledged").length,
    };

    return stats;
  };

  if (loading && (!alerts || alerts.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

  const stats = getAlertStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <AlertTriangle className="w-8 h-8 mr-3 text-danger" />
            Alerts Management
          </h1>
          <p className="text-default-500 mt-1">
            Monitor and manage system alerts, notifications, and incidents
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="light"
            startContent={
              autoRefresh ? (
                <Clock className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )
            }
            onPress={() => setAutoRefresh(!autoRefresh)}
            color={autoRefresh ? "success" : "default"}
          >
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => {
              resetForm();
              onCreateOpen();
            }}
          >
            Create Alert
          </Button>
        </div>
      </div>

      {/* Alert Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {alertTypes.map((type) => {
          const Icon = type.icon;
          const count = (filteredAlerts || []).filter(
            (a) => a.type === type.key
          ).length;

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
                <h3 className="font-semibold text-foreground text-sm">
                  {type.label}
                </h3>
                <p className="text-xs text-default-500 mt-1">
                  {type.description}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Alerts</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.total}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Critical</p>
                <p className="text-2xl font-bold text-danger">
                  {stats.critical}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-danger" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">High Priority</p>
                <p className="text-2xl font-bold text-danger">{stats.high}</p>
              </div>
              <ArrowUp className="w-8 h-8 text-danger" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Active</p>
                <p className="text-2xl font-bold text-danger">{stats.active}</p>
              </div>
              <Clock className="w-8 h-8 text-danger" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Acknowledged</p>
                <p className="text-2xl font-bold text-warning">
                  {stats.acknowledged}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <Input
              placeholder="Search alerts..."
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
              placeholder="Severity"
              selectedKeys={severityFilter}
              onSelectionChange={handleSeverityFilterChange}
            >
              {severityFilterOptions.map((option) => (
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
              placeholder="Priority"
              selectedKeys={priorityFilter}
              onSelectionChange={handlePriorityFilterChange}
            >
              {priorityFilterOptions.map((option) => (
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
              onPress={() => {
                setSearchTerm("");
                setTypeFilter(new Set());
                setSeverityFilter(new Set());
                setStatusFilter(new Set());
                setBuildingFilter(new Set());
                setPriorityFilter(new Set());
              }}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Alerts table">
            <TableHeader>
              <TableColumn>Alert</TableColumn>
              <TableColumn>Type</TableColumn>
              <TableColumn>Severity</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Building</TableColumn>
              <TableColumn>Age</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {!filteredAlerts || filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-default-300 mx-auto mb-4" />
                      <p className="text-default-500">No alerts found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert) => {
                  const typeInfo = getTypeInfo(alert.type);
                  const Icon = typeInfo.icon;

                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-foreground flex items-center">
                            <Icon
                              className={`w-4 h-4 mr-2 text-${typeInfo.color}`}
                            />
                            {alert.title}
                          </div>
                          <div className="text-sm text-default-500 truncate max-w-xs">
                            {alert.message}
                          </div>
                          {alert.equipment_name && (
                            <div className="text-xs text-default-400 flex items-center mt-1">
                              <Settings className="w-3 h-3 mr-1" />
                              {alert.equipment_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={typeInfo.color as any}
                          size="sm"
                          variant="flat"
                        >
                          {typeInfo.label}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getSeverityColor(alert.severity) as any}
                          size="sm"
                          variant="solid"
                        >
                          {alert.severity.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {alert.status === "resolved" ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : alert.status === "acknowledged" ? (
                            <Clock className="w-4 h-4 text-warning" />
                          ) : alert.status === "escalated" ? (
                            <ArrowUp className="w-4 h-4 text-danger" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-danger" />
                          )}
                          <Chip
                            color={getStatusColor(alert.status) as any}
                            size="sm"
                            variant="flat"
                          >
                            {alert.status}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.building_name ? (
                          <div className="flex items-center">
                            <BuildingIcon className="w-4 h-4 mr-2 text-default-400" />
                            <span className="text-sm">
                              {alert.building_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-default-500">System-wide</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatAge(alert.created_at)}
                          {alert.escalation_level &&
                            alert.escalation_level > 0 && (
                              <div className="text-xs text-danger">
                                Escalated L{alert.escalation_level}
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openViewModal(alert)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {alert.status === "active" && (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="warning"
                              onPress={() =>
                                openActionModal(alert, "acknowledge")
                              }
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}

                          {(alert.status === "active" ||
                            alert.status === "acknowledged") && (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="success"
                              onPress={() => openActionModal(alert, "resolve")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}

                          {(alert.status === "active" ||
                            alert.status === "acknowledged") && (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => openActionModal(alert, "escalate")}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                          )}

                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(alert)}
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

      {/* Create Alert Modal */}
      <Modal isOpen={isCreateOpen} onOpenChange={onCreateClose} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Create New Alert</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Alert Title"
                  placeholder="Enter alert title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  errorMessage={formErrors.title}
                  isInvalid={!!formErrors.title}
                />

                <Textarea
                  label="Alert Message"
                  placeholder="Enter alert message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  errorMessage={formErrors.message}
                  isInvalid={!!formErrors.message}
                />

                <Textarea
                  label="Description (Optional)"
                  placeholder="Enter detailed description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Alert Type"
                    selectedKeys={formData.type}
                    onSelectionChange={handleFormTypeChange}
                  >
                    {alertTypes.map((type) => (
                      <SelectItem key={type.key}>{type.label}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Severity"
                    selectedKeys={formData.severity}
                    onSelectionChange={handleFormSeverityChange}
                  >
                    {severityOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Priority"
                    selectedKeys={formData.priority}
                    onSelectionChange={handleFormPriorityChange}
                  >
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Building (Optional)"
                    placeholder="Select building"
                    selectedKeys={formData.building_id}
                    onSelectionChange={handleFormBuildingChange}
                  >
                    {buildingFormOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Equipment (Optional)"
                    placeholder="Select equipment"
                    selectedKeys={formData.equipment_id}
                    onSelectionChange={handleFormEquipmentChange}
                  >
                    {equipmentFormOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Detected Value (Optional)"
                    placeholder="Enter detected value"
                    type="number"
                    value={formData.detected_value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        detected_value: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Threshold Value (Optional)"
                    placeholder="Enter threshold value"
                    type="number"
                    value={formData.threshold_value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        threshold_value: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Unit (Optional)"
                    placeholder="e.g., kW, V, A, %"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, unit: e.target.value }))
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleCreate}
                  isLoading={actionLoading}
                >
                  Create Alert
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Alert Modal */}
      <Modal isOpen={isViewOpen} onOpenChange={onViewClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  <Chip
                    color={
                      getSeverityColor(selectedAlert?.severity || "") as any
                    }
                    size="sm"
                  >
                    {selectedAlert?.severity?.toUpperCase()}
                  </Chip>
                  <Chip
                    color={getStatusColor(selectedAlert?.status || "") as any}
                    size="sm"
                  >
                    {selectedAlert?.status}
                  </Chip>
                  <span>Alert Details</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedAlert && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Alert Information</h4>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <div>
                          <strong>Title:</strong> {selectedAlert.title}
                        </div>
                        <div>
                          <strong>Message:</strong> {selectedAlert.message}
                        </div>
                        {selectedAlert.description && (
                          <div>
                            <strong>Description:</strong>{" "}
                            {selectedAlert.description}
                          </div>
                        )}
                        <div>
                          <strong>Type:</strong>{" "}
                          {getTypeInfo(selectedAlert.type).label}
                        </div>
                        <div>
                          <strong>Priority:</strong> {selectedAlert.priority}
                        </div>
                        <div>
                          <strong>Building:</strong>{" "}
                          {selectedAlert.building_name || "System-wide"}
                        </div>
                        {selectedAlert.equipment_name && (
                          <div>
                            <strong>Equipment:</strong>{" "}
                            {selectedAlert.equipment_name}
                          </div>
                        )}
                        <div>
                          <strong>Created:</strong>{" "}
                          {new Date(selectedAlert.created_at).toLocaleString()}
                        </div>
                        {selectedAlert.acknowledged_at && (
                          <div>
                            <strong>Acknowledged:</strong>{" "}
                            {new Date(
                              selectedAlert.acknowledged_at
                            ).toLocaleString()}
                          </div>
                        )}
                        {selectedAlert.resolved_at && (
                          <div>
                            <strong>Resolved:</strong>{" "}
                            {new Date(
                              selectedAlert.resolved_at
                            ).toLocaleString()}
                          </div>
                        )}
                        {selectedAlert.detected_value && (
                          <div>
                            <strong>Detected Value:</strong>{" "}
                            {selectedAlert.detected_value}{" "}
                            {selectedAlert.unit || ""}
                          </div>
                        )}
                        {selectedAlert.threshold_value && (
                          <div>
                            <strong>Threshold Value:</strong>{" "}
                            {selectedAlert.threshold_value}{" "}
                            {selectedAlert.unit || ""}
                          </div>
                        )}
                        {selectedAlert.escalation_level &&
                          selectedAlert.escalation_level > 0 && (
                            <div>
                              <strong>Escalation Level:</strong> Level{" "}
                              {selectedAlert.escalation_level}
                            </div>
                          )}
                      </CardBody>
                    </Card>

                    {selectedAlert.recommended_actions &&
                      Array.isArray(selectedAlert.recommended_actions) &&
                      selectedAlert.recommended_actions.length > 0 && (
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold">
                              Recommended Actions
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-2">
                              {selectedAlert.recommended_actions.map(
                                (action, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start space-x-2"
                                  >
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                    <div>
                                      <div className="font-medium">
                                        {action.action ||
                                          "Action not specified"}
                                      </div>
                                      <div className="text-sm text-default-500">
                                        Priority:{" "}
                                        {action.priority || "Not specified"} |
                                        Duration:{" "}
                                        {action.estimated_duration_hours || 0}h
                                        {action.estimated_cost &&
                                          ` | Cost: ₱${action.estimated_cost}`}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      )}

                    {selectedAlert.root_cause_analysis && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Root Cause Analysis</h4>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-2">
                            {selectedAlert.root_cause_analysis
                              .primary_cause && (
                              <div>
                                <strong>Primary Cause:</strong>{" "}
                                {
                                  selectedAlert.root_cause_analysis
                                    .primary_cause
                                }
                              </div>
                            )}
                            {selectedAlert.root_cause_analysis
                              .contributing_factors &&
                              Array.isArray(
                                selectedAlert.root_cause_analysis
                                  .contributing_factors
                              ) &&
                              selectedAlert.root_cause_analysis
                                .contributing_factors.length > 0 && (
                                <div>
                                  <strong>Contributing Factors:</strong>
                                  <ul className="list-disc list-inside ml-4 mt-1">
                                    {selectedAlert.root_cause_analysis.contributing_factors.map(
                                      (factor, index) => (
                                        <li key={index} className="text-sm">
                                          {factor}
                                        </li>
                                      )
                                    )}
                                  </ul>
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
                <Button onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Acknowledge Alert Modal */}
      <Modal isOpen={isAcknowledgeOpen} onOpenChange={onAcknowledgeClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Acknowledge Alert</ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to acknowledge the alert "
                  {selectedAlert?.title}"?
                </p>
                <p className="text-sm text-default-500">
                  This will change the status to "Acknowledged" and record your
                  acknowledgment.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="warning"
                  onPress={handleAcknowledge}
                  isLoading={actionLoading}
                >
                  Acknowledge
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Resolve Alert Modal */}
      <Modal isOpen={isResolveOpen} onOpenChange={onResolveClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Resolve Alert</ModalHeader>
              <ModalBody className="space-y-4">
                <p>Resolve the alert "{selectedAlert?.title}"</p>
                <Textarea
                  label="Resolution Notes"
                  placeholder="Enter resolution details..."
                  value={actionData.notes}
                  onChange={(e) =>
                    setActionData((prev) => ({
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
                <Button
                  color="success"
                  onPress={handleResolve}
                  isLoading={actionLoading}
                >
                  Resolve
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Escalate Alert Modal */}
      <Modal isOpen={isEscalateOpen} onOpenChange={onEscalateClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Escalate Alert</ModalHeader>
              <ModalBody className="space-y-4">
                <p>Escalate the alert "{selectedAlert?.title}"</p>
                <Textarea
                  label="Escalation Reason"
                  placeholder="Enter reason for escalation..."
                  value={actionData.escalation_reason}
                  onChange={(e) =>
                    setActionData((prev) => ({
                      ...prev,
                      escalation_reason: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Assign To (User ID - Optional)"
                  placeholder="Enter user ID to assign"
                  type="number"
                  value={actionData.assigned_to}
                  onChange={(e) =>
                    setActionData((prev) => ({
                      ...prev,
                      assigned_to: e.target.value,
                    }))
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleEscalate}
                  isLoading={actionLoading}
                >
                  Escalate
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
