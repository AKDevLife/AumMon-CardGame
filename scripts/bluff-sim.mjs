// BLUFF scoring Monte Carlo (seeded). Strategies: R=random, S=smart, B=smart+bluffer, W=smart max-wager, H=smart honest-claim.
let s = 12345;
const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (w) => {
  let t = w.reduce((a, b) => a + b),
    r = rnd() * t;
  for (let i = 0; i < w.length; i++) {
    if ((r -= w[i]) < 0) return i;
  }
  return w.length - 1;
};
function match(strats) {
  const n = strats.length,
    sc = Array(n).fill(0);
  for (let r = 1; r <= 5; r++) {
    const mult = r === 5 ? 2 : 1;
    const pop = [0, 0, 0, 0].map(() => 0.3 + rnd() * 2);
    const ans = strats.map((st) => (st === "R" ? Math.floor(rnd() * 4) : pick(pop)));
    const claim = strats.map((st, i) =>
      st === "B" ? (ans[i] + 1 + Math.floor(rnd() * 3)) % 4 : st === "H" ? ans[i] : null,
    );
    const claimCnt = [0, 0, 0, 0];
    claim.forEach((c) => c !== null && claimCnt[c]++);
    const pred = strats.map((st, i) => {
      if (st === "R") return Math.floor(rnd() * 4);
      let est = pop.map(
        (p) => p * (0.6 + rnd() * 0.8) + claimCnt.map((x) => x)[pop.indexOf(p)] * 0.25,
      );
      if (n === 2) {
        est = pop.map((p, k) => p * (0.6 + rnd() * 0.8) + (claim[1 - i] === k ? 0.4 : 0));
      }
      return est.indexOf(Math.max(...est));
    });
    const wag = strats.map((st) =>
      st === "W" ? 2 : st === "R" ? Math.floor(rnd() * 3) : rnd() < 0.5 ? 1 : 0,
    );
    const votes = [0, 0, 0, 0];
    ans.forEach((a) => votes[a]++);
    for (let i = 0; i < n; i++) {
      let top;
      if (n === 2) {
        top = [ans[1 - i]];
      } else {
        const v = votes.slice();
        v[ans[i]]--;
        const m = Math.max(...v);
        top = [0, 1, 2, 3].filter((k) => v[k] === m);
      }
      let p = top.includes(pred[i]) ? 2 + wag[i] : -wag[i];
      if (n >= 3 && votes[ans[i]] === Math.max(...votes)) p += 1;
      if (claim[i] !== null && claim[i] !== ans[i]) {
        let f = 0;
        for (let j = 0; j < n; j++)
          if (j !== i && pred[j] === claim[i]) {
            const v = votes.slice();
            if (n > 2) v[ans[j]]--;
            const m = Math.max(...v);
            if (n === 2 ? ans[i] !== claim[i] : v[claim[i]] < m) f++;
          }
        p += Math.min(f, n >= 5 ? 2 : 1);
      }
      if (claim[i] !== null && claim[i] === ans[i]) {
        let ok = 0;
        for (let j = 0; j < n; j++) if (j !== i && pred[j] === claim[i]) ok = 1;
        p += ok;
      }
      sc[i] += p * mult;
    }
  }
  return sc;
}
for (const n of [2, 3, 4, 5, 8]) {
  const types = ["R", "S", "B", "W", "H"];
  const res = {};
  types.forEach((t) => (res[t] = { w: 0, g: 0, sum: 0 }));
  let ties = 0;
  const M = 20000;
  for (let m = 0; m < M; m++) {
    const st = Array.from({ length: n }, (_, i) => types[(i + m) % 5]);
    const sc = match(st);
    const mx = Math.max(...sc);
    if (sc.filter((x) => x === mx).length > 1) ties++;
    st.forEach((t, i) => {
      res[t].g++;
      res[t].sum += sc[i];
      if (sc[i] === mx) res[t].w++;
    });
  }
  console.log(
    `n=${n} tie%=${((100 * ties) / M).toFixed(1)} ` +
      types
        .map(
          (t) =>
            `${t}:win ${((100 * res[t].w) / res[t].g).toFixed(0)}% avg ${(res[t].sum / res[t].g).toFixed(1)}`,
        )
        .join(" | "),
  );
}
