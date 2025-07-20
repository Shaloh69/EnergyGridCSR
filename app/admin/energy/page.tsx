// app/admin/energy/page.tsx
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
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

// Icons
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gauge,
  Calendar,
  Download,
  Plus,
  Activity,
  BarChart3,
  Eye,
  Leaf,
  AlertCircle,
  Filter,
  RefreshCw,
  Settings,
  FileText,
  Target,
  Thermometer,
  Wind,
} from "lucide-react";

// API Hooks and Types
import {
  useBuildings,
  useEnergyConsumption,
  useEnergyStats,
  useEnergyTrends,
} from "@/hooks/useApi";
import { energyAPI, reportsAPI } from "@/lib/api";
import {
  EnergyReading,
  EnergyQueryParams,
  Building,
  EnergyStatsResponse,
} from "@/types/api-types";

// Chart Colors
const CHART_COLORS = {
  primary: "#00C896",
  secondary: "#3CD3C2",
  warning: "#F5A524",
  danger: "#F31260",
  success: "#00C896",
  blue: "#006FEE",
  purple: "#7C3AED",
  pink: "#EC4899",
  orange: "#F97316",
};

// Configuration Options
const intervalOptions = [
  { key: "hourly", label: "Hourly" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const energyTypeOptions = [
  { key: "electrical", label: "Electrical" },
  { key: "solar", label: "Solar" },
  { key: "generator", label: "Generator" },
  { key: "others", label: "Others" },
];

const periodOptions = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 3 Months" },
  { key: "1y", label: "Last Year" },
  { key: "custom", label: "Custom Range" },
];

interface EnergyFilters {
  buildingId: string;
  startDate: string;
  endDate: string;
  interval: "hourly" | "daily" | "weekly" | "monthly";
  energyType?: "electrical" | "solar" | "generator" | "others";
  period: string;
}

// Helper function to safely format numbers
const safeFormat = (
  value: number | string | undefined | null,
  decimals: number = 2
): string => {
  if (value === null || value === undefined) {
    return "0";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue) || !isFinite(numValue)) {
    return "0";
  }

  return numValue.toFixed(decimals);
};

// Helper function to safely get number value
const safeNumber = (value: number | string | undefined | null): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue) || !isFinite(numValue)) {
    return 0;
  }

  return numValue;
};

