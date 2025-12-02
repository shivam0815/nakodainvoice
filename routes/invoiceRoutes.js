const express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');

const router = express.Router();

// ------------------------------
// Load & compile invoice template once
// ------------------------------
const templateHtml = fs.readFileSync(
  path.join(__dirname, '..', 'views', 'nakodaInvoice.html'),
  'utf8'
);
const template = Handlebars.compile(templateHtml);

// ------------------------------
// Read logo image & convert to Base64
// ------------------------------
const logoBuffer = fs.readFileSync(
  path.join(__dirname, '..', 'views', 'assets', 'logo.png')
);
const logoBase64 = logoBuffer.toString('base64');

// ------------------------------
// Generate Invoice PDF
// ------------------------------
router.post('/generate', async (req, res) => {
  try {
    const invoiceData = req.body;

    // inject logo into invoice template
    const html = template({
      ...invoiceData,
      logoBase64
    });

    // launch puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
    });

    await browser.close();

    // return pdf for download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF GENERATION ERROR:', err);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
});

module.exports = router;
