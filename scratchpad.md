# Development Scratchpad

## Current Focus
Building n8n community node for parallel workflow orchestration

## Key Requirements
1. ✅ No limit on number of workflows (dynamic)
2. ⬜ True parallel execution using Promise.all
3. ⬜ Configurable input (manual or from data)
4. ⬜ Error resilience
5. ⬜ Result aggregation options
6. ⬜ Progress tracking

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
**Solution**: Start with internal helpers, add webhook support later

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

## Future Features

### V2 Ideas
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

- [x] Project setup (30 min)
- [x] Documentation structure (20 min)
- [ ] Core node implementation (1 hr)
- [ ] Error handling (30 min)
- [ ] Testing (1 hr)
- [ ] Examples and docs (30 min)
- [ ] Publishing prep (20 min)

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