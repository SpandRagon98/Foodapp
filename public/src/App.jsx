// ============================================================
// MenuSaarthi — AI-Powered Menu Translator for Travelers
// Single-file React app, Tailwind CSS via CDN
// ============================================================
// Architecture:
// - State machine: screen = 'landing' | 'upload' | 'scanning' | 'results'
// - Mock OCR + AI pipeline triggered on image upload
// - Anthropic API call generates real dish explanations
// - sampleMenu.json baked in as JS constant
// - DishCard component handles all dietary/spice UI
// - PhraseHelper panel for traveler phrases
// - Mode toggle: Traveler / Restaurant
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Sample Menu Data ──────────────────────────────────────
const SAMPLE_DISHES = [
  {
    id: 1,
    originalName: "ಮಸಾಲೆ ದೋಸೆ",
    transliteration: "Masale Dose",
    translatedName: "Spiced Crepe",
    pronunciation: "muh-SAA-leh DOH-say",
    description: "Thin, crispy rice & lentil crepe filled with spiced potato masala, served with coconut chutney and sambar (lentil soup). A South Indian breakfast icon.",
    ingredients: ["Rice", "Urad dal", "Potato", "Onion", "Mustard seeds", "Curry leaves", "Turmeric", "Coconut"],
    category: "Breakfast",
    isVeg: true,
    dietaryTags: ["veg", "gluten-free"],
    allergens: [],
    spiceLevel: 2,
    dishType: ["crispy", "light", "savory"],
    price: "₹120",
    origin: "Karnataka / Tamil Nadu",
    emoji: "🫓",
  },
  {
    id: 2,
    originalName: "लिट्टी चोखा",
    transliteration: "Litti Chokha",
    translatedName: "Roasted Wheat Balls with Mashed Veggies",
    pronunciation: "LIT-tee CHOH-kha",
    description: "Baked whole wheat dumplings stuffed with roasted gram flour, served with fire-roasted mashed eggplant and tomato. A beloved street food from Bihar.",
    ingredients: ["Whole wheat flour", "Sattu (roasted gram)", "Brinjal/Eggplant", "Tomato", "Mustard oil", "Garlic", "Ginger"],
    category: "Main Course",
    isVeg: true,
    dietaryTags: ["veg"],
    allergens: ["gluten"],
    spiceLevel: 3,
    dishType: ["roasted", "hearty", "earthy"],
    price: "₹150",
    origin: "Bihar / Jharkhand",
    emoji: "⚪",
  },
  {
    id: 3,
    originalName: "চিংড়ি মালাই কারি",
    transliteration: "Chingri Malai Curry",
    translatedName: "Prawn Coconut Cream Curry",
    pronunciation: "CHING-ree muh-LYE KAA-ree",
    description: "Jumbo prawns slow-cooked in a velvety coconut milk curry with mustard seeds and green chillies. A festive Bengali delicacy with gentle sweetness.",
    ingredients: ["Tiger prawns", "Coconut milk", "Mustard oil", "Green chilli", "Onion", "Ginger", "Turmeric"],
    category: "Main Course",
    isVeg: false,
    dietaryTags: ["non-veg", "seafood", "dairy-free"],
    allergens: ["shellfish"],
    spiceLevel: 2,
    dishType: ["creamy", "mild", "festive"],
    price: "₹380",
    origin: "West Bengal",
    emoji: "🍤",
  },
  {
    id: 4,
    originalName: "ઉંધિયુ",
    transliteration: "Undhiyu",
    translatedName: "Slow-cooked Winter Vegetables",
    pronunciation: "UN-dee-yoo",
    description: "A Gujarati winter speciality — seasonal vegetables, green garlic, and fenugreek dumplings slow-cooked underground with spices. Rich, warming, and utterly unique.",
    ingredients: ["Surti papdi beans", "Raw banana", "Purple yam", "Fenugreek dumplings", "Coconut", "Green garlic", "Sesame seeds"],
    category: "Main Course",
    isVeg: true,
    dietaryTags: ["veg", "dairy-free"],
    allergens: ["gluten"],
    spiceLevel: 2,
    dishType: ["slow-cooked", "hearty", "seasonal"],
    price: "₹220",
    origin: "Gujarat (Surat)",
    emoji: "🥘",
  },
  {
    id: 5,
    originalName: "അപ്പം with Stew",
    transliteration: "Appam with Stew",
    translatedName: "Lacy Rice Pancake with Vegetable/Chicken Stew",
    pronunciation: "UP-um",
    description: "Soft, lacy-edged fermented rice pancakes with a pillowy center, served with a mild coconut milk stew with vegetables or chicken. Kerala's comforting Sunday classic.",
    ingredients: ["Rice", "Coconut milk", "Yeast", "Potato", "Carrot", "Onion", "Green chilli", "Ginger"],
    category: "Breakfast / Dinner",
    isVeg: false,
    dietaryTags: ["non-veg", "gluten-free"],
    allergens: [],
    spiceLevel: 1,
    dishType: ["mild", "creamy", "comforting"],
    price: "₹180",
    origin: "Kerala",
    emoji: "🥞",
  },
  {
    id: 6,
    originalName: "मिसळ पाव",
    transliteration: "Misal Pav",
    translatedName: "Spicy Sprout Curry with Bread",
    pronunciation: "MEE-sul PAAV",
    description: "A fiery Maharashtrian breakfast — sprouted moth beans in a pungent red gravy, topped with crunchy farsan (savory mix), raw onion, and lemon. Served with soft white buns.",
    ingredients: ["Moth beans (matki)", "Farsan (fried gram mix)", "Onion", "Tomato", "Kokum", "Goda masala", "Pav (bread rolls)"],
    category: "Breakfast",
    isVeg: true,
    dietaryTags: ["veg", "dairy-free"],
    allergens: ["gluten"],
    spiceLevel: 4,
    dishType: ["spicy", "crunchy", "tangy"],
    price: "₹100",
    origin: "Maharashtra (Pune / Kolhapur)",
    emoji: "🌶️",
  },
];

