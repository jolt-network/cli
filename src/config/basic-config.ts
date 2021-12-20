export interface JobDefaults {
	futureBlocks: number;
	bundleBurst: number;
	timeToAdvance: number;
	priorityFee: number;
}

export interface BasicConfig {
	localRpc: string;
	chainId: number;
	forkStartPort: number;
	forkMaxPorts: number;
	bonder: string;
	logs?: ConfigLogs;
	topMaxFeePerGas?: string;
	jobDefaults: JobDefaults;
}

export interface ConfigLogs {
	dailyRotateFile?: {
		default?: any;
		exceptions?: any;
	};
}
