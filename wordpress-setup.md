# WordPress Setup për PulseMag

Ky projekt lexon përmbajtje nga WordPress përmes REST API dhe pret kategori me `slug`-e specifike. Që integrimi të funksionojë pa surpriza, ndiq hapat më poshtë.

## 1. Kategoritë që duhen krijuar

Krijo këto kategori në WordPress me saktësisht këto `slug`:

- `sport`
- `teknologji`
- `moda`
- `lifestyle`
- `horoskop`

Emrat mund të jenë të shkruar ndryshe në panel, por `slug` duhet të mbetet i njëjtë me frontend-in.

## 2. Permalinks

Në WordPress shko te `Settings > Permalinks` dhe zgjidh `Post name`.

Kjo ndihmon që link-et të jenë të pastra dhe më të stabilizuara për `link`-et që lexon frontend-i.

## 3. REST API që përdor frontend-i

Frontend-i kërkon këto endpoint-e:

- `GET /wp-json/wp/v2/categories?per_page=100`
- `GET /wp-json/wp/v2/posts?categories={categoryId}&per_page=4&_embed`

`_embed` është i rëndësishëm sepse faqja merr `featured image` direkt nga të dhënat e postimit.

## 4. Featured Images

Për çdo postim që do të shfaqet në homepage:

- vendos një `featured image`
- sigurohu që tema WordPress të mbështesë `post-thumbnails`
- nëse përdor një child theme ose custom theme, shto mbështetjen me `add_theme_support('post-thumbnails')`

Pa `featured image`, karta në frontend do të shfaqet me gradient fallback.

## 5. CORS dhe zhvillimi lokal

Nëse frontend-i hapet nga një origin tjetër, browser-i mund ta bllokojë thirrjen e API-së.

Në zhvillim lokal ka tre raste tipike:

- Frontend dhe WordPress janë në të njëjtin domain: zakonisht nuk ka problem.
- Frontend është në `http://localhost` dhe WordPress në një domain tjetër: mund të duhet CORS header.
- Frontend hapet direkt si file `index.html`: disa browser-a e trajtojnë si origjinë të kufizuar dhe `fetch` mund të dështojë.

Nëse ndodh CORS, zgjidhja më e pastër është:

- të shërbesh frontend-in me një server lokal
- ose të shtosh header-et e duhura në WordPress / reverse proxy

## 6. Si përputhen slug-et me frontend-in

Frontend-i mban këtë mapping:

- `sport` -> kategori sportive
- `teknologji` -> kategori teknologjie
- `moda` -> kategori mode
- `lifestyle` -> kategori lifestyle
- `horoskop` -> kategori horoskopi

Nëse një kategori nuk ekziston, faqja përdor përmbajtje demo që layout-i të mos prishet.

## 7. Formati minimal i postimit

Për secilin postim, mjafton që të kesh:

- titull
- excerpt
- `featured image`
- kategori të lidhur me postimin
- datë publikimi

Shembull i thjeshtë i strukturës që frontend-i lexon:

```json
{
  "title": { "rendered": "Titulli i artikullit" },
  "excerpt": { "rendered": "Përmbledhja e artikullit" },
  "date": "2026-03-24T10:00:00",
  "link": "https://site.example.com/postim-i-ri",
  "_embedded": {
    "wp:featuredmedia": [
      {
        "source_url": "https://site.example.com/wp-content/uploads/image.jpg"
      }
    ]
  }
}
```

## 8. Kontrolli final

Pas konfigurimit:

1. Hape endpoint-in e kategorive dhe verifiko që slug-et ekzistojnë.
2. Hape një endpoint postimesh për secilën kategori.
3. Sigurohu që postimet kanë `featured image`.
4. Ndrysho `window.WORDPRESS_API_BASE` te `index.html` në URL-në reale të WordPress.
