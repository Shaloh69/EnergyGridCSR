// app/login/page.tsx
"use client";

import React, { useState } from "react";
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
} from "lucide-react";

// API
import { authAPI, apiUtils } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrors({}); // Clear previous errors

      console.log("🚀 Starting login process...");

      const response = await authAPI.login(formData.email, formData.password);

      console.log("✅ Login response received:", response.data);

      if (response.data.success) {
        console.log("✅ Login successful, redirecting to admin...");

        // Small delay to ensure tokens are stored by the API client
        setTimeout(() => {
          router.push("/admin");
        }, 100);
      } else {
        console.error("❌ Login failed - server returned success: false");
        setErrors({ general: response.data.message || "Login failed" });
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);

      // Enhanced error handling using the API's error structure
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        console.error(`❌ Server error ${status}:`, errorData);

        if (status === 401) {
          setErrors({ general: "Invalid email or password" });
        } else if (status === 400) {
          // Handle validation errors
          if (errorData.validation_errors) {
            const validationErrors: Record<string, string> = {};
            errorData.validation_errors.forEach((err: any) => {
              validationErrors[err.field] = err.message;
            });
            setErrors(validationErrors);
          } else {
            setErrors({ general: errorData.message || "Invalid request" });
          }
        } else if (status === 403) {
          setErrors({ general: "Account suspended or inactive" });
        } else if (status === 429) {
          setErrors({
            general: "Too many login attempts. Please try again later.",
          });
        } else if (status >= 500) {
          setErrors({ general: "Server error. Please try again later." });
        } else {
          setErrors({
            general: errorData.message || "Login failed. Please try again.",
          });
        }
      } else if (error.request) {
        // Network error
        console.error("❌ Network error:", error.request);
        setErrors({ general: "Network error. Please check your connection." });
      } else {
        // Other error (token storage, etc.)
        console.error("❌ Other error:", error.message);
        setErrors({
          general: error.message || "Login failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    console.log("🎯 Demo login clicked");

    setFormData({
      email: "demo@energygrid.com",
      password: "demo123",
      remember: false,
    });

    // Clear any previous errors
    setErrors({});

    // Auto-submit after setting demo credentials
    setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await authAPI.login("demo@energygrid.com", "demo123");

        if (response.data.success) {
          setTimeout(() => {
            router.push("/admin");
          }, 100);
        } else {
          setErrors({ general: response.data.message || "Demo login failed" });
        }
      } catch (error: any) {
        console.error("❌ Demo login error:", error);
        setErrors({ general: "Demo login failed. Please try manual login." });
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

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
                {errors.general && (
                  <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                    <p className="text-danger text-sm">{errors.general}</p>
                  </div>
                )}

                <Input
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  startContent={<Mail className="w-4 h-4 text-default-400" />}
                  errorMessage={errors.email}
                  isInvalid={!!errors.email}
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-content2",
                  }}
                />

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
                  startContent={<Lock className="w-4 h-4 text-default-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
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
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-content2",
                  }}
                />

                <div className="flex items-center justify-between">
                  <Checkbox
                    size="sm"
                    isSelected={formData.remember}
                    onValueChange={(checked) =>
                      setFormData((prev) => ({ ...prev, remember: checked }))
                    }
                    classNames={{
                      label: "text-default-600",
                    }}
                  >
                    Remember me
                  </Checkbox>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary-600 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-medium"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <Divider />

              <div className="space-y-3">
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full"
                  onPress={handleDemoLogin}
                  startContent={<Zap className="w-4 h-4" />}
                  disabled={isLoading}
                >
                  Try Demo Account
                </Button>

                <div className="text-center">
                  <span className="text-sm text-default-500">
                    Don't have an account?{" "}
                  </span>
                  <Link
                    href="/register"
                    className="text-sm text-primary hover:text-primary-600 transition-colors font-medium"
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

          {/* Demo Credentials */}
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

          {/* Debug Info - Remove in production */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-content1 rounded-lg border">
              <h4 className="text-xs font-semibold text-foreground mb-2">
                Debug Info:
              </h4>
              <div className="text-xs text-default-500 space-y-1">
                <div>API Base: {process.env.NEXT_PUBLIC_API_BASE}</div>
                <div>Environment: {process.env.NODE_ENV}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
