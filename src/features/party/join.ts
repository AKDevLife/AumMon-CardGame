/** Join codes: 8 chars from the server alphabet; spaces / dashes / lower case are tolerated. */
export const normalizeJoinCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const joinLink = (code: string, origin = window.location.origin) => `${origin}/join/${code}`;
