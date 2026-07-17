const assert = require('node:assert/strict');
const MomoCore = require('../assets/momo-core.js');

const {
  PAYMENT,
  EXPENSE_PAYMENT,
  buildLockedOrderCorrectionLines,
  buildOrderPrepaidDateAdjustments,
  buildPrepaidLedgerUploadBatches,
  buildPrepaidReversalPayload,
  buildServiceMetricDictionary,
  calculatePeriodKpis,
  calculateCloseoutTotals,
  planPrepaidLedgerReconciliation,
  calculateEffectiveTimeYield,
  canReversePrepaidEntry,
  classifyCrmServiceCycle,
  classifyMemoryPressure,
  classifyMainThreadStall,
  buildDataCorrectionQueue,
  buildCrmObservationProfile,
  buildCrmServiceObservations,
  calculateCrmSpendTrend,
  calculateCrmVisitPaceTrend,
  cloneJsonValue,
  evaluatePwaReloadGuard,
  evaluatePreviousRuntimeSession,
  escapeCsvCell,
  getMixedCashAmount,
  getMixedPrepaidAmount,
  getOrderPrepaidBucket,
  getOrderPrepaidTarget,
  groupRecentRowsByCustomer,
  findPotentialDuplicateCustomerGroups,
  isCorrectionSlip,
  isFiniteNumericInput,
  isValidISODate,
  normalizeServiceName,
  normalizePotentialDuplicateCustomerName,
  normalizeExpensePaymentMethod,
  orderMoneyVector,
  prepaidEntryReversed,
  prepaidKindForTarget,
  resolveServiceMetric,
  resolveEffectiveMinutes,
  shouldRetryCalendarSync,
  sanitizeCsvCellValue,
  upsertGeneratedSalaryExpense,
  validateAndNormalizeBackupPayload
} = MomoCore;

{
  assert.equal(normalizePotentialDuplicateCustomerName(' Ｍａｒｕｋｏ '), 'maruko');
  assert.equal(normalizePotentialDuplicateCustomerName('王 小 明'), '王小明');

  const groups = findPotentialDuplicateCustomerGroups([
    { id: 'cust_1', name: '王小明', updatedAt: '2026-07-01T00:00:00Z' },
    { id: 'cust_2', name: ' 王 小明 ', updatedAt: '2026-07-02T00:00:00Z' },
    { id: 'cust_3', name: '王小美' },
    { id: 'cust_4', name: '王小明', archivedAt: '2026-07-03T00:00:00Z' },
    { id: 'cust_5', name: '王小明', mergedIntoCustomerId: 'cust_1' }
  ], { cust_1: 2, cust_2: 3, cust_4: 99 });

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].customerIds, ['cust_1', 'cust_2']);
  assert.equal(groups[0].count, 2);
  assert.equal(groups[0].orderCount, 5);
  assert.equal(groups[0].latestUpdatedAt, '2026-07-02T00:00:00Z');
}

{
  const duplicateGroup = {
    key: 'maruko',
    displayName: 'Maruko',
    count: 2,
    customerIds: ['cust_a', 'cust_b'],
    customers: [{ id: 'cust_a', name: 'Maruko' }, { id: 'cust_b', name: 'Ｍａｒｕｋｏ' }]
  };
  const queue = buildDataCorrectionQueue({
    operationalIssues: [
      { code: 'order_zero_amount', severity: 'error', message: '2026-07-07 Maruko 剪髮 金額為 0', orderId: 'ord_zero' },
      { code: 'order_missing_payment', severity: 'error', message: '2026-07-07 Maruko 剪髮 缺少付款方式', orderId: 'ord_zero' }
    ],
    integrityIssues: [
      { code: 'order_zero_amount', severity: 'error', message: '同一筆金額為 0', orderId: 'ord_zero' }
    ],
    syncIssues: [
      { type: 'zero_amount', severity: 'error', message: '同步金額為 0', orderId: 'ord_zero' }
    ],
    pricingRows: [
      { serviceName: '頭皮初淨調理+剪髮', count: 3, latestDate: '2026-07-07' }
    ],
    duplicateCustomerGroups: [duplicateGroup]
  });

  assert.equal(queue.filter(row => row.code === 'amount_zero' && row.orderId === 'ord_zero').length, 1);
  assert.equal(queue.find(row => row.code === 'amount_zero').sourceLabels.length, 3);
  assert.equal(queue.find(row => row.code === 'payment_invalid').action, 'order');
  assert.equal(queue.find(row => row.code === 'service_unmatched').affectedCount, 3);
  assert.equal(queue.find(row => row.code === 'service_unmatched').category, 'pricing');
  assert.equal(queue.find(row => row.code === 'customer_duplicate_possible').action, 'customer_merge');
  assert.equal(queue.find(row => row.code === 'customer_duplicate_possible').category, 'customers');
  assert(queue.every(row => !Object.hasOwn(row, 'suggestedAmount') && !Object.hasOwn(row, 'suggestedPaymentMethod')));
  assert(queue.find(row => row.category === 'money').impact.includes('打烊對帳'));
}

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

