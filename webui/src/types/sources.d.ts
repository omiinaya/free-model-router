declare module '@/lib/sources' {
  export interface ProviderSource {
    label: string
    name: string
    url: string
    models: [string, string, string, string, string][]
  }
  
  export const sources: Record<string, ProviderSource>
  export const MODELS: [string, string, string, string, string, string][]
}