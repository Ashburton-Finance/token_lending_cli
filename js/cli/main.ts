import { Blockchain } from './blockchain';
import { assert } from './util';

async function main() {
  // --------------------------------------- init

  const bc = new Blockchain();
  await bc.getConnection();
  await bc.initLendingMarket();
  await bc.initReserve(bc.tokenA, 100, 40);
  await bc.initReserve(bc.tokenB, 10, 4);
  await bc.initObligation();
  await bc.calcAndPrintMetrics();

  // check user lost tokens
  assert(bc.metrics.tokenAUserBalance.value.uiAmount == 100 - 40);
  assert(bc.metrics.tokenBUserBalance.value.uiAmount == 10 - 4);
  // check protocol gained tokens
  assert(bc.metrics.tokenAProtocolBalance.value.uiAmount == 40);
  assert(bc.metrics.tokenBProtocolBalance.value.uiAmount == 4);
  // check user was issued LP tokens in return
  assert(bc.metrics.tokenALPUserBalance.value.uiAmount == 40);
  assert(bc.metrics.tokenBLPUserBalance.value.uiAmount == 4);
  // check total liquidity available
  // @ts-ignore
  assert(bc.metrics.reserveAState.data.liquidity.availableAmount == 40n);
  // @ts-ignore
  assert(bc.metrics.reserveBState.data.liquidity.availableAmount == 4n);

  // --------------------------------------- depositing / withdrawing liquidity

  await bc.depositReserveLiquidity(bc.tokenA, 20);
  await bc.redeemReserveCollateral(bc.tokenA, 10);
  await bc.depositReserveLiquidity(bc.tokenB, 2);
  await bc.redeemReserveCollateral(bc.tokenB, 1);
  await bc.calcAndPrintMetrics();

  // check changes in balances add up
  assert(bc.metrics.tokenAUserBalance.value.uiAmount == 100 - 40 - 20 + 10);
  assert(bc.metrics.tokenAProtocolBalance.value.uiAmount == 40 + 20 - 10);
  assert(bc.metrics.tokenBUserBalance.value.uiAmount == 10 - 4 - 2 + 1);
  assert(bc.metrics.tokenBProtocolBalance.value.uiAmount == 4 + 2 - 1);

  // --------------------------------------- flash loan

  const oldBorrowedAmount = bc.metrics.obligState.data.borrowedValue.toNumber();
  const oldProtocolFee = bc.metrics.tokenAProtocolFeeBalance.value.uiAmount;
  const oldHostFee = bc.metrics.tokenAHostBalance.value.uiAmount;

  await bc.borrowFlashLoan(bc.tokenA, 10);
  await bc.calcAndPrintMetrics();

  //check that fees went up, but the borrowed amount stayed the same
  assert(bc.metrics.obligState.data.borrowedValue.toNumber() == oldBorrowedAmount);
  assert(bc.metrics.tokenAProtocolFeeBalance.value.uiAmount > oldProtocolFee);
  assert(bc.metrics.tokenAHostBalance.value.uiAmount > oldHostFee);

  console.log('All tests passed!');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(-1);
  })
  .then(() => process.exit());
