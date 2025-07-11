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
} from "@/types/api-types";

// Enhanced interfaces
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

interface MaintenanceRecord {
  id: number;
  equipment_id: number;
  maintenance_type: string;
  scheduled_date: string;
  completed_date?: string;
  technician_id?: number;
  description: string;
  work_performed?: string;
  cost?: number;
  downtime_minutes?: number;
  status: string;
  priority: string;
  maintenance_notes?: string;
}

// FIXED: Complete equipment types matching the database
const equipmentTypes = [
  { key: "hvac" as const, label: "HVAC", icon: "🌡️", color: "primary" },
  { key: "lighting" as const, label: "Lighting", icon: "💡", color: "warning" },
  { key: "motor" as const, label: "Motor", icon: "⚙️", color: "secondary" },
  {
    key: "transformer" as const,
    label: "Transformer",
    icon: "🔌",
    color: "success",
  },
  { key: "panel" as const, label: "Panel", icon: "📋", color: "default" },
  { key: "ups" as const, label: "UPS", icon: "🔋", color: "primary" },
  {
    key: "generator" as const,
    label: "Generator",
    icon: "⚡",
    color: "danger",
  },
  { key: "others" as const, label: "Others", icon: "🔧", color: "default" },
];

// FIXED: Status options matching database ENUM
const statusOptions = [
  { key: "active" as const, label: "Active", color: "success" },
  { key: "maintenance" as const, label: "Maintenance", color: "warning" },
  { key: "faulty" as const, label: "Faulty", color: "danger" },
  { key: "inactive" as const, label: "Inactive", color: "default" },
];

const maintenanceUrgencyOptions = [
  { key: "low", label: "Low Priority", color: "success" },
  { key: "medium", label: "Medium Priority", color: "warning" },
  { key: "high", label: "High Priority", color: "danger" },
  { key: "critical", label: "Critical", color: "danger" },
];

const healthStatusOptions = [
  { key: "excellent", label: "Excellent", color: "success", range: [90, 100] },
  { key: "good", label: "Good", color: "primary", range: [75, 89] },
  { key: "fair", label: "Fair", color: "warning", range: [60, 74] },
  { key: "poor", label: "Poor", color: "danger", range: [40, 59] },
  { key: "critical", label: "Critical", color: "danger", range: [0, 39] },
];

// Type definitions
type EquipmentType =
  | "hvac"
  | "lighting"
  | "motor"
  | "transformer"
  | "panel"
  | "ups"
  | "generator"
  | "others";
