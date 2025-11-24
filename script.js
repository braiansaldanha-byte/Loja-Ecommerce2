let products = [];
let allProducts = [];
let cart = [];
let orders = [];
let currentSlide = 0;
let currentFilter = 'all';
let map = null;
let userMarker = null;
let userLocation = null;

window.onload = function() {
    loadProducts();
    initSlider();
    setupSearch();
    setupFilters();
    initMap();
    loadOrders();
};

function getUserLocation() {
    const locationText = document.getElementById('user-location-text');
    
    if ("geolocation" in navigator) {
        locationText.textContent = 'Detectando sua localização...';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                reverseGeocode(userLocation.lat, userLocation.lng)
                    .then(address => {
                        locationText.innerHTML = `📍 <strong>${address}</strong><br><small>Latitude: ${userLocation.lat.toFixed(4)}, Longitude: ${userLocation.lng.toFixed(4)}</small>`;
                    })
                    .catch(() => {
                        locationText.textContent = `📍 Sua localização: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
                    });
                
                if (map && userMarker) {
                    map.removeLayer(userMarker);
                }
                
                if (map) {
                    userMarker = L.marker([userLocation.lat, userLocation.lng], {
                        title: 'Sua localização',
                        draggable: false
                    }).addTo(map);
                    
                    userMarker.bindPopup('<strong>📍 Você está aqui!</strong>', { autoClose: false }).openPopup();
                    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
                    
                    console.log('Marcador adicionado:', userLocation);
                } else {
                    console.warn('Mapa não inicializado ainda');
                }
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                locationText.textContent = '❌ Não foi possível obter sua localização. Usando localização padrão.';
                userLocation = { lat: -30.0346, lng: -51.2177 }; 
                if (map) {
                    map.setView([userLocation.lat, userLocation.lng], 12);
                }
            }
        );
    } else {
        locationText.textContent = '❌ Geolocalização não disponível no seu navegador.';
        userLocation = { lat: -30.0346, lng: -51.2177 };
    }
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
        if (!response.ok) throw new Error('Erro na API');
        
        const data = await response.json();
        const addr = data.address || {};
        
        const parts = [];
        
        if (addr.road || addr.street) {
            const street = addr.road || addr.street;
            const number = addr.house_number ? ` ${addr.house_number}` : '';
            parts.push(street + number);
        }
        
        if (addr.neighbourhood || addr.suburb) {
            parts.push(addr.neighbourhood || addr.suburb);
        }
        
        if (addr.city || addr.town || addr.village) {
            const city = addr.city || addr.town || addr.village;
            const state = addr.state ? `, ${addr.state}` : '';
            parts.push(city + state);
        }
        
        if (addr.country) {
            parts.push(addr.country);
        }
        
        return parts.length > 0 ? parts.join(' - ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        console.error('Erro no reverse geocoding:', error);
        throw error;
    }
}

function initMap() {
    setTimeout(() => {
        map = L.map('map').setView([-30.0346, -51.2177], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        getUserLocation();
    }, 500);
}

function initCharts() {
    const priceCtx = document.getElementById('priceChart');
    if (priceCtx) {
        new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [
                    {
                        label: products[0]?.title.substring(0, 20) || 'Produto 1',
                        data: [4500, 4300, 4100, 4000, 3900, 3800],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: products[1]?.title.substring(0, 20) || 'Produto 2',
                        data: [2800, 2700, 2600, 2500, 2400, 2300],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#e4e4e7' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(59, 130, 246, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(59, 130, 246, 0.1)' }
                    }
                }
            }
        });
    }
    
    const ratingCtx = document.getElementById('ratingChart');
    if (ratingCtx && products.length >= 5) {
        new Chart(ratingCtx, {
            type: 'bar',
            data: {
                labels: products.slice(0, 5).map(p => p.title.substring(0, 15) + '...'),
                datasets: [{
                    label: 'Avaliação',
                    data: products.slice(0, 5).map(p => p.rating),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(59, 130, 246, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

function loadOrders() {
    orders = [
        {
            id: 1001,
            date: '2025-11-10',
            items: 2,
            total: 5499.00,
            status: 'Entregue',
            statusColor: '#10b981'
        },
        {
            id: 1002,
            date: '2025-11-12',
            items: 1,
            total: 2799.00,
            status: 'Em Transporte',
            statusColor: '#3b82f6'
        },
        {
            id: 1003,
            date: '2025-11-13',
            items: 3,
            total: 8997.00,
            status: 'Processando',
            statusColor: '#fbbf24'
        }
    ];
    
    displayOrders();
}

function displayOrders() {
    const ordersList = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-cart">Você ainda não fez nenhum pedido 📦</div>';
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h3>Pedido #${order.id}</h3>
                    <p class="order-date">📅 ${new Date(order.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="order-status" style="background: ${order.statusColor}20; color: ${order.statusColor};">
                    ${order.status}
                </div>
            </div>
            <div class="order-details">
                <p><strong>${order.items}</strong> item(s)</p>
                <p class="order-total">R$ ${order.total.toFixed(2)}</p>
            </div>
            <button class="btn-track" onclick="showNotification('🚚 Rastreamento em desenvolvimento')">
                Rastrear Pedido
            </button>
        </div>
    `).join('');
}

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('slide-dots');
    
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (index === 0) dot.classList.add('active');
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
    }, 5000);
}

