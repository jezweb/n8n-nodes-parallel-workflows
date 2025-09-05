# Development Scratchpad

## Current Focus
n8n community node for parallel workflow orchestration - v0.2.1 Development
**CRITICAL ISSUE**: Workflows not executing - only mock implementation exists!

## Key Requirements
1. ✅ No limit on number of workflows (dynamic)
2. ✅ True parallel execution using Promise.all
3. ✅ Configurable input (manual or from data)
4. ✅ Error resilience
5. ✅ Result aggregation options
6. ✅ Progress tracking
7. ✅ Workflow selector dropdown (v0.2.0)
8. ✅ Simple mode for easy use (v0.2.0)
9. ⬜ **ACTUAL WORKFLOW EXECUTION** (v0.2.1 - IN PROGRESS)

## Technical Decisions

### Execution Strategy
- Using Promise.all for true parallelism
- No worker threads initially (keep it simple)
- Rely on n8n's internal execution helpers

### Node Properties Structure
```typescript
properties: [
  {
    name: 'executionMode',
    options: ['manual', 'fromInput']
  },
  {
    name: 'workflowExecutions',
    type: 'fixedCollection',
    multipleValues: true
  },
  {
    name: 'dynamicConfig',
    displayOptions: { show: { executionMode: ['fromInput'] } }
  }
]
```

### Input Data Format
```json
{
  "workflows": [
    {
      "workflowId": "abc123",
      "inputData": { "key": "value" },
      "name": "Analysis 1"
    }
  ]
}
```

## Code Snippets

### Parallel Execution Core
```typescript
const promises = workflows.map(async (workflow) => {
  try {
    const result = await this.helpers.executeWorkflow(
      workflow.workflowId,
      workflow.inputData
    );
    return { success: true, result, name: workflow.name };
  } catch (error) {
    if (continueOnFail) {
      return { success: false, error: error.message, name: workflow.name };
    }
    throw error;
  }
});

const results = await Promise.all(promises);
```

## Issues & Solutions

### Issue 1: Workflow Access
**Problem**: How to trigger workflows - internal API vs webhooks?
**Research Finding**: `this.helpers.executeWorkflow()` NOT available for community nodes!
**Solution**: Use n8n REST API - this is the standard approach for community nodes

### Issue 2: Progress Tracking
**Problem**: No built-in way to track Promise.all progress
**Solution**: Could use Promise.allSettled or custom progress emitter (future enhancement)

### Issue 3: Resource Limits
**Problem**: Unlimited parallel executions could overwhelm system
**Solution**: Add optional maxConcurrent parameter with queue system

## Testing Notes

### Test Cases Needed
1. Single workflow execution
2. Multiple workflows (5-10)
3. Large batch (50+)
4. Error handling (one fails)
5. All fail scenario
6. Timeout handling
7. Different aggregation modes

### Manual Testing Steps
1. Install node locally
2. Create test workflows
3. Test with different configurations
4. Monitor resource usage
5. Check error scenarios

## API Design Notes

### Helper Functions Needed
```typescript
interface IWorkflowExecution {
  workflowId: string;
  inputData: IDataObject;
  name?: string;
  timeout?: number;
  retryCount?: number;
}

interface IExecutionResult {
  name: string;
  success: boolean;
  data?: IDataObject;
  error?: string;
  executionTime: number;
  workflowId: string;
}
```

## Performance Considerations

### Memory Usage
- Each workflow execution creates new context
- Need to monitor for large batches
- Consider streaming results for very large sets

### Optimization Ideas
1. Implement p-limit for concurrency control
2. Add caching for frequently executed workflows
3. Batch similar workflows together
4. Resource pooling for execution contexts

## Version 0.2.1 Implementation Plan (ACTIVE)

### Critical Bug Fix: Implement Real Workflow Execution
**Issue**: Current implementation only simulates workflow execution
**Root Cause**: Mock `executeWorkflow` method returns fake data
**Solution**: REST API implementation

### Implementation Steps

#### 1. Create Credential Type
```typescript
// credentials/N8nApi.credentials.ts
export class N8nApi implements ICredentialType {
  name = 'n8nApi';
  displayName = 'n8n API';
  properties = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'n8n API key (Settings → API → Create API Key)'
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'http://localhost:5678',
      required: true,
      placeholder: 'https://your-n8n.example.com',
      description: 'Your n8n instance URL'
    }
  ];
}
```

#### 2. Update Node to Require Credentials
```typescript
// Add to node description
credentials: [
  {
    name: 'n8nApi',
    required: true,
  }
],
```

