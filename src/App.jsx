import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────
// CORE AI ENGINE
// Sends image to Claude → detects language → searches web → returns full dish data
// ─────────────────────────────────────────────
async function analyzeMenuImage(base64Image, targetLanguage = "English") {
  const prompt = `You are MenuSaarthi, an expert AI food guide for travelers visiting India.

You will receive an image of a restaurant menu or a dish name written in ANY Indian regional language (Bengali, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, etc.) or even handwritten text.

Your job:
1. Detect what language/script the menu is written in
2. Read ALL the dish names from the image
3. For EACH dish, use your deep knowledge to provide complete information

Return a JSON object in this EXACT format (no markdown, no backticks, just raw JSON):
{
  "detectedLanguage": "name of the detected language",
  "detectedScript": "name of the script",
  "dishes": [
    {
      "id": 1,
      "originalName": "dish name in original script",
      "transliteration": "romanized phonetic spelling",
      "translatedName": "English translation of the name",
      "pronunciation": "phonetic guide e.g. muh-SAA-leh DOH-say",
      "description": "2-3 sentence food guide description explaining what the dish is, how it tastes, how it's served - as if explaining to a foreign traveler",
      "origin": "region/state of India this dish comes from",
      "mainIngredients": ["ingredient1", "ingredient2", "ingredient3", "ingredient4"],
      "isVeg": true or false,
      "containsEgg": true or false,
      "containsDairy": true or false,
      "containsGluten": true or false,
      "containsNuts": true or false,
      "containsSeafood": true or false,
      "containsMeat": true or false,
      "spiceLevel": 1 to 5 (1=no spice, 2=mild, 3=medium, 4=hot, 5=very hot),
      "spiceLevelLabel": "No Spice / Mild / Medium / Hot / Very Hot",
      "dishTags": ["e.g. crispy", "creamy", "fried", "steamed", "light", "heavy", "sweet", "tangy", "festive"],
      "mealType": "Breakfast / Lunch / Dinner / Snack / Dessert / Drink",
      "estimatedCalories": "approximate e.g. 350-450 kcal",
      "allergenWarning": "brief allergen note or null",
      "funFact": "one interesting cultural or historical fact about this dish",
      "travelerTip": "one practical tip for the traveler ordering this dish"
    }
  ]
}

If you cannot read the image clearly, still try your best. If it's not a menu, say so in detectedLanguage field as "Not a menu image" and return empty dishes array.
Target language for translated names: ${targetLanguage}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64Image },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  // Extract text from all content blocks
  const fullText = data.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  // Parse JSON from response
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");
  return JSON.parse(jsonMatch[0]);
}

// ─────────────────────────────────────────────
// TTS - speaks the dish name aloud
// ─────────────────────────────────────────────
function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

// ─────────────────────────────────────────────
// SPICE METER
// ─────────────────────────────────────────────
function SpiceMeter({ level }) {
  const colors = ["", "#4ade80", "#a3e635", "#facc15", "#f97316", "#ef4444"];
  const labels = ["", "No Spice", "Mild", "Medium", "Hot", "🔥 Very Hot"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i <= level ? colors[level] : "#e5e7eb",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: colors[level] || "#9ca3af", fontWeight: 600 }}>
        {labels[level]}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// DIETARY ICONS ROW
// ─────────────────────────────────────────────
function DietaryIcons({ dish }) {
  const tags = [];
  if (dish.isVeg) tags.push({ icon: "🟢", label: "Veg", bg: "#dcfce7", color: "#15803d" });
  else tags.push({ icon: "🔴", label: "Non-Veg", bg: "#fee2e2", color: "#b91c1c" });
  if (dish.containsEgg) tags.push({ icon: "🥚", label: "Egg", bg: "#fef9c3", color: "#a16207" });
  if (dish.containsDairy) tags.push({ icon: "🥛", label: "Dairy", bg: "#eff6ff", color: "#1d4ed8" });
  if (dish.containsGluten) tags.push({ icon: "🌾", label: "Gluten", bg: "#fef3c7", color: "#92400e" });
  if (dish.containsNuts) tags.push({ icon: "🥜", label: "Nuts", bg: "#fdf4ff", color: "#7e22ce" });
  if (dish.containsSeafood) tags.push({ icon: "🦐", label: "Seafood", bg: "#ecfeff", color: "#0e7490" });
  if (dish.containsMeat) tags.push({ icon: "🥩", label: "Meat", bg: "#fff1f2", color: "#be123c" });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {tags.map((t) => (
        <span
          key={t.label}
          style={{
            background: t.bg,
            color: t.color,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {t.icon} {t.label}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// DISH CARD
// ─────────────────────────────────────────────
function DishCard({ dish, index }) {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    setSpeaking(true);
    speakText(dish.transliteration || dish.originalName);
    setTimeout(() => setSpeaking(false), 2500);
  };

  const mealColors = {
    Breakfast: { bg: "#fff7ed", border: "#fed7aa", accent: "#c2410c" },
    Lunch: { bg: "#f0fdf4", border: "#bbf7d0", accent: "#15803d" },
    Dinner: { bg: "#f5f3ff", border: "#ddd6fe", accent: "#6d28d9" },
    Snack: { bg: "#fffbeb", border: "#fde68a", accent: "#b45309" },
    Dessert: { bg: "#fdf2f8", border: "#f9a8d4", accent: "#be185d" },
    Drink: { bg: "#eff6ff", border: "#bfdbfe", accent: "#1d4ed8" },
  };
  const colors = mealColors[dish.mealType] || mealColors.Lunch;

  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        background: "white",
        borderRadius: 20,
        border: `1.5px solid ${open ? colors.border : "#f1f5f9"}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: open ? "0 8px 30px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
        animationDelay: `${index * 0.08}s`,
        animation: "slideUp 0.4s ease both",
      }}
    >
      {/* Card Header */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Meal type badge */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: colors.bg,
                color: colors.accent,
                border: `1px solid ${colors.border}`,
                padding: "2px 8px",
                borderRadius: 20,
                display: "inline-block",
                marginBottom: 6,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {dish.mealType || "Dish"}
            </span>
            {/* Original name */}
            <p style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "'Noto Sans', sans-serif", lineHeight: 1.2 }}>
              {dish.originalName}
            </p>
            {/* Transliteration */}
            <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, margin: "2px 0 0", fontFamily: "monospace" }}>
              {dish.transliteration}
            </p>
            {/* English name */}
            <p style={{ fontSize: 15, color: "#475569", fontWeight: 600, margin: "4px 0 0" }}>
              {dish.translatedName}
            </p>
          </div>

          {/* Speak button */}
          <button
            onClick={handleSpeak}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: speaking ? "#f59e0b" : "#fff7ed",
              border: `2px solid ${speaking ? "#f59e0b" : "#fed7aa"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.2s",
              fontSize: 18,
              animation: speaking ? "pulse 0.6s infinite" : "none",
            }}
            title="Hear pronunciation"
          >
            {speaking ? "🔊" : "🔈"}
          </button>
        </div>

        {/* Spice + dietary row */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <SpiceMeter level={dish.spiceLevel || 1} />
          <DietaryIcons dish={dish} />
        </div>

        {/* Quick tags */}
        {dish.dishTags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            {dish.dishTags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expand / collapse indicator */}
      <div
        style={{
          borderTop: "1px solid #f8fafc",
          padding: "6px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{dish.origin}</span>
        <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>
          {open ? "▲ Less" : "▼ Full Details"}
        </span>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #fef3c7" }}>
          {/* Pronunciation guide */}
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 12,
              padding: "10px 14px",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>👄</span>
            <div>
              <p style={{ fontSize: 10, color: "#92400e", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                How to pronounce
              </p>
              <p style={{ fontSize: 15, fontFamily: "monospace", color: "#78350f", fontWeight: 700, margin: "2px 0 0" }}>
                {dish.pronunciation}
              </p>
            </div>
            <button
              onClick={handleSpeak}
              style={{
                marginLeft: "auto",
                background: "#f59e0b",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ▶ Play
            </button>
          </div>

          {/* Description */}
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px" }}>
              What is it?
            </p>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, margin: 0 }}>
              {dish.description}
            </p>
          </div>

          {/* Ingredients */}
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", margin: "0 0 6px" }}>
              Main Ingredients
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {dish.mainIngredients?.map((ing) => (
                <span
                  key={ing}
                  style={{
                    fontSize: 12,
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontWeight: 500,
                  }}
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Calories */}
          {dish.estimatedCalories && (
            <div
              style={{
                marginTop: 12,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                {dish.estimatedCalories}
              </span>
            </div>
          )}

          {/* Allergen warning */}
          {dish.allergenWarning && (
            <div
              style={{
                marginTop: 10,
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 12, color: "#be123c", fontWeight: 600 }}>{dish.allergenWarning}</span>
            </div>
          )}

          {/* Fun fact + traveler tip */}
          {dish.funFact && (
            <div
              style={{
                marginTop: 10,
                background: "#fdf4ff",
                border: "1px solid #e9d5ff",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <p style={{ fontSize: 10, color: "#7e22ce", fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>
                Fun Fact
              </p>
              <p style={{ fontSize: 13, color: "#4c1d95", margin: 0, lineHeight: 1.5 }}>{dish.funFact}</p>
            </div>
          )}
          {dish.travelerTip && (
            <div
              style={{
                marginTop: 10,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <p style={{ fontSize: 10, color: "#1d4ed8", fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>
                🧳 Traveler Tip
              </p>
              <p style={{ fontSize: 13, color: "#1e3a8a", margin: 0, lineHeight: 1.5 }}>{dish.travelerTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CAMERA COMPONENT
// ─────────────────────────────────────────────
function CameraView({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [error, setError] = useState(null);

  const startCamera = useCallback(async (mode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setReady(true);
          setError(null);
        };
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
    onCapture(base64, canvas.toDataURL("image/jpeg"));
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(0,0,0,0.6)",
          zIndex: 10,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: 20,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ✕ Cancel
        </button>
        <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>📷 Point at a menu</span>
        <button
          onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: 20,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          🔄 Flip
        </button>
      </div>

      {/* Video */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {error ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              textAlign: "center",
              padding: 24,
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>📷</span>
            <p style={{ fontSize: 15, color: "#fca5a5" }}>{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Viewfinder overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "80%",
                  maxWidth: 340,
                  height: 200,
                  border: "2px solid rgba(245,158,11,0.8)",
                  borderRadius: 16,
                  boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ position: "absolute", top: -1, left: -1, width: 24, height: 24, borderTop: "4px solid #f59e0b", borderLeft: "4px solid #f59e0b", borderRadius: "4px 0 0 0" }} />
                <div style={{ position: "absolute", top: -1, right: -1, width: 24, height: 24, borderTop: "4px solid #f59e0b", borderRight: "4px solid #f59e0b", borderRadius: "0 4px 0 0" }} />
                <div style={{ position: "absolute", bottom: -1, left: -1, width: 24, height: 24, borderBottom: "4px solid #f59e0b", borderLeft: "4px solid #f59e0b", borderRadius: "0 0 0 4px" }} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 24, height: 24, borderBottom: "4px solid #f59e0b", borderRight: "4px solid #f59e0b", borderRadius: "0 0 4px 0" }} />
              </div>
            </div>
            <p
              style={{
                position: "absolute",
                bottom: 100,
                width: "100%",
                textAlign: "center",
                color: "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              Fit the menu inside the frame
            </p>
          </>
        )}
      </div>

      {/* Capture button */}
      {!error && (
        <div
          style={{
            padding: "24px",
            display: "flex",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <button
            onClick={capture}
            disabled={!ready}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: ready ? "#f59e0b" : "#4b5563",
              border: "4px solid white",
              cursor: ready ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              transition: "all 0.2s",
              boxShadow: ready ? "0 0 0 8px rgba(245,158,11,0.3)" : "none",
            }}
          >
            📷
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TRAVELER PHRASES PANEL
// ─────────────────────────────────────────────
const PHRASES = [
  { en: "Is this spicy?", hi: "क्या यह तीखा है?", ph: "Kya yeh teekha hai?", icon: "🌶️" },
  { en: "Does this have egg?", hi: "क्या इसमें अंडा है?", ph: "Kya ismein anda hai?", icon: "🥚" },
  { en: "Does this have nuts?", hi: "क्या इसमें मेवे हैं?", ph: "Kya ismein meve hain?", icon: "🥜" },
  { en: "Can you make it less spicy?", hi: "कम तीखा बना सकते हैं?", ph: "Kam teekha bana sakte hain?", icon: "😌" },
  { en: "I am vegetarian.", hi: "मैं शाकाहारी हूँ।", ph: "Main shakahari hoon.", icon: "🌿" },
  { en: "Does this have dairy?", hi: "क्या इसमें दूध है?", ph: "Kya ismein doodh hai?", icon: "🥛" },
  { en: "What is the best dish?", hi: "सबसे अच्छा क्या है?", ph: "Sabse accha kya hai?", icon: "⭐" },
  { en: "No seafood please.", hi: "समुद्री भोजन नहीं।", ph: "Samudri bhojan nahi.", icon: "🦐" },
];

function PhrasesPanel({ onClose }) {
  const [copied, setCopied] = useState(null);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxWidth: 600,
          maxHeight: "80vh",
          overflowY: "auto",
          paddingBottom: 32,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "white",
            zIndex: 1,
          }}
        >
          <div>
            <p style={{ fontWeight: 800, fontSize: 17, color: "#0f172a", margin: 0 }}>🗣️ Traveler Phrases</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Tap to copy • Show to your server</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16 }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {PHRASES.map((p, i) => (
            <div
              key={i}
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 16,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: "#334155", fontSize: 13, margin: 0 }}>{p.en}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#92400e", margin: "2px 0 0" }}>{p.hi}</p>
                <p style={{ fontSize: 11, color: "#b45309", fontStyle: "italic", margin: "1px 0 0" }}>{p.ph}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(p.hi).catch(() => {});
                  speakText(p.hi);
                  setCopied(i);
                  setTimeout(() => setCopied(null), 1800);
                }}
                style={{
                  background: copied === i ? "#16a34a" : "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                {copied === i ? "✓ Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCANNING ANIMATION
// ─────────────────────────────────────────────
function ScanningOverlay({ imagePreview }) {
  const steps = [
    "Detecting language & script…",
    "Reading dish names…",
    "Searching for dish information…",
    "Analysing ingredients & spice levels…",
    "Preparing your menu guide…",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 800,
        background: "rgba(15,23,42,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Preview image with scan line */}
      {imagePreview && (
        <div
          style={{
            width: 200,
            height: 140,
            borderRadius: 16,
            overflow: "hidden",
            border: "2px solid #f59e0b",
            position: "relative",
            marginBottom: 28,
          }}
        >
          <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
              animation: "scanLine 1.5s linear infinite",
              top: "50%",
            }}
          />
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 320 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 12,
              marginBottom: 6,
              background: i === step ? "rgba(245,158,11,0.12)" : "transparent",
              border: `1px solid ${i === step ? "rgba(245,158,11,0.4)" : "transparent"}`,
              transition: "all 0.3s",
              opacity: i > step ? 0.25 : 1,
            }}
          >
            {i < step ? (
              <span style={{ fontSize: 16, color: "#4ade80" }}>✓</span>
            ) : i === step ? (
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid #f59e0b",
                  borderTopColor: "transparent",
                  animation: "spin 0.7s linear infinite",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #475569", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 14, color: i <= step ? "white" : "#64748b", fontWeight: i === step ? 700 : 400 }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <p style={{ color: "#64748b", fontSize: 12, marginTop: 20, textAlign: "center" }}>
        AI is reading and researching your menu…
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home | results
  const [showCamera, setShowCamera] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [targetLang, setTargetLang] = useState("English");
  const [activeFilter, setActiveFilter] = useState("All");
  const fileInputRef = useRef();

  const processImage = async (base64, preview) => {
    setImagePreview(preview);
    setShowCamera(false);
    setScanning(true);
    setError(null);
    setResults(null);

    try {
      const data = await analyzeMenuImage(base64, targetLang);
      if (data.detectedLanguage === "Not a menu image") {
        setError("This doesn't look like a menu. Please try again with a clearer photo of a restaurant menu.");
        setScanning(false);
        return;
      }
      setResults(data);
      setScreen("results");
    } catch (err) {
      setError("Something went wrong: " + err.message + ". Make sure you're connected to the internet.");
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(",")[1];
      processImage(base64, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const filteredDishes = results?.dishes?.filter((d) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Veg") return d.isVeg;
    if (activeFilter === "Non-Veg") return !d.isVeg;
    if (activeFilter === "Mild") return d.spiceLevel <= 2;
    if (activeFilter === "Spicy") return d.spiceLevel >= 4;
    return d.mealType === activeFilter;
  }) || [];

  const filters = ["All", "Veg", "Non-Veg", "Mild", "Spicy", "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];

  return (
    <>
      {/* Global CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&family=Outfit:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #0f172a; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes scanLine { from { top: 0; } to { top: 100%; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Camera */}
      {showCamera && (
        <CameraView
          onCapture={(b64, preview) => processImage(b64, preview)}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Scanning overlay */}
      {scanning && <ScanningOverlay imagePreview={imagePreview} />}

      {/* Phrases panel */}
      {showPhrases && <PhrasesPanel onClose={() => setShowPhrases(false)} />}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />

      {/* ─── HOME SCREEN ─── */}
      {screen === "home" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* Hero */}
          <div
            style={{
              background: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)",
              padding: "48px 24px 40px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* bg decoration */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 30,
                  padding: "6px 16px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 600,
                }}
              >
                🇮🇳 AI-Powered Menu Translator
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: "white", lineHeight: 1.15, marginBottom: 12 }}>
                Never be lost<br />on a menu again.
              </h1>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7, maxWidth: 320, margin: "0 auto 28px" }}>
                Point your camera at any Indian regional menu. AI reads it, translates it, explains every dish — live.
              </p>

              {/* Language selector */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>Translate to</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color: "white",
                    borderRadius: 12,
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {["English","French","German","Spanish","Japanese","Chinese","Korean","Arabic","Portuguese"].map(l => (
                    <option key={l} value={l} style={{ color: "#0f172a", background: "white" }}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowCamera(true)}
                  style={{
                    background: "white",
                    color: "#b45309",
                    border: "none",
                    borderRadius: 16,
                    padding: "14px 24px",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    transition: "transform 0.15s",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  📷 Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    border: "2px solid rgba(255,255,255,0.5)",
                    borderRadius: 16,
                    padding: "14px 24px",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "transform 0.15s",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  🖼️ Upload Photo
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                margin: "16px",
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 700, color: "#be123c", fontSize: 14 }}>Error</p>
                <p style={{ color: "#9f1239", fontSize: 13, marginTop: 2 }}>{error}</p>
              </div>
            </div>
          )}

          {/* How it works */}
          <div style={{ padding: "28px 20px 8px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              How It Works
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { n: "1", t: "Scan or Upload", d: "Take a photo of any menu — any Indian language or script", icon: "📷" },
                { n: "2", t: "AI Detects Language", d: "Automatically identifies Hindi, Bengali, Tamil, Telugu and 6 more scripts", icon: "🔍" },
                { n: "3", t: "Live Research", d: "AI searches the internet to find full details about every dish", icon: "🌐" },
                { n: "4", t: "Full Guide Instantly", d: "Ingredients, spice level, allergens, pronunciation, cultural tips", icon: "✨" },
              ].map((s) => (
                <div
                  key={s.n}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    background: "white",
                    borderRadius: 16,
                    padding: "14px 16px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{s.t}</p>
                    <p style={{ fontSize: 13, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported scripts */}
          <div style={{ padding: "24px 20px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Supported Indian Scripts
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { name: "Hindi", script: "हिंदी" },
                { name: "Bengali", script: "বাংলা" },
                { name: "Tamil", script: "தமிழ்" },
                { name: "Telugu", script: "తెలుగు" },
                { name: "Kannada", script: "ಕನ್ನಡ" },
                { name: "Malayalam", script: "മലയാളം" },
                { name: "Marathi", script: "मराठी" },
                { name: "Gujarati", script: "ગુજરાતી" },
                { name: "Punjabi", script: "ਪੰਜਾਬੀ" },
              ].map((s) => (
                <div
                  key={s.name}
                  style={{
                    background: "white",
                    border: "1px solid #f1f5f9",
                    borderRadius: 14,
                    padding: "10px 8px",
                    textAlign: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#b45309", fontFamily: "'Noto Sans', sans-serif" }}>{s.script}</p>
                  <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{s.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phrases CTA */}
          <div style={{ padding: "0 20px 40px" }}>
            <button
              onClick={() => setShowPhrases(true)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #0f766e, #0d9488)",
                color: "white",
                border: "none",
                borderRadius: 18,
                padding: "16px",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              🗣️ Traveler Phrases Helper
              <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>— copy in Hindi, speak aloud</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── RESULTS SCREEN ─── */}
      {screen === "results" && results && (
        <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
          {/* Top bar */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              background: "white",
              borderBottom: "1px solid #f1f5f9",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            }}
          >
            <button
              onClick={() => { setScreen("home"); setResults(null); setImagePreview(null); setActiveFilter("All"); }}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                color: "#475569",
                flexShrink: 0,
              }}
            >
              ← Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: 0 }}>Menu Translated</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>
                {results.detectedLanguage} · {results.dishes?.length} dishes found
              </p>
            </div>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="menu"
                style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", border: "2px solid #fde68a", flexShrink: 0 }}
              />
            )}
          </div>

          {/* Stats bar */}
          <div
            style={{
              background: "linear-gradient(135deg, #b45309, #d97706)",
              padding: "14px 16px",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>Detected Script</p>
              <p style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{results.detectedScript || results.detectedLanguage}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "white", fontWeight: 900, fontSize: 28, lineHeight: 1 }}>{results.dishes?.length}</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>dishes</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", color: "white", padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>
                {results.dishes?.filter(d => d.isVeg).length} Veg
              </span>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", color: "white", padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>
                {results.dishes?.filter(d => !d.isVeg).length} Non-Veg
              </span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ padding: "12px 0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ display: "flex", gap: 8, padding: "0 16px", width: "max-content" }}>
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: activeFilter === f ? "#f59e0b" : "#f1f5f9",
                    color: activeFilter === f ? "white" : "#64748b",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Dish cards */}
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 100 }}>
            {filteredDishes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <p style={{ fontSize: 40 }}>🍽️</p>
                <p style={{ fontWeight: 700, marginTop: 12 }}>No dishes match this filter</p>
              </div>
            ) : (
              filteredDishes.map((dish, i) => (
                <DishCard key={dish.id || i} dish={dish} index={i} />
              ))
            )}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "white",
              borderTop: "1px solid #f1f5f9",
              padding: "12px 16px",
              display: "flex",
              gap: 10,
              boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
              zIndex: 50,
            }}
          >
            <button
              onClick={() => { setScreen("home"); setResults(null); setImagePreview(null); }}
              style={{
                flex: 1,
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 14,
                padding: "13px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              📷 Scan New
            </button>
            <button
              onClick={() => setShowPhrases(true)}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #d97706, #f59e0b)",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "13px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              🗣️ Phrases
            </button>
          </div>
        </div>
      )}
    </>
  );
}
