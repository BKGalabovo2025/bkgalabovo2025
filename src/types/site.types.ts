import { ResourceRequirements } from "./booking.types";

/**
 * Represents a physical location/branch of the club.
 */
export interface Site {
  id: string; // The branch name or a unique slug
  name: string; // Display name
  address?: string;
  isActive: boolean;

  // Recovery Zone settings
  recoveryEnabled: boolean;
  recoveryInventory: ResourceRequirements;

  // Operating hours for recovery
  operatingHours: {
    start: number; // e.g., 8 for 08:00
    end: number; // e.g., 22 for 22:00
  };
}
