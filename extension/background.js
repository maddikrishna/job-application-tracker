// Background service worker for LinkedIn Job Application Tracker
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Job Application Tracker extension installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeJobs') {
    // Inject content script to scrape jobs
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      function: scrapeLinkedInJobs
    }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});

// Function to scrape LinkedIn jobs (will be injected into the page)
function scrapeLinkedInJobs() {
  console.log('Starting LinkedIn job scraping...');
  
  // Wait for content to load
  setTimeout(() => {
    const jobs = [];
    
    // Try different selectors for job cards
    const jobSelectors = [
      '.job-card-container',
      '.job-card-list__entity',
      '[data-job-id]',
      '.job-card'
    ];
    
    let jobElements = [];
    for (const selector of jobSelectors) {
      jobElements = document.querySelectorAll(selector);
      if (jobElements.length > 0) break;
    }
    
    console.log(`Found ${jobElements.length} job elements`);
    
    jobElements.forEach((jobElement, index) => {
      try {
        // Extract job information
        const jobTitle = jobElement.querySelector('h3, .job-card-list__title, .job-card-container__job-title')?.textContent?.trim();
        const companyName = jobElement.querySelector('.job-card-container__company-name, .job-card-container__subtitle')?.textContent?.trim();
        const location = jobElement.querySelector('.job-card-container__metadata-item, .job-card-container__location')?.textContent?.trim();
        const jobLink = jobElement.querySelector('a')?.href;
        const appliedDate = jobElement.querySelector('.job-card-container__footer-item, .job-card-container__applied-date')?.textContent?.trim();
        
        if (jobTitle) {
          jobs.push({
            id: index,
            jobTitle: jobTitle,
            companyName: companyName || 'Unknown Company',
            location: location || '',
            jobLink: jobLink || '',
            appliedDate: appliedDate || new Date().toISOString(),
            source: 'linkedin',
            scrapedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error extracting job data:', error);
      }
    });
    
    console.log('Scraped jobs:', jobs);
    
    // Send data to your backend
    if (jobs.length > 0) {
      fetch('https://v0-job-application-tracker-drab.vercel.app/api/linkedin-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'extension-user', // You'll need to implement user identification
          applicationData: jobs,
          source: 'linkedin-extension'
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Successfully sent jobs to backend:', data);
        // Show success message
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px;
          border-radius: 5px;
          z-index: 10000;
          font-family: Arial, sans-serif;
        `;
        notification.textContent = `✅ Successfully tracked ${jobs.length} job applications!`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      })
      .catch(error => {
        console.error('Error sending jobs to backend:', error);
        // Show error message
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f44336;
          color: white;
          padding: 15px;
          border-radius: 5px;
          z-index: 10000;
          font-family: Arial, sans-serif;
        `;
        notification.textContent = '❌ Error tracking job applications. Please try again.';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      });
    } else {
      console.log('No jobs found to scrape');
    }
  }, 2000); // Wait 2 seconds for content to load
} 