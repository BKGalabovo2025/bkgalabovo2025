import { useState, useEffect } from "react";
import { getDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ClubService } from "@/types";
import { docToClubService } from "@/services/subscription-service";
import { useReservations } from "./useReservations";
import { getSiteById } from "@/services/site-service";
import { Site } from "@/types/site.types";
import { 
  calculateAvailability, 
  isServiceAvailableAcrossSlots
} from "@/services/booking/availability";

export const useAvailability = (
  siteId: string | undefined,
  serviceId: string | undefined,
  date: Date
) => {
  const [service, setService] = useState<ClubService | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean; start: Date }[]>([]);
  const { reservations, isLoading: isReservationsLoading } = useReservations(siteId, date);
  const [isServiceLoading, setIsServiceLoading] = useState(true);
  const [isSiteLoading, setIsSiteLoading] = useState(true);

  // Fetch Service
  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setIsServiceLoading(false);
        return;
      }
      setIsServiceLoading(true);
      const db = getDb();
      const serviceDoc = await getDoc(doc(db, "clubServices", serviceId));
      if (serviceDoc.exists()) {
        setService(docToClubService(serviceDoc));
      }
      setIsServiceLoading(false);
    };

    fetchService();
  }, [serviceId]);

  // Fetch Site
  useEffect(() => {
    const fetchSite = async () => {
      if (!siteId) {
        setIsSiteLoading(false);
        return;
      }
      setIsSiteLoading(true);
      const siteData = await getSiteById(siteId);
      setSite(siteData);
      setIsSiteLoading(false);
    };

    fetchSite();
  }, [siteId]);

  useEffect(() => {
    if (isReservationsLoading || isServiceLoading || isSiteLoading || !service || !site) {
      setAvailableSlots([]);
      return;
    }

    // Use site-specific settings
    const inventory = site.recoveryEnabled ? site.recoveryInventory : { attachments: { arms: 0, hips: 0, legs: 0 }, compressors: 0 };
    const operatingHours = site.operatingHours || { start: 8, end: 22 };

    // Calculate slots
    const slots = calculateAvailability(
      reservations,
      date,
      inventory,
      operatingHours
    );

    const serviceDurationSegments = Math.ceil((service.durationMinutes || 0) / 15);

    const formattedSlots = slots.map((slot, index) => {
      const isAvailable = isServiceAvailableAcrossSlots(
        service,
        slots,
        index,
        serviceDurationSegments,
        inventory
      );

      return {
        time: slot.start.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" }),
        available: isAvailable,
        start: slot.start,
      };
    });

    setAvailableSlots(formattedSlots);
  }, [reservations, service, site, date, isReservationsLoading, isServiceLoading, isSiteLoading]);

  return {
    availableSlots,
    isLoading: isReservationsLoading || isServiceLoading || isSiteLoading,
    service,
    site
  };
};
