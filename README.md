# Orree | ওরি

Cash-on-delivery e-commerce site for Bangladesh, built for Meta and Google Ads
traffic. React 18 + Vite + Tailwind, deployed on Cloudflare Pages, orders stored
in Google Sheets.

```bash
npm ci
cp .env.example .env
npm run dev
```

## Documentation

| doc | for |
|---|---|
| **[HANDOFF.md](./HANDOFF.md)** | **start here** — architecture, tracking, deploy, open items |
| [docs/ADDING-PRODUCTS.md](./docs/ADDING-PRODUCTS.md) | adding a product and its landing page (বাংলা) |
| [docs/CAMPAIGN-SETUP.md](./docs/CAMPAIGN-SETUP.md) | Meta & Google Ads structure, UTM conventions (বাংলা) |
| [CHANGELOG-CRO-PATCH.md](./CHANGELOG-CRO-PATCH.md) | what changed and why |
| [docs/archive/](./docs/archive/) | original project docs — **out of date** |

## Structure

```
/                          main site — organic & repeat traffic
/candy /moshla /combo /coffee   landing pages — all paid traffic
/admin                     no-code content editor
/api/capi                  Meta Conversions API relay
```

Landing routes are generated from the `campaigns` array in
`src/data/siteData.js`; `npm run build` prerenders a static HTML shell per URL
so Meta link previews and crawlers get the right title, description and image.
