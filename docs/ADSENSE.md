# Google AdSense guide

This guide covers preparing Career Reads for AdSense, applying, setting up `ads.txt`, creating ad units, and keeping placements policy-safe.

> AdSense approval is decided by Google and is **not guaranteed**. Nothing in this project can guarantee approval or earnings. Always follow the current [AdSense Program policies](https://support.google.com/adsense/answer/48182).

## 1. Before you apply — readiness checklist

- [ ] **Replace or substantially rewrite the demo articles** with your own original, useful content. Publish a meaningful number of in-depth articles in your main topics before applying.
- [ ] **Real authors:** edit `content/authors/*.json` with real people or your real team; never invent credentials.
- [ ] **Trust pages are accurate:** review `/about`, `/contact`, `/privacy-policy`, `/terms`, `/editorial-policy`, `/corrections-policy`, and `/advertising-disclosure` (`src/app/*/page.tsx`) so they reflect how *you* operate. Update the dates in `src/lib/policies.ts`. Have them reviewed by a legal professional for your jurisdiction.
- [ ] **Working contact method:** set `NEXT_PUBLIC_CONTACT_EMAIL` and configure contact-form delivery.
- [ ] **Own domain** connected, with `NEXT_PUBLIC_SITE_URL` set to it (AdSense reviews a top-level domain you control).
- [ ] **Site is indexed:** Search Console verified and sitemap submitted.
- [ ] Navigation works on mobile and desktop, and there are no broken links (`npm run content:check`, `npm run test:e2e`).

## 2. Apply

1. Sign in at https://adsense.google.com with the Google account that should own the AdSense account.
2. Add your site (the bare domain, e.g. `blognest.com`).
3. Copy your **publisher ID** from *Account → Account information*. It looks like `ca-pub-` followed by 16 digits. Never copy an ID from an example or another site.
4. In Vercel, set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` to that value and keep `NEXT_PUBLIC_ADS_ENABLED=false`. Redeploy.
   - This adds `<meta name="google-adsense-account" content="ca-pub-…">` to every page, which AdSense accepts as a verification method.
   - It also starts serving `/ads.txt` (see below).
5. In AdSense, choose the **meta tag** verification method and request review. Review can take from days to several weeks.

## 3. ads.txt setup

`ads.txt` declares which companies may sell ads on your site. Career Reads generates it automatically at `https://your-domain.com/ads.txt`:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

- `pub-…` is derived from `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (the `ca-` prefix is removed).
- `f08c47fec0942fa0` is Google's published certification authority ID.
- It must be reachable at the **root** of your canonical domain. If you use `www`, make sure the apex domain redirects to it (or serves the same file).
- After deploying, open `/ads.txt` in a browser to confirm, then check *AdSense → Sites*; the status can take a few days to update.
- If you later add other ad networks, add their lines to `src/app/ads.txt/route.ts`.

## 4. After approval — enable ads

1. In AdSense, go to **Ads → By ad unit** and create **Display ads** (responsive) for each placement you want:
   | Placement | Suggested unit | Env variable |
   | --- | --- | --- |
   | In-article | In-article ad (or responsive display) | `NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE` |
   | Desktop sidebar | Responsive display (vertical) | `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` |
   | Below article | Responsive display | `NEXT_PUBLIC_ADSENSE_SLOT_BELOW_ARTICLE` |
   | Between listing rows | Responsive display | `NEXT_PUBLIC_ADSENSE_SLOT_LISTING` |
2. Copy each unit's `data-ad-slot` number into the matching variable.
3. Set `NEXT_PUBLIC_ADS_ENABLED=true` and redeploy.
4. Check a few pages in a private window. New units can show blank space for a while after creation.

Placements without a slot ID render nothing, so you can roll out one placement at a time.

**Auto ads:** this project uses manual ad units for predictable layouts and lower layout shift. If you enable Auto ads in AdSense as well, review the result carefully on mobile and use AdSense's controls to limit ad load.

## 5. Consent (EEA, UK, Switzerland)

Google requires publishers serving ads to users in the EEA, UK, and Switzerland to use a Google-certified consent management platform (CMP).

1. In AdSense, open **Privacy & messaging** and create a **European regulations** message for your site.
2. Publish it. The message is delivered through the AdSense script, so no code changes are needed.
3. The CMP updates Google Consent Mode, which `GoogleAnalytics.tsx` already initializes with region-specific defaults.
4. Consider a **US state regulations** message as well, depending on your audience.

Make sure your privacy policy matches what you actually enable.

## 6. Policy-safe placement (already built in)

- Every ad is labeled **“Advertisement”** and sits in a visually separate container.
- Ads are never placed inside navigation, menus, buttons, or article cards, and never directly next to clickable controls, to avoid accidental clicks.
- No pop-ups, interstitials, or sticky mobile overlays.
- Height is reserved for each unit to minimize layout shift.
- Ads can be disabled per article with `ads: false` in frontmatter (use this for sensitive topics).
- Never click your own ads or ask anyone to click them, and never place ads on pages without real content (error pages, empty categories, search with no results).

## 7. Troubleshooting

| Symptom | Check |
| --- | --- |
| No ad markup at all | Is it a production build? Is `NEXT_PUBLIC_ADS_ENABLED=true`? Is the client ID set? Does the placement have a slot ID? Did you redeploy after changing env vars? |
| Blank space where an ad should be | New units take time to fill; also check ad blockers and the browser console. |
| `ads.txt` not found | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` missing, or a domain redirect issue. |
| "Site not verified" | Confirm the `google-adsense-account` meta tag appears in the page source of your canonical domain. |
