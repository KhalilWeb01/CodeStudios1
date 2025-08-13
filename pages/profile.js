// Profile Page JavaScript
class ProfileManager {
    constructor() {
        this.authUser = (window.Auth && Auth.getCurrentUser && Auth.getCurrentUser()) || null;
        if (!this.authUser) {
            // As a safeguard; profile.html also guards route
            try { Auth && Auth.requireAuth('login.html'); } catch {}
        }
        // Use global key 'cart' for a single shared cart across site
        this.storagePrefix = (key) => key === 'cart' ? 'cart' : (this.authUser ? `u:${this.authUser.id}:${key}` : key);

        this.currentUser = this.loadUserData();
        this.cart = this.loadCart();
        this.favorites = this.loadFavorites();
        this.orders = this.loadOrders();
        this.currentTab = 'personal';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserProfile();
        this.updateCartDisplay();
        this.loadOrdersList();
        this.loadFavoritesList();
        this.setupAnimations();
        // Initialize floating labels on first render
        this.setupFloatingLabels();
        // Sync orders with dashboard
        this.syncOrdersWithDashboard();
        // Clean up localStorage to prevent overflow
        this.cleanupLocalStorage();
    }

    cleanupLocalStorage() {
        try {
            // Check localStorage usage
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            
            // If localStorage is getting full (>4MB), clean up old data
            if (totalSize > 4000000) { // 4MB limit
                console.log('LocalStorage getting full, cleaning up old data...');
                this.clearOldOrders();
                
                // Also clear old cart items if cart is too large
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                if (cart.length > 50) {
                    localStorage.setItem('cart', JSON.stringify(cart.slice(0, 50)));
                }
            }
        } catch (error) {
            console.error('Error during localStorage cleanup:', error);
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Cart functionality
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                this.clearCart();
            });
        }

        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.checkout();
            });
        }

        // Profile actions
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.switchTab('personal');
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Avatar edit
        const avatarEdit = document.querySelector('.avatar-edit');
        if (avatarEdit) {
            avatarEdit.addEventListener('click', () => {
                this.editAvatar();
            });
        }

        // Settings
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.changePassword();
            });
        }

        // Bottom navigation
        const bottomCartLink = document.getElementById('bottomCartLink');
        if (bottomCartLink) {
            bottomCartLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab('cart');
            });
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Add active class to selected tab and pane
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        const activePane = document.getElementById(tabName);
        
        if (activeTab && activePane) {
            activeTab.classList.add('active');
            activePane.classList.add('active');
            this.currentTab = tabName;

            // Load content for specific tabs
            if (tabName === 'cart') {
                this.loadCartItems();
            } else if (tabName === 'orders') {
                this.loadOrdersList();
            } else if (tabName === 'favorites') {
                this.loadFavoritesList();
            }
        }
    }

    loadUserProfile() {
        if (this.currentUser) {
            const displayName = this.currentUser.name || (this.authUser && this.authUser.name) || 'User';
            const displayEmail = (this.authUser && this.authUser.email) || this.currentUser.email || '';
            document.getElementById('userName').textContent = displayName;
            document.getElementById('userEmail').textContent = displayEmail;

            // Derive stats from orders if not present
            const orderCount = (this.orders && this.orders.length) || this.currentUser.orderCount || 0;
            const totalSpent = this.orders ? this.orders.reduce((s, o) => s + (o.total || 0), 0) : (this.currentUser.totalSpent || 0);
            const loyaltyPoints = this.currentUser.loyaltyPoints != null ? this.currentUser.loyaltyPoints : Math.floor(totalSpent / 100);

            this.currentUser.orderCount = orderCount;
            this.currentUser.totalSpent = totalSpent;
            this.currentUser.loyaltyPoints = loyaltyPoints;

            document.getElementById('orderCount').textContent = orderCount;
            document.getElementById('totalSpent').textContent = this.formatPrice(totalSpent);
            document.getElementById('loyaltyPoints').textContent = loyaltyPoints;

            // Fill form fields
            if (this.currentUser.firstName) {
                document.getElementById('firstName').value = this.currentUser.firstName;
            }
            if (this.currentUser.lastName) {
                document.getElementById('lastName').value = this.currentUser.lastName;
            }
            document.getElementById('email').value = displayEmail;
            if (this.currentUser.phone) {
                document.getElementById('phone').value = this.currentUser.phone;
            }
            if (this.currentUser.birthDate) {
                document.getElementById('birthDate').value = this.currentUser.birthDate;
            }
            if (this.currentUser.address) {
                document.getElementById('address').value = this.currentUser.address;
            }
        }
    }

    saveProfile() {
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            birthDate: document.getElementById('birthDate').value,
            address: document.getElementById('address').value
        };

        // Update user data
        this.currentUser = { ...this.currentUser, ...formData };
        this.currentUser.name = `${formData.firstName} ${formData.lastName}`;
        
        // Save to localStorage (namespaced)
        this.saveUserData();
        
        // Update display
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userEmail').textContent = this.currentUser.email;

        // Sync to backend customers API
        const API_BASE = '../api';
        const payload = {
            id: this.authUser && this.authUser.id ? this.authUser.id : undefined,
            email: (this.currentUser.email || formData.email || '').trim().toLowerCase(),
            name: this.currentUser.name,
            phone: this.currentUser.phone || formData.phone || '',
            address: this.currentUser.address || formData.address || ''
        };
        fetch(`${API_BASE}/customers.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(() => {
            this.showNotification('Профиль успешно обновлен!', 'success');
        }).catch(() => {
            this.showNotification('Профиль сохранён локально. Ошибка синхронизации с сервером.', 'warning');
        });
    }

    setupFloatingLabels() {
        const fields = Array.from(document.querySelectorAll('.profile-form .form-group'));
        const mark = (input) => {
            const group = input.closest('.form-group');
            if (!group) return;
            if (input.value && input.value.trim() !== '') group.classList.add('has-value');
            else group.classList.remove('has-value');
        };
        fields.forEach(group => {
            const input = group.querySelector('input, textarea');
            if (!input) return;
            // initial state
            mark(input);
            input.addEventListener('focus', () => group.classList.add('focused'));
            input.addEventListener('blur', () => {
                group.classList.remove('focused');
                mark(input);
            });
            input.addEventListener('input', () => mark(input));
        });
    }

    loadCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h4>Корзина пуста</h4>
                    <p>Добавьте товары в корзину для покупки</p>
                    <a href="../index.html" class="btn btn-primary">
                        <i class="fas fa-shopping-bag"></i>
                        Перейти к покупкам
                    </a>
                </div>
            `;
            cartSummary.style.display = 'none';
            return;
        }

        cartSummary.style.display = 'block';
        
        let totalPrice = 0;
        let totalItems = 0;

        const cartHTML = this.cart.map(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            totalItems += item.quantity;

            return `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="profileManager.updateQuantity('${item.id}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="profileManager.updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="profileManager.removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');

        cartItemsContainer.innerHTML = cartHTML;

        // Update summary
        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalPrice').textContent = this.formatPrice(totalPrice);
        
        // Update cart badge
        this.updateCartBadge();
    }

    updateQuantity(itemId, change) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                this.saveCart();
                this.loadCartItems();
            }
        }
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.loadCartItems();
        this.updateCartDisplay();
    }

    clearCart() {
        if (confirm('Вы уверены, что хотите очистить корзину?')) {
            this.cart = [];
            this.saveCart();
            this.loadCartItems();
            this.updateCartDisplay();
            this.showNotification('Корзина очищена', 'info');
        }
    }

    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Корзина пуста', 'warning');
            return;
        }

        // Get customer info from profile
        const customerInfo = {
            name: `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() || 'Anonymous',
            email: this.currentUser.email || '',
            phone: this.currentUser.phone || ''
        };

        // Create order for dashboard (simplified structure)
        const dashboardOrder = {
            id: `#ORD-${Date.now()}`,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            products: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
                // Removed image to reduce size
            })),
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        // Create order for user profile (simplified)
        const order = {
            id: Date.now(),
            items: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
                // Removed image to reduce size
            })),
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            date: new Date().toISOString(),
            status: 'pending'
        };

        try {
            // Send order to backend
            fetch('../api/orders.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dashboardOrder)
            }).then(() => {
                // Save to profileOrders for sync (limited to 20)
                const profileOrders = JSON.parse(localStorage.getItem('profileOrders') || '[]');
                profileOrders.unshift(dashboardOrder);
                if (profileOrders.length > 20) {
                    profileOrders.splice(20);
                }
                localStorage.setItem('profileOrders', JSON.stringify(profileOrders));
                
                // Save to user profile (limited to 20)
                this.orders.unshift(order);
                if (this.orders.length > 20) {
                    this.orders.splice(20);
                }
                this.saveOrders();

                // Redirect to Stripe Checkout
                fetch('../api/payments/stripe_create_checkout.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: dashboardOrder.id })
                }).then(r => r.json()).then(j => {
                    if (j && j.url) {
                        window.location.href = j.url;
                    } else {
                        this.showNotification('Ошибка инициализации оплаты', 'error');
                    }
                }).catch(() => this.showNotification('Ошибка инициализации оплаты', 'error'));
            }).catch(() => {
                // fallback to local storage only
                const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                existingOrders.unshift(dashboardOrder);
                if (existingOrders.length > 50) {
                    existingOrders.splice(50);
                }
                localStorage.setItem('orders', JSON.stringify(existingOrders));
            });
            
        } catch (error) {
            console.error('Error saving order:', error);
            // If localStorage is full, try to clear old data
            this.clearOldOrders();
            
            // Try to save again with minimal data
            try {
                const minimalOrder = {
                    id: order.id,
                    total: order.total,
                    date: order.date,
                    status: order.status
                };
                this.orders.unshift(minimalOrder);
                if (this.orders.length > 10) {
                    this.orders.splice(10);
                }
                this.saveOrders();
            } catch (retryError) {
                console.error('Failed to save order even after cleanup:', retryError);
                this.showNotification('Ошибка сохранения заказа. Попробуйте позже.', 'error');
                return;
            }
        }

        // Clear cart
        this.cart = [];
        this.saveCart();
        this.loadCartItems();
        this.updateCartDisplay();

        // Update user stats
        this.currentUser.orderCount = (this.currentUser.orderCount || 0) + 1;
        this.currentUser.totalSpent = (this.currentUser.totalSpent || 0) + order.total;
        this.currentUser.loyaltyPoints = (this.currentUser.loyaltyPoints || 0) + Math.floor(order.total / 100);
        this.saveUserData();

        // Switch to orders tab
        this.switchTab('orders');
        this.showNotification('Заказ успешно оформлен! Статус: Pending', 'success');
    }

    clearOldOrders() {
        try {
            // Clear old orders from localStorage
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const profileOrders = JSON.parse(localStorage.getItem('profileOrders') || '[]');
            
            // Keep only last 20 orders
            if (orders.length > 20) {
                localStorage.setItem('orders', JSON.stringify(orders.slice(0, 20)));
            }
            if (profileOrders.length > 20) {
                localStorage.setItem('profileOrders', JSON.stringify(profileOrders.slice(0, 20)));
            }
            
            // Clear old user orders
            if (this.orders.length > 20) {
                this.orders = this.orders.slice(0, 20);
                this.saveOrders();
            }
            
            console.log('Old orders cleared to prevent localStorage overflow');
        } catch (error) {
            console.error('Error clearing old orders:', error);
        }
    }

    loadOrdersList() {
        // Sync orders with dashboard
        this.syncOrdersWithDashboard();
        
        const ordersContainer = document.getElementById('ordersList');
        
        if (this.orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h4>Заказов пока нет</h4>
                    <p>Сделайте свой первый заказ</p>
                    <a href="../index.html" class="btn btn-primary">
                        <i class="fas fa-shopping-bag"></i>
                        Перейти к покупкам
                    </a>
                </div>
            `;
            return;
        }

        const ordersHTML = this.orders.map(order => {
            const statusClass = this.getStatusClass(order.status);
            const statusText = this.getStatusText(order.status);
            const date = new Date(order.date).toLocaleDateString('ru-RU');

            // Handle both old and new order formats
            const items = order.items || [];
            const orderTotal = order.total || 0;

            return `
                <div class="order-item">
                    <div class="order-header">
                        <div>
                            <div class="order-number">Заказ #${order.id}</div>
                            <div class="order-date">${date}</div>
                        </div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-items">
                        ${items.length > 0 ? items.map(item => `
                            <div class="order-item-detail">
                                <span>${item.name || 'Товар'} x${item.quantity || 1}</span>
                                <span>${this.formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                            </div>
                        `).join('') : '<div class="order-item-detail">Детали заказа недоступны</div>'}
                    </div>
                    <div class="order-total">
                        Итого: ${this.formatPrice(orderTotal)}
                    </div>
                </div>
            `;
        }).join('');

        ordersContainer.innerHTML = ordersHTML;
    }

    syncOrdersWithDashboard() {
        try {
            const profileOrders = JSON.parse(localStorage.getItem('profileOrders') || '[]');
            const currentUserEmail = this.currentUser.email;
            
            if (currentUserEmail && profileOrders.length > 0) {
                // Find orders for current user
                const userOrders = profileOrders.filter(order => 
                    order.customerEmail === currentUserEmail
                );
                
                // Update local orders with dashboard statuses
                userOrders.forEach(dashboardOrder => {
                    const localOrderIndex = this.orders.findIndex(lo => 
                        lo.date === dashboardOrder.date && 
                        lo.total === dashboardOrder.total
                    );
                    
                    if (localOrderIndex !== -1) {
                        this.orders[localOrderIndex].status = dashboardOrder.status;
                        if (dashboardOrder.lastUpdated) {
                            this.orders[localOrderIndex].lastUpdated = dashboardOrder.lastUpdated;
                        }
                    }
                });
                
                // Save updated orders
                this.saveOrders();
            }
        } catch (error) {
            console.error('Error syncing orders with dashboard:', error);
        }
    }

    loadFavoritesList() {
        const favoritesContainer = document.getElementById('favoritesGrid');
        
        if (this.favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h4>Избранное пусто</h4>
                    <p>Добавьте товары в избранное</p>
                    <a href="../index.html" class="btn btn-primary">
                        <i class="fas fa-shopping-bag"></i>
                        Перейти к покупкам
                    </a>
                </div>
            `;
            return;
        }

        const favoritesHTML = this.favorites.map(item => `
            <div class="favorite-item">
                <img src="${item.image}" alt="${item.name}" class="favorite-item-image">
                <div class="favorite-item-details">
                    <div class="favorite-item-name">${item.name}</div>
                    <div class="favorite-item-price">${this.formatPrice(item.price)}</div>
                    <div class="favorite-item-actions">
                        <button class="btn btn-primary" onclick="profileManager.addToCart('${item.id}')">
                            <i class="fas fa-shopping-cart"></i>
                            В корзину
                        </button>
                        <button class="btn btn-secondary" onclick="profileManager.removeFromFavorites('${item.id}')">
                            <i class="fas fa-heart-broken"></i>
                            Удалить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        favoritesContainer.innerHTML = favoritesHTML;
    }

    addToCart(itemId) {
        const item = this.favorites.find(item => item.id === itemId);
        if (item) {
            const existingItem = this.cart.find(cartItem => cartItem.id === itemId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.cart.push({ ...item, quantity: 1 });
            }
            this.saveCart();
            this.updateCartDisplay();
            this.showNotification('Товар добавлен в корзину', 'success');
        }
    }

    removeFromFavorites(itemId) {
        this.favorites = this.favorites.filter(item => item.id !== itemId);
        this.saveFavorites();
        this.loadFavoritesList();
        this.showNotification('Товар удален из избранного', 'info');
    }

    updateCartDisplay() {
        const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById('cartCount');
        const cartBadgeElement = document.getElementById('cartBadge');
        
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }
        if (cartBadgeElement) {
            cartBadgeElement.textContent = cartCount;
        }
    }

    updateCartBadge() {
        const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadgeElement = document.getElementById('cartBadge');
        if (cartBadgeElement) {
            cartBadgeElement.textContent = cartCount;
        }
    }

    editAvatar() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('userAvatar').src = e.target.result;
                    this.showNotification('Аватар обновлен', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    changePassword() {
        const newPassword = prompt('Введите новый пароль:');
        if (newPassword) {
            const confirmPassword = prompt('Подтвердите новый пароль:');
            if (newPassword === confirmPassword) {
                this.currentUser.password = newPassword;
                this.saveUserData();
                this.showNotification('Пароль изменен', 'success');
            } else {
                this.showNotification('Пароли не совпадают', 'error');
            }
        }
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            try { Auth && Auth.signOut && Auth.signOut(); } catch {}
            window.location.href = 'login.html';
        }
    }

    getStatusClass(status) {
        const statusMap = {
            'pending': 'pending',
            'processing': 'processing',
            'shipped': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
            'completed': 'delivered' // Legacy support
        };
        return statusMap[status] || 'pending';
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Ожидает',
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен',
            'completed': 'Доставлен' // Legacy support
        };
        return statusMap[status] || 'Ожидает';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-from-top, .animate-from-left, .animate-from-right').forEach(el => {
            observer.observe(el);
        });
    }

    // Data persistence methods
    loadUserData() {
        // Try namespaced profile
        const key = this.storagePrefix('profile');
        const raw = localStorage.getItem(key);
        if (raw) {
            try { return JSON.parse(raw); } catch {}
        }
        // Migrate legacy 'userData'
        const legacy = localStorage.getItem('userData');
        if (legacy) {
            localStorage.setItem(key, legacy);
            return JSON.parse(legacy);
        }
        // Default from Auth user
        const fallbackName = (this.authUser && this.authUser.name) || 'User';
        const fallbackEmail = (this.authUser && this.authUser.email) || '';
        const profile = {
            name: fallbackName,
            email: fallbackEmail,
            firstName: fallbackName.split(' ')[0] || '',
            lastName: fallbackName.split(' ').slice(1).join(' ') || '',
            phone: '',
            birthDate: '',
            address: '',
            orderCount: 0,
            totalSpent: 0,
            loyaltyPoints: 0
        };
        localStorage.setItem(key, JSON.stringify(profile));
        return profile;
    }

    saveUserData() {
        const key = this.storagePrefix('profile');
        localStorage.setItem(key, JSON.stringify(this.currentUser));
    }

    loadCart() {
        // Read from the single global cart
        const raw = localStorage.getItem('cart');
        if (raw) { try { return JSON.parse(raw); } catch {} }
        return [];
    }

    saveCart() {
        // Persist to the single global cart so all pages see the same data
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    loadFavorites() {
        const key = this.storagePrefix('favorites');
        const raw = localStorage.getItem(key);
        if (raw) { try { return JSON.parse(raw); } catch {} }
        const legacy = localStorage.getItem('favorites');
        if (legacy) {
            localStorage.setItem(key, legacy);
            return JSON.parse(legacy);
        }
        return [];
    }

    saveFavorites() {
        const key = this.storagePrefix('favorites');
        localStorage.setItem(key, JSON.stringify(this.favorites));
    }

    loadOrders() {
        const key = this.storagePrefix('orders');
        const raw = localStorage.getItem(key);
        if (raw) { try { return JSON.parse(raw); } catch {} }
        const legacy = localStorage.getItem('orders');
        if (legacy) {
            localStorage.setItem(key, legacy);
            return JSON.parse(legacy);
        }
        return [];
    }

    saveOrders() {
        const key = this.storagePrefix('orders');
        localStorage.setItem(key, JSON.stringify(this.orders));
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-family: 'Courier New', monospace;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left: 4px solid #28a745;
        color: #155724;
    }

    .notification-error {
        border-left: 4px solid #dc3545;
        color: #721c24;
    }

    .notification-warning {
        border-left: 4px solid #ffc107;
        color: #856404;
    }

    .notification-info {
        border-left: 4px solid #17a2b8;
        color: #0c5460;
    }

    .notification i {
        font-size: 1.2rem;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet); 