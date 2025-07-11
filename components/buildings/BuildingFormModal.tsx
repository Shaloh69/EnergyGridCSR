"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Save, Building, Factory, Home, GraduationCap } from "lucide-react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BuildingFormData {
  name: string;
  code: string;
  area_sqm: number;
  floors: number;
  year_built: number;
  building_type: "commercial" | "industrial" | "residential" | "institutional";
  description: string;
  status: "active" | "maintenance" | "inactive" | "construction";
  address?: string;
  coordinates?: Coordinates;
}

interface BuildingFormModalProps {
  isOpen: boolean;
  isEdit?: boolean;
  formData: BuildingFormData;
  onChange: (data: BuildingFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const BuildingFormModal: React.FC<BuildingFormModalProps> = ({
  isOpen,
  isEdit = false,
  formData,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Building" : "Create New Building"}
          </h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Building Name"
                placeholder="Enter building name"
                value={formData.name}
                onValueChange={(v) => onChange({ ...formData, name: v })}
                isRequired
              />
              <Input
                label="Building Code"
                placeholder="e.g., MCB-001"
                value={formData.code}
                onValueChange={(v) => onChange({ ...formData, code: v })}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="number"
                label="Area (sqm)"
                placeholder="Building area"
                value={formData.area_sqm.toString()}
                onValueChange={(v) =>
                  onChange({ ...formData, area_sqm: parseInt(v) || 0 })
                }
              />
              <Input
                type="number"
                label="Floors"
                placeholder="Number of floors"
                value={formData.floors.toString()}
                onValueChange={(v) =>
                  onChange({ ...formData, floors: parseInt(v) || 1 })
                }
              />
              <Input
                type="number"
                label="Year Built"
                placeholder="Year built"
                value={formData.year_built.toString()}
                onValueChange={(v) =>
                  onChange({
                    ...formData,
                    year_built: parseInt(v) || new Date().getFullYear(),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Building Type"
                selectedKeys={[formData.building_type]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(
                    keys
                  )[0] as BuildingFormData["building_type"];
                  onChange({ ...formData, building_type: selected });
                }}
              >
                <SelectItem
                  key="commercial"
                  startContent={<Building className="w-4 h-4" />}
                >
                  Commercial
                </SelectItem>
                <SelectItem
                  key="industrial"
                  startContent={<Factory className="w-4 h-4" />}
                >
                  Industrial
                </SelectItem>
                <SelectItem
                  key="residential"
                  startContent={<Home className="w-4 h-4" />}
                >
                  Residential
                </SelectItem>
                <SelectItem
                  key="institutional"
                  startContent={<GraduationCap className="w-4 h-4" />}
                >
                  Institutional
                </SelectItem>
              </Select>

              <Select
                label="Status"
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(
                    keys
                  )[0] as BuildingFormData["status"];
                  onChange({ ...formData, status: selected });
                }}
              >
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="maintenance">Maintenance</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
                <SelectItem key="construction">Construction</SelectItem>
              </Select>
            </div>

            <Input
              label="Address"
              placeholder="Building address"
              value={formData.address || ""}
              onValueChange={(v) => onChange({ ...formData, address: v })}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 bg-default-100 border-2 border-default-200 rounded-lg focus:border-primary focus:outline-none resize-none"
                placeholder="Building description"
                value={formData.description}
                onChange={(e) =>
                  onChange({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={onSubmit}
            isLoading={isSubmitting}
            startContent={<Save className="w-4 h-4" />}
          >
            {isEdit ? "Update Building" : "Create Building"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default React.memo(BuildingFormModal);
