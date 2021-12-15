import { atom } from 'recoil';
import { DashboardData } from '@frontmatter/common';

export const ViewDataAtom = atom<DashboardData | undefined>({
  key: 'ViewDataAtom',
  default: undefined
});