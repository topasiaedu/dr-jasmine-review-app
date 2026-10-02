import type { ReviewCategory } from "@/lib/types";

/** Topic chips shown on the AI path. */
export const CATEGORIES: readonly ReviewCategory[] = [
  {
    id: "clarity",
    label: "Clear explanations",
    lines: [
      "Dr Jasmine explains everything so clearly and patiently.",
      "I left feeling like I finally understood my body, not just more numbers.",
    ],
  },
  {
    id: "practical",
    label: "Practical tips",
    lines: [
      "The advice felt realistic for everyday life, not extreme.",
      "I appreciated the practical guidance I can keep using at home.",
    ],
  },
  {
    id: "money",
    label: "Saved money",
    lines: [
      "I feel like I am finally investing in what works, not guessing.",
      "Helped me avoid wasting money on approaches that never stuck.",
    ],
  },
  {
    id: "reading",
    label: "Useful reading and resources",
    lines: [
      "The reading and resources made the guidance easier to revisit later.",
      "Helpful materials that reinforced what we covered.",
    ],
  },
  {
    id: "life",
    label: "Life feels better",
    lines: [
      "This has made a real difference in how I show up in daily life.",
      "I feel more present and hopeful in my everyday life.",
    ],
  },
  {
    id: "rootcause",
    label: "Root cause clarity",
    lines: [
      "I appreciated the focus on root causes instead of quick fixes.",
      "It gave me clarity on what was actually driving my situation.",
    ],
  },
  {
    id: "care",
    label: "Felt cared for",
    lines: [
      "I felt genuinely cared for and taken seriously.",
      "Kind, attentive, and never dismissive of my concerns.",
    ],
  },
  {
    id: "results",
    label: "Feeling better and results",
    lines: [
      "I am feeling better and more hopeful about my progress.",
      "This gave me confidence that improvement is possible.",
    ],
  },
  {
    id: "not-diet",
    label: "Not another diet lecture",
    lines: [
      "It did not feel like another restrictive diet lecture.",
      "She focuses on understanding the body, not guilt and willpower alone.",
    ],
  },
  {
    id: "expertise",
    label: "Knowledge and trust",
    lines: [
      "Highly knowledgeable and easy to trust.",
      "I felt confident in her expertise and recommendations.",
    ],
  },
  {
    id: "workshop",
    label: "Workshop was worth it",
    lines: [
      "The workshop was valuable and well worth attending.",
      "I left with clarity and motivation I did not have before.",
    ],
  },
  {
    id: "heard",
    label: "Felt heard",
    lines: [
      "I felt heard and respected throughout.",
      "Questions were welcomed, and answers never felt rushed.",
    ],
  },
];

export const OPENINGS: readonly string[] = [
  "I am so grateful for Dr Jasmine's care.",
  "Wonderful experience with Dr Jasmine Chiew.",
  "Happy to recommend Dr Jasmine.",
];

export const CLOSINGS: readonly string[] = [
  "I would warmly recommend her to anyone who wants real clarity.",
  "Thank you, Dr Jasmine. Highly recommended.",
];

/** Hard character limit for the draft textarea and AI output. */
export const DRAFT_MAX_LENGTH = 800;

/** Minimum trimmed draft length before posting. */
export const DRAFT_MIN_LENGTH = 12;
