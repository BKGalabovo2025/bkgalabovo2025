import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseAuth } from "@/lib/firebase";

const inputClass =
  "h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary";
const labelClass =
  "text-[11px] font-medium uppercase tracking-widest text-zinc-400";

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Моля, въведете текущата си парола!");
      return;
    }
    if (newPassword !== repeatPassword) {
      toast.error("Новите пароли не съвпадат!");
      return;
    }
    const auth = getFirebaseAuth();
    if (auth.currentUser && auth.currentUser.email) {
      setIsSaving(true);
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
        toast.error("Грешка: Невалидна текуща парола или сесията е изтекла.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <BentoCard className="space-y-8 border-zinc-100 bg-white p-10 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="size-5 text-primary" strokeWidth={1.5} />
            <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
              Смяна на парола
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={handleResetPassword}
            disabled={isSendingReset}
            className="h-10 rounded-xl px-4 text-xs font-medium tracking-widest uppercase"
          >
            {isSendingReset ? "Изпращане..." : "Забравена парола?"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <Label className={labelClass}>Текуща парола</Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Въведете текущата си парола"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <div className="hidden md:block"></div>
          <div className="space-y-3">
            <Label className={labelClass}>Нова парола</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символа"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Повтори новата парола</Label>
            <div className="relative">
              <Input
                type={showRepeatPassword ? "text" : "password"}
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="Повторете новата парола"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showRepeatPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleChangePassword}
            disabled={
              isSaving || !currentPassword || !newPassword || !repeatPassword
            }
            className="h-12 rounded-xl bg-primary px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-primary/90"
          >
            {isSaving ? "Запазване..." : "Смени паролата"}
            {!isSaving && <Lock className="ml-3 size-4" strokeWidth={1.5} />}
          </Button>
        </div>
      </BentoCard>
    </div>
  );
}
