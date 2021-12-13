import { atom } from 'recoil';

export const ApiAtom = atom<string | null>({
  key: 'ApiAtom',
  default: null
});