document.addEventListener('DOMContentLoaded', function() {
  const burger = document.getElementById('burgerMenu');
  const sidebar = document.querySelector('.sidebar');
  if (burger && sidebar) {
    burger.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }
});

// Filter functionality is now handled by setupFilterFunctionality()

document.querySelector(".grid").addEventListener("click", function () {
  document.querySelector(".list").classList.remove("active");
  document.querySelector(".grid").classList.add("active");
  document.querySelector(".products-area-wrapper").classList.add("gridView");
  document
    .querySelector(".products-area-wrapper")
    .classList.remove("tableView");
});

document.querySelector(".list").addEventListener("click", function () {
  document.querySelector(".list").classList.add("active");
  document.querySelector(".grid").classList.remove("active");
  document.querySelector(".products-area-wrapper").classList.remove("gridView");
  document.querySelector(".products-area-wrapper").classList.add("tableView");
});

// Theme switching functionality
function setupThemeSwitching() {
  const modeSwitches = document.querySelectorAll('.mode-switch');
  
  modeSwitches.forEach(modeSwitch => {
    modeSwitch.addEventListener('click', function () {
      document.documentElement.classList.toggle('light');
      // Update all mode switches to show active state
      modeSwitches.forEach(ms => ms.classList.toggle('active'));
      
      // Update dashboard stats after theme change
      updateDashboardStats();
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
          updateDashboardStats();
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
        updateDashboardStats();
        filterMenu.classList.remove('active');
      }
    }
  });
}

// SPA logic for sidebar
function hideAllSections() {
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.style.display = 'none';
  });
}

function showSection(sectionName) {
  hideAllSections();
  const sectionDiv = document.getElementById('section-' + sectionName);
  if (sectionDiv) {
    sectionDiv.style.display = '';
    // Update active sidebar item
    setActiveSidebarItem(document.querySelector(`[data-section="${sectionName}"]`));
    
    // Update dashboard stats when switching sections
    updateDashboardStats();
  }
}

function setActiveSidebarItem(activeItem) {
  document.querySelectorAll('.sidebar-list-item').forEach(item => item.classList.remove('active'));
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

document.querySelectorAll('.sidebar-list-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const section = item.getAttribute('data-section');
    if (!section) return;
    showSection(section);
  });
});

// Show home by default
hideAllSections();
const homeSection = document.getElementById('section-home');
if (homeSection) homeSection.style.display = '';
// Profile logic
function getProfile() {
  const data = localStorage.getItem('userProfile');
  if (!data) return { firstName: '', lastName: '', email: '', phone: '' };
  return JSON.parse(data);
}
function setProfile(profile) {
  localStorage.setItem('userProfile', JSON.stringify(profile));
}
function updateProfileUI() {
  const { firstName, lastName, email, phone } = getProfile();
  document.getElementById('profileFirstName').value = firstName || '';
  document.getElementById('profileLastName').value = lastName || '';
  document.getElementById('profileEmail').value = email || '';
  document.getElementById('profilePhone').value = phone || '';
}
const profileForm = document.getElementById('profileForm');
if (profileForm) {
  updateProfileUI();
  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const firstName = document.getElementById('profileFirstName').value.trim();
    const lastName = document.getElementById('profileLastName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    setProfile({ firstName, lastName, email, phone });
    updateProfileUI();
    
    // Update dashboard stats after profile update
    updateDashboardStats();
    
    const msg = document.getElementById('profileSaveMsg');
    if (msg) {
      msg.style.display = 'inline';
      setTimeout(() => { msg.style.display = 'none'; }, 2000);
    }
  });
}

// --- Enhanced Add Product Modal Logic ---
const openAddProductModalBtn = document.getElementById('openAddProductModal');
const addProductModal = document.getElementById('addProductModal');
const closeAddProductModalBtn = document.getElementById('closeAddProductModal');
const cancelAddProductBtn = document.getElementById('cancelAddProduct');
const fileUploadArea = document.getElementById('fileUploadArea');
const uploadedFiles = document.getElementById('uploadedFiles');

if (openAddProductModalBtn && addProductModal && closeAddProductModalBtn) {
  openAddProductModalBtn.addEventListener('click', () => {
    addProductModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  });
  
  closeAddProductModalBtn.addEventListener('click', closeModal);
  cancelAddProductBtn.addEventListener('click', closeModal);
  
  // Disable closing by clicking outside or pressing Escape to prevent accidental dismiss
}

function closeModal() {
  addProductModal.style.display = 'none';
  document.body.style.overflow = ''; // Restore scrolling
  resetForm();
}

