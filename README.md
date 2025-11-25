# SCREENY Manager

**Version 1.8.0**

A web-based management interface for SCREENY RGB matrix displays. Manage ephemeral events, daily schedules, and investment stock tickers remotely through GitHub, with full support for desktop and mobile devices.

![SCREENY Manager](https://img.shields.io/badge/status-active-brightgreen) ![Version](https://img.shields.io/badge/version-1.8.0-blue)

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
- **Advanced Filtering & Organization**:
  - Smart search across event names AND dates (search "november", "2025", "jan", specific dates)
  - Date filters (All, Upcoming [next 5], Past, Today, This Week, This Month, Next Month)
  - Sort options (Date ascending/descending, A-Z, Z-A)
  - Real-time filter count display
  - One-click "Clear Filters" button
  - Fully responsive on mobile devices

### 🕐 Schedules Management
- Manage default daily schedules
- Create date-specific schedule overrides
- Timeline view with visual schedule bars
- Schedule items with:
  - Custom time ranges (hour and minute precision)
  - Day-of-week selection (Mon-Sun)
  - Schedule images (required - all items must have an image)
  - Optional progress bars
  - Enable/disable toggles
  - Automatic incremental naming (New Item, New Item 1, New Item 2, etc.)
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

### 📈 Stocks Management
- **Investment Stock Tickers**: Display stock information on your matrix
- **CRUD Operations**: Add, edit, and delete stock tickers
- **Stock Information**:
  - Ticker symbol (e.g., AAPL, GOOGL, TSLA)
  - Company name
- **Drag-and-Drop Reordering**: Intuitive drag-and-drop to reorder stocks
  - Visual feedback while dragging
  - Touch-friendly on mobile devices
  - Auto-saves order to GitHub
- **3-Stock Cycle Grouping**:
  - Visual grouping every 3 stocks (matches display rotation)
  - Cycle badges showing which stocks display together
  - Row separators between cycles
  - Order preserved in CSV with cycle comments
- **Local Stock Reference Database**:
  - 100+ popular stock tickers included
  - Instant offline lookups
  - No API rate limits
  - Manual entry supported for any ticker
- **Twelve Data API Validation**: Validates ticker symbols are real and supported
- **Grid View**: Stock cards in 3-column responsive pixel-art layout
- **GitHub Integration**: Stock data stored in `stocks.csv` file with cycle organization
- **Fixed Toast Notifications**: Non-intrusive success messages that don't shift layout

### 📱 Mobile Optimization
- Fully responsive design
- Touch-friendly interface
- Canvas-based pixel-perfect previews (256x128)
- Mobile-optimized forms and layouts
- Stacked footer with large touch targets
- Optimized date inputs (48px height, proper text alignment and color)
- Native mobile date pickers for better UX

### ⚙️ Display Configuration
- **Dual Matrix Control**: Independent configuration for two RGB matrix displays (Matrix 1 & Matrix 2)
- **Toggle-Based Settings**: Easy on/off controls for display features
- **Configurable Display Options**:
  - Show/hide weather information
  - Show/hide weather forecast
  - Show/hide events
  - Show/hide weekday indicator
  - Show/hide scheduled displays
  - Show/hide events between schedules
  - Show/hide investment stocks
  - Enable/disable night mode (minimal display during nighttime hours)
  - Enable/disable delayed start (safety feature)
- **GitHub Integration**: Configuration files (CSV format) stored in repository
- **Real-time Updates**: Save and reload configurations on the fly
- **Grouped Settings**: Settings organized by logical sections for clarity
- **Visual Feedback**: Loading states and error messages for save/reload operations

### 🔍 Data Validation
- Automatic validation on app load with discreet badge notification
- Badge auto-refreshes after save/delete/refresh operations
- Comprehensive validation for events and schedules
- Detect old events and schedules that can be cleaned up
- Verify image references exist in correct repositories
- Validate character limits (12 chars for event lines)
- Check data correctness (dates, colors, time ranges, etc.)
- **Schedule conflict detection**:
  - Duplicate item names (critical: only last item displays on matrix)
  - Overlapping time ranges between schedule items
- Visual error and warning reporting with detailed messages
- Accessible via footer link: "Validate Data"

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

### Stocks CSV (`stocks.csv`)

**Format:**
```
symbol,name,type,display_name,highlighted
```

**Fields:**
- `symbol` - Stock/forex/commodity/crypto symbol (automatically converted to uppercase, e.g., AAPL, USDMXN, GC, BTC)
- `name` - Full name (e.g., Apple, USD to MXN, Gold, Bitcoin)
- `type` - Type: `stock`, `forex`, `commodity`, or `crypto`
- `display_name` - Optional short label to show instead of symbol (e.g., MXN, Gold, BTC)
- `highlighted` - Display mode: `0` = group display (3 stocks), `1` = individual display

**Example:**
```csv
# Stock Tickers
# Format: symbol,name,type,display_name,highlighted
# Regular stocks displayed in cycles of 3, highlighted stocks shown individually
# Display sequence follows CSV order: 3-stock group → highlighted → 3-stock group → ...

# Display 1: Cycle 1 (3 stocks)
AAPL,Apple,stock,,0
GOOGL,Alphabet Inc.,stock,,0
MSFT,Microsoft Corporation,stock,,0

# Display 2: Individual (highlighted)
BTCUSD,Bitcoin,crypto,BTC,1

# Display 3: Cycle 2 (3 stocks)
NVDA,NVIDIA Corporation,stock,,0
USDMXN,USD to MXN,forex,MXN,0
GC,Gold,commodity,Gold,0
```

**Notes:**
- **Regular stocks** (`highlighted=0`) are displayed in groups of 3 (cycles)
- **Highlighted stocks** (`highlighted=1`) are displayed individually for emphasis
- Display sequence follows CSV order and alternates between group and individual displays
- Display comments are auto-generated showing the sequence
- In the UI, highlighted stocks have a gold border and ⭐ icon
- Empty display_name can be left blank but comma is required
- Symbols are automatically converted to uppercase
- Type badges: **STOCK** (blue), **FOREX/COMMODITY/CRYPTO** (mint green)
- Display name takes priority over symbol in the UI
- Use the "🔍 Lookup" button to fetch names and validate symbols
- Blank lines and lines starting with `#` are ignored
- Order in CSV matches display order (drag-and-drop to reorder)
- **Backward compatible**: Old 4-field format defaults to `highlighted=0`
- **Note**: Index-tracking ETFs should use type `stock` (e.g., SPY for S&P 500)

### Configuration CSV (`matrix1_config.csv` or `matrix2_config.csv`)

**Format:**
```
# Display Configuration for Pantallita
# Format: setting,value
# Boolean values: 1 = True, 0 = False
# This file can be overridden by GitHub remote config at startup

# Core displays
show_weather,1
show_forecast,1
show_events,1

# Display elements
show_weekday_indicator,1
show_scheduled_displays,1
show_events_in_between_schedules,1
show_stocks,1
stocks_respect_market_hours,0
stocks_display_frequency,3
night_mode_minimal_display,1

# Safety features
delayed_start,0
```

**Fields:**
- `setting` - Configuration setting name
- `value` - Boolean value (`1` = enabled, `0` = disabled) or numeric value (for frequency settings)

**Available Settings:**
- `show_weather` - Display current weather information
- `show_forecast` - Display weather forecast
- `show_events` - Display upcoming events
- `show_weekday_indicator` - Show day of the week indicator
- `show_scheduled_displays` - Show scheduled display items
- `show_events_in_between_schedules` - Show events when no schedule is active
- `show_stocks` - Display investment stock ticker information
- `stocks_respect_market_hours` - On = Show stocks during market hours only
- `stocks_display_frequency` - Number of cycles between stock displays (numeric: 1-78, default: 3)
- `night_mode_minimal_display` - Enable minimal display mode during nighttime hours
- `delayed_start` - Enable delayed startup for safety

**Example:**
```csv
# Display Configuration for Pantallita
# Format: setting,value
# Boolean values: 1 = True, 0 = False

# Core displays
show_weather,1
show_forecast,0
show_events,1

# Display elements
show_weekday_indicator,1
show_scheduled_displays,1
show_events_in_between_schedules,0
show_stocks,1
stocks_respect_market_hours,1
stocks_display_frequency,5
night_mode_minimal_display,1

# Safety features
delayed_start,0
```

Two configuration files are supported for dual matrix setups: `matrix1_config.csv` and `matrix2_config.csv`.

## GitHub Repository Structure

```
pantallita-events/                # Independent repo with files
├── ephemeral_events.csv          # Events file
├── stocks.csv                    # Stock tickers
├── matrix1_config.csv            # Matrix 1 configuration
├── matrix2_config.csv            # Matrix 2 configuration
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
│   │   ├── constants.js         # App constants
│   │   └── utils.js             # Utility functions
│   ├── config/
│   │   └── config-manager.js    # Matrix configuration management
│   ├── events/
│   │   └── events-manager.js    # Events CRUD operations
│   ├── schedules/
│   │   ├── schedule-manager.js  # Schedule CRUD operations
│   │   ├── schedule-editor.js   # Schedule editing UI
│   │   ├── timeline.js          # Timeline view & item editor
│   │   ├── preview.js           # Desktop preview emulator
│   │   └── template-manager.js  # Template operations
│   ├── stocks/
│   │   └── stocks-manager.js    # Stock tickers CRUD operations
│   ├── validation/
│   │   └── validator.js         # Data validation system
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

### Version 1.8.0 (Current)
- **Highlighted Stocks Feature** ⭐:
  - **Individual Display Mode**: Mark important stocks for individual display
    - Add `highlighted` field to CSV (5th field: 0 or 1)
    - Highlighted stocks display alone instead of in groups of 3
    - Display sequence follows CSV order (e.g., 3-stock group → highlighted → 3-stock group)
  - **Visual Emphasis**:
    - Full-width layout on desktop for dramatic visual separation
    - Gold border (#FFD700) with light cream background
    - Star icon (⭐) and "HIGHLIGHTED" badge
    - Timeline-style organization showing display priority
  - **Responsive Design**:
    - Desktop: Full-width horizontal layout spanning all columns
    - Tablet: Full-width across 2-column grid
    - Mobile: Vertical layout maintaining consistency
  - **Smart Cycle Calculation**: Dynamic grouping based on regular vs highlighted stocks
  - **Backward Compatible**: Old 4-field format defaults to `highlighted=0`

### Version 1.7.1
- **Stocks Feature Enhancements** 📈:
  - **Drag-and-Drop Reordering**: Smooth, intuitive reordering of stocks
    - Visual feedback with opacity, rotation, and scaling
    - Mint green highlight on drop target
    - Touch-friendly on mobile devices
    - Reliable event handling with dragleave support
  - **3-Stock Cycle Grouping**:
    - Visual cycle badges (Cycle 1, Cycle 2, etc.)
    - Row separators between display cycles
    - CSV auto-formats with cycle comments
    - Clear visual organization matching display rotation
  - **Local Stock Reference Database**:
    - 100+ popular stock tickers included
    - Instant offline lookups (no API dependencies)
    - No rate limits or CORS issues
    - Fallback to manual entry for any ticker
  - **Twelve Data API Validation**: Verify tickers are real and supported
  - **Fixed Toast Notifications**: Non-intrusive success messages
    - Fixed position (top-right on desktop, top-center on mobile)
    - No layout shift when appearing/disappearing
    - Smooth slide-in animation
  - **Mobile Improvements**:
    - Prevented browser search during drag
    - User-select: none to avoid text selection
    - Touch-action: pan-y for vertical scrolling
    - Full-width toast notifications
  - **Pixel-Art Design Consistency**:
    - 3-column grid layout
    - Sharp edges with black borders
    - Box shadows matching existing design
    - Subtle cycle badges in card corners

### Version 1.7.0
- **Investment Stocks Management** 📈:
  - New Stocks tab for managing investment stock tickers
  - Add, edit, and delete stock ticker entries
  - Stock information includes ticker symbol and company name
  - Auto-lookup feature to fetch company names from ticker symbols
  - Uses Yahoo Finance API for real-time company name lookups
  - Manual entry supported if auto-lookup fails
  - Responsive grid layout for stock cards
  - GitHub integration via `stocks.csv` file
  - Similar UI/UX to schedule items for consistency
- **Stock Display Toggle** ⚙️:
  - Added `show_stocks` configuration option to matrix config files
  - Enable/disable stock ticker display per matrix
  - Integrated into Configuration tab

### Version 1.6.0
- **Matrix Display Configuration** ⚙️:
  - New Configuration tab for controlling display settings
  - Independent control for dual matrix setups (Matrix 1 & Matrix 2)
  - Toggle-based interface for easy on/off control
  - Configuration options include:
    - Show/hide weather information
    - Show/hide weather forecast
    - Show/hide events
    - Show/hide weekday indicator
    - Show/hide scheduled displays
    - Show/hide events between schedules
    - Enable/disable night mode (minimal display during nighttime hours)
    - Enable/disable delayed start (safety feature)
  - GitHub integration: CSV-based configuration files (matrix1_config.csv, matrix2_config.csv)
  - Real-time save and reload functionality
  - Settings organized by logical sections (Core displays, Display elements, Safety features)
  - Visual feedback with loading states and error messages
  - Allows fine-grained control over what displays on each matrix independently

### Version 1.5.0
- **Schedule Conflict Detection** 🚨:
  - Detects duplicate item names within schedules (ERROR - critical: only last item displays on matrix)
  - Detects overlapping time ranges between schedule items (WARNING)
  - Case-insensitive duplicate name checking
  - Integrated into comprehensive validation system
- **Required Image Selection for Schedule Items** 📷:
  - All schedule items must now have an image selected
  - Visual indicator (* asterisk) shows required field
  - Validation prevents saving schedules with missing images
  - Placeholder text "-- Select Image --" with gray italic styling
  - Prevents display errors from missing images on matrix
- **Automatic Incremental Naming for Schedule Items** 🔢:
  - New schedule items automatically get unique names
  - First item: "New Item", subsequent items: "New Item 1", "New Item 2", etc.
  - Prevents duplicate name bug where only last item displays on matrix
  - Works as additional defense alongside validation and editor duplicate checking
  - Smart gap-filling (reuses deleted item numbers)
- **Advanced Event Filtering & Organization** 🔍:
  - **Smart search** across event names AND dates:
    - Search event text (top line and bottom line)
    - Search by month name ("november", "jan", "december")
    - Search by year ("2025", "2024")
    - Search by specific date components ("15", "01-15")
    - Search by full date ("2025-01-15")
  - **Date filters**: All Events, Upcoming (next 5), Past, Today, This Week, This Month, Next Month
  - **"Upcoming" filter** intelligently shows only next 5 events for better UX
  - **Sort options**: By date (ascending/descending) or alphabetically (A-Z/Z-A)
  - **Real-time filter count**: Shows "Showing X of Y events" based on active filters
  - **One-click "Clear Filters"** button appears when filters are active
  - **Clean, pixel-art styling** matching form inputs (white background, 3px black borders, box shadows)
  - **Responsive design**: Search bar sized to not overlap with dropdowns, matching heights
  - **Mobile optimized**: Stacked layout, 16px font to prevent iOS zoom, full-width controls
- **Filter UX Improvements**:
  - Removed color filter (not useful for most users)
  - Search bar: flex 0 1 300px, max-width 400px to prevent overlap
  - Consistent 46px height on desktop, 48px on mobile (matching dropdowns)
  - Better visual hierarchy and spacing

### Version 1.4.0
- **Comprehensive Data Validation System** 🔍:
  - Automatic validation on app load with discreet badge notification
  - Badge shows issue count (red for errors, yellow for warnings only)
  - Badge auto-refreshes after data changes (save, delete, refresh)
  - Silent validation runs in background without interrupting workflow
  - Improved validation messages:
    - Removed event numbers for clarity
    - Changed date format to MM-DD-YYYY for readability
    - Clear event/schedule identifiers in all messages
  - Click "Validate Data" in footer to see full detailed report
  - Validates:
    - Old events/schedules (past dates)
    - Missing images in repositories
    - Character limits (12 chars for event lines)
    - Date formats, colors, time ranges
    - Schedule days format and time logic
- **Fixed Time-Bound Event Editing Bug**:
  - Bug: Time fields would sometimes disappear when editing events with specific hours
  - Root cause: Logic used AND (&&) instead of OR (||) operator
  - Now properly detects all non-all-day events (any event not exactly 0-23)
  - Time fields consistently populate and save correctly
- **Improved Date Threshold Logic**:
  - Events/schedules now remain active throughout their entire scheduled date
  - Only marked as past starting the day AFTER their date (not same day)
  - Time-based expiration: Events with specific end hours gray out after that hour passes
  - Matches display's 3am data import behavior
  - Clear Past Events/Schedules buttons respect new threshold

### Version 1.3.0
- **Unified Events Interface**: Merged "View Events" and "Add Event" tabs into single "Events" tab
  - Consistent workflow with Schedules feature
  - "+ NEW" button for quick event creation
  - Editor opens as full-screen view (hidden from navigation)
  - Improved UX for managing large event lists
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

- [x] Event/Schedule Validation ✅ (v1.4.0)
- [x] Schedule conflict detection ✅ (v1.5.0)
- [x] Event search/filter ✅ (v1.5.0)
- [x] Display module control ✅ (v1.6.0)
- [ ] Dark mode toggle

## License

MIT License - See repository for details

## Support

For issues or feature requests, please open an issue on the GitHub repository.

---

**Made with 💚 for RGB matrix displays**
