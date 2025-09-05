# Development Scratchpad

## Version 0.4.0 - Webhook Authentication Support

### Date: 2025-09-05

## Feature: Add Authentication Support for Webhooks

### Implementation Plan

Add support for multiple authentication methods to secure webhook calls:
- Header authentication (API keys)
- Bearer token authentication
- Basic authentication
- Query parameter authentication (optional)

### Authentication Options

#### 1. Authentication Types
```typescript
options: [
  { name: 'None', value: 'none' },
  { name: 'Header Auth', value: 'header' },
  { name: 'Bearer Token', value: 'bearer' },
  { name: 'Basic Auth', value: 'basic' },
]
```

#### 2. Simple (Structured) Mode - Per Webhook Auth
Add authentication fields to each webhook configuration:
```typescript
{
  displayName: 'Authentication',
  name: 'authentication',
  type: 'options',
  default: 'none',
  options: [
    { name: 'None', value: 'none' },
    { name: 'Header Auth', value: 'header' },
    { name: 'Bearer Token', value: 'bearer' },
    { name: 'Basic Auth', value: 'basic' },
  ],
},
{
  displayName: 'Header Name',
  name: 'authHeaderName',
  type: 'string',
  default: 'X-API-Key',
  placeholder: 'e.g., X-API-Key, Authorization',
  displayOptions: {
    show: {
      authentication: ['header'],
    },
  },
  description: 'Name of the header to use for authentication',
},
{
  displayName: 'Token/Key',
  name: 'authValue',
  type: 'string',
  typeOptions: {
    password: true,
  },
  default: '',
  displayOptions: {
    show: {
      authentication: ['header', 'bearer'],
    },
  },
  description: 'The authentication token or API key',
},
{
  displayName: 'Username',
  name: 'username',
  type: 'string',
  default: '',
  displayOptions: {
    show: {
      authentication: ['basic'],
    },
  },
},
{
  displayName: 'Password',
  name: 'password',
  type: 'string',
  typeOptions: {
    password: true,
  },
  default: '',
  displayOptions: {
    show: {
      authentication: ['basic'],
    },
  },
},
```

#### 3. Global Authentication Option
Add option to use same auth for all webhooks:
```typescript
{
  displayName: 'Use Same Auth for All Webhooks',
  name: 'useGlobalAuth',
  type: 'boolean',
  default: false,
  displayOptions: {
    show: {
      executionMode: ['simple', 'simpleStructured'],
    },
  },
  description: 'Use the same authentication for all webhook calls',
},
// Global auth fields (same structure as per-webhook)
{
  displayName: 'Global Authentication',
  name: 'globalAuth',
  type: 'options',
  displayOptions: {
    show: {
      useGlobalAuth: [true],
    },
  },
  // ... same auth options
}
```

#### 4. Execution Logic Update
```typescript
const executeWorkflow = async (config: any, index: number) => {
  // ... existing code ...
  
  // Build request options
  const requestOptions: any = {
    method: 'POST' as const,
    url: config.webhookUrl,
    body: inputData,
    json: true,
    headers: {},
  };

  // Apply authentication
  const auth = config.authentication || 'none';
  
  if (auth === 'header') {
    requestOptions.headers[config.authHeaderName || 'X-API-Key'] = config.authValue;
  } else if (auth === 'bearer') {
    requestOptions.headers['Authorization'] = `Bearer ${config.authValue}`;
  } else if (auth === 'basic') {
    // Use built-in basic auth support
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    requestOptions.headers['Authorization'] = `Basic ${credentials}`;
  }

  // Execute with auth
  const executionPromise = this.helpers.httpRequest(requestOptions);
  
  // ... rest of execution logic
};
```

#### 5. Configuration Processing
```typescript
// In simpleStructured mode
workflowConfigs = webhooks.map((webhook: any, index: number) => {
  const baseConfig = {
    webhookUrl: webhook.url,
    executionName: webhook.name || `Webhook_${index + 1}`,
    inputData: passInputData ? items[0]?.json || {} : {},
    timeout: webhook.timeout || 60,
    retryCount: 0,
  };
  
  // Apply authentication
  if (useGlobalAuth) {
    // Use global auth settings
    baseConfig.authentication = globalAuth;
    baseConfig.authHeaderName = globalAuthHeaderName;
    baseConfig.authValue = globalAuthValue;
    baseConfig.username = globalUsername;
    baseConfig.password = globalPassword;
  } else if (webhook.authentication && webhook.authentication !== 'none') {
    // Use per-webhook auth
    baseConfig.authentication = webhook.authentication;
    baseConfig.authHeaderName = webhook.authHeaderName;
    baseConfig.authValue = webhook.authValue;
    baseConfig.username = webhook.username;
    baseConfig.password = webhook.password;
  }
  
  return baseConfig;
});
```

### UI/UX Considerations