function resetForm() {
  document.getElementById('addProductForm').reset();
  uploadedFiles.innerHTML = '';
  resetStars();
  
  // Restore original submit button text
  const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 12l2 2 4-4"/>
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
      </svg>
      Add Product
    `;
    submitBtn.disabled = false;
  }
}

// File Upload Functionality
if (fileUploadArea) {
  const fileInput = document.getElementById('productPhotos');
  
  // Drag and drop functionality
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });
  
  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files);
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
}

// Compress image function
function compressImage(file) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
      resolve(compressedDataUrl);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

function handleFiles(files) {
  uploadedFiles.innerHTML = '';
  
  Array.from(files).forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('File too large. Please select images under 5MB.', 'error');
        return;
      }
      
      // Compress and preview
      compressImage(file).then(compressedDataUrl => {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.innerHTML = `
          <img src="${compressedDataUrl}" alt="Preview">
          <button class="remove-file" onclick="removeFile(${index})">×</button>
        `;
        uploadedFiles.appendChild(preview);
      });
    } else {
      showNotification('Please select only image files (JPG, PNG, GIF).', 'error');
    }
  });
}

function removeFile(index) {
  const fileInput = document.getElementById('productPhotos');
  const dt = new DataTransfer();
  const files = fileInput.files;
  
  for (let i = 0; i < files.length; i++) {
    if (i !== index) {
      dt.items.add(files[i]);
    }
  }
  
  fileInput.files = dt.files;
  handleFiles(fileInput.files);
}

// Star Rating Functionality
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('productRating');

stars.forEach(star => {
  star.addEventListener('click', () => {
    const value = parseInt(star.getAttribute('data-value'));
    setRating(value);
  });
  
  star.addEventListener('mouseenter', () => {
    const value = parseInt(star.getAttribute('data-value'));
    highlightStars(value);
  });
});

document.querySelector('.stars').addEventListener('mouseleave', () => {
  const currentRating = parseFloat(ratingInput.value) || 0;
  highlightStars(currentRating);
});

function setRating(value) {
  ratingInput.value = value;
  highlightStars(value);
}

function highlightStars(value) {
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function resetStars() {
  stars.forEach(star => star.classList.remove('active'));
}

// Enhanced form validation
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
  addProductForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      Adding...
    `;
    submitBtn.disabled = true;
    
    // Simulate processing delay
    setTimeout(() => {
      const files = document.getElementById('productPhotos').files;
      const name = document.getElementById('productName').value.trim();
      const price = parseFloat(document.getElementById('productPrice').value);
      const oldPrice = parseFloat(document.getElementById('productOldPrice').value) || null;
      const discount = parseInt(document.getElementById('productDiscount').value) || null;
      const description = document.getElementById('productDescription').value.trim();
      const colorRaw = document.getElementById('productColor').value.trim();
      const colors = colorRaw.split(',').map(c => c.trim()).filter(Boolean);
      const sizeRaw = document.getElementById('productSize').value.trim();
      const sizes = sizeRaw.split(',').map(s => s.trim()).filter(Boolean);
      const quantity = parseInt(document.getElementById('productQuantity').value);
      const category = document.getElementById('productCategory').value;
      const rating = parseFloat(document.getElementById('productRating').value) || null;
      
      // Compress all images
      const photoPromises = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        photoPromises.push(compressImage(file));
      }
      
      Promise.all(photoPromises).then(async photos => {
        try {
          const newProduct = { 
            name, 
            price, 
            oldPrice, 
            discount, 
            description, 
            colors, 
            sizes, 
            quantity, 
            category, 
            rating, 
            photos 
          };

          await createProduct(newProduct);
          await loadProducts();
          renderProducts();
          
          updateDashboardStats();
          showNotification('Product added successfully!', 'success');
          closeModal();
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        } catch (error) {
          console.error('Error saving product:', error);
          showNotification('Error saving product. Please try again.', 'error');
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }).catch(error => {
        console.error('Error processing images:', error);
        showNotification('Error processing images. Please try again.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
    }, 1000);
  });
}

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add notification styles if not exists
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
      }
      .notification-content {
        background: white;
        border-radius: 8px;
        padding: 16px 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
      }
      .notification-success .notification-content {
        border-left: 4px solid #48bb78;
      }
      .notification-error .notification-content {
        border-left: 4px solid #f56565;
      }
      .notification button {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #718096;
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

// --- Add Product Form Logic ---
const API_BASE = '/api';
let productsCache = [];
let ordersCache = [];

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function loadProducts() {
  try {
    const data = await apiFetch('/products.php');
    productsCache = Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.warn('Falling back to localStorage products due to API error:', e.message);
    const raw = localStorage.getItem('products');
    productsCache = raw ? JSON.parse(raw) : [];
  }
  return productsCache;
}

function getProducts() {
  return productsCache;
}

async function createProduct(product) {
  const created = await apiFetch('/products.php', { method: 'POST', body: JSON.stringify(product) });
  return created;
}

async function updateProduct(id, partial) {
  const updated = await apiFetch(`/products.php?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(partial) });
  return updated;
}

async function deleteProduct(id) {
  await apiFetch(`/products.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  return true;
}

async function refreshProductsUI() {
  const items = await loadProducts();
  renderProducts(items);
}
function generateProductId() {
  return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
function migrateExistingProducts() {
  const products = getProducts();
  let needsUpdate = false;
  products.forEach(product => {
    if (!product.id) {
      product.id = generateProductId();
      needsUpdate = true;
    }
  });
  if (needsUpdate) {
    setProducts(products);
  }
}
function addDemoProducts() {
  const products = getProducts();
  if (products.length === 0) {
    const demoProducts = [
      {
        id: generateProductId(),
        name: "Classic White T-Shirt",
        price: 45.00,
        oldPrice: 65.00,
        description: "Premium cotton classic white t-shirt with comfortable fit.",
        colors: ["#ffffff", "#000000", "#808080"],
        quantity: 25,
        category: "tshirt",
        rating: 4.5,
        photos: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80"]
      },
      {
        id: generateProductId(),
        name: "Oversized Black Tee",
        price: 55.00,
        oldPrice: 75.00,
        description: "Trendy oversized black t-shirt perfect for casual wear.",
        colors: ["#000000", "#333333"],
        quantity: 18,
        category: "tshirt",
        rating: 4.8,
        photos: ["https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=400&q=80"]
      },
      {
        id: generateProductId(),
        name: "Striped Summer Tee",
        price: 35.00,
        description: "Lightweight striped t-shirt perfect for summer days.",
        colors: ["#0000ff", "#ff0000", "#00ff00"],
        quantity: 30,
        category: "tshirt",
        rating: 4.2,
        photos: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=80"]
      },
      {
        id: generateProductId(),
        name: "Premium Cotton V-Neck",
        price: 65.00,
        oldPrice: 85.00,
        description: "High-quality cotton v-neck t-shirt with elegant design.",
        colors: ["#ffffff", "#000000", "#8B4513"],
        quantity: 15,
        category: "tshirt",
        rating: 4.7,
        photos: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=400&q=80"]
      },
      {
        id: generateProductId(),
        name: "Classic Black Trousers",
        price: 89.99,
        oldPrice: 129.99,
        description: "Elegant black trousers perfect for formal occasions.",
        colors: ["#000000", "#333333", "#666666"],
        quantity: 20,
        category: "trousers",
        rating: 4.6,
        photos: ["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80"]
      },
      {
        id: generateProductId(),
        name: "Casual Summer Shorts",
        price: 49.99,
        oldPrice: 79.99,
        description: "Comfortable summer shorts for casual wear.",
        colors: ["#ffffff", "#000000", "#808080"],
        quantity: 35,
        category: "shorts",
        rating: 4.3,
        photos: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"]
      },
      {
        id: generateProductId(),
        name: "Sport Running Shoes",
        price: 129.99,
        oldPrice: 189.99,
        description: "High-performance running shoes for athletes.",
        colors: ["#ffffff", "#000000", "#ff0000"],
        quantity: 15,
        category: "shoes",
        rating: 4.9,
        photos: ["https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=400&q=80"]
      }
    ];
    setProducts(demoProducts);
    
    // Update dashboard stats after adding demo products
    updateDashboardStats();
  }
}
// Clear localStorage function
function clearAllProducts() {
  if (confirm('Are you sure you want to delete all products? This action cannot be undone.')) {
    try {
      localStorage.removeItem('products');
      renderProducts();
      // Update dashboard stats after clearing all products
      updateDashboardStats();
      showNotification('All products cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing products:', error);
      showNotification('Error clearing products. Please try again.', 'error');
    }
  }
}

// Add clear button to the product section
function addClearButton() {
  const productSection = document.getElementById('section-product');
  if (productSection) {
    const header = productSection.querySelector('.app-content-header');
    if (header && !header.querySelector('.clear-all-btn')) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear-all-btn';
      clearBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
        </svg>
        Clear All
      `;
      clearBtn.style.marginLeft = '12px';
      clearBtn.addEventListener('click', clearAllProducts);
      header.appendChild(clearBtn);
    }
  }
}

// Call addClearButton when rendering products
function renderProducts() {
  const wrapper = document.querySelector('#section-product .products-area-wrapper');
  if (!wrapper) return;
  
  const products = getProducts();
  let html = '';
  html += `<div class="products-header">
    <div class="product-cell image">Items<button class="sort-button"></button></div>
    <div class="product-cell category">Category<button class="sort-button"></button></div>
    <div class="product-cell sizes">Sizes<button class="sort-button"></button></div>
    <div class="product-cell status-cell">Status<button class="sort-button"></button></div>
    <div class="product-cell sales">Sales<button class="sort-button"></button></div>
    <div class="product-cell stock">Stock<button class="sort-button"></button></div>
    <div class="product-cell price">Price<button class="sort-button"></button></div>
    <div class="product-cell actions">Actions</div>
  </div>`;
  
  if (products.length === 0) {
    html += `<div class="no-products">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 1-1.73z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <h3>No products yet</h3>
      <p>Start by adding your first product using the "Add Product" button above.</p>
    </div>`;
  } else {
    products.forEach((product, idx) => {
      html += `<div class="products-row">
        <button class="cell-more-button"></button>
        <div class="product-cell image">
          ${(product.photos && product.photos[0]) ? `<img src="${product.photos[0]}" alt="product" style="max-width:60px;max-height:60px;margin:2px;">` : ''}
          <span>${product.name}</span>
        </div>
        <div class="product-cell category"><span class="cell-label">Category:</span>${product.category}</div>
        <div class="product-cell sizes"><span class="cell-label">Sizes:</span>${(product.sizes||[]).join(', ')}</div>
        <div class="product-cell status-cell"><span class="cell-label">Status:</span><span class="status active">Active</span></div>
        <div class="product-cell sales"><span class="cell-label">Sales:</span>0</div>
        <div class="product-cell stock"><span class="cell-label">Stock:</span>${product.quantity}</div>
        <div class="product-cell price"><span class="cell-label">Price:</span>${product.price} AED${product.oldPrice ? ` <span style='text-decoration:line-through;color:#888;'>${product.oldPrice} AED</span>` : ''}</div>
        <div class="product-cell actions">
          <button class="edit-product-btn" data-idx="${idx}" style="margin-right:8px;">✏️</button>
          <button class="delete-product-btn" data-idx="${idx}">🗑️</button>
        </div>
      </div>`;
    });
  }
  
  wrapper.innerHTML = html;
  
  // Update dashboard stats after rendering products
  updateDashboardStats();
  
  // Add clear button
  addClearButton();
  
  // Delete logic
  wrapper.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const product = getProducts()[idx];
      if (!product) return;
      deleteProduct(product.id).then(async () => {
        await loadProducts();
        renderProducts();
        updateDashboardStats();
        showNotification('Product deleted successfully!', 'success');
      }).catch(err => {
        console.error('Delete failed', err);
        showNotification('Delete failed', 'error');
      });
    });
  });
  
  // Edit logic
  wrapper.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const products = getProducts();
      const product = products[idx];
      
      // Open modal and fill fields
      addProductModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Fill form fields
      document.getElementById('productName').value = product.name;
      document.getElementById('productPrice').value = product.price;
      document.getElementById('productOldPrice').value = product.oldPrice || '';
      document.getElementById('productDiscount').value = '';
      document.getElementById('productDescription').value = product.description;
      document.getElementById('productColor').value = (product.colors||[]).join(',');
      document.getElementById('productSize').value = (product.sizes||[]).join(',');
      document.getElementById('productQuantity').value = product.quantity;
      document.getElementById('productCategory').value = product.category;
      document.getElementById('productRating').value = product.rating || '';
      
      // Show existing photos if available
      if (product.photos && product.photos.length > 0) {
        uploadedFiles.innerHTML = '';
        product.photos.forEach((photo, photoIndex) => {
          const preview = document.createElement('div');
          preview.className = 'file-preview';
          preview.innerHTML = `
            <img src="${photo}" alt="Preview">
            <button class="remove-file" onclick="removeFile(${photoIndex})">×</button>
          `;
          uploadedFiles.appendChild(preview);
        });
      }
      
      // Set rating stars
      if (product.rating) {
        setRating(product.rating);
      }
      
      // Update submit button text
      const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Update Product
      `;
      
      // Override form submission for editing
      const originalSubmitHandler = addProductForm.onsubmit;
      addProductForm.onsubmit = function(e) {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `
          <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          Updating...
        `;
        submitBtn.disabled = true;
        
        setTimeout(() => {
          const files = document.getElementById('productPhotos').files;
          const name = document.getElementById('productName').value.trim();
          const price = parseFloat(document.getElementById('productPrice').value);
          const oldPrice = parseFloat(document.getElementById('productOldPrice').value) || null;
          const discount = parseInt(document.getElementById('productDiscount').value) || null;
          const description = document.getElementById('productDescription').value.trim();
          const colorRaw = document.getElementById('productColor').value.trim();
          const colors = colorRaw.split(',').map(c => c.trim()).filter(Boolean);
          const sizeRaw = document.getElementById('productSize').value.trim();
          const sizes = sizeRaw.split(',').map(s => s.trim()).filter(Boolean);
          const quantity = parseInt(document.getElementById('productQuantity').value);
          const category = document.getElementById('productCategory').value;
          const rating = parseFloat(document.getElementById('productRating').value) || null;
          
          // Handle photos
          const photoPromises = [];
          if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              photoPromises.push(compressImage(file));
            }
          }
          
          Promise.all(photoPromises).then(async photos => {
            try {
              const updated = { 
                name, 
                price, 
                oldPrice, 
                discount, 
                description, 
                colors, 
                sizes, 
                quantity, 
                category, 
                rating, 
                photos: (files.length > 0 ? photos : product.photos) 
              };
              await updateProduct(product.id, updated);
              await loadProducts();
              renderProducts();
              showNotification('Product updated successfully!', 'success');
              closeModal();
              addProductForm.onsubmit = originalSubmitHandler;
              submitBtn.innerHTML = originalText;
              submitBtn.disabled = false;
            } catch (error) {
              console.error('Error updating product:', error);
              showNotification('Error updating product. Please try again.', 'error');
              submitBtn.innerHTML = originalText;
              submitBtn.disabled = false;
            }
          }).catch(error => {
            console.error('Error processing images:', error);
            showNotification('Error processing images. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
          });
        }, 1000);
      };
    });
  });
}
// Автоматический рендер при загрузке
if (document.querySelector('#section-product')) {
  loadProducts().then(() => renderProducts());
}

