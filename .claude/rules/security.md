# Security

- Never expose, log, print or commit API keys, passwords, tokens or secrets.
- Never commit `.env*` files with real values (only `.env.example`). Secret/service-role keys never use the `VITE_` prefix.
- Never bypass authentication or authorization; validate and authorize every server command.
- Never weaken RLS, grants or Realtime authorization to make tests pass.
- Never expose private game data (hands, deck order, face-down actions, RNG state, private skill state) to clients, logs or broadcasts.
- No destructive database operations without approval.
- No production data changes or production deploys without explicit authorization.
- Report any discovered vulnerability immediately, before continuing other work.
