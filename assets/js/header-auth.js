/**
 * header-auth.js
 * Update header elements based on authentication state
 */

const HeaderAuth = {
    /**
     * Initialize header authentication UI
     */
    async init() {
        await AuthModule.init();
        this.updateHeader();

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.updateHeader();
        });
    },

    /**
     * Update header with authentication state
     */
    updateHeader() {
        const user = AuthModule.getCurrentUser();

        // Update login/logout links in top header
        this.updateQuickLinks(user);

        // Update account dropdown
        this.updateAccountDropdown(user);
    },

    /**
     * Update quick links (Join Us / Sign In)
     * @param {Object|null} user - Current user
     */
    updateQuickLinks(user) {
        const quickLinks = document.querySelector('.header-top-link .quick-link');
        if (!quickLinks) return;

        if (user) {
            const userName = user.user_metadata?.full_name || user.email.split('@')[0];
            quickLinks.innerHTML = `
                <li><a href="#">Help</a></li>
                <li><a href="my-account.html">My Account</a></li>
                <li><a href="#" onclick="HeaderAuth.logout(); return false;">Logout</a></li>
            `;
        } else {
            quickLinks.innerHTML = `
                <li><a href="#">Help</a></li>
                <li><a href="sign-up.html">Join Us</a></li>
                <li><a href="sign-in.html">Sign In</a></li>
            `;
        }
    },

    /**
     * Update account dropdown
     * @param {Object|null} user - Current user
     */
    updateAccountDropdown(user) {
        const dropdown = document.querySelector('.my-account-dropdown');
        if (!dropdown) return;

        if (user) {
            const userName = user.user_metadata?.full_name || user.email.split('@')[0];

            // Update title
            const title = dropdown.querySelector('.title');
            if (title) {
                title.textContent = `Hello, ${userName}`;
            }

            // Update links
            const linksContainer = dropdown.querySelector('ul');
            if (linksContainer) {
                linksContainer.innerHTML = `
                    <li><a href="my-account.html">My Account</a></li>
                    <li><a href="my-account.html#nav-orders">My Orders</a></li>
                    <li><a href="wishlist.html">Wishlist</a></li>
                    <li><a href="#" onclick="HeaderAuth.logout(); return false;">Logout</a></li>
                `;
            }

            // Update login button area
            const loginBtn = dropdown.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <a href="my-account.html" class="axil-btn btn-bg-primary">My Account</a>
                `;
            }

            // Hide register footer
            const regFooter = dropdown.querySelector('.reg-footer');
            if (regFooter) {
                regFooter.style.display = 'none';
            }
        } else {
            // Update title
            const title = dropdown.querySelector('.title');
            if (title) {
                title.textContent = 'QUICKLINKS';
            }

            // Update links
            const linksContainer = dropdown.querySelector('ul');
            if (linksContainer) {
                linksContainer.innerHTML = `
                    <li><a href="my-account.html">My Account</a></li>
                    <li><a href="#">Initiate return</a></li>
                    <li><a href="#">Support</a></li>
                    <li><a href="#">Language</a></li>
                `;
            }

            // Update login button
            const loginBtn = dropdown.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <a href="sign-in.html" class="axil-btn btn-bg-primary">Login</a>
                `;
            }

            // Show register footer
            const regFooter = dropdown.querySelector('.reg-footer');
            if (regFooter) {
                regFooter.style.display = 'block';
                regFooter.innerHTML = 'No account yet? <a href="sign-up.html" class="btn-link">REGISTER HERE.</a>';
            }
        }
    },

    /**
     * Handle logout
     */
    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            await AuthModule.signOut();
            window.location.href = 'index.html';
        }
    }
};

// Auto-initialize on pages with headers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.header')) {
            HeaderAuth.init();
        }
    });
} else {
    if (document.querySelector('.header')) {
        HeaderAuth.init();
    }
}

// Export
window.HeaderAuth = HeaderAuth;
