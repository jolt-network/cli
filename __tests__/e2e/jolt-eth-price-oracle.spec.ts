import { testRinkebyBlock } from './common';

describe('jolt-eth-price-oracle', () => {
	it('should be workable when the block has not been worked', (done) => {
		(async () => {
			const workRequest$ = await testRinkebyBlock(
				'node_modules/@jolt-network/cli-jobs/dist/rinkeby/jolt-eth-price-oracle',
				9833014
			);
			workRequest$.subscribe((workRequest) => {
				const { burst } = workRequest;
				expect(workRequest).toMatchObject({
					type: 'WorkRequest',
					job: 'JOLT/ETH price oracle',
					correlationId: 'jolt/eth-price-oracle',
					burst: [
						{
							unsignedTxs: [
								{
									chainId: 4,
									data: '0x4a6ee1b100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
									from: '0x5B6DF8e106ba70E65F92531dfB09FE196D32EaEb',
									gasLimit: {
										hex: '0x1e8480',
										type: 'BigNumber',
									},
									maxFeePerGas: {
										hex: '0x02540be40b',
										type: 'BigNumber',
									},
									maxPriorityFeePerGas: {
										hex: '0x02540be400',
										type: 'BigNumber',
									},
									nonce: 16084,
									to: '0x190568b7A4E97ccaFe089040afF65F06Db15Ea47',
									type: 2,
								},
							],
							targetBlock: 9833014,
							logId: burst[0].logId,
						},
					],
				});
				done();
			});
		})();
	}, 80000);

	it('should not be workable when in cooldown', (done) => {
		(async () => {
			const workRequest$ = await testRinkebyBlock(
				'node_modules/@jolt-network/cli-jobs/dist/rinkeby/jolt-eth-price-oracle',
				9833018
			);
			workRequest$.subscribe({
				next: (workRequest) => {
					expect(workRequest).toBeNull();
					done();
				},
				complete: () => done(),
			});
		})();
	}, 80000);
});