// Orders Management Functions
async function loadOrders() {
  try {
    const data = await apiFetch('/orders.php');
    ordersCache = Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.warn('Orders API error, using local fallback:', e.message);
    const raw = localStorage.getItem('orders');
    ordersCache = raw ? JSON.parse(raw) : [];
  }
  return ordersCache;
}

function getOrders() {
  return ordersCache;
}

async function createRemoteOrder(order) {
  const created = await apiFetch('/orders.php', { method: 'POST', body: JSON.stringify(order) });
  return created;
}

async function createOrderFromCart(cartItems, customerInfo) {
  const order = {
    customerName: customerInfo.name || 'Anonymous',
    customerEmail: customerInfo.email || '',
    customerPhone: customerInfo.phone || '',
    products: cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
    total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    status: 'pending',
    date: new Date().toISOString()
  };
  await createRemoteOrder(order);
  await loadOrders();
  updateDashboardStats();
  return order;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await apiFetch(`/orders.php?id=${encodeURIComponent(orderId)}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    await loadOrders();
    renderOrders();
    updateDashboardStats();
    showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
    return true;
  } catch (e) {
    console.error('Failed to update order', e);
    showNotification('Failed to update order', 'error');
    return false;
  }
}

function updateClientOrderStatus(order) {
  // Get all users from localStorage
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  // Find user by email
  const userEmail = order.customerEmail;
  if (users[userEmail]) {
    // Update user's orders
    if (!users[userEmail].orders) {
      users[userEmail].orders = [];
    }
    
    const userOrderIndex = users[userEmail].orders.findIndex(uo => uo.id === order.id);
    if (userOrderIndex !== -1) {
      users[userEmail].orders[userOrderIndex].status = order.status;
      users[userEmail].orders[userOrderIndex].lastUpdated = order.lastUpdated;
    } else {
      // Add new order to user
      users[userEmail].orders.push({
        id: order.id,
        products: order.products,
        total: order.total,
        status: order.status,
        date: order.date,
        lastUpdated: order.lastUpdated
      });
    }
    
    // Save updated users
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  // Also update orders in the main orders localStorage for profile sync
  try {
    const profileOrders = JSON.parse(localStorage.getItem('profileOrders') || '[]');
    const profileOrderIndex = profileOrders.findIndex(po => 
      po.customerEmail === order.customerEmail && 
      po.date === order.date && 
      po.total === order.total
    );
    
    if (profileOrderIndex !== -1) {
      profileOrders[profileOrderIndex].status = order.status;
      profileOrders[profileOrderIndex].lastUpdated = order.lastUpdated;
    }
    
    localStorage.setItem('profileOrders', JSON.stringify(profileOrders));
  } catch (error) {
    console.error('Error updating profile orders:', error);
  }
}

function searchOrders(query) {
  const orders = getOrders();
  if (!query.trim()) return orders;
  
  const searchTerm = query.toLowerCase();
  return orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm) ||
    order.customerName.toLowerCase().includes(searchTerm) ||
    order.customerEmail.toLowerCase().includes(searchTerm) ||
    order.products.some(product => product.name.toLowerCase().includes(searchTerm)) ||
    order.status.toLowerCase().includes(searchTerm)
  );
}

function filterOrdersByStatus(status) {
  const orders = getOrders();
  if (status === 'all') return orders;
  return orders.filter(order => order.status === status);
}

function renderOrders(filteredOrders = null) {
  const wrapper = document.querySelector('#section-listings .orders-area-wrapper');
  if (!wrapper) return;
  
  const orders = filteredOrders || getOrders();
  let html = '';
  
  html += `<div class="orders-header">
    <div class="order-cell">Order ID</div>
    <div class="order-cell">Customer</div>
    <div class="order-cell">Products</div>
    <div class="order-cell">Total</div>
    <div class="order-cell">Status</div>
    <div class="order-cell">Date</div>
    <div class="order-cell">Actions</div>
  </div>`;
  
  if (orders.length === 0) {
    html += `<div class="no-orders">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <h3>No orders yet</h3>
      <p>Orders will appear here when customers complete their purchases.</p>
    </div>`;
  } else {
    orders.forEach(order => {
      const orderDate = new Date(order.date);
      const formattedDate = orderDate.toLocaleDateString();
      const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      html += `<div class="orders-row" data-order-id="${order.id}">
        <div class="order-cell">${order.id}</div>
        <div class="order-cell">
          <div class="customer-info">
            <div class="customer-name">${order.customerName}</div>
            <div class="customer-email">${order.customerEmail || 'N/A'}</div>
            <div class="customer-phone">${order.customerPhone || 'N/A'}</div>
          </div>
        </div>
        <div class="order-cell">
          <div class="products-list">
            ${order.products.map(product => `
              <div class="product-item">
                <span class="product-name">${product.name || 'Товар'}</span>
                <span class="product-quantity">(x${product.quantity || 1})</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="order-cell">$${order.total.toFixed(2)}</div>
        <div class="order-cell">
          <span class="status ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
        </div>
        <div class="order-cell">
          <div class="date-info">
            <div class="order-date">${formattedDate}</div>
            <div class="order-time">${formattedTime}</div>
          </div>
        </div>
        <div class="order-cell">
          <div class="order-actions">
            <button class="btn-action view-order" data-order-id="${order.id}">View</button>
            <div class="status-dropdown">
              <button class="btn-action status-toggle" data-order-id="${order.id}">
                Update Status
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              <div class="status-options">
                <div class="status-option" data-status="pending">Pending</div>
                <div class="status-option" data-status="processing">Processing</div>
                <div class="status-option" data-status="shipped">Shipped</div>
                <div class="status-option" data-status="delivered">Delivered</div>
                <div class="status-option" data-status="cancelled">Cancelled</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    });
  }
  
  wrapper.innerHTML = html;
  
  // Update dashboard stats after rendering orders
  updateDashboardStats();
  
  // Add event listeners for status updates
  setupOrderEventListeners();
}

function setupOrderEventListeners() {
  // Status dropdown toggle
  document.querySelectorAll('.status-toggle').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const dropdown = this.closest('.status-dropdown');
      dropdown.classList.toggle('active');
    });
  });
  
  // Status option selection
  document.querySelectorAll('.status-option').forEach(option => {
    option.addEventListener('click', function() {
      const orderId = this.closest('.orders-row').getAttribute('data-order-id');
      const newStatus = this.getAttribute('data-status');
      
      if (updateOrderStatus(orderId, newStatus)) {
        // Close dropdown
        this.closest('.status-dropdown').classList.remove('active');
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.status-dropdown')) {
      document.querySelectorAll('.status-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
      });
    }
  });
  
  // View order details
  document.querySelectorAll('.view-order').forEach(btn => {
    btn.addEventListener('click', function() {
      const orderId = this.getAttribute('data-order-id');
      showOrderDetails(orderId);
    });
  });
}

function showOrderDetails(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  
  if (!order) return;
  
  const modal = document.createElement('div');
  modal.className = 'order-details-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Order Details - ${order.id}</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="order-section">
          <h4>Customer Information</h4>
          <p><strong>Name:</strong> ${order.customerName}</p>
          <p><strong>Email:</strong> ${order.customerEmail}</p>
          <p><strong>Phone:</strong> ${order.customerPhone}</p>
        </div>
        <div class="order-section">
          <h4>Order Items</h4>
          ${order.products.map(product => `
            <div class="order-product">
              <span class="product-name">${product.name}</span>
              <span class="product-quantity">x${product.quantity}</span>
              <span class="product-price">$${product.price}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-section">
          <h4>Order Summary</h4>
          <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
          <p><strong>Status:</strong> <span class="status ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
          <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Recent Activity (reads last events from orders/products/customers)
function renderRecentActivity() {
  const container = document.querySelector('.recent-activity .activity-list');
  if (!container) return;

  const activities = [];
  try {
    const orders = getOrders();
    orders.slice(0, 10).forEach(o => {
      activities.push({
        type: 'order',
        title: 'New order',
        text: `${o.customerName || 'Customer'} ordered (${(o.products||[]).length} items)`,
        ts: new Date(o.date || Date.now()).getTime()
      });
    });
  } catch {}
  try {
    const products = getProducts();
    products.slice(-10).forEach(p => {
      activities.push({
        type: 'product',
        title: 'Product added',
        text: p.name || 'Product',
        ts: Date.now() // no exact ts stored; approximate
      });
    });
  } catch {}
  try {
    const customers = JSON.parse(localStorage.getItem('customers_cache') || '[]');
    customers.slice(-10).forEach(c => {
      activities.push({
        type: 'customer',
        title: 'New customer',
        text: c.email || c.name || 'Customer',
        ts: Date.now()
      });
    });
  } catch {}

  activities.sort((a,b)=>b.ts-a.ts);
  const items = activities.slice(0, 10).map(a => {
    const icon = a.type === 'order' ? '🧾' : a.type === 'product' ? '🛍️' : '👤';
    const time = new Date(a.ts).toLocaleString();
    return `<div class="activity-item"><div class="activity-icon">${icon}</div><div class="activity-content"><p><strong>${a.title}</strong> ${a.text}</p><span class="activity-time">${time}</span></div></div>`;
  }).join('');
  container.innerHTML = items || '<div class="activity-item"><div class="activity-content">No activity yet</div></div>';
}

// Initialize orders when dashboard loads
async function initializeOrders() {
  if (document.querySelector('#section-listings')) {
    // Clean up localStorage first
    cleanupDashboardStorage();
    await loadOrders();
    if (getOrders().length === 0) {
      addDemoOrders();
    }
    renderOrders();
    
    // Update dashboard stats after orders are loaded
    updateDashboardStats();
    
    // Setup search functionality
    const searchBar = document.querySelector('#section-listings .search-bar');
    if (searchBar) {
      searchBar.addEventListener('input', function() {
        const query = this.value.trim();
        const filteredOrders = searchOrders(query);
        renderOrders(filteredOrders);
        // Update dashboard stats after search
        updateDashboardStats();
      });
    }
    
    // Setup filter functionality
    setupFilterFunctionality();
  }
}

function cleanupDashboardStorage() {
  try {
    // Check and clean up orders if too many
    const orders = getOrders();
    if (orders.length > 100) {
      const cleanedOrders = orders.slice(0, 100);
      setOrders(cleanedOrders);
      console.log('Cleaned up dashboard orders to prevent overflow');
    }
    
    // Check and clean up products if too many
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    if (products.length > 200) {
      localStorage.setItem('products', JSON.stringify(products.slice(0, 200)));
      console.log('Cleaned up products to prevent overflow');
    }
  } catch (error) {
    console.error('Error during dashboard storage cleanup:', error);
  }
}

// Function to clear all data (for emergency use)
function clearAllData() {
  if (confirm('⚠️ ВНИМАНИЕ! Это действие удалит ВСЕ данные из localStorage!\n\nЭто включает:\n- Все заказы\n- Все продукты\n- Все профили пользователей\n- Корзины и избранное\n\nВы уверены, что хотите продолжить?')) {
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Show success message
      showNotification('Все данные успешно очищены!', 'success');
      
      // Reload page to reset everything
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing data:', error);
      showNotification('Ошибка при очистке данных', 'error');
    }
  }
}

async function addDemoOrders() { /* disabled: no demo seed orders */ }

// Dashboard Statistics Functions
function calculateDashboardStats() {
  const orders = getOrders();
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Calculate total revenue from orders
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.total || 0);
  }, 0);
  
  // Calculate total orders
  const totalOrders = orders.length;
  
  // Calculate active customers (unique customers who placed orders)
  const uniqueCustomers = new Set(orders.map(order => order.customerEmail || order.customerName));
  const activeCustomers = uniqueCustomers.size;
  
  // Calculate total products
  const totalProducts = products.length;
  
  // Calculate growth percentages (comparing with previous period)
  const currentPeriod = orders.filter(order => {
    const orderDate = new Date(order.date || order.timestamp);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return orderDate >= weekAgo;
  });
  
  const previousPeriod = orders.filter(order => {
    const orderDate = new Date(order.date || order.timestamp);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return orderDate >= twoWeeksAgo && orderDate < weekAgo;
  });
  
  const currentRevenue = currentPeriod.reduce((sum, order) => sum + (order.total || 0), 0);
  const previousRevenue = previousPeriod.reduce((sum, order) => sum + (order.total || 0), 0);
  const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
  
  const currentOrders = currentPeriod.length;
  const previousOrders = previousPeriod.length;
  const ordersGrowth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders * 100) : 0;
  
  const currentCustomers = new Set(currentPeriod.map(order => order.customerEmail || order.customerName)).size;
  const previousCustomers = new Set(previousPeriod.map(order => order.customerEmail || order.customerName)).size;
  const customersGrowth = previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers * 100) : 0;
  
  return {
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders: totalOrders,
    activeCustomers: activeCustomers,
    totalProducts: totalProducts,
    revenueGrowth: revenueGrowth.toFixed(1),
    ordersGrowth: ordersGrowth.toFixed(1),
    customersGrowth: customersGrowth.toFixed(1)
  };
}

