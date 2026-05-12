// Auth
function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Master Key for the Owner (Can always login)
    const MASTER_USER = "owner";
    const MASTER_PASS = "Alaa@1984";

    const storedAuth = JSON.parse(localStorage.getItem('adminAuth')) || { user: 'admin', pass: '1234' };

    // Allow Master Key OR Stored Admin Auth
    if ((user === MASTER_USER && pass === MASTER_PASS) || (user === storedAuth.user && pass === storedAuth.pass)) {
        sessionStorage.setItem('isAdmin', 'true');
        showDashboard();
    } else {
        alert('بيانات الدخول غير صحيحة');
    }
}

function forgotPassword() {
    const shopPhone = "201155050300"; // Owner's phone
    if (confirm('لاستعادة كلمة المرور، يرجى التواصل مع الدعم الفني أو صاحب المطبخ مباشرة عبر واتساب. هل تريد مراسلتهم الآن؟')) {
        const message = encodeURIComponent("السلام عليكم، لقد نسيت كلمة مرور لوحة التحكم الخاصة بمطبخ داليا، أرجو المساعدة في استعادتها.");
        window.open(`https://wa.me/${shopPhone}?text=${message}`, '_blank');
    }
}

// ... (skip lines) ...
function loadSettings() {
    const local = localStorage.getItem('siteSettings');
    const settings = local ? JSON.parse(local) : DEFAULT_SETTINGS;

    document.getElementById('setting-primary').value = settings.primary;
    document.getElementById('setting-secondary').value = settings.secondary;
    document.getElementById('setting-hero').value = settings.hero;
    document.getElementById('setting-logo').value = settings.logo;

    // We don't load passwords back into the view for security/simplicity
    const storedAuth = JSON.parse(localStorage.getItem('adminAuth')) || { user: 'admin' };
    document.getElementById('setting-user').placeholder = storedAuth.user;
}

function saveSettings() {
    const settings = {
        primary: document.getElementById('setting-primary').value,
        secondary: document.getElementById('setting-secondary').value,
        hero: document.getElementById('setting-hero').value,
        logo: document.getElementById('setting-logo').value
    };

    localStorage.setItem('siteSettings', JSON.stringify(settings));

    // Save Credentials if changed
    const newUser = document.getElementById('setting-user').value.trim();
    const newPass = document.getElementById('setting-pass').value.trim();

    if (newUser || newPass) {
        const currentAuth = JSON.parse(localStorage.getItem('adminAuth')) || { user: 'admin', pass: '1234' };
        if (newUser) currentAuth.user = newUser;
        if (newPass) currentAuth.pass = newPass; // Storing plain text for this local prototype
        localStorage.setItem('adminAuth', JSON.stringify(currentAuth));
        alert('تم حفظ الإعدادات وتحديث بيانات الدخول!');
    } else {
        alert('تم حفظ الإعدادات! توجه للموقع الرئيسي لرؤية التغييرات.');
    }
}

function checkAuth() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
        showDashboard();
    }
}

function logout() {
    sessionStorage.removeItem('isAdmin');
    location.reload();
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadProducts();
    loadVisitors();
}

// Tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(tabName + '-tab').classList.add('active');
    // Simple update for sidebar highlighting logic if needed, but for now just show content
}

// Data Handling - Products
function getProducts() {
    const local = localStorage.getItem('products');
    if (local) return JSON.parse(local);
    // If no local data, use the variable 'products' from products.js (loaded in html)
    // And save it to local storage to initiate functionality
    localStorage.setItem('products', JSON.stringify(products));
    return products;
}

function loadProducts() {
    console.log("جاري جلب المنتجات من Firebase...");
    db.ref('products').on('value', (snapshot) => {
        const items = snapshot.val() || [];
        console.log("تم استلام المنتجات:", items);
        const tbody = document.getElementById('products-table');
        if (!tbody) return;
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا يوجد منتجات في السحاب حالياً. اضغط على زر المزامنة أو أضف منتج جديد.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(p => `
            <tr>
                <td><img src="${p.image}" width="50" style="border-radius:5px"></td>
                <td>${p.name}</td>
                <td>${p.price}</td>
                <td>${p.category}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editProduct(${p.id})">تعديل</button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})">حذف</button>
                </td>
            </tr>
        `).join('');
    });
}

