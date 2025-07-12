// app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// HeroUI Components
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";

// Icons
import {
  Zap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  TrendingUp,
  Building,
  BarChart3,
  AlertCircle,
} from "lucide-react";

// API and Types
import { authAPI, apiUtils } from "@/lib/api";
import { extractErrorMessage } from "@/lib/api-utils";
import { API_ERROR_CODES } from "@/lib/api-config";
import type { LoginCredentials, ApiError } from "@/types/api-types";

// ✅ FIXED: Proper TypeScript interfaces aligned with API
interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean; // ✅ Match server field name
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export default function LoginPage() {
  const router = useRouter();

  // ✅ FIXED: Form state with proper server field alignment
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    remember_me: false, // ✅ Server expects snake_case
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // ✅ FIXED: Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        if (apiUtils.isAuthenticated()) {
          console.log("✅ User already authenticated, redirecting to admin...");
          router.push("/admin");
          return;
        }

        // ✅ Check for expired tokens and clean up
        const expiryTime = apiUtils.getTokenExpiryTime();
        if (expiryTime && expiryTime < Date.now()) {
          console.log("🧹 Cleaning up expired tokens...");
          apiUtils.resetClientState();
        }
      } catch (error) {
        console.warn("⚠️ Auth check failed:", error);
        // Clean up any corrupted state
        apiUtils.resetClientState();
      }
    };

    checkAuthStatus();
  }, [router]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  // ✅ FIXED: Enhanced form validation matching server validation rules
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation - matching server requirements
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.length > 255) {
      newErrors.email = "Email must be less than 255 characters";
    }

    // Password validation - matching server requirements
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (formData.password.length > 255) {
      newErrors.password = "Password must be less than 255 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FIXED: Enhanced error handling using api-utils
  const handleApiError = (error: any): void => {
    console.error("❌ API Error Details:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    if (error?.response) {
      const status = error.response.status;
      const errorData = error.response.data as ApiError;

      // ✅ Handle validation errors properly
      if (status === 400 && errorData?.validation_errors) {
        const validationErrors: FormErrors = {};
        errorData.validation_errors.forEach((err: ValidationError) => {
          // Map server field names to form field names
          const fieldMap: Record<string, keyof FormErrors> = {
            email: "email",
            password: "password",
          };

          const formField = fieldMap[err.field] || "general";
          if (formField === "general") {
            validationErrors.general = err.message;
          } else {
            validationErrors[formField] = err.message;
          }
        });
        setErrors(validationErrors);
        return;
      }

      // ✅ Handle specific error codes from api-config.ts
      switch (errorData?.error_code) {
        case API_ERROR_CODES.AUTHENTICATION_FAILED:
          setErrors({ general: "Invalid email or password" });
          break;
        case API_ERROR_CODES.RATE_LIMIT_EXCEEDED:
          setErrors({
            general: "Too many login attempts. Please try again later.",
          });
          break;
        case API_ERROR_CODES.MAINTENANCE_MODE:
          setErrors({
            general: "System is under maintenance. Please try again later.",
          });
          break;
        default:
          // ✅ Use extractErrorMessage from api-utils for consistent error handling
          const errorMessage = extractErrorMessage(error);
          setErrors({ general: errorMessage });
      }
    } else if (error?.request) {
      // Network error
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
    } else {
      // Other errors
      const errorMessage = extractErrorMessage(error);
      setErrors({ general: errorMessage });
    }
  };

  // ✅ FIXED: Main form submission with proper API alignment
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrors({}); // Clear previous errors

      console.log("🚀 Starting login process with data:", {
        email: formData.email,
        remember_me: formData.remember_me,
      });

      // ✅ FIXED: Create proper LoginCredentials object matching API expectations
      const credentials: LoginCredentials = {
        email: formData.email.trim(),
        password: formData.password,
        remember_me: formData.remember_me, // ✅ Server expects snake_case
      };

      // ✅ Call API with proper credentials structure
      const response = await authAPI.login(
        credentials.email,
        credentials.password
      );

      console.log("✅ Login response received:", {
        success: response.data.success,
        hasData: !!response.data.data,
        hasUser: !!response.data.data?.user,
        hasTokens: !!(
          response.data.data?.access_token && response.data.data?.refresh_token
        ),
      });

      if (response.data.success && response.data.data) {
        console.log(
          "✅ Login successful, user:",
          response.data.data.user?.email
        );

        // ✅ Verify tokens are stored properly
        setTimeout(() => {
          if (apiUtils.isAuthenticated()) {
            console.log("✅ Authentication verified, redirecting...");
            router.push("/admin");
          } else {
            console.error("❌ Authentication failed after login");
            setErrors({ general: "Authentication failed. Please try again." });
            setIsLoading(false);
          }
        }, 100);
      } else {
        console.error("❌ Login failed - server returned success: false");
        setErrors({
          general:
            response.data.message ||
            "Login failed. Please check your credentials.",
        });
      }
    } catch (error: any) {
      handleApiError(error);
    } finally {
      // Only set loading to false if we're not redirecting
      if (!apiUtils.isAuthenticated()) {
        setIsLoading(false);
      }
    }
  };

  // ✅ FIXED: Demo login with proper form submission flow
  const handleDemoLogin = async (): Promise<void> => {
    try {
      setIsDemoLoading(true);
      setErrors({});

      console.log("🎯 Starting demo login...");

      // ✅ Set demo credentials and trigger validation
      const demoFormData: LoginFormData = {
        email: "demo@energygrid.com",
        password: "demo123",
        remember_me: false,
      };

      setFormData(demoFormData);

      // ✅ Use the same login flow as manual form submission
      const response = await authAPI.login(
        demoFormData.email,
        demoFormData.password
      );

      if (response.data.success && response.data.data) {
        console.log("✅ Demo login successful");

        setTimeout(() => {
          if (apiUtils.isAuthenticated()) {
            router.push("/admin");
          } else {
            setErrors({
              general: "Demo authentication failed. Please try again.",
            });
            setIsDemoLoading(false);
          }
        }, 100);
      } else {
        setErrors({
          general:
            response.data.message ||
            "Demo login failed. Please try manual login.",
        });
      }
    } catch (error: any) {
      console.error("❌ Demo login error:", error);
      handleApiError(error);
    } finally {
      if (!apiUtils.isAuthenticated()) {
        setIsDemoLoading(false);
      }
    }
  };

  // ✅ Check if any loading state is active
  const isAnyLoading = isLoading || isDemoLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-content1 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-3">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  EnergyGrid
                </h1>
                <p className="text-sm text-default-500">
                  Energy Management System
                </p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-foreground mb-4">
              Intelligent Energy
              <span className="text-primary block">Management Platform</span>
            </h2>

            <p className="text-lg text-default-600 leading-relaxed">
              Comprehensive energy monitoring, compliance tracking, and
              analytics for Philippine buildings and facilities. Built for IEEE
              519, PEC 2017, OSHS, and RA 11285 compliance.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Real-time Analytics
                </h3>
                <p className="text-sm text-default-500">
                  Monitor energy consumption, power quality, and system
                  performance in real-time
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Compliance Management
                </h3>
                <p className="text-sm text-default-500">
                  Automated compliance checking for Philippine electrical and
                  safety standards
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Cost Optimization
                </h3>
                <p className="text-sm text-default-500">
                  AI-powered recommendations for energy efficiency and cost
                  savings
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Multi-Building Support
                </h3>
                <p className="text-sm text-default-500">
                  Centralized management for entire building portfolios and
                  facilities
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="p-2">
            <CardHeader className="pb-2">
              <div className="text-center w-full">
                <div className="flex items-center justify-center mb-4 lg:hidden">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      EnergyGrid
                    </h1>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome Back
                </h2>
                <p className="text-default-500 mt-1">Sign in to your account</p>
              </div>
            </CardHeader>

            <CardBody className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ✅ FIXED: Enhanced error display with proper styling */}
                {errors.general && (
                  <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-danger text-sm font-medium">
                        Login Failed
                      </p>
                      <p className="text-danger text-sm">{errors.general}</p>
                    </div>
                  </div>
                )}

                {/* ✅ Email Input with proper validation */}
                <Input
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  onBlur={() => {
                    // Clear email error when user starts typing
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  startContent={<Mail className="w-4 h-4 text-default-400" />}
                  errorMessage={errors.email}
                  isInvalid={!!errors.email}
                  isDisabled={isAnyLoading}
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-content2",
                  }}
                  autoComplete="email"
                  required
                />

                {/* ✅ Password Input with proper validation */}
                <Input
                  type={isVisible ? "text" : "password"}
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    // Clear password error when user starts typing
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  startContent={<Lock className="w-4 h-4 text-default-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                      disabled={isAnyLoading}
                    >
                      {isVisible ? (
                        <EyeOff className="w-4 h-4 text-default-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-default-400" />
                      )}
                    </button>
                  }
                  errorMessage={errors.password}
                  isInvalid={!!errors.password}
                  isDisabled={isAnyLoading}
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-content2",
                  }}
                  autoComplete="current-password"
                  required
                />

                <div className="flex items-center justify-between">
                  {/* ✅ FIXED: Remember me checkbox with proper server field alignment */}
                  <Checkbox
                    size="sm"
                    isSelected={formData.remember_me}
                    onValueChange={(checked) =>
                      setFormData((prev) => ({ ...prev, remember_me: checked }))
                    }
                    isDisabled={isAnyLoading}
                    classNames={{
                      label: "text-default-600",
                    }}
                  >
                    Remember me
                  </Checkbox>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary-600 transition-colors"
                    tabIndex={isAnyLoading ? -1 : 0}
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* ✅ FIXED: Submit button with proper loading states */}
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-medium"
                  isLoading={isLoading}
                  disabled={isAnyLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <Divider />

              <div className="space-y-3">
                {/* ✅ FIXED: Demo button with proper loading state */}
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full"
                  onPress={handleDemoLogin}
                  startContent={<Zap className="w-4 h-4" />}
                  isLoading={isDemoLoading}
                  disabled={isAnyLoading}
                >
                  {isDemoLoading ? "Logging in..." : "Try Demo Account"}
                </Button>

                <div className="text-center">
                  <span className="text-sm text-default-500">
                    Don't have an account?{" "}
                  </span>
                  <Link
                    href="/register"
                    className="text-sm text-primary hover:text-primary-600 transition-colors font-medium"
                    tabIndex={isAnyLoading ? -1 : 0}
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </CardBody>

            <CardFooter className="pt-2">
              <div className="w-full text-center">
                <p className="text-xs text-default-400">
                  By signing in, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-content2/50 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Demo Credentials:
            </h3>
            <div className="text-xs text-default-600 space-y-1">
              <div>
                <strong>Email:</strong> demo@energygrid.com
              </div>
              <div>
                <strong>Password:</strong> demo123
              </div>
              <div className="text-warning mt-2">
                * Click "Try Demo Account" for instant access
              </div>
            </div>
          </div>

          {/* ✅ ENHANCED: Debug info with API health status */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-content1 rounded-lg border">
              <h4 className="text-xs font-semibold text-foreground mb-2">
                Debug Info:
              </h4>
              <div className="text-xs text-default-500 space-y-1">
                <div>API Base: {process.env.NEXT_PUBLIC_API_BASE}</div>
                <div>Environment: {process.env.NODE_ENV}</div>
                <div>
                  Auth Status:{" "}
                  {apiUtils.isAuthenticated()
                    ? "✅ Authenticated"
                    : "❌ Not Authenticated"}
                </div>
                <div>Token Expiry: {apiUtils.getTimeUntilExpiry()}</div>
                <div>
                  LocalStorage Available:{" "}
                  {apiUtils.isLocalStorageAvailable() ? "✅" : "❌"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
