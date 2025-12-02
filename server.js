const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const invoiceRoutes = require('./routes/invoiceRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// API route
app.use('/api/invoices', invoiceRoutes);
app.use(express.static('public'));

// root route
app.get('/', (req, res) => {
  res.send('Nakoda Invoice API running!');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log('Invoice server running on port', PORT);
});
