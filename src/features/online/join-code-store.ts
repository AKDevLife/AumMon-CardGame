/**
 * The plaintext join code is returned once at room creation (server stores only a hash).
 * Kept per-tab for the owner to share; losing it only means creating a new room.
 */
const key = (roomId: string) => `aummon.joinCode.${roomId}`;

export function rememberJoinCode(roomId: string, code: string): void {
  try {
    sessionStorage.setItem(key(roomId), code);
  } catch {
    // storage unavailable (private mode) — code is still shown once via the lobby state
  }
}

export function recallJoinCode(roomId: string): string | null {
  try {
    return sessionStorage.getItem(key(roomId));
  } catch {
    return null;
  }
}
