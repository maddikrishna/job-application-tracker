# LinkedIn Job Application Tracker Extension

This Chrome extension automatically tracks your LinkedIn job applications and syncs them with your job application tracker.

## Features

- 🔍 **Automatic Job Scraping**: Scrapes job applications from LinkedIn's "My Jobs" and "Applied Jobs" pages
- 🤖 **AI-Powered Tracking**: Sends scraped data to your backend for AI processing
- 📊 **Real-time Sync**: Instantly syncs with your job tracker dashboard
- 🎯 **Smart Detection**: Automatically detects when you're on LinkedIn jobs pages
- 🔔 **Visual Notifications**: Shows success/error notifications on the page

## Installation

### 1. Download the Extension
- Download or clone this extension folder to your computer

### 2. Create Icons (Required)
You need to create three PNG icon files:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels) 
- `icons/icon128.png` (128x128 pixels)

You can use any icon creation tool or download free icons from sites like:
- [Flaticon](https://www.flaticon.com/)
- [Icons8](https://icons8.com/)
- [Feather Icons](https://feathericons.com/)

### 3. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension should now appear in your extensions list

## Usage

### 1. Navigate to LinkedIn Jobs
- Go to LinkedIn and navigate to your jobs page:
  - `https://www.linkedin.com/my-items/saved-jobs/`
  - `https://www.linkedin.com/my-items/applied-jobs/`
  - Or any LinkedIn jobs page

### 2. Use the Extension
- Click the extension icon in your Chrome toolbar
- The popup will show the current status
- Click "Track Job Applications" to start scraping
- The extension will automatically detect and scrape job data

### 3. View Results
- Click "Open Dashboard" to view your tracked applications
- Check your job tracker dashboard for the new applications

## How It Works

1. **Content Detection**: The extension automatically detects when you're on LinkedIn jobs pages
2. **Data Scraping**: Uses multiple selectors to extract job information (title, company, location, etc.)
3. **Data Processing**: Sends scraped data to your backend API endpoint
4. **AI Integration**: Your backend processes the data with AI and stores it in your database
5. **Real-time Sync**: Applications appear in your dashboard immediately

## Technical Details

### Files Structure
```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Content script (runs on LinkedIn pages)
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### API Endpoint
The extension sends data to:
```
POST https://v0-job-application-tracker-drab.vercel.app/api/linkedin-webhook
```

### Data Format
```json
{
  "userId": "extension-user",
  "applicationData": [
    {
      "id": 0,
      "jobTitle": "Software Engineer",
      "companyName": "Tech Company",
      "location": "San Francisco, CA",
      "jobLink": "https://linkedin.com/jobs/view/...",
      "appliedDate": "2024-01-15T10:30:00Z",
      "source": "linkedin",
      "scrapedAt": "2024-01-15T10:30:00Z",
      "pageUrl": "https://linkedin.com/my-items/applied-jobs/"
    }
  ],
  "source": "linkedin-extension",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

### Extension Not Working
1. Make sure you're on a LinkedIn jobs page
2. Refresh the page and try again
3. Check the browser console for errors
4. Ensure the extension is enabled

### No Jobs Found
1. LinkedIn's page structure may have changed
2. Try scrolling down to load more jobs
3. Check if you're on the correct LinkedIn page
4. The extension uses multiple selectors to find jobs

### API Errors
1. Check your backend API endpoint is working
2. Verify the extension has permission to access your domain
3. Check the network tab for failed requests

## Security Notes

- The extension only accesses LinkedIn jobs pages
- No sensitive data is stored locally
- All data is sent securely to your backend
- The extension respects LinkedIn's terms of service

## Development

To modify the extension:
1. Edit the files in the `extension` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are present and correctly named
3. Ensure icons are proper PNG files
4. Check that your backend API is accessible

## License

This extension is provided as-is for educational and development purposes. 