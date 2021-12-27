import { defaultSimulationConfig, validateSimulationConfig } from '../../src/config/simulation-config';
import { categorizeJobMessages, findFreePort } from '../../src/utils/helpers';
import { ProcessManager } from '../../src/utils/process-manager';
import { JobMessage, WorkRequest } from '@jolt-network/cli-utils';
import fs from 'fs-extra';
import { concatMap, Observable } from 'rxjs';
import { SimulationConfig } from 'src/config/simulation-config.d';

const testConfig: Partial<SimulationConfig> = {
	chainId: 4,
	bonder: '0x0e1eC4802F730e69481742a6d41e3B6B5a6a1d08',
	worker: '0x5B6DF8e106ba70E65F92531dfB09FE196D32EaEb',

	jobDefaults: {
		futureBlocks: 0,
		bundleBurst: 1,
		timeToAdvance: 30,
		priorityFee: 10,
	},
};

const jsonFilePath = `.config.test.rinkeby.json`;

export async function testRinkebyBlock(jobPath: string, blockNumber: number): Promise<Observable<WorkRequest>> {
	const envConfig = process.env.ALCHEMYKEY ? { localRpc: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMYKEY}` } : {};
	const jsonConfig = fs.existsSync(jsonFilePath) ? await fs.readJSON(jsonFilePath) : {};

	const config = validateSimulationConfig({
		...defaultSimulationConfig,
		...envConfig,
		...jsonConfig,
		...testConfig,
	});

	const processManager = new ProcessManager();

	if (config.localRpc.includes('127.0.0.1') || config.localRpc.includes('localhost')) {
		throw new Error('Please use an alchemy node. Tests require an archive node.');
	}

	const jobMessage$ = processManager.run<JobMessage>(
		jobPath,
		`./dist/tsc/src/job-wrapper ` +
			`--job ${jobPath} ` +
			`--block ${blockNumber} ` +
			`--worker ${config.worker} ` +
			`--config ${JSON.stringify(config)} ` +
			`--ahead-amount ${config.jobDefaults.futureBlocks} ` +
			`--bundle-burst ${config.jobDefaults.bundleBurst} ` +
			`--time-to-advance ${config.jobDefaults.timeToAdvance} ` +
			`--priority-fee ${config.jobDefaults.priorityFee}`
	);

	const { workRequest$, portRequest$ } = categorizeJobMessages(jobMessage$);

	// handle port requests
	portRequest$
		.pipe(
			concatMap(async (portRequest) => {
				const freePort = await findFreePort(config.forkStartPort, config.forkStartPort + config.forkMaxPorts);
				return { portRequest, freePort };
			})
		)
		.subscribe(({ portRequest, freePort }) => {
			portRequest.process.send({
				type: 'AvailablePort',
				port: freePort,
			});
		});

	workRequest$.subscribe();

	return workRequest$;
}
