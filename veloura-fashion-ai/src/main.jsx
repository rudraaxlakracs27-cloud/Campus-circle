import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronLeft,
  CreditCard,
  Crown,
  ImageUp,
  LogIn,
  Palette,
  RefreshCw,
  Shirt,
  ShoppingBag,
  Sparkles,
  UserRound,
  Wand2
} from "lucide-react";
import "./styles.css";

const apiUrl = import.meta.env.VITE_API_URL || "";

const stages = ["Access", "Product", "AI Brief", "Generate", "VR + Pay"];
const products = ["T-Shirt", "Hoodie", "Shoes", "Jacket", "Cap", "Tote"];
const colors = [
  { name: "Lilac Mist", value: "#d9c6ff" },
  { name: "Cloud White", value: "#f9f6ff" },
  { name: "Ink Black", value: "#22172d" },
  { name: "Rose Quartz", value: "#ffd6ec" },
  { name: "Mint Glow", value: "#b8f4df" },
  { name: "Sky Pearl", value: "#b9dcff" }
];
const sizes = {
  UK: ["UK 4", "UK 6", "UK 8", "UK 10", "UK 12", "UK 14"],
  US: ["US XS", "US S", "US M", "US L", "US XL", "US XXL"]
};
const placements = ["Center chest", "Oversized back", "Left sleeve", "Hood edge", "Shoe side panel", "All-over print"];
const genders = ["Women", "Men", "Unisex", "Kids"];

