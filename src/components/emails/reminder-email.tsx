
import {
    Body,
    Container,
    Head,
    Html,
    Img,
    Preview,
    Text,
    render
} from '@react-email/components';
import * as React from 'react';
import { clubInfo } from '@/config/club';

interface ReminderEmailProps {
    memberName: string;
}

const main = {
    backgroundColor: '#f6f9fc',
    padding: '20px',
};

const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: '5px',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
};

const text = {
    fontSize: '16px',
    color: '#333',
    lineHeight: '24px',
};

const logo = {
    width: 60,
    height: 60,
    margin: '0 auto',
    marginBottom: '20px',
};

// It's better to use an absolute URL for images in emails.
// Assuming your app is hosted at 'https://your-app-url.com'
// and the logo is in 'public/logo.png'.
const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/next-test-485df.appspot.com/o/logo.png?alt=media&token=04d96a79-5677-4563-8742-3e66052f5bdd';

export const ReminderEmail = ({ memberName }: ReminderEmailProps) => (
    <Html>
        <Head />
        <Preview>Напомняне за месечна такса</Preview>
        <Body style={main}>
            <Container style={container}>
                <Img
                    src={logoUrl} 
                    alt={`${clubInfo.name} Logo`}
                    style={logo}
                />
                <Text style={text}>Здравейте, {memberName},</Text>
                <Text style={text}>
                    Пишем ви с приятелско напомняне, че все още не сме регистрирали плащане на месечната ви такса за настоящия месец.
                </Text>
                <Text style={text}>
                    Моля, уредете плащането си при следващото си посещение в клуба. Ако смятате, че получавате този имейл по погрешка, моля, свържете се с нас.
                </Text>
                <Text style={text}>
                    Поздрави,
                    <br />
                    Екипът на {clubInfo.name}
                </Text>
            </Container>
        </Body>
    </Html>
);

export const ReminderEmailHtml = (props: ReminderEmailProps) => render(<ReminderEmail {...props} />, { pretty: true });
