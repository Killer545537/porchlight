# Porchlight — UX spec

Experience and interaction spec, not a visual design spec. No color/typography/layout decisions here — this defines what each page does, how it feels to move through, and what responds to the user as they act.

## Guiding principle

Landing page persuades — it can breathe, scroll, and build a narrative. Every page after that is a tool — get the user to their next decision with the least friction possible. The switch from "narrative" to "minimal" should be felt at the exact moment someone commits to browsing (first search or first "Explore" click).

## Pages

### 1. Landing page (`/`)

Not the search grid — a separate arrival moment before the user commits to browsing. Purpose: make someone want to search, the way the real Airbnb homepage sells a feeling before it sells a grid.

Experience:

- Opens on a single confident hero moment — one search prompt, not a wall of options. The search bar itself is the hero, not decoration next to it.
- Scrolling reveals reasons to trust the platform and a taste of what's available (a curated row of standout listings, a few destination categories) — each section earns the next scroll rather than dumping everything at once.
- Feels editorial and unhurried. This is the one page allowed to have personality and pacing; nothing here is a dead-end utility screen.
- Ends in a natural handoff: either "become a host" (for the host path) or search submission (for the guest path) — two clear exits, not a maze of nav options.

Micro-interactions:

- Search bar segments (location / dates / guests) expand in place when focused, collapse when a choice is made — no modal takeover for something this lightweight.
- Hero content responds subtly to scroll (parallax-lite or fade-in-on-view for sections) — signals quality without becoming a distraction.
- CTA buttons give tactile feedback on press (scale/depress), not just a color change — should feel clickable before it's clicked.

### 2. Explore / home grid (`/explore` or `/search`)

This is where "minimal, not cluttered" starts applying hard. Purpose: scan fast, filter fast, commit to a listing.

Experience:

- Search bar persists at the top, collapsed to a compact summary of the active query (not the full expanded landing-page version) — reinforces "you're now working," not "you're still browsing ideas."
- Grid loads progressively — cards appear as data resolves rather than blocking on a full-page spinner, so the page never feels frozen.
- Filters live in an unobtrusive row that expands on demand — filtering is an action the user opts into, not a permanent visual tax on every screen.
- Empty/no-results state is handled explicitly (not a blank grid) — suggests a broadened search rather than just saying "no results."
- Pagination or infinite scroll should never make the user feel lost — a return-to-top affordance appears once they've scrolled deep.

Micro-interactions:

- Card image cycles through photos on hover (matching Airbnb's signature interaction) — rewards curiosity without requiring a click.
- Favorite/heart icon on each card responds instantly on click (optimistic UI, no wait for server confirmation) with a small bounce/fill animation — favoriting must feel free and reversible.
- Filter pills show an active-count badge and animate open/closed rather than jump-cutting.
- New results after a filter change cross-fade in rather than hard-replacing the grid — keeps spatial continuity so the user doesn't lose their place.

### 3. Listing detail page (`/listings/[id]`)

Purpose: answer every question the user has about this specific place, in the order they'd ask it, then get them into the booking flow with zero hesitation.

Experience:

- Photo gallery is the entry point — full-bleed and immediately explorable, not buried below a wall of text.
- Information is progressively disclosed: title/location/price up front, amenities and full description available without feeling like a scroll marathon, reviews further down for those who want proof.
- The booking widget (dates, guests, price breakdown) stays reachable at all times while the user reads — it shouldn't require scrolling back up to act on a decision made mid-page.
- Unavailable dates are visually obvious the moment the calendar opens — no dead-end where a user picks a date and gets rejected after the fact.

Micro-interactions:

- Gallery opens into an immersive full-screen view on click, with a keyboard/swipe-friendly path through photos — this is a moment worth making feel considered, unlike the rest of the app.
- Selecting a date range on the calendar live-updates the price breakdown beneath it in real time, with a subtle highlight/count-up on the total so the change registers.
- Invalid or blocked date attempts get instant inline feedback at the point of interaction (not a toast after submission) — the calendar itself should refuse the bad state.
- "Reserve" button state changes (disabled → enabled) the moment a valid date range + guest count exists, with a visible transition, not a silent flip.

### 4. Booking flow (summary → mocked checkout → confirmation)

Purpose: this is the one place friction is acceptable — but only the friction of confirmation, never confusion. Every step should feel like the natural next step, not a new page context.

Experience:

- Treated as a focused sequence, not a full page navigation each time — a guest should never feel like they've left the listing behind, so a slide-over panel or a single scrolling flow works better than hard page transitions.
- Summary step recaps exactly what's being booked (dates, guests, nightly breakdown, total) before any action — no surprises at the "pay" moment.
- Checkout is explicitly mocked, and should say so in a way that feels intentional rather than broken (a clear "demo checkout" framing, not a fake-looking payment form pretending to be real).
- Confirmation is a genuine moment of payoff — not just a redirect to "My Trips," a dedicated success state that closes the loop.

Micro-interactions:

- Step transitions animate forward/back (slide) so the user has a spatial sense of progress through the flow.
- Submitting the mocked checkout shows a brief, honest loading state (not instant) — even a fake action should acknowledge the click before resolving, or it reads as broken.
- Confirmation triggers a small celebratory motion (checkmark draw-in, confetti-lite, or similar) — proportionate, not gimmicky, but this is the app's one moment to reward the user.
- A toast reinforces the booking success even after the user navigates away from the confirmation screen.

### 5. My Trips (`/trips`)

Purpose: quick reassurance — "yes, this is booked, here's when." Not a dense dashboard.

Experience:

- Upcoming trips are visually separated from past trips — the user's most relevant info (what's next) should never require scanning past irrelevant history.
- Each trip card surfaces just enough to recognize it at a glance (photo, dates, location) — full detail is one click away on the original listing, not duplicated here.
- Empty state (no trips yet) redirects energy toward exploring, not a dead page.