export default function EnergyMonitoringPage() {
  // State Management
  const [filters, setFilters] = useState<EnergyFilters>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    return {
      buildingId: "",
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      interval: "daily",
      period: "30d",
    };
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReadings, setSelectedReadings] = useState<Set<number>>(
    new Set()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const {
    isOpen: isAddReadingOpen,
    onOpen: onAddReadingOpen,
    onClose: onAddReadingClose,
  } = useDisclosure();

  const {
    isOpen: isComparisonOpen,
    onOpen: onComparisonOpen,
    onClose: onComparisonClose,
  } = useDisclosure();

  // Reading Form State
  const [readingForm, setReadingForm] = useState<Partial<EnergyReading>>({
    buildingId: 0,
    consumptionKwh: 0,
    powerFactor: 0.95,
    energyType: "electrical",
    recordedAt: new Date().toISOString(),
  });
  const [submitting, setSubmitting] = useState(false);

  // API Hooks
  const {
    data: buildings = [],
    loading: buildingsLoading,
    error: buildingsError,
  } = useBuildings({ status: "active", sortBy: "name", sortOrder: "ASC" });

  const {
    data: energyReadings = [],
    pagination: energyPagination,
    loading: energyLoading,
    error: energyError,
    refresh: refreshEnergyData,
  } = useEnergyConsumption(
    filters.buildingId
      ? {
          buildingId: parseInt(filters.buildingId),
          startDate: filters.startDate,
          endDate: filters.endDate,
          interval: filters.interval,
          energyType: filters.energyType,
          includeCost: true,
          includeQualityAssessment: true,
          includeEnvironmentalImpact: true,
        }
      : null,
    {
      immediate: !!filters.buildingId,
      dependencies: [
        filters.buildingId,
        filters.startDate,
        filters.endDate,
        filters.interval,
      ],
      cacheTtl: 2 * 60 * 1000, // 2 minutes cache
    }
  );

  const {
    data: energyStats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useEnergyStats(
    filters.buildingId ? parseInt(filters.buildingId) : 0,
    {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    {
      immediate: !!filters.buildingId,
      dependencies: [filters.buildingId, filters.startDate, filters.endDate],
    }
  );

  const {
    data: energyTrends,
    loading: trendsLoading,
    refresh: refreshTrends,
  } = useEnergyTrends(
    filters.buildingId ? parseInt(filters.buildingId) : 0,
    {
      period: filters.period === "custom" ? undefined : filters.period,
      startDate: filters.period === "custom" ? filters.startDate : undefined,
      endDate: filters.period === "custom" ? filters.endDate : undefined,
    },
    {
      immediate: !!filters.buildingId,
      dependencies: [
        filters.buildingId,
        filters.period,
        filters.startDate,
        filters.endDate,
      ],
    }
  );

  // Auto-select first building when buildings load
  useEffect(() => {
    if (buildings.length > 0 && !filters.buildingId) {
      setFilters((prev) => ({
        ...prev,
        buildingId: buildings[0].id.toString(),
      }));
    }
  }, [buildings, filters.buildingId]);

  // Handle period change
  const handlePeriodChange = useCallback((period: string) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "custom":
        // Keep current dates for custom
        return setFilters((prev) => ({ ...prev, period }));
    }

    setFilters((prev) => ({
      ...prev,
      period,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    }));
  }, []);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshEnergyData(), refreshStats(), refreshTrends()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshEnergyData, refreshStats, refreshTrends]);

  // Add energy reading
  const handleAddReading = async () => {
    if (!readingForm.buildingId || !readingForm.consumptionKwh) {
      return;
    }

    try {
      setSubmitting(true);

      const readingData: Partial<EnergyReading> = {
        ...readingForm,
        recordedAt: new Date().toISOString(),
      };

      await energyAPI.createReading(readingData);
      await handleRefresh();
      onAddReadingClose();
      resetReadingForm();
    } catch (error: any) {
      console.error("Failed to add reading:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetReadingForm = () => {
    setReadingForm({
      buildingId: filters.buildingId ? parseInt(filters.buildingId) : 0,
      consumptionKwh: 0,
      powerFactor: 0.95,
      energyType: "electrical",
      recordedAt: new Date().toISOString(),
    });
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (!filters.buildingId) return;

    try {
      await reportsAPI.generateEnergy({
        buildingId: parseInt(filters.buildingId),
        startDate: filters.startDate,
        endDate: filters.endDate,
        title: `Energy Report - ${selectedBuilding?.name} - ${filters.startDate} to ${filters.endDate}`,
        includeComparison: true,
        includeTrends: true,
        reportFormat: "pdf",
        sections: ["consumption", "efficiency", "costs", "recommendations"],
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  // Computed values
  const selectedBuilding = buildings.find(
    (b) => b.id.toString() === filters.buildingId
  );
  const isLoading =
    buildingsLoading || energyLoading || statsLoading || trendsLoading;
  const hasError = buildingsError || energyError || statsError;

  // Chart data transformations
  const consumptionChartData = useMemo(() => {
    return energyReadings.map((reading) => ({
      date: new Date(reading.recordedAt).toLocaleDateString(),
      consumption: safeNumber(reading.consumptionKwh),
      cost: safeNumber(reading.costPhp),
      powerFactor: safeNumber(reading.powerFactor),
      demand: safeNumber(reading.demandKw),
      temperature: reading.temperatureC
        ? safeNumber(reading.temperatureC)
        : null,
      humidity: reading.humidityPercent
        ? safeNumber(reading.humidityPercent)
        : null,
    }));
  }, [energyReadings]);

  const efficiencyData = useMemo(() => {
    if (!energyStats || !selectedBuilding) return [];

    const avgConsumption = safeNumber(energyStats.averageConsumption);
    const buildingArea = safeNumber(selectedBuilding.areaSqm);

    return consumptionChartData.map((item, index) => ({
      ...item,
      efficiency: buildingArea > 0 ? item.consumption / buildingArea : 0,
      baseline: avgConsumption,
    }));
  }, [consumptionChartData, energyStats, selectedBuilding]);

  const powerQualityData = useMemo(() => {
    return consumptionChartData.filter((item) => item.powerFactor > 0);
  }, [consumptionChartData]);

  // Environmental impact calculation
  const carbonIntensity = 0.5; // kg CO2 per kWh (Philippines average)
  const totalCarbonFootprint = useMemo(() => {
    return energyReadings.reduce((total, reading) => {
      return total + safeNumber(reading.consumptionKwh) * carbonIntensity;
    }, 0);
  }, [energyReadings]);

  // Safe stats values with defaults
  const safeStats = useMemo(() => {
    if (!energyStats) {
      return {
        totalConsumption: 0,
        totalCost: 0,
        powerFactorAvg: 0,
        peakDemand: 0,
        averageConsumption: 0,
        efficiencyScore: 0,
        trends: [],
      };
    }

    // Handle both number and string values from API
    return {
      totalConsumption: safeNumber(energyStats.totalConsumption),
      totalCost: safeNumber(energyStats.totalCost),
      powerFactorAvg: safeNumber(energyStats.powerFactorAvg),
      peakDemand: safeNumber(energyStats.peakDemand),
      averageConsumption: safeNumber(energyStats.averageConsumption),
      efficiencyScore: safeNumber(energyStats.efficiencyScore),
      trends: Array.isArray(energyStats.trends) ? energyStats.trends : [],
    };
  }, [energyStats]);

  if (isLoading && !energyReadings.length) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64 rounded-lg" />
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
            <Zap className="w-8 h-8 mr-3 text-primary" />
            Energy Monitoring
          </h1>
          <p className="text-default-500 mt-1">
            Comprehensive energy consumption analysis and optimization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="light"
            startContent={
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            }
            onPress={handleRefresh}
            isDisabled={isRefreshing}
          >
            Refresh
          </Button>
          <Button
            color="secondary"
            variant="flat"
            startContent={<FileText className="w-4 h-4" />}
            onPress={handleGenerateReport}
            isDisabled={!filters.buildingId}
          >
            Generate Report
          </Button>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => {
              resetReadingForm();
              onAddReadingOpen();
            }}
          >
            Add Reading
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {hasError && (
        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-danger" />
              <span className="text-danger font-medium">
                Error Loading Data
              </span>
            </div>
            <p className="text-sm text-default-600 mt-1">
              {buildingsError ||
                energyError ||
                statsError ||
                "Failed to load energy data"}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Filters Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Data Filters
            </h3>
            <Chip color="primary" variant="flat" size="sm">
              {energyReadings.length} readings
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              label="Building"
              placeholder="Select building"
              selectedKeys={filters.buildingId ? [filters.buildingId] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFilters((prev) => ({
                  ...prev,
                  buildingId: selectedKey || "",
                }));
              }}
              isRequired
              isLoading={buildingsLoading}
            >
              {buildings.map((building) => (
                <SelectItem key={building.id.toString()}>
                  {building.name}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Period"
              selectedKeys={[filters.period]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handlePeriodChange(selectedKey);
              }}
            >
              {periodOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            {filters.period === "custom" && (
              <>
                <Input
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
                <Input
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </>
            )}

            <Select
              label="Interval"
              selectedKeys={[filters.interval]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFilters((prev) => ({
                  ...prev,
                  interval: selectedKey as
                    | "hourly"
                    | "daily"
                    | "weekly"
                    | "monthly",
                }));
              }}
            >
              {intervalOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Energy Type"
              placeholder="All types"
              selectedKeys={filters.energyType ? [filters.energyType] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFilters((prev) => ({
                  ...prev,
                  energyType: selectedKey as
                    | "electrical"
                    | "solar"
                    | "generator"
                    | "others"
                    | undefined,
                }));
              }}
            >
              {energyTypeOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Consumption</p>
                <p className="text-2xl font-bold">
                  {safeFormat(safeStats.totalConsumption / 1000, 1)}k kWh
                </p>
                <div className="flex items-center mt-1">
                  {safeStats.trends && safeStats.trends.length > 1 && (
                    <>
                      {safeStats.trends[safeStats.trends.length - 1]
                        .consumption >
                      safeStats.trends[safeStats.trends.length - 2]
                        .consumption ? (
                        <TrendingUp className="w-4 h-4 text-danger" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-success" />
                      )}
                      <span className="text-xs text-default-500 ml-1">
                        vs previous period
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Total Cost</p>
                <p className="text-2xl font-bold">
                  ₱{safeFormat(safeStats.totalCost / 1000, 0)}k
                </p>
                <p className="text-xs text-default-500">
                  ₱
                  {safeStats.totalConsumption > 0
                    ? safeFormat(
                        safeStats.totalCost / safeStats.totalConsumption,
                        2
                      )
                    : "0.00"}
                  /kWh
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-warning" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Avg Power Factor</p>
                <p className="text-2xl font-bold">
                  {safeFormat(safeStats.powerFactorAvg, 3)}
                </p>
                <Chip
                  size="sm"
                  color={
                    safeStats.powerFactorAvg >= 0.95 ? "success" : "warning"
                  }
                  className="mt-1"
                >
                  {safeStats.powerFactorAvg >= 0.95
                    ? "Excellent"
                    : "Needs Improvement"}
                </Chip>
              </div>
              <Gauge className="w-8 h-8 text-secondary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-600">Carbon Footprint</p>
                <p className="text-2xl font-bold">
                  {safeFormat(totalCarbonFootprint / 1000, 1)}t CO₂
                </p>
                <p className="text-xs text-default-500">
                  {safeStats.totalConsumption > 0
                    ? safeFormat(
                        totalCarbonFootprint / safeStats.totalConsumption,
                        3
                      )
                    : "0.000"}{" "}
                  kg/kWh
                </p>
              </div>
              <Leaf className="w-8 h-8 text-success" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tab key="overview" title="Overview" />
            <Tab key="efficiency" title="Efficiency Analysis" />
            <Tab key="trends" title="Trends & Forecasting" />
            <Tab key="environmental" title="Environmental Impact" />
            <Tab key="readings" title="Raw Data" />
          </Tabs>
        </CardHeader>
        <CardBody>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consumption Trend Chart */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Consumption Trend</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={consumptionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
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
                      <Area
                        type="monotone"
                        dataKey="consumption"
                        stroke={CHART_COLORS.primary}
                        fill={CHART_COLORS.primary}
                        fillOpacity={0.3}
                        name="Consumption (kWh)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Cost Analysis</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={consumptionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
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
                      <Bar
                        dataKey="cost"
                        fill={CHART_COLORS.warning}
                        name="Cost (₱)"
                      />
                      <Line
                        type="monotone"
                        dataKey="consumption"
                        stroke={CHART_COLORS.blue}
                        strokeWidth={2}
                        name="Consumption (kWh)"
                        yAxisId="right"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "efficiency" && (
            <div className="space-y-6">
              {/* Efficiency Metrics */}
              {selectedBuilding && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-primary/10">
                    <CardBody className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-default-600">
                          Efficiency Score
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {safeFormat(safeStats.efficiencyScore, 0) || "N/A"}
                        </p>
                        <Progress
                          value={safeStats.efficiencyScore || 0}
                          color="primary"
                          className="mt-2"
                        />
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="bg-secondary/10">
                    <CardBody className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-default-600">
                          Energy Intensity
                        </p>
                        <p className="text-2xl font-bold text-secondary">
                          {selectedBuilding.areaSqm &&
                          safeStats.totalConsumption > 0
                            ? safeFormat(
                                safeStats.totalConsumption /
                                  safeNumber(selectedBuilding.areaSqm),
                                2
                              )
                            : "N/A"}
                        </p>
                        <p className="text-xs text-default-500">kWh/m²</p>
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="bg-success/10">
                    <CardBody className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-default-600">Peak Demand</p>
                        <p className="text-2xl font-bold text-success">
                          {safeFormat(safeStats.peakDemand, 1)}
                        </p>
                        <p className="text-xs text-default-500">kW</p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Efficiency vs Baseline Chart */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">
                  Efficiency vs Baseline
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
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
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2}
                        name="Actual Efficiency"
                      />
                      <Line
                        type="monotone"
                        dataKey="baseline"
                        stroke={CHART_COLORS.warning}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Baseline"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "trends" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Power Factor Trend */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">
                    Power Factor Quality
                  </h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={powerQualityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: "#9CA3AF" }}
                        />
                        <YAxis
                          domain={[0.7, 1]}
                          stroke="#9CA3AF"
                          tick={{ fill: "#9CA3AF" }}
                        />
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
                          dataKey="powerFactor"
                          stroke={CHART_COLORS.secondary}
                          strokeWidth={2}
                          name="Power Factor"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Demand Pattern */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Demand Pattern</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
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
                        <Bar
                          dataKey="demand"
                          fill={CHART_COLORS.orange}
                          name="Peak Demand (kW)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "environmental" && (
            <div className="space-y-6">
              {/* Environmental Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-success/10">
                  <CardBody className="p-4 text-center">
                    <Leaf className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="text-sm text-default-600">CO₂ Emissions</p>
                    <p className="text-xl font-bold">
                      {safeFormat(totalCarbonFootprint / 1000, 2)}t
                    </p>
                  </CardBody>
                </Card>

                <Card className="bg-blue-500/10">
                  <CardBody className="p-4 text-center">
                    <Wind className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-default-600">Carbon Intensity</p>
                    <p className="text-xl font-bold">
                      {safeStats.totalConsumption > 0
                        ? safeFormat(
                            totalCarbonFootprint / safeStats.totalConsumption,
                            3
                          )
                        : "N/A"}
                    </p>
                    <p className="text-xs text-default-500">kg CO₂/kWh</p>
                  </CardBody>
                </Card>

                <Card className="bg-purple-500/10">
                  <CardBody className="p-4 text-center">
                    <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-default-600">Reduction Target</p>
                    <p className="text-xl font-bold">15%</p>
                    <p className="text-xs text-default-500">by 2025</p>
                  </CardBody>
                </Card>

                <Card className="bg-orange-500/10">
                  <CardBody className="p-4 text-center">
                    <Thermometer className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-default-600">Avg Temperature</p>
                    <p className="text-xl font-bold">
                      {consumptionChartData.filter((d) => d.temperature)
                        .length > 0
                        ? safeFormat(
                            consumptionChartData
                              .filter((d) => d.temperature)
                              .reduce(
                                (sum, d) => sum + (d.temperature || 0),
                                0
                              ) /
                              consumptionChartData.filter((d) => d.temperature)
                                .length,
                            1
                          )
                        : "N/A"}
                      °C
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Environmental Impact Chart */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">
                  Environmental Impact Over Time
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={consumptionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
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
                      <Area
                        type="monotone"
                        dataKey="consumption"
                        fill={CHART_COLORS.primary}
                        fillOpacity={0.3}
                        name="Consumption (kWh)"
                      />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke={CHART_COLORS.orange}
                        strokeWidth={2}
                        name="Temperature (°C)"
                        yAxisId="right"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "readings" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Energy Readings</h4>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Download className="w-4 h-4" />}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>

              <Table aria-label="Energy readings table">
                <TableHeader>
                  <TableColumn>Date & Time</TableColumn>
                  <TableColumn>Consumption (kWh)</TableColumn>
                  <TableColumn>Power Factor</TableColumn>
                  <TableColumn>Demand (kW)</TableColumn>
                  <TableColumn>Cost (₱)</TableColumn>
                  <TableColumn>Type</TableColumn>
                </TableHeader>
                <TableBody>
                  {energyReadings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>
                        {new Date(reading.recordedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {safeFormat(reading.consumptionKwh, 2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={
                            safeNumber(reading.powerFactor) >= 0.95
                              ? "success"
                              : "warning"
                          }
                        >
                          {safeFormat(reading.powerFactor, 3)}
                        </Chip>
                      </TableCell>
                      <TableCell>{safeFormat(reading.demandKw, 2)}</TableCell>
                      <TableCell>₱{safeFormat(reading.costPhp, 2)}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {reading.energyType || "electrical"}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {energyPagination && (
                <div className="flex justify-center mt-4">
                  <p className="text-sm text-default-500">
                    Showing {energyReadings.length} of{" "}
                    {energyPagination.totalCount} readings
                  </p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Reading Modal */}
      <Modal
        isOpen={isAddReadingOpen}
        onOpenChange={onAddReadingClose}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add Energy Reading</ModalHeader>
              <ModalBody className="space-y-4">
                <Select
                  label="Building"
                  placeholder="Select building"
                  selectedKeys={
                    readingForm.buildingId
                      ? [readingForm.buildingId.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const buildingId = Array.from(keys)[0] as string;
                    setReadingForm((prev) => ({
                      ...prev,
                      buildingId: buildingId ? parseInt(buildingId) : 0,
                    }));
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
                    label="Consumption (kWh)"
                    type="number"
                    step="0.01"
                    value={readingForm.consumptionKwh?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        consumptionKwh: parseFloat(e.target.value) || 0,
                      }))
                    }
                    isRequired
                  />

                  <Input
                    label="Reactive Power (kVArh)"
                    type="number"
                    step="0.01"
                    value={readingForm.reactivePowerKvarh?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        reactivePowerKvarh:
                          parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Power Factor"
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={readingForm.powerFactor?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        powerFactor: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />

                  <Input
                    label="Voltage (V)"
                    type="number"
                    step="0.1"
                    value={readingForm.voltageV?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        voltageV: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />

                  <Input
                    label="Current (A)"
                    type="number"
                    step="0.01"
                    value={readingForm.currentA?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        currentA: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Frequency (Hz)"
                    type="number"
                    step="0.01"
                    value={readingForm.frequencyHz?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        frequencyHz: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />

                  <Input
                    label="Demand (kW)"
                    type="number"
                    step="0.01"
                    value={readingForm.demandKw?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        demandKw: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />

                  <Input
                    label="Cost (PHP)"
                    type="number"
                    step="0.01"
                    value={readingForm.costPhp?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        costPhp: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Energy Type"
                    selectedKeys={
                      readingForm.energyType ? [readingForm.energyType] : []
                    }
                    onSelectionChange={(keys) => {
                      const energyType = Array.from(keys)[0] as string;
                      setReadingForm((prev) => ({
                        ...prev,
                        energyType: energyType as
                          | "electrical"
                          | "solar"
                          | "generator"
                          | "others",
                      }));
                    }}
                  >
                    {energyTypeOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="Temperature (°C)"
                    type="number"
                    step="0.1"
                    value={readingForm.temperatureC?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        temperatureC: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />

                  <Input
                    label="Humidity (%)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={readingForm.humidityPercent?.toString() || ""}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        humidityPercent:
                          parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddReading}
                  isLoading={submitting}
                  isDisabled={
                    !readingForm.buildingId || !readingForm.consumptionKwh
                  }
                >
                  Add Reading
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