function emptyBackup(overrides = {}) {
  return {
    schemaVersion: 3,
    momo_orders: [],
    momo_expenses: [],
    momo_inventory: [],
    momo_customers: [],
    momo_prepaidLedger: [],
    momo_crmNotes: {},
    momo_crmFormulas: {},
    momo_closeoutRecords: {},
    ...overrides
  };
}

{
  const manualSalary = {
    id: 'exp_manual_salary',
    date: '2026-07-15',
    category: '薪資',
    amount: 5000,
    paymentMethod: EXPENSE_PAYMENT.CASH,
    notes: '臨時助理薪資'
  };
  const first = upsertGeneratedSalaryExpense([manualSalary], {
    year: '2026', month: '07', salary: 45000, revenue: 100000
  });
  assert.equal(first.expenses.length, 2);
  assert.deepEqual(first.expenses.find(row => row.id === manualSalary.id), manualSalary);
  assert.equal(first.record.id, 'salary_202607');
  assert.equal(first.record.paymentMethod, EXPENSE_PAYMENT.NON_CASH);

  const second = upsertGeneratedSalaryExpense(first.expenses, {
    year: '2026', month: '07', salary: 49500, revenue: 110000
  });
  assert.equal(second.expenses.length, 2);
  assert.equal(second.expenses.find(row => row.id === manualSalary.id).amount, 5000);
  assert.equal(second.expenses.find(row => row.id === 'salary_202607').amount, 49500);
}

{
  const totals = calculateCloseoutTotals([
    baseOrder({ id: 'cash', amount: 1000, paymentMethod: PAYMENT.CASH }),
    baseOrder({ id: 'transfer', amount: 500, paymentMethod: PAYMENT.TRANSFER }),
    baseOrder({ id: 'mixed', amount: 800, paymentMethod: PAYMENT.MIXED, cashAmount: 200 }),
    baseOrder({ id: 'topup', amount: 300, paymentMethod: PAYMENT.PREPAID_TOPUP, topupChannel: PAYMENT.CASH })
  ], [
    { id: 'cash_expense', amount: 250, paymentMethod: EXPENSE_PAYMENT.CASH },
    { id: 'transfer_expense', amount: 400, paymentMethod: EXPENSE_PAYMENT.NON_CASH },
    { id: 'legacy_expense', amount: 100 }
  ], { openingCash: 2000 });

  assert.equal(totals.openingCash, 2000);
  assert.equal(totals.actualCashIn, 1500);
  assert.equal(totals.cashExpenses, 250);
  assert.equal(totals.expectedCash, 3250);
  assert.equal(totals.expenses, 750);
  assert.equal(totals.netProfit, 1550);
  assert.equal(totals.serviceOrdersCount, 3);
  assert.equal(totals.topupCount, 1);
  assert.equal(normalizeExpensePaymentMethod(undefined), EXPENSE_PAYMENT.NON_CASH);
}

{
  assert.equal(sanitizeCsvCellValue('=HYPERLINK("https://evil")'), "'=HYPERLINK(\"https://evil\")");
  assert.equal(sanitizeCsvCellValue('  +SUM(A1:A2)'), "'  +SUM(A1:A2)");
  assert.equal(sanitizeCsvCellValue('\t@cmd'), "'\t@cmd");
  assert.equal(sanitizeCsvCellValue(-42), '-42');
  assert.equal(escapeCsvCell('=1+1'), '"\'=1+1"');
  assert.equal(escapeCsvCell('safe "name"'), '"safe ""name"""');
}

