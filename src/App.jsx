import { useState, useRef, useCallback, useEffect } from "react";

/* ============================================================
   MenuSaarthi — AI-Powered Indian Menu Translator
   Hosted 100% on GitHub Pages — no external server needed.

   HOW THE API KEY WORKS:
   - You store ANTHROPIC_API_KEY in GitHub → Settings → Secrets → Actions
   - GitHub Actions bakes it into the JS bundle at build time via VITE_ANTHROPIC_KEY
   - The app calls Anthropic directly from the browser using that key
   - NOTE: This means the key is inside the built JS file. Fine for a personal
     demo app. If you ever make this public/commercial, move to a backend.
   ============================================================ */

// Injected at build time by GitHub Actions from your repository secret.
// Never hardcode your key here — always use the env variable.
const RAW_ANTHROPIC_KEY =
  import.meta.env.VITE_ANTHROPIC_KEY ||
  import.meta.env.VITE_ANTHROPIC_API_KEY ||
  "";

const ANTHROPIC_KEY = String(RAW_ANTHROPIC_KEY).trim();

// ── THEME TOKENS ─────────────────────────────────────────────
const T = {
  bg0: "#0c0a09",       // deepest bg
  bg1: "#171412",       // card bg
  bg2: "#1f1b18",       // elevated card
  bg3: "#2a2420",       // input/hover
  border: "#2e2924",    // subtle border
  borderHover: "#3d3530",
  amber: "#f59e0b",
  amberDim: "#d97706",
  amberBg: "#1c1509",
  teal: "#14b8a6",
  tealBg: "#071413",
  text1: "#fafaf9",
  text2: "#a8a29e",
  text3: "#57534e",
  green: "#4ade80",
  red: "#f87171",
  spice: ["", "#4ade80", "#a3e635", "#facc15", "#fb923c", "#ef4444"],
  spiceLabel: ["", "No Spice", "Mild", "Medium", "Hot", "🔥 Very Hot"],
};

// ── AI ANALYSIS ───────────────────────────────────────────────
async function analyzeMenuImage(base64, targetLang, mediaType = "image/jpeg") {
 const prompt = `You are MenuSaarthi — an expert AI food guide for international travelers visiting India.

Analyze this restaurant menu image carefully.

1. Detect the language and script (Hindi/Bengali/Tamil/Telugu/Kannada/Malayalam/Marathi/Gujarati/Punjabi/Odia/Urdu or mixed)
2. Extract EVERY dish/item name visible
3. For each dish provide rich traveler-focused information

Respond ONLY with this exact JSON (no markdown fences, no extra text):
{
  "detectedLanguage": "Hindi",
  "detectedScript": "Devanagari",
  "restaurantType": "South Indian / North Indian / Bengali / etc.",
  "dishes": [
    {
      "id": 1,
      "originalName": "original text from menu",
      "transliteration": "Romanized pronunciation guide",
      "translatedName": "Name in ${targetLang}",
      "pronunciation": "syllable-by-syllable e.g. doh-SAAH",
      "description": "2-3 sentences describing what this dish is, how it tastes, and how it is served — written for someone who has never tried Indian food",
      "origin": "State/region e.g. Tamil Nadu",
      "mainIngredients": ["Rice", "Lentils", "Coconut"],
      "cookingMethod": "Steamed / Fried / Grilled / Curried / Baked / Raw",
      "isVeg": true,
      "containsEgg": false,
      "containsDairy": false,
      "containsGluten": false,
      "containsNuts": false,
      "containsSeafood": false,
      "containsMeat": false,
      "spiceLevel": 2,
      "spiceLevelLabel": "Mild",
      "dishTags": ["crispy", "light", "street food"],
      "mealType": "Breakfast",
      "estimatedCalories": "300-400 kcal",
      "allergenWarning": null,
      "pairsWith": "Sambar and coconut chutney",
      "funFact": "One interesting historical or cultural fact",
      "travelerTip": "Practical ordering tip for a foreign visitor",
      "mustTry": true
    }
  ]
}

spiceLevel: 1=none, 2=mild, 3=medium, 4=hot, 5=extreme
mustTry: mark the 1-2 most iconic/recommended dishes as true
If the image is not a menu, set detectedLanguage to "NOT_A_MENU".`;

  if (!ANTHROPIC_KEY) {
    throw new Error(
      "API key not configured. Add repository secret ANTHROPIC_KEY and map it to VITE_ANTHROPIC_KEY in GitHub Actions."
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    const msg =
      e?.error?.message ||
      e?.error ||
      `Anthropic request failed with status ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text =
    data.content?.filter((b) => b.type === "text").map((b) => b.text).join("") || "";

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI returned an unexpected response. Please try again.");
  }

  const parsed = JSON.parse(match[0]);

  if (parsed.detectedLanguage === "NOT_A_MENU") {
    throw new Error(
      "This doesn't look like a menu. Please take a clearer photo of a restaurant menu."
    );
  }

  return parsed;
}

spiceLevel: 1=none, 2=mild, 3=medium, 4=hot, 5=extreme
mustTry: mark the 1-2 most iconic/recommended dishes as true
If the image is not a menu, set detectedLanguage to "NOT_A_MENU".`;

  if (!ANTHROPIC_KEY) throw new Error("API key not configured. Add ANTHROPIC_KEY to GitHub Actions secrets.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Server error ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned an unexpected response. Please try again.");
  const parsed = JSON.parse(match[0]);
  if (parsed.detectedLanguage === "NOT_A_MENU") throw new Error("This doesn't look like a menu. Please take a clearer photo of a restaurant menu.");
  return parsed;
}

// ── TTS ───────────────────────────────────────────────────────
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.82; u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

// ── SMALL COMPONENTS ─────────────────────────────────────────

function SpiceDots({ level }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= level ? T.spice[level] : T.bg3, transition: "background .3s" }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.spice[level] || T.text3 }}>{T.spiceLabel[level] || ""}</span>
    </div>
  );
}

