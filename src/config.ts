// Configuration
// Just returns an object that has all the parameters
// Someday integrate with 'command-line-args' or 'dotenv'

// This includes all the parameters used by the server and the default values.
// Do no change this file but instead create a 'server.user-config-file' (default
// name of "iamus.json") whos values overlay these default values.

'use strict';

import fs from 'fs';

import deepmerge from 'deepmerge';

import { IsNullOrEmpty, IsNotNullOrEmpty, getMyExternalIPAddress } from '@Tools/Misc';
import { httpRequest, httpsRequest } from '@Tools/Misc';
import { Logger } from '@Tools/Logging';
import 'dotenv/config'

// All the possible configuration parameters.
// This sets defaults values and is over-written by environment variables and
//     supplied configuration file contents.
export let Config = {
    // The metaverse identity
    'metaverse': {
        'metaverse-name': process.env.METAVERSE_SERVER_URL ?? 'Overte noobie',
        'metaverse-nick-name': process.env.METAVERSE_NICK_NAME ??'Noobie',
        'metaverse-server-url': process.env.METAVERSE_SERVER_URL ?? '',   // if empty, set to self
        'default-ice-server-url': process.env.DEFAULT_ICE_SERVER_URL ?? '', // if empty, set to self
        'dashboard-url':  process.env.DASHBOARD_URL ?? 'https://dashboard.vircadia.com'
    },
    // Server network parameters
    'server': {
        'listen-host': process.env.LISTEN_HOST ?? '0.0.0.0',
        'listen-port': process.env.LISTEN_PORT ?? 9400,
        'key-file': process.env.KEY_FILE ?? '',           // if supplied, do https
        'cert-file': process.env.CERT_FILE ?? '',
        'max-body-size': process.env.MAX_BODY_SIZE ?? 300000,  // maximum body size for input JSON bodies
        'static-base': process.env.STATIC_BASE ?? '/static', // base of static data URL
        'user-config-file': process.env.USER_CONFIG_FILE ?? './iamus.json', // startup config over-ride
        'server-version': {       // overlaid with VERSION.json
            'version-tag': process.env.VERSION_TAG ?? '1.1.1-20200101-abcdefg'
        }
    },
    // Authorization token parameters
    'auth': {
        'domain-token-expire-hours': process.env.DOMAIN_TOKEN_EXPIRE_HOURS ?? 24 * 365,  // one year
        'owner-token-expire-hours': process.env.OWNER_TOKEN_EXPIRE_HOURS ?? 24 * 7      // one week
    },
    // Control of the metaverse operations
    'metaverse-server': {
        'http-error-on-failure': process.env.HTTP_ERROR_ON_FAILURE ?? true,  // whether to include x-vircadia error header
        'error-header': process.env.ERROR_HEADER ?? 'x-vircadia-error-handle',

        'metaverse-info-addition-file': process.env.METAVSE_INFO_ADDITION_FILE ?? './metaverse_info.json',
        'max-name-length': process.env.MAX_NAME_LENGTH ?? 32,      // the max characters a domain, place, account, ... name

        'session-timeout-minutes': process.env.SESSION_TIMEOUT_MINUTES ?? 5,
        'heartbeat-seconds-until-offline': process.env.HEARTBEAT_SECONDS_UNTIL_ONLINE ?? 5 * 60,      // seconds until non-heartbeating user is offline
        'domain-seconds-until-offline': process.env.DOMAIN_SECONDS_UNTIL_ONLINE ?? 10 * 60,        // seconds until non-heartbeating domain is offline
        'domain-seconds-check-if-online': process.env.DOMAIN_CHECK_IF_ONLINE ?? 2 * 60,       // how often to check if a domain is online
        'handshake-request-expiration-minutes': process.env.HANDSHAKE_REQUEST_EXPIRE_MINUTES ?? 1,      // minutes that a handshake friend request is active
        'connection-request-expiration-minutes': process.env.CONNECTION_REQUEST_EXPIRE_MINUTES ?? 60 * 24 * 4, // 4 days
        'friend-request-expiration-minutes': process.env.FRIEND_REQUEST_EXPIRE_MINUTES ?? 60 * 24 * 4,     // 4 days

        'place-current-timeout-minutes': process.env.PLACE_CURRENT_TIMEOUT_MINUTES ?? 5,             // minutes until current place info is stale
        'place-inactive-timeout-minutes': process.env.PLACE_INACTIVE_TIMEOUT_MINUTES ?? 60,           // minutes until place is considered inactive
        'place-check-last-activity-seconds': process.env.PLACE_CHECK_LAST_ACTIVE_ ?? (3*60)-5,  // seconds between checks for Place lastActivity updates

        // redirection URL used for initial domain token generation,
        //   "METAVERSE_SERVER_URL" is replaced (from Config.metaverse.metaverse-server-url)
        //   "DASHBOARD_URL" is replaced (from Config.metaverse.dashboard-url)
        'tokengen_url': process.env.TOKENGEN_URL ?? 'METAVERSE_SERVER_URL/static/DomainTokenLogin.html',
        // 'tokengen_url': 'DASHBOARD_URL?metaverse=METAVERSE_SERVER_URL&page=domain',

        // When account of this name is created, add 'admin' role to it
        //    Initially as empty so random people cannot create an admin account
        //    The account named here MUST be controlled by the server's admin
        'base-admin-account': process.env.BASE_ADMIN_ACCOUNT ?? '',

        // If to assume domain network_address if on is not set
        'fix-domain-network-address': process.env.FIX_DOMAIN_NETWORK_ADDRESS ?? true,
        // Whether allowing temp domain name creation
        'allow-temp-domain-creation': process.env.ALLOW_TEMP_DOMAIN_CREATION ?? false,

        // Email verification on account creation
        'enable-account-email-verification': process.env.ENABLE_ACCOUNT_EMAIL_VERIFICATION ?? false,
        'email-verification-timeout-minutes': process.env.EMAIL_VERIFICATION_TIMEOUT_MINUTES ?? 1440, // minutes to wait for email verification (1440=one day)
        // default is in 'static' dir. If you put in 'config' dir, use 'config/verificationEmail.html'.
        //   "VERIFICATION_URL" is replaced with the computed URL (build with Config.metaverse-server-url)
        //   "METAVERSE_NAME" is replaced (from Config.metaverse.metaverse-name)
        //   "SHORT_METAVERSE_NAME" is replaced (from Config.metaverse.metaverse-nick-name)
        'email-verification-email-body': process.env.EMAIL_VERIFICATION_EMAIL_VERIFICATION ?? 'dist/static/verificationEmail.html',  // file to send
        'email-verification-from': process.env.EMAIL_VERIFICATION_EMAIL_FROM ?? '', // who the email is From
        // When user follows the verification URL, they are redirected to one of these two URLs
        //   "METAVERSE_SERVER_URL" is replaced (from Config.metaverse.metaverse-server-url)
        //   "DASHBOARD_URL" is replaced (from Config.metaverse.dashboard-url)
        //   "ACCOUNT_ID" is replaced with the verifying account id
        //   "FAILURE_REASON" is replaced with the reason for verification failure (url encoded)
        'email-verification-success-redirect': process.env.EMAIL_VERIFICATION_REDIRECT ?? 'METAVERSE_SERVER_URL/static/verificationEmailSuccess.html',
        'email-verification-failure-redirect': process.env.EMAIL_VERIFICATION_FAILURE_REDIRECT ?? 'METAVERSE_SERVER_URL/static/verificationEmailFailure.html?r=FAILURE_REASON'
    },
    // SMTP mail parameters for out-bound email
    // This is the structure that is passed to NodeMailer's SMTP transport.
    // Check out the documentation at https://nodemailer.com/smtp/
    // For SMTP outbound, setup your email account on your service and
    //     update SMTP-HOSTNAME, SMTP-USER, and SMTP-PASSWORD with your info.
    'nodemailer-transport-config': {
        'host': process.env.SMTP_HOSTNAME ?? 'SMTP-HOSTNAME',
        'port': process.env.SMTP_PORT ?? 465,    // 587 if secure=false
        'secure': process.env.SMTP_SECURE ?? true,
        'auth': {
            'user': process.env.SMTP_USER ?? 'SMTP-USER',
            'pass': process.env.SMTP_PASSWORD ?? 'SMTP-PASSWORD'
        }
    },
    'monitoring': {
        'enable': process.env.MONITORING_ENABLE ?? true,           // enable value monitoring
        'history': process.env.MONITORING_HISTORY ?? true           // whether to keep value history
    },
    // Setup for MongoDB access
    'database': {
        'db-host': process.env.DB_HOST ?? 'localhost',
        'db-port': process.env.DB_PORT ?? 27017,
        'db': process.env.DB ?? 'tester',
        'db-user': process.env.DB_USER ?? 'metaverse',
        'db-pw': process.env.DB_PW ?? 'nooneknowsit',
        'db-authdb': process.env.DB_AUTHDB ?? 'admin',
        'db-connection': process.env.DB_CONNECTION ?? ''   // connection string replaces above if supplied
    },
    // MongoDB account configured for database backup script
    'backup': {
        "backup-user": process.env.BACKUP_USER ?? "backuper",  // database backup user account (for BackupDb.sh)
        "backup-pw": process.env.BACKUP_PW ?? "nooneknowsit", // database backup user password (for BackupDb.sh)
        "backup-dir": process.env.BACKUP_DIR ?? "directoryName", // Backup file directory. Optional. Defaults to "./DatabaseBackup"
        "authenticationDatabase": process.env.BACKUP_AUTHENTICATION_DATABASE ?? "databaseName" // auth db for backup user. Optional. Defaults to "admin"
    },
    'debug': {
        'loglevel': process.env.LOG_LEVEL ?? 'info',

        // Winston logging configuration
        'log-to-files': process.env.LOG_TO_FILES ?? true,         // if to log to files
        'log-filename': process.env.LOG_FILENAME ?? 'iamus.log',  // filename for log files
        'log-directory': process.env.LOG_DIRECTORY ?? './logs',    // directory to place logs
        'log-max-size-megabytes': process.env.LOG_MAX_SIZE_MEGABYTES ?? 100,// max mega-bytes per log file
        'log-max-files': process.env.LOG_MAX_FILES ?? 10,          // number of log files to create
        'log-tailable': process.env.LOG_TAILABLE ?? true,         // if to always output to main named log file
        'log-compress': process.env.LOG_COMPRESS ?? false,        // if to compress old log files

        'log-to-console': process.env.LOG_TO_CONSOLE ?? false,      // if to additionally log to the console

        'devel': process.env.DEVEL ?? false,

        // Control of what debug information is logged
        'request-detail': process.env.REQUEST_DETAIL ?? false,  // output the received request info when received
        'request-body': process.env.REQUEST_BODY ?? false,    // output the received request body when received
        'metaverseapi-response-detail': process.env.METAVERSEAPI_RESPONSE_DETAIL ?? false, // output the response sent back from MetaverseAPI requests
        'query-detail': process.env.QUERY_DETAIL ?? false,    // outputs details when selecting query parameters
        'db-query-detail': process.env.DB_QUERY_DETAIL || false, // outputs details about DB queries
        'field-setting': process.env.FIELD_SETTING ?? false    // Details of entity field getting and setting
    }
};

