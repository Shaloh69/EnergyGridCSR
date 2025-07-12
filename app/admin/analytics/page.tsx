// app/admin/analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  ScatterChart,
  Scatter,
} from "recharts";

// HeroUI Components
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";

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
  Leaf,
  Activity,
  Eye,
  Play,
  RefreshCw,
  Download,
  Calendar,
  Settings,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Database,
  Brain,
  Gauge,
} from "lucide-react";

// API and Types - Using your exact API structure
import {
  analyticsAPI,
  buildingsAPI,
  energyAPI,
  powerQualityAPI,
  equipmentAPI,
  alertsAPI,
} from "@/lib/api";
import type {
  Building,
  ApiResponse,
  AnomalyDetectionResult,
  AnalysisRequest,
  EnergyEfficiencyAnalysis,
  BuildingQueryParams,
  EnergyStatsResponse,
  PowerQualityStatsResponse,
  EnergyQueryParams,
  PowerQualityQueryParams,
  Equipment,
  Alert,
  ForecastResult,
} from "@/types/api-types";

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
};

const analysisTypes = [
  { key: "energy", label: "Energy Analysis" },
  { key: "power_quality", label: "Power Quality" },
  { key: "equipment", label: "Equipment Analysis" },
];

export default function AnalyticsPage() {
  // State Management
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetectionResult[]>([]);
  const [energyStats, setEnergyStats] = useState<EnergyStatsResponse | null>(
    null
  );
  const [powerQualityStats, setPowerQualityStats] =
    useState<PowerQualityStatsResponse | null>(null);
  const [energyTrends, setEnergyTrends] = useState<any[]>([]);
  const [powerQualityTrends, setPowerQualityTrends] = useState<any[]>([]);
  const [efficiencyAnalysis, setEfficiencyAnalysis] =
    useState<EnergyEfficiencyAnalysis | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis Parameters
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [analysisTypeFilter, setAnalysisTypeFilter] = useState<string[]>([
    "energy",
    "power_quality",
    "equipment",
  ]);

  // Modal Controls
  const {
    isOpen: isAnomalyOpen,
    onOpen: onAnomalyOpen,
    onClose: onAnomalyClose,
  } = useDisclosure();
  const {
    isOpen: isRunAnalysisOpen,
    onOpen: onRunAnalysisOpen,
    onClose: onRunAnalysisClose,
  } = useDisclosure();

  // Selected anomaly for details
  const [selectedAnomaly, setSelectedAnomaly] =
    useState<AnomalyDetectionResult | null>(null);

  // Advanced Analysis Parameters
  const [advancedParams, setAdvancedParams] = useState({
    sensitivity: "medium",
    threshold_deviation: "2.5",
    minimum_duration_minutes: "15",
  });

  // Effect for initial data loading
  useEffect(() => {
    loadInitialData();
  }, []);

  // Effect for building-specific data
  useEffect(() => {
    if (selectedBuilding) {
      loadBuildingSpecificData();
    }
  }, [selectedBuilding]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load buildings using exact API structure
      const buildingParams: BuildingQueryParams = {
        status: "active",
        limit: 50,
        sortBy: "name",
        sortOrder: "ASC",
      };

      const buildingsRes = await buildingsAPI.getAll(buildingParams);

      if (buildingsRes.data.success) {
        const buildingData = buildingsRes.data.data;
        setBuildings(Array.isArray(buildingData) ? buildingData : []);

        // Auto-select first building
        if (Array.isArray(buildingData) && buildingData.length > 0) {
          setSelectedBuilding(buildingData[0].id.toString());
        }
      }

      // Load recent alerts
      const alertsRes = await alertsAPI.getAll({
        limit: 10,
        sortBy: "created_at",
        sortOrder: "DESC",
        status: "active",
      });

      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load initial data:", error);
      setError("Failed to load initial data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingSpecificData = async () => {
    if (!selectedBuilding) return;

    try {
      const buildingId = Number(selectedBuilding);

      // Load equipment for the selected building
      const equipmentRes = await equipmentAPI.getAll({
        building_id: buildingId,
        status: "active",
        limit: 50,
      });

      if (equipmentRes.data.success) {
        setEquipment(equipmentRes.data.data);
      }

      // Load energy stats
      const energyStatsRes = await energyAPI.getStats(buildingId);
      if (energyStatsRes.data.success) {
        setEnergyStats(energyStatsRes.data.data);
      }

      // Load power quality stats
      const pqStatsRes = await powerQualityAPI.getStats(buildingId);
      if (pqStatsRes.data.success) {
        setPowerQualityStats(pqStatsRes.data.data);
      }

      // Load energy trends
      const energyTrendsRes = await energyAPI.getTrends(buildingId, {
        period: "30d",
        interval: "daily",
      });
      if (energyTrendsRes.data.success) {
        setEnergyTrends(energyTrendsRes.data.data.trends || []);
      }

      // Load power quality trends
      const pqTrendsRes = await powerQualityAPI.getTrends(buildingId, "30d");
      if (pqTrendsRes.data.success) {
        setPowerQualityTrends(pqTrendsRes.data.data.trends || []);
      }

      // Load efficiency analysis
      const efficiencyRes = await energyAPI.getBenchmarking(buildingId);
      if (efficiencyRes.data.success) {
        setEfficiencyAnalysis(efficiencyRes.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load building-specific data:", error);
    }
  };

  const runAnalysis = async () => {
    if (!selectedBuilding) {
      setError("Please select a building first");
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      // Prepare analysis request using exact API types
      const analysisRequest: AnalysisRequest = {
        building_id: Number(selectedBuilding),
        start_date: startDate + "T00:00:00Z",
        end_date: endDate + "T23:59:59Z",
        analysis_types: analysisTypeFilter as (
          | "energy"
          | "power_quality"
          | "equipment"
        )[],
        parameters: {
          sensitivity: advancedParams.sensitivity,
          threshold_deviation: Number(advancedParams.threshold_deviation),
          minimum_duration_minutes: Number(
            advancedParams.minimum_duration_minutes
          ),
        },
      };

      const response = await analyticsAPI.runAnalysis(analysisRequest);

      if (response.data.success) {
        // Reload all data after analysis
        await loadBuildingSpecificData();
      }

      // Run anomaly detection if included
      if (
        analysisTypeFilter.includes("energy") ||
        analysisTypeFilter.includes("equipment")
      ) {
        await runAnomalyDetection();
      }
    } catch (error: any) {
      console.error("Failed to run analysis:", error);
      setError("Failed to run analysis. Please try again.");
    } finally {
      setAnalyzing(false);
      onRunAnalysisClose();
    }
  };

  const runAnomalyDetection = async () => {
    if (!selectedBuilding) return;

    try {
      const detectionData = {
        building_id: Number(selectedBuilding),
        start_date: startDate + "T00:00:00Z",
        end_date: endDate + "T23:59:59Z",
        analysis_types: analysisTypeFilter as (
          | "energy"
          | "power_quality"
          | "equipment"
        )[],
        parameters: {
          sensitivity: advancedParams.sensitivity,
          threshold_deviation: Number(advancedParams.threshold_deviation),
          minimum_duration_minutes: Number(
            advancedParams.minimum_duration_minutes
          ),
        },
      };

      const response = await analyticsAPI.detectAnomalies(detectionData);

      if (response.data.success) {
        const anomalyResults = response.data.data;
        setAnomalies(Array.isArray(anomalyResults) ? anomalyResults : []);
      }
    } catch (error: any) {
      console.error("Failed to run anomaly detection:", error);
    }
  };

  const openAnomalyModal = (anomaly: AnomalyDetectionResult) => {
    setSelectedAnomaly(anomaly);
    onAnomalyOpen();
  };

  const getSeverityColor = (
    severity: string
  ): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityColor = (
    priority: string
  ): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (priority) {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-primary" />
            Analytics Dashboard
          </h1>
          <Button
            color="primary"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={loadInitialData}
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
            <Button color="danger" variant="flat" onPress={loadInitialData}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-default-500 mt-1">
            Advanced analytics and insights for energy optimization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            color="secondary"
            variant="bordered"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={loadBuildingSpecificData}
            isDisabled={loading || analyzing}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            startContent={<Play className="w-4 h-4" />}
            onPress={onRunAnalysisOpen}
            isDisabled={loading || analyzing}
          >
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Building"
              placeholder="Select building"
              selectedKeys={selectedBuilding ? [selectedBuilding] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedBuilding(selected);
              }}
              isDisabled={loading}
            >
              {buildings.map((building) => (
                <SelectItem key={building.id.toString()}>
                  {building.name}
                </SelectItem>
              ))}
            </Select>

            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              isDisabled={analyzing}
            />

            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              isDisabled={analyzing}
            />

            <Button
              color="primary"
              variant="flat"
              onPress={runAnalysis}
              isLoading={analyzing}
              isDisabled={!selectedBuilding}
            >
              Quick Analysis
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Key Metrics from Real API Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Energy Efficiency Score */}
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Energy Efficiency</p>
                <p className="text-2xl font-bold">
                  {energyStats?.efficiency_score?.toFixed(1) || "0.0"}%
                </p>
                <Progress
                  value={energyStats?.efficiency_score || 0}
                  color="primary"
                  size="sm"
                  className="mt-2"
                />
              </div>
              <Gauge className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>

        {/* Total Consumption */}
        <Card className="border-l-4 border-l-success">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Consumption</p>
                <p className="text-2xl font-bold text-success">
                  {energyStats?.total_consumption
                    ? `${(energyStats.total_consumption / 1000).toFixed(1)}k`
                    : "0"}
                </p>
                <p className="text-xs text-default-500">kWh this period</p>
              </div>
              <Zap className="w-8 h-8 text-success" />
            </div>
          </CardBody>
        </Card>

        {/* Power Quality Score */}
        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Power Quality</p>
                <p className="text-2xl font-bold text-warning">
                  {powerQualityStats?.quality_score?.toFixed(0) || "0"}
                </p>
                <div className="flex space-x-1 mt-1">
                  <Chip size="sm" color="danger" variant="dot">
                    {powerQualityStats?.violations?.thd_voltage_violations || 0}{" "}
                    THD
                  </Chip>
                </div>
              </div>
              <Activity className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>

        {/* Active Equipment */}
        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Active Equipment</p>
                <p className="text-2xl font-bold text-secondary">
                  {equipment.filter((eq) => eq.status === "active").length}
                </p>
                <p className="text-xs text-default-500">
                  of {equipment.length} total
                </p>
              </div>
              <Database className="w-8 h-8 text-secondary" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Real Data Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Consumption Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Energy Consumption Trends</h3>
          </CardHeader>
          <CardBody>
            {energyTrends.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={energyTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={COLORS.border}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={COLORS.text}
                      tick={{ fill: COLORS.text }}
                    />
                    <YAxis stroke={COLORS.text} tick={{ fill: COLORS.text }} />
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
                      dataKey="consumption"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-default-500">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No energy trend data available</p>
                  <p className="text-sm">Run an analysis to generate trends</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Power Quality Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Power Quality Trends</h3>
          </CardHeader>
          <CardBody>
            {powerQualityTrends.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={powerQualityTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={COLORS.border}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={COLORS.text}
                      tick={{ fill: COLORS.text }}
                    />
                    <YAxis stroke={COLORS.text} tick={{ fill: COLORS.text }} />
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
                      dataKey="quality_score"
                      stroke={COLORS.secondary}
                      fill={COLORS.secondary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-default-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No power quality data available</p>
                  <p className="text-sm">
                    Check power quality monitoring setup
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Equipment Status Overview */}
      {equipment.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Equipment Overview</h3>
              <Chip color="primary" variant="flat">
                {equipment.length} equipment
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["active", "maintenance", "faulty", "inactive"].map((status) => {
                const count = equipment.filter(
                  (eq) => eq.status === status
                ).length;
                const percentage =
                  equipment.length > 0 ? (count / equipment.length) * 100 : 0;

                return (
                  <div
                    key={status}
                    className="text-center p-4 rounded-lg bg-content2/50"
                  >
                    <div className="text-2xl font-bold mb-1">{count}</div>
                    <div className="text-sm text-default-600 capitalize mb-2">
                      {status}
                    </div>
                    <Progress
                      value={percentage}
                      color={
                        status === "active"
                          ? "success"
                          : status === "maintenance"
                            ? "warning"
                            : status === "faulty"
                              ? "danger"
                              : "default"
                      }
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Recent Alerts</h3>
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
                      color={getSeverityColor(alert.severity)}
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
                        {alert.building_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-default-500">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Anomalies Section */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Detected Anomalies</h3>
              <Chip color="warning" variant="flat">
                {anomalies.length} anomalies
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anomalies.slice(0, 6).map((anomaly, index) => (
                <Card
                  key={index}
                  className="border border-content2 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openAnomalyModal(anomaly)}
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Chip
                        color={getSeverityColor(anomaly.severity)}
                        size="sm"
                        variant="flat"
                      >
                        {anomaly.severity}
                      </Chip>
                      <div className="text-xs text-default-500">
                        {new Date(anomaly.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <h5 className="font-medium text-foreground mb-1">
                      {anomaly.type.replace("_", " ").toUpperCase()}
                    </h5>
                    <p className="text-sm text-default-600 mb-3 line-clamp-2">
                      {anomaly.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-danger font-medium">
                        {anomaly.detected_value.toFixed(2)}
                      </span>
                      <span className="text-default-500">
                        vs {anomaly.expected_value.toFixed(2)} expected
                      </span>
                    </div>
                    {anomaly.confidence_score && (
                      <div className="mt-2">
                        <div className="text-xs text-default-500 mb-1">
                          Confidence:{" "}
                          {(anomaly.confidence_score * 100).toFixed(0)}%
                        </div>
                        <Progress
                          value={anomaly.confidence_score * 100}
                          color="secondary"
                          size="sm"
                        />
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Energy Efficiency Analysis */}
      {efficiencyAnalysis && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Energy Efficiency Analysis
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {efficiencyAnalysis.efficiency_score?.toFixed(1) || "0.0"}%
                </div>
                <div className="text-sm text-default-600">
                  Overall Efficiency
                </div>
                <Progress
                  value={efficiencyAnalysis.efficiency_score || 0}
                  color="primary"
                  size="lg"
                  className="mt-2"
                />
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">
                  ₱
                  {(
                    efficiencyAnalysis.savings_opportunities?.reduce(
                      (total, opp) => total + opp.potential_savings_php,
                      0
                    ) || 0
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-default-600">
                  Annual Savings Potential
                </div>
                <div className="text-xs text-default-500 mt-1">
                  Based on efficiency improvements
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  {efficiencyAnalysis.consumption_patterns?.load_factor?.toFixed(
                    2
                  ) || "0.00"}
                </div>
                <div className="text-sm text-default-600">Load Factor</div>
                <div className="text-xs text-default-500 mt-1">
                  Efficiency indicator
                </div>
              </div>
            </div>

            {efficiencyAnalysis.savings_opportunities &&
              efficiencyAnalysis.savings_opportunities.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Savings Opportunities</h4>
                  <div className="space-y-3">
                    {efficiencyAnalysis.savings_opportunities.map(
                      (opportunity, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-content2/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-foreground">
                              {opportunity.category}
                            </h5>
                            <Chip
                              color={
                                opportunity.confidence_level === "high"
                                  ? "success"
                                  : opportunity.confidence_level === "medium"
                                    ? "warning"
                                    : "default"
                              }
                              size="sm"
                              variant="flat"
                            >
                              {opportunity.confidence_level} confidence
                            </Chip>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-default-500">
                                Energy Savings:
                              </span>
                              <div className="font-medium text-primary">
                                {opportunity.potential_savings_kwh.toLocaleString()}{" "}
                                kWh/year
                              </div>
                            </div>
                            <div>
                              <span className="text-default-500">
                                Cost Savings:
                              </span>
                              <div className="font-medium text-success">
                                ₱
                                {opportunity.potential_savings_php.toLocaleString()}
                                /year
                              </div>
                            </div>
                            <div>
                              <span className="text-default-500">Payback:</span>
                              <div className="font-medium">
                                {opportunity.payback_period_months.toFixed(1)}{" "}
                                months
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </CardBody>
        </Card>
      )}

      {/* Run Analysis Modal */}
      <Modal
        isOpen={isRunAnalysisOpen}
        onOpenChange={onRunAnalysisClose}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <span>Configure Analysis</span>
                </div>
                <p className="text-sm text-default-500 font-normal">
                  Set parameters for comprehensive analytics
                </p>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Select
                  label="Building"
                  placeholder="Select building"
                  selectedKeys={selectedBuilding ? [selectedBuilding] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedBuilding(selected);
                  }}
                  isRequired
                >
                  {buildings.map((building) => (
                    <SelectItem key={building.id.toString()}>
                      {building.name}
                    </SelectItem>
                  ))}
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    isRequired
                  />
                  <Input
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    isRequired
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Analysis Types
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {analysisTypes.map((type) => (
                      <Chip
                        key={type.key}
                        variant={
                          analysisTypeFilter.includes(type.key)
                            ? "solid"
                            : "bordered"
                        }
                        color="primary"
                        className="cursor-pointer"
                        onClick={() => {
                          setAnalysisTypeFilter((prev) =>
                            prev.includes(type.key)
                              ? prev.filter((t) => t !== type.key)
                              : [...prev, type.key]
                          );
                        }}
                      >
                        {type.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    Advanced Parameters
                  </h4>

                  <Select
                    label="Detection Sensitivity"
                    selectedKeys={[advancedParams.sensitivity]}
                    onSelectionChange={(keys) =>
                      setAdvancedParams((prev) => ({
                        ...prev,
                        sensitivity: Array.from(keys)[0] as string,
                      }))
                    }
                  >
                    <SelectItem key="low">
                      Low - Less sensitive, fewer false positives
                    </SelectItem>
                    <SelectItem key="medium">
                      Medium - Balanced detection
                    </SelectItem>
                    <SelectItem key="high">
                      High - More sensitive, may include minor anomalies
                    </SelectItem>
                  </Select>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Threshold Deviation"
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="5.0"
                      value={advancedParams.threshold_deviation}
                      onChange={(e) =>
                        setAdvancedParams((prev) => ({
                          ...prev,
                          threshold_deviation: e.target.value,
                        }))
                      }
                      description="Standard deviations from normal"
                    />

                    <Input
                      label="Min Duration (minutes)"
                      type="number"
                      min="1"
                      max="1440"
                      value={advancedParams.minimum_duration_minutes}
                      onChange={(e) =>
                        setAdvancedParams((prev) => ({
                          ...prev,
                          minimum_duration_minutes: e.target.value,
                        }))
                      }
                      description="Minimum anomaly duration"
                    />
                  </div>
                </div>

                <Card className="bg-primary/10 border-primary/20">
                  <CardBody className="p-3">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-default-600">
                        <p className="font-medium text-foreground mb-1">
                          Analysis Tips:
                        </p>
                        <ul className="space-y-1">
                          <li>
                            • Longer date ranges provide better trend analysis
                          </li>
                          <li>
                            • Higher sensitivity may detect minor fluctuations
                          </li>
                          <li>
                            • Include all analysis types for comprehensive
                            insights
                          </li>
                        </ul>
                      </div>
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
                  onPress={runAnalysis}
                  isLoading={analyzing}
                  isDisabled={
                    !selectedBuilding || analysisTypeFilter.length === 0
                  }
                  startContent={
                    !analyzing ? <Play className="w-4 h-4" /> : undefined
                  }
                >
                  {analyzing ? "Analyzing..." : "Run Analysis"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Anomaly Detail Modal */}
      <Modal
        isOpen={isAnomalyOpen}
        onOpenChange={onAnomalyClose}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  <Chip
                    color={getSeverityColor(selectedAnomaly?.severity || "")}
                    size="sm"
                  >
                    {selectedAnomaly?.severity}
                  </Chip>
                  <span>Anomaly Details</span>
                  {selectedAnomaly?.status && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        selectedAnomaly.status === "resolved"
                          ? "success"
                          : "warning"
                      }
                      startContent={
                        selectedAnomaly.status === "resolved" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )
                      }
                    >
                      {selectedAnomaly.status}
                    </Chip>
                  )}
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedAnomaly && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold flex items-center">
                          <Activity className="w-4 h-4 mr-2" />
                          Detection Information
                        </h4>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong className="text-sm">Type:</strong>
                            <p className="text-sm text-default-600">
                              {selectedAnomaly.type
                                .replace("_", " ")
                                .toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <strong className="text-sm">Timestamp:</strong>
                            <p className="text-sm text-default-600">
                              {new Date(
                                selectedAnomaly.timestamp
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <strong className="text-sm">Detected Value:</strong>
                            <p className="text-sm">
                              <span className="text-danger font-medium">
                                {selectedAnomaly.detected_value.toFixed(2)}
                              </span>
                            </p>
                          </div>
                          <div>
                            <strong className="text-sm">Expected Value:</strong>
                            <p className="text-sm text-default-600">
                              {selectedAnomaly.expected_value.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <strong className="text-sm">Deviation:</strong>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm">
                              {(
                                (Math.abs(
                                  selectedAnomaly.detected_value -
                                    selectedAnomaly.expected_value
                                ) /
                                  selectedAnomaly.expected_value) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                            <Progress
                              value={Math.min(
                                (Math.abs(
                                  selectedAnomaly.detected_value -
                                    selectedAnomaly.expected_value
                                ) /
                                  selectedAnomaly.expected_value) *
                                  100,
                                100
                              )}
                              color="danger"
                              size="sm"
                              className="flex-1"
                            />
                          </div>
                        </div>

                        {selectedAnomaly.confidence_score && (
                          <div>
                            <strong className="text-sm">
                              Confidence Score:
                            </strong>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm">
                                {(
                                  selectedAnomaly.confidence_score * 100
                                ).toFixed(0)}
                                %
                              </span>
                              <Progress
                                value={selectedAnomaly.confidence_score * 100}
                                color="secondary"
                                size="sm"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Description</h4>
                      </CardHeader>
                      <CardBody>
                        <p className="text-sm text-default-600">
                          {selectedAnomaly.description}
                        </p>
                      </CardBody>
                    </Card>

                    {selectedAnomaly.root_cause_analysis && (
                      <Card>
                        <CardHeader>
                          <h4 className="font-semibold flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Root Cause Analysis
                          </h4>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div>
                            <strong className="text-sm">Primary Cause:</strong>
                            <p className="text-sm text-default-600 mt-1">
                              {
                                selectedAnomaly.root_cause_analysis
                                  .primary_cause
                              }
                            </p>
                          </div>

                          {selectedAnomaly.root_cause_analysis
                            .contributing_factors.length > 0 && (
                            <div>
                              <strong className="text-sm">
                                Contributing Factors:
                              </strong>
                              <ul className="text-sm text-default-600 mt-1 space-y-1">
                                {selectedAnomaly.root_cause_analysis.contributing_factors.map(
                                  (factor, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start"
                                    >
                                      <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 mr-2 flex-shrink-0" />
                                      {factor}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {selectedAnomaly.root_cause_analysis
                            .probability_score && (
                            <div>
                              <strong className="text-sm">
                                Probability Score:
                              </strong>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm">
                                  {(
                                    selectedAnomaly.root_cause_analysis
                                      .probability_score * 100
                                  ).toFixed(0)}
                                  %
                                </span>
                                <Progress
                                  value={
                                    selectedAnomaly.root_cause_analysis
                                      .probability_score * 100
                                  }
                                  color="primary"
                                  size="sm"
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Recommendations
                        </h4>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-2">
                          {selectedAnomaly.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-default-600">
                                {rec}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose}>Close</Button>
                {selectedAnomaly?.status !== "resolved" && (
                  <Button color="success" variant="flat">
                    Mark as Resolved
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
