// Code Studio Dashboard - Complete JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard initializing...');
  
  // Initialize all functionality
  setupMobileMenu();
  setupThemeSwitching();
  setupFilterFunctionality();
  setupNavigation();
  setupModalHandling();
  
  // Load initial data
  loadDashboardData();
  
  // Set up real-time updates
  setupRealTimeUpdates();
  
  console.log('Dashboard initialized successfully');
});

// Mobile menu functionality
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  const appContent = document.querySelector('.app-content');
  
  console.log('Setting up mobile menu...');
  console.log('Mobile toggle:', mobileMenuToggle);
  console.log('Sidebar:', sidebar);
  
  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', function() {
      console.log('Mobile menu toggle clicked');
      sidebar.classList.toggle('mobile-open');
      appContent.classList.toggle('sidebar-open');
    });
    
    // Close mobile menu when clicking outside
    appContent.addEventListener('click', function() {
      if (sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        appContent.classList.remove('sidebar-open');
      }
    });
  } else {
    console.error('Mobile menu elements not found');
  }
}

// Navigation functionality
function setupNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar-list-item');
  
  sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      if (section) {
        showSection(section);
        
        // Update active state
        sidebarItems.forEach(si => si.classList.remove('active'));
        this.classList.add('active');
        
        // Close mobile menu on navigation
        const sidebar = document.querySelector('.sidebar');
        const appContent = document.querySelector('.app-content');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
          appContent.classList.remove('sidebar-open');
        }
      }
    });
  });
  
  // Set home as active by default
  const homeItem = document.querySelector('[data-section="home"]');
  if (homeItem) {
    homeItem.classList.add('active');
  }
}

// Show section function
function showSection(sectionName) {
  console.log('Showing section:', sectionName);
  
  // Hide all sections
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(section => {
    section.style.display = 'none';
  });
  
  // Show requested section
  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.style.display = 'block';
    
    // Load section-specific data
    switch(sectionName) {
      case 'home':
        loadDashboardData();
        break;
      case 'product':
        loadProducts();
        break;
      case 'listings':
        loadOrders();
        break;
      case 'clients':
        loadClients();
        break;
      case 'account':
        loadProfile();
        break;
      case 'inbox':
        loadMessages();
        break;
      case 'insights':
        loadInsights();
        break;
    }
  } else {
    console.error('Section not found:', sectionName);
  }
}

// Load dashboard data
async function loadDashboardData() {
  console.log('Loading dashboard data...');
  
  try {
    // Load products, orders, and customers in parallel
    const [productsResponse, ordersResponse, customersResponse] = await Promise.allSettled([
      fetch('/api/products.php'),
      fetch('/api/orders.php'),
      fetch('/api/customers.php')
    ]);
    
    let products = [];
    let orders = [];
    let customers = [];
    
    // Handle products
    if (productsResponse.status === 'fulfilled' && productsResponse.value.ok) {
      const productsData = await productsResponse.value.json();
      products = productsData.products || [];
      console.log('Products loaded:', products.length);
    } else {
      console.warn('Failed to load products:', productsResponse);
    }
    
    // Handle orders
    if (ordersResponse.status === 'fulfilled' && ordersResponse.value.ok) {
      const ordersData = await ordersResponse.value.json();
      orders = ordersData.orders || [];
      console.log('Orders loaded:', orders.length);
    } else {
      console.warn('Failed to load orders:', ordersResponse);
    }
    
    // Handle customers
    if (customersResponse.status === 'fulfilled' && customersResponse.value.ok) {
      const customersData = await customersResponse.value.json();
      customers = customersData.customers || [];
      console.log('Customers loaded:', customers.length);
    } else {
      console.warn('Failed to load customers:', customersResponse);
    }
    
    // Update dashboard stats
    updateDashboardStats(products, orders, customers);
    
    // Update recent activity
    updateRecentActivity(products, orders, customers);
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Show fallback data
    updateDashboardStats([], [], []);
    updateRecentActivity([], [], []);
  }
}

