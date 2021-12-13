import { atom } from 'recoil';
import { DashboardViewType } from '@frontmatter/common';

export const DashboardViewAtom = atom<DashboardViewType>({
  key: 'DashboardViewAtom',
  default: DashboardViewType.Contents
});