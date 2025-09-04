# n8n-nodes-parallel-workflows

An n8n community node that enables true parallel execution of multiple workflows, overcoming n8n's default sequential processing model.

## Features

- 🚀 **True Parallel Execution**: Execute unlimited workflows simultaneously
- 🎯 **Flexible Configuration**: Manual setup or dynamic from input data
- 💪 **Error Resilience**: Continue processing even if some workflows fail
- 📊 **Multiple Aggregation Modes**: Array, object, merged, or individual items
- ⚡ **Performance Optimized**: Optional concurrency limits and retry logic
- 📈 **Execution Tracking**: Monitor progress with metadata and timing info

## Installation

### Via n8n UI

1. Go to **Settings** > **Community Nodes**
2. Enter: `n8n-nodes-parallel-workflows`
3. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n custom nodes folder
cd ~/.n8n/custom

# Install the package
npm install n8n-nodes-parallel-workflows

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/jezweb/n8n-nodes-parallel-workflows.git

# Install dependencies
cd n8n-nodes-parallel-workflows
npm install

# Build the node
npm run build

# Link for local development
npm link
cd ~/.n8n/custom
npm link n8n-nodes-parallel-workflows
```

## Usage

### Basic Example - Manual Configuration

1. Add the **Parallel Workflow Orchestrator** node to your workflow
2. Set **Execution Mode** to "Manual Configuration"
3. Click **Add Workflow** for each workflow you want to execute
4. Configure each workflow with:
   - Workflow ID or name
   - Input data (JSON)
   - Optional timeout and retry settings

### Dynamic Configuration Example

Pass workflow configurations through input data:

```json
{
  "workflows": [
    {
      "workflowId": "workflow_1",
      "executionName": "Analysis Task",
      "inputData": {
        "prompt": "Analyze sales data",
        "region": "North America"
      },
      "timeout": 30,
      "retryCount": 2
    },
    {
      "workflowId": "workflow_2",
      "executionName": "Report Generation",
      "inputData": {
        "format": "PDF",
        "template": "executive"
      }
    }
  ]
}
```

Then set **Execution Mode** to "From Input Data".

### Use Cases

#### 1. Multiple AI API Calls
Execute multiple Gemini/ChatGPT workflows simultaneously with different prompts:

```javascript
// Input configuration
{
  "workflows": [
    { "workflowId": "gemini-analysis", "inputData": { "prompt": "Analyze Q4 sales" } },
    { "workflowId": "gemini-summary", "inputData": { "prompt": "Summarize report" } },
    { "workflowId": "gemini-translate", "inputData": { "prompt": "Translate to Spanish" } },
    // ... more workflows
  ]
}
```

#### 2. Batch Data Processing
Process different data sources in parallel:

```javascript
{
  "workflows": [
    { "workflowId": "process-csv", "inputData": { "file": "sales.csv" } },
    { "workflowId": "process-api", "inputData": { "endpoint": "/api/data" } },
    { "workflowId": "process-database", "inputData": { "query": "SELECT * FROM orders" } }
  ]
}
```

#### 3. Multi-Service Orchestration
Call multiple services simultaneously and aggregate results:

```javascript
{
  "workflows": [
    { "workflowId": "crm-fetch", "inputData": { "customerId": "12345" } },
    { "workflowId": "inventory-check", "inputData": { "productId": "ABC" } },
    { "workflowId": "shipping-calculate", "inputData": { "destination": "NYC" } }
  ]
}
```

## Configuration Options

### Node Properties

| Property | Type | Description |
|----------|------|-------------|
| **Execution Mode** | Select | Choose between manual configuration or input data |
| **Workflow Executions** | Array | List of workflows to execute (manual mode) |
| **Workflows Field** | String | Field name containing workflows (input mode) |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **Continue On Fail** | Boolean | true | Continue if a workflow fails |
| **Max Concurrent** | Number | 0 | Limit concurrent executions (0 = unlimited) |
| **Result Aggregation** | Select | array | How to combine results |
| **Include Metadata** | Boolean | false | Add execution timing and status |
| **Global Timeout** | Number | 300 | Maximum seconds for all workflows |

### Result Aggregation Modes

- **Array**: Returns results as an ordered array
- **Object**: Returns results with execution names as keys
- **Merged**: Deep merges all results into one object
- **Individual Items**: Each result as a separate n8n item

## Output Format

### With Array Aggregation
```json
{
  "results": [
    {
      "success": true,
      "workflowId": "workflow_1",
      "name": "Analysis Task",
      "data": { /* workflow output */ }
    },
    {
      "success": false,
      "workflowId": "workflow_2",
      "name": "Report Generation",
      "error": "Timeout after 30 seconds"
    }
  ],
  "summary": {
    "totalExecutions": 2,
    "successful": 1,
    "failed": 1,
    "totalTime": 15234
  }
}
```

### With Object Aggregation
```json
{
  "Analysis Task": {
    "success": true,
    "data": { /* workflow output */ }
  },
  "Report Generation": {
    "success": false,
    "error": "Timeout"
  }
}
```

## Performance Considerations

- **Concurrency Limits**: Set `maxConcurrent` to prevent overwhelming your system
- **Timeouts**: Configure per-workflow and global timeouts
- **Retry Logic**: Use `retryCount` for unreliable workflows
- **Resource Usage**: Monitor memory usage with large batches

## Error Handling

The node provides robust error handling:

1. **Continue on Fail**: Process all workflows even if some fail
2. **Timeout Protection**: Per-workflow and global timeouts
3. **Retry Logic**: Automatic retry with exponential backoff
4. **Error Details**: Detailed error messages in results

## Troubleshooting

### Common Issues

**Q: Workflows aren't executing in parallel**
A: Ensure your n8n instance has sufficient resources. Check if you've set a `maxConcurrent` limit.

**Q: Getting timeout errors**
A: Increase the timeout values. Default is 60 seconds per workflow.

**Q: Can't find my workflow ID**
A: Use either the workflow name or ID. Find the ID in the workflow URL.

## Development

### Building from Source

```bash
npm run build        # Build the node
npm run dev         # Watch mode for development
npm run lint        # Check code style
npm run format      # Format code
```

### Testing

```bash
# Link for local testing
npm link
cd ~/.n8n/custom
npm link n8n-nodes-parallel-workflows

# Restart n8n to load changes
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

MIT - See LICENSE file

## Support

- **Issues**: [GitHub Issues](https://github.com/jezweb/n8n-nodes-parallel-workflows/issues)
- **Author**: Jez Dawes
- **Email**: jeremy@jezweb.net
- **Company**: [Jezweb](https://www.jezweb.com.au)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

*Built with ❤️ for the n8n community*