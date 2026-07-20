import * as React from "react";
import { Text, Section, Row, Column, Hr } from "react-email";
import {
  EmailLayoutShared,
  paragraph,
  detailsContainer,
  detailsRow,
  detailsLabelCol,
  detailsValueCol,
  detailsLabel,
  detailsValue,
  divider,
} from "./EmailLayoutShared";

export interface DonationReceiptEmailProps {
  clientName: string;
  clientPhone: string;
  donationText: string;
  serviceOrCourtLabel: string;
  serviceOrCourtValue: string;
  dateRange: string;
  totalPrice: string;
  baseUrl?: string;
  isRecoveryZone?: boolean;
}

export const DonationReceiptEmail: React.FC<DonationReceiptEmailProps> = ({
  clientName,
  clientPhone,
  donationText,
  serviceOrCourtLabel,
  serviceOrCourtValue,
  dateRange,
  totalPrice,
  baseUrl = "https://bkgalabovo2025.vercel.app/club",
  isRecoveryZone = false,
}) => {
  return (
    <EmailLayoutShared
      previewText={`Документ за Дарение - ${
        isRecoveryZone
          ? 'Възстановителен център "Recovery Zone"'
          : 'СНЦ "Бадминтон Клуб Гълъбово"'
      }`}
      headingText="Документ за Дарение"
      isRecoveryZone={isRecoveryZone}
      baseUrl={baseUrl}
    >
      <Text style={paragraph}>
        Здравейте, <strong>{clientName}</strong>,
      </Text>
      <Text style={paragraph}>
        С настоящия документ се потвърждава постъпило целево дарение от{" "}
        <strong>{clientName}</strong> (тел. {clientPhone || "непосочен"}) в
        полза на СНЦ &quot;Бадминтон клуб Гълъбово&quot;.
      </Text>

      {/* Details Box */}
      <Section style={detailsContainer}>
        <Row style={detailsRow}>
          <Column style={detailsLabelCol}>
            <Text style={detailsLabel}>ОПИСАНИЕ НА ДАРЕНИЕТО</Text>
          </Column>
          <Column style={detailsValueCol}>
            <Text style={detailsValue}>{donationText}</Text>
          </Column>
        </Row>
        <Hr style={divider} />
        <Row style={detailsRow}>
          <Column style={detailsLabelCol}>
            <Text style={detailsLabel}>
              {serviceOrCourtLabel.toUpperCase()}
            </Text>
          </Column>
          <Column style={detailsValueCol}>
            <Text style={detailsValue}>{serviceOrCourtValue}</Text>
          </Column>
        </Row>
        <Hr style={divider} />
        <Row style={detailsRow}>
          <Column style={detailsLabelCol}>
            <Text style={detailsLabel}>ДАТА / ЧАС</Text>
          </Column>
          <Column style={detailsValueCol}>
            <Text style={detailsValue}>{dateRange}</Text>
          </Column>
        </Row>
        <Hr style={divider} />
        <Row style={detailsRow}>
          <Column style={detailsLabelCol}>
            <Text style={detailsLabel}>ОБЩА СТОЙНОСТ</Text>
          </Column>
          <Column style={detailsValueCol}>
            <Text style={detailsValue}>{totalPrice}</Text>
          </Column>
        </Row>
      </Section>
    </EmailLayoutShared>
  );
};
