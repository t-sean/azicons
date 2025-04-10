import { promises as fs } from 'fs';
import { importDirectory } from '@iconify/tools/lib/import/directory';
import { cleanupSVG } from '@iconify/tools/lib/svg/cleanup';
import { runSVGO } from '@iconify/tools/lib/optimise/svgo';
import { parseColors, isEmptyColor } from '@iconify/tools/lib/colors/parse';

(async () => {
	// Import icons
	const iconSet = await importDirectory('svg', {
		prefix: 'az',
	});

	// Validate, clean up, fix palette and optimise
	iconSet.forEachSync((name, type) => {
		if (type !== 'icon') {
			return;
		}

		const svg = iconSet.toSVG(name);
		if (!svg) {
			// Invalid icon
			iconSet.remove(name);
			return;
		}

		// Clean up and optimise icons
		try {
			cleanupSVG(svg);
			parseColors(svg, {
				defaultColor: 'currentColor',
				callback: (attr, colorStr, color) => {
					return !color || isEmptyColor(color)
						? colorStr
						: 'currentColor';
				},
			});
			runSVGO(svg);
		} catch (err) {
			// Invalid icon
			console.error(`Error parsing ${name}:`, err);
			iconSet.remove(name);
			return;
		}

		// Update icon
		iconSet.fromSVG(name, svg);
	});

	// Export as IconifyJSON
	const exported = JSON.stringify(iconSet.export(), null, '\t') + '\n';

	// Save to file
	await fs.writeFile(`${iconSet.prefix}.json`, exported, 'utf8');
})();