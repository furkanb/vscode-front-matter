import { useCallback, useEffect, useState } from 'react';
import { DashboardCommand, SettingsApi } from '@frontmatter/common';
import { useRecoilState, useRecoilValue } from 'recoil';
import { ApiAtom, SettingsAtom } from '../state';

export default function useSettings() {
  const [loading, setLoading] = useState<boolean>(false);
  const [settings, setSettings] = useRecoilState(SettingsAtom);
  const apiUrl = useRecoilValue(ApiAtom);

  const fetchSettings = useCallback(async () => {
    if (apiUrl) {
      setLoading(true);
  
      const res = await fetch(`${apiUrl}/${SettingsApi.root}`)
      if (res.ok) {
        setSettings(await res.json());
      } else {
        setSettings(null);
      }

      setLoading(false);
    }
  }, [apiUrl]);

  const settingsUpdate = (event: MessageEvent<any>) => {
    if (event.data.command === DashboardCommand.settingsUpdate) {
      fetchSettings();
    }
  };

  useEffect(() => {
    if (apiUrl && !settings) {
      fetchSettings();
    }
  }, [apiUrl, settings]);

  useEffect(() => {
    window.addEventListener("message", settingsUpdate);

    return () => {
      window.removeEventListener("message", settingsUpdate);
    }
  }, []);

  return {
    loading,
    settings,
    fetchSettings
  };
}