1. **Security**: Mark all auth fields with `typeOptions: { password: true }` to hide sensitive data
2. **Defaults**: Default to 'none' for auth to maintain backward compatibility
3. **Validation**: Add validation for required auth fields
4. **Help Text**: Clear descriptions for each auth type

### Testing Scenarios

1. **No Authentication**: Verify existing webhooks work without auth
2. **Header Auth**: Test with custom header names and API keys
3. **Bearer Token**: Test standard Authorization: Bearer format
4. **Basic Auth**: Test with username/password combinations
5. **Global Auth**: Test applying same auth to all webhooks
6. **Mixed Auth**: Test different auth per webhook in structured mode

### Version Strategy

- **0.4.0**: Minor version bump for new feature
- Non-breaking: Existing workflows continue to work
- Future: Consider credential storage in v0.5.0

---

## Version 0.3.2 - Enhanced Simple Mode with Dynamic Webhook List

### Date: 2025-09-05

## Feature: Add "Simple (Structured)" Mode - Option B

### Decision
Add a new execution mode "Simple (Structured)" alongside the existing simple mode to maintain backward compatibility.

### Implementation Plan

#### 1. Execution Modes
```typescript
options: [
  {
    name: 'Simple (Webhooks)',
    value: 'simple',
    description: 'Paste webhook URLs - easiest to use',
  },
  {
    name: 'Simple (Structured)',  // NEW MODE
    value: 'simpleStructured',
    description: 'Add webhooks with individual settings',
  },
  {
    name: 'Manual Configuration',
    value: 'manual',
    description: 'Full control over each workflow execution',
  },
  {
    name: 'From Input Data',
    value: 'fromInput',
    description: 'Use workflow list from input data',
  },
]
```

#### 2. New Field Structure for Simple (Structured)
```typescript
{
  displayName: 'Webhooks',
  name: 'simpleWebhooks',
  type: 'fixedCollection',
  typeOptions: {
    multipleValues: true,
    multipleValueButtonText: 'Add Webhook',
  },
  displayOptions: {
    show: {
      executionMode: ['simpleStructured'],
    },
  },
  default: {},
  options: [
    {
      name: 'webhookValues',
      displayName: 'Webhook',
      values: [
        {
          displayName: 'Webhook URL',
          name: 'url',
          type: 'string',
          default: '',
          required: true,
          placeholder: 'https://your-n8n.com/webhook/abc-123',
          description: 'The webhook URL from your workflow',
        },
        {
          displayName: 'Name (Optional)',
          name: 'name',
          type: 'string',
          default: '',
          placeholder: 'e.g., Process Orders',
          description: 'Optional name to identify this webhook in results',
        },
        {
          displayName: 'Timeout (Seconds)',
          name: 'timeout',
          type: 'number',
          default: 60,
          typeOptions: {
            minValue: 1,
            maxValue: 3600,
            numberStepSize: 1,
          },
          description: 'Timeout for this webhook (default: 60 seconds)',
        },
      ],
    },
  ],
}
```

#### 3. Execution Logic Update
```typescript
// In execute() method
if (executionMode === 'simple') {
  // Keep existing multiline text logic
  const webhookUrlsRaw = this.getNodeParameter('webhookUrls', 0) as string;
  const passInputData = this.getNodeParameter('passInputData', 0) as boolean;
  
  const webhookUrls = webhookUrlsRaw
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);

  workflowConfigs = webhookUrls.map((url, index) => ({
    webhookUrl: url,
    executionName: `Webhook_${index + 1}`,
    inputData: passInputData ? items[0]?.json || {} : {},
    timeout: 60,
    retryCount: 0,
  }));
  
} else if (executionMode === 'simpleStructured') {
  // NEW: Structured simple mode
  const simpleWebhooks = this.getNodeParameter('simpleWebhooks', 0) as any;
  const webhooks = simpleWebhooks.webhookValues || [];
  const passInputData = this.getNodeParameter('passInputData', 0) as boolean;
  
  if (webhooks.length === 0) {
    throw new NodeOperationError(this.getNode(), 'No webhooks configured');
  }
  
  workflowConfigs = webhooks.map((webhook: any, index: number) => ({
    webhookUrl: webhook.url,
    executionName: webhook.name || `Webhook_${index + 1}`,
    inputData: passInputData ? items[0]?.json || {} : {},
    timeout: webhook.timeout || 60,
    retryCount: 0,
  }));
  
} else if (executionMode === 'manual') {
  // Keep existing manual mode logic
}
```

#### 4. Benefits of Option B
- **No Breaking Changes**: Existing workflows continue to work
- **User Choice**: Users can choose between quick paste (simple) or structured input
- **Gradual Migration**: Users can migrate at their own pace
- **Feature Testing**: Can gather feedback before potentially deprecating old mode

#### 5. UI Flow

**Simple (Webhooks) Mode:**
- Single multiline text field
- Quick copy/paste of multiple URLs
- Best for: Quick setup with many webhooks

