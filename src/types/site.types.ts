/**
 * Represents a member of the recovery team.
 */
export interface Therapist {
  id: string;
  name: string;
  phone?: string;
  image?: string;
  bio?: string;
  role?: string;
  isActive: boolean;
}

/**
 * Detailed daily schedule.
 */
export interface DaySchedule {
  open: string; // "HH:mm"
  close: string; // "HH:mm"
  isOpen: boolean;
}

export interface SiteSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

/**
 * Represents a physical location/branch of the club.
 */
export interface Site {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  isActive: boolean;

  // Branding
  logo?: string;
  primaryColor?: string;
  accentColor?: string;

  // Recovery Zone settings
  recoveryEnabled: boolean;
  inventory: any; // Standardized inventory for both sites

  // Enriched settings
  therapists?: Therapist[];
  teamIntro?: string;
  schedule: SiteSchedule | null;
  bookingRules: {
    maxDaysInAdvance: number;
    minHoursBeforeBooking: number;
    cancellationPolicy?: string;
  };

  // Marketing & Promotions
  marketing?: {
    discountCodes: {
      code: string;
      amount: number;
      type: "percent" | "fixed";
      enabled: boolean;
    }[];
    globalDiscount: {
      enabled: boolean;
      percentage: number;
    };
    promoBanner: {
      enabled: boolean;
      text: string;
      backgroundColor: string;
      textColor: string;
    };
  };

  // Content for public page
  benefits?: {
    icon: string;
    title: string;
    desc: string;
  }[];
  attachments?: {
    name: string;
    image: string;
    desc: string;
    points: string[];
  }[];
  contraindications?: string[];
}
