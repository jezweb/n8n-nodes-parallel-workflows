import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
  NodeOperationError,
  NodeConnectionType,
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
    properties: [
      {
        displayName: 'Execution Mode',
        name: 'executionMode',
        type: 'options',
        options: [
          {
            name: 'Manual Configuration',
            value: 'manual',
            description: 'Configure workflows to execute in the node settings',
          },
          {
            name: 'From Input Data',
            value: 'fromInput',
            description: 'Use workflow configurations from input data',
          },
        ],
        default: 'manual',
        noDataExpression: true,
      },
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
                type: 'string',
                default: '',
                required: true,
                description: 'The workflow to execute. Can be name or ID.',
              },
              {
                displayName: 'Execution Name',
                name: 'executionName',
                type: 'string',
                default: '',
                description: 'Name to identify this execution in the results',
              },
              {
                displayName: 'Input Data',
                name: 'inputData',
                type: 'json',
                default: '{}',
                description: 'JSON data to pass to the workflow',
              },
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
        description: 'Name of the field containing workflow configurations in input data',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Continue On Fail',
            name: 'continueOnFail',
            type: 'boolean',
            default: true,
            description: 'Whether to continue executing other workflows if one fails',
          },
          {
            displayName: 'Max Concurrent',
            name: 'maxConcurrent',
            type: 'number',
            default: 0,
            description: 'Maximum number of workflows to execute simultaneously. 0 for unlimited.',
            typeOptions: {
              minValue: 0,
            },
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
                name: 'Object (Keyed)',
                value: 'object',
                description: 'Return results as an object with execution names as keys',
              },
              {
                name: 'Merged',
                value: 'merged',
                description: 'Deep merge all results into a single object',
              },
              {
                name: 'Individual Items',
                value: 'items',
                description: 'Return each result as a separate item',
              },
            ],
            default: 'array',
            description: 'How to aggregate the results from all workflows',
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
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const executionMode = this.getNodeParameter('executionMode', 0) as string;
    const options = this.getNodeParameter('options', 0) as IDataObject;
    
    const continueOnFail = options.continueOnFail !== false;
    const maxConcurrent = (options.maxConcurrent as number) || 0;
    const resultAggregation = (options.resultAggregation as string) || 'array';
    const includeMetadata = options.includeMetadata === true;
    const globalTimeout = ((options.globalTimeout as number) || 300) * 1000;

    let workflowConfigs: any[] = [];

    // Get workflow configurations based on execution mode
    if (executionMode === 'manual') {
      const workflowExecutions = this.getNodeParameter('workflowExecutions', 0) as any;
      workflowConfigs = workflowExecutions.workflowValues || [];
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
        const executionPromise = this.executeWorkflow(config.workflowId, inputData);
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
    if (includeMetadata) {
      const summary = {
        totalExecutions: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalTime: results.reduce((sum, r) => sum + (r.executionTime as number || 0), 0),
      };
      
      if (resultAggregation !== 'items') {
        returnData[0].json.summary = summary;
      }
    }

    return [returnData];
  }

  private async executeWorkflow(workflowId: string, inputData: IDataObject): Promise<IDataObject> {
    // This is a simplified version - in production, this would use n8n's actual API
    // or helper functions to execute workflows
    
    // For now, we'll simulate the execution
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          executionId: `exec_${Date.now()}`,
          workflowId,
          status: 'success',
          output: {
            message: `Workflow ${workflowId} executed successfully`,
            inputReceived: inputData,
          },
        });
      }, Math.random() * 2000 + 1000); // Simulate 1-3 second execution
    });
  }
}