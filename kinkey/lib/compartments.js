// The two compartments of the family safe.
// Each compartment is one TideCloak encryption tag. Access is gated by the
// realm roles `_tide_<tag>.selfencrypt` and `_tide_<tag>.selfdecrypt`.
// Granting either role is a governed change in a QEA-enabled realm, so it
// only takes effect after the admin quorum (the family) approves it.

export const COMPARTMENTS = [
  {
    id: "medical",
    tag: "medical",
    title: "Medical",
    href: "/medical",
    icon: "medical",
    description: "Health records, allergies and emergency information.",
    action: "View medical records",
    rule: "Every key-holder can open this straight away.",
    why: "In an emergency, doctors need allergies and medications now, not after a family vote.",
  },
  {
    id: "finance",
    tag: "finance",
    title: "Finance & Documents",
    href: "/finance",
    icon: "finance",
    description: "Insurance, financial records and sensitive documents.",
    action: "View documents",
    rule: "Opens only for someone whose key the family quorum approved.",
    why: "Bank accounts, insurance and land papers are what families fight over, so nobody gets them alone.",
  },
];

export const encryptRole = (tag) => `_tide_${tag}.selfencrypt`;
export const decryptRole = (tag) => `_tide_${tag}.selfdecrypt`;

export const findCompartment = (id) => COMPARTMENTS.find((c) => c.id === id);

export const ROLE_LABELS = {
  [decryptRole("finance")]: "Finance key (open)",
  [encryptRole("finance")]: "Finance key (add)",
  [decryptRole("medical")]: "Medical key (open)",
  [encryptRole("medical")]: "Medical key (add)",
};

// Demo contents, encrypted in the owner's browser by "Load demo contents".
// Labels are encrypted together with values, so the server never learns
// what kind of secret it is holding.
export const DEMO_CONTENTS = {
  medical: [
    { kind: "note", label: "Allergies", value: "Penicillin (severe rash). No known food allergies." },
    { kind: "note", label: "Daily medication", value: "Amlodipine 5 mg every morning for blood pressure." },
    { kind: "note", label: "Family doctor", value: "Dr. Tran, Gia Dinh Clinic, 028 0000 0000 (demo number)." },
  ],
  finance: [
    { kind: "note", label: "Savings account", value: "Demo Bank, branch District 3. Passbook in the red folder." },
    { kind: "note", label: "Life insurance", value: "Policy DEMO-0001 with Demo Life. Beneficiaries: Lan and Minh." },
    { kind: "note", label: "Land certificate", value: "Second drawer of the altar cabinet, inside the blue envelope." },
    {
      kind: "letter",
      label: "A letter from Mom",
      value:
        "If you are reading this, it means you all agreed to open the box together. That is all I wanted. The insurance papers are in the second drawer of the altar cabinet. Look after each other.",
    },
  ],
};
