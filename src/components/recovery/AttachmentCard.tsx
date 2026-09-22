"use client";

import { motion } from "framer-motion";
import { CalendarCheck, ChevronDown } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { RecoveryProcedureInfo } from "@/components/recovery/RecoveryInquiryDialog";
import { RecoveryAttachment, resolveAttachmentImage } from "@/types/site.types";

interface AttachmentCardProps {
  attachment: RecoveryAttachment;
  index: number;
  lang?: string;
  onSelectInquiry: (procedure: RecoveryProcedureInfo) => void;
}

export function AttachmentCard({
  attachment,
  index,
  lang = "bg",
  onSelectInquiry,
}: AttachmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const zoneName = attachment.zone || attachment.name;
  const buttonLabel =
    attachment.buttonText ||
    (lang === "en"
      ? `Book ${attachment.name}`
      : `Запиши час за ${attachment.name.toLowerCase()}`);

  const isDuplicateSubtitle =
    Boolean(attachment.subtitle) &&
    attachment.subtitle?.trim().toLowerCase() ===
      attachment.name?.trim().toLowerCase();

  const defaultCategory =
    lang === "en" ? "Recovery Attachment" : "Приставка за възстановяване";
  const categoryLabel =
    attachment.subtitle && !isDuplicateSubtitle
      ? attachment.subtitle
      : defaultCategory;

  const collapseLabel = lang === "en" ? "Show less" : "Свий текста";
  const expandLabel = lang === "en" ? "Read more" : "Прочети още";
  const toggleLabel = isExpanded ? collapseLabel : expandLabel;

  const description = attachment.desc || "";
  const shouldTruncate = description.length > 110;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
    >
      <div className="relative flex h-64 w-full shrink-0 items-center justify-center overflow-hidden border-b border-zinc-900/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-6">
        <div className="relative size-full transform transition-transform duration-500 group-hover:scale-105">
          <Image
            src={resolveAttachmentImage(attachment.image, "/zones/legs.webp")}
            alt={attachment.name || "Приставка"}
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
        <div className="flex flex-col">
          <p className="text-xs font-semibold tracking-wider text-emerald-400/90 uppercase">
            {categoryLabel}
          </p>

          <h3 className="mt-1 text-xl font-bold tracking-wider text-white uppercase transition-colors group-hover:text-emerald-300">
            {attachment.name}
          </h3>

          <div className="my-3 h-0.5 w-10 rounded-full bg-emerald-500/30" />

          <div className="text-sm leading-relaxed text-zinc-400">
            <p
              className={`transition-all duration-300 ${
                !isExpanded && shouldTruncate ? "line-clamp-3" : ""
              }`}
            >
              {description}
            </p>

            {shouldTruncate && (
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold tracking-wider text-emerald-400 uppercase transition-colors hover:text-emerald-300 focus:outline-none"
              >
                <span>{toggleLabel}</span>
                <ChevronDown
                  className={`size-3.5 transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4">
          <button
            type="button"
            onClick={() =>
              onSelectInquiry({
                title: `Зона „${zoneName}“`,
                preferredZone: zoneName,
              })
            }
            className="active:scale-0.98 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-xs font-bold tracking-wider text-emerald-400 uppercase transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          >
            <CalendarCheck size={16} />
            <span>{buttonLabel}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
