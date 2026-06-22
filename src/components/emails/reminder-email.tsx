 
 
 
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "react-email";
import * as React from "react";

export interface ReminderEmailProps {
  memberName?: string;
}

export const ReminderEmail: React.FC<ReminderEmailProps> = ({ memberName }) => (
  <Html>
    <Head />
    <Preview>Просрочено плащане</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Напомняне за плащане</Heading>
        <Text style={text}>
          Здравейте, {memberName || "членове"}. Напомняме Ви за просрочено
          плащане към Бадминтон Клуб Гълъбово.
        </Text>
        <Text style={text}>Моля, свържете се с нас за повече информация.</Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "45px",
};

const h1 = {
  color: "#333",
  fontFamily:
    '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
  fontSize: "32px",
  fontWeight: "300",
  lineHeight: "1.5",
  margin: "0 0 30px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontFamily:
    '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
  fontSize: "16px",
  margin: "24px 0",
};
