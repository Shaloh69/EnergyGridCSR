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
  CheckCircle,
} from "lucide-react";

// ✅ FIXED: Use the proper hooks and utilities from your API setup
import { useAuth } from "@/hooks/useApi";
import { extractErrorMessage } from "@/lib/api-utils";
import { API_ERROR_CODES } from "@/lib/api-config";
import type { ApiError } from "@/types/api-types";

// ✅ FIXED: Simplified form data structure aligned with API
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean; // ✅ Keep in camelCase for client, API handles transformation
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();

  // ✅ FIXED: Use the useAuth hook for proper state management
  const { user, isAuthenticated, login: loginWithCredentials } = useAuth();

  // ✅ FIXED: Simplified form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // ✅ FIXED: Check authentication status using the hook
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("✅ User already authenticated, redirecting to admin...");
      router.push("/admin");
    }
  }, [isAuthenticated, user, router]);

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

  // ✅ FIXED: Enhanced error handling using your api-utils
  const handleApiError = (error: any): void => {
    console.error("❌ Login Error Details:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    if (error?.response) {
      const status = error.response.status;
      const errorData = error.response.data as ApiError;

      // ✅ Handle validation errors properly (already transformed by API)
      if (status === 422 && errorData?.validationErrors) {
        const validationErrors: FormErrors = {};
        errorData.validationErrors.forEach((err) => {
          // Fields are already in camelCase after transformation
          const formField = err.field as keyof FormErrors;
          if (formField === "email" || formField === "password") {
            validationErrors[formField] = err.message;
          } else {
            validationErrors.general = err.message;
          }
        });
        setErrors(validationErrors);
        return;
      }

      // ✅ Handle specific error codes from api-config.ts
      switch (errorData?.errorCode) {
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

  // ✅ FIXED: Main form submission using the useAuth hook
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrors({}); // Clear previous errors

      console.log("🚀 Starting login process with:", {
        email: formData.email,
        rememberMe: formData.rememberMe,
      });

      // ✅ FIXED: Use the loginWithCredentials from useAuth hook
      // The hook handles all token storage and state management
      const response = await loginWithCredentials(
        formData.email.trim(),
        formData.password
      );

      console.log("✅ Login response received:", {
        success: response.data.success,
        hasUser: !!response.data.data?.user,
      });

      if (response.data.success && response.data.data?.user) {
        console.log("✅ Login successful, redirecting...");
        // The useAuth hook will update isAuthenticated state
        // and the useEffect will handle the redirect
        router.push("/admin");
      } else {
        console.error("❌ Login failed - invalid response");
        setErrors({
          general: response.data.message || "Login failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Demo login using the same pattern
  const handleDemoLogin = async (): Promise<void> => {
    try {
      setIsDemoLoading(true);
      setErrors({});

      console.log("🎯 Starting demo login...");

      // ✅ Set demo credentials and use the same login flow
      const demoEmail = "demo@energygrid.com";
      const demoPassword = "demo123";

      // Update form data for visual feedback
      setFormData({
        email: demoEmail,
        password: demoPassword,
        rememberMe: false,
      });

      // Use the same login method as manual form submission
      const response = await loginWithCredentials(demoEmail, demoPassword);

      if (response.data.success && response.data.data?.user) {
        console.log("✅ Demo login successful, redirecting...");
        router.push("/admin");
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
      setIsDemoLoading(false);
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

                {/* ✅ Success message for demo credential display */}
                {formData.email === "demo@energygrid.com" &&
                  !errors.general && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-success text-sm font-medium">
                          Demo Credentials Loaded
                        </p>
                        <p className="text-success text-sm">
                          Ready to sign in with demo account
                        </p>
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
                  onFocus={() => {
                    // Clear email error when user focuses
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
                  onFocus={() => {
                    // Clear password error when user focuses
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
                  {/* ✅ FIXED: Remember me checkbox (client-side preference) */}
                  <Checkbox
                    size="sm"
                    isSelected={formData.rememberMe}
                    onValueChange={(checked) =>
                      setFormData((prev) => ({ ...prev, rememberMe: checked }))
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
                  {isAuthenticated
                    ? "✅ Authenticated"
                    : "❌ Not Authenticated"}
                </div>
                <div>
                  User: {user ? `${user.firstName} ${user.lastName}` : "None"}
                </div>
                <div>User Role: {user?.role || "None"}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
