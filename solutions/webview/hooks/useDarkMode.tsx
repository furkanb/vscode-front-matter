import { useEffect } from 'react';
import { SettingsApi } from '@frontmatter/common';
import { useRecoilValue } from 'recoil';
import { ApiAtom } from '../state';

export default function useDarkMode() {
  const apiUrl = useRecoilValue(ApiAtom);

  const setTheme = (response: { isDark: boolean }) => {
    const isDarkMode = response?.isDark;
    document.documentElement.classList.remove(`${isDarkMode ? "light" : "dark"}`);
    document.documentElement.classList.add(`${isDarkMode ? "dark" : "light"}`);
  };

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`${apiUrl}/${SettingsApi.theme}`);
      if (res.ok) {
        const themeData = await res.json();
        setTheme(themeData);
      }
    }

    if (apiUrl) {
      fetchData();
    }
  }, [apiUrl]);

}