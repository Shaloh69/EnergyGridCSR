// app/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// HeroUI Components
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";

// Icons
import {
  Zap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserCog,
  Shield,
  TrendingUp,
  Building,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

// API
import { authAPI } from "@/lib/api";
import type { RegisterData } from "@/types/api-types";

const userRoles = [
  {
    key: "admin",
    label: "Admin",
    description: "Full access of all the capabilities of the system",
  },
  {
    key: "energy_manager",
    label: "Energy Manager",
    description: "Full energy monitoring and management access",
  },
  {
    key: "auditor",
    label: "Auditor",
    description: "Audit and compliance management capabilities",
  },
  {
    key: "technician",
    label: "Technician",
    description: "Equipment maintenance and monitoring access",
  },
  {
    key: "viewer",
    label: "Viewer",
    description: "Read-only access to reports and data",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    role: "",
    phone: "",
    department: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "First name must be at least 2 characters";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = "Last name must be at least 2 characters";
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions";
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

      console.log("🚀 Starting registration process...");

      // Prepare registration data according to RegisterData interface
      const registerData: RegisterData = {
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
        // Optional fields
        ...(formData.phone.trim() && { phone: formData.phone.trim() }),
        ...(formData.department.trim() && {
          department: formData.department.trim(),
        }),
      };

      console.log("📝 Registration data prepared:", {
        ...registerData,
        password: "***",
        confirm_password: "***",
      });

      const response = await authAPI.register(registerData);

      console.log("✅ Registration response received:", response.data);

      if (response.data.success) {
        console.log("✅ Registration successful, redirecting to admin...");

        // The API client automatically handles token storage, so we just redirect
        setTimeout(() => {
          router.push("/admin");
        }, 100);
      } else {
        console.error(
          "❌ Registration failed - server returned success: false"
        );
        setErrors({ general: response.data.message || "Registration failed" });
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);

      // Enhanced error handling using the API's error structure
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        console.error(`❌ Server error ${status}:`, errorData);

        if (status === 400) {
          // Handle validation errors
          if (errorData.validation_errors) {
            const validationErrors: Record<string, string> = {};
            errorData.validation_errors.forEach((err: any) => {
              validationErrors[err.field] = err.message;
            });
            setErrors(validationErrors);
          } else if (errorData.details) {
            // Handle detailed errors object
            setErrors(errorData.details);
          } else {
            setErrors({ general: errorData.message || "Invalid request" });
          }
        } else if (status === 409) {
          setErrors({ email: "Email address is already registered" });
        } else if (status === 422) {
          setErrors({
            general: "Registration data is invalid. Please check your inputs.",
          });
        } else if (status >= 500) {
          setErrors({ general: "Server error. Please try again later." });
        } else {
          setErrors({
            general:
              errorData.message || "Registration failed. Please try again.",
          });
        }
      } else if (error.request) {
        // Network error
        console.error("❌ Network error:", error.request);
        setErrors({ general: "Network error. Please check your connection." });
      } else {
        // Other error
        console.error("❌ Other error:", error.message);
        setErrors({
          general: error.message || "Registration failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
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
              Join the Future of
              <span className="text-primary block">Energy Management</span>
            </h2>

            <p className="text-lg text-default-600 leading-relaxed">
              Get started with comprehensive energy monitoring, compliance
              tracking, and analytics. Built specifically for Philippine
              buildings with full regulatory compliance support.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Instant Setup</h3>
                <p className="text-sm text-default-500">
                  Get your energy monitoring system up and running in minutes
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Philippine Standards Ready
                </h3>
                <p className="text-sm text-default-500">
                  Pre-configured for IEEE 519, PEC 2017, OSHS, and RA 11285
                  compliance
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Immediate ROI</h3>
                <p className="text-sm text-default-500">
                  Start identifying energy savings opportunities from day one
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCog className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Role-Based Access
                </h3>
                <p className="text-sm text-default-500">
                  Secure, role-based permissions for your entire team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
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
                  Create Account
                </h2>
                <p className="text-default-500 mt-1">
                  Join the energy management revolution
                </p>
              </div>
            </CardHeader>

            <CardBody className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                    <p className="text-danger text-sm">{errors.general}</p>
                  </div>
                )}

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    label="First Name"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    startContent={<User className="w-4 h-4 text-default-400" />}
                    errorMessage={errors.first_name}
                    isInvalid={!!errors.first_name}
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                  />

                  <Input
                    type="text"
                    label="Last Name"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    startContent={<User className="w-4 h-4 text-default-400" />}
                    errorMessage={errors.last_name}
                    isInvalid={!!errors.last_name}
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                  />
                </div>

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

                <Select
                  label="Role"
                  placeholder="Select your role"
                  selectedKeys={formData.role ? [formData.role] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ ...prev, role: selected || "" }));
                  }}
                  startContent={
                    <UserCog className="w-4 h-4 text-default-400" />
                  }
                  errorMessage={errors.role}
                  isInvalid={!!errors.role}
                  classNames={{
                    trigger: "bg-content2",
                    value: "text-foreground",
                  }}
                >
                  {userRoles.map((role) => (
                    <SelectItem key={role.key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-tiny text-default-400">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    type="tel"
                    label="Phone (Optional)"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                  />

                  <Input
                    type="text"
                    label="Department (Optional)"
                    placeholder="Enter department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                  />
                </div>

                <Input
                  type={isVisible ? "text" : "password"}
                  label="Password"
                  placeholder="Create a strong password"
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

                <Input
                  type={isConfirmVisible ? "text" : "password"}
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                  startContent={<Lock className="w-4 h-4 text-default-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleConfirmVisibility}
                    >
                      {isConfirmVisible ? (
                        <EyeOff className="w-4 h-4 text-default-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-default-400" />
                      )}
                    </button>
                  }
                  errorMessage={errors.confirm_password}
                  isInvalid={!!errors.confirm_password}
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-content2",
                  }}
                />

                <div className="space-y-3">
                  <Checkbox
                    size="sm"
                    isSelected={formData.termsAccepted}
                    onValueChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        termsAccepted: checked,
                      }))
                    }
                    isInvalid={!!errors.termsAccepted}
                    classNames={{
                      label: "text-default-600",
                    }}
                  >
                    <span className="text-sm">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </Checkbox>
                  {errors.termsAccepted && (
                    <p className="text-danger text-tiny mt-1">
                      {errors.termsAccepted}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-medium"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <Divider />

              <div className="text-center">
                <span className="text-sm text-default-500">
                  Already have an account?{" "}
                </span>
                <Link
                  href="/login"
                  className="text-sm text-primary hover:text-primary-600 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardBody>

            <CardFooter className="pt-2">
              <div className="w-full text-center">
                <p className="text-xs text-default-400">
                  By creating an account, you confirm that you accept our Terms
                  of Service and Privacy Policy
                </p>
              </div>
            </CardFooter>
          </Card>

          {/* Password Requirements */}
          <div className="mt-6 p-4 bg-content2/50 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Password Requirements:
            </h3>
            <div className="text-xs text-default-600 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>At least 8 characters long</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Contains uppercase and lowercase letters</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Contains at least one number</span>
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
                <div>Selected Role: {formData.role || "None"}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
