import { atom } from 'recoil';
import { Settings } from '@frontmatter/common';

export const SettingsAtom = atom<Settings | null>({
  key: 'SettingsAtom',
  default: null
});