Micro-interactions:

- Trip cards have a light hover-lift, signaling they're clickable back to the listing/detail context.
- Cancelling a booking (if supported) asks for confirmation via a lightweight inline prompt, not a jarring modal, and the card animates out on confirm rather than just vanishing.

### 6. Host dashboard (`/host`)

Purpose: give hosts command over their listings without it feeling like a separate, heavier app bolted onto the guest experience.

Experience:

- Defaults to an at-a-glance view: listings owned, and which have upcoming bookings — the host's first question ("is anything happening right now?") is answered before they click anything.
- Listing management (create/edit/delete) uses the same visual language as the guest-facing listing card — a host should recognize their own listing the way a guest would see it.
- Booking info per listing is scoped and simple — who, when, nothing more, since messaging/payments are placeholders.

Micro-interactions:

- Delete requires an explicit confirm step (destructive action) with a clear undo window or at minimum a hard confirmation — never a single accidental click away.
- Saving an edit gives immediate, unambiguous success feedback (toast + form closing/collapsing), so a host never wonders if their change took.
- Creating a listing feels like filling in a form that previews itself — as fields are completed, a live card preview updates, so the host sees what guests will see before publishing.

### 7. Auth (guest/host mock)

Purpose: a lightweight gate, not a friction point. Should never feel like the "real" product — it's a means to an end (getting into guest vs. host context).

Experience:

- Framed clearly as simplified/demo auth so evaluators aren't confused about scope.
- Switching between "continue as guest" and "continue as host" is the primary decision on this screen, not buried in a settings menu.
- Post-auth, the user lands exactly where their intent was (if they were mid-search, return to search; if arriving fresh, go to explore).

Micro-interactions:

- Form validation happens inline, live, not on submit-and-fail.
- Successful auth transitions with a brief confirming motion (not an abrupt hard redirect) so context isn't lost.

## Bonus experiences (optional, only if core is done)

These extend pages already spec'd above rather than introducing new ones — keep them additive, not new dead-ends.

**Interactive map (listing detail + explore)** — upgrades the static map placeholder. On the explore grid, a map panel next to the results lets a user pan/zoom while the listing cards filter to match the visible area — hovering a card highlights its pin, and vice versa, so the two views feel like one connected space, not two separate widgets. On listing detail, the static map becomes a real pin the user can interact with (zoom, see nearby context) without leaving the page.

**Leave a review (My Trips)** — after a trip's dates have passed, its card in "My Trips" surfaces a lightweight "leave a review" prompt instead of the normal trip summary. Opens an inline rating + short text form, not a separate page. Submitting gives the same immediate, honest confirmation treatment as booking (toast + the prompt replaced by a "you reviewed this stay" state) — a user should never wonder if it saved.

**Superhost badges / ratings aggregation** — a small, quiet badge on listing cards and the detail page header, earned rather than decorative — should read as an earned signal (e.g. appears next to the host's name/photo, not competing with the listing's own rating). Aggregated rating on the detail page breaks down into a couple of sub-scores (cleanliness, accuracy, etc.) that expand on interaction rather than cluttering the default view.

**Dark mode** — a single, discoverable toggle (nav or footer), instant switch with a smooth cross-fade rather than a jarring flash, and the choice persists across sessions. Treated as a preference, not a feature to advertise — it shouldn't introduce new UI chrome, just recolor what's there.

## Global/cross-cutting

**Notifications & toasts** — used for anything that changes state without a full page transition: favorite added/removed, booking confirmed, listing saved, error states. Toasts stack politely (never more than a couple visible at once), auto-dismiss, and are dismissible manually. Never used for anything the user must act on — those get inline UI, not a toast.

**Wishlist/favorites** — favoriting is always instant and optimistic, reversible with a single click, and reflected consistently everywhere a listing appears (grid, detail, host view if applicable) — no page should ever show a stale favorite state.

**Modals** — reserved for genuinely interrupting moments (photo gallery, delete confirmation, auth). Never used for primary navigation or anything that could instead be an inline expansion — overuse of modals is exactly the "cluttered" feeling to avoid.

**Loading states** — skeleton placeholders that mirror final content shape (card-shaped skeletons for the grid, not a generic spinner) — reduces the feeling of waiting by showing structure early.

**Transitions between pages** — subtle and fast; the app should feel like one continuous space, not a series of hard-cut screens. This matters most on the explore → detail → booking path, since that's the core loop being evaluated.
