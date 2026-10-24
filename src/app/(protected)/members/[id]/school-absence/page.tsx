"use client";

import { SchoolLetterPrint } from "@/components/members/SchoolLetterPrint";

const SchoolAbsencePage = () => (
  <SchoolLetterPrint
    templateId="schoolAbsence"
    documentKey="schoolAbsence"
    signatureLabel="ПРЕДСЕДАТЕЛ:"
    signatureCaption="/М. Георгиева/"
  />
);

export default SchoolAbsencePage;
