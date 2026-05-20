"use client";

import { Member } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  Calendar,
  Users,
  Building,
  ArrowLeft,
  Pencil,
  FileText,
  Home,
  PhoneCall,
  BarChart2,
  Printer,
  AlertTriangle,
  CheckCircle,
  UserMinus,
  ScrollText,
  ShieldCheck,
  ClipboardCheck,
  Stethoscope,
  Contact,
  Trash2,
  Camera,
  Loader2,
  Eye,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MemberSalesHistory = dynamic(
  () => import("./member-sales-history").then((mod) => mod.MemberSalesHistory),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Р—Р°СЂРµР¶РґР°РЅРµ РЅР° РёСЃС‚РѕСЂРёСЏ...
      </div>
    ),
  }
);
const MemberAttendanceHistory = dynamic(
  () =>
    import("./MemberAttendanceHistory").then(
      (mod) => mod.MemberAttendanceHistory
    ),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Р—Р°СЂРµР¶РґР°РЅРµ РЅР° РїСЂРёСЃСЉСЃС‚РІРёСЏ...
      </div>
    ),
  }
);
const MemberSubscriptionsTab = dynamic(
  () =>
    import("./member-subscriptions-tab").then(
      (mod) => mod.MemberSubscriptionsTab
    ),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Р—Р°СЂРµР¶РґР°РЅРµ РЅР° С‡Р»РµРЅСЃС‚РІРѕ...
      </div>
    ),
  }
);

import { getAgeGroup, getInitials, formatFullName } from "@/lib/utils";

