/**
 * customer-profile.js
 * Customer profile management with Supabase
 */

const CustomerProfile = {
    /**
     * Get customer profile data
     * @returns {Promise<Object|null>}
     */
    async getProfile() {
        try {
            const user = AuthModule.getCurrentUser();
            if (!user) return null;

            // Return user metadata combined with basic user info
            return {
                email: user.email,
                id: user.id,
                ...user.user_metadata
            };
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    },

    /**
     * Update customer profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<Object>}
     */
    async updateProfile(profileData) {
        try {
            const user = AuthModule.getCurrentUser();
            if (!user) throw new Error('No authenticated user');

            // Update auth metadata
            const { data, error } = await supabaseClient.auth.updateUser({
                data: {
                    full_name: profileData.name,
                    phone: profileData.phone,
                    address: profileData.address,
                    city: profileData.city,
                    country: profileData.country,
                    zip: profileData.zip
                }
            });

            if (error) throw error;
            return {
                email: data.user.email,
                id: data.user.id,
                ...data.user.user_metadata
            };
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    /**
     * Get customer orders
     * @returns {Promise<Array>}
     */
    async getOrders() {
        try {
            const user = AuthModule.getCurrentUser();
            if (!user) {
                return [];
            }

            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('customer_email', user.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    },

    /**
     * Get order by ID
     * @param {number} orderId - Order ID
     * @returns {Promise<Object|null>}
     */
    async getOrder(orderId) {
        try {
            const user = AuthModule.getCurrentUser();
            if (!user) {
                return null;
            }

            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .eq('customer_email', user.email)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting order:', error);
            return null;
        }
    },

    /**
     * Update password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>}
     */
    async updatePassword(currentPassword, newPassword) {
        try {
            // Verify current password by attempting to sign in
            const user = AuthModule.getCurrentUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            // Re-authenticate with current password
            const { error: signInError } = await supabaseClient.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                throw new Error('Current password is incorrect');
            }

            // Update to new password
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    /**
     * Format order for display
     * @param {Object} order - Order object
     * @returns {string} HTML string
     */
    formatOrderRow(order) {
        const statusClass = order.status === 'completed' ? 'text-success' :
            order.status === 'pending' ? 'text-warning' :
                order.status === 'cancelled' ? 'text-danger' : 'text-info';

        const date = new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const itemCount = Array.isArray(order.items) ? order.items.length : 0;

        return `
            <tr>
                <th scope="row">#${order.id}</th>
                <td>${date}</td>
                <td><span class="${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                <td>KES ${parseFloat(order.total).toFixed(2)} for ${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                <td><a href="#" class="axil-btn view-btn" onclick="viewOrderDetails(${order.id}); return false;">View</a></td>
            </tr>
        `;
    }
};

// Export
window.CustomerProfile = CustomerProfile;
