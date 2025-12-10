/**
 * auth.js
 * Supabase Authentication Module
 * Handles user signup, login, password reset, and session management
 */

const AuthModule = {
    currentUser: null,

    /**
     * Initialize authentication
     * Check for existing session and set up auth state listener
     */
    async init() {
        // Get current session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this.onAuthStateChanged(session.user);
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            this.currentUser = session?.user || null;
            this.onAuthStateChanged(this.currentUser);
        });
    },

    /**
     * Sign up new user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} name - User full name
     * @returns {Promise<{user, error}>}
     */
    async signUp(email, password, name) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    },
                    emailRedirectTo: window.location.origin + '/sign-in.html'
                }
            });

            if (error) throw error;

            // Create customer profile
            if (data.user) {
                await this.createCustomerProfile(data.user);
            }

            return { user: data.user, error: null };
        } catch (error) {
            console.error('Signup error:', error);
            return { user: null, error: error.message };
        }
    },

    /**
     * Sign in existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{user, error}>}
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            this.currentUser = data.user;
            return { user: data.user, error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            return { user: null, error: error.message };
        }
    },

    /**
     * Sign out current user
     * @returns {Promise<{error}>}
     */
    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error: error.message };
        }
    },

    /**
     * Send password reset email
     * @param {string} email - User email
     * @returns {Promise<{error}>}
     */
    async resetPassword(email) {
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html',
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Password reset error:', error);
            return { error: error.message };
        }
    },

    /**
     * Update user password
     * @param {string} newPassword - New password
     * @returns {Promise<{error}>}
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Update password error:', error);
            return { error: error.message };
        }
    },

    /**
     * Resend verification email
     * @param {string} email - User email
     * @returns {Promise<{error}>}
     */
    async resendVerificationEmail(email) {
        try {
            const { error } = await supabaseClient.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Resend verification error:', error);
            return { error: error.message };
        }
    },

    /**
     * Get current authenticated user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.currentUser !== null;
    },

    /**
     * Check if user email is verified
     * @returns {boolean}
     */
    isEmailVerified() {
        return this.currentUser?.email_confirmed_at !== null;
    },

    /**
     * Create customer profile in database
     * @param {Object} user - Supabase user object
     */
    async createCustomerProfile(user) {
        try {
            const { error } = await supabaseClient
                .from('customers')
                .insert([{
                    email: user.email,
                    name: user.user_metadata?.full_name || '',
                }]);

            if (error && error.code !== '23505') { // Ignore duplicate key error
                console.error('Error creating customer profile:', error);
            }
        } catch (error) {
            console.error('Error creating customer profile:', error);
        }
    },

    /**
     * Update customer profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<{error}>}
     */
    async updateProfile(profileData) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            // Update auth metadata
            const { error: authError } = await supabaseClient.auth.updateUser({
                data: {
                    full_name: profileData.name
                }
            });

            if (authError) throw authError;

            // Update customer table
            const { error: dbError } = await supabaseClient
                .from('customers')
                .update({
                    name: profileData.name,
                    phone: profileData.phone,
                    address: profileData.address,
                    city: profileData.city,
                    country: profileData.country
                })
                .eq('email', this.currentUser.email);

            if (dbError) throw dbError;

            return { error: null };
        } catch (error) {
            console.error('Update profile error:', error);
            return { error: error.message };
        }
    },

    /**
     * Get user's order history
     * @returns {Promise<Array>} Array of orders
     */
    async getUserOrders() {
        try {
            if (!this.currentUser) {
                return [];
            }

            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('email', this.currentUser.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },

    /**
     * Callback for auth state changes
     * Override this in your app to handle auth state changes
     * @param {Object|null} user - Current user or null
     */
    onAuthStateChanged(user) {
        // Update UI based on auth state
        const loginLinks = document.querySelectorAll('.login-link');
        const logoutLinks = document.querySelectorAll('.logout-link');
        const userNameElements = document.querySelectorAll('.user-name');

        if (user) {
            loginLinks.forEach(el => el.style.display = 'none');
            logoutLinks.forEach(el => el.style.display = 'block');
            userNameElements.forEach(el => {
                el.textContent = user.user_metadata?.full_name || user.email;
            });
        } else {
            loginLinks.forEach(el => el.style.display = 'block');
            logoutLinks.forEach(el => el.style.display = 'none');
            userNameElements.forEach(el => el.textContent = '');
        }
    },

    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} redirectUrl - URL to redirect after login
     */
    requireAuth(redirectUrl = null) {
        if (!this.isAuthenticated()) {
            const returnUrl = redirectUrl || window.location.href;
            window.location.href = `sign-in.html?redirect=${encodeURIComponent(returnUrl)}`;
            return false;
        }
        return true;
    },

    /**
     * Require email verification
     */
    requireEmailVerification() {
        if (this.isAuthenticated() && !this.isEmailVerified()) {
            alert('Please verify your email address. Check your inbox for the verification link.');
            return false;
        }
        return true;
    }
};

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthModule.init());
} else {
    AuthModule.init();
}

// Export for use in other modules
window.AuthModule = AuthModule;
