/** Scout’s full PrintBooth Pro reference — imported into `lib/agents.ts` for SCOUT’s prompt. */
export const PRINTBOOTH_KNOWLEDGE = `PRINTBOOTH PRO — COMPLETE PRODUCT KNOWLEDGE (Scout owns this):

WHAT IT IS:
PrintBooth Pro (printboothpro.com) is the first and only all-in-one platform built specifically for photo magnet and keychain makers who run live events and markets. Frankie built it herself because nothing on the market met her needs. It is not a generic photo booth app — it was designed from the ground up for vendors who make physical photo keepsakes on-site. $59/month. ~50 subscribers and growing. Support: hello@printboothpro.com.

WHAT MAKES IT DIFFERENT:
- Built specifically for photo magnet/keychain vendors. No other software was doing this when Frankie launched it.
- The Print Helper allows true auto-printing (like a traditional photo booth) without manually clicking Print each time. Every other program requires downloading a PDF and printing manually. PrintBooth is the only one with a desktop helper app that sends jobs directly to the printer automatically.
- Three complete business modes in one platform: Markets (checkout-based), Private Events (prepaid/unlimited), Online Store (like a mini Shopify).
- Built-in client CRM with intake forms, proposals, contracts, and e-signatures — all linkable.
- QR code auto-generated for every event and market.
- Export all photos and guest emails from any event.
- Canva-friendly — all backgrounds and overlays designed in Canva and uploaded directly.

THE DASHBOARD:
When you log in you see: online store revenue, total event + order revenue, upcoming events, upcoming markets, total orders, new orders. Quick actions: create new event, view clients (intake forms/proposals/contracts), view orders, view markets.

THREE MAIN SECTIONS:

1. MARKETS (checkout-based events like craft fairs, farmers markets, pop-ups)
Customers check out WITH you in real time. One order at a time in the template to keep things organized. When one order prints, the next loads automatically. Features:
- Virtual photobooth via QR code — guests scan, take a photo with your custom overlay, choose quantity, check out
- Upload option (guests can upload their own photos at markets — unlike private events)
- Payment options: Stripe (card/Apple Pay/Google Pay), PayPal, Venmo, Square, Tap to Pay, Cash
- Mark as Ready button starts a 10-minute timer — customer sees "Your Order is READY" in green
- Reprint button shows all past orders in case something gets lost or made wrong
- Operator template view: grid layout (3x3 or other), overlay displayed for alignment, payment badges (green = paid, orange = pending), controls to crop/delete/reprint/print full grid
- Dynamic pricing tiers: e.g. 1=$5, 3=$12, 6=$20 — system auto-calculates best price
- Coupon codes (percentage or dollar off)

2. PRIVATE EVENTS (weddings, corporate, birthdays — prepaid, you're already hired)
Guests do NOT check out. You've been pre-hired. Guests can only take photos (no uploads — prevents inappropriate images). Features:
- Photo limits: set total event limit AND per-person limit, or unlimited
- Guest email required to enter — system checks limits before allowing entry
- Same QR code system — post at the venue, guests scan and it opens the virtual photobooth
- Custom landing page and camera overlay (designed in Canva, uploaded as PNG)
- Print on the back of the magnet: enter your URL or social media handle and it prints automatically
- Export all photos from the event + export all guest emails (perfect for sending to clients or building mailing lists)
- Reprint button for reprinting any past photo from the event
- PrintHelper for auto-printing (must be downloaded and running during the event)
- Event template: select which event you're working from, photos auto-load as guests take them

Event types supported: Wedding, Corporate, Birthday, Anniversary, Graduation, Music Festival, Cultural Festival, Tech Conference, Film Screening, Art Show, Food & Wine, Startup Meetup, Comedy Show, Outdoor Market, Sporting Event, Community Workshop, Networking Mixer, Charity Fundraiser, Food Truck, Live Music, Professional Development, Cultural Celebration, Pop-up Exhibition, Other.

Products supported: Photo Magnets, Photo Keychains, Envelope Keychain 1.78x1.42.
Camera shapes: Square, Round, Rectangle, Photostrip (Keychain 1x3).
Booth templates: Single Photo (default), Photostrip Keychain (1x3 — guests take 2-3 photos, builds a 1x3 strip, prints 4-up on a 4x6).

CLIENT CRM (inside Private Events section):
Full client management pipeline:
1. Create a client profile
2. Send a custom intake form link — client fills it out and submits
3. Create and send a proposal link — client reviews and accepts/declines
4. Create and send a contract link — client virtually signs, both parties get a copy
5. Once contract signed — click to auto-create an event pre-filled with their info
This is a complete sales pipeline built into the software.

3. ONLINE STORE (mini Shopify for selling photo products online)
Your store gets a custom URL: printboothpro.com/s/yourstorename — shareable link, QR code generator built in.
Store customization: hero banner (1920x600-800px), store name, description, contact email, social links (FB/IG/TikTok/Twitter/YouTube/website), color theme (primary + accent), font family (Inter/Roboto/Open Sans/Lato/Montserrat/Poppins), layout style (Modern/Classic/Bold/Elegant).
Products: photo magnets, accessories, other. Customers can upload their own photos for personalized items. Shapes: Square, Rectangle, Circle. Fulfillment: local pickup, free or paid shipping. Tier pricing (3-Pack, 6-Set etc). Product gallery with multiple photos.
Payments: Stripe required (free account). Fees: 2.9% + $0.30 (Stripe) + 1% platform fee. For a $100 sale = $4.20 total fees. Payouts: 2-7 days for new accounts, can be daily once established. Accepts credit/debit cards, Apple Pay, Google Pay.
Orders from the online store auto-appear in the Orders section with customer info and photos loaded into the template ready to print. Can also print invoices.

ORDERS SECTION (non-store orders):
For fulfilling orders that came from outside PrintBooth (e.g. your own website, Shopify, DMs). Create manually: order number, customer name, email, phone, shipping address, shipping method (Standard/Express/Local Pickup), number of photos, cost per magnet, total amount, tax toggle. Load photos into template for printing.

PRINT SIZES — everything prints on 4x6 paper (or Letter 8.5x11):
4x6 paper products:
- 32mm round: 8 per sheet
- 1.25" round: 2 per sheet
- 2" round: 2 per sheet
- 2.5" round: 2 per sheet
- 3" round: 1 per sheet
- 2" square: 2 per sheet
- 2.5" square: 1 per sheet
- 3" square: 1 per sheet
- 2"x3" rectangle: 1 per sheet
- 2.5"x3.5" rectangle: 1 per sheet
- Photostrip keychain (1"x3"): 4 per sheet
- Envelope keychain (1.78"x1.42"): 6 per sheet
Letter paper (8.5x11) — button layouts:
- 32mm round: 48 per sheet
- 1.25" round: 30 per sheet
- 2" round: 12 per sheet
- 2.25" round: 9 per sheet
- 2.5" round: 6 per sheet
- 3" round: 6 per sheet
- 2" square: 9 per sheet
- 2.5" square: 6 per sheet
- 3" square: 4 per sheet
- 2.5"x3.5": 4 per sheet
- 2"x3": 6 per sheet
Bleed options: 2mm, 3mm, 4mm, full bleed.

PRINT HELPER:
Desktop app downloaded from Account page (Mac and Windows versions). Must be running during events for auto-printing. Sends print jobs directly to printer without manual clicking — like a traditional photo booth. Windows: requires SumatraPDF for silent printing. Mac: drag to Applications, may need to allow in Security settings. Most common issues: helper not running, printer offline, wrong default printer, wrong paper size (use Letter). MAC PRINTER ISSUES are the most common support question — nothing to do with PrintBooth itself, just Mac/Epson quirks. Fix: Paper Size Letter, Borderless Off, Headers and Footers Off, Scaling Actual Size.

PAYMENT SETTINGS (Global):
Admin → Settings → Payments. Set PayPal username (no @), Venmo username (no @), Square Location ID, Stripe for markets, tap-to-pay toggle, cash toggle, dynamic pricing tiers, coupon codes.

ACCOUNT PAGE:
Manage subscription, business info for invoices, download Print Helper (Mac/Windows).

COMMON QUESTIONS SCOUT GETS:
- How does the Print Helper work? (Most asked)
- Mac printer issues with Epson (Most frustrating — not PrintBooth's fault but Scout helps anyway)
- How to set up Stripe
- How to create camera overlays in Canva
- How to set photo limits for private events
- How pricing tiers work
- How to export photos/emails from events
- Difference between markets and private events
- How the client CRM pipeline works

TARGET AUDIENCE:
Photo magnet vendors, photo keychain vendors, anyone running live photo experiences at events, markets, weddings, corporate activations. Self-employed, small business owners, often women, often side hustlers or full-time event vendors. They want something simple that just works — not a tech degree required.

SEO KEYWORDS Scout should use for blog content:
photo booth software for vendors, photo magnet software, photo magnet business, how to start a photo booth business, photo keychain business, event vendor software, photo magnet maker, live event photo printing, photo booth alternative, QR code photo booth, virtual photo booth for events, photo magnet wedding, corporate photo activation, photo magnet market vendor, printbooth pro, auto print photo booth, photo booth without iPad, photo magnet maker software, how to make photo magnets at events, photo booth side hustle.`;
