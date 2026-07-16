const assert = require('node:assert/strict');
const MomoCore = require('../assets/momo-core.js');

const {
  PAYMENT,
  buildLockedOrderCorrectionLines,
  buildPrepaidReversalPayload,
  canReversePrepaidEntry,
  evaluatePwaReloadGuard,
  getMixedCashAmount,
  getMixedPrepaidAmount,
  getOrderPrepaidBucket,
  getOrderPrepaidTarget,
  isCorrectionSlip,
  orderMoneyVector,
  prepaidEntryReversed,
  prepaidKindForTarget,
  shouldRetryCalendarSync
} = MomoCore;

function baseOrder(overrides = {}) {
  return {
    id: 'ord_1',
    date: '2026-06-30',
    customerId: 'cust_a',
    customerName: 'Customer A',
    gender: 'female',
    serviceName: 'Color',
    amount: 1000,
    paymentMethod: PAYMENT.CASH,
    syncStatus: 'active',
    ...overrides
  };
}

{
  const order = baseOrder({
    paymentMethod: PAYMENT.MIXED,
    amount: 1800,
    cashAmount: 600
  });

  assert.equal(getMixedCashAmount(order), 600);
  assert.equal(getMixedPrepaidAmount(order), 1200);
  assert.equal(getOrderPrepaidTarget(order), -1200);
}

{
  const before = baseOrder({ paymentMethod: PAYMENT.CASH, amount: 1000 });
  const after = baseOrder({ paymentMethod: PAYMENT.PREPAID_DEBIT, amount: 1000 });
  const lines = buildLockedOrderCorrectionLines(before, after);

  assert.deepEqual(lines.map(line => [line.paymentMethod, line.amount]), [
    [PAYMENT.CASH, -1000],
    [PAYMENT.PREPAID_DEBIT, 1000]
  ]);
  assert(lines.every(line => line.serviceName.includes('更正單')));
}

{
  const before = baseOrder({ customerId: 'cust_a', customerName: 'Customer A', amount: 800 });
  const after = baseOrder({ customerId: 'cust_b', customerName: 'Customer B', amount: 1200 });
  const lines = buildLockedOrderCorrectionLines(before, after);

  assert.deepEqual(lines.map(line => [line.customerId, line.paymentMethod, line.amount]), [
    ['cust_a', PAYMENT.CASH, -800],
    ['cust_b', PAYMENT.CASH, 1200]
  ]);
}

{
  const topupRefund = baseOrder({
    correctionSlip: true,
    paymentMethod: PAYMENT.PREPAID_TOPUP,
    amount: -500
  });

  assert.equal(isCorrectionSlip(topupRefund), true);
  assert.equal(getOrderPrepaidBucket(topupRefund), 'topup');
  assert.equal(getOrderPrepaidTarget(topupRefund), -500);
  assert.equal(prepaidKindForTarget(-500, 'topup'), 'reversal');
}

{
  const cancelled = baseOrder({ syncStatus: 'cancelled', amount: 1000 });
  assert.deepEqual(orderMoneyVector(cancelled), MomoCore.emptyMoneyVector());
}

{
  const entry = {
    id: 'txn_1',
    customerId: 'cust_a',
    signedAmount: 2000,
    kind: 'topup',
    bucket: 'topup',
    date: '2026-07-01',
    serviceName: 'Prepaid topup',
    paymentMethod: PAYMENT.PREPAID_TOPUP
  };
  const ledger = [entry];
  const payload = buildPrepaidReversalPayload(entry, '2026-07-06');
  const reversedLedger = [
    ...ledger,
    { id: 'txn_2', kind: 'reversal', reversalOfEntryId: 'txn_1', signedAmount: -2000 }
  ];

  assert.equal(canReversePrepaidEntry(ledger, entry), true);
  assert.deepEqual(
    {
      customerId: payload.customerId,
      signedAmount: payload.signedAmount,
      kind: payload.kind,
      bucket: payload.bucket,
      date: payload.date,
      sourceOrderId: payload.sourceOrderId,
      reversalOfEntryId: payload.reversalOfEntryId
    },
    {
      customerId: 'cust_a',
      signedAmount: -2000,
      kind: 'reversal',
      bucket: 'topup',
      date: '2026-07-06',
      sourceOrderId: null,
      reversalOfEntryId: 'txn_1'
    }
  );
  assert.equal(prepaidEntryReversed(reversedLedger, entry), true);
  assert.equal(canReversePrepaidEntry(reversedLedger, entry), false);
}

{
  assert.deepEqual(
    evaluatePwaReloadGuard({ at: 1000 }, 31000, 90000),
    { allow: false, retryAfterMs: 60000 }
  );
  assert.deepEqual(
    evaluatePwaReloadGuard({ at: 1000 }, 91000, 90000),
    { allow: true, retryAfterMs: 0 }
  );
}

{
  assert.equal(shouldRetryCalendarSync({ online: true, errorName: 'AbortError', retryAttempt: 0 }), true);
  assert.equal(shouldRetryCalendarSync({ online: true, status: 503, retryAttempt: 0 }), true);
  assert.equal(shouldRetryCalendarSync({ online: true, status: 401, retryAttempt: 0 }), false);
  assert.equal(shouldRetryCalendarSync({ online: true, status: 503, retryAttempt: 1 }), false);
  assert.equal(shouldRetryCalendarSync({ online: false, errorName: 'TypeError', retryAttempt: 0 }), false);
}

console.log('momo-core tests passed');
