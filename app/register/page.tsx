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
  AlertCircle,
  Phone,
} from "lucide-react";

// API
import { authAPI } from "@/lib/api";
import type { RegisterData } from "@/types/api-types";

// ✅ FIXED: Roles now match API types exactly with proper typing
type UserRole =
  | "admin"
  | "energy_manager"
  | "facility_engineer"
  | "staff"
  | "student";

const userRoles = [
  {
    key: "admin" as const,
    label: "Administrator",
    description: "Full system access and management capabilities",
    icon: Shield,
    color: "danger",
  },
  {
    key: "energy_manager" as const,
    label: "Energy Manager",
    description: "Energy monitoring, analysis, and optimization",
    icon: TrendingUp,
    color: "primary",
  },
  {
    key: "facility_engineer" as const,
    label: "Facility Engineer",
    description: "Equipment maintenance and facility operations",
    icon: Building,
    color: "secondary",
  },
  {
    key: "staff" as const,
    label: "Staff Member",
    description: "Basic monitoring and reporting capabilities",
    icon: BarChart3,
    color: "success",
  },
  {
    key: "student" as const,
    label: "Student/Intern",
    description: "Limited access for learning and observation",
    icon: User,
    color: "warning",
  },
] as const;

interface FormData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  role: UserRole | "";
  phone: string;
  department: string;
  termsAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<
    "form" | "submitting" | "success" | "error"
  >("form");

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  // ✅ FIXED: Enhanced validation matching server requirements exactly
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation (server-side matching)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.trim().length > 255) {
      newErrors.email = "Email must be less than 255 characters";
    }

    // Password validation (matching server complexity requirements)
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const password = formData.password;
      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (password.length > 128) {
        newErrors.password = "Password must be less than 128 characters";
      } else if (!/(?=.*[a-z])/.test(password)) {
        newErrors.password =
          "Password must contain at least one lowercase letter";
      } else if (!/(?=.*[A-Z])/.test(password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/(?=.*\d)/.test(password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/(?=.*[@$!%*?&])/.test(password)) {
        newErrors.password =
          "Password must contain at least one special character (@$!%*?&)";
      }
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    // First name validation (server requirements: 2-100 chars)
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "First name must be at least 2 characters";
    } else if (formData.first_name.trim().length > 100) {
      newErrors.first_name = "First name must be less than 100 characters";
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.first_name.trim())) {
      newErrors.first_name = "First name contains invalid characters";
    }

    // Last name validation (server requirements: 2-100 chars)
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = "Last name must be at least 2 characters";
    } else if (formData.last_name.trim().length > 100) {
      newErrors.last_name = "Last name must be less than 100 characters";
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.last_name.trim())) {
      newErrors.last_name = "Last name contains invalid characters";
    }

    // Role validation (must be from exact API enum)
    if (!formData.role) {
      newErrors.role = "Please select a role";
    } else {
      const validRoles: UserRole[] = [
        "admin",
        "energy_manager",
        "facility_engineer",
        "staff",
        "student",
      ];
      if (!validRoles.includes(formData.role as UserRole)) {
        newErrors.role = "Please select a valid role";
      }
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone.trim()) {
      // Philippine phone number pattern: +63XXXXXXXXXX or 09XXXXXXXXX or similar
      const phonePattern = /^(\+63|0)?[0-9]{10,11}$/;
      const cleanPhone = formData.phone.trim().replace(/[\s\-\(\)]/g, "");
      if (!phonePattern.test(cleanPhone)) {
        newErrors.phone = "Please enter a valid Philippine phone number";
      } else if (cleanPhone.length > 20) {
        newErrors.phone = "Phone number is too long";
      }
    }

    // Department validation (optional but max 100 chars if provided)
    if (formData.department.trim() && formData.department.trim().length > 100) {
      newErrors.department = "Department name must be less than 100 characters";
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.termsAccepted =
        "You must accept the terms and conditions to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FIXED: Enhanced form submission with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log("❌ Form validation failed:", errors);
      return;
    }

    try {
      setIsLoading(true);
      setRegistrationStep("submitting");
      setErrors({}); // Clear previous errors

      console.log("🚀 Starting registration process...");

      // ✅ FIXED: Prepare registration data exactly matching RegisterData interface
      const registerData: RegisterData = {
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role as UserRole, // Now properly typed
      };

      // Add optional fields only if they have values
      if (formData.phone.trim()) {
        // Clean phone number before sending
        const cleanPhone = formData.phone.trim().replace(/[\s\-\(\)]/g, "");
        registerData.phone = cleanPhone;
      }

      if (formData.department.trim()) {
        registerData.department = formData.department.trim();
      }

      console.log("📝 Registration data prepared:", {
        ...registerData,
        password: "***",
        confirm_password: "***",
      });

      const response = await authAPI.register(registerData);

      console.log("✅ Registration response received:", {
        success: response.data.success,
        message: response.data.message,
        hasTokens: !!(
          response.data.data?.access_token && response.data.data?.refresh_token
        ),
      });

      if (response.data.success) {
        console.log("✅ Registration successful!");
        setRegistrationStep("success");

        // Show success message briefly, then redirect
        setTimeout(() => {
          console.log("🔄 Redirecting to admin dashboard...");
          router.push("/admin");
        }, 1500); // Increased delay for better UX
      } else {
        console.error(
          "❌ Registration failed - server returned success: false"
        );
        setRegistrationStep("error");
        setErrors({
          general:
            response.data.message || "Registration failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      setRegistrationStep("error");

      // ✅ FIXED: Enhanced error handling for API-specific errors
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        console.error(`❌ Server error ${status}:`, errorData);

        if (status === 400) {
          // Handle validation errors from server
          if (
            errorData.validation_errors &&
            Array.isArray(errorData.validation_errors)
          ) {
            const validationErrors: FormErrors = {};
            errorData.validation_errors.forEach((err: any) => {
              if (err.field && err.message) {
                validationErrors[err.field] = err.message;
              }
            });
            setErrors(validationErrors);
          } else if (
            errorData.details &&
            typeof errorData.details === "object"
          ) {
            // Handle detailed errors object
            setErrors(errorData.details);
          } else {
            setErrors({
              general:
                errorData.message ||
                "Invalid registration data. Please check your inputs.",
            });
          }
        } else if (status === 409) {
          // Email already exists
          setErrors({
            email:
              "This email address is already registered. Please use a different email or sign in.",
          });
        } else if (status === 422) {
          // Unprocessable entity
          setErrors({
            general:
              "Registration data is invalid. Please check all fields and try again.",
          });
        } else if (status === 429) {
          // Rate limiting
          setErrors({
            general:
              "Too many registration attempts. Please wait a moment and try again.",
          });
        } else if (status >= 500) {
          // Server errors
          setErrors({
            general:
              "Our servers are experiencing issues. Please try again in a few minutes.",
          });
        } else {
          setErrors({
            general:
              errorData.message ||
              `Registration failed (Error ${status}). Please try again.`,
          });
        }
      } else if (error.request) {
        // Network error
        console.error("❌ Network error:", error.request);
        setErrors({
          general:
            "Network error. Please check your internet connection and try again.",
        });
      } else {
        // Other error
        console.error("❌ Other error:", error.message);
        setErrors({
          general:
            error.message || "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
      if (registrationStep === "submitting") {
        setRegistrationStep("form");
      }
    }
  };

  // ✅ FIXED: Better input change handlers with validation
  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    if (field === "role" && typeof value === "string") {
      // Type-safe role assignment
      const roleValue = value as UserRole | "";
      setFormData((prev) => ({ ...prev, [field]: roleValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Success state
  if (registrationStep === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-content1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <CardBody className="space-y-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Account Created Successfully!
              </h2>
              <p className="text-default-600">
                Welcome to EnergyGrid! You'll be redirected to your dashboard
                shortly.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

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
                {/* General Error Display */}
                {errors.general && (
                  <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                    <p className="text-danger text-sm">{errors.general}</p>
                  </div>
                )}

                {/* Registration Step Indicator */}
                {registrationStep === "submitting" && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p className="text-primary text-sm">
                      Creating your account...
                    </p>
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
                      handleInputChange("first_name", e.target.value)
                    }
                    startContent={<User className="w-4 h-4 text-default-400" />}
                    errorMessage={errors.first_name}
                    isInvalid={!!errors.first_name}
                    isDisabled={isLoading}
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                    maxLength={100}
                  />

                  <Input
                    type="text"
                    label="Last Name"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    startContent={<User className="w-4 h-4 text-default-400" />}
                    errorMessage={errors.last_name}
                    isInvalid={!!errors.last_name}
                    isDisabled={isLoading}
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                    maxLength={100}
                  />
                </div>

                <Input
                  type="email"
                  label="Email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  startContent={<Mail className="w-4 h-4 text-default-400" />}
                  errorMessage={errors.email}
                  isInvalid={!!errors.email}
                  isDisabled={isLoading}
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-content2",
                  }}
                  maxLength={255}
                />

                {/* ✅ FIXED: Role selection with proper API roles */}
                <Select
                  label="Role"
                  placeholder="Select your role"
                  selectedKeys={formData.role ? [formData.role] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as
                      | UserRole
                      | undefined;
                    handleInputChange("role", selected || "");
                  }}
                  startContent={
                    <UserCog className="w-4 h-4 text-default-400" />
                  }
                  errorMessage={errors.role}
                  isInvalid={!!errors.role}
                  isDisabled={isLoading}
                  classNames={{
                    trigger: "bg-content2",
                    value: "text-foreground",
                  }}
                >
                  {userRoles.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <SelectItem key={role.key} textValue={role.label}>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${role.color}/10`}
                          >
                            <IconComponent
                              className={`w-4 h-4 text-${role.color}`}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-tiny text-default-400">
                              {role.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    type="tel"
                    label="Phone (Optional)"
                    placeholder="e.g., +639123456789 or 09123456789"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    startContent={
                      <Phone className="w-4 h-4 text-default-400" />
                    }
                    errorMessage={errors.phone}
                    isInvalid={!!errors.phone}
                    isDisabled={isLoading}
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                    maxLength={20}
                  />

                  <Input
                    type="text"
                    label="Department (Optional)"
                    placeholder="e.g., Engineering, Operations"
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                    startContent={
                      <Building className="w-4 h-4 text-default-400" />
                    }
                    errorMessage={errors.department}
                    isInvalid={!!errors.department}
                    isDisabled={isLoading}
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-content2",
                    }}
                    maxLength={100}
                  />
                </div>

                <Input
                  type={isVisible ? "text" : "password"}
                  label="Password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  startContent={<Lock className="w-4 h-4 text-default-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                      disabled={isLoading}
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
                  isDisabled={isLoading}
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-content2",
                  }}
                  maxLength={128}
                />

                <Input
                  type={isConfirmVisible ? "text" : "password"}
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={(e) =>
                    handleInputChange("confirm_password", e.target.value)
                  }
                  startContent={<Lock className="w-4 h-4 text-default-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleConfirmVisibility}
                      disabled={isLoading}
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
                  isDisabled={isLoading}
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
                      handleInputChange("termsAccepted", checked)
                    }
                    isInvalid={!!errors.termsAccepted}
                    isDisabled={isLoading}
                    classNames={{
                      label: "text-default-600",
                    }}
                  >
                    <span className="text-sm">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                        target="_blank"
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
                  disabled={isLoading || registrationStep === "submitting"}
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

          {/* ✅ FIXED: Updated Password Requirements */}
          <div className="mt-6 p-4 bg-content2/50 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Password Requirements:
            </h3>
            <div className="text-xs text-default-600 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>At least 8 characters long (maximum 128)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Contains uppercase and lowercase letters</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Contains at least one number</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Contains at least one special character (@$!%*?&)</span>
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
                <div>Registration Step: {registrationStep}</div>
                <div>
                  Form Valid: {Object.keys(errors).length === 0 ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
