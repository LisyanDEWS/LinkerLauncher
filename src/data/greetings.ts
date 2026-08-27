/**
 * Time-based greeting messages for LinkerRu.
 *
 * Greetings are selected based on the current hour and day of the week.
 * All greetings are warm, clear, friendly, and easy to understand.
 */

import { Language } from '../types';

export interface GreetingCategory {
  id: string;
  /** Russian greeting template — {name} is replaced with the nickname */
  ru: string[];
  /** English greeting template — {name} is replaced with the nickname */
  en: string[];
  /** Ukrainian greeting template — {name} is replaced with the nickname */
  uk: string[];
}

/* ── Morning (hours 5–10) ── */
const morning: GreetingCategory = {
  id: 'morning',
  ru: [
    'Доброе утро, {name}!',
    'С добрым утром, {name}!',
    'Как настроение этим утром, {name}?',
    'Отличного начала дня, {name}!',
    'Желаем прекрасного утра, {name}!',
    'Пусть утро будет добрым, {name}!',
    'Время для кофе или чая, {name}?',
    'Удачного дня, {name}!',
    'Пусть всё получится сегодня, {name}!',
    'Прекрасное утро, {name}!',
  ],
  en: [
    'Good morning, {name}!',
    'Morning, {name}!',
    'How are you feeling this morning, {name}?',
    'Great start to your day, {name}!',
    'Wishing you a bright morning, {name}!',
    'Hope your morning goes well, {name}!',
    'Time for some coffee, {name}?',
    'Have a fantastic day ahead, {name}!',
    'Ready for a great day, {name}?',
    'Beautiful morning, {name}!',
  ],
  uk: [
    'Доброго ранку, {name}!',
    'З добрим ранком, {name}!',
    'Як настрій цього ранку, {name}?',
    'Чудового початку дня, {name}!',
    'Бажаємо прекрасного ранку, {name}!',
    'Нехай ранок буде добрим, {name}!',
    'Час для кави чи чаю, {name}?',
    'Вдалого дня, {name}!',
    'Нехай усе вдасться сьогодні, {name}!',
    'Прекрасний ранок, {name}!',
  ],
};

/* ── Afternoon (hours 11–16) ── */
const afternoon: GreetingCategory = {
  id: 'afternoon',
  ru: [
    'Добрый день, {name}!',
    'Хорошего дня, {name}!',
    'Как настроение этим днём, {name}?',
    'Приятного обеда, {name}!',
    'Как проходит твой день, {name}?',
    'Удачного продолжения дня, {name}!',
    'Отличного дня и хорошего настроения, {name}!',
    'Пусть день принесёт радость, {name}!',
    'Привет, {name}! Как успехи?',
    'Желаем продуктивного дня, {name}!',
  ],
  en: [
    'Good afternoon, {name}!',
    'Have a great afternoon, {name}!',
    'How are you feeling this afternoon, {name}?',
    'Enjoy your lunch, {name}?',
    'How is your day going, {name}?',
    'Wishing you a productive day, {name}!',
    'Hope everything is going smoothly, {name}!',
    'Have a bright and pleasant day, {name}!',
    'Hey {name}, how are things?',
    'Keep up the great work, {name}!',
  ],
  uk: [
    'Доброго дня, {name}!',
    'Гарного дня, {name}!',
    'Як настрій цього дня, {name}?',
    'Смачного обіду, {name}!',
    'Як минає твій день, {name}?',
    'Вдалого продовження дня, {name}!',
    'Чудового дня та гарного настрою, {name}!',
    'Нехай день принесе радість, {name}!',
    'Привіт, {name}! Як справи?',
    'Бажаємо продуктивного дня, {name}!',
  ],
};

