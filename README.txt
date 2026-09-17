CUBED CROAKERS — landing page
=============================

WHAT THIS IS
  A static site. No server, no database, no build step. Upload the folder as-is to any static host
  (Netlify / Vercel / Cloudflare Pages / GitHub Pages / IPFS) or open index.html locally.
  Everything the page shows about a croaker is re-derived in the visitor's browser from the same
  compressed generator that lives on Bitcoin (assets/core.js = the mint file's engine + payload).

FILES
  index.html               the page
  assets/site.css          design system (Compressionism: paper / black / gold / green / red)
  assets/site.js           page logic — CONFIG block at the top (see below)
  assets/ring.js           hero: WebGL image ring (three.js, adapted from alphardex's "WebGL Image Ring")
  assets/core.js           the on-chain generator, verbatim, + the compressed payload (parts, shaders, motions, rules)
  assets/rarity.js         rarity model (statistical rarity, ranks #1–#3,333, badges)
  assets/thumbs.js         which thumbnails the hero ring and the 28-background grid use (hashed file names on purpose)
  assets/ring/*.webp       72 thumbnails for the hero ring (file names are hashes so nobody can map them to editions)
  assets/video/*.mp4       the three marketing loops
  assets/fonts/*.woff2     Space Grotesk, JetBrains Mono, Caveat, Archivo Black (self-hosted)
  assets/three.min.js      three.js r128
  assets/og.png            1200×630 share image · assets/favicon.png

CONFIG (top of assets/site.js)
  VERIFY_MINT   true  → before revealing an edition, the finder asks ACME whether CROAKER.NNNN exists.
                       Unminted editions stay hidden ("Not summoned yet"). This is what keeps "what's next" off the page.
                false → reveals any edition 0000–3332 immediately (shows the future — only if you ever want that).
  KNOWN_MINTED  10    → fallback floor if the ACME indexer can't be reached from the visitor's browser:
                       editions below this number are still revealed (marked "mint status unverified").
                       Bump it now and then, or leave it — when ACME answers, it isn't used.
  SITE_URL      ''    → set to the final domain (https://…) so "Share on X" links back to the finder with ?e=NNNN.

MINT VERIFICATION
  The finder calls https://acme.pics/api/assets/CROAKER.NNNN (404 = not minted). That request works only if the
  ACME indexer sends CORS headers to browsers. If a lookup of a minted edition shows "Can't reach ACME right now",
  the indexer is blocking browser requests: either ask ACME to allow your domain, proxy that one URL through your
  host (Cloudflare Worker / Netlify function that forwards the request), or raise KNOWN_MINTED / set VERIFY_MINT:false.

DEEP LINKS
  index.html?e=0330  opens the page and reveals CROAKER.0330 (if minted).

HERO LINE
  Built with "Forever trapped in the Bitcoin blockchain." Alternates, if you want to swap (index.html, .trapped):
  "Sealed in Bitcoin. Forever."  ·  "Trapped in Bitcoin, on purpose."  ·  "Cut, compressed, and trapped in Bitcoin forever."
  ·  "3,333 croakers, locked in Bitcoin for good."

WORDING RULES KEPT
  No storage mechanism named, no block numbers, no transaction ids, no fee other than 4,200 sats, HNFT PEPE only as
  the artist (link: https://x.com/HnftPepe), nothing about which edition comes next.
