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

// Form interface for room creation/editing
interface RoomFormData {
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

const RoomsPage: React.FC = () => {
  // ✅ Authentication check
  const { isAuthenticated, user } = useAuth();

  // ✅ View and selection state
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  // ✅ Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Form state
  const [roomForm, setRoomForm] = useState<RoomFormData>({
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

  // ✅ Build query parameters for rooms list
  const roomsParams = useMemo(
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

  // ✅ FIXED: API Hooks - Rooms list with proper error handling
  const {
    data: rooms = [], // ✅ Default to empty array
    pagination,
    loading: roomsLoading,
    error: roomsError,
    refresh: refreshRooms,
    isError: roomsIsError,
  } = useBuildings(roomsParams, {
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

  // ✅ Individual room details (only when selected)
  const {
    data: selectedRoom,
    loading: roomLoading,
    error: roomError,
    refresh: refreshRoom,
    isError: roomIsError,
  } = useBuilding(selectedRoomId!, {
    immediate: !!selectedRoomId,
  });

  // ✅ FIXED: Room equipment with proper error handling
  const {
    data: roomEquipment = [], // ✅ Default to empty array
    loading: equipmentLoading,
    error: equipmentError,
    isError: equipmentIsError,
  } = useEquipment(
    { buildingId: selectedRoomId! },
    {
      immediate: !!selectedRoomId,
    }
  );

  // ✅ Energy statistics (only when room is selected)
  const {
    data: energyStats,
    loading: energyStatsLoading,
    error: energyStatsError,
    isError: energyStatsIsError,
  } = useEnergyStats(selectedRoomId!, undefined, {
    immediate: !!selectedRoomId,
  });

  // ✅ Power quality statistics (only when room is selected)
  const {
    data: powerQualityStats,
    loading: powerQualityLoading,
    error: powerQualityStatsError,
    isError: powerQualityStatsIsError,
  } = usePowerQualityStats(selectedRoomId!, undefined, {
    immediate: !!selectedRoomId,
  });

  // ✅ FIXED: Room audits with proper error handling
  const {
    data: roomAudits = [], // ✅ Default to empty array
    loading: auditsLoading,
    error: auditsError,
    isError: auditsIsError,
  } = useAudits(
    { buildingId: selectedRoomId! },
    {
      immediate: !!selectedRoomId,
    }
  );

  // ✅ FIXED: Room alerts with proper error handling
  const {
    data: roomAlerts = [], // ✅ Default to empty array
    loading: alertsLoading,
    error: alertsError,
    isError: alertsIsError,
  } = useAlerts(
    { buildingId: selectedRoomId!, limit: 50 },
    {
      immediate: !!selectedRoomId,
    }
  );

  // ✅ Maintenance schedule (only when room is selected)
  const {
    data: maintenanceSchedule,
    loading: maintenanceLoading,
    error: maintenanceError,
    isError: maintenanceIsError,
  } = useMaintenanceSchedule(selectedRoomId!, {
    immediate: !!selectedRoomId,
  });

  // ✅ Room mutations
  const {
    createBuilding: createRoom,
    updateBuilding: updateRoom,
    deleteBuilding: deleteRoom,
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
    if (selectedRoom) {
      prepareEditForm();
      onEditOpen();
    }
  }, [selectedRoom, onEditOpen]);

  const handleRoomSelect = useCallback((room: BuildingType) => {
    setSelectedRoomId(room.id);
    setViewMode("details");
    setSelectedTab("overview");
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedRoomId(null);
    setSelectedTab("overview");
  }, []);

  const handleSubmit = useCallback(
    async (isEdit: boolean = false) => {
      try {
        // ✅ Validate required fields
        if (!roomForm.name.trim() || !roomForm.code.trim()) {
          return;
        }

        // ✅ Transform form data to server format
        const submitData = {
          name: roomForm.name.trim(),
          code: roomForm.code.trim(),
          description: roomForm.description?.trim() || "",
          address: roomForm.address?.trim() || "",
          areaSqm: Number(roomForm.areaSqm) || 0,
          floors: Number(roomForm.floors) || 1,
          yearBuilt: Number(roomForm.yearBuilt) || new Date().getFullYear(),
          buildingType: roomForm.buildingType,
          status: roomForm.status,
        };

        if (isEdit && selectedRoom) {
          await updateRoom(selectedRoom.id, submitData);
          setSuccessMessage("Room updated successfully!");
          onEditClose();
          await Promise.all([refreshRooms(), refreshRoom()]);
        } else {
          await createRoom(submitData);
          setSuccessMessage("Room created successfully!");
          onCreateClose();
          resetForm();
          await refreshRooms();
        }
      } catch (error) {
        console.error("Form submission failed:", error);
        // Error is already handled by the mutation hook
      }
    },
    [
      roomForm,
      selectedRoom,
      updateRoom,
      createRoom,
      onEditClose,
      onCreateClose,
      refreshRooms,
      refreshRoom,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedRoom) return;

    try {
      await deleteRoom(selectedRoom.id);
      setSuccessMessage(
        `Room "${selectedRoom.name}" has been deleted successfully.`
      );
      onDeleteClose();
      handleBackToList();
      await refreshRooms();
    } catch (error) {
      console.error("Delete failed:", error);
      // Error is already handled by the mutation hook
    }
  }, [selectedRoom, deleteRoom, onDeleteClose, handleBackToList, refreshRooms]);

  const resetForm = useCallback(() => {
    setRoomForm({
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
    if (selectedRoom) {
      setRoomForm({
        name: selectedRoom.name || "",
        code: selectedRoom.code || "",
        areaSqm: selectedRoom.areaSqm || 0,
        floors: selectedRoom.floors || 1,
        yearBuilt: selectedRoom.yearBuilt || new Date().getFullYear(),
        buildingType: selectedRoom.buildingType || "commercial",
        description: selectedRoom.description || "",
        status: selectedRoom.status || "active",
        address: selectedRoom.address || "",
      });
    }
  }, [selectedRoom]);

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
    // ✅ Ensure rooms is always an array
    const roomsArray = Array.isArray(rooms) ? rooms : [];

    return {
      total: totalCount || roomsArray.length,
      active: roomsArray.filter((r) => r.status === "active").length,
      maintenance: roomsArray.filter((r) => r.status === "maintenance").length,
      totalArea: roomsArray.reduce((sum, r) => sum + (r.areaSqm || 0), 0),
    };
  }, [rooms, totalCount]);

  // ✅ FIXED: Details loading state properly checks all data types
  const detailsLoading =
    roomLoading ||
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
              Please log in to access the rooms management page.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ✅ FIXED: Main error display with better error handling
  if (roomsIsError && rooms.length === 0 && !roomsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Error Loading Rooms
            </h3>
            <p className="text-default-500 mb-4">{roomsError}</p>
            <Button
              color="primary"
              onPress={refreshRooms}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={roomsLoading}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ✅ Room Form Modal
  const RoomFormModal = () => (
    <Modal
      isOpen={isCreateOpen || isEditOpen}
      onClose={isEditOpen ? onEditClose : onCreateClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {isEditOpen ? "Edit Room" : "Create Room"}
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
                label="Room Name"
                placeholder="Enter room name"
                value={roomForm.name}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({ ...prev, name: value }))
                }
                isRequired
                variant="bordered"
              />
              <Input
                label="Room Code"
                placeholder="Enter room code"
                value={roomForm.code}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({ ...prev, code: value }))
                }
                isRequired
                variant="bordered"
              />
              <Input
                label="Area (m²)"
                type="number"
                placeholder="Enter area in square meters"
                value={roomForm.areaSqm?.toString() || ""}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    areaSqm: Number(value) || 0,
                  }))
                }
                variant="bordered"
              />
              <Input
                label="Floor"
                type="number"
                placeholder="Floor"
                value={roomForm.floors?.toString() || ""}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    floors: Number(value) || 1,
                  }))
                }
                variant="bordered"
              />
              <Input
                label="Year Built"
                type="number"
                placeholder="Year room was constructed"
                value={roomForm.yearBuilt?.toString() || ""}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    yearBuilt: Number(value) || new Date().getFullYear(),
                  }))
                }
                variant="bordered"
              />
              <Select
                label="Room Type"
                selectedKeys={[roomForm.buildingType]}
                onSelectionChange={(keys) =>
                  setRoomForm((prev) => ({
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
                selectedKeys={[roomForm.status]}
                onSelectionChange={(keys) =>
                  setRoomForm((prev) => ({
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
                placeholder="Enter room address"
                value={roomForm.address}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({ ...prev, address: value }))
                }
                className="md:col-span-1"
                variant="bordered"
              />
            </div>
            <Input
              label="Description"
              placeholder="Enter room description"
              value={roomForm.description}
              onValueChange={(value) =>
                setRoomForm((prev) => ({ ...prev, description: value }))
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
            isDisabled={!roomForm.name.trim() || !roomForm.code.trim()}
          >
            {isEditOpen ? "Update" : "Create"} Room
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
          <h2 className="text-xl font-semibold text-danger">Delete Room</h2>
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
                  All room data, equipment, and historical records will be
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

            {selectedRoom && (
              <div className="p-4 bg-default-100 rounded-lg">
                <h4 className="font-medium mb-3">Room Information:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-default-500">Name:</span>
                    <span className="ml-2 font-medium">
                      {selectedRoom.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Code:</span>
                    <span className="ml-2 font-medium">
                      {selectedRoom.code}
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
            Delete Room
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
              Rooms Management
            </h1>
            <p className="text-default-500 mt-1">
              Monitor and manage room infrastructure, energy consumption, and
              compliance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              color="primary"
              onPress={handleCreateOpen}
              startContent={<Plus className="w-4 h-4" />}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Add Room
            </Button>
            <Button
              variant="bordered"
              onPress={refreshRooms}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={roomsLoading}
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
                  <p className="text-sm text-default-500">Total Rooms</p>
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
                  <p className="text-sm text-default-500">Active Rooms</p>
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
                placeholder="Search rooms..."
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
                placeholder="Room Type"
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
        {roomsLoading && rooms.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Spinner size="lg" color="primary" />
              <p className="text-default-500">Loading rooms...</p>
            </div>
          </div>
        )}

        {/* ✅ FIXED: Rooms Grid with proper array handling */}
        {Array.isArray(rooms) && rooms.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-background to-content1 border border-divider hover:border-primary/30"
                isPressable
                onPress={() => handleRoomSelect(room)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                        {room.name || "Unnamed Room"}
                      </h3>
                      <p className="text-sm text-default-500 mt-1">
                        {room.code || `ID: ${room.id}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {room.status && renderStatusChip(room.status)}
                      {room.buildingType && renderTypeChip(room.buildingType)}
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="pt-0">
                  <div className="space-y-4">
                    {room.description && (
                      <p className="text-sm text-default-600 line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {room.areaSqm
                            ? `${room.areaSqm.toLocaleString()} m²`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {room.floors ? `${room.floors} floors` : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {room.equipmentCount || 0} equipment
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                          {room.yearBuilt || "N/A"}
                        </span>
                      </div>
                    </div>

                    <Divider />

                    {/* ✅ Server-computed metrics */}
                    <div className="space-y-3">
                      {room.avgComplianceScore !== null &&
                        room.avgComplianceScore !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-default-600 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Compliance
                            </span>
                            {renderEfficiencyRating(room.avgComplianceScore)}
                          </div>
                        )}

                      {room.avgPowerFactor !== null &&
                        room.avgPowerFactor !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-default-600 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Power Factor
                            </span>
                            <span className="text-sm font-medium">
                              {safeFormat.number(room.avgPowerFactor, 2)}
                            </span>
                          </div>
                        )}

                      {room.totalConsumptionKwh !== null &&
                        room.totalConsumptionKwh !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-default-600 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Monthly kWh
                            </span>
                            <span className="text-sm font-medium">
                              {safeFormat
                                .getValue(room.totalConsumptionKwh, 0)
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
                      onPress={() => handleRoomSelect(room)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      isIconOnly
                      onPress={() => {
                        setSelectedRoomId(room.id);
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
        {(!Array.isArray(rooms) || rooms.length === 0) && !roomsLoading && (
          <Card>
            <CardBody className="text-center p-12">
              <Building className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "No Rooms Found"
                  : "No Rooms Yet"}
              </h3>
              <p className="text-default-500 mb-6">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "Get started by adding your first room"}
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
                    Add First Room
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
        <RoomFormModal />
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
            Back to Rooms
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedRoom?.name || "Room Details"}
            </h1>
            <p className="text-default-500">
              {selectedRoom?.code} •{" "}
              {selectedRoom?.buildingType?.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="bordered"
            onPress={() => {
              refreshRoom();
              refreshRooms();
            }}
            startContent={<RefreshCw className="w-4 h-4" />}
            isLoading={roomLoading}
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
                Edit Room
              </DropdownItem>
              <DropdownItem
                key="delete"
                startContent={<Trash2 className="w-4 h-4" />}
                className="text-danger"
                color="danger"
                onPress={onDeleteOpen}
              >
                Delete Room
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
                    : Array.isArray(roomEquipment)
                      ? roomEquipment.length
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
                    : Array.isArray(roomAudits)
                      ? roomAudits.length
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
                    : Array.isArray(roomAlerts)
                      ? roomAlerts.filter((a) => a.status === "active").length
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
                {/* ✅ Room Information */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Room Information</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Room Name
                        </p>
                        <p className="font-medium">
                          {selectedRoom?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Room Code
                        </p>
                        <p className="font-medium">
                          {selectedRoom?.code || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">Status</p>
                        {selectedRoom?.status ? (
                          renderStatusChip(selectedRoom.status)
                        ) : (
                          <span className="text-default-400">N/A</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">Area</p>
                        <p className="font-medium">
                          {selectedRoom?.areaSqm
                            ? `${selectedRoom.areaSqm.toLocaleString()} m²`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">Floors</p>
                        <p className="font-medium">
                          {selectedRoom?.floors || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Year Built
                        </p>
                        <p className="font-medium">
                          {selectedRoom?.yearBuilt || "N/A"}
                        </p>
                      </div>
                    </div>

                    {selectedRoom?.description && (
                      <div className="mt-6">
                        <p className="text-sm text-default-500 mb-2">
                          Description
                        </p>
                        <p className="text-default-700">
                          {selectedRoom.description}
                        </p>
                      </div>
                    )}

                    {selectedRoom?.address && (
                      <div className="mt-4">
                        <p className="text-sm text-default-500 mb-2">Address</p>
                        <p className="text-default-700">
                          {selectedRoom.address}
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
                        onPress={refreshRoom}
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
              {Array.isArray(roomEquipment) && roomEquipment.length > 0 && (
                <Chip size="sm" color="primary" variant="flat">
                  {roomEquipment.length}
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
                    onPress={refreshRoom}
                    startContent={<RefreshCw className="w-4 h-4" />}
                  >
                    Retry
                  </Button>
                </CardBody>
              </Card>
            ) : Array.isArray(roomEquipment) && roomEquipment.length > 0 ? (
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
                      {roomEquipment.map((equipment: Equipment) => (
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
                    This room doesn't have any equipment registered yet.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* ✅ Modals */}
      <RoomFormModal />
      <DeleteConfirmationModal />
    </div>
  );
};

export default RoomsPage;
