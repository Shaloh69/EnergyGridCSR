// app/admin/energy/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "recharts";

// HeroUI Components
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

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
} from "lucide-react";

// API and Types
import { energyAPI, buildingsAPI } from "@/lib/api";
import {
  Building,
  EnergyReading,
  EnergyQueryParams,
  BuildingQueryParams,
  ApiResponse,
} from "@/types/api-types";

const COLORS = {
  primary: "#00C896",
  secondary: "#3CD3C2",
  warning: "#F5A524",
  danger: "#F31260",
  success: "#00C896",
};

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

interface EnergyConsumptionData {
  building_id: number;
  period: {
    start_date: string;
    end_date: string;
    interval: "hourly" | "daily" | "weekly" | "monthly";
  };
  summary: {
    total_consumption_kwh: number;
    total_cost_php: number;
    average_daily_consumption: number;
    peak_demand_kw: number;
    average_power_factor: number;
    carbon_footprint_kg_co2: number;
  };
  daily_data: DailyEnergyData[];
  analytics: {
    efficiency_rating: string;
    baseline_comparison: {
      variance_percentage: number;
      trend: "increasing" | "decreasing" | "stable";
    };
    cost_optimization: {
      potential_monthly_savings: number;
      recommendations: string[];
    };
  };
}

interface DailyEnergyData {
  date: string;
  consumption_kwh: number;
  reactive_power_kvarh?: number;
  power_factor: number;
  peak_demand_kw: number;
  cost_php: number;
  cost_breakdown: {
    energy_charge: number;
    demand_charge: number;
    taxes_and_fees: number;
  };
}

