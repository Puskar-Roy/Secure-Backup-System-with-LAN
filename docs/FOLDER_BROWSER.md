# Folder Browser Feature

## Overview
Added a graphical folder browser to the admin panel for easy storage location selection.

## How to Use

1. **Open Admin Panel**: Navigate to http://localhost:8080/admin
2. **Go to Storage Tab**: Click on "Storage Configuration"
3. **Click Browse Button**: Next to "Add New Storage Location" input field
4. **Select Drive**: Choose from available drives (Windows: C:, D:, etc. | Linux: /, /home, /media, /mnt)
5. **Navigate Folders**: Click on folders to browse into them
6. **Use Breadcrumb**: Click on breadcrumb items to go back to parent folders
7. **Select Folder**: Click "Select This Folder" button when you've found your desired location
8. **Add Storage**: The path will be populated in the input field, then click "Add Storage"

## Features

✅ **Drive Selection**: Shows all available drives on your system
✅ **Folder Navigation**: Click folders to navigate into them
✅ **Breadcrumb Navigation**: Easy navigation back to parent folders
✅ **Current Path Display**: Shows currently selected path
✅ **Cross-Platform**: Works on Windows (C:\, D:\) and Linux (/home, /media)
✅ **Clean UI**: Modal-based design that matches admin panel style
✅ **No Empty Folders**: Only shows folders that actually exist

## API Endpoints

### GET /api/get-drives
Returns available drives on the system.

**Response:**
```json
[
  { "name": "C:", "path": "C:\\" },
  { "name": "D:", "path": "D:\\" }
]
```

### GET /api/browse-folders?path=/some/path
Lists folders at the given path.

**Response:**
```json
{
  "currentPath": "/home/user/documents",
  "parentPath": "/home/user",
  "folders": [
    { "name": "work", "path": "/home/user/documents/work" },
    { "name": "personal", "path": "/home/user/documents/personal" }
  ]
}
```

## Files Modified

1. **routes/filesystem.js** (NEW): Backend API routes for filesystem browsing
2. **server.js**: Added filesystem routes
3. **views/admin.ejs**: Added folder browser modal UI and JavaScript functions

## Security

- ✅ Path normalization prevents directory traversal attacks
- ✅ Hidden folders (starting with .) are filtered out
- ✅ Only directories are shown (no files)
- ✅ Proper error handling for inaccessible folders
- ✅ Authentication required (must be logged in)

## Technical Details

### Modal Components
- **Header**: Title and close button
- **Body**: Drive selection grid OR folder list with breadcrumb
- **Footer**: Selected path display and select button

### JavaScript Functions
- `openFolderBrowser()`: Opens modal and loads drives
- `closeFolderBrowser()`: Closes modal
- `loadDrives()`: Fetches and displays available drives
- `browseFolders(path)`: Navigates to folder and shows contents
- `updateBreadcrumb(path)`: Updates breadcrumb navigation
- `selectCurrentFolder()`: Populates input with selected path

### Styling
- Modal overlay with centered content
- Responsive grid for drives
- List view for folders
- Hover effects for better UX
- Clean, modern design matching admin panel

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Future Enhancements (Optional)

- Search within current folder
- Keyboard shortcuts (Enter to select, Escape to close)
- Show folder size/info
- Create new folder from browser
- Recently used paths
- Favorite/bookmarked paths
