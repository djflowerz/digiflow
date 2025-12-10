/**
 * customer-auth.js
 * Customer authentication module
 */

const CustomerAuth = {
    // Register new customer
    async register(email, password, name, phone) {
        try {
            // Sign up with Supabase Auth
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;

            // Add to customers table
            if (data.user) {
                await supabaseClient.from('customers').insert({
                    id: data.user.id,
                    email: email,
                    name: name,
                    phone: phone
                });
            }

            UIHelpers.showSuccess('Registration successful! Please check your email to verify your account.');
            return data;
        } catch (error) {
            UIHelpers.showError(error.message);
            throw error;
        }
    },

    // Login customer
    async login(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            UIHelpers.showSuccess('Login successful!');
            return data;
        } catch (error) {
            UIHelpers.showError(error.message);
            throw error;
        }
    },

    // Logout customer
    async logout() {
        try {
            await supabaseClient.auth.signOut();
            UIHelpers.showSuccess('Logged out successfully');
            window.location.href = 'index.html';
        } catch (error) {
            UIHelpers.showError('Logout failed');
        }
    },

    // Get current customer
    async getCurrentCustomer() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabaseClient
                .from('customers')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching customer:', error);
            return null;
        }
    },

    // Check if customer is logged in
    async isLoggedIn() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session !== null;
    },

    // Update customer profile
    async updateProfile(updates) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const { error } = await supabaseClient
                .from('customers')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            UIHelpers.showSuccess('Profile updated successfully');
            return true;
        } catch (error) {
            UIHelpers.showError('Failed to update profile');
            return false;
        }
    }
};

window.CustomerAuth = CustomerAuth;