export default function EnergyPage() {
  const [energyData, setEnergyData] = useState<EnergyConsumptionData | null>(
    null
  );
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [interval, setInterval] = useState("daily");

  // Add Reading Modal
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();

  const [readingForm, setReadingForm] = useState({
    building_id: "",
    consumption_kwh: "",
    reactive_power_kvarh: "",
    power_factor: "",
    voltage_v: "",
    current_a: "",
    frequency_hz: "",
    demand_kw: "",
    energy_type: "electrical",
    temperature_c: "",
    humidity_percent: "",
    cost_php: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBuilding && startDate && endDate) {
      loadEnergyData();
    }
  }, [selectedBuilding, startDate, endDate, interval]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const buildingParams: BuildingQueryParams = {
        status: "active",
        sortBy: "name",
        sortOrder: "ASC",
      };

      const buildingsRes = await buildingsAPI.getAll(buildingParams);

      if (buildingsRes.data.success) {
        const buildingData = buildingsRes.data.data;
        setBuildings(Array.isArray(buildingData) ? buildingData : []);

        // Auto-select first building
        if (buildingData && buildingData.length > 0) {
          setSelectedBuilding(buildingData[0].id.toString());
        }
      } else {
        throw new Error(
          buildingsRes.data.message || "Failed to load buildings"
        );
      }
    } catch (error: any) {
      console.error("Failed to load initial data:", error);
      setError(error.message || "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  };

  const loadEnergyData = async () => {
    if (!selectedBuilding) return;

    try {
      setChartLoading(true);
      setError(null);

      const params: EnergyQueryParams = {
        building_id: parseInt(selectedBuilding),
        start_date: startDate,
        end_date: endDate,
        interval: interval as "hourly" | "daily" | "weekly" | "monthly",
        include_cost: true,
        include_quality_assessment: true,
        include_environmental_impact: true,
      };

      const response = await energyAPI.getConsumption(params);

      if (response.data.success) {
        setEnergyData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to load energy data");
      }
    } catch (error: any) {
      console.error("Failed to load energy data:", error);
      setError(error.message || "Failed to load energy data");
    } finally {
      setChartLoading(false);
    }
  };

  const handleAddReading = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      if (!readingForm.building_id || !readingForm.consumption_kwh) {
        throw new Error("Building and consumption are required");
      }

      const readingData: Partial<EnergyReading> = {
        building_id: parseInt(readingForm.building_id),
        consumption_kwh: parseFloat(readingForm.consumption_kwh),
        reactive_power_kvarh: readingForm.reactive_power_kvarh
          ? parseFloat(readingForm.reactive_power_kvarh)
          : undefined,
        power_factor: readingForm.power_factor
          ? parseFloat(readingForm.power_factor)
          : undefined,
        voltage_v: readingForm.voltage_v
          ? parseFloat(readingForm.voltage_v)
          : undefined,
        current_a: readingForm.current_a
          ? parseFloat(readingForm.current_a)
          : undefined,
        frequency_hz: readingForm.frequency_hz
          ? parseFloat(readingForm.frequency_hz)
          : undefined,
        demand_kw: readingForm.demand_kw
          ? parseFloat(readingForm.demand_kw)
          : undefined,
        energy_type: readingForm.energy_type as
          | "electrical"
          | "solar"
          | "generator"
          | "others",
        temperature_c: readingForm.temperature_c
          ? parseFloat(readingForm.temperature_c)
          : undefined,
        humidity_percent: readingForm.humidity_percent
          ? parseFloat(readingForm.humidity_percent)
          : undefined,
        cost_php: readingForm.cost_php
          ? parseFloat(readingForm.cost_php)
          : undefined,
        recorded_at: new Date().toISOString(),
        reading_type: "manual",
      };

      const response = await energyAPI.createReading(readingData);

      if (response.data.success) {
        await loadEnergyData();
        onAddClose();
        resetReadingForm();
      } else {
        throw new Error(response.data.message || "Failed to add reading");
      }
    } catch (error: any) {
      console.error("Failed to add reading:", error);
      setError(error.message || "Failed to add reading");
    } finally {
      setSubmitting(false);
    }
  };

  const resetReadingForm = () => {
    setReadingForm({
      building_id: selectedBuilding,
      consumption_kwh: "",
      reactive_power_kvarh: "",
      power_factor: "",
      voltage_v: "",
      current_a: "",
      frequency_hz: "",
      demand_kw: "",
      energy_type: "electrical",
      temperature_c: "",
      humidity_percent: "",
      cost_php: "",
    });
  };

  const selectedBuildingData = buildings.find(
    (b) => b.id.toString() === selectedBuilding
  );

  // Chart data transformations
  const consumptionChartData = useMemo(() => {
    return (
      energyData?.daily_data?.map((item) => ({
        date: new Date(item.date).toLocaleDateString(),
        consumption: item.consumption_kwh,
        cost: item.cost_php,
        powerFactor: item.power_factor,
        demand: item.peak_demand_kw,
      })) || []
    );
  }, [energyData]);

  const costBreakdownData = useMemo(() => {
    if (!energyData?.daily_data || energyData.daily_data.length === 0)
      return [];

    const latestData = energyData.daily_data[energyData.daily_data.length - 1];
    return [
      {
        name: "Energy Charge",
        value: latestData.cost_breakdown.energy_charge,
        color: COLORS.primary,
      },
      {
        name: "Demand Charge",
        value: latestData.cost_breakdown.demand_charge,
        color: COLORS.secondary,
      },
      {
        name: "Taxes & Fees",
        value: latestData.cost_breakdown.taxes_and_fees,
        color: COLORS.warning,
      },
    ];
  }, [energyData]);

  const getEfficiencyColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
        return "success";
      case "good":
        return "primary";
      case "fair":
        return "warning";
      case "poor":
        return "danger";
      default:
        return "default";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-danger" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-success" />;
      default:
        return <Activity className="w-4 h-4 text-default-400" />;
    }
  };

  // Fixed building options for consistent Select usage
  const buildingFilterOptions = buildings.map((building) => ({
    key: building.id.toString(),
    label: building.name,
  }));

  // Fixed selection handlers
  const handleBuildingFilterChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedBuilding(selectedKey || "");
  };

  const handleIntervalChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setInterval(selectedKey || "daily");
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
            Track energy consumption and analyze efficiency trends
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => {
            resetReadingForm();
            onAddOpen();
          }}
        >
          Add Reading
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-l-4 border-l-danger">
          <CardBody className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-danger" />
              <span className="text-danger font-medium">Error</span>
            </div>
            <p className="text-sm text-default-600 mt-1">{error}</p>
            <Button
              size="sm"
              variant="light"
              color="danger"
              className="mt-2"
              onPress={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Building"
              placeholder="Select building"
              selectedKeys={selectedBuilding ? [selectedBuilding] : []}
              onSelectionChange={handleBuildingFilterChange}
              isRequired
            >
              {buildingFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

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

            <Select
              label="Interval"
              selectedKeys={[interval]}
              onSelectionChange={handleIntervalChange}
            >
              {intervalOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {energyData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-600">
                      Total Consumption
                    </p>
                    <p className="text-2xl font-bold">
                      {(
                        energyData.summary.total_consumption_kwh / 1000
                      ).toFixed(1)}
                      k kWh
                    </p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(
                        energyData.analytics.baseline_comparison.trend
                      )}
                      <span className="text-xs text-default-500 ml-1">
                        {Math.abs(
                          energyData.analytics.baseline_comparison
                            .variance_percentage
                        ).toFixed(1)}
                        % vs baseline
                      </span>
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
                      ₱{(energyData.summary.total_cost_php / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-success">
                      ₱
                      {(
                        energyData.analytics.cost_optimization
                          .potential_monthly_savings / 1000
                      ).toFixed(0)}
                      k potential savings
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
                    <p className="text-sm text-default-600">Power Factor</p>
                    <p className="text-2xl font-bold">
                      {energyData.summary.average_power_factor.toFixed(3)}
                    </p>
                    <Chip
                      size="sm"
                      color={
                        energyData.summary.average_power_factor >= 0.95
                          ? "success"
                          : "warning"
                      }
                      className="mt-1"
                    >
                      {energyData.summary.average_power_factor >= 0.95
                        ? "Good"
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
                      {(
                        energyData.summary.carbon_footprint_kg_co2 / 1000
                      ).toFixed(1)}
                      t CO₂
                    </p>
                    <p className="text-xs text-default-500">
                      {(
                        energyData.summary.carbon_footprint_kg_co2 /
                        energyData.summary.total_consumption_kwh
                      ).toFixed(3)}{" "}
                      kg/kWh
                    </p>
                  </div>
                  <Leaf className="w-8 h-8 text-success" />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Efficiency Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold">Efficiency Analysis</h3>
                <Chip
                  color={
                    getEfficiencyColor(
                      energyData.analytics.efficiency_rating
                    ) as any
                  }
                  variant="flat"
                >
                  {energyData.analytics.efficiency_rating}
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">
                    Optimization Recommendations
                  </h4>
                  <div className="space-y-2">
                    {energyData.analytics.cost_optimization.recommendations.map(
                      (rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-default-600">
                            {rec}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-default-600">
                        Peak Demand
                      </span>
                      <span className="font-medium">
                        {energyData.summary.peak_demand_kw.toFixed(1)} kW
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-default-600">
                        Average Daily Consumption
                      </span>
                      <span className="font-medium">
                        {energyData.summary.average_daily_consumption.toFixed(
                          1
                        )}{" "}
                        kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-default-600">
                        Energy Intensity
                      </span>
                      <span className="font-medium">
                        {selectedBuildingData?.area_sqm
                          ? (
                              energyData.summary.total_consumption_kwh /
                              selectedBuildingData.area_sqm
                            ).toFixed(2)
                          : "N/A"}{" "}
                        kWh/m²
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consumption Trend */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Energy Consumption Trend
                </h3>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  {chartLoading ? (
                    <Skeleton className="h-full rounded-lg" />
                  ) : (
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
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Cost Breakdown</h3>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  {chartLoading || costBreakdownData.length === 0 ? (
                    <Skeleton className="h-full rounded-lg" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {costBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `₱${Number(value).toLocaleString()}`,
                            "",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {costBreakdownData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-default-600">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        ₱{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Power Factor & Demand Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Power Factor Trend</h3>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={consumptionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                      />
                      <YAxis
                        domain={[0.8, 1]}
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
                        stroke={COLORS.secondary}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Peak Demand Trend</h3>
              </CardHeader>
              <CardBody>
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
                      <Bar dataKey="demand" fill={COLORS.warning} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* Add Reading Modal */}
      <Modal isOpen={isAddOpen} onOpenChange={onAddClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add Energy Reading</ModalHeader>
              <ModalBody className="space-y-4">
                <Select
                  label="Building"
                  placeholder="Select building"
                  selectedKeys={
                    readingForm.building_id ? [readingForm.building_id] : []
                  }
                  onSelectionChange={(keys) =>
                    setReadingForm((prev) => ({
                      ...prev,
                      building_id: (Array.from(keys)[0] as string) || "",
                    }))
                  }
                  isRequired
                >
                  {buildingFilterOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Consumption (kWh)"
                    type="number"
                    step="0.01"
                    value={readingForm.consumption_kwh}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        consumption_kwh: e.target.value,
                      }))
                    }
                    isRequired
                  />

                  <Input
                    label="Reactive Power (kVArh)"
                    type="number"
                    step="0.01"
                    value={readingForm.reactive_power_kvarh}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        reactive_power_kvarh: e.target.value,
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
                    value={readingForm.power_factor}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        power_factor: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Voltage (V)"
                    type="number"
                    step="0.1"
                    value={readingForm.voltage_v}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        voltage_v: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Current (A)"
                    type="number"
                    step="0.01"
                    value={readingForm.current_a}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        current_a: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Frequency (Hz)"
                    type="number"
                    step="0.01"
                    value={readingForm.frequency_hz}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        frequency_hz: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Demand (kW)"
                    type="number"
                    step="0.01"
                    value={readingForm.demand_kw}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        demand_kw: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Cost (PHP)"
                    type="number"
                    step="0.01"
                    value={readingForm.cost_php}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        cost_php: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Energy Type"
                    selectedKeys={[readingForm.energy_type]}
                    onSelectionChange={(keys) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        energy_type:
                          (Array.from(keys)[0] as string) || "electrical",
                      }))
                    }
                  >
                    {energyTypeOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="Temperature (°C)"
                    type="number"
                    step="0.1"
                    value={readingForm.temperature_c}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        temperature_c: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Humidity (%)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={readingForm.humidity_percent}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        humidity_percent: e.target.value,
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
                    !readingForm.building_id || !readingForm.consumption_kwh
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