type EquipmentStatus = "active" | "maintenance" | "faulty" | "inactive";

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
  const [buildingFilter, setBuildingFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [maintenanceUrgencyFilter, setMaintenanceUrgencyFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
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
  const [equipmentDetails, setEquipmentDetails] = useState<any>(null);
  const [equipmentAlerts, setEquipmentAlerts] = useState<Alert[]>([]);
  const [equipmentAnalytics, setEquipmentAnalytics] = useState<any>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<
    MaintenanceRecord[]
  >([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    building_id: "",
    equipment_type: "hvac" as EquipmentType,
    model: "",
    manufacturer: "",
    power_rating_kw: "",
    voltage_rating: "",
    installation_date: "",
    maintenance_schedule: "monthly",
    location: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Maintenance Form
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    maintenance_type: "preventive",
    scheduled_date: "",
    description: "",
    priority: "medium",
    notes: "",
  });

  // Utility Functions
  function safeArray<T>(input: any): T[] {
    return Array.isArray(input) ? input : [];
  }

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

  const getNextMaintenanceDate = (equipment: Equipment): string | null => {
    if (equipment.next_maintenance_date) {
      return equipment.next_maintenance_date;
    }

    if (equipment.maintenance_info?.next_maintenance_due) {
      return equipment.maintenance_info.next_maintenance_due;
    }

    if (equipment.installation_date && equipment.maintenance_interval_days) {
      const lastMaintenance = equipment.last_maintenance_date
        ? new Date(equipment.last_maintenance_date)
        : new Date(equipment.installation_date);

      const nextDate = new Date(lastMaintenance);
      nextDate.setDate(
        nextDate.getDate() + equipment.maintenance_interval_days
      );
      return nextDate.toISOString().split("T")[0];
    }

    return null;
  };

  const getMaintenanceRiskLevel = (equipment: Equipment): string => {
    if (equipment.maintenance_risk_level) {
      return equipment.maintenance_risk_level;
    }

    const age = getEquipmentAge(equipment);
    const condition = getEquipmentConditionScore(equipment);

    if (condition < 60 || age > 10) return "high";
    if (condition < 75 || age > 7) return "medium";
    return "low";
  };

  const getEquipmentConditionScore = (equipment: Equipment): number => {
    if (equipment.condition_score) return equipment.condition_score;

    if (equipment.health_status) {
      const healthMap: Record<string, number> = {
        excellent: 95,
        good: 80,
        fair: 65,
        poor: 45,
        critical: 25,
      };
      return healthMap[equipment.health_status] || 85;
    }

    return 85;
  };

  const getMaintenanceUrgency = (
    equipment: Equipment
  ): { level: string; color: string; days: number } => {
    if (
      equipment.maintenance_urgency !== undefined &&
      equipment.maintenance_urgency !== null
    ) {
      const urgency = equipment.maintenance_urgency;
      if (urgency === 0) return { level: "none", color: "success", days: 0 };
      if (urgency <= 25)
        return { level: "low", color: "success", days: urgency };
      if (urgency <= 50)
        return { level: "medium", color: "primary", days: urgency };
      if (urgency <= 75)
        return { level: "high", color: "warning", days: urgency };
      return { level: "critical", color: "danger", days: urgency };
    }

    const nextMaintenanceDate = getNextMaintenanceDate(equipment);

    if (!nextMaintenanceDate) {
      return { level: "unknown", color: "default", days: 0 };
    }

    const daysUntil = Math.ceil(
      (new Date(nextMaintenanceDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      return { level: "overdue", color: "danger", days: Math.abs(daysUntil) };
    } else if (daysUntil <= 3) {
      return { level: "critical", color: "danger", days: daysUntil };
    } else if (daysUntil <= 7) {
      return { level: "high", color: "warning", days: daysUntil };
    } else if (daysUntil <= 14) {
      return { level: "medium", color: "primary", days: daysUntil };
    } else {
      return { level: "low", color: "success", days: daysUntil };
    }
  };

  const getHealthStatusInfo = (score: number) => {
    const status =
      healthStatusOptions.find(
        (s) => score >= s.range[0] && score <= s.range[1]
      ) || healthStatusOptions[4];
    return status;
  };

  const getEquipmentAlerts = (equipmentId: number): Alert[] => {
    return alerts.filter((alert) => alert.equipment_id === equipmentId);
  };

  const getTypeInfo = (type: string) => {
    return equipmentTypes.find((t) => t.key === type) || equipmentTypes[7];
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find((s) => s.key === status) || statusOptions[0];
  };

  // Equipment Statistics
  const equipmentStats: EquipmentStats = useMemo(() => {
    const stats = {
      total: equipment.length,
      operational: equipment.filter((e) => e.status === "active").length,
      maintenance: equipment.filter((e) => e.status === "maintenance").length,
      offline: equipment.filter(
        (e) => e.status === "faulty" || e.status === "inactive"
      ).length,
      avgCondition:
        equipment.length > 0
          ? equipment.reduce(
              (sum, e) => sum + getEquipmentConditionScore(e),
              0
            ) / equipment.length
          : 0,
      maintenanceDueSoon: equipment.filter((e) => {
        const nextDate = getNextMaintenanceDate(e);
        if (!nextDate) return false;
        const daysUntil = Math.ceil(
          (new Date(nextDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 7 && daysUntil > 0;
      }).length,
      maintenanceOverdue: equipment.filter((e) => {
        const nextDate = getNextMaintenanceDate(e);
        if (!nextDate) return false;
        const daysUntil = Math.ceil(
          (new Date(nextDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return daysUntil < 0;
      }).length,
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

      // Try multiple approaches to load buildings
      const attempts = [
        () => buildingsAPI.getAll({}),
        () => buildingsAPI.getAll({ status: "active" }),
        () => buildingsAPI.getAll({ building_type: "commercial" }),
        () => buildingsAPI.getAll({ limit: 100 }),
      ];

      let buildingsData: Building[] = [];

      for (const attempt of attempts) {
        try {
          const response = await attempt();
          console.log("Buildings API response:", response.data);

          if (response.data.success) {
            let data = response.data.data;

            // Handle nested data structure
            if (data && typeof data === "object" && "data" in data) {
              data = data.data;
            }

            if (Array.isArray(data) && data.length > 0) {
              buildingsData = data;
              console.log(
                `✅ Successfully loaded ${buildingsData.length} buildings`
              );
              break;
            }
          }
        } catch (attemptError) {
          console.warn("Building load attempt failed:", attemptError);
          continue;
        }
      }

      // If no buildings loaded, create a fallback
      if (buildingsData.length === 0) {
        console.warn(
          "⚠️ No buildings loaded, checking equipment for building info..."
        );
        // Extract building info from equipment data
        const buildingIds = [...new Set(equipment.map((e) => e.building_id))];
        buildingsData = buildingIds.map((id) => {
          const equipmentWithBuilding = equipment.find(
            (e) => e.building_id === id
          );
          return {
            id,
            name: equipmentWithBuilding?.building_name || `Building ${id}`,
            code: equipmentWithBuilding?.building_code || `B${id}`,
            status: "active" as const,
            building_type: equipmentWithBuilding?.building_type || "Unknown",
            address: "",
            area_sqm: 0,
            floors: 1,
          };
        });
        console.log(
          `📋 Created ${buildingsData.length} building entries from equipment data`
        );
      }

      setBuildings(buildingsData);
    } catch (error) {
      console.error("❌ Failed to load buildings:", error);
      setError("Failed to load buildings. Some features may be limited.");
    } finally {
      setBuildingsLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const params: EquipmentQueryParams = {
        page: pagination.current_page,
        limit: pagination.per_page,
        sortBy: sortBy as any,
        sortOrder,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (buildingFilter) params.building_id = Number(buildingFilter);
      if (typeFilter) params.equipment_type = typeFilter as EquipmentType;
      if (statusFilter) params.status = statusFilter as EquipmentStatus;

      console.log("📡 Loading equipment with params:", params);
      const response = await equipmentAPI.getAll(params);
      console.log("Equipment API response:", response.data);

      if (response.data.success) {
        let equipmentData = response.data.data;

        if (
          equipmentData &&
          typeof equipmentData === "object" &&
          "data" in equipmentData
        ) {
          equipmentData = equipmentData.data;
        }

        if (Array.isArray(equipmentData)) {
          console.log(`✅ Loaded ${equipmentData.length} equipment items`);
          setEquipment(equipmentData);

          if (response.data.pagination) {
            setPagination(response.data.pagination);
          } else if (equipmentData.length > 0) {
            setPagination((prev) => ({
              ...prev,
              total_count: equipmentData.length,
            }));
          }
        } else {
          console.warn("⚠️ Equipment data is not an array:", equipmentData);
          setEquipment([]);
        }
      } else {
        console.warn("⚠️ API response unsuccessful:", response.data.message);
        setEquipment([]);
      }

      // Load equipment alerts
      try {
        const alertsRes = await alertsAPI.getAll({
          severity: "critical",
          status: "active",
          limit: 50,
        });
        if (alertsRes.data.success) {
          setAlerts(safeArray<Alert>(alertsRes.data.data));
        }
      } catch (alertError) {
        console.warn("Failed to load alerts:", alertError);
      }
    } catch (error) {
      console.error("❌ Failed to load equipment:", error);
      setError("Failed to load equipment data");
      setEquipment([]);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🚀 Starting initial data load...");

      // Load equipment first to get building references
      await loadEquipment();

      // Then load buildings
      await loadBuildings();

      // Load maintenance schedule
      try {
        const maintenanceRes = await equipmentAPI.getMaintenanceSchedule();
        if (maintenanceRes.data.success) {
          setMaintenanceSchedule(maintenanceRes.data.data);
        }
      } catch (maintenanceError) {
        console.warn("Failed to load maintenance schedule:", maintenanceError);
      }

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
      await Promise.all([
        loadEquipment(),
        loadBuildings(),
        equipmentAPI
          .getMaintenanceSchedule()
          .then((res) => {
            if (res.data.success) {
              setMaintenanceSchedule(res.data.data);
            }
          })
          .catch((error) => {
            console.error("Failed to refresh maintenance schedule:", error);
          }),
      ]);
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
    maintenanceUrgencyFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !submitting) {
        refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, submitting]);

  // Modal Handlers - COMPLETE IMPLEMENTATIONS
  const openViewModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setLoadingDetails(true);
    onViewOpen();

    try {
      console.log(`🔍 Loading details for equipment ${equipment.id}...`);

      const [detailsRes, alertsRes, analyticsRes, maintenanceRes] =
        await Promise.allSettled([
          equipmentAPI.getById(equipment.id),
          alertsAPI.getAll({ equipment_id: equipment.id, limit: 10 }),
          equipmentAPI.getPerformanceAnalytics(equipment.id, "monthly"),
          equipmentAPI.getMaintenanceHistory(equipment.id),
        ]);

      // Handle equipment details
      if (detailsRes.status === "fulfilled" && detailsRes.value.data.success) {
        setEquipmentDetails(detailsRes.value.data.data);
        console.log("✅ Equipment details loaded");
      } else {
        console.warn("⚠️ Failed to load equipment details");
      }

      // Handle alerts
      if (alertsRes.status === "fulfilled" && alertsRes.value.data.success) {
        setEquipmentAlerts(safeArray<Alert>(alertsRes.value.data.data));
        console.log("✅ Equipment alerts loaded");
      } else {
        console.warn("⚠️ Failed to load equipment alerts");
        setEquipmentAlerts([]);
      }

      // Handle analytics
      if (
        analyticsRes.status === "fulfilled" &&
        analyticsRes.value.data.success
      ) {
        setEquipmentAnalytics(analyticsRes.value.data.data);
        console.log("✅ Equipment analytics loaded");
      } else {
        console.warn("⚠️ Failed to load equipment analytics");
        setEquipmentAnalytics(null);
      }

      // Handle maintenance history
      if (
        maintenanceRes.status === "fulfilled" &&
        maintenanceRes.value.data.success
      ) {
        setMaintenanceHistory(
          safeArray<MaintenanceRecord>(maintenanceRes.value.data.data)
        );
        console.log("✅ Maintenance history loaded");
      } else {
        console.warn("⚠️ Failed to load maintenance history");
        setMaintenanceHistory([]);
      }
    } catch (error) {
      console.error("❌ Failed to load equipment details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openMaintenanceModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setLoadingDetails(true);

    try {
      const response = await equipmentAPI.getMaintenanceHistory(equipment.id);
      if (response.data.success) {
        setMaintenanceHistory(safeArray<MaintenanceRecord>(response.data.data));
      }
    } catch (error) {
      console.error("Failed to load maintenance history:", error);
      setMaintenanceHistory([]);
    } finally {
      setLoadingDetails(false);
    }

    onMaintenanceOpen();
  };

  const openAlertsModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setLoadingDetails(true);

    try {
      const response = await alertsAPI.getAll({
        equipment_id: equipment.id,
        limit: 20,
        sortBy: "created_at",
        sortOrder: "DESC",
      });
      if (response.data.success) {
        setEquipmentAlerts(safeArray<Alert>(response.data.data));
      }
    } catch (error) {
      console.error("Failed to load equipment alerts:", error);
      setEquipmentAlerts([]);
    } finally {
      setLoadingDetails(false);
    }

    onAlertsOpen();
  };

  const openAnalyticsModal = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setLoadingDetails(true);

    try {
      const response = await equipmentAPI.getPerformanceAnalytics(
        equipment.id,
        "quarterly"
      );
      if (response.data.success) {
        setEquipmentAnalytics(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setEquipmentAnalytics(null);
    } finally {
      setLoadingDetails(false);
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
      building_id: "",
      equipment_type: "hvac",
      model: "",
      manufacturer: "",
      power_rating_kw: "",
      voltage_rating: "",
      installation_date: "",
      maintenance_schedule: "monthly",
      location: "",
      notes: "",
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Equipment name is required";
    if (!formData.building_id) errors.building_id = "Building is required";
    if (!formData.manufacturer.trim())
      errors.manufacturer = "Manufacturer is required";
    if (!formData.model.trim()) errors.model = "Model is required";
    if (!formData.power_rating_kw || isNaN(Number(formData.power_rating_kw))) {
      errors.power_rating_kw = "Valid power rating is required";
    }
    if (!formData.location.trim()) errors.location = "Location is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const equipmentData: Partial<Equipment> = {
        name: formData.name,
        building_id: Number(formData.building_id),
        equipment_type: formData.equipment_type,
        model: formData.model,
        manufacturer: formData.manufacturer,
        power_rating_kw: Number(formData.power_rating_kw),
        voltage_rating_v: formData.voltage_rating
          ? Number(formData.voltage_rating)
          : undefined,
        installation_date: formData.installation_date || undefined,
        location: formData.location,
      };

      console.log("🔨 Creating equipment:", equipmentData);
      const response = await equipmentAPI.create(equipmentData);

      if (response.data.success) {
        console.log("✅ Equipment created successfully");
        await loadEquipment();
        onCreateClose();
        resetForm();
      } else {
        console.error("❌ Failed to create equipment:", response.data.message);
        setError("Failed to create equipment: " + response.data.message);
      }
    } catch (error) {
      console.error("❌ Failed to create equipment:", error);
      setError("Failed to create equipment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEquipment || !validateForm()) return;

    try {
      setSubmitting(true);

      const equipmentData: Partial<Equipment> = {
        name: formData.name,
        building_id: Number(formData.building_id),
        equipment_type: formData.equipment_type,
        model: formData.model,
        manufacturer: formData.manufacturer,
        power_rating_kw: Number(formData.power_rating_kw),
        voltage_rating_v: formData.voltage_rating
          ? Number(formData.voltage_rating)
          : undefined,
        installation_date: formData.installation_date || undefined,
        location: formData.location,
      };

      console.log("✏️ Updating equipment:", equipmentData);
      const response = await equipmentAPI.update(
        selectedEquipment.id,
        equipmentData
      );

      if (response.data.success) {
        console.log("✅ Equipment updated successfully");
        await loadEquipment();
        onEditClose();
        resetForm();
        setSelectedEquipment(null);
      } else {
        console.error("❌ Failed to update equipment:", response.data.message);
        setError("Failed to update equipment: " + response.data.message);
      }
    } catch (error) {
      console.error("❌ Failed to update equipment:", error);
      setError("Failed to update equipment. Please try again.");
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

      if (response.data.success) {
        console.log("✅ Equipment deleted successfully");
        await loadEquipment();
      } else {
        console.error("❌ Failed to delete equipment:", response.data.message);
        setError("Failed to delete equipment: " + response.data.message);
      }
    } catch (error) {
      console.error("❌ Failed to delete equipment:", error);
      setError("Failed to delete equipment. Please try again.");
    }
  };

  const openEditModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      building_id: equipment.building_id.toString(),
      equipment_type: equipment.equipment_type,
      model: equipment.model || "",
      manufacturer: equipment.manufacturer || "",
      power_rating_kw: equipment.power_rating_kw?.toString() || "",
      voltage_rating: equipment.voltage_rating_v?.toString() || "",
      installation_date: equipment.installation_date || "",
      maintenance_schedule:
        equipment.maintenance_info?.maintenance_type || "monthly",
      location: equipment.location || "",
      notes: "",
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
        priority: maintenanceFormData.priority,
        maintenance_notes: maintenanceFormData.notes,
        status: "scheduled",
      };

      console.log("📝 Logging maintenance:", maintenanceData);
      const response = await equipmentAPI.logMaintenance(
        selectedEquipment.id,
        maintenanceData
      );

      if (response.data.success) {
        console.log("✅ Maintenance logged successfully");
        // Reload maintenance history
        const historyRes = await equipmentAPI.getMaintenanceHistory(
          selectedEquipment.id
        );
        if (historyRes.data.success) {
          setMaintenanceHistory(
            safeArray<MaintenanceRecord>(historyRes.data.data)
          );
        }

        // Reset form
        setMaintenanceFormData({
          maintenance_type: "preventive",
          scheduled_date: "",
          description: "",
          priority: "medium",
          notes: "",
        });
      } else {
        console.error("❌ Failed to log maintenance:", response.data.message);
        setError("Failed to log maintenance: " + response.data.message);
      }
    } catch (error) {
      console.error("❌ Failed to log maintenance:", error);
      setError("Failed to log maintenance. Please try again.");
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

  const handleMaintenanceUrgencyFilterChange = (
    keys: "all" | Set<React.Key>
  ) => {
    const selectedKey = keys === "all" ? "" : (Array.from(keys)[0] as string);
    setMaintenanceUrgencyFilter(selectedKey || "");
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
      maintenance_schedule: selectedKey || "monthly",
    }));
  };

  // Filter options
  const buildingFilterOptions = [
    { key: "", label: "All Buildings" },
    ...(Array.isArray(buildings)
      ? buildings.map((building) => ({
          key: building.id.toString(),
          label: building.name,
        }))
      : []),
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
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => {
              resetForm();
              onCreateOpen();
            }}
            isDisabled={buildings.length === 0 && !buildingsLoading}
          >
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics Dashboard */}
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
                <p className="text-sm text-default-600">Maintenance Due</p>
                <p className="text-2xl font-bold text-warning">
                  {equipmentStats.maintenanceDueSoon}
                </p>
                <p className="text-xs text-default-500">
                  {equipmentStats.maintenanceOverdue} overdue
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
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
                    getHealthStatusInfo(equipmentStats.avgCondition)
                      .color as any
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

      {/* Enhanced Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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

            <Select
              placeholder="Urgency"
              selectedKeys={
                maintenanceUrgencyFilter ? [maintenanceUrgencyFilter] : []
              }
              onSelectionChange={handleMaintenanceUrgencyFilterChange}
            >
              {maintenanceUrgencyOptions.map((option) => (
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
                setMaintenanceUrgencyFilter("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Equipment table with maintenance insights">
            <TableHeader>
              <TableColumn>Equipment</TableColumn>
              <TableColumn>Type & Building</TableColumn>
              <TableColumn>Health Status</TableColumn>
              <TableColumn>Maintenance</TableColumn>
              <TableColumn>Performance</TableColumn>
              <TableColumn>Alerts</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No equipment found. Try adjusting your filters or add new equipment.">
              {equipment.map((item) => {
                const maintenanceUrgency = getMaintenanceUrgency(item);
                const healthStatus = getHealthStatusInfo(
                  getEquipmentConditionScore(item)
                );
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
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getEquipmentConditionScore(item).toFixed(1)}%
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
                          aria-label={`Equipment health: ${getEquipmentConditionScore(item).toFixed(1)}%`}
                          value={getEquipmentConditionScore(item)}
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
                      <div className="space-y-2">
                        <Chip
                          color={maintenanceUrgency.color as any}
                          size="sm"
                          variant="flat"
                          startContent={
                            maintenanceUrgency.level === "overdue" ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )
                          }
                        >
                          {maintenanceUrgency.level === "overdue"
                            ? `${maintenanceUrgency.days}d overdue`
                            : maintenanceUrgency.level === "none"
                              ? "Current"
                              : `${maintenanceUrgency.days}d to go`}
                        </Chip>
                        {getNextMaintenanceDate(item) && (
                          <div className="text-xs text-default-500">
                            Due:{" "}
                            {new Date(
                              getNextMaintenanceDate(item)!
                            ).toLocaleDateString()}
                          </div>
                        )}
                        {getMaintenanceRiskLevel(item) && (
                          <div className="text-xs">
                            Risk:{" "}
                            <span
                              className={`font-medium ${
                                getMaintenanceRiskLevel(item) === "high"
                                  ? "text-danger"
                                  : getMaintenanceRiskLevel(item) === "medium"
                                    ? "text-warning"
                                    : "text-success"
                              }`}
                            >
                              {getMaintenanceRiskLevel(item)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {item.performance_metrics ? (
                          <>
                            <div className="flex items-center text-xs">
                              <Zap className="w-3 h-3 mr-1 text-primary" />
                              <span>
                                {item.performance_metrics.efficiency_percentage?.toFixed(
                                  1
                                ) || "N/A"}
                                % efficiency
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <CheckCircle className="w-3 h-3 mr-1 text-success" />
                              <span>
                                {item.performance_metrics.availability_percentage?.toFixed(
                                  1
                                ) || "N/A"}
                                % uptime
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <Activity className="w-3 h-3 mr-1 text-warning" />
                              <span>
                                {item.performance_metrics.energy_consumption_kwh_day?.toFixed(
                                  1
                                ) || "0"}{" "}
                                kWh/day
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-default-500">
                            Performance data not available
                          </div>
                        )}
                        {item.power_rating_kw && (
                          <div className="text-xs text-default-500">
                            {item.power_rating_kw} kW rated
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

          {/* Enhanced Pagination */}
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

      {/* Create/Edit Equipment Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onOpenChange={isCreateOpen ? onCreateClose : onEditClose}
        size="3xl"
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
                {/* Show building loading state if needed */}
                {buildingsLoading && (
                  <div className="flex items-center p-4 bg-primary-50 rounded-lg">
                    <Spinner size="sm" color="primary" className="mr-2" />
                    <span className="text-primary">Loading buildings...</span>
                  </div>
                )}

                {/* Show warning if no buildings */}
                {buildings.length === 0 && !buildingsLoading && (
                  <div className="flex items-center p-4 bg-warning-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                    <span className="text-warning">
                      No buildings available. Please add buildings first.
                    </span>
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

                  <Select
                    label="Building"
                    placeholder={
                      buildings.length > 0
                        ? "Select building"
                        : "No buildings available"
                    }
                    selectedKeys={
                      formData.building_id ? [formData.building_id] : []
                    }
                    onSelectionChange={handleFormBuildingChange}
                    errorMessage={formErrors.building_id}
                    isInvalid={!!formErrors.building_id}
                    isRequired
                    isDisabled={buildings.length === 0}
                    isLoading={buildingsLoading}
                  >
                    {buildings.map((building) => (
                      <SelectItem key={building.id.toString()}>
                        {building.name} ({building.code})
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <Select
                    label="Maintenance Schedule"
                    selectedKeys={[formData.maintenance_schedule]}
                    onSelectionChange={handleFormMaintenanceScheduleChange}
                  >
                    <SelectItem key="weekly">Weekly</SelectItem>
                    <SelectItem key="monthly">Monthly</SelectItem>
                    <SelectItem key="quarterly">Quarterly</SelectItem>
                    <SelectItem key="annually">Annually</SelectItem>
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
                    isRequired
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
                </div>

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
                  isLoading={submitting}
                  startContent={
                    isCreateOpen ? (
                      <Plus className="w-4 h-4" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )
                  }
                  isDisabled={buildings.length === 0 && !buildingsLoading}
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
                  {selectedEquipment?.name} - Comprehensive Details
                  {loadingDetails && <Spinner size="sm" className="ml-2" />}
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
                              <div className="flex justify-between">
                                <span className="text-default-600">
                                  Power Rating:
                                </span>
                                <span className="font-medium">
                                  {selectedEquipment.power_rating_kw} kW
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-default-600">
                                  Location:
                                </span>
                                <span className="font-medium">
                                  {selectedEquipment.location}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-default-600">Age:</span>
                                <span className="font-medium">
                                  {selectedEquipment.installation_date
                                    ? `${getEquipmentAge(selectedEquipment).toFixed(1)} years`
                                    : "N/A"}
                                </span>
                              </div>
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
                                    {getEquipmentConditionScore(
                                      selectedEquipment
                                    ).toFixed(1)}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  aria-label="Equipment health score"
                                  value={getEquipmentConditionScore(
                                    selectedEquipment
                                  )}
                                  color={
                                    getHealthStatusInfo(
                                      getEquipmentConditionScore(
                                        selectedEquipment
                                      )
                                    ).color as any
                                  }
                                />
                              </div>

                              {selectedEquipment.performance_metrics && (
                                <>
                                  <div>
                                    <div className="flex justify-between mb-2">
                                      <span>Efficiency</span>
                                      <span className="font-medium">
                                        {selectedEquipment.performance_metrics.efficiency_percentage?.toFixed(
                                          1
                                        ) || "N/A"}
                                        %
                                      </span>
                                    </div>
                                    <Progress
                                      aria-label="Equipment efficiency"
                                      value={
                                        selectedEquipment.performance_metrics
                                          .efficiency_percentage || 0
                                      }
                                      color="primary"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex justify-between mb-2">
                                      <span>Availability</span>
                                      <span className="font-medium">
                                        {selectedEquipment.performance_metrics.availability_percentage?.toFixed(
                                          1
                                        ) || "N/A"}
                                        %
                                      </span>
                                    </div>
                                    <Progress
                                      aria-label="Equipment availability"
                                      value={
                                        selectedEquipment.performance_metrics
                                          .availability_percentage || 0
                                      }
                                      color="success"
                                    />
                                  </div>
                                </>
                              )}
                            </CardBody>
                          </Card>
                        </div>

                        {loadingDetails && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading additional details...
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        {equipmentDetails && (
                          <Card>
                            <CardHeader>
                              <h4 className="font-semibold">Recent Activity</h4>
                            </CardHeader>
                            <CardBody>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary">
                                    {equipmentDetails.performanceMetrics
                                      ?.totalMaintenanceCount || 0}
                                  </div>
                                  <div className="text-sm text-default-600">
                                    Total Maintenance
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-success">
                                    {equipmentDetails.performanceMetrics?.uptimePercentage?.toFixed(
                                      1
                                    ) || "N/A"}
                                    %
                                  </div>
                                  <div className="text-sm text-default-600">
                                    Uptime
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-warning">
                                    {equipmentDetails.performanceMetrics?.reliabilityScore?.toFixed(
                                      1
                                    ) || "N/A"}
                                  </div>
                                  <div className="text-sm text-default-600">
                                    Reliability Score
                                  </div>
                                </div>
                              </div>
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
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold">
                              Maintenance Schedule
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-default-600">
                                  Last Maintenance:
                                </span>
                                <div className="font-medium">
                                  {selectedEquipment.last_maintenance_date ||
                                  selectedEquipment.maintenance_info
                                    ?.last_maintenance
                                    ? new Date(
                                        selectedEquipment.last_maintenance_date ||
                                          selectedEquipment.maintenance_info
                                            .last_maintenance
                                      ).toLocaleDateString()
                                    : "No record"}
                                </div>
                              </div>
                              <div>
                                <span className="text-default-600">
                                  Next Due:
                                </span>
                                <div className="font-medium">
                                  {getNextMaintenanceDate(selectedEquipment)
                                    ? new Date(
                                        getNextMaintenanceDate(
                                          selectedEquipment
                                        )!
                                      ).toLocaleDateString()
                                    : "Not scheduled"}
                                </div>
                              </div>
                              <div>
                                <span className="text-default-600">
                                  Predicted Date:
                                </span>
                                <div className="font-medium">
                                  {selectedEquipment.predicted_maintenance_date
                                    ? new Date(
                                        selectedEquipment.predicted_maintenance_date
                                      ).toLocaleDateString()
                                    : "Not available"}
                                </div>
                              </div>
                              <div>
                                <span className="text-default-600">
                                  Risk Level:
                                </span>
                                <Chip
                                  color={
                                    getMaintenanceRiskLevel(
                                      selectedEquipment
                                    ) === "high"
                                      ? "danger"
                                      : getMaintenanceRiskLevel(
                                            selectedEquipment
                                          ) === "medium"
                                        ? "warning"
                                        : "success"
                                  }
                                  size="sm"
                                >
                                  {getMaintenanceRiskLevel(selectedEquipment)}
                                </Chip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>

                        {loadingDetails && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading maintenance history...
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        {maintenanceHistory.length > 0 && (
                          <Card>
                            <CardHeader>
                              <h4 className="font-semibold">
                                Recent Maintenance History
                              </h4>
                            </CardHeader>
                            <CardBody>
                              <div className="space-y-3">
                                {maintenanceHistory
                                  .slice(0, 5)
                                  .map((maintenance, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center p-3 bg-default-50 rounded-lg"
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {maintenance.maintenance_type ||
                                            "Maintenance"}
                                        </div>
                                        <div className="text-sm text-default-600">
                                          {maintenance.completed_date
                                            ? new Date(
                                                maintenance.completed_date
                                              ).toLocaleDateString()
                                            : "Pending"}
                                        </div>
                                        <div className="text-xs text-default-500">
                                          {maintenance.description}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-medium">
                                          ₱
                                          {maintenance.cost?.toLocaleString() ||
                                            "0"}
                                        </div>
                                        <div className="text-xs text-default-500">
                                          {maintenance.downtime_minutes || 0}{" "}
                                          min downtime
                                        </div>
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
                      key="alerts"
                      title={
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Alerts
                          {equipmentAlerts.length > 0 && (
                            <Badge
                              content={equipmentAlerts.length}
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
                        {loadingDetails && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading alerts...
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        {equipmentAlerts.length > 0 ? (
                          equipmentAlerts.map((alert) => (
                            <Card
                              key={alert.id}
                              className={`border-l-4 ${
                                alert.severity === "critical"
                                  ? "border-l-danger"
                                  : alert.severity === "high"
                                    ? "border-l-warning"
                                    : alert.severity === "medium"
                                      ? "border-l-primary"
                                      : "border-l-default"
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
                                              : alert.severity === "medium"
                                                ? "primary"
                                                : "default"
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

                    <Tab
                      key="analytics"
                      title={
                        <div className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        {loadingDetails && (
                          <Card>
                            <CardBody className="text-center py-8">
                              <Spinner size="lg" />
                              <p className="mt-4 text-default-500">
                                Loading analytics...
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        {equipmentAnalytics ? (
                          <Card>
                            <CardHeader>
                              <h4 className="font-semibold">
                                Performance Analytics
                              </h4>
                            </CardHeader>
                            <CardBody>
                              <div className="text-center py-8">
                                <BarChart3 className="w-12 h-12 text-primary mx-auto mb-3" />
                                <p className="text-default-500">
                                  Analytics data available
                                </p>
                                <p className="text-xs text-default-400">
                                  Detailed performance metrics and trends
                                </p>
                              </div>
                            </CardBody>
                          </Card>
                        ) : (
                          <Card>
                            <CardBody className="text-center py-8">
                              <BarChart3 className="w-12 h-12 text-default-400 mx-auto mb-3" />
                              <h4 className="font-medium">
                                Analytics Not Available
                              </h4>
                              <p className="text-default-500 text-sm">
                                Performance data is not available for this
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
                  Maintenance Schedule - {selectedEquipment?.name}
                </div>
              </ModalHeader>
              <ModalBody>
                <Tabs aria-label="Maintenance tabs" color="primary">
                  <Tab
                    key="schedule"
                    title={
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold">Log New Maintenance</h4>
                        </CardHeader>
                        <CardBody className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                              label="Maintenance Type"
                              selectedKeys={[
                                maintenanceFormData.maintenance_type,
                              ]}
                              onSelectionChange={(keys) => {
                                const selectedKey =
                                  keys === "all"
                                    ? "preventive"
                                    : (Array.from(keys)[0] as string);
                                setMaintenanceFormData((prev) => ({
                                  ...prev,
                                  maintenance_type: selectedKey,
                                }));
                              }}
                            >
                              <SelectItem key="preventive">
                                Preventive
                              </SelectItem>
                              <SelectItem key="corrective">
                                Corrective
                              </SelectItem>
                              <SelectItem key="predictive">
                                Predictive
                              </SelectItem>
                              <SelectItem key="emergency">Emergency</SelectItem>
                            </Select>

                            <Select
                              label="Priority"
                              selectedKeys={[maintenanceFormData.priority]}
                              onSelectionChange={(keys) => {
                                const selectedKey =
                                  keys === "all"
                                    ? "medium"
                                    : (Array.from(keys)[0] as string);
                                setMaintenanceFormData((prev) => ({
                                  ...prev,
                                  priority: selectedKey,
                                }));
                              }}
                            >
                              <SelectItem key="low">Low</SelectItem>
                              <SelectItem key="medium">Medium</SelectItem>
                              <SelectItem key="high">High</SelectItem>
                              <SelectItem key="critical">Critical</SelectItem>
                            </Select>
                          </div>

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

                      {loadingDetails && (
                        <Card>
                          <CardBody className="text-center py-8">
                            <Spinner size="lg" />
                            <p className="mt-4 text-default-500">
                              Loading maintenance history...
                            </p>
                          </CardBody>
                        </Card>
                      )}

                      {maintenanceHistory.length > 0 && (
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold">
                              Maintenance History
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3">
                              {maintenanceHistory.map((maintenance, index) => (
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
                                          maintenance.priority === "critical"
                                            ? "danger"
                                            : maintenance.priority === "high"
                                              ? "warning"
                                              : "default"
                                        }
                                        size="sm"
                                        variant="flat"
                                      >
                                        {maintenance.priority}
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
                                    <div className="font-medium">
                                      {maintenance.description}
                                    </div>
                                    <div className="text-sm text-default-600">
                                      Scheduled:{" "}
                                      {new Date(
                                        maintenance.scheduled_date
                                      ).toLocaleDateString()}
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
                                    {maintenance.work_performed && (
                                      <div className="text-xs text-default-500 mt-1">
                                        Work: {maintenance.work_performed}
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
                    key="predictions"
                    title={
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Predictions
                      </div>
                    }
                  >
                    <Card>
                      <CardBody className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-primary mx-auto mb-3" />
                        <h4 className="font-medium">Predictive Maintenance</h4>
                        <p className="text-default-500 text-sm">
                          Advanced analytics to predict maintenance needs
                        </p>
                      </CardBody>
                    </Card>
                  </Tab>
                </Tabs>
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
                  {equipmentAlerts.length > 0 && (
                    <Badge
                      content={equipmentAlerts.length}
                      color="danger"
                      size="sm"
                      className="ml-2"
                    >
                      <span className="w-2 h-2" />
                    </Badge>
                  )}
                  {loadingDetails && <Spinner size="sm" className="ml-2" />}
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {loadingDetails && (
                    <Card>
                      <CardBody className="text-center py-8">
                        <Spinner size="lg" />
                        <p className="mt-4 text-default-500">
                          Loading alerts...
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  {equipmentAlerts.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-danger">
                              {
                                equipmentAlerts.filter(
                                  (a) => a.severity === "critical"
                                ).length
                              }
                            </div>
                            <div className="text-sm text-default-600">
                              Critical
                            </div>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-warning">
                              {
                                equipmentAlerts.filter(
                                  (a) => a.severity === "high"
                                ).length
                              }
                            </div>
                            <div className="text-sm text-default-600">High</div>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {
                                equipmentAlerts.filter(
                                  (a) => a.severity === "medium"
                                ).length
                              }
                            </div>
                            <div className="text-sm text-default-600">
                              Medium
                            </div>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-success">
                              {
                                equipmentAlerts.filter(
                                  (a) => a.status === "resolved"
                                ).length
                              }
                            </div>
                            <div className="text-sm text-default-600">
                              Resolved
                            </div>
                          </CardBody>
                        </Card>
                      </div>

                      {equipmentAlerts.map((alert) => (
                        <Card
                          key={alert.id}
                          className={`border-l-4 ${
                            alert.severity === "critical"
                              ? "border-l-danger"
                              : alert.severity === "high"
                                ? "border-l-warning"
                                : alert.severity === "medium"
                                  ? "border-l-primary"
                                  : "border-l-default"
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
                                          : alert.severity === "medium"
                                            ? "primary"
                                            : "default"
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
                                  <Chip
                                    color="default"
                                    size="sm"
                                    variant="flat"
                                  >
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
                                    {new Date(
                                      alert.created_at
                                    ).toLocaleString()}
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
                                          const response =
                                            await alertsAPI.getAll({
                                              equipment_id:
                                                selectedEquipment!.id,
                                              limit: 20,
                                            });
                                          if (response.data.success) {
                                            setEquipmentAlerts(
                                              safeArray<Alert>(
                                                response.data.data
                                              )
                                            );
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
                                          const response =
                                            await alertsAPI.getAll({
                                              equipment_id:
                                                selectedEquipment!.id,
                                              limit: 20,
                                            });
                                          if (response.data.success) {
                                            setEquipmentAlerts(
                                              safeArray<Alert>(
                                                response.data.data
                                              )
                                            );
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
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </>
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
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  startContent={<RefreshCw className="w-4 h-4" />}
                  onPress={async () => {
                    if (selectedEquipment) {
                      setLoadingDetails(true);
                      try {
                        const response = await alertsAPI.getAll({
                          equipment_id: selectedEquipment.id,
                          limit: 20,
                        });
                        if (response.data.success) {
                          setEquipmentAlerts(
                            safeArray<Alert>(response.data.data)
                          );
                        }
                      } catch (error) {
                        console.error("Failed to refresh alerts:", error);
                      } finally {
                        setLoadingDetails(false);
                      }
                    }
                  }}
                >
                  Refresh
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={isAnalyticsOpen}
        onOpenChange={onAnalyticsClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Performance Analytics - {selectedEquipment?.name}
                  {loadingDetails && <Spinner size="sm" className="ml-2" />}
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  {loadingDetails && (
                    <Card>
                      <CardBody className="text-center py-8">
                        <Spinner size="lg" />
                        <p className="mt-4 text-default-500">
                          Loading analytics...
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  {selectedEquipment && (
                    <>
                      {/* Performance Metrics Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {selectedEquipment.performance_metrics?.efficiency_percentage?.toFixed(
                                1
                              ) || "N/A"}
                              %
                            </div>
                            <div className="text-sm text-default-600">
                              Efficiency
                            </div>
                            <Progress
                              aria-label="Efficiency"
                              value={
                                selectedEquipment.performance_metrics
                                  ?.efficiency_percentage || 0
                              }
                              color="primary"
                              size="sm"
                              className="mt-2"
                            />
                          </CardBody>
                        </Card>

                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-success">
                              {selectedEquipment.performance_metrics?.availability_percentage?.toFixed(
                                1
                              ) || "N/A"}
                              %
                            </div>
                            <div className="text-sm text-default-600">
                              Availability
                            </div>
                            <Progress
                              aria-label="Availability"
                              value={
                                selectedEquipment.performance_metrics
                                  ?.availability_percentage || 0
                              }
                              color="success"
                              size="sm"
                              className="mt-2"
                            />
                          </CardBody>
                        </Card>

                        <Card>
                          <CardBody className="text-center">
                            <div className="text-2xl font-bold text-warning">
                              {getEquipmentConditionScore(
                                selectedEquipment
                              ).toFixed(1)}
                              %
                            </div>
                            <div className="text-sm text-default-600">
                              Health Score
                            </div>
                            <Progress
                              aria-label="Health Score"
                              value={getEquipmentConditionScore(
                                selectedEquipment
                              )}
                              color={
                                getHealthStatusInfo(
                                  getEquipmentConditionScore(selectedEquipment)
                                ).color as any
                              }
                              size="sm"
                              className="mt-2"
                            />
                          </CardBody>
                        </Card>
                      </div>

                      {/* Energy Consumption */}
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <Zap className="w-4 h-4 mr-2" />
                            Energy Consumption
                          </h4>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-default-600">
                                Daily Consumption
                              </div>
                              <div className="text-xl font-bold">
                                {selectedEquipment.performance_metrics?.energy_consumption_kwh_day?.toFixed(
                                  2
                                ) || "0"}{" "}
                                kWh
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-default-600">
                                Power Rating
                              </div>
                              <div className="text-xl font-bold">
                                {selectedEquipment.power_rating_kw} kW
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-default-600">
                                Operating Hours Today
                              </div>
                              <div className="text-xl font-bold">
                                {selectedEquipment.performance_metrics
                                  ?.operating_hours_today || "0"}{" "}
                                hours
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-default-600">
                                Load Factor
                              </div>
                              <div className="text-xl font-bold">
                                {selectedEquipment.current_status
                                  ?.current_load_percentage || "N/A"}
                                %
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Reliability Metrics */}
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Reliability Metrics
                          </h4>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-default-600">
                                MTBF (Mean Time Between Failures)
                              </div>
                              <div className="text-xl font-bold">
                                {selectedEquipment.performance_metrics
                                  ?.mtbf_hours || "N/A"}{" "}
                                hours
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-default-600">
                                MTTR (Mean Time To Repair)
                              </div>
                              <div className="text-xl font-bold">
                                {selectedEquipment.performance_metrics
                                  ?.mttr_hours || "N/A"}{" "}
                                hours
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Current Status */}
                      {selectedEquipment.current_status && (
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold flex items-center">
                              <Activity className="w-4 h-4 mr-2" />
                              Current Status
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <div className="text-sm text-default-600">
                                  Operational Status
                                </div>
                                <Chip
                                  color={
                                    selectedEquipment.current_status
                                      .operational_status === "running"
                                      ? "success"
                                      : selectedEquipment.current_status
                                            .operational_status === "error"
                                        ? "danger"
                                        : "warning"
                                  }
                                  size="sm"
                                >
                                  {
                                    selectedEquipment.current_status
                                      .operational_status
                                  }
                                </Chip>
                              </div>
                              {selectedEquipment.current_status
                                .temperature_c && (
                                <div>
                                  <div className="text-sm text-default-600">
                                    Temperature
                                  </div>
                                  <div className="text-lg font-bold">
                                    {
                                      selectedEquipment.current_status
                                        .temperature_c
                                    }
                                    °C
                                  </div>
                                </div>
                              )}
                              {selectedEquipment.current_status
                                .vibration_level && (
                                <div>
                                  <div className="text-sm text-default-600">
                                    Vibration Level
                                  </div>
                                  <div className="text-lg font-bold">
                                    {
                                      selectedEquipment.current_status
                                        .vibration_level
                                    }
                                  </div>
                                </div>
                              )}
                              {selectedEquipment.current_status
                                .pressure_bar && (
                                <div>
                                  <div className="text-sm text-default-600">
                                    Pressure
                                  </div>
                                  <div className="text-lg font-bold">
                                    {
                                      selectedEquipment.current_status
                                        .pressure_bar
                                    }{" "}
                                    bar
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      )}

                      {equipmentAnalytics ? (
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold">
                              Advanced Analytics
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="text-center py-8">
                              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-3" />
                              <p className="text-default-500">
                                Advanced analytics data available
                              </p>
                              <p className="text-xs text-default-400">
                                Detailed performance trends and predictions
                              </p>
                            </div>
                          </CardBody>
                        </Card>
                      ) : (
                        <Card>
                          <CardBody className="text-center py-8">
                            <Database className="w-12 h-12 text-default-400 mx-auto mb-3" />
                            <h4 className="font-medium">Historical Data</h4>
                            <p className="text-default-500 text-sm">
                              Collecting performance data for trend analysis
                            </p>
                          </CardBody>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  startContent={<Download className="w-4 h-4" />}
                  onPress={() => {
                    console.log(
                      "Export analytics data for:",
                      selectedEquipment?.id
                    );
                  }}
                >
                  Export Data
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
              <ModalBody className="text-center">
                {selectedEquipment && (
                  <div className="space-y-6">
                    {/* QR Code Display */}
                    <div className="bg-white p-8 rounded-lg inline-block border-2 border-default-200">
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border">
                        <div className="text-center">
                          <QrCode className="w-32 h-32 text-gray-400 mx-auto mb-2" />
                          <div className="text-xs text-gray-500">
                            QR Code Preview
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Info */}
                    <div className="space-y-2">
                      <div className="font-medium text-lg">
                        {selectedEquipment.code ||
                          `EQ-${selectedEquipment.id.toString().padStart(4, "0")}`}
                      </div>
                      <div className="text-default-600">
                        {selectedEquipment.name}
                      </div>
                      <div className="text-sm text-default-500">
                        {selectedEquipment.manufacturer}{" "}
                        {selectedEquipment.model}
                      </div>
                      <div className="text-xs text-default-400">
                        QR ID:{" "}
                        {selectedEquipment.qr_code ||
                          `QR_${selectedEquipment.id}_2024`}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <Card>
                      <CardBody className="text-left space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Building:</span>
                          <span>{getBuildingName(selectedEquipment)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Location:</span>
                          <span>{selectedEquipment.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Type:</span>
                          <span>
                            {
                              getTypeInfo(selectedEquipment.equipment_type)
                                .label
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">Status:</span>
                          <Chip
                            color={
                              getStatusInfo(selectedEquipment.status)
                                .color as any
                            }
                            size="sm"
                          >
                            {getStatusInfo(selectedEquipment.status).label}
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Instructions */}
                    <div className="text-xs text-default-400 bg-default-50 p-3 rounded-lg">
                      <div className="flex items-start">
                        <QrCode className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium mb-1">
                            Quick Access Instructions:
                          </div>
                          <ul className="space-y-1 text-left">
                            <li>
                              • Scan this QR code for instant equipment access
                            </li>
                            <li>• View maintenance logs and schedules</li>
                            <li>• Report issues and log maintenance</li>
                            <li>• Access equipment specifications</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="secondary"
                  startContent={<FileText className="w-4 h-4" />}
                  onPress={() => {
                    console.log("Print QR code for:", selectedEquipment?.id);
                  }}
                >
                  Print
                </Button>
                <Button
                  color="primary"
                  startContent={<Download className="w-4 h-4" />}
                  onPress={() => {
                    console.log("Download QR code for:", selectedEquipment?.id);
                  }}
                >
                  Download
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
