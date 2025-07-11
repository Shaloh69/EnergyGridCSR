"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

// HeroUI Components
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import { Avatar } from "@heroui/avatar";
import { Tabs, Tab } from "@heroui/tabs";
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
import { Spinner } from "@heroui/spinner";
import { Pagination } from "@heroui/pagination";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";
import { Tooltip } from "@heroui/tooltip";
import { ScrollShadow } from "@heroui/scroll-shadow";

import {
  Building,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Activity,
  Zap,
  Wrench,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
  Gauge,
  Clock,
  Shield,
  FileText,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Power,
  Construction,
  Home,
  Factory,
  GraduationCap,
  Save,
  X,
  ExternalLink,
  MoreVertical,
} from "lucide-react";

import {
  buildingsAPI,
  equipmentAPI,
  energyAPI,
  auditsAPI,
  alertsAPI,
  powerQualityAPI,
} from "@/lib/api";

import type {
  Building as BuildingType,
  Equipment,
  EnergyReading,
  PowerQualityReading,
  PowerQualityEvent,
  Alert,
  Audit,
  EnergyStatsResponse,
  PowerQualityStatsResponse,
  MaintenanceSchedule,
  BuildingQueryParams,
  EquipmentQueryParams,
  EnergyQueryParams,
  PowerQualityQueryParams,
  AlertQueryParams,
  AuditQueryParams,
} from "@/types/api-types";

import BuildingFormModal, {
  BuildingFormData,
} from "@/components/buildings/BuildingFormModal";

interface ExtendedBuilding extends BuildingType {
  equipmentCount?: number;
  auditCount?: number;
  avgComplianceScore?: number;
  lastEnergyReading?: string;
  totalConsumptionKwh?: number;
  avgPowerFactor?: number;
  equipmentStatistics?: {
    operational: number;
    maintenance: number;
    faulty: number;
    maintenanceNeeded: number;
  };
  auditStatistics?: {
    completed: number;
    inProgress: number;
    avgComplianceScore: number;
    lastAuditDate: string;
  };
  energyStatistics?: {
    monthlyConsumption: number;
    monthlyConsumptionPerSqm: number;
    peakDemand: number;
    avgPowerFactor: number;
    efficiencyRating: string;
  };
}

// Type guard functions
const isArrayOfBuildings = (data: any): data is ExtendedBuilding[] => {
  return Array.isArray(data);
};

const hasNestedData = (
  data: any
): data is { data: ExtendedBuilding[]; pagination?: any } => {
  return data && typeof data === "object" && Array.isArray(data.data);
};

