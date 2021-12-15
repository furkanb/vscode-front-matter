import { UploadIcon } from '@heroicons/react/outline';
import * as React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { DashboardViewAtom, LoadingAtom, MediaAtom, MediaFoldersAtom, SelectedMediaFolderAtom, SettingsSelector, SortingSelector, ViewDataSelector } from '../../state';
import { Header } from '../Header';
import { Spinner } from '../Spinner';
import { SponsorMsg } from '../Footer/SponsorMsg';
import { Item } from './Item';
import { Lightbox } from './Lightbox';
import { List } from './List';
import { useCallback, useEffect } from 'react';
import { FolderItem } from './FolderItem';
import { DashboardCommand, DashboardViewType, MediaApi } from '@frontmatter/common';
import { FrontMatterIcon } from '../Icons/FrontMatterIcon';
import useMedia from '../../hooks/useMedia';
import useExtension from '../../hooks/useExtension';
import { useDebounce } from '../../hooks/useDebounce';

export interface IMediaProps {}

export const LIMIT = 16;

export const Media: React.FunctionComponent<IMediaProps> = (props: React.PropsWithChildren<IMediaProps>) => {
  const [ isDragActive, setIsDragActive ] = React.useState(false);
  const [ lastUpdate, setLastUpdate ] = React.useState<string | null>(null);
  const settings = useRecoilValue(SettingsSelector);
  const selectedFolder = useRecoilValue(SelectedMediaFolderAtom);
  const media = useRecoilValue(MediaAtom);
  const folders = useRecoilValue(MediaFoldersAtom);
  const loading = useRecoilValue(LoadingAtom);
  const viewData = useRecoilValue(ViewDataSelector);
  const [ , setView ] = useRecoilState(DashboardViewAtom);
  const debounceMediaUpdate = useDebounce(lastUpdate, 500);
  const { post } = useExtension();
  const { getMedia } = useMedia();

  const sendMediaFile = useCallback(async (fileName: string, contents: any, folder: string | null) => {
    await post(MediaApi.upload, {
      fileName,
      contents,
      folder
    }, false);

    setLastUpdate(new Date().toTimeString());
  }, [post, setLastUpdate]);

  const mediaUpload = useCallback((event: MessageEvent<any>) => {
    if (event?.data?.command === DashboardCommand.dragEnter) {
      setIsDragActive(true);
    } else if (event?.data?.command === DashboardCommand.dragLeave) {
      setIsDragActive(false);
    } else if (event?.data?.command === DashboardCommand.dragDrop) {
      setIsDragActive(false);
      const { item: { fileName, contents } } = event?.data?.message;
      if (fileName && contents) {
        sendMediaFile(fileName, contents, selectedFolder);
      }
    }
  }, [ selectedFolder, sendMediaFile ]);
  
  useEffect(() => {
    console.log(debounceMediaUpdate, selectedFolder);
    if (debounceMediaUpdate) {
      getMedia(0, selectedFolder || "", viewData?.data.sorting || null);
    }
  }, [debounceMediaUpdate, selectedFolder]);

  useEffect(() => {
    window.addEventListener("message", mediaUpload);

    setView(DashboardViewType.Media);

    return () => {
      window.removeEventListener("message", mediaUpload);
    }
  }, [selectedFolder]);

  return (
    <main className={`h-full w-full`}>
      <div className="flex flex-col h-full overflow-auto">
        <Header settings={settings} />

        <div id="drag-drop" className="w-full flex-grow max-w-7xl mx-auto py-6 px-4">

          {
            viewData?.data?.filePath && (
              <div className={`text-lg text-center mb-6`}>
                <p>Select the image you want to use for your article.</p>
                <p className={`opacity-80 text-base`}>You can also drag and drop images from your desktop and select that once uploaded.</p>
              </div>
            )
          }
          
          {
            isDragActive && (
              <div className="absolute top-0 left-0 w-full h-full text-whisper-500 bg-gray-900 bg-opacity-70 flex flex-col justify-center items-center z-50">
                <UploadIcon className={`h-32`} />
                <p className={`text-xl max-w-md text-center`}>
                  {selectedFolder ? `Upload to ${selectedFolder}` : `No folder selected, files you drop will be added to the ${settings?.staticFolder || "public"} folder.`}
                </p>
              </div>
            )
          }

          {
            (media && media.length === 0 && folders.length === 0 && !loading) && (
              <div className={`flex items-center justify-center h-full`}>
                <div className={`max-w-xl text-center`}>
                  <FrontMatterIcon className={`text-vulcan-300 dark:text-whisper-800 h-32 mx-auto opacity-90 mb-8`} />
                  
                  <p className={`text-xl font-medium`}>No media files to show. You can drag &amp; drop new files.</p>
                </div>
              </div>
            )
          }

          {
            folders && folders.length > 0 && (
              <div className={`mb-8`}>
                <List>
                  {
                    folders && folders.map((folder) => (
                      <FolderItem key={folder} folder={folder} staticFolder={settings?.staticFolder} wsFolder={settings?.wsFolder} />
                    ))
                  }
                </List>
              </div>
            )
          }

          {
            media && media.length > 0 && (
              <List>
                {
                  media.map((file) => (
                    <Item key={file.fsPath} media={file} />
                  ))
                }
              </List>
            )
          }
        </div>

        {
          loading && ( <Spinner /> )
        }

        <Lightbox />

        <SponsorMsg beta={settings?.beta} version={settings?.versionInfo} />
      </div>
    </main>
  );
};