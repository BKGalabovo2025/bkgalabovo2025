"use client";

import {
  ArrowRight,
  FileSignature,
  KeyRound,
  Loader2,
  Mail,
  Pause,
  Phone,
  Play,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhoneDisplay } from "@/lib/phone-utils";
import {
  DOCUMENT_TITLES,
  type DocumentType,
} from "@/types/document-request.types";

import { useParentAdminContext } from "../ParentAdminContext";

const OFFICIAL_DOC_OPTIONS: { value: DocumentType; label: string }[] = [
  {
    value: "membershipApplication",
    label: DOCUMENT_TITLES.membershipApplication,
  },
  { value: "signedDeclaration", label: DOCUMENT_TITLES.signedDeclaration },
  { value: "travelDeclaration", label: DOCUMENT_TITLES.travelDeclaration },
  { value: "safetyInstruction", label: DOCUMENT_TITLES.safetyInstruction },
  { value: "internalRules", label: DOCUMENT_TITLES.internalRules },
  { value: "amateurContract", label: DOCUMENT_TITLES.amateurContract },
  { value: "licenseApplication", label: DOCUMENT_TITLES.licenseApplication },
  { value: "terminationRequest", label: DOCUMENT_TITLES.terminationRequest },
];

export function ParentAccountsSectionView() {
  const {
    searchQuery,
    setSearchQuery,
    parentFilter,
    setParentFilter,
    filteredParents,
    isParentOnline,
    setCallingParent,
    setEmailingParent,
    linkingParentId,
    setLinkingParentId,
    selectedChildToLink,
    setSelectedChildToLink,
    members,
    isLinkingChild,
    handleLinkChild,
    handleOpenEditPerms,
    isUnlinkingChild,
    handleUnlinkChild,
    documentRequests,
    selectedDocTypePerChild,
    setSelectedDocTypePerChild,
    isSendingDocPerChild,
    handleSendDocFromAdmin,
    handleToggleStatus,
    handleResetPassword,
    setDeleteConfirmUser,
  } = useParentAdminContext();

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <Input
            placeholder="Търсене по родител, дете, телефон или имейл..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all", label: "Всички" },
              { id: "active", label: "Активни" },
              { id: "suspended", label: "Спрени" },
            ] as const
          ).map((f) => (
            <Button
              key={f.id}
              variant={parentFilter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setParentFilter(f.id)}
              className="rounded-xl text-xs font-semibold"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredParents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <Users size={40} className="mx-auto text-zinc-400" />
          <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
            Няма намерени родители
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Променете критериите за търсене или добавете родител ръчно.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredParents.map((parent) => {
            const roleLabel =
              parent.parentRole === "mother"
                ? "Майка"
                : parent.parentRole === "father"
                  ? "Баща"
                  : "Настойник";

            return (
              <div
                key={parent.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isParentOnline(parent) ? (
                        <span
                          className="relative flex size-3"
                          title="На линия в момента"
                        >
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                        </span>
                      ) : (
                        <span
                          className={`size-2.5 rounded-full ${
                            parent.status === "active"
                              ? "bg-zinc-300 dark:bg-zinc-600"
                              : "bg-zinc-400"
                          }`}
                        />
                      )}

                      <Badge
                        variant={
                          parent.status === "active" ? "default" : "secondary"
                        }
                        className="text-[11px] font-bold"
                      >
                        {parent.status === "active"
                          ? "Активен профил"
                          : "Временно спрян"}
                      </Badge>
                      <span className="text-xs font-semibold text-zinc-500">
                        • {roleLabel}
                      </span>

                      {isParentOnline(parent) && (
                        <Badge className="bg-emerald-500 text-white text-[10px] font-extrabold animate-pulse">
                          🟢 На линия
                        </Badge>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-zinc-400">
                      {isParentOnline(parent) ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Последно: {parent.lastAction || "В портала"}
                        </span>
                      ) : parent.lastLoginAt ? (
                        `Последен вход: ${new Date(
                          parent.lastLoginAt
                        ).toLocaleDateString("bg-BG", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} ч.`
                      ) : (
                        "Все още не е влизал"
                      )}
                    </div>
                  </div>

                  {/* Parent Name & Contacts */}
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-black text-zinc-900 dark:text-white">
                        {parent.name}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <a
                          href={`tel:${parent.phone}`}
                          className="flex items-center gap-1 font-medium hover:underline text-blue-600 dark:text-blue-400"
                        >
                          <Phone size={13} />
                          {formatPhoneDisplay(parent.phone)}
                        </a>
                        <a
                          href={`mailto:${parent.email}`}
                          className="flex items-center gap-1 font-medium hover:underline text-zinc-500 dark:text-zinc-400"
                        >
                          <Mail size={13} />
                          {parent.email}
                        </a>
                      </div>
                    </div>

                    {/* Individual Communication Quick Buttons */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setCallingParent(parent)}
                        className="h-7 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-semibold cursor-pointer"
                        title="Запис на проведен разговор с този родител"
                      >
                        <Phone size={11} className="mr-1 text-emerald-600" />
                        <span>Обаждане</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEmailingParent(parent)}
                        className="h-7 rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-[11px] font-semibold cursor-pointer"
                        title="Лично съобщение / имейл до родителя (без спам)"
                      >
                        <Mail size={11} className="mr-1 text-blue-600" />
                        <span>Съобщение</span>
                      </Button>
                    </div>
                  </div>

                  {/* Linked Children & Document Sending */}
                  <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-950/40 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span>Свързани деца &amp; Изпращане на документи:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkingParentId(
                            linkingParentId === parent.id ? null : parent.id
                          );
                          setSelectedChildToLink("");
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <UserPlus size={12} />
                        <span>+ Свържи още едно дете</span>
                      </button>
                    </div>

                    {/* Inline selector for linking child */}
                    {linkingParentId === parent.id && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-900/50 dark:bg-zinc-900 space-y-2">
                        <div className="text-[11px] font-semibold text-blue-900 dark:text-blue-200">
                          Свързване на състезател към {parent.name}:
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <select
                            aria-label="Изберете състезател за свързване"
                            value={selectedChildToLink}
                            onChange={(e) =>
                              setSelectedChildToLink(e.target.value)
                            }
                            className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                          >
                            <option value="">-- Изберете състезател --</option>
                            {members
                              .filter(
                                (m) =>
                                  !(parent.linkedMemberIds || []).includes(m.id)
                              )
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.fullName || `${m.firstName} ${m.lastName}`}
                                </option>
                              ))}
                          </select>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Button
                              size="sm"
                              disabled={!selectedChildToLink || isLinkingChild}
                              onClick={() => handleLinkChild(parent.id)}
                              className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500"
                            >
                              {isLinkingChild ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                "Свържи"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setLinkingParentId(null)}
                              className="h-8 px-2.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                            >
                              Отказ
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {(parent.linkedMemberIds || []).map((mId) => {
                        const child = members.find((m) => m.id === mId);
                        const childName = child?.fullName || `Член ${mId}`;
                        const sendKey = `${parent.id}_${mId}`;
                        const childDocs = documentRequests.filter(
                          (dr) =>
                            dr.memberId === mId && dr.status !== "cancelled"
                        );
                        return (
                          <div
                            key={mId}
                            className="rounded-xl border border-blue-200/70 bg-white p-2.5 text-xs shadow-2xs dark:border-blue-900/40 dark:bg-zinc-900 space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Link
                                href={`/members/${mId}`}
                                className="font-bold text-zinc-900 dark:text-white hover:underline flex items-center gap-1"
                                target="_blank"
                              >
                                <span>{childName}</span>
                                <ArrowRight
                                  size={11}
                                  className="text-zinc-400"
                                />
                              </Link>

                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenEditPerms(parent, mId)
                                  }
                                  className="text-[11px] text-blue-600 hover:text-blue-700 underline font-semibold dark:text-blue-400"
                                  title="Настройка на права за видимост"
                                >
                                  ⚙️ Права за видимост
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    isUnlinkingChild === `${parent.id}_${mId}`
                                  }
                                  onClick={() =>
                                    handleUnlinkChild(parent.id, mId, childName)
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-semibold dark:text-rose-400 cursor-pointer"
                                  title="Разкачване на това дете от профила"
                                >
                                  {isUnlinkingChild ===
                                  `${parent.id}_${mId}` ? (
                                    <Loader2
                                      size={11}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <>
                                      <Trash2 size={11} />
                                      <span>Разкачи</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Send official document to parent portal */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                              <select
                                aria-label={`Избор на документ за ${childName}`}
                                value={
                                  selectedDocTypePerChild[sendKey] ||
                                  "membershipApplication"
                                }
                                onChange={(e) =>
                                  setSelectedDocTypePerChild((prev) => ({
                                    ...prev,
                                    [sendKey]: e.target.value as DocumentType,
                                  }))
                                }
                                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                              >
                                {OFFICIAL_DOC_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    📄 {opt.label}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                disabled={isSendingDocPerChild[sendKey]}
                                onClick={() =>
                                  handleSendDocFromAdmin(parent.id, mId)
                                }
                                className="h-7 rounded-lg bg-indigo-600 px-2.5 text-[11px] font-semibold text-white hover:bg-indigo-500 shrink-0"
                              >
                                {isSendingDocPerChild[sendKey] ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <>
                                    <Send size={11} className="mr-1" />
                                    <span>Изпрати за подпис</span>
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Sent documents status for this child */}
                            {childDocs.length > 0 && (
                              <div className="space-y-1 pt-1">
                                {childDocs.slice(0, 4).map((docReq) => {
                                  const isSigned =
                                    docReq.status === "completed";
                                  const isViewed = Boolean(
                                    docReq.viewedByParentAt
                                  );
                                  return (
                                    <div
                                      key={docReq.id}
                                      className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-zinc-50 px-2 py-1 text-[11px] dark:bg-zinc-950/60"
                                    >
                                      <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate flex items-center gap-1">
                                        <FileSignature
                                          size={11}
                                          className="text-indigo-500 shrink-0"
                                        />
                                        {docReq.documentTitle}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        {isSigned ? (
                                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            ✍️ Подписан (
                                            {docReq.signedAt
                                              ? new Date(
                                                  docReq.signedAt
                                                ).toLocaleDateString("bg-BG")
                                              : ""}
                                            )
                                          </span>
                                        ) : isViewed ? (
                                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                                            👁️ Прегледан (очаква подпис)
                                          </span>
                                        ) : (
                                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                            ⏳ Изпратен
                                          </span>
                                        )}
                                        <Link
                                          href={`/sign/${docReq.token}`}
                                          target="_blank"
                                          className="text-[10px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                          {isSigned ? "Преглед ↗" : "Линк ↗"}
                                        </Link>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCallingParent(parent)}
                    className="rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 cursor-pointer"
                    title="Запис на проведен телефонен разговор"
                  >
                    <Phone size={13} className="mr-1 text-emerald-600" />
                    <span>Обаждане</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEmailingParent(parent)}
                    className="rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-400 cursor-pointer"
                    title="Изпращане на лично съобщение / имейл (без спам)"
                  >
                    <Mail size={13} className="mr-1 text-blue-600" />
                    <span>Лично съобщение</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(parent)}
                    className="rounded-xl text-xs font-semibold"
                  >
                    {parent.status === "active" ? (
                      <>
                        <Pause size={13} className="mr-1 text-amber-500" />
                        <span>Спри достъп</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} className="mr-1 text-emerald-500" />
                        <span>Активирай</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResetPassword(parent)}
                    className="rounded-xl text-xs font-semibold"
                    title="Генерирай нова временна парола"
                  >
                    <KeyRound size={13} className="mr-1 text-blue-500" />
                    <span>Нова парола</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirmUser(parent)}
                    className="ml-auto rounded-xl text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