// Update dashboard statistics with real-time data
function updateDashboardStats(products = [], orders = [], customers = []) {
  console.log('Updating dashboard stats:', { products: products.length, orders: orders.length, customers: customers.length });
  
  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => {
    const orderTotal = parseFloat(order.total || 0);
    return sum + (isNaN(orderTotal) ? 0 : orderTotal);
  }, 0);
  
  const totalOrders = orders.length;
  const activeCustomers = customers.length;
  const totalProducts = products.length;
  
  console.log('Calculated stats:', { totalRevenue, totalOrders, activeCustomers, totalProducts });
  
  // Calculate weekly changes (mock implementation for now)
  const revenueChange = calculateWeeklyChange(totalRevenue, 'revenue');
  const ordersChange = calculateWeeklyChange(totalOrders, 'orders');
  const customersChange = calculateWeeklyChange(activeCustomers, 'customers');
  const productsChange = calculateWeeklyChange(totalProducts, 'products');
  
  // Update DOM elements
  updateElement('totalRevenue', `$${totalRevenue.toFixed(2)}`);
  updateElement('totalOrders', totalOrders.toString());
  updateElement('activeCustomers', activeCustomers.toString());
  updateElement('totalProducts', totalProducts.toString());
  
  // Update change indicators
  updateChangeIndicator('revenueChange', revenueChange);
  updateChangeIndicator('ordersChange', ordersChange);
  updateChangeIndicator('customersChange', customersChange);
  updateChangeIndicator('productsChange', productsChange);
}

// Helper function to update DOM elements safely
function updateElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  } else {
    console.warn('Element not found:', elementId);
  }
}

// Calculate weekly change (mock implementation)
function calculateWeeklyChange(currentValue, type) {
  // This is a mock calculation - you can implement real weekly comparison
  const mockChange = Math.random() * 20 - 10; // Random change between -10% and +10%
  return mockChange.toFixed(1);
}

// Update change indicator with proper styling
function updateChangeIndicator(elementId, change) {
  const element = document.getElementById(elementId);
  if (element) {
    const changeValue = parseFloat(change);
    element.textContent = `${changeValue >= 0 ? '+' : ''}${change}%`;
    element.className = 'stat-change';
    
    if (changeValue > 0) {
      element.classList.add('positive');
    } else if (changeValue < 0) {
      element.classList.add('negative');
    } else {
      element.classList.add('neutral');
    }
  }
}

// Update recent activity with real-time data
function updateRecentActivity(products = [], orders = [], customers = []) {
  console.log('Updating recent activity...');
  
  const activityList = document.getElementById('activityList');
  if (!activityList) {
    console.warn('Activity list not found');
    return;
  }
  
  // Create activity items from recent data
  const activities = [];
  
  // Add recent orders (last 5)
  orders.slice(0, 5).forEach(order => {
    activities.push({
      type: 'order',
      message: `New order received for ${order.products || 'products'}`,
      time: formatTimeAgo(order.created_at || new Date()),
      icon: 'shopping-bag'
    });
  });
  
  // Add recent product changes (last 3)
  products.slice(0, 3).forEach(product => {
    activities.push({
      type: 'product',
      message: `Product added: ${product.name}`,
      time: formatTimeAgo(product.created_at || new Date()),
      icon: 'box'
    });
  });
  
  // Add recent customer registrations (last 3)
  customers.slice(0, 3).forEach(customer => {
    activities.push({
      type: 'customer',
      message: `New customer registered: ${customer.email}`,
      time: formatTimeAgo(customer.created_at || new Date()),
      icon: 'user'
    });
  });
  
  // Sort activities by time (most recent first)
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  // Render activities
  if (activities.length === 0) {
    activityList.innerHTML = `
      <div class="no-activity">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 1-1.73z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <h3>No activity yet</h3>
        <p>Recent activities will appear here</p>
      </div>
    `;
  } else {
    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${getActivityIcon(activity.icon)}
          </svg>
        </div>
        <div class="activity-content">
          <p><strong>${activity.message}</strong></p>
          <span class="activity-time">${activity.time}</span>
        </div>
      </div>
    `).join('');
  }
}

// Get activity icon SVG
function getActivityIcon(iconType) {
  const icons = {
    'shopping-bag': '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    'box': '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 1-1.73z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  return icons[iconType] || icons.user;
}

// Format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return past.toLocaleDateString();
}

// Load clients data
async function loadClients() {
  console.log('Loading clients...');
  
  try {
    const response = await fetch('/api/customers.php');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const customers = data.customers || [];
    
    console.log('Clients loaded:', customers.length);
    renderClients(customers);
  } catch (error) {
    console.error('Error loading clients:', error);
    renderClients([]);
  }
}

// Render clients table
function renderClients(customers) {
  console.log('Rendering clients:', customers.length);
  
  const clientsArea = document.querySelector('.clients-area-wrapper');
  const noClients = document.querySelector('.no-clients');
  
  if (!clientsArea) {
    console.error('Clients area not found');
    return;
  }
  
  if (customers.length === 0) {
    if (noClients) noClients.style.display = 'block';
    return;
  }
  
  if (noClients) noClients.style.display = 'none';
  
  // Clear existing content
  const existingRows = clientsArea.querySelectorAll('.client-row');
  existingRows.forEach(row => row.remove());
  
  // Add client rows
  customers.forEach(customer => {
    const clientRow = document.createElement('div');
    clientRow.className = 'client-row';
    clientRow.innerHTML = `
      <div class="client-cell">
        <div class="client-info">
          <div class="client-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="client-details">
            <strong>${customer.firstName || 'N/A'} ${customer.lastName || 'N/A'}</strong>
            <span class="client-id">#${customer.id || 'N/A'}</span>
          </div>
        </div>
      </div>
      <div class="client-cell">
        <div class="contact-info">
          <div>${customer.email || 'N/A'}</div>
          <div>${customer.phone || 'N/A'}</div>
        </div>
      </div>
      <div class="client-cell">
        <div class="address-info">
          ${customer.address || 'N/A'}
        </div>
      </div>
      <div class="client-cell">
        <div class="registration-date">
          ${formatDate(customer.created_at || new Date())}
        </div>
      </div>
      <div class="client-cell">
        <div class="orders-count">
          ${customer.orders_count || 0}
        </div>
      </div>
      <div class="client-cell">
        <div class="total-spent">
          $${(customer.total_spent || 0).toFixed(2)}
        </div>
      </div>
      <div class="client-cell">
        <div class="client-actions">
          <button class="btn-edit" onclick="editClient(${customer.id})" title="Edit Client">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-message" onclick="messageClient(${customer.id})" title="Send Message">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button class="btn-delete" onclick="deleteClient(${customer.id})" title="Delete Client">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    clientsArea.appendChild(clientRow);
  });
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Client management functions
function editClient(clientId) {
  console.log('Edit client:', clientId);
  showNotification('Edit client functionality will be implemented here', 'info');
}

