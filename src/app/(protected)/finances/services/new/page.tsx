"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClubService, ServiceState } from "@/lib/actions/services"; // Import ServiceState
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
import { useAuth } from "@/context/auth-context"; // Import useAuth

// Submit button component remains the same
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Service
    </Button>
  );
}

export default function NewServicePage() {
  const router = useRouter();
  const { idToken } = useAuth(); // Get user and idToken from auth context

  // Define the initial state with the correct type
  const initialState: ServiceState = {
    message: "",
    success: false,
    errors: {},
  };

  // Create a wrapper for the server action to include the idToken
  const createClubServiceWithToken = async (
    prevState: ServiceState,
    formData: FormData
  ): Promise<ServiceState> => {
    if (!idToken) {
      return {
        success: false,
        message: "Authentication token not found. Please log in again.",
      };
    }
    return createClubService(idToken, prevState, formData);
  };

  // useFormState now uses the wrapper function
  const [state, formAction] = useFormState(
    createClubServiceWithToken,
    initialState
  );

  const [serviceType, setServiceType] = useState<"Subscription" | "One-time">(
    "Subscription"
  );
  const [grantsLicense, setGrantsLicense] = useState(false);
  const [licenseCondition, setLicenseCondition] = useState<
    "Immediately" | "After N payments"
  >("After N payments");
  const [grantsApparel, setGrantsApparel] = useState(false);
  const [apparelCondition, setApparelCondition] = useState<
    "Immediately" | "After N payments"
  >("After N payments");

  const currency = "EUR";

  // useEffect now correctly checks for state.success
  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success("Success!", { description: state.message });
        router.push("/finances/services");
      } else {
        toast.error("Error", { description: state.message });
      }
    }
  }, [state, router]);

  // The rest of the JSX remains the same
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Service</h1>
      <form action={formAction} className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Individual Monthly Subscription"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a detailed description of the service..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (in {currency})</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="e.g., 20.00"
                  required
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  name="currency"
                  value={currency}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Targeting and Type</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4">
            <div className="space-y-3">
              <Label>Target Group (one or more)</Label>
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="targetGroup-children"
                    name="targetGroups"
                    value="Children"
                  />
                  <Label htmlFor="targetGroup-children" className="font-normal">
                    Children
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="targetGroup-amateurs"
                    name="targetGroups"
                    value="Amateurs"
                  />
                  <Label htmlFor="targetGroup-amateurs" className="font-normal">
                    Amateurs
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Service Type</Label>
              <RadioGroup
                name="type"
                required
                value={serviceType}
                onValueChange={(value: "Subscription" | "One-time") =>
                  setServiceType(value)
                }
                className="pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Subscription" id="type-subscription" />
                  <Label htmlFor="type-subscription" className="font-normal">
                    Subscription
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="One-time" id="type-one-time" />
                  <Label htmlFor="type-one-time" className="font-normal">
                    One-time Payment
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {serviceType === "Subscription" && (
          <Card className="animate-in fade-in">
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Billing Period</Label>
                <Select name="billingPeriod" defaultValue="Monthly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grantsLicense">Grants License</Label>
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
                    <Label>Condition for Receiving</Label>
                    <Select
                      name="licenseCondition"
                      value={licenseCondition}
                      onValueChange={(
                        val: "Immediately" | "After N payments"
                      ) => setLicenseCondition(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="After N payments">
                          After N payments
                        </SelectItem>
                        <SelectItem value="Immediately">Immediately</SelectItem>
                      </SelectContent>
                    </Select>
                    {licenseCondition === "After N payments" && (
                      <div className="flex items-center space-x-2 pt-2 animate-in fade-in">
                        <Input
                          name="licensePaymentCount"
                          type="number"
                          className="w-24"
                          placeholder="Count"
                        />
                        <span>monthly payments</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grantsApparel">Grants Apparel</Label>
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
                    <Label>Condition for Receiving</Label>
                    <Select
                      name="apparelCondition"
                      value={apparelCondition}
                      onValueChange={(
                        val: "Immediately" | "After N payments"
                      ) => setApparelCondition(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="After N payments">
                          After N payments
                        </SelectItem>
                        <SelectItem value="Immediately">Immediately</SelectItem>
                      </SelectContent>
                    </Select>
                    {apparelCondition === "After N payments" && (
                      <div className="flex items-center space-x-2 pt-2 animate-in fade-in">
                        <Input
                          name="apparelPaymentCount"
                          type="number"
                          className="w-24"
                          placeholder="Count"
                        />
                        <span>monthly payments</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {serviceType === "One-time" && (
          <Card className="animate-in fade-in">
            <CardHeader>
              <CardTitle>One-time Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duration (in minutes)</Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  placeholder="e.g., 60"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
