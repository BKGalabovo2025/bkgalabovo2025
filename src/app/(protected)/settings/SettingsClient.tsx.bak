/* eslint-disable sonarjs/cognitive-complexity */
"use client";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  Activity,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { getAuditLogsAction } from "@/lib/actions/audit";
import { AuditLog } from "@/lib/audit-logger";
import { getFirebaseAuth } from "@/lib/firebase";
import { getAllSites, updateSite } from "@/services/site-service";
import { Site, Therapist } from "@/types/site.types";

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
      <div className="flex min-h-100 flex-col items-center justify-center space-y-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-light tracking-widest text-zinc-500 uppercase">
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
    <div className="space-y-8 pb-20 duration-500 animate-in fade-in">
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
          className="h-12 rounded-xl bg-primary px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-primary/90"
        >
          {isSaving ? "Запазване..." : "Запази промените"}
          {!isSaving && <Save className="ml-3 size-4" strokeWidth={1.5} />}
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="w-full">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="space-y-3 lg:w-72">
            <TabsList className="no-scrollbar flex h-auto w-full flex-nowrap justify-start gap-3 overflow-x-auto bg-transparent p-1 lg:flex-col lg:overflow-visible lg:p-0">
              <TabsTrigger
                value="general"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Settings className="mr-4 size-5" strokeWidth={1.5} /> Общи
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Palette className="mr-4 size-5" strokeWidth={1.5} /> Брандиране
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Shield className="mr-4 size-5" strokeWidth={1.5} /> Сигурност
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <User className="mr-4 size-5" strokeWidth={1.5} /> Личен Профил
              </TabsTrigger>

              <TabsTrigger
                value="recovery"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-[#00f2fe]/10 data-[state=active]:text-[#00f2fe] lg:w-full"
              >
                <Activity className="mr-4 size-5" strokeWidth={1.5} /> Зона
                Възстановяване
              </TabsTrigger>

              <TabsTrigger
                value="team"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Users className="mr-4 size-5" strokeWidth={1.5} /> Екип
              </TabsTrigger>

              <TabsTrigger
                value="audit"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:mt-8 lg:w-full"
              >
                <Clock className="mr-4 size-5" strokeWidth={1.5} /> Системна
                история
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-w-0 flex-1">
            <TabsContent
              value="general"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 gap-6">
                <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-2 flex items-center gap-4">
                    <Building2
                      className="size-5 text-primary"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Информация за Клуба
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                        <Mail className="mr-1 inline size-3" />
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
                        <Phone className="mr-1 inline size-3" />
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
                        <Globe className="mr-1 inline size-3" />
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
                        <MapPin className="mr-1 inline size-3" />
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
                  <div className="border-t border-zinc-50 pt-4 dark:border-zinc-900">
                    <p className="mb-6 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                      Социални мрежи
                    </p>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <InstagramIcon className="mr-1 inline size-3 text-pink-500" />
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
                          <YoutubeIcon className="mr-1 inline size-3 text-red-500" />
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
                          <FacebookIcon className="mr-1 inline size-3 text-blue-500" />
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
                          <Users className="mr-1 inline size-3 text-blue-400" />
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

                <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-2 flex items-center gap-4">
                    <Activity
                      className="size-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Информация за Зоната
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                        <Mail className="mr-1 inline size-3" />
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
                        <Phone className="mr-1 inline size-3" />
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
                        <Globe className="mr-1 inline size-3" />
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
                        <MapPin className="mr-1 inline size-3" />
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
                  <div className="border-t border-zinc-50 pt-4 dark:border-zinc-900">
                    <p className="mb-6 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                      Социални мрежи
                    </p>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className={labelClass}>
                          <InstagramIcon className="mr-1 inline size-3 text-pink-500" />
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
                          <FacebookIcon className="mr-1 inline size-3 text-blue-500" />
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
                          <YoutubeIcon className="mr-1 inline size-3 text-red-500" />
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                    <div className="mb-2 flex items-center gap-4">
                      <Globe
                        className="size-5 text-primary"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        Локализация
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className={labelClass}>Основна Валута</Label>
                        <div className="flex h-14 items-center rounded-xl border border-zinc-100 bg-zinc-50 px-5 font-light text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                          EUR (€)
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className={labelClass}>Часова Зона</Label>
                        <div className="flex h-14 items-center rounded-xl border border-zinc-100 bg-zinc-50 px-5 font-light text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                          UTC+2 (Europe/Sofia)
                        </div>
                      </div>
                    </div>
                  </BentoCard>
                  <BentoCard className="flex flex-col items-center justify-center space-y-6 border-zinc-100 bg-white p-10 text-center dark:border-zinc-900 dark:bg-zinc-950">
                    <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-primary/5 text-primary transition-all hover:scale-105">
                      <CheckCircle2 size={36} strokeWidth={1} />
                    </div>
                    <h4 className="text-xl font-light text-zinc-900 dark:text-white">
                      Системата е Оптимизирана
                    </h4>
                    <p className="max-w-50 text-sm leading-relaxed font-light text-zinc-400">
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <BentoCard className="space-y-10 border-zinc-100 bg-white p-10 md:col-span-8 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Palette
                      className="size-5 text-primary"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Визуална Идентичност - Бадминтон Клуб
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                        Лого на Клуба
                      </Label>
                      <div className="flex items-center gap-8 rounded-2xl border border-dashed border-zinc-100 bg-zinc-50/30 p-8 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <div className="flex size-28 items-center justify-center overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-none">
                          <Image
                            src="/icons/LOGO.jpg"
                            alt="BKG Logo"
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="h-12 rounded-xl border-zinc-200 bg-white px-6 text-[11px] font-medium tracking-widest uppercase dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <Camera className="mr-3 size-4" strokeWidth={1.5} />{" "}
                            Промени Лого
                          </Button>
                          <p className="text-[11px] font-light tracking-wide text-zinc-400 uppercase">
                            Препоръчителен размер: 512x512px (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                          Основен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="size-14 rounded-xl border-4 border-white bg-[#00AEEF] shadow-none dark:border-zinc-800" />
                          <Input
                            value={bkgData.primaryColor || "#00AEEF"}
                            onChange={(e) =>
                              handleInputChange(
                                "bkgalabovo",
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-center font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                          Акцентен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="size-14 rounded-xl border-4 border-white bg-zinc-900 shadow-none dark:border-zinc-800 dark:bg-white" />
                          <Input
                            value={bkgData.accentColor || "#000000"}
                            onChange={(e) =>
                              handleInputChange(
                                "bkgalabovo",
                                "accentColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-center font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="space-y-10 border-zinc-100 bg-white p-10 md:col-span-8 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Palette
                      className="size-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Визуална Идентичност - Recovery Zone
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                        Лого на Зоната
                      </Label>
                      <div className="flex items-center gap-8 rounded-2xl border border-dashed border-zinc-100 bg-zinc-50/30 p-8 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <div className="flex size-28 items-center justify-center overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-none">
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
                            className="h-12 rounded-xl border-zinc-200 bg-white px-6 text-[11px] font-medium tracking-widest uppercase dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <Camera className="mr-3 size-4" strokeWidth={1.5} />{" "}
                            Промени Лого
                          </Button>
                          <p className="text-[11px] font-light tracking-wide text-zinc-400 uppercase">
                            Препоръчителен размер: 512x512px (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                          Основен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="size-14 rounded-xl border-4 border-white bg-[#00f2fe] shadow-none dark:border-zinc-800" />
                          <Input
                            value={rzData.primaryColor || "#00f2fe"}
                            onChange={(e) =>
                              handleInputChange(
                                "recoveryzone",
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-center font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                          Акцентен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="size-14 rounded-xl border-4 border-white bg-zinc-900 shadow-none dark:border-zinc-800 dark:bg-white" />
                          <Input
                            value={rzData.accentColor || "#18181b"}
                            onChange={(e) =>
                              handleInputChange(
                                "recoveryzone",
                                "accentColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-center font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="flex flex-col justify-between border-none bg-zinc-950 p-10 text-white md:col-span-4 dark:bg-white dark:text-zinc-950">
                  <div className="space-y-6">
                    <h3 className="text-xl font-light tracking-widest uppercase">
                      Преглед
                    </h3>
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 dark:border-zinc-200 dark:bg-zinc-50">
                      <div className="h-2 w-16 rounded-full bg-primary" />
                      <div className="h-5 w-full rounded-full bg-white/10 dark:bg-zinc-100" />
                      <div className="h-5 w-2/3 rounded-full bg-white/10 dark:bg-zinc-100" />
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
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
              <BentoCard className="space-y-10 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                <div className="flex items-center gap-4">
                  <Lock className="size-5 text-primary" strokeWidth={1.5} />
                  <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                    Сигурност на Системата
                  </h3>
                </div>

                <div className="max-w-2xl space-y-10">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                      Смяна на Парола (Админ)
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                          Текуща Парола
                        </Label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 pr-12 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                        <div className="mt-1 flex justify-end">
                          <Button
                            type="button"
                            variant="link"
                            onClick={handleResetPassword}
                            disabled={isSendingReset}
                            className="h-auto p-0 text-[11px] font-light text-primary hover:text-primary/80"
                          >
                            Забравена текуща парола?
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                            Нова Парола
                          </Label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 pr-12 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              {showNewPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
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
                              className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 pr-12 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setShowRepeatPassword(!showRepeatPassword)
                              }
                              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              {showRepeatPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
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
                <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-6 flex items-center gap-4">
                    <Activity
                      className="size-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Обща информация за зоната
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-3 md:col-span-2">
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
                        className={`${inputClassRz} min-h-30 resize-y`}
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
                    <div className="space-y-3 md:col-span-2">
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

                <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-6 flex items-center gap-4">
                    <Activity
                      className="size-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Инвентар & Оборудване
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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

                <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-6 flex items-center gap-4">
                    <Clock
                      className="size-5 text-[#00f2fe]"
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
                          className="flex items-center gap-6 rounded-xl border border-zinc-100 bg-zinc-50/30 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
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
                            <span className="w-16 text-[10px] font-bold text-zinc-400 uppercase">
                              {daySched.isOpen ? "Отворено" : "Затворено"}
                            </span>
                          </div>
                          {daySched.isOpen && (
                            <div className="flex flex-1 items-center justify-end gap-3">
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
                                className="h-10 w-32"
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
                                className="h-10 w-32"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </BentoCard>

                {/* Benefits / База */}
                <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle2
                        className="size-5 text-[#00f2fe]"
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
                      className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
                    >
                      <Plus className="mr-2 size-4" />
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
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                    {(!rzData.benefits || rzData.benefits.length === 0) && (
                      <p className="text-sm font-light text-zinc-500">
                        Няма въведени предимства.
                      </p>
                    )}
                  </div>
                </BentoCard>

                {/* Contraindications */}
                <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Shield
                        className="size-5 text-red-500"
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
                      className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
                    >
                      <Plus className="mr-2 size-4" />
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
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    {(!rzData.contraindications ||
                      rzData.contraindications.length === 0) && (
                      <p className="text-sm font-light text-zinc-500">
                        Няма въведени противопоказания.
                      </p>
                    )}
                  </div>
                </BentoCard>

                {/* FAQs */}
                <BentoCard className="mt-6 space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Settings
                        className="size-5 text-primary"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                        Често задавани въпроси (FAQ)
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => addFaq("recoveryzone")}
                      className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
                    >
                      <Plus className="mr-2 size-4" />
                      Добави Въпрос
                    </Button>
                  </div>
                  <div className="space-y-8">
                    {rzData.faqs?.map((faq, index) => (
                      <div
                        key={index}
                        className="relative space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => removeFaq("recoveryzone", index)}
                          className="absolute top-4 right-4 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
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
                            className="min-h-25 w-full resize-none rounded-xl border border-zinc-100 bg-white p-4 text-sm font-light focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                      </div>
                    ))}
                    {(!rzData.faqs || rzData.faqs.length === 0) && (
                      <p className="text-sm font-light text-zinc-500">
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <BentoCard className="flex flex-col items-center space-y-6 border border-zinc-100 bg-white p-10 text-center md:col-span-4 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-full border border-zinc-100 bg-zinc-50 shadow-none transition-all group-hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900">
                    {user?.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/icons/LOGO.jpg"
                        alt="Club Logo"
                        fill
                        className="object-contain p-6 opacity-80"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="w-full max-w-[250px] truncate px-2 text-2xl font-light text-zinc-900 dark:text-white">
                      {user?.displayName ||
                        user?.email?.split("@")[0] ||
                        "Администратор"}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium tracking-widest text-primary uppercase">
                      Супер Потребител
                    </p>
                  </div>
                  <div className="w-full space-y-6 border-t border-zinc-50 pt-8 dark:border-zinc-900">
                    <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase">
                      <span className="text-zinc-400">Последен вход</span>
                      <span className="text-[13px] font-bold tracking-normal text-zinc-900 dark:text-white">
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
                    <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase">
                      <span className="text-zinc-400">Ниво на достъп</span>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold tracking-wider text-primary">
                        FULL ACCESS
                      </span>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="space-y-10 border border-zinc-100 bg-white p-10 md:col-span-8 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Mail className="size-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Лична Информация
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                        Име
                      </Label>
                      <Input
                        defaultValue="Бадминтон клуб"
                        className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                        Фамилия
                      </Label>
                      <Input
                        defaultValue="Гълъбово"
                        className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                        Имейл Адрес
                      </Label>
                      <Input
                        defaultValue={user?.email || ""}
                        disabled
                        className="h-14 cursor-not-allowed rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light opacity-60 shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
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
                <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-6 flex items-center gap-4">
                    <Users className="size-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Управление на Екипи
                    </h3>
                  </div>

                  <h4 className="mt-8 mb-4 border-b border-zinc-100 pb-2 text-xl font-light text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                    Бадминтон Клуб Гълъбово
                  </h4>
                  {/* Team (Therapists) Section */}
                  <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <div className="flex items-center justify-between border-b border-zinc-100 p-6 md:p-8 dark:border-zinc-800">
                      <div>
                        <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                          Екип
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          Добавете снимка, име, роля и описание. За снимки
                          можете да добавите файловете в папка
                          &quot;public/team&quot; и да напишете
                          &quot;/team/imeto.jpg&quot;
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => addTherapist("bkgalabovo")}
                        className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
                      >
                        <Plus className="mr-2 size-4" />
                        Добави Член
                      </Button>
                    </div>
                    <div className="space-y-6 p-6 md:p-8">
                      <div className="mb-6">
                        <Label
                          htmlFor="bkg-team-intro"
                          className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                          className="h-14 min-h-25 resize-y rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                        />
                      </div>
                      {bkgData.therapists?.map((therapist, index) => (
                        <div
                          key={index}
                          className="relative flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-black/50"
                        >
                          <Button
                            variant="ghost"
                            onClick={() => removeTherapist("bkgalabovo", index)}
                            className="absolute top-4 right-4 size-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <Label
                                htmlFor={`bkg-therapist-name-${index}`}
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className={`${inputClassRz} min-h-25 resize-y`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!bkgData.therapists ||
                        bkgData.therapists.length === 0) && (
                        <p className="text-sm font-light text-zinc-500">
                          Няма добавени членове на екипа.
                        </p>
                      )}
                    </div>
                  </div>

                  <h4 className="mt-12 mb-4 border-b border-zinc-100 pb-2 text-xl font-light text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                    Recovery Zone
                  </h4>
                  {/* Team (Therapists) Section */}
                  <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <div className="flex items-center justify-between border-b border-zinc-100 p-6 md:p-8 dark:border-zinc-800">
                      <div>
                        <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                          Екип
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          Добавете снимка, име, роля и описание. За снимки
                          можете да добавите файловете в папка
                          &quot;public/team&quot; и да напишете
                          &quot;/team/imeto.jpg&quot;
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => addTherapist("recoveryzone")}
                        className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
                      >
                        <Plus className="mr-2 size-4" />
                        Добави Член
                      </Button>
                    </div>
                    <div className="space-y-6 p-6 md:p-8">
                      <div className="mb-6">
                        <Label
                          htmlFor="rz-team-intro"
                          className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                          className="h-14 min-h-25 resize-y rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                        />
                      </div>
                      {rzData.therapists?.map((therapist, index) => (
                        <div
                          key={index}
                          className="relative flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-black/50"
                        >
                          <Button
                            variant="ghost"
                            onClick={() =>
                              removeTherapist("recoveryzone", index)
                            }
                            className="absolute top-4 right-4 size-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <Label
                                htmlFor={`rz-therapist-name-${index}`}
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                                className={`${inputClassRz} min-h-25 resize-y`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!rzData.therapists ||
                        rzData.therapists.length === 0) && (
                        <p className="text-sm font-light text-zinc-500">
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
              <BentoCard className="min-h-150 space-y-8 border border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Clock className="size-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Системна История (Одиторски дневник)
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchLogs}
                    disabled={loadingLogs}
                    className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
                  >
                    {loadingLogs ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    Опресни
                  </Button>
                </div>

                <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="relative max-h-150 w-full overflow-auto">
                    <table className="w-full min-w-200 border-collapse text-left">
                      <thead className="sticky top-0 z-10 border-b border-zinc-100 bg-zinc-50/95 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                        <tr>
                          <th className="w-[20%] px-6 py-4 font-medium">
                            Дата / Време
                          </th>
                          <th className="w-[20%] px-6 py-4 font-medium">
                            Действие
                          </th>
                          <th className="w-[45%] px-6 py-4 font-medium">
                            Детайли
                          </th>
                          <th className="w-[15%] px-6 py-4 font-medium">
                            Потребител
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <Activity
                                  className="mb-4 size-10 text-zinc-200 dark:text-zinc-800"
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
                                className="group transition-all hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50"
                              >
                                <td className="px-6 py-5 align-top">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                                      {datePart}
                                    </span>
                                    {timePart && (
                                      <span className="text-xs font-light whitespace-nowrap text-zinc-500 transition-colors group-hover:text-primary">
                                        {timePart}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-5 align-top">
                                  <span className="inline-block max-w-full rounded-md bg-zinc-100 px-2.5 py-1 text-[10px] leading-relaxed font-bold tracking-wider break-words text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
                                    {log.action.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-6 py-5 align-top text-sm leading-relaxed font-light text-zinc-600 dark:text-zinc-400">
                                  <div className="max-w-full break-words">
                                    {log.details}
                                  </div>
                                </td>
                                <td className="px-6 py-5 align-top">
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                      <User className="size-3.5 text-zinc-400" />
                                    </div>
                                    <span className="max-w-30 truncate">
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
