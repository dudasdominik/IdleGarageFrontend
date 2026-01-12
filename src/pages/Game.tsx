import { useEffect, useMemo, useState } from "react";
import { api, clearToken } from "../api";
import type { WorkshopStateDto } from "../types";
import "../Game.css";

function remainingFromCompletedAtUtc(completedAtUtc: string) {
  const done = new Date(completedAtUtc).getTime();
  return Math.max(0, Math.ceil((done - Date.now()) / 1000));
}

export function Game({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<WorkshopStateDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [tick, setTick] = useState(0);

  async function refresh() {
    const s = (await api.getState()) as WorkshopStateDto;
    setState(s);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));

    const pollId = setInterval(() => {
      refresh().catch(() => {});
    }, 3000);

    return () => clearInterval(pollId);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    void tick;
    if (!state?.activeJob) return 0;
    return remainingFromCompletedAtUtc(state.activeJob.completedAtUtc);
  }, [state?.activeJob?.completedAtUtc, state?.activeJob?.jobId, tick]);

  const canClaim = useMemo(() => {
    if (!state?.activeJob) return false;
    return state.activeJob.status === "Completed" || remaining === 0;
  }, [state?.activeJob?.status, remaining]);

  async function startJob(jobDefinitionId: string) {
    setErr(null);
    setBusy(true);
    try {
      await api.startJob(jobDefinitionId);
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    setErr(null);
    setBusy(true);
    try {
      const res = await api.claim();
      await refresh();
      alert(`Claimed: +${res.reward}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function buyUpgrade(upgradeDefinitionId: string) {
    setErr(null);
    setBusy(true);
    try {
      await api.buyUpgrade(upgradeDefinitionId);
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearToken();
    onLogout();
  }

  if (!state) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24 }}>
        <p>Loading...</p>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "system-ui",
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
        backgroundColor: "#696e6c",
        borderRadius: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          borderRadius: "2rem",
          backgroundColor: "#8ca1ecff",
        }}
      >
        <h2 style={{ color: "" }}>Idle Garage</h2>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          padding: "2vh",
        }}
      >
        <div
          style={{
            border: "5px solid #000000ff",
            padding: 12,
            borderRadius: 8,
            minWidth: 220,
            backgroundColor: "#b8baba",
          }}
        >
          <div>
            <b>Money:</b> {state.money}
          </div>
          <div>
            <b>Level:</b> {state.level}
          </div>
          <div>
            <b>Exp:</b> {state.exp}
          </div>
        </div>

        <div
          style={{
            border: "5px solid #000000ff",
            padding: 12,
            borderRadius: 8,
            flex: 1,
            minWidth: 260,
            backgroundColor: "#b8baba",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Active Job</b>
            {state.activeJob ? (
              <span>{state.activeJob.status}</span>
            ) : (
              <span>None</span>
            )}
          </div>

          {state.activeJob ? (
            <>
              <div style={{ marginTop: 8 }}>
                <b>{state.activeJob.name}</b>
              </div>
              <div>Reward: {state.activeJob.reward}</div>
              <div>Remaining: {remaining}s</div>

              <button
                className="claim-button"
                disabled={busy || !canClaim}
                onClick={claim}
                style={{ marginTop: 10 }}
              >
                Claim
              </button>
            </>
          ) : (
            <div style={{ marginTop: 8, color: "#666" }}>
              Start a job below.
            </div>
          )}
        </div>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <h3 style={{ marginTop: 24, marginLeft: 50, fontSize: 30 }}>Jobs</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          padding: "2vh",
        }}
      >
        {state.jobs.map((j) => {
          const locked = state.level < j.requiredLevel;
          const disabled = busy || !!state.activeJob || locked;

          return (
            <div
              key={j.id}
              style={{
                border: "5px solid #000000ff",
                padding: 12,
                borderRadius: 8,
                backgroundColor: "#b8baba",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{j.name}</b>
                <span style={{ color: locked ? "crimson" : "#666" }}>
                  L{j.requiredLevel}
                </span>
              </div>
              <div>Time: {j.baseSeconds}s</div>
              <div>Reward: {j.baseReward}</div>
              <button
                className={locked ? "locked-buttons" : "unlocked-buttons"}
                disabled={disabled}
                onClick={() => startJob(j.id)}
                style={{ marginTop: 10 }}
              >
                {locked ? "Locked" : "Start"}
              </button>
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: 24, marginLeft: 50, fontSize: 30 }}>Upgrades</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          padding: "2vh",
        }}
      >
        {state.upgrades.map((u) => {
          const locked = state.money < u.nextCost;
          const disabled = busy || state.money < u.nextCost;
          return (
            <div
              key={u.id}
              style={{
                border: "5px solid #000000ff",
                padding: 12,
                borderRadius: 8,
                backgroundColor: "#b8baba",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{u.name}</b>
                <span style={{ color: "#666" }}>{u.type}</span>
              </div>
              <div>Level: {u.level}</div>
              <div>Cost: {u.nextCost}</div>
              <button
                className={locked ? "locked-buttons" : "unlocked-buttons"}
                disabled={disabled}
                onClick={() => buyUpgrade(u.id)}
                style={{ marginTop: 10 }}
              >
                {locked ? "Not Enough Cash" : "Buy"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
