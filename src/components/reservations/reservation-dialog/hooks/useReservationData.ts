import { useState, useEffect } from "react";
import { ClubService, Member } from "@/types";
import { Site } from "@/types/site.types";
import { useAppStore } from "@/store/use-app-store";
import { getAllRecoveryServices } from "@/services/club-service";
import { getAllMembers } from "@/services/member-service";
import { getSiteById } from "@/services/site-service";
import { getGeneralServicesServerAction } from "@/lib/actions/general-services-server";

export function useReservationData(isOpen: boolean, isRecoveryZone: boolean) {
  const { activeBranch } = useAppStore();
  
  const [services, setServices] = useState<ClubService[]>([]);
  const [siteInfo, setSiteInfo] = useState<Site | null>(null);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [courtRentalPrice, setCourtRentalPrice] = useState(10);

  // Load members when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMembersLoading(true);
      getAllMembers()
        .then((data) => setMembers(data))
        .catch((err) => console.error("Error loading members:", err))
        .finally(() => setMembersLoading(false));
    }
  }, [isOpen]);

  // Load recovery services and site info
  useEffect(() => {
    if (isRecoveryZone) {
      getAllRecoveryServices().then((data: ClubService[]) => {
        setServices(data.filter((s) => s.requiresBooking));
      });
      getSiteById("recoveryzone").then((site) => {
        if (site) setSiteInfo(site as Site);
      });
    }
  }, [isRecoveryZone]);

  // Load court rental price
  useEffect(() => {
    if (isOpen && !isRecoveryZone) {
      getGeneralServicesServerAction(activeBranch)
        .then((res) => {
          if (res.success && res.data) {
            const courtService = res.data.find((s) =>
              s.name?.toLowerCase()?.trim()?.includes("наем на корт")
            );
            if (courtService?.price) {
              setCourtRentalPrice(courtService.price);
            }
          }
        })
        .catch((err) => console.error("Error loading general services:", err));
    }
  }, [isOpen, isRecoveryZone, activeBranch]);

  return {
    services,
    siteInfo,
    members,
    membersLoading,
    courtRentalPrice,
  };
}
