# Veloura AI Fashion Studio

Light purple React + Express prototype for an AI-integrated fashion customization app.

## Flow

1. Login or sign up
2. Select product, color, size system, size, and gender
3. Prompt AI and upload artwork placement instructions
4. Generate design previews with shuffle suggestions
5. View a VR-style try-on preview, add to cart, pay, and finish with “Wear your imagination”

## Run

```bash
cd veloura-fashion-ai
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5050`

## AI Notes

The current backend returns smart mock generations so the app runs immediately. Add a real AI image API key in `.env` and replace the generator logic in `server/index.js` when you are ready.

## Deploy To Vercel

This project is configured for Vercel with:

- React/Vite static build in `dist`
- Serverless API wrapper in `api/[...path].js`
- Vercel config in `vercel.json`

Deploy from this folder:

```bash
cd /Users/rudraaxlakra/Documents/campus-circle/veloura-fashion-ai
npx vercel login
npx vercel
npx vercel --prod
```

Set these environment variables in the Vercel project dashboard:

```env
AI_PROVIDER=cloudflare
CLOUDFLARE_IMAGE_API_URL=https://free-image-generation-api.rudraax007.workers.dev
CLOUDFLARE_IMAGE_API_KEY=your_cloudflare_worker_key
AI_MOCKUP_COUNT=1
```

Do not set `VITE_API_URL` on Vercel. The frontend should call the same deployed domain using `/api`.
