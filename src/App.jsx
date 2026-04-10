import { useState, useRef, useCallback, useEffect } from "react";

// ════════════════════════════════════════════════════════════════
//  MenuSaarthi — AI-Powered Menu Translator
//  • Camera capture OR image upload
//  • Image sent directly to Claude API (vision)
//  • Claude detects language, reads dish names, web-searches each dish
//  • Returns: pronunciation, ingredients, spice level, allergens, description
//  • No hardcoded dishes. 100% live AI.
// ════════════════════════════════════════════════════════════════

// ── Helpers ─────────────────────────────────────────────────────

function SpiceBar({ level }) {
  // level: 0-5
  const labels = ["None", "Mild", "Medium", "Hot", "Very Hot", "Extreme"];
  const colors = ["bg-gray-300", "bg-green-400", "bg-yellow-400", "bg-orange-400", "bg-red-500", "bg-red-700"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-2 w-5 rounded-full transition-all ${i <= level ? colors[level] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: level >= 4 ? "#dc2626" : level >= 3 ? "#ea580c" : level >= 2 ? "#ca8a04" : "#16a34a" }}>
        {labels[level] || "Unknown"}
      </span>
    </div>
  );
}

function Badge({ children, color = "amber" }) {
  const map = {
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[color]}`}>
      {children}
    </span>
  );
}

function SpeakButton({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };
  return (
    <button
      onClick={speak}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
        speaking
          ? "bg-teal-500 text-white border-teal-500 animate-pulse"
          : "bg-white border-teal-200 text-teal-700 hover:bg-teal-50"
      }`}
    >
      <span>{speaking ? "🔊" : "🔈"}</span>
      <span>{speaking ? "Speaking…" : "Hear it"}</span>
    </button>
  );
}

