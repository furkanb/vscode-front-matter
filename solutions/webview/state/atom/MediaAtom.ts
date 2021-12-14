import { MediaInfo } from '@frontmatter/common';
import { atom } from 'recoil';

export const MediaAtom = atom<MediaInfo[]>({
  key: 'MediaAtom',
  default: []
});