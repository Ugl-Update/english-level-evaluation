// Shared question bank — single source of truth for Edge Functions.
// get-questions strips `correct` (and listening `script`) before sending to the browser.
// submit-assessment uses the full bank to grade server-side.
//
// NOTE: in the Supabase dashboard each function carries its OWN copy of this file at
// `<function>/_shared/questions.ts`. In this repo it lives once; when pasting to the
// dashboard, copy it into each function that imports it (get-questions, submit-assessment).

export type Question = {
  id: string;
  text: string;
  options: string[];
  correct: number;
};

export type ListeningItem = {
  id: string;
  script: string;
  audioFile: string;
  question: string;
  type: 'mcq' | 'written';
  options?: string[];
  correct?: number;
};

export type SpeakingItem = {
  id: string;
  prompt: string;
};

export const QUESTION_BANK: Record<string, { vocab: Question[]; grammar: Question[] }> = {
  intermediate: {
    vocab: [
      { id: 'IV1', text: '"SLC" on a bill of lading stands for:', options: ['Shipper Load & Count', 'Sealed Load Confirmation', 'Standard Load Charge', 'Shipping Label Code'], correct: 0 },
      { id: 'IV2', text: '"OS&D" means:', options: ['Over, Short, or Damaged', 'Order Sent & Delivered', 'On-Site Delivery', 'Official Shipment Document'], correct: 0 },
      { id: 'IV3', text: '"TONU" stands for:', options: ['Truck Order Not Used', 'Trailer On No Update', 'Tracking Order Number', 'Total Order Not Unloaded'], correct: 0 },
      { id: 'IV4', text: '"FCFS" at a stop means:', options: ['A set appointment time', 'First come, first served — no set time', 'Fast Check First Service', 'Final Confirmation From Shipper'], correct: 1 },
      { id: 'IV5', text: '"PTI" stands for:', options: ['Pre-Trip Inspection', 'Paperwork Tracking Index', 'Pickup Time Indicator', 'Power Trailer Inspection'], correct: 0 },
    ],
    grammar: [
      { id: 'IG1', text: '"If the seal number ___ not match the BOL, the updater must stop and call the broker."', options: ['do', 'does', 'doing', 'done'], correct: 1 },
      { id: 'IG2', text: '"By the time dispatch called, the driver ___ already left the shipper."', options: ['has', 'had', 'have', 'having'], correct: 1 },
      { id: 'IG3', text: '"Detention is only paid if the broker ___ notified before it starts."', options: ['is', 'are', 'be', 'being'], correct: 0 },
      { id: 'IG4', text: '"Neither the RC nor the BOL ___ the trailer number listed on most Power Only loads."', options: ['has', 'have', 'had', 'having'], correct: 0 },
    ],
  },
  advanced: {
    vocab: [
      { id: 'AV1', text: 'On a rate confirmation, "Reefer 53" refers to:', options: ['A 53-foot refrigerated trailer — the length, not a temperature', 'A reefer set to 53 degrees', '53 pallets of refrigerated freight', 'A 53-minute cooling cycle'], correct: 0 },
      { id: 'AV2', text: 'A "PULP" temperature reading is:', options: ['The temperature shown on the reefer display', 'A physical probe reading taken inside the product itself', 'The outside air temperature at the dock', 'The setpoint listed on the RC'], correct: 1 },
      { id: 'AV3', text: '"Net 30" on a rate confirmation means:', options: ['You are paid 30 days after the broker receives your paperwork', 'You have 30 days to accept the load', 'The load is 30 miles long', 'You get a 30 percent rate increase'], correct: 0 },
      { id: 'AV4', text: '"Power Only" means:', options: ['You supply the tractor only and pull the broker\'s or shipper\'s trailer', 'The truck has no working brakes', 'Only electronic logs are used', 'A discounted flat rate'], correct: 0 },
      { id: 'AV5', text: 'Accessorial charges (detention, tarps, layover) must be:', options: ['Pre-approved by the broker in writing', 'Paid by the driver', 'Added automatically to every load', 'Ignored unless over 500 dollars'], correct: 0 },
    ],
    grammar: [
      { id: 'AG1', text: '"By the time the driver arrives, the appointment window ___ already closed."', options: ['has', 'had', 'will have', 'would have'], correct: 2 },
      { id: 'AG2', text: '"The shipper acted as though the freight ___ been loaded cold."', options: ['has', 'had', 'have', 'having'], correct: 1 },
      { id: 'AG3', text: '"Despite ___ the seal twice, the driver wrote down the wrong number."', options: ['check', 'checked', 'checking', 'to check'], correct: 2 },
      { id: 'AG4', text: '"The driver, ___ trailer was pre-loaded and sealed, marked the BOL as SLC."', options: ['who', 'which', 'whose', 'that'], correct: 2 },
    ],
  },
};

