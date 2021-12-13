import * as React from 'react';
import { SETTINGS_DASHBOARD_OPENONSTART, Settings, SettingsApi } from '@frontmatter/common'
import useExtension from '../../hooks/useExtension';
import useSettings from '../../hooks/useSettings';

export interface IStartupProps {
  settings: Settings | null;
}

export const Startup: React.FunctionComponent<IStartupProps> = ({settings}: React.PropsWithChildren<IStartupProps>) => {
  const [isChecked, setIsChecked] = React.useState(false);
  const { post } = useExtension();
  const { fetchSettings } = useSettings();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
    await post(SettingsApi.update, { name: SETTINGS_DASHBOARD_OPENONSTART, value: e.target.checked });
    fetchSettings();
  };

  React.useEffect(() => {
    setIsChecked(!!settings?.openOnStart);
  }, [settings?.openOnStart]);

  return (
    <div className={`relative flex items-start`}>
      <div className="flex items-center h-5">
        <input
          id="startup"
          aria-describedby="startup-description"
          name="startup"
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          className="focus:outline-none focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 dark:border-vulcan-50 rounded"
        />
      </div>
      <div className="ml-2 text-sm">
        <label id="startup-description" htmlFor="startup" className="font-medium text-vulcan-50 dark:text-whisper-900">
          Open on startup?
        </label>
      </div>
    </div>
  );
};