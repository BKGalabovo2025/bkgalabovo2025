"use client";

import {
  AlertCircle,
  Edit3,
  Eye,
  FileDown,
  FilePlus2,
  FileText,
  Layers,
  Loader2,
  Paperclip,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import React, { useEffect, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  createDocumentTemplateAction,
  deleteDocumentTemplateAction,
  getDocumentTemplatesAction,
  updateDocumentTemplateAction,
} from "@/lib/actions/document-templates";
import { cn } from "@/lib/utils";
import {
  CreateDocumentTemplateInput,
  DOCUMENT_CATEGORY_LABELS,
  DocumentTemplate,
  DocumentTemplateCategory,
} from "@/types/document-template.types";

import { OfficialDocumentRenderer } from "./OfficialDocumentRenderer";

const initialFormData: CreateDocumentTemplateInput = {
  title: "",
  slug: "",
  description: "",
  category: "custom",
  content: "",
  headerType: "official_club",
  addressee: "",
  salutation: "",
  applicantLayout: "none",
  checkboxes: [],
  signatures: {
    requireParent: true,
    requireSecondParent: false,
    requireMember: false,
    requirePresident: false,
    presidentName: "Мира Георгиева",
    presidentRole: "Председател",
  },
  closingLocation: "гр. Гълъбово",
  pageCount: 1,
  fileUrl: null,
  fileName: null,
  fileType: null,
  fileSize: null,
  isRequiredForMember: true,
  isActive: true,
};

export function DocumentTemplatesManager() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplate | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] =
    useState<CreateDocumentTemplateInput>(initialFormData);
  const [newCheckboxLabel, setNewCheckboxLabel] = useState("");
  const [dialogTab, setDialogTab] = useState<"form" | "preview">("form");

  const loadTemplates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await getDocumentTemplatesAction();
      if (res.success && res.data) {
        setTemplates(res.data);
      } else {
        setErrorMessage(res.error || "Грешка при зареждане на образците.");
      }
    } catch {
      setErrorMessage("Неочаквана грешка при свързване.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setNewCheckboxLabel("");
    setDialogTab("form");
    setErrorMessage(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (template: DocumentTemplate) => {
    setActiveTemplate(template);
    setFormData({
      title: template.title,
      slug: template.slug,
      description: template.description || "",
      category: template.category,
      content: template.content,
      headerType: template.headerType ?? "official_club",
      addressee: template.addressee ?? "",
      salutation: template.salutation ?? "",
      applicantLayout: template.applicantLayout ?? "none",
      checkboxes: template.checkboxes ?? [],
      signatures: template.signatures ?? {
        requireParent: true,
        requireSecondParent: false,
        requireMember: false,
        requirePresident: false,
        presidentName: "Мира Георгиева",
        presidentRole: "Председател",
      },
      closingLocation: template.closingLocation || "гр. Гълъбово",
      pageCount: template.pageCount ?? 1,
      fileUrl: template.fileUrl,
      fileName: template.fileName,
      fileType: template.fileType,
      fileSize: template.fileSize,
      isRequiredForMember: template.isRequiredForMember,
      isActive: template.isActive,
    });
    setNewCheckboxLabel("");
    setDialogTab("form");
    setErrorMessage(null);
    setEditDialogOpen(true);
  };

  const handleOpenPreview = (template: DocumentTemplate) => {
    setActiveTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleAddCheckbox = () => {
    if (!newCheckboxLabel.trim()) return;
    setFormData((prev) => ({
      ...prev,
      checkboxes: [
        ...(prev.checkboxes || []),
        {
          id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          label: newCheckboxLabel.trim(),
          checkedByDefault: false,
        },
      ],
    }));
    setNewCheckboxLabel("");
  };

  const handleRemoveCheckbox = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checkboxes: (prev.checkboxes || []).filter((c) => c.id !== id),
    }));
  };

  const handleInsertTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content} ${tag}` : tag,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    let fileType: "pdf" | "docx" | "doc" | "image" | "other" = "other";
    if (extension === "pdf") fileType = "pdf";
    else if (extension === "docx") fileType = "docx";
    else if (extension === "doc") fileType = "doc";
    else if (["png", "jpg", "jpeg", "webp"].includes(extension || ""))
      fileType = "image";

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        fileUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();
      const res = await createDocumentTemplateAction(formData, idToken);
      if (res.success && res.data) {
        setTemplates((prev) => [res.data!, ...prev]);
        setCreateDialogOpen(false);
      } else {
        setErrorMessage(res.error || "Грешка при създаване на образеца.");
      }
    } catch {
      setErrorMessage("Неочаквана грешка при запазване.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeTemplate) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();
      const res = await updateDocumentTemplateAction(
        activeTemplate.id,
        formData,
        idToken
      );
      if (res.success && res.data) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === activeTemplate.id ? res.data! : t))
        );
        setEditDialogOpen(false);
      } else {
        setErrorMessage(res.error || "Грешка при обновяване на образеца.");
      }
    } catch {
      setErrorMessage("Неочаквана грешка при обновяване.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template: DocumentTemplate) => {
    if (!user) return;
    if (
      !window.confirm(
        `Сигурни ли сте, че искате да изтриете образеца "${template.title}"?`
      )
    ) {
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const res = await deleteDocumentTemplateAction(template.id, idToken);
      if (res.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      } else {
        alert(res.error || "Грешка при изтриване.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Грешка при изтриване.");
    }
  };

  const handlePrintBlank = (template: DocumentTemplate) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="utf-8">
        <title>${template.title} — Официален образец</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff;
            color: #0f172a;
            font-family: 'Times New Roman', Times, serif;
          }
          .header-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .logo-group {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-img {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          .header-text {
            font-size: 8.5pt;
            line-height: 1.3;
          }
          .title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 15px 0 10px 0;
            letter-spacing: 1px;
          }
          .addressee {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 15px;
          }
          .addressee-inner {
            width: 50%;
            text-align: left;
            font-size: 10pt;
            white-space: pre-line;
            font-weight: bold;
          }
          .body-content {
            font-size: 10.5pt;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-line;
            margin: 15px 0;
          }
          .checkboxes-box {
            margin: 15px 0;
            font-size: 10pt;
          }
          .chk-row {
            margin: 4px 0;
          }
          .footer-box {
            margin-top: 35px;
            padding-top: 15px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        ${
          template.headerType !== "none"
            ? `
          <div class="header-box">
            <div class="logo-group">
              <img src="/icons/LOGO.webp" class="logo-img" onerror="this.src='/icons/LOGO.jpg'" />
              <div class="header-text">
                <div style="font-weight: bold; font-size: 9.5pt;">СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“</div>
                <div style="font-style: italic;">гр. Гълъбово, п.к 6280, обл. Стара Загора, ул. "Иван Вазов" №22</div>
                <div>тел: <b>+359 899 82 99 23</b> – Мира Георгиева</div>
                <div>e-mail: bk_galabovo@abv.bg</div>
              </div>
            </div>
          </div>
        `
            : ""
        }
        
        <div class="title">${template.title}</div>
        
        ${
          template.addressee
            ? `
          <div class="addressee">
            <div class="addressee-inner">${template.addressee}</div>
          </div>
        `
            : ""
        }

        ${
          template.salutation
            ? `
          <div style="font-weight: bold; margin: 10px 0; font-size: 10.5pt;">${template.salutation}</div>
        `
            : ""
        }

        <div class="body-content">
          ${template.content}
        </div>

        ${
          template.checkboxes && template.checkboxes.length > 0
            ? `
          <div class="checkboxes-box">
            ${template.checkboxes
              .map((c) => `<div class="chk-row">☐ ${c.label}</div>`)
              .join("")}
          </div>
        `
            : ""
        }

        <div class="footer-box">
          <div>
            <div>${template.closingLocation || "гр. Гълъбово"}</div>
            <div style="margin-top: 5px;">Дата: ............................. г.</div>
          </div>
          <div style="text-align: right;">
            <div>Подпис: ....................................................</div>
            ${
              template.signatures?.requirePresident
                ? `
              <div style="margin-top: 12px; font-weight: bold;">Председател: ${template.signatures.presidentName}</div>
            `
                : ""
            }
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Reusable form fields for both Create and Edit modals
  const renderStructuredFormFields = () => (
    <div className="space-y-4">
      {/* 1. Основни настройки */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-zinc-800">
          Заглавие на документа *
        </Label>
        <Input
          required
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="напр. Молба за членство или Декларация за съгласие"
          className="rounded-xl text-xs h-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-800">Категория</Label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value as DocumentTemplateCategory,
              }))
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-800">
            Официална клубна шапка с лого
          </Label>
          <select
            value={formData.headerType || "official_club"}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                headerType: e.target.value as "official_club" | "none",
              }))
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            <option value="official_club">
              Включи официална клубна шапка с лого
            </option>
            <option value="none">Без шапка (за правилник и инструктаж)</option>
          </select>
        </div>
      </div>

      {/* 2. Адресат и Идентификационен блок */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-800">
            Адресат (ДО...)
          </Label>
          <Input
            value={formData.addressee || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, addressee: e.target.value }))
            }
            placeholder="напр. До ДИРЕКТОРА на... или ДО ПРЕДСЕДАТЕЛЯ НА..."
            className="rounded-xl text-xs h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-800">
            Обръщение (по избор)
          </Label>
          <Input
            value={formData.salutation || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, salutation: e.target.value }))
            }
            placeholder="напр. Госпо/дин/жо Директор , или Уважаема госпожо Председател,"
            className="rounded-xl text-xs h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-800">
            Идентификационен блок на лицето
          </Label>
          <select
            value={formData.applicantLayout || "none"}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                applicantLayout: e.target.value as
                  | "none"
                  | "parent_for_child"
                  | "two_parents_and_child"
                  | "school_note",
              }))
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            <option value="none">Без идентификационен блок</option>
            <option value="parent_for_child">
              Блок ОТ / ЗА (Родител и състезател)
            </option>
            <option value="two_parents_and_child">
              Двама родители и дете (Баща, Майка, Дете с ЕГН)
            </option>
            <option value="school_note">
              Училищна бележка (Ученик, клас, училище)
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-800">
            Обем на документа (А4)
          </Label>
          <select
            value={formData.pageCount || 1}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pageCount: Number(e.target.value),
              }))
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            <option value={1}>
              1 страница А4 (стандартно за молби, декларации и бележки)
            </option>
            <option value={2}>2 страници А4 (за вътрешен правилник)</option>
          </select>
        </div>
      </div>

      {/* 3. Чекбоксове / Форми на участие (динамично добавяне) */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
        <div>
          <Label className="text-xs font-bold text-zinc-900">
            Чекбоксове и форми на участие в документа
          </Label>
          <p className="text-[11px] text-zinc-500">
            Добавете опции за избор (напр. такси) или точки за съгласие, които
            да се показват в бланката.
          </p>
        </div>

        {formData.checkboxes && formData.checkboxes.length > 0 && (
          <div className="space-y-1.5">
            {formData.checkboxes.map((chk) => (
              <div
                key={chk.id}
                className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-zinc-200 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded-xs border border-zinc-400 bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-800">
                    ☑
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {chk.label}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCheckbox(chk.id)}
                  className="h-7 px-2 text-[11px] text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Премахни
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Input
            value={newCheckboxLabel}
            onChange={(e) => setNewCheckboxLabel(e.target.value)}
            placeholder="напр. Месечен абонамент – 1 дете (20 EUR) или Декларирам, че..."
            className="text-xs h-9 bg-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCheckbox();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddCheckbox}
            className="h-9 px-3 text-xs font-bold bg-zinc-950 text-white shrink-0 hover:bg-zinc-800"
          >
            <Plus className="mr-1 size-3.5" />
            Добави чекбокс
          </Button>
        </div>
      </div>

      {/* 4. Текст на документа и бързи маркери */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-zinc-800">
            Текст на документа (клаузи и съдържание) *
          </Label>
          <span className="text-[10px] text-zinc-500">
            Използвайте маркерите по-долу за автоматично заместване
          </span>
        </div>

        {/* Бързи бутони за маркери */}
        <div className="flex flex-wrap gap-1.5 py-1">
          {[
            { label: "+ Име на състезател", tag: "{{memberName}}" },
            { label: "+ Дата на раждане", tag: "{{birthDate}}" },
            { label: "+ Име на родител", tag: "{{parentName}}" },
            { label: "+ Телефон", tag: "{{parentPhone}}" },
            { label: "+ Училище", tag: "{{school}}" },
            { label: "+ Клас", tag: "{{grade}}" },
            { label: "+ Текуща дата", tag: "{{todayDate}}" },
          ].map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => handleInsertTag(item.tag)}
              className="rounded-lg bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        <Textarea
          required
          rows={10}
          value={formData.content}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, content: e.target.value }))
          }
          placeholder="Въведете официалния текст, точки, параграфи и клаузи на документа..."
          className="rounded-xl font-mono text-xs leading-relaxed"
        />
      </div>

      {/* 5. Изисквания за подписи */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2">
        <Label className="text-xs font-bold text-zinc-900">
          Кой подписва този документ?
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={formData.signatures?.requireParent ?? true}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  signatures: {
                    requireParent: e.target.checked,
                    requireSecondParent:
                      prev.signatures?.requireSecondParent ?? false,
                    requireMember: prev.signatures?.requireMember ?? false,
                    requirePresident:
                      prev.signatures?.requirePresident ?? false,
                    presidentName:
                      prev.signatures?.presidentName || "Мира Георгиева",
                    presidentRole:
                      prev.signatures?.presidentRole || "Председател",
                  },
                }))
              }
              className="size-4 rounded-xs accent-zinc-950"
            />
            <span>Родител / Настойник</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={formData.signatures?.requireSecondParent ?? false}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  signatures: {
                    requireParent: prev.signatures?.requireParent ?? true,
                    requireSecondParent: e.target.checked,
                    requireMember: prev.signatures?.requireMember ?? false,
                    requirePresident:
                      prev.signatures?.requirePresident ?? false,
                    presidentName:
                      prev.signatures?.presidentName || "Мира Георгиева",
                    presidentRole:
                      prev.signatures?.presidentRole || "Председател",
                  },
                }))
              }
              className="size-4 rounded-xs accent-zinc-950"
            />
            <span>Втори родител</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={formData.signatures?.requireMember ?? false}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  signatures: {
                    requireParent: prev.signatures?.requireParent ?? true,
                    requireSecondParent:
                      prev.signatures?.requireSecondParent ?? false,
                    requireMember: e.target.checked,
                    requirePresident:
                      prev.signatures?.requirePresident ?? false,
                    presidentName:
                      prev.signatures?.presidentName || "Мира Георгиева",
                    presidentRole:
                      prev.signatures?.presidentRole || "Председател",
                  },
                }))
              }
              className="size-4 rounded-xs accent-zinc-950"
            />
            <span>Състезател</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={formData.signatures?.requirePresident ?? false}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  signatures: {
                    requireParent: prev.signatures?.requireParent ?? true,
                    requireSecondParent:
                      prev.signatures?.requireSecondParent ?? false,
                    requireMember: prev.signatures?.requireMember ?? false,
                    requirePresident: e.target.checked,
                    presidentName:
                      prev.signatures?.presidentName || "Мира Георгиева",
                    presidentRole:
                      prev.signatures?.presidentRole || "Председател",
                  },
                }))
              }
              className="size-4 rounded-xs accent-zinc-950"
            />
            <span>Председател на клуба</span>
          </label>
        </div>
      </div>

      {/* 6. Заключителни данни */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-800">
            Място на издаване
          </Label>
          <Input
            value={formData.closingLocation || "гр. Гълъбово"}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                closingLocation: e.target.value,
              }))
            }
            className="rounded-xl text-xs h-10"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 border border-zinc-200 mt-5">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-zinc-900">
              Показвай в досието на състезателя
            </span>
          </div>
          <input
            type="checkbox"
            checked={formData.isRequiredForMember}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isRequiredForMember: e.target.checked,
              }))
            }
            className="size-5 rounded-md accent-zinc-950"
          />
        </div>
      </div>

      {/* 7. Прикачен файл (по избор) */}
      <div className="rounded-2xl border border-dashed border-zinc-300 p-4 bg-zinc-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <Paperclip className="size-3.5 text-zinc-500" />
              Прикачен файл (оригинален PDF или Word образец)
            </span>
            <p className="text-[11px] text-zinc-500">
              Незадължително. Родителите и треньорите ще могат да изтеглят
              оригиналния файл.
            </p>
          </div>

          <label className="cursor-pointer">
            <div className="flex items-center gap-1.5 rounded-xl bg-white border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition-all shadow-xs">
              <Upload className="size-3.5" />
              <span>Избери файл</span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {formData.fileName && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-2.5 border border-zinc-200 text-xs">
            <span className="font-semibold text-zinc-900 truncate">
              {formData.fileName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  fileName: null,
                  fileUrl: null,
                  fileType: null,
                }))
              }
              className="h-7 text-[11px] text-rose-500 hover:bg-rose-50"
            >
              Премахни
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
            Документи и бланки
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Управление на официалните образци на документи, декларации и молби
            на СНЦ „Бадминтон клуб Гълъбово”.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTemplates}
            disabled={isLoading}
            className="rounded-2xl border-zinc-200 text-xs font-semibold hover:bg-zinc-100"
          >
            <RefreshCw
              className={cn("size-3.5 mr-1.5", isLoading && "animate-spin")}
            />
            Обнови
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-2xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 shadow-xs"
          >
            <Plus className="size-3.5 mr-1.5" />
            Нов документ
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търсене по заглавие, описание или текст..."
            className="pl-10 h-10 rounded-2xl border-zinc-200 bg-white text-xs shadow-2xs"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-2xl border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
          >
            <option value="all">Всички категории</option>
            {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-zinc-100">
          <Loader2 className="size-8 animate-spin text-zinc-400 mb-3" />
          <p className="text-xs text-zinc-500 font-medium">
            Зареждане на образците на документи...
          </p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-zinc-100 text-center">
          <FileText className="size-12 text-zinc-300 mb-3" strokeWidth={1} />
          <h3 className="text-sm font-bold text-zinc-900">
            Няма намерени образци
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Не са открити образци отговарящи на търсенето или филтъра.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => {
            const isDefault = [
              "internalRules",
              "membershipApplication",
              "signedDeclaration",
              "safetyInstruction",
              "travelDeclaration",
              "terminationRequest",
              "schoolRelease",
              "schoolAbsence",
            ].includes(template.id);

            return (
              <div
                key={template.id}
                className={cn(
                  "flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-xs transition-all hover:shadow-md",
                  template.isActive
                    ? "border-zinc-200/80"
                    : "border-zinc-200/50 opacity-60 bg-zinc-50/50"
                )}
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-700">
                      <Layers className="size-3 text-zinc-500" />
                      {DOCUMENT_CATEGORY_LABELS[template.category] ||
                        template.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        v{template.version}
                      </span>
                      {template.isRequiredForMember && (
                        <span
                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-200"
                          title="Този документ автоматично се появява в таб Документи на всички състезатели"
                        >
                          В досиетата
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 leading-snug">
                      {template.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs font-light text-zinc-500">
                      {template.description || "Официална бланка на клуба"}
                    </p>
                  </div>

                  {/* Attached File Preview if present */}
                  {template.fileName && (
                    <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-2.5 border border-zinc-200/60 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="size-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate font-medium text-zinc-800">
                          {template.fileName}
                        </span>
                      </div>
                      {template.fileUrl && (
                        <a
                          href={template.fileUrl}
                          download={template.fileName}
                          className="shrink-0 text-emerald-600 hover:text-emerald-700 p-1"
                          title="Свали файла"
                        >
                          <FileDown className="size-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Content snippet */}
                  <div className="rounded-2xl bg-zinc-50/70 p-3 text-[11px] font-mono text-zinc-600 line-clamp-3 leading-relaxed border border-zinc-100">
                    {template.content}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPreview(template)}
                      className="h-9 rounded-xl px-2.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      title="Преглед на официалния документ"
                    >
                      <Eye className="size-3.5 mr-1" />
                      Преглед
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePrintBlank(template)}
                      className="h-9 rounded-xl px-2.5 text-xs text-zinc-700 hover:bg-zinc-100"
                      title="Принтирай празен образец"
                    >
                      <Printer className="size-3.5 mr-1" />
                      Печат
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(template)}
                      className="h-9 rounded-xl border-zinc-200 px-3 text-xs font-semibold hover:bg-zinc-950 hover:text-white"
                      title="Редактирай образеца"
                    >
                      <Edit3 className="size-3.5 mr-1" />
                      Редакция
                    </Button>

                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template)}
                        className="h-9 rounded-xl px-2 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        title="Изтрий образеца"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG: CREATE NEW TEMPLATE */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <FilePlus2 className="size-4" />
                </span>
                <div>
                  <DialogTitle className="text-lg font-bold text-zinc-950">
                    Нов образец на документ
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500">
                    Създайте официален образец с уеднаквен стил, чекбоксове и
                    подписи.
                  </DialogDescription>
                </div>
              </div>

              {/* Tab Switcher: Form vs Live Preview */}
              <div className="flex rounded-xl bg-zinc-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDialogTab("form")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all",
                    dialogTab === "form"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  )}
                >
                  Редакция
                </button>
                <button
                  type="button"
                  onClick={() => setDialogTab("preview")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all",
                    dialogTab === "preview"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  )}
                >
                  Преглед на живо
                </button>
              </div>
            </div>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2 border border-rose-200 mt-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {dialogTab === "form" ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
              {renderStructuredFormFields()}

              <DialogFooter className="mt-6 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  className="rounded-xl text-xs h-10"
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-zinc-950 text-white text-xs font-bold h-10 px-6 hover:bg-zinc-800"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  )}
                  Създай образец
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 max-h-[65vh] overflow-y-auto">
                <OfficialDocumentRenderer
                  slug={formData.slug || "custom"}
                  title={formData.title || "Образец на документ"}
                  headerType={formData.headerType}
                  addressee={formData.addressee}
                  salutation={formData.salutation}
                  applicantLayout={formData.applicantLayout}
                  bodyText={formData.content}
                  closingLocation={formData.closingLocation}
                  pageCount={formData.pageCount}
                  memberName="Адриана Павелинова Павлова"
                  memberBirthDate="2014-05-15"
                  parentName="Георги Иванов Иванов"
                  parentPhone="+359 888 123 456"
                  parentEmail="roditel@example.com"
                  parentAddress="гр. Гълъбово, ул. Иван Вазов №22"
                  isPrintMode={false}
                />
              </div>

              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogTab("form")}
                  className="rounded-xl text-xs h-10"
                >
                  ← Обратно към настройките
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-zinc-950 text-white text-xs font-bold h-10 px-6 hover:bg-zinc-800"
                >
                  Създай образец
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDIT TEMPLATE */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <Edit3 className="size-4" />
                </span>
                <div>
                  <DialogTitle className="text-lg font-bold text-zinc-950">
                    Редакция на образец ({formData.title})
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500">
                    Запазването създава нова версия v
                    {(activeTemplate?.version || 1) + 1}.
                  </DialogDescription>
                </div>
              </div>

              {/* Tab Switcher: Form vs Live Preview */}
              <div className="flex rounded-xl bg-zinc-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDialogTab("form")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all",
                    dialogTab === "form"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  )}
                >
                  Редакция
                </button>
                <button
                  type="button"
                  onClick={() => setDialogTab("preview")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all",
                    dialogTab === "preview"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  )}
                >
                  Преглед на живо
                </button>
              </div>
            </div>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2 border border-rose-200 mt-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {dialogTab === "form" ? (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              {renderStructuredFormFields()}

              <DialogFooter className="mt-6 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="rounded-xl text-xs h-10"
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-zinc-950 text-white text-xs font-bold h-10 px-6 hover:bg-zinc-800"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  )}
                  Запази нова версия (v{(activeTemplate?.version || 1) + 1})
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 max-h-[65vh] overflow-y-auto">
                <OfficialDocumentRenderer
                  slug={formData.slug || activeTemplate?.slug}
                  title={formData.title}
                  headerType={formData.headerType}
                  addressee={formData.addressee}
                  salutation={formData.salutation}
                  applicantLayout={formData.applicantLayout}
                  bodyText={formData.content}
                  closingLocation={formData.closingLocation}
                  pageCount={formData.pageCount}
                  memberName="Адриана Павелинова Павлова"
                  memberBirthDate="2014-05-15"
                  parentName="Георги Иванов Иванов"
                  parentPhone="+359 888 123 456"
                  parentEmail="roditel@example.com"
                  parentAddress="гр. Гълъбово, ул. Иван Вазов №22"
                  isPrintMode={false}
                />
              </div>

              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogTab("form")}
                  className="rounded-xl text-xs h-10"
                >
                  ← Обратно към настройките
                </Button>
                <Button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-zinc-950 text-white text-xs font-bold h-10 px-6 hover:bg-zinc-800"
                >
                  Запази версия v{(activeTemplate?.version || 1) + 1}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: PREVIEW TEMPLATE */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-zinc-950">
                  {activeTemplate?.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                  Официален образец на СНЦ „Бадминтон клуб Гълъбово” (Версия v
                  {activeTemplate?.version})
                </DialogDescription>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                Версия {activeTemplate?.version}
              </span>
            </div>
          </DialogHeader>

          <div className="mt-4 rounded-2xl bg-slate-100 p-4 border border-slate-200 max-h-[65vh] overflow-y-auto">
            {activeTemplate && (
              <OfficialDocumentRenderer
                slug={activeTemplate.slug}
                title={activeTemplate.title}
                headerType={activeTemplate.headerType}
                addressee={activeTemplate.addressee}
                salutation={activeTemplate.salutation}
                applicantLayout={activeTemplate.applicantLayout}
                bodyText={activeTemplate.content}
                closingLocation={activeTemplate.closingLocation}
                pageCount={activeTemplate.pageCount}
                memberName="Адриана Павелинова Павлова"
                memberBirthDate="2014-05-15"
                parentName="Георги Иванов Иванов"
                parentPhone="+359 888 123 456"
                parentEmail="roditel@example.com"
                parentAddress="гр. Гълъбово, ул. Иван Вазов №22"
                isPrintMode={false}
              />
            )}
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            {activeTemplate && (
              <Button
                variant="outline"
                onClick={() => handlePrintBlank(activeTemplate)}
                className="rounded-xl text-xs h-10"
              >
                <Printer className="mr-1.5 size-4" />
                Печат на празен образец
              </Button>
            )}
            <Button
              onClick={() => setPreviewDialogOpen(false)}
              className="rounded-xl bg-zinc-950 text-white text-xs h-10 px-6"
            >
              Затвори
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
