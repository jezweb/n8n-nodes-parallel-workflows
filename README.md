# n8n-nodes-parallel-workflows

An n8n community node that enables true parallel execution of multiple workflows, overcoming n8n's default sequential processing model. Version 0.2.1 brings ACTUAL workflow execution via n8n API!

## 🚨 What's New in v0.2.1

- **REAL Workflow Execution**: Actually executes workflows via n8n API (no more simulation!)
- **API Integration**: Uses official n8n REST API for reliable workflow execution
- **Secure Credentials**: API keys stored securely using n8n's credential system
- **Better Error Handling**: Clear error messages for API issues

## 🎉 What's New in v0.2.0

- **Workflow Selector Dropdown**: No more typing workflow IDs! Select workflows from a dropdown list
- **Simple Mode**: New default mode - just pick workflows and go
- **Improved UI**: Cleaner interface with advanced options hidden by default
- **Better Organization**: Nested options, helpful notices, and improved descriptions

## Features

- 🚀 **True Parallel Execution**: Execute unlimited workflows simultaneously
- 📋 **Easy Workflow Selection**: Pick workflows from dropdown list (NEW!)
- 🎯 **Three Execution Modes**: Simple, Manual, or Dynamic from input data
- 💪 **Error Resilience**: Continue processing even if some workflows fail
- 📊 **Multiple Aggregation Modes**: Array, object, merged, or individual items
- ⚡ **Performance Optimized**: Optional concurrency limits and retry logic
- 📈 **Execution Tracking**: Monitor progress with metadata and timing info

## Prerequisites

### Required: Enable n8n API

1. **Enable the n8n API** in your instance:
   - Set environment variable: `N8N_API_ENABLED=true`
   - Or in config file: `api.enabled = true`
   
