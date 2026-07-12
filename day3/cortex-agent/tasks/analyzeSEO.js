const puppeteer = require('puppeteer');

/**
 * SEO Analyzer Task
 * Navigates to a URL and performs comprehensive SEO analysis including:
 * - Meta tags (title, description, keywords)
 * - Heading structure (H1-H6)
 * - Image alt text
 * - Link analysis
 * - Page load performance
 * - Mobile responsiveness indicators
 */
async function analyzeSEO(url, logCallback) {
  logCallback('Launching headless Chrome browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    logCallback(`Navigating to ${url}...`);
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    const pageTitle = await page.title();
    logCallback(`Page loaded: "${pageTitle}". Analyzing SEO factors...`);

    // Perform comprehensive SEO analysis
    const seoData = await page.evaluate(() => {
      const analysis = {
        title: document.title,
        titleLength: document.title.length,
        meta: {},
        headings: [],
        images: [],
        links: [],
        performance: {},
        mobile: {}
      };

      // Meta tags
      const metaDesc = document.querySelector('meta[name="description"]');
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      const metaViewport = document.querySelector('meta[name="viewport"]');
      const canonical = document.querySelector('link[rel="canonical"]');
      const robots = document.querySelector('meta[name="robots"]');

      analysis.meta = {
        description: metaDesc ? metaDesc.getAttribute('content') : 'Missing',
        descriptionLength: metaDesc ? metaDesc.getAttribute('content').length : 0,
        keywords: metaKeywords ? metaKeywords.getAttribute('content') : 'Missing',
        viewport: metaViewport ? metaViewport.getAttribute('content') : 'Missing',
        canonical: canonical ? canonical.getAttribute('href') : 'Missing',
        robots: robots ? robots.getAttribute('content') : 'Not set'
      };

      // Heading structure
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
        analysis.headings.push({
          tag: h.tagName,
          text: h.innerText.trim().substring(0, 100)
        });
      });

      const h1Count = document.querySelectorAll('h1').length;
      analysis.headingStructure = {
        h1Count: h1Count,
        h1Status: h1Count === 1 ? 'Good' : h1Count === 0 ? 'Missing' : 'Multiple H1s',
        totalHeadings: analysis.headings.length
      };

      // Images
      const images = document.querySelectorAll('img');
      let imagesWithAlt = 0;
      images.forEach(img => {
        const hasAlt = img.alt && img.alt.trim() !== '';
        if (hasAlt) imagesWithAlt++;
        analysis.images.push({
          src: img.src.substring(0, 100),
          hasAlt: hasAlt,
          alt: img.alt || 'Missing'
        });
      });

      analysis.imageAnalysis = {
        total: images.length,
        withAlt: imagesWithAlt,
        withoutAlt: images.length - imagesWithAlt,
        altPercentage: images.length > 0 ? Math.round((imagesWithAlt / images.length) * 100) : 0
      };

      // Links
      const links = document.querySelectorAll('a[href]');
      let internalLinks = 0;
      let externalLinks = 0;
      const currentDomain = window.location.hostname;

      links.forEach(link => {
        const href = link.href;
        const isInternal = href.includes(currentDomain);
        if (isInternal) internalLinks++;
        else externalLinks++;
        
        analysis.links.push({
          text: link.innerText.trim().substring(0, 50),
          url: href.substring(0, 100),
          isInternal: isInternal
        });
      });

      analysis.linkAnalysis = {
        total: links.length,
        internal: internalLinks,
        external: externalLinks
      };

      // Content analysis
      const bodyText = document.body.innerText;
      analysis.contentAnalysis = {
        wordCount: bodyText.split(/\s+/).length,
        characterCount: bodyText.length
      };

      return analysis;
    });

    // Calculate SEO score
    const seoScore = calculateSEOScore(seoData);
    seoData.seoScore = seoScore;
    seoData.loadTime = loadTime;

    logCallback(`SEO Analysis complete. Score: ${seoScore}/100`);
    logCallback(`Page load time: ${loadTime}ms`);

    // Take a screenshot as proof
    const filename = `screenshots/seo_${Date.now()}.png`;
    logCallback('Capturing screenshot as proof...');
    await page.screenshot({ path: filename, fullPage: false });

    logCallback('Done! SEO analysis complete.');

    return {
      type: 'seo',
      url: url,
      pageTitle: pageTitle,
      screenshot: '/' + filename,
      data: seoData
    };

  } finally {
    await browser.close();
  }
}

function calculateSEOScore(data) {
  let score = 0;
  const maxScore = 100;

  // Title (15 points)
  if (data.titleLength >= 30 && data.titleLength <= 60) score += 15;
  else if (data.titleLength > 0) score += 5;

  // Meta description (15 points)
  if (data.meta.descriptionLength >= 120 && data.meta.descriptionLength <= 160) score += 15;
  else if (data.meta.descriptionLength > 0) score += 5;

  // Heading structure (15 points)
  if (data.headingStructure.h1Count === 1) score += 15;
  else if (data.headingStructure.h1Count === 0) score += 0;
  else score += 5;

  // Image alt text (15 points)
  if (data.imageAnalysis.altPercentage === 100) score += 15;
  else if (data.imageAnalysis.altPercentage >= 80) score += 10;
  else if (data.imageAnalysis.altPercentage >= 50) score += 5;

  // Meta viewport (10 points)
  if (data.meta.viewport !== 'Missing') score += 10;

  // Canonical URL (10 points)
  if (data.meta.canonical !== 'Missing') score += 10;

  // Content length (10 points)
  if (data.contentAnalysis.wordCount >= 300) score += 10;
  else if (data.contentAnalysis.wordCount >= 100) score += 5;

  // Links (10 points)
  if (data.linkAnalysis.total >= 10) score += 10;
  else if (data.linkAnalysis.total >= 5) score += 5;

  return score;
}

module.exports = analyzeSEO;