{
  const missingExpensePayment = validateAndNormalizeBackupPayload(emptyBackup({
    schemaVersion: 4,
    momo_expenses: [{ id: 'exp_1', date: '2026-07-01', amount: 100 }]
  }), { currentSchemaVersion: 4 });
  assert.equal(missingExpensePayment.ok, false);
  assert(missingExpensePayment.errors.some(message => message.includes('支出付款方式')));

  const validCashCloseout = validateAndNormalizeBackupPayload(emptyBackup({
    schemaVersion: 4,
    momo_closeoutRecords: {
      '2026-07-01': {
        date: '2026-07-01', openingCash: 2000, actualCashIn: 1500, cashExpenses: 250,
        expectedCash: 3250, countedCash: 3250, difference: 0, cash: 1200, transfer: 500,
        prepaidOut: 600, prepaidIn: 300, cashPrepaidIn: 300, transferPrepaidIn: 0,
        serviceRevenue: 2300, expenses: 750, netProfit: 1550, ordersCount: 4,
        completedAt: '2026-07-01T12:00:00Z'
      }
    }
  }), { currentSchemaVersion: 4 });
  assert.equal(validCashCloseout.ok, true);
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
  assert.equal(prepaidKindForTarget(-500, 'topup'), 'adjustment');
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
  const orderLinkedEntry = {
    id: 'txn_order_1',
    customerId: 'cust_a',
    sourceOrderId: 'ord_1',
    signedAmount: -800,
    kind: 'debit',
    bucket: 'debit',
    date: '2026-07-02'
  };

  assert.equal(canReversePrepaidEntry([orderLinkedEntry], orderLinkedEntry), false);
  assert.equal(buildPrepaidReversalPayload(orderLinkedEntry, '2026-07-06'), null);

  const systemTransfer = {
    ...orderLinkedEntry,
    id: 'txn_transfer_1',
    sourceOrderId: null,
    systemManaged: true,
    transferGroupId: 'xfer_1',
    note: '顧客合併轉移：A → B'
  };
  assert.equal(buildPrepaidReversalPayload(systemTransfer, '2026-07-06'), null);
}

{
  const existingRows = Array.from({ length: 199 }, (_, index) => ({ id: `txn_${index}` }));
  const transferPair = [
    { id: 'txn_transfer_a', transfer_group_id: 'xfer_boundary' },
    { id: 'txn_transfer_b', transfer_group_id: 'xfer_boundary' }
  ];
  const batches = buildPrepaidLedgerUploadBatches([...existingRows, ...transferPair], 200);
  assert.deepEqual(batches.map(batch => batch.length), [199, 2]);
  assert.deepEqual(batches[1].map(row => row.id), ['txn_transfer_a', 'txn_transfer_b']);

  const reversalFirst = buildPrepaidLedgerUploadBatches([
    { id: 'txn_reversal', reversal_of_entry_id: 'txn_original' },
    { id: 'txn_original' }
  ], 200).flat();
  assert.deepEqual(reversalFirst.map(row => row.id), ['txn_original', 'txn_reversal']);
}

{
  const entry = {
    id: 'txn_legacy',
    customerId: 'cust_a',
    signedAmount: 500,
    kind: 'topup',
    date: '2026-07-01'
  };
  const ledger = [
    entry,
    { id: 'txn_legacy_reversal', kind: 'reversal', signedAmount: -500, note: '手動沖銷:txn_legacy｜原日 2026-07-01' }
  ];

  assert.equal(prepaidEntryReversed(ledger, entry), true);
  assert.equal(canReversePrepaidEntry(ledger, entry), false);
}

{
  const movedOrder = baseOrder({
    id: 'ord_move',
    date: '2026-08-01',
    paymentMethod: PAYMENT.PREPAID_TOPUP,
    amount: 1000
  });
  const existing = [{
    id: 'txn_old_date',
    sourceOrderId: 'ord_move',
    customerId: 'cust_a',
    signedAmount: 1000,
    kind: 'topup',
    bucket: 'topup',
    date: '2026-07-31'
  }];
  const adjustments = buildOrderPrepaidDateAdjustments(movedOrder, existing);

  assert.deepEqual(adjustments.map(entry => [entry.date, entry.signedAmount, entry.kind]), [
    ['2026-07-31', -1000, 'adjustment'],
    ['2026-08-01', 1000, 'topup']
  ]);
  assert.deepEqual(buildOrderPrepaidDateAdjustments(movedOrder, [...existing, ...adjustments]), []);
}

