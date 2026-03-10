import { NextRequest, NextResponse } from 'next/server'
import { readConfig, writeConfig } from '@/lib/config'

export async function GET() {
  try {
    const config = await readConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to read config:', error)
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    await writeConfig(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to write config:', error)
    return NextResponse.json({ error: 'Failed to write config' }, { status: 500 })
  }
}