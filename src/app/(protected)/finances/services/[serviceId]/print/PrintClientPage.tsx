"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Calendar,
  Users,
  Award,
  Shirt,
  Clock,
  FileDown,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import Image from "next/image";
import { clubInfo } from "@/config/club";

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
        html += '<ul class="list-disc pl-5 mt-4 space-y-2 text-gray-700">';
        inList = true;
      }
      html += `<li>${trimmedLine.substring(1).trim()}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p class="mt-6 text-gray-800 leading-relaxed">${trimmedLine}</p>`;
    }
  });

  if (inList) html += "</ul>";
  return { __html: html };
};

// --- Main Client Component ---

export default function PrintClientPage({ service }: { service: Service }) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const hasAdditionalInfo =
    service.targetGroups?.length ||
    service.grantsLicense ||
    service.grantsApparel ||
    service.durationMinutes;

  const handleDownloadPDF = async () => {
    if (!printableRef.current) {
      toast.error("Елементът за принтиране не е намерен.");
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const { generatePdfFromElement } = await import("@/lib/html-to-pdf");
      await generatePdfFromElement(
        printableRef.current,
        `Service-${service.name.replace(/\s+/g, "_")}.pdf`
      );
      toast.success("PDF файлът беше генериран успешно!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Възникна грешка при генерирането на PDF файла.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
            @page {
                margin: 15mm;
                size: A4;
            }
            body * { visibility: hidden; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                padding: 0;
            }
            .no-print { display: none; }
        }
        
        .service-print-container {
            font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>

      <div className="service-print-container mx-auto max-w-4xl p-4 sm:p-8">
        {/* ACTION BAR */}
        <div className="no-print mb-10 flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="bg-white"
          >
            <Printer className="mr-2 size-4" />
            Принтирай
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="default"
            disabled={isGeneratingPDF}
          >
            <FileDown className="mr-2 size-4" />
            {isGeneratingPDF ? "Генериране..." : "Изтегли PDF"}
          </Button>
        </div>

        <div
          ref={printableRef}
          className="printable-area border border-gray-100 bg-white p-8 shadow-sm sm:p-16"
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            wordSpacing: "2px",
          }}
        >
          {/* --- HEADER --- */}
          <header className="mb-12 flex items-start justify-between border-b-4 border-gray-900 pb-8">
            <div className="flex items-center">
              <div className="relative mr-6 size-16">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-black tracking-tight text-gray-900 uppercase">
                  {service.name}
                </h1>
                <div className="flex items-center text-lg font-bold tracking-widest text-gray-500 uppercase">
                  <Calendar className="mr-2 size-5 text-gray-400" />
                  <span>{service.billingPeriod || service.type}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="mb-1 text-xs font-black tracking-tighter text-gray-400 uppercase">
                Предложение за услуга
              </p>
              <p className="text-4xl font-black text-gray-900">
                {formatPrice(service.price)}
              </p>
            </div>
          </header>

          {/* --- MAIN DESCRIPTION --- */}
          <div className="mb-16">
            <h3 className="mb-6 border-b pb-2 text-xs font-black tracking-[0.2em] text-gray-400 uppercase">
              Описание на услугата
            </h3>
            <div
              className="prose prose-xl max-w-none text-gray-800"
              dangerouslySetInnerHTML={formatDescription(service.description)}
            />
          </div>

          {/* --- ADDITIONAL DETAILS --- */}
          {hasAdditionalInfo && (
            <div className="mt-12 border-t-2 border-dashed border-gray-200 pt-10">
              <h2 className="mb-8 text-xs font-black tracking-[0.2em] text-gray-400 uppercase">
                Спецификации и условия
              </h2>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                {service.targetGroups && service.targetGroups.length > 0 && (
                  <div className="flex items-start rounded-lg bg-gray-50 p-6">
                    <Users className="mt-0.5 mr-4 size-6 text-gray-900" />
                    <div>
                      <p className="mb-1 text-xs font-bold text-gray-400 uppercase">
                        Целеви групи
                      </p>
                      <p className="font-bold text-gray-900">
                        {service.targetGroups.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {service.durationMinutes && (
                  <div className="flex items-start rounded-lg bg-gray-50 p-6">
                    <Clock className="mt-0.5 mr-4 size-6 text-gray-900" />
                    <div>
                      <p className="mb-1 text-xs font-bold text-gray-400 uppercase">
                        Продължителност
                      </p>
                      <p className="font-bold text-gray-900">
                        {service.durationMinutes} минути
                      </p>
                    </div>
                  </div>
                )}

                {service.grantsLicense && (
                  <div className="col-span-full flex items-start rounded-lg bg-gray-50 p-6">
                    <Award className="mt-0.5 mr-4 size-6 text-gray-900" />
                    <div>
                      <p className="mb-1 text-xs font-bold text-gray-400 uppercase">
                        Картотека
                      </p>
                      <p className="font-bold text-gray-900">
                        {service.licenseCondition || "Включена"}
                        <span className="ml-2 font-normal text-gray-500">
                          {formatPaymentCount(service.licensePaymentCount || 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {service.grantsApparel && (
                  <div className="col-span-full flex items-start rounded-lg bg-gray-50 p-6">
                    <Shirt className="mt-0.5 mr-4 size-6 text-gray-900" />
                    <div>
                      <p className="mb-1 text-xs font-bold text-gray-400 uppercase">
                        Екипировка
                      </p>
                      <p className="font-bold text-gray-900">
                        {service.apparelCondition || "Предоставена"}
                        <span className="ml-2 font-normal text-gray-500">
                          {formatPaymentCount(service.apparelPaymentCount || 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <footer className="mt-24 flex items-center justify-between border-t border-gray-100 pt-8">
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-900 uppercase">
                {clubInfo.name}
              </p>
              <p className="mt-1 text-[10px] tracking-widest text-gray-400 uppercase">
                Официално предложение
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest text-gray-400 uppercase">
                Генерирано на
              </p>
              <p className="text-xs font-bold text-gray-900">
                {new Date().toLocaleDateString("bg-BG")}
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
