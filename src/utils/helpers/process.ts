export function sleep(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() < startTime + ms);
}
