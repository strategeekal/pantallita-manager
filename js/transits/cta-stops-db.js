/**
 * CTA Stops Database
 * Curated list of CTA train lines and major bus routes with stops
 *
 * Note: Stop IDs include direction. Each station typically has 2 stop IDs
 * (one for each direction). These IDs may need verification with actual CTA data.
 */

export const CTA_TRAIN_LINES = {
	'Red': {
		color: '#C60C30',
		type: 'train',
		terminals: ['Howard', '95th/Dan Ryan'],
		stops: [
			{
				name: 'Howard',
				directions: [
					{ id: '30162', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Jarvis',
				directions: [
					{ id: '30161', label: 'Northbound to Howard' },
					{ id: '30278', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Morse',
				directions: [
					{ id: '30160', label: 'Northbound to Howard' },
					{ id: '30277', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Loyola',
				directions: [
					{ id: '41300', label: 'Northbound to Howard' },
					{ id: '41301', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Granville',
				directions: [
					{ id: '40760', label: 'Northbound to Howard' },
					{ id: '40761', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Thorndale',
				directions: [
					{ id: '40880', label: 'Northbound to Howard' },
					{ id: '40881', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Bryn Mawr',
				directions: [
					{ id: '41380', label: 'Northbound to Howard' },
					{ id: '41381', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Berwyn',
				directions: [
					{ id: '40340', label: 'Northbound to Howard' },
					{ id: '40341', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Argyle',
				directions: [
					{ id: '40770', label: 'Northbound to Howard' },
					{ id: '40771', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Lawrence',
				directions: [
					{ id: '41400', label: 'Northbound to Howard' },
					{ id: '41401', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Wilson',
				directions: [
					{ id: '40540', label: 'Northbound to Howard' },
					{ id: '40541', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Sheridan',
				directions: [
					{ id: '40080', label: 'Northbound to Howard' },
					{ id: '40081', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Addison',
				directions: [
					{ id: '41420', label: 'Northbound to Howard' },
					{ id: '41421', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Belmont',
				directions: [
					{ id: '41320', label: 'Northbound to Howard' },
					{ id: '41321', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Fullerton',
				directions: [
					{ id: '41220', label: 'Northbound to Howard' },
					{ id: '41221', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'North/Clybourn',
				directions: [
					{ id: '40650', label: 'Northbound to Howard' },
					{ id: '40651', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Clark/Division',
				directions: [
					{ id: '40050', label: 'Northbound to Howard' },
					{ id: '40051', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Chicago',
				directions: [
					{ id: '41450', label: 'Northbound to Howard' },
					{ id: '41451', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Grand',
				directions: [
					{ id: '40330', label: 'Northbound to Howard' },
					{ id: '40331', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Lake',
				directions: [
					{ id: '40260', label: 'Northbound to Howard' },
					{ id: '40261', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Monroe',
				directions: [
					{ id: '40790', label: 'Northbound to Howard' },
					{ id: '40791', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Jackson',
				directions: [
					{ id: '40070', label: 'Northbound to Howard' },
					{ id: '40071', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Harrison',
				directions: [
					{ id: '40470', label: 'Northbound to Howard' },
					{ id: '40471', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Roosevelt',
				directions: [
					{ id: '41400', label: 'Northbound to Howard' },
					{ id: '41401', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Cermak-Chinatown',
				directions: [
					{ id: '41000', label: 'Northbound to Howard' },
					{ id: '41001', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Sox-35th',
				directions: [
					{ id: '40190', label: 'Northbound to Howard' },
					{ id: '40191', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: '47th',
				directions: [
					{ id: '41230', label: 'Northbound to Howard' },
					{ id: '41231', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: 'Garfield',
				directions: [
					{ id: '41170', label: 'Northbound to Howard' },
					{ id: '41171', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: '63rd',
				directions: [
					{ id: '40910', label: 'Northbound to Howard' },
					{ id: '40911', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: '69th',
				directions: [
					{ id: '40990', label: 'Northbound to Howard' },
					{ id: '40991', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: '79th',
				directions: [
					{ id: '40240', label: 'Northbound to Howard' },
					{ id: '40241', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: '87th',
				directions: [
					{ id: '41510', label: 'Northbound to Howard' },
					{ id: '41511', label: 'Southbound to 95th/Dan Ryan' }
				]
			},
			{
				name: '95th/Dan Ryan',
				directions: [
					{ id: '41430', label: 'Northbound to Howard' }
				]
			}
		]
	},
	'Blue': {
		color: '#00A1DE',
		type: 'train',
		terminals: ["O'Hare", 'Forest Park'],
		// Note: Blue Line stops below need to be restructured with directional IDs
		// For now, you can manually enter stop IDs when creating routes
		stops: [
			{ id: '40890', name: "O'Hare" },
			{ id: '40820', name: 'Rosemont' },
			{ id: '40230', name: 'Cumberland' },
			{ id: '40750', name: 'Harlem' },
			{ id: '40590', name: 'Jefferson Park' },
			{ id: '41280', name: 'Montrose' },
			{ id: '40670', name: 'Irving Park' },
			{ id: '40010', name: 'Addison' },
			{ id: '40180', name: 'Belmont' },
			{ id: '40060', name: 'Logan Square' },
			{ id: '40570', name: 'California' },
			{ id: '40670', name: 'Western' },
			{ id: '40490', name: 'Damen' },
			{ id: '40590', name: 'Division' },
			{ id: '40160', name: 'Chicago' },
			{ id: '40490', name: 'Grand' },
			{ id: '40380', name: 'Clark/Lake' },
			{ id: '40370', name: 'Washington' },
			{ id: '40790', name: 'Monroe' },
			{ id: '40070', name: 'Jackson' },
			{ id: '40430', name: 'LaSalle' },
			{ id: '40350', name: 'Clinton' },
			{ id: '40810', name: 'UIC-Halsted' },
			{ id: '40470', name: 'Racine' },
			{ id: '40090', name: 'Illinois Medical District' },
			{ id: '40670', name: 'Western' },
			{ id: '40250', name: 'Kedzie-Homan' },
			{ id: '40920', name: 'Pulaski' },
			{ id: '40540', name: 'Cicero' },
			{ id: '40030', name: 'Austin' },
			{ id: '40820', name: 'Oak Park' },
			{ id: '40180', name: 'Harlem/Forest Park' }
		]
	},
	'Brown': {
		terminals: ['Kimball', 'Loop'],
		// Note: Brown Line needs directional IDs - manually enter stop IDs for now
		color: '#62361B',
		type: 'train',
		stops: [
			{ id: '41290', name: 'Kimball' },
			{ id: '41180', name: 'Kedzie' },
			{ id: '40870', name: 'Francisco' },
			{ id: '41010', name: 'Rockwell' },
			{ id: '40090', name: 'Western' },
			{ id: '40260', name: 'Damen' },
			{ id: '41500', name: 'Montrose' },
			{ id: '40800', name: 'Irving Park' },
			{ id: '40070', name: 'Addison' },
			{ id: '40530', name: 'Paulina' },
			{ id: '41200', name: 'Southport' },
			{ id: '40660', name: 'Belmont' },
			{ id: '41290', name: 'Wellington' },
			{ id: '40730', name: 'Diversey' },
			{ id: '41220', name: 'Fullerton' },
			{ id: '40530', name: 'Armitage' },
			{ id: '40870', name: 'Sedgwick' },
			{ id: '40800', name: 'Chicago' },
			{ id: '40680', name: 'Merchandise Mart' },
			{ id: '40460', name: 'Washington/Wells' },
			{ id: '40730', name: 'Quincy' },
			{ id: '40040', name: 'LaSalle/Van Buren' },
			{ id: '40160', name: 'Harold Washington Library' },
			{ id: '40680', name: 'Adams/Wabash' },
			{ id: '40850', name: 'Washington/Wabash' },
			{ id: '40260', name: 'State/Lake' },
			{ id: '40380', name: 'Clark/Lake' }
		]
	},
	'Green': {
		terminals: ['Harlem/Lake', 'Cottage Grove', 'Ashland/63rd'],
		// Note: Green Line needs directional IDs - manually enter stop IDs for now
		color: '#009B3A',
		type: 'train',
		stops: [
			{ id: '40020', name: 'Harlem/Lake' },
			{ id: '40610', name: 'Oak Park' },
			{ id: '40300', name: 'Ridgeland' },
			{ id: '40130', name: 'Austin' },
			{ id: '40510', name: 'Central' },
			{ id: '40720', name: 'Laramie' },
			{ id: '40480', name: 'Cicero' },
			{ id: '40030', name: 'Pulaski' },
			{ id: '40170', name: 'Conservatory' },
			{ id: '40510', name: 'Kedzie' },
			{ id: '40090', name: 'California' },
			{ id: '40680', name: 'Ashland' },
			{ id: '40510', name: 'Morgan' },
			{ id: '40020', name: 'Clinton' },
			{ id: '40380', name: 'Clark/Lake' },
			{ id: '40680', name: 'State/Lake' },
			{ id: '40260', name: 'Washington/Wabash' },
			{ id: '40850', name: 'Adams/Wabash' },
			{ id: '41490', name: 'Roosevelt' },
			{ id: '40300', name: 'Cermak-McCormick Place' },
			{ id: '41120', name: '35th-Bronzeville-IIT' },
			{ id: '40130', name: 'Indiana' },
			{ id: '41270', name: '43rd' },
			{ id: '41080', name: '47th' },
			{ id: '41260', name: '51st' },
			{ id: '40130', name: 'Garfield' },
			{ id: '41510', name: 'King Drive' },
			{ id: '40940', name: 'Cottage Grove' },
			{ id: '40170', name: 'Halsted' },
			{ id: '41350', name: 'Ashland/63rd' }
		]
	},
	'Orange': {
		terminals: ['Midway', 'Loop'],
		// Note: Orange Line needs directional IDs - manually enter stop IDs for now
		color: '#F9461C',
		type: 'train',
		stops: [
			{ id: '40930', name: 'Midway' },
			{ id: '40960', name: 'Pulaski' },
			{ id: '41150', name: 'Kedzie' },
			{ id: '40310', name: 'Western' },
			{ id: '40120', name: '35th/Archer' },
			{ id: '40170', name: 'Ashland' },
			{ id: '40310', name: 'Halsted' },
			{ id: '41490', name: 'Roosevelt' },
			{ id: '40160', name: 'Harold Washington Library' },
			{ id: '40040', name: 'LaSalle/Van Buren' },
			{ id: '40730', name: 'Quincy' },
			{ id: '40460', name: 'Washington/Wells' },
			{ id: '40680', name: 'State/Lake' },
			{ id: '40380', name: 'Clark/Lake' }
		]
	},
	'Pink': {
		terminals: ['54th/Cermak', 'Loop'],
		// Note: Pink Line needs directional IDs - manually enter stop IDs for now
		color: '#E27EA6',
		type: 'train',
		stops: [
			{ id: '40580', name: '54th/Cermak' },
			{ id: '40420', name: 'Cicero' },
			{ id: '40600', name: 'Kostner' },
			{ id: '40150', name: 'Pulaski' },
			{ id: '40780', name: 'Central Park' },
			{ id: '40440', name: 'Kedzie' },
			{ id: '40740', name: 'California' },
			{ id: '40210', name: 'Western' },
			{ id: '40830', name: 'Damen' },
			{ id: '40170', name: '18th' },
			{ id: '40850', name: 'Polk' },
			{ id: '40170', name: 'Ashland' },
			{ id: '40680', name: 'Morgan' },
			{ id: '40350', name: 'Clinton' },
			{ id: '40380', name: 'Clark/Lake' },
			{ id: '40680', name: 'State/Lake' },
			{ id: '40260', name: 'Washington/Wabash' },
			{ id: '40850', name: 'Adams/Wabash' },
			{ id: '40160', name: 'Harold Washington Library' },
			{ id: '40040', name: 'LaSalle/Van Buren' },
			{ id: '40730', name: 'Quincy' }
		]
	},
	'Purple': {
		terminals: ['Linden', 'Howard', 'Loop'],
		// Note: Purple Line needs directional IDs - manually enter stop IDs for now
		color: '#522398',
		type: 'train',
		stops: [
			{ id: '40400', name: 'Linden' },
			{ id: '41320', name: 'Central' },
			{ id: '40520', name: 'Noyes' },
			{ id: '40270', name: 'Foster' },
			{ id: '40540', name: 'Davis' },
			{ id: '40690', name: 'Dempster' },
			{ id: '40100', name: 'Main' },
			{ id: '40450', name: 'South Boulevard' },
			{ id: '41490', name: 'Howard' }
		]
	},
	'Yellow': {
		terminals: ['Dempster-Skokie', 'Howard'],
		// Note: Yellow Line needs directional IDs - manually enter stop IDs for now
		color: '#F9E300',
		type: 'train',
		stops: [
			{ id: '40140', name: 'Dempster-Skokie' },
			{ id: '41680', name: 'Oakton-Skokie' },
			{ id: '40490', name: 'Howard' }
		]
	}
};

export const CTA_BUS_ROUTES = {
	'1': { name: 'Bronzeville/Union Station', type: 'bus' },
	'2': { name: 'Hyde Park Express', type: 'bus' },
	'3': { name: 'King Drive', type: 'bus' },
	'4': { name: 'Cottage Grove', type: 'bus' },
	'6': { name: 'Jackson Park Express', type: 'bus' },
	'8': { name: 'Halsted', type: 'bus' },
	'9': { name: 'Ashland', type: 'bus' },
	'12': { name: 'Roosevelt', type: 'bus' },
	'22': { name: 'Clark', type: 'bus' },
	'36': { name: 'Broadway', type: 'bus' },
	'49': { name: 'Western', type: 'bus' },
	'66': { name: 'Chicago', type: 'bus' },
	'72': { name: 'North', type: 'bus' },
	'77': { name: 'Belmont', type: 'bus' },
	'79': { name: '79th', type: 'bus' },
	'95': { name: '95th', type: 'bus' },
	'124': { name: 'Navy Pier', type: 'bus' },
	'134': { name: 'Stockton/LaSalle Express', type: 'bus' },
	'146': { name: 'Inner Drive/Michigan Express', type: 'bus' },
	'147': { name: 'Outer Drive Express', type: 'bus' },
	'151': { name: 'Sheridan', type: 'bus' },
	'152': { name: 'Addison', type: 'bus' },
	'156': { name: 'LaSalle', type: 'bus' }
};

/**
 * Get all train lines
 */
export function getTrainLines() {
	return Object.keys(CTA_TRAIN_LINES).map(line => ({
		route: line,
		color: CTA_TRAIN_LINES[line].color,
		type: 'train'
	}));
}

/**
 * Get stops for a specific train line
 */
export function getTrainStops(line) {
	return CTA_TRAIN_LINES[line]?.stops || [];
}

/**
 * Get all bus routes
 */
export function getBusRoutes() {
	return Object.keys(CTA_BUS_ROUTES).map(route => ({
		route: route,
		name: CTA_BUS_ROUTES[route].name,
		type: 'bus'
	}));
}

/**
 * Search for a stop by name or ID
 */
export function searchStop(query) {
	const results = [];
	const lowerQuery = query.toLowerCase();

	// Search train stops
	Object.keys(CTA_TRAIN_LINES).forEach(line => {
		const lineData = CTA_TRAIN_LINES[line];
		lineData.stops.forEach(stop => {
			if (stop.name.toLowerCase().includes(lowerQuery) || stop.id.includes(query)) {
				results.push({
					...stop,
					line: line,
					color: lineData.color,
					type: 'train'
				});
			}
		});
	});

	return results;
}

/**
 * Get line color
 */
export function getLineColor(route, type) {
	if (type === 'train' && CTA_TRAIN_LINES[route]) {
		return CTA_TRAIN_LINES[route].color;
	}
	return '#666666'; // Default gray for buses
}
