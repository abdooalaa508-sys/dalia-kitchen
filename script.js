// State
let cart = [];
let discount = 0; // Value of discount
let deliveryMethod = 'delivery';
let siteSettings = {}; // Global settings from Firebase

// Helper: Get delivery fee from admin settings
function getDeliveryFee() {
    return parseInt(siteSettings.deliveryFee) || 0;
}
let allProducts = []; // Source of truth

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartBtn = document.getElementById('close-cart');
const overlay = document.getElementById('overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElement = document.querySelector('.cart-count');
const tabBtns = document.querySelectorAll('.tab-btn');

// Checkout Elements
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount-amount');
const finalTotalEl = document.getElementById('final-total');
const promoInput = document.getElementById('promo-code');
const applyPromoBtn = document.getElementById('apply-promo');
const phoneInput = document.getElementById('user-phone');
const addressInput = document.getElementById('user-address');
const addressGroup = document.getElementById('address-group');
const deliveryRadios = document.getElementsByName('delivery');

// Slider State
let currentSlide = 0;
const galleryImages = [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=1980&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop"
];

// Initialize
function init() {
    // 1. Load Settings from Firebase
    db.ref('siteSettings').on('value', (snapshot) => {
        siteSettings = snapshot.val() || {};
        applySettings(siteSettings);
        updateCartUI(); // Update UI in case delivery fee changed
    });

    // 2. Load Products from Firebase
    db.ref('products').on('value', (snapshot) => {
        allProducts = snapshot.val() || [];
        renderProducts(allProducts);
    });

    renderSlider(); 
    checkVisitor();
    setupEventListeners();
    startAutoSlide(); 
}

function applySettings(settings) {
    if (settings.primary) document.documentElement.style.setProperty('--primary-color', settings.primary);
    if (settings.secondary) document.documentElement.style.setProperty('--secondary-color', settings.secondary);
    const logo = document.querySelector('.logo img');
    if (logo && settings.logo) {
        logo.src = settings.logo;
        const favicon = document.getElementById('favicon');
        if (favicon) favicon.href = settings.logo;
    }
    const hero = document.querySelector('.hero');
    if (hero && settings.hero) hero.style.backgroundImage = `url('${settings.hero}')`;

    if (settings.aboutTitle) {
        const aboutTitle = document.querySelector('.about-text h2');
        if (aboutTitle) aboutTitle.textContent = settings.aboutTitle;
    }
    if (settings.aboutText) {
        const aboutTextDiv = document.querySelector('.about-text');
        const paragraphs = settings.aboutText.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
        if (aboutTextDiv) {
            const titleEl = aboutTextDiv.querySelector('h2');
            if (titleEl) {
                const title = titleEl.outerHTML;
                aboutTextDiv.innerHTML = title + paragraphs;
            }
        }
    }
    if (settings.aboutImage) {
        const aboutImg = document.querySelector('.about-grid img');
        if (aboutImg) aboutImg.src = settings.aboutImage;
    }
}

function renderSlider() {
    const slider = document.getElementById('main-slider');
    if (!slider) return;
    
    slider.innerHTML = galleryImages.map(img => `
        <div class="slide">
            <img src="${img}" alt="Customer Dish">
        </div>
    `).join('');
}

function moveSlide(direction) {
    const slider = document.getElementById('main-slider');
    const totalSlides = galleryImages.length;
    
    currentSlide += direction;
    
    if (currentSlide >= totalSlides) currentSlide = 0;
    if (currentSlide < 0) currentSlide = totalSlides - 1;
    
    slider.style.transform = `translateX(${currentSlide * 100}%)`; // RTL logic ensures correct shift
}

function startAutoSlide() {
    setInterval(() => moveSlide(1), 5000);
}

function checkVisitor() {
    if (!localStorage.getItem('isRegistered')) {
        document.getElementById('visitor-modal').style.display = 'block';
    }
}

// Render Products
function renderProducts(items) {
    menuGrid.innerHTML = items.map(product => {
        let cookingHtml = '';
        if (product.hasCookingOption || (product.cookingFee && product.cookingFee > 0)) {
            cookingHtml = `
            <div style="margin: 10px 0;">
                <label style="font-size:0.9rem; color:#777;">طريقة التحضير:</label>
                <select id="prepare-${product.id}" class="form-control" style="padding:5px; height:auto;">
                    <option value="raw">على التسوية (سعر المنيو)</option>
                    <option value="cooked">مستوي (+${product.cookingFee || 0} ج.م)</option>
                </select>
            </div>`;
        }

        return `
        <div class="menu-item">
            <img src="${product.image}" alt="${product.name}" class="menu-img">
            <div class="menu-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                ${cookingHtml}
                <div class="price-row">
                    <span class="price">${product.price} ج.م</span>
                    <button class="add-btn" onclick="addToCart(${product.id})">أضف للسلة</button>
                </div>
            </div>
        </div>
    `}).join('');
}

// Helper: Fill Checkout Fields
function fillCheckoutFields() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        if (phoneInput) phoneInput.value = user.phone;
        if (addressInput) addressInput.value = user.address;

        // Auto-select "Delivery" if address exists
        if (user.address && user.address.length > 2) {
            deliveryRadios.forEach(r => {
                if (r.value === 'delivery') r.checked = true;
            });
            deliveryMethod = 'delivery';
            addressGroup.classList.remove('hidden');
        }
    }
}

