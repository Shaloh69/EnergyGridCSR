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

// Icons
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
} from "lucide-react";

// API and Types
import {
  equipmentAPI,
  buildingsAPI,
  alertsAPI,
  dashboardAPI,
  reportsAPI,
} from "@/lib/api";
import {
  Equipment,
  Building,
  Alert,
  MaintenanceSchedule,
  ApiResponse,
  EquipmentQueryParams,
  AlertQueryParams,
  EquipmentWithMaintenance,
  MaintenanceLog,
  ApiError,
} from "@/types/api-types";
import { extractErrorMessage } from "@/lib/api-utils";

// Enhanced interfaces for UI state
interface EquipmentStats {
  total: number;
  operational: number;
  maintenance: number;
  offline: number;
  avgCondition: number;
  maintenanceDueSoon: number;
  maintenanceOverdue: number;
  criticalAlerts: number;
}

interface EquipmentDetailsState {
  equipment: Equipment | null;
  alerts: Alert[];
  maintenanceHistory: MaintenanceLog[];
  analytics: any;
  loading: boolean;
}

// Equipment types matching exact API specification
const equipmentTypes = [
  { key: "hvac" as const, label: "HVAC", icon: "🌡️", color: "primary" },
  { key: "lighting" as const, label: "Lighting", icon: "💡", color: "warning" },
  {
    key: "electrical" as const,
    label: "Electrical",
    icon: "⚡",
    color: "danger",
  },
  {
    key: "manufacturing" as const,
    label: "Manufacturing",
    icon: "🏭",
    color: "secondary",
  },
  { key: "security" as const, label: "Security", icon: "🔒", color: "success" },
  { key: "other" as const, label: "Other", icon: "🔧", color: "default" },
];

// Status options matching API specification
const statusOptions = [
  { key: "active" as const, label: "Active", color: "success" },
  { key: "maintenance" as const, label: "Maintenance", color: "warning" },
  { key: "faulty" as const, label: "Faulty", color: "danger" },
  { key: "inactive" as const, label: "Inactive", color: "default" },
];

const maintenanceScheduleOptions = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "semi_annual", label: "Semi-Annual" },
  { key: "annual", label: "Annual" },
];

// Type definitions matching API
type EquipmentType =
  | "hvac"
  | "lighting"
  | "electrical"
  | "manufacturing"
  | "security"
  | "other";
type EquipmentStatus = "active" | "maintenance" | "faulty" | "inactive";
type MaintenanceScheduleType =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual";