function App() {
  const [stage, setStage] = useState(0);
  const [mode, setMode] = useState("signup");
  const [account, setAccount] = useState({ name: "", email: "" });
  const [product, setProduct] = useState("T-Shirt");
  const [color, setColor] = useState(colors[0]);
  const [sizeSystem, setSizeSystem] = useState("UK");
  const [size, setSize] = useState("UK 8");
  const [gender, setGender] = useState("Unisex");
  const [prompt, setPrompt] = useState("A futuristic lavender floral print with tiny chrome stars");
  const [placement, setPlacement] = useState("Center chest");
  const [image, setImage] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);
  const [order, setOrder] = useState(null);

  const price = useMemo(() => {
    const base = { "T-Shirt": 34, Hoodie: 64, Shoes: 89, Jacket: 118, Cap: 28, Tote: 42 }[product];
    return selectedDesign?.price || base;
  }, [product, selectedDesign]);

  const canContinue = stage !== 0 || (account.name.trim() && account.email.trim());

  async function generateDesigns(shuffle = false) {
    setLoading(true);
    setStage(3);
    setGenerations([]);
    setSelectedDesign(null);
    setAiNotice(null);
    const form = new FormData();
    form.append("product", product);
    form.append("color", color.name);
    form.append("size", size);
    form.append("gender", gender);
    form.append("prompt", shuffle ? `${prompt}. Surprise me with a new premium variation.` : prompt);
    form.append("placement", placement);
    if (image) form.append("image", image);

    try {
      const response = await fetch(`${apiUrl}/api/generate`, { method: "POST", body: form });
      const data = await response.json();
      setGenerations(data.generations || []);
      setSelectedDesign(data.generations?.[0] || null);
      setAiNotice(data.ai || null);
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    const response = await fetch(`${apiUrl}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartTotal: price, email: account.email })
    });
    setOrder(await response.json());
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand">
          <span className="brand-mark"><Crown size={18} /></span>
          <span>Veloura</span>
        </div>
        <div className="stage-track">
          {stages.map((item, index) => (
            <button
              className={`stage-dot ${index === stage ? "active" : ""} ${index < stage ? "done" : ""}`}
              key={item}
              onClick={() => index <= stage && setStage(index)}
            >
              <span>{index + 1}</span>
              {item}
            </button>
          ))}
        </div>
      </nav>

      <section className="studio-grid">
        <aside className="side-rail">
          <p className="eyebrow">AI fashion studio</p>
          <h1>Wear your imagination.</h1>
          <p>
            Design a real product mockup from template to AI print, VR preview,
            cart, payment, and thank-you flow.
          </p>
          <div className="mini-card">
            <Sparkles size={18} />
            <span>Light purple luxury interface with smooth staged creation.</span>
          </div>
        </aside>

        <section className="work-panel">
          {stage === 0 && (
            <AuthStage
              mode={mode}
              setMode={setMode}
              account={account}
              setAccount={setAccount}
              onNext={() => canContinue && setStage(1)}
            />
          )}

          {stage === 1 && (
            <ProductStage
              product={product}
              setProduct={setProduct}
              color={color}
              setColor={setColor}
              sizeSystem={sizeSystem}
              setSizeSystem={(value) => {
                setSizeSystem(value);
                setSize(sizes[value][0]);
              }}
              size={size}
              setSize={setSize}
              gender={gender}
              setGender={setGender}
            />
          )}

          {stage === 2 && (
            <AiBriefStage
              prompt={prompt}
              setPrompt={setPrompt}
              product={product}
              color={color}
              placement={placement}
              setPlacement={setPlacement}
              image={image}
              setImage={setImage}
              onGenerate={() => generateDesigns(false)}
            />
          )}

          {stage === 3 && (
            <GenerateStage
              loading={loading}
              generations={generations}
              selectedDesign={selectedDesign}
              setSelectedDesign={setSelectedDesign}
              onShuffle={() => generateDesigns(true)}
              aiNotice={aiNotice}
            />
          )}

          {stage === 4 && (
            <VrStage
              account={account}
              product={product}
              color={color}
              size={size}
              gender={gender}
              placement={placement}
              selectedDesign={selectedDesign}
              price={price}
              order={order}
              onCheckout={checkout}
            />
          )}

          <footer className="actions">
            <button className="ghost-btn" disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>
              <ChevronLeft size={18} /> Back
            </button>
            {stage < 2 && (
              <button className="primary-btn" disabled={!canContinue} onClick={() => setStage((value) => value + 1)}>
                Continue <ArrowRight size={18} />
              </button>
            )}
            {stage === 3 && selectedDesign && (
              <button className="primary-btn" onClick={() => setStage(4)}>
                View in VR <Camera size={18} />
              </button>
            )}
          </footer>
        </section>
      </section>
    </main>
  );
}

function AuthStage({ mode, setMode, account, setAccount, onNext }) {
  return (
    <div className="stage-card compact">
      <div className="section-title">
        <LogIn />
        <div>
          <p className="eyebrow">Stage 1</p>
          <h2>{mode === "signup" ? "Create your studio account" : "Welcome back"}</h2>
        </div>
      </div>
      <div className="segmented">
        <button className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>Sign up</button>
        <button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Login</button>
      </div>
      <label>
        Name
        <input value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} placeholder="Your name" />
      </label>
      <label>
        Email
        <input value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} placeholder="you@example.com" />
      </label>
      <button className="primary-btn wide" onClick={onNext}>
        Enter studio <ArrowRight size={18} />
      </button>
    </div>
  );
}

function ProductStage(props) {
  return (
    <div className="stage-card">
      <div className="section-title">
        <Shirt />
        <div>
          <p className="eyebrow">Stage 2</p>
          <h2>Select product template</h2>
        </div>
      </div>
      <div className="product-grid">
        {products.map((item) => (
          <button className={`product-tile ${props.product === item ? "selected" : ""}`} key={item} onClick={() => props.setProduct(item)}>
            <ProductIcon name={item} />
            <span>{item}</span>
          </button>
        ))}
      </div>
      <div className="control-grid">
        <fieldset>
          <legend>Product color</legend>
          <div className="swatches">
            {colors.map((item) => (
              <button
                className={props.color.name === item.name ? "active" : ""}
                key={item.name}
                onClick={() => props.setColor(item)}
                title={item.name}
              >
                <span style={{ background: item.value }} />
              </button>
            ))}
          </div>
          <p>{props.color.name}</p>
        </fieldset>
        <fieldset>
          <legend>Size system</legend>
          <div className="segmented">
            {Object.keys(sizes).map((item) => (
              <button key={item} className={props.sizeSystem === item ? "selected" : ""} onClick={() => props.setSizeSystem(item)}>
                {item}
              </button>
            ))}
          </div>
          <select value={props.size} onChange={(event) => props.setSize(event.target.value)}>
            {sizes[props.sizeSystem].map((item) => <option key={item}>{item}</option>)}
          </select>
        </fieldset>
        <fieldset>
          <legend>Gender</legend>
          <select value={props.gender} onChange={(event) => props.setGender(event.target.value)}>
            {genders.map((item) => <option key={item}>{item}</option>)}
          </select>
        </fieldset>
      </div>
    </div>
  );
}

function AiBriefStage({ prompt, setPrompt, product, color, placement, setPlacement, image, setImage, onGenerate }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(image);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [image]);

  return (
    <div className="stage-card">
      <div className="section-title">
        <Wand2 />
        <div>
          <p className="eyebrow">Stage 3</p>
          <h2>PrintVista-style AI editor</h2>
        </div>
      </div>
      <label>
        Design prompt
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} />
      </label>
      <div className="control-grid two">
        <label>
          Placement
          <select value={placement} onChange={(event) => setPlacement(event.target.value)}>
            {placements.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="upload-box">
          <ImageUp size={22} />
          <span>{image ? image.name : "Upload reference image"}</span>
          <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} />
        </label>
      </div>
      <LiveProductPreview product={product} color={color} placement={placement} imageUrl={previewUrl} />
      <button className="primary-btn wide" onClick={onGenerate}>
        Generate masterpiece <Sparkles size={18} />
      </button>
    </div>
  );
}

function LiveProductPreview({ product, color, placement, imageUrl }) {
  const isHoodie = product === "Hoodie";
  const title = imageUrl ? "Reference image placed on product" : "Upload an image to preview the print";
  const printTransform = placement.includes("sleeve")
    ? "translate(136 198) rotate(-16) scale(.58)"
    : placement.includes("Hood")
      ? "translate(200 95) scale(.58)"
      : "translate(166 190)";

  return (
    <div className="live-preview">
      <div>
        <p className="eyebrow">Live mockup</p>
        <h3>{product} preview</h3>
        <span>{title}</span>
      </div>
      <svg className="mockup-svg" viewBox="0 0 520 560" role="img" aria-label={`${product} mockup`}>
        <defs>
          <linearGradient id="liveFabric" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff" stopOpacity=".78" />
            <stop offset=".2" stopColor={color.value} />
            <stop offset=".78" stopColor={color.value} />
            <stop offset="1" stopColor="#2a1d38" stopOpacity=".18" />
          </linearGradient>
          <filter id="liveShadow">
            <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#2a1d38" floodOpacity=".18" />
          </filter>
          <pattern id="liveKnit" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 5h10M5 0v10" stroke="#2a1d38" strokeOpacity=".045" strokeWidth="1" />
          </pattern>
          <clipPath id="livePrintClip">
            <rect x="0" y="0" width="188" height="150" rx="18" />
          </clipPath>
        </defs>
        <rect x="24" y="24" width="472" height="512" rx="34" fill="#fbf8ff" />
        <ellipse cx="260" cy="304" rx="186" ry="204" fill="#8c63e7" opacity=".12" />
        {isHoodie && (
          <>
            <path d="M188 140c10-82 134-112 194-52 29 29 41 75 25 116-41 37-109 38-151 3-31 15-61-7-68-67Z" fill="url(#liveFabric)" stroke="#2a1d38" strokeOpacity=".14" strokeWidth="5" filter="url(#liveShadow)" />
            <path d="M215 165c38 36 91 36 130 0" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="8" strokeLinecap="round" />
            <path d="M238 190c-15 44-11 92 12 142M321 190c15 44 11 92-12 142" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        <g filter="url(#liveShadow)">
          <path d="M162 154h196l76 88-50 64-28-26v178c0 30-24 54-54 54h-84c-30 0-54-24-54-54V280l-28 26-50-64 80-88Z" fill="url(#liveFabric)" stroke="#2a1d38" strokeOpacity=".16" strokeWidth="5" />
          <path d="M182 214c57 24 109 24 156 0" fill="none" stroke="#fff" strokeOpacity=".48" strokeWidth="7" strokeLinecap="round" />
          <rect x="181" y="204" width="158" height="250" rx="24" fill="url(#liveKnit)" opacity=".8" />
          {isHoodie && (
            <>
              <path d="M195 370h130c-4 47-24 74-65 74s-61-27-65-74Z" fill="#fff" fillOpacity=".22" stroke="#2a1d38" strokeOpacity=".08" strokeWidth="5" />
              <path d="M232 222c20 28 36 44 48 48 12-4 28-20 48-48" fill="none" stroke="#2a1d38" strokeOpacity=".13" strokeWidth="5" strokeLinecap="round" />
            </>
          )}
          <g transform={printTransform}>
            <rect width="188" height="150" rx="18" fill="#fff" fillOpacity=".92" stroke="#8c63e7" strokeWidth="5" />
            {imageUrl ? (
              <>
                <image href={imageUrl} x="0" y="0" width="188" height="150" preserveAspectRatio="xMidYMid slice" clipPath="url(#livePrintClip)" />
                <rect width="188" height="150" rx="18" fill="#8c63e7" fillOpacity=".08" />
              </>
            ) : (
              <>
                <path d="M38 82c38-80 74-80 112 0M38 82c38 65 74 65 112 0" fill="none" stroke="#8c63e7" strokeWidth="9" strokeLinecap="round" />
                <circle cx="94" cy="82" r="24" fill="#fff" />
                <path d="M80 82h28M94 68v28" stroke="#2a1d38" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" />
              </>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}

function GenerateStage({ loading, generations, selectedDesign, setSelectedDesign, onShuffle, aiNotice }) {
  return (
    <div className="stage-card">
      <div className="section-title">
        <Palette />
        <div>
          <p className="eyebrow">Stage 4</p>
          <h2>AI product mockups</h2>
        </div>
      </div>
      {aiNotice?.status === "failed" && (
        <div className="ai-alert">
          <strong>AI image generation failed.</strong>
          <span>{aiNotice.error || "OpenAI did not return an image. Showing local previews instead."}</span>
        </div>
      )}
      {aiNotice?.status === "generated" && (
        <div className="ai-alert success">
          <strong>AI image generation active.</strong>
          <span>These previews were generated by the AI image model.</span>
        </div>
      )}
      {loading ? (
        <div className="loading-state">
          <Sparkles />
          <span>Printing the design onto product mockups...</span>
        </div>
      ) : (
        <div className="generation-grid">
          {generations.map((item) => (
            <button className={`design-card ${selectedDesign?.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => setSelectedDesign(item)}>
              <img src={item.image} alt={item.name} />
              <small className={`source-badge ${item.source !== "local-fallback" ? "ai" : ""}`}>
                {item.source !== "local-fallback" ? "AI generated" : "Local preview"}
              </small>
              <strong>{item.name}</strong>
              <span>{item.summary}</span>
            </button>
          ))}
        </div>
      )}
      <button className="ghost-btn wide" onClick={onShuffle}>
        <RefreshCw size={18} /> Shuffle suggestions
      </button>
    </div>
  );
}

