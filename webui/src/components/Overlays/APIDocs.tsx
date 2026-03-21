'use client'

import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function APIDocs() {
  const { apiDocsOpen, setApiDocsOpen, config } = useApp()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <Dialog open={apiDocsOpen} onOpenChange={setApiDocsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>📖 API Documentation</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 pr-4">

            {/* OpenAI Compatibility */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🔄 OpenAI API Spec</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Full OpenAI API compatibility. Use any OpenAI-compatible client.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm bg-zinc-900 p-3 rounded-lg">
                <div>
                  <span className="text-yellow-400 font-mono">GET /v1/models</span>
                  <p className="text-zinc-500 text-xs">List available models</p>
                </div>
                <div>
                  <span className="text-yellow-400 font-mono">GET /v1/models/:id</span>
                  <p className="text-zinc-500 text-xs">Get model details</p>
                </div>
                <div>
                  <span className="text-yellow-400 font-mono">POST /v1/chat/completions</span>
                  <p className="text-zinc-500 text-xs">Chat completions (streaming!)</p>
                </div>
                <div>
                  <span className="text-yellow-400 font-mono">POST /v1/completions</span>
                  <p className="text-zinc-500 text-xs">Legacy text completions</p>
                </div>
                <div>
                  <span className="text-yellow-400 font-mono">POST /v1/embeddings</span>
                  <p className="text-zinc-500 text-xs">Text embeddings</p>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🚀 Quick Start (OpenAI-style)</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Use the OpenAI client with your FCM proxy key. Routes through favorites by default.
              </p>
              <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400"># OpenAI Python client</span>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(`from openai import OpenAI

client = OpenAI(
    api_key="${config.fcmProxyKey || 'YOUR_API_KEY'}",
    base_url="http://localhost:3000/v1"
)

response = client.chat.completions.create(
    model="any-model",  # ignored, we pick best
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)`)}>
                    Copy
                  </Button>
                </div>
                <pre className="text-zinc-300 overflow-x-auto">
{`from openai import OpenAI

client = OpenAI(
    api_key="${config.fcmProxyKey || 'YOUR_API_KEY'}",
    base_url="http://localhost:3000/v1"
)

response = client.chat.completions.create(
    model="any-model",  # ignored, we pick best
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)`}
                </pre>
              </div>
            </div>

            {/* Legacy Endpoints */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📜 Legacy Endpoints</h3>
              <p className="text-sm text-zinc-400 mb-3">
                The original endpoints still work but OpenAI-style is recommended.
              </p>
              <div className="bg-zinc-800 p-3 rounded-lg font-mono text-xs">
                <div className="text-zinc-400">POST /api/completions</div>
                <div className="text-zinc-400">GET /api/best</div>
              </div>
            </div>

            {/* Your API Key */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🔑 Your API Key</h3>
              <div className="flex items-center gap-3">
                <code className="bg-zinc-800 px-3 py-2 rounded font-mono text-sm flex-1">
                  {config.fcmProxyKey || 'Not set - go to Settings to generate'}
                </code>
{config.fcmProxyKey && (
  <Button size="sm" variant="outline" onClick={() => config.fcmProxyKey && copyToClipboard(config.fcmProxyKey)}>
    Copy
  </Button>
)}
              </div>
            </div>

            {/* Request Format */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📝 Request Format</h3>
              <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm">
                <pre className="text-zinc-300">{`{
  "model": "gpt-4", // optional, for specific mode
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  // ... other OpenAI-compatible params
}`}</pre>
              </div>
            </div>

            {/* Headers */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Headers</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-400 border-b border-zinc-800">
                    <th className="pb-2">Header</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Example</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-b border-zinc-800">
                    <td className="py-2 font-mono text-yellow-400">X-API-Key</td>
                    <td className="py-2">Your FCM proxy key</td>
                    <td className="py-2 font-mono">fcpm_xxx...</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2 font-mono text-yellow-400">X-Mode</td>
                    <td className="py-2">Selection mode</td>
                    <td className="py-2 font-mono">specific | group | round-robin</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2 font-mono text-yellow-400">X-Model</td>
                    <td className="py-2">Model ID (for specific mode)</td>
                    <td className="py-2 font-mono">groq/llama-3.3-70b-versatile</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2 font-mono text-yellow-400">X-Group</td>
                    <td className="py-2">Tier or provider filter</td>
                    <td className="py-2 font-mono">S+ | groq | S+:groq</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-yellow-400">X-Pool</td>
                    <td className="py-2">Round-robin pool scope</td>
                    <td className="py-2 font-mono">all | tier=S+ | provider=groq</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modes */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🎯 Selection Modes</h3>
              
              <div className="space-y-3">
                <div className="bg-zinc-900 p-3 rounded-lg">
                  <div className="font-semibold text-green-400 mb-1">Default (Favorites)</div>
                  <p className="text-sm text-zinc-400">Routes through your favorited models. Add +30 score bonus to favorites.</p>
                  <pre className="text-xs text-zinc-500 mt-2">curl .../api/completions -H "X-API-Key: KEY"</pre>
                </div>

                <div className="bg-zinc-900 p-3 rounded-lg">
                  <div className="font-semibold text-blue-400 mb-1">specific</div>
                  <p className="text-sm text-zinc-400">Use a specific model by provider/modelId</p>
                  <pre className="text-xs text-zinc-500 mt-2">curl .../api/completions -H "X-Mode: specific" -H "X-Model: groq/llama-3.3-70b-versatile"</pre>
                </div>

                <div className="bg-zinc-900 p-3 rounded-lg">
                  <div className="font-semibold text-purple-400 mb-1">group</div>
                  <p className="text-sm text-zinc-400">Select best model within a tier or provider</p>
                  <pre className="text-xs text-zinc-500 mt-2">curl .../api/completions -H "X-Mode: group" -H "X-Group: S+"</pre>
                </div>

                <div className="bg-zinc-900 p-3 rounded-lg">
                  <div className="font-semibold text-yellow-400 mb-1">round-robin</div>
                  <p className="text-sm text-zinc-400">Cycle through a pool of models</p>
                  <pre className="text-xs text-zinc-500 mt-2">curl .../api/completions -H "X-Mode: round-robin" -H "X-Pool: all"</pre>
                </div>
              </div>
            </div>

            {/* Example Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-3">💻 Example Requests</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">1. Best S+ model (legacy)</div>
                  <div className="bg-zinc-900 p-3 rounded-lg font-mono text-xs">
                    <Button size="sm" variant="ghost" className="h-6 text-xs mb-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/completions \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Best: true" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`)}>
                      Copy
                    </Button>
                    <pre className="text-zinc-400">{`curl -X POST http://localhost:3000/api/completions \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Best: true" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`}</pre>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">2. Specific model</div>
                  <div className="bg-zinc-900 p-3 rounded-lg font-mono text-xs">
                    <Button size="sm" variant="ghost" className="h-6 text-xs mb-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/completions \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Mode: specific" \\
  -H "X-Model: groq/llama-3.3-70b-versatile" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`)}>
                      Copy
                    </Button>
                    <pre className="text-zinc-400">{`curl -X POST http://localhost:3000/api/completions \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Mode: specific" \\
  -H "X-Model: groq/llama-3.3-70b-versatile" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`}</pre>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">3. Best from Groq provider</div>
                  <div className="bg-zinc-900 p-3 rounded-lg font-mono text-xs">
                    <Button size="sm" variant="ghost" className="h-6 text-xs mb-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/completions \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Mode: group" \\
  -H "X-Group: groq" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`)}>
                      Copy
                    </Button>
                    <pre className="text-zinc-400">{`curl -X POST http://localhost:3000/api/completions \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Mode: group" \\
  -H "X-Group: groq" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`}</pre>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">4. Round-robin through favorites</div>
                  <div className="bg-zinc-900 p-3 rounded-lg font-mono text-xs">
                    <Button size="sm" variant="ghost" className="h-6 text-xs mb-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/completions \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Mode: round-robin" \\
  -H "X-Pool: all" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`)}>
                      Copy
                    </Button>
<pre className="text-zinc-400">{`curl -X POST http://localhost:3000/api/completions \\
  -H "X-API-Key: ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -H "X-Mode: round-robin" \\
  -H "X-Pool: all" \\
  -d '{"messages":[{"role":"user","content":"Hello"}]}'`}</pre>
</div>
</div>

<div>
  <div className="text-sm font-medium mb-2">5. Get embeddings (requires OpenAI/Cohere key in Settings)</div>
  <div className="bg-zinc-900 p-3 rounded-lg font-mono text-xs">
    <Button size="sm" variant="ghost" className="h-6 text-xs mb-2" onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/v1/embeddings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -d '{"input": "Hello world", "model": "text-embedding-3-small"}'}`)}>
      Copy
    </Button>
    <pre className="text-zinc-400">{`curl -X POST http://localhost:3000/v1/embeddings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${config.fcmProxyKey || 'YOUR_KEY'}" \\
  -d '{"input": "Hello world", "model": "text-embedding-3-small"}'`}</pre>
  </div>
</div>
</div>
</div>

            {/* Response */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📨 Response</h3>
              <p className="text-sm text-zinc-400 mb-2">
                Returns the provider's response directly (OpenAI-compatible). Usage is logged automatically.
              </p>
              <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm">
                <pre className="text-zinc-300">{`{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Hi!"},
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  }
}`}</pre>
              </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}