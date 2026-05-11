if (!self.define) {
  let e,
    s = {};
  const c = (c, a) => (
    (c = new URL(c + ".js", a).href),
    s[c] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = c), (e.onload = s), document.head.appendChild(e));
        } else ((e = c), importScripts(c), s());
      }).then(() => {
        let e = s[c];
        if (!e) throw new Error(`Module ${c} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, t) => {
    const n =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[n]) return;
    let i = {};
    const r = (e) => c(e, n),
      d = { module: { uri: n }, exports: i, require: r };
    s[n] = Promise.all(a.map((e) => d[e] || r(e))).then((e) => (t(...e), i));
  };
}
define(["./workbox-f1770938"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "/1.png", revision: "cf10326c35a685365e429f0f14fca07d" },
        {
          url: "/_next/static/4nutkA3wY0iZu6QlJDTfx/_buildManifest.js",
          revision: "7b0688135acb37008e48e0f417196a74",
        },
        {
          url: "/_next/static/4nutkA3wY0iZu6QlJDTfx/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1356-1aa75c7e0c8ab0a1.js",
          revision: "1aa75c7e0c8ab0a1",
        },
        {
          url: "/_next/static/chunks/1646.f9222787e8cf193b.js",
          revision: "f9222787e8cf193b",
        },
        {
          url: "/_next/static/chunks/164f4fb6.e6dae615981bb58c.js",
          revision: "e6dae615981bb58c",
        },
        {
          url: "/_next/static/chunks/1786-1fb395b463055495.js",
          revision: "1fb395b463055495",
        },
        {
          url: "/_next/static/chunks/1952.3d6b10512cd36ed1.js",
          revision: "3d6b10512cd36ed1",
        },
        {
          url: "/_next/static/chunks/217.734d952751f762ff.js",
          revision: "734d952751f762ff",
        },
        {
          url: "/_next/static/chunks/2170a4aa.f8d3849cdb97c01f.js",
          revision: "f8d3849cdb97c01f",
        },
        {
          url: "/_next/static/chunks/2521-5a7285968af8f5b1.js",
          revision: "5a7285968af8f5b1",
        },
        {
          url: "/_next/static/chunks/2564-aca31543b9505c2a.js",
          revision: "aca31543b9505c2a",
        },
        {
          url: "/_next/static/chunks/2619-024c323f8ca0f6aa.js",
          revision: "024c323f8ca0f6aa",
        },
        {
          url: "/_next/static/chunks/280273a7.6b496659f89996dc.js",
          revision: "6b496659f89996dc",
        },
        {
          url: "/_next/static/chunks/2931.2aea9292defeef93.js",
          revision: "2aea9292defeef93",
        },
        {
          url: "/_next/static/chunks/3013-8523db76246a92e9.js",
          revision: "8523db76246a92e9",
        },
        {
          url: "/_next/static/chunks/3171-53b6010cbacd2d08.js",
          revision: "53b6010cbacd2d08",
        },
        {
          url: "/_next/static/chunks/320-75556711bb248a42.js",
          revision: "75556711bb248a42",
        },
        {
          url: "/_next/static/chunks/3343-65eff965a381f23f.js",
          revision: "65eff965a381f23f",
        },
        {
          url: "/_next/static/chunks/343-8cac95d17f14eeec.js",
          revision: "8cac95d17f14eeec",
        },
        {
          url: "/_next/static/chunks/3661-d61480cee5be120f.js",
          revision: "d61480cee5be120f",
        },
        {
          url: "/_next/static/chunks/397-a49d21bc36c91280.js",
          revision: "a49d21bc36c91280",
        },
        {
          url: "/_next/static/chunks/4074-7687cd03a0ecccde.js",
          revision: "7687cd03a0ecccde",
        },
        {
          url: "/_next/static/chunks/4199.32814a8538d6155b.js",
          revision: "32814a8538d6155b",
        },
        {
          url: "/_next/static/chunks/4210.2383f7464b1ac93a.js",
          revision: "2383f7464b1ac93a",
        },
        {
          url: "/_next/static/chunks/4310-00cd8ccb5e44a17c.js",
          revision: "00cd8ccb5e44a17c",
        },
        {
          url: "/_next/static/chunks/4500-7c408ac1b2d5d5ec.js",
          revision: "7c408ac1b2d5d5ec",
        },
        {
          url: "/_next/static/chunks/4530-28944c09143815c2.js",
          revision: "28944c09143815c2",
        },
        {
          url: "/_next/static/chunks/4572-b518d72c74b7b819.js",
          revision: "b518d72c74b7b819",
        },
        {
          url: "/_next/static/chunks/4696-2e93bd98a42de0cf.js",
          revision: "2e93bd98a42de0cf",
        },
        {
          url: "/_next/static/chunks/4790-1e23b3bdc015cd07.js",
          revision: "1e23b3bdc015cd07",
        },
        {
          url: "/_next/static/chunks/4bd1b696-100b9d70ed4e49c1.js",
          revision: "100b9d70ed4e49c1",
        },
        {
          url: "/_next/static/chunks/5139.bab70807d9ac195a.js",
          revision: "bab70807d9ac195a",
        },
        {
          url: "/_next/static/chunks/5154-ca7e96b8db65e409.js",
          revision: "ca7e96b8db65e409",
        },
        {
          url: "/_next/static/chunks/5508-eee5e261bf427ae5.js",
          revision: "eee5e261bf427ae5",
        },
        {
          url: "/_next/static/chunks/5538.90f707260b459809.js",
          revision: "90f707260b459809",
        },
        {
          url: "/_next/static/chunks/563-3a115ef90f4624db.js",
          revision: "3a115ef90f4624db",
        },
        {
          url: "/_next/static/chunks/5687.7961fcb630152dc6.js",
          revision: "7961fcb630152dc6",
        },
        {
          url: "/_next/static/chunks/5707-8ea0b7dfeb1b5701.js",
          revision: "8ea0b7dfeb1b5701",
        },
        {
          url: "/_next/static/chunks/572.5e253c9717128959.js",
          revision: "5e253c9717128959",
        },
        {
          url: "/_next/static/chunks/6093-a9358a55e0a7b19d.js",
          revision: "a9358a55e0a7b19d",
        },
        {
          url: "/_next/static/chunks/6241.a2ddeebf95ce2e26.js",
          revision: "a2ddeebf95ce2e26",
        },
        {
          url: "/_next/static/chunks/646-2453442556d1ad04.js",
          revision: "2453442556d1ad04",
        },
        {
          url: "/_next/static/chunks/64ccbbeb-7936ca1c75df72ad.js",
          revision: "7936ca1c75df72ad",
        },
        {
          url: "/_next/static/chunks/6620-7ed39662487b8f32.js",
          revision: "7ed39662487b8f32",
        },
        {
          url: "/_next/static/chunks/6625-e038509ae6d645ef.js",
          revision: "e038509ae6d645ef",
        },
        {
          url: "/_next/static/chunks/6796-1e60891c066274a6.js",
          revision: "1e60891c066274a6",
        },
        {
          url: "/_next/static/chunks/6826-0016d3169c346980.js",
          revision: "0016d3169c346980",
        },
        {
          url: "/_next/static/chunks/7463-f0156f1b3e0de368.js",
          revision: "f0156f1b3e0de368",
        },
        {
          url: "/_next/static/chunks/754-185a4e823eed22ea.js",
          revision: "185a4e823eed22ea",
        },
        {
          url: "/_next/static/chunks/7596-835ab8ae7bb840ff.js",
          revision: "835ab8ae7bb840ff",
        },
        {
          url: "/_next/static/chunks/7738-b4b7bc89aadf4aa9.js",
          revision: "b4b7bc89aadf4aa9",
        },
        {
          url: "/_next/static/chunks/7815-dcabfb5885a5e340.js",
          revision: "dcabfb5885a5e340",
        },
        {
          url: "/_next/static/chunks/7870-ce10c5c27f48ead4.js",
          revision: "ce10c5c27f48ead4",
        },
        {
          url: "/_next/static/chunks/8049-2170151f12268821.js",
          revision: "2170151f12268821",
        },
        {
          url: "/_next/static/chunks/8110-65d2acecb85a8c52.js",
          revision: "65d2acecb85a8c52",
        },
        {
          url: "/_next/static/chunks/8240.d9d685464d346f26.js",
          revision: "d9d685464d346f26",
        },
        {
          url: "/_next/static/chunks/8275-e1a6c7d3c3e567ad.js",
          revision: "e1a6c7d3c3e567ad",
        },
        {
          url: "/_next/static/chunks/8436.cab94b59cca0a8ff.js",
          revision: "cab94b59cca0a8ff",
        },
        {
          url: "/_next/static/chunks/8720-d3227125c9296de6.js",
          revision: "d3227125c9296de6",
        },
        {
          url: "/_next/static/chunks/8849-28ae82b8c613c70f.js",
          revision: "28ae82b8c613c70f",
        },
        {
          url: "/_next/static/chunks/8cc6faea.06177138421f2356.js",
          revision: "06177138421f2356",
        },
        {
          url: "/_next/static/chunks/9041-e454f047e720f1b9.js",
          revision: "e454f047e720f1b9",
        },
        {
          url: "/_next/static/chunks/906-300c4dddfbf3834f.js",
          revision: "300c4dddfbf3834f",
        },
        {
          url: "/_next/static/chunks/9098-3f6d8772ac3bfa41.js",
          revision: "3f6d8772ac3bfa41",
        },
        {
          url: "/_next/static/chunks/9272-08701163231db20c.js",
          revision: "08701163231db20c",
        },
        {
          url: "/_next/static/chunks/9571-c213b9a68336c601.js",
          revision: "c213b9a68336c601",
        },
        {
          url: "/_next/static/chunks/9881-fedb0e230ae4f59d.js",
          revision: "fedb0e230ae4f59d",
        },
        {
          url: "/_next/static/chunks/994.76a614ba17527b69.js",
          revision: "76a614ba17527b69",
        },
        {
          url: "/_next/static/chunks/9996-fbc626464a378089.js",
          revision: "fbc626464a378089",
        },
        {
          url: "/_next/static/chunks/ad2866b8.e13a3cf75ccf0eb8.js",
          revision: "e13a3cf75ccf0eb8",
        },
        {
          url: "/_next/static/chunks/ad9b3e9a-c10cef5e25eea5f1.js",
          revision: "c10cef5e25eea5f1",
        },
        {
          url: "/_next/static/chunks/app/(protected)/dashboard/loading-a791c4be705d1dde.js",
          revision: "a791c4be705d1dde",
        },
        {
          url: "/_next/static/chunks/app/(protected)/dashboard/page-932916db49ae2438.js",
          revision: "932916db49ae2438",
        },
        {
          url: "/_next/static/chunks/app/(protected)/finances/page-24777f493058fb82.js",
          revision: "24777f493058fb82",
        },
        {
          url: "/_next/static/chunks/app/(protected)/finances/prices/page-5427a75bcedcf9c2.js",
          revision: "5427a75bcedcf9c2",
        },
        {
          url: "/_next/static/chunks/app/(protected)/finances/services/%5BserviceId%5D/edit/page-c3076aa7d1107e43.js",
          revision: "c3076aa7d1107e43",
        },
        {
          url: "/_next/static/chunks/app/(protected)/finances/services/%5BserviceId%5D/history/page-cda0ed1aba72a53c.js",
          revision: "cda0ed1aba72a53c",
        },
        {
          url: "/_next/static/chunks/app/(protected)/finances/services/%5BserviceId%5D/print/page-b0b7883c1553db49.js",
          revision: "b0b7883c1553db49",
        },
        {
          url: "/_next/static/chunks/app/(protected)/finances/services/new/page-57e8c7dba078ce4c.js",
          revision: "57e8c7dba078ce4c",
        },
        {
          url: "/_next/static/chunks/app/(protected)/finances/services/page-15b6f60e9093f2aa.js",
          revision: "15b6f60e9093f2aa",
        },
        {
          url: "/_next/static/chunks/app/(protected)/inventory/page-4fd2d844ea1cc9c1.js",
          revision: "4fd2d844ea1cc9c1",
        },
        {
          url: "/_next/static/chunks/app/(protected)/layout-939c5ea47258de31.js",
          revision: "939c5ea47258de31",
        },
        {
          url: "/_next/static/chunks/app/(protected)/members/%5Bid%5D/declaration/page-2c9f37a3e6f8f28e.js",
          revision: "2c9f37a3e6f8f28e",
        },
        {
          url: "/_next/static/chunks/app/(protected)/members/%5Bid%5D/edit/page-469489738ed6b464.js",
          revision: "469489738ed6b464",
        },
        {
          url: "/_next/static/chunks/app/(protected)/members/%5Bid%5D/page-26592268037c1629.js",
          revision: "26592268037c1629",
        },
        {
          url: "/_next/static/chunks/app/(protected)/members/new/page-c0bd5d9c5bdd208f.js",
          revision: "c0bd5d9c5bdd208f",
        },
        {
          url: "/_next/static/chunks/app/(protected)/members/page-ae61959f286104d1.js",
          revision: "ae61959f286104d1",
        },
        {
          url: "/_next/static/chunks/app/(protected)/rankings/loading-bea4dfe332540cee.js",
          revision: "bea4dfe332540cee",
        },
        {
          url: "/_next/static/chunks/app/(protected)/rankings/page-a08d71673bdfb61b.js",
          revision: "a08d71673bdfb61b",
        },
        {
          url: "/_next/static/chunks/app/(protected)/recovery/page-349ba57c3103ccfa.js",
          revision: "349ba57c3103ccfa",
        },
        {
          url: "/_next/static/chunks/app/(protected)/reports/page-0d22dd3f7410b802.js",
          revision: "0d22dd3f7410b802",
        },
        {
          url: "/_next/static/chunks/app/(protected)/reservations/page-29bc4d9f2bb63595.js",
          revision: "29bc4d9f2bb63595",
        },
        {
          url: "/_next/static/chunks/app/(protected)/sales/%5Bid%5D/edit/page-4f6dc520e3a6e3ba.js",
          revision: "4f6dc520e3a6e3ba",
        },
        {
          url: "/_next/static/chunks/app/(protected)/sales/%5Bid%5D/page-24292142f9824880.js",
          revision: "24292142f9824880",
        },
        {
          url: "/_next/static/chunks/app/(protected)/sales/%5Bid%5D/receipt/page-7b44cb8f46ddb646.js",
          revision: "7b44cb8f46ddb646",
        },
        {
          url: "/_next/static/chunks/app/(protected)/sales/new/page-8dc779cf2f26ba0b.js",
          revision: "8dc779cf2f26ba0b",
        },
        {
          url: "/_next/static/chunks/app/(protected)/sales/page-72af707e90f7a838.js",
          revision: "72af707e90f7a838",
        },
        {
          url: "/_next/static/chunks/app/(protected)/schedule/page-10e4953a9611cace.js",
          revision: "10e4953a9611cace",
        },
        {
          url: "/_next/static/chunks/app/(protected)/settings/page-6a00d495cb11a913.js",
          revision: "6a00d495cb11a913",
        },
        {
          url: "/_next/static/chunks/app/(protected)/subscriptions/page-e404fc322fb789c3.js",
          revision: "e404fc322fb789c3",
        },
        {
          url: "/_next/static/chunks/app/(protected)/tournaments/%5Bid%5D/page-57acff85f207c36e.js",
          revision: "57acff85f207c36e",
        },
        {
          url: "/_next/static/chunks/app/(protected)/tournaments/page-01627c98fd67ae79.js",
          revision: "01627c98fd67ae79",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-d98fa2d2e9625f85.js",
          revision: "d98fa2d2e9625f85",
        },
        {
          url: "/_next/static/chunks/app/api/members/route-a791c4be705d1dde.js",
          revision: "a791c4be705d1dde",
        },
        {
          url: "/_next/static/chunks/app/api/send-email/route-a791c4be705d1dde.js",
          revision: "a791c4be705d1dde",
        },
        {
          url: "/_next/static/chunks/app/api/send-reminders/route-a791c4be705d1dde.js",
          revision: "a791c4be705d1dde",
        },
        {
          url: "/_next/static/chunks/app/api/services/%5BserviceId%5D/route-a791c4be705d1dde.js",
          revision: "a791c4be705d1dde",
        },
        {
          url: "/_next/static/chunks/app/club/page-d97fd17271cd3426.js",
          revision: "d97fd17271cd3426",
        },
        {
          url: "/_next/static/chunks/app/dashboard/members/page-caaf9506a36247cc.js",
          revision: "caaf9506a36247cc",
        },
        {
          url: "/_next/static/chunks/app/layout-b4b3763739008976.js",
          revision: "b4b3763739008976",
        },
        {
          url: "/_next/static/chunks/app/login/page-6695d088206c0138.js",
          revision: "6695d088206c0138",
        },
        {
          url: "/_next/static/chunks/app/page-27b1bd7998bdeb9c.js",
          revision: "27b1bd7998bdeb9c",
        },
        {
          url: "/_next/static/chunks/app/recovery-zone/page-d97fd17271cd3426.js",
          revision: "d97fd17271cd3426",
        },
        {
          url: "/_next/static/chunks/bc98253f.d6fc8a0138855acd.js",
          revision: "d6fc8a0138855acd",
        },
        {
          url: "/_next/static/chunks/d648eb28.05c9445a2e0b2734.js",
          revision: "05c9445a2e0b2734",
        },
        {
          url: "/_next/static/chunks/framework-ab8d3021a5f38f65.js",
          revision: "ab8d3021a5f38f65",
        },
        {
          url: "/_next/static/chunks/main-3b9873faafb29d1b.js",
          revision: "3b9873faafb29d1b",
        },
        {
          url: "/_next/static/chunks/main-app-d773738b2ad28926.js",
          revision: "d773738b2ad28926",
        },
        {
          url: "/_next/static/chunks/pages/_app-e91d44151749b25d.js",
          revision: "e91d44151749b25d",
        },
        {
          url: "/_next/static/chunks/pages/_error-d5437e6632e42397.js",
          revision: "d5437e6632e42397",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-b2eb8e9549052243.js",
          revision: "b2eb8e9549052243",
        },
        {
          url: "/_next/static/css/9c958ac454180bf8.css",
          revision: "9c958ac454180bf8",
        },
        {
          url: "/_next/static/css/cd46083be4cd53a7.css",
          revision: "cd46083be4cd53a7",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.p.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        {
          url: "/apple-touch-icon.png",
          revision: "c9e261202a7a97eac99bbe8e9c41b182",
        },
        { url: "/arm.png", revision: "774b42119b4eee44e0df1df86c8913b3" },
        { url: "/bk-hero.png", revision: "f67976fd400f884241fe62b3aae12ad7" },
        {
          url: "/icons/icon-192x192.png",
          revision: "704ad5d88ae358ac49edffa2a2dc1da0",
        },
        {
          url: "/icons/icon-512x512.png",
          revision: "5c8c3111c95f9db97e25971ef479a639",
        },
        {
          url: "/icons/recovery-192x192.png",
          revision: "7df25daec1b18dfbd619cd700038355e",
        },
        { url: "/legs.webp", revision: "0f58f5dff14551715af590b08918cf0e" },
        { url: "/logo.png", revision: "dcd249cdc1fb9ed48fdf3f8b5b024968" },
        { url: "/manifest.json", revision: "b730d0d113bc86456a005add28220aa3" },
        { url: "/pelvis.webp", revision: "3fdfad04c6f4787d609a6ee8cc733b16" },
        {
          url: "/recovery-hero.png",
          revision: "41690ce5d0f7214c3b1104bbbc0801df",
        },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: s } }) =>
        !(!e || s.startsWith("/api/auth/callback") || !s.startsWith("/api/")),
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: s }, sameOrigin: c }) =>
        "1" === e.headers.get("RSC") &&
        "1" === e.headers.get("Next-Router-Prefetch") &&
        c &&
        !s.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: s }, sameOrigin: c }) =>
        "1" === e.headers.get("RSC") && c && !s.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: s }) => s && !e.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET"
    ));
});
