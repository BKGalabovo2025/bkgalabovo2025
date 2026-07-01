"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Shield,
  Palette,
  User,
  Save,
  Lock,
  Mail,
  Globe,
  Building2,
  Camera,
  CheckCircle2,
  Activity,
  Clock,
  Loader2,
  RefreshCw,
  MapPin,
  Phone,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { toast } from "react-hot-toast";
import { getAllSites, updateSite } from "@/services/site-service";
import { Site, Therapist } from "@/types/site.types";
import { getAuditLogsAction } from "@/lib/actions/audit";
import { AuditLog } from "@/lib/audit-logger";

export default function SettingsClient() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    [key: string]: Partial<Site>;
  }>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await getAuditLogsAction(50);
      setAuditLogs(logs);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const allSites = await getAllSites();

        // Initialize form data
        const initialFormData: { [key: string]: Partial<Site> } = {};
        allSites.forEach((site) => {
          initialFormData[site.id] = { ...site };
        });
        setFormData(initialFormData);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error(
          "Р“СЂРµС€РєР° РїСЂРё Р·Р°СЂРµР¶РґР°РЅРµ РЅР° РЅР°СЃС‚СЂРѕР№РєРёС‚Рµ."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
    fetchLogs();
  }, []);

  const handleScheduleChange = (
    siteId: string,
    day: string,
    field: "open" | "close" | "isOpen",
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
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
        ...prev,
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
      };
    });
  };

  const handleInventoryChange = (
    siteId: string,
    type: "compressors" | "legs" | "arms" | "hips",
    value: number
  ) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
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
        ...prev,
        [siteId]: {
          ...site,
          inventory: newInv,
        },
      };
    });
  };

  const handleInputChange = (
    siteId: string,
    field: keyof Site,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [siteId]: {
        ...prev[siteId],
        [field]: value,
      },
    }));
  };

  const handleStringArrayChange = (
    siteId: string,
    field: "benefits" | "contraindications",
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const arr = [...(site[field] || [])];
      arr[index] = value;
      return { ...prev, [siteId]: { ...site, [field]: arr } };
    });
  };

  const addStringArrayItem = (
    siteId: string,
    field: "benefits" | "contraindications"
  ) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const arr = [...(site[field] || []), ""];
      return { ...prev, [siteId]: { ...site, [field]: arr } };
    });
  };

  const removeStringArrayItem = (
    siteId: string,
    field: "benefits" | "contraindications",
    index: number
  ) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const arr = [...(site[field] || [])];
      arr.splice(index, 1);
      return { ...prev, [siteId]: { ...site, [field]: arr } };
    });
  };

  const handleFaqChange = (
    siteId: string,
    index: number,
    field: "q" | "a",
    value: string
  ) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const faqs = [...(site.faqs || [])];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, [siteId]: { ...site, faqs } };
    });
  };

  const addFaq = (siteId: string) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const faqs = [...(site.faqs || []), { q: "", a: "" }];
      return { ...prev, [siteId]: { ...site, faqs } };
    });
  };

  const removeFaq = (siteId: string, index: number) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const faqs = [...(site.faqs || [])];
      faqs.splice(index, 1);
      return { ...prev, [siteId]: { ...site, faqs } };
    });
  };

  const handleTherapistChange = (
    siteId: string,
    index: number,
    field: keyof Therapist,
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const therapists = [...(site.therapists || [])];
      therapists[index] = { ...therapists[index], [field]: value };
      return { ...prev, [siteId]: { ...site, therapists } };
    });
  };

  const addTherapist = (siteId: string) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
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
      return { ...prev, [siteId]: { ...site, therapists } };
    });
  };

  const removeTherapist = (siteId: string, index: number) => {
    setFormData((prev) => {
      const site = prev[siteId] || {};
      const therapists = [...(site.therapists || [])];
      therapists.splice(index, 1);
      return { ...prev, [siteId]: { ...site, therapists } };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save each site's settings
      const savePromises = Object.entries(formData).map(([id, data]) =>
        updateSite({ ...data, id })
      );

      await Promise.all(savePromises);

      toast.success(
        "РќР°СЃС‚СЂРѕР№РєРёС‚Рµ СЃР° Р·Р°РїР°Р·РµРЅРё СѓСЃРїРµС€РЅРѕ!",
        {
          style: {
            borderRadius: "1.5rem",
            background: "#18181b",
            color: "#fff",
            fontWeight: 400,
            fontSize: "0.875rem",
          },
        }
      );
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(
        "Р“СЂРµС€РєР° РїСЂРё Р·Р°РїР°Р·РІР°РЅРµ РЅР° РЅР°СЃС‚СЂРѕР№РєРёС‚Рµ."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-zinc-500 font-light uppercase tracking-widest text-xs">
          Р—Р°СЂРµР¶РґР°РЅРµ РЅР° РЅР°СЃС‚СЂРѕР№РєРё...
        </p>
      </div>
    );
  }

  const bkgData = formData["bkgalabovo"] || {};
  const rzData = formData["recoveryzone"] || {};

  const inputClass =
    "h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary";
  const inputClassRz =
    "h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-[#00f2fe]";
  const labelClass =
    "text-[11px] font-medium uppercase tracking-widest text-zinc-400";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="РќР°СЃС‚СЂРѕР№РєРё"
        description="РЈРїСЂР°РІР»РµРЅРёРµ РЅР° СЃРёСЃС‚РµРјРЅРёС‚Рµ РїР°СЂР°РјРµС‚СЂРё, СЃРёРіСѓСЂРЅРѕСЃС‚С‚Р° Рё Р±СЂР°РЅРґРёСЂР°РЅРµС‚Рѕ РЅР° РєР»СѓР±Р°."
        breadcrumbs={[
          { label: "РќР°С‡Р°Р»Рѕ", href: "/dashboard" },
          { label: "РќР°СЃС‚СЂРѕР№РєРё" },
        ]}
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl font-medium uppercase tracking-widest text-[11px] h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-none transition-all"
        >
          {isSaving
            ? "Р—Р°РїР°Р·РІР°РЅРµ..."
            : "Р—Р°РїР°Р·Рё РїСЂРѕРјРµРЅРёС‚Рµ"}
          {!isSaving && <Save className="ml-3 h-4 w-4" strokeWidth={1.5} />}
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-72 space-y-3">
            <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-3">
              <TabsTrigger
                value="general"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Settings className="mr-4 h-5 w-5" strokeWidth={1.5} /> РћР±С‰Рё
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Palette className="mr-4 h-5 w-5" strokeWidth={1.5} />{" "}
                Р‘СЂР°РЅРґРёСЂР°РЅРµ
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Shield className="mr-4 h-5 w-5" strokeWidth={1.5} />{" "}
                РЎРёРіСѓСЂРЅРѕСЃС‚
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <User className="mr-4 h-5 w-5" strokeWidth={1.5} /> Р›РёС‡РµРЅ
                РџСЂРѕС„РёР»
              </TabsTrigger>

              <TabsTrigger
                value="recovery"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-[#00f2fe]/10 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-[#00f2fe] text-[13px] uppercase tracking-widest"
              >
                <Activity className="mr-4 h-5 w-5" strokeWidth={1.5} /> Р—РѕРЅР°
                Р’СЉР·СЃС‚Р°РЅРѕРІСЏРІР°РЅРµ
              </TabsTrigger>

              <TabsTrigger
                value="audit"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest mt-8"
              >
                <Clock className="mr-4 h-5 w-5" strokeWidth={1.5} />{" "}
                РЎРёСЃС‚РµРјРЅР° РёСЃС‚РѕСЂРёСЏ
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1">
            <TabsContent
              value="general"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 gap-6">
                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-2">
                    <Building2
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      РРЅС„РѕСЂРјР°С†РёСЏ Р·Р° РљР»СѓР±Р°
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        РРјРµ РЅР° РєР»СѓР±Р°
                      </Label>
                      <Input
                        value={bkgData.name || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "name",
                            e.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        <Mail className="inline h-3 w-3 mr-1" />
                        РћС„РёС†РёР°Р»РµРЅ РРјРµР№Р»
                      </Label>
                      <Input
                        value={bkgData.email || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "email",
                            e.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        <Phone className="inline h-3 w-3 mr-1" />
                        РўРµР»РµС„РѕРЅ Р·Р° РІСЂСЉР·РєР°
                      </Label>
                      <Input
                        value={bkgData.phone || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "phone",
                            e.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        <Globe className="inline h-3 w-3 mr-1" />
                        РЈРµР±СЃР°Р№С‚
                      </Label>
                      <Input
                        value={bkgData.website || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "website",
                            e.target.value
                          )
                        }
                        placeholder="https://bkgalabovo.alle.bg/"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className={labelClass}>
                        <MapPin className="inline h-3 w-3 mr-1" />
                        РђРґСЂРµСЃ
                      </Label>
                      <Input
                        value={bkgData.address || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="СѓР». РђР»РµРєСЃР°РЅРґСЉСЂ РЎС‚Р°РјР±РѕР»РёР№СЃРєРё 41, 6280 Р“СЉР»СЉР±РѕРІРѕ, Р‘СЉР»РіР°СЂРёСЏ"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-6">
                      РЎРѕС†РёР°Р»РЅРё РјСЂРµР¶Рё
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <InstagramIcon className="inline h-3 w-3 mr-1 text-pink-500" />
                          Instagram
                        </Label>
                        <Input
                          value={bkgData.instagram || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "bkgalabovo",
                              "instagram",
                              e.target.value
                            )
                          }
                          placeholder="https://www.instagram.com/badminton.galabovo/"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <YoutubeIcon className="inline h-3 w-3 mr-1 text-red-500" />
                          YouTube
                        </Label>
                        <Input
                          value={bkgData.youtube || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "bkgalabovo",
                              "youtube",
                              e.target.value
                            )
                          }
                          placeholder="https://www.youtube.com/@BKGalabovo"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <FacebookIcon className="inline h-3 w-3 mr-1 text-blue-500" />
                          Facebook РЎС‚СЂР°РЅРёС†Р°
                        </Label>
                        <Input
                          value={bkgData.facebook || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "bkgalabovo",
                              "facebook",
                              e.target.value
                            )
                          }
                          placeholder="https://www.facebook.com/badmintongalabovo/"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <Users className="inline h-3 w-3 mr-1 text-blue-400" />
                          Facebook Р“СЂСѓРїР° (Р РѕРґРёС‚РµР»Рё Рё РґРµС†Р°)
                        </Label>
                        <Input
                          value={bkgData.facebookGroup || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "bkgalabovo",
                              "facebookGroup",
                              e.target.value
                            )
                          }
                          placeholder="https://www.facebook.com/groups/645571089477573/"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-2">
                    <Activity
                      className="h-5 w-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      РРЅС„РѕСЂРјР°С†РёСЏ Р·Р° Р—РѕРЅР°С‚Р°
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        РРјРµ РЅР° РѕР±РµРєС‚Р°
                      </Label>
                      <Input
                        value={rzData.name || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "name",
                            e.target.value
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        <Mail className="inline h-3 w-3 mr-1" />
                        РћС„РёС†РёР°Р»РµРЅ РРјРµР№Р»
                      </Label>
                      <Input
                        value={rzData.email || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "email",
                            e.target.value
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        <Phone className="inline h-3 w-3 mr-1" />
                        РўРµР»РµС„РѕРЅ Р·Р° РІСЂСЉР·РєР°
                      </Label>
                      <Input
                        value={rzData.phone || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "phone",
                            e.target.value
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        <Globe className="inline h-3 w-3 mr-1" />
                        РЈРµР±СЃР°Р№С‚
                      </Label>
                      <Input
                        value={rzData.website || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "website",
                            e.target.value
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className={labelClass}>
                        <MapPin className="inline h-3 w-3 mr-1" />
                        РђРґСЂРµСЃ
                      </Label>
                      <Input
                        value={rzData.address || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "address",
                            e.target.value
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-6">
                      РЎРѕС†РёР°Р»РЅРё РјСЂРµР¶Рё
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <InstagramIcon className="inline h-3 w-3 mr-1 text-pink-500" />
                          Instagram
                        </Label>
                        <Input
                          value={rzData.instagram || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "recoveryzone",
                              "instagram",
                              e.target.value
                            )
                          }
                          placeholder="https://www.instagram.com/recoveryzonebyzm/"
                          className={inputClassRz}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <FacebookIcon className="inline h-3 w-3 mr-1 text-blue-500" />
                          Facebook
                        </Label>
                        <Input
                          value={rzData.facebook || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "recoveryzone",
                              "facebook",
                              e.target.value
                            )
                          }
                          placeholder="https://www.facebook.com/..."
                          className={inputClassRz}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <YoutubeIcon className="inline h-3 w-3 mr-1 text-red-500" />
                          YouTube
                        </Label>
                        <Input
                          value={rzData.youtube || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "recoveryzone",
                              "youtube",
                              e.target.value
                            )
                          }
                          placeholder="https://www.youtube.com/..."
                          className={inputClassRz}
                        />
                      </div>
                    </div>
                  </div>
                </BentoCard>

                {/* в”Ђв”Ђ Localization + Status в”Ђв”Ђ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-4 mb-2">
                      <Globe
                        className="h-5 w-5 text-primary"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        Р›РѕРєР°Р»РёР·Р°С†РёСЏ
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          РћСЃРЅРѕРІРЅР° Р’Р°Р»СѓС‚Р°
                        </Label>
                        <div className="h-14 flex items-center px-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-light text-zinc-700 dark:text-zinc-300">
                          EUR (в‚¬)
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          Р§Р°СЃРѕРІР° Р—РѕРЅР°
                        </Label>
                        <div className="h-14 flex items-center px-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-light text-zinc-700 dark:text-zinc-300">
                          UTC+2 (Europe/Sofia)
                        </div>
                      </div>
                    </div>
                  </BentoCard>
                  <BentoCard className="p-10 space-y-6 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col justify-center items-center text-center">
                    <div className="h-20 w-20 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mb-4 transition-all hover:scale-105">
                      <CheckCircle2 size={36} strokeWidth={1} />
                    </div>
                    <h4 className="font-light text-xl text-zinc-900 dark:text-white">
                      РЎРёСЃС‚РµРјР°С‚Р° Рµ РћРїС‚РёРјРёР·РёСЂР°РЅР°
                    </h4>
                    <p className="text-sm text-zinc-400 max-w-[200px] font-light leading-relaxed">
                      Р’СЃРёС‡РєРё СЃРёСЃС‚РµРјРЅРё РїР°СЂР°РјРµС‚СЂРё СЃР° РІ
                      РЅРѕСЂРјР°Р»РЅРё РіСЂР°РЅРёС†Рё.
                    </p>
                  </BentoCard>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="branding"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <BentoCard className="md:col-span-8 p-10 space-y-10 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Palette
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Р’РёР·СѓР°Р»РЅР° РРґРµРЅС‚РёС‡РЅРѕСЃС‚ -
                      Р‘Р°РґРјРёРЅС‚РѕРЅ РљР»СѓР±
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Р›РѕРіРѕ РЅР° РљР»СѓР±Р°
                      </Label>
                      <div className="flex items-center gap-8 p-8 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <div className="h-28 w-28 bg-white rounded-3xl flex items-center justify-center shadow-none overflow-hidden border border-zinc-100">
                          <Image
                            src="/logo.png"
                            alt="BKG Logo"
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 font-medium text-[11px] uppercase tracking-widest h-12 px-6 bg-white dark:bg-zinc-900"
                          >
                            <Camera
                              className="mr-3 h-4 w-4"
                              strokeWidth={1.5}
                            />{" "}
                            РџСЂРѕРјРµРЅРё Р›РѕРіРѕ
                          </Button>
                          <p className="text-[11px] text-zinc-400 uppercase font-light tracking-wide">
                            РџСЂРµРїРѕСЂСЉС‡РёС‚РµР»РµРЅ СЂР°Р·РјРµСЂ: 512x512px
                            (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          РћСЃРЅРѕРІРµРЅ Р¦РІСЏС‚
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-[#00AEEF] border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={bkgData.primaryColor || "#00AEEF"}
                            onChange={(e) =>
                              handleInputChange(
                                "bkgalabovo",
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          РђРєС†РµРЅС‚РµРЅ Р¦РІСЏС‚
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-zinc-900 dark:bg-white border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={bkgData.accentColor || "#000000"}
                            onChange={(e) =>
                              handleInputChange(
                                "bkgalabovo",
                                "accentColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-8 p-10 space-y-10 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Palette
                      className="h-5 w-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Р’РёР·СѓР°Р»РЅР° РРґРµРЅС‚РёС‡РЅРѕСЃС‚ - Recovery Zone
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Р›РѕРіРѕ РЅР° Р—РѕРЅР°С‚Р°
                      </Label>
                      <div className="flex items-center gap-8 p-8 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <div className="h-28 w-28 bg-white rounded-3xl flex items-center justify-center shadow-none overflow-hidden border border-zinc-100">
                          <Image
                            src="/1.png"
                            alt="RZ Logo"
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 font-medium text-[11px] uppercase tracking-widest h-12 px-6 bg-white dark:bg-zinc-900"
                          >
                            <Camera
                              className="mr-3 h-4 w-4"
                              strokeWidth={1.5}
                            />{" "}
                            РџСЂРѕРјРµРЅРё Р›РѕРіРѕ
                          </Button>
                          <p className="text-[11px] text-zinc-400 uppercase font-light tracking-wide">
                            РџСЂРµРїРѕСЂСЉС‡РёС‚РµР»РµРЅ СЂР°Р·РјРµСЂ: 512x512px
                            (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          РћСЃРЅРѕРІРµРЅ Р¦РІСЏС‚
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-[#00f2fe] border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={rzData.primaryColor || "#00f2fe"}
                            onChange={(e) =>
                              handleInputChange(
                                "recoveryzone",
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          РђРєС†РµРЅС‚РµРЅ Р¦РІСЏС‚
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-zinc-900 dark:bg-white border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={rzData.accentColor || "#18181b"}
                            onChange={(e) =>
                              handleInputChange(
                                "recoveryzone",
                                "accentColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-4 p-10 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-none flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className="font-light text-xl uppercase tracking-widest">
                      РџСЂРµРіР»РµРґ
                    </h3>
                    <div className="p-6 rounded-2xl bg-white/5 dark:bg-zinc-50 border border-white/10 dark:border-zinc-200 space-y-4">
                      <div className="h-2 w-16 bg-primary rounded-full" />
                      <div className="h-5 w-full bg-white/10 dark:bg-zinc-100 rounded-full" />
                      <div className="h-5 w-2/3 bg-white/10 dark:bg-zinc-100 rounded-full" />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-medium leading-relaxed tracking-wider">
                    РџСЂРѕРјРµРЅРёС‚Рµ РІ Р±СЂР°РЅРґРёСЂР°РЅРµС‚Рѕ С‰Рµ СЃРµ
                    РѕС‚СЂР°Р·СЏС‚ РІРµРґРЅР°РіР° РЅР° РІСЃРёС‡РєРё
                    РїСѓР±Р»РёС‡РЅРё СЃС‚СЂР°РЅРёС†Рё Рё РіРµРЅРµСЂРёСЂР°РЅРё
                    РґРѕРєСѓРјРµРЅС‚Рё.
                  </p>
                </BentoCard>
              </div>
            </TabsContent>

            <TabsContent
              value="security"
              className="m-0 focus-visible:outline-none"
            >
              <BentoCard className="p-10 space-y-10 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="flex items-center gap-4">
                  <Lock className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                    РЎРёРіСѓСЂРЅРѕСЃС‚ РЅР° РЎРёСЃС‚РµРјР°С‚Р°
                  </h3>
                </div>

                <div className="space-y-10 max-w-2xl">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                      РЎРјСЏРЅР° РЅР° РџР°СЂРѕР»Р° (РђРґРјРёРЅ)
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          РўРµРєСѓС‰Р° РџР°СЂРѕР»Р°
                        </Label>
                        <Input
                          type="password"
                          placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў"
                          className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            РќРѕРІР° РџР°СЂРѕР»Р°
                          </Label>
                          <Input
                            type="password"
                            placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў"
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            РџРѕРІС‚РѕСЂРё РќРѕРІР°С‚Р° РџР°СЂРѕР»Р°
                          </Label>
                          <Input
                            type="password"
                            placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў"
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-zinc-50 dark:border-zinc-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div>
                        <h4 className="font-light text-lg text-zinc-900 dark:text-white">
                          Р”РІСѓС„Р°РєС‚РѕСЂРЅР° Р°РІС‚РµРЅС‚РёРєР°С†РёСЏ
                        </h4>
                        <p className="text-sm text-zinc-400 font-light mt-1">
                          Р”РѕР±Р°РІРµС‚Рµ РґРѕРїСЉР»РЅРёС‚РµР»РЅРѕ РЅРёРІРѕ
                          РЅР° СЃРёРіСѓСЂРЅРѕСЃС‚ РєСЉРј РІР°С€РёСЏ
                          Р°РєР°СѓРЅС‚.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 font-medium text-[11px] uppercase tracking-widest h-12 px-8 bg-white dark:bg-zinc-900"
                      >
                        РђРєС‚РёРІРёСЂР°Р№
                      </Button>
                    </div>
                  </div>
                </div>
              </BentoCard>
            </TabsContent>

            <TabsContent
              value="recovery"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 gap-6">
                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-6">
                    <Activity
                      className="h-5 w-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      РћР±С‰Р° РёРЅС„РѕСЂРјР°С†РёСЏ Р·Р° Р·РѕРЅР°С‚Р°
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-3">
                      <Label className={labelClass}>
                        РћР±С‰Рѕ РћРїРёСЃР°РЅРёРµ
                      </Label>
                      <Textarea
                        value={rzData.description || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Р’СЉР·СЃС‚Р°РЅРѕРІРё СЃРІРѕРёС‚Рµ РЎРёР»Рё..."
                        className={`${inputClassRz} min-h-[120px] resize-y`}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>РўРµР»РµС„РѕРЅ</Label>
                      <Input
                        value={rzData.phone || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "phone",
                            e.target.value
                          )
                        }
                        placeholder="+359 89 938 8338"
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>РРјРµР№Р»</Label>
                      <Input
                        value={rzData.email || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "email",
                            e.target.value
                          )
                        }
                        placeholder="office@recovery.bg"
                        className={inputClassRz}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <Label className={labelClass}>РђРґСЂРµСЃ</Label>
                      <Input
                        value={rzData.address || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="РЎРїРѕСЂС‚РЅР° Р·Р°Р»Р° вЂћР•РЅРµСЂРіРµС‚РёРєвЂњ, Р“СЉР»СЉР±РѕРІРѕ"
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>Facebook Р›РёРЅРє</Label>
                      <Input
                        value={rzData.facebook || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "facebook",
                            e.target.value
                          )
                        }
                        placeholder="https://facebook.com/..."
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>Instagram Р›РёРЅРє</Label>
                      <Input
                        value={rzData.instagram || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "instagram",
                            e.target.value
                          )
                        }
                        placeholder="https://instagram.com/..."
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>YouTube Р›РёРЅРє</Label>
                      <Input
                        value={rzData.youtube || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "youtube",
                            e.target.value
                          )
                        }
                        placeholder="https://youtube.com/..."
                        className={inputClassRz}
                      />
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-6">
                    <Activity
                      className="h-5 w-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      РРЅРІРµРЅС‚Р°СЂ & РћР±РѕСЂСѓРґРІР°РЅРµ
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        Р‘СЂРѕР№ РљРѕРјРїСЂРµСЃРѕСЂРё
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={rzData.inventory?.compressors || 0}
                        onChange={(e) =>
                          handleInventoryChange(
                            "recoveryzone",
                            "compressors",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        РџСЂРёСЃС‚Р°РІРєРё &quot;РўРђР—&quot;
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={rzData.inventory?.attachments?.hips || 0}
                        onChange={(e) =>
                          handleInventoryChange(
                            "recoveryzone",
                            "hips",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        РџСЂРёСЃС‚Р°РІРєРё &quot;РљР РђРљРђ&quot;
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={rzData.inventory?.attachments?.legs || 0}
                        onChange={(e) =>
                          handleInventoryChange(
                            "recoveryzone",
                            "legs",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>
                        РџСЂРёСЃС‚Р°РІРєРё &quot;Р РЄР¦Р•&quot;
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={rzData.inventory?.attachments?.arms || 0}
                        onChange={(e) =>
                          handleInventoryChange(
                            "recoveryzone",
                            "arms",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className={inputClassRz}
                      />
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Clock
                      className="h-5 w-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Р Р°Р±РѕС‚РЅРѕ Р’СЂРµРјРµ
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ].map((day, i) => {
                      const dayNames = [
                        "РџРѕРЅРµРґРµР»РЅРёРє",
                        "Р’С‚РѕСЂРЅРёРє",
                        "РЎСЂСЏРґР°",
                        "Р§РµС‚РІСЉСЂС‚СЉРє",
                        "РџРµС‚СЉРє",
                        "РЎСЉР±РѕС‚Р°",
                        "РќРµРґРµР»СЏ",
                      ];
                      const sched = rzData.schedule || {};
                      const daySched = (
                        sched as Record<
                          string,
                          { open: string; close: string; isOpen: boolean }
                        >
                      )[day] || {
                        open: "08:00",
                        close: "22:00",
                        isOpen: true,
                      };

                      return (
                        <div
                          key={day}
                          className="flex items-center gap-6 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30"
                        >
                          <div className="w-32">
                            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {dayNames[i]}
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={daySched.isOpen}
                              onCheckedChange={(c) =>
                                handleScheduleChange(
                                  "recoveryzone",
                                  day,
                                  "isOpen",
                                  !!c
                                )
                              }
                            />
                            <span className="text-[10px] uppercase font-bold text-zinc-400 w-16">
                              {daySched.isOpen
                                ? "РћС‚РІРѕСЂРµРЅРѕ"
                                : "Р—Р°С‚РІРѕСЂРµРЅРѕ"}
                            </span>
                          </div>
                          {daySched.isOpen && (
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <Input
                                type="time"
                                value={daySched.open}
                                onChange={(e) =>
                                  handleScheduleChange(
                                    "recoveryzone",
                                    day,
                                    "open",
                                    e.target.value
                                  )
                                }
                                className="w-32 h-10"
                              />
                              <span className="text-zinc-400">-</span>
                              <Input
                                type="time"
                                value={daySched.close}
                                onChange={(e) =>
                                  handleScheduleChange(
                                    "recoveryzone",
                                    day,
                                    "close",
                                    e.target.value
                                  )
                                }
                                className="w-32 h-10"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </BentoCard>

                {/* Team (Therapists) Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden mt-8">
                  <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-800">
                    <div>
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        Р•РєРёРї
                      </h3>
                      <p className="text-zinc-500 text-sm mt-1">
                        Р”РѕР±Р°РІРµС‚Рµ СЃРЅРёРјРєР°, РёРјРµ, СЂРѕР»СЏ Рё
                        РѕРїРёСЃР°РЅРёРµ. Р—Р° СЃРЅРёРјРєРё РјРѕР¶РµС‚Рµ РґР°
                        РґРѕР±Р°РІРёС‚Рµ С„Р°Р№Р»РѕРІРµС‚Рµ РІ РїР°РїРєР°
                        &quot;public/team&quot; Рё РґР° РЅР°РїРёС€РµС‚Рµ
                        &quot;/team/imeto.jpg&quot;
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => addTherapist("recoveryzone")}
                      className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Р”РѕР±Р°РІРё Р§Р»РµРЅ
                    </Button>
                  </div>
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="mb-6">
                      <Label className="text-zinc-400 mb-2 block">
                        Р’СЉРІРµРґРµРЅРёРµ РєСЉРј РµРєРёРїР° (Team Intro)
                      </Label>
                      <Textarea
                        value={rzData.teamIntro || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "teamIntro",
                            e.target.value
                          )
                        }
                        placeholder="РљСЂР°С‚РєРѕ РѕРїРёСЃР°РЅРёРµ РЅР° РµРєРёРїР°..."
                        className="min-h-[100px] resize-y h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    {rzData.therapists?.map((therapist, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-4 p-6 bg-black/50 border border-zinc-800/50 rounded-2xl relative"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => removeTherapist("recoveryzone", index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="text-zinc-400 mb-2 block">
                              РРјРµ
                            </Label>
                            <Input
                              value={therapist.name || ""}
                              onChange={(e) =>
                                handleTherapistChange(
                                  "recoveryzone",
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Р–РёРІРєРѕ РРІР°РЅРѕРІ"
                              className={inputClassRz}
                            />
                          </div>
                          <div>
                            <Label className="text-zinc-400 mb-2 block">
                              Р”Р»СЉР¶РЅРѕСЃС‚ / Р РѕР»СЏ
                            </Label>
                            <Input
                              value={therapist.role || ""}
                              onChange={(e) =>
                                handleTherapistChange(
                                  "recoveryzone",
                                  index,
                                  "role",
                                  e.target.value
                                )
                              }
                              placeholder="РЈРїСЂР°РІРёС‚РµР»"
                              className={inputClassRz}
                            />
                          </div>
                          <div>
                            <Label className="text-zinc-400 mb-2 block">
                              РџСЉС‚ РєСЉРј СЃРЅРёРјРєР°
                            </Label>
                            <Input
                              value={therapist.image || ""}
                              onChange={(e) =>
                                handleTherapistChange(
                                  "recoveryzone",
                                  index,
                                  "image",
                                  e.target.value
                                )
                              }
                              placeholder="РќР°РїСЂ. /team/jivko.jpg"
                              className={inputClassRz}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-zinc-400 mb-2 block">
                              РћРїРёСЃР°РЅРёРµ (Bio)
                            </Label>
                            <Textarea
                              value={therapist.bio || ""}
                              onChange={(e) =>
                                handleTherapistChange(
                                  "recoveryzone",
                                  index,
                                  "bio",
                                  e.target.value
                                )
                              }
                              placeholder="Р–РёРІРєРѕ РРІР°РЅРѕРІ РѕС‚РіРѕРІР°СЂСЏ Р·Р°..."
                              className={`${inputClassRz} min-h-[100px] resize-y`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!rzData.therapists || rzData.therapists.length === 0) && (
                      <p className="text-zinc-500 text-sm font-light">
                        РќСЏРјР° РґРѕР±Р°РІРµРЅРё С‡Р»РµРЅРѕРІРµ РЅР°
                        РµРєРёРїР°.
                      </p>
                    )}
                  </div>
                </div>

                {/* Benefits / Р‘Р°Р·Р° */}
                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <CheckCircle2
                        className="h-5 w-5 text-[#00f2fe]"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        РџСЂРµРґРёРјСЃС‚РІР° (РЎРµРєС†РёСЏ &quot;Р‘Р°Р·Р°&quot;)
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        addStringArrayItem("recoveryzone", "benefits")
                      }
                      className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Р”РѕР±Р°РІРё РџСЂРµРґРёРјСЃС‚РІРѕ
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {rzData.benefits?.map((item, index) => {
                      const value =
                        typeof item === "string"
                          ? item
                          : (item as { title?: string }).title || "";
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <Input
                            value={value}
                            onChange={(e) =>
                              handleStringArrayChange(
                                "recoveryzone",
                                "benefits",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="РќР°РїСЂ. РЎРїРµС†РёР°Р»РёР·РёСЂР°РЅР° Р·РѕРЅР° Р·Р° РІСЉР·СЃС‚Р°РЅРѕРІСЏРІР°РЅРµ..."
                            className={inputClassRz}
                          />
                          <Button
                            variant="ghost"
                            onClick={() =>
                              removeStringArrayItem(
                                "recoveryzone",
                                "benefits",
                                index
                              )
                            }
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    {(!rzData.benefits || rzData.benefits.length === 0) && (
                      <p className="text-zinc-500 text-sm font-light">
                        РќСЏРјР° РІСЉРІРµРґРµРЅРё РїСЂРµРґРёРјСЃС‚РІР°.
                      </p>
                    )}
                  </div>
                </BentoCard>

                {/* Contraindications */}
                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Shield
                        className="h-5 w-5 text-red-500"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        РџСЂРѕС‚РёРІРѕРїРѕРєР°Р·Р°РЅРёСЏ
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        addStringArrayItem("recoveryzone", "contraindications")
                      }
                      className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Р”РѕР±Р°РІРё РџСЂРѕС‚РёРІРѕРїРѕРєР°Р·Р°РЅРёРµ
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {rzData.contraindications?.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <Input
                          value={item}
                          onChange={(e) =>
                            handleStringArrayChange(
                              "recoveryzone",
                              "contraindications",
                              index,
                              e.target.value
                            )
                          }
                          placeholder="РќР°РїСЂ. Р‘СЂРµРјРµРЅРЅРѕСЃС‚, РѕС‚РєСЂРёС‚Рё СЂР°РЅРё..."
                          className={inputClass}
                        />
                        <Button
                          variant="ghost"
                          onClick={() =>
                            removeStringArrayItem(
                              "recoveryzone",
                              "contraindications",
                              index
                            )
                          }
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!rzData.contraindications ||
                      rzData.contraindications.length === 0) && (
                      <p className="text-zinc-500 text-sm font-light">
                        РќСЏРјР° РІСЉРІРµРґРµРЅРё
                        РїСЂРѕС‚РёРІРѕРїРѕРєР°Р·Р°РЅРёСЏ.
                      </p>
                    )}
                  </div>
                </BentoCard>

                {/* FAQs */}
                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Settings
                        className="h-5 w-5 text-primary"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        Р§РµСЃС‚Рѕ Р·Р°РґР°РІР°РЅРё РІСЉРїСЂРѕСЃРё (FAQ)
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => addFaq("recoveryzone")}
                      className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Р”РѕР±Р°РІРё Р’СЉРїСЂРѕСЃ
                    </Button>
                  </div>
                  <div className="space-y-8">
                    {rzData.faqs?.map((faq, index) => (
                      <div
                        key={index}
                        className="relative p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => removeFaq("recoveryzone", index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="space-y-3">
                          <Label className={labelClass}>Р’СЉРїСЂРѕСЃ</Label>
                          <Input
                            value={faq.q}
                            onChange={(e) =>
                              handleFaqChange(
                                "recoveryzone",
                                index,
                                "q",
                                e.target.value
                              )
                            }
                            placeholder="РќР°РїСЂ. РљРѕР»РєРѕ С‡РµСЃС‚Рѕ РјРѕРіР° РґР° РёР·РїРѕР»Р·РІР°Рј Normatec?"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className={labelClass}>РћС‚РіРѕРІРѕСЂ</Label>
                          <textarea
                            value={faq.a}
                            onChange={(e) =>
                              handleFaqChange(
                                "recoveryzone",
                                index,
                                "a",
                                e.target.value
                              )
                            }
                            placeholder="РћС‚РіРѕРІРѕСЂ..."
                            className="w-full rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-light p-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[100px] resize-none"
                          />
                        </div>
                      </div>
                    ))}
                    {(!rzData.faqs || rzData.faqs.length === 0) && (
                      <p className="text-zinc-500 text-sm font-light">
                        РќСЏРјР° РІСЉРІРµРґРµРЅРё РІСЉРїСЂРѕСЃРё.
                      </p>
                    )}
                  </div>
                </BentoCard>
              </div>
            </TabsContent>

            <TabsContent
              value="profile"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <BentoCard className="md:col-span-4 p-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 flex flex-col items-center text-center space-y-6">
                  <div className="relative group cursor-pointer">
                    <div className="h-40 w-40 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-none overflow-hidden transition-all group-hover:scale-105">
                      <User
                        size={80}
                        className="text-zinc-200 dark:text-zinc-700"
                        strokeWidth={1}
                      />
                    </div>
                    <div className="absolute inset-0 bg-primary/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                      <Camera
                        className="text-primary"
                        size={32}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ
                    </h3>
                    <p className="text-[11px] text-primary font-medium uppercase tracking-widest mt-1">
                      РЎСѓРїРµСЂ РџРѕС‚СЂРµР±РёС‚РµР»
                    </p>
                  </div>
                  <div className="w-full pt-8 space-y-4 border-t border-zinc-50 dark:border-zinc-900">
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest">
                      <span className="text-zinc-400">
                        РџРѕСЃР»РµРґРµРЅ РІС…РѕРґ
                      </span>
                      <span className="text-zinc-900 dark:text-white font-light">
                        Р”РЅРµСЃ, 09:12
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest">
                      <span className="text-zinc-400">
                        РќРёРІРѕ РЅР° РґРѕСЃС‚СЉРї
                      </span>
                      <span className="text-primary font-light">
                        Full Access
                      </span>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-8 p-10 space-y-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Р›РёС‡РЅР° РРЅС„РѕСЂРјР°С†РёСЏ
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        РРјРµ
                      </Label>
                      <Input
                        defaultValue="Admin"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Р¤Р°РјРёР»РёСЏ
                      </Label>
                      <Input
                        defaultValue="User"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        РРјРµР№Р» РђРґСЂРµСЃ
                      </Label>
                      <Input
                        defaultValue="admin@bkgalabovo.com"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </BentoCard>
              </div>
            </TabsContent>

            <TabsContent
              value="audit"
              className="m-0 focus-visible:outline-none"
            >
              <BentoCard className="p-10 space-y-8 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 min-h-[600px]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      РЎРёСЃС‚РµРјРЅР° РСЃС‚РѕСЂРёСЏ (РћРґРёС‚РѕСЂСЃРєРё
                      РґРЅРµРІРЅРёРє)
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchLogs}
                    disabled={loadingLogs}
                    className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                  >
                    {loadingLogs ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    РћРїСЂРµСЃРЅРё
                  </Button>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 grid grid-cols-12 gap-4 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                    <div className="col-span-3">Р”Р°С‚Р° / Р’СЂРµРјРµ</div>
                    <div className="col-span-3">Р”РµР№СЃС‚РІРёРµ</div>
                    <div className="col-span-4">Р”РµС‚Р°Р№Р»Рё</div>
                    <div className="col-span-2">РџРѕС‚СЂРµР±РёС‚РµР»</div>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
                    {auditLogs.length === 0 ? (
                      <div className="p-10 text-center text-sm font-light text-zinc-500">
                        {loadingLogs
                          ? "Р—Р°СЂРµР¶РґР°РЅРµ РЅР° РґРЅРµРІРЅРёРєР°..."
                          : "РќСЏРјР° РЅР°РјРµСЂРµРЅРё Р·Р°РїРёСЃРё РІ РёСЃС‚РѕСЂРёСЏС‚Р°."}
                      </div>
                    ) : (
                      auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="px-6 py-4 grid grid-cols-12 gap-4 text-sm font-light hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="col-span-3 text-zinc-500">
                            {new Date(log.timestamp).toLocaleString("bg-BG")}
                          </div>
                          <div className="col-span-3 text-zinc-900 dark:text-zinc-100">
                            {log.action}
                          </div>
                          <div className="col-span-4 text-zinc-600 dark:text-zinc-400">
                            {log.details}
                          </div>
                          <div className="col-span-2 text-zinc-500 truncate">
                            {log.userEmail}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </BentoCard>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
