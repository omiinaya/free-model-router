# Multi-Key Rotation & Load Balancing

## Overview

The WebUI now supports **multi-key rotation** for load balancing and rate limit avoidance. When you have multiple API keys for the same provider (e.g., 5 NVIDIA keys, 3 OpenRouter keys), requests are automatically distributed across them in round-robin fashion.

## How It Works

1. **Configure multiple keys** per provider as an array in your config
2. **Automatic rotation** - each request uses the next key in sequence
3. **Load distribution** - spreads requests across all available keys
4. **Rate limit avoidance** - reduces likelihood of hitting per-key limits

## Configuration Example

### Single Key (Traditional)
```json
{
  "apiKeys": {
    "nvidia": "nvapi-xxx"
  }
}
```

### Multiple Keys (Load Balanced)
```json
{
  "apiKeys": {
    "nvidia": [
      "nvapi-key-1",
      "nvapi-key-2", 
      "nvapi-key-3",
      "nvapi-key-4",
      "nvapi-key-5"
    ],
    "openrouter": [
      "sk-or-v1-key-1",
      "sk-or-v1-key-2"
    ]
  }
}
```

## How Requests Are Routed

When a request comes in for an NVIDIA model:
1. System checks how many NVIDIA keys are configured
2. Uses the next key in rotation (in-memory cursor per provider)
3. Increments cursor for next request
4. Loops back to first key when reaching the end

Example sequence with 3 NVIDIA keys:
- Request 1 → key-1
- Request 2 → key-2  
- Request 3 → key-3
- Request 4 → key-1
- Request 5 → key-2
- etc.

## Benefits

### 1. **Rate Limit Management**
- Distributes load across multiple accounts
- Each key has its own rate limit quota
- Total throughput = sum of all key quotas

### 2. **Fault Tolerance**
- If one key becomes invalid/expired, system continues with remaining keys
- No single point of failure for API access

### 3. **Cost Optimization**
- Use multiple free-tier accounts together
- Combine paid accounts with different billing cycles

### 4. **Performance**
- Parallel requests can use different keys simultaneously
- No waiting for single key rate limit reset

## Implementation Details

### Key Selection Algorithm
```typescript
// Simplified rotation logic
const cursor = keyCursor.get(providerKey) || 0
const key = keys[cursor % keys.length]
keyCursor.set(providerKey, (cursor + 1) % keys.length)
```

### Supported Providers
All 20+ providers support multi-key rotation:
- NVIDIA NIM
- OpenRouter
- Groq
- Cerebras
- Hugging Face
- Replicate
- DeepInfra
- Fireworks AI
- etc.

### State Management
- Rotation cursors stored in-memory (restarts with server)
- Each provider maintains independent cursor
- No persistent storage needed (stateless rotation)

## Monitoring & Debugging

### Log Output
Each proxied request logs:
- Provider used
- Model selected  
- Key index used (for debugging)
- Response status

### Health Checks
System can optionally track:
- Key success/failure rates
- Rate limit responses per key
- Automatic key retirement on repeated failures

## Example: Scaling with 5 NVIDIA Keys

**Before (single key):**
- Rate limit: 50 RPM per key
- Max throughput: 50 requests/minute
- Single point of failure

**After (5 keys):**
- Rate limit: 50 RPM × 5 keys = 250 RPM
- 5× higher throughput
- 4 backup keys if one fails

## Configuration Tips

1. **Balance key distribution** - Ensure all keys have similar rate limits
2. **Monitor usage** - Check provider dashboards for individual key usage
3. **Rotate regularly** - Add/remove keys as needed without downtime
4. **Test thoroughly** - Verify all keys work before production use

## Advanced Use Cases

### Tiered Key Rotation
```json
"nvidia": [
  "premium-key-1",  // Higher rate limits
  "premium-key-2",
  "standard-key-1",  // Standard limits  
  "standard-key-2"
]
```

### Geographic Distribution
```json
"openrouter": [
  "us-east-key",    // US region
  "eu-west-key",    // EU region  
  "asia-key"        // Asia region
]
```

### Time-Based Rotation
Use different keys during peak vs off-peak hours to optimize costs.

## Troubleshooting

### Common Issues

1. **Key not rotating** - Ensure keys are configured as array, not string
2. **Uneven distribution** - Check cursor logic; all keys should see equal use
3. **Memory concerns** - Cursors are minimal overhead (<1KB total)

### Debug Commands
```bash
# Check API response to see which key was used
curl -v http://localhost:9191/api/v1/chat/completions

# Monitor logs for rotation pattern
tail -f ~/.free-coding-models-requests.jsonl
```

## Future Enhancements

Planned improvements:
- Weighted rotation (some keys get more traffic)
- Smart rotation (avoid recently rate-limited keys)
- Key health monitoring with auto-retirement
- Dashboard showing key usage statistics

---

**Last Updated**: 2026-03-21