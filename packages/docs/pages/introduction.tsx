'use client';

import * as React from 'react';
import IntroductionExample from './introduction.component';

const featureBadges = [
  { icon: '⚡', label: 'Virtualized Rendering' },
  { icon: '𝑓x', label: 'Formula Engine' },
  { icon: '🎨', label: 'Custom Renderers' },
  { icon: '🔌', label: 'Async Functions' },
  { icon: '⌨️', label: 'Keyboard Shortcuts' },
  { icon: '🔍', label: 'Sort & Filter' },
];

export default function IntroductionPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px 40px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          color: 'white',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            fontWeight: 800,
            margin: '0 0 16px',
            lineHeight: 1.15,
            background: 'linear-gradient(90deg, #ffffff 30%, #67e8f9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Build programmable spreadsheets
          <br />
          for web apps
        </h1>

        {/* Live demo */}
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 0 32px', textAlign: 'initial' }}>
          <IntroductionExample />
        </div>

        <p
          style={{
            fontSize: '1.15rem',
            margin: '0 auto 32px',
            lineHeight: 1.6,
            maxWidth: '520px',
            color: '#cbd5e1',
          }}
        >
          A powerful, extensible grid with formulas, custom renderers, and async data — ready to drop into any web app.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '36px',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="/getting-started"
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            Get Started
          </a>
          <a
            href="/examples/case1"
            style={{
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '15px',
              border: '1px solid rgba(255,255,255,0.25)',
              transition: 'background 0.15s',
            }}
          >
            More Examples
          </a>
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px',
            maxWidth: '600px',
            margin: '32px auto 0',
          }}
        >
          {featureBadges.map((f) => (
            <span
              key={f.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span>{f.icon}</span> {f.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
