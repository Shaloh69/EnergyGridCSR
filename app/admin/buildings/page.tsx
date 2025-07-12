"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

// HeroUI Components
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
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
  Calendar,
  MapPin,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Info,
  Shield,
  Power,
  Construction,
  Home,
  Factory,
  GraduationCap,
  X,
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
  PowerQualityEvent,
  Alert,
  Audit,
  EnergyStatsResponse,
  PowerQualityStatsResponse,
  MaintenanceSchedule,
  BuildingQueryParams,
  ApiResponse,
} from "@/types/api-types";

import BuildingFormModal, {
  BuildingFormData,
} from "@/components/buildings/BuildingFormModal";

interface ExtendedBuilding extends BuildingType {
  equipment_count?: number;
  audit_count?: number;
  avg_compliance_score?: number;
  last_energy_reading?: string;
  total_consumption_kwh?: number;
  avg_power_factor?: number;
  equipment_summary?: {
    total_equipment: number;
    operational: number;
    maintenance: number;
    faulty: number;
  };
  compliance_status?: {
    overall_score: number;
    last_assessment: string;
  };
  performance_summary?: {
    energy_intensity_kwh_sqm: number;
    monthly_consumption_kwh: number;
    efficiency_score: number;
  };
}

const isApiResponse = <T,>(response: any): response is ApiResponse<T> => {
  return (
    response &&
    typeof response === "object" &&
    typeof response.success === "boolean" &&
    typeof response.message === "string" &&
    "data" in response
  );
};

const isArrayOfBuildings = (data: any): data is ExtendedBuilding[] => {
  return Array.isArray(data) && (data.length === 0 || "id" in data[0]);
};

const hasNestedData = (
  data: any
): data is { data: ExtendedBuilding[]; pagination?: any } => {
  return (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray(data.data)
  );
};