export type WrittenItem = {
  id: string;
  prompt: string;
};

export const WRITTEN_PROMPTS: Record<string, WrittenItem[]> = {
  advanced: [
    {
      id: 'AW_short',
      prompt: 'A shipment arrived and the receiver reports the load is short — freight is missing compared to the BOL. Write the email you would send the broker while knowing that the shipper loaded, secured, and sealed the truck himself, we informed the broker about this during the pickup, and the BOL has SLC written on it.\n\nReport the shortage, and state clearly what you need from them next.',
    },
    {
      id: 'AW_damaged',
      prompt: 'A shipment arrived with product damage discovered at delivery. Write the email you would send the broker while knowing that the shipper loaded, secured, and sealed the truck himself, we informed the broker about this during the pickup, and the BOL has SLC written on it.\n\nReport the damage, send proof that it isn\'t our fault, say what kind of proof it is (Important), and state clearly what you need from them next.',
    },
  ],
};

export const LISTENING: ListeningItem[] = [
  {
    id: 'L1',
    type: 'mcq',
    script: "Hi, this is Mike from Arrive Logistics. Your driver needs to be docked fifteen minutes early, and please confirm the seal is on the correct door before pickup.",
    audioFile: 'audio/L1.wav',
    question: 'What does the broker want before pickup?',
    options: [
      'The driver docked 15 minutes early, and the seal confirmed on the correct door',
      'The driver docked 15 minutes early; seal confirmation can wait until after loading',
      'Confirm the seal is on the correct door; arrival time is flexible',
      'Arrive at the appointment window and send a seal photo after pickup',
    ],
    correct: 0,
  },
  {
    id: 'L2',
    type: 'written',
    script: "This load is Power Only. You'll pull our trailer, not your own. Call dispatch to get the trailer number before you hook.",
    audioFile: 'audio/L2.wav',
    question: 'In your own words, what must the driver do on this Power Only load before hooking, and why does it matter?',
  },
  {
    id: 'L3',
    type: 'mcq',
    script: "The rate is twelve hundred flat, plus two hundred fifty for MacroPoint. Read every line — don't just look at the total.",
    audioFile: 'audio/L3.wav',
    question: 'What is the total pay on this load?',
    options: [
      '1,200 dollars — the flat rate is all-in',
      '1,250 dollars — flat rate plus a partial tracking fee',
      '1,450 dollars',
      '1,050 dollars — MacroPoint is deducted from the flat rate',
    ],
    correct: 2,
  },
  {
    id: 'L4',
    type: 'written',
    script: "Detention starts two hours after your appointment, at thirty-five dollars an hour, capped at one hundred fifty. But you have to notify us before it starts, or it won't be paid.",
    audioFile: 'audio/L4.wav',
    question: 'Explain what must happen for detention to be paid on this load, including timing and notification.',
  },
  {
    id: 'L5',
    type: 'mcq',
    script: 'Reefer fifty-three, temperature thirty-six degrees, continuous mode.',
    audioFile: 'audio/L5.wav',
    question: 'What temperature should the reefer be set to?',
    options: [
      '53 degrees — Reefer 53 is the setpoint',
      '36 degrees in continuous mode',
      'Continuous mode only; temperature is not specified',
      '36 degrees pulping temp at the receiver',
    ],
    correct: 1,
  },
  {
    id: 'L6',
    type: 'written',
    script: "We need a pulp reading before the driver leaves — have them probe the actual product, not just photograph the reefer display.",
    audioFile: 'audio/L6.wav',
    question: 'What is the driver being asked to do, and what must they avoid doing?',
  },
  {
    id: 'L7',
    type: 'mcq',
    script: 'Report any over, short, or damaged freight with pictures within two hours, or the claim falls on you.',
    audioFile: 'audio/L7.wav',
    question: 'If freight is damaged, what is the deadline to report it with pictures?',
    options: [
      'Within 2 hours of discovering the damage',
      'Within 2 hours of completing delivery paperwork',
      'Before the end of the business day',
      'Within 24 hours of delivery',
    ],
    correct: 0,
  },
  {
    id: 'L8',
    type: 'written',
    script: "This is dispatch. The driver's clock is tight — confirm he actually has the hours of service to make this pickup before you book it.",
    audioFile: 'audio/L8.wav',
    question: 'What is dispatch asking you to verify before booking, and why?',
  },
  {
    id: 'L9',
    type: 'mcq',
    script: "Runs over five hundred miles are team loads. Both drivers present their CDLs, and we need Form twenty eighty-one. No team could mean up to a five thousand dollar penalty.",
    audioFile: 'audio/L9.wav',
    question: "What makes this a team load, and what's required?",
    options: [
      'Over 500 miles; both CDLs and Form 2081',
      'Over 500 miles; one CDL and Form 2081 on file',
      'Over 500 miles; team drivers optional if HOS allows solo',
      'Any load over 500 miles; penalty only applies to hazmat',
    ],
    correct: 0,
  },
  {
    id: 'L10',
    type: 'written',
    script: "I'm adding our coordinator to this email. Make sure you reply all and reattach the rate confirmation, since she wasn't on the original chain.",
    audioFile: 'audio/L10.wav',
    question: 'What two things should you do when a new contact is added to the email thread?',
  },
];

