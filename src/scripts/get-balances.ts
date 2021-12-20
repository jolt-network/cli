import BONDER_ABI from '../abi/bonder.json';
import JOLT_NATIVE_CURRENCY_PRICE_ORACLE from '../abi/jolt-native-currency-price-oracle.json';
import JOLT_ABI from '../abi/jolt.json';
import { parseUnits } from '@ethersproject/units';
import { Contract, BigNumber, providers } from 'ethers';

export async function getTokenBalanceInETH(
	provider: providers.JsonRpcProvider,
	walletAddress: string,
	joltAddress: string,
	bonderAddress: string,
	joltNativeCurrencyOracleAddress: string,
	blockNumber: number
): Promise<BigNumber> {
	const jolt = new Contract(joltAddress, JOLT_ABI, provider);
	const bonder = new Contract(bonderAddress, BONDER_ABI, provider);
	const joltNativeCurrencyOracle = new Contract(joltNativeCurrencyOracleAddress, JOLT_NATIVE_CURRENCY_PRICE_ORACLE, provider);

	const tokenBalance: BigNumber = await jolt.callStatic.balanceOf(walletAddress, { blockTag: blockNumber });
	const tokenBonds: BigNumber = await bonder.callStatic.bonded(walletAddress, { blockTag: blockNumber });
	const tokenTotal: BigNumber = tokenBalance.add(tokenBonds);

	// FIXME: this is just wrong, quote returns the JOLT amount given native currency as input (the inverse of what we want to do here)
	const base: BigNumber = parseUnits('10', 'ether');
	const quote: BigNumber = await joltNativeCurrencyOracle.callStatic.quote(base, { blockTag: blockNumber });

	return tokenTotal.mul(base).div(quote);
}
