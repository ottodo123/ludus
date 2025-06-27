// Simple static server for testing production builds locally
// This works reliably with Safari

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3001;

// Serve static files from the build directory
app.use('/ludus', express.static(path.join(__dirname, 'build')));

// Handle client-side routing
app.get('/ludus/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Redirect root to /ludus
app.get('/', (req, res) => {
  res.redirect('/ludus');
});

app.listen(PORT, () => {
  console.log(`✅ Production build server running at http://localhost:${PORT}/ludus`);
  console.log(`🌐 Safari-friendly URL: http://127.0.0.1:${PORT}/ludus`);
});