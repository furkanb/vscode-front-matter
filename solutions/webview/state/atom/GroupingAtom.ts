import { atom } from 'recoil';
import { GroupOption } from '@frontmatter/common';

export const GroupingAtom = atom<GroupOption>({
  key: 'GroupingAtom',
  default: GroupOption.none
});