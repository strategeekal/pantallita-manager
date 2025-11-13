# SCREENY Manager

**Version 1.3.0**

A web-based management interface for SCREENY RGB matrix displays. Manage ephemeral events and daily schedules remotely through GitHub, with full support for desktop and mobile devices.

![SCREENY Manager](https://img.shields.io/badge/status-active-brightgreen) ![Version](https://img.shields.io/badge/version-1.3.0-blue)

## Features

### 📅 Events Management
- **Unified Workflow**: Single "Events" tab for viewing and managing all events
- **Quick Create**: "+ NEW" button for instant access to event editor (matches schedules pattern)
- **Full-Screen Editor**: Event editor opens as dedicated view for focused editing
- Create, edit, and delete ephemeral events
- Two-line text display with customizable colors
- Event images from BMP library
- Optional time ranges (start hour to end hour)
- Real-time preview with matrix emulator (desktop) or canvas preview (mobile)
- Date-specific events with visual calendar badges
- Mobile-optimized date inputs with proper height and styling

### 🕐 Schedules Management
- Manage default daily schedules
- Create date-specific schedule overrides
- Timeline view with visual schedule bars
- Schedule items with:
  - Custom time ranges (hour and minute precision)
  - Day-of-week selection (Mon-Sun)
  - Schedule images
  - Optional progress bars
  - Enable/disable toggles
- Live preview with emulator
- Drag-and-drop item reordering

### 📋 Template System (Day-Agnostic)
- **Day-agnostic templates**: Templates store only schedule patterns (times, names, images, progress bars)
- Save any schedule as a reusable template
- Load templates into date-specific schedules (auto-inherits the date's day-of-week)
- Load templates into default schedules (assign days via existing UI)
- Template preview before loading
- Template library management
- Cleaner timeline view for templates (no day/week selector)

### 📱 Mobile Optimization
- Fully responsive design
- Touch-friendly interface
- Canvas-based pixel-perfect previews (256x128)
- Mobile-optimized forms and layouts
- Stacked footer with large touch targets
- Optimized date inputs (48px height, proper text alignment and color)
- Native mobile date pickers for better UX

### 🔍 Data Validation
- Comprehensive validation for events and schedules
- Detect old events and schedules that can be cleaned up
- Verify image references exist in correct repositories
- Validate character limits (12 chars for event lines)
- Check data correctness (dates, colors, time ranges, etc.)
- Visual error and warning reporting with detailed messages
- Accessible via footer link: "🔍 Validate Data"

### 🎨 Preview Emulators
- **Desktop**: Interactive 64x32 RGB matrix emulator
- **Mobile**: High-resolution 256x128 canvas preview
- Real-time rendering with TINYBIT bitmap font
- Bottom-aligned text with descender support
- BMP image loading from GitHub

## CSV File Formats

### Events CSV (`ephemeral_events.csv`)

**Format:**
```
YYYY-MM-DD,TopLine,BottomLine,Image,Color[,StartHour,EndHour]
```

**Fields:**
- `YYYY-MM-DD` - Event date (ISO format)
- `TopLine` - Top line text (max 12 chars)
- `BottomLine` - Bottom line text (max 12 chars)
- `Image` - BMP image filename from `img/events/` (e.g., `halloween.bmp`)
- `Color` - Color name: `MINT`, `LILAC`, `ORANGE`, `YELLOW`, `BLUE`, `WHITE`, `RED`, `GREEN`, `PINK`, `PURPLE`
- `StartHour` - Optional, hour when event becomes active (0-23)
- `EndHour` - Optional, hour when event ends (0-23)

**Example:**
```csv
2025-12-25,Merry,Christmas,tree.bmp,GREEN,0,23
2025-01-01,Happy,New Year,fireworks.bmp,YELLOW,0,12
```

### Schedules CSV (`default_schedule.csv` or `schedule_YYYY-MM-DD.csv`)

**Format:**
```
name,enabled,days,start_hour,start_min,end_hour,end_min,image,progressbar
```

**Fields:**
- `name` - Schedule item name/description
- `enabled` - `1` = enabled, `0` = disabled
- `days` - Day numbers for default schedules: `0-6` = Mon-Sun (e.g., `01234` = Mon-Fri, `56` = Sat-Sun)
  - For date-specific schedules, use empty string or `0123456`
- `start_hour` - Start hour (0-23)
- `start_min` - Start minute (0-59)
- `end_hour` - End hour (0-23)
- `end_min` - End minute (0-59)
- `image` - BMP image filename from `img/schedules/` (e.g., `go_to_school.bmp`)
- `progressbar` - `1` = show progress bar, `0` = hide

**Example:**
```csv
# default_schedule.csv
Wake Up,1,0123456,7,0,7,30,wake_up.bmp,1
Go to School,1,01234,8,0,15,0,go_to_school.bmp,1
Dinner Time,1,0123456,18,30,19,30,dinner.bmp,0
Bedtime,1,0123456,21,0,21,30,sleep.bmp,1
Weekend Fun,1,56,10,0,12,0,play.bmp,0
```

### Template CSV (`templates/NAME.csv`)

**Format:**
```
name,enabled,days,start_hour,start_min,end_hour,end_min,image,progressbar
```

**Note:** Templates are **day-agnostic** and store empty `days` field. When loaded:
- Into date-specific schedules: automatically inherits the date's day-of-week
- Into default schedules: user assigns days via the UI

**Example:**
```csv
# Template: morning-routine.csv
Wake Up,1,,7,0,7,30,wake_up.bmp,1
Breakfast,1,,7,30,8,0,breakfast.bmp,0
Get Dressed,1,,8,0,8,30,get_dressed.bmp,1
```

Templates are stored in `schedules/templates/` directory and can be loaded into any schedule type.

## GitHub Repository Structure

```
pantallita-events/                # Independent repo with files
├── ephemeral_events.csv          # Events file
├── schedules/
    ├── default_schedule.csv      # Default daily schedule
    ├── schedule_YYYY-MM-DD.csv   # Date-specific schedules
    ├── templates/
        └── NAME.csv              # Schedule templates
└── img/
    ├── events/                   # Event images (27x28 BMP)
    │   ├── halloween.bmp
    │   ├── birthday.bmp
    │   └── ...
    ├── schedules/                # Schedule images (40x28 BMP)
    │   ├── get_dressed.bmp
    │   ├── go_to_school.bmp
    │   └── ...
    └── weather/
        └── columns/              # Weather icons (3x16 BMP)
            └── 1.bmp
```

## Setup Instructions

### 1. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "SCREENY Manager")
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Generate and copy the token

### 2. Repository Setup

1. Create a GitHub repository (public or private)
2. Add the required CSV files and image directories
3. Use the token and repository info in the app

### 3. Launch the App

1. Open `index.html` in a web browser
2. Enter your GitHub credentials:
   - **Token**: Your personal access token
   - **Owner**: Your GitHub username
   - **Repository**: Repository name (e.g., `pantallita-events`)
3. Click "Get Started"

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Styling**: Pure CSS with responsive design
- **Font Rendering**: TINYBIT bitmap font
- **Image Format**: BMP (1-bit and 24-bit)
- **Storage**: GitHub repository (via GitHub API)
- **Canvas**: HTML5 Canvas 2D for mobile previews

## Project Structure

```
pantallita-manager/
├── index.html                    # Main HTML file
├── style.css                     # Global styles
├── app.js                        # Legacy entry (not actively used)
├── js/
│   ├── main.js                   # Module entry point
│   ├── core/
│   │   ├── api.js               # GitHub API integration
│   │   ├── config.js            # Configuration management
│   │   └── utils.js             # Utility functions
│   ├── events/
│   │   └── events-manager.js    # Events CRUD operations
│   ├── schedules/
│   │   ├── schedule-manager.js  # Schedule CRUD operations
│   │   ├── schedule-editor.js   # Schedule editing UI
│   │   ├── timeline.js          # Timeline view & item editor
│   │   ├── preview.js           # Desktop preview emulator
│   │   └── template-manager.js  # Template operations
│   └── ui/
│       ├── fonts.js             # TINYBIT bitmap font data
│       ├── matrix-emulator.js   # RGB matrix emulator
│       ├── rendering.js         # BMP loading & rendering
│       ├── tabs.js              # Tab navigation
│       ├── landing.js           # Landing page UI
│       └── mobile-preview.js    # Mobile preview components
└── README.md
```

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Requirements:**
- ES6 module support
- HTML5 Canvas
- Flexbox & CSS Grid
- Fetch API

## Mobile Features (v1.1.0)

### Canvas Previews
- **Events**: 256x128 pixel canvas with two-line text and images
- **Schedules**: 256x128 pixel canvas with time, weather, schedule image, and progress bar
- Pixel-perfect rendering at 4x scale
- TINYBIT font with proper character alignment (xoffset/yoffset)

### Mobile UI
- Vertical stacked footer
- Touch-friendly buttons (50px minimum height)
- Responsive forms with proper spacing
- No vertical scrolling in timeline/preview sections

## Development

### Adding New Images

1. Create BMP files:
   - **Events**: 27x28 pixels
   - **Schedules**: 40x28 pixels
   - **Weather**: 3x16 pixels
2. Upload to appropriate `img/` directory in your GitHub repo
3. Images will auto-load in the app dropdowns

### Color Palette

Available colors for event text:
- MINT (`#00FFAA`)
- LILAC (`#AA00FF`)
- ORANGE (`#FF8800`)
- YELLOW (`#FFFF00`)
- BLUE (`#0088FF`)
- WHITE (`#FFFFFF`)
- RED (`#FF0000`)
- GREEN (`#00FF00`)
- PINK (`#FF0088`)
- PURPLE (`#8800FF`)

## Security Notes

- GitHub tokens are stored in browser localStorage
- Tokens are never sent to any server except GitHub API
- All operations are client-side only
- Use fine-grained tokens when possible
- Never commit tokens to version control

## Version History

### Version 1.3.0 (Current)
- **Unified Events Interface**: Merged "View Events" and "Add Event" tabs into single "Events" tab
  - Consistent workflow with Schedules feature
  - "+ NEW" button for quick event creation
  - Editor opens as full-screen view (hidden from navigation)
  - Improved UX for managing large event lists
- **Data Validation System** 🔍:
  - Comprehensive validation for events and schedules
  - Detects old events/schedules that can be cleaned up
  - Verifies image references exist in correct repositories
  - Validates character limits (12 chars for event lines)
  - Checks data correctness (dates, colors, time ranges, days format)
  - Visual error/warning/info reporting in modal interface
  - Accessible via footer link: "🔍 Validate Data"
- **Mobile Date Input Enhancements**:
  - Increased touch target height to 48px
  - Fixed text alignment (left-aligned, dark text instead of centered blue)
  - Native mobile date picker support
  - Consistent styling across event and schedule editors
- **Bug Fixes**:
  - Fixed color preview not resetting when creating new events on mobile
  - Fixed date inputs extending beyond container on mobile
  - Improved tab switching for programmatically-accessed editor views

### Version 1.2.0
- **Day-Agnostic Templates**: Templates no longer store day-of-week information
  - Templates focus solely on schedule patterns (times, names, images, progress bars)
  - Auto-inherit day-of-week when loaded into date-specific schedules
  - Cleaner template editor UI (removed day checkboxes)
  - Simplified timeline view for templates (no day/week selector)
- **Improved Formatting**: Template names use `formatImageName` utility for better readability
- **Enhanced Edit Panel**: Day-of-week checkboxes automatically hidden when editing templates
- **Updated Documentation**: README now includes detailed template CSV format and examples

### Version 1.1.0
- Mobile optimization with canvas previews
- Touch-friendly interface
- Responsive forms and layouts
- Stacked footer for mobile devices

## Roadmap

- [x] Event/Schedule Validation ✅ (v1.3.0)
- [ ] Schedule conflict detection
- [ ] Event search/filter
- [ ] Display module control
- [ ] Dark mode toggle

## License

MIT License - See repository for details

## Support

For issues or feature requests, please open an issue on the GitHub repository.

---

**Made with 💚 for RGB matrix displays**