function Badge({ icon, label, bg, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 20, background: bg, color: color, letterSpacing: "0.02em" }}>
      {icon} {label}
    </span>
  );
}

function DietBadges({ dish }) {
  const badges = [];
  if (dish.isVeg) badges.push(<Badge key="veg" icon="●" label="VEG" bg="#052e16" color="#4ade80" />);
  else badges.push(<Badge key="nv" icon="●" label="NON-VEG" bg="#2d0a0a" color="#f87171" />);
  if (dish.containsEgg) badges.push(<Badge key="egg" icon="🥚" label="EGG" bg="#1c1a05" color="#facc15" />);
  if (dish.containsDairy) badges.push(<Badge key="dairy" icon="🥛" label="DAIRY" bg="#071a2e" color="#60a5fa" />);
  if (dish.containsGluten) badges.push(<Badge key="gluten" icon="🌾" label="GLUTEN" bg="#1c0f05" color="#fb923c" />);
  if (dish.containsNuts) badges.push(<Badge key="nuts" icon="🥜" label="NUTS" bg="#17082a" color="#c084fc" />);
  if (dish.containsSeafood) badges.push(<Badge key="sea" icon="🦐" label="SEAFOOD" bg="#071418" color="#22d3ee" />);
  if (dish.containsMeat) badges.push(<Badge key="meat" icon="🥩" label="MEAT" bg="#2d0a0a" color="#fb7185" />);
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{badges}</div>;
}

