const Lipana = require('@lipana/sdk');

// Initialize Lipana with your Secret Key (from env vars)
const lipana = new Lipana({
    apiKey: process.env.LIPANA_SECRET_KEY,
    environment: 'production' // or 'sandbox' based on your key type
});

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, phone, orderId } = req.body;

        if (!amount || !phone) {
            return res.status(400).json({ error: 'Missing amount or phone number' });
        }

        // Initiate STK Push
        // Note: Adjust the callback_url to your production URL
        const response = await lipana.stk.initiate({
            amount: amount,
            phone: phone,
            callback_url: `https://digiflowstore.vercel.app/api/webhooks/mpesa?orderId=${orderId}`,
            account_reference: orderId || 'Digiflow',
            transaction_desc: `Payment for Order ${orderId}`
        });

        return res.status(200).json(response);

    } catch (error) {
        console.error('Lipana Error:', error);
        return res.status(500).json({
            error: 'Payment initiation failed',
            details: error.message
        });
    }
}