export const SPEAKING: SpeakingItem[] = [
  { id: 'S1', prompt: 'Explain to a new dispatcher the difference between a set appointment and FCFS (first come, first served).' },
  { id: 'S2', prompt: "A driver looks at 'Reefer 53' on the RC and assumes it means set the reefer to 53 degrees. Explain what's actually going on and why that assumption is a mistake." },
  { id: 'S3', prompt: 'Explain why you should never use BCC on a load email thread, and what a BCC might be a sign of.' },
  { id: 'S4', prompt: "A load fell through right before pickup. Explain to the broker what a TONU is and why you're requesting it." },
  { id: 'S5', prompt: "Walk through what 'Shipper Load & Count' means, when it applies, and what you must do to protect the carrier." },
];

export function publicQuestions(tier: string) {
  const bank = QUESTION_BANK[tier];
  const strip = (qs: Question[]) => qs.map(({ id, text, options }) => ({ id, text, options }));
  return { vocab: strip(bank.vocab), grammar: strip(bank.grammar) };
}

export function publicListening() {
  return LISTENING.map((item) => {
    if (item.type === 'written') {
      return { id: item.id, audioFile: item.audioFile, question: item.question, type: 'written' as const };
    }
    return { id: item.id, audioFile: item.audioFile, question: item.question, type: 'mcq' as const, options: item.options };
  });
}

export function publicSpeaking() {
  return SPEAKING.map(({ id, prompt }) => ({ id, prompt }));
}

export function band(score: number, total: number): string {
  const pct = score / total;
  if (pct >= 0.875) return "Strong";
  if (pct >= 0.625) return "Adequate";
  return "Lacking";
}