{
  const switchedOrder = baseOrder({
    id: 'ord_switch',
    date: '2026-07-20',
    paymentMethod: PAYMENT.PREPAID_DEBIT,
    amount: 1000
  });
  const oldTopup = [{
    id: 'txn_switch_old',
    sourceOrderId: 'ord_switch',
    customerId: 'cust_a',
    signedAmount: 1000,
    kind: 'topup',
    bucket: 'topup',
    date: '2026-07-20'
  }];
  const planned = planPrepaidLedgerReconciliation([switchedOrder], oldTopup, {
    today: '2026-07-20',
    accountingOrderIds: ['ord_switch']
  });

  assert.deepEqual(planned.map(entry => [entry.bucket, entry.signedAmount, entry.kind]), [
    ['topup', -1000, 'adjustment'],
    ['debit', -1000, 'debit']
  ]);
  assert.deepEqual(planPrepaidLedgerReconciliation([switchedOrder], [...oldTopup, ...planned], {
    today: '2026-07-20',
    accountingOrderIds: ['ord_switch']
  }), []);
}

{
  const movedCustomerOrder = baseOrder({
    id: 'ord_customer_move',
    customerId: 'cust_b',
    date: '2026-08-02',
    paymentMethod: PAYMENT.PREPAID_TOPUP,
    amount: 800
  });
  const prior = [{
    id: 'txn_customer_old',
    sourceOrderId: 'ord_customer_move',
    customerId: 'cust_a',
    signedAmount: 800,
    kind: 'topup',
    bucket: 'topup',
    date: '2026-08-01'
  }];
  const planned = planPrepaidLedgerReconciliation([movedCustomerOrder], prior, {
    today: '2026-08-02',
    accountingOrderIds: ['ord_customer_move']
  });
  assert.deepEqual(planned.map(entry => [entry.customerId, entry.date, entry.signedAmount]), [
    ['cust_a', '2026-08-01', -800],
    ['cust_b', '2026-08-02', 800]
  ]);

  const orphanPlan = planPrepaidLedgerReconciliation([], prior, { today: '2026-08-02' });
  assert.deepEqual(orphanPlan.map(entry => [entry.date, entry.signedAmount, entry.kind]), [
    ['2026-08-01', -800, 'adjustment']
  ]);
}

{
  const mergedOrder = baseOrder({
    id: 'ord_merged_customer',
    customerId: 'cust_a',
    paymentMethod: PAYMENT.PREPAID_DEBIT,
    amount: 1000
  });
  const ledger = [
    { id: 'txn_original', sourceOrderId: mergedOrder.id, customerId: 'cust_a', signedAmount: -1000, kind: 'debit', bucket: 'debit', date: mergedOrder.date },
    { id: 'txn_xfer_out', sourceOrderId: mergedOrder.id, customerId: 'cust_a', signedAmount: 1000, kind: 'adjustment', bucket: 'debit', date: mergedOrder.date, transferGroupId: 'xfer_1', systemManaged: true },
    { id: 'txn_xfer_in', sourceOrderId: mergedOrder.id, customerId: 'cust_b', signedAmount: -1000, kind: 'adjustment', bucket: 'debit', date: mergedOrder.date, transferGroupId: 'xfer_1', systemManaged: true }
  ];
  const planned = planPrepaidLedgerReconciliation([mergedOrder], ledger, {
    today: mergedOrder.date,
    accountingOrderIds: [mergedOrder.id],
    resolveCustomerId: customerId => customerId === 'cust_a' ? 'cust_b' : customerId
  });
  assert.deepEqual(planned, []);
}

