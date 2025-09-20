// Simple startup test without TypeScript compilation
const express = require('express');

console.log('Testing basic Express server startup...');

const app = express();
const port = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Basic server running' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Basic server started successfully on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📁 Working directory: ${process.cwd()}`);
  console.log(`🗄️ MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  
  // Exit after successful startup
  setTimeout(() => {
    console.log('✅ Startup test completed successfully');
    server.close(() => process.exit(0));
  }, 1000);
});

server.on('error', (error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
