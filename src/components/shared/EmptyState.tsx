import React from "react";

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode; // За бутони или други елементи
}

/**
 * Преизползваем компонент за показване на празни състояния.
 * Показва икона, заглавие, описание и опционални бутони за действие.
 */
export function EmptyState({
  Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
      <div className="bg-secondary p-3 rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
