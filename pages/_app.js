import Head from 'next/head';
import '../styles/comments.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* The small picture in the browser tab (the file is public/icon.png) */}
        <link rel="icon" href="/icon.jpg" type="image/jpeg" />
        {/* The text next to it. Change "comments" to whatever you like. */}
        <title>comment</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}