// ... existing code ...
// Filter Products
function filterProducts(category) {
    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        renderProducts(allProducts.filter(p => p.category === category));
    }
}

// Add to Cart
window.addToCart = function (id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    let finalPrice = product.price;
    let nameSuffix = '';
    let cartId = `${product.id}`; // Default ID

    const select = document.getElementById(`prepare-${product.id}`);
    if (select) {
        if (select.value === 'cooked') {
            finalPrice += parseInt(product.cookingFee || 0);
            nameSuffix = ' (مستوي)';
            cartId = `${product.id}-cooked`;
        } else {
            cartId = `${product.id}-raw`;
            nameSuffix = ' (على التسوية)';
        }
    }

    const existingItem = cart.find(item => item.cartId === cartId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            name: product.name + nameSuffix,
            price: finalPrice,
            quantity: 1,
            cartId: cartId
        });
    }

    updateCartUI();
    openCart();
};

// Decrease Quantity
window.decreaseQty = function (cartId) {
    const item = cart.find(i => i.cartId === cartId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            cart = cart.filter(i => i.cartId !== cartId);
        }
        updateCartUI();
    }
};

// Increase Quantity
window.increaseQty = function (cartId) {
    const item = cart.find(i => i.cartId === cartId);
    if (item) {
        item.quantity++;
        updateCartUI();
    }
};

// Remove from Cart
window.removeFromCart = function (cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    if (cart.length === 0) discount = 0;
    updateCartUI();
};

