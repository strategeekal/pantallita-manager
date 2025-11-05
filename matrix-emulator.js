/**
 * RGB Matrix Emulator for SCREENY
 * Simulates 64x32 RGB LED matrix display
 */

class MatrixEmulator {
	constructor(containerId, width = 64, height = 32, pixelSize = 8) {
		this.width = width;
		this.height = height;
		this.pixelSize = pixelSize;
		
		// Create canvas
		const container = document.getElementById(containerId);
		this.canvas = document.createElement('canvas');
		this.canvas.width = width * pixelSize;
		this.canvas.height = height * pixelSize;
		this.canvas.style.borderRadius = '8px';
		this.canvas.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.5)';
		container.appendChild(this.canvas);
		
		this.ctx = this.canvas.getContext('2d');
		
		// Pixel buffer
		this.buffer = Array(height).fill(null).map(() => 
			Array(width).fill('#000000')
		);
		
		this.clear();
	}
	
	setPixel(x, y, color) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
		this.buffer[y][x] = color || '#000000';
	}
	
	clear() {
		this.buffer = Array(this.height).fill(null).map(() => 
			Array(this.width).fill('#000000')
		);
		this.render();
	}
	
	render() {
		// Clear canvas with black background
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		
		// Draw all pixels
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const color = this.buffer[y][x];
				
				if (color !== '#000000') {
					this.ctx.fillStyle = color;
					
					// Draw pixel with slight gap for LED effect
					this.ctx.fillRect(
						x * this.pixelSize + 1,
						y * this.pixelSize + 1,
						this.pixelSize - 2,
						this.pixelSize - 2
					);
					
					// Add subtle glow
					this.ctx.shadowColor = color;
					this.ctx.shadowBlur = 2;
				}
			}
		}
		
		this.ctx.shadowBlur = 0;
	}
	
	fillRect(x, y, width, height, color) {
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				this.setPixel(x + col, y + row, color);
			}
		}
	}
	
	drawText(text, x, y, color) {
		text = text.toUpperCase();
		
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const bitmap = FONT_5X7[char] || FONT_5X7[' '];
			
			for (let row = 0; row < 7; row++) {
				for (let col = 0; col < 5; col++) {
					if (bitmap[row] & (1 << (4 - col))) {
						this.setPixel(x + (i * 6) + col, y + row, color);
					}
				}
			}
		}
	}
	
	drawImage(imageData, x, y) {
		if (!imageData) return;
		
		for (let row = 0; row < imageData.length; row++) {
			for (let col = 0; col < imageData[row].length; col++) {
				const color = imageData[row][col];
				if (color && color !== 'transparent') {
					this.setPixel(x + col, y + row, color);
				}
			}
		}
	}
}

// Near the top of matrix-emulator.js, after the class declaration

// Helper: Get font metrics
getFontMetrics(font, text) {
    const DESCENDER_CHARS = ['g', 'j', 'p', 'q', 'y'];
    
    let maxHeight = 0;
    let maxDescent = 0;
    
    for (let char of text.toUpperCase()) {
        const glyph = font.glyphs[char];
        if (!glyph) continue;
        
        const glyphHeight = glyph.height;
        const glyphDescent = Math.abs(glyph.yoffset);
        
        maxHeight = Math.max(maxHeight, glyphHeight);
        maxDescent = Math.max(maxDescent, glyphDescent);
    }
    
    return {
        height: maxHeight || font.metadata.defaultHeight || 6,
        descent: maxDescent,
        baseline: font.metadata.ascent - maxDescent
    };
}

// Calculate bottom-aligned positions (matches your Python code exactly!)
calculateBottomAlignedPositions(font, line1Text, line2Text, displayHeight = 32) {
    const BOTTOM_MARGIN = 2;
    const LINE_SPACING = 1;
    const DESCENDER_EXTRA_MARGIN = 2;
    const DESCENDER_CHARS = ['g', 'j', 'p', 'q', 'y'];
    
    // Get font metrics
    const combinedText = line1Text + line2Text;
    const metrics = this.getFontMetrics(font, combinedText);
    const fontHeight = metrics.height;
    const baselineOffset = metrics.baseline;
    
    // Check for descenders in ONLY the bottom line
    const hasDescenders = line2Text.toLowerCase().split('').some(char => 
        DESCENDER_CHARS.includes(char)
    );
    
    // Adjust bottom margin for descenders
    const adjustedBottomMargin = BOTTOM_MARGIN + (hasDescenders ? DESCENDER_EXTRA_MARGIN : 0);
    
    // Calculate positions from bottom up
    const bottomEdge = displayHeight - adjustedBottomMargin;
    
    // Second line position (bottom line)
    const line2Y = bottomEdge - baselineOffset;
    
    // First line position
    let line1Y = line2Y - fontHeight - LINE_SPACING;
    
    // Ensure we don't go above display area
    if (line1Y < baselineOffset) {
        line1Y = baselineOffset;
    }
    
    return {
        line1Y: Math.round(line1Y),
        line2Y: Math.round(line2Y)
    };
}

