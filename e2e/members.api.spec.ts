import { test, expect } from '@playwright/test';

// Generate a unique email for each test run to avoid conflicts
const randomEmail = `testuser_${Date.now()}@example.com`;

test.describe('Members API', () => {
  let createdMemberId: string;

  test('should create a new member and automatically create a subscription', async ({ request }) => {
    // Step 1: Create a new member
    const newMemberResponse = await request.post('/api/members', {
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: randomEmail,
        // Add other required fields here if necessary
      },
    });

    // Step 2: Verify the member was created successfully
    expect(newMemberResponse.status()).toBe(201); // Assuming 201 Created is the success status
    const memberData = await newMemberResponse.json();
    expect(memberData).toHaveProperty('id');
    createdMemberId = memberData.id;

    // Step 3: Verify that a subscription was automatically created for the new member
    const subscriptionsResponse = await request.get(`/api/members/${createdMemberId}/subscriptions`);
    expect(subscriptionsResponse.status()).toBe(200);

    const subscriptionsData = await subscriptionsResponse.json();
    // Assuming the API returns an array of subscriptions
    expect(Array.isArray(subscriptionsData)).toBe(true);
    // Assuming a default subscription is created
    expect(subscriptionsData.length).toBeGreaterThan(0);
    
    // Optional: Add more specific checks about the created subscription
    const firstSubscription = subscriptionsData[0];
    expect(firstSubscription).toHaveProperty('type');
    // For example, check if it's a standard 'fitness' subscription
    // expect(firstSubscription.type).toBe('fitness'); 
  });

  // We can add a cleanup step that runs after all tests in this file
  test.afterAll(async ({ request }) => {
    if (createdMemberId) {
      // Optional: Delete the created member to clean up the database
      // This is good practice for testing
      await request.delete(`/api/members/${createdMemberId}`);
    }
  });
});
