import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
  NodeOperationError,
  NodeConnectionType,
  ILoadOptionsFunctions,
  INodeListSearchResult,
  INodeListSearchItems,
} from 'n8n-workflow';

export class ParallelWorkflowOrchestrator implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Parallel Workflow Orchestrator',
    name: 'parallelWorkflowOrchestrator',
    icon: 'fa:project-diagram',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["executionMode"]}}',
    description: 'Execute multiple workflows in parallel and aggregate results',
    defaults: {
      name: 'Parallel Workflow Orchestrator',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'n8nApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: '',
        name: 'notice',
        type: 'notice',
        default: '⚠️ Requires n8n API credentials. Create an API key in Settings → n8n API. Select workflows to execute them in parallel for better performance.',
      },
      {
        displayName: 'Execution Mode',
        name: 'executionMode',
        type: 'options',
        options: [
          {
            name: 'Simple (Select Workflows)',
            value: 'simple',
            description: 'Select workflows from dropdown - easiest to use',
          },
          {
            name: 'Manual Configuration',
            value: 'manual',
            description: 'Configure each workflow with custom settings',
          },
          {
            name: 'From Input Data',
            value: 'fromInput',
            description: 'Use workflow list from input data',
          },
        ],
        default: 'simple',
        noDataExpression: true,
      },
      // Simple mode - just select workflows
      {
        displayName: 'Workflows to Execute',
        name: 'simpleWorkflows',
        type: 'workflowSelector',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            executionMode: ['simple'],
          },
        },
        default: [],
        required: true,
        description: 'Select the workflows to execute in parallel',
      },
      {
        displayName: 'Pass Input Data to Workflows',
        name: 'passInputData',
        type: 'boolean',
        displayOptions: {
          show: {
            executionMode: ['simple'],
          },
        },
        default: true,
        description: 'Whether to pass the current input data to all workflows',
      },
      // Manual mode - detailed configuration
      {
        displayName: 'Workflow Executions',
        name: 'workflowExecutions',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
          multipleValueButtonText: 'Add Workflow',
        },
        displayOptions: {
          show: {
            executionMode: ['manual'],
          },
        },
        default: {},
        placeholder: 'Add Workflow',
        options: [
          {
            displayName: 'Workflow',
            name: 'workflowValues',
            values: [
              {
                displayName: 'Workflow',
                name: 'workflowId',
                type: 'workflowSelector',
                default: '',
                required: true,
                description: 'Select the workflow to execute',
              },
              {
                displayName: 'Execution Name',
                name: 'executionName',
                type: 'string',
                default: '',
                placeholder: 'e.g., Sales Analysis',
                description: 'Optional name to identify this execution in the results',
              },
              {
                displayName: 'Input Data',
                name: 'inputData',
                type: 'json',
                default: '{}',
                description: 'JSON data to pass to the workflow',
                typeOptions: {
                  rows: 4,
                },
              },
              {
                displayName: 'Additional Settings',
                name: 'additionalSettings',
                type: 'collection',
                placeholder: 'Add Setting',
                default: {},
                options: [
                  {
                    displayName: 'Timeout (seconds)',
                    name: 'timeout',
                    type: 'number',
                    default: 60,
                    description: 'Maximum time to wait for this workflow',
                    typeOptions: {
                      minValue: 1,
                    },
                  },
                  {
                    displayName: 'Retry Count',
                    name: 'retryCount',
                    type: 'number',
                    default: 0,
                    description: 'Number of times to retry on failure',
                    typeOptions: {
                      minValue: 0,
                      maxValue: 5,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      // From input mode
      {
        displayName: 'Workflows Field',
        name: 'workflowsField',
        type: 'string',
        displayOptions: {
          show: {
            executionMode: ['fromInput'],
          },
        },
        default: 'workflows',
        required: true,
        placeholder: 'workflows',
        description: 'Name of the field containing workflow configurations in input data',
        hint: 'Input should be an array of workflow configurations with workflowId and optional inputData',
      },
      // Common Options
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {
          continueOnFail: true,
          resultAggregation: 'array',
        },
        options: [
          {
            displayName: 'Continue On Fail',
            name: 'continueOnFail',
            type: 'boolean',
            default: true,
            description: 'Whether to continue executing other workflows if one fails',
          },
          {
            displayName: 'Result Aggregation',
            name: 'resultAggregation',
            type: 'options',
            options: [
              {
                name: 'Array (Ordered)',
                value: 'array',
                description: 'Return results as an ordered array',
              },
              {
                name: 'Object (Named)',
                value: 'object',
                description: 'Return results as an object with workflow names as keys',
              },
              {
                name: 'Merged',
                value: 'merged',
                description: 'Merge all results into a single object',
              },
              {
                name: 'Individual Items',
                value: 'items',
                description: 'Return each result as a separate item',
              },
            ],
            default: 'array',
            description: 'How to combine the results from all workflows',
          },
          {
            displayName: 'Advanced',
            name: 'advanced',
            type: 'collection',
            placeholder: 'Add Advanced Option',
            default: {},
            options: [
              {
                displayName: 'Max Concurrent',
                name: 'maxConcurrent',
                type: 'number',
                default: 0,
                description: 'Maximum number of workflows to execute simultaneously. 0 for unlimited.',
                typeOptions: {
                  minValue: 0,
                },
                hint: 'Limit this if you have resource constraints',
              },
              {
                displayName: 'Include Execution Metadata',
                name: 'includeMetadata',
                type: 'boolean',
                default: false,
                description: 'Whether to include execution time and status in results',
              },
              {
                displayName: 'Global Timeout (seconds)',
                name: 'globalTimeout',
                type: 'number',
                default: 300,
                description: 'Maximum time to wait for all workflows to complete',
                typeOptions: {
                  minValue: 1,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  methods = {
    listSearch: {
      async searchWorkflows(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
        // This method would be called to populate the workflow selector
        // In a real implementation, this would fetch the list of workflows
        // For now, returning a placeholder
        return {
          results: [] as INodeListSearchItems[],
        };
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const executionMode = this.getNodeParameter('executionMode', 0) as string;
    
    // Helper function to execute workflow via API
    const executeWorkflowViaApi = async (
      workflowId: string, 
      inputData: IDataObject
    ): Promise<IDataObject> => {
      // Get API credentials
      const credentials = await this.getCredentials('n8nApi');
      
      if (!credentials) {
        throw new NodeOperationError(
          this.getNode(),
          'n8n API credentials are required. Please configure them in the node settings.'
        );
      }
      
      const apiKey = credentials.apiKey as string;
      const baseUrl = (credentials.baseUrl as string).replace(/\/$/, ''); // Remove trailing slash if present
      
      // Prepare the request options
      const options = {
        method: 'POST' as const,
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        url: `${baseUrl}/api/v1/workflows/${workflowId}/activate`,
        body: {
          workflowData: inputData,
        },
        json: true
      };
      
      try {
        // Execute the workflow via API
        const response = await this.helpers.httpRequest(options);
        
        // Return the execution response
        return {
          executionId: response.id || `exec_${Date.now()}`,
          workflowId,
          status: 'started',
          mode: response.mode || 'trigger',
          startedAt: response.startedAt || new Date().toISOString(),
          workflowData: response.workflowData || {},
          data: inputData,
        };
      } catch (error: any) {
        // Handle specific error cases
        if (error.statusCode === 401) {
          throw new NodeOperationError(
            this.getNode(),
            'Invalid API key. Please check your n8n API credentials.'
          );
        } else if (error.statusCode === 404) {
          throw new NodeOperationError(
            this.getNode(),
            `Workflow with ID "${workflowId}" not found. Please check the workflow ID.`
          );
        } else if (error.statusCode === 400) {
          throw new NodeOperationError(
            this.getNode(),
            `Bad request for workflow "${workflowId}": ${error.message}`
          );
        }
        
        // Generic error
        throw new NodeOperationError(
          this.getNode(),
          `Failed to execute workflow "${workflowId}": ${error.message || 'Unknown error'}`
        );
      }
    };
    const options = this.getNodeParameter('options', 0) as IDataObject;
    const advanced = (options.advanced as IDataObject) || {};
    
    const continueOnFail = options.continueOnFail !== false;
    const resultAggregation = (options.resultAggregation as string) || 'array';
    const maxConcurrent = (advanced.maxConcurrent as number) || 0;
    const includeMetadata = advanced.includeMetadata === true;
    const globalTimeout = ((advanced.globalTimeout as number) || 300) * 1000;

    let workflowConfigs: any[] = [];

    // Get workflow configurations based on execution mode
    if (executionMode === 'simple') {
      // Simple mode - just workflow IDs with same input data
      const simpleWorkflows = this.getNodeParameter('simpleWorkflows', 0) as string[];
      const passInputData = this.getNodeParameter('passInputData', 0) as boolean;
      
      workflowConfigs = simpleWorkflows.map((workflowId, index) => ({
        workflowId,
        executionName: `Workflow_${index + 1}`,
        inputData: passInputData ? items[0]?.json || {} : {},
        timeout: 60,
        retryCount: 0,
      }));
    } else if (executionMode === 'manual') {
      // Manual mode with detailed configuration
      const workflowExecutions = this.getNodeParameter('workflowExecutions', 0) as any;
      const workflows = workflowExecutions.workflowValues || [];
      
      workflowConfigs = workflows.map((workflow: any) => {
        const additionalSettings = workflow.additionalSettings || {};
        return {
          workflowId: workflow.workflowId,
          executionName: workflow.executionName || workflow.workflowId,
          inputData: workflow.inputData,
          timeout: additionalSettings.timeout || 60,
          retryCount: additionalSettings.retryCount || 0,
        };
      });
    } else {
      // From input data
      const workflowsField = this.getNodeParameter('workflowsField', 0) as string;
      
      for (const item of items) {
        const workflows = item.json[workflowsField];
        if (Array.isArray(workflows)) {
          workflowConfigs.push(...workflows);
        } else if (workflows) {
          workflowConfigs.push(workflows);
        }
      }
    }

    if (workflowConfigs.length === 0) {
      throw new NodeOperationError(this.getNode(), 'No workflows configured for execution');
    }

    // Prepare execution promises
    const executeWorkflow = async (config: any, index: number) => {
      const startTime = Date.now();
      const executionName = config.executionName || config.name || `Workflow_${index + 1}`;
      
      try {
        // Parse input data if it's a string
        let inputData = config.inputData;
        if (typeof inputData === 'string') {
          try {
            inputData = JSON.parse(inputData);
          } catch (e) {
            inputData = { data: inputData };
          }
        }

        // Set up timeout
        const timeout = (config.timeout || 60) * 1000;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Workflow timeout after ${config.timeout || 60} seconds`)), timeout);
        });

        // Execute workflow with timeout
        const executionPromise = executeWorkflowViaApi(config.workflowId, inputData);
        const result = await Promise.race([executionPromise, timeoutPromise]);

        const executionResult: IDataObject = {
          success: true,
          workflowId: config.workflowId,
          name: executionName,
          data: result as IDataObject,
        };

        if (includeMetadata) {
          executionResult.executionTime = Date.now() - startTime;
          executionResult.timestamp = new Date().toISOString();
        }

        return executionResult;
      } catch (error: any) {
        const executionResult: IDataObject = {
          success: false,
          workflowId: config.workflowId,
          name: executionName,
          error: error.message || 'Unknown error',
        };

        if (includeMetadata) {
          executionResult.executionTime = Date.now() - startTime;
          executionResult.timestamp = new Date().toISOString();
        }

        if (!continueOnFail) {
          throw error;
        }

        return executionResult;
      }
    };

    // Execute with retry logic
    const executeWithRetry = async (config: any, index: number) => {
      const retryCount = config.retryCount || 0;
      let lastError;
      
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          return await executeWorkflow(config, index);
        } catch (error) {
          lastError = error;
          if (attempt < retryCount) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }
      
      throw lastError;
    };

    // Handle concurrency limits
    let results: IDataObject[];
    
    if (maxConcurrent > 0 && workflowConfigs.length > maxConcurrent) {
      // Execute in batches
      results = [];
      for (let i = 0; i < workflowConfigs.length; i += maxConcurrent) {
        const batch = workflowConfigs.slice(i, i + maxConcurrent);
        const batchPromises = batch.map((config, index) => 
          executeWithRetry(config, i + index)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
    } else {
      // Execute all in parallel
      const allPromises = workflowConfigs.map((config, index) => 
        executeWithRetry(config, index)
      );

      // Add global timeout
      const globalTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Global timeout exceeded')), globalTimeout);
      });

      try {
        results = await Promise.race([
          Promise.all(allPromises),
          globalTimeoutPromise,
        ]) as IDataObject[];
      } catch (error: any) {
        if (error.message === 'Global timeout exceeded') {
          throw new NodeOperationError(this.getNode(), `Global timeout of ${globalTimeout / 1000} seconds exceeded`);
        }
        throw error;
      }
    }

    // Aggregate results based on configuration
    let returnData: INodeExecutionData[] = [];

    switch (resultAggregation) {
      case 'array':
        returnData = [{ json: { results } }];
        break;
        
      case 'object':
        const resultObject: IDataObject = {};
        for (const result of results) {
          resultObject[result.name as string] = result;
        }
        returnData = [{ json: resultObject }];
        break;
        
      case 'merged':
        const mergedResult: IDataObject = {};
        for (const result of results) {
          if (result.success && result.data) {
            Object.assign(mergedResult, result.data);
          }
        }
        returnData = [{ json: mergedResult }];
        break;
        
      case 'items':
        returnData = results.map(result => ({ json: result }));
        break;
        
      default:
        returnData = [{ json: { results } }];
    }

    // Add summary if metadata is included
    if (includeMetadata && resultAggregation !== 'items') {
      const summary = {
        totalExecutions: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalTime: results.reduce((sum, r) => sum + (r.executionTime as number || 0), 0),
      };
      
      returnData[0].json.summary = summary;
    }

    return [returnData];
  }

}