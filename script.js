// Bootstrap products from backend into localStorage (used by public pages)
(function bootstrapProducts() {
  try {
    fetch('/api/products.php')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.items) && data.items.length) {
          try { localStorage.setItem('products', JSON.stringify(data.items)); } catch {}
        }
      })
      .catch(() => {});
  } catch (_) {}
})();

// ===== SIDEBAR NAVIGATION =====
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');

if (sidebar && openSidebarBtn && closeSidebarBtn) {
  openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
  });
  closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });
  // Закрытие по клику вне меню
  document.addEventListener('click', (e) => {
    if (
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== openSidebarBtn
    ) {
      sidebar.classList.remove('open');
    }
  });
}

// ===== PRODUCT TOOLBAR INTERACTIONS =====

document.addEventListener('DOMContentLoaded', function() {
  // --- ФИЛЬТР ---
  const filterBtn = document.querySelector('.toolbar-filter');
  const filterModal = document.getElementById('filterModal');
  const closeFilterBtn = document.getElementById('closeFilterBtn');
  const applyFilterBtn = document.getElementById('applyFilterBtn');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  const filterColorsForm = document.getElementById('filterColorsForm');

  let activeColors = [];
  let searchQuery = '';
  let sortOrder = null; // null: popular, 'asc': по возрастанию, 'desc': по убыванию

  function showFilterModal() {
    filterModal.style.display = 'flex';
  }
  function hideFilterModal() {
    filterModal.style.display = 'none';
  }
  if (filterBtn && filterModal) {
    filterBtn.addEventListener('click', showFilterModal);
  }
  if (closeFilterBtn) {
    closeFilterBtn.addEventListener('click', hideFilterModal);
  }
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', function() {
      filterColorsForm.reset();
      activeColors = [];
      filterAndRender();
      hideFilterModal();
    });
  }
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const checked = filterColorsForm.querySelectorAll('input[type="checkbox"]:checked');
      activeColors = Array.from(checked).map(cb => cb.value);
      filterAndRender();
      hideFilterModal();
    });
  }

  // --- ПОИСК С ПОДСКАЗКАМИ НА product.html ---
  const searchBoxWrap = document.querySelector('.search-box-wrap');
  let searchIconBtn = document.querySelector('.search-btn');
  const searchInput = document.getElementById('searchInputBox');
  const searchSuggestions = document.getElementById('searchSuggestions');
  let allProducts = [];

  function loadAllProducts() {
    try {
      const data = localStorage.getItem('products');
      allProducts = data ? JSON.parse(data) : [];
    } catch { allProducts = []; }
  }
  loadAllProducts();

  function showSearchInput() {
    if (searchInput) {
      searchInput.style.display = 'block';
      searchInput.value = '';
      searchInput.focus();
    }
    if (searchSuggestions) {
      searchSuggestions.style.display = 'none';
      searchSuggestions.innerHTML = '';
    }
    if (searchIconBtn) searchIconBtn.style.display = 'none';
    // Mark search open for styling (e.g., keep mobile logo behind)
    document.body.classList.add('search-open');
  }
  function hideSearchInput() {
    if (searchInput) searchInput.style.display = 'none';
    if (searchSuggestions) {
      searchSuggestions.style.display = 'none';
      searchSuggestions.innerHTML = '';
    }
    if (searchIconBtn) searchIconBtn.style.display = 'block';
    // Remove search-open state
    document.body.classList.remove('search-open');
  }
  if (searchIconBtn && searchInput) {
    searchIconBtn.addEventListener('click', showSearchInput);
  }
  document.addEventListener('mousedown', function(e) {
    if (searchInput && searchInput.style.display === 'block') {
      if (!searchBoxWrap.contains(e.target)) {
        hideSearchInput();
      }
    }
  });
  if (searchInput) {
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hideSearchInput();
    });
  }
  if (searchInput && searchSuggestions) {
    searchInput.addEventListener('input', function() {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        searchSuggestions.style.display = 'none';
        searchSuggestions.innerHTML = '';
        return;
      }
      const matches = allProducts.filter(p => p.name.toLowerCase().includes(query));
      if (matches.length === 0) {
        searchSuggestions.innerHTML = '<div class="search-suggestion-item">No results</div>';
        searchSuggestions.style.display = 'block';
        return;
      }
      searchSuggestions.innerHTML = matches.map(p =>
        `<div class="search-suggestion-item" data-id="${p.id}">${p.name}</div>`
      ).join('');
      searchSuggestions.style.display = 'block';
    });
    searchSuggestions.addEventListener('mousedown', function(e) {
      if (e.target.classList.contains('search-suggestion-item')) {
        const id = e.target.getAttribute('data-id');
        if (id) window.location.href = `product.html?id=${id}`;
        hideSearchInput();
      }
    });
    // Навигация по подсказкам клавишами
    let suggestionIndex = -1;
    searchInput.addEventListener('keydown', function(e) {
      const items = Array.from(searchSuggestions.querySelectorAll('.search-suggestion-item'));
      if (!items.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        suggestionIndex = (suggestionIndex + 1) % items.length;
        items.forEach((item, i) => item.classList.toggle('active', i === suggestionIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        suggestionIndex = (suggestionIndex - 1 + items.length) % items.length;
        items.forEach((item, i) => item.classList.toggle('active', i === suggestionIndex));
      } else if (e.key === 'Enter') {
        if (suggestionIndex >= 0 && suggestionIndex < items.length) {
          const id = items[suggestionIndex].getAttribute('data-id');
          if (id) window.location.href = `product.html?id=${id}`;
          hideSearchInput();
        }
      } else {
        suggestionIndex = -1;
        items.forEach(item => item.classList.remove('active'));
      }
    });
  }

  // --- СОРТИРОВКА ---
  const sortBtn = document.querySelector('.toolbar-sort-label');
  const priceBtn = document.querySelector('.toolbar-price');
  const sortActive = document.querySelector('.toolbar-sort-active');
  function updateSortVisuals() {
    if (sortOrder === null) {
      if (sortActive) sortActive.classList.add('active');
      if (priceBtn) priceBtn.classList.remove('active');
      if (priceBtn) priceBtn.querySelector('.toolbar-price-arrows').textContent = '⇅';
    } else if (sortOrder === 'asc') {
      if (sortActive) sortActive.classList.remove('active');
      if (priceBtn) priceBtn.classList.add('active');
      if (priceBtn) priceBtn.querySelector('.toolbar-price-arrows').textContent = '↑';
    } else if (sortOrder === 'desc') {
      if (sortActive) sortActive.classList.remove('active');
      if (priceBtn) priceBtn.classList.add('active');
      if (priceBtn) priceBtn.querySelector('.toolbar-price-arrows').textContent = '↓';
    }
  }
  if (sortBtn) {
    sortBtn.addEventListener('click', function() {
      sortOrder = null;
      filterAndRender();
      updateSortVisuals();
    });
  }
  if (priceBtn) {
    priceBtn.addEventListener('click', function() {
      if (sortOrder === 'asc') sortOrder = 'desc';
      else sortOrder = 'asc';
      filterAndRender();
      updateSortVisuals();
    });
  }
  // При первом запуске — выставить визуализацию
  updateSortVisuals();

  // --- ФИЛЬТРАЦИЯ, СОРТИРОВКА, ПОИСК ---
  function filterAndRender() {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    // Сохраняем оригинальный порядок для popular
    cards.forEach((card, i) => { card.dataset.originalIndex = i; });
    let filtered = cards;
    // Поиск
    if (searchQuery) {
      filtered = filtered.filter(card => {
        const title = card.querySelector('.product-title');
        return title && title.textContent.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    // Фильтр по цвету
    if (activeColors.length > 0) {
      filtered = filtered.filter(card => {
        const dots = Array.from(card.querySelectorAll('.color-dot'));
        return dots.some(dot => activeColors.includes(dot.style.background));
      });
    }
    // Сортировка
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.querySelector('.product-price')?.textContent || '0');
        const priceB = parseFloat(b.querySelector('.product-price')?.textContent || '0');
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else {
      // popular: вернуть исходный порядок
      filtered.sort((a, b) => a.dataset.originalIndex - b.dataset.originalIndex);
    }
    // Скрыть все, показать только отфильтрованные
    cards.forEach(card => { card.style.display = 'none'; });
    filtered.forEach(card => { card.style.display = ''; });
    // Если ничего не найдено
    if (filtered.length === 0) {
      alert('Ничего не найдено');
    }
  }

  // Сброс поиска по двойному клику на Most Popular
  if (sortActive) {
    sortActive.addEventListener('dblclick', function() {
      searchQuery = '';
      filterAndRender();
    });
  }

  // Клик вне модалки — закрыть
  window.addEventListener('mousedown', function(e) {
    if (filterModal && filterModal.style.display !== 'none' && !filterModal.contains(e.target) && !e.target.closest('.toolbar-filter')) {
      hideFilterModal();
    }
  });

  // === PROMO SLIDER ===
  const slider = document.getElementById('promoSlider');
  if (slider) {
    const slides = Array.from(slider.querySelectorAll('.promo-slide'));
    slides.forEach(slide => {
      const bg = slide.getAttribute('data-bg');
      if (bg) slide.style.backgroundImage = `url('${bg}')`;
    });
    const dotsWrap = document.getElementById('promoSliderDots');
    let current = 0;
    let autoTimer = null;

    function showSlide(idx) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === idx);
      });
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((dot, i) => {
          dot.classList.toggle('active', i === idx);
        });
      }
      current = idx;
    }
    function nextSlide() {
      showSlide((current + 1) % slides.length);
    }
    function prevSlide() {
      showSlide((current - 1 + slides.length) % slides.length);
    }
    // Dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'promo-slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => showSlide(i));
        dotsWrap.appendChild(dot);
      });
    }
    // Auto (4 секунды)
    function startAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(nextSlide, 4000);
    }
    slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
    slider.addEventListener('mouseleave', startAuto);
    startAuto();
    // Swipe (touch)
    let touchStartX = null;
    slider.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
      }
    });
    slider.addEventListener('touchend', function(e) {
      if (touchStartX === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const dx = touchEndX - touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) nextSlide();
        else prevSlide();
      }
      touchStartX = null;
    });
    // Таймеры
    function updateTimers() {
      slides.forEach(slide => {
        const timer = slide.querySelector('.promo-slide-timer');
        if (!timer) return;
        const deadline = timer.getAttribute('data-deadline');
        if (!deadline) return;
        const end = new Date(deadline);
        const now = new Date();
        let diff = Math.floor((end - now) / 1000);
        if (diff < 0) diff = 0;
        const d = Math.floor(diff / 86400);
        const h = Math.floor((diff % 86400) / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        timer.textContent =
          (d > 0 ? d + 'd ' : '') +
          (h < 10 ? '0' : '') + h + ':' +
          (m < 10 ? '0' : '') + m + ':' +
          (s < 10 ? '0' : '') + s +
          ' left';
      });
    }
    updateTimers();
    setInterval(updateTimers, 1000);
  }

  // Универсальный рендер для trousers, shorts, shoes
  function renderCategoryProducts(category, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const products = allProducts.filter(p => p.category === category);
    if (products.length === 0) {
      grid.innerHTML = `<div style="padding:2em;">No ${category.charAt(0).toUpperCase() + category.slice(1)}s found.</div>`;
      return;
    }
    grid.innerHTML = products.map((product, index) => {
      const discount = (product.oldPrice && product.price) ? calcDiscount(product.price, product.oldPrice) : null;
      const animationClass = `scroll-animate from-bottom stagger-${(index % 5) + 1}`;
      return `
        <div class="product-card ${animationClass}" style="background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.07);padding:0.8em 0.8em 1em 0.8em;display:flex;flex-direction:column;align-items:center;position:relative;max-width:280px;min-height:420px;margin:0 auto 1.5em auto;cursor:pointer;" onclick="window.location.href='../product.html?id=${product.id}'">
          <div class="product-image-wrap" style="width:100%;display:flex;justify-content:center;align-items:center;gap:4px;position:relative;">
            ${discount ? `<div style='position:absolute;left:8px;top:8px;background:#f66;color:#fff;font-size:0.9em;padding:2px 8px;border-radius:6px;z-index:3;'>-${discount}%</div>` : ''}
            ${product.photos && product.photos[0] ? `<img src="${product.photos[0]}" alt="product" style="width:100%;max-width:200px;max-height:200px;border-radius:8px;object-fit:cover;position:relative;z-index:1;">` : ''}
            <button class="product-fav" aria-label="Add to favorites" style="position:absolute;right:12px;top:8px;background:#fff;border-radius:50%;border:none;width:28px;height:28px;box-shadow:0 2px 8px rgba(0,0,0,0.07);font-size:1.1em;cursor:pointer;z-index:3;" onclick="event.stopPropagation();">&#9825;</button>
          </div>
          <div class="product-info" style="width:100%;margin-top:0.8em;">
            <div class="product-title" style="font-size:1em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${product.name}</div>
            <div class="product-price-row" style="margin:0.4em 0;display:flex;align-items:center;gap:8px;justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:8px;">
                <span class="product-price" style="font-size:1.1em;font-weight:700;color:#d33;">${product.price} AED</span>
                <span class="product-old-price" style="text-decoration:line-through;color:#888;font-size:0.9em;">${product.oldPrice ? product.oldPrice + ' AED' : ''}</span>
              </span>
              <span class="product-rating" style="color:#f90;font-weight:600;font-size:0.9em;">${product.rating ? product.rating + ' &#9733;' : ''}</span>
            </div>
            <div class="product-colors" style="margin-bottom:0.4em;">
              ${(product.colors||[]).map(c=>`<span class='color-dot' style='display:inline-block;width:16px;height:16px;border-radius:50%;background:${c};margin:0 2px;border:1.5px solid #ccc;vertical-align:middle;'></span>`).join('')}
            </div>
            <div class="product-meta" style="display:flex;align-items:center;gap:8px;">
              <span class="product-qty" style="color:#888;font-size:0.9em;">Stock: ${product.quantity}</span>
              <button class="product-cart" aria-label="Add to cart" style="background:#fff;border-radius:50%;border:1.5px solid #eee;width:28px;height:28px;box-shadow:0 2px 8px rgba(0,0,0,0.07);font-size:1.1em;cursor:pointer;" onclick="event.stopPropagation();">&#128722;</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Re-initialize animations for newly created elements
    setTimeout(() => {
      const newProductCards = grid.querySelectorAll('.product-card');
      newProductCards.forEach(card => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        observer.observe(card);
      });
    }, 100);
    attachProductCardHandlers(grid);
  }
});

// Sidebar categories dropdown functionality
function initializeSidebarCategoriesDropdown() {
    const dropdownBtn = document.getElementById('sidebarCategoriesDropdown');
    const dropdownContent = document.getElementById('sidebarCategoriesDropdownContent');
    
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
            dropdownBtn.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
                dropdownBtn.classList.remove('active');
            }
        });
        
        // Close dropdown when pressing Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdownContent.classList.remove('show');
                dropdownBtn.classList.remove('active');
            }
        });
    }
}

// Initialize sidebar dropdown when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebarCategoriesDropdown();
    initializeScrollAnimations();
});

// Scroll animations functionality
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Add animation classes to elements
    function addAnimationClasses() {
        // Category cards on main page
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach((card, index) => {
            card.classList.add('scroll-animate', 'from-bottom');
            if (index < 5) {
                card.classList.add(`stagger-${index + 1}`);
            }
            observer.observe(card);
        });

        // Product cards
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            card.classList.add('scroll-animate', 'from-bottom');
            if (index < 5) {
                card.classList.add(`stagger-${(index % 5) + 1}`);
            }
            observer.observe(card);
        });

        // Promo slider
        const promoSlider = document.querySelector('.promo-slider');
        if (promoSlider) {
            promoSlider.classList.add('scroll-animate', 'scale-in');
            observer.observe(promoSlider);
        }

        // Category section titles
        const categoryTitles = document.querySelectorAll('.category-section h2, .categories h2');
        categoryTitles.forEach(title => {
            title.classList.add('scroll-animate', 'from-left');
            observer.observe(title);
        });

        // Product toolbar
        const productToolbar = document.querySelector('.product-toolbar');
        if (productToolbar) {
            productToolbar.classList.add('scroll-animate', 'from-right');
            observer.observe(productToolbar);
        }

        // Footer sections
        const footerSections = document.querySelectorAll('.subscribe, .footer-links');
        footerSections.forEach((section, index) => {
            section.classList.add('scroll-animate', 'from-bottom');
            section.classList.add(`stagger-${index + 1}`);
            observer.observe(section);
        });

        // Sidebar elements
        const sidebarLinks = document.querySelectorAll('.sidebar-links li');
        sidebarLinks.forEach((link, index) => {
            link.classList.add('scroll-animate', 'from-left');
            link.classList.add(`stagger-${index + 1}`);
            observer.observe(link);
        });
    }

    // Initialize animations
    addAnimationClasses();

    // Re-initialize animations when content changes (for dynamic content)
    const mutationObserver = new MutationObserver(() => {
        setTimeout(() => {
            addAnimationClasses();
        }, 100);
    });

    // Observe changes in the main content areas
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mutationObserver.observe(mainContent, {
            childList: true,
            subtree: true
        });
    }
}

function attachProductCardHandlers(grid) {
  if (!grid) return;
  // Кнопки "в избранное"
  grid.querySelectorAll('.product-fav').forEach(btn => {
    btn.removeEventListener('click', btn._favHandler);
    btn._favHandler = function(e) {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      if (!card) return;
      const id = card.getAttribute('onclick')?.match(/id=([^']+)/)?.[1] || card.dataset.productId;
      if (!id) return;
      let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (!favorites.includes(id)) {
        favorites.push(id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        btn.innerHTML = '&#10084;'; // filled heart
      } else {
        favorites = favorites.filter(favId => favId !== id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        btn.innerHTML = '&#9825;'; // empty heart
      }
    };
    btn.addEventListener('click', btn._favHandler);
    // Инициализация состояния
    const card = btn.closest('.product-card');
    const id = card?.getAttribute('onclick')?.match(/id=([^']+)/)?.[1] || card?.dataset.productId;
    if (id) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      btn.innerHTML = favorites.includes(id) ? '&#10084;' : '&#9825;';
    }
  });
  // Кнопки "в корзину"
  grid.querySelectorAll('.product-cart').forEach(btn => {
    btn.removeEventListener('click', btn._cartHandler);
    btn._cartHandler = function(e) {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      if (!card) return;
      const id = card.getAttribute('onclick')?.match(/id=([^']+)/)?.[1] || card.dataset.productId;
      if (!id) return;
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const found = cart.find(item => item.id === id);
      if (found) {
        found.qty = (found.qty || 1) + 1;
      } else {
        cart.push({ id, qty: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      // Можно добавить уведомление или визуальный отклик
    };
    btn.addEventListener('click', btn._cartHandler);
  });
}

function attachRemoveHandlers(container) {
  if (!container) return;
  // Удаление из избранного
  container.querySelectorAll('.remove-fav-btn').forEach(btn => {
    btn.removeEventListener('click', btn._removeFavHandler);
    btn._removeFavHandler = function(e) {
      e.stopPropagation();
      const id = btn.dataset.productId;
      if (!id) return;
      let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      favorites = favorites.filter(favId => favId !== id);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      // Удалить элемент из DOM или перерисовать список
      const item = btn.closest('.favorite-item, .cart-item');
      if (item) item.remove();
    };
    btn.addEventListener('click', btn._removeFavHandler);
  });
  // Удаление из корзины
  container.querySelectorAll('.remove-cart-btn').forEach(btn => {
    btn.removeEventListener('click', btn._removeCartHandler);
    btn._removeCartHandler = function(e) {
      e.stopPropagation();
      const id = btn.dataset.productId;
      if (!id) return;
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart = cart.filter(item => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(cart));
      // Удалить элемент из DOM или перерисовать список
      const item = btn.closest('.cart-item');
      if (item) item.remove();
    };
    btn.addEventListener('click', btn._removeCartHandler);
  });
}