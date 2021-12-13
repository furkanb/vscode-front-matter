import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <div className={`h-full w-full`}>
      <Head>
        <title>Pages overview</title>
        <meta name="description" content="Pages overview" />
      </Head>

      <main className={`h-full w-full bg-white`}>
        Main page....
      </main>
    </div>
  )
}

export default Home
