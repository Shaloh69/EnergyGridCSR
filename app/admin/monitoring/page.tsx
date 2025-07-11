import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  MonitorSpeaker,
  Activity,
  Server,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  Trash2,
  Eye,
  Building,
  Database,
  Wifi,
  WifiOff,
  TrendingUp,
  Plus,
  RefreshCw,
  Cpu,
  Network,
  AlertCircle,
  X,
  Search,
} from "lucide-react";

// Mock API - Replace with your actual API calls from @/lib/api
const useMonitoringAPI = () => {
  const mockData = {
    dashboard: {
      success: true,
      data: {
        systemStats: {
          totalBuildings: 12,
          totalAlerts: 8,
          criticalAlerts: 2,
          connectedUsers: 45,
        },
        buildings: [
          {
            building_id: 1,
            name: "Main Campus Building",
            status: "normal",
            active_alerts: 0,
            system_health_score: 95,
          },
          {
            building_id: 2,
            name: "Engineering Building",
            status: "warning",
            active_alerts: 2,
            system_health_score: 78,
          },
          {
            building_id: 3,
            name: "Library Complex",
            status: "normal",
            active_alerts: 0,
            system_health_score: 92,
          },
          {
            building_id: 4,
            name: "Student Center",
            status: "critical",
            active_alerts: 3,
            system_health_score: 65,
          },
        ],
        performance_metrics: {
          data_collection_rate: 98.5,
          system_uptime_percentage: 99.9,
        },
      },
    },
    systemHealth: {
      success: true,
      data: {
        overall_health_score: 94,
        status: "healthy",
        uptime_seconds: 2592000,
        database_health: {
          status: "healthy",
          connection_pool: {
            active_connections: 15,
            idle_connections: 35,
            max_connections: 50,
          },
          performance_metrics: {
            average_query_time_ms: 25,
            slow_queries_count: 2,
          },
          disk_usage_percentage: 67,
        },
        system_resources: {
          cpu_usage_percentage: 35,
          memory_usage_percentage: 67,
          disk_usage_percentage: 78,
        },
        api_health: {
          total_requests_last_hour: 1247,
          average_response_time_ms: 185,
        },
        alert_summary: {
          total_active_alerts: 8,
          critical_alerts: 2,
        },
        service_status: {
          energy_monitoring: "operational",
          power_quality_analysis: "operational",
          alert_processing: "operational",
          report_generation: "degraded",
          compliance_checking: "operational",
          analytics_engine: "operational",
        },
      },
    },
    activities: {
      success: true,
      data: [
        {
          id: 1,
          activity_type: "energy_monitoring",
          description: "Energy consumption analysis completed",
          building_name: "Main Campus",
          status: "success",
          processing_time_ms: 2500,
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 2,
          activity_type: "power_quality_check",
          description: "Power quality monitoring for Building 2",
          building_name: "Engineering Building",
          status: "warning",
          processing_time_ms: 1800,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: 3,
          activity_type: "equipment_health",
          description: "Equipment health assessment",
          building_name: "Library Complex",
          status: "success",
          processing_time_ms: 3200,
          timestamp: new Date(Date.now() - 900000).toISOString(),
        },
      ],
    },
    jobs: {
      success: true,
      data: [
        {
          id: 1,
          job_type: "ENERGY_ANALYSIS",
          status: "running",
          progress_percentage: 75,
          building_id: 1,
          priority: "high",
          created_at: new Date(Date.now() - 1800000).toISOString(),
          estimated_completion: new Date(Date.now() + 600000).toISOString(),
          job_parameters: {
            analysis_type: "comprehensive",
            date_range: "last_30_days",
          },
        },
        {
          id: 2,
          job_type: "REPORT_GENERATION",
          status: "completed",
          progress_percentage: 100,
          building_id: null,
          priority: "normal",
          created_at: new Date(Date.now() - 7200000).toISOString(),
          completed_at: new Date(Date.now() - 3600000).toISOString(),
          job_parameters: {
            report_type: "monthly_energy",
          },
        },
        {
          id: 3,
          job_type: "COMPLIANCE_CHECK",
          status: "failed",
          progress_percentage: 45,
          building_id: 2,
          priority: "high",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          error_message: "Unable to connect to building systems",
          job_parameters: {
            standards: ["IEEE519", "PEC2017"],
          },
        },
      ],
    },
  };

  return {
    getDashboard: () => Promise.resolve(mockData.dashboard),
    getSystemHealth: () => Promise.resolve(mockData.systemHealth),
    getActivities: () => Promise.resolve(mockData.activities),
    getJobs: () => Promise.resolve(mockData.jobs),
    createJob: (data) =>
      Promise.resolve({ success: true, data: { id: Date.now(), ...data } }),
    cancelJob: () => Promise.resolve({ success: true }),
    clearCache: () => Promise.resolve({ success: true }),
  };
};

