"use client";

import {
  ArrowRightLeft,
  BookmarkPlus,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LayoutGrid,
  Link2,
  Mic,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  Sliders,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserPlus,
  Users,
  Volume2,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CoachPreset,
  DEFAULT_COACH_PRESETS,
  deleteCustomCoachPreset,
  findPresetById,
  loadCustomCoachPresets,
  saveCustomCoachPreset,
} from "@/hooks/shadow-trainer/coachPresets";
import { ShadowPlayer, ShadowSettings } from "@/hooks/useShadowTrainer";
import { getScheduleEventByIdAction } from "@/lib/actions/events";
import { ZoneId } from "@/lib/shadow-training/audio-map";
import {
  calculateCourtAssignments,
  movePlayerToBench,
  movePlayerToCourtSlot,
  splitPlayersIntoWaves,
  swapPlayers,
} from "@/lib/shadow-training/court-logistics";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";
import {
  cacheAllShadowAudio,
  checkShadowOfflineStatus,
  ShadowOfflineStatus,
} from "@/lib/shadow-training/shadow-offline-cache";
import { cn, resolveMemberAgeGroup } from "@/lib/utils";

import { CourtVisualizer } from "../CourtVisualizer";
import { MultiCourtGrid } from "./MultiCourtGrid";
import { QuickAddMemberDialog } from "./QuickAddMemberDialog";

interface ShadowSetupFormProps {
  initialMembers: ShadowPlayer[];
  settings: ShadowSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShadowSettings>>;
  onStartTraining: () => void;
  preselectedMemberId?: string | null;
}

type SetupSectionId = "all" | "params" | "logistics" | "court" | "players";

const SETUP_SECTIONS: {
  id: SetupSectionId;
  label: string;
  shortLabel: string;
}[] = [
  { id: "all", label: "Всички секции (Bento)", shortLabel: "Всички" },
  { id: "params", label: "1. Категория & Темпо", shortLabel: "1. Категория" },
  {
    id: "logistics",
    label: "2. Логистика & Режим",
    shortLabel: "2. Логистика",
  },
  { id: "court", label: "3. Корт & Зони", shortLabel: "3. Корт" },
  {
    id: "players",
    label: "4. Състезатели & Кортове",
    shortLabel: "4. Състезатели",
  },
];

function updateUrlParams(
  mutator: (params: URLSearchParams) => void,
  hash?: string
) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    mutator(url.searchParams);
    if (hash !== undefined) {
      url.hash = hash;
    }
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch {
    // Ignore history/URL errors in jsdom
  }
}

