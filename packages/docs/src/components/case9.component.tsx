'use client';

import * as React from 'react';
import { GridSheet, Policy, buildInitialCells } from '@gridsheet/react-core';
import type { PolicyMixinType } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { useStarlightMode } from './useStarlightMode';

const str = (value: unknown) => (value == null ? '' : String(value));

// a••••@acme.io — keep the first letter and the domain.
const maskEmail = (value: unknown) => {
  const [user, domain] = str(value).split('@');
  return domain == null ? str(value) : `${user.slice(0, 1)}${'•'.repeat(Math.max(user.length - 1, 1))}@${domain}`;
};
// •••• 1234 — keep the last 4 digits.
const maskCard = (value: unknown) => {
  const digits = str(value).replace(/\D/g, '');
  return digits ? `•••• ${digits.slice(-4)}` : '';
};
// 090-••••-5678 — keep the area code and the last 4 digits.
const maskPhone = (value: unknown) => str(value).replace(/^(\d+)-\d+-(\d+)$/, (_, a, b) => `${a}-••••-${b}`);

// Display AND clipboard masked: renderString controls what is shown,
// serializeForClipboard controls what Ctrl/Cmd+C copies.
const EmailPolicy: PolicyMixinType = {
  renderString: ({ value }) => maskEmail(value),
  serializeForClipboard: ({ point, sheet }) => maskEmail(sheet.getSerializedValue({ point })),
};
const CardPolicy: PolicyMixinType = {
  renderString: ({ value }) => maskCard(value),
  serializeForClipboard: ({ point, sheet }) => maskCard(sheet.getSerializedValue({ point })),
};
// Never copyable at all: the clipboard gets a placeholder instead.
const SecretPolicy: PolicyMixinType = {
  renderString: ({ value }) => (value ? '••••••••' : ''),
  serializeForClipboard: () => '[redacted]',
};
// ⚠ Display-only mask: no serializeForClipboard, so copying falls back to the
// default — the full raw value. This column shows the leak on purpose.
const PhoneDisplayOnlyPolicy: PolicyMixinType = {
  renderString: ({ value }) => maskPhone(value),
};
// The opposite direction: show a formatted amount, but copy the plain number
// (the default) so it pastes cleanly into other spreadsheets.
const AmountPolicy: PolicyMixinType = {
  renderNumber: ({ value }) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
};

const policies = {
  email: new Policy({ mixins: [EmailPolicy] }),
  card: new Policy({ mixins: [CardPolicy] }),
  secret: new Policy({ mixins: [SecretPolicy] }),
  phone: new Policy({ mixins: [PhoneDisplayOnlyPolicy] }),
  amount: new Policy({ mixins: [AmountPolicy] }),
};

const initialCells = buildInitialCells({
  matrices: {
    A1: [
      ['Alice', 'alice@acme.io', '4111 1111 1111 1234', 'sk_live_9f8e7d6c', '090-1234-5678', 1234.5],
      ['Bob', 'bob@acme.io', '5500 0000 0000 9876', 'sk_live_1a2b3c4d', '080-2345-6789', 980],
      ['Carol', 'carol@acme.io', '3400 000000 05555', 'sk_live_5e6f7a8b', '070-3456-7890', 5200.25],
    ],
  },
  cells: {
    A: { label: 'Name', width: 60 },
    B: { label: 'Email', width: 112, policy: 'email' },
    C: { label: 'Card', width: 86, policy: 'card' },
    D: { label: 'API key', width: 80, policy: 'secret' },
    E: { label: '⚠ Phone', width: 118, policy: 'phone' },
    F: { label: 'Amount', width: 84, policy: 'amount', justifyContent: 'right' },
  },
  ensured: { numRows: 3, numCols: 6 },
});

export default function ClipboardMasking() {
  const inheritMode = useStarlightMode();
  const book = useSpellbook({ policies });
  const [pasted, setPasted] = React.useState('');

  return (
    <div style={{ padding: '10px', fontSize: 13 }}>
      <p style={{ margin: '0 0 8px' }}>
        Select <code>A1:F3</code>, copy it (Ctrl/Cmd+C), and paste into the box below to see exactly what left the grid.
      </p>
      <GridSheet
        book={book}
        sheetName="clipboard-masking"
        initialCells={initialCells}
        options={{ sheetWidth: '100%', showFormulaBar: true, mode: inheritMode }}
      />
      <textarea
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        placeholder="Paste here…"
        rows={4}
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          marginTop: 10,
          fontFamily: 'monospace',
          fontSize: 12,
          color: 'var(--sl-color-white)',
          background: 'var(--sl-color-gray-6)',
          border: '1px solid var(--sl-color-gray-5)',
          borderRadius: 4,
          padding: '6px 8px',
        }}
      />
    </div>
  );
}