{
  const durationDictionary = buildServiceMetricDictionary([
    { name: '洗 + 剪', duration: 90 },
    { name: '染', duration: 120 },
    { name: '護', duration: 45 }
  ], 'duration');
  assert.equal(normalizeServiceName(' 洗 ＋ 剪 '), '洗+剪');
  assert.equal(resolveServiceMetric('洗＋剪', durationDictionary), 90);
  assert.equal(resolveServiceMetric('染 + 護', durationDictionary), 165);

  const kpis = calculatePeriodKpis([
    baseOrder({ id: 'ord_service', amount: 1000 }),
    baseOrder({ id: 'ord_correction', correctionSlip: true, amount: -200 }),
    baseOrder({ id: 'ord_topup', paymentMethod: PAYMENT.PREPAID_TOPUP, amount: 3000 })
  ], [{ amount: 100 }]);
  assert.deepEqual(kpis, {
    revenue: 800,
    ordersCount: 1,
    aov: 800,
    momoSalary: 360,
    netProfit: 700
  });
}

{
  assert.deepEqual(resolveEffectiveMinutes(75, 90), { effectiveMinutes: 75, source: 'actual' });
  assert.deepEqual(resolveEffectiveMinutes(null, 90), { effectiveMinutes: 90, source: 'standard' });
  assert.deepEqual(resolveEffectiveMinutes(0, null), { effectiveMinutes: 0, source: 'missing' });

  const summary = calculateEffectiveTimeYield([
    { amount: 1000, actualMinutes: 60, standardMinutes: 90 },
    { amount: 1000, actualMinutes: null, standardMinutes: 60 },
    { amount: 500, actualMinutes: null, standardMinutes: null }
  ]);
  assert.equal(summary.totalAmount, 2500);
  assert.equal(summary.coveredAmount, 2000);
  assert.equal(summary.uncoveredAmount, 500);
  assert.equal(summary.effectiveMinutes, 120);
  assert.equal(summary.hourlyYield, 1000);
  assert.equal(summary.mode, 'mixed');
  assert.equal(summary.actualCount, 1);
  assert.equal(summary.standardCount, 1);
  assert.equal(summary.missingCount, 1);
}

{
  const backup = {
    schemaVersion: 2,
    createdAt: '2026-07-06T12:00:00.000Z',
    momo_orders: [{
      id: 'ord_1',
      date: '2026-07-06',
      customerId: 'cust_a',
      customerName: 'Customer A',
      serviceName: 'Color',
      amount: 1000,
      paymentMethod: PAYMENT.CASH
    }],
    momo_expenses: [],
    momo_inventory: [],
    momo_customers: [{ id: 'cust_a', name: 'Customer A' }],
    momo_prepaidLedger: [],
    momo_crmNotes: { cust_a: 'prefers quiet appointments' },
    momo_crmFormulas: {},
    momo_closeoutRecords: {},
    momo_servicesConfig: [{ name: 'Color', duration: 120, price: 1000 }],
    momo_operationLogs: []
  };
  const result = validateAndNormalizeBackupPayload(backup, { currentSchemaVersion: 2 });

  assert.equal(result.ok, true);
  assert.equal(result.servicesIncluded, true);
  assert.notEqual(result.data, backup);
  backup.momo_orders[0].amount = 9999;
  assert.equal(result.data.momo_orders[0].amount, 1000);
  assert.deepEqual(cloneJsonValue({ nested: [1, 2] }), { nested: [1, 2] });

  const withoutOptionalFields = validateAndNormalizeBackupPayload({
    schemaVersion: 2,
    momo_orders: [],
    momo_expenses: [],
    momo_inventory: [],
    momo_customers: [],
    momo_prepaidLedger: [],
    momo_crmNotes: {}
  }, { currentSchemaVersion: 2 });
  assert.equal(withoutOptionalFields.ok, true);
  assert.equal(withoutOptionalFields.servicesIncluded, false);
}

