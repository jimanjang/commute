/**
 * Returns a Date object adjusted to Asia/Seoul timezone.
 * This ensures that regardless of the server's local time (UTC or other),
 * the output reflects Korean Standard Time.
 */
export function getKstDate(): Date {
  // Get the current time in Asia/Seoul as a string
  const seoulString = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  return new Date(seoulString);
}

/**
 * Returns the current date string in YYYY-MM-DD format (KST).
 */
export function getTodayStr(): string {
  const kst = getKstDate();
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
