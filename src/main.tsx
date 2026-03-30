import React from 'react'
import ReactDOM from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { queryClient } from './lib/queryClient'
import { queryPersister } from './lib/queryPersistence'
import { startOfflineSync } from './lib/offlineSync'
import './index.css'

registerSW({ immediate: true })
startOfflineSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000 }}
    >
      <App />
    </PersistQueryClientProvider>
  </React.StrictMode>,
)
