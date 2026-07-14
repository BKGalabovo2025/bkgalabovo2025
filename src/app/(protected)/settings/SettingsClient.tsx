/* eslint-disable sonarjs/cognitive-complexity */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
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
  Eye,
  EyeOff,
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
import { getFirebaseAuth } from "@/lib/firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function SettingsClient() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
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
        toast.error("Грешка при зареждане на настройките.");
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

  const handleResetPassword = async () => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser || !auth.currentUser.email) {
      toast.error("Липсва имейл адрес.");
      return;
    }
    setIsSendingReset(true);
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast.success(
        `Линк за възстановяване е изпратен на ${auth.currentUser.email}`
      );
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при изпращане на линка.");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentPassword || newPassword || repeatPassword) {
        if (!currentPassword) {
          toast.error("Моля, въведете текущата си парола!");
          setIsSaving(false);
          return;
        }
        if (newPassword !== repeatPassword) {
          toast.error("Новите пароли не съвпадат!");
          setIsSaving(false);
          return;
        }
        const auth = getFirebaseAuth();
        if (auth.currentUser && auth.currentUser.email) {
          try {
            const credential = EmailAuthProvider.credential(
              auth.currentUser.email,
              currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            toast.success("Паролата е променена успешно!");
            setCurrentPassword("");
            setNewPassword("");
            setRepeatPassword("");
          } catch (error) {
            console.error(error);
            toast.error(
              "Грешка: Невалидна текуща парола или сесията е изтекла."
            );
            setIsSaving(false);
            return;
          }
        }
      }

      // Save each site's settings
      const savePromises = Object.entries(formData).map(([id, data]) =>
        updateSite({ ...data, id })
      );

      await Promise.all(savePromises);

      toast.success("Настройките са запазени успешно!", {
        style: {
          borderRadius: "1.5rem",
          background: "#18181b",
          color: "#fff",
          fontWeight: 400,
          fontSize: "0.875rem",
        },
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Грешка при запазване на настройките.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-zinc-500 font-light uppercase tracking-widest text-xs">
          Зареждане на настройки...
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
        title="Настройки"
        description="Управление на системните параметри, сигурността и брандирането на клуба."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Настройки" },
        ]}
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl font-medium uppercase tracking-widest text-[11px] h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-none transition-all"
        >
          {isSaving ? "Запазване..." : "Запази промените"}
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
                <Settings className="mr-4 h-5 w-5" strokeWidth={1.5} /> Общи
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Palette className="mr-4 h-5 w-5" strokeWidth={1.5} />{" "}
                Брандиране
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Shield className="mr-4 h-5 w-5" strokeWidth={1.5} /> Сигурност
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <User className="mr-4 h-5 w-5" strokeWidth={1.5} /> Личен Профил
              </TabsTrigger>

              <TabsTrigger
                value="recovery"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-[#00f2fe]/10 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-[#00f2fe] text-[13px] uppercase tracking-widest"
              >
                <Activity className="mr-4 h-5 w-5" strokeWidth={1.5} /> Зона
                Възстановяване
              </TabsTrigger>

              <TabsTrigger
                value="team"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Users className="mr-4 h-5 w-5" strokeWidth={1.5} /> Екип
              </TabsTrigger>

              <TabsTrigger
                value="audit"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest mt-8"
              >
                <Clock className="mr-4 h-5 w-5" strokeWidth={1.5} /> Системна
                история
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
                      Информация за Клуба
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className={labelClass}>Име на клуба</Label>
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
                        Официален Имейл
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
                        Телефон за връзка
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
                        Уебсайт
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
                        Адрес
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
                        placeholder="ул. Александър Стамболийски 41, 6280 Гълъбово, България"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-6">
                      Социални мрежи
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
                          Facebook Страница
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
                          Facebook Група (Родители и деца)
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
                      Информация за Зоната
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className={labelClass}>Име на обекта</Label>
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
                        Официален Имейл
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
                        Телефон за връзка
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
                        Уебсайт
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
                        Адрес
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
                      Социални мрежи
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

                {/* ── Localization + Status ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-4 mb-2">
                      <Globe
                        className="h-5 w-5 text-primary"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        Локализация
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className={labelClass}>Основна Валута</Label>
                        <div className="h-14 flex items-center px-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-light text-zinc-700 dark:text-zinc-300">
                          EUR (€)
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>Часова Зона</Label>
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
                      Системата е Оптимизирана
                    </h4>
                    <p className="text-sm text-zinc-400 max-w-[200px] font-light leading-relaxed">
                      Всички системни параметри са в нормални граници.
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
                      Визуална Идентичност - Бадминтон Клуб
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Лого на Клуба
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
                            Промени Лого
                          </Button>
                          <p className="text-[11px] text-zinc-400 uppercase font-light tracking-wide">
                            Препоръчителен размер: 512x512px (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          Основен Цвят
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
                          Акцентен Цвят
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
                      Визуална Идентичност - Recovery Zone
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Лого на Зоната
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
                            Промени Лого
                          </Button>
                          <p className="text-[11px] text-zinc-400 uppercase font-light tracking-wide">
                            Препоръчителен размер: 512x512px (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          Основен Цвят
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
                          Акцентен Цвят
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
                      Преглед
                    </h3>
                    <div className="p-6 rounded-2xl bg-white/5 dark:bg-zinc-50 border border-white/10 dark:border-zinc-200 space-y-4">
                      <div className="h-2 w-16 bg-primary rounded-full" />
                      <div className="h-5 w-full bg-white/10 dark:bg-zinc-100 rounded-full" />
                      <div className="h-5 w-2/3 bg-white/10 dark:bg-zinc-100 rounded-full" />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-medium leading-relaxed tracking-wider">
                    Промените в брандирането ще се отразят веднага на всички
                    публични страници и генерирани документи.
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
                    Сигурност на Системата
                  </h3>
                </div>

                <div className="space-y-10 max-w-2xl">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                      Смяна на Парола (Админ)
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          Текуща Парола
                        </Label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex justify-end mt-1">
                          <Button
                            type="button"
                            variant="link"
                            onClick={handleResetPassword}
                            disabled={isSendingReset}
                            className="text-[11px] text-primary hover:text-primary/80 h-auto p-0 font-light"
                          >
                            Забравена текуща парола?
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            Нова Парола
                          </Label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary pr-12"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            Повтори Новата Парола
                          </Label>
                          <div className="relative">
                            <Input
                              type={showRepeatPassword ? "text" : "password"}
                              value={repeatPassword}
                              onChange={(e) =>
                                setRepeatPassword(e.target.value)
                              }
                              placeholder="••••••••"
                              className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary pr-12"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setShowRepeatPassword(!showRepeatPassword)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              {showRepeatPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
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
                      Обща информация за зоната
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-3">
                      <Label className={labelClass}>Общо Описание</Label>
                      <Textarea
                        value={rzData.description || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Възстанови своите Сили..."
                        className={`${inputClassRz} min-h-[120px] resize-y`}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>Телефон</Label>
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
                      <Label className={labelClass}>Имейл</Label>
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
                      <Label className={labelClass}>Адрес</Label>
                      <Input
                        value={rzData.address || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="Спортна зала „Енергетик“, Гълъбово"
                        className={inputClassRz}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className={labelClass}>Facebook Линк</Label>
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
                      <Label className={labelClass}>Instagram Линк</Label>
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
                      <Label className={labelClass}>YouTube Линк</Label>
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
                      Инвентар & Оборудване
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className={labelClass}>Брой Компресори</Label>
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
                        Приставки &quot;ТАЗ&quot;
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
                        Приставки &quot;КРАКА&quot;
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
                        Приставки &quot;РЪЦЕ&quot;
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
                      Работно Време
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
                        "Понеделник",
                        "Вторник",
                        "Сряда",
                        "Четвъртък",
                        "Петък",
                        "Събота",
                        "Неделя",
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
                            <Label
                              htmlFor={`rz-open-${day}`}
                              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                            >
                              {dayNames[i]}
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`rz-open-${day}`}
                              name={`rz-open-${day}`}
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
                              {daySched.isOpen ? "Отворено" : "Затворено"}
                            </span>
                          </div>
                          {daySched.isOpen && (
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <Input
                                id={`rz-time-open-${day}`}
                                name={`rz-time-open-${day}`}
                                aria-label={`${dayNames[i]} Open Time`}
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
                                id={`rz-time-close-${day}`}
                                name={`rz-time-close-${day}`}
                                aria-label={`${dayNames[i]} Close Time`}
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

                {/* Benefits / База */}
                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <CheckCircle2
                        className="h-5 w-5 text-[#00f2fe]"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        Предимства (Секция &quot;База&quot;)
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
                      Добави Предимство
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
                            placeholder="Напр. Специализирана зона за възстановяване..."
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
                        Няма въведени предимства.
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
                        Противопоказания
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
                      Добави Противопоказание
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
                          placeholder="Напр. Бременност, открити рани..."
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
                        Няма въведени противопоказания.
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
                        Често задавани въпроси (FAQ)
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => addFaq("recoveryzone")}
                      className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Добави Въпрос
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
                          <Label className={labelClass}>Въпрос</Label>
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
                            placeholder="Напр. Колко често мога да използвам Normatec?"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className={labelClass}>Отговор</Label>
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
                            placeholder="Отговор..."
                            className="w-full rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-light p-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[100px] resize-none"
                          />
                        </div>
                      </div>
                    ))}
                    {(!rzData.faqs || rzData.faqs.length === 0) && (
                      <p className="text-zinc-500 text-sm font-light">
                        Няма въведени въпроси.
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
                  <div className="h-40 w-40 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-none overflow-hidden transition-all group-hover:scale-105 relative">
                    {user?.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/logo.png"
                        alt="Club Logo"
                        fill
                        className="object-contain p-6 opacity-80"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white truncate px-2 w-full max-w-[250px]">
                      {user?.displayName ||
                        user?.email?.split("@")[0] ||
                        "Администратор"}
                    </h3>
                    <p className="text-[11px] text-primary font-medium uppercase tracking-widest mt-1">
                      Супер Потребител
                    </p>
                  </div>
                  <div className="w-full pt-8 space-y-6 border-t border-zinc-50 dark:border-zinc-900">
                    <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest">
                      <span className="text-zinc-400">Последен вход</span>
                      <span className="text-zinc-900 dark:text-white font-bold text-[13px] tracking-normal">
                        {user?.metadata?.lastSignInTime
                          ? new Date(
                              user.metadata.lastSignInTime
                            ).toLocaleString("bg-BG", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Неизвестно"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest">
                      <span className="text-zinc-400">Ниво на достъп</span>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold text-[12px] tracking-wider">
                        FULL ACCESS
                      </span>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-8 p-10 space-y-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Лична Информация
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Име
                      </Label>
                      <Input
                        defaultValue="Бадминтон клуб"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Фамилия
                      </Label>
                      <Input
                        defaultValue="Гълъбово"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Имейл Адрес
                      </Label>
                      <Input
                        defaultValue={user?.email || ""}
                        disabled
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </BentoCard>
              </div>
            </TabsContent>

            <TabsContent
              value="team"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 gap-6">
                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-6">
                    <Users className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Управление на Екипи
                    </h3>
                  </div>

                  <h4 className="text-xl font-light mt-8 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2 text-zinc-800 dark:text-zinc-200">
                    Бадминтон Клуб Гълъбово
                  </h4>
                  {/* Team (Therapists) Section */}
                  <div className="bg-zinc-50/30 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden mt-8">
                    <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                          Екип
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">
                          Добавете снимка, име, роля и описание. За снимки
                          можете да добавите файловете в папка
                          &quot;public/team&quot; и да напишете
                          &quot;/team/imeto.jpg&quot;
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => addTherapist("bkgalabovo")}
                        className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добави Член
                      </Button>
                    </div>
                    <div className="p-6 md:p-8 space-y-6">
                      <div className="mb-6">
                        <Label
                          htmlFor="bkg-team-intro"
                          className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                        >
                          Въведение към екипа (Team Intro)
                        </Label>
                        <Textarea
                          id="bkg-team-intro"
                          name="bkg-team-intro"
                          value={bkgData.teamIntro || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "bkgalabovo",
                              "teamIntro",
                              e.target.value
                            )
                          }
                          placeholder="Кратко описание на екипа..."
                          className="min-h-[100px] resize-y h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                        />
                      </div>
                      {bkgData.therapists?.map((therapist, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-4 p-6 bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl relative shadow-sm"
                        >
                          <Button
                            variant="ghost"
                            onClick={() => removeTherapist("bkgalabovo", index)}
                            className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label
                                htmlFor={`bkg-therapist-name-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Име
                              </Label>
                              <Input
                                id={`bkg-therapist-name-${index}`}
                                name={`bkg-therapist-name-${index}`}
                                value={therapist.name || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "bkgalabovo",
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Живко Иванов"
                                className={inputClassRz}
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`bkg-therapist-role-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Длъжност / Роля
                              </Label>
                              <Input
                                id={`bkg-therapist-role-${index}`}
                                name={`bkg-therapist-role-${index}`}
                                value={therapist.role || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "bkgalabovo",
                                    index,
                                    "role",
                                    e.target.value
                                  )
                                }
                                placeholder="Управител"
                                className={inputClassRz}
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`bkg-therapist-image-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Път към снимка
                              </Label>
                              <Input
                                id={`bkg-therapist-image-${index}`}
                                name={`bkg-therapist-image-${index}`}
                                value={therapist.image || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "bkgalabovo",
                                    index,
                                    "image",
                                    e.target.value
                                  )
                                }
                                placeholder="Напр. /team/jivko.jpg"
                                className={inputClassRz}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label
                                htmlFor={`bkg-therapist-bio-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Описание (Bio)
                              </Label>
                              <Textarea
                                id={`bkg-therapist-bio-${index}`}
                                name={`bkg-therapist-bio-${index}`}
                                value={therapist.bio || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "bkgalabovo",
                                    index,
                                    "bio",
                                    e.target.value
                                  )
                                }
                                placeholder="Живко Иванов отговаря за..."
                                className={`${inputClassRz} min-h-[100px] resize-y`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!bkgData.therapists ||
                        bkgData.therapists.length === 0) && (
                        <p className="text-zinc-500 text-sm font-light">
                          Няма добавени членове на екипа.
                        </p>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xl font-light mt-12 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2 text-zinc-800 dark:text-zinc-200">
                    Recovery Zone
                  </h4>
                  {/* Team (Therapists) Section */}
                  <div className="bg-zinc-50/30 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden mt-8">
                    <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                          Екип
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">
                          Добавете снимка, име, роля и описание. За снимки
                          можете да добавите файловете в папка
                          &quot;public/team&quot; и да напишете
                          &quot;/team/imeto.jpg&quot;
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => addTherapist("recoveryzone")}
                        className="h-10 rounded-xl px-4 text-xs font-medium uppercase tracking-widest"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добави Член
                      </Button>
                    </div>
                    <div className="p-6 md:p-8 space-y-6">
                      <div className="mb-6">
                        <Label
                          htmlFor="rz-team-intro"
                          className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                        >
                          Въведение към екипа (Team Intro)
                        </Label>
                        <Textarea
                          id="rz-team-intro"
                          name="rz-team-intro"
                          value={rzData.teamIntro || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "recoveryzone",
                              "teamIntro",
                              e.target.value
                            )
                          }
                          placeholder="Кратко описание на екипа..."
                          className="min-h-[100px] resize-y h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                        />
                      </div>
                      {rzData.therapists?.map((therapist, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-4 p-6 bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl relative shadow-sm"
                        >
                          <Button
                            variant="ghost"
                            onClick={() =>
                              removeTherapist("recoveryzone", index)
                            }
                            className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label
                                htmlFor={`rz-therapist-name-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Име
                              </Label>
                              <Input
                                id={`rz-therapist-name-${index}`}
                                name={`rz-therapist-name-${index}`}
                                value={therapist.name || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "recoveryzone",
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Живко Иванов"
                                className={inputClassRz}
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`rz-therapist-role-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Длъжност / Роля
                              </Label>
                              <Input
                                id={`rz-therapist-role-${index}`}
                                name={`rz-therapist-role-${index}`}
                                value={therapist.role || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "recoveryzone",
                                    index,
                                    "role",
                                    e.target.value
                                  )
                                }
                                placeholder="Управител"
                                className={inputClassRz}
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`rz-therapist-image-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Път към снимка
                              </Label>
                              <Input
                                id={`rz-therapist-image-${index}`}
                                name={`rz-therapist-image-${index}`}
                                value={therapist.image || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "recoveryzone",
                                    index,
                                    "image",
                                    e.target.value
                                  )
                                }
                                placeholder="Напр. /team/jivko.jpg"
                                className={inputClassRz}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label
                                htmlFor={`rz-therapist-bio-${index}`}
                                className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm font-medium"
                              >
                                Описание (Bio)
                              </Label>
                              <Textarea
                                id={`rz-therapist-bio-${index}`}
                                name={`rz-therapist-bio-${index}`}
                                value={therapist.bio || ""}
                                onChange={(e) =>
                                  handleTherapistChange(
                                    "recoveryzone",
                                    index,
                                    "bio",
                                    e.target.value
                                  )
                                }
                                placeholder="Живко Иванов отговаря за..."
                                className={`${inputClassRz} min-h-[100px] resize-y`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!rzData.therapists ||
                        rzData.therapists.length === 0) && (
                        <p className="text-zinc-500 text-sm font-light">
                          Няма добавени членове на екипа.
                        </p>
                      )}
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
                      Системна История (Одиторски дневник)
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
                    Опресни
                  </Button>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="overflow-x-auto w-full max-h-[600px] overflow-y-auto relative">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 sticky top-0 z-10 border-b border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <tr>
                          <th className="px-6 py-4 font-medium w-[20%]">
                            Дата / Време
                          </th>
                          <th className="px-6 py-4 font-medium w-[20%]">
                            Действие
                          </th>
                          <th className="px-6 py-4 font-medium w-[45%]">
                            Детайли
                          </th>
                          <th className="px-6 py-4 font-medium w-[15%]">
                            Потребител
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <Activity
                                  className="h-10 w-10 text-zinc-200 dark:text-zinc-800 mb-4"
                                  strokeWidth={1}
                                />
                                <span className="text-sm font-light text-zinc-500">
                                  {loadingLogs
                                    ? "Зареждане на дневника..."
                                    : "Няма намерени записи в историята."}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => {
                            const dateStr = new Date(
                              log.timestamp
                            ).toLocaleString("bg-BG");
                            const [datePart, timePart] = dateStr.includes(", ")
                              ? dateStr.split(", ")
                              : [dateStr, ""];
                            return (
                              <tr
                                key={log.id}
                                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-all group"
                              >
                                <td className="px-6 py-5 align-top">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                      {datePart}
                                    </span>
                                    {timePart && (
                                      <span className="text-xs font-light text-zinc-500 group-hover:text-primary transition-colors whitespace-nowrap">
                                        {timePart}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-5 align-top">
                                  <span className="inline-block px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider break-words max-w-full leading-relaxed">
                                    {log.action.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-6 py-5 align-top text-zinc-600 dark:text-zinc-400 font-light text-sm leading-relaxed">
                                  <div className="break-words max-w-full">
                                    {log.details}
                                  </div>
                                </td>
                                <td className="px-6 py-5 align-top">
                                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                    <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                      <User className="h-3.5 w-3.5 text-zinc-400" />
                                    </div>
                                    <span className="truncate max-w-[120px]">
                                      {log.userEmail.split("@")[0]}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
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