#### 3. Replace Mock executeWorkflow Method
```typescript
private async executeWorkflow(
  workflowId: string, 
  inputData: IDataObject
): Promise<IDataObject> {
  // Get credentials
  const credentials = await this.getCredentials('n8nApi');
  const { apiKey, baseUrl } = credentials as IDataObject;
  
  // Prepare API call
  const options = {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey as string,
      'Content-Type': 'application/json',
    },
    uri: `${baseUrl}/api/v1/workflows/${workflowId}/activate`,
    body: inputData,
    json: true,
  };
  
  try {
    // Trigger workflow execution
    const response = await this.helpers.httpRequest(options);
    
    // Poll for execution result (or return immediately for fire-and-forget)
    return response;
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to execute workflow ${workflowId}: ${error.message}`
    );
  }
}
```

#### 4. API Endpoints to Use
- **Activate Workflow**: `POST /api/v1/workflows/{id}/activate`
- **Execute Workflow**: `POST /api/v1/workflows/{id}/run`
- **Get Execution Status**: `GET /api/v1/executions/{id}`

#### 5. Execution Modes
- **Fire and Forget**: Start workflows, don't wait for results
- **Wait for Completion**: Poll execution status until complete
- **Webhook Callback**: Sub-workflows call back when done (future)

### Testing Plan
1. Create API key in n8n instance
2. Configure credential in node
3. Test single workflow execution
4. Test parallel execution of 3+ workflows
5. Test error handling (invalid workflow ID)
6. Test timeout scenarios

### Documentation Updates Needed
1. Add "Prerequisites" section - API must be enabled
2. Add "Setup" section - How to create API key
3. Add security notes about API key storage
4. Update examples with real workflow IDs

## Version 0.2.0 Changes

### Key Improvements
1. **workflowSelector Type**: Changed from string to dropdown selection
2. **Simple Mode**: New default mode for quick workflow selection
3. **UI Reorganization**: Advanced options nested under collections
4. **Better UX**: Helpful notices, improved descriptions
5. **Breaking Change**: Manual mode now uses selector instead of string

### User Feedback Addressed
- "Hard to know what to do" - Added Simple mode
- "Too technical" - Hid advanced options
- "Need to know workflow IDs" - Added dropdown selector

## Future Features

### V3 Ideas
1. **Dependency Management**: Define execution order/dependencies
2. **Conditional Execution**: Skip workflows based on previous results  
3. **Load Balancing**: Distribute to multiple n8n instances
4. **Workflow Templates**: Pre-configured parallel patterns
5. **Visual Progress**: Real-time UI updates
6. **Analytics**: Execution statistics and performance metrics

### Integration Ideas
- Integrate with n8n's queue mode
- Support for external orchestrators
- Webhook callbacks for long-running workflows
- Event streaming for progress updates

## Questions to Research

1. ⬜ How does n8n handle concurrent executeWorkflow calls internally?
2. ⬜ Is there a limit on Promise.all array size in Node.js?
3. ⬜ Best practice for error aggregation in parallel operations?
4. ⬜ Can we access n8n's execution status API?

## Development Timeline

### Version 0.1.0 (Completed)
- [x] Project setup (30 min)
- [x] Documentation structure (20 min)
- [x] Core node implementation (1 hr)
- [x] Error handling (30 min)
- [x] Testing (1 hr)
- [x] Examples and docs (30 min)
- [x] Publishing prep (20 min)

### Version 0.2.0 (Completed) - 2025-09-05
- [x] Research workflow selector implementation
- [x] Replace string input with workflowSelector type
- [x] Add Simple mode as default
- [x] Reorganize UI with nested options
- [x] Improve descriptions and add notices
- [x] Update documentation
- [x] Publish to npm

## Commands Reference

```bash
# Development
npm run dev          # Watch mode
npm run build        # Build for production
npm run lint         # Check code style
npm run format       # Format code

# Testing locally
npm link             # Link package
cd ~/.n8n/custom
npm link n8n-nodes-parallel-workflows

# Publishing
npm publish
```

## Resources

- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n-nodes-starter](https://github.com/n8n-io/n8n-nodes-starter)
- [n8n Workflow API](https://docs.n8n.io/api/)

## Random Thoughts

- Could this become part of n8n core?
- Performance comparison vs sequential execution would be interesting
- Consider creating benchmarking suite
- Maybe add workflow caching for repeated executions?
- Visual workflow designer for parallel patterns?

---

*Last Updated: 2025-09-04 - Active Development*