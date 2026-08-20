import { create } from "zustand";

import { getAuditLogsAction } from "@/lib/actions/audit";
import { AuditLog } from "@/lib/audit-logger";
import { getAllSites } from "@/services/site-service";
import { Site, Therapist } from "@/types/site.types";

interface SettingsState {
  formData: {
    [key: string]: Partial<Site>;
  };
  auditLogs: AuditLog[];
  loadingLogs: boolean;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setFormData: (data: { [key: string]: Partial<Site> }) => void;
  setIsSaving: (isSaving: boolean) => void;

  fetchSettings: () => Promise<void>;
  fetchLogs: () => Promise<void>;

  handleInputChange: (siteId: string, field: keyof Site, value: string) => void;
  handleScheduleChange: (
    siteId: string,
    day: string,
    field: "open" | "close" | "isOpen",
    value: string | boolean
  ) => void;
  handleInventoryChange: (
    siteId: string,
    type: "compressors" | "legs" | "arms" | "hips",
    value: number
  ) => void;
  handleStringArrayChange: (
    siteId: string,
    field: "benefits" | "contraindications",
    index: number,
    value: string
  ) => void;
  addStringArrayItem: (
    siteId: string,
    field: "benefits" | "contraindications"
  ) => void;
  removeStringArrayItem: (
    siteId: string,
    field: "benefits" | "contraindications",
    index: number
  ) => void;
  handleFaqChange: (
    siteId: string,
    index: number,
    field: "q" | "a",
    value: string
  ) => void;
  addFaq: (siteId: string) => void;
  removeFaq: (siteId: string, index: number) => void;
  handleTherapistChange: (
    siteId: string,
    index: number,
    field: keyof Therapist,
    value: string | boolean
  ) => void;
  addTherapist: (siteId: string) => void;
  removeTherapist: (siteId: string, index: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  formData: {},
  auditLogs: [],
  loadingLogs: false,
  isLoading: true,
  isSaving: false,

  setFormData: (data) => set({ formData: data }),
  setIsSaving: (isSaving) => set({ isSaving }),

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const allSites = await getAllSites();
      const initialFormData: { [key: string]: Partial<Site> } = {};
      allSites.forEach((site) => {
        initialFormData[site.id] = { ...site };
      });
      set({ formData: initialFormData });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLogs: async () => {
    set({ loadingLogs: true });
    try {
      const logs = await getAuditLogsAction(50);
      set({ auditLogs: logs });
    } catch (e: unknown) {
      console.error(e);
    } finally {
      set({ loadingLogs: false });
    }
  },

  handleInputChange: (siteId, field, value) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [siteId]: {
          ...state.formData[siteId],
          [field]: value,
        },
      },
    }));
  },

  handleScheduleChange: (siteId, day, field, value) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const sched = site.schedule || {
        monday: { open: "08:00", close: "22:00", isOpen: true },
        tuesday: { open: "08:00", close: "22:00", isOpen: true },
        wednesday: { open: "08:00", close: "22:00", isOpen: true },
        thursday: { open: "08:00", close: "22:00", isOpen: true },
        friday: { open: "08:00", close: "22:00", isOpen: true },
        saturday: { open: "08:00", close: "22:00", isOpen: true },
        sunday: { open: "08:00", close: "22:00", isOpen: true },
      };

      return {
        formData: {
          ...state.formData,
          [siteId]: {
            ...site,
            schedule: {
              ...sched,
              [day]: {
                ...sched[day as keyof typeof sched],
                [field]: value,
              },
            },
          },
        },
      };
    });
  },

  handleInventoryChange: (siteId, type, value) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const inv = site.inventory || {
        attachments: { legs: 0, arms: 0, hips: 0 },
        compressors: 0,
      };
      const atts = inv.attachments || { legs: 0, arms: 0, hips: 0 };

      const newInv = { ...inv };
      if (type === "compressors") {
        newInv.compressors = value;
      } else {
        newInv.attachments = { ...atts, [type]: value };
      }

      return {
        formData: {
          ...state.formData,
          [siteId]: {
            ...site,
            inventory: newInv,
          },
        },
      };
    });
  },

  handleStringArrayChange: (siteId, field, index, value) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const arr = [...((site[field] as string[]) || [])];
      arr[index] = value;
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, [field]: arr },
        },
      };
    });
  },

  addStringArrayItem: (siteId, field) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const arr = [...((site[field] as string[]) || []), ""];
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, [field]: arr },
        },
      };
    });
  },

  removeStringArrayItem: (siteId, field, index) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const arr = [...((site[field] as string[]) || [])];
      arr.splice(index, 1);
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, [field]: arr },
        },
      };
    });
  },

  handleFaqChange: (siteId, index, field, value) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const faqs = [...(site.faqs || [])];
      faqs[index] = { ...faqs[index], [field]: value };
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, faqs },
        },
      };
    });
  },

  addFaq: (siteId) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const faqs = [...(site.faqs || []), { q: "", a: "" }];
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, faqs },
        },
      };
    });
  },

  removeFaq: (siteId, index) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const faqs = [...(site.faqs || [])];
      faqs.splice(index, 1);
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, faqs },
        },
      };
    });
  },

  handleTherapistChange: (siteId, index, field, value) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const therapists = [...(site.therapists || [])];
      therapists[index] = { ...therapists[index], [field]: value };
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, therapists },
        },
      };
    });
  },

  addTherapist: (siteId) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const therapists = [
        ...(site.therapists || []),
        {
          id: `t_${Date.now()}`,
          name: "",
          role: "",
          bio: "",
          image: "",
          isActive: true,
        },
      ];
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, therapists },
        },
      };
    });
  },

  removeTherapist: (siteId, index) => {
    set((state) => {
      const site = state.formData[siteId] || {};
      const therapists = [...(site.therapists || [])];
      therapists.splice(index, 1);
      return {
        formData: {
          ...state.formData,
          [siteId]: { ...site, therapists },
        },
      };
    });
  },
}));
