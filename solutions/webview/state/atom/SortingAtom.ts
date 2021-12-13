import { atom } from 'recoil';
import { SortOption, SortingOption } from '@frontmatter/common';

export const DEFAULT_SORTING_OPTION = SortOption.LastModifiedDesc;

export const SortingAtom = atom<SortingOption | null>({
  key: 'SortingAtom',
  default: null
});