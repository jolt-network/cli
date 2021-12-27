import { SimulationConfig } from './simulation-config.d';
import validate from './simulation-config.d.validator';
import fs from 'fs-extra';

export const defaultSimulationConfig: Partial<SimulationConfig> = {
	localRpc: 'http://127.0.0.1:8545',
	forkStartPort: 10000,
	forkMaxPorts: 100,
	bonder: '0x0e1eC4802F730e69481742a6d41e3B6B5a6a1d08',
	chainId: 4,
};

export async function loadSimulationConfig(filePath: string): Promise<SimulationConfig> {
	const userConfig: Partial<SimulationConfig> = await fs.readJSON(filePath);

	return validateSimulationConfig({
		...defaultSimulationConfig,
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

export function validateSimulationConfig(partialConfig: Partial<SimulationConfig>): SimulationConfig {
	return validate(partialConfig);
}
