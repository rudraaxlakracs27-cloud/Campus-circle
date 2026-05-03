import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: "8mb" }));

const suggestionPacks = [
  {
    title: "Lavender Pulse",
    prompt: "liquid chrome butterflies, soft lavender aura, small chest print",
    palette: ["#efe7ff", "#c9a7ff", "#8c63e7", "#2e2440"]
  },
  {
    title: "Dream Circuit",
    prompt: "minimal AI circuit lines, pearl ink, oversized back placement",
    palette: ["#f7f2ff", "#d9c6ff", "#9f7aea", "#30264d"]
  },
  {
    title: "Moon Bloom",
    prompt: "moonlit flowers, glowing thread, sleeve and hem embroidery",
    palette: ["#fbf8ff", "#e6d9ff", "#b18cff", "#49306b"]
  }
];

const productBlueprints = {
  "T-Shirt": { icon: "shirt", price: 34, fit: "relaxed cotton jersey" },
  Hoodie: { icon: "hoodie", price: 64, fit: "heavy fleece street fit" },
  Shoes: { icon: "shoe", price: 89, fit: "cushioned sneaker build" },
  Jacket: { icon: "jacket", price: 118, fit: "structured premium layer" },
  Cap: { icon: "cap", price: 28, fit: "adjustable curved brim" },
  Tote: { icon: "bag", price: 42, fit: "canvas daily carry" }
};

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "Veloura AI Fashion Studio",
    aiMockups: hasCloudflareImageApi() || hasGeminiKey() || hasOpenAiKey(),
    provider: selectedAiProvider()
  });
});

app.get("/api/products", (_request, response) => {
  response.json({ products: productBlueprints });
});

app.post("/api/generate", upload.single("image"), async (request, response) => {
  const payload = request.body || {};
  const product = payload.product || "T-Shirt";
  const blueprint = productBlueprints[product] || productBlueprints["T-Shirt"];
  const prompt = payload.prompt || "dreamy custom print";
  const placement = payload.placement || "center chest";
  const color = payload.color || "Lilac Mist";
  const uploaded = Boolean(request.file);
  const uploadedDataUrl = request.file
    ? `data:${request.file.mimetype};base64,${request.file.buffer.toString("base64")}`
    : "";

  const renderPayload = { product, blueprint, prompt, placement, color, uploaded, uploadedDataUrl, imageFile: request.file };
  const result = await createMockupGenerations(renderPayload);
  const generations = result.generations;
  const usedAiProvider = generations.some((generation) => generation.source !== "local-fallback");

  response.json({
    message: usedAiProvider ? "AI product mockups generated" : "Local fallback mockups generated",
    ai: {
      attempted: result.aiAttempted,
      status: usedAiProvider ? "generated" : result.aiAttempted ? "failed" : "not-configured",
      error: result.aiError
    },
    generations,
    shuffleSuggestions: suggestionPacks.map((pack) => pack.prompt)
  });
});

