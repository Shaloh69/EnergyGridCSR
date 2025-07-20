// app/admin/equipment/page.tsx
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
import { Textarea, Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { Badge } from "@heroui/badge";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";

// Icons - Import with proper fallbacks
import {
  Settings,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  QrCode,
  Zap,
  Building as BuildingIcon,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  AlertCircle,
  Shield,
  RefreshCw,
  FileText,
  BarChart3,
  History,
  Gauge,
  Timer,
  Users,
  MapPin,
  Cpu,
  Power,
  Database,
  Wifi,
  WifiOff,
  Factory,
  Lightbulb,
  Plug,
  MonitorSpeaker,
  X,
  ThermometerSun,
  Lock,
  Cog,
  HelpCircle,
} from "lucide-react";

// API Hooks and Types
import {
  useEquipment,
  useEquipmentById,
  useEquipmentMutation,
  useEquipmentMaintenance,
  useEquipmentPerformance,
  useMaintenanceSchedule,
  useBuildings,
  useAlerts,
} from "@/hooks/useApi";
import {
  Equipment,
  Building,
  Alert,
  MaintenanceRecord,
  EquipmentPerformanceMetrics,
  MaintenanceSchedule,
  EquipmentQueryParams,
} from "@/types/api-types";

// Safe Icon component with better error handling
const SafeIcon = ({
  IconComponent,
  className,
  fallback,
}: {
  IconComponent?: any;
  className?: string;
  fallback?: any;
}) => {
  // Use fallback if IconComponent is undefined or null
  const Icon = IconComponent || fallback || HelpCircle;

  try {
    return <Icon className={className} />;
  } catch (error) {
    console.warn("Icon rendering failed:", error);
    return <HelpCircle className={className} />;
  }
};

// Equipment configuration with guaranteed fallbacks
const equipmentTypeConfig = {
  hvac: {
    label: "HVAC",
    icon: ThermometerSun,
    color: "primary" as const,
    description: "Heating, Ventilation & Air Conditioning",
  },
  lighting: {
    label: "Lighting",
    icon: Lightbulb,
    color: "warning" as const,
    description: "Lighting Systems",
  },
  electrical: {
    label: "Electrical",
    icon: Zap,
    color: "danger" as const,
    description: "Electrical Equipment",
  },
  manufacturing: {
    label: "Manufacturing",
    icon: Factory,
    color: "secondary" as const,
    description: "Manufacturing Equipment",
  },
  security: {
    label: "Security",
    icon: Shield,
    color: "success" as const,
    description: "Security Systems",
  },
  other: {
    label: "Other",
    icon: Cog,
    color: "default" as const,
    description: "Other Equipment",
  },
} as const;

const statusConfig = {
  active: {
    label: "Active",
    color: "success" as const,
    icon: CheckCircle,
  },
  maintenance: {
    label: "Maintenance",
    color: "warning" as const,
    icon: Wrench,
  },
  faulty: {
    label: "Faulty",
    color: "danger" as const,
    icon: AlertTriangle,
  },
  inactive: {
    label: "Inactive",
    color: "default" as const,
    icon: Clock,
  },
} as const;

const maintenanceScheduleConfig = {
  weekly: { label: "Weekly", interval: 7 },
  monthly: { label: "Monthly", interval: 30 },
  quarterly: { label: "Quarterly", interval: 90 },
  annually: { label: "Annually", interval: 365 },
} as const;

// Main component
export default function EquipmentPage() {
  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | undefined>();
  const [typeFilter, setTypeFilter] = useState<
    Equipment["equipmentType"] | undefined
  >();
  const [statusFilter, setStatusFilter] = useState<
    Equipment["status"] | undefined
  >();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

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
    isOpen: isQROpen,
    onOpen: onQROpen,
    onClose: onQRClose,
  } = useDisclosure();

  // Selected equipment for operations
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    buildingId: string;
    equipmentType: Equipment["equipmentType"];
    manufacturer: string;
    model: string;
    serialNumber: string;
    powerRatingKw: string;
    voltageRating: string;
    currentRatingA: string;
    installationDate: string;
    warrantyExpiry: string;
    location: string;
    floor: string;
    room: string;
    maintenanceSchedule: "weekly" | "monthly" | "quarterly" | "annually";
    conditionScore: string;
    notes: string;
  }>({
    name: "",
    code: "",
    buildingId: "",
    equipmentType: "hvac",
    manufacturer: "",
    model: "",
    serialNumber: "",
    powerRatingKw: "",
    voltageRating: "",
    currentRatingA: "",
    installationDate: "",
    warrantyExpiry: "",
    location: "",
    floor: "",
    room: "",
    maintenanceSchedule: "monthly",
    conditionScore: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Build query parameters
  const equipmentParams = useMemo(
    (): EquipmentQueryParams => ({
      page: currentPage,
      limit: pageSize,
      search: searchTerm || undefined,
      buildingId: buildingFilter,
      equipmentType: typeFilter,
      status: statusFilter,
      sortBy: "name",
      sortOrder: "ASC",
    }),
    [
      currentPage,
      pageSize,
      searchTerm,
      buildingFilter,
      typeFilter,
      statusFilter,
    ]
  );

  // API hooks
  const {
    data: equipment,
    pagination,
    loading: equipmentLoading,
    error: equipmentError,
    refresh: refreshEquipment,
  } = useEquipment(equipmentParams, {
    immediate: true,
    cacheTtl: 5 * 60 * 1000, // 5 minutes cache
  });

  const {
    data: buildings,
    loading: buildingsLoading,
    error: buildingsError,
  } = useBuildings(
    {},
    {
      immediate: true,
      cacheTtl: 10 * 60 * 1000, // 10 minutes cache
    }
  );

  const { data: maintenanceSchedule, loading: scheduleLoading } =
    useMaintenanceSchedule(undefined, {
      immediate: true,
      cacheTtl: 5 * 60 * 1000,
    });

  const { data: alerts, loading: alertsLoading } = useAlerts(
    { status: "active" },
    {
      immediate: true,
      refreshInterval: 30 * 1000, // Refresh every 30 seconds
    }
  );

  // Equipment detail hooks for selected equipment
  const { data: selectedEquipmentDetails, loading: detailsLoading } =
    useEquipmentById(selectedEquipment?.id || 0, {
      immediate: !!selectedEquipment?.id,
      dependencies: [selectedEquipment?.id],
    });

  const { data: maintenanceHistory, loading: maintenanceLoading } =
    useEquipmentMaintenance(
      selectedEquipment?.id || 0,
      {},
      {
        immediate: !!selectedEquipment?.id,
        dependencies: [selectedEquipment?.id],
      }
    );

  const { data: performanceMetrics, loading: performanceLoading } =
    useEquipmentPerformance(
      selectedEquipment?.id || 0,
      { period: "monthly" },
      {
        immediate: !!selectedEquipment?.id,
        dependencies: [selectedEquipment?.id],
      }
    );

  // Mutation hook for CRUD operations
  const {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    logMaintenance,
    loading: mutationLoading,
    error: mutationError,
  } = useEquipmentMutation();

  // Computed values
  const equipmentStats = useMemo(() => {
    if (!equipment || equipment.length === 0) {
      return {
        total: 0,
        operational: 0,
        maintenance: 0,
        offline: 0,
        avgCondition: 0,
        criticalAlerts: 0,
      };
    }

    const operational = equipment.filter((e) => e.status === "active").length;
    const maintenance = equipment.filter(
      (e) => e.status === "maintenance"
    ).length;
    const offline = equipment.filter(
      (e) => e.status === "faulty" || e.status === "inactive"
    ).length;
    const avgCondition =
      equipment.reduce((sum, e) => sum + (e.conditionScore || 85), 0) /
      equipment.length;

    const equipmentIds = equipment.map((e) => e.id);
    const criticalAlerts =
      alerts?.filter(
        (a) =>
          a.severity === "critical" &&
          a.status === "active" &&
          a.equipmentId &&
          equipmentIds.includes(a.equipmentId)
      ).length || 0;

    return {
      total: equipment.length,
      operational,
      maintenance,
      offline,
      avgCondition,
      criticalAlerts,
    };
  }, [equipment, alerts]);

  // Helper functions
  const getBuildingName = useCallback(
    (equipmentItem: Equipment): string => {
      if (equipmentItem.buildingName) return equipmentItem.buildingName;
      const building = buildings?.find(
        (b) => b.id === equipmentItem.buildingId
      );
      return building?.name || `Building ID: ${equipmentItem.buildingId}`;
    },
    [buildings]
  );

  const getEquipmentAge = useCallback((equipmentItem: Equipment): number => {
    if (!equipmentItem.installationDate) return 0;
    const installDate = new Date(equipmentItem.installationDate);
    const now = new Date();
    return (
      (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
  }, []);

  const getHealthStatus = useCallback(
    (score: number): { label: string; color: string } => {
      if (score >= 90) return { label: "Excellent", color: "success" };
      if (score >= 75) return { label: "Good", color: "primary" };
      if (score >= 60) return { label: "Fair", color: "warning" };
      if (score >= 40) return { label: "Poor", color: "danger" };
      return { label: "Critical", color: "danger" };
    },
    []
  );

  const getEquipmentAlerts = useCallback(
    (equipmentId: number): Alert[] => {
      return alerts?.filter((alert) => alert.equipmentId === equipmentId) || [];
    },
    [alerts]
  );

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Equipment name is required";
    if (!formData.buildingId) errors.buildingId = "Building is required";
    if (!formData.manufacturer.trim())
      errors.manufacturer = "Manufacturer is required";
    if (!formData.model.trim()) errors.model = "Model is required";
    if (!formData.location.trim()) errors.location = "Location is required";

    // Numeric validation
    if (formData.powerRatingKw && isNaN(Number(formData.powerRatingKw))) {
      errors.powerRatingKw = "Power rating must be a valid number";
    }
    if (formData.voltageRating && isNaN(Number(formData.voltageRating))) {
      errors.voltageRating = "Voltage rating must be a valid number";
    }
    if (formData.currentRatingA && isNaN(Number(formData.currentRatingA))) {
      errors.currentRatingA = "Current rating must be a valid number";
    }
    if (
      formData.conditionScore &&
      (isNaN(Number(formData.conditionScore)) ||
        Number(formData.conditionScore) < 0 ||
        Number(formData.conditionScore) > 100)
    ) {
      errors.conditionScore = "Condition score must be between 0 and 100";
    }
    if (formData.floor && isNaN(Number(formData.floor))) {
      errors.floor = "Floor must be a valid number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Form reset
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      code: "",
      buildingId: "",
      equipmentType: "hvac",
      manufacturer: "",
      model: "",
      serialNumber: "",
      powerRatingKw: "",
      voltageRating: "",
      currentRatingA: "",
      installationDate: "",
      warrantyExpiry: "",
      location: "",
      floor: "",
      room: "",
      maintenanceSchedule: "monthly",
      conditionScore: "",
      notes: "",
    });
    setFormErrors({});
  }, []);

  // CRUD operations
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    try {
      const equipmentData: Partial<Equipment> = {
        name: formData.name,
        code: formData.code || undefined,
        buildingId: Number(formData.buildingId),
        equipmentType: formData.equipmentType,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber || undefined,
        powerRatingKw: formData.powerRatingKw
          ? Number(formData.powerRatingKw)
          : undefined,
        voltageRating: formData.voltageRating
          ? Number(formData.voltageRating)
          : undefined,
        currentRatingA: formData.currentRatingA
          ? Number(formData.currentRatingA)
          : undefined,
        installationDate: formData.installationDate || undefined,
        warrantyExpiry: formData.warrantyExpiry || undefined,
        location: formData.location,
        floor: formData.floor ? Number(formData.floor) : undefined,
        room: formData.room || undefined,
        maintenanceSchedule: formData.maintenanceSchedule,
        conditionScore: formData.conditionScore
          ? Number(formData.conditionScore)
          : undefined,
        notes: formData.notes || undefined,
      };

      await createEquipment(equipmentData);
      onCreateClose();
      resetForm();
      refreshEquipment();
    } catch (error) {
      console.error("Failed to create equipment:", error);
    }
  }, [
    formData,
    validateForm,
    createEquipment,
    onCreateClose,
    resetForm,
    refreshEquipment,
  ]);

  const handleEdit = useCallback(async () => {
    if (!selectedEquipment || !validateForm()) return;

    try {
      const equipmentData: Partial<Equipment> = {
        name: formData.name,
        code: formData.code || undefined,
        buildingId: Number(formData.buildingId),
        equipmentType: formData.equipmentType,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber || undefined,
        powerRatingKw: formData.powerRatingKw
          ? Number(formData.powerRatingKw)
          : undefined,
        voltageRating: formData.voltageRating
          ? Number(formData.voltageRating)
          : undefined,
        currentRatingA: formData.currentRatingA
          ? Number(formData.currentRatingA)
          : undefined,
        installationDate: formData.installationDate || undefined,
        warrantyExpiry: formData.warrantyExpiry || undefined,
        location: formData.location,
        floor: formData.floor ? Number(formData.floor) : undefined,
        room: formData.room || undefined,
        maintenanceSchedule: formData.maintenanceSchedule,
        conditionScore: formData.conditionScore
          ? Number(formData.conditionScore)
          : undefined,
        notes: formData.notes || undefined,
      };

      await updateEquipment(selectedEquipment.id, equipmentData);
      onEditClose();
      resetForm();
      refreshEquipment();
    } catch (error) {
      console.error("Failed to update equipment:", error);
    }
  }, [
    selectedEquipment,
    formData,
    validateForm,
    updateEquipment,
    onEditClose,
    resetForm,
    refreshEquipment,
  ]);

  const handleDelete = useCallback(
    async (equipmentItem: Equipment) => {
      if (!confirm(`Are you sure you want to delete "${equipmentItem.name}"?`))
        return;

      try {
        await deleteEquipment(equipmentItem.id);
        refreshEquipment();
      } catch (error) {
        console.error("Failed to delete equipment:", error);
      }
    },
    [deleteEquipment, refreshEquipment]
  );

  // Modal handlers
  const openCreateModal = useCallback(() => {
    resetForm();
    onCreateOpen();
  }, [resetForm, onCreateOpen]);

  const openEditModal = useCallback(
    (equipmentItem: Equipment) => {
      setSelectedEquipment(equipmentItem);
      setFormData({
        name: equipmentItem.name,
        code: equipmentItem.code || "",
        buildingId: equipmentItem.buildingId.toString(),
        equipmentType: equipmentItem.equipmentType,
        manufacturer: equipmentItem.manufacturer || "",
        model: equipmentItem.model || "",
        serialNumber: equipmentItem.serialNumber || "",
        powerRatingKw: equipmentItem.powerRatingKw?.toString() || "",
        voltageRating: equipmentItem.voltageRating?.toString() || "",
        currentRatingA: equipmentItem.currentRatingA?.toString() || "",
        installationDate: equipmentItem.installationDate || "",
        warrantyExpiry: equipmentItem.warrantyExpiry || "",
        location: equipmentItem.location || "",
        floor: equipmentItem.floor?.toString() || "",
        room: equipmentItem.room || "",
        maintenanceSchedule: equipmentItem.maintenanceSchedule || "monthly",
        conditionScore: equipmentItem.conditionScore?.toString() || "",
        notes: equipmentItem.notes || "",
      });
      onEditOpen();
    },
    [onEditOpen]
  );

  const openViewModal = useCallback(
    (equipmentItem: Equipment) => {
      setSelectedEquipment(equipmentItem);
      onViewOpen();
    },
    [onViewOpen]
  );

  const openQRModal = useCallback(
    (equipmentItem: Equipment) => {
      setSelectedEquipment(equipmentItem);
      onQROpen();
    },
    [onQROpen]
  );

  // Filter handlers
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setBuildingFilter(undefined);
    setTypeFilter(undefined);
    setStatusFilter(undefined);
    setCurrentPage(1);
  }, []);

  // Helper function to safely get configuration
  const getTypeConfig = useCallback((type: Equipment["equipmentType"]) => {
    return (
      equipmentTypeConfig[type] || {
        label: "Unknown",
        icon: HelpCircle,
        color: "default",
        description: "Unknown Equipment Type",
      }
    );
  }, []);

  const getStatusConfig = useCallback((status: Equipment["status"]) => {
    return (
      statusConfig[status || "active"] || {
        label: "Unknown",
        icon: HelpCircle,
        color: "default",
      }
    );
  }, []);

  // Loading state
  if (equipmentLoading && (!equipment || equipment.length === 0)) {
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
            {Array.from({ length: 8 }).map((_, i) => (
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
      {(equipmentError || buildingsError || mutationError) && (
        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-danger" />
                <span className="text-danger font-medium">
                  {equipmentError || buildingsError || mutationError}
                </span>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Settings className="w-8 h-8 mr-3 text-primary" />
            Equipment Management
            {equipmentLoading && (
              <RefreshCw className="w-5 h-5 ml-3 animate-spin text-primary" />
            )}
          </h1>
          <p className="text-default-500 mt-1">
            Monitor equipment health, maintenance schedules, and performance
            analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="light"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={refreshEquipment}
            isLoading={equipmentLoading}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={openCreateModal}
          >
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-foreground">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Equipment</p>
                <p className="text-2xl font-bold">{equipmentStats.total}</p>
                <p className="text-xs text-default-500">
                  {pagination?.totalCount || 0} system-wide
                </p>
              </div>
              <Settings className="w-8 h-8 text-default-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Operational</p>
                <p className="text-2xl font-bold text-success">
                  {equipmentStats.operational}
                </p>
                <p className="text-xs text-default-500">
                  {equipmentStats.total > 0
                    ? (
                        (equipmentStats.operational / equipmentStats.total) *
                        100
                      ).toFixed(1)
                    : 0}
                  % active
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Maintenance</p>
                <p className="text-2xl font-bold text-warning">
                  {equipmentStats.maintenance}
                </p>
                <p className="text-xs text-default-500">Scheduled/Ongoing</p>
              </div>
              <Wrench className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-danger">
                  {equipmentStats.criticalAlerts}
                </p>
                <p className="text-xs text-default-500">Require attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Avg. Health</p>
                <p className="text-2xl font-bold">
                  {equipmentStats.avgCondition.toFixed(1)}%
                </p>
                <Progress
                  aria-label="Average equipment health"
                  value={equipmentStats.avgCondition}
                  color={
                    getHealthStatus(equipmentStats.avgCondition).color as any
                  }
                  size="sm"
                  className="mt-1"
                />
              </div>
              <Gauge className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              className="col-span-2"
            />

            <Select
              placeholder="Building"
              selectedKeys={buildingFilter ? [buildingFilter.toString()] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setBuildingFilter(key ? Number(key) : undefined);
                setCurrentPage(1);
              }}
              isLoading={buildingsLoading}
            >
              {buildings?.map((building) => (
                <SelectItem key={building.id.toString()}>
                  {building.name}
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Type"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as Equipment["equipmentType"];
                setTypeFilter(key);
                setCurrentPage(1);
              }}
            >
              {Object.entries(equipmentTypeConfig).map(([key, config]) => (
                <SelectItem key={key}>
                  <div className="flex items-center">
                    <SafeIcon
                      IconComponent={config?.icon}
                      className="w-4 h-4 mr-2"
                      fallback={HelpCircle}
                    />
                    {config?.label || "Unknown"}
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as Equipment["status"];
                setStatusFilter(key);
                setCurrentPage(1);
              }}
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key}>
                  <div className="flex items-center">
                    <SafeIcon
                      IconComponent={config?.icon}
                      className="w-4 h-4 mr-2"
                      fallback={HelpCircle}
                    />
                    {config?.label || "Unknown"}
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Button
              variant="light"
              startContent={<Filter className="w-4 h-4" />}
              onPress={clearFilters}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Equipment table">
            <TableHeader>
              <TableColumn>Equipment</TableColumn>
              <TableColumn>Type & Building</TableColumn>
              <TableColumn>Health Status</TableColumn>
              <TableColumn>Specifications</TableColumn>
              <TableColumn>Alerts</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No equipment found. Try adjusting your filters or add new equipment.">
              {equipment?.map((item) => {
                const typeConfig = getTypeConfig(item.equipmentType);
                const statusConf = getStatusConfig(item.status);
                const conditionScore = item.conditionScore || 85;
                const healthStatus = getHealthStatus(conditionScore);
                const equipmentAlerts = getEquipmentAlerts(item.id);
                const criticalAlerts = equipmentAlerts.filter(
                  (a) => a.severity === "critical"
                ).length;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <SafeIcon
                            IconComponent={typeConfig.icon}
                            className="w-6 h-6 text-default-400"
                            fallback={HelpCircle}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {item.name}
                          </div>
                          <div className="text-sm text-default-500">
                            {item.code ||
                              `EQ-${item.id.toString().padStart(4, "0")}`}
                          </div>
                          <div className="text-xs text-default-400">
                            {item.manufacturer} {item.model}
                          </div>
                          {item.installationDate && (
                            <div className="text-xs text-default-400">
                              Age: {getEquipmentAge(item).toFixed(1)} years
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <Chip
                          color={typeConfig.color}
                          size="sm"
                          variant="flat"
                          startContent={
                            <SafeIcon
                              IconComponent={typeConfig.icon}
                              className="w-3 h-3"
                              fallback={HelpCircle}
                            />
                          }
                        >
                          {typeConfig.label}
                        </Chip>
                        <div className="flex items-center text-sm">
                          <BuildingIcon className="w-4 h-4 mr-1 text-default-400" />
                          {getBuildingName(item)}
                        </div>
                        {item.location && (
                          <div className="flex items-center text-xs text-default-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {item.location}
                            {item.floor && ` (Floor ${item.floor})`}
                            {item.room && ` - ${item.room}`}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {conditionScore.toFixed(1)}%
                          </span>
                          <Chip
                            color={healthStatus.color as any}
                            size="sm"
                            variant="dot"
                          >
                            {healthStatus.label}
                          </Chip>
                        </div>
                        <Progress
                          aria-label={`Equipment health: ${conditionScore.toFixed(1)}%`}
                          value={conditionScore}
                          color={healthStatus.color as any}
                          size="sm"
                        />
                        <Chip
                          color={statusConf.color}
                          size="sm"
                          variant="flat"
                          startContent={
                            <SafeIcon
                              IconComponent={statusConf.icon}
                              className="w-3 h-3"
                              fallback={HelpCircle}
                            />
                          }
                        >
                          {statusConf.label}
                        </Chip>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {item.powerRatingKw && (
                          <div className="flex items-center text-xs">
                            <Zap className="w-3 h-3 mr-1 text-primary" />
                            <span>{item.powerRatingKw} kW</span>
                          </div>
                        )}
                        {item.voltageRating && (
                          <div className="flex items-center text-xs">
                            <Plug className="w-3 h-3 mr-1 text-warning" />
                            <span>{item.voltageRating} V</span>
                          </div>
                        )}
                        {item.currentRatingA && (
                          <div className="flex items-center text-xs">
                            <Activity className="w-3 h-3 mr-1 text-success" />
                            <span>{item.currentRatingA} A</span>
                          </div>
                        )}
                        {item.serialNumber && (
                          <div className="text-xs text-default-500">
                            S/N: {item.serialNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {equipmentAlerts.length > 0 ? (
                          <>
                            <Badge
                              content={equipmentAlerts.length}
                              color="danger"
                              size="sm"
                            >
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </Button>
                            </Badge>
                            {criticalAlerts > 0 && (
                              <div className="text-xs text-danger font-medium">
                                {criticalAlerts} critical
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center text-xs text-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            No alerts
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
                            onPress={() => openViewModal(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="QR Code">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openQRModal(item)}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Edit">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openEditModal(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) || []}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center p-4">
              <div className="text-sm text-default-500">
                Showing {(pagination.currentPage - 1) * pagination.perPage + 1}{" "}
                to{" "}
                {Math.min(
                  pagination.currentPage * pagination.perPage,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} equipment
              </div>
              <Pagination
                total={pagination.totalPages}
                page={pagination.currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Equipment Modal */}
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
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  {isCreateOpen ? "Add New Equipment" : "Edit Equipment"}
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Equipment Name"
                    placeholder="Enter equipment name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    errorMessage={formErrors.name}
                    isInvalid={!!formErrors.name}
                    isRequired
                  />

                  <Input
                    label="Equipment Code"
                    placeholder="Enter equipment code (optional)"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    errorMessage={formErrors.code}
                    isInvalid={!!formErrors.code}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Building"
                    placeholder="Select building"
                    selectedKeys={
                      formData.buildingId ? [formData.buildingId] : []
                    }
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setFormData((prev) => ({
                        ...prev,
                        buildingId: key || "",
                      }));
                    }}
                    errorMessage={formErrors.buildingId}
                    isInvalid={!!formErrors.buildingId}
                    isRequired
                    isLoading={buildingsLoading}
                  >
                    {buildings?.map((building) => (
                      <SelectItem key={building.id.toString()}>
                        {building.name} ({building.code || `ID: ${building.id}`}
                        )
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Equipment Type"
                    selectedKeys={[formData.equipmentType]}
                    onSelectionChange={(keys) => {
                      const key = Array.from(
                        keys
                      )[0] as Equipment["equipmentType"];
                      setFormData((prev) => ({
                        ...prev,
                        equipmentType: key || "hvac",
                      }));
                    }}
                    isRequired
                  >
                    {Object.entries(equipmentTypeConfig).map(
                      ([key, config]) => (
                        <SelectItem key={key}>
                          <div className="flex items-center">
                            <SafeIcon
                              IconComponent={config?.icon}
                              className="w-4 h-4 mr-2"
                              fallback={HelpCircle}
                            />
                            {config?.label || "Unknown"}
                          </div>
                        </SelectItem>
                      )
                    )}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Manufacturer"
                    placeholder="Enter manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        manufacturer: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.manufacturer}
                    isInvalid={!!formErrors.manufacturer}
                    isRequired
                  />

                  <Input
                    label="Model"
                    placeholder="Enter model"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        model: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.model}
                    isInvalid={!!formErrors.model}
                    isRequired
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Serial Number"
                    placeholder="Enter serial number"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.serialNumber}
                    isInvalid={!!formErrors.serialNumber}
                  />

                  <Select
                    label="Maintenance Schedule"
                    selectedKeys={[formData.maintenanceSchedule]}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as
                        | "weekly"
                        | "monthly"
                        | "quarterly"
                        | "annually";
                      setFormData((prev) => ({
                        ...prev,
                        maintenanceSchedule: key || "monthly",
                      }));
                    }}
                  >
                    {Object.entries(maintenanceScheduleConfig).map(
                      ([key, config]) => (
                        <SelectItem key={key}>{config.label}</SelectItem>
                      )
                    )}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Power Rating (kW)"
                    placeholder="0.0"
                    type="number"
                    step="0.1"
                    value={formData.powerRatingKw}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        powerRatingKw: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.powerRatingKw}
                    isInvalid={!!formErrors.powerRatingKw}
                  />

                  <Input
                    label="Voltage Rating (V)"
                    placeholder="220"
                    type="number"
                    value={formData.voltageRating}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        voltageRating: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.voltageRating}
                    isInvalid={!!formErrors.voltageRating}
                  />

                  <Input
                    label="Current Rating (A)"
                    placeholder="10"
                    type="number"
                    step="0.1"
                    value={formData.currentRatingA}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentRatingA: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.currentRatingA}
                    isInvalid={!!formErrors.currentRatingA}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Installation Date"
                    type="date"
                    value={formData.installationDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        installationDate: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Warranty Expiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        warrantyExpiry: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Location"
                    placeholder="Enter location within building"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.location}
                    isInvalid={!!formErrors.location}
                    isRequired
                  />

                  <Input
                    label="Floor"
                    placeholder="Floor number"
                    type="number"
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        floor: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.floor}
                    isInvalid={!!formErrors.floor}
                  />

                  <Input
                    label="Room"
                    placeholder="Room identifier"
                    value={formData.room}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, room: e.target.value }))
                    }
                  />
                </div>

                <Input
                  label="Condition Score (%)"
                  placeholder="0-100"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.conditionScore}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      conditionScore: e.target.value,
                    }))
                  }
                  errorMessage={formErrors.conditionScore}
                  isInvalid={!!formErrors.conditionScore}
                />

                <Textarea
                  label="Notes"
                  placeholder="Additional notes or specifications"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  minRows={3}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={isCreateOpen ? handleCreate : handleEdit}
                  isLoading={mutationLoading}
                  startContent={
                    isCreateOpen ? (
                      <Plus className="w-4 h-4" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )
                  }
                >
                  {isCreateOpen ? "Create Equipment" : "Update Equipment"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Equipment Details Modal */}
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
                <div className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  {selectedEquipment?.name} - Details
                  {detailsLoading && <Spinner size="sm" className="ml-2" />}
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedEquipment && (
                  <Tabs aria-label="Equipment details tabs" color="primary">
                    <Tab
                      key="overview"
                      title={
                        <div className="flex items-center">
                          <Cpu className="w-4 h-4 mr-2" />
                          Overview
                        </div>
                      }
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <h4 className="font-semibold">
                                Basic Information
                              </h4>
                            </CardHeader>
                            <CardBody className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-default-600">Code:</span>
                                <span className="font-medium">
                                  {selectedEquipment.code ||
                                    `EQ-${selectedEquipment.id.toString().padStart(4, "0")}`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-default-600">Type:</span>
                                <Chip
                                  color={
                                    getTypeConfig(
                                      selectedEquipment.equipmentType
                                    ).color
                                  }
                                  size="sm"
                                >
                                  {
                                    getTypeConfig(
                                      selectedEquipment.equipmentType
                                    ).label
                                  }
                                </Chip>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-default-600">
                                  Status:
                                </span>
                                <Chip
                                  color={
                                    getStatusConfig(selectedEquipment.status)
                                      .color
                                  }
                                  size="sm"
                                >
                                  {
                                    getStatusConfig(selectedEquipment.status)
                                      .label
                                  }
                                </Chip>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-default-600">
                                  Manufacturer:
                                </span>
                                <span className="font-medium">
                                  {selectedEquipment.manufacturer}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-default-600">Model:</span>
                                <span className="font-medium">
                                  {selectedEquipment.model}
                                </span>
                              </div>
                              {selectedEquipment.serialNumber && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Serial Number:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.serialNumber}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-default-600">
                                  Location:
                                </span>
                                <span className="font-medium">
                                  {selectedEquipment.location}
                                </span>
                              </div>
                              {selectedEquipment.installationDate && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">Age:</span>
                                  <span className="font-medium">
                                    {getEquipmentAge(selectedEquipment).toFixed(
                                      1
                                    )}{" "}
                                    years
                                  </span>
                                </div>
                              )}
                            </CardBody>
                          </Card>

                          <Card>
                            <CardHeader>
                              <h4 className="font-semibold">
                                Health & Performance
                              </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span>Health Score</span>
                                  <span className="font-medium">
                                    {(
                                      selectedEquipment.conditionScore || 85
                                    ).toFixed(1)}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  aria-label="Equipment health score"
                                  value={selectedEquipment.conditionScore || 85}
                                  color={
                                    getHealthStatus(
                                      selectedEquipment.conditionScore || 85
                                    ).color as any
                                  }
                                />
                              </div>

                              {selectedEquipment.powerRatingKw && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Power Rating:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.powerRatingKw} kW
                                  </span>
                                </div>
                              )}

                              {selectedEquipment.voltageRating && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Voltage Rating:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.voltageRating} V
                                  </span>
                                </div>
                              )}

                              {selectedEquipment.currentRatingA && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Current Rating:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.currentRatingA} A
                                  </span>
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        </div>

                        {(detailsLoading ||
                          maintenanceLoading ||
                          performanceLoading) && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading additional details...
                              </p>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </Tab>

                    <Tab
                      key="maintenance"
                      title={
                        <div className="flex items-center">
                          <Wrench className="w-4 h-4 mr-2" />
                          Maintenance
                          {maintenanceHistory &&
                            maintenanceHistory.length > 0 && (
                              <Badge
                                content={maintenanceHistory.length}
                                color="primary"
                                size="sm"
                                className="ml-2"
                              >
                                <span className="w-2 h-2" />
                              </Badge>
                            )}
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        {maintenanceLoading && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading maintenance history...
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        {maintenanceHistory && maintenanceHistory.length > 0 ? (
                          maintenanceHistory.map((maintenance) => (
                            <Card
                              key={maintenance.id}
                              className="border-l-4 border-l-primary"
                            >
                              <CardBody>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Chip
                                        color={
                                          maintenance.maintenanceType ===
                                          "emergency"
                                            ? "danger"
                                            : maintenance.maintenanceType ===
                                                "corrective"
                                              ? "warning"
                                              : "primary"
                                        }
                                        size="sm"
                                      >
                                        {maintenance.maintenanceType}
                                      </Chip>
                                      <Chip
                                        color={
                                          maintenance.status === "completed"
                                            ? "success"
                                            : maintenance.status ===
                                                "in_progress"
                                              ? "warning"
                                              : "default"
                                        }
                                        size="sm"
                                        variant="dot"
                                      >
                                        {maintenance.status}
                                      </Chip>
                                    </div>
                                    <h5 className="font-semibold">
                                      {maintenance.description}
                                    </h5>
                                    {maintenance.workPerformed && (
                                      <p className="text-default-600 text-sm mt-1">
                                        {maintenance.workPerformed}
                                      </p>
                                    )}
                                    <div className="text-xs text-default-500 mt-2">
                                      {maintenance.scheduledDate && (
                                        <span>
                                          Scheduled:{" "}
                                          {new Date(
                                            maintenance.scheduledDate
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                      {maintenance.completedDate && (
                                        <span>
                                          {" "}
                                          • Completed:{" "}
                                          {new Date(
                                            maintenance.completedDate
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    {maintenance.cost && (
                                      <div className="text-sm font-medium">
                                        ₱{maintenance.cost.toLocaleString()}
                                      </div>
                                    )}
                                    {maintenance.downtimeMinutes && (
                                      <div className="text-xs text-default-500">
                                        {maintenance.downtimeMinutes} min
                                        downtime
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))
                        ) : (
                          <Card>
                            <CardBody className="text-center py-8">
                              <History className="w-12 h-12 text-default-400 mx-auto mb-3" />
                              <h4 className="font-medium text-default-600">
                                No Maintenance History
                              </h4>
                              <p className="text-default-500 text-sm">
                                No maintenance records found for this equipment
                              </p>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </Tab>

                    <Tab
                      key="performance"
                      title={
                        <div className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Performance
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        {performanceLoading && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading performance metrics...
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        {performanceMetrics ? (
                          <Card>
                            <CardHeader>
                              <h4 className="font-semibold">
                                Performance Metrics
                              </h4>
                            </CardHeader>
                            <CardBody>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary">
                                    {performanceMetrics.totalMaintenanceCount}
                                  </div>
                                  <div className="text-sm text-default-600">
                                    Total Maintenance
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-warning">
                                    {Math.round(
                                      performanceMetrics.totalDowntimeMinutes /
                                        60
                                    )}
                                    h
                                  </div>
                                  <div className="text-sm text-default-600">
                                    Total Downtime
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-success">
                                    {performanceMetrics.efficiencyScore}%
                                  </div>
                                  <div className="text-sm text-default-600">
                                    Efficiency Score
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ) : (
                          <Card>
                            <CardBody className="text-center py-8">
                              <BarChart3 className="w-12 h-12 text-default-400 mx-auto mb-3" />
                              <h4 className="font-medium text-default-600">
                                No Performance Data
                              </h4>
                              <p className="text-default-500 text-sm">
                                Performance metrics are not available for this
                                equipment
                              </p>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  startContent={<FileText className="w-4 h-4" />}
                >
                  Generate Report
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={isQROpen} onOpenChange={onQRClose} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  QR Code - {selectedEquipment?.name}
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Card>
                    <CardBody className="text-center py-8">
                      <div className="w-48 h-48 bg-default-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-default-400" />
                      </div>
                      <h4 className="font-semibold mb-2">Equipment QR Code</h4>
                      <p className="text-sm text-default-600 mb-4">
                        Scan this QR code to quickly access equipment
                        information
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-default-600">
                            Equipment ID:
                          </span>
                          <span className="font-medium">
                            {selectedEquipment?.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">Code:</span>
                          <span className="font-medium">
                            {selectedEquipment?.code ||
                              `EQ-${selectedEquipment?.id.toString().padStart(4, "0")}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">Building:</span>
                          <span className="font-medium">
                            {selectedEquipment
                              ? getBuildingName(selectedEquipment)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  startContent={<Download className="w-4 h-4" />}
                >
                  Download QR
                </Button>
                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<FileText className="w-4 h-4" />}
                >
                  Print Label
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