// Update Cart UI
function updateCartUI() {
    // Counts
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalCount;
    });

    // Items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">لسه مفيش طلبات، جرب المنيو!</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="decreaseQty('${item.cartId}')">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="increaseQty('${item.cartId}')">+</button>
                    </div>
                    <div style="margin-top: 5px;">
                        <span class="cart-item-price">${item.price * item.quantity} ج.م</span>
                    </div>
                </div>
                <button class="remove-btn" onclick="removeFromCart('${item.cartId}')">حذف</button>
            </div>
        `).join('');
    }

    // Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountValue = Math.round(subtotal * discount);

    subtotalEl.textContent = `${subtotal} ج.م`;
    discountEl.textContent = `-${discountValue} ج.م`;

    // Delivery fee row
    const deliveryFeeRow = document.getElementById('delivery-fee-row');
    const deliveryFeeInput = document.getElementById('delivery-fee-input');
    if (deliveryFeeRow && deliveryFeeInput) {
        if (deliveryMethod === 'delivery') {
            deliveryFeeRow.style.display = 'flex';
            // Set default from admin only if input is empty or first load
            if (!deliveryFeeInput.dataset.userEdited) {
                deliveryFeeInput.value = getDeliveryFee();
            }
        } else {
            deliveryFeeRow.style.display = 'none';
        }
    }

    const deliveryFee = (deliveryMethod === 'delivery' && deliveryFeeInput) ? (parseInt(deliveryFeeInput.value) || 0) : 0;
    const total = subtotal - discountValue + deliveryFee;

    finalTotalEl.textContent = `${total} ج.م`;
}

// Sidebar Logic
function openCart() {
    cartSidebar.classList.add('open');
    overlay.classList.add('active');
}

function closeCart() {
    cartSidebar.classList.remove('open');
    overlay.classList.remove('active');
}

// Event Listeners
function setupEventListeners() {
    cartBtn.addEventListener('click', openCart);
    const mobileCartBtn = document.getElementById('mobile-cart-btn');
    if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCart);
    
    closeCartBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    // Mobile Nav Active State
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            mobileNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Slider Listeners
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    if (prevBtn) prevBtn.addEventListener('click', () => moveSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => moveSlide(1));

    // Download Menu PDF
    const downloadBtn = document.getElementById('download-menu-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', generateMenuPDF);

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts(btn.dataset.category);
        });
    });

    // Delivery Toggle
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            deliveryMethod = e.target.value;
            if (deliveryMethod === 'pickup') {
                addressGroup.classList.add('hidden');
            } else {
                addressGroup.classList.remove('hidden');
            }
            // Reset user-edited flag when switching delivery method
            const feeInput = document.getElementById('delivery-fee-input');
            if (feeInput) feeInput.dataset.userEdited = '';
            updateCartUI(); // Recalculate totals with/without delivery fee
        });
    });

    // Delivery Fee Input - recalculate on change
    const deliveryFeeInputEl = document.getElementById('delivery-fee-input');
    if (deliveryFeeInputEl) {
        deliveryFeeInputEl.addEventListener('input', () => {
            deliveryFeeInputEl.dataset.userEdited = 'true';
            updateCartUI();
        });
    }

    // Promo Code
    applyPromoBtn.addEventListener('click', () => {
        const code = promoInput.value.toUpperCase().trim();

        db.ref('promos').once('value').then((snapshot) => {
            const availablePromos = snapshot.val() || {};
            const promo = availablePromos[code];

            if (promo) {
                const today = new Date();
                const expirationDate = new Date(promo.expires);
                today.setHours(0, 0, 0, 0);

                if (today <= expirationDate) {
                    discount = promo.value;
                    alert(`تم تطبيق خصم ${discount * 100}% بنجاح!`);
                    updateCartUI();
                } else {
                    alert('كود الخصم منتهي الصلاحية');
                    discount = 0;
                    updateCartUI();
                }
            } else {
                alert('كود الخصم غير صحيح');
                discount = 0;
                updateCartUI();
            }
        });
    });

    // Save Visitor
    document.getElementById('save-visitor-btn').addEventListener('click', () => {
        const name = document.getElementById('visitor-name').value;
        const phone = document.getElementById('visitor-phone').value;
        const address = document.getElementById('visitor-address').value;

        if (name && phone) {
            const userData = { name, phone, address: address || '', date: new Date().toLocaleDateString() };
            userData.lastVisit = new Date().toLocaleString('ar-EG');

            // 1. Save to Firebase (Visitors Log)
            db.ref('visitors').once('value').then((snapshot) => {
                const visitors = snapshot.val() || [];
                visitors.push(userData);
                db.ref('visitors').set(visitors);
            });

            // 2. Save active session (Current User)
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('isRegistered', 'true');

            // 3. Auto-fill Checkout
            fillCheckoutFields();

            // Close Modal
            document.getElementById('visitor-modal').style.display = 'none';
        } else {
            alert('من فضلك ادخل اسمك ورقمك');
        }
    });

    // Print Invoice
    document.getElementById('print-btn').addEventListener('click', () => {
        const phone = phoneInput.value.trim() || 'غير مسجل';
        const address = addressInput.value.trim();

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountValue = Math.round(subtotal * discount);
        const feeInput = document.getElementById('delivery-fee-input');
        const deliveryFee = (deliveryMethod === 'delivery' && feeInput) ? (parseInt(feeInput.value) || 0) : 0;
        const total = subtotal - discountValue + deliveryFee;

        printReceipt(cart, { phone, address }, discountValue, total, deliveryFee);
    });

    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) return alert('السلة فاضية!');

        const phone = phoneInput.value.trim();
        const address = addressInput.value.trim();

        if (!phone) return alert('من فضلك ادخل رقم الموبايل');
        if (deliveryMethod === 'delivery' && !address) return alert('من فضلك ادخل العنوان بالتفصيل');

        // Build WhatsApp Message
        let message = `*طلب جديد من موقع مطبخ داليا*:%0a`;
        message += `------------------%0a`;

        cart.forEach(item => {
            message += `▫️ ${item.name} (x${item.quantity}) - ${item.price * item.quantity} ج.م%0a`;
        });

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountValue = Math.round(subtotal * discount);
        const feeInput3 = document.getElementById('delivery-fee-input');
        const deliveryFee = (deliveryMethod === 'delivery' && feeInput3) ? (parseInt(feeInput3.value) || 0) : 0;
        const total = subtotal - discountValue + deliveryFee;

        message += `------------------%0a`;
        message += `💰 *المجموع الفرعي:* ${subtotal} ج.م%0a`;
        if (discount > 0) message += `🏷️ *الخصم:* -${discountValue} ج.م%0a`;
        if (deliveryFee > 0) message += `🚚 *رسوم التوصيل:* +${deliveryFee} ج.م%0a`;
        message += `💵 *الإجمالي النهائي:* ${total} ج.م%0a`;

        message += `------------------%0a`;
        message += `👤 *بيانات العميل:*%0a`;
        message += `📱 تليفون: ${phone}%0a`;
        message += `🛵 طريقة الاستلام: ${deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من المطبخ'}%0a`;
        if (deliveryMethod === 'delivery') message += `📍 العنوان: ${address}%0a`;

        const shopPhone = "201155050300"; // Replace with Owner Number
        window.open(`https://wa.me/${shopPhone}?text=${message}`, '_blank');
    });
}