// Draw text using BDF font
drawTextWithFont(text, x, y, color, font) {
    if (!font || !text) return;
    
    text = text.toUpperCase();
    let currentX = x;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const glyph = font.glyphs[char];
        
        if (!glyph) {
            // Use default spacing if character not found
            currentX += font.metadata.defaultWidth || 5;
            continue;
        }
        
        const charWidth = glyph.width;
        const charHeight = glyph.height;
        const xOffset = glyph.xoffset || 0;
        const yOffset = glyph.yoffset || 0;
        
        // Draw character bitmap
        for (let row = 0; row < charHeight; row++) {
            if (!glyph.bitmap[row]) continue;
            
            const rowData = glyph.bitmap[row];
            
            for (let col = 0; col < charWidth; col++) {
                const bitPosition = 7 - col;  // MSB first
                const bit = (rowData >> bitPosition) & 1;
                
                if (bit) {
                    this.setPixel(
                        currentX + xOffset + col,
                        y + yOffset + row,
                        color
                    );
                }
            }
        }
        
        // Advance to next character position
        currentX += charWidth + 1;  // 1 pixel spacing between chars
    }
}

// Simple 5x7 bitmap font
const FONT_5X7 = {
	'A': [0x04, 0x0A, 0x11, 0x11, 0x1F, 0x11, 0x11],
	'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
	'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
	'D': [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
	'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
	'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
	'G': [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0E],
	'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
	'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
	'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
	'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
	'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
	'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11],
	'N': [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
	'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
	'P': [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
	'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
	'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
	'S': [0x0E, 0x11, 0x10, 0x0E, 0x01, 0x11, 0x0E],
	'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
	'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
	'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
	'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11],
	'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
	'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
	'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
	'0': [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E],
	'1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
	'2': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F],
	'3': [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
	'4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
	'5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
	'6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E],
	'7': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
	'8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E],
	'9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
	':': [0x00, 0x00, 0x04, 0x00, 0x00, 0x04, 0x00],
	'°': [0x06, 0x09, 0x09, 0x06, 0x00, 0x00, 0x00],
	' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
	'-': [0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00],
	'!': [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
	'?': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
	'/': [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x00],
	'.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04],
	',': [0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x08],
	'\'': [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
	'"': [0x0A, 0x0A, 0x14, 0x00, 0x00, 0x00, 0x00]
};

// Color palette matching SCREENY colors
const COLOR_MAP = {
	'MINT': '#00FFAA',
	'BUGAMBILIA': '#FF00AA',
	'LILAC': '#AA00FF',
	'RED': '#FF0000',
	'GREEN': '#00FF00',
	'BLUE': '#0000FF',
	'ORANGE': '#FF6600',
	'YELLOW': '#FFFF00',
	'PURPLE': '#8800FF',
	'PINK': '#FF0088',
	'WHITE': '#FFFFFF',
	'CYAN': '#00FFFF'
};

// Simple placeholder images (you can replace with actual icon data)
const SIMPLE_ICONS = {
	'halloween': generatePumpkinIcon(),
	'heart': generateHeartIcon(),
	'star': generateStarIcon(),
	'sun': generateSunIcon(),
	'cloud': generateCloudIcon()
};

// Icon generators (simple 21x32 icons)
function generatePumpkinIcon() {
	const icon = Array(32).fill(null).map(() => Array(21).fill('transparent'));
	// Simple pumpkin shape (simplified for demo)
	for (let y = 10; y < 25; y++) {
		for (let x = 5; x < 16; x++) {
			if (Math.abs(x - 10.5) < 5 && Math.abs(y - 17.5) < 7) {
				icon[y][x] = '#FF6600';
			}
		}
	}
	// Eyes
	icon[15][8] = '#000000';
	icon[15][13] = '#000000';
	return icon;
}

function generateHeartIcon() {
	const icon = Array(32).fill(null).map(() => Array(21).fill('transparent'));
	// Simple heart shape
	const heartPixels = [
		[12, 6], [12, 7], [12, 8],
		[11, 9], [10, 10], [9, 11],
		[8, 12], [9, 13], [10, 14],
		[11, 15], [12, 16], [13, 15],
		[14, 14], [15, 13], [16, 12],
		[15, 11], [14, 10], [13, 9]
	];
	heartPixels.forEach(([y, x]) => {
		if (y < 32 && x < 21) icon[y][x] = '#FF0088';
	});
	return icon;
}

function generateStarIcon() {
	const icon = Array(32).fill(null).map(() => Array(21).fill('transparent'));
	// Simple star
	for (let i = 0; i < 5; i++) {
		const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
		const x = Math.floor(10.5 + 8 * Math.cos(angle));
		const y = Math.floor(16 + 8 * Math.sin(angle));
		if (y >= 0 && y < 32 && x >= 0 && x < 21) {
			icon[y][x] = '#FFFF00';
		}
	}
	return icon;
}

function generateSunIcon() {
	const icon = Array(32).fill(null).map(() => Array(21).fill('transparent'));
	// Simple sun
	for (let y = 12; y < 20; y++) {
		for (let x = 6; x < 15; x++) {
			const dist = Math.sqrt((x - 10.5) ** 2 + (y - 16) ** 2);
			if (dist < 4) {
				icon[y][x] = '#FFFF00';
			}
		}
	}
	return icon;
}

function generateCloudIcon() {
	const icon = Array(32).fill(null).map(() => Array(21).fill('transparent'));
	// Simple cloud
	for (let y = 12; y < 18; y++) {
		for (let x = 4; x < 17; x++) {
			icon[y][x] = '#AAAAAA';
		}
	}
	return icon;
}
