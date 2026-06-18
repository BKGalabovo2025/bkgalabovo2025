/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface DeactivatedEmailProps {
  memberName?: string;
}

export const DeactivatedEmail: React.FC<DeactivatedEmailProps> = ({
  memberName,
}) => (
  <Html>
    <Head />
    <Preview>Промяна на статус на членство - БК Гълъбово</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Известие за изтекло членство</Heading>
        <Text style={text}>Здравейте, {memberName || "член на клуба"}.</Text>
        <Text style={text}>
          Уведомяваме Ви, че тъй като нямате активен или платен абонамент през
          последните 30 дни, статусът на Вашия профил в{" "}
          <strong>Бадминтон Клуб Гълъбово</strong> е автоматично променен на{" "}
          <strong>неактивен (inactive)</strong>.
        </Text>
        <Text style={text}>
          За да възстановите активния си статус и да продължите да ползвате
          услугите на клуба, е необходимо да заплатите нов абонамент.
        </Text>
        <Text style={text}>
          Ако имате въпроси или смятате, че е станала грешка, моля свържете се с
          нас.
        </Text>
        <Text style={text}>
          С уважение,
          <br />
          Екипът на Бадминтон Клуб Гълъбово
        </Text>
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
  fontSize: "26px",
  fontWeight: "300",
  lineHeight: "1.4",
  margin: "0 0 30px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontFamily:
    '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "24px 0",
};
