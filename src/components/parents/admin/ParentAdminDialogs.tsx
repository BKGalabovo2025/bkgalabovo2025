"use client";

import { Check, CheckCircle2, Copy } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { IndividualParentCallDialog } from "@/components/parents/IndividualParentCallDialog";
import { IndividualParentEmailDialog } from "@/components/parents/IndividualParentEmailDialog";
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
  ParentMemberPermissions,
  ParentRole,
} from "@/types/parent-portal.types";

import { useParentAdminContext } from "./ParentAdminContext";

export function ParentAdminDialogs() {
  const {
    callingParent,
    setCallingParent,
    emailingParent,
    setEmailingParent,
    getChildrenForParent,
    refetch,
    members,
    parents,

    // Approve Dialog
    approveDialogReq,
    setApproveDialogReq,
    selectedChildId,
    setSelectedChildId,
    permissionsState,
    setPermissionsState,
    isSubmittingApprove,
    handleConfirmApprove,

    // Reject Dialog
    rejectDialogReq,
    setRejectDialogReq,
    rejectReason,
    setRejectReason,
    isSubmittingReject,
    handleConfirmReject,

    // Manual Add
    manualAddOpen,
    setManualAddOpen,
    manualName,
    setManualName,
    manualPhone,
    setManualPhone,
    manualEmail,
    setManualEmail,
    manualRole,
    setManualRole,
    manualMemberId,
    setManualMemberId,
    isSubmittingManual,
    handleManualAddSubmit,

    // Edit Permissions
    editPermParent,
    setEditPermParent,
    editPermValues,
    setEditPermValues,
    isSubmittingPerms,
    handleSavePerms,

    // Absence Reply
    absenceReplyId,
    setAbsenceReplyId,
    absenceReplyText,
    setAbsenceReplyText,
    isReplyingAbsence,
    handleConfirmAbsenceSeen,

    // Delete confirmation
    deleteConfirmUser,
    setDeleteConfirmUser,
    isDeletingUser,
    handleConfirmDelete,

    // Data corrections dialogs
    approveCorrectionReq,
    setApproveCorrectionReq,
    isSubmittingApproveCorrection,
    handleConfirmApproveCorrection,

    rejectCorrectionReq,
    setRejectCorrectionReq,
    rejectCorrectionComment,
    setRejectCorrectionComment,
    isSubmittingRejectCorrection,
    handleConfirmRejectCorrection,

    // Credentials Modal
    credentialsModal,
    setCredentialsModal,

    // Linking Child Dialog
    linkingParentId,
    setLinkingParentId,
    selectedChildToLink,
    setSelectedChildToLink,
    isLinkingChild,
    handleLinkChild,
  } = useParentAdminContext();

  return (
    <>
      {/* Individual Parent Call Dialog */}
      <IndividualParentCallDialog
        parent={callingParent}
        childrenList={getChildrenForParent(callingParent)}
        isOpen={Boolean(callingParent)}
        onClose={() => setCallingParent(null)}
        onSuccess={() => refetch()}
      />

      {/* Individual Parent Email Dialog */}
      <IndividualParentEmailDialog
        parent={emailingParent}
        childrenList={getChildrenForParent(emailingParent)}
        isOpen={Boolean(emailingParent)}
        onClose={() => setEmailingParent(null)}
        onSuccess={() => refetch()}
      />

      {/* DIALOG: LINK CHILD */}
      {linkingParentId &&
        (() => {
          const linkingParent = parents.find((p) => p.id === linkingParentId);
          const availableMembers = members.filter(
            (m) => !(linkingParent?.linkedMemberIds || []).includes(m.id)
          );
          return (
            <Dialog
              open={Boolean(linkingParentId)}
              onOpenChange={(open) => !open && setLinkingParentId(null)}
            >
              <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                    Свързване на дете към родител
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500">
                    Изберете състезател от картотеката, за да го свържете към{" "}
                    {linkingParent ? (
                      <strong>{linkingParent.name}</strong>
                    ) : (
                      "този профил"
                    )}
                    .
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                  <Label className="text-xs font-semibold">
                    Изберете дете:
                  </Label>
                  <select
                    value={selectedChildToLink}
                    onChange={(e) => setSelectedChildToLink(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="">-- Изберете състезател --</option>
                    {availableMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.dateOfBirth ? `(${m.dateOfBirth})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkingParentId(null)}
                    className="rounded-xl"
                  >
                    Отказ
                  </Button>
                  <Button
                    size="sm"
                    disabled={isLinkingChild || !selectedChildToLink}
                    onClick={() => handleLinkChild(linkingParentId)}
                    className="rounded-xl bg-blue-600 text-white hover:bg-blue-500"
                  >
                    {isLinkingChild ? "Свързване..." : "Свържи детето"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })()}

      {/* DIALOG 1: APPROVE REQUEST */}
      {approveDialogReq && (
        <Dialog
          open={Boolean(approveDialogReq)}
          onOpenChange={(open) => !open && setApproveDialogReq(null)}
        >
          <DialogContent className="max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                Одобрение на родителски достъп
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Потвърдете свързването на{" "}
                <strong>{approveDialogReq.parentName}</strong> към досието на
                детето.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label
                  htmlFor="admin-approve-child-id"
                  className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400"
                >
                  Изберете член (дете) от картотеката:
                </Label>
                <select
                  id="admin-approve-child-id"
                  name="childId"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                  <option value="">-- Изберете дете --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} {m.dateOfBirth ? `(${m.dateOfBirth})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-3 text-xs text-blue-900 dark:bg-blue-950/20 dark:text-blue-300">
                <p className="font-semibold">Автоматично попълване:</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  При одобрение телефонът ({approveDialogReq.parentPhone}) и
                  имейлът ({approveDialogReq.parentEmail}) ще се запишат в
                  картона на детето в графите за{" "}
                  <strong>
                    {approveDialogReq.parentRole === "mother"
                      ? "Майка"
                      : approveDialogReq.parentRole === "father"
                        ? "Баща"
                        : "Родител"}
                  </strong>
                  .
                </p>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                  Права за видимост на данни за това дете:
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                  {[
                    { key: "showBirthDate", label: "Дата на раждане" },
                    { key: "showAgeGroup", label: "Възрастова група" },
                    { key: "showPhone", label: "Телефон на детето" },
                    { key: "showAddress", label: "Адрес на живеене" },
                    { key: "showSchool", label: "Учебно заведение" },
                    { key: "showApparelSize", label: "Размер на екип" },
                    { key: "showEmergencyContact", label: "Спешен телефон" },
                    { key: "showHealthNotes", label: "Здравни бележки" },
                    { key: "showAttendance", label: "Присъствия (Календар)" },
                    { key: "showStatusBadge", label: "Клубна значка" },
                    {
                      key: "showNextTrainingCard",
                      label: "Следваща тренировка",
                    },
                    {
                      key: "showFeeStatus",
                      label: "💳 Членски внос и такси",
                    },
                    {
                      key: "showDocumentsStatus",
                      label: "📄 Документи и медицинско",
                    },
                    {
                      key: "showRanking",
                      label: "🏆 Точки и ранглиста",
                    },
                    {
                      key: "showShadowAndQuizzes",
                      label: "⚡ „Сянка“ и куизове",
                    },
                  ].map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(
                          permissionsState[
                            field.key as keyof ParentMemberPermissions
                          ]
                        )}
                        onChange={(e) =>
                          setPermissionsState((prev) => ({
                            ...prev,
                            [field.key]: e.target.checked,
                          }))
                        }
                        className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveDialogReq(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingApprove}
                onClick={handleConfirmApprove}
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {isSubmittingApprove ? "Одобряване..." : "Одобри и активирай"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 2: REJECT REQUEST */}
      {rejectDialogReq && (
        <Dialog
          open={Boolean(rejectDialogReq)}
          onOpenChange={(open) => !open && setRejectDialogReq(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-red-600">
                Отказ на заявка за достъп
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Посочете причина. Тя ще бъде изпратена по имейл на{" "}
                <strong>{rejectDialogReq.parentEmail}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Label
                htmlFor="admin-reject-reason"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Причина за отказа:
              </Label>
              <textarea
                id="admin-reject-reason"
                name="rejectReason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="напр. Не е открито записано дете с тези имена и рождена дата в клуба..."
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialogReq(null)}
                className="rounded-xl"
              >
                Затвори
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingReject}
                onClick={handleConfirmReject}
                className="rounded-xl bg-red-600 text-white hover:bg-red-500"
              >
                {isSubmittingReject ? "Отказване..." : "Изпрати отказ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 3: MANUAL ADD PARENT */}
      <Dialog open={manualAddOpen} onOpenChange={setManualAddOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
              Ръчно създаване на родител
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Въведете контактите на родителя. Системата ще му генерира профил и
              ще му изпрати имейл за достъп.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualAddSubmit} className="space-y-3.5 py-2">
            <div>
              <Label
                htmlFor="admin-manual-name"
                className="text-xs font-semibold"
              >
                Име и фамилия *
              </Label>
              <Input
                id="admin-manual-name"
                name="name"
                autoComplete="name"
                required
                placeholder="напр. Георги Иванов"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="admin-manual-phone"
                  className="text-xs font-semibold"
                >
                  Телефон *
                </Label>
                <Input
                  id="admin-manual-phone"
                  name="phone"
                  autoComplete="tel"
                  required
                  placeholder="0888 123 456"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label
                  htmlFor="admin-manual-role"
                  className="text-xs font-semibold"
                >
                  Роля *
                </Label>
                <select
                  id="admin-manual-role"
                  name="role"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as ParentRole)}
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
                htmlFor="admin-manual-email"
                className="text-xs font-semibold"
              >
                Имейл адрес *
              </Label>
              <Input
                id="admin-manual-email"
                name="email"
                autoComplete="email"
                type="email"
                required
                placeholder="roditel@email.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <Label
                htmlFor="admin-manual-member-id"
                className="text-xs font-semibold"
              >
                Свързано дете (член) *
              </Label>
              <select
                id="admin-manual-member-id"
                name="memberId"
                required
                value={manualMemberId}
                onChange={(e) => setManualMemberId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              >
                <option value="">-- Изберете дете --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setManualAddOpen(false)}
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
                {isSubmittingManual ? "Създаване..." : "Създай профил"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: EDIT PERMISSIONS MODAL */}
      {editPermParent && (
        <Dialog
          open={Boolean(editPermParent)}
          onOpenChange={(open) => !open && setEditPermParent(null)}
        >
          <DialogContent className="max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                Настройки за видимост на данни
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Изберете кои полета да вижда{" "}
                <strong>{editPermParent.name}</strong> за избраното дете. Всичко
                немаркирано остава скрито.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                {[
                  { key: "showBirthDate", label: "Дата на раждане" },
                  { key: "showAgeGroup", label: "Възрастова група" },
                  { key: "showPhone", label: "Телефон на детето" },
                  { key: "showAddress", label: "Адрес на живеене" },
                  { key: "showSchool", label: "Учебно заведение" },
                  { key: "showApparelSize", label: "Размер на екип" },
                  { key: "showEmergencyContact", label: "Спешен телефон" },
                  { key: "showHealthNotes", label: "Здравни бележки" },
                  { key: "showAttendance", label: "Присъствия (Календар)" },
                  { key: "showStatusBadge", label: "Клубна значка" },
                  { key: "showNextTrainingCard", label: "Следваща тренировка" },
                  {
                    key: "showFeeStatus",
                    label: "💳 Членски внос и такси",
                  },
                  {
                    key: "showDocumentsStatus",
                    label: "📄 Документи и медицинско",
                  },
                  {
                    key: "showRanking",
                    label: "🏆 Точки и ранглиста",
                  },
                  {
                    key: "showShadowAndQuizzes",
                    label: "⚡ „Сянка“ и куизове",
                  },
                ].map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        editPermValues[
                          field.key as keyof ParentMemberPermissions
                        ]
                      )}
                      onChange={(e) =>
                        setEditPermValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditPermParent(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingPerms}
                onClick={handleSavePerms}
                className="rounded-xl bg-blue-600 text-white hover:bg-blue-500"
              >
                {isSubmittingPerms ? "Записване..." : "Запази права"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 5: REPLY / MARK ABSENCE SEEN */}
      {absenceReplyId && (
        <Dialog
          open={Boolean(absenceReplyId)}
          onOpenChange={(open) => !open && setAbsenceReplyId(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold uppercase text-zinc-900 dark:text-white">
                Преглед на отсъствие
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Можете да въведете кратък окуражаващ отговор, който родителят ще
                види в портала си.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Label className="text-xs font-semibold">
                Отговор от треньора (по избор):
              </Label>
              <Input
                value={absenceReplyText}
                onChange={(e) => setAbsenceReplyText(e.target.value)}
                placeholder="напр. Бързо оздравяване! Ще те чакаме в залата."
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAbsenceReplyId(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isReplyingAbsence}
                onClick={() => handleConfirmAbsenceSeen(absenceReplyId)}
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {isReplyingAbsence ? "Запис..." : "Маркирай като видяно"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 6: DELETE CONFIRMATION */}
      {deleteConfirmUser && (
        <Dialog
          open={Boolean(deleteConfirmUser)}
          onOpenChange={(open) => !open && setDeleteConfirmUser(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold uppercase text-red-600">
                Изтриване на родителски профил
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Сигурни ли сте, че искате да премахнете профила на{" "}
                <strong>{deleteConfirmUser.name}</strong>? Родителят няма да
                може да влиза в портала.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmUser(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isDeletingUser}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 text-white hover:bg-red-500"
              >
                {isDeletingUser ? "Изтриване..." : "Да, изтрий профила"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 7: PERSISTENT CREDENTIALS MODAL */}
      <Dialog
        open={credentialsModal.open}
        onOpenChange={(open) =>
          setCredentialsModal((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 size={16} />
              </span>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                {credentialsModal.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500 pt-1">
              {credentialsModal.emailSent
                ? `Данните за вход са изпратени автоматично на ${credentialsModal.parentEmail} и bkgalabovo2014@gmail.com.`
                : `Можете да копирате данните за вход с бутона по-долу и да ги изпратите на родителя.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {!credentialsModal.emailSent && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <div className="font-semibold">Внимание:</div>
                <div className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-200">
                  Имейлът не можа да бъде доставен автоматично от Gmail
                  (проверете конфигурацията). Използвайте бутона по-долу, за да
                  копирате данните.
                </div>
              </div>
            )}

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
                    className="h-8 px-2.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
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

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const siteUrl = "https://bkgalabovo2025.vercel.app";
                const message = `Здравейте, ${credentialsModal.parentName}!
Вашият профил в Родителския портал на БК „Гълъбово“${credentialsModal.childName ? ` за ${credentialsModal.childName}` : ""} е активен:
🌐 Вход: ${siteUrl}/club/parents/login
👤 Потребител: ${credentialsModal.parentPhone} (или ${credentialsModal.parentEmail})
🔑 Временна парола: ${credentialsModal.tempPassword}

При първия вход можете да промените паролата си с лична от настройките.`;
                navigator.clipboard.writeText(message);
                setCredentialsModal((prev) => ({
                  ...prev,
                  copiedMessage: true,
                }));
                toast.success("Данните за вход са копирани в клипборда!");
                setTimeout(() => {
                  setCredentialsModal((prev) => ({
                    ...prev,
                    copiedMessage: false,
                  }));
                }, 2500);
              }}
              className="w-full rounded-xl border-zinc-200 text-xs font-bold py-2.5 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {credentialsModal.copiedMessage ? (
                <>
                  <Check size={14} className="mr-1.5 text-emerald-600" />
                  <span>Съобщението е копирано!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1.5" />
                  <span>📋 Копирай съобщение с данни за вход</span>
                </>
              )}
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() =>
                setCredentialsModal((prev) => ({ ...prev, open: false }))
              }
              className="w-full rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 py-2.5 cursor-pointer"
            >
              Затвори
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: APPROVE DATA CORRECTION */}
      {approveCorrectionReq && (
        <Dialog
          open={Boolean(approveCorrectionReq)}
          onOpenChange={(open) => !open && setApproveCorrectionReq(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold uppercase text-zinc-900 dark:text-white">
                Потвърждение на корекция
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Потвърждавате ли автоматичното обновяване на полето &quot;
                {approveCorrectionReq.fieldLabel}&quot; за{" "}
                <strong>{approveCorrectionReq.memberName}</strong> на нова
                стойност: &quot;
                <strong>{approveCorrectionReq.proposedValue}</strong>&quot;?
                Картонът на състезателя ще се обнови веднага и ще бъде изпратен
                потвърдителен имейл.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveCorrectionReq(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingApproveCorrection}
                onClick={handleConfirmApproveCorrection}
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-semibold"
              >
                {isSubmittingApproveCorrection
                  ? "Обновяване..."
                  : "Да, приеми корекцията"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG: REJECT DATA CORRECTION */}
      {rejectCorrectionReq && (
        <Dialog
          open={Boolean(rejectCorrectionReq)}
          onOpenChange={(open) => !open && setRejectCorrectionReq(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold uppercase text-red-600">
                Отказ на корекция
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Отказване на предложената корекция на &quot;
                {rejectCorrectionReq.fieldLabel}&quot; за{" "}
                <strong>{rejectCorrectionReq.memberName}</strong> от{" "}
                {rejectCorrectionReq.parentName}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Label className="text-xs font-semibold">
                Кратък коментар към родителя (по избор):
              </Label>
              <Input
                value={rejectCorrectionComment}
                onChange={(e) => setRejectCorrectionComment(e.target.value)}
                placeholder="напр. Данните в акта за раждане не съвпадат"
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectCorrectionReq(null)}
                className="rounded-xl"
              >
                Назад
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingRejectCorrection}
                onClick={handleConfirmRejectCorrection}
                className="rounded-xl bg-red-600 text-white hover:bg-red-500 font-semibold"
              >
                {isSubmittingRejectCorrection
                  ? "Отказване..."
                  : "Потвърди отказ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
