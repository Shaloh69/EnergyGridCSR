// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// HeroUI Components
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

// Icons
import {
  Zap,
  Shield,
  BarChart3,
  Building,
  TrendingUp,
  Settings,
  FileText,
  MonitorSpeaker,
  ArrowRight,
  CheckCircle,
  Globe,
  Users,
  Award,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsAuthenticated(true);
      // Auto-redirect to admin if already logged in
      router.push("/admin");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description:
        "Monitor energy consumption, power quality, and system performance with advanced analytics and AI-powered insights.",
      color: "primary",
    },
    {
      icon: Shield,
      title: "Compliance Management",
      description:
        "Automated compliance checking for IEEE 519, PEC 2017, OSHS, ISO 25010, and RA 11285 standards.",
      color: "secondary",
    },
    {
      icon: Building,
      title: "Multi-Building Support",
      description:
        "Centralized management for entire building portfolios with granular control and monitoring.",
      color: "success",
    },
    {
      icon: TrendingUp,
      title: "Cost Optimization",
      description:
        "AI-powered recommendations for energy efficiency improvements and significant cost savings.",
      color: "warning",
    },
    {
      icon: Settings,
      title: "Equipment Management",
      description:
        "Comprehensive equipment tracking, maintenance scheduling, and performance monitoring.",
      color: "danger",
    },
    {
      icon: FileText,
      title: "Advanced Reporting",
      description:
        "Generate detailed reports for energy, compliance, audits, and analytics with customizable formats.",
      color: "purple",
    },
  ];

  const stats = [
    { label: "Energy Saved", value: "2.5M+ kWh", icon: Zap },
    { label: "Buildings Managed", value: "500+", icon: Building },
    { label: "Cost Savings", value: "₱15M+", icon: TrendingUp },
    { label: "Compliance Rate", value: "98.7%", icon: Shield },
  ];

  const standards = [
    "IEEE 519 - Power Quality",
    "PEC 2017 - Philippine Electrical Code",
    "OSHS - Safety Standards",
    "ISO 25010 - System Quality",
    "RA 11285 - Energy Efficiency",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-content1">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-foreground">EnergyGrid</h1>
              <p className="text-lg text-default-500">
                Energy Management System
              </p>
            </div>
          </div>

          {/* Main Heading */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Intelligent Energy
              <span className="text-primary block">Management Platform</span>
            </h2>
            <p className="text-xl text-default-600 leading-relaxed max-w-3xl mx-auto">
              Comprehensive energy monitoring, compliance tracking, and
              analytics solution designed specifically for Philippine buildings
              and facilities. Achieve regulatory compliance while optimizing
              energy efficiency and reducing costs.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              as={Link}
              href="/login"
              color="primary"
              size="lg"
              className="px-8 py-6 text-lg font-medium"
              endContent={<ArrowRight className="w-5 h-5" />}
            >
              Access Dashboard
            </Button>
            <Button
              as={Link}
              href="/register"
              variant="bordered"
              size="lg"
              className="px-8 py-6 text-lg font-medium"
            >
              Start Free Trial
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center p-4">
                  <CardBody>
                    <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-default-500">{stat.label}</div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-content1/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern Energy Management
            </h3>
            <p className="text-lg text-default-600 max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and optimize energy
              consumption while maintaining full regulatory compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <CardBody className="space-y-4">
                    <div
                      className={`w-12 h-12 bg-${feature.color}/10 rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 text-${feature.color}`} />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h4>
                    <p className="text-default-600">{feature.description}</p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Built for Philippine
                <span className="text-primary block">Regulatory Standards</span>
              </h3>
              <p className="text-lg text-default-600 mb-8">
                Our platform is specifically designed to meet all major
                Philippine electrical, safety, and energy efficiency standards,
                ensuring your facilities remain compliant while optimizing
                performance.
              </p>

              <div className="space-y-4">
                {standards.map((standard, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{standard}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <CardBody>
                  <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">100%</div>
                  <div className="text-sm text-default-500">
                    Compliance Coverage
                  </div>
                </CardBody>
              </Card>

              <Card className="p-4 text-center">
                <CardBody>
                  <MonitorSpeaker className="w-12 h-12 text-secondary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-sm text-default-500">
                    Real-time Monitoring
                  </div>
                </CardBody>
              </Card>

              <Card className="p-4 text-center">
                <CardBody>
                  <FileText className="w-12 h-12 text-warning mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">Auto</div>
                  <div className="text-sm text-default-500">
                    Report Generation
                  </div>
                </CardBody>
              </Card>

              <Card className="p-4 text-center">
                <CardBody>
                  <Globe className="w-12 h-12 text-success mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">
                    Multi
                  </div>
                  <div className="text-sm text-default-500">
                    Site Management
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Energy Management?
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations using EnergyGrid to reduce costs,
            ensure compliance, and optimize energy performance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              as={Link}
              href="/login"
              color="default"
              size="lg"
              className="px-8 py-6 text-lg font-medium bg-white text-primary"
              endContent={<ArrowRight className="w-5 h-5" />}
            >
              Get Started Today
            </Button>
            <Button
              as={Link}
              href="/demo"
              variant="bordered"
              size="lg"
              className="px-8 py-6 text-lg font-medium border-white text-white hover:bg-white hover:text-primary"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-content1 border-t border-content2">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-2">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-foreground">EnergyGrid</span>
              </div>
              <p className="text-default-500 text-sm">
                Intelligent energy management for the modern world.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <div className="space-y-2 text-sm">
                <Link
                  href="/features"
                  className="block text-default-500 hover:text-primary"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="block text-default-500 hover:text-primary"
                >
                  Pricing
                </Link>
                <Link
                  href="/demo"
                  className="block text-default-500 hover:text-primary"
                >
                  Demo
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <div className="space-y-2 text-sm">
                <Link
                  href="/about"
                  className="block text-default-500 hover:text-primary"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="block text-default-500 hover:text-primary"
                >
                  Contact
                </Link>
                <Link
                  href="/support"
                  className="block text-default-500 hover:text-primary"
                >
                  Support
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link
                  href="/privacy"
                  className="block text-default-500 hover:text-primary"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="block text-default-500 hover:text-primary"
                >
                  Terms
                </Link>
                <Link
                  href="/security"
                  className="block text-default-500 hover:text-primary"
                >
                  Security
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-content2 mt-8 pt-8 text-center">
            <p className="text-default-500 text-sm">
              © 2024 EnergyGrid. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
