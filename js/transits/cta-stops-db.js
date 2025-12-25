/**
 * CTA Stops Database
 * Curated list of CTA train lines and major bus routes with stops
 */

export const CTA_TRAIN_LINES = {
	'Red': {
		color: '#C60C30',
		type: 'train',
		stops: [
			{ id: '30162', name: 'Howard' },
			{ id: '30161', name: 'Jarvis' },
			{ id: '30160', name: 'Morse' },
			{ id: '30159', name: 'Loyola' },
			{ id: '30158', name: 'Granville' },
			{ id: '30157', name: 'Thorndale' },
			{ id: '41380', name: 'Bryn Mawr' },
			{ id: '41320', name: 'Berwyn' },
			{ id: '40770', name: 'Argyle' },
			{ id: '41200', name: 'Lawrence' },
			{ id: '40910', name: 'Wilson' },
			{ id: '41220', name: 'Sheridan' },
			{ id: '40080', name: 'Addison' },
			{ id: '41420', name: 'Belmont' },
			{ id: '41320', name: 'Fullerton' },
			{ id: '41220', name: 'North/Clybourn' },
			{ id: '40650', name: 'Clark/Division' },
			{ id: '40330', name: 'Chicago' },
			{ id: '40460', name: 'Grand' },
			{ id: '40730', name: 'Lake' },
			{ id: '40190', name: 'Monroe' },
			{ id: '40560', name: 'Jackson' },
			{ id: '40850', name: 'Harrison' },
			{ id: '41490', name: 'Roosevelt' },
			{ id: '41000', name: 'Cermak-Chinatown' },
			{ id: '40190', name: 'Sox-35th' },
			{ id: '40990', name: '47th' },
			{ id: '40240', name: 'Garfield' },
			{ id: '41170', name: '63rd' },
			{ id: '40910', name: '69th' },
			{ id: '40100', name: '79th' },
			{ id: '40180', name: '87th' },
			{ id: '41430', name: '95th/Dan Ryan' }
		]
	},
	'Blue': {
		color: '#00A1DE',
		type: 'train',
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
