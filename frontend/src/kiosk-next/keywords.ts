// 손님이 메뉴 갈래("짜장면")를 말하면 긴 질문을 거치지 않고 해당 메뉴를 카드로 바로 보여 줍니다.
// 어르신이 긴 글을 읽지 않아도 눌러서 고를 수 있게 하려는 것입니다 (2026-11-05 피드백).
// 빼 달라는 말이 있는 문장은 여기서 다루지 않고 서버 대화로 넘깁니다. 재료 확인은 서버 검사가 맡습니다.
import { matchMenus, stripNegated } from '../prototype/parse';

const FAMILIES: { label: string; said: RegExp; has: RegExp }[] = [
  { label: '짜장면', said: /짜장/, has: /짜장/ },
  { label: '짬뽕', said: /짬뽕/, has: /짬뽕/ },
  { label: '탕수육', said: /탕수육/, has: /탕수육/ },
  { label: '탕면', said: /탕면/, has: /탕면/ },
  { label: '볶음면', said: /볶음면|차우면/, has: /차우면/ },
  { label: '볶음밥', said: /볶음밥/, has: /볶음밥/ },
  { label: '덮밥', said: /덮밥/, has: /덮밥/ },
  { label: '교자', said: /교자/, has: /교자/ },
  { label: '소룡포', said: /소룡포|소롱포|샤오롱바오/, has: /소룡포/ },
  { label: '쇼마이', said: /쇼마이|소마이|샤오마이/, has: /쇼마이/ },
  { label: '베이징덕', said: /베이징덕|북경오리/, has: /베이징덕/ },
  { label: '동파육', said: /동파육/, has: /동파육/ },
  { label: '깐풍', said: /깐풍/, has: /깐풍/ },
  { label: '칠리새우', said: /칠리/, has: /칠리/ },
  { label: '스프', said: /스프|수프/, has: /스프/ },
];

const COUNT_WORD = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const countWord = (n: number) => COUNT_WORD[n] ?? String(n);
const norm = (s: string) => s.replace(/\s/g, '');
/** 받침이 있으면 '은', 없으면 '는' */
const topic = (word: string) => { const code = word.charCodeAt(word.length - 1) - 0xac00; return word + (code >= 0 && code % 28 ? '은' : '는'); };

type Named = { name: string; aliases?: string[] };

export function menusForKeyword<T extends Named>(text: string, menus: readonly T[]): { menus: T[]; line: string } | null {
  if (stripNegated(text) !== text) return null;
  // 정확한 이름("해물 짬뽕")을 말했으면 그 메뉴만 보이도록, 이름을 지운 나머지에서 갈래를 찾습니다.
  const exact = matchMenus(text, [...menus]);
  let rest = norm(text);
  for (const m of exact) for (const name of [m.name, ...(m.aliases ?? [])]) rest = rest.replace(norm(name), ' ');
  const families = FAMILIES.filter(f => f.said.test(rest));
  const found = menus.filter(m => exact.includes(m) || families.some(f => f.has.test(m.name)));
  if (!found.length) return null;
  const line = found.length === 1 ? `${found[0].name} 여기 있어요.`
    : families.length === 1 && !exact.length ? `${topic(families[0].label)} ${countWord(found.length)} 가지 있어요.`
    : `말씀하신 메뉴 ${countWord(found.length)} 가지 있어요.`;
  return { menus: found, line };
}

const ORDINALS: [RegExp, number][] = [[/첫\s*번째|첫째|1번/, 0], [/두\s*번째|둘째|2번/, 1], [/세\s*번째|셋째|3번/, 2], [/네\s*번째|넷째|4번/, 3]];

/** 카드가 떠 있을 때 손님 말로 고르기: "두 번째", "유니짜장", "간짜장으로". 하나로 정해지지 않으면 null */
export function menuFromSpeech<T extends Named>(text: string, menus: readonly T[]): T | null {
  for (const [re, i] of ORDINALS) if (re.test(text)) return menus[i] ?? null;
  const said = norm(text);
  const exact = matchMenus(text, [...menus]);
  if (exact.length === 1) return exact[0];
  const shared = (word: string) => menus.filter(m => m.name.includes(word)).length > 1;
  const hits = menus.filter(m => m.name.split(/\s+/).some(word => word.length >= 2 && !shared(word) && said.includes(norm(word))));
  return hits.length === 1 ? hits[0] : null;
}