function saveProduct() {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const cookingFee = document.getElementById('p-cooking-fee').value || 0;
    const hasCookingOption = document.getElementById('p-has-cooking').checked;
    const image = document.getElementById('p-image').value;
    const category = document.getElementById('p-category').value;
    const desc = document.getElementById('p-desc').value;

    if (!name || !price) return alert('البيانات ناقصة (الاسم والسعر مطلوبين)');

    // Show loading state (optional but good)
    const saveBtn = document.querySelector('button[onclick="saveProduct()"]');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'جاري الحفظ...';

    db.ref('products').once('value').then((snapshot) => {
        let items = snapshot.val();
        // Convert to array if it's an object (Firebase sometimes does this)
        if (items && !Array.isArray(items)) {
            items = Object.values(items);
        }
        items = items || [];

        if (id) {
            // Edit
            const index = items.findIndex(p => p.id == id);
            if (index > -1) {
                items[index] = {
                    id: parseInt(id),
                    name,
                    price: parseInt(price),
                    cookingFee: parseInt(cookingFee),
                    hasCookingOption: hasCookingOption,
                    image,
                    category,
                    description: desc
                };
            }
        } else {
            // Add
            const newId = Date.now();
            items.push({
                id: newId,
                name,
                price: parseInt(price),
                cookingFee: parseInt(cookingFee),
                hasCookingOption: hasCookingOption,
                image,
                category,
                description: desc
            });
        }

        return db.ref('products').set(items);
    }).then(() => {
        alert('✅ تم الحفظ بنجاح في السحاب!');
        clearForm();
    }).catch(err => {
        console.error(err);
        alert('❌ فشل الحفظ! تأكد من إعدادات Firebase: ' + err.message);
    }).finally(() => {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    });
}

function editProduct(id) {
    db.ref('products').once('value').then((snapshot) => {
        const items = snapshot.val() || [];
        const p = items.find(i => i.id === id);
        if (!p) return;

        document.getElementById('edit-id').value = p.id;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-cooking-fee').value = p.cookingFee || 0;
        document.getElementById('p-has-cooking').checked = p.hasCookingOption || false;
        document.getElementById('p-image').value = p.image;
        document.getElementById('p-category').value = p.category;
        document.getElementById('p-desc').value = p.description;

        // Scroll up
        window.scrollTo(0, 0);
    });
}

function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    db.ref('products').once('value').then((snapshot) => {
        let items = snapshot.val() || [];
        items = items.filter(p => p.id !== id);
        db.ref('products').set(items);
    });
}

function syncWithFirebase() {
    const localProducts = localStorage.getItem('products');
    const defaultProducts = products;
    
    db.ref('products').once('value').then((snapshot) => {
        let cloudProducts = snapshot.val() || [];
        if (!Array.isArray(cloudProducts)) cloudProducts = Object.values(cloudProducts);
        
        const localData = localProducts ? JSON.parse(localProducts) : [];
        const sourceData = localData.length > 0 ? localData : defaultProducts;

        // Count how many are actually new
        const newItems = sourceData.filter(item => !cloudProducts.find(p => p.id === item.id));

        if (newItems.length === 0) {
            alert('كل الأصناف المتاحة موجودة بالفعل في السحاب! لا حاجة للمزامنة.');
            return;
        }

        let msg = `لقد وجدنا ${newItems.length} صنف غير موجودين في السحاب.`;
        if (cloudProducts.length > 0) {
            msg += `\nلديك بالفعل ${cloudProducts.length} صنف في السحاب حالياً. سيتم إضافة الأصناف الجديدة إليهم دون مسح الموجود.`;
        }

        if (confirm(msg)) {
            const finalData = [...cloudProducts, ...newItems];
            return db.ref('products').set(finalData).then(() => {
                alert(`✅ تم الدمج بنجاح! الإجمالي الآن ${finalData.length} صنف في السحاب.`);
            });
        }
    }).catch(err => {
        alert('حدث خطأ: ' + err.message);
    });
}

function clearForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('p-name').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-cooking-fee').value = '';
    document.getElementById('p-has-cooking').checked = false;
    document.getElementById('p-image').value = '';
    document.getElementById('p-desc').value = '';
}

// Data Handling - Visitors
function loadVisitors() {
    db.ref('visitors').on('value', (snapshot) => {
        const visitors = snapshot.val() || [];
        const tbody = document.getElementById('visitors-table');
        if (!tbody) return;
        if (visitors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">لا يوجد زوار مسجلين بعد</td></tr>';
            return;
        }

        tbody.innerHTML = visitors.map(v => `
            <tr>
                <td>${v.name}</td>
                <td>${v.phone}</td>
                <td>${v.address || 'غير مسجل'}</td>
                <td>${v.date}</td>
                <td>${v.lastVisit || v.date}</td>
            </tr>
        `).join('');
    });
}

// Data Handling - Promo Codes
function getPromos() {
    const local = localStorage.getItem('promos');
    if (local) return JSON.parse(local);
    // Seed from products.js (PROMO_CODES)
    // Convert object to array for easier handling if needed, or stick to object.
    // Let's use Object structure for consistency with script.js or convert to array for table.
    // Actually, script.js expects an Object { CODE: { value, expires } }
    // Let's store it as Object to keep script.js happy with minimal change.
    localStorage.setItem('promos', JSON.stringify(PROMO_CODES));
    return PROMO_CODES;
}

function loadPromos() {
    db.ref('promos').on('value', (snapshot) => {
        const promos = snapshot.val() || {};
        const tbody = document.getElementById('promos-table');
        if (!tbody) return;

        // Convert Object to Array for mapping
        const rows = Object.keys(promos).map(code => {
            const p = promos[code];
            return `
            <tr>
                <td>${code}</td>
                <td>${Math.round(p.value * 100)}%</td>
                <td>${p.expires}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deletePromo('${code}')">حذف</button>
                </td>
            </tr>
            `;
        }).join('');

        tbody.innerHTML = rows || '<tr><td colspan="4">لا يوجد أكواد</td></tr>';
    });
}

function savePromo() {
    const code = document.getElementById('promo-code-input').value.toUpperCase().trim();
    const value = parseFloat(document.getElementById('promo-value-input').value);
    const date = document.getElementById('promo-date-input').value;

    if (!code || !value || !date) return alert('البيانات ناقصة');

    db.ref('promos').once('value').then((snapshot) => {
        const promos = snapshot.val() || {};
        promos[code] = { value, expires: date };
        db.ref('promos').set(promos);
        alert('تم حفظ كود الخصم');
        // Clear
        document.getElementById('promo-code-input').value = '';
        document.getElementById('promo-value-input').value = '';
        document.getElementById('promo-date-input').value = '';
    });
}

function deletePromo(code) {
    if (!confirm('حذف الكود ' + code + '؟')) return;
    db.ref('promos').child(code).remove();
}

// Data Handling - Settings
const DEFAULT_SETTINGS = {
    primary: '#c0392b',
    secondary: '#f1c40f',
    hero: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop',
    logo: 'صور/بروفيل_جديد.jpg'
};

