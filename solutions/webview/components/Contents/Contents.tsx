import * as React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { ApiAtom, DashboardViewAtom, SettingsSelector } from '../../state';
import { Header } from '../Header';
import { Overview } from './Overview';
import { Spinner } from '../Spinner';
import usePages from '../../hooks/usePages';
import { SponsorMsg } from '../Footer/SponsorMsg';
import { useEffect, useState } from 'react';
import { DashboardViewType, Page, PagesApi } from '@frontmatter/common';
import useExtension from '../../hooks/useExtension';

export interface IContentsProps {}

export const Contents: React.FunctionComponent<IContentsProps> = ({}: React.PropsWithChildren<IContentsProps>) => {
  const settings = useRecoilValue(SettingsSelector);
  const { get } = useExtension();
  const [ pages, setPages ] = useState<Page[]>([]);
  const [ loading, setLoading ] = useState<boolean>(false);
  const { pageItems } = usePages(pages);
  const [ , setView ] = useRecoilState(DashboardViewAtom);

  const folders = (pageItems || []).map(page => page.fmFolder);
  const pageFolders = [...new Set(folders)];

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      const data = await get(PagesApi.root);
      setPages(data || []);
      setLoading(false);
    };

    setView(DashboardViewType.Contents);

    fetchPages();
  }, [])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header 
        folders={pageFolders}
        totalPages={pageItems.length}
        settings={settings} />

      <div className="w-full flex-grow max-w-7xl mx-auto py-6 px-4">
        { loading ? <Spinner /> : <Overview pages={pageItems} settings={settings} /> }
      </div>

      <SponsorMsg beta={settings?.beta} version={settings?.versionInfo} />
    </div>
  );
};