export interface SignedDeclaration {
  id: string;
  siteId: string; // The branch where it was signed
  memberId: string;
  memberName: string;
  phone: string;
  signedAt: string;
  signatureUrl?: string;
  parentSignatureUrl?: string;
  pdfUrl?: string; // Firebase storage URL to the generated PDF
  templateId: string;
  isMinor: boolean;
  parentName?: string;
}
