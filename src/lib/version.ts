export const APP_VERSION = "1.2.1";
export const BUILD_TIMESTAMP = 1792582800000; // Static reference timestamp for release 1.2.0

/**
 * Checks if a remote version is newer than current version
 */
export function isNewerVersion(remoteVersion: string, currentVersion: string = APP_VERSION): boolean {
  if (!remoteVersion || !currentVersion) return false;
  if (remoteVersion === currentVersion) return false;

  const rParts = remoteVersion.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = currentVersion.split(".").map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
    const r = rParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}
