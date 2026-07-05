# EZ Black Car SEO Audit Log

Last updated: 2026-07-01

This file is the working SEO checklist for the EZ Black Car landing page and related site pages.
We will use it as the single source of truth so fixes can be handled one at a time.

## Current Status

Completed recently:

- Stronger homepage title and meta description
- Canonical tag
- Robots meta tag
- Open Graph metadata
- Twitter card metadata
- `LocalBusiness` structured data
- `FAQPage` structured data
- Better service card image alt text
- FAQ content centralized into a reusable content file
- Business email mailbox is live at `info@ezblackcar.com`
- Domain email DNS records configured for SiteGround mail service

## High Priority Missing Items

### 1. Real Business Phone Number

Status: Missing

Why it matters:

- Important trust signal for local SEO
- Important for Google Ads landing page quality
- Important for conversion confidence

Current issue:

- Site still shows `Coming soon` for phone number in multiple places

Files involved:

- [src/data/legalContent.js](D:/EZBlackCar/src/data/legalContent.js)
- [src/components/Footer.jsx](D:/EZBlackCar/src/components/Footer.jsx)

Action needed:

- Replace placeholder with the real business phone number everywhere

### 2. Real Social Profile Links

Status: Missing

Why it matters:

- Helps brand trust and entity consistency
- Removes placeholder/low-quality signals

Current issue:

- Footer social links still point to `/`

Files involved:

- [src/components/Footer.jsx](D:/EZBlackCar/src/components/Footer.jsx)

Action needed:

- Add real Facebook and LinkedIn URLs once profiles are live
- Hide social links until real URLs exist if needed

### 3. Google Ads Conversion Tracking

Status: Missing

Why it matters:

- Required for campaign optimization
- Required to measure quote and corporate inquiry leads

Current issue:

- No Google Ads conversion tag implementation found

Likely files involved:

- [src/components/QuoteForm.jsx](D:/EZBlackCar/src/components/QuoteForm.jsx)
- [src/components/CorporateInquiryForm.jsx](D:/EZBlackCar/src/components/CorporateInquiryForm.jsx)
- [index.html](D:/EZBlackCar/index.html)

Action needed:

- Add Google tag / Ads conversion tracking
- Define primary conversion events
- Fire events on successful form submissions

### 4. Google Analytics / GA4

Status: Missing or not confirmed

Why it matters:

- Needed for traffic measurement
- Useful for engagement, source analysis, and remarketing audiences

Current issue:

- No GA4 or Google Tag Manager code found in the project

Action needed:

- Confirm whether GA4 should be installed directly or through GTM

### 5. Local Business NAP Consistency

Status: Incomplete

Why it matters:

- Strong local SEO signal
- Important for future directory listings and Google Business Profile consistency

Current issue:

- Name is present
- Email is present and live
- Phone is missing
- Physical/address information not clearly defined in site content

Action needed:

- Confirm official business phone
- Confirm official business address or service-area-only presentation
- Keep business details identical across website and future profiles

### 6. Copyright Year

Status: Completed

Why it matters:

- Small trust and freshness issue

Completed fix:

- Footer year now updates dynamically

Files involved:

- [src/components/Footer.jsx](D:/EZBlackCar/src/components/Footer.jsx)

## Medium Priority Missing Items

### 7. Homepage Copy Tightening for Search Intent

Status: Partially complete

Why it matters:

- Better relevance for searches like:
  - DTW airport car service
  - Metro Detroit black car service
  - executive SUV service Detroit
  - corporate transportation Detroit

Current issue:

- Homepage is already decent, but some section text can be tuned further for search intent

Likely files involved:

- [src/App.jsx](D:/EZBlackCar/src/App.jsx)
- [src/data/siteContent.js](D:/EZBlackCar/src/data/siteContent.js)

Action needed:

- Review headings/subheadings/body copy for keyword alignment without stuffing

### 8. Legal Page Metadata Review

Status: Needs review

Why it matters:

- Helps indexing of trust/support pages

Current issue:

- Legal pages have metadata, but may benefit from further refinement later

Files involved:

- [src/data/legalContent.js](D:/EZBlackCar/src/data/legalContent.js)

Action needed:

- Review titles/descriptions page by page

### 9. Internal Link Strategy

Status: Partial

Why it matters:

- Helps crawlers understand page relationships
- Helps users reach high-intent sections faster

Current issue:

- Some internal links exist, but internal linking can be made more intentional later

Action needed:

- Review links between homepage, legal pages, contact page, and quote form anchors

## Lower Priority / Future Items

### 10. Dedicated SEO Landing Pages

Status: Not started

Future opportunities:

- DTW Airport Transportation page
- Corporate Transportation page
- Executive SUV Service page
- Service area pages for high-value cities if useful

Note:

- Only build these if they will have real unique content

Recommended next pages:

- DTW Airport Transfers
- Corporate Transportation
- Executive SUV Service

Why these three first:

- They match the strongest commercial services already featured on the homepage
- They support both SEO and future Google Ads landing page strategy
- They give clearer keyword targeting than the homepage alone

What not to build yet:

- Large numbers of city pages
- Thin SEO-only pages with duplicated copy
- Separate pages for every small keyword variation

### 11. Google Business Profile Alignment

Status: Future setup

Action needed later:

- Match website NAP to GBP exactly
- Match service categories and service area wording

### 12. Performance / JS Bundle Size

Status: Needs future optimization

Why it matters:

- Indirect SEO and user experience benefit

Current issue:

- Production build warns about large JS bundle size

Action needed later:

- Review code-splitting opportunities

## Recommended Work Order

1. Add real business phone number
2. Replace placeholder social links when profiles are ready
3. Add Google tag / GA4 / Ads conversion tracking
4. Define quote form conversion event
5. Define corporate inquiry conversion event
6. Review homepage copy for local search intent
7. Review legal page metadata

## Notes

- We should handle one item at a time.
- This file should be updated whenever an SEO item is completed or a new gap is discovered.
