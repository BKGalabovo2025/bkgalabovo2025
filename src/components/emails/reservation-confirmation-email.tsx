 
 
 
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "react-email";
import * as React from "react";

export interface ReservationConfirmationEmailProps {
  clientName: string;
  startTime: string | Date;
  endTime: string | Date;
  courtId: string;
  baseUrl?: string;
}

export const ReservationConfirmationEmail: React.FC<
  ReservationConfirmationEmailProps
> = ({
  clientName,
  startTime,
  endTime,
  courtId,
  baseUrl = "http://localhost:3001",
}) => {
  const formattedStartTime = new Date(startTime).toLocaleString("bg-BG", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const formattedEndTime = new Date(endTime).toLocaleString("bg-BG", {
    timeStyle: "short",
  });

  return (
    <Html>
      <Head />
      <Preview>Потвърждение на резервация</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Потвърждение на Резервация</Heading>

          <Text style={text}>Здравейте, {clientName},</Text>
          <Text style={text}>
            Вашата резервация в бадминтон клуб &quot;Гълъбово&quot; е
            потвърдена. По-долу са детайлите:
          </Text>

          <Text style={detailsText}>
            <strong>Корт:</strong> {courtId}
            <br />
            <strong>Начален час:</strong> {formattedStartTime} ч.
            <br />
            <strong>Краен час:</strong> {formattedEndTime} ч.
          </Text>

          <Text style={text}>
            Ако имате въпроси или се нуждаете от промяна, моля, свържете се с
            нас.
          </Text>

          <Text style={text}>Очакваме Ви!</Text>

          <Text style={footer}>
            Бадминтон Клуб &quot;Гълъбово&quot;
            <br />
            <Link href={baseUrl} style={link}>
              Посетете нашия уебсайт
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "20px",
  width: "580px",
  margin: "0 auto",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#555",
  fontSize: "16px",
  lineHeight: "1.5",
  marginBottom: "20px",
};

const detailsText = {
  ...text,
  padding: "15px",
  backgroundColor: "#f9f9f9",
  borderLeft: "4px solid #007bff",
  margin: "20px 0",
};

const footer = {
  color: "#888",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "30px",
};

const link = {
  color: "#007bff",
  textDecoration: "none",
};
