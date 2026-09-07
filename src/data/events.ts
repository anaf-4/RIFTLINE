import type { EventDef } from '../core/types';

export const events: EventDef[] = [
  {
    id: 'abandoned_shrine',
    title: '버려진 제단', titleEn: 'Abandoned Shrine',
    text: '균열의 빛이 새어 나오는 낡은 제단이 있다. 손을 대면 무언가 반응할 것 같다.',
    textEn: 'An old shrine leaks rift-light. Touching it feels like it would provoke something.',
    choices: [
      { id: 'pray', text: '기도한다 (체력 12 회복)', textEn: 'Pray (restore 12 HP)', effects: [{ op: 'heal', value: 12 }] },
      { id: 'take', text: '제단의 파편을 가져간다 (골드 +40, 50% 확률로 저주 획득)', textEn: 'Take a shard (+40 gold, 50% chance of a curse)', effects: [], goldDelta: 40, addCurse: 'curse_rift_shard', curseChance: 0.5 },
      { id: 'leave', text: '떠난다', textEn: 'Leave', effects: [] },
    ],
  },
  {
    id: 'wandering_merchant',
    title: '떠도는 상인', titleEn: 'Wandering Merchant',
    text: '낯선 상인이 등에 짐을 지고 서 있다. "귀한 물건이 있소만, 값을 치를 수 있겠소?"',
    textEn: 'A strange merchant stands with a heavy pack. "I have something rare, if you can pay."',
    choices: [
      { id: 'buy_relic', text: '유물을 구매한다 (골드 -60)', textEn: 'Buy a relic (-60 gold)', effects: [], requiresGold: 60, goldDelta: -60, relicId: 'random' },
      {
        id: 'haggle',
        text: '가격을 흥정한다 (골드 30, 50% 확률로 유물 획득)',
        textEn: 'Haggle (30 gold, 50% chance to get a relic)',
        effects: [],
        requiresGold: 30,
        goldDelta: -30,
        relicId: 'random',
        successChance: 0.5,
      },
      { id: 'ignore', text: '무시하고 지나간다', textEn: 'Ignore and move on', effects: [] },
    ],
  },
  {
    id: 'wounded_traveler',
    title: '부상당한 여행자', titleEn: 'Wounded Traveler',
    text: '피투성이 여행자가 쓰러져 있다. 도울 수도, 소지품을 뒤질 수도 있다.',
    textEn: 'A bloodied traveler lies collapsed. You could help them, or search their belongings.',
    choices: [
      { id: 'help', text: '치료해준다 (체력 -8, 카드 1장 강화)', textEn: 'Treat their wounds (-8 HP, upgrade a card)', effects: [{ op: 'heal', value: -8 }], upgradeRandomCard: true },
      { id: 'loot', text: '소지품을 뒤진다 (골드 +30)', textEn: 'Search their belongings (+30 gold)', effects: [], goldDelta: 30 },
      { id: 'leave', text: '지나친다', textEn: 'Walk past', effects: [] },
    ],
  },
  {
    id: 'crystal_pool',
    title: '결정의 연못', titleEn: 'Crystal Pool',
    text: '보랏빛으로 빛나는 연못이다. 손을 담그면 무언가 변할 것 같다.',
    textEn: 'A pool glowing violet. Dipping your hand in feels like it would change something.',
    choices: [
      { id: 'drink', text: '마신다 (최대 HP +6)', textEn: 'Drink (+6 max HP)', effects: [{ op: 'modifyStat', stat: 'maxHp', value: 6 }] },
      { id: 'bathe', text: '몸을 담근다 (체력 전부 회복, 골드 -20)', textEn: 'Bathe (fully heal, -20 gold)', effects: [{ op: 'heal', value: 999 }], goldDelta: -20 },
      { id: 'avoid', text: '피해서 지나간다', textEn: 'Avoid it', effects: [] },
    ],
  },
  {
    id: 'sealed_chest',
    title: '봉인된 상자', titleEn: 'Sealed Chest',
    text: '사슬로 감긴 낡은 상자. 억지로 열 수도, 열쇠를 찾아볼 수도 있다.',
    textEn: 'An old chest bound in chains. You could force it open or look for a key.',
    choices: [
      { id: 'force', text: '억지로 연다 (체력 -6, 카드 획득)', textEn: 'Force it open (-6 HP, gain a card)', effects: [{ op: 'heal', value: -6 }], gainRandomCard: true },
      { id: 'skip', text: '포기한다', textEn: 'Give up on it', effects: [] },
    ],
  },
  {
    id: 'rift_whisper',
    title: '균열의 속삭임', titleEn: 'Whisper of the Rift',
    text: '균열 안쪽에서 목소리가 들린다. "더 강해지고 싶은가, 아니면 안전하고 싶은가."',
    textEn: 'A voice speaks from within the rift. "Do you wish for power, or for safety?"',
    choices: [
      { id: 'power', text: '힘을 택한다 (저주 1장, 카드 1장 강화)', textEn: 'Choose power (gain a curse, upgrade a card)', effects: [], addCurse: 'curse_rift_shard', upgradeRandomCard: true },
      { id: 'safety', text: '안전을 택한다 (최대 HP +5)', textEn: 'Choose safety (+5 max HP)', effects: [{ op: 'modifyStat', stat: 'maxHp', value: 5 }] },
    ],
  },
  {
    id: 'old_shrine_gold',
    title: '황금 조각상', titleEn: 'Golden Statuette',
    text: '금으로 된 작은 조각상이 놓여 있다.',
    textEn: 'A small golden statuette rests here.',
    choices: [
      { id: 'take_gold', text: '가져간다 (골드 +75)', textEn: 'Take it (+75 gold)', effects: [], goldDelta: 75 },
      { id: 'leave_gold', text: '건드리지 않는다', textEn: "Don't touch it", effects: [] },
    ],
  },
];

export const eventMap: Record<string, EventDef> = Object.fromEntries(events.map((e) => [e.id, e]));

export function pickRandomEvent(rngPick: <T>(arr: T[]) => T): EventDef {
  return rngPick(events);
}