{
  const invalidBackup = {
    schemaVersion: 2,
    momo_orders: {},
    momo_expenses: [],
    momo_inventory: [],
    momo_customers: [],
    momo_prepaidLedger: [],
    momo_crmNotes: {}
  };
  const invalidResult = validateAndNormalizeBackupPayload(invalidBackup, { currentSchemaVersion: 2 });
  const missingVersion = validateAndNormalizeBackupPayload({
    ...invalidBackup,
    schemaVersion: undefined,
    momo_orders: []
  }, { currentSchemaVersion: 2 });
  const futureVersion = validateAndNormalizeBackupPayload({
    ...invalidBackup,
    schemaVersion: 3,
    momo_orders: []
  }, { currentSchemaVersion: 2 });
  const invalidOptionalField = validateAndNormalizeBackupPayload({
    ...invalidBackup,
    momo_orders: [],
    momo_servicesConfig: {}
  }, { currentSchemaVersion: 2 });

  assert.equal(invalidResult.ok, false);
  assert(invalidResult.errors.some(message => message.includes('momo_orders')));
  assert.equal(missingVersion.ok, false);
  assert(missingVersion.errors.some(message => message.includes('schemaVersion')));
  assert.equal(futureVersion.ok, false);
  assert(futureVersion.errors.some(message => message.includes('高於系統支援')));
  assert.equal(invalidOptionalField.ok, false);
  assert(invalidOptionalField.errors.some(message => message.includes('momo_servicesConfig')));

  const invalidSemanticRow = validateAndNormalizeBackupPayload({
    schemaVersion: 3,
    momo_orders: [{}],
    momo_expenses: [],
    momo_inventory: [],
    momo_customers: [],
    momo_prepaidLedger: [],
    momo_crmNotes: {}
  }, { currentSchemaVersion: 3 });
  assert.equal(invalidSemanticRow.ok, false);
  assert(invalidSemanticRow.errors.some(message => message.includes('momo_orders[0]')));

  const cyclicCustomers = validateAndNormalizeBackupPayload({
    schemaVersion: 3,
    momo_orders: [],
    momo_expenses: [],
    momo_inventory: [],
    momo_customers: [
      { id: 'a', name: 'A', mergedIntoCustomerId: 'b', archivedAt: '2026-07-01T00:00:00Z' },
      { id: 'b', name: 'B', mergedIntoCustomerId: 'a', archivedAt: '2026-07-01T00:00:00Z' }
    ],
    momo_prepaidLedger: [],
    momo_crmNotes: {}
  }, { currentSchemaVersion: 3 });
  assert.equal(cyclicCustomers.ok, false);
  assert(cyclicCustomers.errors.some(message => message.includes('循環')));
}

