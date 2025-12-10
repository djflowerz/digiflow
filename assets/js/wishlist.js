/**
 * wishlist.js
 * Wishlist management module
 */

const WishlistModule = {
    // Add to wishlist
    async addToWishlist(productId) {
        const user = await supabaseClient.auth.getUser();
        if (!user.data.user) {
            UIHelpers.showWarning('Please login to add to wishlist');
            setTimeout(() => {
                window.location.href = 'customer-login.html';
            }, 2000);
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('wishlists')
                .insert({
                    customer_id: user.data.user.id,
                    product_id: productId
                });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    UIHelpers.showInfo('Already in wishlist');
                } else {
                    throw error;
                }
            } else {
                UIHelpers.showSuccess('Added to wishlist!');
                this.updateWishlistCount();
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            UIHelpers.showError('Failed to add to wishlist');
        }
    },

    // Remove from wishlist
    async removeFromWishlist(productId) {
        const user = await supabaseClient.auth.getUser();
        if (!user.data.user) return;

        try {
            const { error } = await supabaseClient
                .from('wishlists')
                .delete()
                .eq('customer_id', user.data.user.id)
                .eq('product_id', productId);

            if (error) throw error;

            UIHelpers.showSuccess('Removed from wishlist');
            this.updateWishlistCount();
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            UIHelpers.showError('Failed to remove from wishlist');
        }
    },

    // Get wishlist
    async getWishlist() {
        const user = await supabaseClient.auth.getUser();
        if (!user.data.user) return [];

        try {
            const { data, error } = await supabaseClient
                .from('wishlists')
                .select(`
                    *,
                    products (*)
                `)
                .eq('customer_id', user.data.user.id);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            return [];
        }
    },

    // Check if product is in wishlist
    async isInWishlist(productId) {
        const user = await supabaseClient.auth.getUser();
        if (!user.data.user) return false;

        try {
            const { data, error } = await supabaseClient
                .from('wishlists')
                .select('id')
                .eq('customer_id', user.data.user.id)
                .eq('product_id', productId)
                .single();

            return !error && data !== null;
        } catch (error) {
            return false;
        }
    },

    // Update wishlist count in header
    async updateWishlistCount() {
        const wishlist = await this.getWishlist();
        const countElements = document.querySelectorAll('.wishlist-count');
        countElements.forEach(el => {
            el.textContent = wishlist.length;
        });
    },

    // Toggle wishlist
    async toggleWishlist(productId, buttonElement) {
        const isInWishlist = await this.isInWishlist(productId);

        if (isInWishlist) {
            await this.removeFromWishlist(productId);
            if (buttonElement) {
                buttonElement.innerHTML = '<i class="far fa-heart"></i>';
            }
        } else {
            await this.addToWishlist(productId);
            if (buttonElement) {
                buttonElement.innerHTML = '<i class="fas fa-heart"></i>';
            }
        }
    }
};

window.WishlistModule = WishlistModule;