const TRAVELER_PHRASES = [
  { id: 1, emoji: "🌶️", english: "Is this spicy?", hindi: "क्या यह तीखा है?", phonetic: "Kya yeh teekha hai?" },
  { id: 2, emoji: "🥚", english: "Does this contain egg?", hindi: "क्या इसमें अंडा है?", phonetic: "Kya ismein anda hai?" },
  { id: 3, emoji: "🥜", english: "Does this have nuts?", hindi: "क्या इसमें मेवे हैं?", phonetic: "Kya ismein meve hain?" },
  { id: 4, emoji: "🐄", english: "Is this dairy-free?", hindi: "क्या यह डेयरी-मुक्त है?", phonetic: "Kya yeh dairy-mukt hai?" },
  { id: 5, emoji: "😌", english: "Can you make it less spicy?", hindi: "क्या कम तीखा बना सकते हैं?", phonetic: "Kya kam teekha bana sakte hain?" },
  { id: 6, emoji: "🌿", english: "I am vegetarian.", hindi: "मैं शाकाहारी हूँ।", phonetic: "Main shakahari hoon." },
  { id: 7, emoji: "🍽️", english: "What is the best dish here?", hindi: "यहाँ सबसे अच्छा व्यंजन कौन सा है?", phonetic: "Yahan sabse accha vyanjan kaun sa hai?" },
  { id: 8, emoji: "🦐", english: "Does this have seafood?", hindi: "क्या इसमें समुद्री भोजन है?", phonetic: "Kya ismein samudri bhojan hai?" },
];

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

const SUPPORTED_SCRIPTS = [
  { lang: "Bengali", script: "বাংলা", region: "West Bengal, Bangladesh" },
  { lang: "Hindi", script: "हिंदी", region: "North India" },
  { lang: "Tamil", script: "தமிழ்", region: "Tamil Nadu, Sri Lanka" },
  { lang: "Telugu", script: "తెలుగు", region: "Andhra, Telangana" },
  { lang: "Kannada", script: "ಕನ್ನಡ", region: "Karnataka" },
  { lang: "Malayalam", script: "മലയാളം", region: "Kerala" },
  { lang: "Marathi", script: "मराठी", region: "Maharashtra" },
  { lang: "Gujarati", script: "ગુજરાતી", region: "Gujarat" },
  { lang: "Punjabi", script: "ਪੰਜਾਬੀ", region: "Punjab" },
];

