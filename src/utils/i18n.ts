import { useEffect, useState } from 'react';

export interface LanguageConfig {
  code: string;        // Unique identifier
  name: string;        // Display name
  nativeName: string;  // Label in dropdown
  flag: string;        // Flag emoji
  currency: string;    // ISO currency code
  symbol: string;      // Currency symbol
  rate: number;        // Exchange rate relative to 1 KES
  googleCode: string;  // Code passed to Google Translate
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English (Ksh)', nativeName: 'English (Ksh)', flag: '🇬🇧', currency: 'KES', symbol: 'Ksh', rate: 1, googleCode: 'en' },
  { code: 'sw', name: 'Kiswahili', nativeName: 'Kiswahili (Ksh)', flag: '🇰🇪', currency: 'KES', symbol: 'Ksh', rate: 1, googleCode: 'sw' },
  { code: 'fr', name: 'Français', nativeName: 'Français (€ EUR)', flag: '🇫🇷', currency: 'EUR', symbol: '€', rate: 0.0071, googleCode: 'fr' },
  { code: 'es', name: 'Español', nativeName: 'Español (€ EUR)', flag: '🇪🇸', currency: 'EUR', symbol: '€', rate: 0.0071, googleCode: 'es' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch (€ EUR)', flag: '🇩🇪', currency: 'EUR', symbol: '€', rate: 0.0071, googleCode: 'de' },
  { code: 'zh', name: 'Chinese (中文)', nativeName: '中文 (¥ CNY)', flag: '🇨🇳', currency: 'CNY', symbol: '¥', rate: 0.056, googleCode: 'zh-CN' },
  { code: 'ar', name: 'Arabic (العربية)', nativeName: 'العربية (د.إ AED)', flag: '🇦🇪', currency: 'AED', symbol: 'د.إ', rate: 0.028, googleCode: 'ar' },
  { code: 'hi', name: 'Hindi (हिन्दी)', nativeName: 'हिन्दी (₹ INR)', flag: '🇮🇳', currency: 'INR', symbol: '₹', rate: 0.65, googleCode: 'hi' },
  { code: 'ja', name: 'Japanese (日本語)', nativeName: '日本語 (¥ JPY)', flag: '🇯🇵', currency: 'JPY', symbol: '¥', rate: 1.20, googleCode: 'ja' },
  { code: 'pt', name: 'Português', nativeName: 'Português (R$ BRL)', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', rate: 0.043, googleCode: 'pt' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano (€ EUR)', flag: '🇮🇹', currency: 'EUR', symbol: '€', rate: 0.0071, googleCode: 'it' },
  { code: 'usd', name: 'English ($ USD)', nativeName: 'English ($ USD)', flag: '🇺🇸', currency: 'USD', symbol: '$', rate: 0.0077, googleCode: 'en' },
  { code: 'so', name: 'Soomaali', nativeName: 'Soomaali (Ksh)', flag: '🇸🇴', currency: 'KES', symbol: 'Ksh', rate: 1, googleCode: 'so' },
];

// Memory state for current active language
let currentLangCode: string = (() => {
  try {
    return localStorage.getItem('kipchimatt_language') || 'en';
  } catch {
    return 'en';
  }
})();

// Listeners for dynamic reactive updates
const listeners = new Set<() => void>();

export function getActiveLanguage(): LanguageConfig {
  return LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];
}

export function setLanguageCode(code: string) {
  const found = LANGUAGES.find(l => l.code === code);
  if (!found) return;

  currentLangCode = code;
  try {
    localStorage.setItem('kipchimatt_language', code);
  } catch {}

  // Apply Google Translate Cookie & Event
  applyGoogleTranslate(found.googleCode);

  // Notify subscriber components
  listeners.forEach(fn => fn());
}

export function formatMoneyWithActiveCurrency(amountInKes: number): string {
  const lang = getActiveLanguage();
  const val = (amountInKes || 0) * lang.rate;

  if (lang.currency === 'KES') {
    return `Ksh ${Math.round(val).toLocaleString('en-KE')}`;
  }
  if (lang.currency === 'USD') {
    return `$${val.toFixed(2)}`;
  }
  if (lang.currency === 'EUR') {
    return `€${val.toFixed(2)}`;
  }
  if (lang.currency === 'CNY') {
    return `¥${val.toFixed(2)}`;
  }
  if (lang.currency === 'JPY') {
    return `¥${Math.round(val).toLocaleString('ja-JP')}`;
  }
  if (lang.currency === 'AED') {
    return `د.إ ${val.toFixed(2)}`;
  }
  if (lang.currency === 'INR') {
    return `₹${val.toFixed(2)}`;
  }
  if (lang.currency === 'BRL') {
    return `R$ ${val.toFixed(2)}`;
  }

  return `${lang.symbol} ${val.toFixed(2)}`;
}

