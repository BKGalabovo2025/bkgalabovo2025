import { getAdminDb } from "@/lib/firebase-admin";
import { Site, Therapist } from "@/types/site.types";

export const getSiteByIdAdmin = async (id: string): Promise<Site | null> => {
  try {
    const adminDb = getAdminDb();
    const docSnap = await adminDb.collection("sites").doc(id).get();

    if (!docSnap.exists) {
      if (id === "bkgalabovo") {
        return {
          id: "bkgalabovo",
          name: "БК Гълъбово",
          isActive: true,
          recoveryEnabled: false,
          inventory: { courts: 4, machines: 0 },
          schedule: null,
          bookingRules: { maxDaysInAdvance: 30, minHoursBeforeBooking: 1 },
        } as Site;
      }
      if (id === "recoveryzone") {
        return {
          id: "recoveryzone",
          name: "Recovery Zone",
          isActive: true,
          recoveryEnabled: true,
          inventory: {
            attachments: { arms: 1, hips: 1, legs: 2 },
            compressors: 2,
          },
          schedule: null,
          bookingRules: {
            maxDaysInAdvance: 7,
            minHoursBeforeBooking: 1,
            cancellationPolicy: "Безплатно анулиране до 2 часа преди часа.",
          },
        } as Site;
      }
      return null;
    }

    const data = docSnap.data() || {};
    let inventory = data.inventory || { courts: 0, machines: 0 };
    if (data.recoveryInventory) {
      inventory = {
        ...inventory,
        compressors: Number(data.recoveryInventory.compressors) || 0,
        attachments: data.recoveryInventory.attachments || {
          legs: 0,
          arms: 0,
          hips: 0,
        },
      };
    }

    return {
      id: docSnap.id,
      name: data.name || docSnap.id,
      address: data.address || "",
      description: data.description || "",
      email: data.email || "",
      phone: data.phone || "",
      website: data.website || "",
      instagram: data.instagram || "",
      youtube: data.youtube || "",
      facebook: data.facebook || "",
      facebookGroup: data.facebookGroup || "",
      logo: data.logo || "",
      inventory,
      schedule: data.schedule || null,
      isActive: data.isActive ?? true,
      recoveryEnabled: data.recoveryEnabled ?? false,
      therapists: (data.therapists || []).map(
        (t: Partial<Therapist>, idx: number) => ({
          ...t,
          id:
            t.id ||
            t.name?.toLowerCase().replace(/\s+/g, "-") ||
            `therapist-${idx}`,
        })
      ) as Therapist[],
      teamIntro: data.teamIntro || "",
      bookingRules: data.bookingRules || {
        minHoursBeforeBooking: 1,
        maxDaysInAdvance: 7,
        cancellationPolicy: "Безплатно анулиране до 2 часа преди часа.",
      },
      marketing: data.marketing || {
        discountCodes: [],
        globalDiscount: { enabled: false, percentage: 0 },
        promoBanner: {
          enabled: false,
          text: "",
          backgroundColor: "#000000",
          textColor: "#ffffff",
        },
      },
      benefits: data.benefits || [],
      attachments: data.attachments || [],
      contraindications: data.contraindications || [],
      faqs: data.faqs || [],
    };
  } catch (err) {
    console.error("Admin Site Service Error:", err);
    return null;
  }
};