function VrStage({ account, product, color, size, gender, placement, selectedDesign, price, order, onCheckout }) {
  return (
    <div className="stage-card">
      <div className="section-title">
        <Camera />
        <div>
          <p className="eyebrow">Stage 5</p>
          <h2>VR preview and checkout</h2>
        </div>
      </div>
      {order ? (
        <div className="thank-you">
          <BadgeCheck size={56} />
          <h2>Thank you, {account.name || "designer"}.</h2>
          <p>{order.message}</p>
          <strong>Order {order.orderId}</strong>
        </div>
      ) : (
        <div className="vr-layout">
          <div className="vr-scene">
            <div className="avatar">
              <UserRound />
              {selectedDesign && <img src={selectedDesign.image} alt="Selected design" />}
            </div>
            <div className="scan-line" />
          </div>
          <div className="cart-panel">
            <h3>Cart</h3>
            <p>{product} / {color.name} / {size} / {gender}</p>
            <p>Placement: {placement}</p>
            <div className="price-row">
              <span>Total</span>
              <strong>${price}</strong>
            </div>
            <button className="primary-btn wide" onClick={onCheckout}>
              <ShoppingBag size={18} /> Add to cart
            </button>
            <button className="pay-btn" onClick={onCheckout}>
              <CreditCard size={18} /> Proceed to payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductIcon({ name }) {
  if (name === "Shoes") return <span className="custom-icon">SH</span>;
  if (name === "Cap") return <span className="custom-icon">CP</span>;
  if (name === "Tote") return <ShoppingBag size={24} />;
  return <Shirt size={24} />;
}

createRoot(document.getElementById("root")).render(<App />);
