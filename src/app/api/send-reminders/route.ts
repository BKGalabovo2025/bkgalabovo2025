
import { NextResponse } from 'next/server';
import { getOverdueMembers } from '@/services/reminder-service';
import { ReminderEmailHtml } from '@/components/emails/reminder-email';

// This endpoint should be protected, e.g., require authentication and admin rights.
export async function POST(request: Request) {
    try {
        // In a real app, you'd want to verify that the user making this request is an admin.
        // For now, we'll proceed assuming the request is authorized.

        console.log('Fetching overdue members...');
        const overdueMembers = await getOverdueMembers();

        if (overdueMembers.length === 0) {
            console.log('No overdue members found.');
            return NextResponse.json({ message: 'Няма членове с просрочени задължения.' }, { status: 200 });
        }

        console.log(`Found ${overdueMembers.length} overdue members. Sending emails...`);

        // Get the base URL from the request headers
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        for (const member of overdueMembers) {
            if (!member.email) {
                console.log(`Member ${member.name} has no email address. Skipping.`);
                continue;
            }

            const emailHtml = ReminderEmailHtml({ memberName: member.name });

            try {
                // We now call our own API endpoint to send the email
                const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: member.email,
                        subject: 'Напомняне за месечна такса',
                        html: emailHtml,
                    }),
                });

                if (!emailResponse.ok) {
                    const errorBody = await emailResponse.json();
                    throw new Error(`API responded with ${emailResponse.status}: ${errorBody.error}`);
                }
                
                console.log(`Email sent to ${member.name} (${member.email})`);
            } catch (emailError) {
                console.error(`Failed to send email to ${member.name}:`, emailError);
                // Decide if you want to stop the whole process or just log the error and continue
            }
        }

        return NextResponse.json({ message: `Напомнящи имейли бяха изпратени до ${overdueMembers.length} членове.` }, { status: 200 });

    } catch (error) {
        console.error('Failed to send reminders:', error);
        return NextResponse.json({ error: 'Възникна грешка при изпращането на напомняния.' }, { status: 500 });
    }
}
