"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClubService } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckedState } from "@radix-ui/react-checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Price } from "@/types";
import { formatPrice } from "@/lib/currency";

// --- Types ---
interface Service {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  type: string;
  billingPeriod?: string;
  targetGroups?: string[];
  grantsLicense?: boolean;
  licenseCondition?: string;
  licensePaymentCount?: number;
  grantsApparel?: boolean;
  apparelCondition?: string;
  apparelPaymentCount?: number;
  durationMinutes?: number;
  priceId?: string;
}

// This interface defines the props expected by the ServiceForm component.
// It requires both a `service` object and an `activePrices` array.
interface ServiceFormProps {
  service: Service;
  activePrices: Price[];
}

// --- Submit Button ---
function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" size="lg" disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Запази промените
    </Button>
  );
}

// --- The Form Component ---
export default function ServiceForm({
  service,
  activePrices,
}: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { user, loading } = useAuth();

  const initialPriceId =
    service.priceId || activePrices.find((p) => p.value === service.price)?.id;

  // Local state for UI interactivity
  const [serviceType, setServiceType] = useState(service.type);
  const [grantsLicense, setGrantsLicense] = useState(
    service.grantsLicense || false
  );
  const [licenseCondition, setLicenseCondition] = useState(
    service.licenseCondition || "След N плащания"
  );
  const [grantsApparel, setGrantsApparel] = useState(
    service.grantsApparel || false
  );
  const [apparelCondition, setApparelCondition] = useState(
    service.apparelCondition || "След N плащания"
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (loading) {
      toast.info("Моля, изчакайте", {
        description: "Проверката на потребителя все още не е приключила.",
      });
      return;
    }

    if (!user) {
      toast.error("Грешка", {
        description:
          "Трябва да сте влезли в системата, за да извършите това действие.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const idToken = await user.getIdToken(true);
        const result = await updateClubService(
          service.id,
          idToken,
          { message: "" },
          formData
        );

        if (result && result.message) {
          toast.success("Успех!", { description: result.message });
          router.push("/finances/services");
          router.refresh();
        } else if (result && result.errors) {
          toast.error("Грешка при валидация", {
            description: result.message || "Моля, проверете въведените данни.",
          });
        }
      } catch (error) {
        console.error("Error getting ID token or updating service:", error);
        toast.error("Грешка при автентикация", {
          description:
            "Не може да бъде валидиран потребителя. Моля, опитайте отново.",
        });
      }
    });
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Редактиране на услуга</h1>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Основна информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Име на услугата</Label>
              <Input
                id="name"
                name="name"
                defaultValue={service.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={service.description || ""}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceId">Цена</Label>
              <Select name="priceId" defaultValue={initialPriceId}>
                <SelectTrigger id="priceId">
                  <SelectValue placeholder="Изберете цена" />
                </SelectTrigger>
                <SelectContent>
                  {activePrices.map((price) => (
                    <SelectItem key={price.id} value={price.id}>
                      {`${price.name} (${formatPrice(price.value)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Насоченост и Тип</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4">
            <div className="space-y-3">
              <Label>Целева група (една или повече)</Label>
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="targetGroup-children"
                    name="targetGroups"
                    value="Деца"
                    defaultChecked={service.targetGroups?.includes("Деца")}
                  />
                  <Label htmlFor="targetGroup-children" className="font-normal">
                    Деца
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="targetGroup-amateurs"
                    name="targetGroups"
                    value="Любители"
                    defaultChecked={service.targetGroups?.includes("Любители")}
                  />
                  <Label htmlFor="targetGroup-amateurs" className="font-normal">
                    Любители
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Тип на услугата</Label>
              <RadioGroup
                name="type"
                required
                value={serviceType}
                onValueChange={(value) => setServiceType(value)}
                className="pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Абонамент" id="type-subscription" />
                  <Label htmlFor="type-subscription" className="font-normal">
                    Абонамент
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="Еднократно плащане"
                    id="type-one-time"
                  />
                  <Label htmlFor="type-one-time" className="font-normal">
                    Еднократно плащане
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {serviceType === "Абонамент" && (
          <Card className="animate-in fade-in">
            <CardHeader>
              <CardTitle>Настройки за абонамент</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="billingPeriod">Период на таксуване</Label>
                <Select
                  name="billingPeriod"
                  defaultValue={service.billingPeriod || "Месечен"}
                >
                  <SelectTrigger id="billingPeriod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Месечен">Месечен</SelectItem>
                    <SelectItem value="Годишен">Годишен</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grantsLicense">Дава право на картотека</Label>
                  <Checkbox
                    id="grantsLicense"
                    name="grantsLicense"
                    checked={grantsLicense}
                    onCheckedChange={(checked: CheckedState) =>
                      setGrantsLicense(checked === true)
                    }
                  />
                </div>
                {grantsLicense && (
                  <div className="space-y-2 pl-2 pt-2 animate-in fade-in">
                    <Label htmlFor="licenseCondition">
                      Условие за получаване
                    </Label>
                    <Select
                      name="licenseCondition"
                      value={licenseCondition}
                      onValueChange={(val) => setLicenseCondition(val)}
                    >
                      <SelectTrigger id="licenseCondition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="След N плащания">
                          След N плащания
                        </SelectItem>
                        <SelectItem value="Веднага">Веднага</SelectItem>
                      </SelectContent>
                    </Select>
                    {licenseCondition === "След N плащания" && (
                      <div className="flex items-center space-x-2 pt-2 animate-in fade-in">
                        <Input
                          name="licensePaymentCount"
                          type="number"
                          className="w-24"
                          placeholder="Брой"
                          defaultValue={service.licensePaymentCount}
                        />
                        <span>месечни плащания</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grantsApparel">
                    Дава право на екипировка
                  </Label>
                  <Checkbox
                    id="grantsApparel"
                    name="grantsApparel"
                    checked={grantsApparel}
                    onCheckedChange={(checked: CheckedState) =>
                      setGrantsApparel(checked === true)
                    }
                  />
                </div>
                {grantsApparel && (
                  <div className="space-y-2 pl-2 pt-2 animate-in fade-in">
                    <Label htmlFor="apparelCondition">
                      Условие за получаване
                    </Label>
                    <Select
                      name="apparelCondition"
                      value={apparelCondition}
                      onValueChange={(val) => setApparelCondition(val)}
                    >
                      <SelectTrigger id="apparelCondition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="След N плащания">
                          След N плащания
                        </SelectItem>
                        <SelectItem value="Веднага">Веднага</SelectItem>
                      </SelectContent>
                    </Select>
                    {apparelCondition === "След N плащания" && (
                      <div className="flex items-center space-x-2 pt-2 animate-in fade-in">
                        <Input
                          name="apparelPaymentCount"
                          type="number"
                          className="w-24"
                          placeholder="Брой"
                          defaultValue={service.apparelPaymentCount}
                        />
                        <span>месечни плащания</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {serviceType === "Еднократно плащане" && (
          <Card className="animate-in fade-in">
            <CardHeader>
              <CardTitle>Настройки за еднократно плащане</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">
                  Продължителност (в минути)
                </Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  placeholder="Напр. 60"
                  defaultValue={service.durationMinutes}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <SubmitButton isPending={isPending} />
        </div>
      </form>
    </div>
  );
}