function updateDashboardStats() {
  const stats = calculateDashboardStats();
  
  // Update revenue card
  const revenueValue = document.querySelector('.stat-card:nth-child(1) .stat-value');
  const revenueGrowth = document.querySelector('.stat-card:nth-child(1) .stat-change');
  if (revenueValue) revenueValue.textContent = `$${stats.totalRevenue}`;
  if (revenueGrowth) {
    revenueGrowth.textContent = `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`;
    revenueGrowth.className = `stat-change ${stats.revenueGrowth > 0 ? 'positive' : stats.revenueGrowth < 0 ? 'negative' : 'neutral'}`;
  }
  
  // Update orders card
  const ordersValue = document.querySelector('.stat-card:nth-child(2) .stat-value');
  const ordersGrowth = document.querySelector('.stat-card:nth-child(2) .stat-change');
  if (ordersValue) ordersValue.textContent = stats.totalOrders;
  if (ordersGrowth) {
    ordersGrowth.textContent = `${stats.ordersGrowth > 0 ? '+' : ''}${stats.ordersGrowth}%`;
    ordersGrowth.className = `stat-change ${stats.ordersGrowth > 0 ? 'positive' : stats.ordersGrowth < 0 ? 'negative' : 'neutral'}`;
  }
  
  // Update customers card
  const customersValue = document.querySelector('.stat-card:nth-child(3) .stat-value');
  const customersGrowth = document.querySelector('.stat-card:nth-child(3) .stat-change');
  if (customersValue) customersValue.textContent = stats.activeCustomers;
  if (customersGrowth) {
    customersGrowth.textContent = `${stats.customersGrowth > 0 ? '+' : ''}${stats.customersGrowth}%`;
    customersGrowth.className = `stat-change ${stats.customersGrowth > 0 ? 'positive' : stats.customersGrowth < 0 ? 'negative' : 'neutral'}`;
  }
  
  // Update products card
  const productsValue = document.querySelector('.stat-card:nth-child(4) .stat-value');
  const productsGrowth = document.querySelector('.stat-card:nth-child(4) .stat-change');
  if (productsValue) productsValue.textContent = stats.totalProducts;
  if (productsGrowth) {
    productsGrowth.textContent = '0%';
    productsGrowth.className = 'stat-change neutral';
  }
}

