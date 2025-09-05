# Development Scratchpad

## Version 0.3.0 - Webhook-Based Parallel Workflow Orchestrator

### Date: 2025-09-05

## Critical Pivot: REST API → Webhook URLs

### Problem Summary
1. **API Doesn't Work**: The `/api/v1/workflows/{id}/activate` endpoint doesn't exist in n8n's public API
2. **Selector Issues**: The `workflowSelector` returns objects with metadata, not simple strings
3. **Complexity**: API authentication adds unnecessary complexity for users

### Solution: Direct Webhook URL Execution

Users will provide webhook URLs from their workflows' Webhook trigger nodes. The Parallel Workflow Orchestrator will:
1. Execute all webhook URLs simultaneously via HTTP POST
2. Wait for all responses
3. Aggregate and return results

This is simpler, more reliable, and uses n8n's intended webhook system.

## Implementation Plan

### Phase 1: Remove API System ✅
- Delete `credentials/N8nApi.credentials.ts`
- Remove credential registration from `package.json`
- Remove credential requirements from node

### Phase 2: Update Node Configuration

#### Simple Mode - New Design:
```typescript
{
  displayName: 'Webhook URLs',
  name: 'webhookUrls',
  type: 'string',
  typeOptions: {
    rows: 5,
  },
  placeholder: 'https://your-n8n.com/webhook/abc-123\nhttps://your-n8n.com/webhook/def-456',
  description: 'Enter webhook URLs from your workflows (one per line)',
  default: '',
  required: true,
}
```

#### Manual Mode - Updated Fields:
```typescript
{
  displayName: 'Webhook URL',
  name: 'webhookUrl',
  type: 'string',
  placeholder: 'https://your-n8n.com/webhook/abc-123',
  description: 'The webhook URL from your workflow\'s Webhook trigger node',
  default: '',
  required: true,
}
```

### Phase 3: Core Execution Logic

```typescript
// Simple webhook execution function
const executeWebhook = async (config: any, index: number) => {
  const startTime = Date.now();
  const executionName = config.executionName || `Webhook_${index + 1}`;
  
  try {
    // Parse input data if string
    let inputData = config.inputData;
    if (typeof inputData === 'string') {
      try {
        inputData = JSON.parse(inputData);
      } catch (e) {
        inputData = {};
      }
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${config.timeout} seconds`)), config.timeout * 1000);
    });

    // Execute webhook
    const executionPromise = this.helpers.httpRequest({
      method: 'POST' as const,
      url: config.webhookUrl,
      body: inputData,
      json: true,
    });

    // Race between execution and timeout
    const result = await Promise.race([executionPromise, timeoutPromise]);

    return {
      success: true,
      webhookUrl: config.webhookUrl,
      name: executionName,
      data: result as IDataObject,
      executionTime: includeMetadata ? Date.now() - startTime : undefined,
      timestamp: includeMetadata ? new Date().toISOString() : undefined,
    };
  } catch (error: any) {
    if (!continueOnFail) throw error;
    
    return {
      success: false,
      webhookUrl: config.webhookUrl,
      name: executionName,
      error: error.message || 'Unknown error',
      executionTime: includeMetadata ? Date.now() - startTime : undefined,
      timestamp: includeMetadata ? new Date().toISOString() : undefined,
    };
  }
};
```

### Phase 4: Configuration Processing

```typescript
// Simple mode - parse webhook URLs
if (executionMode === 'simple') {
  const webhookUrlsRaw = this.getNodeParameter('webhookUrls', 0) as string;
  const passInputData = this.getNodeParameter('passInputData', 0) as boolean;
  
  const webhookUrls = webhookUrlsRaw
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);

  workflowConfigs = webhookUrls.map((url, index) => ({
    webhookUrl: url,
    executionName: `Webhook_${index + 1}`,
    inputData: passInputData ? items[0]?.json || {} : {},
    timeout: 60,
    retryCount: 0,
  }));
}

