import type { TownId } from '@/types';
import type { CharacterDef } from '@/types/narrative';

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'martha-grieve',
    name: 'Martha Grieve',
    townId: 'port-hollow',
    role: 'Harbormaster',
    personality: 'Practical and blunt. Does not waste words or tolerate those who do. Trusts ledgers over people.',
    speechPattern: 'Short, clipped sentences. Drops pronouns. Rarely asks questions — states facts instead.',
    initialDisposition: 50,
  },
  {
    id: 'osric-vane',
    name: 'Osric Vane',
    townId: 'ironkeep',
    role: 'Foundry foreman',
    personality: 'Gruff and proud of his craft. Suspicious of merchants but respects anyone who works with their hands.',
    speechPattern: 'Blunt declarations. Uses trade jargon. Measures people the way he measures metal — by what they can take.',
    initialDisposition: 40,
  },
  {
    id: 'lien-saro',
    name: 'Lien Saro',
    townId: 'silkmere',
    role: 'Weaver and trader',
    personality: 'Perceptive and indirect. Sees commerce as conversation. Never says what she means on the first try.',
    speechPattern: 'Roundabout phrasing. Answers questions with questions. Polite but slippery.',
    initialDisposition: 55,
  },
  {
    id: 'yael-moss',
    name: 'Yael Moss',
    townId: 'goldcrest',
    role: 'Customs clerk',
    personality: 'Dry humor covering sharp attention. Knows who owes what and to whom. Bored but never careless.',
    speechPattern: 'Deadpan observations. Pauses before the important part. Lets silence do the work.',
    initialDisposition: 45,
  },
  {
    id: 'dex-halflight',
    name: 'Dex Halflight',
    townId: 'dustwatch',
    role: 'Lighthouse keeper',
    personality: 'Quiet and observant. Lonely but not desperate — used to solitude. Notices things others miss.',
    speechPattern: 'Sparse, careful words. Long gaps between sentences. Sometimes trails off mid-thought.',
    initialDisposition: 60,
  },
];

export const CHARACTER_BY_TOWN: Record<TownId, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.townId, c]),
) as Record<TownId, CharacterDef>;
