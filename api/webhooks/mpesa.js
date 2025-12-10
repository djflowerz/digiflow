
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Allow POST requests only
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize Supabase client
    // We need the SERVICE_ROLE_KEY to bypass RLS and update orders/payments securely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return res.status(500).json({ error: 'Supabase URL not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const payload = req.body;

        // Log payload for debugging (Vercel logs)
        console.log('Received M-Pesa Webhook:', JSON.stringify(payload));

        // Extract fields from IntaSend payload
        // Expected format: { api_ref: "123", state: "COMPLETE", tracking_id: "...", value: "1000", ... }
        const orderId = payload.api_ref;
        const status = payload.state;
        const transactionId = payload.tracking_id;
        const amount = payload.value;
        const phone = payload.phone_number || payload.mpesa_number || 'Unknown';

        if (!orderId) {
            return res.status(400).json({ error: 'Missing api_ref (Order ID)' });
        }

        // Determine if orderId is numeric (valid for our DB)
        // If it's a fallback string like 'ORD-123', we can't update the Supabase 'orders' table (which expects bigint)
        // In that case, we just return success to stop retries, or log a warning.
        if (isNaN(orderId)) {
            console.warn('Received non-numeric order ID:', orderId);
            return res.status(200).json({ received: true, warning: 'Non-numeric Order ID ignored' });
        }

        if (status === 'COMPLETE') {
            // 1. Update Order Status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'paid' }) // or 'completed' depending on your flow
                .eq('id', orderId);

            if (orderError) {
                console.error('Error updating order:', orderError);
                throw orderError;
            }

            // 2. Insert or Update Payment Record
            // We upsert based on transaction_id
            const { error: paymentError } = await supabase
                .from('payments')
                .upsert({
                    order_id: orderId,
                    transaction_id: transactionId,
                    amount: amount || 0,
                    phone_number: phone,
                    status: 'completed',
                    payment_method: 'M-Pesa',
                    completed_at: new Date().toISOString(),
                    metadata: payload
                }, { onConflict: 'transaction_id' });

            if (paymentError) {
                console.error('Error recording payment:', paymentError);
                // We generally don't want to fail the webhook if order updated, but good to know
            }

        } else if (status === 'FAILED') {
            // Update Order Status to failed
            await supabase
                .from('orders')
                .update({ status: 'payment_failed' })
                .eq('id', orderId);

            // Optional: Record failed payment
            if (transactionId) {
                await supabase.from('payments').upsert({
                    order_id: orderId,
                    transaction_id: transactionId,
                    amount: amount || 0,
                    phone_number: phone,
                    status: 'failed',
                    payment_method: 'M-Pesa',
                    initiated_at: new Date().toISOString(),
                    metadata: payload
                }, { onConflict: 'transaction_id' });
            }
        }

        // Acknowledge receipt
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: error.message });
    }
}
