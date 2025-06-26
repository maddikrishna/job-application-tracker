// Content script for LinkedIn Job Application Tracker
console.log('LinkedIn Job Application Tracker content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeJobs') {
    scrapeJobsFromPage();
    sendResponse({ success: true });
  }
});

// Function to scrape jobs from the current page
function scrapeJobsFromPage() {
  console.log('Scraping jobs from LinkedIn page...');
  
  // Check if we're on a LinkedIn jobs page
  const currentUrl = window.location.href;
  const isJobsPage = currentUrl.includes('linkedin.com/my-items') || 
                    currentUrl.includes('linkedin.com/jobs') ||
                    currentUrl.includes('linkedin.com/my-items/saved-jobs') ||
                    currentUrl.includes('linkedin.com/my-items/applied-jobs');
  
  if (!isJobsPage) {
    console.log('Not on a LinkedIn jobs page');
    return;
  }
  
  // Wait for content to load
  setTimeout(() => {
    const jobs = [];
    
    // Try multiple selectors to find job cards
    const selectors = [
      '.job-card-container',
      '.job-card-list__entity',
      '[data-job-id]',
      '.job-card',
      '.job-search-card',
      '.job-result-card'
    ];
    
    let jobElements = [];
    for (const selector of selectors) {
      jobElements = document.querySelectorAll(selector);
      if (jobElements.length > 0) {
        console.log(`Found jobs using selector: ${selector}`);
        break;
      }
    }
    
    console.log(`Found ${jobElements.length} job elements`);
    
    jobElements.forEach((jobElement, index) => {
      try {
        // Extract job information with multiple fallback selectors
        const jobTitle = extractText(jobElement, [
          'h3',
          '.job-card-list__title',
          '.job-card-container__job-title',
          '.job-result-card__title',
          '[data-test-job-card-list__title]'
        ]);
        
        const companyName = extractText(jobElement, [
          '.job-card-container__company-name',
          '.job-card-container__subtitle',
          '.job-result-card__subtitle',
          '[data-test-job-card-list__subtitle]'
        ]);
        
        const location = extractText(jobElement, [
          '.job-card-container__metadata-item',
          '.job-card-container__location',
          '.job-result-card__location',
          '[data-test-job-card-list__location]'
        ]);
        
        const jobLink = jobElement.querySelector('a')?.href || '';
        const appliedDate = extractText(jobElement, [
          '.job-card-container__footer-item',
          '.job-card-container__applied-date',
          '.job-result-card__applied-date'
        ]);
        
        if (jobTitle) {
          jobs.push({
            id: index,
            jobTitle: jobTitle,
            companyName: companyName || 'Unknown Company',
            location: location || '',
            jobLink: jobLink,
            appliedDate: appliedDate || new Date().toISOString(),
            source: 'linkedin',
            scrapedAt: new Date().toISOString(),
            pageUrl: currentUrl
          });
        }
      } catch (error) {
        console.error('Error extracting job data:', error);
      }
    });
    
    console.log('Scraped jobs:', jobs);
    
    // Send data to backend if jobs found
    if (jobs.length > 0) {
      sendJobsToBackend(jobs);
    } else {
      console.log('No jobs found on this page');
    }
  }, 2000);
}

// Helper function to extract text with multiple selectors
function extractText(element, selectors) {
  for (const selector of selectors) {
    const found = element.querySelector(selector);
    if (found && found.textContent) {
      return found.textContent.trim();
    }
  }
  return '';
}

// Function to send scraped jobs to your backend
function sendJobsToBackend(jobs) {
  fetch('https://v0-job-application-tracker-drab.vercel.app/api/linkedin-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'extension-user', // TODO: Implement proper user identification
      applicationData: jobs,
      source: 'linkedin-extension',
      timestamp: new Date().toISOString()
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Successfully sent jobs to backend:', data);
    showNotification(`✅ Successfully tracked ${jobs.length} job applications!`, 'success');
  })
  .catch(error => {
    console.error('Error sending jobs to backend:', error);
    showNotification('❌ Error tracking job applications. Please try again.', 'error');
  });
}

// Function to show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Auto-scrape when page loads (optional)
if (window.location.href.includes('linkedin.com/my-items')) {
  console.log('Auto-scraping enabled for LinkedIn jobs page');
  // Wait a bit longer for dynamic content to load
  setTimeout(() => {
    scrapeJobsFromPage();
  }, 3000);
} 