const JOB_TYPES = [
  {
    key: "ENERGY_ANALYSIS",
    label: "Energy Analysis",
    icon: "⚡",
    color: "#3b82f6",
  },
  {
    key: "COMPLIANCE_CHECK",
    label: "Compliance Check",
    icon: "📋",
    color: "#8b5cf6",
  },
  {
    key: "REPORT_GENERATION",
    label: "Report Generation",
    icon: "📄",
    color: "#f59e0b",
  },
  { key: "DATA_IMPORT", label: "Data Import", icon: "📊", color: "#10b981" },
  {
    key: "ANOMALY_DETECTION",
    label: "Anomaly Detection",
    icon: "🔍",
    color: "#ef4444",
  },
];

const ACTIVITY_TYPES = [
  { key: "all", label: "All Activities" },
  { key: "energy", label: "Energy Monitoring" },
  { key: "power_quality", label: "Power Quality" },
  { key: "equipment", label: "Equipment" },
  { key: "alerts", label: "Alerts" },
];

export default function MonitoringPage() {
  const api = useMonitoringAPI();

  // State Management
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activities, setActivities] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);

  // Filters and Search
  const [activityFilter, setActivityFilter] = useState("all");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(10);
  const intervalRef = useRef(null);

  // Modal States
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isSystemHealthOpen, setIsSystemHealthOpen] = useState(false);

  // Selected Items
  const [selectedJob, setSelectedJob] = useState(null);

  // Create Job Form
  const [jobForm, setJobForm] = useState({
    jobType: "ENERGY_ANALYSIS",
    buildingId: "",
    priority: "normal",
  });

  // Error Handling
  const [error, setError] = useState(null);

  // Generate realistic performance data
  const generatePerformanceData = useCallback(() => {
    const now = new Date();
    const data = [];
    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 30000);
      data.push({
        time: time.toLocaleTimeString(),
        timestamp: time.getTime(),
        system_load: Math.random() * 20 + 70,
        memory_usage: Math.random() * 15 + 60,
        cpu_usage: Math.random() * 25 + 35,
        active_connections: Math.floor(Math.random() * 5) + 10,
        requests_per_second: Math.floor(Math.random() * 50) + 100,
        response_time: Math.random() * 50 + 150,
      });
    }
    setPerformanceData(data);
  }, []);

  // Load all initial data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardRes, activitiesRes, jobsRes] = await Promise.all([
        api.getDashboard(),
        api.getActivities(),
        api.getJobs(),
      ]);

      if (dashboardRes.success) setDashboardData(dashboardRes.data);
      if (activitiesRes.success) setActivities(activitiesRes.data);
      if (jobsRes.success) setJobs(jobsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load monitoring data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  };

  // Load system health
  const loadSystemHealth = async () => {
    setSystemHealthLoading(true);
    try {
      const response = await api.getSystemHealth();
      if (response.success) {
        setSystemHealth(response.data);
      }
    } catch (error) {
      console.error("Failed to load system health:", error);
    } finally {
      setSystemHealthLoading(false);
    }
  };

  // Job management
  const createJob = async () => {
    try {
      const response = await api.createJob(jobForm);
      if (response.success) {
        await loadAllData();
        setIsCreateJobOpen(false);
        setJobForm({
          jobType: "ENERGY_ANALYSIS",
          buildingId: "",
          priority: "normal",
        });
      }
    } catch (error) {
      setError("Failed to create job. Please try again.");
    }
  };

  const cancelJob = async (jobId) => {
    try {
      await api.cancelJob(jobId);
      await loadAllData();
    } catch (error) {
      setError("Failed to cancel job. Please try again.");
    }
  };

  // Utility functions
  const getStatusColor = (status) => {
    const colors = {
      completed: "#10b981",
      success: "#10b981",
      running: "#3b82f6",
      in_progress: "#3b82f6",
      failed: "#ef4444",
      error: "#ef4444",
      queued: "#f59e0b",
      pending: "#f59e0b",
      warning: "#f59e0b",
    };
    return colors[status] || "#6b7280";
  };

  const getBuildingStatusColor = (status) => {
    const colors = {
      normal: "#10b981",
      active: "#10b981",
      warning: "#f59e0b",
      critical: "#ef4444",
      maintenance: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  const formatDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getJobTypeInfo = (type) => {
    return (
      JOB_TYPES.find((j) => j.key === type) || {
        label: type,
        icon: "⚙️",
        color: "#6b7280",
      }
    );
  };

  // Filter data
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      !searchTerm ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.building_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      activityFilter === "all" ||
      activity.activity_type.includes(activityFilter);
    return matchesSearch && matchesFilter;
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchTerm ||
      job.job_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      jobStatusFilter === "all" || job.status === jobStatusFilter;
    return matchesSearch && matchesFilter;
  });

  // Effects
  useEffect(() => {
    loadAllData();
    generatePerformanceData();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generatePerformanceData]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        refreshData();
        generatePerformanceData();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshInterval, generatePerformanceData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MonitorSpeaker className="w-8 h-8 mr-3 text-blue-600" />
                System Monitoring
              </h1>
              <p className="text-gray-500 mt-1">
                Real-time system performance and operational monitoring
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Auto Refresh</span>
              </label>

              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>

              <button
                onClick={() => setIsSystemHealthOpen(true)}
                className="flex items-center px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Server className="w-4 h-4 mr-2" />
                System Health
              </button>

              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* System Statistics */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Buildings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.systemStats.totalBuildings}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <Wifi className="w-3 h-3 mr-1" />
                    All connected
                  </p>
                </div>
                <Building className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Alerts
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboardData.systemStats.totalAlerts}
                  </p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {dashboardData.systemStats.criticalAlerts} critical
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    System Uptime
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData.performance_metrics.system_uptime_percentage.toFixed(
                      1
                    )}
                    %
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Last 30 days
                  </p>
                </div>
                <Server className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Data Collection
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData.performance_metrics.data_collection_rate.toFixed(
                      1
                    )}
                    %
                  </p>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <Activity className="w-3 h-3 mr-1" />
                    Real-time rate
                  </p>
                </div>
                <Database className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              System Performance
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#374151",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="system_load"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="System Load (%)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="memory_usage"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Memory Usage (%)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpu_usage"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="CPU Usage (%)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Network className="w-5 h-5 mr-2 text-green-600" />
              Network Activity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#374151",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests_per_second"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Requests/sec"
                  />
                  <Area
                    type="monotone"
                    dataKey="active_connections"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Active Connections"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: "overview", label: "Overview", icon: Building },
                { key: "activities", label: "Activities", icon: Activity },
                { key: "jobs", label: "Background Jobs", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Building Status Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dashboardData?.buildings?.map((building) => (
                      <div
                        key={building.building_id}
                        className="border border-gray-200 p-4 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {building.name}
                            </h4>
                            <div className="flex items-center mt-1">
                              {building.status === "normal" ? (
                                <Wifi className="w-4 h-4 text-green-500 mr-1" />
                              ) : (
                                <WifiOff className="w-4 h-4 text-red-500 mr-1" />
                              )}
                              <span
                                className="px-2 py-1 text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: `${getBuildingStatusColor(building.status)}20`,
                                  color: getBuildingStatusColor(
                                    building.status
                                  ),
                                }}
                              >
                                {building.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Health Score
                            </span>
                            <span className="font-medium">
                              {building.system_health_score}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${building.system_health_score}%`,
                                backgroundColor:
                                  building.system_health_score > 80
                                    ? "#10b981"
                                    : building.system_health_score > 60
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            />
                          </div>

                          {building.active_alerts > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Active Alerts
                              </span>
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                {building.active_alerts}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )) || (
                      <div className="col-span-full text-center py-8">
                        <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          No building data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === "activities" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg font-semibold">
                    Monitoring Activities
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {ACTIVITY_TYPES.map((type) => (
                        <option key={type.key} value={type.key}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Building
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processing Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredActivities.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No activities found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredActivities.map((activity) => (
                          <tr
                            key={activity.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {activity.activity_type
                                    .replace(/_/g, " ")
                                    .toUpperCase()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {activity.description}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.building_name || "System-wide"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className="px-2 py-1 text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: `${getStatusColor(activity.status)}20`,
                                  color: getStatusColor(activity.status),
                                }}
                              >
                                {activity.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.processing_time_ms}ms
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(activity.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === "jobs" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold">Background Jobs</h3>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div>
                        {jobs.filter((j) => j.status === "running").length}{" "}
                        Running
                      </span>
                      <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></div>
                        {jobs.filter((j) => j.status === "queued").length}{" "}
                        Queued
                      </span>
                      <span className="flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
                        {jobs.filter((j) => j.status === "failed").length}{" "}
                        Failed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={jobStatusFilter}
                      onChange={(e) => setJobStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Jobs</option>
                      <option value="running">Running</option>
                      <option value="queued">Queued</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                              No background jobs found
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredJobs.map((job) => {
                          const typeInfo = getJobTypeInfo(job.job_type);

                          return (
                            <tr
                              key={job.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    Job #{job.id}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {job.building_id
                                      ? `Building ID: ${job.building_id}`
                                      : "System-wide"}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="mr-2">{typeInfo.icon}</span>
                                  <span
                                    className="px-2 py-1 text-xs rounded-full font-medium"
                                    style={{
                                      backgroundColor: `${typeInfo.color}20`,
                                      color: typeInfo.color,
                                    }}
                                  >
                                    {typeInfo.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className="px-2 py-1 text-xs rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${getStatusColor(job.status)}20`,
                                    color: getStatusColor(job.status),
                                  }}
                                >
                                  {job.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {job.progress_percentage !== undefined ? (
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">
                                        {job.progress_percentage}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${job.progress_percentage}%`,
                                          backgroundColor: getStatusColor(
                                            job.status
                                          ),
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">N/A</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  {formatDuration(
                                    job.created_at,
                                    job.completed_at
                                  )}
                                  {job.estimated_completion &&
                                    job.status === "running" && (
                                      <div className="text-xs text-gray-500">
                                        ETA:{" "}
                                        {new Date(
                                          job.estimated_completion
                                        ).toLocaleTimeString()}
                                      </div>
                                    )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedJob(job);
                                      setIsJobDetailOpen(true);
                                    }}
                                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {job.status === "running" && (
                                    <button
                                      onClick={() => cancelJob(job.id)}
                                      className="p-2 text-gray-600 hover:text-yellow-600 transition-colors"
                                    >
                                      <Pause className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      {isCreateJobOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              Create Background Job
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type
                </label>
                <select
                  value={jobForm.jobType}
                  onChange={(e) =>
                    setJobForm((prev) => ({ ...prev, jobType: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {JOB_TYPES.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building (Optional)
                </label>
                <select
                  value={jobForm.buildingId}
                  onChange={(e) =>
                    setJobForm((prev) => ({
                      ...prev,
                      buildingId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">System-wide</option>
                  {dashboardData?.buildings?.map((building) => (
                    <option
                      key={building.building_id}
                      value={building.building_id.toString()}
                    >
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={jobForm.priority}
                  onChange={(e) =>
                    setJobForm((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreateJobOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createJob}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {isJobDetailOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className="px-2 py-1 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: `${getStatusColor(selectedJob.status)}20`,
                    color: getStatusColor(selectedJob.status),
                  }}
                >
                  {selectedJob.status}
                </span>
                <span className="text-xl font-semibold">
                  Job #{selectedJob.id} Details
                </span>
              </div>
              <button
                onClick={() => setIsJobDetailOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Job Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Type:</strong>{" "}
                    {getJobTypeInfo(selectedJob.job_type).label}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedJob.status}
                  </div>
                  <div>
                    <strong>Building ID:</strong>{" "}
                    {selectedJob.building_id || "System-wide"}
                  </div>
                  <div>
                    <strong>Priority:</strong>{" "}
                    {selectedJob.priority || "Normal"}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedJob.created_at).toLocaleString()}
                  </div>
                  {selectedJob.completed_at && (
                    <div>
                      <strong>Completed:</strong>{" "}
                      {new Date(selectedJob.completed_at).toLocaleString()}
                    </div>
                  )}
                  {selectedJob.estimated_completion && (
                    <div>
                      <strong>ETA:</strong>{" "}
                      {new Date(
                        selectedJob.estimated_completion
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {selectedJob.progress_percentage !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Completion</span>
                      <span className="font-medium">
                        {selectedJob.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${selectedJob.progress_percentage}%`,
                          backgroundColor: getStatusColor(selectedJob.status),
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedJob.job_parameters && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Parameters</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(selectedJob.job_parameters, null, 2)}
                  </pre>
                </div>
              )}

              {selectedJob.error_message && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Error Details
                  </h4>
                  <p className="text-red-700">{selectedJob.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Health Modal */}
      {isSystemHealthOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5" />
                <span className="text-xl font-semibold">
                  System Health Dashboard
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadSystemHealth}
                  disabled={systemHealthLoading}
                  className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${systemHealthLoading ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setIsSystemHealthOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {systemHealth ? (
              <div className="space-y-6">
                {/* Overall Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {systemHealth.overall_health_score}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Health</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor(systemHealth.uptime_seconds / 86400)}d
                    </div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {systemHealth.api_health.total_requests_last_hour}
                    </div>
                    <div className="text-sm text-gray-600">API Requests/hr</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {systemHealth.alert_summary.total_active_alerts}
                    </div>
                    <div className="text-sm text-gray-600">Active Alerts</div>
                  </div>
                </div>

                {/* System Components */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Database Health */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center mb-3">
                      <Database className="w-4 h-4 mr-2" />
                      Database Health
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          {systemHealth.database_health.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Connections</span>
                        <span>
                          {
                            systemHealth.database_health.connection_pool
                              .active_connections
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Query Time</span>
                        <span>
                          {
                            systemHealth.database_health.performance_metrics
                              .average_query_time_ms
                          }
                          ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disk Usage</span>
                        <span>
                          {systemHealth.database_health.disk_usage_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* System Resources */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center mb-3">
                      <Cpu className="w-4 h-4 mr-2" />
                      System Resources
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>CPU Usage</span>
                          <span>
                            {systemHealth.system_resources.cpu_usage_percentage}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                            style={{
                              width: `${systemHealth.system_resources.cpu_usage_percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Memory Usage</span>
                          <span>
                            {
                              systemHealth.system_resources
                                .memory_usage_percentage
                            }
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                            style={{
                              width: `${systemHealth.system_resources.memory_usage_percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Disk Usage</span>
                          <span>
                            {
                              systemHealth.system_resources
                                .disk_usage_percentage
                            }
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-yellow-600 transition-all duration-300"
                            style={{
                              width: `${systemHealth.system_resources.disk_usage_percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Service Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(systemHealth.service_status).map(
                      ([service, status]) => (
                        <div
                          key={service}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm capitalize">
                            {service.replace(/_/g, " ")}
                          </span>
                          <span
                            className="px-2 py-1 text-xs rounded-full font-medium"
                            style={{
                              backgroundColor:
                                status === "operational"
                                  ? "#dcfce7"
                                  : status === "degraded"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                              color:
                                status === "operational"
                                  ? "#166534"
                                  : status === "degraded"
                                    ? "#92400e"
                                    : "#991b1b",
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <button
                  onClick={loadSystemHealth}
                  disabled={systemHealthLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {systemHealthLoading ? (
                    <div className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    "Load System Health"
                  )}
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={api.clearCache}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Cache
              </button>
              <button
                onClick={() => setIsSystemHealthOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
