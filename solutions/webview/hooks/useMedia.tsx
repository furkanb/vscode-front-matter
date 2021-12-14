import { MediaApi, SortingOption } from '@frontmatter/common';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { LoadingAtom, MediaAtom, MediaFoldersAtom, MediaTotalAtom, SelectedMediaFolderAtom, SortingSelector } from '../state';
import useExtension from './useExtension';

export default function useMedia(init: boolean = true) {
  const { post } = useExtension();
  const [ , setFolders ] = useRecoilState(MediaFoldersAtom);
  const [ , setTotal ] = useRecoilState(MediaTotalAtom);
  const [ , setSelectedFolder ] = useRecoilState(SelectedMediaFolderAtom);
  const [ , setLoading ] = useRecoilState(LoadingAtom);
  const [ media, setMedia ] = useRecoilState(MediaAtom);

  const refresh = async (folder: string | null) => {
    setLoading(true);

    const data = await post(MediaApi.refresh, { folder });

    if (data) {
      setMedia(data.media);
      setTotal(data.total);
      setFolders(data.folders);
      setSelectedFolder(data.selectedFolder);
    }

    setLoading(false);
  }

  const getMedia = async (page: number = 0, folder: string = '', sorting: SortingOption | null = null) => {
    setLoading(true);

    const data: any = await post(MediaApi.root, {
      page,
      folder,
      sorting
    });

    if (data) {
      setMedia(data.media);
      setTotal(data.total);
      setFolders(data.folders);
      setSelectedFolder(data.selectedFolder);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (init && (!media || media.length === 0)) {
      getMedia();
    }
  }, []);

  return {
    refreshMedia: refresh,
    getMedia
  };
}