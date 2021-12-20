import BONDER_ABI from '../abi/bonder.json';
import { makeTransaction, promptYesNo } from '../utils/actions';
import { getAddressFromPrivateKey } from '../utils/helpers';
import { providers, Wallet, Contract } from 'ethers';
import inquirer from 'inquirer';
import moment from 'moment';

export async function initializeWorker(): Promise<string | undefined> {
	const workerAddress = getAddressFromPrivateKey(global.secrets.joltPrivateKey);

	// verifying correct worker address
	if (global.config.inquireWorkerAddress) {
		const workerConfirmed = await promptYesNo(`Please confirm the address which will work: ${workerAddress}`);
		if (!workerConfirmed) return;
	}

	console.log(`Verifying worker status`, { worker: workerAddress });

	const provider = new providers.JsonRpcProvider({ url: global.config.localRpc }, global.config.chainId);

	const bonder: Contract = new Contract(global.config.bonder, BONDER_ABI, provider);

	const { bondingTimestamp: activationTimestamp, bonded } = await bonder.worker(workerAddress);
	const bondingTime = await bonder.bondingTime();
	const isWorker = bonded.gt(0);

	if (isWorker) {
		console.log(`Worker is activated`);
		return workerAddress;
	}

	/* TODO: define where it should be initialized */
	// setup provider
	const txProvider = new providers.JsonRpcProvider({ url: global.config.txRpc }, global.config.chainId);
	// setup signer
	const signer = new Wallet(global.secrets.joltPrivateKey, txProvider);
	// setup bonder contract for tx
	const bonderTx = new Contract(global.config.bonder, BONDER_ABI, signer);

	const workerIsNew = activationTimestamp == 0;
	if (workerIsNew) {
		console.log(`Your address is not currently a worker nor bonded to be one`);
		const bondWorker = await promptYesNo('Would you like to bond some JOLT in order to start the process?');
		// TODO: how much JOLT do you want to bond?
		if (bondWorker) {
			const getBondedJolt = async (): Promise<number> => {
				const { result } = await inquirer.prompt([
					{
						type: 'number',
						message: 'How many JOLTs do you want to bond?',
						name: 'result',
					},
				]);
				if (isNaN(result)) return await getBondedJolt();
				return result;
			};
			const bondedJolt = await getBondedJolt();
			const bondSuccess = await makeTransaction(bonderTx, 'bond', [bondedJolt]);
			if (bondSuccess) {
				console.info(`Worker will be able to activate in ${moment.duration(bondingTime, 'seconds').humanize(true)}`);
			}
		} else {
			console.info('You need an activated worker to start working jobs');
		}
		return;
	}

	const timeToWait = activationTimestamp * 1000 - Date.now();
	const workerIsBonding = timeToWait > 0;
	if (workerIsBonding) {
		console.log(`Your address is currently in the bonding process`);
		console.info(`Worker will be able to activate in ${moment.duration(timeToWait, 'milliseconds').humanize(true)}`);
		return;
	}

	console.log(`Worker can be activated`);

	const activateWorker = await promptYesNo('Would you like to activate your worker?');
	if (activateWorker) {
		const activateSuccess = await makeTransaction(bonderTx, 'consolidateBond', []);
		if (activateSuccess) {
			console.info(`Worker activated`);
			return workerAddress;
		}
	} else {
		console.info('You need an activated worker to start working jobs');
	}
}
