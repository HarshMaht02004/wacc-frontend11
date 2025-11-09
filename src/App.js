import React, { useState } from 'react';
import WaccForm from './WaccForm';
import './styles.css';

export default function App() {
  // capitalBreak holds weights { weightE, weightD } or null
  const [capitalBreak, setCapitalBreak] = useState(null);

  return (
    <div className="app-root">
      <header className="topbar centered">
        <div className="brand centered-brand">
          <h1>WACC STUDIO</h1>
          <div className="tag">Corporate Finance • Weighted Average Cost of Capital</div>
        </div>
      </header>

      <main className="container">
        <section className="left">
          <WaccForm
            onResult={(res) => {
              // res is either API result object or null on clear
              if (!res) setCapitalBreak(null);
              else setCapitalBreak({ weightE: res.weightE, weightD: res.weightD });
            }}
          />
        </section>

        <aside className="right">
          <div className="card">
            <h3>What is WACC?</h3>
            <p>
              WACC is the average rate of return a company is expected to pay to all its
              security holders to finance its assets.
            </p>
            <ul>
              <li><strong>Re</strong> — Cost of Equity</li>
              <li><strong>Rd</strong> — Cost of Debt</li>
              <li><strong>Tax Shield</strong> reduces effective cost of debt</li>
            </ul>
          </div>

          <div className="card">
            <h3>Quick Tips</h3>
            <ol>
              <li>Use market values (not book values) for equity and debt.</li>
              <li>Re from CAPM: <code>Re = Rf + Beta × Market Risk Premium</code></li>
              <li>Rd usually from average yield on company debt.</li>
            </ol>
          </div>

          {/* Immersive % Split below Quick Tips */}
          <div style={{ marginTop: 8 }}>
            {capitalBreak ? (
              <div
                className="card"
                style={{
                  textAlign: 'center',
                  padding: 20,
                  color: '#ffffff',
                  background:
                    'linear-gradient(135deg, rgba(14,20,30,0.9), rgba(6,12,20,0.7))',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 12px 40px rgba(2,6,23,0.6)',
                  borderRadius: '14px',
                  transition: 'transform 0.2s ease, box-shadow 0.3s ease',
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#facc15',
                    marginBottom: 10,
                    letterSpacing: 0.3,
                    textShadow: '0 0 12px rgba(250,204,21,0.7)',
                  }}
                >
                  Capital Structure Split
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#4FC3F7', fontSize: 16, fontWeight: 700 }}>
                      Equity
                    </div>
                    <div
                      style={{
                        color: '#ffffff',
                        fontSize: 24,
                        fontWeight: 800,
                        textShadow: '0 0 10px rgba(79,195,247,0.7)',
                      }}
                    >
                      {(capitalBreak.weightE * 100).toFixed(2)}%
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#FFA726', fontSize: 16, fontWeight: 700 }}>
                      Debt
                    </div>
                    <div
                      style={{
                        color: '#ffffff',
                        fontSize: 24,
                        fontWeight: 800,
                        textShadow: '0 0 10px rgba(255,167,38,0.7)',
                      }}
                    >
                      {(capitalBreak.weightD * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="card"
                style={{
                  textAlign: 'center',
                  color: 'var(--muted)',
                  padding: 18,
                }}
              >
                Enter values and click <strong>Calculate WACC</strong> to see Equity /
                Debt split here.
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="footer">
        <small>WACC Studio — Professional Finance Tools · v2.1</small>
      </footer>
    </div>
  );
}