2. **Create an API Key**:
   - Go to **Settings** → **n8n API**
   - Click **Create an API key**
   - Copy the key immediately (you won't see it again)
   - Save it securely

3. **Configure the Node**:
   - When adding the Parallel Workflow Orchestrator node
   - Click on **Credentials** → **Create New**
   - Enter your API key and n8n instance URL
   - Save the credential

## Installation

### Via n8n UI

1. Go to **Settings** > **Community Nodes**
2. Enter: `n8n-nodes-parallel-workflows`
3. Click **Install**
4. Restart n8n

### Manual Installation

```bash
# Navigate to your n8n custom nodes folder
cd ~/.n8n/custom

# Install the package
npm install n8n-nodes-parallel-workflows

# Restart n8n
```

### Updating from v0.1.0

```bash
npm update n8n-nodes-parallel-workflows
# Then restart n8n
```

## Usage

### Quick Start - Simple Mode (NEW! 🎉)

The easiest way to use the node:

1. Add the **Parallel Workflow Orchestrator** node to your workflow
2. **Execution Mode** is set to "Simple" by default
3. Click the **Workflows to Execute** dropdown
4. Select all the workflows you want to run in parallel
5. Toggle **Pass Input Data** if you want to send the current data to all workflows
6. Click **Execute Node** - all selected workflows run simultaneously!

![Simple Mode Example](docs/simple-mode.png)

### Manual Configuration Mode

For more control over each workflow:

1. Set **Execution Mode** to "Manual Configuration"
2. Click **Add Workflow** for each workflow
3. For each workflow configure:
   - **Workflow**: Select from dropdown
   - **Execution Name**: Optional friendly name for results
   - **Input Data**: Custom JSON data for this workflow
   - **Additional Settings**: Timeout and retry options

### Dynamic Mode - From Input Data

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

## Real-World Use Cases

### 1. Multiple AI API Calls in Parallel

Perfect for calling multiple AI services simultaneously:

**Simple Mode Setup:**
1. Create individual workflows for each AI task (Gemini, ChatGPT, Claude, etc.)
2. In Parallel Orchestrator, select all AI workflows from the dropdown
3. Execute - all AI calls happen simultaneously instead of sequentially

**Time Savings Example:**
- Sequential: 6 workflows × 3 seconds each = 18 seconds
- Parallel: All 6 workflows = ~3 seconds total
- **6x faster!**

### 2. Batch Data Processing

Process different data sources simultaneously:

**Simple Mode:**
- Select your CSV processor, API fetcher, and Database query workflows
- All three data sources are processed in parallel
- Results automatically combined based on your aggregation setting

### 3. Multi-Service Health Checks

Check multiple services at once:

**Simple Mode:**
- Select all your health check workflows
- Set Result Aggregation to "Object (Named)"
- Get instant status of all services

## Configuration Options

### Execution Modes

| Mode | Description | Best For |
|------|-------------|----------|
| **Simple** | Select workflows from dropdown | Quick parallel execution |
| **Manual** | Configure each workflow individually | Custom settings per workflow |
| **From Input** | Use workflow list from data | Dynamic/programmatic execution |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **Continue On Fail** | Boolean | true | Continue if a workflow fails |
| **Result Aggregation** | Select | array | How to combine results |

### Advanced Options (Hidden by Default)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **Max Concurrent** | Number | 0 | Limit concurrent executions (0 = unlimited) |
| **Include Metadata** | Boolean | false | Add execution timing and status |
| **Global Timeout** | Number | 300 | Maximum seconds for all workflows |

### Result Aggregation Modes

- **Array (Ordered)**: Returns results as an ordered array
- **Object (Named)**: Returns results with workflow names as keys
- **Merged**: Deep merges all results into one object
- **Individual Items**: Each result as a separate n8n item

## Output Format Examples

### Array Aggregation (Default)
```json
{
  "results": [
    {
      "success": true,
      "workflowId": "workflow_1",
      "name": "Workflow_1",
      "data": { /* workflow output */ }
    },
    {
      "success": true,
      "workflowId": "workflow_2",
      "name": "Workflow_2",
      "data": { /* workflow output */ }
    }
  ]
}
```

### Object Aggregation
```json
{
  "Workflow_1": {
    "success": true,
    "data": { /* workflow output */ }
  },
  "Workflow_2": {
    "success": true,
    "data": { /* workflow output */ }
  }
}
```

## Migration Guide (v0.1.0 → v0.2.0)

### Breaking Changes

1. **Manual Mode Workflow Field**: 
   - Old: `type: 'string'` (required typing workflow ID)
   - New: `type: 'workflowSelector'` (dropdown selection)

### How to Migrate

1. Update the node: `npm update n8n-nodes-parallel-workflows`
2. Restart n8n
3. Open existing workflows using this node
4. For Manual mode configurations:
   - Click on the workflow field
   - Select the workflow from the dropdown (instead of typing the ID)
5. Consider switching to Simple mode for easier configuration

### New Features to Try

- **Simple Mode**: Much easier for basic use cases
- **Workflow Dropdown**: No need to know workflow IDs
- **Cleaner UI**: Advanced options are now nested

## Performance Tips

1. **Use Simple Mode** when all workflows need the same input data
2. **Set Max Concurrent** if you have resource constraints
3. **Use appropriate timeouts** to prevent hanging executions
4. **Enable Continue on Fail** for non-critical workflows

## Troubleshooting

### Common Issues

**Q: The workflow dropdown is empty**
- Ensure you have workflows saved in your n8n instance
- Check that you have permission to access the workflows

**Q: Workflows aren't executing in parallel**
- Ensure your n8n instance has sufficient resources
- Check if you've set a `maxConcurrent` limit in Advanced options

**Q: Getting timeout errors**
- Increase the timeout values in Additional Settings (Manual mode)
- Or increase Global Timeout in Advanced options

**Q: Can't find Advanced options**
- Click on "Options" then "Advanced" to reveal them

## Examples

### Example 1: Simple Parallel AI Calls

```javascript
// Simple Mode Configuration:
Execution Mode: Simple
Workflows to Execute: [
  "Gemini Analysis",
  "ChatGPT Summary", 
  "Claude Review",
  "Perplexity Research"
]
Pass Input Data: ✓
```

### Example 2: Manual Configuration with Different Inputs

```javascript
// Manual Mode Configuration:
Execution Mode: Manual Configuration

Workflow 1:
- Workflow: "Process Sales Data"
- Input Data: { "quarter": "Q4", "year": 2024 }
- Timeout: 30 seconds

Workflow 2:
- Workflow: "Generate Report"
- Input Data: { "format": "PDF", "template": "executive" }
- Timeout: 60 seconds
```

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

## Roadmap

- [ ] Dynamic workflow input mapping
- [ ] Visual progress indicators
- [ ] Workflow dependency management
- [ ] Built-in workflow templates
- [ ] Performance analytics

## License

MIT - See [LICENSE](LICENSE) file

## Support

- **Issues**: [GitHub Issues](https://github.com/jezweb/n8n-nodes-parallel-workflows/issues)
- **Author**: Jez Dawes
- **Email**: jeremy@jezweb.net
- **Company**: [Jezweb](https://www.jezweb.com.au)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

### Latest Version (0.2.0)
- Workflow selector dropdown for easy workflow selection
- New Simple mode as default
- Improved UI with nested advanced options
- Better error messages and descriptions

---

*Built with ❤️ for the n8n community*