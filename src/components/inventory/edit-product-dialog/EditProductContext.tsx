"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { Product, InventoryEvent, Sale } from "@/types";
import { restockProductAction, adjustProductStockAction, updateProductAction } from "@/lib/actions/inventory";
import { useAuth } from "@/context/auth-context";
import { getInventoryEvents } from "@/services/inventory-service";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";

interface EditProductContextType {
  product: Product | null;
  
  // Product info states
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  price: string;
  setPrice: React.Dispatch<React.SetStateAction<string>>;
  imageUrl: string;
  setImageUrl: React.Dispatch<React.SetStateAction<string>>;
  restockThreshold: string;
  setRestockThreshold: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;

  // Stock operations states
  restockAmount: string;
  setRestockAmount: React.Dispatch<React.SetStateAction<string>>;
  adjustmentAmount: string;
  setAdjustmentAmount: React.Dispatch<React.SetStateAction<string>>;
  adjustmentNotes: string;
  setAdjustmentNotes: React.Dispatch<React.SetStateAction<string>>;
  isProcessing: boolean;

  // Actions
  handleUpdateInfo: () => Promise<void>;
  handleRestock: () => Promise<void>;
  handleAdjustment: () => Promise<void>;
  
  // History and Tab states
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  movements: InventoryEvent[];
  sales: Sale[];
  membersMap: Record<string, string>;
  historyLoading: boolean;

  onClose: () => void;
}

const EditProductContext = createContext<EditProductContextType | undefined>(undefined);

interface EditProductProviderProps {
  children: ReactNode;
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: () => void;
}

export const EditProductProvider = ({
  children,
  product,
  isOpen,
  onClose,
  onProductUpdate,
}: EditProductProviderProps) => {
  // Product info states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [restockThreshold, setRestockThreshold] = useState("");
  const [description, setDescription] = useState("");

  // Stock operations states
  const [restockAmount, setRestockAmount] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { idToken } = useAuth();

  // History and Tab states
  const [activeTab, setActiveTab] = useState("stock");
  const [movements, setMovements] = useState<InventoryEvent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistoryData = useCallback(async (productId: string) => {
    setHistoryLoading(true);
    try {
      const [allEvents, allSales, membersData] = await Promise.all([
        getInventoryEvents(),
        getSales(),
        getAllMembers()
      ]);

      const filteredEvents = allEvents.filter((e) => e.productId === productId);
      setMovements(filteredEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      const filteredSales = allSales.filter((s) => s.items?.some((i) => i.productId === productId));
      setSales(filteredSales);

      const map: Record<string, string> = {};
      membersData.forEach((m) => {
        map[m.id] = `${m.firstName} ${m.lastName}`;
      });
      setMembersMap(map);
    } catch (err) {
      console.error("Error fetching product history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && product) {
      fetchHistoryData(product.id);
    }
  }, [isOpen, product, fetchHistoryData]);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category || "");
      setPrice(product.price?.toString() || "0");
      setImageUrl(product.imageUrl || "");
      setRestockThreshold(product.restockThreshold?.toString() || "");
      setDescription(product.description || "");
    }
  }, [product]);

  const handleUpdateInfo = async () => {
    if (!product || !idToken) return;
    if (!name.trim() || !category.trim() || !price) {
      toast.error("Грешка", { description: "Моля, попълнете всички задължителни полета." });
      return;
    }

    const priceVal = parseFloat(price);
    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Грешка", { description: "Моля, въведете валидна, неотрицателна цена." });
      return;
    }

    setIsProcessing(true);
    try {
      const productData = {
        name,
        category,
        price: priceVal,
        description,
        imageUrl,
        restockThreshold: restockThreshold ? parseInt(restockThreshold, 10) : null,
      };

      const result = await updateProductAction(product.id, idToken, productData);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при актуализация", { description: (error as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestock = async () => {
    if (!product || !restockAmount || !idToken) return;
    const amount = parseInt(restockAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Грешка", { description: "Моля, въведете валидно положително число за презареждане." });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await restockProductAction(product.id, idToken, amount);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при презареждане", { description: (error as Error).message });
    } finally {
      setIsProcessing(false);
      setRestockAmount("");
    }
  };

  const handleAdjustment = async () => {
    if (!product || !adjustmentAmount || !idToken) return;
    const amount = parseInt(adjustmentAmount, 10);

    if (isNaN(amount) || amount === 0) {
      toast.error("Грешка", { description: "Моля, въведете валидно, ненулево число за корекция." });
      return;
    }

    if (amount < 0 && !adjustmentNotes) {
      toast.error("Грешка", { description: "При отписване на количества, бележката е задължителна." });
      return;
    }

    setIsProcessing(true);
    try {
      const newStock = product.stock + amount;
      const result = await adjustProductStockAction(product.id, idToken, newStock, adjustmentNotes);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при корекция", { description: (error as Error).message });
    } finally {
      setIsProcessing(false);
      setAdjustmentAmount("");
      setAdjustmentNotes("");
    }
  };

  const contextValue: EditProductContextType = {
    product,
    name, setName,
    category, setCategory,
    price, setPrice,
    imageUrl, setImageUrl,
    restockThreshold, setRestockThreshold,
    description, setDescription,
    restockAmount, setRestockAmount,
    adjustmentAmount, setAdjustmentAmount,
    adjustmentNotes, setAdjustmentNotes,
    isProcessing,
    handleUpdateInfo,
    handleRestock,
    handleAdjustment,
    activeTab, setActiveTab,
    movements, sales, membersMap, historyLoading,
    onClose
  };

  return <EditProductContext.Provider value={contextValue}>{children}</EditProductContext.Provider>;
};

export const useEditProduct = () => {
  const context = useContext(EditProductContext);
  if (!context) {
    throw new Error("useEditProduct must be used within an EditProductProvider");
  }
  return context;
};
