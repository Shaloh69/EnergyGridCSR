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
} from "lucide-react";

// API and Types
import { analyticsAPI, buildingsAPI } from "@/lib/api";
import {
  AnalyticsData,
  Anomaly,
  EfficiencyOpportunity,
  Building,
} from "@/types/admin";

const COLORS = {
  primary: "#00C896",
  secondary: "#3CD3C2",
  warning: "#F5A524",
  danger: "#F31260",
  success: "#00C896",
  info: "#006FEE",
};

const analysisTypes = [
  { key: "energy", label: "Energy Analysis" },
  { key: "anomaly", label: "Anomaly Detection" },
  { key: "efficiency", label: "Efficiency Analysis" },
  { key: "cost", label: "Cost Optimization" },
  { key: "compliance", label: "Compliance Check" },
];

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Analysis parameters
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
    "anomaly",
    "efficiency",
  ]);

  // Modal states
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
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  // Advanced analysis parameters
  const [advancedParams, setAdvancedParams] = useState({
    sensitivity: "medium",
    threshold_deviation: "2.5",
    minimum_duration_minutes: "15",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const buildingsRes = await buildingsAPI.getAll({ status: "active" });
      if (buildingsRes.data.success) {
        const buildingData = buildingsRes.data.data.buildings;
        setBuildings(buildingData);

        // Auto-select first building
        if (buildingData.length > 0) {
          setSelectedBuilding(buildingData[0].id.toString());
        }
      }

      // Load dashboard analytics
      await loadDashboardAnalytics();
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      if (response.data.success) {
        const dashboardData = response.data.data;

        // Transform dashboard data to analytics format if needed
        if (dashboardData.energy_analytics || dashboardData.overview) {
          const analyticsData: AnalyticsData = {
            analysis_id: `DASHBOARD-${Date.now()}`,
            building_id: selectedBuilding ? Number(selectedBuilding) : 1,
            energy_analysis: {
              total_consumption_kwh:
                dashboardData.energy_analytics?.monthly_consumption_kwh || 0,
              efficiency_score:
                dashboardData.energy_analytics?.portfolio_efficiency_score || 0,
              cost_analysis: {
                total_cost_php:
                  dashboardData.energy_analytics?.monthly_consumption_kwh *
                    12 || 0,
                potential_savings_php:
                  dashboardData.energy_analytics?.cost_savings_identified_php ||
                  0,
              },
            },
            anomaly_detection: {
              anomalies_detected:
                dashboardData.anomaly_detection?.anomalies_detected || 0,
              severity_breakdown: dashboardData.anomaly_detection
                ?.severity_breakdown || {
                high: 0,
                medium: 0,
                low: 0,
              },
            },
            efficiency_opportunities:
              dashboardData.efficiency_opportunities || [],
            recommendations: dashboardData.recommendations || [],
          };
          setAnalyticsData(analyticsData);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard analytics:", error);
    }
  };

  const runAnalysis = async () => {
    if (!selectedBuilding) return;

    try {
      setAnalyzing(true);

      const params = {
        building_id: selectedBuilding,
        start_date: startDate,
        end_date: endDate,
        analysis_types: analysisTypeFilter.join(","),
      };

      const response = await analyticsAPI.runAnalysis(params);

      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }

      // Also run anomaly detection if included
      if (analysisTypeFilter.includes("anomaly")) {
        await runAnomalyDetection();
      }
    } catch (error) {
      console.error("Failed to run analysis:", error);
    } finally {
      setAnalyzing(false);
      onRunAnalysisClose();
    }
  };

  const runAnomalyDetection = async () => {
    if (!selectedBuilding) return;

    try {
      const data = {
        building_id: Number(selectedBuilding),
        start_date: startDate + "T00:00:00Z",
        end_date: endDate + "T23:59:59Z",
        analysis_types: ["energy", "power_quality", "equipment"],
        parameters: {
          sensitivity: advancedParams.sensitivity,
          threshold_deviation: Number(advancedParams.threshold_deviation),
          minimum_duration_minutes: Number(
            advancedParams.minimum_duration_minutes
          ),
        },
      };

      const response = await analyticsAPI.detectAnomalies(data);

      if (response.data.success) {
        setAnomalies(response.data.data.anomalies || []);
      }
    } catch (error) {
      console.error("Failed to run anomaly detection:", error);
    }
  };

  const openAnomalyModal = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    onAnomalyOpen();
  };

  const getSeverityColor = (severity: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  // Chart data
  const efficiencyTrendData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i, 1).toLocaleDateString("en", { month: "short" }),
    efficiency: Math.random() * 20 + 70,
    target: 85,
    consumption: Math.random() * 5000 + 8000,
  }));

  const anomalyTrendData = Array.from({ length: 7 }, (_, i) => ({
    day: new Date(
      Date.now() - (6 - i) * 24 * 60 * 60 * 1000
    ).toLocaleDateString("en", { weekday: "short" }),
    anomalies: Math.floor(Math.random() * 8) + 1,
    severity: Math.floor(Math.random() * 3) + 1,
  }));

  const costSavingsData =
    analyticsData?.efficiency_opportunities.map((opp) => ({
      name: opp.category.substring(0, 15) + "...",
      savings: opp.potential_savings_php / 1000,
      payback: opp.payback_months,
    })) || [];

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
            onPress={loadDashboardAnalytics}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            startContent={<Play className="w-4 h-4" />}
            onPress={onRunAnalysisOpen}
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
              onSelectionChange={(keys) =>
                setSelectedBuilding(Array.from(keys)[0] as string)
              }
            >
              {buildings.map((building) => (
                <SelectItem
                  key={building.id.toString()}
                  value={building.id.toString()}
                >
                  {building.name}
                </SelectItem>
              ))}
            </Select>

            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Button
              color="primary"
              variant="flat"
              onPress={() => runAnalysis()}
              isLoading={analyzing}
            >
              Quick Analysis
            </Button>
          </div>
        </CardBody>
      </Card>

      {analyticsData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-600">Efficiency Score</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.energy_analysis.efficiency_score.toFixed(
                        1
                      )}
                      %
                    </p>
                    <Progress
                      value={analyticsData.energy_analysis.efficiency_score}
                      color="primary"
                      size="sm"
                      className="mt-2"
                    />
                  </div>
                  <Target className="w-8 h-8 text-primary" />
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-success">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-600">
                      Potential Savings
                    </p>
                    <p className="text-2xl font-bold text-success">
                      ₱
                      {(
                        analyticsData.energy_analysis.cost_analysis
                          .potential_savings_php / 1000
                      ).toFixed(0)}
                      k
                    </p>
                    <p className="text-xs text-default-500">per month</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success" />
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-600">
                      Anomalies Detected
                    </p>
                    <p className="text-2xl font-bold text-warning">
                      {analyticsData.anomaly_detection.anomalies_detected}
                    </p>
                    <div className="flex space-x-1 mt-1">
                      <Chip size="sm" color="danger" variant="dot">
                        {
                          analyticsData.anomaly_detection.severity_breakdown
                            .high
                        }{" "}
                        High
                      </Chip>
                      <Chip size="sm" color="warning" variant="dot">
                        {
                          analyticsData.anomaly_detection.severity_breakdown
                            .medium
                        }{" "}
                        Med
                      </Chip>
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-warning" />
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-600">Opportunities</p>
                    <p className="text-2xl font-bold text-secondary">
                      {analyticsData.efficiency_opportunities.length}
                    </p>
                    <p className="text-xs text-default-500">identified</p>
                  </div>
                  <Lightbulb className="w-8 h-8 text-secondary" />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficiency Trend */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Efficiency Trend Analysis
                </h3>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke={COLORS.warning}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Cost Savings Opportunities */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Savings Opportunities</h3>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costSavingsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                        formatter={(value) => [`₱${value}k`, "Monthly Savings"]}
                      />
                      <Bar dataKey="savings" fill={COLORS.success} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Efficiency Opportunities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold">
                  Efficiency Opportunities
                </h3>
                <Chip color="primary" variant="flat">
                  {analyticsData.efficiency_opportunities.length} identified
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {analyticsData.efficiency_opportunities.map(
                  (opportunity, index) => (
                    <Card key={index} className="border border-content2">
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-foreground">
                                {opportunity.category}
                              </h4>
                              <Chip
                                color={
                                  getPriorityColor(opportunity.priority) as any
                                }
                                size="sm"
                                variant="flat"
                              >
                                {opportunity.priority} priority
                              </Chip>
                            </div>
                            <p className="text-sm text-default-600 mb-3">
                              {opportunity.description}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="text-xs text-default-500">
                                  Energy Savings
                                </div>
                                <div className="font-medium text-primary">
                                  {opportunity.potential_savings_kwh.toLocaleString()}{" "}
                                  kWh/month
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-default-500">
                                  Cost Savings
                                </div>
                                <div className="font-medium text-success">
                                  ₱
                                  {opportunity.potential_savings_php.toLocaleString()}
                                  /month
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-default-500">
                                  Payback Period
                                </div>
                                <div className="font-medium">
                                  {opportunity.payback_months.toFixed(1)} months
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Lightbulb className="w-8 h-8 text-warning" />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )
                )}
              </div>
            </CardBody>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">AI Recommendations</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {analyticsData.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-content2/50"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
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
                        color={getSeverityColor(anomaly.severity) as any}
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
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Run Analysis Modal */}
      <Modal
        isOpen={isRunAnalysisOpen}
        onOpenChange={onRunAnalysisClose}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Configure Analysis</ModalHeader>
              <ModalBody className="space-y-4">
                <Select
                  label="Building"
                  placeholder="Select building"
                  selectedKeys={selectedBuilding ? [selectedBuilding] : []}
                  onSelectionChange={(keys) =>
                    setSelectedBuilding(Array.from(keys)[0] as string)
                  }
                >
                  {buildings.map((building) => (
                    <SelectItem
                      key={building.id.toString()}
                      value={building.id.toString()}
                    >
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
                  />
                  <Input
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Analysis Types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                    <SelectItem key="low" value="low">
                      Low
                    </SelectItem>
                    <SelectItem key="medium" value="medium">
                      Medium
                    </SelectItem>
                    <SelectItem key="high" value="high">
                      High
                    </SelectItem>
                  </Select>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Threshold Deviation"
                      type="number"
                      step="0.1"
                      value={advancedParams.threshold_deviation}
                      onChange={(e) =>
                        setAdvancedParams((prev) => ({
                          ...prev,
                          threshold_deviation: e.target.value,
                        }))
                      }
                    />

                    <Input
                      label="Min Duration (minutes)"
                      type="number"
                      value={advancedParams.minimum_duration_minutes}
                      onChange={(e) =>
                        setAdvancedParams((prev) => ({
                          ...prev,
                          minimum_duration_minutes: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={runAnalysis}
                  isLoading={analyzing}
                >
                  Run Analysis
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Anomaly Detail Modal */}
      <Modal isOpen={isAnomalyOpen} onOpenChange={onAnomalyClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  <Chip
                    color={
                      getSeverityColor(selectedAnomaly?.severity || "") as any
                    }
                    size="sm"
                  >
                    {selectedAnomaly?.severity}
                  </Chip>
                  <span>Anomaly Details</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedAnomaly && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Detection Info</h4>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <div>
                          <strong>Type:</strong>{" "}
                          {selectedAnomaly.type.replace("_", " ").toUpperCase()}
                        </div>
                        <div>
                          <strong>Timestamp:</strong>{" "}
                          {new Date(selectedAnomaly.timestamp).toLocaleString()}
                        </div>
                        <div>
                          <strong>Detected Value:</strong>{" "}
                          <span className="text-danger font-medium">
                            {selectedAnomaly.detected_value.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <strong>Expected Value:</strong>{" "}
                          {selectedAnomaly.expected_value.toFixed(2)}
                        </div>
                        <div>
                          <strong>Deviation:</strong>{" "}
                          {(
                            (Math.abs(
                              selectedAnomaly.detected_value -
                                selectedAnomaly.expected_value
                            ) /
                              selectedAnomaly.expected_value) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Description</h4>
                      </CardHeader>
                      <CardBody>
                        <p>{selectedAnomaly.description}</p>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Root Cause Analysis</h4>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        <div>
                          <strong>Primary Cause:</strong>
                          <p className="text-sm text-default-600 mt-1">
                            {selectedAnomaly.root_cause_analysis.primary_cause}
                          </p>
                        </div>
                        <div>
                          <strong>Contributing Factors:</strong>
                          <ul className="text-sm text-default-600 mt-1 space-y-1">
                            {selectedAnomaly.root_cause_analysis.contributing_factors.map(
                              (factor, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 mr-2 flex-shrink-0" />
                                  {factor}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Recommendations</h4>
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
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
