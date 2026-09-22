// What's left here is genuinely still needed as static reference data (not
// mocked domain data — that all comes from Supabase now via the api/*
// modules and the Workouts/Diet contexts).

export const weekDays = [
  { code: 'S', label: 'S', date: 14 },
  { code: 'T', label: 'T', date: 15 },
  { code: 'Q', label: 'Q', date: 16 },
  { code: 'Q2', label: 'Q', date: 17 },
  { code: 'S2', label: 'S', date: 18 },
  { code: 'S3', label: 'S', date: 19 },
  { code: 'D', label: 'D', date: 20 },
]

// Maps JS Date#getDay() (0 = Sunday) to the single-letter weekday codes used
// by the diet feature (S=Segunda, T=Terça, Q=Quarta, Q2=Quinta, S2=Sexta,
// S3=Sábado, D=Domingo) — same scheme as `weekDays` above.
const WEEKDAY_CODES_BY_JS_DAY = ['D', 'S', 'T', 'Q', 'Q2', 'S2', 'S3']

export function getTodayWeekdayCode() {
  return WEEKDAY_CODES_BY_JS_DAY[new Date().getDay()]
}
