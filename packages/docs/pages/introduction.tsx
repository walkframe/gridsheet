'use client';

import * as React from 'react';
import IntroductionExample from './introduction.component';

export default function IntroductionPage() {
  return (
    <div>
      <div
        style={{
          textAlign: 'center',
          margin: '40px 0',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 20px 0',
            lineHeight: '1.2',
          }}
        >
          Spreadsheet component for modern web applications
        </h1>

        <p
          style={{
            fontSize: '1.25rem',
            margin: '0 0 40px 0',
            lineHeight: '1.5',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          GridSheet is a powerful, customizable, and performant spreadsheet with formulas, styling, and real-time
          collaboration. <strong>Free and open source.</strong>
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '40px',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="/getting-started"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'background-color 0.2s',
            }}
          >
            Get Started
          </a>

          <a
            href="/examples/case1"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'background-color 0.2s',
            }}
          >
            More Examples
          </a>
        </div>
      </div>

      <IntroductionExample />
    </div>
  );
}
