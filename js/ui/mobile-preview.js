// Mobile Preview Module - Lightweight text preview for mobile devices (no canvas)

export function setupMobileTextPreview() {
	const container = document.getElementById('matrix-container-editor');
	if (!container) return;

	// Replace emulator with simple text + image preview
	container.innerHTML = `
		<div class="mobile-text-preview">
			<div class="preview-hint">📱 Mobile Preview</div>
			<div class="preview-image-container" id="mobile-preview-image-container">
				<div class="preview-image-placeholder">Select an image...</div>
			</div>
			<div class="preview-content">
				<div class="preview-top-line" id="mobile-preview-top">Top Line</div>
				<div class="preview-bottom-line" id="mobile-preview-bottom">Bottom Line</div>
				<div class="preview-meta">
					<span id="mobile-preview-image-name">📷 Image: None</span>
					<span id="mobile-preview-color">🎨 Color: MINT</span>
				</div>
			</div>
		</div>
	`;
}

export async function updateMobileTextPreview(topLine, bottomLine, colorName, iconName) {
	const topEl = document.getElementById('mobile-preview-top');
	const bottomEl = document.getElementById('mobile-preview-bottom');
	const colorEl = document.getElementById('mobile-preview-color');
	const imageNameEl = document.getElementById('mobile-preview-image-name');
	const imageContainer = document.getElementById('mobile-preview-image-container');

	if (topEl) topEl.textContent = topLine || 'Top Line';
	if (bottomEl) {
		bottomEl.textContent = bottomLine || 'Bottom Line';
		bottomEl.style.color = getColorHex(colorName);
	}
	if (colorEl) colorEl.textContent = `🎨 Color: ${colorName}`;
	if (imageNameEl) imageNameEl.textContent = `📷 Image: ${iconName || 'None'}`;

	// Show image preview if available
	if (imageContainer && iconName) {
		// Try to load and display image
		try {
			const imageData = await window.loadBMPImage(iconName);
			if (imageData && imageData.canvas) {
				imageContainer.innerHTML = '';
				const canvas = imageData.canvas;
				canvas.classList.add('preview-image-display');
				imageContainer.appendChild(canvas);
			}
		} catch (e) {
			imageContainer.innerHTML = `<div class="preview-image-placeholder">${iconName}</div>`;
		}
	}
}

function getColorHex(colorName) {
	const colors = {
		'MINT': '#00FFAA',
		'WHITE': '#FFFFFF',
		'RED': '#FF0000',
		'GREEN': '#00FF00',
		'BLUE': '#0000FF',
		'YELLOW': '#FFFF00',
		'CYAN': '#00FFFF',
		'MAGENTA': '#FF00FF'
	};
	return colors[colorName] || '#00FFAA';
}