// ── DISH CARD ─────────────────────────────────────────────────
function DishCard({ dish, idx }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  const handleSpeak = e => {
    e.stopPropagation();
    setPlaying(true);
    speak(dish.transliteration || dish.originalName);
    setTimeout(() => setPlaying(false), 2800);
  };

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: open ? T.bg2 : T.bg1,
        border: `1px solid ${open ? "#3d3530" : T.border}`,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all .25s ease",
        animation: `slideUp .45s ease both`,
        animationDelay: `${idx * 0.06}s`,
        position: "relative",
      }}
    >
      {/* Must-try ribbon */}
      {dish.mustTry && (
        <div style={{ position: "absolute", top: 14, right: 14, background: T.amber, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.05em", zIndex: 1 }}>
          ★ MUST TRY
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Meal type */}
            <span style={{ fontSize: 9, fontWeight: 800, color: T.amberDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {dish.mealType || "DISH"} · {dish.cookingMethod || ""}
            </span>
            {/* Original name */}
            <p style={{ fontSize: 22, fontWeight: 800, color: T.text1, margin: "3px 0 1px", fontFamily: "'Noto Sans', sans-serif", lineHeight: 1.15 }}>
              {dish.originalName}
            </p>
            {/* Transliteration */}
            <p style={{ fontSize: 12, color: T.amber, fontWeight: 600, fontFamily: "monospace", margin: "0 0 3px" }}>
              {dish.transliteration}
            </p>
            {/* English name */}
            <p style={{ fontSize: 16, color: T.text2, fontWeight: 600, margin: 0 }}>
              {dish.translatedName}
            </p>
          </div>

          {/* Speak button */}
          <button
            onClick={handleSpeak}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: playing ? T.amber : T.bg3,
              border: `1.5px solid ${playing ? T.amber : T.border}`,
              color: playing ? "#000" : T.amber,
              fontSize: 17, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s",
              animation: playing ? "pulseBtn .6s infinite" : "none",
            }}
            title="Hear pronunciation"
          >
            {playing ? "🔊" : "🔈"}
          </button>
        </div>

        {/* Spice + Diet */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          <SpiceDots level={dish.spiceLevel || 1} />
          <DietBadges dish={dish} />
        </div>

        {/* Tags */}
        {dish.dishTags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {dish.dishTags.map(t => (
              <span key={t} style={{ fontSize: 10, background: T.bg3, border: `1px solid ${T.border}`, color: T.text2, padding: "2px 8px", borderRadius: 12, textTransform: "capitalize", fontWeight: 500 }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expand hint */}
      <div style={{ padding: "7px 16px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: T.text3 }}>📍 {dish.origin}</span>
        <span style={{ fontSize: 11, color: T.amberDim, fontWeight: 700 }}>{open ? "▲ Less" : "▼ Full Details"}</span>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: "0 16px 18px", borderTop: `1px solid ${T.bg3}` }}>

          {/* Pronunciation card */}
          <div style={{ background: T.amberBg, border: `1px solid ${T.amberDim}40`, borderRadius: 14, padding: "12px 14px", marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>👄</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: T.amberDim, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>How to say it</p>
              <p style={{ fontSize: 16, fontFamily: "monospace", color: T.amber, fontWeight: 700, margin: "3px 0 0" }}>/{dish.pronunciation}/</p>
            </div>
            <button onClick={handleSpeak} style={{ background: T.amber, border: "none", borderRadius: 10, padding: "7px 12px", color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>▶ Play</button>
          </div>

          {/* Description */}
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 10, color: T.text3, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>What is it?</p>
            <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.75, margin: 0 }}>{dish.description}</p>
          </div>

          {/* Ingredients */}
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 10, color: T.text3, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Main Ingredients</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {dish.mainIngredients?.map(ing => (
                <span key={ing} style={{ fontSize: 12, background: T.bg3, border: `1px solid ${T.border}`, color: T.text2, padding: "4px 10px", borderRadius: 20, fontWeight: 500 }}>{ing}</span>
              ))}
            </div>
          </div>

          {/* Pairs with */}
          {dish.pairsWith && (
            <div style={{ marginTop: 12, background: T.tealBg, border: `1px solid ${T.teal}30`, borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🍽️</span>
              <div>
                <p style={{ fontSize: 10, color: T.teal, fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Best paired with</p>
                <p style={{ fontSize: 13, color: T.text2, margin: "2px 0 0" }}>{dish.pairsWith}</p>
              </div>
            </div>
          )}

          {/* Calories */}
          {dish.estimatedCalories && (
            <div style={{ marginTop: 10, background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ fontSize: 13, color: T.text2, fontWeight: 600 }}>{dish.estimatedCalories}</span>
            </div>
          )}

          {/* Allergen */}
          {dish.allergenWarning && (
            <div style={{ marginTop: 10, background: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 12, color: "#fca5a5", fontWeight: 600 }}>{dish.allergenWarning}</span>
            </div>
          )}

          {/* Fun fact */}
          {dish.funFact && (
            <div style={{ marginTop: 10, background: "#17082a", border: "1px solid #6b21a820", borderRadius: 12, padding: "10px 12px" }}>
              <p style={{ fontSize: 10, color: "#c084fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Fun Fact</p>
              <p style={{ fontSize: 13, color: "#d8b4fe", margin: 0, lineHeight: 1.6 }}>{dish.funFact}</p>
            </div>
          )}

          {/* Traveler tip */}
          {dish.travelerTip && (
            <div style={{ marginTop: 10, background: "#071a2e", border: "1px solid #1d4ed820", borderRadius: 12, padding: "10px 12px" }}>
              <p style={{ fontSize: 10, color: "#60a5fa", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>🧳 Traveler Tip</p>
              <p style={{ fontSize: 13, color: "#93c5fd", margin: 0, lineHeight: 1.6 }}>{dish.travelerTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CAMERA ────────────────────────────────────────────────────
function Camera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [err, setErr] = useState(null);

  const start = useCallback(async (mode) => {
    setErr(null); setReady(false);
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (e) {
      setErr(e.name === "NotAllowedError"
        ? "Camera permission denied.\nPlease allow camera access in your browser settings."
        : "Camera error: " + e.message);
    }
  }, []);

  useEffect(() => { start(facing); return () => streamRef.current?.getTracks().forEach(t => t.stop()); }, [facing]);

  const capture = () => {
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const preview = c.toDataURL("image/jpeg", 0.92);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(preview.split(",")[1], preview);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 2000, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.8)", zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "9px 18px", borderRadius: 22, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>✕ Cancel</button>
        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 14, letterSpacing: "0.03em" }}>POINT AT MENU</span>
        <button onClick={() => setFacing(f => f === "environment" ? "user" : "environment")} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "9px 18px", borderRadius: 22, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>🔄 Flip</button>
      </div>

      {/* Video */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {err ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
            <span style={{ fontSize: 56 }}>📷</span>
            <p style={{ color: "#fca5a5", fontSize: 15, textAlign: "center", lineHeight: 1.6, whiteSpace: "pre-line" }}>{err}</p>
            <button onClick={() => start(facing)} style={{ background: T.amber, border: "none", color: "#000", padding: "12px 28px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 15 }}>Try Again</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Viewfinder */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "84%", maxWidth: 380, height: 220, position: "relative" }}>
                {/* Dimmed outside */}
                <div style={{ position: "absolute", inset: 0, boxShadow: "0 0 0 2000px rgba(0,0,0,0.5)", borderRadius: 18 }} />
                <div style={{ position: "absolute", inset: 0, border: `2px solid ${T.amber}cc`, borderRadius: 18 }} />
                {/* Corner accents */}
                {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
                  <div key={v+h} style={{
                    position: "absolute", [v]: -2, [h]: -2, width: 26, height: 26,
                    borderTop: v === "top" ? `4px solid ${T.amber}` : "none",
                    borderBottom: v === "bottom" ? `4px solid ${T.amber}` : "none",
                    borderLeft: h === "left" ? `4px solid ${T.amber}` : "none",
                    borderRight: h === "right" ? `4px solid ${T.amber}` : "none",
                  }} />
                ))}
                {/* Scan line */}
                {ready && <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.amber}, transparent)`, animation: "scanLine 2s linear infinite", borderRadius: 2 }} />}
              </div>
            </div>
            <p style={{ position: "absolute", bottom: 118, width: "100%", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, pointerEvents: "none", letterSpacing: "0.03em" }}>
              Fit the menu inside the frame
            </p>
          </>
        )}
      </div>

      {/* Shutter */}
      {!err && (
        <div style={{ padding: "22px 24px 28px", display: "flex", justifyContent: "center", background: "rgba(0,0,0,0.8)" }}>
          <button
            onClick={capture}
            disabled={!ready}
            style={{
              width: 76, height: 76, borderRadius: "50%",
              background: ready ? T.amber : "#292524",
              border: `5px solid ${ready ? "rgba(255,255,255,0.9)" : "#44403c"}`,
              cursor: ready ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, transition: "all .2s",
              boxShadow: ready ? `0 0 0 10px ${T.amber}28` : "none",
            }}
          >
            📷
          </button>
        </div>
      )}
    </div>
  );
}

// ── SCANNING OVERLAY ──────────────────────────────────────────
function Scanning({ preview }) {
  const steps = ["Detecting language & script…","Reading every dish name…","Researching dish information…","Analysing ingredients & allergens…","Building your menu guide…"];
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1700); return () => clearInterval(t); }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(12,10,9,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
      {preview && (
        <div style={{ width: 220, height: 150, borderRadius: 18, overflow: "hidden", border: `2px solid ${T.amber}`, position: "relative", marginBottom: 36 }}>
          <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${T.amber}, transparent)`, animation: "scanLine 1.5s linear infinite" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(12,10,9,0.7))" }} />
        </div>
      )}
      <div style={{ width: "100%", maxWidth: 340 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderRadius: 14, marginBottom: 6, background: i === step ? `${T.amber}12` : "transparent", border: `1px solid ${i === step ? T.amber + "40" : "transparent"}`, opacity: i > step ? 0.2 : 1, transition: "all .3s" }}>
            {i < step
              ? <span style={{ fontSize: 15, color: T.green, flexShrink: 0 }}>✓</span>
              : i === step
                ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${T.amber}`, borderTopColor: "transparent", animation: "spin .7s linear infinite", flexShrink: 0 }} />
                : <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${T.text3}`, flexShrink: 0 }} />
            }
            <span style={{ fontSize: 14, color: i <= step ? T.text1 : T.text3, fontWeight: i === step ? 700 : 400 }}>{s}</span>
          </div>
        ))}
      </div>
      <p style={{ color: T.text3, fontSize: 12, marginTop: 24 }}>AI is researching your menu…</p>
    </div>
  );
}

// ── PHRASES PANEL ─────────────────────────────────────────────
const PHRASES = [
  { en: "Is this spicy?",           hi: "क्या यह तीखा है?",           ph: "Kya yeh teekha hai?",            icon: "🌶️" },
  { en: "Does this have egg?",      hi: "क्या इसमें अंडा है?",         ph: "Kya ismein anda hai?",           icon: "🥚" },
  { en: "Does this have nuts?",     hi: "क्या इसमें मेवे हैं?",        ph: "Kya ismein meve hain?",          icon: "🥜" },
  { en: "Make it less spicy please",hi: "कम तीखा बना दीजिए",           ph: "Kam teekha bana dijiye",         icon: "😌" },
  { en: "I am vegetarian.",         hi: "मैं शाकाहारी हूँ।",           ph: "Main shakahari hoon.",           icon: "🌿" },
  { en: "No dairy please.",         hi: "दूध से बनी चीज़ नहीं।",       ph: "Doodh se bani cheez nahi.",      icon: "🥛" },
  { en: "What do you recommend?",   hi: "आप क्या सुझाते हैं?",         ph: "Aap kya sujhaate hain?",         icon: "⭐" },
  { en: "Does this have seafood?",  hi: "क्या इसमें मछली है?",         ph: "Kya ismein machli hai?",         icon: "🦐" },
  { en: "I have a nut allergy.",    hi: "मुझे मेवों से एलर्जी है।",    ph: "Mujhe mevon se allergy hai.",    icon: "⚠️" },
  { en: "Can I get the bill?",      hi: "बिल लाइए।",                   ph: "Bill laiye.",                    icon: "🧾" },
];

function Phrases({ onClose }) {
  const [copied, setCopied] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg1, borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 600, maxHeight: "82vh", overflowY: "auto", paddingBottom: 36 }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: T.bg3, borderRadius: 4, margin: "14px auto 0" }} />
        {/* Header */}
        <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: T.bg1, zIndex: 1 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 18, color: T.text1, margin: 0 }}>🗣️ Traveler Phrases</p>
            <p style={{ fontSize: 12, color: T.text3, margin: "3px 0 0" }}>Tap Copy — shows Hindi & speaks it aloud</p>
          </div>
          <button onClick={onClose} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: "50%", width: 34, height: 34, cursor: "pointer", color: T.text2, fontSize: 16 }}>✕</button>
        </div>
        {/* Phrases */}
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {PHRASES.map((p, i) => (
            <div key={i} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 18, padding: "14px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: T.text2, fontSize: 13, margin: 0 }}>{p.en}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: T.amber, margin: "3px 0 1px", fontFamily: "'Noto Sans', sans-serif" }}>{p.hi}</p>
                <p style={{ fontSize: 11, color: T.amberDim, fontStyle: "italic", margin: 0 }}>{p.ph}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(p.hi).catch(() => {}); speak(p.hi); setCopied(i); setTimeout(() => setCopied(null), 2000); }}
                style={{ background: copied === i ? "#14532d" : T.amberBg, border: `1px solid ${copied === i ? T.green : T.amberDim}`, color: copied === i ? T.green : T.amber, borderRadius: 12, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
              >
                {copied === i ? "✓ Done" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
const FILTERS = ["All","Veg","Non-Veg","Mild","Spicy","Must Try","Breakfast","Lunch","Dinner","Snack","Dessert","Drink"];
const LANGS = ["English","French","German","Spanish","Japanese","Chinese","Korean","Arabic","Portuguese","Russian","Italian"];

export default function App() {
  const [screen, setScreen] = useState("home"); // home | results
  const [showCam, setShowCam] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState("English");
  const [filter, setFilter] = useState("All");
  const fileRef = useRef();

const process = async (b64, prev, mediaType = "image/jpeg") => {
  setPreview(prev);
  setShowCam(false);
  setScanning(true);
  setError(null);
  setResults(null);

  try {
    const data = await analyzeMenuImage(b64, lang, mediaType);
    setResults(data);
    setScreen("results");
    setFilter("All");
  } catch (e) {
    setError(e.message || "Something went wrong while processing the image.");
  } finally {
    setScanning(false);
  }
};

  const onFile = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;

  const reader = new FileReader();

  reader.onload = (ev) => {
    const dataUrl = ev.target?.result;
    if (typeof dataUrl !== "string") {
      setError("Could not read the uploaded image.");
      return;
    }

    const base64 = dataUrl.split(",")[1];
    const mediaTypeMatch = dataUrl.match(/^data:(.*?);base64,/);
    const mediaType = mediaTypeMatch?.[1] || f.type || "image/jpeg";

    process(base64, dataUrl, mediaType);
  };

  reader.onerror = () => {
    setError("Could not read the uploaded image.");
  };

  reader.readAsDataURL(f);
  e.target.value = "";
};

  const filtered = results?.dishes?.filter(d => {
    if (filter === "All") return true;
    if (filter === "Veg") return d.isVeg;
    if (filter === "Non-Veg") return !d.isVeg;
    if (filter === "Mild") return (d.spiceLevel || 1) <= 2;
    if (filter === "Spicy") return (d.spiceLevel || 1) >= 4;
    if (filter === "Must Try") return d.mustTry;
    return d.mealType === filter;
  }) || [];

  const reset = () => { setScreen("home"); setResults(null); setPreview(null); setFilter("All"); setError(null); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:${T.bg0};color:${T.text1};-webkit-font-smoothing:antialiased}
        button,select{font-family:'Plus Jakarta Sans',sans-serif}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulseBtn{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        @keyframes scanLine{from{top:0}to{top:100%}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        ::-webkit-scrollbar{width:0;height:0}
        select option{background:${T.bg1};color:${T.text1}}
      `}</style>

      {showCam && <Camera onCapture={process} onClose={() => setShowCam(false)} />}
      {scanning && <Scanning preview={preview} />}
      {showPhrases && <Phrases onClose={() => setShowPhrases(false)} />}
     <input
  id="menu-photo-input"
  ref={fileRef}
  type="file"
  accept="image/*,.jpg,.jpeg,.png,.webp"
  capture="environment"
  style={{ display: "none" }}
  onChange={onFile}
/>

      {/* ═══ HOME SCREEN ═══ */}
      {screen === "home" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

          {/* ── Hero ── */}
          <div style={{ position: "relative", padding: "56px 24px 48px", textAlign: "center", overflow: "hidden" }}>
            {/* bg glow */}
            <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${T.amber}18 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Logo mark */}
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 22, background: T.amberBg, border: `1.5px solid ${T.amberDim}40`, marginBottom: 20, fontSize: 36 }}>🍽️</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${T.amber}18`, border: `1px solid ${T.amber}30`, borderRadius: 30, padding: "6px 14px", marginBottom: 20, marginLeft: 12, fontSize: 11, color: T.amberDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", verticalAlign: "middle" }}>
                🇮🇳 AI-Powered
              </div>
              <h1 style={{ fontSize: 40, fontWeight: 900, color: T.text1, lineHeight: 1.1, marginBottom: 14, letterSpacing: "-0.02em" }}>
                Never lost<br /><span style={{ color: T.amber }}>on a menu</span> again.
              </h1>
              <p style={{ color: T.text2, fontSize: 15, lineHeight: 1.8, maxWidth: 320, margin: "0 auto 32px" }}>
                Scan any Indian menu in any script. AI reads the language, researches every dish, and gives you the full guide instantly.
              </p>

              {/* Lang select */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
                <span style={{ color: T.text3, fontSize: 13, fontWeight: 600 }}>Translate to</span>
                <select value={lang} onChange={e => setLang(e.target.value)} style={{ background: T.bg2, border: `1px solid ${T.border}`, color: T.text1, borderRadius: 12, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                  {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* CTA buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setShowCam(true)} style={{ background: T.amber, color: "#000", border: "none", borderRadius: 18, padding: "16px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 9, boxShadow: `0 4px 32px ${T.amber}40` }}>
                  📷 Open Camera
                </button>
                <label
  htmlFor="menu-photo-input"
  style={{
    background: T.bg2,
    color: T.text1,
    border: `1.5px solid ${T.border}`,
    borderRadius: 18,
    padding: "16px 28px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 9,
  }}
>
  🖼️ Upload Photo
</label>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ margin: "0 16px 16px", background: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: 16, padding: "14px 16px", display: "flex", gap: 10, animation: "fadeIn .3s ease" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 700, color: "#fca5a5", fontSize: 14 }}>Error</p>
                <p style={{ color: "#f87171", fontSize: 13, marginTop: 3, lineHeight: 1.6 }}>{error}</p>
              </div>
            </div>
          )}

          {/* How it works */}
          <div style={{ padding: "8px 20px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>How It Works</p>
            {[
              { icon: "📷", t: "Scan or Upload", d: "Any photo of any Indian menu — any language, any handwriting" },
              { icon: "🔍", t: "AI Detects Language", d: "Identifies script automatically: Hindi, Bengali, Tamil, Telugu, and 6 more" },
              { icon: "🌐", t: "AI Researches Every Dish", d: "Looks up ingredients, origin, spice level, allergens, cultural context" },
              { icon: "✨", t: "Your Full Guide", d: "Pronunciation, food description, pairing suggestions, traveler tips" },
            ].map(s => (
              <div key={s.t} style={{ display: "flex", gap: 14, background: T.bg1, borderRadius: 18, padding: "14px 16px", border: `1px solid ${T.border}`, marginBottom: 8 }}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: T.text1 }}>{s.t}</p>
                  <p style={{ fontSize: 13, color: T.text2, marginTop: 3, lineHeight: 1.55 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Supported scripts */}
          <div style={{ padding: "0 20px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Supported Scripts</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[{n:"Hindi",s:"हिंदी"},{n:"Bengali",s:"বাংলা"},{n:"Tamil",s:"தமிழ்"},{n:"Telugu",s:"తెలుగు"},{n:"Kannada",s:"ಕನ್ನಡ"},{n:"Malayalam",s:"മലയാളം"},{n:"Marathi",s:"मराठी"},{n:"Gujarati",s:"ગુજરાતી"},{n:"Punjabi",s:"ਪੰਜਾਬੀ"}].map(s => (
                <div key={s.n} style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16, padding: "12px 8px", textAlign: "center" }}>
                  <p style={{ fontSize: 21, fontWeight: 800, color: T.amber, fontFamily: "'Noto Sans', sans-serif" }}>{s.s}</p>
                  <p style={{ fontSize: 11, color: T.text2, fontWeight: 600, marginTop: 3 }}>{s.n}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phrase helper CTA */}
          <div style={{ padding: "0 20px 48px" }}>
            <button onClick={() => setShowPhrases(true)} style={{ width: "100%", background: T.tealBg, border: `1.5px solid ${T.teal}40`, color: T.teal, borderRadius: 18, padding: "16px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              🗣️ Traveler Phrase Helper
              <span style={{ fontSize: 12, fontWeight: 500, color: `${T.teal}80` }}>10 essential Hindi phrases</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ RESULTS SCREEN ═══ */}
      {screen === "results" && results && (
        <div style={{ minHeight: "100vh", background: T.bg0 }}>

          {/* Sticky top bar */}
          <div style={{ position: "sticky", top: 0, zIndex: 100, background: `${T.bg0}f0`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={reset} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: T.text2, flexShrink: 0 }}>← Back</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 15, color: T.text1, margin: 0 }}>Menu Translated</p>
              <p style={{ fontSize: 11, color: T.text3, margin: "1px 0 0" }}>{results.detectedLanguage} · {results.dishes?.length} dishes</p>
            </div>
            {preview && <img src={preview} alt="menu" style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", border: `2px solid ${T.amberDim}`, flexShrink: 0 }} />}
          </div>

          {/* Stats banner */}
          <div style={{ background: `linear-gradient(135deg, ${T.amberBg}, ${T.bg2})`, borderBottom: `1px solid ${T.border}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: T.text3, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Detected</p>
              <p style={{ color: T.amber, fontWeight: 800, fontSize: 17, marginTop: 1 }}>{results.detectedScript || results.detectedLanguage}</p>
              {results.restaurantType && <p style={{ color: T.text2, fontSize: 12, marginTop: 2 }}>{results.restaurantType}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: T.text1, fontWeight: 900, fontSize: 36, lineHeight: 1 }}>{results.dishes?.length}</p>
              <p style={{ color: T.text3, fontSize: 11 }}>dishes found</p>
              <div style={{ display: "flex", gap: 5, marginTop: 5, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10, background: "#052e16", color: T.green, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{results.dishes?.filter(d => d.isVeg).length} Veg</span>
                <span style={{ fontSize: 10, background: "#2d0a0a", color: T.red, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{results.dishes?.filter(d => !d.isVeg).length} Non-Veg</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "12px 0 4px" }}>
            <div style={{ display: "flex", gap: 7, padding: "0 16px", width: "max-content" }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 15px", borderRadius: 22, fontSize: 12, fontWeight: 700, border: `1px solid ${filter === f ? T.amber : T.border}`, cursor: "pointer", background: filter === f ? T.amber : T.bg1, color: filter === f ? "#000" : T.text2, whiteSpace: "nowrap", transition: "all .15s" }}>
                  {f === "Must Try" ? "★ Must Try" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Dish cards */}
          <div style={{ padding: "8px 16px 120px", display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 20px", color: T.text3 }}>
                <p style={{ fontSize: 48 }}>🍽️</p>
                <p style={{ fontWeight: 700, marginTop: 16, color: T.text2 }}>No dishes match this filter</p>
              </div>
            ) : filtered.map((dish, i) => <DishCard key={dish.id || i} dish={dish} idx={i} />)}
          </div>

          {/* Bottom bar */}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `${T.bg1}f8`, backdropFilter: "blur(16px)", borderTop: `1px solid ${T.border}`, padding: "12px 16px 24px", display: "flex", gap: 10, zIndex: 50 }}>
            <button onClick={reset} style={{ flex: 1, background: T.bg2, border: `1px solid ${T.border}`, color: T.text1, borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              📷 Scan New
            </button>
            <button onClick={() => setShowPhrases(true)} style={{ flex: 1, background: T.amber, color: "#000", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${T.amber}30` }}>
              🗣️ Phrases
            </button>
          </div>
        </div>
      )}
    </>
  );
}
