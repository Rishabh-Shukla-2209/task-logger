export function getDefaultDateRange() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  
  return { start, end };
}
