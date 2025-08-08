export function isSameResetPeriod(lastDate, nowDate, resetHour = 0, timezone = 'utc') {
  if (!(lastDate instanceof Date) || !(nowDate instanceof Date)) return false;
  const hour = Number.isFinite(resetHour) ? resetHour : 0;
  const useUTC = timezone === 'utc';

  const periodStart = (d) => {
    const year = useUTC ? d.getUTCFullYear() : d.getFullYear();
    const month = useUTC ? d.getUTCMonth() : d.getMonth();
    const date = useUTC ? d.getUTCDate() : d.getDate();
    let ms = useUTC
      ? Date.UTC(year, month, date, hour)
      : new Date(year, month, date, hour).getTime();
    const hours = useUTC ? d.getUTCHours() : d.getHours();
    if (hours < hour) ms -= 86400000;
    return ms;
  };

  return periodStart(lastDate) === periodStart(nowDate);
}

export default { isSameResetPeriod };
