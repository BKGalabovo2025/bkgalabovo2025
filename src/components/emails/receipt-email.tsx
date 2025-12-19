'''
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Row,
  Column,
} from "@react-email/components";

interface ReceiptEmailProps {
  name: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  planName: string;
  price: string;
}

const ReceiptEmail = ({ name, subscriptionId, startDate, endDate, planName, price }: ReceiptEmailProps) => (
  <Html>
    <Head />
    <Preview>Вашата разписка за абонамент</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Разписка за абонамент</Heading>
        <Text style={paragraph}>Здравейте, {name},</Text>
        <Text style={paragraph}>
          Благодарим ви за абонамента! Това е вашата разписка.
        </Text>

        <Row style={row}>
          <Column style={label}>Номер на абонамент:</Column>
          <Column style={value}>{subscriptionId}</Column>
        </Row>

        <Row style={row}>
          <Column style={label}>План:</Column>
          <Column style={value}>{planName}</Column>
        </Row>

        <Row style={row}>
          <Column style={label}>Период:</Column>
          <Column style={value}>{startDate} - {endDate}</Column>
        </Row>

        <Row style={row}>
          <Column style={label}>Цена:</Column>
          <Column style={value}>{price} лв.</Column>
        </Row>

        <Text style={footer}>БК Галабово 2014</Text>
      </Container>
    </Body>
  </Html>
);

export default ReceiptEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #f0f0f0",
  borderRadius: "4px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#484848",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  padding: "0 20px",
};

const row = {
  padding: "0 20px",
  marginBottom: "10px",
};

const label = {
  fontSize: "16px",
  color: "#484848",
  fontWeight: "bold",
  width: "150px",
};

const value = {
  fontSize: "16px",
  color: "#484848",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 20px",
};

'''