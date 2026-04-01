import React from 'react';
import { GridSheet, Policy, buildInitialCells, BaseFunction, makeBorder } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { FunctionArgumentDefinition } from '@gridsheet/react-core';

export default function Case9Component() {
  const SecureHashFunction = class extends BaseFunction {
    example = 'SECURE_HASH("password123")';
    helpText = ['Creates a secure hash of the input text'];
    defs: FunctionArgumentDefinition[] = [{ name: 'text', description: 'Text to hash', acceptedTypes: ['string'] }];

    protected main(text: string) {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
  };

  const ValidateEmailFunction = class extends BaseFunction {
    example = 'VALIDATE_EMAIL("user@example.com")';
    helpText = ['Validates email format'];
    defs: FunctionArgumentDefinition[] = [
      { name: 'email', description: 'Email to validate', acceptedTypes: ['string'] },
    ];

    protected main(email: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) ? 'VALID' : 'INVALID';
    }
  };

  const EncryptLevelFunction = class extends BaseFunction {
    example = 'ENCRYPT_LEVEL("data", 3)';
    helpText = ['Returns encryption level label'];
    defs: FunctionArgumentDefinition[] = [
      { name: 'value', description: 'Value to encrypt', acceptedTypes: ['string'] },
      { name: 'level', description: 'Encryption level (1-5)', acceptedTypes: ['number'] },
    ];

    protected main(_value: string, level: number) {
      const levels = ['LOW', 'MEDIUM', 'HIGH', 'VERY HIGH', 'MAXIMUM'];
      const idx = Math.min(Math.max(Math.floor(level) - 1, 0), 4);
      return levels[idx];
    }
  };

  const securityPolicy = new Policy({
    mixins: [
      {
        serializeForClipboard({ point, sheet }) {
          const cellValue = sheet.getSerializedValue({ point }) ?? '';
          return '*'.repeat(cellValue.length);
        },
        renderString({ value }: any) {
          if (value == null || value === '') {
            return '';
          }
          const str = String(value);
          if (str.length <= 2) {
            return str;
          }
          return `${str.substring(0, 2)}${'*'.repeat(str.length - 2)}`;
        },
      },
    ],
  });

  const idPolicy = new Policy({
    mixins: [
      {
        renderString({ value }: any) {
          return String(value ?? '');
        },
      },
    ],
  });

  const book = useSpellbook({
    additionalFunctions: {
      secure_hash: SecureHashFunction,
      validate_email: ValidateEmailFunction,
      encrypt_level: EncryptLevelFunction,
    },
    policies: {
      security: securityPolicy,
      id: idPolicy,
    },
  });

  const headerStyle = {
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    fontWeight: 'bold' as const,
    fontSize: '11px',
    letterSpacing: '0.5px',
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        margin: '20px auto',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
      }}
    >
      <GridSheet
        book={book}
        options={{
          showFormulaBar: false,
          sheetWidth: 920,
          sheetHeight: 300,
        }}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['001', 'john_doe', 'john@example.com', 'super_secret_123', '=SECURE_HASH(D1)', '=VALIDATE_EMAIL(C1)'],
              ['002', 'jane_smith', 'jane@company.org', 'secure_pass_456', '=SECURE_HASH(D2)', '=VALIDATE_EMAIL(C2)'],
              ['003', 'admin_user', 'admin@internal', 'admin_pw_2024', '=SECURE_HASH(D3)', '=VALIDATE_EMAIL(C3)'],
              ['004', 'guest_user', 'guest@example.com', 'guest_pass', '=SECURE_HASH(D4)', '=VALIDATE_EMAIL(C4)'],
              ['005', 'dev_ops', 'devops@company.org', 'infra_key_789', '=SECURE_HASH(D5)', '=VALIDATE_EMAIL(C5)'],
            ],
          },
          cells: {
            default: { style: { fontSize: '13px', ...makeBorder({ all: '1px solid #e1e5e9' }) } },
            defaultRow: { height: 38 },

            // Header
            A0: { width: 55, label: 'ID', style: headerStyle },
            B0: { width: 110, label: 'Username', style: headerStyle },
            C0: { width: 160, label: 'Email', style: headerStyle },
            D0: { width: 110, label: '🔐 Password', style: headerStyle },
            E0: { width: 110, label: '🔑 Hash', style: headerStyle },
            F0: { width: 80, label: 'Email OK', style: headerStyle },
            G0: { width: 80, label: 'Access', style: headerStyle },

            // Column policies & styles
            A: {
              policy: 'id',
              alignItems: 'center',
              style: { textAlign: 'center', fontWeight: '500' },
            },
            B: {
              alignItems: 'center',
              style: { fontWeight: '500' },
            },
            C: {
              alignItems: 'center',
              style: { color: '#2980b9' },
            },
            D: {
              policy: 'security',
              alignItems: 'center',
              style: { ...makeBorder({ all: '2px solid #e74c3c' }), fontWeight: '500' },
            },
            E: {
              alignItems: 'center',
              style: { ...makeBorder({ all: '2px solid #9b59b6' }), fontFamily: 'monospace', fontSize: '11px' },
            },
            F: {
              alignItems: 'center',
              style: { textAlign: 'center', fontWeight: '600' },
            },
            G: {
              alignItems: 'center',
              style: { textAlign: 'center', fontWeight: '600', fontSize: '12px' },
            },

            // Access level: matrices provides the numeric level (1-5),
            // ENCRYPT_LEVEL renders it as a label
            G1: { value: '=ENCRYPT_LEVEL(B1, 3)' },
            G2: { value: '=ENCRYPT_LEVEL(B2, 5)' },
            G3: { value: '=ENCRYPT_LEVEL(B3, 5)' },
            G4: { value: '=ENCRYPT_LEVEL(B4, 1)' },
            G5: { value: '=ENCRYPT_LEVEL(B5, 4)' },
          },
          ensured: { numRows: 6, numCols: 7 },
        })}
      />
    </div>
  );
}
