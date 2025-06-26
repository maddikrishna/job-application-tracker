// Popup script for LinkedIn Job Application Tracker
document.addEventListener('DOMContentLoaded', function() {
  const trackButton = document.getElementById('trackButton');
  const openDashboardButton = document.getElementById('openDashboardButton');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const loading = document.getElementById('loading');

  // Check if we're on a LinkedIn page
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url;
    
    if (url && url.includes('linkedin.com')) {
      if (url.includes('my-items') || url.includes('jobs')) {
        setStatus('online', 'Ready to track jobs');
        trackButton.disabled = false;
      } else {
        setStatus('offline', 'Navigate to LinkedIn jobs page');
        trackButton.disabled = true;
      }
    } else {
      setStatus('offline', 'Not on LinkedIn');
      trackButton.disabled = true;
    }
  });

  // Track jobs button click
  trackButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      
      // Show loading state
      loading.style.display = 'block';
      trackButton.disabled = true;
      setStatus('online', 'Tracking applications...');
      
      // Send message to content script
      chrome.tabs.sendMessage(currentTab.id, { action: 'scrapeJobs' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          setStatus('offline', 'Error: Please refresh the page');
          loading.style.display = 'none';
          trackButton.disabled = false;
          return;
        }
        
        if (response && response.success) {
          setStatus('online', 'Tracking completed!');
          setTimeout(() => {
            setStatus('online', 'Ready to track jobs');
            loading.style.display = 'none';
            trackButton.disabled = false;
          }, 3000);
        } else {
          setStatus('offline', 'Failed to track jobs');
          loading.style.display = 'none';
          trackButton.disabled = false;
        }
      });
    });
  });

  // Open dashboard button click
  openDashboardButton.addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://v0-job-application-tracker-drab.vercel.app/dashboard' });
  });

  // Helper function to set status
  function setStatus(type, message) {
    statusIndicator.className = `status-indicator ${type}`;
    statusText.textContent = message;
  }
}); 