// ── Dish Card ────────────────────────────────────────────────────
function DishCard({ dish, index }) {
  const [open, setOpen] = useState(false);

  const dietColor = (tag) => {
    if (tag === "Veg") return "green";
    if (tag === "Non-Veg") return "red";
    if (tag === "Egg") return "amber";
    if (tag === "Vegan") return "green";
    if (tag === "Contains Nuts") return "purple";
    if (tag === "Contains Dairy") return "blue";
    if (tag === "Contains Gluten") return "amber";
    if (tag === "Seafood") return "blue";
    return "gray";
  };

  return (
    <div
      className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header — always visible */}
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl flex-shrink-0 border border-amber-200">
          {dish.emoji || "🍽️"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-base leading-tight">{dish.originalName}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">{dish.scriptDetected}</p>
          <p className="text-sm text-gray-600 mt-0.5 font-medium">{dish.translatedName}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {dish.dietaryTags?.map(t => <Badge key={t} color={dietColor(t)}>{t}</Badge>)}
          </div>
        </div>
        <span className="text-amber-400 text-lg mt-1 flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-amber-50 bg-amber-50/30 px-4 py-4 space-y-4">

          {/* Pronunciation */}
          <div className="bg-white rounded-xl p-3 border border-amber-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Pronunciation</p>
              <p className="font-mono text-sm text-gray-700">/{dish.pronunciation}/</p>
              <p className="text-xs text-teal-600 mt-0.5 italic">{dish.phonetic}</p>
            </div>
            <SpeakButton text={dish.translatedName || dish.originalName} />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">What is it?</p>
            <p className="text-sm text-gray-700 leading-relaxed">{dish.description}</p>
          </div>

          {/* Spice */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Spice Level</p>
            <SpiceBar level={dish.spiceLevel ?? 0} />
            {dish.spiceNote && <p className="text-xs text-gray-500 mt-1 italic">{dish.spiceNote}</p>}
          </div>

          {/* Ingredients */}
          {dish.ingredients?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Main Ingredients</p>
              <div className="flex flex-wrap gap-1.5">
                {dish.ingredients.map(ing => (
                  <span key={ing} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {/* Allergens */}
          {dish.allergens?.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
              <span>⚠️</span>
              <div>
                <p className="text-xs font-bold text-red-700">Allergen Warning</p>
                <p className="text-xs text-red-600">{dish.allergens.join(", ")}</p>
              </div>
            </div>
          )}

          {/* Origin & culture */}
          {dish.origin && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>📍</span><span>{dish.origin}</span>
            </div>
          )}

          {/* Traveler tip */}
          {dish.travelerTip && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex gap-2">
              <span>💡</span>
              <p className="text-xs text-teal-700">{dish.travelerTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI Call ──────────────────────────────────────────────────────
async function analyzeMenuImage(base64Image, mediaType, targetLanguage) {
  const systemPrompt = `You are MenuSaarthi, an expert AI for Indian food and travel. 
Your job: given a photo of a restaurant menu (which may be in ANY Indian regional language script like Bengali, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, etc. or even mixed scripts), you must:

1. Detect the language/script used in the menu
2. Extract every dish name visible
3. For EACH dish, use your knowledge + web search to find detailed information
4. Return a JSON array. Each element must have these exact fields:
   - originalName: string (dish name as it appears in the menu)
   - scriptDetected: string (e.g. "Bengali Script", "Tamil Script", "Devanagari (Hindi)")
   - translatedName: string (English translation)
   - emoji: string (one relevant food emoji)
   - pronunciation: string (IPA-style pronunciation guide)
   - phonetic: string (simple phonetic spelling for non-linguists, e.g. "muh-SAA-leh DOH-say")
   - description: string (2-3 sentence explanation aimed at a foreign traveler — what it is, how it tastes, when it is eaten)
   - ingredients: array of strings (top 6-8 main ingredients)
   - spiceLevel: number (0=no spice, 1=mild, 2=medium, 3=hot, 4=very hot, 5=extreme)
   - spiceNote: string (brief note about the heat, e.g. "Uses green chillies, can be adjusted")
   - dietaryTags: array of strings — choose from: Veg, Non-Veg, Egg, Vegan, Contains Nuts, Contains Dairy, Contains Gluten, Seafood
   - allergens: array of strings (specific allergens: nuts, gluten, dairy, shellfish, egg, etc.)
   - origin: string (region/state of origin, e.g. "West Bengal", "Tamil Nadu")
   - travelerTip: string (one practical tip for a traveler, e.g. "Pairs perfectly with filter coffee. Ask for extra chutney.")

Return ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array starting with [ and ending with ].
If you cannot read the menu clearly, return a JSON array with one item having originalName: "Could not read menu" and description explaining the issue.`;

  const userPrompt = targetLanguage !== "English"
    ? `Please translate the "translatedName" and "description" fields into ${targetLanguage} as well.`
    : "";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image }
          },
          {
            type: "text",
            text: `This is a photo of a restaurant menu. Please analyze it and return the full JSON array as instructed. ${userPrompt} Use web search to verify dish information where needed.`
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();

  // Collect all text blocks (including after tool use)
  const fullText = data.content
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");

  // Extract JSON array from response
  const match = fullText.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("AI did not return valid JSON. Please try again.");

  return JSON.parse(match[0]);
}

// ── Phrase Panel ─────────────────────────────────────────────────
const PHRASES = [
  { en: "Is this spicy?", hi: "क्या यह तीखा है?", ph: "Kya yeh teekha hai?" },
  { en: "Does it have egg?", hi: "क्या इसमें अंडा है?", ph: "Kya ismein anda hai?" },
  { en: "Does it have nuts?", hi: "क्या इसमें मेवे हैं?", ph: "Kya ismein meve hain?" },
  { en: "Make it less spicy", hi: "कम तीखा बनाइए", ph: "Kam teekha banaiye" },
  { en: "I am vegetarian", hi: "मैं शाकाहारी हूँ", ph: "Main shakahari hoon" },
  { en: "No dairy please", hi: "डेयरी नहीं चाहिए", ph: "Dairy nahi chahiye" },
  { en: "What's the best dish?", hi: "सबसे अच्छा क्या है?", ph: "Sabse accha kya hai?" },
  { en: "No seafood please", hi: "समुद्री भोजन नहीं", ph: "Samudri bhojan nahi" },
];

function PhrasePanel({ onClose }) {
  const [copied, setCopied] = useState(null);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">🗣️ Traveler Phrases</h3>
            <p className="text-xs text-gray-500">Tap Hindi text to copy & show your server</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-3 pb-8">
          {PHRASES.map((p, i) => (
            <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">{p.en}</p>
              <button
                className={`text-xl font-bold w-full text-left transition-all ${copied === i ? "text-teal-600" : "text-amber-800 hover:text-amber-600"}`}
                onClick={() => { navigator.clipboard.writeText(p.hi).catch(() => {}); setCopied(i); setTimeout(() => setCopied(null), 1500); }}
              >
                {p.hi}
              </button>
              <p className="text-xs text-amber-600 italic mt-0.5">{p.ph}</p>
              {copied === i && <p className="text-xs text-teal-600 font-semibold mt-1">✓ Copied!</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
const LANGS = ["English", "French", "German", "Spanish", "Japanese", "Chinese", "Arabic", "Korean", "Portuguese"];

export default function App() {
  const [screen, setScreen] = useState("home"); // home | camera | results | error
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [targetLang, setTargetLang] = useState("English");
  const [phraseOpen, setPhraseOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detectedScript, setDetectedScript] = useState("");

  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();

  // ── Camera ──────────────────────────────────────────────────
  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Wait for next render then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings, then try again.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device. Please use the upload option instead.");
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    setPreviewUrl(dataUrl);
    processImage(dataUrl, "image/jpeg");
  };

  // ── File Upload ──────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, HEIC, WEBP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image too large. Please use an image under 20MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      processImage(e.target.result, file.type);
    };
    reader.readAsDataURL(file);
  };

  // ── Core AI Pipeline ─────────────────────────────────────────
  const processImage = async (dataUrl, mimeType) => {
    setLoading(true);
    setError("");
    setDishes([]);
    setScreen("loading");

    try {
      setLoadingStep("🔍 Reading menu image…");
      await delay(400);
      setLoadingStep("🌐 Detecting script & language…");
      await delay(300);
      setLoadingStep("🤖 Claude is analysing each dish…");

      // Extract base64 from data URL
      const base64 = dataUrl.split(",")[1];
      const mediaType = (mimeType === "image/jpeg" || mimeType === "image/jpg") ? "image/jpeg"
        : mimeType === "image/png" ? "image/png"
        : mimeType === "image/webp" ? "image/webp"
        : mimeType === "image/gif" ? "image/gif"
        : "image/jpeg";

      setLoadingStep("🌐 Searching the internet for dish details…");
      const result = await analyzeMenuImage(base64, mediaType, targetLang);

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error("No dishes found in the image. Please try a clearer photo.");
      }

      if (result[0]?.scriptDetected) {
        setDetectedScript(result[0].scriptDetected);
      }

      setDishes(result);
      setScreen("results");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      setScreen("error");
    } finally {
      setLoading(false);
    }
  };

  const delay = ms => new Promise(r => setTimeout(r, ms));

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), []);

  // ── RENDER ───────────────────────────────────────────────────

  // Camera overlay
  if (cameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {/* Viewfinder guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-52 border-2 border-white/60 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-2 rounded-full">
            Point at menu • Keep steady
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="bg-black px-6 py-8 flex items-center justify-between">
          <button
            onClick={stopCamera}
            className="text-white/70 hover:text-white text-sm font-medium px-4 py-2 border border-white/20 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            className="w-18 h-18 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-95 transition-transform active:scale-90"
            style={{ width: 72, height: 72 }}
          >
            <div className="w-14 h-14 rounded-full border-4 border-gray-300" />
          </button>
          <div className="w-20" />
        </div>
      </div>
    );
  }

  // Loading screen
  if (screen === "loading") {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          {previewUrl && (
            <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden border-4 border-amber-200 shadow-lg mb-8">
              <img src={previewUrl} alt="menu" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">AI is reading your menu</h2>
          <p className="text-amber-700 font-medium text-sm">{loadingStep}</p>
          <div className="mt-6 space-y-2 text-left bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
            {[
              "Detecting script & language",
              "Extracting dish names",
              "Searching web for each dish",
              "Building dish cards",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" style={{ animationDelay: `${i * 200}ms` }} />
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (screen === "results") {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-amber-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen("home")} className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 hover:bg-amber-100 transition-colors">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm truncate">Menu Analysis</p>
            {detectedScript && <p className="text-xs text-amber-600">{detectedScript} detected</p>}
          </div>
          <select
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:border-amber-400"
          >
            {LANGS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Preview + Stats */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-4 flex items-center gap-4">
          {previewUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/30 flex-shrink-0">
              <img src={previewUrl} alt="menu" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-bold text-lg">{dishes.length} dishes found</p>
            <p className="text-sm opacity-80">
              {dishes.filter(d => d.dietaryTags?.includes("Veg")).length} veg •{" "}
              {dishes.filter(d => d.dietaryTags?.includes("Non-Veg")).length} non-veg
            </p>
            <p className="text-xs opacity-60 mt-0.5">Tap any dish to expand</p>
          </div>
        </div>

        {/* Dish Cards */}
        <div className="px-4 pt-4 space-y-3">
          {dishes.map((dish, i) => (
            <DishCard key={i} dish={dish} index={i} />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 shadow-xl z-20">
          <button
            onClick={() => setScreen("home")}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl text-sm hover:bg-gray-200 transition-colors"
          >
            📷 Scan New Menu
          </button>
          <button
            onClick={() => setPhraseOpen(true)}
            className="flex-1 py-3 bg-amber-500 text-white font-semibold rounded-2xl text-sm hover:bg-amber-600 transition-colors"
          >
            🗣️ Phrases
          </button>
        </div>

        {phraseOpen && <PhrasePanel onClose={() => setPhraseOpen(false)} />}
      </div>
    );
  }

  // Error screen
  if (screen === "error") {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 leading-relaxed">{error}</p>
        <button
          onClick={() => setScreen("home")}
          className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Home Screen ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div
        className="relative overflow-hidden px-5 pt-12 pb-14 text-white text-center"
        style={{ background: "linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)" }}
      >
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-10 bg-white -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
            <span>🇮🇳</span><span>AI-Powered Menu Translator</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-3 tracking-tight">
            Understand<br />any menu<br />instantly.
          </h1>
          <p className="text-sm opacity-90 leading-relaxed max-w-xs mx-auto">
            Point your camera at any Indian menu — in Bengali, Tamil, Hindi, Kannada, or any regional script. AI reads, translates, and explains everything.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 -mt-6 relative z-10 space-y-3">
        {/* Camera */}
        <button
          onClick={startCamera}
          className="w-full bg-gray-900 text-white py-4 px-5 rounded-2xl font-bold text-base shadow-xl hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-2xl flex-shrink-0">📷</div>
          <div className="text-left">
            <p className="font-bold">Open Camera</p>
            <p className="text-xs text-gray-400 font-normal">Point at a physical menu</p>
          </div>
        </button>

        {/* Upload */}
        <button
          onClick={() => fileInputRef.current.click()}
          className="w-full bg-white border-2 border-amber-200 text-gray-800 py-4 px-5 rounded-2xl font-bold text-base hover:border-amber-400 hover:bg-amber-50 active:scale-[0.98] transition-all flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">🖼️</div>
          <div className="text-left">
            <p className="font-bold">Upload Photo</p>
            <p className="text-xs text-gray-400 font-normal">JPG, PNG, HEIC, WebP</p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
        />

        {/* Language */}
        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🌐</span>
            <span className="text-sm font-semibold text-teal-800">Translate to</span>
          </div>
          <select
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
            className="bg-white border border-teal-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-teal-700 focus:outline-none focus:border-teal-400"
          >
            {LANGS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Error inline */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="px-5 py-8 mt-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">How it works</h3>
        <div className="space-y-3">
          {[
            { icon: "📷", title: "Scan or upload", desc: "Take a photo of the menu — any language, any script" },
            { icon: "🤖", title: "AI reads the menu", desc: "Claude detects the script, reads every dish name" },
            { icon: "🌐", title: "Live web search", desc: "Searches the internet for real dish information" },
            { icon: "🍽️", title: "Full dish guide", desc: "Pronunciation, ingredients, spice level, allergens — all explained" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl flex-shrink-0">{step.icon}</div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-bold text-gray-800">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported scripts */}
      <div className="px-5 pb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Supported Scripts</h3>
        <div className="flex flex-wrap gap-2">
          {["বাংলা", "हिंदी", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "മലയാളം", "मराठी", "ગુજરાતી", "ਪੰਜਾਬੀ", "ଓଡ଼ିଆ"].map(s => (
            <span key={s} className="bg-gray-100 text-gray-700 font-bold text-sm px-3 py-1.5 rounded-xl border border-gray-200">{s}</span>
          ))}
        </div>
      </div>

      {/* Phrase helper CTA */}
      <div className="px-5 pb-10">
        <button
          onClick={() => setPhraseOpen(true)}
          className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>🗣️</span>
          <span>Open Traveler Phrase Helper</span>
        </button>
      </div>

      {phraseOpen && <PhrasePanel onClose={() => setPhraseOpen(false)} />}
    </div>
  );
}
