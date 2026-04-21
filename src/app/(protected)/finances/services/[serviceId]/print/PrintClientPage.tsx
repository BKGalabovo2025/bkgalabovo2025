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
import Script from "next/script";
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

// Declare global types for CDN-loaded libraries
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (options?: {
        orientation?: "portrait" | "landscape";
        unit?: "mm" | "pt" | "in" | "cm";
        format?: string | string[];
      }) => {
        getImageProperties: (data: string) => { width: number; height: number };
        internal: { pageSize: { getWidth: () => number } };
        addImage: (
          data: string,
          type: string,
          x: number,
          y: number,
          w: number,
          h: number
        ) => void;
        save: (filename: string) => void;
      };
    };
    html2canvas: (
      element: HTMLElement,
      options?: {
        scale?: number;
        useCORS?: boolean;
        logging?: boolean;
        backgroundColor?: string | null;
      }
    ) => Promise<HTMLCanvasElement>;
  }
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
    if (!printableRef.current || !window.jspdf || !window.html2canvas) {
      toast.error(
        "Библиотеките за PDF все още се зареждат. Моля, опитайте след малко."
      );
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const element = printableRef.current;

      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new window.jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Service-${service.name.replace(/\s+/g, "_")}.pdf`);

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
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        strategy="lazyOnload"
      />

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

      <div className="max-w-4xl mx-auto p-4 sm:p-8 service-print-container">
        {/* ACTION BAR */}
        <div className="flex justify-end items-center mb-10 no-print gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="bg-white"
          >
            <Printer className="mr-2 h-4 w-4" />
            Принтирай
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="default"
            disabled={isGeneratingPDF}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isGeneratingPDF ? "Генериране..." : "Изтегли PDF"}
          </Button>
        </div>

        <div
          ref={printableRef}
          className="bg-white p-8 sm:p-16 printable-area border border-gray-100 shadow-sm"
        >
          {/* --- HEADER --- */}
          <header className="flex justify-between items-start mb-12 border-b-4 border-gray-900 pb-8">
            <div className="flex items-center">
              <div className="relative w-16 h-16 mr-6">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                  {service.name}
                </h1>
                <div className="flex items-center text-lg font-bold text-gray-500 uppercase tracking-widest">
                  <Calendar className="mr-2 h-5 w-5 text-gray-400" />
                  <span>{service.billingPeriod || service.type}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-1">
                Предложение за услуга
              </p>
              <p className="text-4xl font-black text-gray-900">
                {formatPrice(service.price)}
              </p>
            </div>
          </header>

          {/* --- MAIN DESCRIPTION --- */}
          <div className="mb-16">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b pb-2">
              Описание на услугата
            </h3>
            <div
              className="prose prose-xl max-w-none text-gray-800"
              dangerouslySetInnerHTML={formatDescription(service.description)}
            />
          </div>

          {/* --- ADDITIONAL DETAILS --- */}
          {hasAdditionalInfo && (
            <div className="mt-12 pt-10 border-t-2 border-dashed border-gray-200">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">
                Спецификации и условия
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {service.targetGroups && service.targetGroups.length > 0 && (
                  <div className="flex items-start bg-gray-50 p-6 rounded-lg">
                    <Users className="h-6 w-6 mr-4 mt-0.5 text-gray-900" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Целеви групи
                      </p>
                      <p className="font-bold text-gray-900">
                        {service.targetGroups.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {service.durationMinutes && (
                  <div className="flex items-start bg-gray-50 p-6 rounded-lg">
                    <Clock className="h-6 w-6 mr-4 mt-0.5 text-gray-900" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Продължителност
                      </p>
                      <p className="font-bold text-gray-900">
                        {service.durationMinutes} минути
                      </p>
                    </div>
                  </div>
                )}

                {service.grantsLicense && (
                  <div className="flex items-start bg-gray-50 p-6 rounded-lg col-span-full">
                    <Award className="h-6 w-6 mr-4 mt-0.5 text-gray-900" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
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
                  <div className="flex items-start bg-gray-50 p-6 rounded-lg col-span-full">
                    <Shirt className="h-6 w-6 mr-4 mt-0.5 text-gray-900" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
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

          <footer className="mt-24 pt-8 border-t border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                {clubInfo.name}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                Официално предложение
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">
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