const BuildingsPage: React.FC = () => {
  // State management
  const [buildings, setBuildings] = useState<ExtendedBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] =
    useState<ExtendedBuilding | null>(null);
  const [buildingEquipment, setBuildingEquipment] = useState<Equipment[]>([]);
  const [buildingEnergy, setBuildingEnergy] = useState<EnergyReading[]>([]);
  const [buildingEnergyStats, setBuildingEnergyStats] =
    useState<EnergyStatsResponse | null>(null);
  const [buildingPowerQuality, setBuildingPowerQuality] = useState<
    PowerQualityEvent[]
  >([]);
  const [buildingPowerQualityStats, setBuildingPowerQualityStats] =
    useState<PowerQualityStatsResponse | null>(null);
  const [buildingAudits, setBuildingAudits] = useState<Audit[]>([]);
  const [buildingAlerts, setBuildingAlerts] = useState<Alert[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] =
    useState<MaintenanceSchedule | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [viewMode, setViewMode] = useState<"list" | "details">("list");

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // Form state
  const [buildingForm, setBuildingForm] = useState<BuildingFormData>({
    name: "",
    code: "",
    area_sqm: 0,
    floors: 1,
    year_built: new Date().getFullYear(),
    building_type: "commercial",
    description: "",
    status: "active",
    address: "",
  });

  // Modal controls
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
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Load buildings list
  const loadBuildings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: BuildingQueryParams = {
        page: currentPage,
        limit: 20,
        sortBy: sortBy as any,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter as any }),
        ...(typeFilter !== "all" && { building_type: typeFilter as any }),
      };

      console.log("🏢 Loading buildings with params:", params);
      const response = await buildingsAPI.getAll(params);

      console.log("🔍 Buildings API response structure:", {
        status: response.status,
        success: response.data?.success,
        dataType: typeof response.data?.data,
        dataKeys: response.data?.data ? Object.keys(response.data.data) : "N/A",
        pagination: response.data?.pagination,
        fullData: response.data?.data,
      });

      if (response.data && response.data.success === true) {
        const responseData = response.data.data;

        // Handle different response structures with proper type guards
        if (isArrayOfBuildings(responseData)) {
          // Direct array response
          setBuildings(responseData);
          console.log(
            `✅ Loaded ${responseData.length} buildings from direct array`
          );
        } else if (hasNestedData(responseData)) {
          // Nested data structure { data: Building[], pagination: {...} }
          setBuildings(responseData.data);
          console.log(
            `✅ Loaded ${responseData.data.length} buildings from nested structure`
          );

          // Handle nested pagination
          if (
            responseData.pagination &&
            typeof responseData.pagination === "object" &&
            "total_pages" in responseData.pagination &&
            typeof responseData.pagination.total_pages === "number"
          ) {
            setTotalPages(responseData.pagination.total_pages);
          }
        } else {
          console.warn("⚠️ Unexpected response data structure:", responseData);
          setBuildings([]);
        }

        // Handle top-level pagination
        if (
          response.data.pagination &&
          typeof response.data.pagination === "object" &&
          "total_pages" in response.data.pagination &&
          typeof response.data.pagination.total_pages === "number"
        ) {
          setTotalPages(response.data.pagination.total_pages);
        }
      } else {
        console.warn("⚠️ API response indicates failure:", response.data);
        setBuildings([]);
        setError(response.data?.message || "Failed to load buildings data");
      }
    } catch (error: any) {
      console.error("❌ Failed to load buildings:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to load buildings";
      setError(errorMessage);
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  // Load building details and related data
  const loadBuildingDetails = useCallback(
    async (building: ExtendedBuilding) => {
      try {
        setDetailsLoading(true);
        setSelectedBuilding(building);

        console.log("🏢 Loading details for building:", building.id);

        // Load building details
        try {
          const buildingResponse = await buildingsAPI.getById(building.id);
          if (buildingResponse.data && buildingResponse.data.success === true) {
            setSelectedBuilding(buildingResponse.data.data);
          }
        } catch (error) {
          console.error("❌ Failed to load building details:", error);
        }

        // Load related data in parallel
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        const endDate = new Date();

        const [
          equipmentResponse,
          energyResponse,
          energyStatsResponse,
          powerQualityResponse,
          powerQualityStatsResponse,
          auditsResponse,
          alertsResponse,
          maintenanceResponse,
        ] = await Promise.allSettled([
          equipmentAPI.getAll({ building_id: building.id }),
          energyAPI.getConsumption({
            building_id: building.id,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            interval: "daily",
          }),
          energyAPI.getStats(building.id),
          powerQualityAPI.getData({
            building_id: building.id,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
          }),
          powerQualityAPI.getStats(building.id),
          auditsAPI.getAll({ building_id: building.id }),
          alertsAPI.getAll({ building_id: building.id, limit: 20 }),
          equipmentAPI.getMaintenanceSchedule(building.id),
        ]);

        // Process responses with better error handling
        if (
          equipmentResponse.status === "fulfilled" &&
          equipmentResponse.value.data.success
        ) {
          const equipmentData = equipmentResponse.value.data.data;
          setBuildingEquipment(
            Array.isArray(equipmentData) ? equipmentData : []
          );
        } else {
          setBuildingEquipment([]);
        }

        if (
          energyResponse.status === "fulfilled" &&
          energyResponse.value.data.success
        ) {
          const energyData = energyResponse.value.data.data;
          setBuildingEnergy(
            energyData?.daily_data || energyData?.hourly_data || []
          );
        } else {
          setBuildingEnergy([]);
        }

        if (
          energyStatsResponse.status === "fulfilled" &&
          energyStatsResponse.value.data.success
        ) {
          setBuildingEnergyStats(energyStatsResponse.value.data.data);
        } else {
          setBuildingEnergyStats(null);
        }

        if (
          powerQualityResponse.status === "fulfilled" &&
          powerQualityResponse.value.data.success
        ) {
          const powerQualityData = powerQualityResponse.value.data.data;
          setBuildingPowerQuality(powerQualityData?.events || []);
        } else {
          setBuildingPowerQuality([]);
        }

        if (
          powerQualityStatsResponse.status === "fulfilled" &&
          powerQualityStatsResponse.value.data.success
        ) {
          setBuildingPowerQualityStats(
            powerQualityStatsResponse.value.data.data
          );
        } else {
          setBuildingPowerQualityStats(null);
        }

        if (
          auditsResponse.status === "fulfilled" &&
          auditsResponse.value.data.success
        ) {
          const auditsData = auditsResponse.value.data.data;
          setBuildingAudits(Array.isArray(auditsData) ? auditsData : []);
        } else {
          setBuildingAudits([]);
        }

        if (
          alertsResponse.status === "fulfilled" &&
          alertsResponse.value.data.success
        ) {
          const alertsData = alertsResponse.value.data.data;
          setBuildingAlerts(Array.isArray(alertsData) ? alertsData : []);
        } else {
          setBuildingAlerts([]);
        }

        if (
          maintenanceResponse.status === "fulfilled" &&
          maintenanceResponse.value.data.success
        ) {
          setMaintenanceSchedule(maintenanceResponse.value.data.data);
        } else {
          setMaintenanceSchedule(null);
        }
      } catch (error: any) {
        console.error("❌ Failed to load building details:", error);
        setError("Failed to load building details");
      } finally {
        setDetailsLoading(false);
      }
    },
    []
  );

  // Handle form submission for create/edit
  const handleSubmit = async (isEdit: boolean = false) => {
    try {
      setSubmitLoading(true);

      if (isEdit && selectedBuilding) {
        const response = await buildingsAPI.update(
          selectedBuilding.id,
          buildingForm
        );
        if (response.data.success) {
          setSelectedBuilding(response.data.data);
          onEditClose();
          loadBuildings();
        }
      } else {
        const response = await buildingsAPI.create(buildingForm);
        if (response.data.success) {
          onCreateClose();
          loadBuildings();
          resetForm();
        }
      }
    } catch (error: any) {
      console.error("❌ Form submission failed:", error);
      setError(error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle building deletion
  const handleDelete = async () => {
    if (!selectedBuilding) return;

    try {
      setSubmitLoading(true);
      await buildingsAPI.delete(selectedBuilding.id);
      onDeleteClose();
      handleBackToList();
      loadBuildings();
    } catch (error: any) {
      console.error("❌ Delete failed:", error);
      setError(error.response?.data?.message || "Delete failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setBuildingForm({
      name: "",
      code: "",
      area_sqm: 0,
      floors: 1,
      year_built: new Date().getFullYear(),
      building_type: "commercial",
      description: "",
      status: "active",
      address: "",
    });
  };

  // Prepare edit form
  const prepareEditForm = () => {
    if (selectedBuilding) {
      setBuildingForm({
        name: selectedBuilding.name || "",
        code: selectedBuilding.code || "",
        area_sqm: selectedBuilding.area_sqm || 0,
        floors: selectedBuilding.floors || 1,
        year_built: selectedBuilding.year_built || new Date().getFullYear(),
        building_type:
          (selectedBuilding.building_type as
            | "commercial"
            | "industrial"
            | "residential"
            | "institutional") || "commercial",
        description: selectedBuilding.description || "",
        status:
          (selectedBuilding.status as
            | "active"
            | "maintenance"
            | "inactive"
            | "construction") || "active",
        address: selectedBuilding.address || "",
      });
    }
  };

  // Initial load
  useEffect(() => {
    const handler = setTimeout(() => {
      loadBuildings();
    }, 500); // waits 500ms after typing stops

    return () => clearTimeout(handler);
  }, [loadBuildings]);

  // Handle building selection
  const handleBuildingSelect = useCallback(
    (building: ExtendedBuilding) => {
      setViewMode("details");
      loadBuildingDetails(building);
    },
    [loadBuildingDetails]
  );

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedBuilding(null);
    setBuildingEquipment([]);
    setBuildingEnergy([]);
    setBuildingEnergyStats(null);
    setBuildingPowerQuality([]);
    setBuildingPowerQualityStats(null);
    setBuildingAudits([]);
    setBuildingAlerts([]);
    setMaintenanceSchedule(null);
    setSelectedTab("overview");
  }, []);

  // Filter buildings
  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
      const matchesSearch =
        !searchQuery ||
        building.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        building.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        building.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || building.status === statusFilter;
      const matchesType =
        typeFilter === "all" || building.building_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [buildings, searchQuery, statusFilter, typeFilter]);

  // Render status chip
  const renderStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: "success" as const, label: "Active" },
      maintenance: { color: "warning" as const, label: "Maintenance" },
      inactive: { color: "default" as const, label: "Inactive" },
      construction: { color: "primary" as const, label: "Construction" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;

    return (
      <Chip color={config.color} size="sm" variant="flat">
        {config.label}
      </Chip>
    );
  };

  // Render building type chip
  const renderTypeChip = (type: string) => {
    const typeIcons = {
      commercial: <Building className="w-3 h-3" />,
      industrial: <Factory className="w-3 h-3" />,
      residential: <Home className="w-3 h-3" />,
      institutional: <GraduationCap className="w-3 h-3" />,
    };

    return (
      <Chip
        size="sm"
        variant="bordered"
        className="capitalize"
        startContent={typeIcons[type as keyof typeof typeIcons]}
      >
        {type?.replace("_", " ")}
      </Chip>
    );
  };

  // Comprehensive number formatting helper
  const safeFormat = {
    number: (value: any, decimals: number = 2): string => {
      if (value === null || value === undefined) return "N/A";
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num) ? num.toFixed(decimals) : "N/A";
    },

    integer: (value: any): string => {
      if (value === null || value === undefined) return "N/A";
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num)
        ? Math.round(num).toLocaleString()
        : "N/A";
    },

    percentage: (value: any, decimals: number = 0): string => {
      if (value === null || value === undefined) return "N/A";
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num) ? `${num.toFixed(decimals)}%` : "N/A";
    },

    getValue: (value: any, fallback: number = 0): number => {
      if (value === null || value === undefined) return fallback;
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num) ? num : fallback;
    },
  };

  // Helper function to safely format numbers
  const formatNumber = (value: any, decimals: number = 2): string => {
    return safeFormat.number(value, decimals);
  };

  // Helper function to safely get numeric value
  const getNumericValue = (value: any, fallback: number = 0): number => {
    return safeFormat.getValue(value, fallback);
  };

  // Render efficiency rating
  const renderEfficiencyRating = (score: any) => {
    const numericScore = safeFormat.getValue(score, 0);
    const getColor = (score: number) => {
      if (score >= 90) return "success";
      if (score >= 70) return "warning";
      return "danger";
    };

    return (
      <div className="flex items-center space-x-2">
        <Progress
          value={numericScore}
          color={getColor(numericScore)}
          size="sm"
          className="w-16"
        />
        <span className="text-sm text-default-600">
          {safeFormat.percentage(score, 0)}
        </span>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => (
    <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold text-danger">Delete Building</h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-danger-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-danger" />
              <div>
                <p className="font-medium text-danger">
                  This action cannot be undone
                </p>
                <p className="text-sm text-danger-600">
                  All building data, equipment, and historical records will be
                  permanently deleted.
                </p>
              </div>
            </div>

            {selectedBuilding && (
              <div className="p-4 bg-default-100 rounded-lg">
                <p>
                  <strong>Building:</strong> {selectedBuilding.name}
                </p>
                <p>
                  <strong>Code:</strong> {selectedBuilding.code}
                </p>
                <p>
                  <strong>Equipment:</strong> {buildingEquipment.length} items
                </p>
                <p>
                  <strong>Audits:</strong> {buildingAudits.length} records
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={onDeleteClose}
            isDisabled={submitLoading}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={handleDelete}
            isLoading={submitLoading}
            startContent={<Trash2 className="w-4 h-4" />}
          >
            Delete Building
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  // Loading state
  if (loading && buildings.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <Spinner size="lg" color="primary" />
            <p className="text-default-500">Loading buildings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && buildings.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Error Loading Buildings
            </h3>
            <p className="text-default-500 mb-4">{error}</p>
            <Button
              color="primary"
              onPress={loadBuildings}
              startContent={<RefreshCw className="w-4 h-4" />}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Buildings list view
  if (viewMode === "list") {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground-600 bg-clip-text text-transparent">
              Buildings Management
            </h1>
            <p className="text-default-500 mt-1">
              Monitor and manage building infrastructure, energy consumption,
              and compliance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              color="primary"
              onPress={() => {
                resetForm();
                onCreateOpen();
              }}
              startContent={<Plus className="w-4 h-4" />}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Add Building
            </Button>
            <Button
              variant="bordered"
              onPress={loadBuildings}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Buildings</p>
                  <p className="text-xl font-semibold">{buildings.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Active Buildings</p>
                  <p className="text-xl font-semibold">
                    {buildings.filter((b) => b.status === "active").length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <Wrench className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-default-500">In Maintenance</p>
                  <p className="text-xl font-semibold">
                    {buildings.filter((b) => b.status === "maintenance").length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Area</p>
                  <p className="text-xl font-semibold">
                    {buildings
                      .reduce((sum, b) => sum + (b.area_sqm || 0), 0)
                      .toLocaleString()}{" "}
                    m²
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Search buildings..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search className="w-4 h-4 text-default-400" />}
                isClearable
                onClear={() => setSearchQuery("")}
              />

              <Select
                placeholder="Status"
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) =>
                  setStatusFilter((Array.from(keys)[0] as string) || "all")
                }
                aria-label="Filter by building status"
              >
                <SelectItem key="all">All Statuses</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="maintenance">Maintenance</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
                <SelectItem key="construction">Construction</SelectItem>
              </Select>

              <Select
                placeholder="Building Type"
                selectedKeys={typeFilter ? [typeFilter] : []}
                onSelectionChange={(keys) =>
                  setTypeFilter((Array.from(keys)[0] as string) || "all")
                }
                aria-label="Filter by building type"
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="commercial">Commercial</SelectItem>
                <SelectItem key="industrial">Industrial</SelectItem>
                <SelectItem key="residential">Residential</SelectItem>
                <SelectItem key="institutional">Institutional</SelectItem>
              </Select>

              <Select
                placeholder="Sort By"
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) =>
                  setSortBy(Array.from(keys)[0] as string)
                }
                aria-label="Sort buildings by field"
              >
                <SelectItem key="name">Name</SelectItem>
                <SelectItem key="code">Code</SelectItem>
                <SelectItem key="area_sqm">Area</SelectItem>
                <SelectItem key="created_at">Created Date</SelectItem>
              </Select>

              <Select
                placeholder="Order"
                selectedKeys={[sortOrder]}
                onSelectionChange={(keys) =>
                  setSortOrder(Array.from(keys)[0] as "ASC" | "DESC")
                }
                aria-label="Sort order direction"
              >
                <SelectItem key="ASC">Ascending</SelectItem>
                <SelectItem key="DESC">Descending</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Buildings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBuildings.map((building) => (
            <Card
              key={building.id}
              className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-background to-content1 border border-divider hover:border-primary/30 cursor-pointer"
            >
              {/* Clickable area for card selection */}
              <div
                className="flex-1"
                onClick={() => handleBuildingSelect(building)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                        {building.name || "Unnamed Building"}
                      </h3>
                      <p className="text-sm text-default-500 mt-1">
                        {building.code || `ID: ${building.id}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {building.status && renderStatusChip(building.status)}
                      {building.building_type &&
                        renderTypeChip(building.building_type)}
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="pt-0">
                  <div className="space-y-4">
                    {building.description && (
                      <p className="text-sm text-default-600 line-clamp-2">
                        {building.description}
                      </p>
                    )}

                    {/* Building Specs */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {building.area_sqm
                            ? `${building.area_sqm.toLocaleString()} m²`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {building.floors
                            ? `${building.floors} floors`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {building.equipmentCount ||
                            building.equipment_summary?.total_equipment ||
                            0}{" "}
                          equipment
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {building.year_built || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <Divider />

                    <div className="space-y-3">
                      {(building.avgComplianceScore ||
                        building.compliance_status?.overall_score) && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-600 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Compliance
                          </span>
                          {renderEfficiencyRating(
                            building.avgComplianceScore ||
                              building.compliance_status?.overall_score ||
                              0
                          )}
                        </div>
                      )}

                      {(building.avgPowerFactor ||
                        building.performance_summary
                          ?.energy_intensity_kwh_sqm) && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-600 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Power Factor
                          </span>
                          <span className="text-sm font-medium">
                            {safeFormat.number(
                              building.avgPowerFactor || 0.85,
                              2
                            )}
                          </span>
                        </div>
                      )}

                      {(building.totalConsumptionKwh ||
                        building.performance_summary
                          ?.monthly_consumption_kwh) && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-600 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Monthly kWh
                          </span>
                          <span className="text-sm font-medium">
                            {getNumericValue(
                              building.totalConsumptionKwh ||
                                building.performance_summary
                                  ?.monthly_consumption_kwh,
                              0
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6">
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Eye className="w-3 h-3" />}
                    className="flex-1"
                    onPress={() => handleBuildingSelect(building)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    isIconOnly
                    onPress={() => {
                      setSelectedBuilding(building);
                      prepareEditForm();
                      onEditOpen();
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredBuildings.length === 0 && !loading && (
          <Card>
            <CardBody className="text-center p-12">
              <Building className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {error ? "Unable to Load Buildings" : "No Buildings Found"}
              </h3>
              <p className="text-default-500 mb-6">
                {error ? (
                  <>
                    There was an error loading the buildings data.
                    <br />
                    <span className="text-sm text-danger mt-2 block">
                      {error}
                    </span>
                  </>
                ) : searchQuery ||
                  statusFilter !== "all" ||
                  typeFilter !== "all" ? (
                  "Try adjusting your filters to see more results"
                ) : (
                  "Get started by adding your first building"
                )}
              </p>
              <div className="flex gap-3 justify-center">
                {error ? (
                  <Button
                    color="primary"
                    onPress={loadBuildings}
                    startContent={<RefreshCw className="w-4 h-4" />}
                    isLoading={loading}
                  >
                    Retry Loading
                  </Button>
                ) : !searchQuery &&
                  statusFilter === "all" &&
                  typeFilter === "all" ? (
                  <Button
                    color="primary"
                    onPress={() => {
                      resetForm();
                      onCreateOpen();
                    }}
                    startContent={<Plus className="w-4 h-4" />}
                  >
                    Add First Building
                  </Button>
                ) : (
                  <Button
                    variant="bordered"
                    onPress={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              showShadow
              color="primary"
            />
          </div>
        )}

        {/* Modals */}
        <BuildingFormModal
          isOpen={isCreateOpen || isEditOpen}
          isEdit={isEditOpen}
          formData={buildingForm}
          onChange={setBuildingForm}
          onClose={isEditOpen ? onEditClose : onCreateClose}
          onSubmit={() => handleSubmit(isEditOpen)}
          isSubmitting={submitLoading}
        />
        {isDeleteOpen && <DeleteConfirmationModal />}
      </div>
    );
  }

  // Building details view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            onPress={handleBackToList}
            startContent={<ChevronRight className="w-4 h-4 rotate-180" />}
          >
            Back to Buildings
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedBuilding?.name || "Building Details"}
            </h1>
            <p className="text-default-500">
              {selectedBuilding?.code} •{" "}
              {selectedBuilding?.building_type?.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="bordered"
            onPress={() =>
              selectedBuilding && loadBuildingDetails(selectedBuilding)
            }
            startContent={<RefreshCw className="w-4 h-4" />}
            isLoading={detailsLoading}
          >
            Refresh
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                isIconOnly
                startContent={<MoreVertical className="w-4 h-4" />}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Building actions">
              <DropdownItem
                key="edit"
                startContent={<Edit className="w-4 h-4" />}
                onPress={() => {
                  prepareEditForm();
                  onEditOpen();
                }}
              >
                Edit Building
              </DropdownItem>
              <DropdownItem
                key="delete"
                startContent={<Trash2 className="w-4 h-4" />}
                className="text-danger"
                color="danger"
                onPress={onDeleteOpen}
              >
                Delete Building
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Building Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Equipment</p>
                <p className="text-xl font-semibold">
                  {buildingEquipment.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Audits</p>
                <p className="text-xl font-semibold">{buildingAudits.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Active Alerts</p>
                <p className="text-xl font-semibold">
                  {buildingAlerts.filter((a) => a.status === "active").length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Power Factor</p>
                <p className="text-xl font-semibold">
                  {safeFormat.number(
                    buildingEnergyStats?.average_power_factor,
                    2
                  )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        color="primary"
        variant="underlined"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary font-medium",
        }}
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Overview</span>
            </div>
          }
        >
          <div className="mt-6 space-y-6">
            {/* Building Information */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Building Information</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-default-500 mb-1">
                      Building Name
                    </p>
                    <p className="font-medium">{selectedBuilding?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">
                      Building Code
                    </p>
                    <p className="font-medium">{selectedBuilding?.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">Status</p>
                    {selectedBuilding?.status &&
                      renderStatusChip(selectedBuilding.status)}
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">Area</p>
                    <p className="font-medium">
                      {selectedBuilding?.area_sqm
                        ? `${selectedBuilding.area_sqm.toLocaleString()} m²`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">Floors</p>
                    <p className="font-medium">
                      {selectedBuilding?.floors || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">Year Built</p>
                    <p className="font-medium">
                      {selectedBuilding?.year_built || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">
                      Building Type
                    </p>
                    {selectedBuilding?.building_type &&
                      renderTypeChip(selectedBuilding.building_type)}
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">Created</p>
                    <p className="font-medium">
                      {selectedBuilding?.created_at
                        ? new Date(
                            selectedBuilding.created_at
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500 mb-1">
                      Last Updated
                    </p>
                    <p className="font-medium">
                      {selectedBuilding?.updated_at
                        ? new Date(
                            selectedBuilding.updated_at
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {selectedBuilding?.description && (
                  <div className="mt-6">
                    <p className="text-sm text-default-500 mb-2">Description</p>
                    <p className="text-default-700">
                      {selectedBuilding.description}
                    </p>
                  </div>
                )}

                {selectedBuilding?.address && (
                  <div className="mt-6">
                    <p className="text-sm text-default-500 mb-2">Address</p>
                    <p className="text-default-700">
                      {selectedBuilding.address}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Performance Summary */}
            {buildingEnergyStats && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Performance Summary</h3>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-default-500 mb-1">
                        Total Consumption
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {safeFormat.integer(
                          buildingEnergyStats.total_consumption
                        )}{" "}
                        kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500 mb-1">
                        Average Consumption
                      </p>
                      <p className="text-2xl font-bold text-secondary">
                        {safeFormat.number(
                          buildingEnergyStats.average_consumption,
                          1
                        )}{" "}
                        kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500 mb-1">
                        Peak Demand
                      </p>
                      <p className="text-2xl font-bold text-warning">
                        {safeFormat.number(buildingEnergyStats.peak_demand, 1)}{" "}
                        kW
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500 mb-1">
                        Efficiency Score
                      </p>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={safeFormat.getValue(
                            buildingEnergyStats.efficiency_score,
                            0
                          )}
                          color={
                            safeFormat.getValue(
                              buildingEnergyStats.efficiency_score,
                              0
                            ) >= 80
                              ? "success"
                              : safeFormat.getValue(
                                    buildingEnergyStats.efficiency_score,
                                    0
                                  ) >= 60
                                ? "warning"
                                : "danger"
                          }
                          className="flex-1"
                        />
                        <span className="font-bold">
                          {safeFormat.percentage(
                            buildingEnergyStats.efficiency_score,
                            0
                          )}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-default-500 mb-1">
                        Power Factor
                      </p>
                      <p className="text-2xl font-bold text-success">
                        {safeFormat.number(
                          buildingEnergyStats.average_power_factor,
                          3
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500 mb-1">
                        Consumption per m²
                      </p>
                      <p className="text-2xl font-bold text-default-700">
                        {safeFormat.number(
                          buildingEnergyStats.consumption_per_sqm,
                          2
                        )}{" "}
                        kWh/m²
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="equipment"
          title={
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4" />
              <span>Equipment</span>
              {buildingEquipment.length > 0 && (
                <Chip size="sm" color="primary" variant="flat">
                  {buildingEquipment.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-6">
            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : buildingEquipment.length > 0 ? (
              <Card>
                <CardBody>
                  <Table aria-label="Equipment table">
                    <TableHeader>
                      <TableColumn>EQUIPMENT</TableColumn>
                      <TableColumn>TYPE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>LOCATION</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {buildingEquipment.map((equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{equipment.name}</p>
                              {equipment.model && (
                                <p className="text-sm text-default-500">
                                  {equipment.model}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              className="capitalize"
                            >
                              {equipment.equipment_type.replace("_", " ")}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={
                                equipment.status === "active"
                                  ? "success"
                                  : equipment.status === "maintenance"
                                    ? "warning"
                                    : equipment.status === "inactive"
                                      ? "danger"
                                      : "default"
                              }
                              variant="flat"
                              className="capitalize"
                            >
                              {equipment.status}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div>
                              {equipment.location && (
                                <p className="text-sm">{equipment.location}</p>
                              )}
                              {equipment.floor && (
                                <p className="text-xs text-default-500">
                                  Floor {equipment.floor}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="flat" isIconOnly>
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="flat" isIconOnly>
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <Wrench className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Equipment Found
                  </h3>
                  <p className="text-default-500">
                    This building doesn't have any equipment registered yet.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="energy"
          title={
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Energy</span>
            </div>
          }
        >
          <div className="mt-6 space-y-6">
            {buildingEnergyStats ? (
              <>
                {/* Energy Statistics */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Energy Statistics</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-default-500 mb-2">
                          Total Consumption
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {safeFormat.integer(
                            buildingEnergyStats.total_consumption
                          )}
                        </p>
                        <p className="text-sm text-default-500">kWh</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-default-500 mb-2">
                          Total Cost
                        </p>
                        <p className="text-2xl font-bold text-success">
                          ₱{safeFormat.integer(buildingEnergyStats.total_cost)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-default-500 mb-2">
                          Peak Demand
                        </p>
                        <p className="text-2xl font-bold text-warning">
                          {safeFormat.number(
                            buildingEnergyStats.peak_demand,
                            1
                          )}
                        </p>
                        <p className="text-sm text-default-500">kW</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-default-500 mb-2">
                          Efficiency Score
                        </p>
                        <p className="text-2xl font-bold text-secondary">
                          {safeFormat.percentage(
                            buildingEnergyStats.efficiency_score,
                            0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Power Quality Stats */}
                {buildingPowerQualityStats && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Power Quality</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                          <p className="text-sm text-default-500 mb-2">
                            Quality Score
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {safeFormat.percentage(
                              buildingPowerQualityStats?.quality_score,
                              0
                            )}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-default-500 mb-2">
                            THD Voltage
                          </p>
                          <p className="text-2xl font-bold text-warning">
                            {safeFormat.percentage(
                              buildingPowerQualityStats?.thd_voltage_avg,
                              1
                            )}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-default-500 mb-2">
                            THD Current
                          </p>
                          <p className="text-2xl font-bold text-danger">
                            {safeFormat.percentage(
                              buildingPowerQualityStats?.thd_current_avg,
                              1
                            )}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-default-500 mb-2">
                            Compliance
                          </p>
                          <p className="text-2xl font-bold text-success">
                            {safeFormat.percentage(
                              buildingPowerQualityStats?.compliance
                                ?.overall_compliance,
                              0
                            )}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <Zap className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Energy Data</h3>
                  <p className="text-default-500">
                    No energy consumption data available for this building.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="power-quality"
          title={
            <div className="flex items-center space-x-2">
              <Power className="w-4 h-4" />
              <span>Power Quality</span>
              {buildingPowerQuality.length > 0 && (
                <Chip size="sm" color="warning" variant="flat">
                  {buildingPowerQuality.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-6">
            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : buildingPowerQuality.length > 0 ? (
              <Card>
                <CardBody>
                  <Table aria-label="Power Quality Events table">
                    <TableHeader>
                      <TableColumn>EVENT TYPE</TableColumn>
                      <TableColumn>SEVERITY</TableColumn>
                      <TableColumn>MAGNITUDE</TableColumn>
                      <TableColumn>DURATION</TableColumn>
                      <TableColumn>TIMESTAMP</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {buildingPowerQuality.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              className="capitalize"
                            >
                              {event.event_type?.replace("_", " ")}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={
                                event.severity === "critical"
                                  ? "danger"
                                  : event.severity === "high"
                                    ? "warning"
                                    : event.severity === "medium"
                                      ? "primary"
                                      : "default"
                              }
                              variant="flat"
                              className="capitalize"
                            >
                              {event.severity}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {safeFormat.number(event.magnitude, 2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {event.duration_ms
                                ? `${event.duration_ms}ms`
                                : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {event.start_time
                                ? new Date(event.start_time).toLocaleString()
                                : "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <Power className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Power Quality Events
                  </h3>
                  <p className="text-default-500">
                    No power quality events detected for this building.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="maintenance"
          title={
            <div className="flex items-center space-x-2">
              <Construction className="w-4 h-4" />
              <span>Maintenance</span>
              {maintenanceSchedule?.summary?.overdue &&
                maintenanceSchedule.summary.overdue > 0 && (
                  <Chip size="sm" color="danger" variant="flat">
                    {maintenanceSchedule.summary.overdue}
                  </Chip>
                )}
            </div>
          }
        >
          <div className="mt-6">
            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : maintenanceSchedule ? (
              <div className="space-y-6">
                {/* Maintenance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardBody className="p-4 text-center">
                      <p className="text-sm text-default-500">
                        Total Equipment
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {maintenanceSchedule?.summary?.total_equipment || 0}
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
                    <CardBody className="p-4 text-center">
                      <p className="text-sm text-default-500">Due Soon</p>
                      <p className="text-2xl font-bold text-warning">
                        {maintenanceSchedule?.summary?.due_soon || 0}
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="bg-gradient-to-br from-danger/10 to-danger/5">
                    <CardBody className="p-4 text-center">
                      <p className="text-sm text-default-500">Overdue</p>
                      <p className="text-2xl font-bold text-danger">
                        {maintenanceSchedule?.summary?.overdue || 0}
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="bg-gradient-to-br from-success/10 to-success/5">
                    <CardBody className="p-4 text-center">
                      <p className="text-sm text-default-500">In Maintenance</p>
                      <p className="text-2xl font-bold text-success">
                        {maintenanceSchedule?.summary?.in_maintenance || 0}
                      </p>
                    </CardBody>
                  </Card>
                </div>

                {/* Maintenance Schedule Table */}
                <Card>
                  <CardBody>
                    <Table aria-label="Maintenance Schedule table">
                      <TableHeader>
                        <TableColumn>EQUIPMENT</TableColumn>
                        <TableColumn>TYPE</TableColumn>
                        <TableColumn>STATUS</TableColumn>
                        <TableColumn>NEXT DUE</TableColumn>
                        <TableColumn>RISK LEVEL</TableColumn>
                        <TableColumn>URGENCY</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {(maintenanceSchedule?.schedule || []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-default-500">
                                  {item.building_name}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                variant="flat"
                                className="capitalize"
                              >
                                {item.equipment_type?.replace("_", " ") ||
                                  "Unknown"}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                color={
                                  item.maintenance_status === "overdue"
                                    ? "danger"
                                    : item.maintenance_status === "due_soon"
                                      ? "warning"
                                      : "success"
                                }
                                variant="flat"
                                className="capitalize"
                              >
                                {item.maintenance_status?.replace("_", " ") ||
                                  "Unknown"}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">
                                  {item.next_maintenance_date
                                    ? new Date(
                                        item.next_maintenance_date
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                                <p className="text-xs text-default-500">
                                  {item.days_until_due !== undefined
                                    ? item.days_until_due > 0
                                      ? `${item.days_until_due} days`
                                      : `${Math.abs(item.days_until_due)} days overdue`
                                    : "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                color={
                                  item.maintenance_risk_level === "critical"
                                    ? "danger"
                                    : item.maintenance_risk_level === "high"
                                      ? "warning"
                                      : item.maintenance_risk_level === "medium"
                                        ? "primary"
                                        : "default"
                                }
                                variant="flat"
                                className="capitalize"
                              >
                                {item.maintenance_risk_level || "Unknown"}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={safeFormat.getValue(
                                    item.urgency_score,
                                    0
                                  )}
                                  color={
                                    safeFormat.getValue(
                                      item.urgency_score,
                                      0
                                    ) >= 80
                                      ? "danger"
                                      : safeFormat.getValue(
                                            item.urgency_score,
                                            0
                                          ) >= 60
                                        ? "warning"
                                        : "success"
                                  }
                                  size="sm"
                                  className="w-16"
                                />
                                <span className="text-sm">
                                  {safeFormat.percentage(item.urgency_score, 0)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <Construction className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Maintenance Data
                  </h3>
                  <p className="text-default-500">
                    No maintenance schedule available for this building.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="audits"
          title={
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Audits</span>
              {buildingAudits.length > 0 && (
                <Chip size="sm" color="primary" variant="flat">
                  {buildingAudits.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-6">
            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : buildingAudits.length > 0 ? (
              <Card>
                <CardBody>
                  <Table aria-label="Audits table">
                    <TableHeader>
                      <TableColumn>AUDIT</TableColumn>
                      <TableColumn>TYPE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>COMPLIANCE SCORE</TableColumn>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>AUDITOR</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {buildingAudits.map((audit) => (
                        <TableRow key={audit.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{audit.title}</p>
                              {audit.description && (
                                <p className="text-sm text-default-500 line-clamp-1">
                                  {audit.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              className="capitalize"
                            >
                              {audit.audit_type?.replace("_", " ")}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={
                                audit.status === "completed"
                                  ? "success"
                                  : audit.status === "in_progress"
                                    ? "warning"
                                    : audit.status === "planned"
                                      ? "primary"
                                      : "default"
                              }
                              variant="flat"
                              className="capitalize"
                            >
                              {audit.status?.replace("_", " ")}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {audit.compliance_score ? (
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={audit.compliance_score}
                                  color={
                                    audit.compliance_score >= 80
                                      ? "success"
                                      : audit.compliance_score >= 60
                                        ? "warning"
                                        : "danger"
                                  }
                                  size="sm"
                                  className="w-16"
                                />
                                <span className="text-sm">
                                  {audit.compliance_score}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-default-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {audit.actual_end_date ? (
                              <div>
                                <p className="text-sm">
                                  {new Date(
                                    audit.actual_end_date
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-default-500">
                                  Completed
                                </p>
                              </div>
                            ) : audit.planned_start_date ? (
                              <div>
                                <p className="text-sm">
                                  {new Date(
                                    audit.planned_start_date
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-default-500">
                                  Scheduled
                                </p>
                              </div>
                            ) : (
                              <span className="text-default-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {audit.auditor_name ? (
                              <div className="flex items-center gap-2">
                                <Avatar size="sm" name={audit.auditor_name} />
                                <span className="text-sm">
                                  {audit.auditor_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-default-400">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Audits Found
                  </h3>
                  <p className="text-default-500">
                    No audits have been conducted for this building yet.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="alerts"
          title={
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Alerts</span>
              {buildingAlerts.filter((a) => a.status === "active").length >
                0 && (
                <Chip size="sm" color="danger" variant="flat">
                  {buildingAlerts.filter((a) => a.status === "active").length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-6">
            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : buildingAlerts.length > 0 ? (
              <Card>
                <CardBody>
                  <Table aria-label="Alerts table">
                    <TableHeader>
                      <TableColumn>ALERT</TableColumn>
                      <TableColumn>TYPE</TableColumn>
                      <TableColumn>SEVERITY</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>EQUIPMENT</TableColumn>
                      <TableColumn>AGE</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {buildingAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{alert.title}</p>
                              <p className="text-sm text-default-500 line-clamp-1">
                                {alert.message}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              className="capitalize"
                            >
                              {alert.type?.replace("_", " ")}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={
                                alert.severity === "critical"
                                  ? "danger"
                                  : alert.severity === "high"
                                    ? "warning"
                                    : alert.severity === "medium"
                                      ? "primary"
                                      : "default"
                              }
                              variant="flat"
                              className="capitalize"
                            >
                              {alert.severity}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={
                                alert.status === "active"
                                  ? "danger"
                                  : alert.status === "acknowledged"
                                    ? "warning"
                                    : alert.status === "resolved"
                                      ? "success"
                                      : "default"
                              }
                              variant="flat"
                              className="capitalize"
                            >
                              {alert.status}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {alert.equipment_name ? (
                              <div>
                                <p className="text-sm font-medium">
                                  {alert.equipment_name}
                                </p>
                                {alert.equipment_id && (
                                  <p className="text-xs text-default-500">
                                    ID: {alert.equipment_id}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-default-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {alert.age_minutes ? (
                              <span className="text-sm">
                                {alert.age_minutes < 60
                                  ? `${alert.age_minutes}m`
                                  : alert.age_minutes < 1440
                                    ? `${Math.floor(alert.age_minutes / 60)}h`
                                    : `${Math.floor(alert.age_minutes / 1440)}d`}
                              </span>
                            ) : (
                              <span className="text-default-400">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                  <p className="text-default-500">
                    This building has no active alerts.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Modals */}
      <BuildingFormModal
        isOpen={isCreateOpen || isEditOpen}
        isEdit={isEditOpen}
        formData={buildingForm}
        onChange={setBuildingForm}
        onClose={isEditOpen ? onEditClose : onCreateClose}
        onSubmit={() => handleSubmit(isEditOpen)}
        isSubmitting={submitLoading}
      />

      {isDeleteOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default BuildingsPage;
