/**
 * Time-based greeting messages for LinkerRu.
 *
 * Greetings are selected based on the current hour and day of the week.
 * - Morning (1–10), Afternoon (11–20), Evening & Night (21–30): deterministic,
 *   picked by hour so the same hour always gives the same greeting.
 * - Days & General Time (31–40): random selection from the pool.
 * - Holidays & Occasions (41–50): checked by date (month + day).
 */

export interface GreetingCategory {
  id: string;
  /** Russian greeting template — {name} is replaced with the nickname */
  ru: string[];
  /** English greeting template — {name} is replaced with the nickname */
  en: string[];
}

/* ── Morning (hours 5–10) ── */
const morning: GreetingCategory = {
  id: 'morning',
  ru: [
    'Доброе утро, {name}!',
    'С добрым утром, {name}!',
    'Просыпайся, {name}!',
    'Время вставать, {name}!',
    'Ранний старт, {name}?',
    'Светлое утро, {name}!',
    'Время для кофе, {name}?',
    'Готов побеждать, {name}?',
    'Начинаем день, {name}!',
    'Утренний настрой, {name}!',
  ],
  en: [
    'Good morning, {name}!',
    'Morning, {name}!',
    'Rise & shine, {name}!',
    'Up & at \'em, {name}!',
    'Early start, {name}?',
    'Bright & early, {name}!',
    'Coffee time, {name}?',
    'Ready to win, {name}?',
    'Daily start, {name}!',
    'A.M. hustle, {name}!',
  ],
};

/* ── Afternoon (hours 11–16) ── */
const afternoon: GreetingCategory = {
  id: 'afternoon',
  ru: [
    'Добрый день, {name}!',
    'День добрый, {name}!',
    'Половина пути пройдена, {name}!',
    'Время обеда, {name}?',
    'Дневная проверка, {name}!',
    'Продолжаем, {name}!',
    'Послеобеденный режим, {name}!',
    'Вечерний рывок, {name}!',
    'Привет, {name}!',
    'Всё ещё в деле, {name}?',
  ],
  en: [
    'Good afternoon, {name}!',
    'Afternoon, {name}!',
    'Halfway there, {name}!',
    'Lunch time, {name}?',
    'Midday check, {name}!',
    'Keep going, {name}!',
    'Post-lunch mode, {name}!',
    'P.M. push, {name}!',
    'Hey, {name}!',
    'Still grinding, {name}?',
  ],
};

/* ── Evening (hours 17–22) ── */
const evening: GreetingCategory = {
  id: 'evening',
  ru: [
    'Добрый вечер, {name}!',
    'Вечер добрый, {name}!',
    'Спокойной ночи, {name}!',
    'Доброй ночи, {name}!',
    'Завершаем день, {name}?',
    'Поздний вечер, {name}?',
    'Время отдыха, {name}!',
    'Сладких снов, {name}!',
    'Пора выходить, {name}?',
    'Свет выключен, {name}!',
  ],
  en: [
    'Good evening, {name}!',
    'Evening, {name}!',
    'Goodnight, {name}!',
    'Night, {name}!',
    'Winding down, {name}?',
    'Late night, {name}?',
    'Rest up, {name}!',
    'Sweet dreams, {name}!',
    'Time to log off, {name}?',
    'Lights out, {name}!',
  ],
};

/* ── Night (hours 23–4) ── */
const night: GreetingCategory = {
  id: 'night',
  ru: [
    'Доброй ночи, {name}!',
    'Поздняя ночь, {name}!',
    'Время сна, {name}!',
    'Сладких снов, {name}!',
    'Отдыхай, {name}!',
    'Тихая ночь, {name}!',
    'Ложись спать, {name}?',
    'Глубокая ночь, {name}!',
    'Почти утро, {name}!',
    'Не спится, {name}?',
  ],
  en: [
    'Goodnight, {name}!',
    'Late night, {name}!',
    'Bedtime, {name}!',
    'Sweet dreams, {name}!',
    'Rest up, {name}!',
    'Quiet night, {name}!',
    'Time to sleep, {name}?',
    'Deep night, {name}!',
    'Almost morning, {name}!',
    'Can\'t sleep, {name}?',
  ],
};

