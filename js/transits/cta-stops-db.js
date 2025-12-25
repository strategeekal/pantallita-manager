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
		stops: [
			{
				name: "O'Hare",
				directions: [
					{ id: '40890', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Rosemont',
				directions: [
					{ id: '40820', label: 'Northbound to O\'Hare' },
					{ id: '40821', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Cumberland',
				directions: [
					{ id: '40230', label: 'Northbound to O\'Hare' },
					{ id: '40231', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Harlem (O\'Hare)',
				directions: [
					{ id: '40750', label: 'Northbound to O\'Hare' },
					{ id: '40751', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Jefferson Park',
				directions: [
					{ id: '40590', label: 'Northbound to O\'Hare' },
					{ id: '40591', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Montrose',
				directions: [
					{ id: '41280', label: 'Northbound to O\'Hare' },
					{ id: '41281', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Irving Park',
				directions: [
					{ id: '40670', label: 'Northbound to O\'Hare' },
					{ id: '40671', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Addison',
				directions: [
					{ id: '40010', label: 'Northbound to O\'Hare' },
					{ id: '40011', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Belmont',
				directions: [
					{ id: '40180', label: 'Northbound to O\'Hare' },
					{ id: '40181', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Logan Square',
				directions: [
					{ id: '40060', label: 'Northbound to O\'Hare' },
					{ id: '40061', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'California',
				directions: [
					{ id: '40570', label: 'Northbound to O\'Hare' },
					{ id: '40571', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Western (O\'Hare)',
				directions: [
					{ id: '40670', label: 'Northbound to O\'Hare' },
					{ id: '40671', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Damen',
				directions: [
					{ id: '40490', label: 'Northbound to O\'Hare' },
					{ id: '40491', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Division',
				directions: [
					{ id: '40320', label: 'Northbound to O\'Hare' },
					{ id: '40321', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Chicago',
				directions: [
					{ id: '40490', label: 'Northbound to O\'Hare' },
					{ id: '40491', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Grand',
				directions: [
					{ id: '40490', label: 'Northbound to O\'Hare' },
					{ id: '40491', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Clark/Lake',
				directions: [
					{ id: '40380', label: 'Northbound to O\'Hare' },
					{ id: '40381', label: 'Southbound to Forest Park' }
				]
			},
			{
				name: 'Washington',
				directions: [
					{ id: '40370', label: 'Westbound to Forest Park' },
					{ id: '40371', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Monroe',
				directions: [
					{ id: '40790', label: 'Westbound to Forest Park' },
					{ id: '40791', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Jackson',
				directions: [
					{ id: '40070', label: 'Westbound to Forest Park' },
					{ id: '40071', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'LaSalle',
				directions: [
					{ id: '40430', label: 'Westbound to Forest Park' },
					{ id: '40431', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Clinton',
				directions: [
					{ id: '40350', label: 'Westbound to Forest Park' },
					{ id: '40351', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'UIC-Halsted',
				directions: [
					{ id: '40810', label: 'Westbound to Forest Park' },
					{ id: '40811', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Racine',
				directions: [
					{ id: '40470', label: 'Westbound to Forest Park' },
					{ id: '40471', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Illinois Medical District',
				directions: [
					{ id: '40090', label: 'Westbound to Forest Park' },
					{ id: '40091', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Western (Forest Park)',
				directions: [
					{ id: '40220', label: 'Westbound to Forest Park' },
					{ id: '40221', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Kedzie-Homan',
				directions: [
					{ id: '40250', label: 'Westbound to Forest Park' },
					{ id: '40251', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Pulaski',
				directions: [
					{ id: '40920', label: 'Westbound to Forest Park' },
					{ id: '40921', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Cicero',
				directions: [
					{ id: '40540', label: 'Westbound to Forest Park' },
					{ id: '40541', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Austin',
				directions: [
					{ id: '40030', label: 'Westbound to Forest Park' },
					{ id: '40031', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Oak Park',
				directions: [
					{ id: '40180', label: 'Westbound to Forest Park' },
					{ id: '40181', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Harlem/Forest Park',
				directions: [
					{ id: '40980', label: 'Westbound to Forest Park' },
					{ id: '40981', label: 'Eastbound to O\'Hare' }
				]
			},
			{
				name: 'Forest Park',
				directions: [
					{ id: '40390', label: 'Eastbound to O\'Hare' }
				]
			}
		]
	},
	'Brown': {
		color: '#62361B',
		type: 'train',
		terminals: ['Kimball', 'Loop'],
		stops: [
			{
				name: 'Kimball',
				directions: [
					{ id: '41290', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Kedzie',
				directions: [
					{ id: '41180', label: 'Northbound to Kimball' },
					{ id: '41181', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Francisco',
				directions: [
					{ id: '40870', label: 'Northbound to Kimball' },
					{ id: '40871', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Rockwell',
				directions: [
					{ id: '41010', label: 'Northbound to Kimball' },
					{ id: '41011', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Western',
				directions: [
					{ id: '40090', label: 'Northbound to Kimball' },
					{ id: '40091', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Damen',
				directions: [
					{ id: '40260', label: 'Northbound to Kimball' },
					{ id: '40261', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Montrose',
				directions: [
					{ id: '41500', label: 'Northbound to Kimball' },
					{ id: '41501', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Irving Park',
				directions: [
					{ id: '40800', label: 'Northbound to Kimball' },
					{ id: '40801', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Addison',
				directions: [
					{ id: '40070', label: 'Northbound to Kimball' },
					{ id: '40071', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Paulina',
				directions: [
					{ id: '40530', label: 'Northbound to Kimball' },
					{ id: '40531', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Southport',
				directions: [
					{ id: '41200', label: 'Northbound to Kimball' },
					{ id: '41201', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Belmont',
				directions: [
					{ id: '40660', label: 'Northbound to Kimball' },
					{ id: '40661', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Wellington',
				directions: [
					{ id: '41210', label: 'Northbound to Kimball' },
					{ id: '41211', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Diversey',
				directions: [
					{ id: '40730', label: 'Northbound to Kimball' },
					{ id: '40731', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Fullerton',
				directions: [
					{ id: '41220', label: 'Northbound to Kimball' },
					{ id: '41221', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Armitage',
				directions: [
					{ id: '40530', label: 'Northbound to Kimball' },
					{ id: '40531', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Sedgwick',
				directions: [
					{ id: '40870', label: 'Northbound to Kimball' },
					{ id: '40871', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Chicago',
				directions: [
					{ id: '40800', label: 'Northbound to Kimball' },
					{ id: '40801', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Merchandise Mart',
				directions: [
					{ id: '40680', label: 'Northbound to Kimball' },
					{ id: '40681', label: 'Southbound to Loop' }
				]
			},
			{
				name: 'Washington/Wells',
				directions: [
					{ id: '40730', label: 'Inner Loop (Clockwise)' },
					{ id: '40731', label: 'Outer Loop' }
				]
			},
			{
				name: 'Quincy',
				directions: [
					{ id: '40040', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'LaSalle/Van Buren',
				directions: [
					{ id: '40160', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Harold Washington Library',
				directions: [
					{ id: '40850', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Adams/Wabash',
				directions: [
					{ id: '40680', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Washington/Wabash',
				directions: [
					{ id: '40850', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'State/Lake',
				directions: [
					{ id: '40260', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Clark/Lake',
				directions: [
					{ id: '40380', label: 'Northbound to Kimball' }
				]
			}
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
		color: '#F9461C',
		type: 'train',
		terminals: ['Midway', 'Loop'],
		stops: [
			{
				name: 'Midway',
				directions: [
					{ id: '40930', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Pulaski',
				directions: [
					{ id: '40960', label: 'Westbound to Midway' },
					{ id: '40961', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Kedzie',
				directions: [
					{ id: '41150', label: 'Westbound to Midway' },
					{ id: '41151', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Western',
				directions: [
					{ id: '40310', label: 'Westbound to Midway' },
					{ id: '40311', label: 'Eastbound to Loop' }
				]
			},
			{
				name: '35th/Archer',
				directions: [
					{ id: '40120', label: 'Westbound to Midway' },
					{ id: '40121', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Ashland',
				directions: [
					{ id: '40170', label: 'Westbound to Midway' },
					{ id: '40171', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Halsted',
				directions: [
					{ id: '40310', label: 'Westbound to Midway' },
					{ id: '40311', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Roosevelt',
				directions: [
					{ id: '41490', label: 'Westbound to Midway' },
					{ id: '41491', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Harold Washington Library',
				directions: [
					{ id: '40730', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'LaSalle/Van Buren',
				directions: [
					{ id: '40040', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Quincy',
				directions: [
					{ id: '40730', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Washington/Wells',
				directions: [
					{ id: '40730', label: 'Westbound to Midway' }
				]
			},
			{
				name: 'State/Lake',
				directions: [
					{ id: '40680', label: 'Westbound to Midway' }
				]
			},
			{
				name: 'Clark/Lake',
				directions: [
					{ id: '40380', label: 'Westbound to Midway' }
				]
			}
		]
	},
	'Pink': {
		color: '#E27EA6',
		type: 'train',
		terminals: ['54th/Cermak', 'Loop'],
		stops: [
			{
				name: '54th/Cermak',
				directions: [
					{ id: '40580', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Cicero',
				directions: [
					{ id: '40420', label: 'Westbound to 54th/Cermak' },
					{ id: '40421', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Kostner',
				directions: [
					{ id: '40600', label: 'Westbound to 54th/Cermak' },
					{ id: '40601', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Pulaski',
				directions: [
					{ id: '40150', label: 'Westbound to 54th/Cermak' },
					{ id: '40151', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Central Park',
				directions: [
					{ id: '40780', label: 'Westbound to 54th/Cermak' },
					{ id: '40781', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Kedzie',
				directions: [
					{ id: '40440', label: 'Westbound to 54th/Cermak' },
					{ id: '40441', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'California',
				directions: [
					{ id: '40740', label: 'Westbound to 54th/Cermak' },
					{ id: '40741', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Western',
				directions: [
					{ id: '40210', label: 'Westbound to 54th/Cermak' },
					{ id: '40211', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Damen',
				directions: [
					{ id: '40830', label: 'Westbound to 54th/Cermak' },
					{ id: '40831', label: 'Eastbound to Loop' }
				]
			},
			{
				name: '18th',
				directions: [
					{ id: '40170', label: 'Westbound to 54th/Cermak' },
					{ id: '40171', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Polk',
				directions: [
					{ id: '40850', label: 'Westbound to 54th/Cermak' },
					{ id: '40851', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Ashland',
				directions: [
					{ id: '40170', label: 'Westbound to 54th/Cermak' },
					{ id: '40171', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Morgan',
				directions: [
					{ id: '40680', label: 'Westbound to 54th/Cermak' },
					{ id: '40681', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Clinton',
				directions: [
					{ id: '40350', label: 'Westbound to 54th/Cermak' },
					{ id: '40351', label: 'Eastbound to Loop' }
				]
			},
			{
				name: 'Clark/Lake',
				directions: [
					{ id: '40380', label: 'Westbound to 54th/Cermak' },
					{ id: '40381', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'State/Lake',
				directions: [
					{ id: '40680', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Washington/Wabash',
				directions: [
					{ id: '40260', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Adams/Wabash',
				directions: [
					{ id: '40850', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Harold Washington Library',
				directions: [
					{ id: '40160', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'LaSalle/Van Buren',
				directions: [
					{ id: '40040', label: 'Inner Loop (Clockwise)' }
				]
			},
			{
				name: 'Quincy',
				directions: [
					{ id: '40730', label: 'Westbound to 54th/Cermak' }
				]
			}
		]
	},
	'Purple': {
		color: '#522398',
		type: 'train',
		terminals: ['Linden', 'Howard', 'Loop'],
		stops: [
			{
				name: 'Linden',
				directions: [
					{ id: '40400', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Central',
				directions: [
					{ id: '41320', label: 'Northbound to Linden' },
					{ id: '41321', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Noyes',
				directions: [
					{ id: '40520', label: 'Northbound to Linden' },
					{ id: '40521', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Foster',
				directions: [
					{ id: '40270', label: 'Northbound to Linden' },
					{ id: '40271', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Davis',
				directions: [
					{ id: '40540', label: 'Northbound to Linden' },
					{ id: '40541', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Dempster',
				directions: [
					{ id: '40690', label: 'Northbound to Linden' },
					{ id: '40691', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Main',
				directions: [
					{ id: '40100', label: 'Northbound to Linden' },
					{ id: '40101', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'South Boulevard',
				directions: [
					{ id: '40450', label: 'Northbound to Linden' },
					{ id: '40451', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Howard',
				directions: [
					{ id: '41490', label: 'Northbound to Linden' },
					{ id: '41491', label: 'Southbound to Loop (Express)' }
				]
			}
		]
	},
	'Yellow': {
		color: '#F9E300',
		type: 'train',
		terminals: ['Dempster-Skokie', 'Howard'],
		stops: [
			{
				name: 'Dempster-Skokie',
				directions: [
					{ id: '40140', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Oakton-Skokie',
				directions: [
					{ id: '41680', label: 'Northbound to Dempster' },
					{ id: '41681', label: 'Southbound to Howard' }
				]
			},
			{
				name: 'Howard',
				directions: [
					{ id: '40490', label: 'Northbound to Dempster' }
				]
			}
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
