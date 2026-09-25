/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Check, Loader2, Sparkles, UserPlus } from "lucide-react";
import React, { useId, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { useAuth } from "@/context/auth-context";
import { ShadowPlayer } from "@/hooks/useShadowTrainer";
import { createMemberAction } from "@/lib/actions/members";
import { getAgeGroup } from "@/lib/utils";
import { addMember } from "@/services/member-service";

interface QuickAddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: (member: ShadowPlayer, isClub: boolean) => void;
}

export function QuickAddMemberDialog({
  open,
  onOpenChange,
  onMemberAdded,
}: QuickAddMemberDialogProps) {
  const { idToken } = useAuth();
  const formUid = useId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phone, setPhone] = useState("");
  const [membershipType, setMembershipType] = useState<"club" | "guest">(
    "guest"
  );
  const [isSaving, setIsSaving] = useState(false);

  // Dynamically calculated age group badge
  const previewAgeGroup = useMemo(() => {
    if (!dateOfBirth) return null;
    const res = getAgeGroup(dateOfBirth);
    return res !== "Неопределена" ? res : null;
  }, [dateOfBirth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Моля, попълнете име и фамилия на състезателя.");
      return;
    }

    setIsSaving(true);
    const isClub = membershipType === "club";

    const payload: Record<string, unknown> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      gender,
      phone: phone.trim() || null,
      isClubMember: isClub,
      isGuest: !isClub,
      memberType: isClub ? "regular" : "guest",
      status: "active",
      registrationDate: new Date().toISOString(),
      siteId: "bkgalabovo",
    };

    try {
      let createdId: string | null = null;

      // Try server action first
      if (idToken) {
        try {
          const res = await createMemberAction(idToken, payload);
          if (res.success && res.data?.id) {
            createdId = res.data.id;
          }
        } catch (serverErr) {
          console.warn("Server action fallback to client service:", serverErr);
        }
      }

      // Fallback to client service if needed
      if (!createdId) {
        createdId = await addMember(payload as any);
      }

      if (!createdId) {
        throw new Error("Неуспешно създаване на запис.");
      }

      const newPlayer: ShadowPlayer = {
        id: createdId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        ageGroup: previewAgeGroup || undefined,
        isClubMember: isClub,
        isGuest: !isClub,
      };

      if (isClub) {
        toast.success(
          `Клубният състезател ${newPlayer.displayName} беше добавен и включен в тренировката!`
        );
      } else {
        toast.success(
          `Външният член ${newPlayer.displayName} беше записан в базата данни (модул Членове)!`
        );
      }

      onMemberAdded(newPlayer, isClub);
      onOpenChange(false);

      // Reset form
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setPhone("");
      setMembershipType("guest");
    } catch (err: unknown) {
      console.error("Error creating member:", err);
      toast.error("Възникна грешка при запазване в базата данни.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <UserPlus className="size-5 text-blue-600" />
            Добавяне на състезател / член
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Записът се създава директно в общата база данни и ще присъства в
            модул „Членове“.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Membership Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">
              Принадлежност към клуба
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMembershipType("club")}
                className={`flex flex-col gap-1 rounded-2xl border-2 p-3 text-left transition-all ${
                  membershipType === "club"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Клубен член</span>
                  {membershipType === "club" && (
                    <Check className="size-4 text-blue-600" />
                  )}
                </div>
                <span className="text-[10px] leading-tight text-zinc-500">
                  Влиза директно в тренировките на клуба
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMembershipType("guest")}
                className={`flex flex-col gap-1 rounded-2xl border-2 p-3 text-left transition-all ${
                  membershipType === "guest"
                    ? "border-amber-600 bg-amber-50/70 text-amber-900 shadow-xs dark:bg-amber-950/40 dark:text-amber-100"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Външен член / Гост</span>
                  {membershipType === "guest" && (
                    <Check className="size-4 text-amber-600" />
                  )}
                </div>
                <span className="text-[10px] leading-tight text-zinc-500">
                  Записва се в досиетата, без клубни тренировки
                </span>
              </button>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor={`${formUid}-fname`}
                className="text-xs font-bold uppercase text-zinc-500"
              >
                Име *
              </Label>
              <Input
                id={`${formUid}-fname`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="напр. Георги"
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor={`${formUid}-lname`}
                className="text-xs font-bold uppercase text-zinc-500"
              >
                Фамилия *
              </Label>
              <Input
                id={`${formUid}-lname`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="напр. Иванов"
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Date of Birth & Calculated Age Group */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={`${formUid}-dob`}
                className="text-xs font-bold uppercase text-zinc-500"
              >
                Дата на раждане
              </Label>
              {previewAgeGroup && (
                <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Sparkles size={10} /> {previewAgeGroup}
                </span>
              )}
            </div>
            <Input
              id={`${formUid}-dob`}
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="h-10 rounded-xl text-xs"
            />
          </div>

          {/* Gender & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Пол
              </Label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                    gender === "male"
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  Мъж / Момче
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                    gender === "female"
                      ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  Жена / Момиче
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor={`${formUid}-phone`}
                className="text-xs font-bold uppercase text-zinc-500"
              >
                Телефон (Опц.)
              </Label>
              <Input
                id={`${formUid}-phone`}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0888..."
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl text-xs"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Записване...
                </>
              ) : (
                "Запази в базата данни"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
