'use client'

import { AppProvider, useApp } from '@/context/AppContext'
import { Header } from '@/components/Header'
import { ModelTable } from '@/components/ModelTable'
import { Footer } from '@/components/Footer'
import { Settings } from '@/components/Overlays/Settings'
import { Help } from '@/components/Overlays/Help'
import { Chat } from '@/components/Overlays/Chat'
import { Recommend } from '@/components/Overlays/Recommend'
import { FeatureRequest } from '@/components/Overlays/FeatureRequest'
import { BugReport } from '@/components/Overlays/BugReport'
import { LogViewer } from '@/components/Overlays/LogViewer'

function AppContent() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <Header />
      <ModelTable />
      <Footer />
      
      <Settings />
      <Help />
      <Chat />
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