// Auto-refresh dashboard stats every 30 seconds
function startDashboardAutoRefresh() {
  updateDashboardStats();
  setInterval(updateDashboardStats, 30000); // Update every 30 seconds
  
  // Listen for localStorage changes
  window.addEventListener('storage', function(e) {
    if (e.key === 'orders' || e.key === 'products' || e.key === 'users') {
      updateDashboardStats();
    }
  });
  
  // Listen for cart changes
  window.addEventListener('cartUpdated', function() {
    updateDashboardStats();
  });
  
  // Listen for favorites changes
  window.addEventListener('favoritesUpdated', function() {
    updateDashboardStats();
  });
  
  // Listen for profile changes
  window.addEventListener('profileUpdated', function() {
    updateDashboardStats();
  });
  
  // Listen for orders changes
  window.addEventListener('ordersUpdated', function() {
    updateDashboardStats();
  });
  
  // Listen for products changes
  window.addEventListener('productsUpdated', function() {
    updateDashboardStats();
  });
  
  // Listen for users changes
  window.addEventListener('usersUpdated', function() {
    updateDashboardStats();
  });
  
  // Listen for cart changes
  window.addEventListener('cartUpdated', function() {
    updateDashboardStats();
  });
}

// Initialize all sections when dashboard loads
document.addEventListener('DOMContentLoaded', function() {
  // Setup theme switching
  setupThemeSwitching();
  
  // Setup filter functionality
  setupFilterFunctionality();
  
  // Initialize dashboard statistics
  startDashboardAutoRefresh();
  renderRecentActivity();
  
  // Initialize products
  if (document.querySelector('#section-product')) {
    loadProducts().then(() => renderProducts());
  }
  
  // Initialize orders
  if (document.querySelector('#section-listings')) {
    initializeOrders();
  }
});