// Manual mode - get webhook configurations
if (executionMode === 'manual') {
  const workflowExecutions = this.getNodeParameter('workflowExecutions', 0) as any;
  const workflows = workflowExecutions.workflowValues || [];
  
  workflowConfigs = workflows.map((workflow: any, index: number) => {
    const additionalSettings = workflow.additionalSettings || {};
    return {
      webhookUrl: workflow.webhookUrl,
      executionName: workflow.executionName || `Webhook_${index + 1}`,
      inputData: workflow.inputData,
      timeout: additionalSettings.timeout || 60,
      retryCount: additionalSettings.retryCount || 0,
    };
  });
}
```

## Key Benefits

1. **Simplicity**: No API authentication needed
2. **Reliability**: Uses n8n's standard webhook system
3. **Testability**: Users can test webhook URLs independently
4. **Performance**: Direct HTTP calls, no API overhead
5. **Universal**: Works with any n8n instance (cloud or self-hosted)

## User Experience

### Old Flow (v0.2.x):
1. Enable n8n API
2. Create API key
3. Configure credentials in node
4. Select workflows from dropdown
5. Hope API works

### New Flow (v0.3.0):
1. Add Webhook trigger to sub-workflows
2. Copy webhook URLs
3. Paste into Parallel Workflow Orchestrator
4. Execute!

## Testing Checklist

- [ ] Create 3 test workflows with webhook triggers
- [ ] Test simple mode with multiline URLs
- [ ] Test manual mode with individual configs
- [ ] Test invalid URLs (404 response)
- [ ] Test timeout handling
- [ ] Test all aggregation modes (array, object, merged, items)
- [ ] Test concurrency limits
- [ ] Test retry logic
- [ ] Test continue on fail option
- [ ] Test with/without metadata

## Migration Guide for Users

### For v0.2.x Users:
**Breaking Change**: This version no longer uses workflow IDs or API credentials.

1. **Update Sub-workflows**: Each workflow needs a Webhook trigger node
2. **Get Webhook URLs**: Copy the production URL from each Webhook node
3. **Update Configuration**: Replace workflow IDs with webhook URLs
4. **Remove Credentials**: API credentials are no longer needed

### Example Configuration:
```
Old (v0.2.x):
- Workflow ID: workflow_123
- API Key: Required

New (v0.3.0):
- Webhook URL: https://n8n.example.com/webhook/abc-def-ghi
- API Key: Not needed
```

## Files to Update

1. **Delete**:
   - `credentials/N8nApi.credentials.ts`

2. **Modify**:
   - `package.json` - Remove credentials, bump to v0.3.0
   - `nodes/ParallelWorkflowOrchestrator/ParallelWorkflowOrchestrator.node.ts` - Complete rewrite
   - `README.md` - New instructions
   - `CHANGELOG.md` - Document breaking changes

## Version History

### v0.1.0 (2025-09-04)
- Initial release with mock execution

### v0.2.0 (2025-09-05)
- Added workflow selector dropdown
- Improved UI with simple mode

### v0.2.1 (2025-09-06)
- Attempted REST API implementation (failed)

### v0.2.2 (2025-09-06) 
- Fixed credential compilation issue

### v0.3.0 (2025-09-05) - CURRENT
- **BREAKING**: Complete pivot to webhook-based execution
- Removed API credentials
- Simplified user experience
- More reliable execution

## Implementation Notes

### Why Webhooks Work Better:
1. **Public Interface**: Webhooks are n8n's public interface for triggering workflows
2. **No Authentication**: Webhook URLs include their own security token
3. **Standard HTTP**: Just POST requests, no special API knowledge needed
4. **Already Tested**: Users can test webhook URLs in browser/Postman
5. **Fire and Forget**: Webhooks return immediately with response

### What We Keep:
- Parallel execution with Promise.all
- Concurrency limiting
- Retry logic
- Timeout handling
- All aggregation modes
- Continue on fail option
- Metadata tracking

### What We Remove:
- API credential system
- Workflow ID resolution
- Complex API error handling
- Dependency on private/undocumented APIs

## Next Steps

1. ✅ Update scratchpad with plan
2. ⬜ Delete credential files
3. ⬜ Update package.json
4. ⬜ Rewrite node implementation
5. ⬜ Update documentation
6. ⬜ Test thoroughly
7. ⬜ Publish v0.3.0

---

*Last Updated: 2025-09-05 - Major Architecture Change*