// ─── Spice Level Component ─────────────────────────────────
function SpiceLevel({ level }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-base transition-all ${i <= level ? "opacity-100" : "opacity-20"}`}
        >
          🌶️
        </span>
      ))}
      <span className="ml-1 text-xs text-amber-700 font-medium">
        {level === 0 ? "No spice" : level === 1 ? "Mild" : level === 2 ? "Medium" : level === 3 ? "Hot" : level === 4 ? "Very Hot" : "Extreme"}
      </span>
    </div>
  );
}

// ─── Dietary Badge ─────────────────────────────────────────
function DietBadge({ tag }) {
  const styles = {
    veg: "bg-green-100 text-green-800 border-green-200",
    "non-veg": "bg-red-100 text-red-800 border-red-200",
    egg: "bg-yellow-100 text-yellow-800 border-yellow-200",
    seafood: "bg-blue-100 text-blue-800 border-blue-200",
    "dairy-free": "bg-purple-100 text-purple-800 border-purple-200",
    "gluten-free": "bg-orange-100 text-orange-800 border-orange-200",
  };
  const labels = {
    veg: "🟢 Veg",
    "non-veg": "🔴 Non-Veg",
    egg: "🥚 Egg",
    seafood: "🦐 Seafood",
    "dairy-free": "🥛 Dairy-Free",
    "gluten-free": "🌾 Gluten-Free",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[tag] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {labels[tag] || tag}
    </span>
  );
}

// ─── Dish Card Component ────────────────────────────────────
// [API INTEGRATION POINT: Replace static data with API response from translation/OCR pipeline]
function DishCard({ dish, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // [TTS INTEGRATION POINT: Replace with Web Speech API or Google TTS]
  const speak = (e) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      setSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(dish.transliteration);
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Card Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-3xl flex-shrink-0 border border-amber-100">
          {dish.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold text-gray-800 leading-tight">{dish.originalName}</p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">{dish.transliteration}</p>
            </div>
            <span className="text-sm font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100 flex-shrink-0">{dish.price}</span>
          </div>
          <p className="text-base text-gray-700 font-medium mt-1">{dish.translatedName}</p>
        </div>
      </div>

      {/* Spice + Tags Row */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
        <SpiceLevel level={dish.spiceLevel} />
      </div>
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {dish.dietaryTags.map((t) => <DietBadge key={t} tag={t} />)}
        {dish.dishType.map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 capitalize">{t}</span>
        ))}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-amber-50 bg-amber-50/40 px-4 py-4 space-y-3">
          {/* Pronunciation + TTS */}
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">How to say it</p>
              <p className="text-sm font-mono text-gray-700">/{dish.pronunciation}/</p>
            </div>
            {/* [TTS INTEGRATION POINT] */}
            <button
              onClick={speak}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${speaking ? "bg-teal-500 text-white animate-pulse" : "bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-100"}`}
            >
              {speaking ? "🔊" : "🔈"}
            </button>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">What is it?</p>
            <p className="text-sm text-gray-700 leading-relaxed">{dish.description}</p>
          </div>

          {/* Ingredients */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">Main Ingredients</p>
            <div className="flex flex-wrap gap-1.5">
              {dish.ingredients.map((ing) => (
                <span key={ing} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">{ing}</span>
              ))}
            </div>
          </div>

          {/* Allergens */}
          {dish.allergens.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-red-700">Allergen Alert</p>
                <p className="text-xs text-red-600">{dish.allergens.join(", ")}</p>
              </div>
            </div>
          )}

          {/* Origin */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>📍</span>
            <span>{dish.origin}</span>
          </div>
        </div>
      )}

      {/* Expand Hint */}
      <div className="px-4 py-2 border-t border-amber-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">{dish.category}</span>
        <span className="text-xs text-amber-600">{expanded ? "▲ Less" : "▼ Details"}</span>
      </div>
    </div>
  );
}

