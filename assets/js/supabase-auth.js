/**
 * supabase-auth.js
 * Enhanced Supabase authentication with admin role checking
 */

const SupabaseAuth = {
    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session !== null;
    },

    /**
     * Check if current user is an admin
     * @returns {Promise<boolean>}
     */
    async isAdmin() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) return false;

            // Check if user exists in admins table
            const { data, error } = await supabaseClient
                .from('admins')
                .select('id')
                .eq('email', session.user.email)
                .single();

            if (error) {
                console.error('Error checking admin status:', error);
                return false;
            }

            return data !== null;
        } catch (error) {
            console.error('Error in isAdmin:', error);
            return false;
        }
    },

    /**
     * Get current user
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session?.user || null;
    },

    /**
     * Sign in with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{user, error}>}
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
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
            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error: error.message };
        }
    },

    /**
     * Protect admin page - only allow admins
     * Redirects to index.html if not admin
     * @returns {Promise<boolean>}
     */
    async protectAdminPage() {
        const isAuth = await this.isAuthenticated();

        if (!isAuth) {
            // Not authenticated at all - redirect to home
            window.location.href = 'index.html';
            return false;
        }

        const isAdminUser = await this.isAdmin();

        if (!isAdminUser) {
            // Authenticated but not admin - redirect to home
            alert('Access denied. This page is for administrators only.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }
};

// Export
window.SupabaseAuth = SupabaseAuth;