function goToSlide(index) {
    currentSlide = index;
    updateSlider();
}

function updateSlider() {
    const container = document.getElementById('slide-container');
    const dots = document.querySelectorAll('.dot');
    
    container.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

async function loadProducts() {
    try {
        const [laptops, phones] = await Promise.all([
            fetch('https://dummyjson.com/products/category/laptops').then(r => r.json()),
            fetch('https://dummyjson.com/products/category/smartphones').then(r => r.json())
        ]);

        allProducts = [
            ...laptops.products.map(p => ({...p, category: 'laptops', stock: Math.floor(Math.random() * 50) + 5})),
            ...phones.products.map(p => ({...p, category: 'smartphones', stock: Math.floor(Math.random() * 50) + 5}))
        ];

        products = allProducts;
        displayProducts();
        updateStats();
        initCharts();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function displayProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    products.forEach(product => {
        const price = (product.price * 5.5).toFixed(2);
        const stockClass = product.stock < 10 ? 'low' : product.stock < 30 ? 'medium' : 'high';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-details">
                    <div class="product-price">R$ ${price}</div>
                    <div class="product-stock ${stockClass}">
                        <span class="material-symbols-outlined" style="font-size: 1rem;">inventory</span>
                        ${product.stock} un.
                    </div>
                </div>
                <div class="product-rating">
                    <span>⭐</span>
                    ${product.rating}/5
                </div>
                <button class="btn-add-cart" onclick="addToCart(${product.id})">
                    Adicionar ao Carrinho
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateStats() {
    document.getElementById('total-products').textContent = products.length;
    
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    document.getElementById('total-stock').textContent = totalStock;
    
    const avgPrice = products.reduce((sum, p) => sum + (p.price * 5.5), 0) / products.length;
    document.getElementById('avg-price').textContent = `R$ ${avgPrice.toFixed(0)}`;
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterProducts(query);
    });
}

function filterProducts(query) {
    let filtered = allProducts;
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    
    if (query) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query)
        );
    }
    
    products = filtered;
    displayProducts();
    updateStats();
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentFilter = btn.dataset.filter;
            const searchQuery = document.getElementById('search-input').value;
            filterProducts(searchQuery);
        });
    });
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartCount();
        showNotification('✅ Produto adicionado ao carrinho!');
    }
}

function updateCartCount() {
    document.getElementById('cart-count').textContent = cart.length;
}

function toggleCart() {
    document.getElementById('cart-modal').classList.add('active');
    displayCart();
}

function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Seu carrinho está vazio 😢</div>';
        cartTotal.innerHTML = '';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach((product, index) => {
        const price = product.price * 5.5;
        total += price;
        
        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}">
            <div class="cart-item-info">
                <div class="cart-item-title">${product.title}</div>
                <div class="cart-item-price">R$ ${price.toFixed(2)}</div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">Remover</button>
        `;
        cartItems.appendChild(item);
    });
    
    cartTotal.innerHTML = `Total: R$ ${total.toFixed(2)}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    displayCart();
}

function checkoutCart() {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, p) => sum + (p.price * 5.5), 0);
    
    closeModal('cart-modal');
    
    const modal = document.getElementById('purchase-modal');
    const details = document.getElementById('purchase-details');
    
    details.innerHTML = `
        <p style="color: #cbd5e1; margin-bottom: 0.5rem;"><strong>Itens:</strong> ${cart.length} produto(s)</p>
        <p style="color: #cbd5e1;"><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
    `;
    
    document.getElementById('qrcode').innerHTML = '';
    new QRCode(document.getElementById('qrcode'), {
        text: `PIX:${total.toFixed(2)}:TechStore:${Date.now()}`,
        width: 200,
        height: 200
    });
    
    modal.classList.add('active');
    
    setTimeout(() => {
        const newOrder = {
            id: 1000 + orders.length + 1,
            date: new Date().toISOString().split('T')[0],
            items: cart.length,
            total: total,
            status: 'Processando',
            statusColor: '#fbbf24'
        };
        orders.unshift(newOrder);
        displayOrders();
        cart = [];
        updateCartCount();
        closeModal('purchase-modal');
        showNotification('✅ Pedido realizado com sucesso!');
    }, 3000);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showNotification(message) {
    alert(message);
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};