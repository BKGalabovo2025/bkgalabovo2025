import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from "react-email";
import * as React from "react";

export interface EmailLayoutSharedProps {
  previewText: string;
  headingText: string;
  isRecoveryZone?: boolean;
  baseUrl?: string;
  children: React.ReactNode;
}

export const EmailLayoutShared: React.FC<EmailLayoutSharedProps> = ({
  previewText,
  headingText,
  isRecoveryZone = false,
  baseUrl = "https://bkgalabovo2025.vercel.app/club",
  children,
}) => {
  const brandColor = isRecoveryZone ? "#065f46" : "#1e3a8a"; // Emerald/Green vs Blue
  const brandGradient = isRecoveryZone
    ? "linear-gradient(135deg, #065f46 0%, #064e3b 100%)"
    : "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)";
  const brandTitle = isRecoveryZone
    ? "RECOVERY ZONE BY ZM"
    : "БАДМИНТОН КЛУБ ГЪЛЪБОВО";
  const brandName = isRecoveryZone
    ? 'Възстановителен център "Recovery Zone"'
    : 'СНЦ "Бадминтон Клуб Гълъбово"';
  const brandEmail = isRecoveryZone
    ? "recoveryzonebyzm@gmail.com"
    : "bk_galabovo@abv.bg";
  const brandUrl = isRecoveryZone
    ? "https://bkgalabovo2025.vercel.app/recovery-zone"
    : baseUrl;

  const headerStyle = {
    ...header,
    background: brandGradient,
    borderBottom: `3px solid ${isRecoveryZone ? "#10b981" : "#3b82f6"}`,
  };

  const footerLinkStyle = { ...footerLink, color: brandColor };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={headerTitle}>{brandTitle}</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>{headingText}</Heading>

            {children}

            <Section style={buttonContainer}>
              <Link
                href={brandUrl}
                style={{
                  ...button,
                  background: brandGradient,
                  boxShadow: `0 4px 6px -1px ${
                    isRecoveryZone
                      ? "rgba(6, 95, 70, 0.2)"
                      : "rgba(30, 58, 138, 0.2)"
                  }, 0 2px 4px -2px ${
                    isRecoveryZone
                      ? "rgba(6, 95, 70, 0.2)"
                      : "rgba(30, 58, 138, 0.2)"
                  }`,
                }}
              >
                Към уебсайта
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerTextStrong}>{brandName}</Text>
            {!isRecoveryZone && (
              <Text style={footerText}>
                Спортна зала &quot;Енергетик&quot;, град Гълъбово
              </Text>
            )}
            <Text style={footerText}>
              <Link href={`mailto:${brandEmail}`} style={footerLinkStyle}>
                {brandEmail}
              </Link>{" "}
              |{" "}
              <Link href="tel:+359899829923" style={footerLinkStyle}>
                +359 899 82 99 23
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// --- Shared Styles ---
export const main = {
  backgroundColor: "#f3f4f6", // very light gray
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "40px 0",
};

export const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  width: "600px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow:
    "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
  overflow: "hidden", // ensures header rounds with container
};

export const header = {
  background: "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)", // Rich, deep corporate blue gradient
  padding: "36px 40px",
  textAlign: "center" as const,
  borderBottom: "3px solid #3b82f6", // Slight accent line
};

export const headerTitle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "3px",
  margin: "0",
  textShadow: "0 2px 4px rgba(0,0,0,0.15)",
};

export const content = {
  padding: "45px 40px",
};

export const heading = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
  marginTop: "0",
  marginBottom: "20px",
  letterSpacing: "-0.3px",
};

export const paragraph = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#334155",
  margin: "0 0 16px 0",
};

export const detailsContainer = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "24px",
  margin: "32px 0",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02)",
  backgroundImage: "linear-gradient(to bottom, #ffffff, #f8fafc)",
};

export const detailsRow = {
  width: "100%",
};

export const detailsLabelCol = {
  width: "40%",
  padding: "10px 0",
};

export const detailsValueCol = {
  width: "60%",
  padding: "10px 0",
};

export const detailsLabel = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748b",
  letterSpacing: "1.2px",
  margin: "0",
};

export const detailsValue = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0",
};

export const divider = {
  borderColor: "#e2e8f0",
  margin: "4px 0",
};

export const buttonContainer = {
  marginTop: "45px",
  marginBottom: "20px",
  textAlign: "center" as const,
};

export const button = {
  background: "linear-gradient(to bottom, #1e3a8a, #172554)",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "15px 36px",
  borderRadius: "8px",
  boxShadow:
    "0 4px 6px -1px rgba(30, 58, 138, 0.2), 0 2px 4px -2px rgba(30, 58, 138, 0.2)",
  letterSpacing: "0.5px",
};

export const footer = {
  backgroundColor: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
  padding: "35px 40px",
  textAlign: "center" as const,
};

export const footerTextStrong = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#334155",
  margin: "0 0 6px 0",
  letterSpacing: "0.5px",
};

export const footerText = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 10px 0",
};

export const footerLink = {
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: "500",
};