function messageClient(clientId) {
  console.log('Message client:', clientId);
  showNotification('Message client functionality will be implemented here', 'info');
}

function deleteClient(clientId) {
  if (confirm('Are you sure you want to delete this client?')) {
    console.log('Delete client:', clientId);
    showNotification('Delete client functionality will be implemented here', 'info');
  }
}

function exportClients() {
  console.log('Export clients');
  showNotification('Export clients functionality will be implemented here', 'info');
}

// Set up real-time updates
function setupRealTimeUpdates() {
  console.log('Setting up real-time updates...');
  
  // Update dashboard every 30 seconds
  setInterval(() => {
    if (document.getElementById('section-home') && 
        document.getElementById('section-home').style.display !== 'none') {
      loadDashboardData();
    }
  }, 30000);
  
  // Update activity feed every minute
  setInterval(() => {
    if (document.getElementById('section-home') && 
        document.getElementById('section-home').style.display !== 'none') {
      loadDashboardData();
    }
  }, 60000);
}

// Load other sections
function loadProducts() {
  console.log('Loading products...');
  // Products are loaded in the existing code
}

function loadOrders() {
  console.log('Loading orders...');
  // Orders are loaded in the existing code
}

function loadProfile() {
  console.log('Loading profile...');
  // Profile loading logic
}

function loadMessages() {
  console.log('Loading messages...');
  // Messages loading logic
}

function loadInsights() {
  console.log('Loading insights...');
  // Insights loading logic
}

// Theme switching functionality
function setupThemeSwitching() {
  const modeSwitches = document.querySelectorAll('.mode-switch');
  
  modeSwitches.forEach(modeSwitch => {
    modeSwitch.addEventListener('click', function () {
      document.documentElement.classList.toggle('light');
      // Update all mode switches to show active state
      modeSwitches.forEach(ms => ms.classList.toggle('active'));
      
      // Update dashboard stats after theme change
      loadDashboardData();
    });
  });
  
  // Initialize theme state
  const isLightTheme = document.documentElement.classList.contains('light');
  modeSwitches.forEach(ms => {
    if (isLightTheme) ms.classList.add('active');
    else ms.classList.remove('active');
  });
}

