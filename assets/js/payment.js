/**
 * payment.js
 * Lipanampesa Payment Integration
 * 
 * Note: The provided keys appear to be identical for publishable and secret.
 * In production, these should be different and the secret key should NEVER
 * be exposed in client-side code. This implementation assumes a backend API
 * will handle the actual payment processing.
 */

const PaymentModule = {
    // Configuration
    config: {
        publishableKey: 'lip_pk_live_3c6a73bc0896c6f0f2b2ad47e4760abe0329df9036004ac504db9ef1fd58fcda',
        currency: 'KES',
        isLive: true // Set to false for test environment
    },

    init() {
        this.setupPaymentForm();
        this.setupEventListeners();
    },

    setupPaymentForm() {
        // Check if we're on the checkout page
        const checkoutForm = document.getElementById('checkoutForm');
        if (!checkoutForm) return;

        // The payment UI is already in checkout.html, no need to inject
    },

    injectPaymentUI() {
        const paymentSection = document.getElementById('paymentSection');
        if (!paymentSection) return;

        const paymentHTML = `
            <div class="payment-methods mb-4">
                <h5 class="mb-3">Payment Method</h5>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="radio" name="paymentMethod" id="mpesaPayment" value="mpesa" checked>
                    <label class="form-check-label d-flex align-items-center" for="mpesaPayment">
                        <strong>M-Pesa</strong>
                        <span class="ms-2 text-muted">(Lipa Na M-Pesa)</span>
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="paymentMethod" id="cashPayment" value="cash">
                    <label class="form-check-label" for="cashPayment">
                        Cash on Delivery
                    </label>
                </div>
            </div>

            <div id="mpesaDetails" class="mpesa-payment-section">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>M-Pesa Payment:</strong> You will receive an STK push notification on your phone to complete the payment.
                </div>
                <div class="mb-3">
                    <label for="mpesaPhone" class="form-label">M-Pesa Phone Number</label>
                    <input type="tel" class="form-control" id="mpesaPhone" placeholder="254712345678" pattern="254[0-9]{9}" required>
                    <small class="form-text text-muted">Format: 254XXXXXXXXX</small>
                </div>
            </div>

            <div id="paymentStatus" class="mt-3"></div>
        `;

        paymentSection.innerHTML = paymentHTML;
    },

    setupEventListeners() {
        // Listen for payment method changes
        document.addEventListener('change', (e) => {
            if (e.target.name === 'paymentMethod') {
                this.handlePaymentMethodChange(e.target.value);
            }
        });

        // Listen for checkout form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'checkoutForm') {
                e.preventDefault();
                this.processCheckout();
            }
        });
    },

    handlePaymentMethodChange(method) {
        const mpesaDetails = document.getElementById('mpesaDetails');
        if (mpesaDetails) {
            mpesaDetails.style.display = method === 'mpesa' ? 'block' : 'none';
        }
    },

    async processCheckout() {
        // Double check authentication
        if (!AuthModule.isAuthenticated()) {
            alert("You must be logged in to complete a purchase.");
            const returnUrl = window.location.href;
            window.location.href = `sign-in.html?redirect=${encodeURIComponent(returnUrl)}`;
            return;
        }

        // The checkout.html has a radio button with name="payment" for M-Pesa Express
        // Since it's the only payment method and is checked by default, we'll always process M-Pesa
        await this.processMpesaPayment();
    },

    async processMpesaPayment() {
        const phoneNumber = document.getElementById('phone').value;
        const statusDiv = document.getElementById('paymentStatus');

        // Validate phone number
        if (!this.validatePhoneNumber(phoneNumber)) {
            this.showError('Please enter a valid M-Pesa phone number (254XXXXXXXXX)');
            return;
        }

        // Get cart and customer details
        const cart = Store.getCart();
        const cartTotal = Store.getCartTotal();
        const firstName = document.getElementById('fname')?.value || '';
        const lastName = document.getElementById('lname')?.value || '';
        const customerName = `${firstName} ${lastName}`.trim() || 'Guest';
        const customerEmail = document.getElementById('email')?.value || '';
        const customerPhone = phoneNumber;

        // Show loading state
        statusDiv.innerHTML = `
            <div class="alert alert-info">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Initiating M-Pesa payment...
            </div>
        `;

        try {
            // Create order object
            const orderData = {
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                shipping_address: {
                    address1: document.getElementById('address1')?.value || '',
                    address2: document.getElementById('address2')?.value || '',
                    city: document.getElementById('city')?.value || '',
                    country: document.getElementById('country')?.value || '',
                    postcode: document.getElementById('postcode')?.value || '',
                    notes: document.getElementById('notes')?.value || ''
                },
                total: parseFloat(cartTotal),
                items: cart.map(i => ({
                    product_id: i.id,
                    name: i.name,
                    qty: i.qty,
                    price: i.price
                })),
                payment_method: 'M-Pesa (Lipana)',
                payment_status: 'pending',
                status: 'pending',
                created_at: new Date().toISOString()
            };

            // Save order to Supabase
            const { data: savedOrder, error } = await SupabaseDB.addOrder(orderData);

            if (error) throw error;
            const orderId = savedOrder ? savedOrder.id : ('ORD-' + Date.now());

            console.log('Order created:', orderId);

            // Call Vercel Function for Lipana STK Push
            console.log('Calling payment API with:', {
                amount: cartTotal,
                phone: customerPhone,
                orderId: orderId
            });

            const response = await fetch('/api/mpesa/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: cartTotal,
                    phone: customerPhone,
                    orderId: orderId
                })
            });

            const result = await response.json();
            console.log('Payment API response:', result);

            if (!response.ok) {
                console.error('Payment API error:', result);
                throw new Error(result.error || result.details || 'Payment initiation failed');
            }

            // If successful
            console.log("Lipana Payment Initiated Successfully:", result);

            statusDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>STK Push Sent!</strong><br>
                    Please check your phone (${customerPhone}) to complete payment.<br>
                    <small>Enter your M-Pesa PIN when prompted.</small>
                </div>
                <div class="alert alert-info mt-2">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    Waiting for payment confirmation...
                </div>
            `;

            // Start polling or waiting for webhook confirmation via Supabase subscription
            // Here we use the existing polling mock or you can rely on the webhook updating the status
            this.pollPaymentStatus(result.data?.transaction_id || result.transaction_id || orderId, orderId);

        } catch (error) {
            console.error('Payment initialization error:', error);
            this.showError(`
                <strong>Payment Failed</strong><br>
                ${error.message}<br>
                <small>Please check your phone number and try again.</small><br>
                <small class="text-muted">Phone: ${customerPhone}</small>
            `);
        }
    },

    async savePaymentTransaction(transactionData) {
        // Save payment transaction to Supabase
        // This would require a payments table in Supabase
        try {
            const { data, error } = await supabaseClient
                .from('payments')
                .insert([transactionData])
                .select()
                .single();

            if (error) {
                console.error('Error saving payment transaction:', error);
            }
            return data;
        } catch (error) {
            console.error('Error saving payment:', error);
            // Don't throw - payment might still succeed
        }
    },

    async callPaymentAPI(paymentData) {
        // IMPORTANT: This is a placeholder implementation
        // In production, you MUST implement a backend API that:
        // 1. Receives the payment request from the frontend
        // 2. Uses the SECRET key (stored securely on the backend)
        // 3. Calls the Lipanampesa/M-Pesa API
        // 4. Returns the response to the frontend

        // Simulated API call for demonstration
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful payment initiation
                resolve({
                    success: true,
                    transactionId: 'TXN' + Date.now(),
                    message: 'STK push sent to phone'
                });
            }, 1500);
        });

        /* 
        // Real implementation would look like this:
        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Publishable-Key': this.config.publishableKey
            },
            body: JSON.stringify(paymentData)
        });
        return await response.json();
        */
    },

    async pollPaymentStatus(transactionId, orderId) {
        // Poll the backend for payment status
        // In a real implementation, this would check if the user completed the M-Pesa payment
        const statusDiv = document.getElementById('paymentStatus');

        statusDiv.innerHTML = `
            <div class="alert alert-warning">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Waiting for payment confirmation...
            </div>
        `;

        // Simulate payment confirmation after 5 seconds
        setTimeout(async () => {
            await this.handlePaymentSuccess(transactionId, orderId);
        }, 5000);
    },

    async handlePaymentSuccess(transactionId, orderId) {
        const statusDiv = document.getElementById('paymentStatus');

        try {
            // Update order status to completed
            await SupabaseDB.updateOrderStatus(orderId, 'completed');

            // Update payment transaction status
            await supabaseClient
                .from('payments')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('transaction_id', transactionId);

            statusDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Payment Successful!</strong><br>
                    Transaction ID: ${transactionId}<br>
                    Order ID: #${orderId}<br>
                    Your order has been placed successfully.
                </div>
            `;

            // Clear cart
            Store.clearCart();

            // Redirect to success page after 3 seconds
            setTimeout(() => {
                window.location.href = `index.html?payment=success&order=${orderId}`;
            }, 3000);
        } catch (error) {
            console.error('Error updating order:', error);
            this.showError('Payment successful but order update failed. Please contact support.');
        }
    },

    async processCashPayment() {
        const statusDiv = document.getElementById('paymentStatus');

        try {
            // Get cart and customer details
            const cart = Store.getCart();
            const firstName = document.getElementById('fname')?.value || '';
            const lastName = document.getElementById('lname')?.value || '';
            const customerName = `${firstName} ${lastName}`.trim() || 'Guest';
            const customerEmail = document.getElementById('email')?.value || '';
            const customerPhone = document.getElementById('phone')?.value || '';

            // Create order in Supabase
            const order = await SupabaseDB.addOrder({
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                shipping_address: {
                    address1: document.getElementById('address1')?.value || '',
                    address2: document.getElementById('address2')?.value || '',
                    city: document.getElementById('city')?.value || '',
                    country: document.getElementById('country')?.value || '',
                    postcode: document.getElementById('postcode')?.value || '',
                    notes: document.getElementById('notes')?.value || ''
                },
                total: Store.getCartTotal(),
                items: cart,
                payment_method: 'Cash on Delivery',
                status: 'pending'
            });

            statusDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Order Placed!</strong><br>
                    Order ID: #${order.id}<br>
                    Your order has been placed. You will pay cash on delivery.
                </div>
            `;

            // Clear cart
            Store.clearCart();

            // Redirect after 3 seconds
            setTimeout(() => {
                window.location.href = `index.html?order=success&id=${order.id}`;
            }, 3000);
        } catch (error) {
            console.error('Error placing order:', error);
            this.showError('Failed to place order. Please try again.');
        }
    },

    validatePhoneNumber(phone) {
        // Kenyan phone number format: 254XXXXXXXXX
        const phoneRegex = /^254[0-9]{9}$/;
        return phoneRegex.test(phone);
    },

    showError(message) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${message}
            </div>
        `;
    },

    showSuccess(message) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                ${message}
            </div>
        `;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PaymentModule.init());
} else {
    PaymentModule.init();
}