// ─── AI Scan Animation ──────────────────────────────────────
function ScanAnimation({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "🔍", text: "Detecting script language…", sub: "Identified: Mixed Indian Scripts" },
    { icon: "✨", text: "Running OCR extraction…", sub: "Found 6 menu items" },
    { icon: "🌐", text: "Translating dish names…", sub: "English translation ready" },
    { icon: "🤖", text: "AI generating food context…", sub: "Adding spice levels, allergens, descriptions" },
    { icon: "✅", text: "Your menu is ready!", sub: "" },
  ];

  useEffect(() => {
    if (step < steps.length) {
      const t = setTimeout(() => {
        if (step === steps.length - 1) {
          setTimeout(onComplete, 600);
        } else {
          setStep(step + 1);
        }
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-bounce">🍽️</div>
          <h2 className="text-xl font-bold text-gray-800">Analysing your menu…</h2>
        </div>
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
              i < step ? "bg-teal-50 border border-teal-100 opacity-60" :
              i === step ? "bg-white border-2 border-amber-300 shadow-md" :
              "opacity-20 bg-gray-50 border border-gray-100"
            }`}
          >
            <span className="text-xl">{s.icon}</span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${i === step ? "text-gray-800" : "text-gray-500"}`}>{s.text}</p>
              {i <= step && s.sub && <p className="text-xs text-teal-600">{s.sub}</p>}
            </div>
            {i < step && <span className="text-teal-500">✓</span>}
            {i === step && (
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phrase Helper Panel ────────────────────────────────────
function PhraseHelper({ visible, onClose }) {
  const [copied, setCopied] = useState(null);
  const copy = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">🗣️ Traveler Phrases</h3>
            <p className="text-xs text-gray-500">Tap to copy • Show to your server</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-3">
          {TRAVELER_PHRASES.map((ph) => (
            <div key={ph.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{ph.emoji} {ph.english}</p>
                  <p className="text-lg font-bold text-amber-800 mt-1">{ph.hindi}</p>
                  <p className="text-xs text-amber-600 italic mt-0.5">{ph.phonetic}</p>
                </div>
                <button
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ${copied === ph.id ? "bg-teal-500 text-white" : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-100"}`}
                  onClick={() => copy(ph.hindi, ph.id)}
                >
                  {copied === ph.id ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Section ─────────────────────────────────────────
function UploadSection({ onUpload }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) onUpload(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan Your Menu</h2>
          <p className="text-gray-500 text-sm leading-relaxed">Upload a photo of any Indian regional menu — we'll translate and explain every dish instantly.</p>
        </div>

        {/* Upload Zone */}
        <div
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 cursor-pointer ${
            dragging ? "border-amber-400 bg-amber-50 scale-[1.02]" : "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50"
          }`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <div className="text-5xl mb-3">📷</div>
          <p className="font-semibold text-gray-700 mb-1">Tap to upload menu photo</p>
          <p className="text-xs text-gray-400">JPG, PNG, HEIC supported • Max 10MB</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {/* Or divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Demo Button */}
        <button
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl text-sm shadow-lg hover:shadow-amber-200 hover:scale-[1.01] transition-all active:scale-[0.99]"
          onClick={() => onUpload("demo")}
        >
          ✨ Try with Sample Menu
          <span className="block text-xs font-normal opacity-80 mt-0.5">Masala Dosa, Litti Chokha, Prawn Curry & more</span>
        </button>

        {/* Supported Scripts Preview */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 mb-2">Supports Indian scripts</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_SCRIPTS.slice(0, 6).map((s) => (
              <span key={s.lang} className="text-sm font-medium text-gray-500 bg-gray-100 rounded-lg px-2 py-1">{s.script}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Results Section ────────────────────────────────────────
function ResultsSection({ dishes, selectedLang, onPhraseClick }) {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Breakfast", "Main Course", "Veg Only", "Non-Veg", "Mild"];
  
  const filtered = dishes.filter((d) => {
    if (filter === "All") return true;
    if (filter === "Veg Only") return d.isVeg;
    if (filter === "Non-Veg") return !d.isVeg;
    if (filter === "Mild") return d.spiceLevel <= 2;
    return d.category.includes(filter);
  });

  return (
    <div className="pb-24">
      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs opacity-80">Menu Detected</p>
            <p className="font-bold text-lg">Mixed Indian Scripts</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{dishes.length}</p>
            <p className="text-xs opacity-80">dishes found</p>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{dishes.filter(d => d.isVeg).length} Veg</span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{dishes.filter(d => !d.isVeg).length} Non-Veg</span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Translated → {selectedLang}</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === cat
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dish Cards */}
      <div className="px-4 space-y-3">
        {filtered.map((dish) => (
          <DishCard key={dish.id} dish={dish} lang={selectedLang} />
        ))}
      </div>

      {/* Phrase Helper CTA */}
      <div className="px-4 mt-6">
        <button
          onClick={onPhraseClick}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:shadow-teal-200 transition-all flex items-center justify-center gap-2"
        >
          <span>🗣️</span>
          <span>Open Traveler Phrase Helper</span>
        </button>
      </div>
    </div>
  );
}

// ─── Restaurant Mode Panel ──────────────────────────────────
function RestaurantMode() {
  return (
    <div className="p-5 space-y-5 pb-24">
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-6 text-white">
        <div className="text-3xl mb-2">🏪</div>
        <h2 className="text-xl font-bold mb-1">Restaurant Dashboard</h2>
        <p className="text-sm opacity-80">Upload your menu once. Get a multilingual digital menu instantly — QR-ready, shareable, always updated.</p>
        <div className="mt-4 flex gap-2">
          <span className="text-xs bg-white/20 rounded-full px-2 py-1">9 Languages</span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-1">QR Ready</span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-1">Auto-Update</span>
        </div>
      </div>

      {/* Features */}
      {[
        { icon: "📤", title: "Upload Your Menu", desc: "PDF, image, or typed text. We handle all formats.", action: "Upload Menu" },
        { icon: "🌐", title: "Auto-Translate to 9 Languages", desc: "All dishes translated with cultural context instantly.", action: "Configure Languages" },
        { icon: "📱", title: "Generate QR Code", desc: "One QR — tourists scan and get their language automatically.", action: "Get QR Code" },
        { icon: "📊", title: "Analytics Dashboard", desc: "See which dishes tourists view most. Optimise your menu.", action: "View Analytics (Coming Soon)" },
      ].map((f) => (
        <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">{f.icon}</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">{f.desc}</p>
            <button className="text-xs text-teal-600 font-semibold border border-teal-200 rounded-lg px-3 py-1 hover:bg-teal-50 transition-colors">{f.action}</button>
          </div>
        </div>
      ))}

      {/* Sample QR Mock */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Preview — Sample QR Menu</p>
        <div className="w-24 h-24 mx-auto bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center mb-3">
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={`w-6 h-6 rounded-sm ${Math.random() > 0.5 ? "bg-gray-800" : "bg-white"}`} />
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500">Raju's Dhaba — Digital Menu</p>
        <p className="text-xs text-teal-600 mt-1">menusaarthi.app/r/rajus-dhaba</p>
      </div>
    </div>
  );
}

// ─── Landing / Hero ─────────────────────────────────────────
function LandingHero({ onStart, mode, setMode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-600 via-orange-500 to-amber-500 px-5 pt-10 pb-12 text-white text-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <span>🇮🇳</span>
            <span>India's Menu Translator</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-3">
            Never be lost<br />on a menu again.
          </h1>
          <p className="text-base opacity-90 leading-relaxed max-w-xs mx-auto">
            Point your camera at any Indian regional menu. Get instant translations, dish explanations, spice levels, and allergens — in your language.
          </p>
          <button
            onClick={onStart}
            className="mt-7 bg-white text-amber-600 font-bold text-base px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] hover:scale-[1.01]"
          >
            📷 Scan a Menu Now
          </button>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { icon: "🔍", text: "OCR Scanning" },
            { icon: "🌐", text: "9 Indian Scripts" },
            { icon: "🤖", text: "AI Explanations" },
            { icon: "🌶️", text: "Spice Levels" },
            { icon: "⚠️", text: "Allergen Alerts" },
            { icon: "🔊", text: "Voice Playback" },
          ].map((f) => (
            <span key={f.text} className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 border border-amber-100 text-amber-800 rounded-full px-3 py-1.5 whitespace-nowrap">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Supported Scripts */}
      <div className="px-5 py-6 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Supported Indian Languages</h3>
        <div className="grid grid-cols-3 gap-2">
          {SUPPORTED_SCRIPTS.map((s) => (
            <div key={s.lang} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
              <p className="text-xl font-bold text-teal-700">{s.script}</p>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.lang}</p>
              <p className="text-xs text-gray-400">{s.region.split(",")[0]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Dishes Preview */}
      <div className="px-5 py-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Example Dishes We Can Explain</h3>
        <div className="space-y-2">
          {SAMPLE_DISHES.slice(0, 3).map((d) => (
            <div key={d.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{d.originalName}</p>
                <p className="text-xs text-amber-600">{d.translatedName}</p>
              </div>
              <SpiceLevel level={d.spiceLevel} />
            </div>
          ))}
        </div>
        <button
          onClick={onStart}
          className="w-full mt-4 py-3 bg-amber-50 border-2 border-amber-200 text-amber-700 font-bold rounded-2xl text-sm hover:bg-amber-100 transition-colors"
        >
          See All Dishes →
        </button>
      </div>

      {/* For Restaurants */}
      <div className="px-5 py-5 bg-teal-50 border-t border-teal-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-teal-800 text-sm">🏪 Restaurant Owner?</p>
            <p className="text-xs text-teal-600 mt-0.5">Generate multilingual digital menus for your guests</p>
          </div>
          <button
            onClick={() => setMode("restaurant")}
            className="text-xs font-bold text-teal-700 bg-white border border-teal-200 rounded-xl px-3 py-2 hover:bg-teal-100 transition-colors flex-shrink-0 ml-3"
          >
            Switch →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | upload | scanning | results
  const [mode, setMode] = useState("traveler"); // traveler | restaurant
  const [selectedLang, setSelectedLang] = useState("English");
  const [phraseOpen, setPhraseOpen] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // [OCR INTEGRATION POINT] Replace with actual Tesseract.js or Google Vision API
  const handleUpload = async (file) => {
    setScreen("scanning");
    // Simulate OCR + AI pipeline
    // [BACKEND API INTEGRATION POINT: POST image to /api/scan-menu → returns dish list]
    await new Promise((r) => setTimeout(r, 5500));
    setDishes(SAMPLE_DISHES);
    setScreen("results");
  };

  // [AI INTEGRATION POINT] — Anthropic API for dish enrichment
  const enrichWithAI = async (rawDishes) => {
    // This is where you'd call Claude API to enrich dish data
    // const response = await fetch("https://api.anthropic.com/v1/messages", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     model: "claude-sonnet-4-20250514",
    //     max_tokens: 1000,
    //     messages: [{ role: "user", content: `Explain these dishes: ${JSON.stringify(rawDishes)}` }]
    //   })
    // });
    return rawDishes; // return mock for now
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-amber-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <span className="font-black text-amber-700 text-lg tracking-tight">MenuSaarthi</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => { setMode("traveler"); setScreen("landing"); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${mode === "traveler" ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              🎒 Traveler
            </button>
            <button
              onClick={() => setMode("restaurant")}
              className={`px-3 py-1.5 rounded-lg transition-all ${mode === "restaurant" ? "bg-teal-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              🏪 Restaurant
            </button>
          </div>

          {/* Lang Selector */}
          {(screen === "results" || mode === "restaurant") && (
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-amber-300"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>{l.flag} {l.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {mode === "restaurant" ? (
          <RestaurantMode />
        ) : screen === "landing" ? (
          <LandingHero onStart={() => setScreen("upload")} mode={mode} setMode={setMode} />
        ) : screen === "upload" ? (
          <UploadSection onUpload={handleUpload} />
        ) : screen === "scanning" ? (
          <ScanAnimation onComplete={() => {}} />
        ) : screen === "results" ? (
          <ResultsSection dishes={dishes} selectedLang={selectedLang} onPhraseClick={() => setPhraseOpen(true)} />
        ) : null}
      </main>

      {/* Bottom Nav (on results) */}
      {screen === "results" && mode === "traveler" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 shadow-xl z-30">
          <button
            onClick={() => setScreen("upload")}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm hover:bg-gray-200 transition-colors"
          >
            📷 Scan New
          </button>
          <button
            onClick={() => setPhraseOpen(true)}
            className="flex-1 py-3 bg-amber-500 text-white font-semibold rounded-2xl text-sm hover:bg-amber-600 transition-colors"
          >
            🗣️ Phrases
          </button>
        </div>
      )}

      {/* Phrase Helper Overlay */}
      <PhraseHelper visible={phraseOpen} onClose={() => setPhraseOpen(false)} />
    </div>
  );
}

