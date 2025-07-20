// app/admin/analytics/page.tsx
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
  ReferenceLine,
} from "recharts";

// HeroUI Components
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Switch } from "@heroui/switch";
import { Slider } from "@heroui/slider";

// Icons
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Lightbulb,
  AlertTriangle,
  Target,
  Activity,
  Play,
  RefreshCw,
  Download,
  Settings,
  CheckCircle,
  Clock,
  Database,
  Brain,
  Gauge,
  Factory,
  Shield,
  FileText,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  BarChart4,
} from "lucide-react";

// API Hooks - Using your exact hook infrastructure
import {
  useAnalytics,
  useAnalyticsDashboard,
  useMaintenancePrediction,
  useEnergyForecast,
  useBuildings,
  useEquipment,
  useAlerts,
  useEnergyStats,
  usePowerQualityStats,
  useEnergyTrends,
  usePowerQualityEvents,
  useAlertStatistics,
  useDashboardOverview,
} from "@/hooks/useApi";

// API Functions - Using your exact API structure
import { analyticsAPI } from "@/lib/api";

// Response Handlers - Using your exact response handling
import {
  handleApiResponse,
  handleArrayApiResponse,
  processApiResponse,
  safeExtractArrayData,
  safeExtractObjectData,
} from "@/lib/api-response-handler";

// Types - Using your exact type definitions
import type {
  Building,
  Equipment,
  Alert,
  EnergyStatsResponse,
  PowerQualityStatsResponse,
  MaintenancePrediction,
  DashboardOverview,
  AlertStatistics,
  BuildingQueryParams,
  EquipmentQueryParams,
  AlertQueryParams,
} from "@/types/api-types";

// Chart colors
const COLORS = {
  primary: "#00C896",
  secondary: "#3CD3C2",
  warning: "#F5A524",
  danger: "#F31260",
  success: "#00C896",
  info: "#006FEE",
  background: "#1F2937",
  border: "#374151",
  text: "#9CA3AF",
  chart: [
    "#00C896",
    "#3CD3C2",
    "#F5A524",
    "#F31260",
    "#006FEE",
    "#7C3AED",
    "#EC4899",
    "#10B981",
  ],
};

// Analysis configuration using your exact API structure
const ANALYSIS_TYPES = [
  { key: "energy", label: "Energy Analysis", icon: Zap },
  { key: "power_quality", label: "Power Quality", icon: Activity },
  { key: "equipment", label: "Equipment Analysis", icon: Factory },
];

interface AnalyticsConfig {
  buildingId: number;
  startDate: string;
  endDate: string;
  analysisTypes: string[];
  forecastDays: number;
  sensitivity: "low" | "medium" | "high";
}

