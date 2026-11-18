"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken } from "@/lib/api";
import { I } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (getToken()) router.replace("/"); }, [router]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await api("/v1/auth/login", { method: "POST", body: { email, password } });
      setToken(r.token);
      router.replace("/");
    } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <div className="qa-login">
      <form className="qa-login-card" onSubmit={submit}>
        <span className="lg"><I.logo /></span>
        <h1>Nur Quran Admin</h1>
        <p>Sign in to manage the Quran website</p>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password
          <div className="pw">
            <input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label="Show password"><I.eye /></button>
          </div>
        </label>
        {error && <div className="qa-err">{error}</div>}
        {typeof window !== "undefined" && window.__MOCK_API__ && <div className="qa-demo">Demo preview — email <b>admin@toptol.site</b>, password <b>ChangeMe@123</b></div>}
        <button className="qa-btn block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
