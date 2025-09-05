import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class N8nApi implements ICredentialType {
	name = 'n8nApi';
	displayName = 'n8n API';
	documentationUrl = 'https://docs.n8n.io/api/authentication/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { 
				password: true 
			},
			default: '',
			required: true,
			description: 'Your n8n API key. Generate one in Settings → n8n API → Create an API key',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://localhost:5678',
			required: true,
			placeholder: 'https://your-n8n.example.com',
			description: 'The base URL of your n8n instance (without trailing slash)',
		},
	];
}