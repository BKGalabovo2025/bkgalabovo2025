"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { collection, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { Clock, FileText, Printer, Search, Trash2, User } from "lucide-react";
import React, { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDb } from "@/lib/firebase";
import { SignedDeclaration } from "@/types";

export default function DeclarationsClient() {
  const [declarations, setDeclarations] = useState<SignedDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchDeclarations() {
      try {
        const q = query(collection(getDb(), "member_declarations"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(
          (doc) => doc.data() as SignedDeclaration
        );

        // Sort by signedAt descending (newest first)
        list.sort(
          (a, b) =>
            new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
        );

        setDeclarations(list);
      } catch (error) {
        console.error("Error fetching declarations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeclarations();
  }, []);

  const handlePrint = () => {
    window.open(
      "/declaration/Декларация за информирано съгласие BG ENG.pdf",
      "_blank"
    );
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Сигурни ли сте, че искате да изтриете декларацията на ${name}? Това действие е необратимо.`
      )
    ) {
      try {
        await deleteDoc(doc(getDb(), "member_declarations", id));
        setDeclarations((prev) => prev.filter((d) => d.id !== id));
      } catch (error) {
        console.error("Error deleting declaration:", error);
        alert("Възникна грешка при изтриването.");
      }
    }
  };

  const filteredDeclarations = declarations.filter(
    (d) =>
      d.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.phone && d.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Декларации за съгласие"
        description="Управление и принтиране на декларации за информирано съгласие."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Декларации" },
        ]}
      >
        <div className="flex w-full sm:w-auto">
          <Button
            onClick={handlePrint}
            className="w-full sm:w-auto print:hidden"
          >
            <Printer className="mr-2 size-4" />
            Разпечатай празен шаблон
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3.5 sm:p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Search className="size-5 text-zinc-400" />
            <Input
              placeholder="Търсене по име или телефон..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>

          {(() => {
            if (loading) {
              return (
                <div className="p-12 text-center text-zinc-500">
                  Зареждане на декларации...
                </div>
              );
            }
            if (filteredDeclarations.length === 0) {
              return (
                <div className="rounded-2xl border border-zinc-100 bg-white p-12 text-center dark:border-zinc-900 dark:bg-zinc-950">
                  <FileText className="mx-auto mb-4 size-12 text-zinc-300" />
                  <h3 className="mb-2 text-lg font-bold text-zinc-900">
                    Няма намерени декларации
                  </h3>
                  <p className="text-zinc-500">
                    Все още няма подписани декларации или нищо не съвпада с
                    търсенето.
                  </p>
                </div>
              );
            }
            return (
              <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filteredDeclarations.map((decl) => (
                    <div
                      key={decl.id}
                      className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4 sm:p-5 dark:hover:bg-zinc-900/50"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <User className="size-4 sm:size-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-white">
                            {decl.memberName}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 sm:gap-x-4 sm:text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {format(
                                new Date(decl.signedAt),
                                "d MMMM yyyy, HH:mm",
                                { locale: bg }
                              )}
                            </span>
                            {decl.phone && <span>{decl.phone}</span>}
                            {decl.isMinor && (
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                                Непълнолетен
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full shrink-0 items-center justify-end gap-2 border-t border-zinc-50 pt-2 sm:w-auto sm:border-0 sm:pt-0 dark:border-zinc-900">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() =>
                            window.open(
                              `/print-declaration/${decl.id}`,
                              "_blank"
                            )
                          }
                        >
                          <Printer className="mr-2 size-4" />
                          Преглед
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          onClick={() => handleDelete(decl.id, decl.memberName)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-zinc-100 p-8 text-center dark:bg-zinc-900">
            <FileText className="mb-4 size-12 text-zinc-300" />
            <h3 className="mb-2 text-lg font-bold text-zinc-900">
              Оригинален PDF шаблон
            </h3>
            <p className="mb-6 text-sm text-zinc-500">
              От тук можете да изтеглите или разпечатате празна бланка, ако ви е
              нужна на хартия.
            </p>
            <Button onClick={handlePrint} variant="outline" className="w-full">
              <Printer className="mr-2 size-4" />
              Отвори шаблона
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
