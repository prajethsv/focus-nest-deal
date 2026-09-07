# Publish Focus Nest for free (static hosting + Formspree)

This setup lets the site live 100% free on Vercel or Netlify. No backend server or
database needed. The waitlist and contact forms go through Formspree's free tier
(50 submissions/month) and land in your email.

## Step 1 — Formspree (about 3 minutes)

1. Sign up free at https://formspree.io
2. Create two forms: **Waitlist** and **Contact**
3. Open each form, go to the **Integration** tab, and copy the form ID
   (it looks like `xrgnabcd`)
4. In the Contact form settings, set your email as the notification recipient

## Step 2 — Paste the IDs (the only code edit)

Open `frontend/src/lib/formspree.js` and replace the two placeholders:

```js
export const FORMSPREE = {
  waitlist: "xrgnabcd",   // your real Waitlist form ID
  contact: "mabcxyzq",    // your real Contact form ID
};
```

Commit and push. That's the whole config.

## Step 3 — Deploy on Vercel (free)

1. Push this repo to GitHub (in Emergent: use "Save to GitHub")
2. Go to https://vercel.com, sign in with GitHub, click **Add New > Project**
3. Import the repo, then set:
   - **Root directory:** `frontend`
   - **Framework preset:** Create React App
   - **Build command:** `yarn build`
   - **Output directory:** `build`
4. Add one environment variable (Settings > Environment Variables):
   - `REACT_APP_BACKEND_URL` = `https://your-site.vercel.app`
   - (only used as a fallback; once Formspree IDs are pasted it is not called)
5. Deploy. You get a free `your-site.vercel.app` URL.

Netlify works the same way: root `frontend`, build `yarn build`, publish `build`.

## Notes

- The `backend/` folder is not needed for this free setup; you can ignore it.
- Until you paste real Formspree IDs, the forms fall back to the built-in
  backend (so they keep working in the Emergent preview).
- Formspree free tier: 50 submissions/month per form, spam protection included.
- Custom domain: free on both Vercel and Netlify; you only pay for the domain
  itself (about $10/year) if you want one.
