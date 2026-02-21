
import { NextResponse } from 'next/server';
import { getOverdueMembers } from '@/services/reminder-service.server';
import { ReminderEmailHtml } from '@/components/emails/reminder-email';
import { render } from '@react-email/render';

export async function POST(request: Request) {
    console.log('--- API /api/send-reminders HIT! ---');
    try {
        console.log('STEP 1: Fetching overdue members...');
        const overdueMembers = await getOverdueMembers();

        console.log(`STEP 2: Found ${overdueMembers.length} overdue members.`);
        if (overdueMembers.length > 0) {
            console.log('Overdue members list:', JSON.stringify(overdueMembers.map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName}`, email: m.email })), null, 2));
        }

        if (overdueMembers.length === 0) {
            console.log('EXITING: No overdue members found. Process finished successfully.');
            return NextResponse.json({ message: 'Няма членове с просрочени задължения.' }, { status: 200 });
        }

        console.log(`STEP 3: Proceeding to send emails to ${overdueMembers.length} members.`);

        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;

        let sentCount = 0;
        let failedCount = 0;

        for (const member of overdueMembers) {
            const memberName = `${member.firstName} ${member.lastName}`.trim();
            
            if (!member.email) {
                console.log(`SKIPPING: Member ${memberName} (ID: ${member.id}) has no email address.`);
                continue;
            }
            
            try {
                // Correctly render the React component to an HTML string
                const emailHtml = render(ReminderEmailHtml({ memberName: memberName }));
                
                // Generate a simple text version for email clients that don't support HTML
                const emailText = `Здравейте, ${memberName}. Напомняме ви за просрочена месечна такса към Бадминтон Клуб Гълъбово. Моля, свържете се с нас за повече информация.`

                console.log(`Attempting to dispatch email for ${memberName} (${member.email}) via internal API...`);
                const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: member.email,
                        subject: 'Напомняне за месечна такса',
                        html: emailHtml, // Now sending a valid HTML string
                        text: emailText,
                    }),
                });

                if (!emailResponse.ok) {
                    const errorBody = await emailResponse.json().catch(() => ({ error: 'Could not parse error response from /api/send-email' }));
                    throw new Error(`Internal API /api/send-email failed with status ${emailResponse.status}. Details: ${errorBody.error}`);
                }
                
                console.log(`SUCCESS: Email dispatched for ${memberName} (${member.email})`);
                sentCount++;
            } catch (emailError) {
                if (emailError instanceof Error) {
                     console.error(`FAILURE: Failed to dispatch email for ${memberName}. Reason:`, emailError.message);
                } else {
                     console.error(`FAILURE: An unknown error occurred while dispatching email for ${memberName}.`);
                }
                failedCount++;
            }
        }

        console.log('--- API /api/send-reminders FINISHED. ---');
        console.log(`Summary: ${sentCount} emails successfully dispatched, ${failedCount} failed.`);

        if (failedCount > 0) {
             return NextResponse.json({ 
                message: `Процесът завърши. Изпратени: ${sentCount}, Неуспешни: ${failedCount}. Проверете логовете на сървъра за повече детайли.`,
                sentCount: sentCount,
                failedCount: failedCount 
            }, { status: 207 }); // 207 Multi-Status
        } else {
            return NextResponse.json({ message: `Напомнящи имейли бяха изпратени успешно до ${sentCount} членове.` }, { status: 200 });
        }

    } catch (error) {
        console.error('CRITICAL FAILURE in /api/send-reminders:', error);
        let errorMessage = 'Възникна критична грешка при изпращането на напомняния.';
        if (error instanceof Error) {
           errorMessage = `Възникна критична грешка: ${error.message}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
