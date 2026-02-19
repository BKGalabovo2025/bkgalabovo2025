
import { NextResponse } from 'next/server';
import { getOverdueMembers } from '@/services/reminder-service.server'; // Use the server-specific service
import { ReminderEmailHtml } from '@/components/emails/reminder-email';

// This endpoint should be protected, e.g., require authentication and admin rights.
export async function POST(request: Request) {
    console.log('--- API /api/send-reminders HIT! ---');
    try {
        console.log('STEP 1: Fetching overdue members...');
        const overdueMembers = await getOverdueMembers();

        console.log(`STEP 2: Found ${overdueMembers.length} overdue members.`);
        if (overdueMembers.length > 0) {
            console.log('Overdue members list:', JSON.stringify(overdueMembers, null, 2));
        }

        if (overdueMembers.length === 0) {
            console.log('EXITING: No overdue members found. Process finished successfully.');
            return NextResponse.json({ message: 'Няма членове с просрочени задължения.' }, { status: 200 });
        }

        console.log(`STEP 3: Proceeding to send emails to ${overdueMembers.length} members.`);

        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        for (const member of overdueMembers) {
            const memberName = `${member.firstName} ${member.lastName}`.trim();
            
            if (!member.email) {
                console.log(`SKIPPING: Member ${memberName} has no email address.`);
                continue;
            }
            
            try {
                const emailHtml = ReminderEmailHtml({ memberName: memberName });

                console.log(`Sending email to ${memberName} (${member.email})...`);
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
                
                console.log(`SUCCESS: Email sent to ${memberName} (${member.email})`);
            } catch (emailError) {
                console.error(`FAILURE: Failed to send email to ${memberName}. Reason:`, emailError);
            }
        }

        console.log('--- API /api/send-reminders FINISHED. ---');
        return NextResponse.json({ message: `Напомнящи имейли бяха изпратени до ${overdueMembers.length} членове.` }, { status: 200 });

    } catch (error) {
        console.error('CRITICAL FAILURE in /api/send-reminders:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: `Възникна критична грешка: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ error: 'Възникна критична грешка при изпращането на напомняния.' }, { status: 500 });
    }
}