/* ── Evening (hours 17–22) ── */
const evening: GreetingCategory = {
  id: 'evening',
  ru: [
    'Добрый вечер, {name}!',
    'Как прошёл твой день, {name}?',
    'Приятного и уютного вечера, {name}!',
    'Отличного вечера, {name}!',
    'Время отдохнуть и расслабиться, {name}!',
    'Надеемся, день был хорошим, {name}!',
    'Уютного вечера, {name}!',
    'Как настроение этим вечером, {name}?',
    'Хорошего отдыха после рабочего дня, {name}!',
    'Прекрасного вечера, {name}!',
  ],
  en: [
    'Good evening, {name}!',
    'How was your day, {name}?',
    'Have a pleasant evening, {name}!',
    'Hope you had a wonderful day, {name}!',
    'Time to relax and unwind, {name}!',
    'Cozy evening to you, {name}!',
    'How are you doing this evening, {name}?',
    'Rest up and enjoy your evening, {name}!',
    'Wishing you a peaceful evening, {name}!',
    'Hope you accomplished everything today, {name}!',
  ],
  uk: [
    'Доброго вечора, {name}!',
    'Як минув твій день, {name}?',
    'Приємного та затишного вечора, {name}!',
    'Чудового вечора, {name}!',
    'Час відпочити та розслабитися, {name}!',
    'Сподіваємося, день був вдалим, {name}!',
    'Затишного вечора, {name}!',
    'Як настрій цього вечора, {name}?',
    'Гарного відпочинку після робочого дня, {name}!',
    'Прекрасного вечора, {name}!',
  ],
};

/* ── Night (hours 23–4) ── */
const night: GreetingCategory = {
  id: 'night',
  ru: [
    'Доброй ночи, {name}!',
    'Приятных снов, {name}!',
    'Как настроение этой ночью, {name}?',
    'Сладких снов, {name}!',
    'Спокойной ночи, {name}!',
    'Тихой и спокойной ночи, {name}!',
    'Набирайся сил перед новым днём, {name}!',
    'Добрых снов, {name}!',
    'Не забудь хорошо выспаться, {name}!',
    'Уютной ночи, {name}!',
  ],
  en: [
    'Good night, {name}!',
    'Sweet dreams, {name}!',
    'How are you doing tonight, {name}?',
    'Have a peaceful night, {name}!',
    'Rest well, {name}!',
    'Wishing you a quiet night, {name}!',
    'Get a good night\'s sleep, {name}!',
    'Cozy night to you, {name}!',
    'Sleep well, {name}!',
    'Nighty night, {name}!',
  ],
  uk: [
    'Доброї ночі, {name}!',
    'Приємних снів, {name}!',
    'Як настрій цієї ночі, {name}?',
    'Солодких снів, {name}!',
    'Спокійної ночі, {name}!',
    'Тихої та спокійної ночі, {name}!',
    'Набирайся сил перед новим днем, {name}!',
    'Добрих снів, {name}!',
    'Не забудь добре виспатися, {name}!',
    'Затишної ночі, {name}!',
  ],
};

/* ── Days & General Time (random selection) ── */
const daysGeneral: GreetingCategory = {
  id: 'days',
  ru: [
    'Отличного понедельника, {name}!',
    'Удачного вторника, {name}!',
    'Хорошей среды, {name}!',
    'Отличного четверга, {name}!',
    'Прекрасной пятницы, {name}!',
    'С возвращением, {name}!',
    'Рады тебя видеть, {name}!',
    'Снова вместе, {name}!',
    'Как успехи сегодня, {name}?',
    'Желаем отличных результатов, {name}!',
  ],
  en: [
    'Have a great Monday, {name}!',
    'Happy Tuesday, {name}!',
    'Wonderful Wednesday, {name}!',
    'Terrific Thursday, {name}!',
    'Happy Friday, {name}!',
    'Welcome back, {name}!',
    'Great to see you, {name}!',
    'Glad you are here, {name}!',
    'How are your goals coming along, {name}?',
    'Wishing you a wonderful time, {name}!',
  ],
  uk: [
    'Чудового понеділка, {name}!',
    'Вдалого вівторка, {name}!',
    'Гарної середи, {name}!',
    'Чудового четверга, {name}!',
    'Прекрасної п\'ятниці, {name}!',
    'З поверненням, {name}!',
    'Раді тебе бачити, {name}!',
    'Знову разом, {name}!',
    'Як успіхи сьогодні, {name}?',
    'Бажаємо відмінних результатів, {name}!',
  ],
};