// Live Sync: Listen for changes from Admin Panel in other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'products' || e.key === 'siteSettings' || e.key === 'promos') {
        console.log('Data changed in another tab. Updating...');
        init(); // Re-render everything
    }
});

function generateMenuPDF() {
    db.ref('products').once('value').then((snapshot) => {
        const products = snapshot.val() || [];
        if (products.length === 0) return alert('المنيو خالي حالياً!');

        const menuWindow = window.open('', '_blank');
        const date = new Date().toLocaleDateString('ar-EG');
        const logoUrl = siteSettings.logo || 'صور/بروفيل_جديد.jpg';

        const itemsHtml = products.map(p => `
            <div style="border-bottom: 2px solid #f9f9f9; padding: 20px 0; display: flex; gap: 20px; align-items: center;">
                <img src="${p.image}" style="width: 100px; height: 100px; border-radius: 10px; object-fit: cover; border: 1px solid #eee;">
                <div style="flex: 1; text-align: right;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h3 style="margin: 0; color: #c0392b; font-size: 1.4rem;">${p.name}</h3>
                        <div style="font-weight: bold; font-size: 1.2rem; color: #333; background: #fef9f8; padding: 5px 10px; border-radius: 5px;">${p.price} ج.م</div>
                    </div>
                    <p style="margin: 8px 0 0; font-size: 0.95rem; color: #666; line-height: 1.4;">${p.description || ''}</p>
                </div>
            </div>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>منيو مطبخ داليا</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Cairo', sans-serif; padding: 40px; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #c0392b; padding-bottom: 20px; }
                .logo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid #c0392b; margin-bottom: 15px; }
                h1 { color: #c0392b; margin: 0; font-size: 2.5rem; }
                .footer { margin-top: 50px; text-align: center; font-size: 0.9rem; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${logoUrl}" class="logo">
                <h1>منيو مطبخ داليا</h1>
                <p style="font-size: 1.2rem;">أكل بيتي ... بطعم زمااااان</p>
                <p>تاريخ النسخة: ${date}</p>
            </div>
            <div class="menu-list">
                ${itemsHtml}
            </div>
            <div class="footer">
                <p>نورتونا وبألف هنا وشفا!</p>
                <p>لتحميل المنيو المتجدد والطلبات: 01155050300</p>
            </div>
            <script>window.print();</script>
        </body>
        </html>
        `;

        menuWindow.document.write(html);
        menuWindow.document.close();
    });
}

// Update last visit for returning users
(function updateLastVisit() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.phone) {
        db.ref('visitors').once('value').then((snapshot) => {
            let visitors = snapshot.val() || [];
            let visitorIndex = visitors.findIndex(v => v.phone === user.phone);
            if (visitorIndex > -1) {
                visitors[visitorIndex].lastVisit = new Date().toLocaleString('ar-EG');
                db.ref('visitors').set(visitors);
            }
        });
    }
})();

// Run
init();
