import '../styles/globals.css'
import { useEffect } from 'react'
import Notifications from '../components/Notifications'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
  }, [])

  return (
    <>
      <Notifications />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
