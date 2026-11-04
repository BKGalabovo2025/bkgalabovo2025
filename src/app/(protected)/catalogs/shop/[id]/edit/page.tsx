import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { ProductFormView } from "@/components/catalogs/forms/ProductFormView";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

async function getProduct(id: string): Promise<Product | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection("products").doc(id).get();
    if (!doc.exists) return null;
    return serializeFirestoreData({ id: doc.id, ...doc.data() }) as Product;
  } catch (err) {
    console.error("Error fetching product:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: "Редакция на артикул | Магазин - БК Гълъбово" };
  }
  return {
    title: `Редакция: ${product.name} | Магазин - БК Гълъбово`,
    description: `Редактиране на артикул ${product.name} в клубния магазин.`,
  };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    notFound();
  }

  return <ProductFormView mode="edit" initialProduct={product} />;
}
