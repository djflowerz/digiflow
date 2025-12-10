/**
 * inventory-alerts.js
 * Inventory monitoring and alert system
 */

const InventoryAlerts = {
    async checkInventory() {
        try {
            const products = await SupabaseDB.getProducts();

            const outOfStock = products.filter(p => p.stock === 0);
            const lowStock = products.filter(p => {
                const threshold = p.low_stock_threshold || 10;
                return p.stock > 0 && p.stock <= threshold;
            });

            return {
                outOfStock,
                lowStock,
                total: products.length,
                healthy: products.length - outOfStock.length - lowStock.length
            };
        } catch (error) {
            console.error('Error checking inventory:', error);
            return null;
        }
    },

    async displayAlerts(containerId = 'inventoryAlerts') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const inventory = await this.checkInventory();
        if (!inventory) {
            container.innerHTML = '<div class="alert alert-danger">Error loading inventory data</div>';
            return;
        }

        let alertsHTML = '';

        // Out of stock alert
        if (inventory.outOfStock.length > 0) {
            alertsHTML += `
                <div class="alert alert-danger d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <div>
                        <strong>${inventory.outOfStock.length} products out of stock</strong>
                        <button class="btn btn-sm btn-link" onclick="InventoryAlerts.showDetails('outOfStock')">View</button>
                    </div>
                </div>
            `;
        }

        // Low stock alert
        if (inventory.lowStock.length > 0) {
            alertsHTML += `
                <div class="alert alert-warning d-flex align-items-center">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    <div>
                        <strong>${inventory.lowStock.length} products low on stock</strong>
                        <button class="btn btn-sm btn-link" onclick="InventoryAlerts.showDetails('lowStock')">View</button>
                    </div>
                </div>
            `;
        }

        // Healthy inventory
        if (inventory.outOfStock.length === 0 && inventory.lowStock.length === 0) {
            alertsHTML = `
                <div class="alert alert-success d-flex align-items-center">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>All products in stock</strong>
                </div>
            `;
        }

        container.innerHTML = alertsHTML;

        // Store inventory data for details view
        this.currentInventory = inventory;
    },

    showDetails(type) {
        const inventory = this.currentInventory;
        if (!inventory) return;

        const products = type === 'outOfStock' ? inventory.outOfStock : inventory.lowStock;
        const title = type === 'outOfStock' ? 'Out of Stock Products' : 'Low Stock Products';

        const modalHTML = `
            <div class="modal fade" id="inventoryModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Current Stock</th>
                                        <th>Threshold</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${products.map(p => `
                                        <tr>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <img src="${p.image}" alt="${p.name}" style="width: 40px; height: 40px; object-fit: cover;" class="me-2 rounded">
                                                    <span>${p.name}</span>
                                                </div>
                                            </td>
                                            <td>${p.category || 'N/A'}</td>
                                            <td>
                                                <span class="badge ${p.stock === 0 ? 'bg-danger' : 'bg-warning'}">${p.stock}</span>
                                            </td>
                                            <td>${p.low_stock_threshold || 10}</td>
                                            <td>
                                                <button class="btn btn-sm btn-primary" onclick="editProduct(${p.id})">
                                                    <i class="fas fa-edit"></i> Restock
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        document.getElementById('inventoryModal')?.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('inventoryModal'));
        modal.show();
    },

    // Get inventory badge count for sidebar
    async getBadgeCount() {
        const inventory = await this.checkInventory();
        if (!inventory) return 0;
        return inventory.outOfStock.length + inventory.lowStock.length;
    },

    // Update badge in UI
    async updateBadge(badgeId = 'inventoryBadge') {
        const badge = document.getElementById(badgeId);
        if (!badge) return;

        const count = await this.getBadgeCount();
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
};

// Make available globally
window.InventoryAlerts = InventoryAlerts;
