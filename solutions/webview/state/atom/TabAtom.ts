import { atom } from 'recoil';
import { Tab } from '@frontmatter/common';

export const TabAtom = atom<Tab | string>({
  key: 'TabAtom',
  default: Tab.All
});