import 'dotenv/config';

export function todayStr() {
  const tz = process.env.TIMEZONE || 'Asia/Tokyo';
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}
