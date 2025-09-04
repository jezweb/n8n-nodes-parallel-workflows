# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure and configuration
- ARCHITECTURE.md documentation
- CHANGELOG.md for tracking changes
- scratchpad.md for development notes
- CLAUDE.md for project context
- TypeScript and ESLint configuration
- npm package configuration for n8n community node

### In Progress
- ParallelWorkflowOrchestrator node implementation
- Workflow execution logic
- Error handling and retry mechanisms
- Example workflows and documentation

## [0.1.0] - 2025-09-04

### Added
- Initial release of n8n-nodes-parallel-workflows
- Core ParallelWorkflowOrchestrator node
- Support for unlimited parallel workflow executions
- Multiple input modes (manual configuration and dynamic)
- Configurable concurrency limits
- Error resilience with continue-on-fail option
- Multiple result aggregation strategies
- Timeout configuration per execution
- Basic retry logic for failed executions

### Features
- **Unlimited Workflows**: No hardcoded limit on parallel executions
- **Dynamic Configuration**: Accept workflow list from input data
- **Error Handling**: Continue processing even if some workflows fail
- **Result Aggregation**: Array, object, or merged output formats
- **Resource Management**: Configurable concurrency limits
- **Progress Tracking**: Real-time execution status

### Technical
- Built with TypeScript for type safety
- Compatible with n8n v1.0.0+
- Uses Promise.all for true parallel execution
- Minimal dependencies for lightweight installation

---

## Development Log

### 2025-09-04 - Session 1
- Project initialization
- Created comprehensive architecture documentation
- Set up development environment
- Defined node structure and properties
- Planning parallel execution strategy

### Next Steps
- Implement core node class
- Add execution logic
- Create test workflows
- Write usage documentation
- Publish to npm