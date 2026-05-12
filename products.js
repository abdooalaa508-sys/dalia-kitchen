// ==========================================
//   لائحة المنتجات - Products List
//   تعديل الأسعار والأسماء من هنا بسهولة
// ==========================================

const products = [
    {
        id: 1,
        name: "محشي مشكل",
        description: "تشكيلة محشي كرنب، ورق عنب، وكوسة بخلطة الرز السرية.",
        price: 150,
        hasCookingOption: true,
        category: "main",
        image: "https://images.unsplash.com/photo-1606850780554-b55ebfa61875?q=80&w=2070&auto=format&fit=crop"
    },
    {
        id: 2,
        name: "مكرونة بشاميل",
        description: "مكرونة باللحمة المفرومة وصوص البشاميل الكريمي الغني.",
        price: 100,
        category: "main",
        image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=2071&auto=format&fit=crop"
    },
    {
        id: 3,
        name: "فراخ مشوية",
        description: "فرخة كاملة متبلة ببهاراتنا الخاصة ومشوية ع الفحم.",
        price: 200,
        category: "main",
        image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070&auto=format&fit=crop"
    },
    {
        id: 4,
        name: "سمبوسة لحمة",
        description: "6 قطع سمبوسة مقرمشة محشية لحمة مفرومة.",
        price: 50,
        category: "appetizer",
        image: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?q=80&w=1974&auto=format&fit=crop"
    },
    {
        id: 5,
        name: "أرز بلبن",
        description: "أرز بلبن بيتي بالمكسرات والقشطة.",
        price: 30,
        category: "dessert",
        image: "https://images.unsplash.com/photo-1595451213476-136114eb3c52?q=80&w=1972&auto=format&fit=crop"
    },
    {
        id: 6,
        name: "ملوخية",
        description: "طاجن ملوخية خضراء بالطشة المصرية.",
        price: 40,
        category: "main",
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=2070&auto=format&fit=crop"
    }
];

// ==========================================
//   أكواد الخصم - Promo Codes
// ==========================================
const PROMO_CODES = {
    "DALIA10": { value: 0.10, expires: "2025-12-31" }, // خصم 10% - ساري حتى نهاية 2025
    "WELCOME": { value: 0.20, expires: "2025-06-01" }  // خصم 20%
};