const BuildingsPage: React.FC = () => {
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

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [viewMode, setViewMode] = useState<"list" | "details">("list");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

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

  const handleCreateOpen = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    resetForm();
    onCreateOpen();
  }, [onCreateOpen]);

  const handleEditOpen = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    prepareEditForm();
    onEditOpen();
  }, [onEditOpen]);

  const handleDeleteOpen = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const handleCreateClose = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    onCreateClose();
  }, [onCreateClose]);

  const handleEditClose = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    onEditClose();
  }, [onEditClose]);

  const handleDeleteClose = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    onDeleteClose();
  }, [onDeleteClose]);

  const checkBuildingData = useCallback(async (buildingId: number) => {
    try {
      console.log(
        `🔍 Performing comprehensive data check for building ${buildingId}`
      );

      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const checks = await Promise.allSettled([
        equipmentAPI.getAll({ building_id: buildingId }),
        energyAPI.getConsumption({
          building_id: buildingId,
          start_date: startDate,
          end_date: endDate,
          interval: "daily",
        }),
        powerQualityAPI.getData({
          building_id: buildingId,
          start_date: startDate,
          end_date: endDate,
        }),
        auditsAPI.getAll({ building_id: buildingId }),
        alertsAPI.getAll({ building_id: buildingId }),
        equipmentAPI.getMaintenanceSchedule(buildingId),
      ]);

      const results = {
        equipment: 0,
        energy_readings: 0,
        power_quality_events: 0,
        audits: 0,
        alerts: 0,
        maintenance_records: 0,
      };

      checks.forEach((check, index) => {
        if (check.status === "fulfilled" && check.value.data?.success) {
          const data = check.value.data.data;
          switch (index) {
            case 0:
              results.equipment = Array.isArray(data) ? data.length : 0;
              break;
            case 1:
              results.energy_readings =
                data?.daily_data?.length ||
                data?.hourly_data?.length ||
                (Array.isArray(data) ? data.length : 0);
              break;
            case 2:
              results.power_quality_events = data?.events?.length || 0;
              break;
            case 3:
              results.audits = Array.isArray(data) ? data.length : 0;
              break;
            case 4:
              results.alerts = Array.isArray(data) ? data.length : 0;
              break;
            case 5:
              results.maintenance_records = data?.schedule?.length || 0;
              break;
          }
        }
      });

      console.log("📊 Comprehensive data check results:", results);
      return results;
    } catch (error) {
      console.error("❌ Error checking building data:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadBuildings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: BuildingQueryParams = {
        page: currentPage,
        limit: 20,
        sortBy: sortBy as any,
        sortOrder,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(statusFilter !== "all" && { status: statusFilter as any }),
        ...(typeFilter !== "all" && { building_type: typeFilter as any }),
      };

      console.log("🏢 Loading buildings with params:", params);
      const response = await buildingsAPI.getAll(params);

      if (response.data && response.data.success) {
        const responseData = response.data.data;
        let buildingsData: ExtendedBuilding[] = [];
        let paginationData = response.data.pagination;

        if (isArrayOfBuildings(responseData)) {
          buildingsData = responseData;
        } else if (hasNestedData(responseData)) {
          buildingsData = responseData.data;
          paginationData = responseData.pagination || response.data.pagination;
        } else if (responseData === null || responseData === undefined) {
          buildingsData = [];
        } else {
          throw new Error("Unexpected response format from server");
        }

        setBuildings(buildingsData);

        if (paginationData) {
          setTotalPages(paginationData.total_pages || 1);
          setTotalCount(paginationData.total_count || 0);
        } else {
          setTotalPages(1);
          setTotalCount(buildingsData.length);
        }
      } else {
        throw new Error(response.data?.message || "Failed to load buildings");
      }
    } catch (error: any) {
      console.error("❌ Failed to load buildings:", error);

      let errorMessage = "Failed to load buildings";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setBuildings([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const handler = setTimeout(() => {
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          loadBuildings();
        }
      }, 500);
      return () => clearTimeout(handler);
    } else {
      loadBuildings();
    }
  }, [loadBuildings, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadBuildings();
      }
    }
  }, [statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (currentPage > 1) {
      loadBuildings();
    }
  }, [currentPage]);

  const loadBuildingDetails = useCallback(
    async (building: ExtendedBuilding) => {
      try {
        setDetailsLoading(true);
        setError(null);
        setSelectedBuilding(building);

        try {
          const buildingResponse = await buildingsAPI.getById(building.id);
          if (buildingResponse.data?.success) {
            setSelectedBuilding(buildingResponse.data.data);
          }
        } catch (error) {
          console.warn("⚠️ Failed to load enhanced building details:", error);
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        const dataPromises = [
          equipmentAPI
            .getAll({ building_id: building.id })
            .catch((e) => ({ error: e })),
          energyAPI
            .getConsumption({
              building_id: building.id,
              start_date: startDateStr,
              end_date: endDateStr,
              interval: "daily",
            })
            .catch((e) => ({ error: e })),
          energyAPI.getStats(building.id).catch((e) => ({ error: e })),
          powerQualityAPI
            .getData({
              building_id: building.id,
              start_date: startDateStr,
              end_date: endDateStr,
            })
            .catch((e) => ({ error: e })),
          powerQualityAPI.getStats(building.id).catch((e) => ({ error: e })),
          auditsAPI
            .getAll({ building_id: building.id })
            .catch((e) => ({ error: e })),
          alertsAPI
            .getAll({ building_id: building.id, limit: 50 })
            .catch((e) => ({ error: e })),
          equipmentAPI
            .getMaintenanceSchedule(building.id)
            .catch((e) => ({ error: e })),
        ];

        const [
          equipmentResponse,
          energyResponse,
          energyStatsResponse,
          powerQualityResponse,
          powerQualityStatsResponse,
          auditsResponse,
          alertsResponse,
          maintenanceResponse,
        ] = await Promise.all(dataPromises);

        if ("error" in equipmentResponse) {
          setBuildingEquipment([]);
        } else if (equipmentResponse.data?.success) {
          const data = equipmentResponse.data.data;
          setBuildingEquipment(Array.isArray(data) ? data : []);
        } else {
          setBuildingEquipment([]);
        }

        if ("error" in energyResponse) {
          setBuildingEnergy([]);
        } else if (energyResponse.data?.success) {
          const data = energyResponse.data.data;
          setBuildingEnergy(data?.daily_data || data?.hourly_data || []);
        } else {
          setBuildingEnergy([]);
        }

        if ("error" in energyStatsResponse) {
          setBuildingEnergyStats(null);
        } else if (energyStatsResponse.data?.success) {
          setBuildingEnergyStats(energyStatsResponse.data.data);
        } else {
          setBuildingEnergyStats(null);
        }

        if ("error" in powerQualityResponse) {
          setBuildingPowerQuality([]);
        } else if (powerQualityResponse.data?.success) {
          const data = powerQualityResponse.data.data;
          setBuildingPowerQuality(data?.events || []);
        } else {
          setBuildingPowerQuality([]);
        }

        if ("error" in powerQualityStatsResponse) {
          setBuildingPowerQualityStats(null);
        } else if (powerQualityStatsResponse.data?.success) {
          setBuildingPowerQualityStats(powerQualityStatsResponse.data.data);
        } else {
          setBuildingPowerQualityStats(null);
        }

        if ("error" in auditsResponse) {
          setBuildingAudits([]);
        } else if (auditsResponse.data?.success) {
          const data = auditsResponse.data.data;
          setBuildingAudits(Array.isArray(data) ? data : []);
        } else {
          setBuildingAudits([]);
        }

        if ("error" in alertsResponse) {
          setBuildingAlerts([]);
        } else if (alertsResponse.data?.success) {
          const data = alertsResponse.data.data;
          setBuildingAlerts(Array.isArray(data) ? data : []);
        } else {
          setBuildingAlerts([]);
        }

        if ("error" in maintenanceResponse) {
          setMaintenanceSchedule(null);
        } else if (maintenanceResponse.data?.success) {
          setMaintenanceSchedule(maintenanceResponse.data.data);
        } else {
          setMaintenanceSchedule(null);
        }

        console.log("✅ Building details loaded successfully");
      } catch (error: any) {
        console.error("❌ Failed to load building details:", error);
        setError("Failed to load building details. Please try again.");
      } finally {
        setDetailsLoading(false);
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (isEdit: boolean = false) => {
      try {
        setSubmitLoading(true);
        setError(null);

        if (!buildingForm.name?.trim()) {
          throw new Error("Building name is required");
        }
        if (!buildingForm.code?.trim()) {
          throw new Error("Building code is required");
        }

        const submitData = {
          ...buildingForm,
          name: buildingForm.name.trim(),
          code: buildingForm.code.trim(),
          description: buildingForm.description?.trim() || "",
          address: buildingForm.address?.trim() || "",
          area_sqm: Number(buildingForm.area_sqm) || 0,
          floors: Number(buildingForm.floors) || 1,
          year_built:
            Number(buildingForm.year_built) || new Date().getFullYear(),
        };

        let response;
        if (isEdit && selectedBuilding) {
          response = await buildingsAPI.update(selectedBuilding.id, submitData);
          if (response.data.success) {
            setSelectedBuilding(response.data.data);
            setSuccessMessage("Building updated successfully!");
            handleEditClose();
          }
        } else {
          response = await buildingsAPI.create(submitData);
          if (response.data.success) {
            setSuccessMessage("Building created successfully!");
            handleCreateClose();
            resetForm();
          }
        }

        await loadBuildings();
      } catch (error: any) {
        console.error("❌ Form submission failed:", error);

        let errorMessage = "Operation failed";
        if (error.response?.data?.validation_errors) {
          const validationErrors = error.response.data.validation_errors;
          errorMessage = validationErrors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(", ");
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      buildingForm,
      selectedBuilding,
      handleEditClose,
      handleCreateClose,
      loadBuildings,
    ]
  );
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
    setError(null);
  }, []);
  const handleDelete = useCallback(async () => {
    if (!selectedBuilding) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const dataCheck = await checkBuildingData(selectedBuilding.id);

      if (dataCheck) {
        const totalData = Object.values(dataCheck).reduce(
          (sum, count) => sum + count,
          0
        );
        console.log(
          `📊 Found ${totalData} total associated records:`,
          dataCheck
        );
      }

      await buildingsAPI.delete(selectedBuilding.id);

      setSuccessMessage(
        `Building "${selectedBuilding.name}" has been deleted successfully.`
      );
      handleDeleteClose();
      handleBackToList();
      await loadBuildings();
    } catch (error: any) {
      console.error("❌ Delete failed:", error);

      let errorMessage = "Delete operation failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (
        errorMessage.includes("associated") ||
        errorMessage.includes("constraint") ||
        errorMessage.includes("foreign key")
      ) {
        const enhancedError = `Cannot delete building with associated data.

The server has detected data relationships that prevent deletion:
• Energy consumption records
• Equipment assignments
• Audit histories
• Alert records
• Maintenance logs
• System references

Recommendation: Set the building status to "Inactive" to safely remove it from active use while preserving data integrity.`;

        setError(enhancedError);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitLoading(false);
    }
  }, [
    selectedBuilding,
    checkBuildingData,
    handleDeleteClose,
    handleBackToList,
    loadBuildings,
  ]);

  const handleSetInactive = useCallback(async () => {
    if (!selectedBuilding) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const response = await buildingsAPI.update(selectedBuilding.id, {
        status: "inactive",
      });

      if (response.data.success) {
        setSelectedBuilding(response.data.data);
        setSuccessMessage(
          `Building "${selectedBuilding.name}" has been set to inactive status.`
        );
        handleDeleteClose();
        await loadBuildings();

        if (viewMode === "details") {
          await loadBuildingDetails(response.data.data);
        }
      }
    } catch (error: any) {
      console.error("❌ Set inactive failed:", error);
      setError(
        error.response?.data?.message || "Failed to set building inactive"
      );
    } finally {
      setSubmitLoading(false);
    }
  }, [
    selectedBuilding,
    handleDeleteClose,
    loadBuildings,
    viewMode,
    loadBuildingDetails,
  ]);

  const resetForm = useCallback(() => {
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
  }, []);

  const prepareEditForm = useCallback(() => {
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
  }, [selectedBuilding]);

  const handleBuildingSelect = useCallback(
    (building: ExtendedBuilding) => {
      setViewMode("details");
      loadBuildingDetails(building);
    },
    [loadBuildingDetails]
  );

  const filteredBuildings = useMemo(() => {
    if (!Array.isArray(buildings)) return [];

    return buildings.filter((building) => {
      const matchesSearch =
        !searchQuery.trim() ||
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

  const DeleteConfirmationModal = () => (
    <Modal isOpen={isDeleteOpen} onClose={handleDeleteClose} size="3xl">
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

            {error && (
              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-warning-800 mb-2">
                      Deletion Not Allowed
                    </p>
                    <div className="text-sm text-warning-700 whitespace-pre-line">
                      {error}
                    </div>
                  </div>
                </div>
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
                  <div>
                    <span className="text-default-500">Status:</span>
                    <span className="ml-2">
                      {selectedBuilding.status &&
                        renderStatusChip(selectedBuilding.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Type:</span>
                    <span className="ml-2">
                      {selectedBuilding.building_type &&
                        renderTypeChip(selectedBuilding.building_type)}
                    </span>
                  </div>
                </div>

                <h4 className="font-medium mt-4 mb-3">Associated Data:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-default-500">Equipment:</span>
                    <span
                      className={`ml-2 font-medium ${buildingEquipment.length > 0 ? "text-warning" : "text-success"}`}
                    >
                      {buildingEquipment.length} items
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Audits:</span>
                    <span
                      className={`ml-2 font-medium ${buildingAudits.length > 0 ? "text-warning" : "text-success"}`}
                    >
                      {buildingAudits.length} records
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Alerts:</span>
                    <span
                      className={`ml-2 font-medium ${buildingAlerts.length > 0 ? "text-warning" : "text-success"}`}
                    >
                      {buildingAlerts.length} records
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Energy Data:</span>
                    <span
                      className={`ml-2 font-medium ${buildingEnergy.length > 0 ? "text-warning" : "text-success"}`}
                    >
                      {buildingEnergy.length} records
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Power Quality:</span>
                    <span
                      className={`ml-2 font-medium ${buildingPowerQuality.length > 0 ? "text-warning" : "text-success"}`}
                    >
                      {buildingPowerQuality.length} events
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">Maintenance:</span>
                    <span
                      className={`ml-2 font-medium ${(maintenanceSchedule?.schedule?.length || 0) > 0 ? "text-warning" : "text-success"}`}
                    >
                      {maintenanceSchedule?.schedule?.length || 0} records
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-3 w-full">
            <Button
              variant="flat"
              onPress={handleDeleteClose}
              isDisabled={submitLoading}
              className="flex-1"
            >
              Cancel
            </Button>

            {error &&
            (error.includes("associated") ||
              error.includes("constraint") ||
              error.includes("Cannot delete")) ? (
              <>
                <Button
                  color="warning"
                  onPress={handleSetInactive}
                  isLoading={submitLoading}
                  startContent={<Power className="w-4 h-4" />}
                  className="flex-1"
                >
                  Set Inactive Instead
                </Button>
                <Button
                  color="danger"
                  variant="bordered"
                  onPress={handleDelete}
                  isLoading={submitLoading}
                  startContent={<Trash2 className="w-4 h-4" />}
                  className="flex-1"
                >
                  Force Delete
                </Button>
              </>
            ) : (
              <Button
                color="danger"
                onPress={handleDelete}
                isLoading={submitLoading}
                startContent={<Trash2 className="w-4 h-4" />}
                className="flex-1"
              >
                Delete Building
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

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

  if (error && buildings.length === 0 && !loading) {
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
              isLoading={loading}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="p-6 space-y-6">
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
              onPress={loadBuildings}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Buildings</p>
                  <p className="text-xl font-semibold">{totalCount}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBuildings.map((building) => (
            <Card
              key={building.id}
              className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-background to-content1 border border-divider hover:border-primary/30 cursor-pointer"
            >
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
                          {building.equipment_count ||
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

                    <Divider />

                    <div className="space-y-3">
                      {(building.avg_compliance_score ||
                        building.compliance_status?.overall_score) && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-600 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Compliance
                          </span>
                          {renderEfficiencyRating(
                            building.avg_compliance_score ||
                              building.compliance_status?.overall_score ||
                              0
                          )}
                        </div>
                      )}

                      {(building.avg_power_factor ||
                        building.performance_summary
                          ?.monthly_consumption_kwh) && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-600 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Power Factor
                          </span>
                          <span className="text-sm font-medium">
                            {safeFormat.number(
                              building.avg_power_factor || 0.85,
                              2
                            )}
                          </span>
                        </div>
                      )}

                      {(building.total_consumption_kwh ||
                        building.performance_summary
                          ?.monthly_consumption_kwh) && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-600 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Monthly kWh
                          </span>
                          <span className="text-sm font-medium">
                            {safeFormat
                              .getValue(
                                building.total_consumption_kwh ||
                                  building.performance_summary
                                    ?.monthly_consumption_kwh,
                                0
                              )
                              .toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </div>

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

        {filteredBuildings.length === 0 && !loading && (
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

        <BuildingFormModal
          isOpen={isCreateOpen || isEditOpen}
          isEdit={isEditOpen}
          formData={buildingForm}
          onChange={setBuildingForm}
          onClose={isEditOpen ? handleEditClose : handleCreateClose}
          onSubmit={() => handleSubmit(isEditOpen)}
          isSubmitting={submitLoading}
        />
        {isDeleteOpen && <DeleteConfirmationModal />}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
                onPress={handleEditOpen}
              >
                Edit Building
              </DropdownItem>
              <DropdownItem
                key="delete"
                startContent={<Trash2 className="w-4 h-4" />}
                className="text-danger"
                color="danger"
                onPress={handleDeleteOpen}
              >
                Delete Building
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

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
                      <TableColumn>CONDITION</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {buildingEquipment.map((equipment) => (
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
                              {equipment.equipment_type?.replace("_", " ") ||
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
                            </div>
                          </TableCell>
                          <TableCell>
                            {equipment.condition_score ? (
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={equipment.condition_score}
                                  color={
                                    equipment.condition_score >= 80
                                      ? "success"
                                      : equipment.condition_score >= 60
                                        ? "warning"
                                        : "danger"
                                  }
                                  size="sm"
                                  className="w-16"
                                />
                                <span className="text-sm">
                                  {equipment.condition_score}%
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

      <BuildingFormModal
        isOpen={isCreateOpen || isEditOpen}
        isEdit={isEditOpen}
        formData={buildingForm}
        onChange={setBuildingForm}
        onClose={isEditOpen ? handleEditClose : handleCreateClose}
        onSubmit={() => handleSubmit(isEditOpen)}
        isSubmitting={submitLoading}
      />

      {isDeleteOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default BuildingsPage;
