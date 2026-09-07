export interface AchievementDef {
  id: string;
  name: string;
  nameEn: string;
  text: string;
  textEn: string;
}

export const achievements: AchievementDef[] = [
  { id: 'first_win', name: '균열 정화', nameEn: 'Rift Cleansed', text: '처음으로 런을 클리어한다.', textEn: 'Clear a run for the first time.' },
  { id: 'warden_win', name: '불굴의 방패', nameEn: 'Unbreakable Shield', text: '파수병으로 3막 보스를 처치한다.', textEn: 'Defeat the Act 3 boss as the Warden.' },
  { id: 'ember_win', name: '원소의 지배자', nameEn: 'Master of Elements', text: '술사로 3막 보스를 처치한다.', textEn: 'Defeat the Act 3 boss as the Ember.' },
  { id: 'courier_win', name: '바람보다 빠르게', nameEn: 'Faster Than the Wind', text: '밀사로 3막 보스를 처치한다.', textEn: 'Defeat the Act 3 boss as the Courier.' },
  { id: 'scribe_unlocked', name: '각인의 시작', nameEn: 'The First Inscription', text: '각인자 클래스를 해금한다.', textEn: 'Unlock the Scribe class.' },
  { id: 'scribe_win', name: '완전한 각인', nameEn: 'The Perfect Inscription', text: '각인자로 3막 보스를 처치한다.', textEn: 'Defeat the Act 3 boss as the Scribe.' },
  { id: 'act4_unlocked', name: '균열 너머로', nameEn: 'Beyond the Rift', text: '모든 클래스로 3막을 클리어해 4막을 해금한다.', textEn: 'Clear Act 3 with every class to unlock Act 4.' },
  { id: 'act4_win', name: '형상 없는 것을 넘어서', nameEn: 'Past the Unmade', text: '4막 히든 보스를 처치한다.', textEn: 'Defeat the Act 4 hidden boss.' },
  { id: 'ascension5', name: '승천 5', nameEn: 'Ascension 5', text: '승천 5 이상에서 런을 클리어한다.', textEn: 'Clear a run at Ascension 5 or higher.' },
  { id: 'ascension15', name: '균열의 정점', nameEn: 'Peak of the Rift', text: '승천 15에서 런을 클리어한다.', textEn: 'Clear a run at Ascension 15.' },
  { id: 'no_hit_boss', name: '완벽한 회피', nameEn: 'Flawless Evasion', text: '보스 전투에서 피해를 받지 않고 승리한다.', textEn: 'Win a boss fight without taking damage.' },
];

export const achievementMap: Record<string, AchievementDef> = Object.fromEntries(
  achievements.map((a) => [a.id, a])
);
