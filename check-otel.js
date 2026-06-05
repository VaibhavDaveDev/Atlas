const resources = require('@opentelemetry/resources');
console.log('Exports from @opentelemetry/resources:', Object.keys(resources));
console.log('Resource type:', typeof resources.Resource);