// Check environment variables that overlay the defaults above.
// Also read the configuration file and overlay the values.
export async function initializeConfiguration(): Promise<void> {

    // Read in the configuration file if it exists and overlay the values.
    try {
        const userConfigFile = Config.server["user-config-file"];
        if (IsNotNullOrEmpty(userConfigFile)) {
            Logger.debug(`initializeConfiguration: reading configuration file ${userConfigFile}`);
            const userConfig = await readInJSON(userConfigFile);
            if (IsNotNullOrEmpty(userConfig)) {
                // this overlays all the Config values with values from the user's file
                Config = deepmerge(Config, userConfig);
                // Logger.debug(`initializeConfiguration: processed configuration file ${userConfigFile}`);
            };
        };
    }
    catch (e) {
        Logger.error('initializeConfiguration: exception adding user config: ' + e);
    }

    // Read in version info from distribution version file
    try {
        let versionInfo: any;
        // depending on how built, version file might be in different places
        for (const versionFile of [ './VERSION.json' , './dist/VERSION.json' ]) {
            if (fs.existsSync(versionFile)) {
                versionInfo = await readInJSON(versionFile);
                break;
            };
        };
        if (IsNullOrEmpty(versionInfo)) {
            versionInfo = {
                'version-tab': 'unknown'
            };
        };
        Config.server["server-version"] = versionInfo;
        Logger.debug(`initializeConfiguration: version info: ${JSON.stringify(versionInfo, null, 4)}`);
    }
    catch (e) {
        Logger.error('initializeConfiguration: exception reading version info: ' + e);
    };

    // If no ice server address is specified, assume ours
    if (IsNullOrEmpty(Config.metaverse["default-ice-server-url"])) {
        const myAddr = await getMyExternalIPAddress();
        Logger.debug(`initializeConfiguration: made ice server addr of ${myAddr}`);
        Config.metaverse["default-ice-server-url"] = myAddr;
    };
    // If no external metaverse server url is specified, make one from our address
    if (IsNullOrEmpty(Config.metaverse["metaverse-server-url"])) {
        const myAddr = await getMyExternalIPAddress();
        const newUrl = `http://${myAddr}:${Config.server["listen-port"].toString()}/`;
        Logger.debug(`initializeConfiguration: built metaverse url of ${newUrl}`);
        Config.metaverse["metaverse-server-url"] = newUrl;
    };

    // Make sure the metaverse-server-url does not end in a slash.
    // There is a bunch of code that expects to add the "/api/v1/..." to this variable.
    let msu: string = Config.metaverse["metaverse-server-url"];
    while (msu.endsWith('/')) {
        msu = msu.slice(0, -1);
    };
    Config.metaverse["metaverse-server-url"] = msu;

    // Write a subset of the built configuration information into the 'static' directory
    //    so the static pages will know our configuration.
    const configSubset: any = {};
    configSubset.metaverse = Config.metaverse;
    configSubset.server = Config.server;
    configSubset.debug = Config.debug;

    // Depending on how started, the static dir can be in different places
    const staticBase: string = Config.server['static-base'];
    for (const staticDir of [ '.' + staticBase, './dist' + staticBase ]) {
        if (fs.existsSync(staticDir)) {
            const configSubsetFilename = staticDir + '/config.json';
            try {
                fs.writeFileSync(configSubsetFilename, JSON.stringify(configSubset));
                Logger.info(`initializeConfiguration: wrote static config subset to ${configSubsetFilename}`);
            }
            catch (err) {
                Logger.error(`initializeConfiguration: error writing ${configSubsetFilename}: ${err}`);
            };
            break;
        };
    };

    // Logger.debug(`initializeConfiguration: debug setting: ${JSON.stringify(Config.debug)}`);
    return;
};

// Utility routine that reads in JSON content from either an URL or a filename.
// Returns the parsed JSON object or 'undefined' if any errors.
export async function readInJSON(pFilenameOrURL: string): Promise<any> {
    let configBody: string;
    if (pFilenameOrURL.startsWith('http://')) {
        configBody = await httpRequest(pFilenameOrURL);
    }
    else {
        if (pFilenameOrURL.startsWith('https://')) {
            configBody = await httpsRequest(pFilenameOrURL);
        }
        else {
            try {
                // We should technically sanitize this filename but if one can change the environment
                //    or config file variables, the app is already poned.
                configBody = fs.readFileSync(pFilenameOrURL, 'utf-8');
            }
            catch (err) {
                if(err.code === 'ENOENT')
                    Logger.debug('No configuration file found. Using environment variables or defaults.');
                else
                    Logger.debug(`readInJSON: failed read of user config file ${pFilenameOrURL}: ${err}`);
            };
        };
    };
    if (IsNotNullOrEmpty(configBody)) {
        return JSON.parse(configBody);
    };
    return undefined;
};

export default Config;
