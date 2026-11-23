/** Running tables have their own leave flow and settings. */
export const isTablePath = (pathname: string): boolean =>
  pathname.startsWith("/game/") || /^\/games\/[^/]+\/match\//.test(pathname);
