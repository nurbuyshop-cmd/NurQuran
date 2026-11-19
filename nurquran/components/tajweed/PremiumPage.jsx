"use client";
// Premium — plans and prices from the admin panel. After paying (as the admin's instructions say), the buyer
// gets a code from the admin and enters it here; Premium then opens on this phone.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/siteImages";
import { usePremium } from "@/lib/premium";
import { QuranIcon } from "@/components/FeatureIcons";
import "./tajweed.css";

export default function PremiumPage() {
  const router = useRouter();
  const cfg = useSiteConfig();
  const { premium, redeem, signOut } = usePremium();
  const t = cfg.tajweed || {};
  const plans = t.plans && t.plans.length ? t.plans : [{ id: "lifetime", name: "Lifetime", price: "", note: "" }];
  const [sel, setSel] = useState(1);
  const [step, setStep] = useState(null); // null | pay | code
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const plan = plans[Math.min(sel, plans.length - 1)];

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try { await redeem(code); setStep(null); setMsg("Premium is now active on this phone. JazakAllahu khairan!"); }
    catch (err) { setMsg(err.message); }
    setBusy(false);
  };

  return (
    <div className="pm">
      <header className="pm-top">
        <button className="b" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="logo"><QuranIcon /></span>
        <h1>Subscribe to premium Nur Quran for the full Learn Tajweed course, ad-free reading and every theme</h1>
      </header>

      {premium ? (
        <div className="pm-box">
          <div className="pm-active">
            <b>Premium is active ✓</b>
            <span>{premium.plan}{premium.expiresAt ? ` · until ${new Date(premium.expiresAt).toLocaleDateString()}` : " · lifetime"}</span>
            <small>Code {premium.code}</small>
          </div>
          <button className="pm-sub" onClick={() => router.push("/tajweed")}>Open Learn Tajweed</button>
          <button className="pm-ghost" onClick={signOut}>Remove Premium from this phone</button>
        </div>
      ) : (
        <div className="pm-box">
          {t.mode === "free" && <p className="pm-note">Learn Tajweed is free for everyone right now.</p>}
          <div className="pm-plans">
            {plans.map((p, i) => (
              <button key={p.id} className={sel === i ? "on" : ""} onClick={() => setSel(i)}>
                <b>{p.name}</b>
                {p.price && <span>{p.price}</span>}
                {p.note && <small>{p.note}</small>}
              </button>
            ))}
          </div>
          <button className="pm-sub" onClick={() => setStep("pay")}>Subscribe now</button>
          <button className="pm-ghost" onClick={() => router.push("/tajweed")}>Continue free version</button>
          {msg && <p className="pm-msg">{msg}</p>}
        </div>
      )}

      {!premium && (
        <footer className="pm-foot">
          <span>Already paid for the premium version?</span>
          <button onClick={() => { setStep("code"); setMsg(""); }}>Enter code</button>
        </footer>
      )}

      {step && (
        <div className="tj-dlg-bg" onClick={() => setStep(null)}>
          <div className="tj-dlg pm-dlg" onClick={(e) => e.stopPropagation()}>
            {step === "pay" && (
              <>
                <h3>{plan.name}{plan.price ? ` — ${plan.price}` : ""}</h3>
                <p className="pay">{t.payInfo || "Payment details will be shown here soon. Please contact us to subscribe."}</p>
                <p className="small">After paying you will receive a Premium code. Enter it here to unlock everything on this phone.</p>
                <div className="r"><button onClick={() => setStep(null)}>Close</button><button onClick={() => setStep("code")}>I have a code</button></div>
              </>
            )}
            {step === "code" && (
              <form onSubmit={submit}>
                <h3>Enter your Premium code</h3>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NQ-XXXX-XXXX" autoFocus autoComplete="off" spellCheck="false" />
                {msg && <p className="err">{msg}</p>}
                <div className="r"><button type="button" onClick={() => setStep(null)}>Cancel</button><button disabled={busy || code.trim().length < 6}>{busy ? "Checking…" : "Activate"}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