**Simple (Structured) Mode:**
- "Add Webhook" button
- Individual fields for each webhook
- Optional name and timeout per webhook
- Best for: When you need to identify/customize specific webhooks

**Manual Configuration Mode:**
- Full control including input data per webhook
- Individual retry settings
- Best for: Complex scenarios with different data per webhook

#### 6. Version Strategy
- Version: 0.3.2 (non-breaking addition)
- Add deprecation notice in future if Simple (Webhooks) mode becomes redundant
- Could merge modes in v1.0.0 if one proves superior

## Testing Checklist

- [ ] Simple (Webhooks) mode still works as before
- [ ] New Simple (Structured) mode appears in dropdown
- [ ] Can add multiple webhooks with Add Webhook button
- [ ] Optional name field works correctly
- [ ] Timeout override works per webhook
- [ ] Results include webhook names when provided
- [ ] Pass Input Data toggle works in both simple modes
- [ ] Error handling for empty webhook list
- [ ] Migration from simple to structured works smoothly

## Documentation Updates

### README.md
- Add section for Simple (Structured) mode
- Show comparison table of all modes
- Add screenshots of new UI

### CHANGELOG.md
- Document as feature addition (not breaking)
- Highlight benefits of structured mode

## Future Considerations

### Phase 1 (v0.3.2)
- Implement Simple (Structured) mode
- Keep all existing modes

### Phase 2 (v0.4.x)
- Gather usage metrics/feedback
- Consider adding retry count to structured mode
- Add URL validation

### Phase 3 (v1.0.0)
- Potentially merge or remove redundant modes
- Standardize on best approach

## Implementation Notes

### Why Option B is Best
1. **Risk-Free**: No existing workflows break
2. **A/B Testing**: Can see which mode users prefer
3. **Graceful Evolution**: Natural migration path
4. **Learning Opportunity**: Understand user preferences

### Technical Considerations
- Field name `simpleWebhooks` avoids conflict with existing `webhookUrls`
- Reuse existing execution logic, just different config parsing
- Output format remains consistent across all modes

## Code Snippets Reference

### Current Simple Mode (keep as-is)
```typescript
// Multiline text input
const webhookUrls = webhookUrlsRaw.split('\n')...
```

### New Simple Structured Mode
```typescript
// Structured webhook list
const webhooks = simpleWebhooks.webhookValues || [];
webhooks.map(webhook => ({
  webhookUrl: webhook.url,
  executionName: webhook.name || `Webhook_${index + 1}`,
  timeout: webhook.timeout || 60,
  ...
}))
```

---

---

## Version 0.4.2 - Expression Support for Webhooks

### Date: 2025-09-05

## Feature: Add Expression Fields to Each Webhook

### Implementation Plan

Add expression support to pass dynamic data from input fields to each webhook:
- JSON field type for n8n expressions
- Drag-and-drop support from input schema
- Merge additional data with main input data

### Field Structure for Simple (Structured) Mode

Add to webhook values in fixedCollection:
```typescript
{
  displayName: 'Additional Data',
  name: 'additionalData',
  type: 'json',
  default: '{}',
  placeholder: 'e.g., { "key": "{{ $json.objectKey }}", "custom": "value" }',
  description: 'Additional data to send to this webhook. You can drag fields from the input panel. This data will be merged with the main input data.',
}
```

### Execution Logic Update

```typescript
// In simpleStructured mode
workflowConfigs = webhooks.map((webhook: any, index: number) => {
  let inputData = passInputData ? items[0]?.json || {} : {};
  
  // Parse and merge additional data if provided
  if (webhook.additionalData) {
    try {
      const additionalData = typeof webhook.additionalData === 'string' 
        ? JSON.parse(webhook.additionalData)
        : webhook.additionalData;
      
      // Deep merge - additional data takes precedence
      inputData = {
        ...inputData,
        ...additionalData
      };
    } catch (error) {
      // If JSON parse fails, just use original input
      console.warn(`Failed to parse additional data for webhook ${index + 1}`);
    }
  }
  
  return {
    webhookUrl: webhook.url,
    executionName: webhook.name || `Webhook_${index + 1}`,
    inputData,
    timeout: webhook.timeout || 60,
    retryCount: 0,
    // Include auth fields...
  };
});
```

### Benefits
- **Dynamic Data**: Pass different values to each webhook
- **Expression Support**: Use n8n's expression engine with {{ $json.field }}
- **Drag & Drop**: Drag fields from input schema directly
- **Override Capability**: Additional data overrides main input for conflicts

### Use Cases
1. Pass specific document keys from PDF/DOCX input to each webhook
2. Add webhook-specific metadata or flags
3. Transform data per webhook without separate nodes
4. Pass context or identifiers unique to each webhook

---

*Last Updated: 2025-09-05 - Planning v0.4.2*