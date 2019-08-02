const commander = require('commander');
const yamlParser = require('read-yaml');
const deepFreeze = require('deep-freeze');
const path = require('./path');

<<<<<<< HEAD
function parseNmosArguments(arguments) {
	if(!arguments.nmos) {
		return null;
	}

	return arguments.nmos;
||||||| merged common ancestors
function parseNmosArguments(arguments) {
    if(!arguments.nmos) {
        return null;
    }

    return arguments.nmos;
=======
function parseNmosArguments(args) {
    return args.nmos || null;
>>>>>>> master
}

<<<<<<< HEAD
function parseArguments(arguments) {
	const nmosArguments = parseNmosArguments(arguments);

	const config = Object.assign({}, arguments, {
		port: arguments.port || '3030',
		folder: path.sanitizeDirectoryPath(arguments.folder),
		cpp: path.sanitizeDirectoryPath(arguments.cpp),
		influxURL: `http://${arguments.influx.hostname}:${arguments.influx.port}`,
		databaseURL: `mongodb://${arguments.database.hostname}:${arguments.database.port}`,
		nmos: nmosArguments,
		developmentMode: arguments.dev || false,
		liveMode: arguments.liveMode || arguments.live || false
	});

	const webappDomain = process.env.EBU_LIST_WEB_APP_DOMAIN || config.webappDomain;
	config.webappDomain = webappDomain || 'http://localhost:8080';
	console.log('config.webappDomain:', config.webappDomain);

	const liveModeEnv = (process.env.EBU_LIST_LIVE_MODE !== undefined) && (process.env.EBU_LIST_LIVE_MODE === 'true');
	config.liveMode = liveModeEnv || config.liveMode;
	console.log('config.liveMode:', config.liveMode);

	const dumpServerAddr = process.env.EBU_LIST_DUMP_SERVER_ADDR || 'http://172.17.0.1:3000'
	config.dumpServerAddr = dumpServerAddr;
	console.log('config.dumpServerAddr: ', config.dumpServerAddr);

	return config;
||||||| merged common ancestors
function parseArguments(arguments) {
    const nmosArguments = parseNmosArguments(arguments);

    const config = Object.assign({}, arguments, {
        port: arguments.port || '3030',
        folder: path.sanitizeDirectoryPath(arguments.folder),
        cpp: path.sanitizeDirectoryPath(arguments.cpp),
        influxURL: `http://${arguments.influx.hostname}:${arguments.influx.port}`,
        databaseURL: `mongodb://${arguments.database.hostname}:${arguments.database.port}`,
        nmos: nmosArguments,
        developmentMode: arguments.dev || false,
        liveMode: arguments.liveMode || arguments.live || false
    });

    const webappDomain = process.env.EBU_LIST_WEB_APP_DOMAIN || config.webappDomain;
    config.webappDomain = webappDomain || 'http://localhost:8080';
    console.log('config.webappDomain:', config.webappDomain);

    const liveModeEnv = (process.env.EBU_LIST_LIVE_MODE !== undefined) && (process.env.EBU_LIST_LIVE_MODE === 'true');
    config.liveMode = liveModeEnv || config.liveMode;
    console.log('config.liveMode:', config.liveMode);

    return config;
=======
function parseArguments(args) {
    const nmosArguments = parseNmosArguments(args);

    const config = Object.assign({}, args, {
        port: args.port || '3030',
        folder: path.sanitizeDirectoryPath(args.folder),
        cpp: path.sanitizeDirectoryPath(args.cpp),
        influxURL: `http://${args.influx.hostname}:${args.influx.port}`,
        databaseURL: `mongodb://${args.database.hostname}:${
            args.database.port
        }`,
        rabbitmqUrl: `amqp://${args.rabbitmq.hostname}:${args.rabbitmq.port}`,
        nmos: nmosArguments,
        developmentMode: args.dev || false,
        liveMode: args.liveMode || args.live || false,
    });

    const webappDomain =
        process.env.EBU_LIST_WEB_APP_DOMAIN || config.webappDomain;
    config.webappDomain = webappDomain || 'http://localhost:8080';
    console.log('config.webappDomain:', config.webappDomain);

    const liveModeEnv =
        process.env.EBU_LIST_LIVE_MODE !== undefined &&
        process.env.EBU_LIST_LIVE_MODE === 'true';
    config.liveMode = liveModeEnv || config.liveMode;
    console.log('config.liveMode:', config.liveMode);

    const apiUrl = `http://localhost:${config.port}/api`;
    config.apiUrl = apiUrl;

    return config;
>>>>>>> master
}

commander
<<<<<<< HEAD
	.arguments('<configFile>')
	.option('--dev', 'Development mode')
	.option('--live', 'Live mode')
	.option('--monitor', 'Monitor extension')
	.action((configFile, options) => {
		config = yamlParser.sync(configFile);
		config = Object.assign(config, yamlParser.sync("version.yml"));
		config.dev = options.dev;
		config.live = options.live;
	})
	.parse(process.argv);
||||||| merged common ancestors
    .arguments('<configFile>')
    .option('--dev', 'Development mode')
    .option('--live', 'Live mode')
    .action((configFile, options) => {
        config = yamlParser.sync(configFile);
        config = Object.assign(config, yamlParser.sync("version.yml"));
        config.dev = options.dev;
        config.live = options.live;
    })
    .parse(process.argv);
=======
    .arguments('<configFile>')
    .option('--dev', 'Development mode')
    .option('--live', 'Live mode')
    .action((configFile, options) => {
        config = yamlParser.sync(configFile);
        config = Object.assign(config, yamlParser.sync('version.yml'));
        config.dev = options.dev;
        config.live = options.live;
    })
    .parse(process.argv);
>>>>>>> master

<<<<<<< HEAD
if(typeof config === 'undefined') {
	console.error('no config file given!');
	process.exit(1);
||||||| merged common ancestors
if(typeof config === 'undefined') {
    console.error('no config file given!');
    process.exit(1);
=======
if (typeof config === 'undefined') {
    console.error('no config file given!');
    process.exit(1);
>>>>>>> master
}

const args = parseArguments(config);
module.exports = deepFreeze(args);
