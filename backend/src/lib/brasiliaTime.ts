export const BRASILIA_TIME_ZONE = 'America/Sao_Paulo';

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getDatePartsInTimeZone(date, timeZone);
  const utcTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );
  return utcTimestamp - date.getTime();
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseIsoDateTimeWithoutZone(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || '0'),
  };
}

function zonedDateTimeToUtc(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}): Date {
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, 0));
  const offset = getTimeZoneOffsetMs(utcGuess, BRASILIA_TIME_ZONE);
  return new Date(utcGuess.getTime() - offset);
}

export function getBrasiliaNow(): Date {
  return zonedDateTimeToUtc(getDatePartsInTimeZone(new Date(), BRASILIA_TIME_ZONE));
}

export function getBrasiliaTodayISO(): string {
  const parts = getDatePartsInTimeZone(new Date(), BRASILIA_TIME_ZONE);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function getBrasiliaYear(): number {
  return getDatePartsInTimeZone(new Date(), BRASILIA_TIME_ZONE).year;
}

export function toBrasiliaISODate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = getDatePartsInTimeZone(date, BRASILIA_TIME_ZONE);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function parseBrasiliaInput(value: string, fallbackTime = '12:00:00'): Date {
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }

  const dateOnly = parseIsoDate(value);
  if (dateOnly) {
    const [hour = '12', minute = '00', second = '00'] = fallbackTime.split(':');
    return zonedDateTimeToUtc({
      ...dateOnly,
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second),
    });
  }

  const localDateTime = parseIsoDateTimeWithoutZone(value);
  if (localDateTime) {
    return zonedDateTimeToUtc(localDateTime);
  }

  return new Date(value);
}

export function startOfBrasiliaDay(value: string | Date): Date {
  const isoDate = typeof value === 'string' ? (parseIsoDate(value) ? value : toBrasiliaISODate(value)) : toBrasiliaISODate(value);
  return parseBrasiliaInput(isoDate, '00:00:00');
}

export function endOfBrasiliaDay(value: string | Date): Date {
  const isoDate = typeof value === 'string' ? (parseIsoDate(value) ? value : toBrasiliaISODate(value)) : toBrasiliaISODate(value);
  return parseBrasiliaInput(isoDate, '23:59:59');
}

export function getBrasiliaMonthBounds(reference = new Date()): { start: Date; end: Date } {
  const parts = getDatePartsInTimeZone(reference, BRASILIA_TIME_ZONE);
  const start = zonedDateTimeToUtc({ year: parts.year, month: parts.month, day: 1, hour: 0, minute: 0, second: 0 });
  const nextMonth = parts.month === 12
    ? { year: parts.year + 1, month: 1 }
    : { year: parts.year, month: parts.month + 1 };
  const firstDayNextMonth = zonedDateTimeToUtc({ year: nextMonth.year, month: nextMonth.month, day: 1, hour: 0, minute: 0, second: 0 });
  const end = new Date(firstDayNextMonth.getTime() - 1);
  return { start, end };
}

export function formatDateTimeInBrasilia(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}