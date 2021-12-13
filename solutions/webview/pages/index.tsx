import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect } from 'react';
import { Contents } from '../components/Contents/Contents';
import { Spinner } from '../components/Spinner';
import { WelcomeScreen } from '../components/WelcomeScreen';
import useDarkMode from '../hooks/useDarkMode';
import useLocalApiPort from '../hooks/useLocalApiPort';
import useSettings from '../hooks/useSettings';
import useVersion from '../hooks/useVersion';

const Home: NextPage = () => {
  const { apiPort } = useLocalApiPort();
  const { usedVersion } = useVersion(apiPort)
  const { loading, settings } = useSettings();
  useDarkMode();
  useSettings();

  useEffect(() => {
    if (apiPort) {
      
    }
  }, [apiPort]);

  if (!apiPort || !settings || loading) {
    return <Spinner />;
  }

  if (!usedVersion) {
    return <WelcomeScreen />;
  }

  if (!settings.initialized || settings.folders?.length === 0) {
    return <WelcomeScreen />;
  }
  
  return (
    <div className={`h-full w-full bg-gray-100 text-vulcan-500 dark:bg-vulcan-500 dark:text-whisper-500`}>
      <Head>
        <title>Pages overview</title>
        <meta name="description" content="Pages overview" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main className={`h-full w-full`}>
        <Contents loading={loading} />
      </main>
    </div>
  )
}

export default Home
