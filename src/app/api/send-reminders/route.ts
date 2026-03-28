
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getOverdueMembers } from '@/services/reminder-service.server';

// No longer need React, render, or the email component here.

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

        console.log(`STEP 3: Proceeding to dispatch email requests for ${overdueMembers.length} members.`);

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
                console.log(`Attempting to dispatch email request for ${memberName} (${member.email}) via internal API...`);
                
                // The payload now contains the member's name and a template identifier,
                // instead of the rendered HTML.
                const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: member.email,
                        subject: 'Напомняне за просрочено плащане',
                        template: 'reminder', // Specify which email to render
                        data: { memberName },   // Pass the necessary data for the template
                    }),
                });

                if (!emailResponse.ok) {
                    const errorBody = await emailResponse.json().catch(() => ({ error: 'Could not parse error response from /api/send-email' }));
                    // Use a more descriptive error name
                    const errorMessage = errorBody.error || `Internal API /api/send-email failed with status ${emailResponse.status}`;
                    throw new Error(errorMessage);
                }
                
                console.log(`SUCCESS: Email request for ${memberName} (${member.email}) was accepted by the email API.`);
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
        console.log(`Summary: ${sentCount} email requests accepted, ${failedCount} failed.`);

        if (failedCount > 0) {
             return NextResponse.json({ 
                message: `Процесът завърши. Успешни заявки: ${sentCount}, Неуспешни: ${failedCount}. Проверете логовете на сървъра за повече детайли.`,
                sentCount: sentCount,
                failedCount: failedCount 
            }, { status: 207 }); // 207 Multi-Status
        } else {
            return NextResponse.json({ message: `Заявките за напомнящи имейли бяха изпратени успешно за ${sentCount} членове.` }, { status: 200 });
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
