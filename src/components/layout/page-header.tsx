"use client";

import * as React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs: { label: string; href?: string }[];
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-3 sm:mb-4 space-y-2 sm:space-y-2.5", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.label}>
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink
                    href={crumb.href}
                    className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase transition-colors hover:text-primary dark:text-zinc-400"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-[11px] font-medium tracking-wider text-zinc-800 uppercase dark:text-white">
                    {crumb.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator className="text-zinc-300" />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col justify-between gap-2 sm:gap-3 md:flex-row md:items-end">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-[11px] sm:text-xs leading-relaxed font-light text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
