// =====================================================================
//  Robin Hobbs Occupational Therapy — site settings
//  Edit this file, then push. Netlify rebuilds the site automatically.
//  (Locally: `npm run build` → output in dist/)
// =====================================================================
export default {
  // ── THE SWITCH ─────────────────────────────────────────────────────
  // false = pre-launch: "Opening early 2027" ribbon, "Join the list" CTAs, waitlist form
  // true  = open:       no ribbon, "Book a session" CTAs, booking form
  LAUNCHED: false,

  // Ribbon shown while LAUNCHED is false
  openingText: 'Opening early 2027 in the Waterberg',

  // ── Practice details ───────────────────────────────────────────────
  name: 'Robin Hobbs Occupational Therapy',
  therapist: 'Robin Hobbs',
  hpcsa: 'OT 0125431',
  practiceNo: '',              // BHF practice number — leave '' until issued
  phone: '076 420 9017',       // shown on the site
  phoneIntl: '+27764209017',   // used for tel: and WhatsApp links
  whatsappMessage: 'Hi Robin, I found your website and would like to know more about occupational therapy.',
  email: '',                   // leave '' to hide email everywhere
  hours: 'Monday–Friday, 08:00–17:00',
  hoursShort: 'Mon–Fri · 08:00–17:00',
  areas: ['Modimolle', 'Bela-Bela', 'Mookgophong', 'Mokopane'],
  rooms: '',                   // street address of the rooms — leave '' while mobile-only
  roomsComing: 'Rooms in Modimolle coming soon',
  languages: 'English · Afrikaans',
  payment: 'Cash practice · rates on request',

  // ── Web ────────────────────────────────────────────────────────────
  siteUrl: 'https://robin-hobbs-ot.netlify.app', // change when the domain is connected
};
