// BLUFF scoring + player-count balance (seeded Monte Carlo, 15.3 / 15.4). Variant knobs and listener trust
// (how much predictors follow claims: + naive, 0 ignore, − contrarian).
// Strategies: R random · S silent reader · B bluffer · W reader max-wager · H honest claimer.
// Usage: node scripts/bluff-sim.mjs [--h2h]
const M = 20000;
const TYPES = ["R", "S", "B", "W", "H"];
function rng(seed) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}
function match(strats, v, trust, rnd) {
  const n = strats.length;
  const sc = Array(n).fill(0);
  const hits = Array(n).fill(0);
  const pick = (w) => {
    let r = rnd() * w.reduce((a, b) => a + b);
    for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) return i;
    return w.length - 1;
  };
  for (let r = 1; r <= 5; r++) {
    const mult = r === 5 ? 2 : 1;
    const pop = [0, 0, 0, 0].map(() => 0.3 + rnd() * 2);
    const ans = strats.map((st) => (st === "R" ? Math.floor(rnd() * 4) : pick(pop)));
    const canClaim = r >= v.claimFrom;
    const claim = strats.map((st, i) =>
      !canClaim
        ? null
        : st === "B"
          ? (ans[i] + 1 + Math.floor(rnd() * 3)) % 4
          : st === "H"
            ? ans[i]
            : null,
    );
    const pred = strats.map((st, i) => {
      if (st === "R") return Math.floor(rnd() * 4);
      const est = pop.map((p, k) => {
        let c = 0;
        for (let j = 0; j < n; j++) if (j !== i && claim[j] === k) c++;
        return p * (0.6 + rnd() * 0.8) + c * trust * (n === 2 ? 1.6 : 1);
      });
      return est.indexOf(Math.max(...est));
    });
    const wag = strats.map((st) =>
      st === "W" ? 2 : st === "R" ? Math.floor(rnd() * 3) : rnd() < 0.5 ? 1 : 0,
    );
    const votes = [0, 0, 0, 0];
    ans.forEach((a) => votes[a]++);
    const topFor = (i) => {
      if (n === 2) return [ans[1 - i]];
      const x = votes.slice();
      x[ans[i]]--;
      const m = Math.max(...x);
      return [0, 1, 2, 3].filter((k) => x[k] === m);
    };
    for (let i = 0; i < n; i++) {
      const hit = topFor(i).includes(pred[i]);
      if (hit) hits[i]++;
      let p = hit ? 2 + wag[i] : -wag[i];
      if (n >= 3 && votes[ans[i]] === Math.max(...votes)) p += 1;
      if (claim[i] !== null && claim[i] !== ans[i]) {
        let f = 0;
        for (let j = 0; j < n; j++)
          if (j !== i && pred[j] === claim[i] && !topFor(j).includes(claim[i])) f++;
        p += Math.min(f, v.bluffCap(n));
      }
      if (claim[i] !== null && claim[i] === ans[i]) {
        let ok = 0;
        for (let j = 0; j < n; j++) if (j !== i && pred[j] === claim[i]) ok = 1;
        p += ok * v.honest(n);
      }
      if (claim[i] === null && hit) p += v.silent(n);
      sc[i] += p * mult;
    }
  }
  return { sc, hits };
}
// Ties broken by correct predictions (as approved), then shared.
function run(v, n, trust, seed = 12345) {
  const rnd = rng(seed);
  const res = Object.fromEntries(TYPES.map((t) => [t, { w: 0, g: 0 }]));
  let ties = 0;
  for (let m = 0; m < M; m++) {
    const st = Array.from({ length: n }, (_, i) => TYPES[(i + m) % 5]);
    const { sc, hits } = match(st, v, trust, rnd);
    const mx = Math.max(...sc);
    let win = sc.map((x, i) => (x === mx ? i : -1)).filter((i) => i >= 0);
    const mh = Math.max(...win.map((i) => hits[i]));
    win = win.filter((i) => hits[i] === mh);
    if (win.length > 1) ties++;
    st.forEach((t, i) => {
      res[t].g++;
      if (win.includes(i)) res[t].w += 1 / win.length;
    });
  }
  const pct = (t) => Math.round((100 * res[t].w) / res[t].g);
  return {
    tie: ((100 * ties) / M).toFixed(1),
    ...Object.fromEntries(TYPES.map((t) => [t, pct(t)])),
  };
}
const base = { claimFrom: 1, bluffCap: (n) => (n >= 5 ? 2 : 1), honest: () => 1, silent: () => 0 };
const VARIANTS = {
  v1: base,
  "2p-noBluff": { ...base, bluffCap: (n) => (n === 2 ? 0 : n >= 5 ? 2 : 1) },
  "2p-noBluff+noHonest": {
    ...base,
    bluffCap: (n) => (n === 2 ? 0 : n >= 5 ? 2 : 1),
    honest: (n) => (n === 2 ? 0 : 1),
  },
  claimFrom2: { ...base, claimFrom: 2 },
  "silentBonus5+": { ...base, silent: (n) => (n >= 5 ? 1 : 0) }, // rejected: over-rewards wager-2
  proposed: {
    ...base,
    bluffCap: (n) => (n === 2 ? 0 : n >= 5 ? 2 : 1),
    honest: (n) => (n === 2 ? 0 : 1),
  },
};
const TRUST = [0.25, 0.1, 0, -0.15];
if (!process.argv.includes("--h2h"))
  for (const [name, v] of Object.entries(VARIANTS)) {
    console.log(`\n## ${name}`);
    for (const n of [2, 3, 4, 5, 6, 8])
      for (const t of TRUST) {
        const r = run(v, n, t);
        console.log(`n=${n} trust=${t} tie=${r.tie} ` + TYPES.map((k) => `${k}=${r[k]}`).join(" "));
      }
  }
// 2-player head-to-head (seats alternate) — removes the pairing bias of the mixed table above.
function h2h(v, a, b, trust, seed = 777) {
  const rnd = rng(seed);
  let w = 0;
  for (let m = 0; m < M; m++) {
    const st = m % 2 ? [a, b] : [b, a];
    const ia = m % 2 ? 0 : 1;
    const { sc, hits } = match(st, v, trust, rnd);
    const d = sc[ia] - sc[1 - ia] || hits[ia] - hits[1 - ia];
    w += d > 0 ? 1 : d === 0 ? 0.5 : 0;
  }
  return Math.round((100 * w) / M);
}
console.log("\n## 2p head-to-head (win % of first vs second)");
for (const name of ["v1", "2p-noBluff", "proposed"])
  for (const t of TRUST)
    console.log(
      `${name} trust=${t} ` +
        ["B:S", "H:S", "B:H", "W:S", "S:R"]
          .map((p) => `${p}=${h2h(VARIANTS[name], p[0], p[2], t)}`)
          .join(" "),
    );
