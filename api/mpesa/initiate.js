// Lipana M-Pesa STK Push API Endpoint
// This runs on Vercel serverless function

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

        console.log('Payment initiation request:', { amount, phone, orderId });

        if (!amount || !phone) {
            console.error('Missing required fields:', { amount, phone });
            return res.status(400).json({ error: 'Missing amount or phone number' });
        }

        // Validate phone number format
        if (!/^254[0-9]{9}$/.test(phone)) {
            console.error('Invalid phone format:', phone);
            return res.status(400).json({ error: 'Invalid phone number format. Use 254XXXXXXXXX' });
        }

        // Check if Lipana secret key is configured
        if (!process.env.LIPANA_SECRET_KEY) {
            console.error('LIPANA_SECRET_KEY not configured');
            return res.status(500).json({ error: 'Payment gateway not configured' });
        }

        console.log('Lipana Secret Key present:', process.env.LIPANA_SECRET_KEY ? 'Yes' : 'No');

        // Import Lipana SDK dynamically
        const { default: Lipana } = await import('@lipana/sdk');

        // Initialize Lipana
        const lipana = new Lipana({
            apiKey: process.env.LIPANA_SECRET_KEY,
            environment: 'production'
        });

        console.log('Lipana SDK initialized');

        // Initiate STK Push
        const callbackUrl = `https://digiflowstore-git-main-digiflow.vercel.app/api/webhooks/mpesa?orderId=${orderId}`;

        console.log('Initiating STK push with:', {
            amount,
            phone,
            callbackUrl,
            accountReference: orderId || 'Digiflow'
        });

        const response = await lipana.stk.initiate({
            amount: parseFloat(amount),
            phone: phone,
            callback_url: callbackUrl,
            account_reference: orderId || 'Digiflow',
            transaction_desc: `Payment for Order ${orderId}`
        });

        console.log('Lipana response:', response);

        return res.status(200).json({
            success: true,
            message: 'STK push initiated successfully',
            data: response
        });

    } catch (error) {
        console.error('Lipana Error Details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });

        return res.status(500).json({
            error: 'Payment initiation failed',
            details: error.message,
            hint: 'Check Vercel logs for more details'
        });
    }
}
