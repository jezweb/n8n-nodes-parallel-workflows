# Architecture Documentation

## Project: n8n-nodes-parallel-workflows

### Overview
This n8n community node provides true parallel execution of multiple workflows, overcoming n8n's default sequential processing model. It enables users to trigger any number of workflows simultaneously, wait for all to complete, and aggregate their results.

### Core Problem Solved
- n8n workflows execute branches sequentially by default
- The Execute Sub-workflow node has limitations for true parallel processing
- No native way to orchestrate multiple workflows running concurrently
- Performance bottleneck when calling multiple APIs or services

### Solution Architecture

```
┌─────────────────┐
│   User Input    │
│  (Trigger Data) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ParallelWorkflowOrchestrator Node  │
├─────────────────────────────────────┤
│ • Accepts workflow configurations   │
│ • Creates execution promises        │
│ • Manages concurrency pool          │
│ • Handles errors and retries        │
└──────────┬──────────────────────────┘
           │
           ▼
    ┌──────┴──────┐
    │  Promise.all │
    └──────┬──────┘
           │
    ┌──────┴──────────────────┐
    │                          │
    ▼                          ▼
┌──────────┐           ┌──────────┐
│Workflow 1│    ...    │Workflow N│
│Execution │           │Execution │
└──────────┘           └──────────┘
    │                          │
    └──────────┬───────────────┘
               ▼
    ┌──────────────────┐
    │ Result Aggregator│
    └──────────────────┘
               │
               ▼
    ┌──────────────────┐
    │  Combined Output │
    └──────────────────┘
```

### Component Design

#### 1. ParallelWorkflowOrchestrator Node
**Purpose**: Main node that orchestrates parallel workflow execution

**Key Properties**:
- `workflowExecutions`: Array of workflow configurations
- `executionMode`: How to determine workflows (manual/dynamic)
- `maxConcurrent`: Optional limit on concurrent executions
- `timeout`: Global timeout for all executions
- `continueOnFail`: Error handling strategy
- `resultAggregation`: How to combine results

**Methods**:
- `execute()`: Main execution entry point
- `prepareExecutions()`: Prepare workflow execution configs
- `executeParallel()`: Launch parallel executions
- `aggregateResults()`: Combine results based on strategy
- `handleErrors()`: Process execution failures

#### 2. Execution Manager
**Purpose**: Manages the lifecycle of parallel executions

**Features**:
- Promise pool management
- Resource monitoring
- Progress tracking
- Error collection
- Retry logic

#### 3. Result Aggregator
**Purpose**: Combines outputs from multiple workflow executions

**Strategies**:
- Array: Return ordered array of results
- Object: Key-value pairs using execution names
- Merged: Deep merge all results into single object
- Custom: User-defined aggregation function

### Technical Implementation

#### Parallel Execution Strategy

```typescript
class ParallelExecutionEngine {
  private maxConcurrent: number;
  private queue: ExecutionTask[];
  private activeExecutions: Map<string, Promise<any>>;
  
  async executeAll(tasks: ExecutionTask[]): Promise<ExecutionResult[]> {
    // Use Promise.all for true parallelism
    // Optional: Implement concurrency limit with p-limit
    // Track progress with event emitters
    // Handle individual failures without stopping others
  }
}
```

#### Workflow Triggering Methods

1. **Internal API Method**:
   - Use n8n's internal workflow execution API
   - Maintains execution history
   - Respects n8n permissions

2. **Webhook Method**:
   - Trigger workflows via their webhook URLs
   - Works with any n8n instance
   - Can trigger remote workflows

3. **Direct Execution**:
   - Use n8n's helper functions
   - Most integrated approach
   - Best performance

### Data Flow

1. **Input Processing**:
   ```
   Input Data → Validation → Configuration Mapping → Execution Queue
   ```

2. **Parallel Execution**:
   ```
   Queue → Promise Creation → Parallel Launch → Progress Monitoring
   ```

3. **Result Processing**:
   ```
   Individual Results → Error Handling → Aggregation → Output Format
   ```

### Error Handling

#### Error Types
1. **Configuration Errors**: Invalid workflow IDs, missing data
2. **Execution Errors**: Workflow failures, timeouts
3. **Resource Errors**: Memory/CPU limits exceeded
4. **Network Errors**: API connection failures

#### Error Strategies
- **Fail Fast**: Stop all on first error
- **Continue**: Collect all errors, return partial results
- **Retry**: Automatic retry with exponential backoff
- **Fallback**: Use default values for failed executions

### Performance Considerations

#### Concurrency Management
- Default: Unlimited parallel executions
- Configurable limit based on resources
- Queue system for exceeding limit
- Memory-aware execution planning

#### Resource Monitoring
```typescript
interface ResourceMonitor {
  memoryUsage: number;
  cpuUsage: number;
  activeWorkers: number;
  queuedTasks: number;
  averageExecutionTime: number;
}
```

### Security Considerations

1. **Workflow Access**: Respect n8n's permission model
2. **Data Isolation**: Each execution in separate context
3. **Input Validation**: Sanitize all user inputs
4. **Credential Handling**: Never expose credentials between workflows

### Integration Points

#### With n8n Core
- Uses n8n-workflow interfaces
- Compatible with n8n's execution model
- Integrates with n8n UI

#### With External Systems
- Can trigger webhooks
- Supports external APIs
- Works with any HTTP endpoint

### Future Enhancements

1. **Advanced Scheduling**:
   - Priority queue for executions
   - Time-based scheduling
   - Dependency management

2. **Monitoring Dashboard**:
   - Real-time execution status
   - Performance metrics
   - Error analytics

3. **Workflow Templates**:
   - Pre-configured parallel patterns
   - Common use case templates
   - Industry-specific workflows

4. **Advanced Aggregation**:
   - ML-based result combination
   - Statistical analysis
   - Pattern detection

### Testing Strategy

1. **Unit Tests**:
   - Node configuration validation
   - Execution logic
   - Error handling

2. **Integration Tests**:
   - Workflow triggering
   - Result aggregation
   - Error scenarios

3. **Performance Tests**:
   - Concurrent execution limits
   - Memory usage
   - Execution speed

### Deployment

1. **Installation**:
   ```bash
   npm install n8n-nodes-parallel-workflows
   ```

2. **n8n Configuration**:
   - Add to custom nodes directory
   - Or install via n8n UI

3. **Requirements**:
   - n8n version 1.0.0+
   - Node.js 18+
   - Sufficient memory for parallel executions

### Monitoring & Debugging

#### Logging
- Execution start/end
- Error details
- Performance metrics
- Resource usage

#### Debug Mode
- Detailed execution traces
- Promise resolution timing
- Memory snapshots
- Network request logs

### API Reference

See `nodes/ParallelWorkflowOrchestrator/ParallelWorkflowOrchestrator.node.ts` for complete API documentation.

---

*Last Updated: 2025-09-04*
*Version: 0.1.0*