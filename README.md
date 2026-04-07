# PulseMag

Portal editorial i ndërtuar me React në frontend dhe i përgatitur për WordPress si CMS.

## Çfarë përfshin

- Kategori të ndara: `sport`, `teknologji`, `moda`, `lifestyle`, `horoskop`, `kulture`, `kinema`, `celebrities-influencers`
- Frontend dinamik në React
- Lidhje me WordPress REST API
- Përmbajtje demo automatike kur WordPress nuk është i disponueshëm

## Si ta nisësh lokalisht

Kërkohen `node` dhe `npm`.

```powershell
npm install
npm run dev
```

Pastaj hap `http://localhost:4173` në browser.

## Paneli Basic për postime

Projekti përfshin një panel privat lokal te:

```text
http://localhost:4173/admin.html
```

Ky panel krijon postime në WordPress.com përmes një endpoint-i lokal në [server.js](C:\Users\Admin\Documents\New project\server.js), që kredencialet të mos ekspozohen në frontend publik.

Para nisjes, në PowerShell vendos këto environment variables:

```powershell
$env:WPCOM_SITE="casualnewsmag26.wordpress.com"
$env:WPCOM_CLIENT_ID="vendos-client-id"
$env:WPCOM_CLIENT_SECRET="vendos-client-secret"
$env:WPCOM_REDIRECT_URI="http://localhost:4173/oauth/callback"
$env:GEMINI_API_KEY="vendos-gemini-key"
$env:PEXELS_API_KEY="vendos-pexels-key"
$env:FACEBOOK_PAGE_ID="vendos-facebook-page-id"
$env:FACEBOOK_PAGE_ACCESS_TOKEN="vendos-facebook-page-token"
npm run dev
```

Pastaj hape `http://localhost:4173/admin.html` dhe kliko `Lidhu tani` për të përfunduar OAuth me WordPress.com.

Shënim i rëndësishëm:

- te aplikacioni yt në WordPress.com, `Redirect URL` duhet të jetë `http://localhost:4173/oauth/callback`
- pas lidhjes, token-i mbahet në memorien e serverit lokal deri sa ta mbyllësh atë

Paneli `basic` lejon:

- titull
- kategori
- nënkategori sporti
- nënkategori teknologjie
- përmbledhje
- përmbajtje
- ngarkim fotoje si `featured image`
- `draft` ose `publish`

Kur `FACEBOOK_PAGE_ID` dhe `FACEBOOK_PAGE_ACCESS_TOKEN` janë vendosur, postimet e publikuara (`publish`) dërgohen automatikisht edhe në Facebook Page.

Shënim:

- paneli funksionon lokalisht, jo në GitHub Pages
- GitHub Pages vazhdon të shfaqë faqen publike, ndërsa paneli përdoret vetëm nga kompjuteri yt

## Deploy në GitHub Pages

Ky projekt përfshin workflow gati për GitHub Pages te:
[deploy-pages.yml](C:\Users\Admin\Documents\New project\.github\workflows\deploy-pages.yml)

Pas `push` në branch-in `main`, GitHub Actions do ta publikojë automatikisht faqen.

Linku pritet të jetë:

```text
https://news.pulsemag.net/
```

## Si lidhet me WordPress

Në [index.html](C:\Users\Admin\Documents\New project\index.html) ekziston kjo variabël:

```html
window.WORDPRESS_API_BASE = "https://public-api.wordpress.com/rest/v1.1/sites/casualnewsmag26.wordpress.com";
```

Për WordPress.com përdor formatin:

```html
window.WORDPRESS_API_BASE = "https://public-api.wordpress.com/rest/v1.1/sites/emriyt.wordpress.com";
```

Për një instalim klasik WordPress.org ose hosting privat përdor formatin:

```html
window.WORDPRESS_API_BASE = "https://domena-jote.com/wp-json/wp/v2";
```

## Kategoritë që duhen krijuar në WordPress

Krijo këto kategori me të njëjtat `slug`:

- `sport`
- `teknologji`
- `moda`
- `lifestyle`
- `horoskop`
- `kulture`
- `kinema`
- `celebrities-influencers`

Pastaj shto postime në secilën kategori dhe, nëse dëshiron, vendos `featured image` që të shfaqet në kartat e faqes.

## Shënim

Nëse WordPress nuk përgjigjet ose kategoritë nuk ekzistojnë ende, faqja shfaq automatikisht postime demo që dizajni të mbetet funksional.
## Faqe legale per Meta

Pasi te besh deploy ne GitHub Pages, perdor keto URL:

```text
https://news.pulsemag.net/privacy.html
https://news.pulsemag.net/terms.html
```
