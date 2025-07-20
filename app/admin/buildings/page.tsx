"use client";

import React, { useState, useCallback, useMemo } from "react";

// HeroUI Components
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
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

import {
  Building,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Activity,
  Zap,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Info,
  Shield,
  Power,
  Home,
  Factory,
  GraduationCap,
  X,
  MoreVertical,
} from "lucide-react";

// ✅ FIXED: Import your API hooks and types correctly
import {
  useAuth,
  useBuildings,
  useBuilding,
  useBuildingMutation,
  useEquipment,
  useEnergyStats,
  usePowerQualityStats,
  useAudits,
  useAlerts,
  useMaintenanceSchedule,
} from "@/hooks/useApi";

import type {
  Building as BuildingType,
  BuildingQueryParams,
  Equipment,
  Alert,
  Audit,
} from "@/types/api-types";

// Form interface for building creation/editing
interface BuildingFormData {
  name: string;
  code: string;
  areaSqm: number;
  floors: number;
  yearBuilt: number;
  buildingType: "commercial" | "industrial" | "residential" | "institutional";
  description: string;
  status: "active" | "maintenance" | "inactive";
  address: string;
}

const BuildingsPage: React.FC = () => {
  // ✅ Authentication check
  const { isAuthenticated, user } = useAuth();

  // ✅ View and selection state
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState("overview");

  // ✅ Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Form state
  const [buildingForm, setBuildingForm] = useState<BuildingFormData>({
    name: "",
    code: "",
    areaSqm: 0,
    floors: 1,
    yearBuilt: new Date().getFullYear(),
    buildingType: "commercial",
    description: "",
    status: "active",
    address: "",
  });

  // ✅ Modal controls
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

  // ✅ Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ Build query parameters for buildings list
  const buildingsParams = useMemo(
    (): BuildingQueryParams => ({
      page: currentPage,
      limit: 20,
      sortBy: sortBy as any,
      sortOrder,
      ...(searchQuery.trim() && { search: searchQuery.trim() }),
      ...(statusFilter !== "all" && { status: statusFilter as any }),
      ...(typeFilter !== "all" && { buildingType: typeFilter as any }),
    }),
    [currentPage, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]
  );

  // ✅ FIXED: API Hooks - Buildings list with proper error handling
  const {
    data: buildings = [], // ✅ Default to empty array
    pagination,
    loading: buildingsLoading,
    error: buildingsError,
    refresh: refreshBuildings,
    isError: buildingsIsError,
  } = useBuildings(buildingsParams, {
    immediate: true,
    dependencies: [
      searchQuery,
      statusFilter,
      typeFilter,
      sortBy,
      sortOrder,
      currentPage,
    ],
  });

  // ✅ Individual building details (only when selected)
  const {
    data: selectedBuilding,
    loading: buildingLoading,
    error: buildingError,
    refresh: refreshBuilding,
    isError: buildingIsError,
  } = useBuilding(selectedBuildingId!, {
    immediate: !!selectedBuildingId,
  });

  // ✅ FIXED: Building equipment with proper error handling
  const {
    data: buildingEquipment = [], // ✅ Default to empty array
    loading: equipmentLoading,
    error: equipmentError,
    isError: equipmentIsError,
  } = useEquipment(
    { buildingId: selectedBuildingId! },
    {
      immediate: !!selectedBuildingId,
    }
  );

  // ✅ Energy statistics (only when building is selected)
  const {
    data: energyStats,
    loading: energyStatsLoading,
    error: energyStatsError,
    isError: energyStatsIsError,
  } = useEnergyStats(selectedBuildingId!, undefined, {
    immediate: !!selectedBuildingId,
  });

  // ✅ Power quality statistics (only when building is selected)
  const {
    data: powerQualityStats,
    loading: powerQualityLoading,
    error: powerQualityStatsError,
    isError: powerQualityStatsIsError,
  } = usePowerQualityStats(selectedBuildingId!, undefined, {
    immediate: !!selectedBuildingId,
  });

  // ✅ FIXED: Building audits with proper error handling
  const {
    data: buildingAudits = [], // ✅ Default to empty array
    loading: auditsLoading,
    error: auditsError,
    isError: auditsIsError,
  } = useAudits(
    { buildingId: selectedBuildingId! },
    {
      immediate: !!selectedBuildingId,
    }
  );

  // ✅ FIXED: Building alerts with proper error handling
  const {
    data: buildingAlerts = [], // ✅ Default to empty array
    loading: alertsLoading,
    error: alertsError,
    isError: alertsIsError,
  } = useAlerts(
    { buildingId: selectedBuildingId!, limit: 50 },
    {
      immediate: !!selectedBuildingId,
    }
  );

  // ✅ Maintenance schedule (only when building is selected)
  const {
    data: maintenanceSchedule,
    loading: maintenanceLoading,
    error: maintenanceError,
    isError: maintenanceIsError,
  } = useMaintenanceSchedule(selectedBuildingId!, {
    immediate: !!selectedBuildingId,
  });

  // ✅ Building mutations
  const {
    createBuilding,
    updateBuilding,
    deleteBuilding,
    loading: mutationLoading,
    error: mutationError,
  } = useBuildingMutation();

  // ✅ FIXED: Extract pagination data safely with proper fallbacks
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || 0;
  const hasNextPage = pagination?.hasNextPage || false;
  const hasPrevPage = pagination?.hasPrevPage || false;

  // ✅ Auto-clear success messages
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ✅ Reset page when filters change
  React.useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  // ✅ Handlers
  const handleCreateOpen = useCallback(() => {
    resetForm();
    onCreateOpen();
  }, [onCreateOpen]);

  const handleEditOpen = useCallback(() => {
    if (selectedBuilding) {
      prepareEditForm();
      onEditOpen();
    }
  }, [selectedBuilding, onEditOpen]);

  const handleBuildingSelect = useCallback((building: BuildingType) => {
    setSelectedBuildingId(building.id);
    setViewMode("details");
    setSelectedTab("overview");
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedBuildingId(null);
    setSelectedTab("overview");
  }, []);

  const handleSubmit = useCallback(
    async (isEdit: boolean = false) => {
      try {
        // ✅ Validate required fields
        if (!buildingForm.name.trim() || !buildingForm.code.trim()) {
          return;
        }

        // ✅ Transform form data to server format
        const submitData = {
          name: buildingForm.name.trim(),
          code: buildingForm.code.trim(),
          description: buildingForm.description?.trim() || "",
          address: buildingForm.address?.trim() || "",
          areaSqm: Number(buildingForm.areaSqm) || 0,
          floors: Number(buildingForm.floors) || 1,
          yearBuilt: Number(buildingForm.yearBuilt) || new Date().getFullYear(),
          buildingType: buildingForm.buildingType,
          status: buildingForm.status,
        };

        if (isEdit && selectedBuilding) {
          await updateBuilding(selectedBuilding.id, submitData);
          setSuccessMessage("Building updated successfully!");
          onEditClose();
          await Promise.all([refreshBuildings(), refreshBuilding()]);
        } else {
          await createBuilding(submitData);
          setSuccessMessage("Building created successfully!");
          onCreateClose();
          resetForm();
          await refreshBuildings();
        }
      } catch (error) {
        console.error("Form submission failed:", error);
        // Error is already handled by the mutation hook
      }
    },
    [
      buildingForm,
      selectedBuilding,
      updateBuilding,
      createBuilding,
      onEditClose,
      onCreateClose,
      refreshBuildings,
      refreshBuilding,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedBuilding) return;

    try {
      await deleteBuilding(selectedBuilding.id);
      setSuccessMessage(
        `Building "${selectedBuilding.name}" has been deleted successfully.`
      );
      onDeleteClose();
      handleBackToList();
      await refreshBuildings();
    } catch (error) {
      console.error("Delete failed:", error);
      // Error is already handled by the mutation hook
    }
  }, [
    selectedBuilding,
    deleteBuilding,
    onDeleteClose,
    handleBackToList,
    refreshBuildings,
  ]);

  const resetForm = useCallback(() => {
    setBuildingForm({
      name: "",
      code: "",
      areaSqm: 0,
      floors: 1,
      yearBuilt: new Date().getFullYear(),
      buildingType: "commercial",
      description: "",
      status: "active",
      address: "",
    });
  }, []);

  const prepareEditForm = useCallback(() => {
    if (selectedBuilding) {
      setBuildingForm({
        name: selectedBuilding.name || "",
        code: selectedBuilding.code || "",
        areaSqm: selectedBuilding.areaSqm || 0,
        floors: selectedBuilding.floors || 1,
        yearBuilt: selectedBuilding.yearBuilt || new Date().getFullYear(),
        buildingType: selectedBuilding.buildingType || "commercial",
        description: selectedBuilding.description || "",
        status: selectedBuilding.status || "active",
        address: selectedBuilding.address || "",
      });
    }
  }, [selectedBuilding]);

  // ✅ FIXED: Enhanced utility functions with proper null/undefined handling
  const safeFormat = {
    number: (value: any, decimals: number = 2): string => {
      if (value === null || value === undefined || value === "") return "N/A";
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num) ? num.toFixed(decimals) : "N/A";
    },

    integer: (value: any): string => {
      if (value === null || value === undefined || value === "") return "N/A";
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num)
        ? Math.round(num).toLocaleString()
        : "N/A";
    },

    percentage: (value: any, decimals: number = 0): string => {
      if (value === null || value === undefined || value === "") return "N/A";
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num) ? `${num.toFixed(decimals)}%` : "N/A";
    },

    getValue: (value: any, fallback: number = 0): number => {
      if (value === null || value === undefined || value === "")
        return fallback;
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      return !isNaN(num) && isFinite(num) ? num : fallback;
    },
  };

  const renderStatusChip = useCallback((status: string) => {
    const statusConfig = {
      active: { color: "success" as const, label: "Active" },
      maintenance: { color: "warning" as const, label: "Maintenance" },
      inactive: { color: "default" as const, label: "Inactive" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;

    return (
      <Chip color={config.color} size="sm" variant="flat">
        {config.label}
      </Chip>
    );
  }, []);

  const renderTypeChip = useCallback((type: string) => {
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
  }, []);

  const renderEfficiencyRating = useCallback((score: any) => {
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
  }, []);

  // ✅ FIXED: Summary statistics with better array handling
  const summaryStats = useMemo(() => {
    // ✅ Ensure buildings is always an array
    const buildingsArray = Array.isArray(buildings) ? buildings : [];

    return {
      total: totalCount || buildingsArray.length,
      active: buildingsArray.filter((b) => b.status === "active").length,
      maintenance: buildingsArray.filter((b) => b.status === "maintenance")
        .length,
      totalArea: buildingsArray.reduce((sum, b) => sum + (b.areaSqm || 0), 0),
    };
  }, [buildings, totalCount]);

  // ✅ FIXED: Details loading state properly checks all data types
  const detailsLoading =
    buildingLoading ||
    equipmentLoading ||
    energyStatsLoading ||
    powerQualityLoading ||
    auditsLoading ||
    alertsLoading ||
    maintenanceLoading;

  // ✅ FIXED: Check authentication first
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Authentication Required
            </h3>
            <p className="text-default-500 mb-4">
              Please log in to access the buildings management page.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ✅ FIXED: Main error display with better error handling
  if (buildingsIsError && buildings.length === 0 && !buildingsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Error Loading Buildings
            </h3>
            <p className="text-default-500 mb-4">{buildingsError}</p>
            <Button
              color="primary"
              onPress={refreshBuildings}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={buildingsLoading}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ✅ Building Form Modal
  const BuildingFormModal = () => (
    <Modal
      isOpen={isCreateOpen || isEditOpen}
      onClose={isEditOpen ? onEditClose : onCreateClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {isEditOpen ? "Edit Building" : "Create Building"}
          </h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {mutationError && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-danger-800 text-sm">{mutationError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Building Name"
                placeholder="Enter building name"
                value={buildingForm.name}
                onValueChange={(value) =>
                  setBuildingForm((prev) => ({ ...prev, name: value }))
                }
                isRequired
                variant="bordered"
              />
              <Input
                label="Building Code"
                placeholder="Enter building code"
                value={buildingForm.code}
                onValueChange={(value) =>
                  setBuildingForm((prev) => ({ ...prev, code: value }))
                }
                isRequired
                variant="bordered"
              />
              <Input
                label="Area (m²)"
                type="number"
                placeholder="Enter area in square meters"
                value={buildingForm.areaSqm?.toString() || ""}
                onValueChange={(value) =>
                  setBuildingForm((prev) => ({
                    ...prev,
                    areaSqm: Number(value) || 0,
                  }))
                }
                variant="bordered"
              />
              <Input
                label="Floors"
                type="number"
                placeholder="Number of floors"
                value={buildingForm.floors?.toString() || ""}
                onValueChange={(value) =>
                  setBuildingForm((prev) => ({
                    ...prev,
                    floors: Number(value) || 1,
                  }))
                }
                variant="bordered"
              />
              <Input
                label="Year Built"
                type="number"
                placeholder="Year building was constructed"
                value={buildingForm.yearBuilt?.toString() || ""}
                onValueChange={(value) =>
                  setBuildingForm((prev) => ({
                    ...prev,
                    yearBuilt: Number(value) || new Date().getFullYear(),
                  }))
                }
                variant="bordered"
              />
              <Select
                label="Building Type"
                selectedKeys={[buildingForm.buildingType]}
                onSelectionChange={(keys) =>
                  setBuildingForm((prev) => ({
                    ...prev,
                    buildingType: Array.from(keys)[0] as any,
                  }))
                }
                variant="bordered"
              >
                <SelectItem key="commercial">Commercial</SelectItem>
                <SelectItem key="industrial">Industrial</SelectItem>
                <SelectItem key="residential">Residential</SelectItem>
                <SelectItem key="institutional">Institutional</SelectItem>
              </Select>
              <Select
                label="Status"
                selectedKeys={[buildingForm.status]}
                onSelectionChange={(keys) =>
                  setBuildingForm((prev) => ({
                    ...prev,
                    status: Array.from(keys)[0] as any,
                  }))
                }
                variant="bordered"
              >
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="maintenance">Maintenance</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
              </Select>
              <Input
                label="Address"
                placeholder="Enter building address"
                value={buildingForm.address}
                onValueChange={(value) =>
                  setBuildingForm((prev) => ({ ...prev, address: value }))
                }
                className="md:col-span-1"
                variant="bordered"
              />
            </div>
            <Input
              label="Description"
              placeholder="Enter building description"
              value={buildingForm.description}
              onValueChange={(value) =>
                setBuildingForm((prev) => ({ ...prev, description: value }))
              }
              variant="bordered"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={isEditOpen ? onEditClose : onCreateClose}
            isDisabled={mutationLoading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={() => handleSubmit(isEditOpen)}
            isLoading={mutationLoading}
            isDisabled={!buildingForm.name.trim() || !buildingForm.code.trim()}
          >
            {isEditOpen ? "Update" : "Create"} Building
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  // ✅ Delete confirmation modal
  const DeleteConfirmationModal = () => (
    <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="lg">
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

            {mutationError && (
              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="font-medium text-warning-800 mb-2">
                  Deletion Error
                </p>
                <p className="text-sm text-warning-700">{mutationError}</p>
              </div>
            )}

            {selectedBuilding && (
              <div className="p-4 bg-default-100 rounded-lg">
                <h4 className="font-medium mb-3">Building Information:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-default-500">Name:</span>
                    <span className="ml-2 font-medium">
                      {selectedBuilding.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Code:</span>
                    <span className="ml-2 font-medium">
                      {selectedBuilding.code}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={onDeleteClose}
            isDisabled={mutationLoading}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={handleDelete}
            isLoading={mutationLoading}
            startContent={<Trash2 className="w-4 h-4" />}
          >
            Delete Building
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  // ✅ LIST VIEW
  if (viewMode === "list") {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* ✅ Success Message */}
        {successMessage && (
          <Card className="bg-success-50 border-success-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success-600" />
                <p className="text-success-800 font-medium">{successMessage}</p>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setSuccessMessage(null)}
                  className="ml-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ✅ Header */}
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
              onPress={handleCreateOpen}
              startContent={<Plus className="w-4 h-4" />}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Add Building
            </Button>
            <Button
              variant="bordered"
              onPress={refreshBuildings}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={buildingsLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* ✅ Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Buildings</p>
                  <p className="text-xl font-semibold">{summaryStats.total}</p>
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
                  <p className="text-xl font-semibold">{summaryStats.active}</p>
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
                    {summaryStats.maintenance}
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
                    {summaryStats.totalArea.toLocaleString()} m²
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ✅ Filters */}
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
                variant="bordered"
              />

              <Select
                placeholder="Status"
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) =>
                  setStatusFilter((Array.from(keys)[0] as string) || "all")
                }
                variant="bordered"
              >
                <SelectItem key="all">All Statuses</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="maintenance">Maintenance</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
              </Select>

              <Select
                placeholder="Building Type"
                selectedKeys={typeFilter ? [typeFilter] : []}
                onSelectionChange={(keys) =>
                  setTypeFilter((Array.from(keys)[0] as string) || "all")
                }
                variant="bordered"
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
                variant="bordered"
              >
                <SelectItem key="name">Name</SelectItem>
                <SelectItem key="code">Code</SelectItem>
                <SelectItem key="areaSqm">Area</SelectItem>
                <SelectItem key="createdAt">Created Date</SelectItem>
              </Select>

              <Select
                placeholder="Order"
                selectedKeys={[sortOrder]}
                onSelectionChange={(keys) =>
                  setSortOrder(Array.from(keys)[0] as "ASC" | "DESC")
                }
                variant="bordered"
              >
                <SelectItem key="ASC">Ascending</SelectItem>
                <SelectItem key="DESC">Descending</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* ✅ Loading State */}
        {buildingsLoading && buildings.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Spinner size="lg" color="primary" />
              <p className="text-default-500">Loading buildings...</p>
            </div>
          </div>
        )}

        {/* ✅ FIXED: Buildings Grid with proper array handling */}
        {Array.isArray(buildings) && buildings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <Card
                key={building.id}
                className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-background to-content1 border border-divider hover:border-primary/30"
                isPressable
                onPress={() => handleBuildingSelect(building)}
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
                      {building.buildingType &&
                        renderTypeChip(building.buildingType)}
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

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {building.areaSqm
                            ? `${building.areaSqm.toLocaleString()} m²`
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
                          {building.equipmentCount || 0} equipment
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {building.yearBuilt || "N/A"}
                        </span>
                      </div>
                    </div>

                    <Divider />

                    {/* ✅ Server-computed metrics */}
                    <div className="space-y-3">
                      {building.avgComplianceScore !== null &&
                        building.avgComplianceScore !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-default-600 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Compliance
                            </span>
                            {renderEfficiencyRating(
                              building.avgComplianceScore
                            )}
                          </div>
                        )}

                      {building.avgPowerFactor !== null &&
                        building.avgPowerFactor !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-default-600 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Power Factor
                            </span>
                            <span className="text-sm font-medium">
                              {safeFormat.number(building.avgPowerFactor, 2)}
                            </span>
                          </div>
                        )}

                      {building.totalConsumptionKwh !== null &&
                        building.totalConsumptionKwh !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-default-600 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Monthly kWh
                            </span>
                            <span className="text-sm font-medium">
                              {safeFormat
                                .getValue(building.totalConsumptionKwh, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </CardBody>

                {/* ✅ FIXED: Button container with proper event handling */}
                <div
                  className="px-6 pb-6"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
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
                        setSelectedBuildingId(building.id);
                        handleEditOpen();
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ✅ FIXED: Empty State with proper array check */}
        {(!Array.isArray(buildings) || buildings.length === 0) &&
          !buildingsLoading && (
            <Card>
              <CardBody className="text-center p-12">
                <Building className="w-16 h-16 text-default-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "No Buildings Found"
                    : "No Buildings Yet"}
                </h3>
                <p className="text-default-500 mb-6">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters to see more results"
                    : "Get started by adding your first building"}
                </p>
                <div className="flex gap-3 justify-center">
                  {searchQuery ||
                  statusFilter !== "all" ||
                  typeFilter !== "all" ? (
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
                  ) : (
                    <Button
                      color="primary"
                      onPress={handleCreateOpen}
                      startContent={<Plus className="w-4 h-4" />}
                    >
                      Add First Building
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

        {/* ✅ Pagination */}
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

        {/* ✅ Modals */}
        <BuildingFormModal />
        <DeleteConfirmationModal />
      </div>
    );
  }

  // ✅ DETAILS VIEW
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ✅ Success Message */}
      {successMessage && (
        <Card className="bg-success-50 border-success-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <p className="text-success-800 font-medium">{successMessage}</p>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSuccessMessage(null)}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ✅ Header */}
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
              {selectedBuilding?.buildingType?.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="bordered"
            onPress={() => {
              refreshBuilding();
              refreshBuildings();
            }}
            startContent={<RefreshCw className="w-4 h-4" />}
            isLoading={buildingLoading}
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
            <DropdownMenu>
              <DropdownItem
                key="edit"
                startContent={<Edit className="w-4 h-4" />}
                onPress={handleEditOpen}
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

      {/* ✅ FIXED: Summary Cards with proper array handling and error states */}
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
                  {equipmentIsError
                    ? "Error"
                    : Array.isArray(buildingEquipment)
                      ? buildingEquipment.length
                      : 0}
                </p>
                {equipmentLoading && <Spinner size="sm" />}
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
                <p className="text-xl font-semibold">
                  {auditsIsError
                    ? "Error"
                    : Array.isArray(buildingAudits)
                      ? buildingAudits.length
                      : 0}
                </p>
                {auditsLoading && <Spinner size="sm" />}
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
                  {alertsIsError
                    ? "Error"
                    : Array.isArray(buildingAlerts)
                      ? buildingAlerts.filter((a) => a.status === "active")
                          .length
                      : 0}
                </p>
                {alertsLoading && <Spinner size="sm" />}
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
                  {energyStatsIsError
                    ? "Error"
                    : safeFormat.number(energyStats?.powerFactorAvg, 2)}
                </p>
                {energyStatsLoading && <Spinner size="sm" />}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ✅ Tabs */}
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
            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : (
              <>
                {/* ✅ Building Information */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Building Information
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Building Name
                        </p>
                        <p className="font-medium">
                          {selectedBuilding?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Building Code
                        </p>
                        <p className="font-medium">
                          {selectedBuilding?.code || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">Status</p>
                        {selectedBuilding?.status ? (
                          renderStatusChip(selectedBuilding.status)
                        ) : (
                          <span className="text-default-400">N/A</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">Area</p>
                        <p className="font-medium">
                          {selectedBuilding?.areaSqm
                            ? `${selectedBuilding.areaSqm.toLocaleString()} m²`
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
                        <p className="text-sm text-default-500 mb-1">
                          Year Built
                        </p>
                        <p className="font-medium">
                          {selectedBuilding?.yearBuilt || "N/A"}
                        </p>
                      </div>
                    </div>

                    {selectedBuilding?.description && (
                      <div className="mt-6">
                        <p className="text-sm text-default-500 mb-2">
                          Description
                        </p>
                        <p className="text-default-700">
                          {selectedBuilding.description}
                        </p>
                      </div>
                    )}

                    {selectedBuilding?.address && (
                      <div className="mt-4">
                        <p className="text-sm text-default-500 mb-2">Address</p>
                        <p className="text-default-700">
                          {selectedBuilding.address}
                        </p>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* ✅ Performance Summary - Only show if data is available */}
                {energyStats && !energyStatsIsError && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">
                        Performance Summary
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-default-500 mb-1">
                            Total Consumption
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {safeFormat.integer(energyStats.totalConsumption)}{" "}
                            kWh
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500 mb-1">
                            Average Consumption
                          </p>
                          <p className="text-2xl font-bold text-secondary">
                            {safeFormat.number(
                              energyStats.averageConsumption,
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
                            {safeFormat.number(energyStats.peakDemand, 1)} kW
                          </p>
                        </div>
                        {energyStats.efficiencyScore !== null &&
                          energyStats.efficiencyScore !== undefined && (
                            <div>
                              <p className="text-sm text-default-500 mb-1">
                                Efficiency Score
                              </p>
                              <div className="flex items-center gap-3">
                                <Progress
                                  value={safeFormat.getValue(
                                    energyStats.efficiencyScore,
                                    0
                                  )}
                                  color={
                                    safeFormat.getValue(
                                      energyStats.efficiencyScore,
                                      0
                                    ) >= 80
                                      ? "success"
                                      : safeFormat.getValue(
                                            energyStats.efficiencyScore,
                                            0
                                          ) >= 60
                                        ? "warning"
                                        : "danger"
                                  }
                                  className="flex-1"
                                />
                                <span className="font-bold">
                                  {safeFormat.percentage(
                                    energyStats.efficiencyScore,
                                    0
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        <div>
                          <p className="text-sm text-default-500 mb-1">
                            Power Factor
                          </p>
                          <p className="text-2xl font-bold text-success">
                            {safeFormat.number(energyStats.powerFactorAvg, 3)}
                          </p>
                        </div>
                        {energyStats.consumptionPerSqm !== null &&
                          energyStats.consumptionPerSqm !== undefined && (
                            <div>
                              <p className="text-sm text-default-500 mb-1">
                                Consumption per m²
                              </p>
                              <p className="text-2xl font-bold text-default-700">
                                {safeFormat.number(
                                  energyStats.consumptionPerSqm,
                                  2
                                )}{" "}
                                kWh/m²
                              </p>
                            </div>
                          )}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* ✅ Error states for missing data */}
                {energyStatsIsError && (
                  <Card>
                    <CardBody className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Energy Data Unavailable
                      </h3>
                      <p className="text-default-500 mb-4">
                        {energyStatsError || "Failed to load energy statistics"}
                      </p>
                      <Button
                        variant="bordered"
                        onPress={refreshBuilding}
                        startContent={<RefreshCw className="w-4 h-4" />}
                        isLoading={energyStatsLoading}
                      >
                        Retry
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </>
            )}
          </div>
        </Tab>

        <Tab
          key="equipment"
          title={
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4" />
              <span>Equipment</span>
              {Array.isArray(buildingEquipment) &&
                buildingEquipment.length > 0 && (
                  <Chip size="sm" color="primary" variant="flat">
                    {buildingEquipment.length}
                  </Chip>
                )}
            </div>
          }
        >
          <div className="mt-6">
            {equipmentLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : equipmentIsError ? (
              <Card>
                <CardBody className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Error Loading Equipment
                  </h3>
                  <p className="text-default-500 mb-4">
                    {equipmentError || "Failed to load equipment data"}
                  </p>
                  <Button
                    variant="bordered"
                    onPress={refreshBuilding}
                    startContent={<RefreshCw className="w-4 h-4" />}
                  >
                    Retry
                  </Button>
                </CardBody>
              </Card>
            ) : Array.isArray(buildingEquipment) &&
              buildingEquipment.length > 0 ? (
              <Card>
                <CardBody>
                  <Table aria-label="Equipment table">
                    <TableHeader>
                      <TableColumn>EQUIPMENT</TableColumn>
                      <TableColumn>TYPE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>LOCATION</TableColumn>
                      <TableColumn>CONDITION</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {buildingEquipment.map((equipment: Equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {equipment.name || "Unnamed Equipment"}
                              </p>
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
                              {equipment.equipmentType?.replace("_", " ") ||
                                "Unknown"}
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
                                    : equipment.status === "faulty"
                                      ? "danger"
                                      : "default"
                              }
                              variant="flat"
                              className="capitalize"
                            >
                              {equipment.status || "Unknown"}
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
                              {!equipment.location && !equipment.floor && (
                                <span className="text-default-400">N/A</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {equipment.conditionScore ? (
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={equipment.conditionScore}
                                  color={
                                    equipment.conditionScore >= 80
                                      ? "success"
                                      : equipment.conditionScore >= 60
                                        ? "warning"
                                        : "danger"
                                  }
                                  size="sm"
                                  className="w-16"
                                />
                                <span className="text-sm">
                                  {equipment.conditionScore}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-default-400">N/A</span>
                            )}
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
      </Tabs>

      {/* ✅ Modals */}
      <BuildingFormModal />
      <DeleteConfirmationModal />
    </div>
  );
};

export default BuildingsPage;