app.post("/api/checkout", (request, response) => {
  const { cartTotal = 0, email = "guest@veloura.app" } = request.body || {};

  response.json({
    orderId: `VL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: "paid",
    email,
    cartTotal,
    message: "Thank you. Wear your imagination."
  });
});

async function createMockupGenerations({ product, blueprint, prompt, placement, color, uploaded, uploadedDataUrl, imageFile }) {
  if (selectedAiProvider() === "cloudflare" && hasCloudflareImageApi()) {
    try {
      return {
        aiAttempted: true,
        aiError: "",
        generations: await createCloudflareMockups({ product, blueprint, prompt, placement, color, uploaded })
      };
    } catch (error) {
      console.error("Cloudflare mockup generation failed, using local fallback:", error.message);
      return {
        aiAttempted: true,
        aiError: error.message,
        generations: createLocalMockups({ product, blueprint, prompt, placement, color, uploaded, uploadedDataUrl })
      };
    }
  }

  if (selectedAiProvider() === "gemini" && hasGeminiKey()) {
    try {
      return {
        aiAttempted: true,
        aiError: "",
        generations: await createGeminiMockups({ product, blueprint, prompt, placement, color, uploaded, imageFile })
      };
    } catch (error) {
      console.error("Gemini mockup generation failed, using local fallback:", error.message);
      return {
        aiAttempted: true,
        aiError: error.message,
        generations: createLocalMockups({ product, blueprint, prompt, placement, color, uploaded, uploadedDataUrl })
      };
    }
  }

  if (hasOpenAiKey()) {
    try {
      return {
        aiAttempted: true,
        aiError: "",
        generations: await createOpenAiMockups({ product, blueprint, prompt, placement, color, uploaded, imageFile })
      };
    } catch (error) {
      console.error("OpenAI mockup generation failed, using local fallback:", error.message);
      return {
        aiAttempted: true,
        aiError: error.message,
        generations: createLocalMockups({ product, blueprint, prompt, placement, color, uploaded, uploadedDataUrl })
      };
    }
  }

  return {
    aiAttempted: false,
    aiError: "",
    generations: createLocalMockups({ product, blueprint, prompt, placement, color, uploaded, uploadedDataUrl })
  };
}

async function createCloudflareMockups({ product, blueprint, prompt, placement, color, uploaded }) {
  const count = Math.max(1, Math.min(Number(process.env.AI_MOCKUP_COUNT || 3), 3));
  const packs = createDirectPromptPacks(prompt, count);
  const images = await Promise.all(
    packs.map((pack) => requestCloudflareMockup({
      product,
      color,
      placement,
      prompt: pack.prompt,
      uploaded
    }))
  );

  return images.map((image, index) => ({
    id: `cloudflare-${Date.now()}-${index}`,
    name: packs[index].title,
    image,
    summary: `${blueprint.fit}, ${placement}, Cloudflare AI-generated mockup`,
    price: blueprint.price + index * 9,
    prompt: packs[index].prompt,
    source: "cloudflare"
  }));
}

async function requestCloudflareMockup({ product, color, placement, prompt, uploaded }) {
  const response = await fetch(process.env.CLOUDFLARE_IMAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: buildMockupPrompt({ product, color, placement, prompt, uploaded })
    })
  });

  const contentType = response.headers.get("content-type") || "image/jpeg";

  if (!response.ok) {
    const details = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };
    throw new Error(details.details || details.error || `Cloudflare image request failed with ${response.status}`);
  }

  if (contentType.includes("application/json")) {
    const details = await response.json();
    throw new Error(details.details || details.error || "Cloudflare worker returned JSON instead of an image");
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}


async function createGeminiMockups({ product, blueprint, prompt, placement, color, uploaded, imageFile }) {
  const count = Math.max(1, Math.min(Number(process.env.AI_MOCKUP_COUNT || 3), 3));
  const packs = suggestionPacks.slice(0, count);
  const images = await Promise.all(
    packs.map((pack) => requestGeminiMockup({
      product,
      color,
      placement,
      prompt: `${prompt}. ${pack.prompt}`,
      uploaded,
      imageFile
    }))
  );

  return images.map((image, index) => ({
    id: `gemini-${Date.now()}-${index}`,
    name: packs[index].title,
    image,
    summary: `${blueprint.fit}, ${placement}, Gemini AI-generated product mockup`,
    price: blueprint.price + index * 9,
    prompt: `${prompt}. ${packs[index].prompt}`,
    source: "gemini"
  }));
}

async function requestGeminiMockup({ product, color, placement, prompt, uploaded, imageFile }) {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const parts = [{ text: buildMockupPrompt({ product, color, placement, prompt, uploaded }) }];

  if (uploaded && imageFile) {
    parts.push({
      inline_data: {
        mime_type: imageFile.mimetype,
        data: imageFile.buffer.toString("base64")
      }
    });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini image request failed with ${response.status}`);
  }

  const imagePart = data?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData || part.inline_data);
  const inlineData = imagePart?.inlineData || imagePart?.inline_data;
  const b64 = inlineData?.data;
  const mimeType = inlineData?.mimeType || inlineData?.mime_type || "image/png";

  if (!b64) {
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join(" ");
    throw new Error(text || "Gemini did not return an image");
  }

  return `data:${mimeType};base64,${b64}`;
}

function createLocalMockups({ product, blueprint, prompt, placement, color, uploaded, uploadedDataUrl }) {
  return suggestionPacks.map((pack, index) => ({
    id: `${Date.now()}-${index}`,
    name: pack.title,
    image: createPreviewSvg({
      title: pack.title,
      product,
      color,
      placement,
      prompt: prompt.slice(0, 72),
      palette: pack.palette,
      uploaded,
      uploadedDataUrl
    }),
    summary: `${blueprint.fit}, ${placement}, ${uploaded ? "with uploaded artwork" : "AI-only print"}`,
    price: blueprint.price + index * 7,
    prompt: `${prompt}. ${pack.prompt}`,
    source: "local-fallback"
  }));
}

