// Daraja M-Pesa STK Push API Endpoint
// Official Safaricom M-Pesa API integration

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

        // Check if Daraja credentials are configured
        if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
            console.error('Daraja credentials not configured');
            return res.status(500).json({ error: 'Payment gateway not configured' });
        }

        // Step 1: Get OAuth token from Daraja
        const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');

        const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('Failed to get access token:', tokenData);
            throw new Error('Failed to authenticate with M-Pesa');
        }

        const accessToken = tokenData.access_token;
        console.log('Access token obtained');

        // Step 2: Generate password for STK push
        const shortCode = process.env.MPESA_SHORTCODE || '174379';
        const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        // Step 3: Initiate STK Push
        const callbackUrl = `https://digiflowstore-git-main-digiflow.vercel.app/api/webhooks/mpesa?orderId=${orderId}`;

        const stkPushPayload = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(parseFloat(amount)),
            PartyA: phone,
            PartyB: shortCode,
            PhoneNumber: phone,
            CallBackURL: callbackUrl,
            AccountReference: orderId || 'Digiflow',
            TransactionDesc: `Payment for Order ${orderId}`
        };

        console.log('Initiating STK push:', { phone, amount, orderId });

        const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stkPushPayload)
        });

        const stkData = await stkResponse.json();

        console.log('STK Push response:', stkData);

        if (!stkResponse.ok || stkData.ResponseCode !== '0') {
            console.error('STK Push failed:', stkData);
            throw new Error(stkData.ResponseDescription || stkData.errorMessage || 'STK Push failed');
        }

        return res.status(200).json({
            success: true,
            message: 'STK push initiated successfully',
            data: {
                MerchantRequestID: stkData.MerchantRequestID,
                CheckoutRequestID: stkData.CheckoutRequestID,
                ResponseCode: stkData.ResponseCode,
                ResponseDescription: stkData.ResponseDescription,
                CustomerMessage: stkData.CustomerMessage
            }
        });

    } catch (error) {
        console.error('M-Pesa Error Details:', {
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: 'Payment initiation failed',
            details: error.message,
            hint: 'Check Vercel logs for more details'
        });
    }
}
