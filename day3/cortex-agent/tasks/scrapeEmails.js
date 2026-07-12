const puppeteer = require('puppeteer');

/**
 * Email Scraper Task
 * Navigates to a URL and extracts all email addresses found on the page.
 * Uses regex pattern matching to find email addresses in text content,
 * href attributes, and other common locations.
 */
async function scrapeEmails(url, logCallback) {
  logCallback('Launching headless Chrome browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    logCallback(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const pageTitle = await page.title();
    logCallback(`Page loaded: "${pageTitle}". Scanning for email addresses...`);

    // Extract emails using page evaluation
    const emails = await page.evaluate(() => {
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = new Set();

      // Check all text content
      const bodyText = document.body.innerText;
      const textMatches = bodyText.match(emailPattern);
      if (textMatches) {
        textMatches.forEach(email => foundEmails.add(email.toLowerCase()));
      }

      // Check all href attributes (mailto: links)
      document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        const email = link.getAttribute('href').replace('mailto:', '').split('?')[0];
        if (email) foundEmails.add(email.toLowerCase());
      });

      // Check input fields with email type
      document.querySelectorAll('input[type="email"]').forEach(input => {
        if (input.value) foundEmails.add(input.value.toLowerCase());
      });

      // Check data attributes that might contain emails
      document.querySelectorAll('[data-email]').forEach(el => {
        const email = el.getAttribute('data-email');
        if (email) foundEmails.add(email.toLowerCase());
      });

      return Array.from(foundEmails);
    });

    logCallback(`Found ${emails.length} unique email address(es).`);

    // Take a screenshot as proof
    const filename = `screenshots/email_${Date.now()}.png`;
    logCallback('Capturing screenshot as proof...');
    await page.screenshot({ path: filename, fullPage: false });

    logCallback('Done! Email scraping complete.');

    return {
      type: 'email',
      url: url,
      pageTitle: pageTitle,
      screenshot: '/' + filename,
      emails: emails,
      emailCount: emails.length
    };

  } finally {
    await browser.close();
  }
}

module.exports = scrapeEmails;