// Filter functionality
function setupFilterFunctionality() {
  const filterButtons = document.querySelectorAll('.jsFilter');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      const filterMenu = this.nextElementSibling;
      if (filterMenu && filterMenu.classList.contains('filter-menu')) {
        filterMenu.classList.toggle('active');
      }
    });
  });
  
  // Close filter menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.filter-button-wrapper')) {
      document.querySelectorAll('.filter-menu').forEach(menu => {
        menu.classList.remove('active');
      });
    }
  });
  
  // Filter apply and reset functionality
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('filter-button')) {
      if (e.target.classList.contains('apply')) {
        // Apply filters
        const filterMenu = e.target.closest('.filter-menu');
        const statusFilter = filterMenu.querySelector('select');
        if (statusFilter) {
          const status = statusFilter.value.toLowerCase();
          const filteredOrders = filterOrdersByStatus(status);
          renderOrders(filteredOrders);
          // Update dashboard stats after applying filter
          loadDashboardData();
        }
        filterMenu.classList.remove('active');
      } else if (e.target.classList.contains('reset')) {
        // Reset filters
        const filterMenu = e.target.closest('.filter-menu');
        const selects = filterMenu.querySelectorAll('select');
        selects.forEach(select => {
          select.selectedIndex = 0;
        });
        renderOrders(); // Show all orders
        // Update dashboard stats after resetting filter
        loadDashboardData();
        filterMenu.classList.remove('active');
      }
    }
  });
}

// Modal handling
function setupModalHandling() {
  // Add Product Modal
  const addProductModal = document.getElementById('addProductModal');
  const openAddProductModal = document.getElementById('openAddProductModal');
  const closeAddProductModal = document.getElementById('closeAddProductModal');
  const cancelAddProduct = document.getElementById('cancelAddProduct');
  
  if (openAddProductModal && addProductModal) {
    openAddProductModal.addEventListener('click', function() {
      addProductModal.style.display = 'block';
    });
  }
  
  if (closeAddProductModal && addProductModal) {
    closeAddProductModal.addEventListener('click', function() {
      addProductModal.style.display = 'none';
    });
  }
  
  if (cancelAddProduct && addProductModal) {
    cancelAddProduct.addEventListener('click', function() {
      addProductModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside (only for Add Product modal)
  if (addProductModal) {
    addProductModal.addEventListener('click', function(e) {
      if (e.target === addProductModal) {
        // Don't close on outside click for Add Product modal
        // addProductModal.style.display = 'none';
      }
    });
  }
  
  // Handle form submission
  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleAddProduct();
    });
  }
}

// Handle adding new product
async function handleAddProduct() {
  console.log('Handling add product...');
  
  const form = document.getElementById('addProductForm');
  const formData = new FormData(form);
  
  try {
    const response = await fetch('/api/products.php', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // Close modal
        document.getElementById('addProductModal').style.display = 'none';
        
        // Reset form
        form.reset();
        
        // Refresh products
        if (document.getElementById('section-product') && 
            document.getElementById('section-product').style.display !== 'none') {
          loadProducts();
        }
        
        // Update dashboard stats
        loadDashboardData();
        
        // Show success message
        showNotification('Product added successfully!', 'success');
      } else {
        showNotification('Error adding product: ' + (result.message || 'Unknown error'), 'error');
      }
    } else {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      showNotification('Error adding product: HTTP ' + response.status, 'error');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showNotification('Error adding product: ' + error.message, 'error');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  console.log('Showing notification:', message, type);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    hideNotification(notification);
  }, 5000);
  
  // Close button functionality
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideNotification(notification);
    });
  }
}

// Hide notification
function hideNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Load products
async function loadProducts() {
  try {
    const response = await fetch('/api/products.php');
    const data = await response.json();
    const products = data.products || [];
    
    renderProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    renderProducts([]);
  }
}

