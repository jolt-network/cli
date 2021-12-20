import { Config } from './config.d';
import validate from './config.d.validator';
import fs from 'fs-extra';

const defaultConfig: Partial<Config> = {
	localRpc: 'http://127.0.0.1:8545',
	chainId: 4,
	bonder: '0x35303c76eE37A0a3f9031E0E9D3B3E7214ed9C4f',
	jobs: [],
	gasLimit: '300000',
	forkStartPort: 10000,
	forkMaxPorts: 100,
	recommendedGasPriceIndex: 0,
	inquireWorkerAddress: true,
	initializationGasLimit: 200000,
	simulateBundle: true,
	flashbotRelays: ['https://relay.flashbots.net'],
};

export async function loadConfig(filePath: string): Promise<Config> {
	const userConfig: Partial<Config> = await fs.readJSON(filePath);

	return validateConfig({
		...defaultConfig,
		...userConfig,
		jobDefaults: {
			futureBlocks: 0,
			bundleBurst: userConfig.chainId === 1 ? 6 : 1,
			timeToAdvance: userConfig.chainId === 1 ? 60 : 0,
			priorityFee: 2,
			...userConfig.jobDefaults,
		},
	});
}

export function validateConfig(partialConfig: Partial<Config>): Config {
	const config = validate(partialConfig);

	if (config.flashbotRelays.length === 0) {
		throw new Error('At least one relay should be specified inside flashbotRelays');
	}

	return config;
}