async function createOpenAiMockups({ product, blueprint, prompt, placement, color, uploaded, imageFile }) {
  const count = Math.max(1, Math.min(Number(process.env.AI_MOCKUP_COUNT || 3), 3));
  const packs = suggestionPacks.slice(0, count);
  const images = await Promise.all(
    packs.map((pack) => requestOpenAiMockup({
      product,
      color,
      placement,
      prompt: `${prompt}. ${pack.prompt}`,
      uploaded,
      imageFile
    }))
  );

  return images.map((image, index) => ({
    id: `ai-${Date.now()}-${index}`,
    name: packs[index].title,
    image,
    summary: `${blueprint.fit}, ${placement}, AI-generated product mockup`,
    price: blueprint.price + index * 9,
    prompt: `${prompt}. ${packs[index].prompt}`,
    source: "openai"
  }));
}

async function requestOpenAiMockup({ product, color, placement, prompt, uploaded, imageFile }) {
  const imagePrompt = buildMockupPrompt({ product, color, placement, prompt, uploaded });
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const size = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
  const quality = process.env.OPENAI_IMAGE_QUALITY || "medium";
  const endpoint = uploaded && imageFile
    ? "https://api.openai.com/v1/images/edits"
    : "https://api.openai.com/v1/images/generations";

  const requestOptions = uploaded && imageFile
    ? buildImageEditRequest({ model, size, quality, prompt: imagePrompt, imageFile })
    : buildImageGenerationRequest({ model, size, quality, prompt: imagePrompt });

  const response = await fetch(endpoint, requestOptions);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI image request failed with ${response.status}`);
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI image response did not include b64_json");
  }

  return `data:image/png;base64,${b64}`;
}

function buildImageGenerationRequest({ model, size, quality, prompt }) {
  return {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, prompt, size, quality, n: 1 })
  };
}

function buildImageEditRequest({ model, size, quality, prompt, imageFile }) {
  const form = new FormData();
  const blob = new Blob([imageFile.buffer], { type: imageFile.mimetype });
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", quality);
  form.append("n", "1");
  form.append("image", blob, imageFile.originalname || "reference.png");

  return {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: form
  };
}

function buildMockupPrompt({ product, color, placement, prompt, uploaded }) {
  const view = String(placement).toLowerCase().includes("back") ? "back view" : "front view";
  const referenceInstruction = uploaded
    ? "Use the provided image only as the artwork/reference print. Place it naturally on the garment as ink on fabric, with folds, lighting, shadows, and fabric texture affecting the print. Do not show a screenshot frame, UI chrome, browser window, white sticker border, or floating card unless it is part of the artwork itself."
    : "Create a premium original print from the design prompt and apply it naturally as ink on the garment.";

  return [
    `Create a photorealistic ecommerce product mockup of exactly one ${color} ${product}, ${view}.`,
    `Print placement: ${placement}.`,
    `The print design MUST be: ${prompt}.`,
    `Make the visible garment color ${color}.`,
    referenceInstruction,
    "Studio product photography, centered garment, clean light neutral background, soft realistic shadow.",
    "The product must look like a real print-on-demand catalog preview, not an illustration, not a vector drawing, not a cartoon.",
    "Do not replace the requested print with butterflies, flowers, random fashion graphics, abstract art, or unrelated decoration.",
    "No mannequins, no people, no extra products, no visible brand logos, no watermark, no UI text."
  ].join(" ");
}

function createDirectPromptPacks(prompt, count) {
  const variants = [
    { title: "AI Mockup", prompt },
    { title: "AI Mockup Close", prompt: `${prompt}, slightly closer product catalog crop` },
    { title: "AI Mockup Studio", prompt: `${prompt}, studio ecommerce product photo` }
  ];

  return variants.slice(0, count);
}

function hasOpenAiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function hasCloudflareImageApi() {
  return Boolean(process.env.CLOUDFLARE_IMAGE_API_URL?.trim() && process.env.CLOUDFLARE_IMAGE_API_KEY?.trim());
}

function selectedAiProvider() {
  if (process.env.AI_PROVIDER?.trim()) {
    return process.env.AI_PROVIDER.trim().toLowerCase();
  }

  if (hasCloudflareImageApi()) return "cloudflare";
  return hasGeminiKey() ? "gemini" : "openai";
}

function createPreviewSvg({ title, product, color, placement, prompt, palette, uploaded, uploadedDataUrl }) {
  const [paper, haze, accent, ink] = palette;
  const fabric = colorToHex(color);
  const productMockup = renderProductMockup({ product, fabric, accent, ink, placement, title, prompt, uploaded, uploadedDataUrl });
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="${paper}" />
        <stop offset="1" stop-color="${haze}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="35%" r="65%">
        <stop stop-color="#ffffff" stop-opacity=".95" />
        <stop offset=".55" stop-color="${accent}" stop-opacity=".42" />
        <stop offset="1" stop-color="${ink}" stop-opacity=".12" />
      </radialGradient>
      <filter id="soft">
        <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="${ink}" flood-opacity=".18"/>
      </filter>
      <filter id="fabricShadow">
        <feDropShadow dx="0" dy="30" stdDeviation="28" flood-color="${ink}" flood-opacity=".2"/>
      </filter>
      <filter id="realShadow">
        <feDropShadow dx="0" dy="34" stdDeviation="34" flood-color="#140d1d" flood-opacity=".28"/>
      </filter>
      <filter id="clothNoise">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="7" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.55 0 0 0 0 0.55 0 0 0 .22 0"/>
      </filter>
      <linearGradient id="fabric" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#ffffff" stop-opacity=".82" />
        <stop offset=".18" stop-color="${fabric}" />
        <stop offset=".7" stop-color="${fabric}" />
        <stop offset="1" stop-color="${ink}" stop-opacity=".18" />
      </linearGradient>
      <linearGradient id="hoodieLight" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#ffffff" stop-opacity=".28"/>
        <stop offset=".24" stop-color="${fabric}"/>
        <stop offset=".62" stop-color="${fabric}"/>
        <stop offset="1" stop-color="#050309" stop-opacity=".38"/>
      </linearGradient>
      <radialGradient id="bodyBulge" cx="50%" cy="42%" r="70%">
        <stop stop-color="#ffffff" stop-opacity=".24"/>
        <stop offset=".56" stop-color="${fabric}" stop-opacity=".18"/>
        <stop offset="1" stop-color="#050309" stop-opacity=".34"/>
      </radialGradient>
      <linearGradient id="printInk" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#ffffff" />
        <stop offset=".45" stop-color="${accent}" />
        <stop offset="1" stop-color="${ink}" />
      </linearGradient>
      <pattern id="microKnit" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 6h12M6 0v12" stroke="${ink}" stroke-opacity=".035" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="900" height="1100" rx="48" fill="#fbf8ff"/>
    <rect x="62" y="58" width="776" height="916" rx="42" fill="url(#bg)" filter="url(#soft)"/>
    <circle cx="450" cy="480" r="380" fill="url(#glow)" opacity=".72"/>
    ${productMockup}
    <text x="450" y="1018" text-anchor="middle" font-family="Inter, Arial" font-size="24" font-weight="800" fill="${ink}" opacity=".82">${escapeXml(product)} realistic mockup</text>
    <text x="450" y="1054" text-anchor="middle" font-family="Inter, Arial" font-size="17" fill="${ink}" opacity=".48">${uploaded ? "reference image printed into fabric" : escapeXml(title)}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function renderProductMockup({ product, fabric, accent, ink, placement, title, prompt, uploaded, uploadedDataUrl }) {
  if (product === "Hoodie") {
    return renderRealisticHoodie({ fabric, accent, ink, placement, title, prompt, uploaded, uploadedDataUrl });
  }

  if (product === "Shoes") {
    return `
      <g filter="url(#fabricShadow)">
        <path d="M206 592c92-70 223-92 352-44 49 18 88 47 136 84l54 43c23 18 18 55-9 66-125 51-326 51-490 11-74-18-111-46-115-82-3-29 21-55 72-78Z" fill="url(#fabric)" stroke="${ink}" stroke-opacity=".16" stroke-width="8"/>
        <path d="M213 641c154 51 343 64 529 24" fill="none" stroke="${ink}" stroke-opacity=".22" stroke-width="10" stroke-linecap="round"/>
        <path d="M307 576c55 38 134 51 245 45" fill="none" stroke="#fff" stroke-opacity=".58" stroke-width="16" stroke-linecap="round"/>
        <g transform="translate(476 580) rotate(8)">
          ${renderPrintPatch({ accent, ink, title, prompt, uploaded, uploadedDataUrl, width: 180, height: 116, rx: 28 })}
        </g>
      </g>
      <text x="450" y="842" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="800" fill="${ink}">${escapeXml(product)} print mockup</text>
      <text x="450" y="880" text-anchor="middle" font-family="Inter, Arial" font-size="20" fill="${ink}" opacity=".62">${escapeXml(placement)}</text>`;
  }

  if (product === "Cap") {
    return `
      <g filter="url(#fabricShadow)">
        <path d="M244 580c24-142 136-230 276-201 85 18 145 80 163 174-146 51-292 59-439 27Z" fill="url(#fabric)" stroke="${ink}" stroke-opacity=".16" stroke-width="8"/>
        <path d="M256 590c137 42 300 34 494 4 34-5 64 21 63 56-1 29-24 52-53 54-178 16-351 8-512-33-22-6-36-28-32-50 4-21 21-36 40-31Z" fill="${fabric}" stroke="${ink}" stroke-opacity=".14" stroke-width="8"/>
        <path d="M310 507c91 30 210 30 308 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="12" stroke-linecap="round"/>
        <g transform="translate(365 478)">
          ${renderPrintPatch({ accent, ink, title, prompt, uploaded, uploadedDataUrl, width: 170, height: 130, rx: 34 })}
        </g>
      </g>
      <text x="450" y="842" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="800" fill="${ink}">${escapeXml(product)} print mockup</text>
      <text x="450" y="880" text-anchor="middle" font-family="Inter, Arial" font-size="20" fill="${ink}" opacity=".62">${escapeXml(placement)}</text>`;
  }

  if (product === "Tote") {
    return `
      <g filter="url(#fabricShadow)">
        <path d="M306 300c13-93 275-93 288 0" fill="none" stroke="${ink}" stroke-opacity=".22" stroke-width="22" stroke-linecap="round"/>
        <path d="M248 348h404l40 486c3 36-25 67-61 67H269c-36 0-64-31-61-67l40-486Z" fill="url(#fabric)" stroke="${ink}" stroke-opacity=".16" stroke-width="8"/>
        <rect x="277" y="383" width="346" height="478" rx="24" fill="url(#microKnit)" opacity=".7"/>
        <g transform="translate(333 500)">
          ${renderPrintPatch({ accent, ink, title, prompt, uploaded, uploadedDataUrl, width: 234, height: 228, rx: 32 })}
        </g>
      </g>
      <text x="450" y="842" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="800" fill="${ink}">${escapeXml(product)} print mockup</text>
      <text x="450" y="880" text-anchor="middle" font-family="Inter, Arial" font-size="20" fill="${ink}" opacity=".62">${escapeXml(placement)}</text>`;
  }

  const isJacket = product === "Jacket";
  const collar = `<path d="M358 274c27 48 58 72 92 72s65-24 92-72" fill="none" stroke="${ink}" stroke-opacity=".22" stroke-width="16" stroke-linecap="round"/>`;
  const opening = isJacket ? `<path d="M450 312v515" stroke="${ink}" stroke-opacity=".22" stroke-width="8"/><circle cx="450" cy="462" r="7" fill="${ink}" opacity=".25"/><circle cx="450" cy="554" r="7" fill="${ink}" opacity=".25"/><circle cx="450" cy="646" r="7" fill="${ink}" opacity=".25"/>` : "";

  return `
    <g filter="url(#fabricShadow)">
      ${collar}
      <path d="M300 268h300l112 124-76 93-42-38v359c0 43-35 78-78 78H384c-43 0-78-35-78-78V447l-42 38-76-93 112-124Z" fill="url(#fabric)" stroke="${ink}" stroke-opacity=".16" stroke-width="8"/>
      <path d="M322 324c35 26 75 39 121 39s90-13 135-39" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="12" stroke-linecap="round"/>
      <path d="M342 422c-10 119-8 257 7 413M558 422c10 119 8 257-7 413" fill="none" stroke="${ink}" stroke-opacity=".08" stroke-width="10" stroke-linecap="round"/>
      <path d="M310 492c91 30 188 30 280 0" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="9" stroke-linecap="round"/>
      ${opening}
      <rect x="327" y="391" width="246" height="362" rx="38" fill="url(#microKnit)" opacity=".72"/>
      <g transform="${placementTransform(placement)}">
        ${renderPrintPatch({ accent, ink, title, prompt, uploaded, uploadedDataUrl, width: 250, height: 220, rx: 34 })}
      </g>
    </g>
    <text x="450" y="842" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="800" fill="${ink}">${escapeXml(product)} print mockup</text>
    <text x="450" y="880" text-anchor="middle" font-family="Inter, Arial" font-size="20" fill="${ink}" opacity=".62">${escapeXml(placement)}</text>`;
}

function renderRealisticHoodie({ accent, ink, placement, title, prompt, uploaded, uploadedDataUrl }) {
  if (String(placement).toLowerCase().includes("back")) {
    return renderRealisticHoodieBack({ accent, ink, placement, title, prompt, uploaded, uploadedDataUrl });
  }

  const print = hoodiePrintPlacement(placement);

  return `
    <g filter="url(#realShadow)">
      <ellipse cx="450" cy="914" rx="235" ry="34" fill="#130d1c" opacity=".18"/>
      <path d="M306 192c28-122 260-122 288 0 25 99-32 172-144 172s-169-73-144-172Z" fill="url(#hoodieLight)" stroke="${ink}" stroke-opacity=".18" stroke-width="7"/>
      <path d="M342 230c52 54 164 54 216 0" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="11" stroke-linecap="round"/>
      <path d="M377 290c42 44 104 44 146 0" fill="none" stroke="${ink}" stroke-opacity=".32" stroke-width="10" stroke-linecap="round"/>

      <path d="M292 322c-72 60-124 133-162 220-19 44-12 93 19 128 32 36 78 42 117 14l44-31v203c0 49 39 88 88 88h104c49 0 88-39 88-88V653l44 31c39 28 85 22 117-14 31-35 38-84 19-128-38-87-90-160-162-220l-70-58H362l-70 58Z" fill="url(#hoodieLight)" stroke="${ink}" stroke-opacity=".16" stroke-width="8"/>
      <path d="M318 348c74 38 190 38 264 0" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="12" stroke-linecap="round"/>
      <path d="M323 418c-22 151-18 313 13 482M577 418c22 151 18 313-13 482" fill="none" stroke="#050309" stroke-opacity=".18" stroke-width="13" stroke-linecap="round"/>
      <path d="M192 546c32 22 66 47 102 76M708 546c-32 22-66 47-102 76" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="12" stroke-linecap="round"/>
      <path d="M316 445h268v426c0 38-31 69-69 69H385c-38 0-69-31-69-69V445Z" fill="url(#bodyBulge)" opacity=".7"/>
      <rect x="314" y="432" width="272" height="454" rx="42" fill="url(#microKnit)" opacity=".5"/>

      ${renderFabricPrint({ ...print, accent, ink, title, prompt, uploaded, uploadedDataUrl })}

      <path d="M346 715h208c-7 83-43 125-104 125s-97-42-104-125Z" fill="#ffffff" fill-opacity=".14" stroke="#050309" stroke-opacity=".15" stroke-width="7"/>
      <path d="M378 750c45 26 99 26 144 0" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="8" stroke-linecap="round"/>
      <path d="M405 354c-23 78-18 147 14 208M495 354c23 78 18 147-14 208" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="7" stroke-linecap="round"/>
      <circle cx="420" cy="575" r="7" fill="#e9ddff" opacity=".88"/><circle cx="480" cy="575" r="7" fill="#e9ddff" opacity=".88"/>
      <path d="M318 892c80 26 184 26 264 0" fill="none" stroke="#050309" stroke-opacity=".2" stroke-width="14" stroke-linecap="round"/>
      <rect x="320" y="898" width="260" height="40" rx="20" fill="#050309" opacity=".14"/>
    </g>`;
}

function renderRealisticHoodieBack({ accent, ink, placement, title, prompt, uploaded, uploadedDataUrl }) {
  const print = { x: 314, y: 382, width: 272, height: 292 };

  return `
    <g filter="url(#realShadow)">
      <ellipse cx="450" cy="914" rx="236" ry="34" fill="#130d1c" opacity=".18"/>
      <path d="M318 184c44-92 220-92 264 0 18 61-3 126-54 165-50 20-106 20-156 0-51-39-72-104-54-165Z" fill="url(#hoodieLight)" stroke="${ink}" stroke-opacity=".16" stroke-width="7"/>
      <path d="M354 246c49 31 143 31 192 0" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="10" stroke-linecap="round"/>

      <path d="M286 318c-73 60-125 136-158 227-17 47-6 99 31 132 32 29 75 32 111 8l44-30v205c0 47 38 85 85 85h102c47 0 85-38 85-85V655l44 30c36 24 79 21 111-8 37-33 48-85 31-132-33-91-85-167-158-227l-74-60H360l-74 60Z" fill="url(#hoodieLight)" stroke="${ink}" stroke-opacity=".16" stroke-width="8"/>
      <path d="M308 354c82 42 202 42 284 0" fill="none" stroke="#fff" stroke-opacity=".23" stroke-width="12" stroke-linecap="round"/>
      <rect x="310" y="380" width="280" height="510" rx="46" fill="url(#bodyBulge)" opacity=".68"/>
      <rect x="312" y="390" width="276" height="496" rx="42" fill="url(#microKnit)" opacity=".48"/>
      <path d="M324 418c-24 155-20 318 12 478M576 418c24 155 20 318-12 478" fill="none" stroke="#050309" stroke-opacity=".16" stroke-width="13" stroke-linecap="round"/>

      ${renderFabricPrint({ ...print, accent, ink, title, prompt, uploaded, uploadedDataUrl })}

      <path d="M184 552c34 23 70 50 110 81M716 552c-34 23-70 50-110 81" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="12" stroke-linecap="round"/>
      <path d="M318 894c80 26 184 26 264 0" fill="none" stroke="#050309" stroke-opacity=".2" stroke-width="14" stroke-linecap="round"/>
      <rect x="320" y="899" width="260" height="40" rx="20" fill="#050309" opacity=".14"/>
      <text x="450" y="346" text-anchor="middle" font-family="Inter, Arial" font-size="18" font-weight="800" fill="#fff" opacity=".34">BACK VIEW</text>
    </g>`;
}

function renderFabricPrint({ x, y, width, height, rotate = 0, accent, ink, title, prompt, uploaded, uploadedDataUrl }) {
  const clipId = `print-${Math.round(x)}-${Math.round(y)}-${Math.round(width)}-${Math.round(height)}`;
  const safeImage = escapeXml(uploadedDataUrl);
  const transform = `translate(${x} ${y}) rotate(${rotate} ${width / 2} ${height / 2})`;
  const fallback = `
    <rect width="${width}" height="${height}" rx="20" fill="${accent}" fill-opacity=".26"/>
    <path d="M${width * 0.18} ${height * 0.55}C${width * 0.34} ${height * 0.1} ${width * 0.66} ${height * 0.1} ${width * 0.82} ${height * 0.55}M${width * 0.18} ${height * 0.55}C${width * 0.34} ${height * 0.9} ${width * 0.66} ${height * 0.9} ${width * 0.82} ${height * 0.55}" fill="none" stroke="url(#printInk)" stroke-width="13" stroke-linecap="round"/>
    <text x="${width / 2}" y="${height - 18}" text-anchor="middle" font-family="Inter, Arial" font-size="18" font-weight="900" fill="${ink}">${escapeXml(title)}</text>`;

  const artwork = uploaded && uploadedDataUrl
    ? `<image href="${safeImage}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
       <rect width="${width}" height="${height}" rx="18" fill="#050309" opacity=".12" clip-path="url(#${clipId})"/>
       <rect width="${width}" height="${height}" rx="18" fill="${accent}" opacity=".14" clip-path="url(#${clipId})"/>`
    : fallback;

  return `
    <g transform="${transform}">
      <clipPath id="${clipId}">
        <path d="M18 0h${width - 36}c10 0 18 8 18 18v${height - 36}c0 10-8 18-18 18H18c-10 0-18-8-18-18V18C0 8 8 0 18 0Z"/>
      </clipPath>
      <g opacity=".92">
        ${artwork}
        <rect width="${width}" height="${height}" rx="18" fill="url(#microKnit)" opacity=".4" clip-path="url(#${clipId})"/>
        <path d="M8 ${height * 0.18}c58 18 126 18 184 0M12 ${height * 0.5}c67 20 148 20 215 0M8 ${height * 0.78}c58 18 126 18 184 0" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="7" stroke-linecap="round" clip-path="url(#${clipId})"/>
        <path d="M0 0h${width}v${height}H0Z" fill="#050309" opacity=".08" clip-path="url(#${clipId})"/>
      </g>
    </g>`;
}

function hoodiePrintPlacement(placement) {
  const value = String(placement).toLowerCase();
  if (value.includes("back")) return { x: 318, y: 398, width: 264, height: 260 };
  if (value.includes("sleeve")) return { x: 194, y: 470, width: 188, height: 132, rotate: -19 };
  if (value.includes("hood")) return { x: 360, y: 206, width: 180, height: 120 };
  if (value.includes("all-over")) return { x: 308, y: 402, width: 284, height: 292 };
  return { x: 330, y: 438, width: 240, height: 210 };
}

function renderPrintPatch({ accent, ink, title, prompt, uploaded, uploadedDataUrl, width, height, rx }) {
  const shortTitle = escapeXml(title);
  const shortPrompt = escapeXml(prompt.split(" ").slice(0, 5).join(" "));
  const safeImage = escapeXml(uploadedDataUrl);
  const artwork = uploadedDataUrl
    ? `<clipPath id="clip-${width}-${height}"><rect x="18" y="18" width="${width - 36}" height="${height - 62}" rx="${Math.max(10, rx - 12)}"/></clipPath>
       <image href="${safeImage}" x="18" y="18" width="${width - 36}" height="${height - 62}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${width}-${height})"/>
       <rect x="18" y="18" width="${width - 36}" height="${height - 62}" rx="${Math.max(10, rx - 12)}" fill="${accent}" fill-opacity=".12"/>`
    : `<path d="M${width * 0.2} ${height * 0.55}C${width * 0.36} ${height * 0.08} ${width * 0.63} ${height * 0.08} ${width * 0.8} ${height * 0.55}M${width * 0.2} ${height * 0.55}C${width * 0.36} ${height * 0.94} ${width * 0.63} ${height * 0.94} ${width * 0.8} ${height * 0.55}" fill="none" stroke="url(#printInk)" stroke-width="11" stroke-linecap="round"/>
       <circle cx="${width * 0.5}" cy="${height * 0.55}" r="${Math.min(width, height) * 0.15}" fill="#fff" fill-opacity=".9"/>
       <path d="M${width * 0.4} ${height * 0.55}h${width * 0.2}M${width * 0.5} ${height * 0.45}v${height * 0.2}" stroke="${ink}" stroke-opacity=".42" stroke-width="6" stroke-linecap="round"/>`;

  return `
    <g>
      <rect width="${width}" height="${height}" rx="${rx}" fill="#ffffff" fill-opacity=".86" stroke="${accent}" stroke-width="6"/>
      <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="${Math.max(12, rx - 12)}" fill="${accent}" fill-opacity=".18"/>
      ${artwork}
      <text x="${width / 2}" y="${height - 36}" text-anchor="middle" font-family="Inter, Arial" font-size="18" font-weight="900" fill="${ink}">${shortTitle}</text>
      <text x="${width / 2}" y="${height - 14}" text-anchor="middle" font-family="Inter, Arial" font-size="12" fill="${ink}" opacity=".58">${uploaded ? "image + ai" : shortPrompt}</text>
    </g>`;
}

function placementTransform(placement) {
  const value = String(placement).toLowerCase();
  if (value.includes("back")) return "translate(345 420) scale(1.0)";
  if (value.includes("sleeve")) return "translate(224 440) rotate(-18) scale(.64)";
  if (value.includes("hood")) return "translate(350 306) scale(.78)";
  if (value.includes("all-over")) return "translate(323 414) scale(1.02)";
  return "translate(325 432)";
}

function colorToHex(color) {
  const values = {
    "Lilac Mist": "#d9c6ff",
    "Cloud White": "#fbf8ff",
    "Ink Black": "#22172d",
    "Rose Quartz": "#ffd6ec",
    "Mint Glow": "#b8f4df",
    "Sky Pearl": "#b9dcff"
  };

  return values[color] || "#d9c6ff";
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Veloura API running on http://localhost:${port}`);
  });
}

export default app;
