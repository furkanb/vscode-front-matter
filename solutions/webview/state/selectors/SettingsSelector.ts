import { Settings } from '@frontmatter/common';
import { selector } from 'recoil';
import { SettingsAtom } from '..';

export const SettingsSelector = selector<Settings>({
  key: 'SettingsSelector',
  get: ({get}) => {
    return get(SettingsAtom);
  }
});