// Google Translate Bridge
export function applyGoogleTranslate(googleCode: string) {
  try {
    // Set googtrans cookie
    const domain = window.location.hostname;
    document.cookie = `googtrans=/en/${googleCode}; path=/;`;
    if (domain) {
      document.cookie = `googtrans=/en/${googleCode}; domain=${domain}; path=/;`;
    }

    // Trigger select element if Google Translate is active
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = googleCode;
      select.dispatchEvent(new Event('change'));
    }
  } catch (err) {
    console.error("Google translate apply error", err);
  }
}

// Hook to make components automatically re-render when language or currency changes
export function useLanguage() {
  const [lang, setLangState] = useState<LanguageConfig>(getActiveLanguage);

  useEffect(() => {
    applyGoogleTranslate(lang.googleCode);

    const handler = () => {
      setLangState(getActiveLanguage());
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [lang.googleCode]);

  return {
    language: lang,
    languages: LANGUAGES,
    setLanguage: setLanguageCode,
    formatMoney: formatMoneyWithActiveCurrency,
    t: (key: string) => translateKey(key, lang.code),
  };
}

// Dictionary translations for core UI terms
const DICTIONARY: Record<string, Record<string, string>> = {
  customer_care: {
    en: 'Customer Care',
    sw: 'Huduma kwa Wateja',
    fr: 'Service Client',
    es: 'Atención al Cliente',
    de: 'Kundenservice',
    zh: '客户服务',
    ar: 'خدمة العملاء',
    hi: 'ग्राहक सेवा',
    ja: 'カスタマーケア',
    pt: 'Atendimento ao Cliente',
    it: 'Servizio Clienti',
    so: 'Adeega Macmiilka',
  },
  store_locator: {
    en: 'Store Locator',
    sw: 'Tafuta Duka',
    fr: 'Nos Magasins',
    es: 'Tiendas',
    de: 'Filialfinder',
    zh: '门店查询',
    ar: 'مواقع الفروع',
    hi: 'स्टोर खोजें',
    ja: '店舗検索',
    pt: 'Localizador de Lojas',
    it: 'Trova Negozio',
    so: 'Raadi Bakhaarka',
  },
  track_order: {
    en: 'Track Order',
    sw: 'Fuatilia Oda',
    fr: 'Suivre Commande',
    es: 'Rastrear Pedido',
    de: 'Bestellung Verfolgen',
    zh: '追踪订单',
    ar: 'تتبع الطلب',
    hi: 'ऑर्डर ट्रैक करें',
    ja: '注文追跡',
    pt: 'Rastrear Pedido',
    it: 'Traccia Ordine',
    so: 'La-soco Amarka',
  },
  todays_deals: {
    en: "Today's Deals",
    sw: 'Ofa za Leo',
    fr: 'Offres du Jour',
    es: 'Ofertas de Hoy',
    de: 'Tagesangebote',
    zh: '今日优惠',
    ar: 'عروض اليوم',
    hi: 'आज के डील्स',
    ja: '本日のセール',
    pt: 'Ofertas de Hoje',
    it: 'Offerte del Giorno',
    so: 'Pirosoofiyada Maanta',
  },
  fresh_produce: {
    en: 'Fresh Produce',
    sw: 'Matunda na Mboga',
    fr: 'Produits Frais',
    es: 'Productos Frescos',
    de: 'Frische Produkte',
    zh: '生鲜果蔬',
    ar: 'منتجات طازجة',
    hi: 'ताजी उपज',
    ja: '生鮮食品',
    pt: 'Hortifrúti',
    it: 'Prodotti Freschi',
    so: 'Khdaarta & Miraha',
  },
  liquor_cellar: {
    en: 'Liquor Cellar',
    sw: 'Duka la Vinywaji',
    fr: 'Cave à Liqueurs',
    es: 'Bodega de Licores',
    de: 'Getränke & Spirituosen',
    zh: '名酒酒窖',
    ar: 'قسم المشروبات',
    hi: 'शराब संग्रह',
    ja: 'リカーショップ',
    pt: 'Adega de Bebidas',
    it: 'Enoteca & Liquori',
    so: 'Cabitaanka',
  },
  all_departments: {
    en: 'All Departments',
    sw: 'Idara Zote',
    fr: 'Tous les Rayons',
    es: 'Todos los Departamentos',
    de: 'Alle Kategorien',
    zh: '所有部门',
    ar: 'جميع الأقسام',
    hi: 'सभी विभाग',
    ja: '全部門',
    pt: 'Todos os Departamentos',
    it: 'Tutti i Reparti',
    so: 'Lamaaha Dhammaan',
  },
  search_placeholder: {
    en: 'Search Kipchimatt Supermarket...',
    sw: 'Tafuta Kipchimatt Supermarket...',
    fr: 'Rechercher sur Kipchimatt...',
    es: 'Buscar en Kipchimatt...',
    de: 'Suchen bei Kipchimatt...',
    zh: '搜索 Kipchimatt 超市...',
    ar: 'البحث في كيبشيمات سوبرماركت...',
    hi: 'Kipchimatt सुपरमार्केट में खोजें...',
    ja: 'Kipchimatt スーパーで検索...',
    pt: 'Pesquisar no Kipchimatt...',
    it: 'Cerca su Kipchimatt...',
    so: 'Raadi Kipchimatt Supermarket...',
  },
  free_delivery: {
    en: 'Free Delivery over',
    sw: 'Uwasilishaji Bure juu ya',
    fr: 'Livraison Gratuite dès',
    es: 'Envío Gratis desde',
    de: 'Kostenlose Lieferung ab',
    zh: '满额免运费',
    ar: 'توصيل مجاني فوق',
    hi: 'निःशुल्क डिलीवरी से अधिक',
    ja: '無料配送 条件:',
    pt: 'Frete Grátis acima de',
    it: 'Spedizione Gratuita oltre',
    so: 'Gaarsiinta Bilaashka ah ka kor',
  },
  admin_portal: {
    en: 'Admin Portal',
    sw: 'Tovuti ya Wasimamizi',
    fr: 'Espace Admin',
    es: 'Portal de Admin',
    de: 'Admin-Portal',
    zh: '管理后台',
    ar: 'لوحة الإدارة',
    hi: 'एडमिन पोर्टल',
    ja: '管理ポータル',
    pt: 'Portal Admin',
    it: 'Portale Admin',
    so: 'Xafiiska Maamulka',
  },
  cart: {
    en: 'Shopping Cart',
    sw: 'Kikapu cha Manunuzi',
    fr: 'Panier d\'Achat',
    es: 'Carrito de Compras',
    de: 'Warenkorb',
    zh: '购物车',
    ar: 'عربة التسوق',
    hi: 'शॉपिंग कार्ट',
    ja: 'ショッピングカート',
    pt: 'Carrinho de Compras',
    it: 'Carrello',
    so: 'Kabuubka Wax-iibsiga',
  },
  wishlist: {
    en: 'Wishlist',
    sw: 'Orodha ya Tamani',
    fr: 'Liste de Souhaits',
    es: 'Lista de Deseos',
    de: 'Wunschliste',
    zh: '心愿单',
    ar: 'قائمة الرغبات',
    hi: 'विशलिस्ट',
    ja: 'ウィッシュリスト',
    pt: 'Lista de Desejos',
    it: 'Lista dei Desideri',
    so: 'Liiska Rabitaanka',
  },
  deliver_to: {
    en: 'Deliver to',
    sw: 'Mapelekeo',
    fr: 'Librer à',
    es: 'Enviar a',
    de: 'Liefern an',
    zh: '配送至',
    ar: 'التوصيل إلى',
    hi: 'डिलीवरी स्थान',
    ja: 'お届け先',
    pt: 'Entregar em',
    it: 'Consegna a',
    so: 'U gee',
  }
};

export function translateKey(key: string, langCode: string): string {
  if (DICTIONARY[key]) {
    return DICTIONARY[key][langCode] || DICTIONARY[key]['en'] || key;
  }
  return key;
}