import { updateMemberAction, deleteMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { uploadFile, deleteFile } from "@/services/storage-service";
import { useRef, useState, useEffect } from "react";

interface MemberDetailsCardProps {
  member: Member;
  familyMembers: Member[];
  family?: import("@/hooks/useMemberProfile").Family | null;
  onRefresh?: () => void;
}

const formatPhoneType = (phoneType: string | null | undefined) => {
  if (!phoneType) return null;
  return phoneType === "personal" ? "Р›РёС‡РµРЅ" : "РќР° СЂРѕРґРёС‚РµР»";
};

const getDocUploadPath = (memberId: string, baseField: string, ext: string) => {
  return `documents/${memberId}/${baseField}_${Date.now()}.${ext}`;
};

const getAvatarUploadPath = (memberId: string) => {
  return `avatars/${memberId}_${Date.now()}`;
};

export const MemberDetailsCard = ({
  member,
  familyMembers,
  family,
  onRefresh,
}: MemberDetailsCardProps) => {
  const router = useRouter();
  const { idToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [localMember, setLocalMember] = useState<Member>(member);

  // Синхронизираме localMember при промяна на props (след refetch)
  useEffect(() => {
    setLocalMember(member);
  }, [member]);

  const handleDocUpload = async (
    baseField:
      | "signedDeclaration"
      | "medicalCertificate"
      | "isLicensed"
      | "travelDeclaration"
      | "safetyInstruction"
      | "internalRules"
      | "membershipApplication"
      | "terminationRequest",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !idToken) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "РќРµРІР°Р»РёРґРµРЅ С„РѕСЂРјР°С‚. РњРѕР»СЏ, РєР°С‡РµС‚Рµ JPG, PNG, WEBP РёР»Рё PDF"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Р¤Р°Р№Р»СЉС‚ Рµ С‚РІСЉСЂРґРµ РіРѕР»СЏРј (РјР°РєСЃ. 5MB)");
      return;
    }

    setUploadingDoc(baseField);
    try {
      const ext = file.name.split(".").pop() || "";
      const path = getDocUploadPath(member.id, baseField, ext);
      const downloadUrl = await uploadFile(path, file, idToken);
      const urlField = `${baseField}Url`;

      const result = await updateMemberAction(member.id, idToken, {
        [urlField]: downloadUrl,
      });

      if (result.success) {
        toast.success(
          "Р”РѕРєСѓРјРµРЅС‚СЉС‚ Рµ РїСЂРёРєР°С‡РµРЅ СѓСЃРїРµС€РЅРѕ!"
        );
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        toast.error(
          "Р“СЂРµС€РєР° РїСЂРё Р·Р°РїРёСЃ РЅР° Р»РёРЅРєР° РєСЉРј РґРѕРєСѓРјРµРЅС‚Р°"
        );
      }
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error("Р“СЂРµС€РєР° РїСЂРё РєР°С‡РІР°РЅРµ РЅР° РґРѕРєСѓРјРµРЅС‚Р°");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocDelete = async (
    baseField:
      | "signedDeclaration"
      | "medicalCertificate"
      | "isLicensed"
      | "travelDeclaration"
      | "safetyInstruction"
      | "internalRules"
      | "membershipApplication"
      | "terminationRequest"
  ) => {
    if (!idToken) return;

    const urlField = `${baseField}Url`;
    const docUrl = member[urlField as keyof Member] as string;
    if (!docUrl) return;

    if (
      !confirm(
        "РЎРёРіСѓСЂРЅРё Р»Рё СЃС‚Рµ, С‡Рµ РёСЃРєР°С‚Рµ РґР° РёР·С‚СЂРёРµС‚Рµ СЃРєР°РЅРёСЂР°РЅРёСЏ С„Р°Р№Р» Р·Р° С‚РѕР·Рё РґРѕРєСѓРјРµРЅС‚?"
      )
    )
      return;

    setUploadingDoc(baseField);
    try {
      const decodedPath = decodeURIComponent(
        docUrl.split("/o/")[1]?.split("?")[0]
      );
      if (decodedPath) {
        await deleteFile(decodedPath, idToken);
      }
    } catch (err) {
      console.warn("Storage deletion warning:", err);
    }

    try {
      const result = await updateMemberAction(member.id, idToken, {
        [urlField]: null,
      });

      if (result.success) {
        toast.success(
          "Р”РѕРєСѓРјРµРЅС‚СЉС‚ Рµ РїСЂРµРјР°С…РЅР°С‚ СѓСЃРїРµС€РЅРѕ!"
        );
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        toast.error(
          "Р“СЂРµС€РєР° РїСЂРё РїСЂРµРјР°С…РІР°РЅРµ РЅР° РґРѕРєСѓРјРµРЅС‚Р° РѕС‚ РїСЂРѕС„РёР»Р°"
        );
      }
    } catch (error) {
      console.error("Document delete error:", error);
      toast.error("Р“СЂРµС€РєР° РїСЂРё РїСЂРµРјР°С…РІР°РЅРµ");
    } finally {
      setUploadingDoc(null);
    }
  };

  const renderDocAttachmentSection = (
    baseField:
      | "signedDeclaration"
      | "medicalCertificate"
      | "isLicensed"
      | "travelDeclaration"
      | "safetyInstruction"
      | "internalRules"
      | "membershipApplication"
      | "terminationRequest",
    hasDoc?: boolean,
    docUrl?: string | null
  ) => {
    if (!hasDoc) return null;

    if (docUrl) {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:h-11 px-3.5 rounded-lg sm:rounded-xl border-zinc-200 bg-white font-medium text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm"
            onClick={() => window.open(docUrl, "_blank")}
            title="РџСЂРµРіР»РµРґ РЅР° РєР°С‡РµРЅРёСЏ С„Р°Р№Р»"
          >
            <Eye className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
            <span className="ml-2 hidden sm:inline text-xs font-normal">
              РџСЂРµРіР»РµРґ
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:h-11 px-3 rounded-lg sm:rounded-xl border-rose-100 bg-rose-50/10 font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all"
            onClick={() => handleDocDelete(baseField)}
            disabled={uploadingDoc === baseField}
            title="РџСЂРµРјР°С…РІР°РЅРµ РЅР° С„Р°Р№Р»"
          >
            {uploadingDoc === baseField ? (
              <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
            ) : (
              <Trash2 className="h-4 w-4 text-rose-500" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="relative shrink-0">
        <input
          type="file"
          id={`file-${baseField}`}
          className="hidden"
          accept="image/*,application/pdf"
          onChange={(e) => handleDocUpload(baseField, e)}
          disabled={uploadingDoc === baseField}
        />
        <label
          htmlFor={`file-${baseField}`}
          className={cn(
            "flex items-center justify-center h-10 sm:h-11 px-4 rounded-lg sm:rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer font-medium text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-600 transition-all shadow-sm hover:shadow-md",
            uploadingDoc === baseField && "opacity-50 pointer-events-none"
          )}
        >
          {uploadingDoc === baseField ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-zinc-500" />
          ) : (
            <Upload className="h-4 w-4 mr-2 text-zinc-500" strokeWidth={1.5} />
          )}
          РџСЂРёРєР°С‡Рё С„Р°Р№Р»
        </label>
      </div>
    );
  };

  const fullName = formatFullName(member);
  const ageGroup = member.dateOfBirth ? getAgeGroup(member.dateOfBirth) : null;
  const formattedBirthDate = member.dateOfBirth
    ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
    : null;
  const formattedRegistrationDate = member.registrationDate
    ? new Date(member.registrationDate).toLocaleDateString("bg-BG")
    : null;

  // 1. РР·С‡РёСЃР»СЏРІР°РјРµ СЃС‚Р°С‚СѓСЃР° (С‡СЂРµР· localMember Р·Р° Optimistic UI)
  const lastPayment = localMember.lastPaymentDate
    ? new Date(localMember.lastPaymentDate)
    : null;
  const isOverdue =
    !lastPayment ||
    Math.floor(
      (new Date().getTime() - lastPayment.getTime()) / (1000 * 3600 * 24)
    ) > 30;

  // 2. Р¤СѓРЅРєС†РёСЏС‚Р° Р·Р° РїР»Р°С‰Р°РЅРµ (СЃ Optimistic UI)
  const handlePayment = async () => {
    if (!idToken) {
      toast.error("Р“СЂРµС€РєР° РїСЂРё РѕС‚РѕСЂРёР·Р°С†РёСЏ");
      return;
    }

    if (
      !confirm(
        "РњР°СЂРєРёСЂР°РЅРµ РЅР° РјРµСЃРµС‡РЅР°С‚Р° С‚Р°РєСЃР° РєР°С‚Рѕ РїР»Р°С‚РµРЅР°?"
      )
    )
      return;

    const now = new Date().toISOString();
    const prev = localMember;
    // РњРёРіРЅРѕРІРµРЅР° РїСЂРѕРјСЏРЅР° РЅР° РµРєСЂР°РЅР°
    setLocalMember((m) => ({ ...m, lastPaymentDate: now }));

    try {
      const result = await updateMemberAction(member.id, idToken, {
        lastPaymentDate: now,
      });

      if (result.success) {
        toast.success("РЈСЃРїРµС€РЅРѕ РїР»Р°С‚РµРЅРѕ!");
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        setLocalMember(prev); // rollback
        toast.error("Р“СЂРµС€РєР°", { description: result.message });
      }
    } catch (error) {
      setLocalMember(prev); // rollback
      console.error("Payment error:", error);
      toast.error("Р“СЂРµС€РєР° РїСЂРё РїР»Р°С‰Р°РЅРµ");
    }
  };

  const handleDelete = async () => {
    if (!idToken) {
      toast.error("Р“СЂРµС€РєР° РїСЂРё РѕС‚РѕСЂРёР·Р°С†РёСЏ");
      return;
    }

    if (
      !confirm(
        `РЎРёРіСѓСЂРЅРё Р»Рё СЃС‚Рµ, С‡Рµ РёСЃРєР°С‚Рµ РґР° РёР·С‚СЂРёРµС‚Рµ ${fullName}? Р’СЃРёС‡РєРё РЅРµРіРѕРІРё РґР°РЅРЅРё, РІРєР»СЋС‡РёС‚РµР»РЅРѕ РёСЃС‚РѕСЂРёСЏ РЅР° РїР»Р°С‰Р°РЅРёСЏ Рё РїСЂРёСЃСЉСЃС‚РІРёСЏ, С‰Рµ Р±СЉРґР°С‚ РёР·С‚СЂРёС‚Рё Р·Р°РІРёРЅР°РіРё.`
      )
    )
      return;

    try {
      const result = await deleteMemberAction(member.id, idToken);
      if (result.success) {
        toast.success("Р§Р»РµРЅСЉС‚ Рµ РёР·С‚СЂРёС‚ СѓСЃРїРµС€РЅРѕ");
        router.push("/members");
        setTimeout(() => router.refresh(), 100);
      } else {
        toast.error("Р“СЂРµС€РєР°", { description: result.message });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Р’СЉР·РЅРёРєРЅР° СЃСЉСЂРІСЉСЂРЅР° РіСЂРµС€РєР°");
    }
  };

  const formatDocDate = (isoString: string | null | undefined) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const updateDocumentStatus = async (
    baseField:
      | "signedDeclaration"
      | "medicalCertificate"
      | "isLicensed"
      | "travelDeclaration"
      | "safetyInstruction"
      | "internalRules"
      | "membershipApplication"
      | "terminationRequest",
    action: "print" | "submit" | "cancel"
  ) => {
    if (!idToken) return;

    const updates: Record<string, string | boolean | null> = {};
    const now = new Date().toISOString();

    // Map base names to actual fields
    const boolField =
      baseField === "isLicensed"
        ? "isLicensed"
        : `has${baseField.charAt(0).toUpperCase()}${baseField.slice(1)}`;
    const printedField = `${baseField}PrintedAt`;
    const handedField = `${baseField}HandedAt`;

    if (action === "print") {
      updates[printedField] = now;
    } else if (action === "submit") {
      updates[boolField] = true;
      updates[handedField] = now;
    } else if (action === "cancel") {
      updates[boolField] = false;
      updates[handedField] = null;
    }

    // Optimistic UI вЂ” РјРёРіРЅРѕРІРµРЅР° РїСЂРѕРјСЏРЅР° РїСЂРµРґРё СЃСЉСЂРІСЉСЂР°
    const prev = localMember;
    setLocalMember((m) => ({ ...m, ...updates }));

    try {
      const result = await updateMemberAction(member.id, idToken, updates);
      if (result.success) {
        if (action !== "print") {
          toast.success("РЎС‚Р°С‚СѓСЃСЉС‚ Рµ РѕР±РЅРѕРІРµРЅ СѓСЃРїРµС€РЅРѕ!");
        }
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        setLocalMember(prev); // rollback
        toast.error("Р’СЉР·РЅРёРєРЅР° РіСЂРµС€РєР°", {
          description: result.message,
        });
      }
    } catch (error) {
      setLocalMember(prev); // rollback
      console.error("Error updating document status:", error);
      toast.error("Р“СЂРµС€РєР° РїСЂРё РѕР±РЅРѕРІСЏРІР°РЅРµ");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !idToken) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(
        "РњРѕР»СЏ, РёР·Р±РµСЂРµС‚Рµ РІР°Р»РёРґРЅРѕ РёР·РѕР±СЂР°Р¶РµРЅРёРµ"
      );
      return;
    }

    // Validate size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        "РР·РѕР±СЂР°Р¶РµРЅРёРµС‚Рѕ Рµ С‚РІСЉСЂРґРµ РіРѕР»СЏРјРѕ (РјР°РєСЃ. 2MB)"
      );
      return;
    }

    setIsUploading(true);
    try {
      const path = getAvatarUploadPath(member.id);
      const downloadUrl = await uploadFile(path, file, idToken);

      const result = await updateMemberAction(member.id, idToken, {
        avatarUrl: downloadUrl,
      });

      if (result.success) {
        toast.success("РЎРЅРёРјРєР°С‚Р° Рµ РѕР±РЅРѕРІРµРЅР° СѓСЃРїРµС€РЅРѕ");
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        toast.error(
          "Р“СЂРµС€РєР° РїСЂРё РѕР±РЅРѕРІСЏРІР°РЅРµ РЅР° РїСЂРѕС„РёР»Р°"
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Р“СЂРµС€РєР° РїСЂРё РєР°С‡РІР°РЅРµ РЅР° СЃРЅРёРјРєР°С‚Р°");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/members")}
          className="h-10 sm:h-12 w-full sm:w-auto px-6 rounded-xl border-zinc-100 hover:bg-zinc-50 font-medium text-[10px] sm:text-[11px] uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4" strokeWidth={1.5} /> Р’СЃРёС‡РєРё
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => router.push(`/members/${member.id}/edit`)}
            className="h-10 sm:h-12 flex-1 sm:flex-none px-8 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[10px] sm:text-[11px] uppercase tracking-widest shadow-none transition-all"
          >
            <Pencil className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
            Р РµРґР°РєС‚РёСЂР°Р№
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="h-10 sm:h-12 px-4 rounded-xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-none"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-zinc-100 rounded-5xl shadow-none">
        <div className="h-32 sm:h-40 bg-zinc-50 w-full relative">
          <div className="absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent" />
        </div>
        <div className="px-6 sm:px-10 pb-8 sm:pb-10 -mt-12 sm:-mt-16 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
            <div className="relative group">
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 sm:border-8 border-white shadow-2xl rounded-5xl sm:rounded-6xl bg-zinc-50">
                <AvatarImage
                  src={member.avatarUrl ?? undefined}
                  alt={fullName}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-light text-zinc-200">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-2 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm text-white rounded-5xl opacity-0 group-hover:opacity-100 transition-all disabled:opacity-100"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin h-8 w-8" strokeWidth={1.5} />
                ) : (
                  <Camera size={32} strokeWidth={1.5} />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex-1 space-y-3 sm:space-y-4 mb-2 sm:mb-4">
              <h2 className="text-3xl sm:text-5xl font-light text-zinc-950 tracking-tighter">
                {fullName}
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest2",
                    member.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  )}
                >
                  {member.status === "active"
                    ? "РђРєС‚РёРІРµРЅ"
                    : "РќРµР°РєС‚РёРІРµРЅ"}
                </Badge>
                {ageGroup && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest2 border-zinc-100 text-zinc-400"
                  >
                    {ageGroup}
                  </Badge>
                )}
                {family && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest2 bg-zinc-950 text-white border-zinc-950 cursor-pointer hover:bg-zinc-800 transition-colors"
                    onClick={() => router.push(`/families/${family.id}`)}
                  >
                    РЎРµРјРµР№СЃС‚РІРѕ: {family.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mb-2 sm:mb-4 w-full md:w-auto">
              <div className="bg-zinc-50 border border-zinc-100/50 p-4 sm:p-6 rounded-3xl sm:rounded-4xl flex items-center justify-between md:justify-start gap-4 md:gap-6">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400 mb-1">
                    Р¤РёРЅР°РЅСЃРѕРІ СЃС‚Р°С‚СѓСЃ
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isOverdue ? "text-rose-500" : "text-emerald-500"
                      )}
                    >
                      {isOverdue ? "Р”СЉР»Р¶Рё С‚Р°РєСЃР°" : "РџР»Р°С‚РµРЅРѕ"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-200" />
                    <span className="text-[11px] font-light text-zinc-400 uppercase tracking-widest">
                      {lastPayment
                        ? lastPayment.toLocaleDateString("bg-BG")
                        : "РЅСЏРјР° РґР°РЅРЅРё"}
                    </span>
                  </div>
                </div>
                {isOverdue && (
                  <Button
                    size="sm"
                    onClick={handlePayment}
                    className="h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-medium uppercase tracking-widest shadow-none"
                  >
                    РџР»Р°С‚Рё
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <div className="relative group">
          <TabsList className="w-full h-auto bg-zinc-50/50 border border-zinc-100 p-1 rounded-2xl sm:rounded-3xl mb-8 flex flex-nowrap overflow-x-auto no-scrollbar justify-start md:justify-center gap-1 scroll-smooth">
            <TabsTrigger
              value="personal"
              className="flex-none sm:flex-1 min-w-[100px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Р”Р°РЅРЅРё
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex-none sm:flex-1 min-w-[100px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Р”РѕРєСѓРјРµРЅС‚Рё
            </TabsTrigger>

            <TabsTrigger
              value="subscriptions"
              className="flex-none sm:flex-1 min-w-[110px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Р§Р»РµРЅСЃС‚РІРѕ
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="flex-none sm:flex-1 min-w-[110px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              РџСЂРёСЃСЉСЃС‚РІРёСЏ
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal" className="focus-visible:outline-none">
          <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
              <InfoRow icon={Mail} label="РРјРµР№Р»" value={member.email} />
              <InfoRow
                icon={Phone}
                label="РўРµР»РµС„РѕРЅ"
                value={member.phone}
              />
              <InfoRow
                icon={Users}
                label="РЎРµРјРµР№СЃС‚РІРѕ"
                value={family?.name}
                onClick={
                  family
                    ? () => router.push(`/families/${family.id}`)
                    : undefined
                }
              />
              <InfoRow
                icon={PhoneCall}
                label="РўРёРї РЅР° С‚РµР»РµС„РѕРЅР°"
                value={formatPhoneType(member.phoneType)}
              />
              <InfoRow
                icon={Phone}
                label="РЎРїРµС€РµРЅ РєРѕРЅС‚Р°РєС‚"
                value={
                  member.emergencyContactName
                    ? `${member.emergencyContactName} (${member.emergencyContactPhone || "вЂ”"})`
                    : null
                }
              />
              <InfoRow
                icon={Calendar}
                label="Р”Р°С‚Р° РЅР° СЂР°Р¶РґР°РЅРµ"
                value={formattedBirthDate}
              />
              <InfoRow
                icon={BarChart2}
                label="Р’СЉР·СЂР°СЃС‚РѕРІР° РіСЂСѓРїР°"
                value={member.ageGroup || ageGroup}
              />
              <div className="md:col-span-2">
                <div className="h-px bg-zinc-50 my-6" />
              </div>
              <InfoRow
                icon={Calendar}
                label="Р РµРіРёСЃС‚СЂР°С†РёСЏ"
                value={formattedRegistrationDate}
              />
              <InfoRow
                icon={Building}
                label="РЈС‡РёР»РёС‰Рµ"
                value={member.educationInstitution}
              />
              <InfoRow
                icon={Users}
                label="Р•РєРёРїРёСЂРѕРІРєР°"
                value={member.apparelSize}
              />
              <InfoRow icon={Home} label="РђРґСЂРµСЃ" value={member.address} />
              <div className="md:col-span-2">
                <InfoRow
                  icon={FileText}
                  label="Р‘РµР»РµР¶РєРё"
                  value={member.notes}
                  isBlock={true}
                />
              </div>
            </div>

            {familyMembers && familyMembers.length > 0 && (
              <div className="mt-16">
                <h3 className="text-[11px] font-medium uppercase tracking-widest3 text-zinc-400 mb-8 flex items-center gap-3">
                  <Users className="h-4 w-4" strokeWidth={1.5} />
                  Р§Р»РµРЅРѕРІРµ РЅР° СЃРµРјРµР№СЃС‚РІРѕС‚Рѕ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyMembers.map((familyMember) => (
                    <div
                      key={familyMember.id}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-all group"
                      onClick={() => router.push(`/members/${familyMember.id}`)}
                    >
                      <Avatar className="h-12 w-12 rounded-xl ring-1 ring-zinc-100">
                        <AvatarImage
                          src={familyMember.avatarUrl ?? undefined}
                          alt={formatFullName(familyMember)}
                        />
                        <AvatarFallback className="bg-zinc-50 text-zinc-400">
                          {getInitials(formatFullName(familyMember))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {formatFullName(familyMember)}
                        </p>
                        <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest truncate mt-1">
                          {familyMember.status === "active"
                            ? "РђРєС‚РёРІРµРЅ"
                            : "РќРµР°РєС‚РёРІРµРЅ"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="focus-visible:outline-none">
          <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-6">
            {/* Membership Application */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.hasMembershipApplication
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <FileText
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    РњРѕР»Р±Р° Р·Р° С‡Р»РµРЅСЃС‚РІРѕ
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.hasMembershipApplication ? (
                      <span className="text-emerald-600 font-medium">
                        РџСЂРµРґР°РґРµРЅР° РЅР°{" "}
                        {formatDocDate(
                          localMember.membershipApplicationHandedAt
                        )}
                      </span>
                    ) : localMember.membershipApplicationPrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅР° РЅР°{" "}
                        {formatDocDate(
                          localMember.membershipApplicationPrintedAt
                        )}
                      </span>
                    ) : (
                      "РћСЃРЅРѕРІРµРЅ РґРѕРєСѓРјРµРЅС‚ Р·Р° РїСЂРёРµРјР°РЅРµ РІ РєР»СѓР±Р°."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("membershipApplication", "print");
                    window.open(
                      `/members/${member.id}/membership-application`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.hasMembershipApplication &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "membershipApplication",
                      localMember.hasMembershipApplication ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.hasMembershipApplication
                    ? "РћС‚РјРµРЅРё"
                    : "РћС‚Р±РµР»РµР¶Рё РїСЂРµРґР°РґРµРЅР°"}
                </Button>
                {renderDocAttachmentSection(
                  "membershipApplication",
                  localMember.hasMembershipApplication,
                  localMember.membershipApplicationUrl
                )}
              </div>
            </div>

            {/* Membership Termination */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.hasTerminationRequest
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <UserMinus
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    РњРѕР»Р±Р° Р·Р° РїСЂРµРєСЂР°С‚СЏРІР°РЅРµ
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.hasTerminationRequest ? (
                      <span className="text-emerald-600 font-medium">
                        РџСЂРµРґР°РґРµРЅР° РЅР°{" "}
                        {formatDocDate(localMember.terminationRequestHandedAt)}
                      </span>
                    ) : localMember.terminationRequestPrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅР° РЅР°{" "}
                        {formatDocDate(localMember.terminationRequestPrintedAt)}
                      </span>
                    ) : (
                      "Р”РѕРєСѓРјРµРЅС‚ Р·Р° РїСЂРµРєСЂР°С‚СЏРІР°РЅРµ РЅР° С‡Р»РµРЅСЃС‚РІРѕ."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("terminationRequest", "print");
                    window.open(
                      `/members/${member.id}/termination-request`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.hasTerminationRequest &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "terminationRequest",
                      localMember.hasTerminationRequest ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.hasTerminationRequest
                    ? "РћС‚РјРµРЅРё"
                    : "РћС‚Р±РµР»РµР¶Рё РїСЂРµРґР°РґРµРЅР°"}
                </Button>
                {renderDocAttachmentSection(
                  "terminationRequest",
                  localMember.hasTerminationRequest,
                  localMember.terminationRequestUrl
                )}
              </div>
            </div>

            {/* Internal Rules */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.hasInternalRules
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <ScrollText
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Р’СЉС‚СЂРµС€РµРЅ РїСЂР°РІРёР»РЅРёРє
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.hasInternalRules ? (
                      <span className="text-emerald-600 font-medium">
                        РџСЂРёРµС‚ РЅР°{" "}
                        {formatDocDate(localMember.internalRulesHandedAt)}
                      </span>
                    ) : localMember.internalRulesPrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅ РЅР°{" "}
                        {formatDocDate(localMember.internalRulesPrintedAt)}
                      </span>
                    ) : (
                      "РџСЂР°РІРёР»Р° Р·Р° СЂР°Р±РѕС‚Р° Рё РµС‚РёРєР° РІ РєР»СѓР±Р°."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("internalRules", "print");
                    window.open(
                      `/members/${member.id}/internal-rules`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.hasInternalRules &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "internalRules",
                      localMember.hasInternalRules ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.hasInternalRules
                    ? "РћС‚РјРµРЅРё"
                    : "РћС‚Р±РµР»РµР¶Рё РїСЂРёРµС‚"}
                </Button>
                {renderDocAttachmentSection(
                  "internalRules",
                  localMember.hasInternalRules,
                  localMember.internalRulesUrl
                )}
              </div>
            </div>

            {/* Informed Consent Declaration */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.hasSignedDeclaration
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  {localMember.hasSignedDeclaration ? (
                    <CheckCircle
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <AlertTriangle
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Р”РµРєР»Р°СЂР°С†РёСЏ Р·Р° РёРЅС„РѕСЂРјРёСЂР°РЅРѕ
                    СЃСЉРіР»Р°СЃРёРµ
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.hasSignedDeclaration ? (
                      <span className="text-emerald-600 font-medium">
                        РџСЂРµРґР°РґРµРЅР° РЅР°{" "}
                        {formatDocDate(localMember.signedDeclarationHandedAt)}
                      </span>
                    ) : localMember.signedDeclarationPrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅР° РЅР°{" "}
                        {formatDocDate(localMember.signedDeclarationPrintedAt)}
                      </span>
                    ) : (
                      "Р›РёРїСЃРІР° РґРµРєР»Р°СЂР°С†РёСЏ!"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("signedDeclaration", "print");
                    window.open(`/members/${member.id}/declaration`, "_blank");
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.hasSignedDeclaration &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "signedDeclaration",
                      localMember.hasSignedDeclaration ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.hasSignedDeclaration
                    ? "РћС‚РјРµРЅРё"
                    : "РћС‚Р±РµР»РµР¶Рё РїСЂРµРґР°РґРµРЅР°"}
                </Button>
                {renderDocAttachmentSection(
                  "signedDeclaration",
                  localMember.hasSignedDeclaration,
                  localMember.signedDeclarationUrl
                )}
              </div>
            </div>

            {/* Participation & Travel Declaration */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.hasTravelDeclaration
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <ShieldCheck
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    РЎСЉРіР»Р°СЃРёРµ Р·Р° СѓС‡Р°СЃС‚РёРµ Рё РїСЉС‚СѓРІР°РЅРµ
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.hasTravelDeclaration ? (
                      <span className="text-emerald-600 font-medium">
                        РџСЂРµРґР°РґРµРЅРѕ РЅР°{" "}
                        {formatDocDate(localMember.travelDeclarationHandedAt)}
                      </span>
                    ) : localMember.travelDeclarationPrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅРѕ РЅР°{" "}
                        {formatDocDate(localMember.travelDeclarationPrintedAt)}
                      </span>
                    ) : (
                      "РЎСЉРіР»Р°СЃРёРµ Р·Р° С‚СЂР°РЅСЃРїРѕСЂС‚ Рё СЃРїРѕСЂС‚РЅРё СЃСЉР±РёС‚РёСЏ."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("travelDeclaration", "print");
                    window.open(
                      `/members/${member.id}/participation-travel`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.hasTravelDeclaration &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "travelDeclaration",
                      localMember.hasTravelDeclaration ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.hasTravelDeclaration
                    ? "РћС‚РјРµРЅРё"
                    : "РћС‚Р±РµР»РµР¶Рё РїСЂРµРґР°РґРµРЅРѕ"}
                </Button>
                {renderDocAttachmentSection(
                  "travelDeclaration",
                  localMember.hasTravelDeclaration,
                  localMember.travelDeclarationUrl
                )}
              </div>
            </div>

            {/* Safety Instruction */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.hasSafetyInstruction
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <ClipboardCheck
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    РРЅСЃС‚СЂСѓРєС‚Р°Р¶ Р·Р° Р±РµР·РѕРїР°СЃРЅРѕСЃС‚
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.hasSafetyInstruction ? (
                      <span className="text-emerald-600 font-medium">
                        РџСЂРµРґР°РґРµРЅ РЅР°{" "}
                        {formatDocDate(localMember.safetyInstructionHandedAt)}
                      </span>
                    ) : localMember.safetyInstructionPrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅ РЅР°{" "}
                        {formatDocDate(localMember.safetyInstructionPrintedAt)}
                      </span>
                    ) : (
                      "РџСЂР°РІРёР»Р° Р·Р° РїСЉС‚СѓРІР°РЅРµ Рё СЃСЉСЃС‚РµР·Р°РЅРёСЏ."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("safetyInstruction", "print");
                    window.open(
                      `/members/${member.id}/safety-instruction`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.hasSafetyInstruction &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "safetyInstruction",
                      localMember.hasSafetyInstruction ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.hasSafetyInstruction
                    ? "РћС‚РјРµРЅРё"
                    : "РћС‚Р±РµР»РµР¶Рё РїСЂРµРґР°РґРµРЅ"}
                </Button>
                {renderDocAttachmentSection(
                  "safetyInstruction",
                  localMember.hasSafetyInstruction,
                  localMember.safetyInstructionUrl
                )}
              </div>
            </div>

            {/* Combined Athlete Card (Kartoteka) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.isLicensed
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <Contact
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    РљР°СЂС‚РѕС‚РµРєР° РєСЉРј Р‘Р¤Р‘
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.isLicensed ? (
                      <span className="text-emerald-600 font-medium">
                        РђРєС‚РёРІРЅР° РѕС‚{" "}
                        {formatDocDate(localMember.isLicensedHandedAt)}
                      </span>
                    ) : localMember.isLicensedPrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅР° РЅР°{" "}
                        {formatDocDate(localMember.isLicensedPrintedAt)}
                      </span>
                    ) : (
                      "РќСЏРјР° Р°РєС‚РёРІРЅР° РєР°СЂС‚РѕС‚РµРєР°."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("isLicensed", "print");
                    window.open(`/members/${member.id}/athlete-card`, "_blank");
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.isLicensed &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "isLicensed",
                      localMember.isLicensed ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.isLicensed
                    ? "РћС‚РјРµРЅРё"
                    : "РђРєС‚РёРІРёСЂР°Р№"}
                </Button>
                {renderDocAttachmentSection(
                  "isLicensed",
                  localMember.isLicensed,
                  localMember.isLicensedUrl
                )}
              </div>
            </div>

            {/* Medical Certificate */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    localMember.hasMedicalCertificate
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <Stethoscope
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    РњРµРґРёС†РёРЅСЃРєРѕ СЃРІРёРґРµС‚РµР»СЃС‚РІРѕ
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {localMember.hasMedicalCertificate ? (
                      <span className="text-emerald-600 font-medium">
                        РџСЂРµРґР°РґРµРЅРѕ РЅР°{" "}
                        {formatDocDate(localMember.medicalCertificateHandedAt)}
                      </span>
                    ) : localMember.medicalCertificatePrintedAt ? (
                      <span>
                        Р Р°Р·РїРµС‡Р°С‚Р°РЅРѕ РЅР°{" "}
                        {formatDocDate(localMember.medicalCertificatePrintedAt)}
                      </span>
                    ) : (
                      "Р›РёРїСЃРІР° РјРµРґРёС†РёРЅСЃРєРѕ СЃРІРёРґРµС‚РµР»СЃС‚РІРѕ!"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("medicalCertificate", "print");
                    window.open(
                      `/members/${member.id}/medical-certificate`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  РџРµС‡Р°С‚
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !localMember.hasMedicalCertificate &&
                      "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "medicalCertificate",
                      localMember.hasMedicalCertificate ? "cancel" : "submit"
                    )
                  }
                >
                  {localMember.hasMedicalCertificate
                    ? "РћС‚РјРµРЅРё"
                    : "РћС‚Р±РµР»РµР¶Рё РїСЂРµРґР°РґРµРЅРѕ"}
                </Button>
                {renderDocAttachmentSection(
                  "medicalCertificate",
                  localMember.hasMedicalCertificate,
                  localMember.medicalCertificateUrl
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="subscriptions"
          className="focus-visible:outline-none space-y-6"
        >
          <MemberSubscriptionsTab
            memberId={member.id}
            member={member}
            memberIds={family?.memberIds || [member.id]}
            familyMembers={familyMembers || []}
          />
          <MemberSalesHistory
            memberId={member.id}
            memberIds={family?.memberIds || [member.id]}
            familyMembers={familyMembers || []}
          />
        </TabsContent>

        <TabsContent value="attendance" className="focus-visible:outline-none">
          <MemberAttendanceHistory memberId={member.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
  isBlock = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  isBlock?: boolean;
  onClick?: () => void;
}) => {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex py-4 sm:py-6 border-b border-zinc-50 last:border-0",
        onClick && "cursor-pointer group/row",
        isBlock
          ? "flex-col items-start gap-3 sm:gap-4"
          : "flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0 group-hover/row:bg-zinc-100 transition-colors">
          <Icon
            className="h-3.5 w-3.5 text-zinc-400 group-hover/row:text-zinc-950 transition-colors"
            strokeWidth={1.5}
          />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400 group-hover/row:text-zinc-950 transition-colors">
          {label}
        </span>
      </div>
      {!isBlock ? (
        <span className="text-sm font-light text-zinc-900 sm:text-right w-full sm:w-auto pl-12 sm:pl-0 group-hover/row:font-medium transition-all">
          {value}
        </span>
      ) : (
        <span className="text-sm font-light text-zinc-400 leading-relaxed max-w-xl pl-12">
          {value}
        </span>
      )}
    </div>
  );
};
