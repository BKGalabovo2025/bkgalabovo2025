"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Minus,
  Package,
  Plus,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { SearchableMemberSelect } from "@/components/tournaments/searchable-member-select";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProductsServerAction } from "@/lib/actions/products-server";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { getAllClubServices } from "@/services/club-service";
import { getAllMembers } from "@/services/member-service";
import { useAppStore } from "@/store/use-app-store";
import { ClubService, Member, Product, Sale } from "@/types";

export type SaleItem = Sale["items"][0];

export interface SaleFormSubmitData {
  cart: SaleItem[];
  memberId: string;
  status: Sale["status"];
  totalAmount: number;
  paymentMethod?: string;
  note?: string;
  saleDate?: string;
  clientName?: string;
  clientPhone?: string;
}

export interface SaleFormManagerProps {
  title: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  cancelUrl: string;
  initialCart?: SaleItem[];
  initialMemberId?: string;
  initialStatus?: Sale["status"];
  initialSale?: Sale | null;
  submitText: string;
  onSubmit: (data: SaleFormSubmitData) => Promise<void>;
  isSubmitting: boolean;
}

interface CatalogCatalogItem {
  id: string;
  name: string;
  price: number;
  type: "product" | "service";
  category?: string;
}

export function SaleFormManager({
  title,
  description,
  breadcrumbs,
  cancelUrl,
  initialCart = [],
  initialMemberId = "none",
  initialStatus = "completed",
  initialSale = null,
  submitText,
  onSubmit,
  isSubmitting,
}: SaleFormManagerProps) {
  const router = useRouter();
  const { activeBranch } = useAppStore();

  // Members & Catalog Data
  const [members, setMembers] = useState<Member[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogCatalogItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [cart, setCart] = useState<SaleItem[]>(initialCart);
  const [customerType, setCustomerType] = useState<"member" | "guest">(
    initialMemberId === "GUEST_EXTERNAL" ||
      (!initialMemberId && initialSale?.clientName)
      ? "guest"
      : "member"
  );
  const [selectedMemberId, setSelectedMemberId] =
    useState<string>(initialMemberId);
  const [clientName, setClientName] = useState(initialSale?.clientName || "");
  const [clientPhone, setClientPhone] = useState(
    initialSale?.clientPhone || ""
  );

  const [paymentStatus, setPaymentStatus] =
    useState<Sale["status"]>(initialStatus);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialSale?.paymentMethod || "В брой"
  );
  const [saleDate, setSaleDate] = useState<string>(() => {
    if (initialSale?.saleDate) {
      try {
        return new Date(initialSale.saleDate).toISOString().substring(0, 10);
      } catch {
        // ignore
      }
    }
    return new Date().toISOString().substring(0, 10);
  });
  const [note, setNote] = useState<string>(initialSale?.note || "");

  // Add Item Box State
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [customItemName, setCustomItemName] = useState<string>("");
  const [customItemPrice, setCustomItemPrice] = useState<string>("");
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [addItemMode, setAddItemMode] = useState<"catalog" | "custom">(
    "catalog"
  );

  // Sync initial props on change
  useEffect(() => {
    if (initialCart.length > 0) {
      setCart(initialCart);
    }
  }, [initialCart]);

  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
      if (initialMemberId === "GUEST_EXTERNAL") {
        setCustomerType("guest");
      }
    }
  }, [initialMemberId]);

  useEffect(() => {
    if (initialStatus) {
      setPaymentStatus(initialStatus);
    }
  }, [initialStatus]);

  // Load Members & Products
  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        setLoadingData(true);
        const [membersData, productsRes, servicesData] = await Promise.all([
          getAllMembers(false, activeBranch),
          getProductsServerAction(activeBranch),
          getAllClubServices(),
        ]);

        if (!isMounted) return;

        setMembers(membersData || []);

        const combined: CatalogCatalogItem[] = [];

        if (productsRes.success && Array.isArray(productsRes.data)) {
          productsRes.data.forEach((p: Product) => {
            combined.push({
              id: p.id,
              name: p.name,
              price: Number(p.price) || 0,
              type: "product",
              category: p.category || "Склад",
            });
          });
        }

        if (Array.isArray(servicesData)) {
          servicesData.forEach((s: ClubService) => {
            combined.push({
              id: s.id,
              name: s.name,
              price: Number(s.price) || 0,
              type: "service",
              category: s.category || "Услуги",
            });
          });
        }

        setCatalogItems(combined);
      } catch (err) {
        console.error("Error loading sales catalog data:", err);
        toast.error("Възникна проблем при зареждане на номенклатурата.");
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [activeBranch]);

  // Calculated Live Total
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  // Cart operations
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item
      )
    );
  };

  const updatePrice = (index: number, newPrice: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, price: Math.max(0, newPrice) } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCatalogItem = () => {
    if (!selectedCatalogId) {
      toast.error("Моля, изберете артикул или услуга от каталога.");
      return;
    }

    const item = catalogItems.find((c) => c.id === selectedCatalogId);
    if (!item) return;

    // Check if item already exists in cart
    const existingIndex = cart.findIndex((c) => c.productId === item.id);
    if (existingIndex > -1) {
      updateQuantity(existingIndex, cart[existingIndex].quantity + 1);
      toast.success(`Увеличено количество за "${item.name}"`);
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
      toast.success(`Добавен артикул: "${item.name}"`);
    }

    setSelectedCatalogId("");
  };

  const handleAddCustomItem = () => {
    const trimmedName = customItemName.trim();
    const priceNum = parseFloat(customItemPrice);

    if (!trimmedName) {
      toast.error("Моля, въведете име на артикула или таксата.");
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Моля, въведете валидна цена.");
      return;
    }

    const qty = Math.max(1, customItemQty || 1);
    const customId = `custom_${Date.now()}`;

    setCart((prev) => [
      ...prev,
      {
        productId: customId,
        name: trimmedName,
        price: priceNum,
        quantity: qty,
      },
    ]);

    setCustomItemName("");
    setCustomItemPrice("");
    setCustomItemQty(1);
    toast.success(`Добавен потребителски артикул: "${trimmedName}"`);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (cart.length === 0) {
      toast.error("Количката е празна. Добавете поне един артикул.");
      return;
    }

    let finalMemberId = "none";
    if (customerType === "member") {
      if (!selectedMemberId || selectedMemberId === "none") {
        toast.error("Моля, посочете състезател или изберете 'Външен клиент'.");
        return;
      }
      finalMemberId = selectedMemberId;
    } else {
      finalMemberId = "GUEST_EXTERNAL";
      if (!clientName.trim()) {
        toast.error("Моля, въведете име на клиента.");
        return;
      }
    }

    await onSubmit({
      cart,
      memberId: finalMemberId,
      status: paymentStatus,
      totalAmount,
      paymentMethod,
      note: note.trim() || undefined,
      saleDate: saleDate
        ? new Date(saleDate).toISOString()
        : new Date().toISOString(),
      clientName: customerType === "guest" ? clientName.trim() : undefined,
      clientPhone: customerType === "guest" ? clientPhone.trim() : undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      >
        <Button
          variant="outline"
          size="sm"
          asChild
          className="rounded-xl border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Link href={cancelUrl}>
            <ArrowLeft className="mr-1.5 size-3.5" />
            <span>Назад</span>
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main Column (Cart & Customer Assignment) */}
          <div className="space-y-5 lg:col-span-2">
            {/* 1. Cart Items List */}
            <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <ShoppingCart className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Артикули в продажбата
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Редактирайте количествата, единичните цени или премахнете
                      позиции
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {cart.length} {cart.length === 1 ? "позиция" : "позиции"}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="size-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 dark:bg-zinc-900 dark:text-zinc-500">
                    <Package className="size-6" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Няма добавени артикули
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Използвайте формата по-долу, за да добавите продукт от
                    склада или услуга.
                  </p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {cart.map((item, idx) => {
                    const lineTotal = item.price * item.quantity;
                    return (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
                      >
                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            ID:{" "}
                            <span className="font-mono text-[10px]">
                              {item.productId}
                            </span>
                          </p>
                        </div>

                        {/* Interactive Steppers & Price Input */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* Unit Price */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
                              Ед. цена:
                            </span>
                            <div className="relative w-24">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) =>
                                  updatePrice(
                                    idx,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                aria-label={`Цена за ${item.name}`}
                                className="h-8.5 rounded-lg text-xs font-bold text-right pr-6 bg-zinc-50/70 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 pointer-events-none">
                                €
                              </span>
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50/70 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(idx, item.quantity - 1)
                              }
                              aria-label="Намали количеството"
                              className="size-7 flex items-center justify-center rounded-md text-zinc-600 hover:bg-white hover:text-zinc-950 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-zinc-900 dark:text-white select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(idx, item.quantity + 1)
                              }
                              aria-label="Увеличи количеството"
                              className="size-7 flex items-center justify-center rounded-md text-zinc-600 hover:bg-white hover:text-zinc-950 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="min-w-20 text-right">
                            <span className="text-sm font-black text-zinc-950 dark:text-white">
                              {formatPrice(lineTotal)}
                            </span>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            title="Премахни артикула"
                            aria-label={`Премахни ${item.name}`}
                            className="size-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </BentoCard>

            {/* 2. Add Item Section */}
            <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <PlusCircle className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Добави позиция към продажбата
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Изберете от каталога или въведете свободен артикул
                    </p>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setAddItemMode("catalog")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                      addItemMode === "catalog"
                        ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    От каталога
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddItemMode("custom")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                      addItemMode === "custom"
                        ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    Собствен артикул
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {addItemMode === "catalog" ? (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1">
                      <select
                        value={selectedCatalogId}
                        onChange={(e) => setSelectedCatalogId(e.target.value)}
                        disabled={loadingData}
                        aria-label="Изберете продукт или услуга от каталога"
                        className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 cursor-pointer"
                      >
                        <option value="">
                          {loadingData
                            ? "Зареждане на каталога..."
                            : "-- Изберете артикул или клубна услуга --"}
                        </option>
                        {catalogItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            [{item.type === "product" ? "Склад" : "Услуга"}]{" "}
                            {item.name} — {formatPrice(item.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddCatalogItem}
                      disabled={!selectedCatalogId}
                      className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-500 shadow-xs shrink-0 cursor-pointer"
                    >
                      <Plus className="mr-1.5 size-4" />
                      Добави в количката
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6">
                      <Input
                        placeholder="Име на артикула / таксата..."
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="h-10 rounded-xl text-xs bg-white border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Цена"
                          value={customItemPrice}
                          onChange={(e) => setCustomItemPrice(e.target.value)}
                          className="h-10 rounded-xl text-xs pr-6 bg-white border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
                          €
                        </span>
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <Button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="w-full h-10 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs cursor-pointer"
                      >
                        <Plus className="mr-1 size-4" />
                        Добави
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </BentoCard>

            {/* 3. Customer Assignment */}
            <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <Users className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Клиент / Получател
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Свържете продажбата с член на клуба или регистрирайте като
                      гост
                    </p>
                  </div>
                </div>

                {/* Customer Type Toggle */}
                <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setCustomerType("member")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                      customerType === "member"
                        ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    Състезател
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType("guest")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                      customerType === "guest"
                        ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    Външен клиент / Гост
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {customerType === "member" ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Изберете състезател от картотеката:
                    </Label>
                    <SearchableMemberSelect
                      value={selectedMemberId}
                      onChange={(id) => setSelectedMemberId(id)}
                      members={members}
                      placeholder="Търсене на състезател по име..."
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Име на клиента:
                      </Label>
                      <Input
                        placeholder="Три имена на клиента..."
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="h-9.5 rounded-xl text-xs bg-white border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Телефон за връзка:
                      </Label>
                      <Input
                        placeholder="Напр. 0888 123 456"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="h-9.5 rounded-xl text-xs bg-white border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </BentoCard>
          </div>

          {/* Right Column (Payment Status, Methods, Totals & Actions) */}
          <div className="space-y-5">
            {/* Status & Payment Settings */}
            <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <CreditCard className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Плащане & Статус
                </h3>
              </div>

              {/* Status Radio Pills */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Статус на продажбата:
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("completed")}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      paymentStatus === "completed"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs"
                        : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    <CheckCircle2 className="size-3.5 mb-0.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Платено</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus("pending")}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      paymentStatus === "pending"
                        ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shadow-2xs"
                        : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    <Clock className="size-3.5 mb-0.5 text-amber-600 dark:text-amber-400" />
                    <span>Очаква</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus("cancelled")}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      paymentStatus === "cancelled"
                        ? "border-rose-500 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 shadow-2xs"
                        : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    <XCircle className="size-3.5 mb-0.5 text-rose-600 dark:text-rose-400" />
                    <span>Анулирано</span>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Начин на плащане:
                </Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  <option value="В брой">💵 В брой</option>
                  <option value="Банкова карта">💳 Банкова карта (ПОС)</option>
                  <option value="Банков път">🏦 Банков превод</option>
                  <option value="Revolut">📱 Revolut</option>
                  <option value="Друго">ℹ️ Друго</option>
                </select>
              </div>

              {/* Sale Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Дата на продажбата:
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="h-9.5 rounded-xl text-xs bg-white border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Note / Remarks */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Бележка / Забележка:
                </Label>
                <textarea
                  rows={2}
                  placeholder="Въведете допълнителни бележки към продажбата..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>
            </BentoCard>

            {/* Financial Summary & Actions */}
            <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <Receipt className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Обобщение
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Общо артикули:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} бр.
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Позиции:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {cart.length}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Крайна сума:
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md transition-all active:scale-98 hover:brightness-110 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Запазване...
                    </>
                  ) : (
                    submitText
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(cancelUrl)}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl text-xs font-semibold border-zinc-200 hover:bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Отказ
                </Button>
              </div>
            </BentoCard>
          </div>
        </div>
      </form>
    </div>
  );
}
