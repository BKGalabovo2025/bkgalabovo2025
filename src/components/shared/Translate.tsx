"use client";
import React from "react";

export function Translate({
  bg,
  en,
}: {
  bg: React.ReactNode;
  en?: React.ReactNode;
}) {
  if (en !== undefined) {
    return (
      <>
        <span className="lang-bg">{bg}</span>
        <span className="lang-en notranslate hidden">{en}</span>
      </>
    );
  }

  return <span>{bg}</span>;
}
