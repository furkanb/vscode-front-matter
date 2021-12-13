import { useState, useEffect } from 'react';
import { SettingsApi } from '@frontmatter/common';
import { useRecoilValue } from 'recoil';
import { ApiAtom } from '../state';

export default function useViewSelector(apiPort: string | null) {
  const [ installedVersion, setInstalledVersion ] = useState<string | undefined>(undefined);
  const [ usedVersion, setUsedVersion ] = useState<string | undefined>(undefined);
  const apiUrl = useRecoilValue(ApiAtom);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`${apiUrl}/${SettingsApi.version}`)
      if (res.ok) {
        const versionData:{ usedVersion: string | undefined; installedVersion: string; } = await res.json();

        setInstalledVersion(versionData.installedVersion);
        setUsedVersion(versionData.usedVersion);
      }
    }

    if (apiUrl) {
      fetchData();
    }
  }, [apiUrl]);

  return {
    installedVersion,
    usedVersion
  };
}