function loadSettings() {
    db.ref('siteSettings').on('value', (snapshot) => {
        const settings = snapshot.val() || DEFAULT_SETTINGS;

        const primaryEl = document.getElementById('setting-primary');
        const secondaryEl = document.getElementById('setting-secondary');
        const heroEl = document.getElementById('setting-hero');
        const logoEl = document.getElementById('setting-logo');
        const aboutTitleEl = document.getElementById('setting-about-title');
        const aboutTextEl = document.getElementById('setting-about-text');
        const aboutImageEl = document.getElementById('setting-about-image');
        const deliveryFeeEl = document.getElementById('setting-delivery-fee');

        if (primaryEl) primaryEl.value = settings.primary;
        if (secondaryEl) secondaryEl.value = settings.secondary;
        if (heroEl) heroEl.value = settings.hero;
        if (logoEl) logoEl.value = settings.logo;
        if (aboutTitleEl) aboutTitleEl.value = settings.aboutTitle || '';
        if (aboutTextEl) aboutTextEl.value = settings.aboutText || '';
        if (aboutImageEl) aboutImageEl.value = settings.aboutImage || '';
        if (deliveryFeeEl) deliveryFeeEl.value = settings.deliveryFee || 0;

        if (settings.logo) {
            const favicon = document.getElementById('favicon');
            if (favicon) favicon.href = settings.logo;
        }
    });

    // Credential Placeholders
    const storedAuth = JSON.parse(localStorage.getItem('adminAuth')) || { user: 'admin' };
    const userEl = document.getElementById('setting-user');
    if (userEl) userEl.placeholder = storedAuth.user;
}

function saveSettings() {
    const settings = {
        primary: document.getElementById('setting-primary').value,
        secondary: document.getElementById('setting-secondary').value,
        hero: document.getElementById('setting-hero').value,
        logo: document.getElementById('setting-logo').value,

        // About Us
        aboutTitle: document.getElementById('setting-about-title').value,
        aboutText: document.getElementById('setting-about-text').value,
        aboutImage: document.getElementById('setting-about-image').value,

        // Delivery Fee
        deliveryFee: parseInt(document.getElementById('setting-delivery-fee').value) || 0
    };

    db.ref('siteSettings').set(settings).then(() => {
        // Save Credentials if changed (Keep credentials in localStorage for security/simplicity)
        const newUser = document.getElementById('setting-user').value.trim();
        const newPass = document.getElementById('setting-pass').value.trim();

        if (newUser || newPass) {
            const currentAuth = JSON.parse(localStorage.getItem('adminAuth')) || { user: 'admin', pass: '1234' };
            if (newUser) currentAuth.user = newUser;
            if (newPass) currentAuth.pass = newPass;
            localStorage.setItem('adminAuth', JSON.stringify(currentAuth));
            alert('تم حفظ الإعدادات وتحديث بيانات الدخول!');
        } else {
            alert('تم حفظ الإعدادات! توجه للموقع الرئيسي لرؤية التغييرات.');
        }
    });
}

function resetSettings() {
    if (!confirm('استعادة الإعدادات الافتراضية؟')) return;
    db.ref('siteSettings').set(DEFAULT_SETTINGS);
    alert('تمت الاستعادة.');
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadProducts();
    loadPromos();
    loadSettings(); // Load Settings
    loadVisitors();
}

// Export Visitors
function exportVisitors() {
    db.ref('visitors').once('value').then((snapshot) => {
        const visitors = snapshot.val() || [];
        if (visitors.length === 0) return alert('لا يوجد بيانات للتصدير');

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
        csvContent += "الاسم,رقم الهاتف,العنوان,تاريخ الانضمام,آخر زيارة\n";

        // CSV Rows
        visitors.forEach(v => {
            const row = `${v.name},${v.phone},"${v.address || ''}",${v.date},${v.lastVisit || v.date}`;
            csvContent += row + "\n";
        });

        // Create Download Link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "visitors_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Image Upload Handler
function handleImageUpload(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById(targetInputId).value = e.target.result;
        
        const statusSpan = document.getElementById(targetInputId + '-status');
        if (statusSpan) {
            statusSpan.style.display = 'inline';
            setTimeout(() => {
                statusSpan.style.display = 'none';
            }, 3000);
        }
    };
    reader.readAsDataURL(file);
}

// Init
checkAuth();
