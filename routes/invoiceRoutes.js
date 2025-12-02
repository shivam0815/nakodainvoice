const express = require('express');
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const Handlebars = require('handlebars');

const router = express.Router();

// template
const templateHtml = fs.readFileSync(
  path.join(__dirname, '..', 'views', 'nakodaInvoice.html'),
  'utf8'
);
const template = Handlebars.compile(templateHtml);

// logo
const logoBuffer = fs.readFileSync(
  path.join(__dirname, '..', 'views', 'assets', 'logo.png')
);
const logoBase64 = logoBuffer.toString('base64');

router.post('/generate', async (req, res) => {
  try {
    const invoiceData = req.body;

    const html = template({
      ...invoiceData,
      logoBase64,
    });

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
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
        left: '10mm',
      },
    });

    await browser.close();

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
