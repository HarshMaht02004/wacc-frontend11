import React, { useState } from "react";
import axios from "axios";

/**
 * WaccForm.js
 * - Inputs: equity/debt in ₹ Crore, rates in % where appropriate
 * - Calls props.onResult(result) with API result or null on clear (if provided)
 * - Displays WACC result and an immersive Formula panel on the right
 */

/* Simple input component */
function NumberInput({ label, name, value, onChange, placeholder, suffix }) {
  return (
    <label className="field">
      <div className="field-label" style={{ color: "#ffffff" }}>{label}</div>
      <div className="field-input">
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode="decimal"
          autoComplete="off"
          spellCheck="false"
        />
        {suffix && <div className="suffix">{suffix}</div>}
      </div>
    </label>
  );
}

/* formatting helper */
const fmt = (n, dp = 2) => {
  if (n === undefined || n === null || Number.isNaN(n)) return "-";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
};

export default function WaccForm({ onResult }) {
  const [form, setForm] = useState({
    equityValue: "",
    debtValue: "",
    re: "",
    rf: "",
    beta: "",
    marketRiskPremium: "",
    rd: "",
    taxRate: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // UI states for formula panel
  const [formulaOpen, setFormulaOpen] = useState(true);
  const [copiedMsg, setCopiedMsg] = useState("");

  const handleChange = (e) => {
    const v = e.target.value;
    setForm({ ...form, [e.target.name]: v });
  };

  const clear = () => {
    setForm({
      equityValue: "",
      debtValue: "",
      re: "",
      rf: "",
      beta: "",
      marketRiskPremium: "",
      rd: "",
      taxRate: "",
    });
    setResult(null);
    setError("");
    setFadeIn(false);
    setCopiedMsg("");
    if (typeof onResult === "function") onResult(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    setFadeIn(false);
    setCopiedMsg("");

    const croreToRupees = 10000000;
    const toDecimal = (val) => (val === "" ? undefined : Number(val) / 100);

    const payload = {
      equityValue: Number(form.equityValue || 0) * croreToRupees,
      debtValue: Number(form.debtValue || 0) * croreToRupees,
      rd: toDecimal(form.rd),
      taxRate: toDecimal(form.taxRate),
    };

    if (form.re !== "") payload.re = toDecimal(form.re);
    else {
      if (form.rf !== "" && form.beta !== "" && form.marketRiskPremium !== "") {
        payload.rf = toDecimal(form.rf);
        payload.beta = Number(form.beta);
        payload.marketRiskPremium = toDecimal(form.marketRiskPremium);
      }
    }

    try {
      const res = await axios.post("https://wacc-backend.vercel.app/api/wacc", payload, {
        timeout: 7000,
      });
      setResult(res.data);
      if (typeof onResult === "function") onResult(res.data);
      setTimeout(() => setFadeIn(true), 100);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Request failed");
      if (typeof onResult === "function") onResult(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Values for formula panel (prefer API result, otherwise derive from inputs) ---
  const croreToNumber = (cr) => (Number(cr || 0) * 10000000);
  const E_rupees = croreToNumber(form.equityValue);
  const D_rupees = croreToNumber(form.debtValue);
  const V_rupees = E_rupees + D_rupees;

  const Re_dec = result?.re ?? (form.re ? Number(form.re) / 100 : undefined);
  const Rd_dec = result?.rd ?? (form.rd ? Number(form.rd) / 100 : undefined);
  const Tc_dec = result?.taxRate ?? (form.taxRate ? Number(form.taxRate) / 100 : undefined);

  const weightE_input = V_rupees > 0 ? (E_rupees / V_rupees) : undefined;
  const weightD_input = V_rupees > 0 ? (D_rupees / V_rupees) : undefined;

  // final weights: prefer API result (already decimals 0..1), otherwise derived from inputs
  const weightE = typeof result?.weightE === "number" ? result.weightE : (weightE_input ?? result?.weightE ?? 0);
  const weightD = typeof result?.weightD === "number" ? result.weightD : (weightD_input ?? result?.weightD ?? 0);

  // wacc computed fallback (for display if API missing)
  const waccComputed =
    (typeof weightE === "number" && typeof Re_dec === "number" ? weightE * Re_dec : 0) +
    (typeof weightD === "number" && typeof Rd_dec === "number" && typeof Tc_dec === "number"
      ? weightD * Rd_dec * (1 - Tc_dec)
      : 0);

  // copy formula helper
  const copyFormula = async () => {
    // build lines
    const lines = [];
    lines.push("WACC = (E/V × Re) + (D/V × Rd × (1 - Tc))");
    lines.push("");
    lines.push(`E (₹) = ${fmt(E_rupees, 0)}`);
    lines.push(`D (₹) = ${fmt(D_rupees, 0)}`);
    lines.push(`V (₹) = ${fmt(V_rupees, 0)}`);
    lines.push(`E/V = ${(weightE * 100).toFixed(2)}%`);
    lines.push(`D/V = ${(weightD * 100).toFixed(2)}%`);
    lines.push(`Re = ${Re_dec !== undefined ? (Re_dec * 100).toFixed(2) + "%" : "-"}`);
    lines.push(`Rd = ${Rd_dec !== undefined ? (Rd_dec * 100).toFixed(2) + "%" : "-"}`);
    lines.push(`Tc = ${Tc_dec !== undefined ? (Tc_dec * 100).toFixed(2) + "%" : "-"}`);
    lines.push("");
    lines.push(`WACC = ${( (result?.wacc ?? waccComputed) * 100 ).toFixed(2)}%`);

    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsg("Copied!");
      setTimeout(() => setCopiedMsg(""), 1400);
    } catch {
      setCopiedMsg("Copy failed");
      setTimeout(() => setCopiedMsg(""), 1400);
    }
  };

  return (
    <div className="panel">
      <form onSubmit={submit} className="form-grid" autoComplete="off">
        <div className="section-title">Capital Structure</div>
        <NumberInput
          label="Equity market value (E) – in ₹ Crore"
          name="equityValue"
          value={form.equityValue}
          onChange={handleChange}
          placeholder="e.g. 200"
          suffix="Cr"
        />
        <NumberInput
          label="Debt market value (D) – in ₹ Crore"
          name="debtValue"
          value={form.debtValue}
          onChange={handleChange}
          placeholder="e.g. 50"
          suffix="Cr"
        />

        <div className="section-title">Cost of Equity</div>
        <NumberInput label="Re — Cost of Equity (%)" name="re" value={form.re} onChange={handleChange} placeholder="e.g. 12" suffix="%" />
        <div className="hint" style={{ color: "#facc15" }}>Or provide CAPM inputs:</div>
        <NumberInput label="Risk-free rate (Rf, %)" name="rf" value={form.rf} onChange={handleChange} placeholder="e.g. 4" suffix="%" />
        <NumberInput label="Beta" name="beta" value={form.beta} onChange={handleChange} placeholder="e.g. 1.2" />
        <NumberInput label="Market Risk Premium (%)" name="marketRiskPremium" value={form.marketRiskPremium} onChange={handleChange} placeholder="e.g. 6" suffix="%" />

        <div className="section-title">Debt & Tax</div>
        <NumberInput label="Rd — Cost of Debt (%)" name="rd" value={form.rd} onChange={handleChange} placeholder="e.g. 5" suffix="%" />
        <NumberInput label="Corporate tax rate (%)" name="taxRate" value={form.taxRate} onChange={handleChange} placeholder="e.g. 25" suffix="%" />

        <div className="actions">
          <button
            type="submit"
            className="btn primary"
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              fontWeight: "600",
            }}
            disabled={loading}
          >
            {loading ? "Calculating..." : "Calculate WACC"}
          </button>
          <button type="button" className="btn ghost" onClick={clear}>Reset</button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div
          className={`wacc-card fade-in ${fadeIn ? "visible" : ""}`}
          role="region"
          aria-label="WACC result"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* --- Left: WACC KPI and breakdown --- */}
          <div
            className="wacc-value"
            style={{
              flex: "1 1 60%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div className="label">Weighted Average Cost of Capital</div>
            <div
              className="value"
              style={{
                color: "#facc15",
                fontSize: "48px",
                fontWeight: "800",
                textShadow: "0 0 15px rgba(250,204,21,0.8)",
              }}
            >
              {(result.wacc * 100).toFixed(2)} %
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Calculated using your market inputs
            </div>

            <div
              className="wacc-breakdown"
              aria-hidden="false"
              style={{ marginTop: "10px", width: "100%" }}
            >
              <div className="break-row">
                <span>Cost of Equity (Re)</span>
                <strong>{(result.re * 100).toFixed(2)} %</strong>
              </div>
              <div className="break-row">
                <span>Cost of Debt (Rd)</span>
                <strong>{(result.rd * 100).toFixed(2)} %</strong>
              </div>
              <div className="break-row">
                <span>Weight of Equity</span>
                <strong>{(result.weightE * 100).toFixed(2)} %</strong>
              </div>
              <div className="break-row">
                <span>Weight of Debt</span>
                <strong>{(result.weightD * 100).toFixed(2)} %</strong>
              </div>
              <div className="break-row">
                <span>Tax Rate</span>
                <strong>{(result.taxRate * 100).toFixed(2)} %</strong>
              </div>
            </div>
          </div>

          {/* --- Right: Immersive Formula Panel --- */}
          <div
            className={`formula-tab interactive ${formulaOpen ? "open" : "closed"}`}
            style={{ flex: "1 1 36%", padding: 12 }}
            aria-expanded={formulaOpen}
          >
            <div
              className="formula-header"
              onClick={() => setFormulaOpen((s) => !s)}
              role="button"
              tabIndex={0}
              aria-pressed={formulaOpen}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}
            >
              <div>
                <div className="formula-title" style={{ fontSize: 15, fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>Formula</div>
                <div className="formula-subtitle" style={{ fontSize: 12, color: "var(--muted)" }}>Weighted Average Cost of Capital</div>
              </div>

              <div className="formula-controls" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="mini-btn"
                  onClick={(ev) => { ev.stopPropagation(); copyFormula(); }}
                  title="Copy formula & worked values"
                >
                  Copy
                </button>
                <div className={`chev ${formulaOpen ? "open" : ""}`} aria-hidden="true" style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>▾</div>
              </div>
            </div>

            <div className="formula-body" style={{ display: formulaOpen ? "block" : "none", marginTop: 10 }}>
              <div className="formula-expression" style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                <span style={{ color: "#fff" }}>WACC</span> = (<span style={{ color: "#facc15" }}>E/V</span> × <span style={{ color: "#4FC3F7" }}>Re</span>) + (<span style={{ color: "#facc15" }}>D/V</span> × <span style={{ color: "#FFA726" }}>Rd</span> × (1 − <span style={{ color: "#facc15" }}>Tc</span>))
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>E (₹)</div>
                <div style={{ textAlign: "right", color: "#fff", fontWeight: 700 }}>{fmt(E_rupees, 0)}</div>

                <div style={{ color: "var(--muted)", fontSize: 13 }}>D (₹)</div>
                <div style={{ textAlign: "right", color: "#fff", fontWeight: 700 }}>{fmt(D_rupees, 0)}</div>

                <div style={{ color: "var(--muted)", fontSize: 13 }}>V (₹)</div>
                <div style={{ textAlign: "right", color: "#fff", fontWeight: 700 }}>{fmt(V_rupees, 0)}</div>

                <div style={{ color: "var(--muted)", fontSize: 13 }}>E / V</div>
                <div style={{ textAlign: "right", color: "#fff", fontWeight: 700 }}>{(weightE * 100).toFixed(2)}%</div>

                <div style={{ color: "var(--muted)", fontSize: 13 }}>D / V</div>
                <div style={{ textAlign: "right", color: "#fff", fontWeight: 700 }}>{(weightD * 100).toFixed(2)}%</div>

                <div style={{ color: "var(--muted)", fontSize: 13 }}>Re</div>
                <div style={{ textAlign: "right", color: "#4FC3F7", fontWeight: 700 }}>{(Re_dec !== undefined ? (Re_dec * 100).toFixed(2) + "%" : "-")}</div>

                <div style={{ color: "var(--muted)", fontSize: 13 }}>Rd</div>
                <div style={{ textAlign: "right", color: "#FFA726", fontWeight: 700 }}>{(Rd_dec !== undefined ? (Rd_dec * 100).toFixed(2) + "%" : "-")}</div>

                <div style={{ color: "var(--muted)", fontSize: 13 }}>Tc</div>
                <div style={{ textAlign: "right", color: "#facc15", fontWeight: 700 }}>{(Tc_dec !== undefined ? (Tc_dec * 100).toFixed(2) + "%" : "-")}</div>
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Computed</div>
                <div style={{ color: "#facc15", fontWeight: 800, fontSize: 18, textShadow: "0 0 10px rgba(250,204,21,0.6)" }}>
                  {( (result?.wacc ?? waccComputed) * 100 ).toFixed(2)} %
                </div>
              </div>

              {copiedMsg && <div style={{ marginTop: 8, color: "#4ade80" }}>{copiedMsg}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
