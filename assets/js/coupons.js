/**
 * coupons.js
 * Coupon/discount code system
 */

const CouponsModule = {
    // Validate and apply coupon
    async validateCoupon(code, cartTotal) {
        try {
            const { data, error } = await supabaseClient
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('active', true)
                .single();

            if (error || !data) {
                throw new Error('Invalid coupon code');
            }

            // Check expiry
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                throw new Error('This coupon has expired');
            }

            // Check min purchase
            if (data.min_purchase && cartTotal < data.min_purchase) {
                throw new Error(`Minimum purchase amount: KES ${data.min_purchase}`);
            }

            // Check usage limit
            if (data.max_uses && data.used_count >= data.max_uses) {
                throw new Error('This coupon has reached its usage limit');
            }

            // Calculate discount
            let discount = 0;
            if (data.discount_type === 'percentage') {
                discount = (cartTotal * data.discount_value) / 100;
            } else {
                discount = data.discount_value;
            }

            // Don't let discount exceed cart total
            discount = Math.min(discount, cartTotal);

            return {
                valid: true,
                discount: discount,
                coupon: data,
                message: `Coupon applied! You saved KES ${discount.toFixed(2)}`
            };
        } catch (error) {
            return {
                valid: false,
                discount: 0,
                message: error.message
            };
        }
    },

    // Record coupon usage
    async recordUsage(couponId, orderId, discountAmount) {
        try {
            // Insert usage record
            await supabaseClient
                .from('coupon_usage')
                .insert({
                    coupon_id: couponId,
                    order_id: orderId,
                    discount_amount: discountAmount
                });

            // Increment used count
            await supabaseClient.rpc('increment_coupon_usage', { coupon_id: couponId });

            return true;
        } catch (error) {
            console.error('Error recording coupon usage:', error);
            return false;
        }
    },

    // Admin: Get all coupons
    async getAllCoupons() {
        try {
            const { data, error } = await supabaseClient
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching coupons:', error);
            return [];
        }
    },

    // Admin: Create coupon
    async createCoupon(couponData) {
        try {
            const { data, error } = await supabaseClient
                .from('coupons')
                .insert({
                    code: couponData.code.toUpperCase(),
                    discount_type: couponData.discount_type,
                    discount_value: couponData.discount_value,
                    min_purchase: couponData.min_purchase || 0,
                    max_uses: couponData.max_uses || null,
                    expires_at: couponData.expires_at || null,
                    active: true
                })
                .select()
                .single();

            if (error) throw error;
            UIHelpers.showSuccess('Coupon created successfully!');
            return data;
        } catch (error) {
            UIHelpers.showError('Failed to create coupon: ' + error.message);
            throw error;
        }
    },

    // Admin: Update coupon
    async updateCoupon(couponId, updates) {
        try {
            const { error } = await supabaseClient
                .from('coupons')
                .update(updates)
                .eq('id', couponId);

            if (error) throw error;
            UIHelpers.showSuccess('Coupon updated!');
            return true;
        } catch (error) {
            UIHelpers.showError('Failed to update coupon');
            return false;
        }
    },

    // Admin: Delete coupon
    async deleteCoupon(couponId) {
        try {
            const { error } = await supabaseClient
                .from('coupons')
                .delete()
                .eq('id', couponId);

            if (error) throw error;
            UIHelpers.showSuccess('Coupon deleted!');
            return true;
        } catch (error) {
            UIHelpers.showError('Failed to delete coupon');
            return false;
        }
    },

    // Display coupon input on checkout
    displayCouponInput(containerId = 'couponContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="coupon-section card p-3 mb-3">
                <h6 class="mb-3">Have a coupon code?</h6>
                <div class="input-group">
                    <input type="text" class="form-control" id="couponCode" placeholder="Enter coupon code">
                    <button class="btn btn-primary" type="button" id="applyCouponBtn">Apply</button>
                </div>
                <div id="couponMessage" class="mt-2"></div>
                <div id="couponDiscount" class="mt-2" style="display: none;">
                    <div class="alert alert-success d-flex justify-content-between align-items-center">
                        <span>Discount: <strong>KES <span id="discountAmount">0.00</span></strong></span>
                        <button class="btn btn-sm btn-link text-danger" id="removeCouponBtn">Remove</button>
                    </div>
                </div>
            </div>
        `;

        // Store applied coupon
        let appliedCoupon = null;

        // Apply coupon handler
        document.getElementById('applyCouponBtn').addEventListener('click', async () => {
            const code = document.getElementById('couponCode').value.trim();
            const messageDiv = document.getElementById('couponMessage');

            if (!code) {
                messageDiv.innerHTML = '<small class="text-danger">Please enter a coupon code</small>';
                return;
            }

            const cartTotal = Store.getCartTotal();
            const result = await this.validateCoupon(code, cartTotal);

            if (result.valid) {
                appliedCoupon = result;
                document.getElementById('discountAmount').textContent = result.discount.toFixed(2);
                document.getElementById('couponDiscount').style.display = 'block';
                messageDiv.innerHTML = `<small class="text-success">${result.message}</small>`;
                document.getElementById('couponCode').disabled = true;
                document.getElementById('applyCouponBtn').disabled = true;

                // Trigger update event
                window.dispatchEvent(new CustomEvent('couponApplied', { detail: result }));
            } else {
                messageDiv.innerHTML = `<small class="text-danger">${result.message}</small>`;
                document.getElementById('couponDiscount').style.display = 'none';
            }
        });

        // Remove coupon handler
        document.getElementById('removeCouponBtn')?.addEventListener('click', () => {
            appliedCoupon = null;
            document.getElementById('couponCode').value = '';
            document.getElementById('couponCode').disabled = false;
            document.getElementById('applyCouponBtn').disabled = false;
            document.getElementById('couponDiscount').style.display = 'none';
            document.getElementById('couponMessage').innerHTML = '';

            window.dispatchEvent(new CustomEvent('couponRemoved'));
        });
    },

    // Get applied coupon
    getAppliedCoupon() {
        return this.appliedCoupon || null;
    }
};

window.CouponsModule = CouponsModule;