export function ShadowSetupForm({
  initialMembers,
  settings,
  setSettings,
  onStartTraining,
  preselectedMemberId,
}: ShadowSetupFormProps) {
  const [activeSection, setActiveSection] = useState<SetupSectionId>("all");
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [focusedCourt, setFocusedCourt] = useState<number | null>(null);

  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [playerFilterCategory, setPlayerFilterCategory] = useState<
    "all" | "u11" | "u13" | "u15" | "u17" | "adults"
  >("all");
  const [membersList, setMembersList] =
    useState<ShadowPlayer[]>(initialMembers);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isModifiersOpen, setIsModifiersOpen] = useState(true);
  const [isRosterExpanded, setIsRosterExpanded] = useState(true);
  const [customPresets, setCustomPresets] = useState<CoachPreset[]>([]);
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const autoSelectedMemberRef = useRef<string | null>(null);
  const autoSelectedMembersListRef = useRef<string | null>(null);
  const loadedScheduleRef = useRef<string | null>(null);

  // ─── ОФЛАЙН КЕШ & СЪСТОЯНИЕ НА ЗАЛАТА ───
  const [offlineStatus, setOfflineStatus] = useState<ShadowOfflineStatus>({
    isFullyCached: false,
    cachedCount: 0,
    totalCount: 32,
    isOnline: true,
    cacheSupported: true,
  });
  const [isCachingAudio, setIsCachingAudio] = useState(false);
  const [cachingProgress, setCachingProgress] = useState<number>(0);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  useEffect(() => {
    checkShadowOfflineStatus().then(setOfflineStatus);

    const handleOnline = () => {
      setOfflineStatus((prev) => ({ ...prev, isOnline: true }));
      toast.success("Интернет връзката е възстановена!");
    };
    const handleOffline = () => {
      setOfflineStatus((prev) => ({ ...prev, isOnline: false }));
      toast.warning("Офлайн режим: Аудиото и модулът работят автономно.");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  const handlePreloadAllAudio = async () => {
    setIsCachingAudio(true);
    setCachingProgress(0);
    try {
      const res = await cacheAllShadowAudio((loaded, total) => {
        setCachingProgress(Math.round((loaded / total) * 100));
      });
      const updated = await checkShadowOfflineStatus();
      setOfflineStatus(updated);
      if (res.success || updated.cachedCount >= 32) {
        toast.success(
          "Всички 32 аудио файла са кеширани локално за работа без интернет в залата!"
        );
      } else {
        toast.info(
          `Кеширани са ${updated.cachedCount} от ${updated.totalCount} аудио файла.`
        );
      }
    } catch {
      toast.error("Възникна грешка при кеширане на звуковите файлове.");
    } finally {
      setIsCachingAudio(false);
    }
  };

  // Sync initial URL query params (?section=..., ?card=..., ?modal=..., ?court=..., ?modifiers=..., ?preset=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const loadedCustom = loadCustomCoachPresets();
      setCustomPresets(loadedCustom);

      const params = new URLSearchParams(window.location.search);
      const sec = params.get("section") as SetupSectionId | null;
      if (
        sec &&
        ["all", "params", "logistics", "court", "players"].includes(sec)
      ) {
        setActiveSection(sec);
      }

      const presetParam = params.get("preset");
      if (presetParam) {
        const found = findPresetById(presetParam, loadedCustom);
        if (found) {
          setSettings((prev) => ({
            ...prev,
            preset: found.id,
            mode: found.mode,
            drillMode: found.drillMode,
            cornersMode: found.cornersMode,
            drillPattern: found.drillPattern,
            ageGroup: found.ageGroup,
            sets: found.sets,
            workSec: found.workSec,
            restSec: found.restSec,
            paceSec: found.paceSec,
            deceptionEnabled: found.deceptionEnabled ?? prev.deceptionEnabled,
            leftHanded: found.leftHanded ?? prev.leftHanded,
          }));
        }
      }

      const modal = params.get("modal");
      if (modal === "add-member") {
        setIsAddMemberOpen(true);
      } else if (modal === "save-preset") {
        setIsSavePresetOpen(true);
      } else if (modal === "offline-cache") {
        setIsOfflineModalOpen(true);
      }

      // Bridge params from SmartCourtBoardView & ActiveSessionClient (?corners=&sets=&work=&rest=&pace=&drillMode=)
      const urlOverrides: Partial<ShadowSettings> = {};
      const cornersParam = params.get("corners");
      if (cornersParam) {
        if (
          cornersParam === "2-corners" ||
          cornersParam === "4-corners" ||
          cornersParam === "6-corners"
        ) {
          urlOverrides.cornersMode = cornersParam;
        } else {
          const list = cornersParam
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (list.length > 0) {
            urlOverrides.cornersMode =
              list.length <= 2
                ? "2-corners"
                : list.length <= 4
                  ? "4-corners"
                  : "6-corners";
          }
        }
      }
      const setsParam = params.get("sets");
      if (setsParam) {
        const n = parseInt(setsParam, 10);
        if (!Number.isNaN(n) && n >= 1 && n <= 20) urlOverrides.sets = n;
      }
      const workParam = params.get("work");
      if (workParam) {
        const n = parseInt(workParam, 10);
        if (!Number.isNaN(n) && n >= 5 && n <= 300) urlOverrides.workSec = n;
      }
      const restParam = params.get("rest");
      if (restParam) {
        const n = parseInt(restParam, 10);
        if (!Number.isNaN(n) && n >= 5 && n <= 300) urlOverrides.restSec = n;
      }
      const paceParam = params.get("pace");
      if (paceParam) {
        const n = parseFloat(paceParam);
        if (!Number.isNaN(n) && n >= 0.5 && n <= 10) urlOverrides.paceSec = n;
      }
      const drillModeParam = params.get("drillMode");
      if (
        drillModeParam &&
        [
          "all",
          "front_only",
          "back_only",
          "forehand_only",
          "backhand_only",
          "front_back",
        ].includes(drillModeParam)
      ) {
        urlOverrides.drillMode = drillModeParam as ShadowSettings["drillMode"];
      }
      if (Object.keys(urlOverrides).length > 0) {
        setSettings((prev) => ({
          ...prev,
          ...urlOverrides,
        }));
      }

      const mod = params.get("modifiers");
      if (mod === "closed") {
        setIsModifiersOpen(false);
      } else if (mod === "open") {
        setIsModifiersOpen(true);
      }

      const courtParam = params.get("court");
      if (courtParam) {
        const cNum = parseInt(courtParam, 10);
        if (!Number.isNaN(cNum) && cNum >= 1 && cNum <= 6) {
          setFocusedCourt(cNum);
        }
      }

      const cardParam = params.get("card");
      if (cardParam) {
        setHighlightedCard(cardParam);
        setTimeout(() => {
          const el = document.getElementById(`card-${cardParam}`);
          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
        setTimeout(() => setHighlightedCard(null), 3500);
      }
    } catch {
      // Ignore URL errors
    }
  }, [setSettings]);

  const handleSectionChange = useCallback((sec: SetupSectionId) => {
    setActiveSection(sec);
    updateUrlParams((params) => {
      if (sec === "all") {
        params.delete("section");
      } else {
        params.set("section", sec);
      }
    });
  }, []);

  const handleAddMemberOpenChange = useCallback((open: boolean) => {
    setIsAddMemberOpen(open);
    updateUrlParams((params) => {
      if (open) {
        params.set("modal", "add-member");
      } else if (params.get("modal") === "add-member") {
        params.delete("modal");
      }
    });
  }, []);

  const handleSavePresetOpenChange = useCallback((open: boolean) => {
    setIsSavePresetOpen(open);
    updateUrlParams((params) => {
      if (open) {
        params.set("modal", "save-preset");
      } else if (params.get("modal") === "save-preset") {
        params.delete("modal");
      }
    });
  }, []);

  const handleOfflineModalOpenChange = useCallback((open: boolean) => {
    setIsOfflineModalOpen(open);
    updateUrlParams((params) => {
      if (open) {
        params.set("modal", "offline-cache");
      } else if (params.get("modal") === "offline-cache") {
        params.delete("modal");
      }
    });
  }, []);

  const handleToggleModifiers = useCallback(() => {
    setIsModifiersOpen((prev) => {
      const next = !prev;
      updateUrlParams((params) => {
        params.set("modifiers", next ? "open" : "closed");
      });
      return next;
    });
  }, []);

  const handleApplyPreset = useCallback(
    (preset: CoachPreset) => {
      setSettings((prev) => ({
        ...prev,
        preset: preset.id,
        mode: preset.mode,
        drillMode: preset.drillMode,
        cornersMode: preset.cornersMode,
        drillPattern: preset.drillPattern,
        ageGroup: preset.ageGroup,
        sets: preset.sets,
        workSec: preset.workSec,
        restSec: preset.restSec,
        paceSec: preset.paceSec,
        deceptionEnabled: preset.deceptionEnabled ?? prev.deceptionEnabled,
        leftHanded: preset.leftHanded ?? prev.leftHanded,
        voiceSpeed: preset.voiceSpeed ?? prev.voiceSpeed,
      }));
      updateUrlParams((params) => {
        params.set("preset", preset.id);
      });
      toast.success(`Шаблонът „${preset.name}“ е приложен!`);
    },
    [setSettings]
  );

  const handleSaveCustomPreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error("Моля, въведете име на новия шаблон.");
      return;
    }

    const slug =
      newPresetName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, "-")
        .replace(/^-+|-+$/g, "") || `preset-${Date.now()}`;

    const saved = saveCustomCoachPreset({
      id: slug,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      mode: settings.mode,
      drillMode: settings.drillMode,
      cornersMode: settings.cornersMode,
      drillPattern: settings.drillPattern,
      ageGroup: settings.ageGroup,
      sets: settings.sets,
      workSec: settings.workSec,
      restSec: settings.restSec,
      paceSec: settings.paceSec,
      deceptionEnabled: settings.deceptionEnabled,
      leftHanded: settings.leftHanded,
      voiceSpeed: settings.voiceSpeed,
    });

    const updated = loadCustomCoachPresets();
    setCustomPresets(updated);
    setSettings((prev) => ({ ...prev, preset: saved.id }));
    updateUrlParams((params) => {
      params.set("preset", saved.id);
    });
    handleSavePresetOpenChange(false);
    setNewPresetName("");
    setNewPresetDescription("");
    toast.success(`Шаблонът „${saved.name}“ беше успешно запазен!`);
  }, [
    newPresetName,
    newPresetDescription,
    settings,
    setSettings,
    handleSavePresetOpenChange,
  ]);

  const handleDeleteCustomPreset = useCallback((presetId: string) => {
    deleteCustomCoachPreset(presetId);
    const updated = loadCustomCoachPresets();
    setCustomPresets(updated);
    updateUrlParams((params) => {
      if (params.get("preset") === presetId) {
        params.delete("preset");
      }
    });
    toast.success("Шаблонът беше изтрит.");
  }, []);

  const handleFocusCourtChange = useCallback((courtNumber: number | null) => {
    setFocusedCourt(courtNumber);
    updateUrlParams(
      (params) => {
        if (courtNumber !== null) {
          params.set("court", String(courtNumber));
        } else {
          params.delete("court");
        }
      },
      courtNumber !== null ? `court-${courtNumber}` : ""
    );
  }, []);

  const handleCopyCardUrl = useCallback((cardId: string, label: string) => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("card", cardId);
      url.hash = `card-${cardId}`;
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      void navigator.clipboard.writeText(url.toString());
      setCopiedCardId(cardId);
      setHighlightedCard(cardId);
      toast.success(`Линкът към „${label}“ е копиран!`);
      setTimeout(() => setCopiedCardId(null), 2000);
      setTimeout(() => setHighlightedCard(null), 3000);
    } catch {
      // Ignore clipboard errors
    }
  }, []);

  useEffect(() => {
    setMembersList((prev) => {
      if (prev.length === 0) return initialMembers;
      const existingIds = new Set(initialMembers.map((m) => m.id));
      const newlyAdded = prev.filter((p) => !existingIds.has(p.id));
      return [...newlyAdded, ...initialMembers];
    });
  }, [initialMembers]);

  // Auto-select player from URL ?memberId=... or preselectedMemberId prop
  useEffect(() => {
    let targetId = preselectedMemberId || null;
    if (!targetId && typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        targetId = params.get("memberId");
      } catch {
        // Ignore URL parsing errors
      }
    }
    if (!targetId || autoSelectedMemberRef.current === targetId) return;
    const found = membersList.find((m) => m.id === targetId);
    if (found) {
      autoSelectedMemberRef.current = targetId;
      const pName =
        found.displayName ||
        `${found.firstName || ""} ${found.lastName || ""}`.trim() ||
        "Играч";
      setSettings((prev) => {
        if (prev.activePlayers.some((p) => p.id === found.id)) return prev;
        return {
          ...prev,
          activePlayers: [
            ...prev.activePlayers,
            {
              id: found.id,
              displayName: pName,
              ageGroup: found.ageGroup || resolveMemberAgeGroup(found),
            },
          ],
        };
      });
    }
  }, [membersList, preselectedMemberId, setSettings]);

  // Auto-select multiple players from URL ?members=id1,id2,...
  useEffect(() => {
    if (typeof window === "undefined" || membersList.length === 0) return;
    let membersParam: string | null = null;
    try {
      membersParam = new URLSearchParams(window.location.search).get("members");
    } catch {
      return;
    }
    if (!membersParam || autoSelectedMembersListRef.current === membersParam)
      return;
    const ids = membersParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    const matched: ShadowPlayer[] = [];
    ids.forEach((id) => {
      const found = membersList.find((m) => m.id === id);
      if (found) {
        matched.push({
          id: found.id,
          displayName:
            found.displayName ||
            `${found.firstName || ""} ${found.lastName || ""}`.trim() ||
            "Играч",
          ageGroup: found.ageGroup || resolveMemberAgeGroup(found),
        });
      }
    });

    if (matched.length > 0) {
      autoSelectedMembersListRef.current = membersParam;
      setSettings((prev) => {
        const existingIds = new Set(prev.activePlayers.map((p) => p.id));
        const toAdd = matched.filter((p) => !existingIds.has(p.id));
        if (toAdd.length === 0) return prev;
        return {
          ...prev,
          activePlayers: [...prev.activePlayers, ...toAdd],
        };
      });
    }
  }, [membersList, setSettings]);

  // Auto-load session & attendees from URL ?scheduleId=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    let schedId: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      schedId = params.get("scheduleId");
    } catch {
      // ignore
    }
    if (!schedId || loadedScheduleRef.current === schedId) return;

    loadedScheduleRef.current = schedId;
    getScheduleEventByIdAction(schedId).then((res) => {
      if (res.success && res.event) {
        const ev = res.event;
        const attendedMembers: ShadowPlayer[] = [];
        const presentAttendees = (ev.attendees || []).filter(
          (a: { attended?: boolean }) => a.attended
        );

        presentAttendees.forEach((att: { memberId: string; name?: string }) => {
          const found = membersList.find((m) => m.id === att.memberId);
          if (found) {
            attendedMembers.push({
              id: found.id,
              displayName:
                found.displayName ||
                `${found.firstName || ""} ${found.lastName || ""}`.trim() ||
                att.name ||
                "Състезател",
              ageGroup: found.ageGroup || resolveMemberAgeGroup(found),
            });
          } else {
            attendedMembers.push({
              id: att.memberId,
              displayName: att.name || "Състезател",
            });
          }
        });

        // Detect age group from event title if available
        let detectedAgeGroup = settings.ageGroup;
        const titleLower = ev.title.toLowerCase();
        if (titleLower.includes("u11") || titleLower.includes("9-11"))
          detectedAgeGroup = "U9-U11";
        else if (titleLower.includes("u13") || titleLower.includes("11-13"))
          detectedAgeGroup = "U11-U13";
        else if (titleLower.includes("u15") || titleLower.includes("13-15"))
          detectedAgeGroup = "U13-U15";
        else if (titleLower.includes("u17") || titleLower.includes("15-17"))
          detectedAgeGroup = "U15-U17";
        else if (
          titleLower.includes("мъже") ||
          titleLower.includes("жени") ||
          titleLower.includes("17+")
        )
          detectedAgeGroup = "U17+";

        setSettings((prev) => ({
          ...prev,
          scheduleId: ev.id,
          scheduleEventTitle: ev.title,
          ageGroup: detectedAgeGroup,
          activePlayers:
            attendedMembers.length > 0 ? attendedMembers : prev.activePlayers,
        }));

        toast.success(
          `Заредени ${attendedMembers.length} присъстващи състезатели от „${ev.title}“!`
        );
      }
    });
  }, [membersList, setSettings, settings.ageGroup]);

  // Calculate preview zones for live court visualization in the configurator
  const previewZones = useMemo<ZoneId[]>(() => {
    const mode = settings.cornersMode;
    const drill = settings.drillMode;

    let baseZones: ZoneId[];
    if (mode === "2-corners") {
      if (drill === "back_only") {
        baseZones = ["backForehand", "backBackhand"];
      } else if (drill === "forehand_only") {
        baseZones = ["frontForehand", "backForehand"];
      } else if (drill === "backhand_only") {
        baseZones = ["frontBackhand", "backBackhand"];
      } else {
        baseZones = ["frontForehand", "frontBackhand"];
      }
    } else if (mode === "4-corners") {
      baseZones = [
        "frontForehand",
        "frontBackhand",
        "backForehand",
        "backBackhand",
      ];
    } else if (drill === "front_back") {
      baseZones = [
        "frontForehand",
        "frontBackhand",
        "backForehand",
        "backBackhand",
        "overhead",
      ];
    } else {
      baseZones = [
        "frontForehand",
        "frontBackhand",
        "midForehand",
        "midBackhand",
        "backForehand",
        "backBackhand",
        "overhead",
      ];
    }

    if (settings.drillPattern === "forehand-only") {
      return baseZones.filter((z) => z.toLowerCase().includes("forehand"));
    }
    if (settings.drillPattern === "backhand-only") {
      return baseZones.filter(
        (z) => z.toLowerCase().includes("backhand") || z === "overhead"
      );
    }
    return baseZones;
  }, [settings.cornersMode, settings.drillMode, settings.drillPattern]);

  const physicalCornersCount = useMemo(() => {
    const corners = new Set<string>();
    previewZones.forEach((z) => {
      if (z === "overhead" || z === "backBackhand") {
        corners.add("backLeft");
      } else {
        corners.add(z);
      }
    });
    return corners.size;
  }, [previewZones]);

  // Multi-court assignments & capacity calculation
  const courtLogistics = useMemo(() => {
    return calculateCourtAssignments(
      settings.activePlayers,
      settings.courtsAvailable,
      settings.courtAllocationStrategy
    );
  }, [
    settings.activePlayers,
    settings.courtsAvailable,
    settings.courtAllocationStrategy,
  ]);

  const isWakeLockSupported = useMemo(() => {
    return typeof navigator !== "undefined" && "wakeLock" in navigator;
  }, []);

  const handleSwapPlayers = useCallback(
    (pAId: string, pBId: string) => {
      setSettings((prev) => ({
        ...prev,
        activePlayers: swapPlayers(prev.activePlayers, pAId, pBId),
      }));
      toast.success("Състезателите бяха разменени по кортовете!");
    },
    [setSettings]
  );

  const handleMovePlayerToCourt = useCallback(
    (pId: string, courtNumber: number, half: "A" | "B") => {
      setSettings((prev) => ({
        ...prev,
        activePlayers: movePlayerToCourtSlot(
          prev.activePlayers,
          pId,
          courtNumber,
          half,
          prev.courtAllocationStrategy,
          prev.courtsAvailable
        ),
      }));
      toast.success(
        `Състезателят беше преместен на Корт ${courtNumber} (${half === "A" ? "Поле 1" : "Поле 2"})!`
      );
    },
    [setSettings]
  );

  const handleMovePlayerToBench = useCallback(
    (pId: string) => {
      setSettings((prev) => ({
        ...prev,
        activePlayers: movePlayerToBench(
          prev.activePlayers,
          pId,
          prev.courtsAvailable,
          prev.courtAllocationStrategy
        ),
      }));
      toast.info("Състезателят беше преместен на пейката.");
    },
    [setSettings]
  );

  const handleResetCourtAllocation = useCallback(() => {
    setSettings((prev) => {
      const sorted = [...prev.activePlayers].sort((a, b) =>
        (a.displayName || "").localeCompare(b.displayName || "", "bg")
      );
      return {
        ...prev,
        activePlayers: sorted,
      };
    });
    toast.success("Разпределението по кортове беше възстановено автоматично!");
  }, [setSettings]);

  const handleSoundCheck = () => {
    try {
      const audio = new Audio("/shadow/common/podgotvi_se.mp3");
      if (settings.voiceSpeed) {
        audio.playbackRate = settings.voiceSpeed;
      }
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch {
      // Ignore audio errors in headless/test environments
    }
  };

  const handleStart = () => {
    setSettings((prev) => ({
      ...prev,
      centerCommandEnabled: prev.centerCommandEnabled ?? true,
      deceptionEnabled: Boolean(prev.deceptionEnabled),
      motivationEnabled: Boolean(prev.motivationEnabled),
      visualOnly: Boolean(prev.visualOnly),
      leftHanded: Boolean(prev.leftHanded),
      voiceSpeed: prev.voiceSpeed ?? 1.0,
    }));
    shadowLogger.setup(
      "Coach confirmed configuration, proceeding to Active Training Screen",
      {
        preset: settings.preset,
        mode: settings.mode,
        drillMode: settings.drillMode,
        cornersMode: settings.cornersMode,
        sets: settings.sets,
        workSec: settings.workSec,
        restSec: settings.restSec,
        paceSec: settings.paceSec,
        deceptionEnabled: settings.deceptionEnabled,
        motivationEnabled: settings.motivationEnabled,
        visualOnly: settings.visualOnly,
        leftHanded: settings.leftHanded,
        voiceSpeed: settings.voiceSpeed,
        playersCount: settings.activePlayers.length,
        activePlayers: settings.activePlayers.map((p) => p.displayName),
      }
    );
    onStartTraining();
  };

  // Filtered members for quick selection
  const filteredPlayers = useMemo(() => {
    let list = membersList;
    if (playerFilterCategory !== "all") {
      list = list.filter((m) => {
        const ag = (m.ageGroup || resolveMemberAgeGroup(m) || "").toLowerCase();
        if (playerFilterCategory === "u11") {
          return ag.includes("u9") || ag.includes("u11");
        }
        if (playerFilterCategory === "u13") {
          return ag.includes("u13");
        }
        if (playerFilterCategory === "u15") {
          return ag.includes("u15");
        }
        if (playerFilterCategory === "u17") {
          return ag.includes("u17");
        }
        if (playerFilterCategory === "adults") {
          return (
            ag.includes("u19") ||
            ag.includes("17+") ||
            ag.includes("мъже") ||
            ag.includes("жени") ||
            ag.includes("adult")
          );
        }
        return true;
      });
    }

    if (!playerSearchQuery.trim()) return list;
    const q = playerSearchQuery.toLowerCase();
    return list.filter((m) => {
      const name = (
        m.displayName || `${m.firstName} ${m.lastName}`
      ).toLowerCase();
      return name.includes(q);
    });
  }, [membersList, playerFilterCategory, playerSearchQuery]);

  const handleMemberAdded = (newPlayer: ShadowPlayer, _isClub: boolean) => {
    setMembersList((prev) => {
      if (prev.some((p) => p.id === newPlayer.id)) return prev;
      return [newPlayer, ...prev];
    });
    setSettings((prev) => {
      if (prev.activePlayers.some((p) => p.id === newPlayer.id)) return prev;
      return {
        ...prev,
        activePlayers: [
          ...prev.activePlayers,
          {
            id: newPlayer.id,
            displayName:
              newPlayer.displayName ||
              `${newPlayer.firstName || ""} ${newPlayer.lastName || ""}`.trim() ||
              "Играч",
            ageGroup: newPlayer.ageGroup,
          },
        ],
      };
    });
  };

  const handleSelectAllFiltered = () => {
    setSettings((prev) => {
      const newSelected = [...prev.activePlayers];
      filteredPlayers.forEach((p) => {
        if (!newSelected.some((x) => x.id === p.id)) {
          newSelected.push({
            id: p.id,
            displayName:
              p.displayName ||
              `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
              "Играч",
            ageGroup: p.ageGroup,
          });
        }
      });
      return { ...prev, activePlayers: newSelected };
    });
  };

  const handleSelectCurrentCategory = () => {
    const targetAg = (settings.ageGroup || "").toLowerCase();
    setSettings((prev) => {
      const newSelected = [...prev.activePlayers];
      membersList.forEach((m) => {
        const ag = (m.ageGroup || resolveMemberAgeGroup(m) || "").toLowerCase();
        let isMatch = false;
        if (targetAg === "u9-u11")
          isMatch = ag.includes("u9") || ag.includes("u11");
        else if (targetAg === "u11-u13")
          isMatch = ag.includes("u11") || ag.includes("u13");
        else if (targetAg === "u13-u15")
          isMatch = ag.includes("u13") || ag.includes("u15");
        else if (targetAg === "u15-u17")
          isMatch = ag.includes("u15") || ag.includes("u17");
        else if (targetAg === "u17+")
          isMatch =
            ag.includes("u17") ||
            ag.includes("u19") ||
            ag.includes("17+") ||
            ag.includes("мъже") ||
            ag.includes("жени") ||
            ag.includes("adult");

        if (isMatch && !newSelected.some((x) => x.id === m.id)) {
          newSelected.push({
            id: m.id,
            displayName:
              m.displayName ||
              `${m.firstName || ""} ${m.lastName || ""}`.trim() ||
              "Играч",
            ageGroup: m.ageGroup || resolveMemberAgeGroup(m),
          });
        }
      });
      return { ...prev, activePlayers: newSelected };
    });
  };

  const handleRemoveSinglePlayer = (playerId: string) => {
    setSettings((prev) => ({
      ...prev,
      activePlayers: prev.activePlayers.filter((p) => p.id !== playerId),
    }));
  };

  const handleClearSelected = () => {
    setSettings((prev) => ({ ...prev, activePlayers: [] }));
  };

  const showParams = activeSection === "all" || activeSection === "params";
  const showLogistics =
    activeSection === "all" || activeSection === "logistics";
  const showCourt = activeSection === "all" || activeSection === "court";
  const showPlayers = activeSection === "all" || activeSection === "players";

  const renderCardLinkButton = (cardId: string, label: string) => {
    const isCopied = copiedCardId === cardId;
    return (
      <button
        type="button"
        onClick={() => handleCopyCardUrl(cardId, label)}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        title={`Копирай директен URL за ${label}`}
        aria-label={`Копирай директен URL за ${label}`}
      >
        {isCopied ? (
          <Check size={14} className="text-emerald-500" />
        ) : (
          <Link2 size={14} />
        )}
      </button>
    );
  };

  return (
    <div className="relative flex size-full flex-col duration-300 animate-in fade-in">
      <div className="flex-1 space-y-4 overflow-visible pb-6">
        {/* ─── КОМПАКТЕН ЗЛАТЕН ХИБРИДЕН ХЕДЪР + ЙЕРАРХИЧНА НАВИГАЦИЯ ПО СЕКЦИИ ─── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                <Settings2 size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-black tracking-tight text-zinc-900 sm:text-lg dark:text-white">
                  Интелигентен Настройчик
                </h2>
                <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {settings.ageGroup} •{" "}
                  {settings.mode === "agility_test"
                    ? `${settings.workSec} движения`
                    : `${settings.sets}×${settings.workSec}s / ${settings.restSec}s`}{" "}
                  • Темпо {settings.paceSec}s • {settings.courtsAvailable}{" "}
                  {settings.courtsAvailable === 1 ? "корт" : "корта"} •{" "}
                  {settings.activePlayers.length} играчи
                </p>
                {/* ─── ИНДИКАТОР ЗА СЪСТОЯНИЕТО НА ЗАЛАТА И АУДИО ГОТОВНОСТ ─── */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOfflineModalOpenChange(true)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
                    title="Кликнете за преглед на офлайн статуса и кеширане на всички 32 MP3 звуци"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {offlineStatus.isFullyCached
                      ? "Аудио кеширано (32/32 MP3) • Офлайн готовност"
                      : offlineStatus.cachedCount > 0
                        ? `Аудио кеширано (${offlineStatus.cachedCount}/32 MP3)`
                        : "Кеширай аудио за зала (32 MP3)"}
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    {isWakeLockSupported
                      ? "Екранът няма да заспива (WakeLock активен)"
                      : "WakeLock (стандартен таймер)"}
                  </span>
                  {!offlineStatus.isOnline && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      <WifiOff size={10} />
                      Офлайн режим (Залата работи)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSoundCheck}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                    title="Тествай озвучаването в залата"
                  >
                    <Volume2 size={11} />
                    Тест звук
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleStart}
              className="h-9 shrink-0 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-xs hover:bg-blue-700 lg:hidden"
            >
              <Play size={13} className="mr-1 fill-current" /> Старт
            </Button>
          </div>

          {/* Йерархичен превключвател на Bento секции (URL-синхронизиран ?section=...) */}
          <div
            role="tablist"
            aria-label="Йерархични секции на настройчика"
            className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200/70 bg-zinc-100/90 p-1 dark:border-zinc-800 dark:bg-zinc-900/70"
          >
            {SETUP_SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSectionChange(sec.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all",
                    isActive
                      ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {sec.id === "all" && (
                    <LayoutGrid
                      size={12}
                      className={
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-400"
                      }
                    />
                  )}
                  <span className="hidden xl:inline">{sec.label}</span>
                  <span className="xl:hidden">{sec.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── БАНЕР ЗА СВЪРЗАНА ТРЕНИРОВКА ОТ ГРАФИКА ─── */}
        {settings.scheduleId && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3 shadow-2xs dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-bold text-blue-900 dark:text-blue-100">
                    Свързана тренировка от графика:{" "}
                    {settings.scheduleEventTitle || "Тренировка"}
                  </span>
                  <span className="shrink-0 rounded-md bg-blue-200/70 px-1.5 py-0.5 text-[10px] font-black text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Авто-синхрон
                  </span>
                </div>
                <p className="truncate text-[11px] text-blue-700/80 dark:text-blue-300/80">
                  Присъствията от тази Shadow сесия ще се валидират автоматично
                  в клубния дневник на графика.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettings((prev) => ({
                  ...prev,
                  scheduleId: undefined,
                  scheduleEventTitle: undefined,
                }));
                toast.info("Връзката с графика беше премахната.");
              }}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-blue-400 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900/50"
              title="Премахни връзката с графика"
              aria-label="Премахни връзката с графика"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ─── 1. КАТЕГОРИЯ & ПАРАМЕТРИ (BENTO CARD: card-params) ─── */}
        {showParams && (
          <Card
            id="card-params"
            className={cn(
              "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
              highlightedCard === "params" &&
                "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                <Users size={16} className="text-blue-600 dark:text-blue-400" />{" "}
                Избор на Категория & Времеви Параметри
              </h2>
              <div className="flex items-center gap-2">
                <span className="hidden text-[11px] font-medium text-zinc-500 sm:inline dark:text-zinc-400">
                  BWF / BEC / Badminton Asia стандарти
                </span>
                {renderCardLinkButton(
                  "params",
                  "Избор на Категория & Времеви Параметри"
                )}
              </div>
            </div>
            <CardContent className="space-y-4 p-4">
              {/* ── ТРЕНЬОРСКИ ШАБЛОНИ (PRESETS: BWF + СПЕЦИАЛИЗИРАНИ + CUSTOM) ── */}
              <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={15} className="shrink-0 text-amber-500" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Треньорски шаблони (Presets)
                    </span>
                    <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black text-amber-700 dark:text-amber-300">
                      BWF &amp; Персонализирани
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleSavePresetOpenChange(true)}
                      className="h-7 rounded-lg border-blue-500/30 bg-blue-500/10 px-2 text-[11px] font-bold text-blue-700 hover:bg-blue-500/20 dark:text-blue-300"
                    >
                      <BookmarkPlus size={13} className="mr-1" />
                      Запази като нов шаблон
                    </Button>
                  </div>
                </div>

                {/* Селектор за шаблони */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-50 flex-1">
                    <select
                      aria-label="Избор на треньорски шаблон"
                      value={settings.preset || ""}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const p = findPresetById(pid, customPresets);
                        if (p) handleApplyPreset(p);
                      }}
                      className="h-8 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-2.5 pr-8 text-xs font-bold text-zinc-800 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      <option value="" disabled>
                        -- Изберете или приложете шаблон --
                      </option>
                      {customPresets.length > 0 && (
                        <optgroup label="⭐ Мои треньорски шаблони">
                          {customPresets.map((cp) => (
                            <option key={`cp-${cp.id}`} value={cp.id}>
                              ★ {cp.name} ({cp.sets}с • {cp.paceSec}s)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="🏸 Специализирани клубни шаблони">
                        {DEFAULT_COACH_PRESETS.filter(
                          (p) => p.category === "specialized"
                        ).map((sp) => (
                          <option key={`sp-${sp.id}`} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🏆 BWF Международни категории">
                        {DEFAULT_COACH_PRESETS.filter(
                          (p) => p.category === "bwf"
                        ).map((bp) => (
                          <option key={`bp-${bp.id}`} value={bp.id}>
                            {bp.name} ({bp.sets}с • {bp.paceSec}s)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400"
                    />
                  </div>

                  {customPresets.some((cp) => cp.id === settings.preset) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCustomPreset(settings.preset)}
                      className="h-8 px-2 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                      title="Изтрий този персонализиран шаблон"
                    >
                      <Trash2 size={13} className="mr-1" />
                      Изтрий
                    </Button>
                  )}
                </div>
              </div>

              {/* 5-те Международни Бадминтон Категории - компактни за 100% лаптоп екран */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  {
                    id: "U9-U11",
                    title: "9 - 11 г.",
                    tag: "U9-U11",
                    sub: "Деца / Начинаещи",
                    standardName: "BWF Shuttle Time",
                    standardSummary: "2 серии • 30s • 4.0s",
                    defaults: {
                      sets: 2,
                      workSec: 30,
                      restSec: 60,
                      paceSec: 4.0,
                      cornersMode: "4-corners" as const,
                    },
                  },
                  {
                    id: "U11-U13",
                    title: "11 - 13 г.",
                    tag: "U11-U13",
                    sub: "Деца / Напреднали",
                    standardName: "BEC Development",
                    standardSummary: "3 серии • 40s • 3.0s",
                    defaults: {
                      sets: 3,
                      workSec: 40,
                      restSec: 45,
                      paceSec: 3.0,
                      cornersMode: "6-corners" as const,
                    },
                  },
                  {
                    id: "U13-U15",
                    title: "13 - 15 г.",
                    tag: "U13-U15",
                    sub: "Юноши & Девойки (Мл.)",
                    standardName: "BWF Junior Circuit",
                    standardSummary: "3 серии • 45s • 2.5s",
                    defaults: {
                      sets: 3,
                      workSec: 45,
                      restSec: 30,
                      paceSec: 2.5,
                      cornersMode: "6-corners" as const,
                    },
                  },
                  {
                    id: "U15-U17",
                    title: "15 - 17 г.",
                    tag: "U15-U17",
                    sub: "Юноши & Девойки (Ст.)",
                    standardName: "Asia & Euro Junior",
                    standardSummary: "4 серии • 45s • 2.0s",
                    defaults: {
                      sets: 4,
                      workSec: 45,
                      restSec: 30,
                      paceSec: 2.0,
                      cornersMode: "6-corners" as const,
                    },
                  },
                  {
                    id: "U17+",
                    title: "17+ г.",
                    tag: "U17+ / Елит",
                    sub: "Мъже & Жени / Елит",
                    standardName: "BWF World Tour / Asia",
                    standardSummary: "4 серии • 60s • 1.8s",
                    defaults: {
                      sets: 4,
                      workSec: 60,
                      restSec: 30,
                      paceSec: 1.8,
                      cornersMode: "6-corners" as const,
                    },
                  },
                ].map((a) => {
                  const isSelected = settings.ageGroup === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        shadowLogger.setup(
                          `Age group changed: ${a.title} (${a.tag})`,
                          {
                            ageGroup: a.id,
                            standard: a.standardName,
                            defaults: a.defaults,
                          }
                        );
                        setSettings((prev) => ({
                          ...prev,
                          ageGroup: a.id as ShadowSettings["ageGroup"],
                          sets:
                            prev.mode === "agility_test" ? 1 : a.defaults.sets,
                          workSec:
                            prev.mode === "agility_test"
                              ? 20
                              : a.defaults.workSec,
                          restSec:
                            prev.mode === "agility_test"
                              ? 0
                              : a.defaults.restSec,
                          paceSec: a.defaults.paceSec,
                          cornersMode: a.defaults.cornersMode,
                        }));
                      }}
                      className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500/20"
                          : "border-zinc-200/80 bg-zinc-50/40 text-zinc-900 hover:border-blue-500/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}
                          >
                            {a.tag}
                          </span>
                          <span
                            className={`truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                              isSelected
                                ? "bg-white/10 text-blue-100"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {a.standardName}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-1">
                          <h3 className="text-base font-black tracking-tight sm:text-lg">
                            {a.title}
                          </h3>
                        </div>
                        <p
                          className={`truncate text-[11px] font-semibold leading-snug ${
                            isSelected
                              ? "text-blue-100"
                              : "text-zinc-600 dark:text-zinc-300"
                          }`}
                        >
                          {a.sub}
                        </p>
                      </div>

                      <div className="mt-2 border-t border-zinc-200/40 pt-1.5 dark:border-zinc-800/60">
                        <span
                          className={`block text-[10px] font-bold ${
                            isSelected
                              ? "text-white"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {a.standardSummary}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 4 Времеви параметъра - компактни h-10 */}
              <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col justify-between gap-1">
                  {settings.mode === "agility_test" ? (
                    <>
                      <span className="truncate text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                        Серии
                      </span>
                      <div
                        id="shadow-sets-input"
                        className="flex h-10 items-center truncate rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        1 серия (Тест)
                      </div>
                    </>
                  ) : (
                    <>
                      <Label
                        htmlFor="shadow-sets-input"
                        className="truncate text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                      >
                        Серии
                      </Label>
                      <Input
                        id="shadow-sets-input"
                        type="number"
                        min="1"
                        max="10"
                        className="h-10 rounded-xl text-base font-bold"
                        value={settings.sets}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            sets: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-col justify-between gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <Label
                      htmlFor="shadow-work-input"
                      className="truncate text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                    >
                      {settings.mode === "agility_test"
                        ? "Целеви движения"
                        : "Работа (сек)"}
                    </Label>
                    {settings.mode === "agility_test" && (
                      <span className="truncate text-[10px] text-zinc-400">
                        норматив
                      </span>
                    )}
                  </div>
                  <Input
                    id="shadow-work-input"
                    type="number"
                    min={settings.mode === "agility_test" ? 5 : 10}
                    max={settings.mode === "agility_test" ? 100 : 300}
                    className="h-10 rounded-xl text-base font-bold"
                    value={settings.workSec}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        workSec:
                          parseInt(e.target.value) ||
                          (settings.mode === "agility_test" ? 20 : 30),
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col justify-between gap-1">
                  {settings.mode === "agility_test" ? (
                    <>
                      <span className="truncate text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                        Почивка (сек)
                      </span>
                      <div
                        id="shadow-rest-input"
                        className="flex h-10 items-center truncate rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                      >
                        — (Спринт тест)
                      </div>
                    </>
                  ) : (
                    <>
                      <Label
                        htmlFor="shadow-rest-input"
                        className="truncate text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                      >
                        Почивка (сек)
                      </Label>
                      <Input
                        id="shadow-rest-input"
                        type="number"
                        min="5"
                        max="180"
                        className="h-10 rounded-xl text-base font-bold"
                        value={settings.restSec}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            restSec: parseInt(e.target.value) || 30,
                          }))
                        }
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-col justify-between gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <Label
                      htmlFor="shadow-pace-input"
                      className="truncate text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                    >
                      {settings.mode === "agility_test"
                        ? "Реакция (сек)"
                        : "Пауза / Темпо (сек)"}
                    </Label>
                    <span className="hidden truncate text-[10px] text-zinc-400 xl:inline">
                      след удар
                    </span>
                  </div>
                  <Input
                    id="shadow-pace-input"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    className="h-10 rounded-xl text-base font-bold"
                    value={settings.paceSec}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSettings((prev) => ({
                        ...prev,
                        paceSec: Number.isNaN(val)
                          ? 2.5
                          : Math.min(
                              10,
                              Math.max(0.5, Math.round(val * 10) / 10)
                            ),
                      }));
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── 2 & 3. БАЛАНСИРАНА 12-КОЛОННА BENTO РЕШЕТКА ЗА ЛАПТОП 100% МАЩАБ ─── */}
        {(showLogistics || showCourt) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* LEFT COLUMN (7 cols on laptop): Logistics + Mode & Voice Modifiers */}
            {showLogistics && (
              <div
                className={cn(
                  "flex flex-col gap-4",
                  showCourt ? "lg:col-span-7" : "lg:col-span-12"
                )}
              >
                {/* BENTO CARD: Логистика на корта (card-logistics) */}
                <Card
                  id="card-logistics"
                  className={cn(
                    "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
                    highlightedCard === "logistics" &&
                      "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                      <RotateCcw
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />{" "}
                      Логистика на корта
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {settings.courtsAvailable}{" "}
                        {settings.courtsAvailable === 1 ? "корт" : "корта"} • до{" "}
                        {courtLogistics.totalCapacity} играчи
                      </span>
                      {renderCardLinkButton("logistics", "Логистика на корта")}
                    </div>
                  </div>
                  <CardContent className="space-y-3.5 p-4">
                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
                      {/* 1. Брой свободни кортове (7 cols) */}
                      <div className="space-y-1.5 md:col-span-7">
                        <span
                          id="label-courts-available"
                          className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                        >
                          Налични кортове в залата
                        </span>
                        <div
                          role="group"
                          aria-labelledby="label-courts-available"
                          className="grid grid-cols-6 gap-1.5"
                        >
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() =>
                                setSettings((prev) => ({
                                  ...prev,
                                  courtsAvailable: num,
                                }))
                              }
                              className={`flex h-9 items-center justify-center rounded-xl border text-xs font-black transition-all ${
                                settings.courtsAvailable === num
                                  ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Капацитет на корт (5 cols) */}
                      <div className="space-y-1.5 md:col-span-5">
                        <span
                          id="label-court-capacity"
                          className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                        >
                          Капацитет на корт
                        </span>
                        <div
                          role="group"
                          aria-labelledby="label-court-capacity"
                          className="grid grid-cols-2 gap-1.5"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                courtAllocationStrategy: "two_per_court",
                              }))
                            }
                            className={`flex h-9 flex-col items-center justify-center rounded-xl border px-2 text-center transition-all ${
                              (settings.courtAllocationStrategy ||
                                "two_per_court") === "two_per_court"
                                ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            <span className="text-[11px] font-bold leading-none">
                              2 деца на корт
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                courtAllocationStrategy: "one_per_court",
                              }))
                            }
                            className={`flex h-9 flex-col items-center justify-center rounded-xl border px-2 text-center transition-all ${
                              settings.courtAllocationStrategy ===
                              "one_per_court"
                                ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            <span className="text-[11px] font-bold leading-none">
                              1 дете на корт
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Жив капацитет статус + Команда Център */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          <span className="text-zinc-500">Капацитет:</span>{" "}
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            до {courtLogistics.totalCapacity} едновременно
                          </strong>
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">
                          •
                        </span>
                        <span>
                          <span className="text-zinc-500">Избрани:</span>{" "}
                          <strong className="text-blue-600 dark:text-blue-400">
                            {settings.activePlayers.length} състезатели
                          </strong>
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        🎯 Команда „Център!“ активна
                      </span>
                    </div>

                    {settings.activePlayers.length >
                      courtLogistics.totalCapacity && (
                      <div className="rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-200">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>⚡</span>
                          <span>
                            Всяка серия се провежда на{" "}
                            {
                              splitPlayersIntoWaves(
                                settings.activePlayers,
                                courtLogistics.totalCapacity
                              ).length
                            }{" "}
                            части (вълни) за равно натоварване на всички{" "}
                            {settings.activePlayers.length} деца.
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* BENTO CARD: Режим на игра, Гласови команди & Модификатори (card-mode) */}
                <Card
                  id="card-mode"
                  className={cn(
                    "flex-1 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
                    highlightedCard === "mode" &&
                      "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                      <Zap
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />{" "}
                      Режим на игра & Гласов Асистент
                    </h2>
                    {renderCardLinkButton(
                      "mode",
                      "Режим на игра & Гласов Асистент"
                    )}
                  </div>
                  <CardContent className="space-y-3.5 p-4">
                    {/* 2 Режима хоризонтално */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {[
                        {
                          id: "standard",
                          title: "Стандартен тренировъчен",
                          desc: "Серии, работа и почивка с интервали",
                          badge: "Интервали",
                        },
                        {
                          id: "agility_test",
                          title: "Тест за бързина (Agility Test)",
                          desc: "Спринт норматив за брой движения",
                          badge: "Хронометър",
                        },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            shadowLogger.setup(
                              `Training mode selected: ${m.title}`,
                              { mode: m.id }
                            );
                            if (m.id === "agility_test") {
                              setSettings((prev) => ({
                                ...prev,
                                mode: "agility_test",
                                sets: 1,
                                workSec:
                                  prev.workSec >= 30 || prev.workSec < 5
                                    ? 20
                                    : prev.workSec,
                                restSec: 0,
                                paceSec:
                                  prev.paceSec > 2.5 ? 1.5 : prev.paceSec,
                              }));
                            } else {
                              setSettings((prev) => {
                                const presetPace: Record<string, number> = {
                                  "U9-U11": 4.0,
                                  "U11-U13": 3.0,
                                  "U13-U15": 2.5,
                                  "U15-U17": 2.0,
                                  "U17+": 1.8,
                                };
                                return {
                                  ...prev,
                                  mode: "standard",
                                  sets: prev.sets === 1 ? 3 : prev.sets,
                                  workSec:
                                    prev.workSec === 20 ? 45 : prev.workSec,
                                  restSec:
                                    prev.restSec === 0 ? 30 : prev.restSec,
                                  paceSec:
                                    prev.paceSec === 1.5
                                      ? presetPace[prev.ageGroup] || 2.5
                                      : prev.paceSec,
                                };
                              });
                            }
                          }}
                          className={`flex cursor-pointer flex-col justify-between gap-1 rounded-xl border p-3 text-left transition-all ${
                            settings.mode === m.id
                              ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                              : "border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold leading-tight">
                              {m.title}
                            </span>
                            <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {m.badge}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            {m.desc}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 3 Типа гласови команди хоризонтално */}
                    <div className="space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <span
                        id="label-callout-mode"
                        className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                      >
                        <Mic size={12} /> Тип на гласовите команди
                      </span>
                      <div
                        role="group"
                        aria-labelledby="label-callout-mode"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        {[
                          {
                            id: "zones",
                            label: "Само зони",
                            icon: "🎯",
                            desc: "„Форхенд мрежа“",
                          },
                          {
                            id: "shots",
                            label: "Само удари",
                            icon: "🏸",
                            desc: "„Клиър права“",
                          },
                          {
                            id: "zones_and_shots",
                            label: "Зони + Удари",
                            icon: "📢",
                            desc: "Зона + удар",
                          },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              shadowLogger.setup(
                                `Callout mode changed to: ${c.label} (${c.id})`,
                                { calloutMode: c.id }
                              );
                              setSettings((prev) => ({
                                ...prev,
                                calloutMode:
                                  c.id as ShadowSettings["calloutMode"],
                              }));
                            }}
                            className={`flex flex-col gap-0.5 rounded-xl border p-2.5 text-left transition-all ${
                              settings.calloutMode === c.id
                                ? "border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40"
                                : "border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                            }`}
                          >
                            <span
                              className={`flex items-center gap-1.5 text-xs font-bold leading-tight ${
                                settings.calloutMode === c.id
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              <span>{c.icon}</span>
                              {c.label}
                            </span>
                            <span className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                              {c.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Треньорски модификатори & Звук (URL-синхронизиран ?modifiers=open|closed) */}
                    <div className="space-y-2.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleToggleModifiers}
                          className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-700 uppercase hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
                        >
                          <Sliders size={14} className="text-blue-600" />
                          <span>Треньорски модификатори & Звук</span>
                          {isModifiersOpen ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSoundCheck}
                          className="h-8 rounded-xl border-blue-300 bg-blue-50/70 px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60"
                        >
                          <Volume2 size={14} className="mr-1.5" />
                          Тест на звука
                        </Button>
                      </div>

                      {isModifiersOpen && (
                        <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold transition-colors hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950">
                              <Checkbox
                                checked={Boolean(settings.deceptionEnabled)}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    deceptionEnabled: Boolean(checked),
                                  }))
                                }
                              />
                              <span className="leading-tight">
                                Децепция (фалшиво движение)
                              </span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold transition-colors hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950">
                              <Checkbox
                                checked={Boolean(settings.motivationEnabled)}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    motivationEnabled: Boolean(checked),
                                  }))
                                }
                              />
                              <span className="leading-tight">
                                Мотивационни команди
                              </span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold transition-colors hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950">
                              <Checkbox
                                checked={Boolean(settings.visualOnly)}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    visualOnly: Boolean(checked),
                                  }))
                                }
                              />
                              <span className="leading-tight">
                                Визуален режим (без звук)
                              </span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold transition-colors hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950">
                              <Checkbox
                                checked={Boolean(settings.leftHanded)}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    leftHanded: Boolean(checked),
                                  }))
                                }
                              />
                              <span className="leading-tight">
                                Режим за левичар (огледален Overhead)
                              </span>
                            </label>
                          </div>

                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                              Скорост на гласа:
                            </span>
                            <div className="grid grid-cols-4 gap-1.5 sm:w-64">
                              {[0.9, 1.0, 1.15, 1.3].map((spd) => {
                                const activeSpd = settings.voiceSpeed ?? 1.0;
                                const isSelected =
                                  Math.abs(activeSpd - spd) < 0.01;
                                return (
                                  <button
                                    key={spd}
                                    type="button"
                                    onClick={() =>
                                      setSettings((prev) => ({
                                        ...prev,
                                        voiceSpeed: spd,
                                      }))
                                    }
                                    className={`rounded-lg border py-1 text-xs font-bold transition-all ${
                                      isSelected
                                        ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                                    }`}
                                  >
                                    {spd}x
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* RIGHT COLUMN (5 cols on laptop): Конфигурация на корта & Жив преглед (card-court) */}
            {showCourt && (
              <div
                className={cn(
                  "flex flex-col",
                  showLogistics ? "lg:col-span-5" : "lg:col-span-12"
                )}
              >
                <Card
                  id="card-court"
                  className={cn(
                    "flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
                    highlightedCard === "court" &&
                      "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                      <Target
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />{" "}
                      Конфигурация на корта
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {physicalCornersCount}{" "}
                        {physicalCornersCount === 1 ? "ъгъл" : "ъгъла"} + Център
                      </span>
                      {renderCardLinkButton("court", "Конфигурация на корта")}
                    </div>
                  </div>
                  <CardContent className="flex flex-1 flex-col space-y-3.5 p-4">
                    {/* Corners Mode + Drill Mode */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <span
                          id="label-corners-mode"
                          className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                        >
                          Ъгли на корта
                        </span>
                        <div
                          role="group"
                          aria-labelledby="label-corners-mode"
                          className="flex w-full gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900"
                        >
                          {[
                            { id: "2-corners", label: "2 Ъгъла" },
                            { id: "4-corners", label: "4 Ъгъла" },
                            { id: "6-corners", label: "6 Ъгъла" },
                          ].map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                setSettings((prev) => ({
                                  ...prev,
                                  cornersMode:
                                    c.id as ShadowSettings["cornersMode"],
                                  drillMode:
                                    c.id === "2-corners"
                                      ? prev.drillMode === "all" ||
                                        prev.drillMode === "front_back"
                                        ? "front_only"
                                        : prev.drillMode
                                      : "all",
                                }))
                              }
                              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                                settings.cornersMode === c.id
                                  ? "bg-white text-blue-600 shadow-2xs dark:bg-zinc-800 dark:text-white"
                                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span
                          id="label-drill-mode"
                          className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                        >
                          Насоченост на зоните
                        </span>
                        <div
                          role="group"
                          aria-labelledby="label-drill-mode"
                          className="flex flex-wrap gap-1.5"
                        >
                          {(() => {
                            if (settings.cornersMode === "2-corners") {
                              return [
                                { id: "front_only", title: "Мрежа" },
                                { id: "back_only", title: "Задна" },
                                { id: "forehand_only", title: "Форхенд" },
                                { id: "backhand_only", title: "Бекхенд" },
                              ];
                            }
                            if (settings.cornersMode === "4-corners") {
                              return [
                                { id: "all", title: "Цял корт (4 ъгъла)" },
                              ];
                            }
                            return [{ id: "all", title: "Цял корт (6 ъгъла)" }];
                          })().map((z) => (
                            <button
                              key={z.id}
                              type="button"
                              onClick={() =>
                                setSettings((prev) => ({
                                  ...prev,
                                  drillMode:
                                    z.id as ShadowSettings["drillMode"],
                                }))
                              }
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                                settings.drillMode === z.id
                                  ? "border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                  : "border-zinc-200 bg-transparent text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              {z.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Шаблон на движение в компактна 2-колонна решетка */}
                    <div className="space-y-1.5 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                      <span
                        id="label-drill-pattern"
                        className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                      >
                        <Star size={12} /> Шаблон на движение
                      </span>
                      <div
                        role="group"
                        aria-labelledby="label-drill-pattern"
                        className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
                      >
                        {[
                          {
                            id: "random",
                            label: "Случаен",
                            icon: "🎲",
                            desc: "Всички активни зони",
                          },
                          {
                            id: "fixed-triangle",
                            label: "Триъгълник",
                            icon: "🔺",
                            desc: "Мрежа ↔ среда ↔ задна",
                          },
                          {
                            id: "fixed-net-back",
                            label: "Мрежа ↔ Задна",
                            icon: "↕️",
                            desc: "Предна и задна линия",
                          },
                          {
                            id: "forehand-only",
                            label: "Само форхенд поле",
                            icon: "🏸",
                            desc: "Само дясна/форхенд страна",
                          },
                          {
                            id: "backhand-only",
                            label: "Само бекхенд поле",
                            icon: "🛡️",
                            desc: "Само лява/бекхенд страна",
                          },
                        ].map((p, idx) => {
                          const isSelected = settings.drillPattern === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                shadowLogger.setup(
                                  `Drill pattern selected: ${p.label}`,
                                  { pattern: p.id }
                                );
                                setSettings((prev) => ({
                                  ...prev,
                                  drillPattern:
                                    p.id as ShadowSettings["drillPattern"],
                                }));
                              }}
                              className={cn(
                                "flex items-center justify-between rounded-xl border px-2.5 py-2 text-left transition-all",
                                idx === 4 && "sm:col-span-2",
                                isSelected
                                  ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500/25 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-200"
                                  : "border-zinc-200/80 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                              )}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs dark:bg-zinc-800">
                                  {p.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                                    {p.label}
                                  </span>
                                  <span className="block truncate text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                                    {p.desc}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Компактен Жив Преглед на Корта (фиксиран 1/2 корт за пестене на вертикална площ) */}
                    <div className="mt-auto flex flex-col items-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="mb-2 flex w-full items-center justify-between gap-2">
                        <span className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                          Преглед на зоните (1/2 Корт)
                        </span>
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {settings.cornersMode}
                        </span>
                      </div>

                      <div className="flex w-full items-center justify-center">
                        <CourtVisualizer
                          previewZones={previewZones}
                          viewMode="half"
                          leftHanded={settings.leftHanded}
                          allowToggleView={false}
                          className="w-full max-w-52"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ─── 4. ПРИСЪСТВАЩИ СЪСТЕЗАТЕЛИ & РАЗПРЕДЕЛЕНИЕ ПО КОРТОВЕ ─── */}
        {showPlayers && (
          <>
            {/* BENTO CARD: Присъстващи състезатели (card-players) */}
            <Card
              id="card-players"
              className={cn(
                "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
                highlightedCard === "players" &&
                  "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
              )}
            >
              <div className="flex flex-col gap-2.5 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                    <Users
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />{" "}
                    Присъстващи състезатели
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Маркирайте състезателите в залата за автоматично
                    разпределение по кортове.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-xl bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {settings.activePlayers.length} избрани
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMemberOpenChange(true)}
                    className="h-8 rounded-xl border-dashed border-blue-400 bg-blue-50/50 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    <UserPlus size={13} className="mr-1" />
                    Добави състезател / външен
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectCurrentCategory}
                    className="h-8 rounded-xl bg-blue-50/60 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                    title={`Маркирай всички състезатели за категория ${settings.ageGroup}`}
                  >
                    Маркирай {settings.ageGroup}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFiltered}
                    className="h-8 rounded-xl text-xs"
                  >
                    Маркирай показаните ({filteredPlayers.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRosterExpanded((prev) => !prev)}
                    className="h-8 rounded-xl text-xs"
                  >
                    {isRosterExpanded
                      ? "Скрий каталога"
                      : `Покажи каталога (${membersList.length})`}
                    {isRosterExpanded ? (
                      <ChevronUp size={13} className="ml-1" />
                    ) : (
                      <ChevronDown size={13} className="ml-1" />
                    )}
                  </Button>
                  {settings.activePlayers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelected}
                      className="h-8 rounded-xl text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Изчисти всички
                    </Button>
                  )}
                  {renderCardLinkButton("players", "Присъстващи състезатели")}
                </div>
              </div>

              <CardContent className="space-y-3.5 p-4">
                {/* Хоризонтални чипове за избраните играчи с бързо премахване */}
                {settings.activePlayers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-blue-200/70 bg-blue-50/60 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/20">
                    <span className="text-[11px] font-black tracking-wider uppercase text-blue-800 dark:text-blue-300">
                      Избрани ({settings.activePlayers.length}):
                    </span>
                    {settings.activePlayers.map((player) => (
                      <span
                        key={player.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/90 bg-white px-2 py-0.5 text-xs font-medium text-zinc-900 shadow-2xs dark:border-blue-800/60 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        <span className="max-w-[130px] truncate">
                          {player.displayName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSinglePlayer(player.id)}
                          className="rounded-full p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                          title={`Премахни ${player.displayName}`}
                          aria-label={`Премахни ${player.displayName}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Сгъваем каталог със състезатели */}
                {isRosterExpanded ? (
                  <>
                    {/* Search & Category Tabs */}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative w-full sm:max-w-xs">
                        <Label
                          htmlFor="shadow-player-search"
                          className="sr-only"
                        >
                          Търсене на играч по име
                        </Label>
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="shadow-player-search"
                          aria-label="Търсене на играч по име"
                          value={playerSearchQuery}
                          onChange={(e) => setPlayerSearchQuery(e.target.value)}
                          placeholder="Търсене на играч по име..."
                          className="h-9 rounded-xl pl-9 text-xs"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {[
                          { id: "all", label: "Всички" },
                          { id: "u11", label: "9-11 г." },
                          { id: "u13", label: "11-13 г." },
                          { id: "u15", label: "13-15 г." },
                          { id: "u17", label: "15-17 г." },
                          { id: "adults", label: "17+ / Мъже / Жени" },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                              setPlayerFilterCategory(
                                cat.id as
                                  | "all"
                                  | "u11"
                                  | "u13"
                                  | "u15"
                                  | "u17"
                                  | "adults"
                              )
                            }
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                              playerFilterCategory === cat.id
                                ? "bg-zinc-900 text-white shadow-2xs dark:bg-white dark:text-zinc-900"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Players Grid */}
                    {filteredPlayers.length === 0 ? (
                      <p className="p-6 text-center text-xs text-zinc-500">
                        Няма намерени играчи за избрания критерий.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {filteredPlayers.map((m) => {
                            const isChecked = settings.activePlayers.some(
                              (p) => p.id === m.id
                            );
                            return (
                              <label
                                key={m.id}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                                  isChecked
                                    ? "border-blue-600 bg-blue-50/70 shadow-2xs dark:border-blue-500 dark:bg-blue-950/40"
                                    : "border-zinc-200/80 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                                }`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const pName =
                                      m.displayName ||
                                      `${m.firstName || ""} ${m.lastName || ""}`.trim();
                                    if (!checked) {
                                      shadowLogger.setup(
                                        `Player removed from drill: ${pName}`
                                      );
                                      setSettings((prev) => ({
                                        ...prev,
                                        activePlayers:
                                          prev.activePlayers.filter(
                                            (p) => p.id !== m.id
                                          ),
                                      }));
                                    } else {
                                      shadowLogger.setup(
                                        `Player added to drill: ${pName}`
                                      );
                                      setSettings((prev) => ({
                                        ...prev,
                                        activePlayers: [
                                          ...prev.activePlayers,
                                          {
                                            id: m.id,
                                            displayName: pName,
                                            ageGroup:
                                              m.ageGroup ||
                                              resolveMemberAgeGroup(m),
                                          },
                                        ],
                                      }));
                                    }
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`block truncate text-xs font-bold leading-snug ${
                                      isChecked
                                        ? "text-blue-700 dark:text-blue-300"
                                        : "text-zinc-800 dark:text-zinc-200"
                                    }`}
                                  >
                                    {m.displayName ||
                                      `${m.firstName} ${m.lastName}`}
                                  </span>
                                  {(() => {
                                    const ag =
                                      m.ageGroup || resolveMemberAgeGroup(m);
                                    if (!ag) return null;
                                    return (
                                      <span className="mt-0.5 inline-block rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                        {ag}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  settings.activePlayers.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">
                        Каталогът със състезатели е свит.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRosterExpanded(true)}
                        className="h-8 rounded-xl text-xs"
                      >
                        Покажи картотеката ({membersList.length})
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* BENTO CARD: Разпределение по кортове в залата (card-allocation) */}
            <Card
              id="card-allocation"
              className={cn(
                "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
                highlightedCard === "allocation" &&
                  "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
              )}
            >
              <div className="flex flex-col gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏸</span>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Разпределение по кортове в залата (
                      {settings.courtsAvailable}{" "}
                      {settings.courtsAvailable === 1 ? "корт" : "корта"})
                    </h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {settings.activePlayers.length === 0
                        ? "Маркирайте състезатели по-горе, за да видите разпределението им по кортовете."
                        : "Кликнете на иконата за увеличение на всеки корт за детайлен модален изглед със собствен URL (?court=1..6)."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {courtLogistics.activePlayers.length} активни на кортовете
                  </span>
                  {courtLogistics.restingPlayers.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {courtLogistics.restingPlayers.length} почиващи
                    </span>
                  )}
                  {settings.activePlayers.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetCourtAllocation}
                      className="h-7 rounded-lg border-zinc-200 bg-white px-2 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      title="Възстанови автоматичното разпределение"
                    >
                      <RefreshCw size={11} className="mr-1" /> Възстанови
                    </Button>
                  )}
                  {renderCardLinkButton(
                    "allocation",
                    "Разпределение по кортове в залата"
                  )}
                </div>
              </div>
              <CardContent className="space-y-4 p-4">
                <MultiCourtGrid
                  slots={courtLogistics.slots}
                  previewZones={previewZones}
                  leftHanded={settings.leftHanded}
                  focusedCourtNumber={focusedCourt}
                  onToggleFocus={handleFocusCourtChange}
                  openFocusInModal
                  editable
                  onSwapPlayers={handleSwapPlayers}
                  onMovePlayerToCourt={handleMovePlayerToCourt}
                  onMovePlayerToBench={handleMovePlayerToBench}
                />

                {/* Почиващи състезатели на пейката (Интерактивна зона за преместване) */}
                {courtLogistics.restingPlayers.length > 0 && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      try {
                        const json = e.dataTransfer.getData("application/json");
                        const parsed = json ? JSON.parse(json) : null;
                        const pId =
                          parsed?.playerId ||
                          e.dataTransfer.getData("text/plain");
                        if (pId) handleMovePlayerToBench(pId);
                      } catch {
                        const plain = e.dataTransfer.getData("text/plain");
                        if (plain) handleMovePlayerToBench(plain);
                      }
                    }}
                    className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3 transition-colors hover:border-amber-500/50"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <span>
                          ⏸️ Чакащи състезатели на пейката (влизат във 2-ра част
                          на серията):
                        </span>
                      </span>
                      <span className="text-[10px] font-normal text-amber-600/80 dark:text-amber-400/80">
                        (Плъзнете играч тук за почивка или към корт за размяна)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {courtLogistics.restingPlayers.map((p) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({ playerId: p.id })
                            );
                            e.dataTransfer.setData("text/plain", p.id);
                          }}
                          className="group/resting flex cursor-grab items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 py-1 pr-1.5 pl-2 text-xs font-semibold text-amber-800 shadow-2xs transition-all hover:border-amber-500/60 hover:bg-amber-500/15 active:cursor-grabbing dark:text-amber-200"
                        >
                          <GripVertical
                            size={12}
                            className="text-amber-600/70 transition-colors group-hover/resting:text-amber-400"
                          />
                          <span className="truncate max-w-32">
                            {p.displayName}
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex size-5 items-center justify-center rounded-md text-amber-700/80 hover:bg-amber-500/20 hover:text-amber-900 dark:text-amber-300 dark:hover:text-white"
                                title="Премести на корт"
                                aria-label="Премести на корт"
                              >
                                <ArrowRightLeft size={11} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 border-zinc-800 bg-zinc-950 text-xs text-zinc-200"
                            >
                              <DropdownMenuLabel className="text-[11px] text-zinc-400">
                                Изпрати на корт:
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-zinc-800" />
                              {courtLogistics.slots.map((s) => (
                                <React.Fragment key={s.courtNumber}>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMovePlayerToCourt(
                                        p.id,
                                        s.courtNumber,
                                        "A"
                                      )
                                    }
                                    className="cursor-pointer gap-2 hover:bg-zinc-800 hover:text-white"
                                  >
                                    <ArrowRightLeft
                                      size={12}
                                      className="text-emerald-400"
                                    />
                                    <span>Корт {s.courtNumber} (Поле 1)</span>
                                  </DropdownMenuItem>
                                  {s.isFullCourt && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleMovePlayerToCourt(
                                          p.id,
                                          s.courtNumber,
                                          "B"
                                        )
                                      }
                                      className="cursor-pointer gap-2 hover:bg-zinc-800 hover:text-white"
                                    >
                                      <ArrowRightLeft
                                        size={12}
                                        className="text-blue-400"
                                      />
                                      <span>Корт {s.courtNumber} (Поле 2)</span>
                                    </DropdownMenuItem>
                                  )}
                                </React.Fragment>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── СТАРТ БУТОН ─── */}
        <div className="mt-auto flex w-full shrink-0 justify-center pt-2">
          <Button
            onClick={handleStart}
            className="group relative flex h-auto min-h-13 w-full max-w-xl cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-3 text-center text-sm font-black tracking-wider whitespace-normal text-white uppercase shadow-xl shadow-blue-500/25 transition-all hover:scale-1.01 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-0.99 sm:min-h-14 sm:gap-3 sm:text-base"
          >
            <Play className="size-5 shrink-0 fill-current transition-transform group-hover:scale-110" />
            <span className="leading-tight text-balance">
              ГОТОВНОСТ ЗА СТАРТ НА ТРЕНИРОВКАТА
            </span>
          </Button>
        </div>

        {/* Quick Add Member Dialog (URL-Synced with ?modal=add-member) */}
        <QuickAddMemberDialog
          open={isAddMemberOpen}
          onOpenChange={handleAddMemberOpenChange}
          onMemberAdded={handleMemberAdded}
        />

        {/* ── МОДАЛ ЗА ЗАПАЗВАНЕ НА НОВ ТРЕНЬОРСКИ ШАБЛОН ── */}
        <Dialog
          open={isSavePresetOpen}
          onOpenChange={handleSavePresetOpenChange}
        >
          <DialogContent className="max-w-md rounded-2xl p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-black">
                <BookmarkPlus className="size-5 text-blue-600" />
                Запазване на треньорски шаблон
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Текущите параметри ({settings.sets} серии, {settings.workSec}s
                работа / {settings.restSec}s почивка, темпо {settings.paceSec}s,{" "}
                {settings.drillMode}) ще се запазят като готов шаблон с директен
                URL линк.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="preset-name" className="text-xs font-bold">
                  Име на шаблона *
                </Label>
                <Input
                  id="preset-name"
                  placeholder="Напр. Специфична за двойки – предна и средна зона"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preset-desc" className="text-xs font-bold">
                  Кратко описание (по избор)
                </Label>
                <Input
                  id="preset-desc"
                  placeholder="Напр. Защита и мрежа с бърз ритъм..."
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSavePresetOpenChange(false)}
                className="text-xs"
              >
                Отказ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveCustomPreset}
                className="bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
              >
                Запази шаблона
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── МОДАЛ: ОФЛАЙН ГОТОВНОСТ & АУДИО КЕШ В ЗАЛАТА ─── */}
        <Dialog
          open={isOfflineModalOpen}
          onOpenChange={handleOfflineModalOpenChange}
        >
          <DialogContent className="max-w-md border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Wifi size={18} />
                </span>
                <div>
                  <DialogTitle className="text-base font-black text-zinc-900 dark:text-white">
                    Офлайн готовност за спортни зали
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                    Гарантирана работа дори при липса на Wi-Fi или слаб мобилен
                    обхват в залата.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Интернет връзка в залата:
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    offlineStatus.isOnline
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {offlineStatus.isOnline ? (
                    <>
                      <Wifi size={13} /> Онлайн (Свързан)
                    </>
                  ) : (
                    <>
                      <WifiOff size={13} /> Офлайн (Без връзка)
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Кеширани MP3 команди:
                </span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {offlineStatus.cachedCount} / {offlineStatus.totalCount} файла
                </span>
              </div>

              {isCachingAudio && (
                <div className="space-y-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    <span>Изтегляне и запис в офлайн кеша...</span>
                    <span>{cachingProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-950">
                    <div
                      className={cn(
                        "h-full bg-blue-600 transition-all duration-300",
                        cachingProgress >= 100
                          ? "w-full"
                          : cachingProgress >= 75
                            ? "w-3/4"
                            : cachingProgress >= 50
                              ? "w-1/2"
                              : cachingProgress >= 25
                                ? "w-1/4"
                                : "w-2"
                      )}
                    />
                  </div>
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Когато всички 32 MP3 команди (зони, удари, почивки, сигнали) са
                кеширани, софтуерът може да се стартира и използва в спортна
                зала без нужда от интернет.
              </p>
            </div>

            <DialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOfflineModalOpenChange(false)}
                className="h-9 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
              >
                Затвори
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isCachingAudio}
                onClick={handlePreloadAllAudio}
                className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700"
              >
                <Zap size={14} className="mr-1.5" />
                {isCachingAudio
                  ? "Кеширане..."
                  : "Кеширай всички 32 звука сега"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
