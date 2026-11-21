import { describe, expect, it } from 'vitest';
import menuData from '../prototype/menu/menus.json';
import { menuFromSpeech, menusForKeyword } from './keywords';

const menus = menuData as { id: string; name: string; aliases?: string[] }[];
const names = (text: string) => menusForKeyword(text, menus)?.menus.map(m => m.name) ?? null;

describe('메뉴 갈래 말하기', () => {
  it('"짜장면"이면 짜장 메뉴 두 개와 짧은 안내를 줍니다', () => {
    const found = menusForKeyword('짜장면', menus)!;
    expect(found.menus.map(m => m.name)).toEqual(['원심 유니짜장', '블랙 이베리코 간짜장']);
    expect(found.line).toBe('짜장면은 두 가지 있어요.');
  });
  it('문장 속 낱말도 찾습니다', () => {
    expect(names('둘이서 짬뽕 먹으려고요')).toEqual(['깻잎 차돌 짬뽕', '해물 짬뽕']);
  });
  it('정확한 이름을 말하면 그 메뉴만 보여 줍니다', () => {
    expect(names('해물 짬뽕 주세요')).toEqual(['해물 짬뽕']);
    expect(names('유니짜장이요')).toEqual(['원심 유니짜장']);
  });
  it('두 갈래를 함께 말하면 모두 보여 줍니다', () => {
    expect(names('짜장면이랑 해물 짬뽕')).toEqual(['원심 유니짜장', '블랙 이베리코 간짜장', '해물 짬뽕']);
  });
  it('빼 달라는 문장은 카드로 보내지 않습니다', () => {
    expect(names('짜장면 말고 다른 거요')).toBeNull();
    expect(names('짬뽕은 못 먹어요')).toBeNull();
  });
  it('메뉴 갈래가 없는 말이나 종류 답은 그대로 대화로 갑니다', () => {
    for (const text of ['두 명이요', '면 요리요', '밥 요리요', '딤섬이요', '고기 요리요', '아무거나 추천해 주세요']) expect(names(text)).toBeNull();
  });
});

describe('카드가 떠 있을 때 말로 고르기', () => {
  const shown = menusForKeyword('짜장면', menus)!.menus;
  it('순서로 고릅니다', () => {
    expect(menuFromSpeech('두 번째요', shown)?.name).toBe('블랙 이베리코 간짜장');
  });
  it('이름 일부로 고릅니다', () => {
    expect(menuFromSpeech('유니짜장으로 할게요', shown)?.name).toBe('원심 유니짜장');
    expect(menuFromSpeech('간짜장 주세요', shown)?.name).toBe('블랙 이베리코 간짜장');
  });
  it('정해지지 않으면 고르지 않습니다', () => {
    expect(menuFromSpeech('짜장면이요', shown)).toBeNull();
    expect(menuFromSpeech('네 명이에요', shown)).toBeNull();
  });
});
