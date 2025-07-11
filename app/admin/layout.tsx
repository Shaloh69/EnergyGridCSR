// app/admin/layout.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

// HeroUI Components
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { Badge } from "@heroui/badge";

// Icons
import {
  Home,
  Building,
  Zap,
  BarChart3,
  Shield,
  FileText,
  Settings,
  AlertTriangle,
  MonitorSpeaker,
  Users,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  User,
  Activity,
  Wifi,
  WifiOff,
  UserCog,
  HelpCircle,
  Moon,
  Sun,
  Wrench,
  CheckCircle,
  Eye,
} from "lucide-react";

// API and Types
import {
  dashboardAPI,
  alertsAPI,
  authAPI,
  apiUtils,
  monitoringAPI,
} from "@/lib/api";
import type {
  DashboardOverview,
  Alert,
  User as UserType,
  SystemHealthStatus,
} from "@/types/api-types";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface SidebarItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  permission?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    key: "buildings",
    label: "Buildings",
    href: "/admin/buildings",
    icon: Building,
  },
  {
    key: "equipment",
    label: "Equipment",
    href: "/admin/equipment",
    icon: Wrench,
  },
  {
    key: "energy",
    label: "Energy",
    href: "/admin/energy",
    icon: Zap,
  },
  {
    key: "alerts",
    label: "Alerts",
    href: "/admin/alerts",
    icon: AlertTriangle,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    key: "audits",
    label: "Audits",
    href: "/admin/audits",
    icon: CheckCircle,
  },
  {
    key: "compliance",
    label: "Compliance",
    href: "/admin/compliance",
    icon: Shield,
  },
  {
    key: "monitoring",
    label: "Monitoring",
    href: "/admin/monitoring",
    icon: MonitorSpeaker,
  },
  {
    key: "reports",
    label: "Reports",
    href: "/admin/reports",
    icon: FileText,
  },
  {
    key: "users",
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // UI State
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Data State
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(
    null
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(
    null
  );
  const [monitoringData, setMonitoringData] = useState<any>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Initialize the application
  const initializeApp = useCallback(async () => {
    try {
      if (!apiUtils.isAuthenticated()) {
        console.log("🔒 User not authenticated, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("🚀 Initializing admin dashboard...");
      setLoading(true);
      setError(null);

      await Promise.all([
        loadUserProfile(),
        loadDashboardData(),
        loadAlertsData(),
        loadSystemHealth(),
        loadMonitoringData(),
      ]);

      setupRealTimeUpdates();
      setupTokenMonitoring();
      setupConnectivityMonitoring();

      setLastUpdated(new Date());
      console.log("✅ Admin dashboard initialized successfully");
    } catch (error: any) {
      console.error("❌ Failed to initialize dashboard:", error);
      setError(
        "Failed to initialize dashboard. Please try refreshing the page."
      );

      if (error?.response?.status === 401) {
        console.log("🔒 Authentication failed, redirecting to login");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      console.log("👤 Loading user profile...");

      // First try to get user from localStorage
      const storedUser = apiUtils.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        console.log(
          `✅ User profile loaded from cache: ${storedUser.first_name} ${storedUser.last_name}`
        );
      }

      // Then fetch fresh data from API
      const response = await authAPI.getProfile();
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
        console.log(
          `✅ User profile refreshed: ${response.data.data.user.first_name} ${response.data.data.user.last_name}`
        );
      }
    } catch (error: any) {
      console.error("❌ Failed to load user profile:", error);
      // Keep cached user if API fails
      const storedUser = apiUtils.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      } else if (error?.response?.status === 401) {
        router.push("/login");
      }
    }
  }, [router]);

  // Load dashboard overview data
  const loadDashboardData = useCallback(async () => {
    try {
      console.log("📊 Loading dashboard overview...");
      const response = await dashboardAPI.getOverview();

      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data);
        console.log("✅ Dashboard overview loaded");
      } else {
        console.warn("⚠️ Dashboard overview response unsuccessful");
        setDashboardData(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load dashboard data:", error);
      setDashboardData(null);
    }
  }, []);

  // Load system health
  const loadSystemHealth = useCallback(async () => {
    try {
      console.log("💊 Loading system health...");
      const response = await monitoringAPI.getSystemHealth();

      if (response.data.success && response.data.data) {
        setSystemHealth(response.data.data);
        console.log("✅ System health loaded");
      } else {
        console.warn("⚠️ System health response unsuccessful");
        setSystemHealth(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load system health:", error);
      setSystemHealth(null);
    }
  }, []);

  // Load monitoring dashboard data
  const loadMonitoringData = useCallback(async () => {
    try {
      console.log("🖥️ Loading monitoring dashboard...");
      const response = await monitoringAPI.getDashboard();

      if (response.data.success && response.data.data) {
        setMonitoringData(response.data.data);
        console.log("✅ Monitoring dashboard loaded");
      } else {
        console.warn("⚠️ Monitoring dashboard response unsuccessful");
        setMonitoringData(null);
      }
    } catch (error: any) {
      console.error("❌ Failed to load monitoring data:", error);
      setMonitoringData(null);
    }
  }, []);

  // Load alerts data
  const loadAlertsData = useCallback(async () => {
    try {
      console.log("🚨 Loading alerts data...");

      const response = await alertsAPI.getAll({
        severity: "critical",
        status: "active",
        limit: 10,
        sortBy: "created_at",
        sortOrder: "DESC",
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        const alertsData = response.data.data;
        setAlerts(alertsData);
        setCriticalAlertsCount(alertsData.length);
        console.log(`✅ Loaded ${alertsData.length} critical alerts`);
      } else {
        console.warn("⚠️ Alerts response unsuccessful or data not an array");
        setAlerts([]);
        setCriticalAlertsCount(0);
      }
    } catch (error: any) {
      console.error("❌ Failed to load alerts:", error);
      setAlerts([]);
      setCriticalAlertsCount(0);
    }
  }, []);

  // Set up real-time updates
  const setupRealTimeUpdates = useCallback(() => {
    const realTimeInterval = setInterval(() => {
      if (apiUtils.isAuthenticated()) {
        loadDashboardData();
        loadAlertsData();
        loadSystemHealth();
        loadMonitoringData();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(realTimeInterval);
  }, [loadDashboardData, loadAlertsData, loadSystemHealth, loadMonitoringData]);

  // Set up token monitoring
  const setupTokenMonitoring = useCallback(() => {
    const tokenCheckInterval = setInterval(() => {
      if (apiUtils.isTokenExpiringSoon(5)) {
        console.log("🔄 Token expiring soon, attempting refresh...");
        apiUtils.refreshAuthToken().catch((error) => {
          console.error("❌ Token refresh failed:", error);
          router.push("/login");
        });
      }
    }, 60000);

    return () => clearInterval(tokenCheckInterval);
  }, [router]);

  // Set up connectivity monitoring
  const setupConnectivityMonitoring = useCallback(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("🌐 Connection restored");
      loadDashboardData();
      loadAlertsData();
      loadSystemHealth();
      loadMonitoringData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("📴 Connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadDashboardData, loadAlertsData, loadSystemHealth, loadMonitoringData]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      console.log("👋 Logging out user...");
      await authAPI.logout();
    } catch (error) {
      console.error("❌ Logout failed:", error);
    } finally {
      router.push("/login");
    }
  }, [router]);

  // Get active navigation key
  const getActiveKey = useCallback(() => {
    if (pathname === "/admin") return "dashboard";
    const segments = pathname.split("/");
    return segments[2] || "dashboard";
  }, [pathname]);

  // Helper functions to get system health data safely
  const getOverallHealthScore = useCallback((): number => {
    if (systemHealth?.overall_health_score != null) {
      return Number(systemHealth.overall_health_score);
    }
    if (dashboardData?.system_health?.overall_score != null) {
      return Number(dashboardData.system_health.overall_score);
    }
    return 0;
  }, [systemHealth, dashboardData]);

  const getSystemStatus = useCallback((): string => {
    return (
      systemHealth?.status || dashboardData?.system_health?.status || "unknown"
    );
  }, [systemHealth, dashboardData]);

  const getDataQualityScore = useCallback((): number => {
    if (systemHealth?.data_collection?.data_quality_score != null) {
      return Number(systemHealth.data_collection.data_quality_score);
    }
    if (dashboardData?.system_health?.data_quality_score != null) {
      return Number(dashboardData.system_health.data_quality_score);
    }
    return 0;
  }, [systemHealth, dashboardData]);

  const getUptimePercentage = useCallback((): number => {
    if (systemHealth?.uptime_percentage != null) {
      return Number(systemHealth.uptime_percentage);
    }
    if (dashboardData?.system_health?.uptime_percentage != null) {
      return Number(dashboardData.system_health.uptime_percentage);
    }
    return 0;
  }, [systemHealth, dashboardData]);

  const getDataCollectionRate = useCallback((): number => {
    if (monitoringData?.performance_metrics?.data_collection_rate != null) {
      return Number(monitoringData.performance_metrics.data_collection_rate);
    }
    return 0;
  }, [monitoringData]);

  // Add badge counts to sidebar items
  const sidebarItemsWithBadges = sidebarItems.map((item) => {
    if (item.key === "alerts") {
      return { ...item, badge: criticalAlertsCount };
    }
    return item;
  });

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Spinner size="lg" color="primary" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </div>
          <div className="space-y-2">
            <h2 className="text-white text-xl font-semibold">
              Energy Management System
            </h2>
            <p className="text-slate-300">Initializing dashboard...</p>
            {lastUpdated && (
              <p className="text-slate-400 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              System Error
            </h2>
            <p className="text-default-500">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                color="primary"
                onPress={initializeApp}
                startContent={<Activity className="w-4 h-4" />}
              >
                Retry
              </Button>
              <Button
                variant="bordered"
                onPress={() => router.push("/login")}
                startContent={<LogOut className="w-4 h-4" />}
              >
                Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const overallHealthScore = getOverallHealthScore();
  const systemStatus = getSystemStatus();
  const dataQualityScore = getDataQualityScore();
  const uptimePercentage = getUptimePercentage();
  const dataCollectionRate = getDataCollectionRate();

  return (
    <div
      className={clsx(
        "min-h-screen flex transition-colors duration-300",
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50"
      )}
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="absolute -top-full left-4 z-50 px-4 py-2 bg-primary text-white rounded-md focus:top-4 transition-all"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Card
        className={clsx(
          "h-screen transition-all duration-300 border-r border-slate-700/30 rounded-none",
          "bg-slate-800/95 backdrop-blur-xl",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="p-4 border-b border-slate-700/30">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-lg tracking-tight">
                      EnergyGrid
                    </span>
                    <p className="text-xs text-slate-400">Philippines</p>
                  </div>
                </div>
              )}
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-3 overflow-y-auto">
            <nav
              className="space-y-2"
              role="navigation"
              aria-label="Main navigation"
            >
              {sidebarItemsWithBadges.map((item) => {
                const Icon = item.icon;
                const isActive = getActiveKey() === item.key;

                return (
                  <Link key={item.key} href={item.href}>
                    <Button
                      variant="ghost"
                      className={clsx(
                        "w-full justify-start px-3 py-2.5 rounded-xl transition-all h-auto group",
                        isActive
                          ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25"
                          : "text-slate-300 hover:bg-slate-700/30 hover:text-white"
                      )}
                      aria-label={`Navigate to ${item.label}`}
                    >
                      <div className="flex items-center w-full">
                        <div
                          className={clsx(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                            isActive
                              ? "bg-white/20"
                              : "group-hover:bg-slate-600/30"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {!collapsed && (
                          <>
                            <span className="ml-3 text-sm font-medium flex-1 text-left">
                              {item.label}
                            </span>
                            {item.badge && item.badge > 0 && (
                              <Badge
                                content={item.badge}
                                color="danger"
                                size="sm"
                                className="animate-pulse"
                              >
                                <div />
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* System Status */}
          {!collapsed && (
            <div className="px-4 py-3 border-t border-slate-700/30">
              <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">System Health</span>
                  <Chip
                    size="sm"
                    color={
                      overallHealthScore >= 90
                        ? "success"
                        : overallHealthScore >= 70
                          ? "warning"
                          : "danger"
                    }
                    variant="flat"
                  >
                    {overallHealthScore > 0
                      ? `${overallHealthScore.toFixed(0)}%`
                      : "N/A"}
                  </Chip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Connection</span>
                  <div className="flex items-center space-x-1">
                    {isOnline ? (
                      <>
                        <Wifi className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                {dataQualityScore > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Data Quality</span>
                    <span className="text-xs text-blue-400">
                      {dataQualityScore.toFixed(0)}%
                    </span>
                  </div>
                )}
                {uptimePercentage > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Uptime</span>
                    <span className="text-xs text-green-400">
                      {uptimePercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
                {dataCollectionRate > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Data Rate</span>
                    <span className="text-xs text-purple-400">
                      {dataCollectionRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Profile */}
          <div className="p-4 border-t border-slate-700/30">
            {!collapsed && user ? (
              <Dropdown placement="top-start">
                <DropdownTrigger>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-0 h-auto bg-transparent text-white data-[hover=true]:bg-slate-700/30"
                    aria-label={`User menu for ${user.first_name} ${user.last_name}`}
                  >
                    <div className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-slate-700/30 w-full transition-colors group">
                      <Avatar
                        size="sm"
                        name={`${user.first_name} ${user.last_name}`}
                        className="flex-shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                        color="primary"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-slate-300 truncate capitalize">
                          {user.role.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-300">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User menu actions" className="w-64">
                  <DropdownItem
                    key="profile"
                    startContent={<User className="w-4 h-4" />}
                    description="View and edit your profile"
                    onPress={() => router.push("/admin/profile")}
                  >
                    Profile
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    startContent={<UserCog className="w-4 h-4" />}
                    description="Account preferences"
                    onPress={() => router.push("/admin/settings")}
                  >
                    Settings
                  </DropdownItem>
                  <DropdownItem
                    key="theme"
                    startContent={
                      isDarkMode ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )
                    }
                    description="Toggle theme"
                    onPress={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </DropdownItem>
                  <DropdownItem
                    key="help"
                    startContent={<HelpCircle className="w-4 h-4" />}
                    description="Get help and support"
                    onPress={() => router.push("/admin/help")}
                  >
                    Help & Support
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    className="text-danger"
                    startContent={<LogOut className="w-4 h-4" />}
                    description="Sign out of your account"
                    onPress={handleLogout}
                  >
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <div className="flex justify-center">
                <Avatar
                  size="sm"
                  className="ring-2 ring-primary/20"
                  aria-label="User avatar"
                  color="primary"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Card className="border-b border-slate-700/30 rounded-none bg-slate-800/95 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              {/* Alerts Notification */}
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="relative text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors"
                    aria-label={`Alerts notification - ${Array.isArray(alerts) ? alerts.length : 0} active alerts`}
                  >
                    <Bell className="w-5 h-5" />
                    {criticalAlertsCount > 0 && (
                      <Badge
                        content={criticalAlertsCount}
                        color="danger"
                        size="sm"
                        className="animate-pulse"
                      >
                        <div />
                      </Badge>
                    )}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Active alerts"
                  className="w-80 max-h-96 overflow-y-auto"
                >
                  <DropdownItem
                    key="header"
                    className="opacity-100 cursor-default"
                    textValue="Alerts Header"
                    isReadOnly
                  >
                    <div className="flex items-center justify-between py-2">
                      <h3 className="font-semibold">Critical Alerts</h3>
                      <Chip size="sm" color="danger" variant="flat">
                        {criticalAlertsCount}
                      </Chip>
                    </div>
                  </DropdownItem>

                  {(Array.isArray(alerts) ? alerts : []).length === 0 ? (
                    <DropdownItem
                      key="no-alerts"
                      textValue="No alerts"
                      className="cursor-default"
                      isReadOnly
                    >
                      <div className="text-center py-6">
                        <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm font-medium">All Clear!</p>
                        <p className="text-xs text-default-500">
                          No critical alerts
                        </p>
                      </div>
                    </DropdownItem>
                  ) : (
                    <>
                      {(Array.isArray(alerts) ? alerts : [])
                        .slice(0, 5)
                        .map((alert) => (
                          <DropdownItem
                            key={`alert-${alert.id}`}
                            textValue={alert.title}
                            onPress={() =>
                              router.push(`/admin/alerts?id=${alert.id}`)
                            }
                          >
                            <div className="flex items-start space-x-3 py-2">
                              <div
                                className={clsx(
                                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                  alert.severity === "critical" &&
                                    "bg-red-400 animate-pulse",
                                  alert.severity === "high" && "bg-orange-400",
                                  alert.severity === "medium" &&
                                    "bg-yellow-400",
                                  alert.severity === "low" && "bg-blue-400"
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {alert.title}
                                </p>
                                <p className="text-xs text-default-500 truncate">
                                  {alert.building_name ||
                                    `Building ID: ${alert.building_id}`}
                                </p>
                                {alert.age_minutes && (
                                  <p className="text-xs text-default-400">
                                    {alert.age_minutes}m ago
                                  </p>
                                )}
                              </div>
                            </div>
                          </DropdownItem>
                        ))}

                      <DropdownItem
                        key="view-all"
                        textValue="View all alerts"
                        onPress={() => router.push("/admin/alerts")}
                        className="border-t border-divider"
                      >
                        <div className="flex items-center justify-center py-2 text-primary">
                          <span className="text-sm font-medium">
                            View All Alerts
                          </span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                      </DropdownItem>
                    </>
                  )}
                </DropdownMenu>
              </Dropdown>

              {/* Last Updated Timestamp */}
              {lastUpdated && (
                <div className="hidden lg:block text-right">
                  <p className="text-xs text-slate-400">Last updated</p>
                  <p className="text-xs text-slate-300 font-medium">
                    {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              )}

              {/* Manual Refresh */}
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={initializeApp}
                className="text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors"
                aria-label="Refresh data"
              >
                <Activity className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Page Content */}
        <main
          id="main-content"
          className={clsx(
            "flex-1 overflow-auto transition-colors duration-300",
            isDarkMode
              ? "bg-gradient-to-br from-slate-900/50 via-blue-900/30 to-slate-900/50"
              : "bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-slate-50/50"
          )}
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
