"use client";

import { Button } from "@/components/ui/button";
import { Printer, Calendar, Users, Award, Shirt, Clock } from "lucide-react";
import { formatPrice } from "@/lib/currency";

// --- Type Definition (includes all possible fields) ---
interface Service {
  id: string;
  name: string;
  price: number; // in Euro
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
}

// --- Helper Functions ---

const formatPaymentCount = (count: number) => {
  if (!count) return "";
  const label = count === 1 ? "плащане" : "плащания";
  return `(след ${count} ${label})`;
};

const formatDescription = (description: string) => {
  if (!description) return { __html: "" };
  const lines = description
    .split(/\r\n|\n/)
    .filter((line) => line.trim() !== "");
  let html = "";
  let inList = false;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    // Handle bullet points starting with 'o', '•', or '-'
    if (
      trimmedLine.startsWith("o\t") ||
      trimmedLine.startsWith("•\t") ||
      trimmedLine.startsWith("-\t") ||
      trimmedLine.startsWith("*")
    ) {
      if (!inList) {
        html += '<ul class="list-disc pl-5 mt-2 text-base">';
        inList = true;
      }
      html += `<li>${trimmedLine.substring(1).trim()}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p class="mt-4 text-base">${trimmedLine}</p>`;
    }
  });

  if (inList) html += "</ul>";
  return { __html: html };
};

// --- Main Client Component ---

export default function PrintClientPage({ service }: { service: Service }) {
  const hasAdditionalInfo =
    service.targetGroups?.length ||
    service.grantsLicense ||
    service.grantsApparel ||
    service.durationMinutes;

  return (
    <>
      <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
                    .no-print { display: none; }
                }
            `}</style>

      <div className="max-w-4xl mx-auto p-8 printable-area font-sans">
        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
            <p className="text-2xl font-semibold text-gray-800">
              {formatPrice(service.price)}
            </p>
            <div className="flex items-center text-md text-gray-600 mt-2">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{service.billingPeriod || service.type}</span>
            </div>
          </div>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="no-print"
          >
            <Printer className="mr-2 h-4 w-4" />
            Принтирай
          </Button>
        </div>

        {/* --- MAIN DESCRIPTION --- */}
        <div
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={formatDescription(service.description)}
        />

        {/* --- ADDITIONAL DETAILS --- */}
        {hasAdditionalInfo && (
          <div className="mt-10 pt-6 border-t">
            <h2 className="text-2xl font-bold mb-4">Допълнителни детайли</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {service.targetGroups && service.targetGroups.length > 0 && (
                <div className="flex items-start">
                  <Users className="h-6 w-6 mr-3 mt-1 text-gray-700" />
                  <p>
                    <strong>Целеви групи:</strong>{" "}
                    {service.targetGroups.join(", ")}
                  </p>
                </div>
              )}

              {service.durationMinutes && (
                <div className="flex items-start">
                  <Clock className="h-6 w-6 mr-3 mt-1 text-gray-700" />
                  <p>
                    <strong>Продължителност:</strong> {service.durationMinutes}{" "}
                    минути
                  </p>
                </div>
              )}

              {service.grantsLicense && (
                <div className="flex items-start col-span-full">
                  <Award className="h-6 w-6 mr-3 mt-1 text-gray-700" />
                  <p>
                    <strong>Предоставя картотека:</strong>{" "}
                    {service.licenseCondition || "Да"}{" "}
                    {formatPaymentCount(service.licensePaymentCount || 0)}
                  </p>
                </div>
              )}

              {service.grantsApparel && (
                <div className="flex items-start col-span-full">
                  <Shirt className="h-6 w-6 mr-3 mt-1 text-gray-700" />
                  <p>
                    <strong>Предоставя екипировка:</strong>{" "}
                    {service.apparelCondition || "Да"}{" "}
                    {formatPaymentCount(service.apparelPaymentCount || 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