export default function EquipmentPage() {
  // State Management
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] =
    useState<MaintenanceSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state - Updated to match server response format
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total_pages: 1,
    total_count: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<keyof Equipment>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // Modals
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
    isOpen: isMaintenanceOpen,
    onOpen: onMaintenanceOpen,
    onClose: onMaintenanceClose,
  } = useDisclosure();
  const {
    isOpen: isAlertsOpen,
    onOpen: onAlertsOpen,
    onClose: onAlertsClose,
  } = useDisclosure();
  const {
    isOpen: isAnalyticsOpen,
    onOpen: onAnalyticsOpen,
    onClose: onAnalyticsClose,
  } = useDisclosure();
  const {
    isOpen: isQROpen,
    onOpen: onQROpen,
    onClose: onQRClose,
  } = useDisclosure();

  // Selected Equipment and Modal Data
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [equipmentDetails, setEquipmentDetails] =
    useState<EquipmentDetailsState>({
      equipment: null,
      alerts: [],
      maintenanceHistory: [],
      analytics: null,
      loading: false,
    });

  // Form State - Updated to match exact API field names
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    building_id: string;
    equipment_type: EquipmentType;
    manufacturer: string;
    model: string;
    serial_number: string;
    power_rating_kw: string;
    voltage_rating: string;
    current_rating_a: string;
    installation_date: string;
    warranty_expiry: string;
    location: string;
    floor: string;
    room: string;
    maintenance_schedule: MaintenanceScheduleType;
    condition_score: string;
    notes: string;
  }>({
    name: "",
    code: "",
    building_id: "",
    equipment_type: "hvac",
    manufacturer: "",
    model: "",
    serial_number: "",
    power_rating_kw: "",
    voltage_rating: "",
    current_rating_a: "",
    installation_date: "",
    warranty_expiry: "",
    location: "",
    floor: "",
    room: "",
    maintenance_schedule: "monthly",
    condition_score: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Maintenance Form
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    maintenance_type: "preventive" as const,
    scheduled_date: "",
    description: "",
    notes: "",
  });

  // Utility Functions
  const safeArray = <T,>(input: any): T[] => {
    return Array.isArray(input) ? input : [];
  };

  const getBuildingName = (equipment: Equipment): string => {
    if (equipment.building_name) return equipment.building_name;
    const building = buildings.find((b) => b.id === equipment.building_id);
    return building?.name || `Building ID: ${equipment.building_id}`;
  };

  const getEquipmentAge = (equipment: Equipment): number => {
    if (!equipment.installation_date) return 0;
    const installDate = new Date(equipment.installation_date);
    const now = new Date();
    return (
      (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
  };

  const getTypeInfo = (type: string) => {
    return equipmentTypes.find((t) => t.key === type) || equipmentTypes[5]; // Default to "other"
  };

  const getStatusInfo = (status: string | undefined) => {
    if (!status) return statusOptions[0]; // Default to "active"
    return statusOptions.find((s) => s.key === status) || statusOptions[0];
  };

  const getConditionScore = (equipment: Equipment): number => {
    if (equipment.condition_score !== undefined)
      return equipment.condition_score;
    return 85; // Default score
  };

  const getHealthStatus = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: "Excellent", color: "success" };
    if (score >= 75) return { label: "Good", color: "primary" };
    if (score >= 60) return { label: "Fair", color: "warning" };
    if (score >= 40) return { label: "Poor", color: "danger" };
    return { label: "Critical", color: "danger" };
  };

  const getEquipmentAlerts = (equipmentId: number): Alert[] => {
    return alerts.filter((alert) => alert.equipment_id === equipmentId);
  };

  // Equipment Statistics
  const equipmentStats: EquipmentStats = useMemo(() => {
    const stats = {
      total: equipment.length,
      operational: equipment.filter((e) => (e.status || "active") === "active")
        .length,
      maintenance: equipment.filter(
        (e) => (e.status || "active") === "maintenance"
      ).length,
      offline: equipment.filter((e) => {
        const status = e.status || "active";
        return status === "faulty" || status === "inactive";
      }).length,
      avgCondition:
        equipment.length > 0
          ? equipment.reduce((sum, e) => sum + getConditionScore(e), 0) /
            equipment.length
          : 0,
      maintenanceDueSoon: 0, // Will be calculated based on maintenance schedule
      maintenanceOverdue: 0, // Will be calculated based on maintenance schedule
      criticalAlerts: alerts.filter(
        (a) => a.severity === "critical" && a.status === "active"
      ).length,
    };
    return stats;
  }, [equipment, alerts]);

  // Data Loading Functions
  const loadBuildings = async () => {
    try {
      setBuildingsLoading(true);
      console.log("🏢 Loading buildings...");

      const response = await buildingsAPI.getAll({
        status: "active",
        limit: 100,
      });

      console.log("🏢 Buildings API Response:", response);

      if (response.data?.success) {
        // Extract buildings data from nested response structure
        const buildingsData = response.data.data;
        const buildings = safeArray<Building>(buildingsData);
        console.log(
          `✅ Successfully loaded ${buildings.length} buildings:`,
          buildings
        );
        setBuildings(buildings);
      } else {
        console.warn("⚠️ Failed to load buildings:", response.data?.message);
        // Try fallback without filters
        try {
          const fallbackResponse = await buildingsAPI.getAll({});
          if (fallbackResponse.data?.success) {
            const fallbackBuildings = safeArray<Building>(
              fallbackResponse.data.data
            );
            console.log(
              `✅ Fallback: loaded ${fallbackBuildings.length} buildings`
            );
            setBuildings(fallbackBuildings);
          }
        } catch (fallbackError) {
          console.error("❌ Fallback also failed:", fallbackError);
          setBuildings([]);
        }
      }
    } catch (error) {
      console.error("❌ Failed to load buildings:", error);
      setError(
        "Failed to load buildings. You can still create equipment by entering the building ID manually."
      );
      setBuildings([]);
    } finally {
      setBuildingsLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      // Build query parameters according to API specification
      const params: EquipmentQueryParams = {
        page: pagination.current_page,
        limit: pagination.per_page,
        sortBy: sortBy as any,
        sortOrder,
      };

      // Apply filters if they exist
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (buildingFilter) params.building_id = Number(buildingFilter);
      if (typeFilter) params.equipment_type = typeFilter as any;
      if (statusFilter) params.status = statusFilter as any;

      console.log("📡 Loading equipment with params:", params);
      const response = await equipmentAPI.getAll(params);
      console.log("📡 Equipment API Response:", response);

      if (response.data?.success) {
        const equipmentData = response.data.data;
        const equipment = safeArray<Equipment>(equipmentData);
        setEquipment(equipment);

        // Handle pagination from response
        if (response.data.pagination) {
          setPagination({
            current_page: response.data.pagination.current_page || 1,
            per_page: response.data.pagination.per_page || 15,
            total_pages: response.data.pagination.total_pages || 1,
            total_count: response.data.pagination.total_count || 0,
            has_next_page: response.data.pagination.has_next_page || false,
            has_prev_page: response.data.pagination.has_prev_page || false,
          });
        }

        console.log(`✅ Loaded ${equipment.length} equipment items`);
      } else {
        console.warn("⚠️ API response unsuccessful:", response.data?.message);
        setEquipment([]);
      }

      // Load alerts for equipment
      try {
        const alertsResponse = await alertsAPI.getAll({
          status: "active",
          limit: 100,
        });

        if (alertsResponse.data?.success) {
          setAlerts(safeArray<Alert>(alertsResponse.data.data));
        }
      } catch (alertError) {
        console.warn("Failed to load alerts:", alertError);
        setAlerts([]);
      }
    } catch (error) {
      console.error("❌ Failed to load equipment:", error);
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to load equipment: ${errorMessage}`);
      setEquipment([]);
    }
  };

  const loadMaintenanceSchedule = async () => {
    try {
      const response = await equipmentAPI.getMaintenanceSchedule();
      if (response.data?.success) {
        setMaintenanceSchedule(response.data.data);
      }
    } catch (error) {
      console.warn("Failed to load maintenance schedule:", error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🚀 Starting initial data load...");

      await Promise.all([
        loadBuildings(),
        loadEquipment(),
        loadMaintenanceSchedule(),
      ]);

      console.log("✅ Initial data load completed");
    } catch (error) {
      console.error("❌ Failed to load initial data:", error);
      setError("Failed to load data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadEquipment(), loadMaintenanceSchedule()]);
    } catch (error) {
      console.error("❌ Failed to refresh data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [
    pagination.current_page,
    searchTerm,
    buildingFilter,
    typeFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  // Effects
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadEquipment();
    }
  }, [
    pagination.current_page,
    searchTerm,
    buildingFilter,
    typeFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !submitting) {
        refreshData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshData, loading, submitting]);

  // Modal Handlers
  const openViewModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEquipmentDetails((prev) => ({ ...prev, loading: true }));
    onViewOpen();

    try {
      console.log(`🔍 Loading details for equipment ${equipment.id}...`);

      const [detailsRes, alertsRes, maintenanceRes] = await Promise.allSettled([
        equipmentAPI.getById(equipment.id),
        alertsAPI.getAll({ equipment_id: equipment.id, limit: 10 }),
        equipmentAPI.getMaintenanceHistory(equipment.id),
      ]);

      const newState: EquipmentDetailsState = {
        equipment: equipment,
        alerts: [],
        maintenanceHistory: [],
        analytics: null,
        loading: false,
      };

      // Handle equipment details
      if (detailsRes.status === "fulfilled" && detailsRes.value.data?.success) {
        newState.equipment = detailsRes.value.data.data;
      }

      // Handle alerts
      if (alertsRes.status === "fulfilled" && alertsRes.value.data?.success) {
        newState.alerts = safeArray<Alert>(alertsRes.value.data.data);
      }

      // Handle maintenance history
      if (
        maintenanceRes.status === "fulfilled" &&
        maintenanceRes.value.data?.success
      ) {
        newState.maintenanceHistory = safeArray<MaintenanceLog>(
          maintenanceRes.value.data.data
        );
      }

      setEquipmentDetails(newState);
    } catch (error) {
      console.error("❌ Failed to load equipment details:", error);
      setEquipmentDetails((prev) => ({ ...prev, loading: false }));
    }
  };

  const openMaintenanceModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEquipmentDetails((prev) => ({ ...prev, loading: true }));

    try {
      const response = await equipmentAPI.getMaintenanceHistory(equipment.id);
      if (response.data?.success) {
        setEquipmentDetails((prev) => ({
          ...prev,
          maintenanceHistory: safeArray<MaintenanceLog>(response.data.data),
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load maintenance history:", error);
      setEquipmentDetails((prev) => ({
        ...prev,
        maintenanceHistory: [],
        loading: false,
      }));
    }

    onMaintenanceOpen();
  };

  const openAlertsModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEquipmentDetails((prev) => ({ ...prev, loading: true }));

    try {
      const response = await alertsAPI.getAll({
        equipment_id: equipment.id,
        limit: 20,
        sortBy: "created_at",
        sortOrder: "DESC",
      });

      if (response.data?.success) {
        setEquipmentDetails((prev) => ({
          ...prev,
          alerts: safeArray<Alert>(response.data.data),
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load equipment alerts:", error);
      setEquipmentDetails((prev) => ({
        ...prev,
        alerts: [],
        loading: false,
      }));
    }

    onAlertsOpen();
  };

  const openAnalyticsModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEquipmentDetails((prev) => ({ ...prev, loading: true }));

    try {
      const response = await equipmentAPI.getPerformanceAnalytics(
        equipment.id,
        "monthly"
      );
      if (response.data?.success) {
        setEquipmentDetails((prev) => ({
          ...prev,
          analytics: response.data.data,
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setEquipmentDetails((prev) => ({
        ...prev,
        analytics: null,
        loading: false,
      }));
    }

    onAnalyticsOpen();
  };

  const openQRModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    onQROpen();
  };

  // CRUD Operations
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      building_id: "",
      equipment_type: "hvac",
      manufacturer: "",
      model: "",
      serial_number: "",
      power_rating_kw: "",
      voltage_rating: "",
      current_rating_a: "",
      installation_date: "",
      warranty_expiry: "",
      location: "",
      floor: "",
      room: "",
      maintenance_schedule: "monthly",
      condition_score: "",
      notes: "",
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required field validation
    if (!formData.name.trim()) errors.name = "Equipment name is required";
    if (!formData.building_id) errors.building_id = "Building is required";
    if (!formData.manufacturer.trim())
      errors.manufacturer = "Manufacturer is required";
    if (!formData.model.trim()) errors.model = "Model is required";
    if (!formData.location.trim()) errors.location = "Location is required";

    // Numeric field validation
    if (formData.power_rating_kw && isNaN(Number(formData.power_rating_kw))) {
      errors.power_rating_kw = "Power rating must be a valid number";
    }

    if (formData.voltage_rating && isNaN(Number(formData.voltage_rating))) {
      errors.voltage_rating = "Voltage rating must be a valid number";
    }

    if (formData.current_rating_a && isNaN(Number(formData.current_rating_a))) {
      errors.current_rating_a = "Current rating must be a valid number";
    }

    if (
      formData.condition_score &&
      (isNaN(Number(formData.condition_score)) ||
        Number(formData.condition_score) < 0 ||
        Number(formData.condition_score) > 100)
    ) {
      errors.condition_score = "Condition score must be between 0 and 100";
    }

    if (formData.floor && isNaN(Number(formData.floor))) {
      errors.floor = "Floor must be a valid number";
    }

    setFormErrors(errors);
    console.log("Form validation errors:", errors);
    return Object.keys(errors).length === 0;
  };

  // Utility to build equipment payload from form
  const buildEquipmentPayload = (): Partial<Equipment> => {
    const data: Partial<Equipment> = {
      name: formData.name,
      building_id: Number(formData.building_id),
      equipment_type: formData.equipment_type,
      manufacturer: formData.manufacturer,
      model: formData.model,
      location: formData.location,
    };
    
    if (formData.code) data.code = formData.code;
    if (formData.serial_number) data.serial_number = formData.serial_number;
    if (formData.power_rating_kw) data.power_rating_kw = Number(formData.power_rating_kw);
    if (formData.voltage_rating) data.voltage_rating = Number(formData.voltage_rating);
    if (formData.current_rating_a) data.current_rating_a = Number(formData.current_rating_a);
    if (formData.installation_date) data.installation_date = formData.installation_date;
    if (formData.warranty_expiry) data.warranty_expiry = formData.warranty_expiry;
    if (formData.floor) data.floor = Number(formData.floor);
    if (formData.room) data.room = formData.room;
    if (formData.maintenance_schedule) data.maintenance_schedule = formData.maintenance_schedule;
    if (formData.condition_score) data.condition_score = Number(formData.condition_score);
    if (formData.notes) data.notes = formData.notes;
    
    return data;
  };

  const handleCreate = async () => {
    console.log("🔨 Starting equipment creation...");
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const equipmentData = buildEquipmentPayload();

      const response = await equipmentAPI.create(equipmentData);
      console.log("📡 API Response:", response);

      if (response.data?.success) {
        console.log("✅ Equipment created successfully");
        await loadEquipment();
        onCreateClose();
        resetForm();
        setError(null);
      } else {
        console.error("❌ Failed to create equipment:", response.data);
        setError(`Failed to create equipment: ${response.data?.message || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("❌ Failed to create equipment:", error);
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to create equipment: ${errorMessage}`);

      if (error?.response?.data?.validation_errors) {
        const validationErrors: Record<string, string> = {};
        error.response.data.validation_errors.forEach(
          (validationError: { field: string; message: string }) => {
            validationErrors[validationError.field] = validationError.message;
          }
        );
        setFormErrors(validationErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEquipment || !validateForm()) return;

    try {
      setSubmitting(true);
      const equipmentData = buildEquipmentPayload();

      console.log("🔧 Updating equipment:", selectedEquipment.id, equipmentData);
      const response = await equipmentAPI.update(selectedEquipment.id, equipmentData);

      if (response.data?.success) {
        console.log("✅ Equipment updated successfully");
        await loadEquipment();
        onEditClose();
        resetForm();
        setError(null);
      } else {
        console.error("❌ Failed to update equipment:", response.data?.message);
        setError("Failed to update equipment: " + response.data?.message);
      }
    } catch (error: any) {
      console.error("❌ Failed to update equipment:", error);
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to update equipment: ${errorMessage}`);

      if (error?.response?.data?.validation_errors) {
        const validationErrors: Record<string, string> = {};
        error.response.data.validation_errors.forEach(
          (validationError: { field: string; message: string }) => {
            validationErrors[validationError.field] = validationError.message;
          }
        );
        setFormErrors(validationErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (equipment: Equipment) => {
    if (!confirm(`Are you sure you want to delete "${equipment.name}"?`))
      return;

    try {
      console.log("🗑️ Deleting equipment:", equipment.id);
      const response = await equipmentAPI.delete(equipment.id);

      if (response.data?.success) {
        console.log("✅ Equipment deleted successfully");
        await loadEquipment();
      } else {
        console.error("❌ Failed to delete equipment:", response.data?.message);
        setError("Failed to delete equipment: " + response.data?.message);
      }
    } catch (error) {
      console.error("❌ Failed to delete equipment:", error);
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to delete equipment: ${errorMessage}`);
    }
  };

  const openEditModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      code: equipment.code || "",
      building_id: equipment.building_id.toString(),
      equipment_type: equipment.equipment_type,
      manufacturer: equipment.manufacturer || "",
      model: equipment.model || "",
      serial_number: equipment.serial_number || "",
      power_rating_kw: equipment.power_rating_kw?.toString() || "",
      voltage_rating: equipment.voltage_rating?.toString() || "",
      current_rating_a: equipment.current_rating_a?.toString() || "",
      installation_date: equipment.installation_date || "",
      warranty_expiry: equipment.warranty_expiry || "",
      location: equipment.location || "",
      floor: equipment.floor?.toString() || "",
      room: equipment.room || "",
      maintenance_schedule: equipment.maintenance_schedule || "monthly",
      condition_score: equipment.condition_score?.toString() || "",
      notes: equipment.notes || "",
    });
    onEditOpen();
  };

  // Log Maintenance
  const handleLogMaintenance = async () => {
    if (!selectedEquipment) return;

    try {
      setSubmitting(true);

      const maintenanceData = {
        equipment_id: selectedEquipment.id,
        maintenance_type: maintenanceFormData.maintenance_type,
        scheduled_date: maintenanceFormData.scheduled_date,
        description: maintenanceFormData.description,
        notes: maintenanceFormData.notes,
        status: "scheduled" as const,
      };

      console.log("📝 Logging maintenance:", maintenanceData);
      const response = await equipmentAPI.logMaintenance(
        selectedEquipment.id,
        maintenanceData
      );

      if (response.data?.success) {
        console.log("✅ Maintenance logged successfully");

        // Reload maintenance history
        const historyRes = await equipmentAPI.getMaintenanceHistory(
          selectedEquipment.id
        );
        if (historyRes.data?.success) {
          setEquipmentDetails((prev) => ({
            ...prev,
            maintenanceHistory: safeArray<MaintenanceLog>(historyRes.data.data),
          }));
        }

        // Reset form
        setMaintenanceFormData({
          maintenance_type: "preventive",
          scheduled_date: "",
          description: "",
          notes: "",
        });
      } else {
        console.error("❌ Failed to log maintenance:", response.data?.message);
        setError("Failed to log maintenance: " + response.data?.message);
      }
    } catch (error) {
      console.error("❌ Failed to log maintenance:", error);
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to log maintenance: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter change handlers
  const handleBuildingFilterChange = (keys: "all" | Set<React.Key>) => {
    const selectedKey = keys === "all" ? "" : (Array.from(keys)[0] as string);
    setBuildingFilter(selectedKey || "");
  };

  const handleTypeFilterChange = (keys: "all" | Set<React.Key>) => {
    const selectedKey = keys === "all" ? "" : (Array.from(keys)[0] as string);
    setTypeFilter(selectedKey || "");
  };

  const handleStatusFilterChange = (keys: "all" | Set<React.Key>) => {
    const selectedKey = keys === "all" ? "" : (Array.from(keys)[0] as string);
    setStatusFilter(selectedKey || "");
  };

  // Form change handlers
  const handleFormBuildingChange = (keys: "all" | Set<React.Key>) => {
    const selectedKey = keys === "all" ? "" : (Array.from(keys)[0] as string);
    setFormData((prev) => ({ ...prev, building_id: selectedKey || "" }));
  };

  const handleFormEquipmentTypeChange = (keys: "all" | Set<React.Key>) => {
    const selectedKey =
      keys === "all" ? "hvac" : (Array.from(keys)[0] as string);
    setFormData((prev) => ({
      ...prev,
      equipment_type: (selectedKey as EquipmentType) || "hvac",
    }));
  };

  const handleFormMaintenanceScheduleChange = (
    keys: "all" | Set<React.Key>
  ) => {
    const selectedKey =
      keys === "all" ? "monthly" : (Array.from(keys)[0] as string);
    setFormData((prev) => ({
      ...prev,
      maintenance_schedule:
        (selectedKey as MaintenanceScheduleType) || "monthly",
    }));
  };

  // Filter options
  const buildingFilterOptions = [
    { key: "", label: "All Buildings" },
    ...buildings.map((building) => ({
      key: building.id.toString(),
      label: building.name,
    })),
  ];

  const typeFilterOptions = [
    { key: "", label: "All Types" },
    ...equipmentTypes.map((type) => ({
      key: type.key,
      label: `${type.icon} ${type.label}`,
    })),
  ];

  const statusFilterOptions = [
    { key: "", label: "All Statuses" },
    ...statusOptions.map((option) => ({
      key: option.key,
      label: option.label,
    })),
  ];

  // Loading State
  if (loading) {
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
      {error && (
        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-danger" />
                <span className="text-danger font-medium">{error}</span>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setError(null)}
              >
                ×
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
            {refreshing && (
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
            onPress={refreshData}
            isLoading={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="flat"
            color="secondary"
            startContent={<Settings className="w-4 h-4" />}
            onPress={() => {
              console.log("🔍 Debug Info:");
              console.log("Buildings:", buildings);
              console.log("Equipment:", equipment);
              console.log("Form Data:", formData);
              console.log("Equipment Stats:", equipmentStats);
              console.log("Pagination:", pagination);
            }}
          >
            Debug
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => {
              resetForm();
              onCreateOpen();
            }}
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
                  {pagination.total_count} system-wide
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
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              className="col-span-2"
            />

            <Select
              placeholder="Building"
              selectedKeys={buildingFilter ? [buildingFilter] : []}
              onSelectionChange={handleBuildingFilterChange}
              isLoading={buildingsLoading}
              isDisabled={buildings.length === 0 && !buildingsLoading}
            >
              {buildingFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Type"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={handleTypeFilterChange}
            >
              {typeFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={handleStatusFilterChange}
            >
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Button
              variant="light"
              startContent={<Filter className="w-4 h-4" />}
              onPress={() => {
                setSearchTerm("");
                setBuildingFilter("");
                setTypeFilter("");
                setStatusFilter("");
              }}
            >
              Clear
            </Button>
          </div>
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
                {/* Show warning if no buildings loaded */}
                {buildings.length === 0 && !buildingsLoading && (
                  <div className="flex items-center p-4 bg-warning-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                    <div>
                      <span className="text-warning font-medium">
                        Buildings not loaded.{" "}
                      </span>
                      <span className="text-warning-600">
                        You can still create equipment by entering the building
                        ID manually. Make sure the building ID exists in your
                        system.
                      </span>
                    </div>
                  </div>
                )}

                {/* Show building loading state */}
                {buildingsLoading && (
                  <div className="flex items-center p-4 bg-primary-50 rounded-lg">
                    <Spinner size="sm" color="primary" className="mr-2" />
                    <span className="text-primary">Loading buildings...</span>
                  </div>
                )}

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
                  {buildings.length > 0 ? (
                    <Select
                      label="Building"
                      placeholder="Select building"
                      selectedKeys={
                        formData.building_id ? [formData.building_id] : []
                      }
                      onSelectionChange={handleFormBuildingChange}
                      errorMessage={formErrors.building_id}
                      isInvalid={!!formErrors.building_id}
                      isRequired
                      isLoading={buildingsLoading}
                    >
                      {buildings.map((building) => (
                        <SelectItem key={building.id.toString()}>
                          {building.name} (
                          {building.code || `ID: ${building.id}`}) -{" "}
                          {building.building_type}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      label="Building ID"
                      placeholder="Enter building ID"
                      value={formData.building_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          building_id: e.target.value,
                        }))
                      }
                      errorMessage={formErrors.building_id}
                      isInvalid={!!formErrors.building_id}
                      isRequired
                      description={
                        buildingsLoading
                          ? "Loading buildings..."
                          : "Buildings list not available. Enter building ID manually."
                      }
                    />
                  )}

                  <Select
                    label="Equipment Type"
                    selectedKeys={[formData.equipment_type]}
                    onSelectionChange={handleFormEquipmentTypeChange}
                    isRequired
                  >
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type.key}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
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
                    value={formData.serial_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        serial_number: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.serial_number}
                    isInvalid={!!formErrors.serial_number}
                  />

                  <Select
                    label="Maintenance Schedule"
                    selectedKeys={[formData.maintenance_schedule]}
                    onSelectionChange={handleFormMaintenanceScheduleChange}
                  >
                    {maintenanceScheduleOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Power Rating (kW)"
                    placeholder="0.0"
                    type="number"
                    step="0.1"
                    value={formData.power_rating_kw}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        power_rating_kw: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.power_rating_kw}
                    isInvalid={!!formErrors.power_rating_kw}
                  />

                  <Input
                    label="Voltage Rating (V)"
                    placeholder="220"
                    type="number"
                    value={formData.voltage_rating}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        voltage_rating: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.voltage_rating}
                    isInvalid={!!formErrors.voltage_rating}
                  />

                  <Input
                    label="Current Rating (A)"
                    placeholder="10"
                    type="number"
                    step="0.1"
                    value={formData.current_rating_a}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        current_rating_a: e.target.value,
                      }))
                    }
                    errorMessage={formErrors.current_rating_a}
                    isInvalid={!!formErrors.current_rating_a}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Installation Date"
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        installation_date: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Warranty Expiry"
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        warranty_expiry: e.target.value,
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
                  value={formData.condition_score}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition_score: e.target.value,
                    }))
                  }
                  errorMessage={formErrors.condition_score}
                  isInvalid={!!formErrors.condition_score}
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
                  color="secondary"
                  variant="flat"
                  onPress={() => {
                    console.log("🔍 Current form state:", formData);
                    console.log("🔍 Current form errors:", formErrors);
                    console.log("🔍 Buildings available:", buildings);
                    console.log("🔍 Buildings loading:", buildingsLoading);
                  }}
                >
                  Debug Form
                </Button>
                <Button
                  color="primary"
                  onPress={isCreateOpen ? handleCreate : handleEdit}
                  isLoading={submitting}
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
                  {equipmentDetails.loading && (
                    <Spinner size="sm" className="ml-2" />
                  )}
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
                                    getTypeInfo(
                                      selectedEquipment.equipment_type
                                    ).color as any
                                  }
                                  size="sm"
                                >
                                  {
                                    getTypeInfo(
                                      selectedEquipment.equipment_type
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
                                    getStatusInfo(selectedEquipment.status)
                                      .color as any
                                  }
                                  size="sm"
                                >
                                  {
                                    getStatusInfo(selectedEquipment.status)
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
                              {selectedEquipment.serial_number && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Serial Number:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.serial_number}
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
                              {selectedEquipment.installation_date && (
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
                                    {getConditionScore(
                                      selectedEquipment
                                    ).toFixed(1)}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  aria-label="Equipment health score"
                                  value={getConditionScore(selectedEquipment)}
                                  color={
                                    getHealthStatus(
                                      getConditionScore(selectedEquipment)
                                    ).color as any
                                  }
                                />
                              </div>

                              {selectedEquipment.power_rating_kw && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Power Rating:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.power_rating_kw} kW
                                  </span>
                                </div>
                              )}

                              {selectedEquipment.voltage_rating && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Voltage Rating:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.voltage_rating} V
                                  </span>
                                </div>
                              )}

                              {selectedEquipment.current_rating_a && (
                                <div className="flex justify-between">
                                  <span className="text-default-600">
                                    Current Rating:
                                  </span>
                                  <span className="font-medium">
                                    {selectedEquipment.current_rating_a} A
                                  </span>
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        </div>

                        {equipmentDetails.loading && (
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
                      key="alerts"
                      title={
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Alerts
                          {equipmentDetails.alerts.length > 0 && (
                            <Badge
                              content={equipmentDetails.alerts.length}
                              color="danger"
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
                        {equipmentDetails.loading && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading alerts...
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        {equipmentDetails.alerts.length > 0 ? (
                          equipmentDetails.alerts.map((alert) => (
                            <Card
                              key={alert.id}
                              className={`border-l-4 ${
                                alert.severity === "critical"
                                  ? "border-l-danger"
                                  : alert.severity === "high"
                                    ? "border-l-warning"
                                    : "border-l-primary"
                              }`}
                            >
                              <CardBody>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Chip
                                        color={
                                          alert.severity === "critical"
                                            ? "danger"
                                            : alert.severity === "high"
                                              ? "warning"
                                              : "primary"
                                        }
                                        size="sm"
                                      >
                                        {alert.severity}
                                      </Chip>
                                      <Chip
                                        color={
                                          alert.status === "active"
                                            ? "danger"
                                            : "success"
                                        }
                                        size="sm"
                                        variant="flat"
                                      >
                                        {alert.status}
                                      </Chip>
                                    </div>
                                    <h5 className="font-semibold mt-2">
                                      {alert.title}
                                    </h5>
                                    <p className="text-default-600 text-sm mt-1">
                                      {alert.message}
                                    </p>
                                    <div className="text-xs text-default-500 mt-2">
                                      {new Date(
                                        alert.created_at
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))
                        ) : (
                          <Card>
                            <CardBody className="text-center py-8">
                              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                              <h4 className="font-medium text-success">
                                No Active Alerts
                              </h4>
                              <p className="text-default-500 text-sm">
                                This equipment is operating normally
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
                  onPress={() => {
                    console.log(
                      "Generate equipment report for:",
                      selectedEquipment?.id
                    );
                  }}
                >
                  Generate Report
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        isOpen={isMaintenanceOpen}
        onOpenChange={onMaintenanceClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Maintenance - {selectedEquipment?.name}
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold">Log New Maintenance</h4>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <Select
                        label="Maintenance Type"
                        selectedKeys={[maintenanceFormData.maintenance_type]}
                        onSelectionChange={(keys) => {
                          const selectedKey =
                            keys === "all"
                              ? "preventive"
                              : (Array.from(keys)[0] as string);
                          setMaintenanceFormData((prev) => ({
                            ...prev,
                            maintenance_type: selectedKey as any,
                          }));
                        }}
                      >
                        <SelectItem key="preventive">Preventive</SelectItem>
                        <SelectItem key="corrective">Corrective</SelectItem>
                        <SelectItem key="emergency">Emergency</SelectItem>
                        <SelectItem key="inspection">Inspection</SelectItem>
                      </Select>

                      <Input
                        label="Scheduled Date"
                        type="date"
                        value={maintenanceFormData.scheduled_date}
                        onChange={(e) =>
                          setMaintenanceFormData((prev) => ({
                            ...prev,
                            scheduled_date: e.target.value,
                          }))
                        }
                      />

                      <Textarea
                        label="Description"
                        placeholder="Describe the maintenance work to be performed"
                        value={maintenanceFormData.description}
                        onChange={(e) =>
                          setMaintenanceFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        minRows={3}
                      />

                      <Textarea
                        label="Notes"
                        placeholder="Additional notes or special instructions"
                        value={maintenanceFormData.notes}
                        onChange={(e) =>
                          setMaintenanceFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        minRows={2}
                      />

                      <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleLogMaintenance}
                        isLoading={submitting}
                      >
                        Log Maintenance
                      </Button>
                    </CardBody>
                  </Card>

                  {equipmentDetails.loading && (
                    <Card>
                      <CardBody className="text-center py-8">
                        <Spinner size="lg" />
                        <p className="mt-4 text-default-500">
                          Loading maintenance history...
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  {equipmentDetails.maintenanceHistory.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Maintenance History</h4>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-3">
                          {equipmentDetails.maintenanceHistory.map(
                            (maintenance, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-start p-3 bg-default-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Chip
                                      color={
                                        maintenance.maintenance_type ===
                                        "emergency"
                                          ? "danger"
                                          : maintenance.maintenance_type ===
                                              "corrective"
                                            ? "warning"
                                            : "primary"
                                      }
                                      size="sm"
                                    >
                                      {maintenance.maintenance_type}
                                    </Chip>
                                    <Chip
                                      color={
                                        maintenance.status === "completed"
                                          ? "success"
                                          : maintenance.status === "in_progress"
                                            ? "warning"
                                            : "default"
                                      }
                                      size="sm"
                                      variant="dot"
                                    >
                                      {maintenance.status}
                                    </Chip>
                                  </div>
                                  <div className="font-medium">
                                    {maintenance.description}
                                  </div>
                                  <div className="text-sm text-default-600">
                                    {maintenance.scheduled_date && (
                                      <span>
                                        Scheduled:{" "}
                                        {new Date(
                                          maintenance.scheduled_date
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                    {maintenance.completed_date && (
                                      <span>
                                        {" "}
                                        • Completed:{" "}
                                        {new Date(
                                          maintenance.completed_date
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  {maintenance.notes && (
                                    <div className="text-xs text-default-500 mt-1">
                                      Notes: {maintenance.notes}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  {maintenance.cost && (
                                    <div className="text-sm font-medium">
                                      ₱{maintenance.cost.toLocaleString()}
                                    </div>
                                  )}
                                  {maintenance.downtime_minutes && (
                                    <div className="text-xs text-default-500">
                                      {maintenance.downtime_minutes} min
                                      downtime
                                    </div>
                                  )}
                                  {maintenance.duration_minutes && (
                                    <div className="text-xs text-default-400">
                                      {maintenance.duration_minutes} min
                                      duration
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Alerts Modal */}
      <Modal
        isOpen={isAlertsOpen}
        onOpenChange={onAlertsClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Equipment Alerts - {selectedEquipment?.name}
                  {equipmentDetails.alerts.length > 0 && (
                    <Badge
                      content={equipmentDetails.alerts.length}
                      color="danger"
                      size="sm"
                      className="ml-2"
                    >
                      <span className="w-2 h-2" />
                    </Badge>
                  )}
                  {equipmentDetails.loading && (
                    <Spinner size="sm" className="ml-2" />
                  )}
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {equipmentDetails.loading && (
                    <Card>
                      <CardBody className="text-center py-8">
                        <Spinner size="lg" />
                        <p className="mt-4 text-default-500">
                          Loading alerts...
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  {equipmentDetails.alerts.length > 0 ? (
                    equipmentDetails.alerts.map((alert) => (
                      <Card
                        key={alert.id}
                        className={`border-l-4 ${
                          alert.severity === "critical"
                            ? "border-l-danger"
                            : alert.severity === "high"
                              ? "border-l-warning"
                              : "border-l-primary"
                        }`}
                      >
                        <CardBody>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Chip
                                  color={
                                    alert.severity === "critical"
                                      ? "danger"
                                      : alert.severity === "high"
                                        ? "warning"
                                        : "primary"
                                  }
                                  size="sm"
                                >
                                  {alert.severity}
                                </Chip>
                                <Chip
                                  color={
                                    alert.status === "active"
                                      ? "danger"
                                      : "success"
                                  }
                                  size="sm"
                                  variant="flat"
                                >
                                  {alert.status}
                                </Chip>
                                <Chip color="default" size="sm" variant="flat">
                                  {alert.type}
                                </Chip>
                              </div>
                              <h5 className="font-semibold text-lg">
                                {alert.title}
                              </h5>
                              <p className="text-default-600 mt-1">
                                {alert.message}
                              </p>
                              {alert.description && (
                                <p className="text-default-500 text-sm mt-2">
                                  {alert.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-sm text-default-500">
                                <span>
                                  Created:{" "}
                                  {new Date(alert.created_at).toLocaleString()}
                                </span>
                                {alert.acknowledged_at && (
                                  <span>
                                    Acknowledged:{" "}
                                    {new Date(
                                      alert.acknowledged_at
                                    ).toLocaleString()}
                                  </span>
                                )}
                                {alert.resolved_at && (
                                  <span>
                                    Resolved:{" "}
                                    {new Date(
                                      alert.resolved_at
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {alert.estimated_cost_impact && (
                                <div className="mt-2">
                                  <span className="text-sm text-warning">
                                    Estimated Cost Impact: ₱
                                    {alert.estimated_cost_impact.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              {alert.status === "active" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    color="warning"
                                    variant="flat"
                                    startContent={
                                      <CheckCircle className="w-4 h-4" />
                                    }
                                    onPress={async () => {
                                      try {
                                        await alertsAPI.acknowledge(alert.id);
                                        // Refresh alerts
                                        const response = await alertsAPI.getAll(
                                          {
                                            equipment_id: selectedEquipment!.id,
                                            limit: 20,
                                          }
                                        );
                                        if (response.data?.success) {
                                          setEquipmentDetails((prev) => ({
                                            ...prev,
                                            alerts: safeArray<Alert>(
                                              response.data.data
                                            ),
                                          }));
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Failed to acknowledge alert:",
                                          error
                                        );
                                      }
                                    }}
                                  >
                                    Acknowledge
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="success"
                                    startContent={
                                      <CheckCircle className="w-4 h-4" />
                                    }
                                    onPress={async () => {
                                      try {
                                        await alertsAPI.resolve(alert.id);
                                        // Refresh alerts
                                        const response = await alertsAPI.getAll(
                                          {
                                            equipment_id: selectedEquipment!.id,
                                            limit: 20,
                                          }
                                        );
                                        if (response.data?.success) {
                                          setEquipmentDetails((prev) => ({
                                            ...prev,
                                            alerts: safeArray<Alert>(
                                              response.data.data
                                            ),
                                          }));
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Failed to resolve alert:",
                                          error
                                        );
                                      }
                                    }}
                                  >
                                    Resolve
                                  </Button>
                                </div>
                              )}

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
              {equipment.map((item) => {
                const conditionScore = getConditionScore(item);
                const healthStatus = getHealthStatus(conditionScore);
                const typeInfo = getTypeInfo(item.equipment_type);
                const statusInfo = getStatusInfo(item.status);
                const equipmentAlerts = getEquipmentAlerts(item.id);
                const criticalAlerts = equipmentAlerts.filter(
                  (a) => a.severity === "critical"
                ).length;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{typeInfo.icon}</div>
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
                          {item.installation_date && (
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
                          color={typeInfo.color as any}
                          size="sm"
                          variant="flat"
                        >
                          {typeInfo.label}
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
                          color={statusInfo.color as any}
                          size="sm"
                          variant="flat"
                        >
                          {statusInfo.label}
                        </Chip>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {item.power_rating_kw && (
                          <div className="flex items-center text-xs">
                            <Zap className="w-3 h-3 mr-1 text-primary" />
                            <span>{item.power_rating_kw} kW</span>
                          </div>
                        )}
                        {item.voltage_rating && (
                          <div className="flex items-center text-xs">
                            <Plug className="w-3 h-3 mr-1 text-warning" />
                            <span>{item.voltage_rating} V</span>
                          </div>
                        )}
                        {item.current_rating_a && (
                          <div className="flex items-center text-xs">
                            <Activity className="w-3 h-3 mr-1 text-success" />
                            <span>{item.current_rating_a} A</span>
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="text-xs text-default-500">
                            S/N: {item.serial_number}
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
                                onPress={() => openAlertsModal(item)}
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
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openViewModal(item)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openMaintenanceModal(item)}
                          title="Maintenance Schedule"
                        >
                          <Wrench className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openAnalyticsModal(item)}
                          title="Performance Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openQRModal(item)}
                          title="QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEditModal(item)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(item)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-between items-center p-4">
              <div className="text-sm text-default-500">
                Showing{" "}
                {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                {Math.min(
                  pagination.current_page * pagination.per_page,
                  pagination.total_count
                )}{" "}
                of {pagination.total_count} equipment
              </div>
              <Pagination
                total={pagination.total_pages}
                page={pagination.current_page}
                onChange={(page) =>
                  setPagination((prev) => ({ ...prev, current_page: page }))
                }
                showControls
                showShadow
              />
            </div>
          )}
        </CardBody>
      </Card>