{
  assert.equal(isValidISODate('2026-02-30'), false);
  assert.equal(isValidISODate('2026-02-28'), true);
  assert.equal(isFiniteNumericInput(null), false);
  assert.equal(isFiniteNumericInput('  '), false);

  const customer = { id: 'cust_a', name: 'Customer A' };
  const invalidDate = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [customer],
    momo_orders: [baseOrder({ date: '2026-02-30' })]
  }), { currentSchemaVersion: 3 });
  assert.equal(invalidDate.ok, false);
  assert(invalidDate.errors.some(message => message.includes('日期格式')));

  const nullAmount = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [customer],
    momo_orders: [baseOrder({ amount: null })]
  }), { currentSchemaVersion: 3 });
  assert.equal(nullAmount.ok, false);
  assert(nullAmount.errors.some(message => message.includes('金額格式')));

  const topupWithoutChannel = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [customer],
    momo_orders: [baseOrder({ paymentMethod: PAYMENT.PREPAID_TOPUP, topupChannel: null })]
  }), { currentSchemaVersion: 3 });
  assert.equal(topupWithoutChannel.ok, false);
  assert(topupWithoutChannel.errors.some(message => message.includes('儲值收款方式')));

  const archivedTerminal = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [
      { id: 'cust_a', name: 'A', mergedIntoCustomerId: 'cust_b', archivedAt: '2026-07-01T00:00:00Z' },
      { id: 'cust_b', name: 'B', archivedAt: '2026-07-02T00:00:00Z' }
    ]
  }), { currentSchemaVersion: 3 });
  assert.equal(archivedTerminal.ok, false);
  assert(archivedTerminal.errors.some(message => message.includes('鏈終點')));

  const invalidArchivedAt = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [
      { id: 'cust_a', name: 'A', mergedIntoCustomerId: 'cust_b', archivedAt: 'not-a-time' },
      { id: 'cust_b', name: 'B' }
    ]
  }), { currentSchemaVersion: 3 });
  assert.equal(invalidArchivedAt.ok, false);
  assert(invalidArchivedAt.errors.some(message => message.includes('封存時間')));

  const validHistoricalChain = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [
      { id: 'cust_a', name: 'A', mergedIntoCustomerId: 'cust_b', archivedAt: '2026-07-01T00:00:00Z' },
      { id: 'cust_b', name: 'B', mergedIntoCustomerId: 'cust_c', archivedAt: '2026-07-02T00:00:00Z' },
      { id: 'cust_c', name: 'C' }
    ]
  }), { currentSchemaVersion: 3 });
  assert.equal(validHistoricalChain.ok, true);

  const fractionalMoney = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [customer],
    momo_orders: [baseOrder({ amount: 1000.5 })]
  }), { currentSchemaVersion: 3 });
  assert.equal(fractionalMoney.ok, false);
  assert(fractionalMoney.errors.some(message => message.includes('安全整數')));

  const invalidCloseout = validateAndNormalizeBackupPayload(emptyBackup({
    momo_closeoutRecords: {
      '2026-07-01': {
        date: '2026-07-02',
        expectedCash: 100,
        countedCash: 100,
        difference: 0,
        cash: 100,
        transfer: 0,
        prepaidOut: 0,
        prepaidIn: 0,
        cashPrepaidIn: 0,
        transferPrepaidIn: 0,
        serviceRevenue: 100,
        expenses: 0,
        netProfit: 100,
        ordersCount: 1,
        completedAt: 'not-a-time'
      }
    }
  }), { currentSchemaVersion: 3 });
  assert.equal(invalidCloseout.ok, false);
  assert(invalidCloseout.errors.some(message => message.includes('日期關聯')));
  assert(invalidCloseout.errors.some(message => message.includes('completedAt')));

  const originalLedger = {
    id: 'txn_manual', customerId: 'cust_a', signedAmount: 500, kind: 'topup', bucket: 'topup', date: '2026-07-01'
  };
  const invalidSystemReversal = validateAndNormalizeBackupPayload(emptyBackup({
    momo_customers: [customer],
    momo_prepaidLedger: [
      originalLedger,
      {
        id: 'txn_reversal', customerId: 'cust_a', signedAmount: -500, kind: 'reversal', bucket: 'topup',
        date: '2026-07-02', reversalOfEntryId: 'txn_manual', systemManaged: true
      }
    ]
  }), { currentSchemaVersion: 3 });
  assert.equal(invalidSystemReversal.ok, false);
  assert(invalidSystemReversal.errors.some(message => message.includes('未完整反向沖銷')));
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

{
  const rows = Array.from({ length: 10000 }, (_, index) => ({
    id: `ledger_${index}`,
    customerId: `alias_${index % 1000}`,
    date: `2026-07-${String(31 - (index % 30)).padStart(2, '0')}`
  }));
  const grouped = groupRecentRowsByCustomer(
    rows,
    customerId => customerId.replace('alias_', 'customer_'),
    6
  );
  assert.equal(Object.keys(grouped).length, 1000);
  assert.equal(grouped.customer_0.length, 6);
  assert.equal(grouped.customer_0[0].id, 'ledger_0');
  assert.equal(grouped.customer_0[5].id, 'ledger_5000');
  assert(Object.values(grouped).every(group => group.length <= 6));
}

{
  assert.deepEqual(
    { ...classifyCrmServiceCycle('染髮＋剪髮'), pattern: null },
    { key: 'color', label: '染髮', days: 60, pattern: null }
  );
  assert.equal(classifyCrmServiceCycle('溫塑燙').days, 120);
  assert.equal(classifyCrmServiceCycle('頭皮初淨調理').key, 'care');
  assert.equal(classifyCrmServiceCycle('造型').key, 'other');
  assert.deepEqual(buildCrmServiceObservations([{ serviceName: '剪髮', date: '2026-02-30' }], '2026-07-17'), []);
}

{
  const rows = buildCrmServiceObservations([
    { serviceName: '染髮＋剪髮', date: '2026-04-01', count: 2, totalAmount: 5000 },
    { serviceName: '頭皮調理', date: '2026-07-01', count: 3, totalAmount: 3600 },
    { serviceName: '溫塑燙', date: '2026-01-01', count: 1, totalAmount: 4200 }
  ], '2026-07-17');
  const color = rows.find(row => row.key === 'color');
  const cut = rows.find(row => row.key === 'cut');
  const care = rows.find(row => row.key === 'care');
  assert.equal(color.count, 2);
  assert.equal(color.dueDate, '2026-05-31');
  assert.equal(color.group, 'overdue');
  assert.equal(cut.group, 'overdue');
  assert.equal(care.group, 'stable');
  assert.equal(rows[0].key, 'perm');
}

