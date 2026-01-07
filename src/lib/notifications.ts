

'use client';

// This file is temporarily unused during the Supabase migration.
// The notification logic will be re-implemented using Supabase Functions (Edge Functions)
// and database triggers for a more robust and scalable system.

import type { TransactionDetails } from './types';
import { supabase } from './supabase-client';

/**
 * Sends a system-generated notification to the family chat.
 * These messages announce significant events, like new transactions.
 *
 * @param actorUserId - The ID of the user who initiated the event.
 * @param details - An object containing the specific details of the transaction to be displayed.
 */
export async function sendSystemNotification(
    actorUserId: string,
    details: TransactionDetails,
) {
    console.log("Preparing to send system notification...");
    try {
        const { error } = await supabase.from('chat_messages').insert([{
            sender_id: 'system',
            sender_name: 'دستیار هوشمند مالی',
            text: details.title,
            type: 'system',
            transaction_details: details,
            read_by: [actorUserId], // The user who performed the action has "read" it.
        }]);

        if (error) {
            throw error;
        }
        console.log("System notification sent successfully.");

    } catch (error: any) {
        console.error("Failed to send system notification via Supabase:", error.message);
    }
}
