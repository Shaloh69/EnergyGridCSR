// app/admin/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

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
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  UserCog,
  HelpCircle,
  Moon,
  Sun,
  Wrench,
  CheckCircle,
} from "lucide-react";

// ✅ Only Essential Hook
import { useAuth } from "@/hooks/useApi";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface SidebarItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: Home },
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
  { key: "energy", label: "Energy", href: "/admin/energy", icon: Zap },
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
  { key: "audits", label: "Audits", href: "/admin/audits", icon: CheckCircle },
  {
    key: "compliance",
    label: "Compliance",
    href: "/admin/compliance",
    icon: Shield,
  },
  { key: "reports", label: "Reports", href: "/admin/reports", icon: FileText },
  // { key: "users", label: "Users", href: "/admin/users", icon: Users },
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

  // ✅ Hydration-safe state management
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ Auth hook - but we'll handle it safely
  const { user, isAuthenticated, logout: handleLogout } = useAuth();

  // ✅ Ensure component is mounted before showing auth-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Handle authentication redirect after mount
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  // ✅ Get active navigation key
  const getActiveKey = () => {
    if (pathname === "/admin") return "dashboard";
    const segments = pathname.split("/");
    return segments[2] || "dashboard";
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("user-dropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // ✅ Show consistent loading state until mounted and auth is checked
  if (!mounted || (mounted && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex transition-colors duration-300 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center w-full">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-white text-xl font-semibold">
                Energy Management System
              </h2>
              <p className="text-slate-300">
                {!mounted ? "Loading..." : "Checking authentication..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main layout - only rendered after mount and auth check
  return (
    <div
      className={clsx(
        "min-h-screen flex transition-colors duration-300",
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50"
      )}
    >
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="absolute -top-full left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-md focus:top-4 transition-all"
      >
        Skip to main content
      </a>

      {/* ✅ Simplified Sidebar */}
      <div
        className={clsx(
          "h-screen transition-all duration-300 border-r border-slate-700/30 bg-slate-800/95 backdrop-blur-xl",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="p-4 border-b border-slate-700/30">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-lg tracking-tight">
                      BacusEnergyAudit
                    </span>
                    <p className="text-xs text-slate-400">Platform</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-3 overflow-y-auto">
            <nav
              className="space-y-2"
              role="navigation"
              aria-label="Main navigation"
            >
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = getActiveKey() === item.key;

                return (
                  <Link key={item.key} href={item.href}>
                    <div
                      className={clsx(
                        "w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25"
                          : "text-slate-300 hover:bg-slate-700/30 hover:text-white"
                      )}
                    >
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
                        <span className="ml-3 text-sm font-medium flex-1 text-left">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ✅ User Profile */}
          <div className="p-4 border-t border-slate-700/30">
            {!collapsed && user ? (
              <div className="relative" id="user-dropdown">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-700/30 transition-colors group"
                  aria-label={`User menu for ${user.firstName} ${user.lastName}`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-blue-600/20 group-hover:ring-blue-600/40 transition-all">
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-300 truncate capitalize">
                      {user.role?.replace("_", " ")}
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50">
                    <button
                      onClick={() => {
                        router.push("/admin/profile");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        router.push("/admin/settings");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <UserCog className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsDarkMode(!isDarkMode);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      {isDarkMode ? (
                        <Sun className="w-4 h-4 mr-3" />
                      ) : (
                        <Moon className="w-4 h-4 mr-3" />
                      )}
                      {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </button>
                    <button
                      onClick={() => {
                        router.push("/admin/help");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 mr-3" />
                      Help & Support
                    </button>
                    <div className="border-t border-slate-700 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : !collapsed ? (
              <div className="flex items-center space-x-3 p-3">
                <div className="w-8 h-8 bg-slate-600/50 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-slate-600/50 rounded animate-pulse"></div>
                  <div className="h-2 bg-slate-600/50 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Main Content */}
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
  );
}
