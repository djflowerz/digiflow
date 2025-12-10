/**
 * route-guard.js
 * Protect pages that require authentication
 */

const RouteGuard = {
    /**
     * Protect admin pages - require authentication
     */
    protectAdminPage() {
        // Check if user is authenticated
        if (!AuthModule.isAuthenticated()) {
            // Redirect to sign-in with return URL
            const returnUrl = window.location.href;
            window.location.href = `sign-in.html?redirect=${encodeURIComponent(returnUrl)}`;
            return false;
        }
        return true;
    },

    /**
     * Protect user account pages - require authentication
     */
    protectUserPage() {
        if (!AuthModule.isAuthenticated()) {
            const returnUrl = window.location.href;
            window.location.href = `sign-in.html?redirect=${encodeURIComponent(returnUrl)}`;
            return false;
        }
        return true;
    },

    /**
     * Require email verification
     */
    requireEmailVerification() {
        if (!AuthModule.isEmailVerified()) {
            alert('Please verify your email address before accessing this page.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    /**
     * Check if user has admin role (optional - for future use)
     */
    isAdmin() {
        const user = AuthModule.getCurrentUser();
        return user?.user_metadata?.role === 'admin';
    }
};

// Export
window.RouteGuard = RouteGuard;
