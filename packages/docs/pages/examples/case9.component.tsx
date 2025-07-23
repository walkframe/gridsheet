import React from 'react';
import {
  GridSheet,
  Policy,
  Renderer,
  buildInitialCells,
  useHub,
  BaseFunction,
  makeBorder,
  ensureString,
} from '@gridsheet/react-core';

export default function Case9Component() {
  // Custom security functions
  const SecureHashFunction = class extends BaseFunction {
    example = 'SECURE_HASH("password123")';
    helpText = ['Creates a secure hash of the input text'];
    helpArgs = [{ name: 'text', description: 'Text to hash' }];

    protected validate() {
      if (this.bareArgs.length !== 1) {
        throw new Error('SECURE_HASH requires exactly 1 argument');
      }
      this.bareArgs[0] = ensureString(this.bareArgs[0]);
    }

    protected main(text: string) {
      // Simple hash function for demonstration
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  };

  const ValidateEmailFunction = class extends BaseFunction {
    example = 'VALIDATE_EMAIL("user@example.com")';
    helpText = ['Validates email format and returns security status'];
    helpArgs = [{ name: 'email', description: 'Email to validate' }];

    protected validate() {
      if (this.bareArgs.length !== 1) {
        throw new Error('VALIDATE_EMAIL requires exactly 1 argument');
      }
    }

    protected main(email: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      return isValid ? 'VALID' : 'INVALID';
    }
  };

  const EncryptLevelFunction = class extends BaseFunction {
    example = 'ENCRYPT_LEVEL("sensitive_data", 3)';
    helpText = ['Applies encryption level to sensitive data'];
    helpArgs = [
      { name: 'value', description: 'Value to encrypt' },
      { name: 'level', description: 'Encryption level (1-5)' },
    ];

    protected validate() {
      if (this.bareArgs.length !== 2) {
        throw new Error('ENCRYPT_LEVEL requires exactly 2 arguments');
      }
    }

    protected main(value: string, level: number) {
      const levels = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'MAXIMUM'];
      const levelIndex = Math.min(Math.max(Math.floor(level) - 1, 0), 4);
      return `[${levels[levelIndex]}_ENCRYPTED]${value}`;
    }
  };

  // Security policy for clipboard protection
  const securityPolicy = new Policy({
    mixins: [
      {
        onClip({ point, table }) {
          const cellValue = table.stringify({ point }) ?? '';
          // Return asterisks for clipboard copy
          return '*'.repeat(cellValue.length);
        },
      },
    ],
  });

  // Security renderer for display masking
  const securityRenderer = new Renderer({
    mixins: [
      {
        string({ value }) {
          if (value == null || value === '') {
            return '';
          }
          const str = String(value);
          // Show first 2 characters, mask the rest
          if (str.length <= 2) {
            return str;
          }
          return `${str.substring(0, 2)}${'*'.repeat(str.length - 2)}`;
        },
      },
    ],
  });

  // ID renderer to ensure text interpretation
  const idRenderer = new Renderer({
    mixins: [
      {
        string({ value }) {
          if (value == null || value === '') {
            return '';
          }
          // Force text interpretation by ensuring it's always a string
          return String(value);
        },
      },
    ],
  });

  // Hub with security functions and components
  const hub = useHub({
    additionalFunctions: {
      secure_hash: SecureHashFunction,
      validate_email: ValidateEmailFunction,
      encrypt_level: EncryptLevelFunction,
    },
    policies: {
      security: securityPolicy,
    },
    renderers: {
      security: securityRenderer,
      id: idRenderer,
    },
  });

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
        hub={hub}
        options={{
          showFormulaBar: false,
        }}
        initialCells={buildInitialCells({
          cells: {
            default: {
              width: 160,
              height: 45,
              style: {
                ...makeBorder({ all: '1px solid #e1e5e9' }),
                fontSize: '14px',
              },
            },
            A: {
              width: 80,
            },
            // Headers with enhanced styling
            A1: {
              value: 'ID',
              style: {
                fontWeight: 'bold',
                backgroundColor: '#2c3e50',
                color: 'white',
                textAlign: 'center',
                fontSize: '13px',
                ...makeBorder({ all: '2px solid #34495e' }),
                width: 80,
              },
            },
            B1: {
              value: 'Username',
              style: {
                fontWeight: 'bold',
                backgroundColor: '#2c3e50',
                color: 'white',
                textAlign: 'center',
                fontSize: '13px',
                ...makeBorder({ all: '2px solid #34495e' }),
              },
            },
            C1: {
              value: '🔐 Password',
              style: {
                fontWeight: 'bold',
                backgroundColor: '#e74c3c',
                color: 'white',
                textAlign: 'center',
                fontSize: '13px',
                ...makeBorder({ all: '2px solid #c0392b' }),
              },
            },
            D1: {
              value: '🔑 Hash',
              style: {
                fontWeight: 'bold',
                backgroundColor: '#9b59b6',
                color: 'white',
                textAlign: 'center',
                fontSize: '13px',
                ...makeBorder({ all: '2px solid #8e44ad' }),
              },
            },

            // Data rows with alternating colors
            A2: {
              value: '001',
              renderer: 'id',
              style: {
                backgroundColor: '#f8f9fa',
                textAlign: 'center',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            B2: {
              value: 'john_doe',
              style: {
                backgroundColor: '#f8f9fa',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            C2: {
              value: 'super_secret_password_123',
              policy: 'security',
              renderer: 'security',
              style: {
                backgroundColor: '#fdf2f2',
                ...makeBorder({ all: '2px solid #e74c3c' }),
                fontWeight: '500',
              },
            },
            D2: {
              value: '=SECURE_HASH(C2)',
              style: {
                backgroundColor: '#f8f4ff',
                ...makeBorder({ all: '2px solid #9b59b6' }),
                fontWeight: '500',
                fontFamily: 'monospace',
                fontSize: '12px',
              },
            },

            A3: {
              value: '002',
              renderer: 'id',
              style: {
                backgroundColor: 'white',
                textAlign: 'center',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            B3: {
              value: 'jane_smith',
              style: {
                backgroundColor: 'white',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            C3: {
              value: 'another_secure_password',
              policy: 'security',
              renderer: 'security',
              style: {
                backgroundColor: '#fdf2f2',
                ...makeBorder({ all: '2px solid #e74c3c' }),
                fontWeight: '500',
              },
            },
            D3: {
              value: '=SECURE_HASH(C3)',
              style: {
                backgroundColor: '#f8f4ff',
                ...makeBorder({ all: '2px solid #9b59b6' }),
                fontWeight: '500',
                fontFamily: 'monospace',
                fontSize: '12px',
              },
            },

            A4: {
              value: '003',
              renderer: 'id',
              style: {
                backgroundColor: '#f8f9fa',
                textAlign: 'center',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            B4: {
              value: 'admin_user',
              style: {
                backgroundColor: '#f8f9fa',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            C4: {
              value: 'admin_password_2024',
              policy: 'security',
              renderer: 'security',
              style: {
                backgroundColor: '#fdf2f2',
                ...makeBorder({ all: '2px solid #e74c3c' }),
                fontWeight: '500',
              },
            },
            D4: {
              value: '=SECURE_HASH(C4)',
              style: {
                backgroundColor: '#f8f4ff',
                ...makeBorder({ all: '2px solid #9b59b6' }),
                fontWeight: '500',
                fontFamily: 'monospace',
                fontSize: '12px',
              },
            },

            A5: {
              value: '004',
              renderer: 'id',
              style: {
                backgroundColor: 'white',
                textAlign: 'center',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            B5: {
              value: 'guest_user',
              style: {
                backgroundColor: 'white',
                fontWeight: '500',
                ...makeBorder({ all: '1px solid #e1e5e9' }),
              },
            },
            C5: {
              value: 'guest_password',
              policy: 'security',
              renderer: 'security',
              style: {
                backgroundColor: '#fdf2f2',
                ...makeBorder({ all: '2px solid #e74c3c' }),
                fontWeight: '500',
              },
            },
            D5: {
              value: '=SECURE_HASH(C5)',
              style: {
                backgroundColor: '#f8f4ff',
                ...makeBorder({ all: '2px solid #9b59b6' }),
                fontWeight: '500',
                fontFamily: 'monospace',
                fontSize: '12px',
              },
            },
          },
          ensured: { numRows: 6, numCols: 4 },
        })}
      />
    </div>
  );
}
