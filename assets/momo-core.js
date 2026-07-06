(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MomoCore = api;
  if (typeof window !== 'undefined') window.MomoCore = api;
  if (typeof self !== 'undefined') self.MomoCore = api;
  if (typeof globalThis !== 'undefined') globalThis.MomoCore = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  const PAYMENT = {
    CASH: '現金',
    TRANSFER: '轉帳',
    PREPAID_DEBIT: '儲值扣款',
    MIXED: '現金＋儲值扣款',
    PREPAID_TOPUP: '儲值進帳'
  };

  function toMoney(value) {
    return Math.round(Number(value) || 0);
  }

  function isOrderActive(order) {
    return !order || order.syncStatus !== 'cancelled';
  }

  function isCorrectionSlip(order = {}) {
    return Boolean(order && order.correctionSlip)
      || order?.source === 'correction_slip'
      || String(order?.serviceName || '').startsWith('更正單');
  }

  function getTopupChannel(order = {}) {
    return order && order.paymentMethod === PAYMENT.PREPAID_TOPUP && order.topupChannel === PAYMENT.TRANSFER
      ? PAYMENT.TRANSFER
      : PAYMENT.CASH;
  }

  function getMixedCashAmount(order = {}) {
    const total = Math.max(0, Number(order && order.amount) || 0);
    return Math.min(total, Math.max(0, Number(order && order.cashAmount) || 0));
  }

  function getMixedPrepaidAmount(order = {}) {
    return Math.max(0, (Number(order && order.amount) || 0) - getMixedCashAmount(order));
  }

  function emptyMoneyVector() {
    return {
      cash: 0,
      transfer: 0,
      prepaidOut: 0,
      prepaidIn: 0,
      cashPrepaidIn: 0,
      transferPrepaidIn: 0,
      serviceRevenue: 0
    };
  }

  function orderMoneyVector(order = {}) {
    const vector = emptyMoneyVector();
    if (!order || !isOrderActive(order)) return vector;

    const amount = toMoney(order.amount);
    const method = order.paymentMethod || PAYMENT.CASH;
    if (method === PAYMENT.CASH) {
      vector.cash += amount;
      vector.serviceRevenue += amount;
    } else if (method === PAYMENT.TRANSFER) {
      vector.transfer += amount;
      vector.serviceRevenue += amount;
    } else if (method === PAYMENT.PREPAID_DEBIT) {
      vector.prepaidOut += amount;
      vector.serviceRevenue += amount;
    } else if (method === PAYMENT.MIXED) {
      const cash = amount >= 0 ? getMixedCashAmount(order) : toMoney(order.cashAmount);
      vector.cash += cash;
      vector.prepaidOut += amount - cash;
      vector.serviceRevenue += amount;
    } else if (method === PAYMENT.PREPAID_TOPUP) {
      vector.prepaidIn += amount;
      if (getTopupChannel(order) === PAYMENT.TRANSFER) vector.transferPrepaidIn += amount;
      else vector.cashPrepaidIn += amount;
    }
    return vector;
  }

  function orderCorrectionLinesFromVector(vector = {}, source = {}, suffix = '差額') {
    const baseLabel = `${source.date || ''} ${source.customerName || ''} ${source.serviceName || ''}`.trim();
    const makeLine = (key, paymentMethod, label, topupChannel = null) => {
      const amount = toMoney(vector[key]);
      if (!amount) return null;
      return {
        amount,
        paymentMethod,
        topupChannel,
        customerId: source.customerId,
        customerName: source.customerName,
        gender: source.gender || '女',
        serviceName: `更正單：${baseLabel}｜${suffix}${label ? ` ${label}` : ''}`
      };
    };

    return [
      makeLine('cash', PAYMENT.CASH, PAYMENT.CASH),
      makeLine('transfer', PAYMENT.TRANSFER, PAYMENT.TRANSFER),
      makeLine('prepaidOut', PAYMENT.PREPAID_DEBIT, PAYMENT.PREPAID_DEBIT),
      makeLine('cashPrepaidIn', PAYMENT.PREPAID_TOPUP, '儲值現金', PAYMENT.CASH),
      makeLine('transferPrepaidIn', PAYMENT.PREPAID_TOPUP, '儲值轉帳', PAYMENT.TRANSFER)
    ].filter(Boolean);
  }

  function buildLockedOrderCorrectionLines(before = {}, after = {}) {
    const beforeVector = orderMoneyVector(before);
    const afterVector = orderMoneyVector(after);
    if ((before.customerId || '') !== (after.customerId || '')) {
      const negativeBefore = Object.fromEntries(Object.entries(beforeVector).map(([key, value]) => [key, -value]));
      return [
        ...orderCorrectionLinesFromVector(negativeBefore, before, '原顧客沖銷'),
        ...orderCorrectionLinesFromVector(afterVector, after, '新顧客補登')
      ];
    }
    const deltaVector = Object.fromEntries(Object.keys(afterVector).map(key => [
      key,
      (afterVector[key] || 0) - (beforeVector[key] || 0)
    ]));
    return orderCorrectionLinesFromVector(deltaVector, after, '差額');
  }

  function getOrderPrepaidBucket(order = {}) {
    if (order.paymentMethod === PAYMENT.PREPAID_TOPUP) return 'topup';
    if (order.paymentMethod === PAYMENT.PREPAID_DEBIT || order.paymentMethod === PAYMENT.MIXED) return 'debit';
    return null;
  }

  function prepaidKindForTarget(target, bucket, fallback = 'adjustment') {
    const amount = Number(target) || 0;
    if (!amount) return fallback;
    if (bucket === 'topup') return amount > 0 ? 'topup' : 'reversal';
    if (bucket === 'debit') return amount < 0 ? 'debit' : 'reversal';
    return amount > 0 ? 'topup' : 'debit';
  }

  function getOrderPrepaidTarget(order = {}) {
    if (!order || !isOrderActive(order) || !order.customerId) return 0;
    const amount = isCorrectionSlip(order)
      ? toMoney(order.amount)
      : Math.max(0, Number(order.amount) || 0);
    if (order.paymentMethod === PAYMENT.PREPAID_TOPUP) return amount;
    if (order.paymentMethod === PAYMENT.PREPAID_DEBIT) return -amount;
    if (order.paymentMethod === PAYMENT.MIXED) return -getMixedPrepaidAmount(order);
    return 0;
  }

  function prepaidEntryReversed(prepaidLedger = [], entry = {}) {
    if (!entry?.id) return false;
    const marker = `沖銷:${entry.id}`;
    return (prepaidLedger || []).some(item =>
      item?.kind === 'reversal'
      && (item.reversalOfEntryId === entry.id || String(item.note || '').includes(marker))
    );
  }

  function canReversePrepaidEntry(prepaidLedger = [], entry = {}) {
    return Boolean(entry?.id)
      && entry.kind !== 'reversal'
      && Number(entry.signedAmount)
      && !prepaidEntryReversed(prepaidLedger, entry);
  }

  function buildPrepaidReversalPayload(entry = {}, date = new Date().toLocaleDateString('sv-SE')) {
    const amount = toMoney(entry.signedAmount);
    if (!amount) return null;
    return {
      customerId: entry.customerId,
      signedAmount: -amount,
      kind: 'reversal',
      bucket: entry.bucket || (amount > 0 ? 'topup' : 'debit'),
      date,
      sourceOrderId: null,
      serviceName: entry.serviceName || '儲值帳本沖銷',
      paymentMethod: entry.paymentMethod || '',
      note: `手動沖銷:${entry.id}｜原日 ${entry.date}`,
      reversalOfEntryId: entry.id
    };
  }

  return {
    PAYMENT,
    toMoney,
    isOrderActive,
    isCorrectionSlip,
    getTopupChannel,
    getMixedCashAmount,
    getMixedPrepaidAmount,
    emptyMoneyVector,
    orderMoneyVector,
    orderCorrectionLinesFromVector,
    buildLockedOrderCorrectionLines,
    getOrderPrepaidBucket,
    prepaidKindForTarget,
    getOrderPrepaidTarget,
    prepaidEntryReversed,
    canReversePrepaidEntry,
    buildPrepaidReversalPayload
  };
});
