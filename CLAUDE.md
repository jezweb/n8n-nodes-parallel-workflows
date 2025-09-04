# CLAUDE.md - Project Context

## Project: n8n-nodes-parallel-workflows

### Purpose
Create an n8n community node that enables true parallel execution of multiple workflows, overcoming n8n's sequential execution model.

### Problem Context
- User needs to execute multiple workflows (e.g., 6 Gemini API calls) simultaneously
- n8n's default behavior is sequential execution within branches
- Existing solutions (Split In Batches, Execute Sub-workflow) don't provide true parallelism
- Performance bottleneck when calling multiple APIs or services

### Solution
A custom n8n node called "Parallel Workflow Orchestrator" that:
- Accepts unlimited number of workflow configurations
- Executes them all in parallel using Promise.all
- Waits for all to complete
- Aggregates results in configurable formats

### Key Requirements
1. **No workflow limit** - Support any number of parallel executions
2. **Dynamic configuration** - Accept workflow list from input data or manual config
3. **Error resilience** - Continue processing even if some workflows fail
4. **Result aggregation** - Multiple output formats (array, object, merged)
5. **Resource management** - Optional concurrency limits
6. **Progress tracking** - Monitor execution status

### Technical Approach
- TypeScript implementation
- n8n node interface compliance
- Promise.all for parallel execution
- Built-in error handling with retry logic
- Configurable timeout per execution

### Project Structure
```
n8n-nodes-parallel-workflows/
├── nodes/
│   └── ParallelWorkflowOrchestrator/
│       ├── ParallelWorkflowOrchestrator.node.ts
│       └── ParallelWorkflowOrchestrator.icon.svg
├── dist/                 # Compiled output
├── package.json         # NPM configuration
├── tsconfig.json        # TypeScript config
├── ARCHITECTURE.md      # Technical documentation
├── CHANGELOG.md         # Version history
├── scratchpad.md        # Development notes
├── CLAUDE.md           # This file
└── README.md           # User documentation
```

### Current Status
- ✅ Project structure created
- ✅ Documentation framework established
- ⬜ Core node implementation
- ⬜ Testing and validation
- ⬜ Examples and usage docs

### Development Guidelines

#### Code Style
- TypeScript with strict mode
- ESLint + Prettier for formatting
- Clear comments for complex logic
- Comprehensive error messages

#### Testing Approach
- Unit tests for core logic
- Integration tests with n8n
- Performance benchmarks
- Error scenario validation

#### Documentation Standards
- User-facing README with examples
- Technical ARCHITECTURE.md
- Inline code documentation
- Version tracking in CHANGELOG.md

### Key Technical Decisions

1. **Execution Method**: Using n8n's internal helpers vs webhooks
   - Decision: Start with internal helpers for better integration
   
2. **Concurrency Control**: Unlimited vs managed
   - Decision: Optional limit with queue system
   
3. **Error Strategy**: Fail fast vs continue
   - Decision: Configurable per user preference

4. **Result Format**: Fixed vs flexible
   - Decision: Multiple aggregation strategies

### Usage Example

```javascript
// Input configuration
{
  "workflows": [
    {
      "workflowId": "workflow_1",
      "inputData": { "prompt": "Analyze data", "context": "Q4" },
      "name": "Analysis"
    },
    {
      "workflowId": "workflow_2", 
      "inputData": { "prompt": "Generate report", "format": "PDF" },
      "name": "Report"
    }
    // ... more workflows
  ]
}

// Node executes all in parallel
// Returns aggregated results
```

### Future Considerations

1. **Enhanced Features**:
   - Dependency management between workflows
   - Conditional execution based on results
   - Workflow templates for common patterns

2. **Performance**:
   - Implement p-limit for better concurrency control
   - Add caching for frequently executed workflows
   - Resource pooling for execution contexts

3. **Integration**:
   - Support for n8n queue mode
   - External orchestrator compatibility
   - Webhook callbacks for long-running workflows

### Development Commands

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Link for local testing
npm link
cd ~/.n8n/custom
npm link n8n-nodes-parallel-workflows

# Restart n8n to load new node
```

### Git Workflow

```bash
# Initial commit
git init
git add .
git commit -m "Initial project structure for parallel workflow orchestrator"

# Feature development
git add .
git commit -m "Add ParallelWorkflowOrchestrator node implementation"

# Documentation updates
git add .
git commit -m "Update documentation and examples"
```

### Publishing Checklist

- [ ] Code complete and tested
- [ ] Documentation updated
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Examples created
- [ ] README.md with installation instructions
- [ ] Tagged release in git
- [ ] Published to npm

### Support & Maintenance

- GitHub Issues for bug reports
- Pull requests welcome
- Semantic versioning for releases
- Regular updates for n8n compatibility

### Contact

- Author: Jez Dawes
- Email: jeremy@jezweb.net
- Company: Jezweb

---

*This document provides context for AI assistants and developers working on this project.*
*Last Updated: 2025-09-04*