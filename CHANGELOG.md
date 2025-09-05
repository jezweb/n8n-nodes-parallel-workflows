# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2025-09-06

### Fixed
- **CRITICAL BUILD FIX**: Fixed missing credentials file in dist folder
- Added credentials folder to TypeScript compilation config
- Package now loads correctly in n8n

## [0.2.1] - 2025-09-06

### Fixed
- **CRITICAL**: Workflows now actually execute! Previous versions only simulated execution
- Implemented real workflow execution using n8n REST API

### Added
- n8n API credential type for secure API key storage
- Proper error handling for API failures (401, 404, 400 errors)
- Clear setup instructions for API configuration
- Prerequisites section in documentation

### Changed
- Node now requires n8n API credentials to function
- Updated notice to inform users about API requirement

## [0.2.0] - 2025-09-05

### Added
- **Workflow Selector Dropdown**: Changed from text input to `workflowSelector` type for easy workflow selection
- **Simple Mode**: New default mode that just requires selecting workflows from a dropdown
- **Improved UI**: Added helpful notice at the top, reorganized options for better usability
- **Nested Advanced Options**: Hidden complexity under collapsible sections

### Changed
- **BREAKING**: Changed workflow configuration structure - manual mode now uses `workflowSelector` instead of string input
- Default execution mode is now 'simple' instead of 'manual'
- Improved field descriptions and placeholders throughout
- Reorganized options into logical groups with better defaults

### Improved
- User experience significantly enhanced - no need to know workflow IDs
- Cleaner interface with advanced options hidden by default
- Better error messages and hints

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