/* ── Holidays & Occasions (checked by date) ── */
interface Holiday {
  month: number; // 1-12
  day: number;   // 1-31
  ru: string;
  en: string;
  uk: string;
}

const holidays: Holiday[] = [
  { month: 1, day: 1, ru: 'С Новым годом, {name}!', en: 'Happy New Year, {name}!', uk: 'З Новим роком, {name}!' },
  { month: 12, day: 25, ru: 'С Рождеством, {name}!', en: 'Merry Christmas, {name}!', uk: 'З Різдвом, {name}!' },
  { month: 12, day: 31, ru: 'С наступающим Новым годом, {name}!', en: 'Happy New Year\'s Eve, {name}!', uk: 'З прийдешнім Новим роком, {name}!' },
  { month: 10, day: 31, ru: 'Счастливого Хэллоуина, {name}!', en: 'Happy Halloween, {name}!', uk: 'Щасливого Гелловіну, {name}!' },
  { month: 11, day: 27, ru: 'С Днём благодарения, {name}!', en: 'Happy Thanksgiving, {name}!', uk: 'З Днем подяки, {name}!' },
  { month: 4, day: 20, ru: 'Счастливой Пасхи, {name}!', en: 'Happy Easter, {name}!', uk: 'Щасливого Великодня, {name}!' },
  { month: 7, day: 4, ru: 'С Днём независимости, {name}!', en: 'Happy 4th of July, {name}!', uk: 'З Днем незалежності, {name}!' },
  { month: 8, day: 24, ru: 'С Днём независимости Украины, {name}!', en: 'Happy Ukraine Independence Day, {name}!', uk: 'З Днем незалежності України, {name}!' },
  { month: 12, day: 24, ru: 'Сочельник, {name}!', en: 'Christmas Eve, {name}!', uk: 'Святвечір, {name}!' },
];

/**
 * Get a greeting for the current time/day.
 *
 * Priority:
 * 1. Holiday match (by exact month/day)
 * 2. Day-of-week greeting (random from daysGeneral pool, 25% chance)
 * 3. Time-of-day greeting (deterministic by hour)
 *
 * @param nickname - the user's nickname (or fallback)
 * @param lang - 'ru' | 'en' | 'uk'
 * @param date - optional Date override for testing
 */
export function getGreeting(
  nickname: string,
  lang: Language = 'ru',
  date: Date = new Date(),
): string {
  const currentLang = (lang in morning) ? lang : 'en';
  const name = nickname || (currentLang === 'ru' ? 'друг' : currentLang === 'uk' ? 'друже' : 'friend');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // 1. Check holidays first
  const holiday = holidays.find((h) => h.month === month && h.day === day);
  if (holiday) {
    return holiday[currentLang].replace('{name}', name);
  }

  // 2. Deterministic check for day-of-week greeting based on date seed (no Math.random)
  const dateSeed = date.getFullYear() * 10000 + month * 100 + day;
  if (dayOfWeek >= 1 && dayOfWeek <= 5 && (dateSeed % 4 === 0)) {
    const pool = daysGeneral[currentLang];
    const dayIndex = (dayOfWeek - 1) % pool.length;
    return pool[dayIndex].replace('{name}', name);
  }

  // 3. Time-of-day greeting (deterministic by hour)
  let category: GreetingCategory;
  let indexInCategory: number;

  if (hour >= 5 && hour <= 10) {
    category = morning;
    indexInCategory = hour - 5;
  } else if (hour >= 11 && hour <= 16) {
    category = afternoon;
    indexInCategory = hour - 11;
  } else if (hour >= 17 && hour <= 22) {
    category = evening;
    indexInCategory = hour - 17;
  } else {
    category = night;
    indexInCategory = hour >= 23 ? hour - 23 : hour + 1;
  }

  const subHour = date.getMinutes() < 30 ? 0 : 1;
  const poolIndex = (indexInCategory * 2 + subHour) % category[currentLang].length;

  return category[currentLang][poolIndex].replace('{name}', name);
}
