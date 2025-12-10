/**
 * supabase-db.js
 * Database operations wrapper for Supabase
 * Replaces localStorage Store object
 */

const SupabaseDB = {
    // ==================== PRODUCTS ====================

    async getProducts() {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }

        return data || [];
    },

    async getProduct(id) {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            return null;
        }

        return data;
    },

    async getProductsByCategory(category) {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', category)
            .eq('visibility', true);

        if (error) {
            console.error('Error fetching products by category:', error);
            return [];
        }

        return data || [];
    },

    async searchProducts(query) {
        const products = await this.getProducts();
        const searchTerm = query.toLowerCase();

        return products.filter(p => {
            if (!p.visibility) return false;
            const searchIn = `${p.name} ${p.description || ''} ${p.category || ''} ${p.subcategory || ''}`.toLowerCase();
            return searchIn.includes(searchTerm);
        });
    },

    async addProduct(product) {
        const { data, error } = await supabaseClient
            .from('products')
            .insert([product])
            .select()
            .single();

        if (error) {
            console.error('Error adding product:', error);
            throw error;
        }

        return data;
    },

    async updateProduct(id, updates) {
        const { data, error } = await supabaseClient
            .from('products')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            throw error;
        }

        return data;
    },

    async deleteProduct(id) {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            throw error;
        }

        return true;
    },

    // ==================== ORDERS ====================

    async getOrders() {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }

        return data || [];
    },

    async addOrder(order) {
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([order])
            .select()
            .single();

        if (error) {
            console.error('Error adding order:', error);
            throw error;
        }

        return data;
    },

    async updateOrderStatus(id, status) {
        const { data, error } = await supabaseClient
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating order status:', error);
            throw error;
        }

        return data;
    },

    // ==================== HOME SETTINGS ====================

    async getHomeSettings() {
        const { data, error } = await supabaseClient
            .from('home_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching home settings:', error);
            // Return default settings if none exist
            return {
                hot_week: [],
                new_arrivals: [],
                most_sold: [],
                explore_products: [],
                dont_miss: {
                    title: 'Enhance Your Music Experience',
                    subtitle: "Don't Miss!!",
                    bgImage: 'assets/images/product/poster/poster-03.png',
                    link: 'shop.html'
                }
            };
        }

        return data;
    },

    async saveHomeSettings(settings) {
        const { data, error } = await supabaseClient
            .from('home_settings')
            .upsert({
                id: 1,
                ...settings,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving home settings:', error);
            throw error;
        }

        return data;
    },

    // ==================== ADMINS ====================

    async getAdmins() {
        const { data, error } = await supabaseClient
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admins:', error);
            return [];
        }

        return data || [];
    },

    async deleteAdmin(id) {
        const { error } = await supabaseClient
            .from('admins')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting admin:', error);
            throw error;
        }

        return true;
    },

    // ==================== REAL-TIME LISTENERS ====================

    subscribeToProducts(callback) {
        return supabaseClient
            .channel('products-channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                (payload) => callback(payload)
            )
            .subscribe();
    },

    subscribeToOrders(callback) {
        return supabaseClient
            .channel('orders-channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => callback(payload)
            )
            .subscribe();
    },

    unsubscribe(channel) {
        supabaseClient.removeChannel(channel);
    }
};

// Export
window.SupabaseDB = SupabaseDB;