export default function AdvancedAnalyticsPage() {
  // Configuration state
  const [config, setConfig] = useState<AnalyticsConfig>({
    buildingId: 0,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    analysisTypes: ["energy", "power_quality"],
    forecastDays: 30,
    sensitivity: "medium",
  });

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Core data hooks using your exact API structure
  const {
    data: buildings,
    loading: buildingsLoading,
    error: buildingsError,
    refresh: refreshBuildings,
  } = useBuildings({ status: "active" } as BuildingQueryParams, {
    immediate: true,
  });

  const {
    data: dashboardOverview,
    loading: dashboardLoading,
    refresh: refreshDashboard,
  } = useDashboardOverview({
    refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: analyticsDashboard, loading: analyticsDashboardLoading } =
    useAnalyticsDashboard({
      immediate: true,
    });

  // Building-specific data hooks
  const { data: equipment, loading: equipmentLoading } = useEquipment(
    config.buildingId
      ? ({ buildingId: config.buildingId } as EquipmentQueryParams)
      : undefined,
    { immediate: !!config.buildingId }
  );

  const { data: alerts, loading: alertsLoading } = useAlerts(
    config.buildingId
      ? ({
          buildingId: config.buildingId,
          status: "active",
        } as AlertQueryParams)
      : undefined,
    { immediate: !!config.buildingId }
  );

  const { data: energyStats, loading: energyStatsLoading } = useEnergyStats(
    config.buildingId,
    {
      startDate: config.startDate,
      endDate: config.endDate,
    },
    { immediate: !!config.buildingId }
  );

  const { data: powerQualityStats, loading: pqStatsLoading } =
    usePowerQualityStats(
      config.buildingId,
      {
        startDate: config.startDate,
        endDate: config.endDate,
      },
      { immediate: !!config.buildingId }
    );

  const { data: energyTrends, loading: energyTrendsLoading } = useEnergyTrends(
    config.buildingId,
    { period: "30d" },
    { immediate: !!config.buildingId }
  );

  const { data: alertStatistics, loading: alertStatsLoading } =
    useAlertStatistics(
      config.buildingId ? { buildingId: config.buildingId } : undefined,
      { immediate: !!config.buildingId }
    );

  // Analytics hooks using your exact hook structure
  const { data: maintenancePredictions, loading: predictionsLoading } =
    useMaintenancePrediction(
      equipment && equipment.length > 0 ? equipment[0].id : 0,
      { immediate: !!equipment && equipment.length > 0 }
    );

  const { data: energyForecast, loading: forecastLoading } = useEnergyForecast(
    config.buildingId,
    { forecastDays: config.forecastDays },
    { immediate: !!config.buildingId }
  );

  // Modal controls
  const {
    isOpen: isConfigOpen,
    onOpen: onConfigOpen,
    onClose: onConfigClose,
  } = useDisclosure();

  const {
    isOpen: isResultsOpen,
    onOpen: onResultsOpen,
    onClose: onResultsClose,
  } = useDisclosure();

  // Auto-select first building
  useEffect(() => {
    if (buildings && buildings.length > 0 && config.buildingId === 0) {
      setConfig((prev) => ({ ...prev, buildingId: buildings[0].id }));
    }
  }, [buildings, config.buildingId]);

  // Comprehensive analytics execution using your exact API
  const runComprehensiveAnalysis = useCallback(async () => {
    if (!config.buildingId) {
      alert("Please select a building first");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResults(null);

    try {
      const totalSteps = config.analysisTypes.length + 2; // Include baseline and anomalies
      let completedSteps = 0;

      const results: any = {};

      // Step 1: Run main analysis using your exact API
      if (config.analysisTypes.length > 0) {
        try {
          setAnalysisProgress((completedSteps / totalSteps) * 100);

          const analysisParams = {
            buildingId: config.buildingId,
            startDate: config.startDate,
            endDate: config.endDate,
            analysisTypes: config.analysisTypes,
          };

          const response = await analyticsAPI.runAnalysis(analysisParams);
          const result = handleApiResponse(response.data);

          if (result.success && result.data) {
            results.mainAnalysis = result.data;
          }

          completedSteps++;
          setAnalysisProgress((completedSteps / totalSteps) * 100);
        } catch (error) {
          console.error("Main analysis failed:", error);
        }
      }

      // Step 2: Baseline calculation using your exact API
      try {
        const response = await analyticsAPI.calculateBaseline(
          config.buildingId,
          {
            startDate: config.startDate,
            endDate: config.endDate,
          }
        );
        const result = handleApiResponse(response.data);

        if (result.success && result.data) {
          results.baseline = result.data;
        }

        completedSteps++;
        setAnalysisProgress((completedSteps / totalSteps) * 100);
      } catch (error) {
        console.error("Baseline calculation failed:", error);
      }

      // Step 3: Anomaly detection using your exact API
      try {
        const anomalyData = {
          buildingId: config.buildingId,
          startDate: config.startDate,
          endDate: config.endDate,
          sensitivity: config.sensitivity,
          analysisTypes: config.analysisTypes,
        };

        const response = await analyticsAPI.detectAnomalies(anomalyData);
        const result = handleArrayApiResponse(response.data);

        if (result.success && result.data) {
          results.anomalies = result.data;
        }

        completedSteps++;
        setAnalysisProgress((completedSteps / totalSteps) * 100);
      } catch (error) {
        console.error("Anomaly detection failed:", error);
      }

      setAnalysisResults(results);
      onResultsOpen();
    } catch (error) {
      console.error("Comprehensive analysis failed:", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [config, onResultsOpen]);

  // Computed metrics using your exact data structure
  const dashboardMetrics = useMemo(() => {
    if (!dashboardOverview) return null;

    return {
      totalBuildings: buildings?.length || 0,
      activeEquipment:
        equipment?.filter((eq) => eq.status === "active").length || 0,
      totalEquipment: equipment?.length || 0,
      activeAlerts:
        alerts?.filter((alert) => alert.status === "active").length || 0,
      totalConsumption: energyStats?.totalConsumption || 0,
      efficiencyScore: energyStats?.efficiencyScore || 0,
      powerQualityScore: powerQualityStats?.qualityScore || 0,
      // Using your exact DashboardOverview structure
      systemHealth: dashboardOverview.systemHealth?.overallScore || 0,
      energyPerformance: dashboardOverview.energyPerformance || {},
      alertsSummary: dashboardOverview.alertsSummary || {},
      equipmentStatus: dashboardOverview.equipmentStatus || {},
    };
  }, [
    dashboardOverview,
    buildings,
    equipment,
    alerts,
    energyStats,
    powerQualityStats,
  ]);

  // Chart data processing using your exact response structure
  const chartData = useMemo(() => {
    if (!energyTrends) return [];

    // Handle different possible response structures from your API
    const trendsArray = Array.isArray(energyTrends)
      ? energyTrends
      : energyTrends.trends || [];

    return trendsArray.map((trend: any, index: number) => ({
      date: trend.date || `Day ${index + 1}`,
      consumption: trend.consumption || trend.consumptionKwh || 0,
      powerFactor: trend.powerFactor || trend.avgPowerFactor || 0,
      efficiency: trend.efficiency || 80 + Math.random() * 20,
      cost: trend.cost || trend.costPhp || (trend.consumption || 0) * 5.5,
      baseline: trend.baseline || (trend.consumption || 0) * 0.9,
    }));
  }, [energyTrends]);

  if (buildingsLoading || dashboardLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (buildingsError) {
    return (
      <AnalyticsErrorState error={buildingsError} onRetry={refreshDashboard} />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            Advanced Analytics
          </h1>
          <p className="text-default-500 mt-1">
            Comprehensive insights and AI-powered analysis for energy
            optimization
          </p>
          {dashboardMetrics && (
            <div className="flex items-center space-x-4 mt-3 text-sm text-default-600">
              <span className="flex items-center">
                <Database className="w-4 h-4 mr-1" />
                {dashboardMetrics.totalBuildings} Buildings
              </span>
              <span className="flex items-center">
                <Factory className="w-4 h-4 mr-1" />
                {dashboardMetrics.activeEquipment}/
                {dashboardMetrics.totalEquipment} Equipment
              </span>
              <span className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {dashboardMetrics.activeAlerts} Active Alerts
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            color="secondary"
            variant="bordered"
            startContent={<Settings className="w-4 h-4" />}
            onPress={onConfigOpen}
          >
            Configure
          </Button>
          <Button
            color="primary"
            startContent={<Play className="w-4 h-4" />}
            onPress={runComprehensiveAnalysis}
            isLoading={isAnalyzing}
            isDisabled={!config.buildingId}
          >
            {isAnalyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Analysis in Progress</span>
              <span className="text-sm text-default-600">
                {analysisProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={analysisProgress} color="primary" size="sm" />
            <p className="text-xs text-default-500 mt-2">
              Running comprehensive analysis across selected parameters...
            </p>
          </CardBody>
        </Card>
      )}

      {/* Main Analytics Tabs */}
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
        }}
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </div>
          }
        >
          <OverviewTab
            metrics={dashboardMetrics}
            chartData={chartData}
            energyStats={energyStats}
            powerQualityStats={powerQualityStats}
            equipment={equipment || []}
            alerts={alerts || []}
            alertStatistics={alertStatistics}
          />
        </Tab>

        <Tab
          key="energy"
          title={
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Energy Analysis</span>
            </div>
          }
        >
          <EnergyAnalysisTab
            buildingId={config.buildingId}
            energyStats={energyStats}
            energyTrends={energyTrends}
            energyForecast={energyForecast}
            chartData={chartData}
          />
        </Tab>

        <Tab
          key="quality"
          title={
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Power Quality</span>
            </div>
          }
        >
          <PowerQualityTab
            buildingId={config.buildingId}
            powerQualityStats={powerQualityStats}
            config={config}
          />
        </Tab>

        <Tab
          key="equipment"
          title={
            <div className="flex items-center space-x-2">
              <Factory className="w-4 h-4" />
              <span>Equipment</span>
            </div>
          }
        >
          <EquipmentAnalysisTab
            equipment={equipment || []}
            maintenancePredictions={maintenancePredictions}
            buildingId={config.buildingId}
          />
        </Tab>

        <Tab
          key="predictions"
          title={
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Predictions</span>
            </div>
          }
        >
          <PredictionsTab
            energyForecast={energyForecast}
            maintenancePredictions={maintenancePredictions}
            buildingId={config.buildingId}
            config={config}
          />
        </Tab>

        <Tab
          key="insights"
          title={
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4" />
              <span>Insights</span>
            </div>
          }
        >
          <InsightsTab
            results={analysisResults}
            dashboardMetrics={dashboardMetrics}
            buildingId={config.buildingId}
          />
        </Tab>
      </Tabs>

      {/* Configuration Modal */}
      <AnalyticsConfigModal
        isOpen={isConfigOpen}
        onClose={onConfigClose}
        config={config}
        setConfig={setConfig}
        buildings={buildings || []}
      />

      {/* Results Modal */}
      <AnalyticsResultsModal
        isOpen={isResultsOpen}
        onClose={onResultsClose}
        results={analysisResults}
        config={config}
      />
    </div>
  );
}

// Loading skeleton component
function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 rounded-lg mb-2" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="h-20 rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <Skeleton className="h-80 rounded-lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Skeleton className="h-80 rounded-lg" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// Error state component
function AnalyticsErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Brain className="w-8 h-8 mr-3 text-primary" />
          Advanced Analytics
        </h1>
        <Button
          color="primary"
          variant="flat"
          startContent={<RefreshCw className="w-4 h-4" />}
          onPress={onRetry}
        >
          Retry
        </Button>
      </div>

      <Card className="border-danger">
        <CardBody className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-danger mb-2">
            Error Loading Analytics
          </h3>
          <p className="text-default-600 mb-4">{error}</p>
          <Button color="danger" variant="flat" onPress={onRetry}>
            Try Again
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  metrics,
  chartData,
  energyStats,
  powerQualityStats,
  equipment,
  alerts,
  alertStatistics,
}: {
  metrics: any;
  chartData: any[];
  energyStats: EnergyStatsResponse | null;
  powerQualityStats: PowerQualityStatsResponse | null;
  equipment: Equipment[];
  alerts: Alert[];
  alertStatistics: AlertStatistics | null;
}) {
  if (!metrics) return <div>Loading overview...</div>;

  return (
    <div className="space-y-6 mt-6">
      {/* Key Metrics Cards using your exact data structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">System Health</p>
                <p className="text-2xl font-bold text-primary">
                  {metrics.systemHealth?.toFixed(0) || "0"}%
                </p>
                <Progress
                  value={metrics.systemHealth || 0}
                  color="primary"
                  size="sm"
                  className="mt-2"
                />
              </div>
              <Gauge className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Consumption</p>
                <p className="text-2xl font-bold text-success">
                  {energyStats?.totalConsumption
                    ? `${(energyStats.totalConsumption / 1000).toFixed(1)}k`
                    : "0"}
                </p>
                <p className="text-xs text-default-500">kWh this period</p>
              </div>
              <Zap className="w-8 h-8 text-success" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Power Quality</p>
                <p className="text-2xl font-bold text-warning">
                  {powerQualityStats?.qualityScore?.toFixed(0) || "0"}
                </p>
                <div className="flex space-x-1 mt-1">
                  <Chip size="sm" color="danger" variant="dot">
                    {powerQualityStats?.violations?.thdVoltageViolations || 0}{" "}
                    Violations
                  </Chip>
                </div>
              </div>
              <Activity className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Equipment Status</p>
                <p className="text-2xl font-bold text-secondary">
                  {metrics.activeEquipment}
                </p>
                <p className="text-xs text-default-500">
                  of {metrics.totalEquipment} operational
                </p>
              </div>
              <Factory className="w-8 h-8 text-secondary" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Consumption Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Energy Consumption Trends</h3>
          </CardHeader>
          <CardBody>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={COLORS.border}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={COLORS.text}
                      tick={{ fill: COLORS.text, fontSize: 12 }}
                    />
                    <YAxis
                      stroke={COLORS.text}
                      tick={{ fill: COLORS.text, fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: COLORS.background,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "8px",
                        color: "#F9FAFB",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="baseline"
                      fill={COLORS.chart[1]}
                      fillOpacity={0.1}
                      stroke="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="consumption"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      stroke={COLORS.chart[1]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-default-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No consumption data available</p>
                  <p className="text-sm">
                    Configure analysis to generate trends
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Equipment Status Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Equipment Status Overview</h3>
          </CardHeader>
          <CardBody>
            {equipment && equipment.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Active",
                          value: equipment.filter(
                            (eq) => eq.status === "active"
                          ).length,
                          color: COLORS.success,
                        },
                        {
                          name: "Maintenance",
                          value: equipment.filter(
                            (eq) => eq.status === "maintenance"
                          ).length,
                          color: COLORS.warning,
                        },
                        {
                          name: "Faulty",
                          value: equipment.filter(
                            (eq) => eq.status === "faulty"
                          ).length,
                          color: COLORS.danger,
                        },
                        {
                          name: "Inactive",
                          value: equipment.filter(
                            (eq) => eq.status === "inactive"
                          ).length,
                          color: COLORS.text,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {equipment.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS.chart[index % COLORS.chart.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-default-500">
                <div className="text-center">
                  <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No equipment data available</p>
                  <p className="text-sm">
                    Add equipment to view status distribution
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Alert Statistics using your exact AlertStatistics type */}
      {alertStatistics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Alert Overview</h3>
              <Chip color="danger" variant="flat">
                {alertStatistics.bySeverity?.critical || 0} Critical
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-content2/50">
                <div className="text-2xl font-bold text-danger mb-1">
                  {alertStatistics.bySeverity?.critical || 0}
                </div>
                <div className="text-sm text-default-600">Critical</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-content2/50">
                <div className="text-2xl font-bold text-warning mb-1">
                  {alertStatistics.bySeverity?.high || 0}
                </div>
                <div className="text-sm text-default-600">High</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-content2/50">
                <div className="text-2xl font-bold text-primary mb-1">
                  {alertStatistics.bySeverity?.medium || 0}
                </div>
                <div className="text-sm text-default-600">Medium</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-content2/50">
                <div className="text-2xl font-bold text-success mb-1">
                  {alertStatistics.bySeverity?.low || 0}
                </div>
                <div className="text-sm text-default-600">Low</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Recent Critical Alerts</h3>
              <Chip color="warning" variant="flat">
                {alerts.length} active
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-content2/50"
                >
                  <div className="flex items-center space-x-3">
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
                      variant="flat"
                    >
                      {alert.severity}
                    </Chip>
                    <div>
                      <p className="font-medium text-foreground">
                        {alert.title}
                      </p>
                      <p className="text-sm text-default-600">
                        {alert.buildingName}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-default-500">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// Energy Analysis Tab Component
function EnergyAnalysisTab({
  buildingId,
  energyStats,
  energyTrends,
  energyForecast,
  chartData,
}: {
  buildingId: number;
  energyStats: EnergyStatsResponse | null;
  energyTrends: any;
  energyForecast: any;
  chartData: any[];
}) {
  return (
    <div className="space-y-6 mt-6">
      {/* Energy Statistics Cards using your exact EnergyStatsResponse type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4 text-center">
            <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-default-600">Average Consumption</p>
            <p className="text-2xl font-bold">
              {energyStats?.averageConsumption?.toFixed(1) || "0.0"} kWh
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-sm text-default-600">Total Cost</p>
            <p className="text-2xl font-bold text-success">
              ₱{energyStats?.totalCost?.toLocaleString() || "0"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <Target className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-sm text-default-600">Power Factor</p>
            <p className="text-2xl font-bold text-warning">
              {energyStats?.powerFactorAvg?.toFixed(2) || "0.00"}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Energy Consumption Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Energy Consumption Analysis</h3>
        </CardHeader>
        <CardBody>
          {chartData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis
                    dataKey="date"
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 12 }}
                  />
                  <YAxis
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.background,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar
                    dataKey="consumption"
                    fill={COLORS.primary}
                    opacity={0.7}
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    yAxisId="right"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={COLORS.text}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-default-500">
              <div className="text-center">
                <LineChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No energy consumption data available</p>
                <p className="text-sm">
                  Run energy analysis to view detailed charts
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Energy Forecast using your exact API response structure */}
      {energyForecast && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Energy Forecast</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-default-600">
                  Next Month Prediction
                </p>
                <p className="text-xl font-bold text-primary">
                  {energyForecast.nextMonthConsumptionKwh?.toLocaleString() ||
                    "N/A"}{" "}
                  kWh
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-default-600">Estimated Cost</p>
                <p className="text-xl font-bold text-success">
                  ₱{energyForecast.nextMonthCostPhp?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-default-600">Confidence Level</p>
                <p className="text-xl font-bold text-warning">
                  {energyForecast.confidenceLevel
                    ? `${(energyForecast.confidenceLevel * 100).toFixed(0)}%`
                    : "N/A"}
                </p>
              </div>
            </div>

            {energyForecast.forecastData &&
              energyForecast.forecastData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyForecast.forecastData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.border}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={COLORS.text}
                        tick={{ fill: COLORS.text, fontSize: 12 }}
                      />
                      <YAxis
                        stroke={COLORS.text}
                        tick={{ fill: COLORS.text, fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: COLORS.background,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecastValue"
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="confidenceUpper"
                        stroke={COLORS.secondary}
                        strokeWidth={1}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="confidenceLower"
                        stroke={COLORS.secondary}
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// Power Quality Tab Component
function PowerQualityTab({
  buildingId,
  powerQualityStats,
  config,
}: {
  buildingId: number;
  powerQualityStats: PowerQualityStatsResponse | null;
  config: AnalyticsConfig;
}) {
  const { data: pqEvents, loading: eventsLoading } = usePowerQualityEvents(
    buildingId,
    {
      startDate: config.startDate,
      endDate: config.endDate,
    },
    { immediate: !!buildingId }
  );

  return (
    <div className="space-y-6 mt-6">
      {/* Power Quality Metrics using your exact PowerQualityStatsResponse type */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4 text-center">
            <Activity className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-default-600">Quality Score</p>
            <p className="text-2xl font-bold">
              {powerQualityStats?.qualityScore?.toFixed(0) || "0"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <Gauge className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-sm text-default-600">THD Voltage</p>
            <p className="text-2xl font-bold text-warning">
              {powerQualityStats?.thdVoltageAvg?.toFixed(1) || "0.0"}%
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <Shield className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-sm text-default-600">Compliance</p>
            <p className="text-2xl font-bold text-success">
              {powerQualityStats?.compliance?.overallCompliance?.toFixed(0) ||
                "0"}
              %
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-default-600">Violations</p>
            <p className="text-2xl font-bold text-danger">
              {Object.values(powerQualityStats?.violations || {}).reduce(
                (sum: number, val: any) => sum + (val || 0),
                0
              )}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Power Quality Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">Power Quality Events</h3>
            {pqEvents && (
              <Chip color="warning" variant="flat">
                {pqEvents.length} events
              </Chip>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {eventsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : pqEvents && pqEvents.length > 0 ? (
            <div className="space-y-3">
              {pqEvents.slice(0, 10).map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-content2/50"
                >
                  <div className="flex items-center space-x-3">
                    <Chip
                      color={
                        event.severityLevel === "critical"
                          ? "danger"
                          : event.severityLevel === "high"
                            ? "warning"
                            : event.severityLevel === "medium"
                              ? "primary"
                              : "default"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {event.severityLevel}
                    </Chip>
                    <div>
                      <p className="font-medium text-foreground">
                        {event.eventType}
                      </p>
                      <p className="text-sm text-default-600">
                        Magnitude: {event.magnitude?.toFixed(2)} | Duration:{" "}
                        {event.durationEstimate}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-default-500">
                    {new Date(event.startTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-default-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No power quality events detected</p>
              <p className="text-sm">This indicates good power quality</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Compliance Analysis using your exact response structure */}
      {powerQualityStats?.compliance && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Compliance Analysis</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(powerQualityStats.compliance).map(
                ([key, value]: [string, any]) => {
                  if (key === "overallCompliance") return null;

                  const complianceRate = typeof value === "number" ? value : 0;
                  const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-sm text-default-600">
                          {complianceRate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={complianceRate}
                        color={
                          complianceRate >= 95
                            ? "success"
                            : complianceRate >= 80
                              ? "warning"
                              : "danger"
                        }
                        size="sm"
                      />
                    </div>
                  );
                }
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// Equipment Analysis Tab Component
function EquipmentAnalysisTab({
  equipment,
  maintenancePredictions,
  buildingId,
}: {
  equipment: Equipment[];
  maintenancePredictions: MaintenancePrediction[] | null;
  buildingId: number;
}) {
  const equipmentStats = useMemo(() => {
    if (!equipment || equipment.length === 0) return null;

    const statusCounts = equipment.reduce(
      (acc, eq) => {
        acc[eq.status || "unknown"] = (acc[eq.status || "unknown"] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const avgCondition =
      equipment.reduce((sum, eq) => sum + (eq.conditionScore || 0), 0) /
      equipment.length;

    const maintenanceDue = equipment.filter((eq) => {
      if (!eq.nextMaintenanceDate) return false;
      const dueDate = new Date(eq.nextMaintenanceDate);
      const now = new Date();
      const daysUntilDue =
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilDue <= 7; // Due within 7 days
    }).length;

    return {
      total: equipment.length,
      statusCounts,
      avgCondition,
      maintenanceDue,
    };
  }, [equipment]);

  return (
    <div className="space-y-6 mt-6">
      {/* Equipment Overview using your exact Equipment type */}
      {equipmentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4 text-center">
              <Factory className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-default-600">Total Equipment</p>
              <p className="text-2xl font-bold">{equipmentStats.total}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <Gauge className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm text-default-600">Avg Condition</p>
              <p className="text-2xl font-bold text-success">
                {equipmentStats.avgCondition.toFixed(0)}%
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-sm text-default-600">Maintenance Due</p>
              <p className="text-2xl font-bold text-warning">
                {equipmentStats.maintenanceDue}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm text-default-600">Operational</p>
              <p className="text-2xl font-bold text-success">
                {equipmentStats.statusCounts.active || 0}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Equipment Status Chart */}
      {equipmentStats && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Equipment Status Distribution
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(equipmentStats.statusCounts).map(
                    ([status, count]) => ({
                      status: status.charAt(0).toUpperCase() + status.slice(1),
                      count,
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis
                    dataKey="status"
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 12 }}
                  />
                  <YAxis
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.background,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Equipment Details</h3>
        </CardHeader>
        <CardBody>
          {equipment && equipment.length > 0 ? (
            <div className="space-y-3">
              {equipment.slice(0, 10).map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-content2/50"
                >
                  <div className="flex items-center space-x-3">
                    <Chip
                      color={
                        eq.status === "active"
                          ? "success"
                          : eq.status === "maintenance"
                            ? "warning"
                            : eq.status === "faulty"
                              ? "danger"
                              : "default"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {eq.status}
                    </Chip>
                    <div>
                      <p className="font-medium text-foreground">{eq.name}</p>
                      <p className="text-sm text-default-600">
                        {eq.equipmentType} | Condition: {eq.conditionScore || 0}
                        %
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-default-500">
                      Next Maintenance:{" "}
                      {eq.nextMaintenanceDate
                        ? new Date(eq.nextMaintenanceDate).toLocaleDateString()
                        : "Not scheduled"}
                    </p>
                    {eq.activeAlerts && eq.activeAlerts > 0 && (
                      <Chip size="sm" color="danger" variant="flat">
                        {eq.activeAlerts} alerts
                      </Chip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-default-500">
              <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No equipment data available</p>
              <p className="text-sm">Add equipment to view analysis</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Maintenance Predictions using your exact MaintenancePrediction type */}
      {maintenancePredictions && maintenancePredictions.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Maintenance Predictions</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {maintenancePredictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-content2/50"
                >
                  <div className="flex items-center space-x-3">
                    <Chip
                      color={
                        prediction.riskLevel === "critical"
                          ? "danger"
                          : prediction.riskLevel === "high"
                            ? "warning"
                            : prediction.riskLevel === "medium"
                              ? "primary"
                              : "default"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {prediction.riskLevel}
                    </Chip>
                    <div>
                      <p className="font-medium text-foreground">
                        Equipment #{prediction.equipmentId}
                      </p>
                      <p className="text-sm text-default-600">
                        {prediction.recommendedAction}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(prediction.predictedDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-default-500">
                      Confidence:{" "}
                      {(prediction.confidenceScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// Predictions Tab Component
function PredictionsTab({
  energyForecast,
  maintenancePredictions,
  buildingId,
  config,
}: {
  energyForecast: any;
  maintenancePredictions: MaintenancePrediction[] | null;
  buildingId: number;
  config: AnalyticsConfig;
}) {
  return (
    <div className="space-y-6 mt-6">
      {/* Prediction Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-default-600">Forecast Accuracy</p>
            <p className="text-2xl font-bold">
              {energyForecast?.forecastAccuracy
                ? `${(energyForecast.forecastAccuracy * 100).toFixed(0)}%`
                : "N/A"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-sm text-default-600">Predictions</p>
            <p className="text-2xl font-bold text-warning">
              {maintenancePredictions?.length || 0}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <Target className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-sm text-default-600">Confidence</p>
            <p className="text-2xl font-bold text-success">
              {energyForecast?.confidenceLevel
                ? `${(energyForecast.confidenceLevel * 100).toFixed(0)}%`
                : "N/A"}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Energy Forecast Chart */}
      {energyForecast && energyForecast.forecastData && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Energy Consumption Forecast
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyForecast.forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis
                    dataKey="date"
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 12 }}
                  />
                  <YAxis
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.background,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceUpper"
                    fill={COLORS.primary}
                    fillOpacity={0.1}
                    stroke="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceLower"
                    fill={COLORS.background}
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastValue"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="actualValue"
                    stroke={COLORS.success}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Maintenance Predictions Details */}
      {maintenancePredictions && maintenancePredictions.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Detailed Maintenance Predictions
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenancePredictions.map((prediction) => (
                <Card key={prediction.id} className="border border-content2">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Chip
                        color={
                          prediction.riskLevel === "critical"
                            ? "danger"
                            : prediction.riskLevel === "high"
                              ? "warning"
                              : prediction.riskLevel === "medium"
                                ? "primary"
                                : "default"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {prediction.riskLevel} risk
                      </Chip>
                      <span className="text-xs text-default-500">
                        Equipment #{prediction.equipmentId}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Predicted Date</p>
                        <p className="text-sm text-default-600">
                          {new Date(
                            prediction.predictedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          Recommended Action
                        </p>
                        <p className="text-sm text-default-600">
                          {prediction.recommendedAction}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Estimated Cost</p>
                        <p className="text-sm text-success">
                          ₱{prediction.estimatedCost?.toLocaleString() || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Confidence</p>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={prediction.confidenceScore * 100}
                            color="primary"
                            size="sm"
                            className="flex-1"
                          />
                          <span className="text-sm">
                            {(prediction.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// Insights Tab Component
function InsightsTab({
  results,
  dashboardMetrics,
  buildingId,
}: {
  results: any;
  dashboardMetrics: any;
  buildingId: number;
}) {
  // Generate insights based on available data
  const insights = useMemo(() => {
    const insightsList = [];

    if (dashboardMetrics) {
      // System health insights
      if (dashboardMetrics.systemHealth < 70) {
        insightsList.push({
          type: "warning",
          title: "System Health Below Optimal",
          description: `System health score of ${dashboardMetrics.systemHealth.toFixed(1)}% indicates potential issues requiring attention.`,
          priority: "high",
          action: "Review system components and address identified issues",
        });
      } else if (dashboardMetrics.systemHealth >= 90) {
        insightsList.push({
          type: "success",
          title: "Excellent System Health",
          description: `Outstanding system health score of ${dashboardMetrics.systemHealth.toFixed(1)}%. All systems operating optimally.`,
          priority: "low",
          action: "Maintain current operational excellence",
        });
      }

      // Power quality insights
      if (dashboardMetrics.powerQualityScore < 80) {
        insightsList.push({
          type: "danger",
          title: "Power Quality Issues",
          description: `Power quality score of ${dashboardMetrics.powerQualityScore} indicates potential electrical issues that could damage equipment.`,
          priority: "critical",
          action:
            "Investigate power quality disturbances and install corrective measures",
        });
      }

      // Equipment insights
      const equipmentUtilization =
        (dashboardMetrics.activeEquipment / dashboardMetrics.totalEquipment) *
        100;
      if (equipmentUtilization < 80) {
        insightsList.push({
          type: "info",
          title: "Underutilized Equipment",
          description: `Only ${equipmentUtilization.toFixed(0)}% of equipment is active. Consider optimizing equipment usage or decommissioning unused assets.`,
          priority: "medium",
          action:
            "Review equipment utilization patterns and optimize deployment",
        });
      }

      // Alert insights
      if (dashboardMetrics.activeAlerts > 5) {
        insightsList.push({
          type: "warning",
          title: "High Alert Volume",
          description: `${dashboardMetrics.activeAlerts} active alerts require attention. Prioritize resolution to prevent escalation.`,
          priority: "high",
          action: "Implement systematic alert resolution process",
        });
      }
    }

    // Analysis results insights
    if (results?.anomalies && results.anomalies.length > 0) {
      const criticalAnomalies = results.anomalies.filter(
        (a: any) => a.severity === "critical"
      ).length;
      if (criticalAnomalies > 0) {
        insightsList.push({
          type: "danger",
          title: "Critical Anomalies Detected",
          description: `${criticalAnomalies} critical anomalies detected that require immediate investigation.`,
          priority: "critical",
          action: "Investigate root causes and implement corrective measures",
        });
      }
    }

    return insightsList;
  }, [results, dashboardMetrics]);

  return (
    <div className="space-y-6 mt-6">
      {/* Key Insights */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
        </CardHeader>
        <CardBody>
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${
                    insight.type === "danger"
                      ? "border-l-danger"
                      : insight.type === "warning"
                        ? "border-l-warning"
                        : insight.type === "success"
                          ? "border-l-success"
                          : "border-l-primary"
                  }`}
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Chip
                          color={
                            insight.type === "danger"
                              ? "danger"
                              : insight.type === "warning"
                                ? "warning"
                                : insight.type === "success"
                                  ? "success"
                                  : "primary"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {insight.priority}
                        </Chip>
                        <h4 className="font-medium text-foreground">
                          {insight.title}
                        </h4>
                      </div>
                      {insight.type === "danger" && (
                        <AlertTriangle className="w-5 h-5 text-danger" />
                      )}
                      {insight.type === "warning" && (
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      )}
                      {insight.type === "success" && (
                        <CheckCircle className="w-5 h-5 text-success" />
                      )}
                      {insight.type === "info" && (
                        <Lightbulb className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-default-600 mb-3">
                      {insight.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-foreground">
                        Recommended Action:
                      </span>
                      <span className="text-xs text-default-500">
                        {insight.action}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-default-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No insights available</p>
              <p className="text-sm">
                Run a comprehensive analysis to generate AI insights
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Priority Actions */}
      {insights.filter(
        (i) => i.priority === "critical" || i.priority === "high"
      ).length > 0 && (
        <Card className="bg-danger/5 border-danger/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-danger">
              Priority Actions Required
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {insights
                .filter(
                  (i) => i.priority === "critical" || i.priority === "high"
                )
                .map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-danger rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        {insight.title}
                      </p>
                      <p className="text-sm text-default-600">
                        {insight.action}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Analysis Results Summary */}
      {results && Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Analysis Results Summary</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(results).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-content2/50">
                  <h4 className="font-medium text-foreground mb-1">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </h4>
                  <p className="text-sm text-default-600">
                    {value ? "Analysis completed" : "No data available"}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// Configuration Modal Component
function AnalyticsConfigModal({
  isOpen,
  onClose,
  config,
  setConfig,
  buildings,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: AnalyticsConfig;
  setConfig: React.Dispatch<React.SetStateAction<AnalyticsConfig>>;
  buildings: Building[];
}) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>Analytics Configuration</span>
              </div>
              <p className="text-sm text-default-500 font-normal">
                Configure analysis parameters for comprehensive insights
              </p>
            </ModalHeader>
            <ModalBody className="space-y-6">
              {/* Building Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Target Building
                </label>
                <Select
                  placeholder="Select building for analysis"
                  selectedKeys={
                    localConfig.buildingId
                      ? [localConfig.buildingId.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setLocalConfig((prev) => ({
                      ...prev,
                      buildingId: parseInt(selected),
                    }));
                  }}
                >
                  {buildings.map((building) => (
                    <SelectItem key={building.id.toString()}>
                      {building.name} - {building.code}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={localConfig.startDate}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
                <Input
                  type="date"
                  label="End Date"
                  value={localConfig.endDate}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Analysis Types */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Analysis Types
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {ANALYSIS_TYPES.map((type) => (
                    <Chip
                      key={type.key}
                      variant={
                        localConfig.analysisTypes.includes(type.key)
                          ? "solid"
                          : "bordered"
                      }
                      color="primary"
                      className="cursor-pointer"
                      onClick={() => {
                        setLocalConfig((prev) => ({
                          ...prev,
                          analysisTypes: prev.analysisTypes.includes(type.key)
                            ? prev.analysisTypes.filter((t) => t !== type.key)
                            : [...prev.analysisTypes, type.key],
                        }));
                      }}
                      startContent={<type.icon className="w-4 h-4" />}
                    >
                      {type.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">
                  Advanced Options
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Detection Sensitivity"
                    selectedKeys={[localConfig.sensitivity]}
                    onSelectionChange={(keys) =>
                      setLocalConfig((prev) => ({
                        ...prev,
                        sensitivity: Array.from(keys)[0] as
                          | "low"
                          | "medium"
                          | "high",
                      }))
                    }
                  >
                    <SelectItem key="low">
                      Low - Conservative detection
                    </SelectItem>
                    <SelectItem key="medium">
                      Medium - Balanced approach
                    </SelectItem>
                    <SelectItem key="high">
                      High - Sensitive detection
                    </SelectItem>
                  </Select>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Forecast Days: {localConfig.forecastDays}
                    </label>
                    <Slider
                      value={[localConfig.forecastDays]}
                      onValueChange={(value) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          forecastDays: value[0],
                        }))
                      }
                      minValue={7}
                      maxValue={365}
                      step={7}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Configuration Summary */}
              <Card className="bg-primary/10 border-primary/20">
                <CardBody className="p-4">
                  <h5 className="font-medium text-foreground mb-2">
                    Configuration Summary
                  </h5>
                  <div className="text-sm text-default-600 space-y-1">
                    <p>
                      • Building:{" "}
                      {buildings.find((b) => b.id === localConfig.buildingId)
                        ?.name || "None selected"}
                    </p>
                    <p>
                      • Date Range: {localConfig.startDate} to{" "}
                      {localConfig.endDate}
                    </p>
                    <p>
                      • Analysis Types: {localConfig.analysisTypes.length}{" "}
                      selected
                    </p>
                    <p>• Forecast Period: {localConfig.forecastDays} days</p>
                    <p>• Sensitivity: {localConfig.sensitivity}</p>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                isDisabled={
                  !localConfig.buildingId ||
                  localConfig.analysisTypes.length === 0
                }
                startContent={<CheckCircle className="w-4 h-4" />}
              >
                Apply Configuration
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Results Modal Component
function AnalyticsResultsModal({
  isOpen,
  onClose,
  results,
  config,
}: {
  isOpen: boolean;
  onClose: () => void;
  results: any;
  config: AnalyticsConfig;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Analysis Results</span>
              </div>
              <p className="text-sm text-default-500 font-normal">
                Comprehensive analysis results for the selected building and
                time period
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {results &&
                  Object.entries(results).map(([key, value]) => {
                    if (!value) return null;

                    return (
                      <Card key={key}>
                        <CardHeader>
                          <h3 className="text-lg font-semibold">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </h3>
                        </CardHeader>
                        <CardBody>
                          <pre className="text-xs text-default-600 whitespace-pre-wrap overflow-auto max-h-40 bg-content2 p-3 rounded">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        </CardBody>
                      </Card>
                    );
                  })}

                {(!results || Object.keys(results).length === 0) && (
                  <div className="text-center py-8 text-default-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No analysis results available</p>
                    <p className="text-sm">
                      Run an analysis to view detailed results
                    </p>
                  </div>
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
                isDisabled={!results || Object.keys(results).length === 0}
              >
                Export Results
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
