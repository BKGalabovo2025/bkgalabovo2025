"use client";

import { SchoolLetterPrint } from "@/components/members/SchoolLetterPrint";

const SchoolReleasePage = () => (
  <SchoolLetterPrint
    templateId="schoolRelease"
    documentKey="schoolRelease"
    signatureLabel="Председател: Мира Георгиева"
    signatureCaption="/„Бадминтон клуб Гълъбово“/"
  />
);

export default SchoolReleasePage;
