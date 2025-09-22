const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for Atlassian APIs
app.use('/api/proxy', async (req, res) => {
  try {
    // Extract the target URL from the path
    const targetUrl = req.url.substring(1); // Remove leading slash
    
    console.log('Proxying request to:', targetUrl);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);

    // Forward the request to the target URL
    const headers = {
      'Authorization': req.headers.authorization,
      'Accept': req.headers.accept || 'application/json',
    };
    
    // Only add Content-Type for POST/PUT requests with a body
    if (req.method !== 'GET' && req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    // Get response data
    const data = await response.text();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    // Log response data (truncated if too long)
    if (data.length > 1000) {
      console.log('Response data (truncated):', data.substring(0, 1000) + '...');
    } else {
      console.log('Response data:', data);
    }
    
    // Forward the response
    res.status(response.status);
    res.set('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
