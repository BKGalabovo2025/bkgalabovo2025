import * as React from "react";
import { Column, Hr, Row, Section, Text } from "react-email";

import {
  detailsContainer,
  detailsLabel,
  detailsLabelCol,
  detailsRow,
  detailsValue,
  detailsValueCol,
  divider,
  EmailLayoutShared,
  paragraph,
} from "./EmailLayoutShared";

export interface ReservationConfirmationEmailProps {
  clientName: string;
  startTime: string | Date;
  endTime: string | Date;
  courtId: string;
  baseUrl?: string;
  isRecoveryZone?: boolean;
}

export const ReservationConfirmationEmail: React.FC<
  ReservationConfirmationEmailProps
> = ({
  clientName,
  startTime,
  endTime,
  courtId,
  baseUrl = "https://bkgalabovo2025.vercel.app/club",
  isRecoveryZone = false,
}) => {
  const formattedDate = new Date(startTime).toLocaleDateString("bg-BG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedStartTime = new Date(startTime).toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedEndTime = new Date(endTime).toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <EmailLayoutShared
      previewText={`Вашата резервация е потвърдена - ${
        isRecoveryZone
          ? 'Възстановителен център "Recovery Zone"'
          : 'СНЦ "Бадминтон Клуб Гълъбово"'
      }`}
      headingText="Потвърждение на резервация"
      isRecoveryZone={isRecoveryZone}
      baseUrl={baseUrl}
    >
      <Text style={paragraph}>
        Здравейте, <strong>{clientName}</strong>,
      </Text>
      <Text style={paragraph}>
        Благодарим Ви, че избрахте{" "}
        {isRecoveryZone ? "Recovery zone by ZM" : "нашия клуб"}. Вашата
        резервация е успешно запазена в системата ни. Моля, прегледайте
        детайлите по-долу:
      </Text>

      {/* Details Box */}
      <Section style={detailsContainer}>
        <Row style={detailsRow}>
          <Column style={detailsLabelCol}>
            <Text style={detailsLabel}>УСЛУГА / КОРТ</Text>
          </Column>
          <Column style={detailsValueCol}>
            <Text style={detailsValue}>{courtId}</Text>
          </Column>
        </Row>
        <Hr style={divider} />
        <Row style={detailsRow}>
          <Column style={detailsLabelCol}>
            <Text style={detailsLabel}>ДАТА</Text>
          </Column>
          <Column style={detailsValueCol}>
            <Text style={detailsValue}>{formattedDate}</Text>
          </Column>
        </Row>
        <Hr style={divider} />
        <Row style={detailsRow}>
          <Column style={detailsLabelCol}>
            <Text style={detailsLabel}>ВРЕМЕТРАЕНЕ</Text>
          </Column>
          <Column style={detailsValueCol}>
            <Text style={detailsValue}>
              {formattedStartTime} ч. – {formattedEndTime} ч.
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={paragraph}>
        Ако имате въпроси или се нуждаете от съдействие за промяна на Вашата
        резервация, екипът ни остава на разположение.
      </Text>

      <Text style={paragraph}>Очакваме Ви!</Text>
    </EmailLayoutShared>
  );
};
