import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "react-email";

export interface MarketingEmailProps {
  memberName?: string;
  messageText: string;
}

export const MarketingEmail: React.FC<MarketingEmailProps> = ({
  messageText,
}) => {
  // Use a generic preview text (first 50 chars of the message or default)
  const previewText = messageText
    ? messageText.substring(0, 50) + "..."
    : "Съобщение от БК Гълъбово";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Съобщение от БК Гълъбово</Heading>

          <Text style={textBlock}>
            {messageText.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </Text>

          <Text style={footer}>
            Това е автоматично съобщение. Моля, не отговаряйте директно на този
            имейл.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

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
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.5",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const textBlock = {
  color: "#333",
  fontFamily:
    '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
  fontSize: "16px",
  margin: "24px 0",
  whiteSpace: "pre-wrap" as const, // Preserves newlines
};

const footer = {
  color: "#8898aa",
  fontFamily:
    '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
  fontSize: "12px",
  marginTop: "40px",
  textAlign: "center" as const,
};
