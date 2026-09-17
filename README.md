# V-dret 🌩️

En Expo-app (React Native + webb) för väderövervakning och områdesbevakning: aktuellt väder, åska/blixtrisk och blåst
kring din plats, en interaktiv väderradar, och möjlighet att dela en plats direkt väder via länk med andra – de kan
öppna länken i appen eller i webbläsaren, utan att behöva installera något.

## Funktioner

- **Aktuellt väder** för din position (temperatur, känns-som, vind, byvind, riktning, nederbörd).
- **Noteringar** som varnar för åska (pågående eller väntad) och kraftig blåst, baserat på vädermodellens
  vädersymbol, byvind och instabilitetsindex (CAPE).
- **Bevakade områden**: lägg till flera platser (sök på namn eller använd nuvarande plats) och se status för alla
  på en gång, med bakgrundskontroller och push-notiser vid åska/hård vind.
- **Väderradar**: nederbördsradar på karta (RainViewer), med tidslinje bakåt i tiden och dina bevakade platser
  utmarkerade. Fungerar både i appen (native karta) och i webbläsaren (Leaflet/OpenStreetMap).
- **Dela väder**: dela en länk till valfri plats. Öppnas länken i webbläsaren visas samma väderdata direkt – mottagaren
  behöver inte ha appen installerad, förutsatt att webbversionen är driftsatt (se nedan).

## Datakällor

| Data | Källa | Behöver API-nyckel |
|---|---|---|
| Väderprognos, vind, nederbörd, vädersymbol | [Open-Meteo](https://open-meteo.com) | Nej |
| Platssökning (geokodning) | Open-Meteo Geocoding API | Nej |
| Nederbördsradar | [RainViewer](https://www.rainviewer.com/api.html) | Nej |
| Kartor (native) | Apple Maps (iOS) / Google Maps (Android) via `react-native-maps` | Ja, för Android-produktionsbygge |
| Kartor (webb) | OpenStreetMap via Leaflet | Nej |

**Om blixtar:** riktig realtidsdata för enskilda blixtnedslag kräver en separat betaltjänst (t.ex. Blitzortung,
Tomorrow.io eller liknande). Appen härleder istället en åskrisk/åskvarning från vädermodellens egna åsksymboler och
instabilitetsindex (CAPE), vilket täcker "notiser om åska" utan extern nyckel. Vill du koppla in en riktig
blixtdatakälla senare är `lib/openMeteo.ts` (`deriveNotices`) rätt ställe att bygga vidare på.

## Kom igång

```bash
npm install
npm run start      # Expo Dev Tools – skanna QR med Expo Go, eller
npm run ios        # kräver macOS
npm run android
npm run web
```

Typkontroll: `npm run typecheck`

## Miljövariabler (valfria)

Skapa en `.env` (läses av `app.config.js`):

- `GOOGLE_MAPS_ANDROID_API_KEY` – krävs för att kartan ska fungera i ett fristående Android-bygge (EAS build).
  Behövs inte i Expo Go/webb under utveckling.
- `WEB_BASE_URL` – den publika URL där webbversionen är driftsatt, t.ex. `https://vader.example.com`. Sätts denna
  byggs delningslänkar som riktiga `https://...`-länkar istället för appens interna `vdret://`-länk, så att alla kan
  öppna dem i valfri webbläsare.

## Driftsätta webbversionen (för att delningslänkar ska fungera för alla)

```bash
npm run export:web   # bygger en statisk SPA i ./dist
```

Ladda upp `dist/`-mappen till valfri statisk webbhotell (Vercel, Netlify, GitHub Pages, Cloudflare Pages …).
Appen är byggd som en enda sida (`web.output: "single"`), så värdtjänsten måste skicka **alla** sökvägar till
`index.html` (SPA-fallback/rewrite). Exempel för Netlify (`dist/_redirects`):

```
/*  /index.html  200
```

Sätt sedan `WEB_BASE_URL` till din driftsatta domän innan du bygger appen, så genereras korrekta delningslänkar.

## Bakgrundsbevakning och notiser

Under **Inställningar** kan du slå på bakgrundsbevakning: appen kontrollerar dina sparade områden i bakgrunden
(via `expo-background-fetch`/`expo-task-manager`) och skickar en lokal notis vid ny åska eller hård vind.
Bakgrundskörning på riktiga enheter styrs av OS och är begränsad i Expo Go – för tillförlitlig bakgrundsbevakning i
skarpt läge, gör ett utvecklings-/produktionsbygge med [EAS Build](https://docs.expo.dev/build/introduction/).

## Projektstruktur

```
app/                 Expo Router-skärmar (filbaserad routing)
  _layout.tsx         Rot-layout (Stack)
  (tabs)/             Flikar: Väder, Radar, Områden, Inställningar
  omrade/[id].tsx      Detaljvy för ett sparat område
components/          Återanvändbara UI-komponenter
hooks/               useWeather, useRadarFrames
lib/                 Väder/radar/geokodnings-API:er, lagring, notiser, delning
constants/theme.ts   Färgtema
```

## Dela en plats

Tryck **"Dela väder"** på start- eller områdesvyn. Detta öppnar systemets delningsdialog med en länk som innehåller
plats, latitud och longitud. Den som öppnar länken ser samma väder, åska/blåst-noteringar och kan spara platsen
själva – utan att i förväg behöva lägga till den manuellt.
