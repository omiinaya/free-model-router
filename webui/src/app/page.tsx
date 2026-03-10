'use client'

import { AppProvider, useApp } from '@/context/AppContext'
import { Header } from '@/components/Header'
import { ModelTable } from '@/components/ModelTable'
import { Footer } from '@/components/Footer'
import { Settings } from '@/components/Overlays/Settings'
import { Help } from '@/components/Overlays/Help'
import { Chat } from '@/components/Overlays/Chat'
import { InstallEndpoints } from '@/components/Overlays/InstallEndpoints'
import { Recommend } from '@/components/Overlays/Recommend'
import { FeatureRequest } from '@/components/Overlays/FeatureRequest'
import { BugReport } from '@/components/Overlays/BugReport'
import { LogViewer } from '@/components/Overlays/LogViewer'
import { TierFilter } from '@/components/Filters/TierFilter'

function AppContent() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <Header />
      
      <div className="px-4 py-3 border-b border-zinc-800">
        <TierFilter />
      </div>
      
      <ModelTable />
      
      <Footer />
      
      <Settings />
      <Help />
      <Chat />
      <InstallEndpoints />
      <Recommend />
      <FeatureRequest />
      <BugReport />
      <LogViewer />
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}