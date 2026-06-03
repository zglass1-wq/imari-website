// Shared estate content used by the stable-content sections (EstateStatement,
// EstateDetails). The EstateDetails default below is corporate's canonical
// property/services text — the agreed shared default. july4v2 renders a bare
// <EstateDetails /> and now shows this (intentionally diverging from
// july4.html's original 8-item property list). Edit once; every non-overriding
// page picks it up.

// EstateStatement (#section-estate) — the short centered statement block.
export const defaultEstateStatement = {
  eyebrow: 'The Estate',
  // Contains inline <em>; rendered with set:html.
  statement:
    'Imari is a private estate available for the exclusive occupancy of a single party. <em>Comfortable luxury on one private acre.</em> Full staff, complete security, seven star service - a residence built to host, to hold court, to headquarter.',
};

// EstateDetails (#section-details) — the two-column Property / Services block.
export const defaultEstateDetails = {
  eyebrow: 'Estate Details',
  title: 'On the grounds, and at your service.',
  propertyTitle: 'The Property.',
  servicesTitle: 'The Services.',
  property: [
    '12,000 sq ft main house on one private acre of manicured gardens in central Georgetown D.C.',
    'Six bedroom suites across two floors with 15 bathrooms',
    '1,000 sq ft detached ballroom - full AV suite for presentations and panels',
    'Detached Spa House — sauna, steam room, cold plunge, hot tub',
    'Full-size pool, gym, dedicated yoga and meditation room',
    'Three-bedroom guest house for client staff — separate entrance, self-contained',
    'Gated arrival court with parking for 10 vehicles',
    'Multiple indoor and outdoor spaces for breakouts, receptions, and gatherings for up to 300 people',
    'Estate-wide security with perimeter PTZ cameras, vetted for heads of state',
  ],
  services: [
    '24/7 dedicated concierge managing logistics end-to-end',
    'Butler-led arrival, daily service, evening turndown',
    'Full housekeeping team — daily service and full property reset',
    'Farm-sourced breakfast daily — eggs to order, pastries, cold-pressed juices',
    'Stocked kitchen customized in advance to guest preferences',
    'Michelin-star chefs available for meals and private dinners',
    'Wellness on property — massage, acupuncture, IV therapy, yoga, personal training',
    'Supercar access and private aviation coordination on request',
    'Armed security personnel available',
  ],
};

// ClosingInquire (#section-inquire) — contact band.
export const defaultClosingInquire = {
  bgImage: 'https://res.cloudinary.com/dsp45h9a1/image/upload/f_auto,q_auto/Yard_045_vgr6lu.jpg',
  bgAlt: 'Imari grounds',
  name: 'Blaine Stephens',
  phone: '202.868.6945',
  phoneHref: 'tel:2028686945',
  email: 'blaine@imari.cc',
  note: 'Confidential · Not for distribution',
};
