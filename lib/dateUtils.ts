/**
 * Funções utilitárias para manipulação de datas
 * Focado em geração de calendários para agenda
 */

export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";
export const BUSINESS_START_MINUTES = 8 * 60; // 08:00
export const BUSINESS_END_MINUTES = 18 * 60; // 18:00
export const LUNCH_START_MINUTES = 12 * 60; // 12:00
export const LUNCH_END_MINUTES = 13 * 60 + 30; // 13:30

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

export function getBrasiliaNow(): Date {
  const now = new Date();
  const parts = getDatePartsInTimeZone(now, BRASILIA_TIME_ZONE);
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

export function getBrasiliaYear(): number {
  return getDatePartsInTimeZone(new Date(), BRASILIA_TIME_ZONE).year;
}

export function getBrasiliaTodayISO(): string {
  const now = new Date();
  const parts = getDatePartsInTimeZone(now, BRASILIA_TIME_ZONE);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function toDdMmFromISODate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return "";
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
}

export function toDdMmYyyyFromISODate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return "";
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

export function toISODateFromDdMm(data: string, year?: number): string {
  const [day, month] = data.split("/");
  if (!day || !month) return "";
  const safeYear = year ?? getBrasiliaYear();
  return `${safeYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function isSundayISODate(isoDate: string): boolean {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0;
}

export function isPastBrasiliaISODate(isoDate: string): boolean {
  if (!isoDate) return false;
  return isoDate < getBrasiliaTodayISO();
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

export function isWithinBusinessHours(time: string, durationMinutes: number): boolean {
  const start = timeToMinutes(time);
  if (start < 0 || durationMinutes <= 0) return false;

  const end = start + durationMinutes;

  if (start < BUSINESS_START_MINUTES || end > BUSINESS_END_MINUTES) {
    return false;
  }

  const overlapLunch = start < LUNCH_END_MINUTES && end > LUNCH_START_MINUTES;
  if (overlapLunch) {
    return false;
  }

  return true;
}

export function getBusinessTimeOptions(durationMinutes: number, stepMinutes = 15): Array<{ value: string; label: string }> {
  if (durationMinutes <= 0 || stepMinutes <= 0) return [];

  const options: Array<{ value: string; label: string }> = [];

  for (let start = BUSINESS_START_MINUTES; start <= BUSINESS_END_MINUTES; start += stepMinutes) {
    const hours = Math.floor(start / 60);
    const minutes = start % 60;
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    if (isWithinBusinessHours(time, durationMinutes)) {
      options.push({ value: time, label: time });
    }
  }

  return options;
}

/**
 * Gera um array com os próximos 7 dias válidos (excluindo domingos)
 * Começa a partir do dia atual
 * 
 * @returns Array de objetos com: date (Date), nameDay (string), formatted (dd/mm)
 */
export function getNext7ValidDays() {
  const days = [];
  let currentDate = getBrasiliaNow();
  
  // Array de nomes dos dias em português
  const dayNames = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  // Precisamos de 7 dias válidos (sem domingo)
  while (days.length < 7) {
    const dayOfWeek = currentDate.getDay();

    // Pular domingo (0)
    if (dayOfWeek !== 0) {
      days.push({
        date: new Date(currentDate), // Cópia da data
        nameDay: dayNames[dayOfWeek],
        formatted: formatDate(currentDate),
        dayOfWeek: dayOfWeek,
      });
    }

    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

/**
 * Formata uma data no padrão dd/mm
 * @param date Data a ser formatada
 * @returns String no formato dd/mm
 */
export function formatDate(date: Date): string {
  const parts = getDatePartsInTimeZone(date, BRASILIA_TIME_ZONE);
  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  return `${day}/${month}`;
}

/**
 * Formata uma data com hora no padrão HH:mm
 * @param dateString String de data (ISO ou outro formato)
 * @returns String no formato HH:mm
 */
export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const parts = getDatePartsInTimeZone(date, BRASILIA_TIME_ZONE);
    const hours = String(parts.hour).padStart(2, "0");
    const minutes = String(parts.minute).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

/**
 * Verifica se uma data é igual a outra (mesma data, ignorando horário)
 * @param date1 Primeira data
 * @param date2 Segunda data
 * @returns boolean
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const a = getDatePartsInTimeZone(date1, BRASILIA_TIME_ZONE);
  const b = getDatePartsInTimeZone(date2, BRASILIA_TIME_ZONE);
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day
  );
}

/**
 * Obtém o nome do dia da semana
 * @param dayOfWeek Número do dia (0-6)
 * @returns String do nome do dia
 */
export function getDayName(dayOfWeek: number): string {
  const dayNames = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  return dayNames[dayOfWeek];
}