{
  const spend = calculateCrmSpendTrend([
    { id: '4', date: '2026-07-01', amount: 1200 },
    { id: '3', date: '2026-06-01', amount: 1000 },
    { id: '2', date: '2026-05-01', amount: 600 },
    { id: '1', date: '2026-04-01', amount: 600 }
  ]);
  assert.equal(spend.direction, 'up');
  assert.equal(spend.recentAverage, 1100);
  assert.equal(spend.previousAverage, 600);
  assert.equal(calculateCrmSpendTrend([{ date: '2026-07-01', amount: 1000 }]).direction, 'insufficient');

  const pace = calculateCrmVisitPaceTrend([
    { date: '2026-07-10' },
    { date: '2026-05-01' },
    { date: '2026-04-01' },
    { date: '2026-03-01' }
  ]);
  assert.equal(pace.direction, 'slower');
  assert.equal(pace.recentIntervalDays, 70);
}

{
  const priority = buildCrmObservationProfile({
    returnGroup: 'dormant',
    valueTier: 'high',
    prepaidBalance: 3000,
    spendTrend: { direction: 'down', percent: -30 },
    visitPaceTrend: { direction: 'slower', percent: 50 },
    serviceObservations: []
  });
  assert.equal(priority.level, 'high');
  assert(priority.score >= 45);
  assert(priority.reasons.some(reason => reason.includes('高價值')));

  const serviceWatch = buildCrmObservationProfile({
    returnGroup: 'stable',
    serviceObservations: [{ label: '染髮', group: 'overdue', daysSince: 90, cycleDays: 60 }]
  });
  assert.equal(serviceWatch.level, 'watch');
  assert(serviceWatch.primaryReason.includes('染髮'));
}

{
  assert.deepEqual(
    classifyMemoryPressure({ usedBytes: 500, limitBytes: 1000, previousUsedBytes: 480, elapsedMs: 30000 }),
    { supported: true, usedBytes: 500, limitBytes: 1000, percent: 50, growthBytes: 20, elapsedMs: 30000, severity: 'ok', reason: 'normal' }
  );
  assert.equal(classifyMemoryPressure({ usedBytes: 760, limitBytes: 1000 }).severity, 'warning');
  assert.equal(classifyMemoryPressure({ usedBytes: 900, limitBytes: 1000 }).severity, 'error');
  assert.equal(classifyMemoryPressure({ usedBytes: 0, limitBytes: 0 }).reason, 'unsupported');
  assert.equal(classifyMemoryPressure({
    usedBytes: 300 * 1024 * 1024,
    limitBytes: 2 * 1024 * 1024 * 1024,
    previousUsedBytes: 100 * 1024 * 1024,
    elapsedMs: 60000
  }).reason, 'rapid_growth_error');
}

{
  const now = Date.parse('2026-07-17T04:00:00Z');
  assert.equal(evaluatePreviousRuntimeSession({
    startedAt: '2026-07-17T03:50:00Z',
    lastHeartbeatAt: '2026-07-17T03:59:50Z',
    closedCleanly: false
  }, now).unclean, true);
  assert.equal(evaluatePreviousRuntimeSession({
    lastHeartbeatAt: '2026-07-17T03:59:50Z',
    closedCleanly: true
  }, now).reason, 'clean');
  assert.equal(evaluatePreviousRuntimeSession({
    lastHeartbeatAt: '2026-07-10T03:59:50Z',
    closedCleanly: false
  }, now).reason, 'stale');
}

{
  assert.deepEqual(classifyMainThreadStall(1499), { detected: false, severity: 'ok', lagMs: 1499 });
  assert.equal(classifyMainThreadStall(1500).severity, 'warning');
  assert.equal(classifyMainThreadStall(5000).severity, 'error');
  assert.equal(classifyMainThreadStall(9000, { visible: false }).detected, false);
}

console.log('momo-core tests passed');
