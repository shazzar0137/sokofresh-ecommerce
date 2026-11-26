# 0013. Maps and location: Google Maps Platform

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny) requested Google Maps integration; API selection and design by the Project Architect

## Context
The approved architecture deferred maps ("zones are a list"). The owner asked for Google Maps integration and decided that **fast delivery** covers Nairobi and its immediate satellite towns (e.g. Ruaka, Rongai, Ngong, Mlolongo, Limuru, Thika), with slots for the rest of Kiambu, Kajiado and Machakos. Kenyan addresses are often informal (estate, landmark), so a confirmed map pin makes delivery partners far more accurate.

## Options considered
| Option | For | Against |
|---|---|---|
| **Google Maps Platform** | Best Kenyan place and landmark coverage; official React library; owner's choice | Needs a Google Cloud billing account; usage-priced above free caps; caching rules; medium lock-in |
| OpenStreetMap (Leaflet + a hosted geocoder) | Open data, low lock-in | Weaker Kenyan address search; public Nominatim usage policy forbids heavy use |
| Mapbox | Good maps | Weaker local place data; also usage-priced |

## Decision
**Google Maps Platform**, behind adapters so it can be replaced.

| Need | Google product | Where called |
|---|---|---|
| Address search while typing (estates, buildings, landmarks) | Places API (New) Autocomplete, with session tokens, restricted to Kenya | Browser |
| Confirm exact drop-off point | Maps JavaScript API map with a draggable pin (customer confirms) | Browser |
| Coordinates ↔ address, county check | Geocoding API (server) | Backend `GeoService` |
| Driving distance and ETA with traffic (fast-zone ETA, fee bands) | Routes API (Compute Routes / Route Matrix, Essentials) | Backend `GeoService`, only at quote/checkout, never per keystroke |
| Delivery partner navigation | Google Maps **URLs** ("Open in Google Maps" link with the pin): no API cost | Rider/partner screen |
| Staff view of delivery points | Map in the staff order view (Django admin widget, later) | Admin |

Frontend library: `@vis.gl/react-google-maps` (Google-sponsored React components for the Maps JavaScript API).

**Fast-zone rule (configurable in Django admin, `StoreSettings`):**
- `dispatch_point` (lat/lng): **provisional Nairobi CBD**; owner to set the real dispatch location.
- `fast_radius_km`: **42 km straight-line** (covers Thika ≈ 40 km, Limuru ≈ 27 km, Mlolongo/Ngong ≈ 18 km, Rongai ≈ 14 km, Ruaka ≈ 10 km; excludes Machakos town ≈ 56 km and Kajiado town ≈ 63 km). Distances are approximate straight-line figures from the CBD.
- Inside the radius → **fast** (ETA from Routes API, opening hours apply). Outside the radius but inside Nairobi, Kiambu, Kajiado or Machakos (county from geocoding) → **slots**. Anywhere else → "outside our delivery area".
- Named zones (Ruaka, Rongai…) remain as data for fees, display and reports; the pin decides fast vs slots.

**Rules that come with Google's terms and our privacy duties:**
- Store the **customer-confirmed pin** (end-user data) and Google **place IDs** (cacheable); do not keep other Google geocoding/route results beyond the caching period allowed by the service terms (generally 30 days).
- Google content (geocodes, routes) is shown only on Google maps; Google attribution displayed as required.
- Two keys: a **browser key** restricted to our website addresses and to Maps JavaScript + Places; a **server key** restricted to Geocoding + Routes, kept in environment variables. Daily quotas and budget alerts set in Google Cloud.
- Location is personal data (Kenya DPA 2019): collected for delivery only, explained in the privacy policy, deleted/anonymised with the account.

## Consequences
- A Google Cloud project with a **billing account** is required (owner action), even while usage stays inside free caps.
- At launch volumes usage is expected inside the free monthly caps (Essentials SKUs: 10,000 billable events per SKU; Autocomplete sessions followed by Place Details are not charged separately; verify on the pricing page at setup). Rough worst case if caps are exceeded: a few US dollars per 1,000 extra calls.
- The design's "Arrives in about 45 minutes" cannot apply across the whole 42 km radius (Thika in traffic): ETAs shown are calculated per address.
- Live rider tracking on a map (FR-53) stays a future update (needs partner GPS).
- Exit route: `GeoService` (backend) and `MapView` / `AddressPicker` components (frontend) are the only places that know about Google.
