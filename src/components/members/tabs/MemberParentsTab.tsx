"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  HeartHandshake,
  KeyRound,
  Loader2,
  Mail,
  Pause,
  Phone,
  Play,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isParentOnline,
  useParentPortalAdmin,
} from "@/hooks/useParentPortalAdmin";
import {
  createParentUserManuallyAction,
  deleteParentUserAction,
  resetParentPasswordByAdminAction,
  toggleParentUserStatusAction,
  updateParentMemberPermissionsAction,
} from "@/lib/actions/parent-portal";
import { formatPhoneDisplay } from "@/lib/phone-utils";
import { Member } from "@/types";
import {
  DefaultParentMemberPermissions,
  ParentMemberPermissions,
  ParentRole,
  ParentUser,
} from "@/types/parent-portal.types";

interface MemberParentsTabProps {
  member: Member;
  onUpdate?: () => void;
}

const PERMISSION_FIELDS: {
  key: keyof ParentMemberPermissions;
  label: string;
}[] = [
  { key: "showBirthDate", label: "Дата на раждане" },
  { key: "showAgeGroup", label: "Възрастова група" },
  { key: "showPhone", label: "Телефон на детето" },
  { key: "showAddress", label: "Адрес на живеене" },
  { key: "showSchool", label: "Учебно заведение" },
  { key: "showHeight", label: "Ръст (см)" },
  { key: "showWeight", label: "Тегло (кг)" },
  { key: "showDominantHand", label: "Доминантна ръка" },
  { key: "showApparelSize", label: "Размер на екип" },
  { key: "showEmergencyContact", label: "Спешен телефон за връзка" },
  { key: "showHealthNotes", label: "Здравни и медицински бележки" },
  { key: "showAttendance", label: "Месечни присъствия (Календар)" },
  { key: "showStatusBadge", label: "Клубна значка / Статус" },
  { key: "showNextTrainingCard", label: "Карта за следваща тренировка" },
];

