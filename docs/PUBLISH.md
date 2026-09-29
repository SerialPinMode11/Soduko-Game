# PUBLISH.md — Publish `soduko-nelson` to the npm public registry

This guide gets `npm install soduko-nelson` working in **any** other project by publishing this package to the [npm registry](https://www.npmjs.com/).

After a successful publish, consumers only need:

```bash
npm install soduko-nelson
```

```js
import { mountSudoku } from 'soduko-nelson';
import 'soduko-nelson/dist/soduko-nelson.css';
mountSudoku(document.getElementById('game'));
```

---

## 1. Prerequisites

1. An [npmjs.com](https://www.npmjs.com/signup) account (email verified).
2. Node.js + npm installed locally.
3. This repo builds cleanly:

```bash
cd "path/to/Game Test"
npm install
npm run build
```

You should see files under `dist/`:

- `soduko-nelson.js`
- `soduko-nelson.umd.js`
- `soduko-nelson.css`

---

## 2. Check that the package name is free

The name in `package.json` is `soduko-nelson`. Names on npm are **global and unique**.

```bash
npm view soduko-nelson
```

| Result | Meaning |
|--------|---------|
| `404` / not found | Name is free — you can publish. |
| Package info prints | Name is taken — rename in `package.json` (e.g. `@your-username/soduko-nelson`) before publishing. |

---

## 3. Log in to npm

```bash
npm login
```

Follow the prompts (username, password, email, OTP if 2FA is on).

Confirm:

```bash
npm whoami
```

---

## 4. Dry-run before publishing (recommended)

See exactly what would be uploaded (only `dist/`, `README.md`, `LICENSE` — per the `files` field):

```bash
npm pack --dry-run
```

Or create a real tarball and inspect it:

```bash
npm pack
# opens soduko-nelson-1.0.0.tgz — delete it after checking
```

Optional: install that tarball into a throwaway folder to test first:

```bash
mkdir %TEMP%\soduko-host-test
cd %TEMP%\soduko-host-test
npm init -y
npm install "path/to/soduko-nelson-1.0.0.tgz"
```

---

## 5. Publish to the public registry

From the package root (this repo):

```bash
npm publish --access public
```

Notes:

- `prepublishOnly` runs `npm run build` automatically before publish.
- Use `--access public` especially if you later switch to a **scoped** name (`@user/...`). Unscoped packages like `soduko-nelson` are public by default, but the flag is harmless.
- First publish uses the version in `package.json` (`1.0.0`). You **cannot** republish the same version.

If publish succeeds, the package appears at:

`https://www.npmjs.com/package/soduko-nelson`

---

## 6. Verify in another project

```bash
mkdir my-host-app
cd my-host-app
npm init -y
npm install soduko-nelson
```

Confirm `node_modules/soduko-nelson/dist/` exists, then mount the game (Vite / plain HTML / React — see root `README.md`).

CDN mirrors (unpkg / jsDelivr) usually update within a few minutes after publish.

---

## 7. Publishing updates later

1. Change code and bump the version in `package.json`:

```bash
npm version patch   # 1.0.0 → 1.0.1  (bug fixes)
npm version minor   # 1.0.0 → 1.1.0  (new features)
npm version major   # 1.0.0 → 2.0.0  (breaking changes)
```

2. Publish again:

```bash
npm publish --access public
```

Hosts update with:

```bash
npm install soduko-nelson@latest
```

---

## 8. If the name `soduko-nelson` is taken

Use a scoped package instead:

1. In `package.json`, set:

```json
"name": "@your-npm-username/soduko-nelson"
```

2. Publish:

```bash
npm publish --access public
```

3. Install:

```bash
npm install @your-npm-username/soduko-nelson
```

Update import paths in docs / examples to match the scoped name.

---

## 9. If npm signup shows “Access is temporarily restricted”

npm often blocks new signups when it thinks the request looks automated (VPN, shared IP, DevTools open, rapid clicks, corporate network).

### Try these first (in order)

1. **Close browser DevTools / Cursor Simple Browser** and open signup in a normal browser window (Chrome/Edge), with no extensions if possible.
2. **Turn off VPN** (or try a different network — phone hotspot is often enough).
3. **Wait 15–60 minutes** and retry; the block is usually temporary for IP `…` shown on the page.
4. Use the page’s **“Submit feedback”** link and include the ID shown (e.g. `52d63390-…`) so npm can unblock you.
5. If you **already have** an npm account, skip signup and run:
   ```bash
   npm login
   ```
   (or use “Sign in” on npmjs.com, including **Sign in with GitHub** if offered).

### Share the plugin without the public registry (works today)

Until your npm account works, other projects can still install your plugin:

**A. Local path**
```bash
npm install "C:/Users/innsite/Documents/VSCode/Game Test"
```

**B. Packed tarball**
```bash
cd "C:/Users/innsite/Documents/VSCode/Game Test"
npm run build
npm pack
# then in the other project:
npm install path/to/soduko-nelson-1.0.0.tgz
```

**C. Git URL** (if the repo is on GitHub)
```bash
npm install git+https://github.com/YOUR_USER/YOUR_REPO.git
```
Note: the repo must contain a built `dist/` **or** consumers must run build after install. Prefer publishing a release tag that includes `dist/`, or keep using path/tarball until npm publish works.

You **cannot** get a global `npm install soduko-nelson` (no path) until the package is published under an npm account.

### Alternative registry later: GitHub Packages

If npm signup stays blocked, you can publish to GitHub Packages under `@your-github-username/soduko-nelson` instead. That uses a different install name and a project `.npmrc` — use only if you need a registry soon; public npm remains the simplest for `npm install soduko-nelson`.

---

## 10. Common errors

| Error | Fix |
|-------|-----|
| `Access is temporarily restricted` on signup | See §9 — change network / wait / feedback; use path or `.tgz` until unblocked |
| `You must be logged in` | Run `npm login` |
| `Package name too similar` / `already exists` | Rename or use a scope (`@user/...`) |
| `You cannot publish over the previously published versions` | Bump `version` in `package.json` |
| `402 Payment Required` (scoped private) | Add `--access public` |
| OTP / 2FA required | Enter the one-time code from your authenticator |

---

## 11. Checklist

- [ ] `npm run build` succeeds
- [ ] `npm view soduko-nelson` shows the name is free (or you chose a scoped name)
- [ ] npm account works (`npm whoami`) — if signup is blocked, see §9
- [ ] `npm pack --dry-run` looks correct (no `resources/`, no `node_modules/`)
- [ ] `npm publish --access public` succeeds
- [ ] Fresh project: `npm install soduko-nelson` works

---

*Related: [PLUG-IN.md](./PLUG-IN.md) (plugin design), root [README.md](../README.md) (consumer usage).*
