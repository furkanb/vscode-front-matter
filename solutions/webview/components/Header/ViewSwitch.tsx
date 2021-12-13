import * as React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { ViewAtom, ViewType, SettingsSelector } from '../../state';
import { ViewGridIcon, ViewListIcon } from '@heroicons/react/solid';
import useExtension from '../../hooks/useExtension';
import { ExtensionApi, ExtensionState } from '@frontmatter/common';

export interface IViewSwitchProps {}

export const ViewSwitch: React.FunctionComponent<IViewSwitchProps> = (props: React.PropsWithChildren<IViewSwitchProps>) => {
  const [ view, setView ] = useRecoilState(ViewAtom);
  const settings = useRecoilValue(SettingsSelector);
  const { post } = useExtension();
  
  const toggleView = () => {
    const newView = view === ViewType.Grid ? ViewType.List : ViewType.Grid;
    setView(newView);

    post(ExtensionApi.setState, {
      key: ExtensionState.PagesView, 
      value: newView
    })
  };

  React.useEffect(() => {
    if (settings?.pageViewType) {
      setView(settings?.pageViewType);
    }
  }, [settings?.pageViewType]);

  return (
    <div className={`flex rounded-sm bg-vulcan-50 lg:mb-1`}>
      <button className={`flex items-center px-2 py-1 rounded-l-sm ${view === ViewType.Grid ? 'bg-teal-500 text-vulcan-500' : 'text-whisper-500'}`} onClick={toggleView}>
        <ViewGridIcon className={`w-4 h-4`} />
        <span className={`sr-only`}>Change to grid</span>
      </button>
      <button className={`flex items-center px-2 py-1 rounded-r-sm ${view === ViewType.List ? 'bg-teal-500 text-vulcan-500' : 'text-whisper-500'}`} onClick={toggleView}>
        <ViewListIcon className={`w-4 h-4`} />
        <span className={`sr-only`}>Change to list</span>
      </button>
    </div>
  );
};