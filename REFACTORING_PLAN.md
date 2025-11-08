# Modular Refactoring Plan

## Current Progress

### ✅ Completed
- Created `js/` directory structure
- Extracted core utilities:
  - `js/core/config.js` - Configuration management
  - `js/core/api.js` - GitHub API calls
  - `js/core/utils.js` - Helper functions
- Moved and modularized:
  - `js/ui/matrix-emulator.js` - Matrix display (desktop only)
  - `js/ui/fonts.js` - Font definitions
- Created events module:
  - `js/events/events-manager.js` - Complete events CRUD

### 🚧 In Progress
- Schedules module (largest component)
- Main app initialization

### 📋 Remaining Work

#### 1. Schedules Module
Split into multiple files for maintainability:
- `js/schedules/schedule-manager.js` - List, load, delete schedules
- `js/schedules/schedule-editor.js` - Edit schedule items
- `js/schedules/timeline.js` - Timeline view rendering
- `js/schedules/preview.js` - Preview functionality

#### 2. UI Module
- `js/ui/mobile-preview.js` - Lightweight mobile preview (no canvas)
- `js/ui/landing.js` - Landing page animations
- `js/ui/tabs.js` - Tab switching logic

#### 3. Main Application
- `js/main.js` - App initialization with mobile detection
- Update `index.html` to use ES6 modules

## Mobile Optimization Strategy

### Conditional Loading
```javascript
if (isMobileDevice()) {
    // Skip heavy matrix emulator
    await import('./ui/mobile-preview.js');
} else {
    // Load full matrix emulator
    await import('./ui/matrix-emulator.js');
}
```

### Performance Improvements
1. **Lazy Loading** - Load modules only when needed
2. **Debouncing** - Reduce input handler frequency
3. **Virtual Scrolling** - For long lists (future enhancement)
4. **Service Worker** - Offline caching (future enhancement)

## File Structure

```
pantallita-manager/
├── index.html (updated for modules)
├── style.css
├── js/
│   ├── main.js (new - app init)
│   ├── core/
│   │   ├── config.js ✅
│   │   ├── api.js ✅
│   │   └── utils.js ✅
│   ├── ui/
│   │   ├── matrix-emulator.js ✅
│   │   ├── fonts.js ✅
│   │   ├── mobile-preview.js 🚧
│   │   ├── landing.js 🚧
│   │   └── tabs.js 🚧
│   ├── events/
│   │   └── events-manager.js ✅
│   └── schedules/
│       ├── schedule-manager.js 🚧
│       ├── schedule-editor.js 🚧
│       ├── timeline.js 🚧
│       └── preview.js 🚧
└── app.js (will be deprecated)
```

## Benefits

### Immediate
- **78KB → ~20KB** initial load (60% reduction)
- **Mobile freeze fixed** - no matrix emulator on mobile
- **Faster page load** - parallel module loading

### Long-term
- **Maintainability** - Easy to find and fix bugs
- **Collaboration** - Multiple devs can work simultaneously
- **Testing** - Can unit test individual modules
- **Scalability** - Easy to add new features

## Migration Strategy

1. Complete module extraction
2. Update `index.html` to use `<script type="module">`
3. Test all functionality
4. Keep `app.js` as backup until verified
5. Remove `app.js` after successful deployment

## Estimated Timeline

- Remaining work: ~2-3 hours
- Testing: ~1 hour
- Total: ~3-4 hours

Would you like me to:
A) Continue with automated full extraction?
B) Create modules incrementally with testing between each?
C) Provide you with templates to complete manually?
