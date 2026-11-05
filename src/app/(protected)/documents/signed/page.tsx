import { Metadata } from "next";
import React from "react";

import { AllSignedDocumentsRegister } from "@/components/documents/AllSignedDocumentsRegister";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Регистър на подписани документи | Документи | БК Гълъбово",
  description:
    "Електронен регистър, валидност и одит на подписаните клубни документи и декларации.",
};

export default function SignedDocumentsRegisterPage() {
  return <AllSignedDocumentsRegister />;
}
