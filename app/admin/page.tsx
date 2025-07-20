// app/admin/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend,
} from "recharts";

// HeroUI Components
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Skeleton } from "@heroui/skeleton";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";

// Icons
import {
  Zap,
  Building as BuildingIcon,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Gauge,
  Shield,
  CheckCircle,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Monitor,
  FileText,
  Users,
  Clock,
  Leaf,
  Eye,
  Target,
  Award,
  Wrench,
  AlertCircle,
  Thermometer,
  Battery,
  Cpu,
  HardDrive,
  Wifi,
  Calendar,
  Download,
  ExternalLink,
  Info,
  MapPin,
  Lightbulb,
  RotateCcw,
  Home,
  Database,
  Signal,
  Power,
  WifiOff,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// Custom Hooks
import {
  useDashboardOverview,
  useDashboardRealTime,
  useEnergySummary,
  usePowerQualityData,
  useAlerts,
  useBuildings,
  useEquipment,
  useReports,
  useAnalyticsDashboard,
  useMaintenanceSchedule,
  useAlertStatistics,
  useApiStatus,
} from "@/hooks/useApi";

// API Direct Calls for Complex Operations
import {
  dashboardAPI,
  monitoringAPI,
  complianceAPI,
  auditsAPI,
} from "@/lib/api";

// ✅ FIXED: Import response handler for TypeScript error fix
import { handleArrayApiResponse } from "@/lib/api-response-handler";

// Types
import type {
  DashboardOverview,
  Alert,
  Building,
  Equipment,
  EnergySummary,
  PowerQualitySummary,
  AuditSummary,
  ComplianceSummary,
  Report,
  BackgroundJob,
  SystemHealthStatus,
} from "@/types/api-types";

import { clsx } from "clsx";

interface SystemMetric {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  icon: React.ComponentType<any>;
  color: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
  description?: string;
  target?: number;
  loading?: boolean;
  error?: boolean;
}

const COLORS = {
  primary: "#0EA5E9",
  secondary: "#8B5CF6",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#7C3AED",
  orange: "#F97316",
  pink: "#EC4899",
  emerald: "#10B981",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.purple,
  COLORS.orange,
  COLORS.pink,
];

export default function ComprehensiveEnergyDashboard() {
  // ✅ Using Custom Hooks for Primary Data
  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = useDashboardOverview({
    immediate: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: realTimeMetrics,
    loading: realTimeLoading,
    error: realTimeError,
    refresh: refreshRealTime,
  } = useDashboardRealTime({
    immediate: true,
    refreshInterval: 10 * 1000, // 10 seconds
  });

  const {
    data: energySummary,
    loading: energyLoading,
    error: energyError,
    refresh: refreshEnergy,
  } = useEnergySummary(
    { period: "monthly" },
    {
      immediate: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  const {
    data: buildings,
    loading: buildingsLoading,
    error: buildingsError,
    refresh: refreshBuildings,
  } = useBuildings(
    {
      limit: 50,
      status: "active",
      sortBy: "name",
      sortOrder: "ASC",
    },
    {
      immediate: true,
      refreshInterval: 10 * 60 * 1000, // 10 minutes
    }
  );

  const {
    data: equipment,
    loading: equipmentLoading,
    error: equipmentError,
    refresh: refreshEquipment,
  } = useEquipment(
    {
      limit: 100,
      sortBy: "name",
      sortOrder: "ASC",
    },
    {
      immediate: true,
      refreshInterval: 10 * 60 * 1000, // 10 minutes
    }
  );

  const {
    data: alerts,
    loading: alertsLoading,
    error: alertsError,
    refresh: refreshAlerts,
  } = useAlerts(
    {
      status: "active",
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "DESC",
    },
    {
      immediate: true,
      refreshInterval: 30 * 1000, // 30 seconds
    }
  );

  const {
    data: alertStatistics,
    loading: alertStatsLoading,
    error: alertStatsError,
    refresh: refreshAlertStats,
  } = useAlertStatistics(
    {},
    {
      immediate: true,
      refreshInterval: 60 * 1000, // 1 minute
    }
  );

  const {
    data: maintenanceSchedule,
    loading: maintenanceLoading,
    error: maintenanceError,
    refresh: refreshMaintenance,
  } = useMaintenanceSchedule(undefined, {
    immediate: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics,
  } = useAnalyticsDashboard({
    immediate: true,
    refreshInterval: 15 * 60 * 1000, // 15 minutes
  });

  const {
    data: recentReports,
    loading: reportsLoading,
    error: reportsError,
    refresh: refreshReports,
  } = useReports(
    {
      limit: 5,
      status: "completed",
      sortBy: "createdAt",
      sortOrder: "DESC",
    },
    {
      immediate: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  // ✅ Additional State for Complex Data
  const [powerQualitySummary, setPowerQualitySummary] =
    useState<PowerQualitySummary | null>(null);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [complianceSummary, setComplianceSummary] =
    useState<ComplianceSummary | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(
    null
  );
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);

  // ✅ UI State
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ Individual loading states for complex data
  const [loadingStates, setLoadingStates] = useState({
    powerQuality: true,
    audit: true,
    compliance: true,
    systemHealth: true,
    monitoring: true,
    jobs: true,
  });

  // ✅ Individual error states
  const [errorStates, setErrorStates] = useState({
    powerQuality: null as string | null,
    audit: null as string | null,
    compliance: null as string | null,
    systemHealth: null as string | null,
    monitoring: null as string | null,
    jobs: null as string | null,
  });

  // ✅ API Status Monitoring
  const { status: apiStatus, isConnected } = useApiStatus();

  // ✅ Helper Functions
  const updateLoadingState = useCallback(
    (key: keyof typeof loadingStates, isLoading: boolean) => {
      setLoadingStates((prev) => ({ ...prev, [key]: isLoading }));
    },
    []
  );

  const updateErrorState = useCallback(
    (key: keyof typeof errorStates, error: string | null) => {
      setErrorStates((prev) => ({ ...prev, [key]: error }));
    },
    []
  );

  // ✅ Load Complex Data (Not Available in Hooks)
  const loadPowerQualitySummary = useCallback(async () => {
    try {
      updateLoadingState("powerQuality", true);
      updateErrorState("powerQuality", null);
      console.log("🔌 Loading power quality summary...");

      const response = await dashboardAPI.getPowerQualitySummary();

      if (response.data.success && response.data.data) {
        setPowerQualitySummary(response.data.data);
        console.log("✅ Power quality summary loaded:", response.data.data);
      } else {
        console.warn("⚠️ Power quality summary response unsuccessful");
        updateErrorState(
          "powerQuality",
          "Power quality summary data not available"
        );
        setPowerQualitySummary(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load power quality summary:", error);
      updateErrorState(
        "powerQuality",
        error?.response?.data?.message || "Failed to load power quality summary"
      );
      setPowerQualitySummary(null);
    } finally {
      updateLoadingState("powerQuality", false);
    }
  }, [updateLoadingState, updateErrorState]);

  const loadAuditSummary = useCallback(async () => {
    try {
      updateLoadingState("audit", true);
      updateErrorState("audit", null);
      console.log("📋 Loading audit summary...");

      const response = await dashboardAPI.getAuditSummary();

      if (response.data.success && response.data.data) {
        setAuditSummary(response.data.data);
        console.log("✅ Audit summary loaded:", response.data.data);
      } else {
        console.warn("⚠️ Audit summary response unsuccessful");
        updateErrorState("audit", "Audit summary data not available");
        setAuditSummary(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load audit summary:", error);
      updateErrorState(
        "audit",
        error?.response?.data?.message || "Failed to load audit summary"
      );
      setAuditSummary(null);
    } finally {
      updateLoadingState("audit", false);
    }
  }, [updateLoadingState, updateErrorState]);

  const loadComplianceSummary = useCallback(async () => {
    try {
      updateLoadingState("compliance", true);
      updateErrorState("compliance", null);
      console.log("✅ Loading compliance summary...");

      const response = await dashboardAPI.getComplianceSummary();

      if (response.data.success && response.data.data) {
        setComplianceSummary(response.data.data);
        console.log("✅ Compliance summary loaded:", response.data.data);
      } else {
        console.warn("⚠️ Compliance summary response unsuccessful");
        updateErrorState("compliance", "Compliance summary data not available");
        setComplianceSummary(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load compliance summary:", error);
      updateErrorState(
        "compliance",
        error?.response?.data?.message || "Failed to load compliance summary"
      );
      setComplianceSummary(null);
    } finally {
      updateLoadingState("compliance", false);
    }
  }, [updateLoadingState, updateErrorState]);

  const loadSystemHealth = useCallback(async () => {
    try {
      updateLoadingState("systemHealth", true);
      updateErrorState("systemHealth", null);
      console.log("💊 Loading system health...");

      const response = await monitoringAPI.getSystemHealth();

      if (response.data.success && response.data.data) {
        setSystemHealth(response.data.data);
        console.log("✅ System health loaded:", response.data.data);
      } else {
        console.warn("⚠️ System health response unsuccessful");
        updateErrorState("systemHealth", "System health data not available");
        setSystemHealth(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load system health:", error);
      updateErrorState(
        "systemHealth",
        error?.response?.data?.message || "Failed to load system health"
      );
      setSystemHealth(null);
    } finally {
      updateLoadingState("systemHealth", false);
    }
  }, [updateLoadingState, updateErrorState]);

  const loadMonitoringData = useCallback(async () => {
    try {
      updateLoadingState("monitoring", true);
      updateErrorState("monitoring", null);
      console.log("🖥️ Loading monitoring dashboard...");

      const response = await monitoringAPI.getDashboard();

      if (response.data.success && response.data.data) {
        setMonitoringData(response.data.data);
        console.log("✅ Monitoring dashboard loaded:", response.data.data);
      } else {
        console.warn("⚠️ Monitoring dashboard response unsuccessful");
        updateErrorState("monitoring", "Monitoring data not available");
        setMonitoringData(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load monitoring data:", error);
      updateErrorState(
        "monitoring",
        error?.response?.data?.message || "Failed to load monitoring data"
      );
      setMonitoringData(null);
    } finally {
      updateLoadingState("monitoring", false);
    }
  }, [updateLoadingState, updateErrorState]);

  // ✅ FIXED: loadBackgroundJobs function with proper TypeScript handling
  const loadBackgroundJobs = useCallback(async () => {
    try {
      updateLoadingState("jobs", true);
      updateErrorState("jobs", null);
      console.log("⚡ Loading background jobs...");

      const response = await monitoringAPI.getJobs({
        limit: 10,
        status: "running",
      });

      // ✅ Use your existing response handler - handles all edge cases and TypeScript issues
      const result = handleArrayApiResponse<BackgroundJob>(response);

      if (result.success) {
        setBackgroundJobs(result.data);
        console.log(`✅ Loaded ${result.data.length} background jobs`);
      } else {
        console.warn("⚠️ Background jobs response unsuccessful");
        updateErrorState(
          "jobs",
          result.error || "Background jobs data not available"
        );
        setBackgroundJobs([]);
      }
    } catch (error: any) {
      console.error("❌ Failed to load background jobs:", error);
      updateErrorState(
        "jobs",
        error?.response?.data?.message || "Failed to load background jobs"
      );
      setBackgroundJobs([]);
    } finally {
      updateLoadingState("jobs", false);
    }
  }, [updateLoadingState, updateErrorState]);

  // ✅ Initialize Complex Data
  useEffect(() => {
    const loadComplexData = async () => {
      await Promise.allSettled([
        loadPowerQualitySummary(),
        loadAuditSummary(),
        loadComplianceSummary(),
        loadSystemHealth(),
        loadMonitoringData(),
        loadBackgroundJobs(),
      ]);
      setLastUpdated(new Date());
    };

    loadComplexData();
  }, [
    loadPowerQualitySummary,
    loadAuditSummary,
    loadComplianceSummary,
    loadSystemHealth,
    loadMonitoringData,
    loadBackgroundJobs,
  ]);

  // ✅ Manual Refresh Handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    await Promise.allSettled([
      refreshOverview(),
      refreshRealTime(),
      refreshEnergy(),
      refreshBuildings(),
      refreshEquipment(),
      refreshAlerts(),
      refreshAlertStats(),
      refreshMaintenance(),
      refreshAnalytics(),
      refreshReports(),
      loadPowerQualitySummary(),
      loadAuditSummary(),
      loadComplianceSummary(),
      loadSystemHealth(),
      loadMonitoringData(),
      loadBackgroundJobs(),
    ]);

    setLastUpdated(new Date());
    setRefreshing(false);
  }, [
    refreshOverview,
    refreshRealTime,
    refreshEnergy,
    refreshBuildings,
    refreshEquipment,
    refreshAlerts,
    refreshAlertStats,
    refreshMaintenance,
    refreshAnalytics,
    refreshReports,
    loadPowerQualitySummary,
    loadAuditSummary,
    loadComplianceSummary,
    loadSystemHealth,
    loadMonitoringData,
    loadBackgroundJobs,
  ]);

  // ✅ Safe Number Helper
  const safeNumber = useCallback(
    (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined) return defaultValue;
      const num = typeof value === "number" ? value : parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    },
    []
  );

  // ✅ FIXED: Calculate System Metrics from Overview Data First
  const systemMetrics: SystemMetric[] = useMemo(() => {
    // ✅ Use overview data first, fallback to calculated values
    const totalBuildings =
      overview?.buildingPortfolio?.totalBuildings ||
      overview?.building_portfolio?.total_buildings ||
      (Array.isArray(buildings) ? buildings.length : 0);

    const systemHealthScore =
      overview?.systemHealth?.overallScore ||
      overview?.system_health?.overall_score ||
      systemHealth?.overallHealthScore ||
      85;

    const totalActiveAlerts =
      overview?.alertsSummary?.totalActive ||
      overview?.alerts_summary?.total_active ||
      (Array.isArray(alerts) ? alerts.length : 0);

    const criticalAlerts =
      overview?.alertsSummary?.activeCritical ||
      overview?.alerts_summary?.active_critical ||
      (Array.isArray(alerts)
        ? alerts.filter((alert) => alert.severity === "critical").length
        : 0);

    const totalEquipment =
      overview?.equipmentStatus?.totalEquipment ||
      overview?.equipment_status?.total_equipment ||
      (Array.isArray(equipment) ? equipment.length : 0);

    const operationalEquipment =
      overview?.equipmentStatus?.operational ||
      overview?.equipment_status?.operational ||
      (Array.isArray(equipment)
        ? equipment.filter((eq) => eq.status === "active").length
        : 0);

    // ✅ Use overview energy data
    const monthlyConsumption =
      overview?.energyPerformance?.totalConsumptionMonthKwh ||
      overview?.energy_performance?.total_consumption_month_kwh ||
      0;

    const monthlyCost =
      overview?.energyPerformance?.monthlyCostPhp ||
      overview?.energy_performance?.monthly_cost_php ||
      0;

    const powerFactor =
      realTimeMetrics?.currentEnergy?.averagePowerFactor ||
      realTimeMetrics?.averagePowerFactor ||
      0.85;

    const dataCollectionRate =
      overview?.systemHealth?.dataQualityScore ||
      overview?.system_health?.data_quality_score ||
      monitoringData?.performanceMetrics?.dataCollectionRate ||
      95;

    return [
      {
        title: "Total Buildings",
        value: totalBuildings,
        icon: BuildingIcon,
        color: "primary",
        description: `${overview?.buildingPortfolio?.activeBuildings || overview?.building_portfolio?.active_buildings || totalBuildings} active`,
        target: 100,
        loading: overviewLoading,
        error: !!overviewError,
      },
      {
        title: "System Health",
        value: `${safeNumber(systemHealthScore).toFixed(1)}%`,
        icon: Gauge,
        color:
          safeNumber(systemHealthScore) >= 90
            ? "success"
            : safeNumber(systemHealthScore) >= 70
              ? "warning"
              : "danger",
        description:
          overview?.systemHealth?.status ||
          overview?.system_health?.status ||
          "operational",
        target: 95,
        loading: overviewLoading,
        error: !!overviewError,
      },
      {
        title: "Monthly Consumption",
        value:
          safeNumber(monthlyConsumption) > 0
            ? `${(safeNumber(monthlyConsumption) / 1000).toFixed(1)}k kWh`
            : "No Data",
        icon: Zap,
        color: "secondary",
        description: "Portfolio usage this month",
        loading: overviewLoading,
        error: !!overviewError,
      },
      {
        title: "Monthly Cost",
        value:
          safeNumber(monthlyCost) > 0
            ? `₱${(safeNumber(monthlyCost) / 1000).toFixed(0)}k`
            : "No Data",
        icon: DollarSign,
        color: "warning",
        description: "Energy expenditure",
        loading: overviewLoading,
        error: !!overviewError,
      },
      {
        title: "Active Alerts",
        value: totalActiveAlerts,
        icon: AlertTriangle,
        color: criticalAlerts > 0 ? "danger" : "success",
        description: `${criticalAlerts} critical`,
        loading: overviewLoading,
        error: !!overviewError,
      },
      {
        title: "Equipment Health",
        value:
          totalEquipment > 0
            ? `${safeNumber(operationalEquipment)}/${totalEquipment}`
            : "No Equipment",
        icon: Settings,
        color: "default",
        description: `${safeNumber(overview?.equipmentStatus?.averageConditionScore || overview?.equipment_status?.average_condition_score || 0).toFixed(1)}% avg condition`,
        loading: overviewLoading,
        error: !!overviewError,
      },
      {
        title: "Power Factor",
        value: safeNumber(powerFactor).toFixed(2),
        icon: Gauge,
        color:
          safeNumber(powerFactor) >= 0.9
            ? "success"
            : safeNumber(powerFactor) >= 0.8
              ? "warning"
              : "danger",
        description: "Power efficiency",
        loading: realTimeLoading,
        error: !!realTimeError,
      },
      {
        title: "Data Quality",
        value: `${safeNumber(dataCollectionRate).toFixed(1)}%`,
        icon: Activity,
        color: "primary",
        description: "System connectivity",
        loading: overviewLoading,
        error: !!overviewError,
      },
    ];
  }, [
    overview,
    buildings,
    equipment,
    alerts,
    realTimeMetrics,
    systemHealth,
    monitoringData,
    overviewLoading,
    overviewError,
    realTimeLoading,
    realTimeError,
    safeNumber,
  ]);

  // ✅ NEW: Overview Metrics Card Component
  const OverviewMetricsCard = () => {
    if (!overview) return null;

    // ✅ Debug logging to check field transformation
    useEffect(() => {
      if (overview) {
        console.log("✅ Overview data:", overview);
        console.log("✅ System Health:", overview.systemHealth?.overallScore);
        console.log(
          "✅ Buildings:",
          overview.buildingPortfolio?.totalBuildings
        );
        console.log("✅ Raw system_health:", overview.system_health);
        console.log("✅ Raw building_portfolio:", overview.building_portfolio);
      }
    }, [overview]);

    return (
      <Card className="xl:col-span-3">
        <CardHeader>
          <h3 className="text-lg font-semibold">Portfolio Overview</h3>
          <p className="text-sm text-default-500">
            Real-time metrics from overview API
          </p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Building Portfolio */}
            <div className="text-center p-4 bg-content2 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {safeNumber(
                  overview.buildingPortfolio?.totalBuildings ||
                    overview.building_portfolio?.total_buildings ||
                    0
                )}
              </div>
              <p className="text-sm text-default-500">Total Buildings</p>
              <p className="text-xs text-default-400">
                {safeNumber(
                  overview.buildingPortfolio?.activeBuildings ||
                    overview.building_portfolio?.active_buildings ||
                    0
                )}{" "}
                active
              </p>
            </div>

            {/* Energy Performance */}
            <div className="text-center p-4 bg-content2 rounded-lg">
              <div className="text-2xl font-bold text-secondary mb-1">
                {(
                  safeNumber(
                    overview.energyPerformance?.totalConsumptionMonthKwh ||
                      overview.energy_performance
                        ?.total_consumption_month_kwh ||
                      0
                  ) / 1000
                ).toFixed(1)}
                k
              </div>
              <p className="text-sm text-default-500">Monthly kWh</p>
              <p className="text-xs text-default-400">
                ₱
                {(
                  safeNumber(
                    overview.energyPerformance?.monthlyCostPhp ||
                      overview.energy_performance?.monthly_cost_php ||
                      0
                  ) / 1000
                ).toFixed(0)}
                k cost
              </p>
            </div>

            {/* Compliance */}
            <div className="text-center p-4 bg-content2 rounded-lg">
              <div className="text-2xl font-bold text-success mb-1">
                {safeNumber(
                  overview.complianceStatus?.overallComplianceScore ||
                    overview.compliance_status?.overall_compliance_score ||
                    0
                ).toFixed(1)}
                %
              </div>
              <p className="text-sm text-default-500">Compliance</p>
              <p className="text-xs text-default-400">
                {safeNumber(
                  overview.complianceStatus?.upcomingAudits ||
                    overview.compliance_status?.upcoming_audits ||
                    0
                )}{" "}
                audits due
              </p>
            </div>

            {/* System Health */}
            <div className="text-center p-4 bg-content2 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {safeNumber(
                  overview.systemHealth?.overallScore ||
                    overview.system_health?.overall_score ||
                    0
                ).toFixed(1)}
                %
              </div>
              <p className="text-sm text-default-500">System Health</p>
              <p className="text-xs text-default-400">
                {overview.systemHealth?.status ||
                  overview.system_health?.status ||
                  "unknown"}
              </p>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Energy Efficiency</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Efficiency vs Baseline</span>
                  <span className="font-medium">
                    {safeNumber(
                      overview.energyPerformance?.efficiencyVsBaseline ||
                        overview.energy_performance?.efficiency_vs_baseline ||
                        0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Carbon Footprint</span>
                  <span className="font-medium">
                    {(
                      safeNumber(
                        overview.energyPerformance?.carbonFootprintKgCo2 ||
                          overview.energy_performance
                            ?.carbon_footprint_kg_co2 ||
                          0
                      ) / 1000
                    ).toFixed(1)}
                    t CO₂
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Renewable Energy</span>
                  <span className="font-medium">
                    {safeNumber(
                      overview.energyPerformance?.renewableEnergyPercentage ||
                        overview.energy_performance
                          ?.renewable_energy_percentage ||
                        0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Equipment Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Operational</span>
                  <span className="text-success font-medium">
                    {safeNumber(
                      overview.equipmentStatus?.operational ||
                        overview.equipment_status?.operational ||
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maintenance Required</span>
                  <span className="text-warning font-medium">
                    {safeNumber(
                      overview.equipmentStatus?.maintenanceRequired ||
                        overview.equipment_status?.maintenance_required ||
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Offline</span>
                  <span className="text-danger font-medium">
                    {safeNumber(
                      overview.equipmentStatus?.offline ||
                        overview.equipment_status?.offline ||
                        0
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Alert Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Critical</span>
                  <span className="text-danger font-medium">
                    {safeNumber(
                      overview.alertsSummary?.activeCritical ||
                        overview.alerts_summary?.active_critical ||
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>High Priority</span>
                  <span className="text-warning font-medium">
                    {safeNumber(
                      overview.alertsSummary?.activeHigh ||
                        overview.alerts_summary?.active_high ||
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Resolution Rate</span>
                  <span className="font-medium">
                    {safeNumber(
                      overview.alertsSummary?.resolutionRate24h ||
                        overview.alerts_summary?.resolution_rate_24h ||
                        0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  // ✅ Alert Distribution Data
  const alertDistribution = useMemo(() => {
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return [];
    }

    const distribution = alerts.reduce((acc: Record<string, number>, alert) => {
      const severity = alert.severity || "low";
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    return [
      {
        name: "Critical",
        value: distribution.critical || 0,
        color: COLORS.danger,
      },
      { name: "High", value: distribution.high || 0, color: COLORS.warning },
      { name: "Medium", value: distribution.medium || 0, color: COLORS.info },
      { name: "Low", value: distribution.low || 0, color: COLORS.success },
    ].filter((item) => item.value > 0);
  }, [alerts]);

  // ✅ Building Performance Data
  const buildingPerformanceData = useMemo(() => {
    if (!Array.isArray(buildings) || buildings.length === 0) {
      return [];
    }

    return buildings.slice(0, 10).map((building) => {
      const name = building.name || "Unknown Building";
      const shortName = name.length > 15 ? name.substring(0, 12) + "..." : name;

      return {
        name: shortName,
        efficiency: safeNumber(building.efficiencyScore),
        consumption: safeNumber(building.totalConsumptionKwh) / 1000,
        cost: safeNumber(building.monthlyCostPhp) / 1000,
        type: building.buildingType,
        area: safeNumber(building.areaSqm),
        equipmentCount: safeNumber(building.equipmentCount),
      };
    });
  }, [buildings, safeNumber]);

  // ✅ Equipment Status Data
  const equipmentStatusData = useMemo(() => {
    if (!Array.isArray(equipment) || equipment.length === 0) {
      return [];
    }

    const statusCount = equipment.reduce((acc: Record<string, number>, eq) => {
      const status = eq.status || "active";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return [
      {
        name: "Operational",
        value: statusCount.active || 0,
        color: COLORS.success,
      },
      {
        name: "Maintenance",
        value: statusCount.maintenance || 0,
        color: COLORS.warning,
      },
      { name: "Faulty", value: statusCount.faulty || 0, color: COLORS.danger },
      { name: "Offline", value: statusCount.inactive || 0, color: COLORS.info },
    ].filter((item) => item.value > 0);
  }, [equipment]);

  // ✅ Energy Trends Data
  const energyTrendsData = useMemo(() => {
    if (energySummary?.trends && Array.isArray(energySummary.trends)) {
      return energySummary.trends.map((trend) => ({
        date: new Date(trend.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        consumption: safeNumber(trend.consumption),
        cost: safeNumber(trend.cost),
      }));
    }

    return [];
  }, [energySummary, safeNumber]);

  // ✅ Get System Status
  const getSystemStatus = useCallback(() => {
    if (overview?.systemHealth?.status) return overview.systemHealth.status;
    if (overview?.system_health?.status) return overview.system_health.status;
    if (systemHealth?.status) return systemHealth.status;

    if (monitoringData?.systemStats) {
      const criticalAlerts = safeNumber(
        monitoringData.systemStats.criticalAlerts
      );
      const faultyEquipment = safeNumber(
        monitoringData.systemStats.faultyEquipment
      );

      if (criticalAlerts > 0 || faultyEquipment > 0) return "warning";
      return "operational";
    }

    return "operational";
  }, [overview, systemHealth, monitoringData, safeNumber]);

  // ✅ Trend Icons
  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="w-3 h-3 text-success" />;
      case "down":
        return <ArrowDownRight className="w-3 h-3 text-danger" />;
      default:
        return <Minus className="w-3 h-3 text-default-400" />;
    }
  };

  const getTrendColor = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-success";
      case "down":
        return "text-danger";
      default:
        return "text-default-400";
    }
  };

  // ✅ Error Component
  const ErrorCard = ({
    title,
    error,
    onRetry,
    loading,
  }: {
    title: string;
    error: string;
    onRetry: () => void;
    loading?: boolean;
  }) => (
    <Card>
      <CardBody className="text-center py-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-default-500">{error}</p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          onPress={onRetry}
          isLoading={loading}
          startContent={<RefreshCw className="w-4 h-4" />}
        >
          Retry
        </Button>
      </CardBody>
    </Card>
  );

  // ✅ Empty State Component
  const EmptyState = ({
    icon: Icon,
    title,
    description,
  }: {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
  }) => (
    <div className="text-center py-8 space-y-2">
      <Icon className="w-12 h-12 text-default-300 mx-auto" />
      <p className="text-default-500">{title}</p>
      <p className="text-xs text-default-400">{description}</p>
    </div>
  );

  // ✅ Loading Check
  const isInitialLoading =
    overviewLoading ||
    buildingsLoading ||
    equipmentLoading ||
    alertsLoading ||
    loadingStates.systemHealth ||
    loadingStates.monitoring;

  if (isInitialLoading) {
    return (
      <div
        className="min-h-screen p-6 space-y-6"
        role="status"
        aria-label="Loading dashboard"
      >
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-80 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Global Error Check
  const hasGlobalError =
    overviewError && buildingsError && equipmentError && alertsError;

  if (hasGlobalError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        role="alert"
      >
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h3 className="text-xl font-semibold">Dashboard Error</h3>
            <p className="text-default-500">
              Unable to load dashboard data. Please check your connection and
              try again.
            </p>
            <Button
              color="primary"
              onPress={handleRefresh}
              startContent={<RefreshCw className="w-4 h-4" />}
              isLoading={refreshing}
            >
              Retry Loading
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6" role="document">
      {/* ✅ Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Energy Command Center
              </h1>
              <p className="text-sm md:text-base text-default-500">
                Philippine Energy Management & Compliance Platform
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
            <div className="flex items-center space-x-2 bg-content2 rounded-lg px-2 md:px-3 py-1">
              <Activity
                className={clsx(
                  "w-3 h-3 md:w-4 md:h-4",
                  isConnected ? "text-green-500" : "text-red-500"
                )}
              />
              <span className="text-xs md:text-sm">
                System: {getSystemStatus()}
              </span>
            </div>

            {Array.isArray(buildings) && buildings.length > 0 && (
              <div className="flex items-center space-x-2 bg-content2 rounded-lg px-2 md:px-3 py-1">
                <BuildingIcon className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                <span className="text-xs md:text-sm">
                  Buildings: {buildings.length}
                </span>
              </div>
            )}

            {Array.isArray(alerts) && (
              <div className="flex items-center space-x-2 bg-content2 rounded-lg px-2 md:px-3 py-1">
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                <span className="text-xs md:text-sm">
                  Alerts: {alerts.length}
                </span>
              </div>
            )}

            {(overview?.systemHealth?.overallScore ||
              overview?.system_health?.overall_score ||
              systemHealth) && (
              <div className="flex items-center space-x-2 bg-content2 rounded-lg px-2 md:px-3 py-1">
                <Gauge className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                <span className="text-xs md:text-sm">
                  Health:{" "}
                  {safeNumber(
                    overview?.systemHealth?.overallScore ||
                      overview?.system_health?.overall_score ||
                      systemHealth?.overallHealthScore ||
                      0
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}

            <Chip
              size="sm"
              color={isConnected ? "success" : "danger"}
              variant="flat"
            >
              {isConnected ? "Live Monitoring" : "Connection Issues"}
            </Chip>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {lastUpdated && (
            <div className="text-right">
              <p className="text-xs text-default-400">Last updated</p>
              <p className="text-sm font-medium">
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          )}
          <Button
            variant="bordered"
            size="sm"
            onPress={handleRefresh}
            startContent={
              <RefreshCw
                className={clsx("w-4 h-4", refreshing && "animate-spin")}
              />
            }
            isLoading={refreshing}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            size="sm"
            startContent={<BarChart3 className="w-4 h-4" />}
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* ✅ Enhanced System Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 md:gap-4">
        {systemMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={index}
              className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary/20"
            >
              <CardBody className="p-3 md:p-4">
                {metric.loading ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-8 h-8 rounded-xl" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ) : metric.error ? (
                  <div className="space-y-2 text-center">
                    <AlertCircle className="w-6 h-6 text-danger mx-auto" />
                    <p className="text-xs text-danger">Error loading</p>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={clsx(
                            "p-2 rounded-xl transition-colors",
                            `bg-${metric.color}/10 group-hover:bg-${metric.color}/20`
                          )}
                        >
                          <Icon
                            className={clsx(
                              "w-3 h-3 md:w-4 md:h-4",
                              `text-${metric.color}`
                            )}
                          />
                        </div>
                        <p className="text-xs text-default-500 font-medium">
                          {metric.title}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xl md:text-2xl font-bold text-foreground">
                          {metric.value}
                        </p>

                        {metric.change !== undefined && (
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(metric.trend)}
                            <span
                              className={clsx(
                                "text-xs font-medium",
                                getTrendColor(metric.trend)
                              )}
                            >
                              {Math.abs(metric.change || 0).toFixed(1)}%
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-default-400 truncate">
                          {metric.description}
                        </p>
                      </div>

                      {metric.target &&
                        typeof metric.value === "string" &&
                        metric.value !== "-" &&
                        metric.value !== "No Data" && (
                          <div className="mt-2">
                            <Progress
                              size="sm"
                              value={parseFloat(
                                metric.value.replace(/[^0-9.]/g, "")
                              )}
                              maxValue={metric.target}
                              color={metric.color}
                              className="max-w-full"
                            />
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* ✅ Main Dashboard Content */}
      <Tabs
        aria-label="Dashboard sections"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
        color="primary"
        variant="underlined"
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mt-6">
            {/* ✅ NEW: Overview Metrics Card using the dashboard overview API data */}
            <OverviewMetricsCard />

            {/* Energy Consumption Trend */}
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold">
                      Energy Consumption Trends
                    </h3>
                    <p className="text-sm text-default-500">
                      Portfolio energy analysis
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Chip size="sm" color="primary" variant="flat">
                      {energyLoading
                        ? "Loading..."
                        : energyTrendsData.length > 0
                          ? "Live Data"
                          : "No Data"}
                    </Chip>
                    <Button isIconOnly size="sm" variant="light">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64 md:h-80">
                  {energyLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : energyError ? (
                    <ErrorCard
                      title="Energy data unavailable"
                      error={energyError}
                      onRetry={refreshEnergy}
                      loading={energyLoading}
                    />
                  ) : energyTrendsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={energyTrendsData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--default-200))"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--default-500))"
                          fontSize={12}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="hsl(var(--default-500))"
                          fontSize={12}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="hsl(var(--default-500))"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--content1))",
                            border: "1px solid hsl(var(--default-200))",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value: any, name: any) => [
                            typeof value === "number"
                              ? value.toFixed(2)
                              : value,
                            name === "consumption"
                              ? "Consumption (kWh)"
                              : "Cost (₱)",
                          ]}
                        />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="consumption"
                          fill={COLORS.primary}
                          fillOpacity={0.2}
                          stroke={COLORS.primary}
                          strokeWidth={3}
                          name="Consumption"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cost"
                          stroke={COLORS.warning}
                          strokeWidth={3}
                          name="Cost"
                          dot={{ fill: COLORS.warning, strokeWidth: 2, r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      icon={Zap}
                      title="No energy trend data available"
                      description="Configure energy monitoring to view trends"
                    />
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Real-time System Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-semibold">System Status</h3>
                  <div
                    className={clsx(
                      "w-2 h-2 rounded-full animate-pulse",
                      isConnected ? "bg-green-400" : "bg-red-400"
                    )}
                  />
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {loadingStates.monitoring ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : errorStates.monitoring ? (
                  <EmptyState
                    icon={Signal}
                    title="Monitoring data unavailable"
                    description={errorStates.monitoring}
                  />
                ) : monitoringData?.systemStats ? (
                  <>
                    {/* Total Buildings */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Buildings</span>
                        <span className="text-lg font-bold text-primary">
                          {safeNumber(
                            monitoringData.systemStats.totalBuildings
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Total Alerts */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">System Alerts</span>
                        <span className="text-lg font-bold text-warning">
                          {safeNumber(monitoringData.systemStats.totalAlerts)}
                        </span>
                      </div>
                    </div>

                    {/* Critical Equipment */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Critical Equipment</span>
                        <span className="text-lg font-bold text-danger">
                          {safeNumber(
                            monitoringData.systemStats.faultyEquipment
                          )}
                        </span>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">System Status</span>
                        <Chip
                          size="sm"
                          color={
                            getSystemStatus() === "operational"
                              ? "success"
                              : "warning"
                          }
                          variant="flat"
                        >
                          {getSystemStatus()}
                        </Chip>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={Signal}
                    title="No monitoring data available"
                    description="Check monitoring system connection"
                  />
                )}

                <Divider />

                {/* Background Jobs Status */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Active Processes</h4>
                  {Array.isArray(backgroundJobs) &&
                  backgroundJobs.length > 0 ? (
                    backgroundJobs.slice(0, 3).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-sm truncate">{job.type}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-default-500">
                            {safeNumber(job.progressPercentage).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-default-500">
                      No active processes
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Building Performance */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Building Performance</h3>
                <p className="text-sm text-default-500">Portfolio overview</p>
              </CardHeader>
              <CardBody>
                <div className="h-64 md:h-80">
                  {buildingsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : buildingsError ? (
                    <ErrorCard
                      title="Building data unavailable"
                      error={buildingsError}
                      onRetry={refreshBuildings}
                      loading={buildingsLoading}
                    />
                  ) : buildingPerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={buildingPerformanceData}
                        layout="horizontal"
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={80}
                          fontSize={12}
                        />
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            `${typeof value === "number" ? value.toFixed(1) : value}${
                              name === "efficiency"
                                ? "%"
                                : name === "consumption"
                                  ? "k kWh"
                                  : "k ₱"
                            }`,
                            name === "efficiency"
                              ? "Efficiency"
                              : name === "consumption"
                                ? "Consumption"
                                : "Cost",
                          ]}
                        />
                        <Bar
                          dataKey="efficiency"
                          fill={COLORS.secondary}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      icon={BuildingIcon}
                      title="No building data available"
                      description="Add buildings to view performance metrics"
                    />
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Alert Distribution */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Alert Distribution</h3>
                <p className="text-sm text-default-500">
                  Current alert breakdown
                </p>
              </CardHeader>
              <CardBody>
                <div className="h-48 md:h-60">
                  {alertsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : alertsError ? (
                    <ErrorCard
                      title="Alerts data unavailable"
                      error={alertsError}
                      onRetry={refreshAlerts}
                      loading={alertsLoading}
                    />
                  ) : alertDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={alertDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          dataKey="value"
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {alertDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      icon={CheckCircle}
                      title="All systems normal"
                      description="No active alerts"
                    />
                  )}
                </div>

                {/* Alert Summary */}
                {alertDistribution.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {alertDistribution.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            item.name === "Critical"
                              ? "danger"
                              : item.name === "High"
                                ? "warning"
                                : item.name === "Medium"
                                  ? "primary"
                                  : "success"
                          }
                        >
                          {item.value}
                        </Chip>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Equipment Status */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Equipment Health</h3>
                <p className="text-sm text-default-500">Operational overview</p>
              </CardHeader>
              <CardBody>
                <div className="h-48 md:h-60">
                  {equipmentLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : equipmentError ? (
                    <ErrorCard
                      title="Equipment data unavailable"
                      error={equipmentError}
                      onRetry={refreshEquipment}
                      loading={equipmentLoading}
                    />
                  ) : equipmentStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={equipmentStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {equipmentStatusData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      icon={Settings}
                      title="No equipment data available"
                      description="Add equipment to view status"
                    />
                  )}
                </div>

                {equipmentStatusData.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {equipmentStatusData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Power Quality Status */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Power Quality</h3>
                <p className="text-sm text-default-500">IEEE 519 Compliance</p>
              </CardHeader>
              <CardBody>
                {loadingStates.powerQuality ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Skeleton className="h-12 w-16 mx-auto mb-2" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : errorStates.powerQuality ? (
                  <EmptyState
                    icon={Power}
                    title="Power quality data unavailable"
                    description={errorStates.powerQuality}
                  />
                ) : powerQualitySummary ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                        {safeNumber(powerQualitySummary.overallScore).toFixed(
                          1
                        )}
                      </div>
                      <p className="text-sm text-default-500">Quality Score</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>IEEE 519 Compliance</span>
                        <span className="font-medium">
                          {safeNumber(
                            powerQualitySummary.complianceStatus
                              ?.ieee519ComplianceRate
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={safeNumber(
                          powerQualitySummary.complianceStatus
                            ?.ieee519ComplianceRate
                        )}
                        color="success"
                      />

                      <div className="flex justify-between text-sm">
                        <span>ITIC Compliance</span>
                        <span className="font-medium">
                          {safeNumber(
                            powerQualitySummary.complianceStatus
                              ?.iticComplianceRate
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={safeNumber(
                          powerQualitySummary.complianceStatus
                            ?.iticComplianceRate
                        )}
                        color="primary"
                      />

                      <div className="flex justify-between text-sm">
                        <span>Events (24h)</span>
                        <span className="font-medium">
                          {safeNumber(
                            powerQualitySummary.complianceStatus
                              ?.violationsLast24h
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Power}
                    title="No power quality data available"
                    description="Configure power quality monitoring"
                  />
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Analytics Tab */}
        <Tab
          key="analytics"
          title={
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mt-6">
            {analyticsLoading ? (
              <Card className="xl:col-span-3">
                <CardBody className="text-center py-12 space-y-4">
                  <Spinner size="lg" color="primary" />
                  <h3 className="text-lg font-semibold">Loading Analytics</h3>
                  <p className="text-default-500">
                    Please wait while we load analytics data...
                  </p>
                </CardBody>
              </Card>
            ) : analyticsError ? (
              <Card className="xl:col-span-3">
                <CardBody className="text-center py-12 space-y-4">
                  <BarChart3 className="w-16 h-16 text-default-300 mx-auto" />
                  <h3 className="text-lg font-semibold">Analytics Error</h3>
                  <p className="text-default-500">{analyticsError}</p>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={refreshAnalytics}
                    isLoading={analyticsLoading}
                    startContent={<RefreshCw className="w-4 h-4" />}
                  >
                    Retry Loading Analytics
                  </Button>
                </CardBody>
              </Card>
            ) : analyticsData ? (
              <>
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Analytics Overview
                    </h3>
                  </CardHeader>
                  <CardBody className="text-center space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xl font-bold text-primary">
                          {Array.isArray(buildings) ? buildings.length : 0}
                        </p>
                        <p className="text-xs text-default-500">
                          Total Buildings
                        </p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-secondary">
                          {Array.isArray(equipment) ? equipment.length : 0}
                        </p>
                        <p className="text-xs text-default-500">
                          Equipment Items
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-success">
                        {buildingPerformanceData.length > 0
                          ? (
                              buildingPerformanceData.reduce(
                                (sum, b) => sum + b.efficiency,
                                0
                              ) / buildingPerformanceData.length
                            ).toFixed(1)
                          : "0.0"}
                        %
                      </div>
                      <p className="text-sm text-default-500">
                        Portfolio Efficiency
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="xl:col-span-2">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">System Analytics</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-content2 rounded-lg">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {Array.isArray(equipment)
                              ? equipment.filter((eq) => eq.status === "active")
                                  .length
                              : 0}
                          </div>
                          <p className="text-sm text-default-500">
                            Active Equipment
                          </p>
                        </div>
                        <div className="text-center p-4 bg-content2 rounded-lg">
                          <div className="text-2xl font-bold text-warning mb-1">
                            {Array.isArray(alerts) ? alerts.length : 0}
                          </div>
                          <p className="text-sm text-default-500">
                            Active Alerts
                          </p>
                        </div>
                        <div className="text-center p-4 bg-content2 rounded-lg">
                          <div className="text-2xl font-bold text-success mb-1">
                            {safeNumber(
                              overview?.systemHealth?.overallScore ||
                                overview?.system_health?.overall_score ||
                                systemHealth?.overallHealthScore ||
                                85
                            ).toFixed(0)}
                            %
                          </div>
                          <p className="text-sm text-default-500">
                            System Health
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">
                          Portfolio Summary
                        </h4>
                        {Array.isArray(buildings) && buildings.length > 0 ? (
                          <div className="space-y-3">
                            {buildings.slice(0, 5).map((building) => (
                              <div
                                key={building.id}
                                className="flex items-center justify-between p-3 bg-content2 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{building.name}</p>
                                  <p className="text-sm text-default-500">
                                    Equipment:{" "}
                                    {safeNumber(building.equipmentCount)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Chip
                                    size="sm"
                                    color={
                                      safeNumber(building.efficiencyScore) >= 80
                                        ? "success"
                                        : safeNumber(
                                              building.efficiencyScore
                                            ) >= 60
                                          ? "warning"
                                          : "danger"
                                    }
                                    variant="flat"
                                  >
                                    {safeNumber(
                                      building.efficiencyScore
                                    ).toFixed(1)}
                                    %
                                  </Chip>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            icon={BuildingIcon}
                            title="No buildings configured"
                            description="Add buildings to view analytics"
                          />
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </>
            ) : (
              <Card className="xl:col-span-3">
                <CardBody className="text-center py-12 space-y-4">
                  <BarChart3 className="w-16 h-16 text-default-300 mx-auto" />
                  <h3 className="text-lg font-semibold">
                    Analytics Not Available
                  </h3>
                  <p className="text-default-500">
                    Analytics data is not currently available.
                  </p>
                  <p className="text-sm text-default-400">
                    Ensure analytics services are configured and running.
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={refreshAnalytics}
                    isLoading={analyticsLoading}
                  >
                    Retry Loading Analytics
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        {/* Compliance Tab */}
        <Tab
          key="compliance"
          title={
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Compliance</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mt-6">
            {loadingStates.compliance ? (
              <Card className="xl:col-span-3">
                <CardBody className="text-center py-12 space-y-4">
                  <Spinner size="lg" color="primary" />
                  <h3 className="text-lg font-semibold">
                    Loading Compliance Data
                  </h3>
                  <p className="text-default-500">
                    Please wait while we load compliance information...
                  </p>
                </CardBody>
              </Card>
            ) : errorStates.compliance ? (
              <Card className="xl:col-span-3">
                <CardBody className="text-center py-12 space-y-4">
                  <Shield className="w-16 h-16 text-default-300 mx-auto" />
                  <h3 className="text-lg font-semibold">Compliance Error</h3>
                  <p className="text-default-500">{errorStates.compliance}</p>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={loadComplianceSummary}
                    isLoading={loadingStates.compliance}
                    startContent={<RefreshCw className="w-4 h-4" />}
                  >
                    Retry Loading Compliance
                  </Button>
                </CardBody>
              </Card>
            ) : complianceSummary ? (
              <>
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Overall Compliance
                    </h3>
                  </CardHeader>
                  <CardBody className="text-center space-y-4">
                    <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                      {safeNumber(
                        complianceSummary.overallStatus?.compliancePercentage
                      ).toFixed(1)}
                      %
                    </div>
                    <p className="text-sm text-default-500">Compliance Rate</p>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xl font-bold text-danger">
                          {safeNumber(
                            complianceSummary.overallStatus?.criticalViolations
                          )}
                        </p>
                        <p className="text-xs text-default-500">
                          Critical Issues
                        </p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-warning">
                          {safeNumber(
                            complianceSummary.overallStatus?.totalViolations
                          )}
                        </p>
                        <p className="text-xs text-default-500">
                          Total Violations
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="xl:col-span-2">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Standards Compliance
                    </h3>
                  </CardHeader>
                  <CardBody>
                    {Array.isArray(complianceSummary.byStandard) &&
                    complianceSummary.byStandard.length > 0 ? (
                      <div className="space-y-3">
                        {complianceSummary.byStandard.map(
                          (standard: any, index: number) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg bg-content2"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {standard.standard}
                                </span>
                                <Chip
                                  size="sm"
                                  color={
                                    safeNumber(standard.complianceRate) >= 90
                                      ? "success"
                                      : safeNumber(standard.complianceRate) >=
                                          70
                                        ? "warning"
                                        : "danger"
                                  }
                                  variant="flat"
                                >
                                  {safeNumber(standard.complianceRate).toFixed(
                                    1
                                  )}
                                  %
                                </Chip>
                              </div>
                              <Progress
                                value={safeNumber(standard.complianceRate)}
                                color={
                                  safeNumber(standard.complianceRate) >= 90
                                    ? "success"
                                    : safeNumber(standard.complianceRate) >= 70
                                      ? "warning"
                                      : "danger"
                                }
                                size="sm"
                              />
                              <div className="flex justify-between text-xs text-default-500 mt-1">
                                <span>
                                  Violations: {safeNumber(standard.violations)}
                                </span>
                                <span>
                                  Last:{" "}
                                  {standard.lastAssessment
                                    ? new Date(
                                        standard.lastAssessment
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Shield}
                        title="No compliance standards data"
                        description="Configure compliance monitoring to view standards"
                      />
                    )}
                  </CardBody>
                </Card>
              </>
            ) : (
              <Card className="xl:col-span-3">
                <CardBody className="text-center py-12 space-y-4">
                  <Shield className="w-16 h-16 text-default-300 mx-auto" />
                  <h3 className="text-lg font-semibold">
                    Compliance Data Not Available
                  </h3>
                  <p className="text-default-500">
                    Compliance summary is not currently available.
                  </p>
                  <p className="text-sm text-default-400">
                    Configure compliance monitoring to view regulatory status.
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={loadComplianceSummary}
                    isLoading={loadingStates.compliance}
                  >
                    Retry Loading Compliance Data
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
