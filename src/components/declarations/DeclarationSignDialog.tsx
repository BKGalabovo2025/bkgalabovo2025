"use client";

import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import { getDb } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Reservation } from "@/types/reservation";
import { getSiteConfig } from "@/config/sites";

interface DeclarationSignDialogProps {
  reservation: Reservation;
  children: React.ReactNode;
}

export function DeclarationSignDialog({
  reservation,
  children,
}: DeclarationSignDialogProps) {
  const [open, setOpen] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [selectedClientIndex, setSelectedClientIndex] = useState<1 | 2>(1);
  const [name, setName] = useState(reservation.clientName || "");
  const [phone, setPhone] = useState(reservation.clientPhone || "");
  const [parentName, setParentName] = useState("");
  const [loading, setLoading] = useState(false);

  // If client 2 exists, allow switching
  const hasClient2 = !!reservation.client2Name;

  const [signedClients, setSignedClients] = useState<number[]>([]);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSignedClients([]);
      setSelectedClientIndex(1);
      setName(reservation.clientName || "");
      setPhone(reservation.clientPhone || "");
      setIsMinor(false);
      setParentName("");
      setTimeout(() => {
        sigCanvasRef.current?.clear();
        parentSigCanvasRef.current?.clear();
      }, 100);

      // Fetch existing declarations
      const fetchDeclarations = async () => {
        try {
          const q = query(
            collection(getDb(), "member_declarations"),
            where("reservationId", "==", reservation.id)
          );
          const snapshot = await getDocs(q);
          const signedIndexes: number[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.memberName === reservation.clientName) {
              signedIndexes.push(1);
            } else if (
              reservation.client2Name &&
              data.memberName === reservation.client2Name
            ) {
              signedIndexes.push(2);
            }
          });

          setSignedClients(signedIndexes);

          // Auto-select client 2 if client 1 already signed
          if (
            signedIndexes.includes(1) &&
            !signedIndexes.includes(2) &&
            reservation.client2Name
          ) {
            setSelectedClientIndex(2);
            setName(reservation.client2Name || "");
            setPhone(reservation.client2Phone || "");
          }
        } catch (err) {
          console.error("Failed to fetch declarations", err);
        }
      };
      fetchDeclarations();
    }
  }, [open, reservation]);

  const handleSelectClient = (index: 1 | 2, force: boolean = false) => {
    if (
      !force &&
      !sigCanvasRef.current?.isEmpty() &&
      !signedClients.includes(selectedClientIndex)
    ) {
      if (
        !confirm(
          "Имате неположени подписи, които не са запазени. Сигурни ли сте, че искате да смените клиента без да запазите?"
        )
      ) {
        return;
      }
    }

    setSelectedClientIndex(index);
    if (index === 1) {
      setName(reservation.clientName || "");
      setPhone(reservation.clientPhone || "");
    } else {
      setName(reservation.client2Name || "");
      setPhone(reservation.client2Phone || "");
    }
    setTimeout(() => {
      sigCanvasRef.current?.clear();
      parentSigCanvasRef.current?.clear();
    }, 50);
  };

  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const parentSigCanvasRef = useRef<SignatureCanvas>(null);

  const handleClearSignature = (isParent: boolean = false) => {
    if (isParent) {
      parentSigCanvasRef.current?.clear();
    } else {
      sigCanvasRef.current?.clear();
    }
  };

  const handleSave = async () => {
    if (sigCanvasRef.current?.isEmpty()) {
      toast.error("Моля, подпишете декларацията.");
      return;
    }

    if (isMinor && parentSigCanvasRef.current?.isEmpty()) {
      toast.error("Моля, добавете подпис на родител/настойник.");
      return;
    }

    if (!name || !phone || (isMinor && !parentName)) {
      toast.error("Моля, попълнете всички задължителни полета.");
      return;
    }

    setLoading(true);
    try {
      const signatureDataUrl = sigCanvasRef.current
        ?.getTrimmedCanvas()
        .toDataURL("image/png");
      const parentSignatureDataUrl =
        isMinor && parentSigCanvasRef.current
          ? parentSigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png")
          : undefined;

      const memberId =
        selectedClientIndex === 1
          ? reservation.memberId || reservation.clientId || "guest"
          : reservation.client2Id || "guest";

      const newId = doc(collection(getDb(), "member_declarations")).id;

      const declarationData = {
        id: newId,
        siteId: getSiteConfig().id,
        memberId: memberId,
        memberName: name,
        phone: phone,
        signedAt: new Date().toISOString(),
        templateId: "recoveryzone", // Defaulting for now
        isMinor: isMinor,
        parentName: isMinor ? parentName : null,
        signatureUrl: signatureDataUrl, // We store base64 here to avoid Firebase storage setup for now
        parentSignatureUrl: parentSignatureDataUrl || null,
        reservationId: reservation.id,
      };

      await setDoc(doc(getDb(), "member_declarations", newId), declarationData);

      // Increment declarations count on the reservation
      await updateDoc(doc(getDb(), "reservations", reservation.id), {
        declarationsCount: increment(1),
      });

      const newSignedClients = [...signedClients, selectedClientIndex];
      setSignedClients(newSignedClients);

      if (hasClient2 && newSignedClients.length === 1) {
        toast.success(
          `Успешно запазено за ${name}. Моля, подпишете и за другия клиент.`
        );
        const nextIndex = selectedClientIndex === 1 ? 2 : 1;
        handleSelectClient(nextIndex, true);
      } else {
        toast.success("Декларацията е подписана успешно!");
        setOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при запазване.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white text-black dark:bg-zinc-950 dark:text-white">
        <DialogHeader>
          <DialogTitle className="mb-4 text-center text-xl font-bold uppercase">
            Декларация за информирано съгласие
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {hasClient2 && (
            <div className="mx-auto mb-6 flex max-w-sm gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
              <button
                onClick={() => handleSelectClient(1)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all ${selectedClientIndex === 1 ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              >
                {reservation.clientName || "Клиент 1"}
                {signedClients.includes(1) && (
                  <span className="text-emerald-500">✓</span>
                )}
              </button>
              <button
                onClick={() => handleSelectClient(2)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all ${selectedClientIndex === 2 ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              >
                {reservation.client2Name || "Клиент 2"}
                {signedClients.includes(2) && (
                  <span className="text-emerald-500">✓</span>
                )}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-bold">Име на състезателя</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Трите имена"
                className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Телефон</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон за връзка"
                className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              />
              <div className="prose dark:prose-invert max-w-none space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                <h4 className="mb-2 font-bold text-zinc-900 dark:text-white">
                  Декларация и здравен статус / Declaration and Health Status:
                </h4>
                <p>
                  С настоящото потвърждавам, че съм запознат/а с условията за
                  ползване на системата Normatec 3. Декларирам, че НЕ страдам от
                  никое от следните противопоказания: остра дълбока венозна
                  тромбоза (ДВТ), история на кръвни съсиреци, тежка
                  сърдечно-съдова недостатъчност, белодробен едем, активни
                  инфекции или възпаления, фрактури или тежки травми,
                  злокачествени заболявания или силно изразени разширени вени и
                  открити рани.
                </p>
                <p className="italic">
                  I hereby confirm that I am familiar with the terms of use of
                  the Normatec 3 system. I declare that I do NOT suffer from any
                  of the following contraindications: acute deep vein thrombosis
                  (DVT), history of blood clots, severe cardiovascular
                  insufficiency, pulmonary edema, active infections or
                  inflammations, fractures or severe trauma, malignant diseases
                  or pronounced varicose veins and open wounds.
                </p>

                <h4 className="mt-4 mb-2 font-bold text-zinc-900 dark:text-white">
                  Съгласие с правилата / Agreement to the rules:
                </h4>
                <p>
                  Съгласен/а съм, че услугите, предлагани в Recovery Zone by ZM,
                  имат за цел единствено спортно възстановяване и релаксация. Те
                  не представляват медицинска услуга, диагностика или лечение и
                  не заменят консултацията с медицинско лице. Поемам пълна
                  отговорност за използването на сесиите на свой риск.
                  Съгласен/а съм да следвам инструкциите за хигиена. Давам
                  съгласието си да бъда сниман/а за маркетингови цели и данните
                  ми да се обработват съгласно GDPR.
                </p>
                <p className="italic">
                  I agree that the services offered at Recovery Zone by ZM are
                  intended solely for sports recovery and relaxation. They do
                  not constitute a medical service, diagnosis, or treatment and
                  do not replace consultation with a medical professional. I
                  take full responsibility for using the sessions at my own
                  risk. I agree to follow the hygiene instructions. I give my
                  consent to be photographed for marketing purposes and for my
                  data to be processed in accordance with the GDPR.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMinor"
              checked={isMinor}
              onCheckedChange={(checked) => setIsMinor(checked as boolean)}
            />
            <Label htmlFor="isMinor" className="cursor-pointer font-bold">
              Лицето е непълнолетно (под 18 години) / The person is a minor
              (under 18)
            </Label>
          </div>

          {isMinor && (
            <div className="space-y-2">
              <Label className="font-bold">Име на родител/настойник</Label>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Трите имена на родителя"
                className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="mb-2 flex items-center justify-between">
                <Label className="font-bold">
                  Подпис на състезателя / Athlete&apos;s Signature *
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sigCanvasRef.current?.clear()}
                  className="h-6 text-xs text-zinc-500"
                >
                  Изчисти / Clear
                </Button>
              </div>
              <div className="touch-none overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-white dark:border-zinc-700">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#1a3399"
                  canvasProps={{ className: "w-full h-32 touch-none" }}
                />
              </div>
            </div>

            {isMinor && (
              <div className="mt-4 space-y-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="font-bold text-red-500">
                    Подпис на родител/настойник / Parent/Guardian Signature *
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearSignature(true)}
                    className="h-6 text-xs text-zinc-500"
                  >
                    Изчисти / Clear
                  </Button>
                </div>
                <div className="touch-none overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-white dark:border-zinc-700">
                  <SignatureCanvas
                    ref={parentSigCanvasRef}
                    penColor="#1a3399"
                    canvasProps={{ className: "w-full h-32 touch-none" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отказ
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || signedClients.includes(selectedClientIndex)}
            >
              {(() => {
                if (loading) return "Запазване...";
                if (signedClients.includes(selectedClientIndex))
                  return "Вече е подписано";
                if (hasClient2 && signedClients.length === 0)
                  return `Запази за ${name} и продължи`;
                return "Подпиши и Запази";
              })()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