/* ── Days & General Time (random selection) ── */
const daysGeneral: GreetingCategory = {
  id: 'days',
  ru: [
    'Счастливого понедельника, {name}!',
    'Вторничный фокус, {name}!',
    'Середина недели, {name}!',
    'Четверговый ритм, {name}!',
    'Счастливой пятницы, {name}!',
    'С возвращением, {name}!',
    'Рад тебя видеть, {name}!',
    'Снова за дело, {name}!',
    'Цели на сегодня, {name}?',
    'Погнали, {name}!',
  ],
  en: [
    'Happy Monday, {name}!',
    'Tuesday focus, {name}!',
    'Midweek push, {name}!',
    'Thursday stride, {name}!',
    'Happy Friday, {name}!',
    'Welcome back, {name}!',
    'Great to see you, {name}!',
    'Back at it, {name}!',
    'Today\'s goals, {name}?',
    'Let\'s do this, {name}!',
  ],
};

/* ── Holidays & Occasions (checked by date) ── */
interface Holiday {
  month: number; // 1-12
  day: number;   // 1-31
  ru: string;
  en: string;
}

const holidays: Holiday[] = [
  { month: 1, day: 1, ru: 'С Новым годом, {name}!', en: 'Happy New Year, {name}!' },
  { month: 12, day: 25, ru: 'С Рождеством, {name}!', en: 'Merry Christmas, {name}!' },
  { month: 12, day: 31, ru: 'С наступающим, {name}!', en: 'Happy New Year\'s Eve, {name}!' },
  { month: 10, day: 31, ru: 'Жуткого Хэллоуина, {name}!', en: 'Spooky Halloween, {name}!' },
  { month: 11, day: 27, ru: 'С Днём благодарения, {name}!', en: 'Happy Thanksgiving, {name}!' },
  { month: 4, day: 20, ru: 'Счастливой Пасхи, {name}!', en: 'Happy Easter, {name}!' },
  { month: 7, day: 4, ru: 'С Днём независимости, {name}!', en: 'Happy 4th of July, {name}!' },
  { month: 12, day: 24, ru: 'Сочельник, {name}!', en: 'Christmas Eve, {name}!' },
];

/**
 * Get a greeting for the current time/day.
 *
 * Priority:
 * 1. Holiday match (by exact month/day)
 * 2. Day-of-week greeting (random from daysGeneral pool, 30% chance)
 * 3. Time-of-day greeting (deterministic by hour)
 *
 * @param nickname - the user's nickname (or fallback)
 * @param lang - 'ru' or 'en'
 * @param date - optional Date override for testing
 */
export function getGreeting(
  nickname: string,
  lang: 'ru' | 'en',
  date: Date = new Date(),
): string {
  const name = nickname || (lang === 'ru' ? 'друг' : 'friend');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // 1. Check holidays first
  const holiday = holidays.find((h) => h.month === month && h.day === day);
  if (holiday) {
    return holiday[lang].replace('{name}', name);
  }

  // 2. 25% chance to show a day-of-week greeting (random from pool)
  //    Only on weekdays (Mon-Fri) to make it feel special
  if (dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() < 0.25) {
    const pool = daysGeneral[lang];
    // Pick the day-specific one if it's a weekday (Mon=0, Fri=4 in our array)
    const dayIndex = dayOfWeek - 1; // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4
    // 50% chance: use the day-specific greeting, 50%: random from the general pool
    if (Math.random() < 0.5) {
      return pool[dayIndex].replace('{name}', name);
    }
    return pool[Math.floor(Math.random() * pool.length)].replace('{name}', name);
  }

  // 3. Time-of-day greeting (deterministic by hour)
  let category: GreetingCategory;
  let indexInCategory: number;

  if (hour >= 5 && hour <= 10) {
    category = morning;
    indexInCategory = hour - 5; // 5→0, 6→1, ..., 10→5
  } else if (hour >= 11 && hour <= 16) {
    category = afternoon;
    indexInCategory = hour - 11; // 11→0, ..., 16→5
  } else if (hour >= 17 && hour <= 22) {
    category = evening;
    indexInCategory = hour - 17; // 17→0, ..., 22→5
  } else {
    // 23-4: night
    category = night;
    indexInCategory = hour >= 23 ? hour - 23 : hour + 1; // 23→0, 0→1, 1→2, ..., 4→5
  }

  // Map the 6-hour range to the 10-message pool by cycling
  // (each message gets ~1.67 hours, so we use a sub-hour rotation)
  const subHour = date.getMinutes() < 30 ? 0 : 1;
  const poolIndex = (indexInCategory * 2 + subHour) % category[lang].length;

  return category[lang][poolIndex].replace('{name}', name);
}
