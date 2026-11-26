# Design Reference Notes

Source: `Soko Fresh – Kenyan grocery store.pdf` (3 pages), to be stored in `assets/design-references/` (copy pending, see KI-002). These notes were made from the copy uploaded to the Claude Project. A Figma source file, `Soko Fresh – Kenyan grocery store.fig`, also exists in the original `Jackie Website files` folder; it was not copied in Phase 1.

These notes summarise what the design shows. They are an initial visual reference, not a final specification. Text was taken from the PDF's extracted text; visual layout should be checked against the PDF itself.

## Page 1: Desktop storefront

- Top bar: free delivery over KES 1,500; search ("sukuma, mangoes, unga…"); pay on delivery with M-Pesa; cart counter.
- Hero: "Picked at dawn. At your gate by evening." Delivery area picker (e.g. Kilimani) with estimated arrival (~45 minutes).
- Trust strip: live delivery tracking, farm of origin for every item, pay on arrival, money-back freshness guarantee.
- **Meal kits** ("Tonight's plate, one tap"): Ugali na sukuma, Pilau night, Chapati na chai; each lists items, a kit price and a higher separate-items price, and "Add whole kit".
- **Product grid** ("Fresh from the soko"): category tabs (All, Mboga, Matunda, Unga, Maziwa & Mayai, Nyama & Samaki). Each card shows emoji image, English name, Swahili name with origin ("Kale from Kinangop"), price in KES, optional was-price and "Save X%" badge, optional low-stock note ("Only 9 left today"), and Add button.
- "Why Nairobi shops with us": pay on delivery, named farms, evening slots (order by 2pm), fresh guarantee; customer testimonial.
- Footer: address, opening hours, WhatsApp, M-Pesa till, email (all placeholder values).

## Page 2: Mobile storefront

Same content condensed into a single column: header with basket count, search, hero, meal kits, a shorter product list, reasons to shop, footer. Some mobile kit "was" prices appear cut off in the extracted text (e.g. "KES 50" vs desktop "KES 450"); check the PDF visually before treating these as intended.

## Page 3: Shopping cart ("Your basket")

- Line items with quantity controls (e.g. Maize flour 2kg ×1, Sukuma ×2, Tomatoes ×2, Tilapia ×1).
- Free-delivery progress message ("Add KES 410 more for free delivery").
- Total (KES 1,090).
- M-Pesa phone number input and "Pay with M-Pesa on delivery".

## Requirements this design implies (for later analysis)

Product origin/farmer data, bilingual product names, categories, discounts and was-prices, daily stock limits, meal kits as bundled products with bundle pricing, delivery areas and time estimates, free-delivery threshold, delivery tracking, M-Pesa payment on delivery, refunds.
