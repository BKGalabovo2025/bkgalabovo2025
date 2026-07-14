"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Search, User, Clock, Trash2 } from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, query, deleteDoc, doc } from "firebase/firestore";
import { SignedDeclaration } from "@/types";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

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
        <div className="flex gap-3">
          {/* <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? "Отказ" : "Настройки на шаблона"}
          </Button> */}
          <Button onClick={handlePrint} className="print:hidden">
            <Printer className="w-4 h-4 mr-2" />
            Разпечатай празен шаблон
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm">
            <Search className="w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Търсене по име или телефон..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0"
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
                <div className="p-12 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                  <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-zinc-900 mb-2">
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
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-sm">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filteredDeclarations.map((decl) => (
                    <div
                      key={decl.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900 dark:text-white">
                            {decl.memberName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(
                                new Date(decl.signedAt),
                                "d MMMM yyyy, HH:mm",
                                { locale: bg }
                              )}
                            </span>
                            {decl.phone && <span>{decl.phone}</span>}
                            {decl.isMinor && (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-medium">
                                Непълнолетен
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/print-declaration/${decl.id}`,
                              "_blank"
                            )
                          }
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Преглед
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-3"
                          onClick={() => handleDelete(decl.id, decl.memberName)}
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="bg-zinc-100 dark:bg-zinc-900 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Оригинален PDF шаблон
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              От тук можете да изтеглите или разпечатате празна бланка, ако ви е
              нужна на хартия.
            </p>
            <Button onClick={handlePrint} variant="outline" className="w-full">
              <Printer className="w-4 h-4 mr-2" />
              Отвори шаблона
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
