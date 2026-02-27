import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface ReservationConfirmationEmailProps {
    clientName: string;
    startTime: Date; // Sending Date object for easy formatting
    endTime: Date;
    courtId: number;
    reservationId: string;
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

export const ReservationConfirmationEmail = ({ 
    clientName, 
    startTime, 
    endTime, 
    courtId, 
    reservationId 
}: ReservationConfirmationEmailProps) => {

    const formattedStartTime = startTime.toLocaleString('bg-BG', { dateStyle: 'full', timeStyle: 'short' });
    const formattedEndTime = endTime.toLocaleString('bg-BG', { timeStyle: 'short' });

    const previewText = `Успешна резервация за корт ${courtId}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* <Img src={`${baseUrl}/static/logo.png`} width="40" height="37" alt="BK Galabovo Logo" style={logo} /> */}
                    <Heading style={heading}>Вашата резервация е потвърдена!</Heading>
                    <Text style={paragraph}>Здравейте, {clientName},</Text>
                    <Text style={paragraph}>
                        Благодарим Ви, че направихте резервация на корт в "Бадминтон клуб Гълъбово". По-долу ще намерите детайлите за нея:
                    </Text>
                    <Section style={detailsSection}>
                        <Text style={detailsTitle}>Детайли на резервацията:</Text>
                        <Text style={detailsItem}><strong>Корт:</strong> {courtId}</Text>
                        <Text style={detailsItem}><strong>Дата и час:</strong> {formattedStartTime} - {formattedEndTime} ч.</Text>
                        <Text style={detailsItem}><strong>ID на резервация:</strong> {reservationId}</Text>
                    </Section>
                    <Text style={paragraph}>
                        Ако имате въпроси или се налага да промените или отмените резервацията си, моля, свържете се с нас своевременно.
                    </Text>
                    <Hr style={hr} />
                    <Text style={footer}>"Бадминтон Клуб Гълъбово"</Text>
                     <Text style={footer}>Спортна зала "Енергетик" град Гълъбово</Text>
                </Container>
            </Body>
        </Html>
    );
};

export default ReservationConfirmationEmail;

// --- Styles --- //

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    border: '1px solid #f0f0f0',
    borderRadius: '4px',
};

const heading = {
    fontSize: '28px',
    fontWeight: 'bold',
    marginTop: '48px',
    textAlign: 'center' as const,
    color: '#333',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#555',
    padding: '0 20px',
};

const detailsSection = {
    backgroundColor: '#fafafa',
    padding: '10px 20px',
    margin: '20px 20px',
    border: '1px solid #eaeaea',
    borderRadius: '4px',
};

const detailsTitle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
};

const detailsItem = {
    fontSize: '14px',
    lineHeight: '22px',
    margin: '4px 0',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
};