// Render products
function renderProducts(products) {
  const productsArea = document.querySelector('.products-area-wrapper');
  if (!productsArea) return;
  
  // Clear existing products
  const existingRows = productsArea.querySelectorAll('.products-row');
  existingRows.forEach(row => row.remove());
  
  if (products.length === 0) {
    // Show no products message
    const noProducts = document.createElement('div');
    noProducts.className = 'no-products';
    noProducts.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 1-1.73z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <h3>No Products Yet</h3>
      <p>Add your first product to get started!</p>
    `;
    productsArea.appendChild(noProducts);
    return;
  }
  
  // Add product rows
  products.forEach(product => {
    const productRow = document.createElement('div');
    productRow.className = 'products-row';
    productRow.innerHTML = `
      <button class="cell-more-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      <div class="product-cell image">
        <img src="${product.image || 'https://via.placeholder.com/50x50'}" alt="${product.name}">
        <span>${product.name}</span>
      </div>
      <div class="product-cell category"><span class="cell-label">Category:</span>${product.category || 'N/A'}</div>
      <div class="product-cell status-cell">
        <span class="cell-label">Status:</span>
        <span class="status ${product.status === 'active' ? 'active' : 'disabled'}">${product.status || 'Active'}</span>
      </div>
      <div class="product-cell sales"><span class="cell-label">Sales:</span>${product.sales || 0}</div>
      <div class="product-cell stock"><span class="cell-label">Stock:</span>${product.quantity || 0}</div>
      <div class="product-cell price"><span class="cell-label">Price:</span>$${parseFloat(product.price || 0).toFixed(2)}</div>
    `;
    
    productsArea.appendChild(productRow);
  });
}

// Load orders
async function loadOrders() {
  try {
    const response = await fetch('/api/orders.php');
    const data = await response.json();
    const orders = data.orders || [];
    
    renderOrders(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
    renderOrders([]);
  }
}

// Render orders
function renderOrders(orders) {
  const ordersArea = document.querySelector('.orders-area-wrapper');
  const noOrders = document.querySelector('.no-orders');
  
  if (!ordersArea) return;
  
  if (orders.length === 0) {
    if (noOrders) noOrders.style.display = 'block';
    return;
  }
  
  if (noOrders) noOrders.style.display = 'none';
  
  // Clear existing orders
  const existingRows = ordersArea.querySelectorAll('.order-row');
  existingRows.forEach(row => row.remove());
  
  // Add order rows
  orders.forEach(order => {
    const orderRow = document.createElement('div');
    orderRow.className = 'order-row';
    orderRow.innerHTML = `
      <div class="order-cell">#${order.id}</div>
      <div class="order-cell">${order.customer_name || 'N/A'}</div>
      <div class="order-cell">${order.products || 'N/A'}</div>
      <div class="order-cell">$${parseFloat(order.total || 0).toFixed(2)}</div>
      <div class="order-cell">
        <span class="status ${order.status || 'pending'}">${order.status || 'Pending'}</span>
      </div>
      <div class="order-cell">${formatDate(order.created_at)}</div>
      <div class="order-cell">
        <button class="btn-edit" onclick="editOrder(${order.id})">Edit</button>
      </div>
    `;
    
    ordersArea.appendChild(orderRow);
  });
}

// Load profile
function loadProfile() {
  // Load user profile data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.firstName) {
    document.getElementById('profileFirstName').value = user.firstName;
  }
  if (user.lastName) {
    document.getElementById('profileLastName').value = user.lastName;
  }
  if (user.email) {
    document.getElementById('profileEmail').value = user.email;
  }
  if (user.phone) {
    document.getElementById('profilePhone').value = user.phone;
  }
}

// Load messages
function loadMessages() {
  // Messages are already in HTML
}

// Load insights
function loadInsights() {
  // Insights are already in HTML
}

// Edit order
function editOrder(orderId) {
  console.log('Edit order:', orderId);
  showNotification('Edit order functionality will be implemented here', 'info');
}

// Filter orders by status
function filterOrdersByStatus(status) {
  // This would filter orders based on status
  // For now, return all orders
  return [];
}

// Clear all data (for testing)
function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
}

// Grid/List view functionality
document.addEventListener('DOMContentLoaded', function() {
  const gridButton = document.querySelector(".grid");
  const listButton = document.querySelector(".list");
  const productsArea = document.querySelector(".products-area-wrapper");
  
  if (gridButton && listButton && productsArea) {
    gridButton.addEventListener("click", function () {
      listButton.classList.remove("active");
      gridButton.classList.add("active");
      productsArea.classList.add("gridView");
      productsArea.classList.remove("tableView");
    });

    listButton.addEventListener("click", function () {
      listButton.classList.add("active");
      gridButton.classList.remove("active");
      productsArea.classList.remove("gridView");
      productsArea.classList.add("tableView");
    });
  }
});