export function MemberParentsTab({ member, onUpdate }: MemberParentsTabProps) {
  const { parents, requests, activityLogs, refetch } = useParentPortalAdmin();

  // Linked parents for this specific child
  const linkedParents = parents.filter((p) =>
    (p.linkedMemberIds || []).includes(member.id)
  );

  // Pending requests for this specific child
  const pendingRequests = requests.filter(
    (r) =>
      r.status === "pending" &&
      (r.matchedMemberId === member.id ||
        r.childFullName.toLowerCase().trim() ===
          `${member.firstName} ${member.lastName}`.toLowerCase().trim())
  );

  // Local state for permissions per parent
  const [localPermissions, setLocalPermissions] = useState<
    Record<string, ParentMemberPermissions>
  >({});
  const [isSavingPerms, setIsSavingPerms] = useState<Record<string, boolean>>(
    {}
  );

  // Manual Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [parentName, setParentName] = useState(
    member.parentName || member.motherName || member.fatherName || ""
  );
  const [parentPhone, setParentPhone] = useState(
    member.parentPhone || member.motherPhone || member.fatherPhone || ""
  );
  const [parentEmail, setParentEmail] = useState(member.parentEmail || "");
  const [parentRole, setParentRole] = useState<ParentRole>("mother");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [expandedHistoryParentId, setExpandedHistoryParentId] = useState<
    string | null
  >(null);

  // Credentials Success Modal (Permanent, not disappearing toast)
  const [credentialsModal, setCredentialsModal] = useState<{
    open: boolean;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    tempPassword: string;
    childName: string;
    title: string;
    emailSent?: boolean;
    copiedPassword?: boolean;
    copiedMessage?: boolean;
  }>({
    open: false,
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    tempPassword: "",
    childName: "",
    title: "",
    emailSent: undefined,
  });

  const handleTogglePermission = (
    parentId: string,
    field: keyof ParentMemberPermissions
  ) => {
    setLocalPermissions((prev) => {
      const parentUser = linkedParents.find((p) => p.id === parentId);
      const current =
        prev[parentId] ||
        parentUser?.permissionsPerMember?.[member.id] ||
        DefaultParentMemberPermissions;
      return {
        ...prev,
        [parentId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  const handleSavePermissions = async (parentId: string) => {
    const parentUser = linkedParents.find((p) => p.id === parentId);
    const perms =
      localPermissions[parentId] ||
      parentUser?.permissionsPerMember?.[member.id] ||
      DefaultParentMemberPermissions;
    setIsSavingPerms((prev) => ({ ...prev, [parentId]: true }));
    try {
      const res = await updateParentMemberPermissionsAction(
        parentId,
        member.id,
        perms
      );
      if (!res.success) {
        toast.error(res.error || "Грешка при запазване.");
      } else {
        toast.success("Правата за видимост са обновени успешно!");
        refetch();
        onUpdate?.();
      }
    } catch {
      toast.error("Системна грешка.");
    } finally {
      setIsSavingPerms((prev) => ({ ...prev, [parentId]: false }));
    }
  };

  const handleToggleStatus = async (parent: ParentUser) => {
    const nextStatus = parent.status === "active" ? "suspended" : "active";
    const res = await toggleParentUserStatusAction(parent.id, nextStatus);
    if (!res.success) {
      toast.error(res.error || "Грешка при промяна на статуса.");
    } else {
      toast.success(
        nextStatus === "active"
          ? `Профилът на ${parent.name} е активиран.`
          : `Профилът на ${parent.name} е временно спрян.`
      );
      refetch();
    }
  };

  const handleResetPassword = async (parent: ParentUser) => {
    if (
      !confirm(
        `Да се генерира ли нова временна парола за ${parent.name}? Ще бъде изпратен имейл до родителя и до клубната поща.`
      )
    ) {
      return;
    }
    const res = await resetParentPasswordByAdminAction(parent.id);
    if (!res.success) {
      toast.error(res.error || "Грешка при генериране на нова парола.");
    } else {
      setCredentialsModal({
        open: true,
        parentName: parent.name,
        parentPhone: parent.phone,
        parentEmail: parent.email,
        tempPassword: res.tempPassword || "",
        childName: `${member.firstName} ${member.lastName}`,
        title: "Генерирана е нова парола за родителя!",
        emailSent: res.emailSent,
      });
      if (res.emailSent) {
        toast.success(
          `Нова парола е генерирана! Изпратен е имейл до ${parent.email} и bkgalabovo2014@gmail.com.`
        );
      } else {
        toast.warning(
          `Нова парола е генерирана, но имейлът не можа да бъде доставен от Gmail (проверете паролата за приложение в конфигурацията).`
        );
      }
      refetch();
    }
  };

  const handleDeleteParent = async (parent: ParentUser) => {
    if (
      !confirm(
        `Сигурни ли сте, че искате да премахнете профила на ${parent.name}?`
      )
    ) {
      return;
    }
    const res = await deleteParentUserAction(parent.id);
    if (!res.success) {
      toast.error(res.error || "Грешка.");
    } else {
      toast.success("Родителският профил беше изтрит.");
      refetch();
    }
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !parentPhone || !parentEmail) {
      toast.error("Попълнете всички задължителни полета.");
      return;
    }

    setIsSubmittingManual(true);
    try {
      const res = await createParentUserManuallyAction({
        parentName,
        parentPhone,
        parentEmail,
        parentRole,
        memberId: member.id,
      });

      if (!res.success) {
        toast.error(res.error || "Грешка.");
      } else {
        setAddModalOpen(false);
        setCredentialsModal({
          open: true,
          parentName,
          parentPhone,
          parentEmail,
          tempPassword: res.tempPassword || "",
          childName: `${member.firstName} ${member.lastName}`,
          title: "Родителският профил е създаден успешно!",
          emailSent: res.emailSent,
        });
        if (res.emailSent) {
          toast.success(
            `Родителят е създаден! Изпратен е имейл до ${parentEmail} и до клубната поща.`
          );
        } else {
          toast.warning(
            `Родителят е създаден! Имейлът не можа да бъде доставен автоматично (Gmail отказа паролата за приложение). Използвайте бутона за копиране на паролата.`
          );
        }
        refetch();
        onUpdate?.();
      }
    } catch {
      toast.error("Системна грешка.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div>
          <h3 className="text-sm font-bold uppercase text-zinc-900 dark:text-white">
            Свързани родители за {member.firstName} {member.lastName}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Управлявайте кои родители имат достъп и какви данни от картона могат
            да виждат.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-500"
        >
          <UserPlus size={14} className="mr-1.5" />
          <span>+ Добави родител</span>
        </Button>
      </div>

      {/* Pending request alert */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-50/70 p-4 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>
                Има {pendingRequests.length} чакаща заявка за родителски достъп
                за това дете!
              </span>
            </div>
            <Link
              href="/parents"
              className="text-xs font-bold text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              Към раздел „Родителски достъп“ ↗
            </Link>
          </div>
        </div>
      )}

      {/* Linked parents list */}
      {linkedParents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
          <HeartHandshake size={36} className="mx-auto text-zinc-400" />
          <h4 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
            Все още няма регистриран родител за този член
          </h4>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            Родителят може да подаде заявка за регистрация през сайта на клуба
            или можете да го добавите директно с бутона по-горе.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {linkedParents.map((parent) => {
            const roleLabel =
              parent.parentRole === "mother"
                ? "Майка"
                : parent.parentRole === "father"
                  ? "Баща"
                  : "Настойник";

            const perms =
              localPermissions[parent.id] ||
              parent.permissionsPerMember?.[member.id] ||
              DefaultParentMemberPermissions;

            return (
              <div
                key={parent.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                {/* Parent Profile Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black text-zinc-900 dark:text-white">
                        {parent.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-bold"
                      >
                        {roleLabel}
                      </Badge>
                      <Badge
                        variant={
                          parent.status === "active" ? "default" : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {parent.status === "active"
                          ? "Активен"
                          : "Временно спрян"}
                      </Badge>

                      {isParentOnline(parent) ? (
                        <Badge className="bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1.5 animate-pulse">
                          <span className="size-1.5 rounded-full bg-white" />
                          🟢 На линия
                        </Badge>
                      ) : parent.lastLoginAt ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-50 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        >
                          ✓ Влизал на:{" "}
                          {new Date(parent.lastLoginAt).toLocaleDateString(
                            "bg-BG"
                          )}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-50 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        >
                          ⏳ Очаква първи вход
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        <a
                          href={`tel:${parent.phone}`}
                          className="hover:underline"
                        >
                          {formatPhoneDisplay(parent.phone)}
                        </a>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        <a
                          href={`mailto:${parent.email}`}
                          className="hover:underline"
                        >
                          {parent.email}
                        </a>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(parent)}
                      className="rounded-xl text-xs h-8"
                    >
                      {parent.status === "active" ? (
                        <>
                          <Pause size={12} className="mr-1 text-amber-500" />
                          <span>Спри</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} className="mr-1 text-emerald-500" />
                          <span>Активирай</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(parent)}
                      className="rounded-xl text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-400"
                      title="Генерирай и изпрати нови данни за вход"
                    >
                      <KeyRound size={12} className="mr-1 text-blue-500" />
                      <span>Данни за вход / Нова парола</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteParent(parent)}
                      className="rounded-xl text-xs h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Permissions Checklist (Вариант Б) */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Видимост на данни за това дете (Всичко немаркирано е
                      скрито):
                    </Label>
                    <Button
                      size="sm"
                      disabled={isSavingPerms[parent.id]}
                      onClick={() => handleSavePermissions(parent.id)}
                      className="rounded-xl bg-blue-600 text-white font-semibold text-xs h-8 hover:bg-blue-500"
                    >
                      {isSavingPerms[parent.id] ? (
                        <>
                          <Loader2 size={12} className="mr-1 animate-spin" />
                          <span>Запис...</span>
                        </>
                      ) : (
                        <>
                          <Check size={12} className="mr-1" />
                          <span>Запази права</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 text-xs dark:border-zinc-800/60 dark:bg-zinc-950/40">
                    {PERMISSION_FIELDS.map(({ key, label }) => {
                      const isChecked = Boolean(perms[key]);
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleTogglePermission(parent.id, key)
                            }
                            className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={isChecked ? "font-semibold" : ""}>
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Expandable Activity / View History for this child */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistoryParentId((prev) =>
                          prev === parent.id ? null : parent.id
                        )
                      }
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
                    >
                      <Eye size={13} className="text-blue-500" />
                      <span>
                        История на прегледите на родителя (
                        {
                          (activityLogs || []).filter(
                            (l) => l.parentUserId === parent.id
                          ).length
                        }
                        )
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {expandedHistoryParentId === parent.id
                          ? "▲ Скрий"
                          : "▼ Виж какво е отварял"}
                      </span>
                    </button>

                    {isParentOnline(parent) && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        На линия: {parent.lastAction || "В портала"}
                      </span>
                    )}
                  </div>

                  {expandedHistoryParentId === parent.id && (
                    <div className="mt-2.5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-xs dark:border-zinc-800/60 dark:bg-zinc-950/40">
                      {(() => {
                        const logs = (activityLogs || []).filter(
                          (l) => l.parentUserId === parent.id
                        );
                        if (logs.length === 0) {
                          return (
                            <p className="text-zinc-400 text-center py-2 text-[11px]">
                              Все още няма регистрирани прегледи от този
                              родител.
                            </p>
                          );
                        }
                        return (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {logs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 border border-zinc-100 shadow-2xs dark:bg-zinc-900 dark:border-zinc-800"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-500 font-bold text-[11px]">
                                    👁️ {log.actionTitle}
                                  </span>
                                  {log.details && (
                                    <span className="text-zinc-500 text-[10px]">
                                      ({log.details})
                                    </span>
                                  )}
                                </div>
                                <span className="text-zinc-400 text-[10px] shrink-0">
                                  {new Date(log.timestamp).toLocaleDateString(
                                    "bg-BG",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}{" "}
                                  ч.
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Parent Modal */}
      {addModalOpen && (
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                Добавяне на родител за {member.firstName}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Въведете данни за родителя. Системата ще създаде профил и ще му
                изпрати имейл с данни за достъп.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleManualAddSubmit} className="space-y-3.5 py-2">
              <div>
                <Label
                  htmlFor="manual-parent-name"
                  className="text-xs font-semibold"
                >
                  Име и фамилия *
                </Label>
                <Input
                  id="manual-parent-name"
                  name="parentName"
                  autoComplete="name"
                  required
                  placeholder="напр. Мария Иванова"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label
                    htmlFor="manual-parent-phone"
                    className="text-xs font-semibold"
                  >
                    Телефон *
                  </Label>
                  <Input
                    id="manual-parent-phone"
                    name="parentPhone"
                    autoComplete="tel"
                    required
                    placeholder="0888 123 456"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="manual-parent-role"
                    className="text-xs font-semibold"
                  >
                    Роля *
                  </Label>
                  <select
                    id="manual-parent-role"
                    name="parentRole"
                    value={parentRole}
                    onChange={(e) =>
                      setParentRole(e.target.value as ParentRole)
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="mother">Майка</option>
                    <option value="father">Баща</option>
                    <option value="guardian">Настойник</option>
                  </select>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="manual-parent-email"
                  className="text-xs font-semibold"
                >
                  Имейл адрес *
                </Label>
                <Input
                  id="manual-parent-email"
                  name="parentEmail"
                  autoComplete="email"
                  type="email"
                  required
                  placeholder="roditel@email.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl"
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingManual}
                  className="rounded-xl bg-blue-600 text-white hover:bg-blue-500"
                >
                  {isSubmittingManual ? "Създаване..." : "Създай родител"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Permanent Credentials Success Modal */}
      {credentialsModal.open && (
        <Dialog
          open={credentialsModal.open}
          onOpenChange={(open) =>
            setCredentialsModal((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <DialogTitle className="text-center text-lg font-black uppercase text-zinc-900 dark:text-white pt-2">
                {credentialsModal.title || "Данни за вход в Родителския портал"}
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-zinc-500">
                За състезателя{" "}
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {credentialsModal.childName}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Notification Banner */}
              {credentialsModal.emailSent ? (
                <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <Mail
                    size={16}
                    className="shrink-0 text-emerald-600 mt-0.5"
                  />
                  <div className="leading-relaxed">
                    Имейл с инструкции и линк за вход беше изпратен на{" "}
                    <strong>{credentialsModal.parentEmail}</strong>, както и
                    копие на клубната поща{" "}
                    <strong>bkgalabovo2014@gmail.com</strong>.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-50/80 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle
                    size={16}
                    className="shrink-0 text-amber-600 mt-0.5"
                  />
                  <div className="leading-relaxed">
                    <strong>Внимание:</strong> Имейлът не можа да бъде изпратен
                    автоматично (Gmail отхвърли автентикацията на{" "}
                    <strong>bkgalabovo2014@gmail.com</strong> – необходима е
                    валидна парола за приложение в Google).
                    <div className="mt-1 font-medium text-amber-800 dark:text-amber-200">
                      Профилът е създаден успешно в системата! Използвайте
                      бутона <strong>„Копирай съобщение за Viber / SMS“</strong>{" "}
                      по-долу, за да изпратите данните за вход на родителя.
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials Card */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-3">
                <div className="text-xs space-y-1.5 text-zinc-700 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Родител:</span>
                    <span className="font-bold">
                      {credentialsModal.parentName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Потребител (вход с):</span>
                    <span className="font-mono font-semibold">
                      {credentialsModal.parentPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Имейл:</span>
                    <span className="font-medium">
                      {credentialsModal.parentEmail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Линк за вход:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      bkgalabovo2025.vercel.app/club/parents/login
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1.5">
                    Временна парола:
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-blue-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs">
                    <span className="font-mono text-lg font-black tracking-widest text-blue-700 dark:text-blue-400 select-all">
                      {credentialsModal.tempPassword}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          credentialsModal.tempPassword
                        );
                        setCredentialsModal((prev) => ({
                          ...prev,
                          copiedPassword: true,
                        }));
                        toast.success("Паролата е копирана!");
                        setTimeout(() => {
                          setCredentialsModal((prev) => ({
                            ...prev,
                            copiedPassword: false,
                          }));
                        }, 2500);
                      }}
                      className="h-8 px-2.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                      {credentialsModal.copiedPassword ? (
                        <>
                          <Check size={14} className="mr-1 text-emerald-600" />
                          <span>Копирана!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="mr-1" />
                          <span>Копирай</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Viber / SMS share */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const siteUrl = "https://bkgalabovo2025.vercel.app";
                    const message = `Здравейте, ${credentialsModal.parentName}!
Вашият профил в Родителския портал на БК „Гълъбово“ за ${credentialsModal.childName} е активен:
🌐 Вход: ${siteUrl}/club/parents/login
👤 Потребител: ${credentialsModal.parentPhone} (или ${credentialsModal.parentEmail})
🔑 Временна парола: ${credentialsModal.tempPassword}

При първия вход можете да промените паролата си с лична от настройките.`;
                    navigator.clipboard.writeText(message);
                    setCredentialsModal((prev) => ({
                      ...prev,
                      copiedMessage: true,
                    }));
                    toast.success(
                      "Съобщението за Viber/SMS е копирано в клипборда!"
                    );
                    setTimeout(() => {
                      setCredentialsModal((prev) => ({
                        ...prev,
                        copiedMessage: false,
                      }));
                    }, 2500);
                  }}
                  className="w-full rounded-xl border-zinc-200 text-xs font-bold py-2.5 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  {credentialsModal.copiedMessage ? (
                    <>
                      <Check size={14} className="mr-1.5 text-emerald-600" />
                      <span>Съобщението е копирано!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="mr-1.5" />
                      <span>📋 Копирай съобщение за Viber / SMS</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() =>
                  setCredentialsModal((prev) => ({ ...prev, open: false }))
                }
                className="w-full rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 py-2.5"
              >
                Готово / Затвори
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
