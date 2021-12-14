import { DashboardViewType } from '@frontmatter/common';
import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { Contents } from '../components/Contents/Contents';
import { Media } from '../components/Media/Media';
import { Spinner } from '../components/Spinner';
import { WelcomeScreen } from '../components/WelcomeScreen';
import useDarkMode from '../hooks/useDarkMode';
import useLocalApiPort from '../hooks/useLocalApiPort';
import useSettings from '../hooks/useSettings';
import useVersion from '../hooks/useVersion';
import { DashboardViewSelector } from '../state';

const Home: NextPage = () => {
  const { apiPort } = useLocalApiPort();
  const { usedVersion } = useVersion(apiPort)
  const { loading, settings } = useSettings();
  const view = useRecoilValue(DashboardViewSelector);
  useDarkMode();
  useSettings();

  useEffect(() => {
    window.addEventListener('message', (e) => { console.log('Home message', e.data) });
    window.addEventListener('dragenter', () => { console.log('Home dragenter') });
    window.addEventListener('dragover', () => { console.log('Home dragover') });
    window.addEventListener('drop', () => { console.log('Home drop') });
  }, []);

  if (!usedVersion) {
    return <WelcomeScreen />;
  }

  if (!settings?.initialized || settings.folders?.length === 0) {
    return <WelcomeScreen />;
  }
  
  return (
    <div className={`h-full w-full bg-gray-100 text-vulcan-500 dark:bg-vulcan-500 dark:text-whisper-500`}>
      <Head>
        {
          view === DashboardViewType.Contents ? (
           <>
              <title>Pages overview</title>
              <meta name="description" content="Pages overview" />
           </>
          ) : (
            <>
              <title>Media overview</title>
              <meta name="description" content="Media overview" />
            </>
          )
        }
        
        <link rel="icon" href="/frontmatter-short-min.png" />
      </Head>

      <main className={`h-full w-full`}>
        {
          (!apiPort || !settings || loading) ? (
            <Spinner />
          ) : (
            view === DashboardViewType.Contents ? (
              <Contents />
            ) : (
              <Media />
            )
          )
        }
      </main>
    </div>
  )
}

export default Home
