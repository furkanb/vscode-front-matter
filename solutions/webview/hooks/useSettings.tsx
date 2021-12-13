import { useCallback, useEffect, useState } from 'react';
import { Server, SettingsApi } from '@frontmatter/common';
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

  useEffect(() => {
    if (apiUrl && !settings) {
      fetchSettings();
    }
  }, [apiUrl, settings]);

  return {
    loading,
    settings,
    fetchSettings
  };
}