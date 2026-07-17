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

  const EXPENSE_PAYMENT = {
    CASH: '現金',
    NON_CASH: '非現金'
  };

  function toMoney(value) {
    return Math.round(Number(value) || 0);
  }

  function normalizeServiceName(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s*\+\s*/g, '+')
      .replace(/\s+/g, ' ');
  }

  function normalizePotentialDuplicateCustomerName(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, '')
      .toLocaleLowerCase('zh-TW');
  }

  function findPotentialDuplicateCustomerGroups(customers = [], orderCountsByCustomer = {}) {
    const counts = orderCountsByCustomer instanceof Map
      ? orderCountsByCustomer
      : new Map(Object.entries(orderCountsByCustomer || {}));
    const groups = new Map();

    (Array.isArray(customers) ? customers : []).forEach(customer => {
      if (!customer?.id || customer.archivedAt || customer.mergedIntoCustomerId) return;
      const name = String(customer.name || '').trim();
      const key = normalizePotentialDuplicateCustomerName(name);
      if (!key) return;
      const rows = groups.get(key) || [];
      rows.push({
        id: customer.id,
        name,
        orderCount: Math.max(0, Number(counts.get(String(customer.id))) || 0),
        updatedAt: customer.updatedAt || customer.createdAt || ''
      });
      groups.set(key, rows);
    });

    return Array.from(groups.entries())
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => {
        const orderCount = rows.reduce((sum, row) => sum + row.orderCount, 0);
        const updateTimes = rows.map(row => row.updatedAt).filter(Boolean).sort();
        return {
          key,
          normalizedName: key,
          displayName: rows[0]?.name || key,
          count: rows.length,
          orderCount,
          customerIds: rows.map(row => row.id),
          customers: rows,
          latestUpdatedAt: updateTimes[updateTimes.length - 1] || ''
        };
      })
      .sort((a, b) => b.count - a.count || b.orderCount - a.orderCount || a.displayName.localeCompare(b.displayName, 'zh-TW'));
  }

  function buildDataCorrectionQueue(options = {}) {
    const sourceLabels = {
      operation: '營運檢查',
      integrity: '完整性檢查',
      sync: '行事曆同步',
      pricing: '價目匹配',
      customers: '顧客檔案'
    };
    const canonicalCode = rawCode => {
      const code = String(rawCode || 'unknown').toLowerCase();
      if (['order_zero_amount', 'zero_amount', 'correction_zero_amount'].includes(code)) return 'amount_zero';
      if (['order_missing_payment', 'order_invalid_payment', 'invalid_payment'].includes(code)) return 'payment_invalid';
      if (['order_invalid_mixed_payment', 'invalid_mixed_payment'].includes(code)) return 'mixed_payment_invalid';
      if (['order_invalid_topup_channel', 'invalid_topup_channel'].includes(code)) return 'topup_channel_invalid';
      if (['unmatched_service_config', 'unmatched_service', 'pricing_unmatched'].includes(code)) return 'service_unmatched';
      if (['duplicate_same_day_order'].includes(code)) return 'order_duplicate_possible';
      if (['duplicate_customer_name', 'potential_duplicate_customer'].includes(code)) return 'customer_duplicate_possible';
      return code;
    };
    const categoryFor = code => {
      if (['amount_zero', 'order_invalid_amount', 'expense_invalid_amount', 'ledger_invalid_amount', 'payment_invalid', 'expense_invalid_payment', 'mixed_payment_invalid', 'topup_channel_invalid', 'topup_marked_as_service', 'calendar_payment_default_cash', 'negative_prepaid_balance'].includes(code)) return 'money';
      if (code === 'service_unmatched') return 'pricing';
      if (['customer_duplicate_possible', 'ambiguous_customer_name', 'invalid_customer_id', 'unknown_customer_id', 'customer_id_name_mismatch', 'customer_missing_name', 'customer_merge_target_missing', 'customer_merge_not_archived', 'order_orphan_customer', 'ledger_orphan_customer', 'orphan_crm_note'].includes(code)) return 'customers';
      if (code.includes('duplicate')) return 'duplicates';
      return 'integrity';
    };
    const titleFor = (code, row) => {
      const titles = {
        amount_zero: '金額需要確認',
        order_invalid_amount: '業績金額格式錯誤',
        expense_invalid_amount: '支出金額格式錯誤',
        ledger_invalid_amount: '儲值分錄金額錯誤',
        payment_invalid: '付款方式需要確認',
        expense_invalid_payment: '支出付款來源錯誤',
        mixed_payment_invalid: '混合付款金額不完整',
        topup_channel_invalid: '儲值收款方式需要確認',
        topup_marked_as_service: '疑似儲值被記成服務',
        calendar_payment_default_cash: '行事曆付款方式未標示',
        negative_prepaid_balance: '儲值餘額為負數',
        service_unmatched: '服務尚未加入價目表',
        order_duplicate_possible: '可能有重複業績',
        customer_duplicate_possible: '可能有重複顧客',
        ambiguous_customer_name: '同名顧客無法自動判定'
      };
      return row.title || titles[code] || row.message || '資料需要確認';
    };
    const impactFor = category => ({
      money: '會影響營收、金流或打烊對帳。',
      pricing: '會影響自動帶入價格、服務分類與時間產值。',
      customers: '可能分散 CRM、消費次數或儲值餘額。',
      duplicates: '可能重複計算筆數、營收或其他指標。',
      integrity: '可能影響資料關聯、查詢或備份還原。'
    }[category]);
    const keyTarget = row => {
      if (row.orderId) return `order:${row.orderId}`;
      if (row.expenseId) return `expense:${row.expenseId}`;
      if (row.customerId) return `customer:${row.customerId}`;
      if (Array.isArray(row.customerIds) && row.customerIds.length) return `customers:${[...row.customerIds].sort().join(',')}`;
      if (row.serviceName) return `service:${normalizeServiceName(row.serviceName).toLocaleLowerCase('zh-TW')}`;
      if (row.key) return `key:${row.key}`;
      return `message:${String(row.message || row.title || '').trim().toLocaleLowerCase('zh-TW')}`;
    };
    const queue = new Map();
    const add = (source, original = {}) => {
      if (!original || typeof original !== 'object') return;
      const row = { ...original };
      const code = canonicalCode(row.code || row.type);
      const category = categoryFor(code);
      const key = `${code}|${keyTarget(row)}`;
      const action = code === 'service_unmatched'
        ? 'pricing'
        : code === 'customer_duplicate_possible'
          ? 'customer_merge'
          : row.orderId
            ? 'order'
            : row.expenseId
              ? 'expense'
              : row.customerId || (Array.isArray(row.customerIds) && row.customerIds.length)
                ? 'customer'
                : source === 'sync'
                  ? 'sync'
                  : 'integrity';
      const existing = queue.get(key);
      if (existing) {
        if (!existing.sourceLabels.includes(sourceLabels[source] || source)) existing.sourceLabels.push(sourceLabels[source] || source);
        existing.sourceLabel = existing.sourceLabels.join('、');
        existing.affectedCount = Math.max(existing.affectedCount, Math.max(1, Number(row.affectedCount ?? row.count) || 1));
        if (row.severity === 'error') existing.severity = 'error';
        return;
      }
      const labels = [sourceLabels[source] || source].filter(Boolean);
      const severity = row.severity === 'error' ? 'error' : 'warning';
      queue.set(key, {
        ...row,
        key,
        code,
        category,
        severity,
        tone: severity === 'error' ? 'error' : 'warn',
        title: titleFor(code, row),
        message: String(row.message || '').trim() || titleFor(code, row),
        impact: impactFor(category),
        sourceLabels: labels,
        sourceLabel: labels.join('、'),
        affectedCount: Math.max(1, Number(row.affectedCount ?? row.count) || 1),
        action,
        actionLabel: action === 'pricing' ? '設定價目' : action === 'customer_merge' ? '比對顧客' : action === 'order' ? '修正業績' : action === 'expense' ? '修正支出' : action === 'customer' ? '查看顧客' : action === 'sync' ? '查看同步' : '查看資料',
        confidence: code === 'customer_duplicate_possible' || code === 'order_duplicate_possible' ? 'review_required' : 'located',
        payload: row.payload || row
      });
    };

    (Array.isArray(options.operationalIssues) ? options.operationalIssues : []).forEach(row => add('operation', row));
    (Array.isArray(options.integrityIssues) ? options.integrityIssues : []).forEach(row => add('integrity', row));
    (Array.isArray(options.syncIssues) ? options.syncIssues : []).forEach(row => add('sync', row));
    (Array.isArray(options.pricingRows) ? options.pricingRows : []).forEach(row => add('pricing', { ...row, code: row.code || 'unmatched_service_config', affectedCount: row.affectedCount ?? row.count, payload: row.payload || row }));
    (Array.isArray(options.duplicateCustomerGroups) ? options.duplicateCustomerGroups : []).forEach(group => add('customers', {
      code: 'duplicate_customer_name',
      severity: 'warning',
      title: `「${group.displayName || group.normalizedName || '未命名'}」可能有重複顧客`,
      message: `找到 ${Math.max(2, Number(group.count) || 0)} 筆同名的獨立顧客資料，需人工確認後再合併。`,
      customerIds: group.customerIds || [],
      affectedCount: group.count,
      key: group.key,
      payload: group
    }));

    const severityRank = { error: 0, warning: 1 };
    const categoryRank = { money: 0, pricing: 1, customers: 2, duplicates: 3, integrity: 4 };
    return Array.from(queue.values()).sort((a, b) =>
      (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9)
      || (categoryRank[a.category] ?? 9) - (categoryRank[b.category] ?? 9)
      || String(a.title).localeCompare(String(b.title), 'zh-TW')
    );
  }

  function buildServiceMetricDictionary(services = [], field = 'duration') {
    const dictionary = {};
    (Array.isArray(services) ? services : []).forEach(service => {
      const key = normalizeServiceName(service?.name);
      const value = Number(service?.[field]);
      if (key && Number.isFinite(value)) dictionary[key] = value;
    });
    return dictionary;
  }

  function resolveServiceMetric(name, dictionary = {}, options = {}) {
    const key = normalizeServiceName(name);
    const allowZero = Boolean(options.allowZero);
    if (!key) return null;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      const value = Number(dictionary[key]);
      if (Number.isFinite(value) && (allowZero ? value >= 0 : value > 0)) return value;
    }
    if (!key.includes('+')) return null;
    const parts = key.split('+').map(normalizeServiceName).filter(Boolean);
    if (!parts.length) return null;
    let total = 0;
    for (const part of parts) {
      const value = resolveServiceMetric(part, dictionary, options);
      if (value === null) return null;
      total += value;
    }
    return total;
  }

  function calculatePeriodKpis(orders = [], expenses = []) {
    const serviceOrders = (Array.isArray(orders) ? orders : [])
      .filter(order => isOrderActive(order) && order?.paymentMethod !== PAYMENT.PREPAID_TOPUP);
    const ordersCount = serviceOrders.filter(order => !isCorrectionSlip(order)).length;
    const revenue = serviceOrders.reduce((sum, order) => sum + (Number(order?.amount) || 0), 0);
    const totalExpenses = (Array.isArray(expenses) ? expenses : [])
      .reduce((sum, expense) => sum + (Number(expense?.amount) || 0), 0);
    return {
      revenue,
      ordersCount,
      aov: ordersCount > 0 ? Math.round(revenue / ordersCount) : 0,
      momoSalary: Math.round(revenue * 0.45),
      netProfit: revenue - totalExpenses
    };
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

  function normalizeExpensePaymentMethod(value) {
    return value === EXPENSE_PAYMENT.CASH ? EXPENSE_PAYMENT.CASH : EXPENSE_PAYMENT.NON_CASH;
  }

  function calculateCloseoutTotals(orders = [], expenses = [], options = {}) {
    const openingCash = Math.max(0, toMoney(options.openingCash));
    const closeoutOrders = (Array.isArray(orders) ? orders : []).filter(isOrderActive);
    const closeoutExpenses = Array.isArray(expenses) ? expenses : [];
    const countableOrders = closeoutOrders.filter(order => !isCorrectionSlip(order));
    const serviceOrdersCount = countableOrders.filter(order => order.paymentMethod !== PAYMENT.PREPAID_TOPUP).length;
    const totals = {
      openingCash,
      cash: 0,
      transfer: 0,
      prepaidOut: 0,
      prepaidIn: 0,
      cashPrepaidIn: 0,
      transferPrepaidIn: 0,
      other: 0,
      serviceRevenue: 0,
      actualCashIn: 0,
      cashExpenses: 0,
      expectedCash: 0,
      expenses: closeoutExpenses.reduce((sum, expense) => sum + toMoney(expense?.amount), 0),
      netProfit: 0,
      ordersCount: countableOrders.length,
      serviceOrdersCount,
      topupCount: countableOrders.length - serviceOrdersCount
    };

    closeoutOrders.forEach(order => {
      if (!Object.values(PAYMENT).includes(order?.paymentMethod)) {
        totals.other += toMoney(order?.amount);
        totals.serviceRevenue += toMoney(order?.amount);
        return;
      }
      const vector = orderMoneyVector(order);
      totals.cash += vector.cash;
      totals.transfer += vector.transfer;
      totals.prepaidOut += vector.prepaidOut;
      totals.prepaidIn += vector.prepaidIn;
      totals.cashPrepaidIn += vector.cashPrepaidIn;
      totals.transferPrepaidIn += vector.transferPrepaidIn;
      totals.serviceRevenue += vector.serviceRevenue;
    });

    totals.cashExpenses = closeoutExpenses
      .filter(expense => normalizeExpensePaymentMethod(expense?.paymentMethod) === EXPENSE_PAYMENT.CASH)
      .reduce((sum, expense) => sum + toMoney(expense?.amount), 0);
    totals.actualCashIn = totals.cash + totals.cashPrepaidIn;
    totals.expectedCash = totals.openingCash + totals.actualCashIn - totals.cashExpenses;
    totals.netProfit = totals.serviceRevenue - totals.expenses;
    return totals;
  }

  function upsertGeneratedSalaryExpense(expenses = [], options = {}) {
    const year = String(options.year || '').trim();
    const month = String(options.month || '').trim().padStart(2, '0');
    if (!/^\d{4}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error('薪資月份格式不正確');
    }
    const id = `salary_${year}${month}`;
    const existing = (Array.isArray(expenses) ? expenses : []).find(expense => expense?.id === id) || null;
    const salary = Math.max(0, toMoney(options.salary));
    const revenue = Math.max(0, toMoney(options.revenue));
    const record = {
      ...(existing || {}),
      id,
      date: `${year}-${month}-01`,
      category: '薪資',
      amount: salary,
      paymentMethod: EXPENSE_PAYMENT.NON_CASH,
      notes: `MOMO薪資 ${year}年${Number(month)}月｜本月業績 NT$${revenue.toLocaleString()} × 45%`,
      generatedBy: 'salary_import'
    };
    const result = existing
      ? expenses.map(expense => expense?.id === id ? record : expense)
      : [...(Array.isArray(expenses) ? expenses : []), record];
    return { expenses: result, record, existing };
  }

  function sanitizeCsvCellValue(value) {
    const raw = String(value ?? '');
    if (typeof value !== 'string') return raw;
    return /^[\u0009\u000A\u000D\u0020]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  }

  function escapeCsvCell(value) {
    return `"${sanitizeCsvCellValue(value).replace(/"/g, '""')}"`;
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
    // `reversal` is reserved for an explicit reversal_of_entry_id. Order-linked
    // corrections are append-only adjustments, even when their sign is reversed.
    if (bucket === 'topup') return amount > 0 ? 'topup' : 'adjustment';
    if (bucket === 'debit') return amount < 0 ? 'debit' : 'adjustment';
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
      && !String(entry.sourceOrderId || '').trim()
      && !entry.systemManaged
      && !String(entry.transferGroupId || '').trim()
      && !String(entry.note || '').startsWith('顧客合併')
      && !prepaidEntryReversed(prepaidLedger, entry);
  }

  function buildPrepaidReversalPayload(entry = {}, date = new Date().toLocaleDateString('sv-SE')) {
    const amount = toMoney(entry.signedAmount);
    if (!entry?.id
      || entry.kind === 'reversal'
      || String(entry.sourceOrderId || '').trim()
      || entry.systemManaged
      || String(entry.transferGroupId || '').trim()
      || String(entry.note || '').startsWith('顧客合併')
      || !amount) return null;
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

  function buildPrepaidLedgerUploadBatches(rows = [], batchSize = 200) {
    const limit = Math.max(2, Math.floor(Number(batchSize) || 200));
    const ordered = (Array.isArray(rows) ? [...rows] : [])
      .sort((a, b) => Number(Boolean(a?.reversal_of_entry_id || a?.reversalOfEntryId))
        - Number(Boolean(b?.reversal_of_entry_id || b?.reversalOfEntryId)));
    const grouped = new Map();
    ordered.forEach(row => {
      const groupId = String(row?.transfer_group_id || row?.transferGroupId || '').trim();
      if (!groupId) return;
      if (!grouped.has(groupId)) grouped.set(groupId, []);
      grouped.get(groupId).push(row);
    });
    const emittedGroups = new Set();
    const units = [];
    ordered.forEach(row => {
      const groupId = String(row?.transfer_group_id || row?.transferGroupId || '').trim();
      if (!groupId) units.push([row]);
      else if (!emittedGroups.has(groupId)) {
        emittedGroups.add(groupId);
        units.push(grouped.get(groupId));
      }
    });
    const batches = [];
    let current = [];
    units.forEach(unit => {
      if (current.length && current.length + unit.length > limit) {
        batches.push(current);
        current = [];
      }
      current.push(...unit);
    });
    if (current.length) batches.push(current);
    return batches;
  }

  function planPrepaidLedgerReconciliation(orders = [], existingEntries = [], options = {}) {
    const fallbackDate = /^\d{4}-\d{2}-\d{2}$/.test(String(options.today || ''))
      ? String(options.today)
      : new Date().toLocaleDateString('sv-SE');
    const orderRows = (Array.isArray(orders) ? orders : []).filter(order => order?.id);
    const orderIds = new Set(orderRows.map(order => String(order.id)));
    const accountingOrderIds = options.accountingOrderIds === undefined
      ? null
      : new Set(Array.from(options.accountingOrderIds || [], value => String(value)));
    const resolveCustomerId = typeof options.resolveCustomerId === 'function'
      ? value => String(options.resolveCustomerId(value) || value || '').trim()
      : value => String(value || '').trim();
    const groups = new Map();
    const keysByOrder = new Map();
    const keyFor = (orderId, customerId, date, bucket) => JSON.stringify([
      String(orderId), String(customerId), String(date), String(bucket)
    ]);

    (Array.isArray(existingEntries) ? existingEntries : []).forEach(entry => {
      const orderId = String(entry?.sourceOrderId || '').trim();
      const customerId = resolveCustomerId(entry?.customerId);
      if (!orderId || !customerId) return;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || ''))
        ? String(entry.date)
        : fallbackDate;
      const bucket = entry.bucket === 'topup' ? 'topup' : 'debit';
      const key = keyFor(orderId, customerId, date, bucket);
      const group = groups.get(key) || {
        orderId,
        customerId,
        date,
        bucket,
        total: 0,
        latest: null
      };
      group.total += Number(entry.signedAmount) || 0;
      group.latest = entry;
      groups.set(key, group);
      if (!keysByOrder.has(orderId)) keysByOrder.set(orderId, new Set());
      keysByOrder.get(orderId).add(key);
    });

    const adjustments = [];
    const addAdjustment = payload => {
      const normalized = { ...payload, signedAmount: toMoney(payload.signedAmount) };
      if (normalized.signedAmount) adjustments.push(normalized);
    };

    orderRows.forEach(order => {
      const orderId = String(order.id);
      const customerId = resolveCustomerId(order.customerId);
      if (!customerId) return;
      const included = accountingOrderIds === null || accountingOrderIds.has(orderId);
      const target = included ? getOrderPrepaidTarget(order) : 0;
      const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(String(order.date || ''))
        ? String(order.date)
        : fallbackDate;
      const targetBucket = target ? getOrderPrepaidBucket(order) : null;
      const targetKey = targetBucket ? keyFor(orderId, customerId, targetDate, targetBucket) : null;
      const relatedKeys = [...(keysByOrder.get(orderId) || [])];

      relatedKeys.forEach(key => {
        if (targetKey && key === targetKey) return;
        const group = groups.get(key);
        const currentTotal = toMoney(group?.total);
        if (!group || !currentTotal) return;
        addAdjustment({
          customerId: group.customerId,
          signedAmount: -currentTotal,
          kind: 'adjustment',
          bucket: group.bucket,
          date: group.date,
          sourceOrderId: orderId,
          serviceName: order.serviceName || group.latest?.serviceName || '',
          paymentMethod: order.paymentMethod || group.latest?.paymentMethod || '',
          note: group.customerId !== customerId
            ? '訂單改綁其他顧客，原顧客分錄歸零'
            : group.date !== targetDate
              ? '訂單日期異動，原日期分錄歸零'
              : '訂單付款類型異動，原付款分錄歸零'
        });
      });

      if (!target || !targetKey || !targetBucket) return;
      const currentGroup = groups.get(targetKey);
      const difference = toMoney(target - toMoney(currentGroup?.total));
      if (!difference) return;
      addAdjustment({
        customerId,
        signedAmount: difference,
        kind: currentGroup ? 'adjustment' : prepaidKindForTarget(target, targetBucket, 'adjustment'),
        bucket: targetBucket,
        date: targetDate,
        sourceOrderId: orderId,
        serviceName: order.serviceName || '',
        paymentMethod: order.paymentMethod || '',
        note: currentGroup ? '訂單內容異動，於訂單日期追加差額' : '由訂單建立'
      });
    });

    keysByOrder.forEach((keys, orderId) => {
      if (orderIds.has(orderId)) return;
      [...keys].forEach(key => {
        const group = groups.get(key);
        const currentTotal = toMoney(group?.total);
        if (!group || !currentTotal) return;
        addAdjustment({
          customerId: group.customerId,
          signedAmount: -currentTotal,
          kind: 'adjustment',
          bucket: group.bucket,
          date: group.date,
          sourceOrderId: orderId,
          serviceName: group.latest?.serviceName || '',
          paymentMethod: group.latest?.paymentMethod || '',
          note: '原訂單已刪除，於原日期追加歸零分錄'
        });
      });
    });

    return adjustments;
  }

  function buildOrderPrepaidDateAdjustments(order = {}, existingEntries = []) {
    const orderId = String(order?.id || '').trim();
    const customerId = String(order?.customerId || '').trim();
    const targetDate = String(order?.date || '').trim();
    if (!orderId || !customerId || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return [];

    return planPrepaidLedgerReconciliation([order], existingEntries, {
      today: targetDate,
      accountingOrderIds: [orderId]
    });
  }

  function positiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function resolveEffectiveMinutes(actualMinutes, standardMinutes) {
    const actual = positiveNumber(actualMinutes);
    if (actual) return { effectiveMinutes: actual, source: 'actual' };
    const standard = positiveNumber(standardMinutes);
    if (standard) return { effectiveMinutes: standard, source: 'standard' };
    return { effectiveMinutes: 0, source: 'missing' };
  }

  function calculateEffectiveTimeYield(items = []) {
    const summary = {
      totalAmount: 0,
      coveredAmount: 0,
      uncoveredAmount: 0,
      effectiveMinutes: 0,
      hourlyYield: null,
      actualCount: 0,
      standardCount: 0,
      missingCount: 0,
      coveredCount: 0,
      totalCount: 0,
      coverageRate: 0,
      mode: 'missing'
    };

    (Array.isArray(items) ? items : []).forEach(item => {
      const amountValue = Number(item?.coveredAmount ?? item?.amount ?? 0);
      const amount = Number.isFinite(amountValue) ? amountValue : 0;
      const actualMinutes = item?.actualMinutes ?? item?.actualDurationMinutes;
      const standardMinutes = item?.standardMinutes ?? item?.estimatedMinutes;
      const resolution = resolveEffectiveMinutes(actualMinutes, standardMinutes);

      summary.totalCount += 1;
      summary.totalAmount += amount;
      if (!resolution.effectiveMinutes) {
        summary.missingCount += 1;
        summary.uncoveredAmount += amount;
        return;
      }

      summary.coveredCount += 1;
      summary.coveredAmount += amount;
      summary.effectiveMinutes += resolution.effectiveMinutes;
      if (resolution.source === 'actual') summary.actualCount += 1;
      else summary.standardCount += 1;
    });

    if (summary.effectiveMinutes > 0) {
      summary.hourlyYield = Math.round((summary.coveredAmount * 60) / summary.effectiveMinutes);
    }
    summary.coverageRate = summary.totalCount ? summary.coveredCount / summary.totalCount : 0;
    summary.mode = summary.actualCount && summary.standardCount
      ? 'mixed'
      : summary.actualCount
        ? 'actual'
        : summary.standardCount
          ? 'standard'
          : 'missing';
    return summary;
  }

  function cloneJsonValue(value) {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new TypeError('資料不是可備份的 JSON 值');
    return JSON.parse(serialized);
  }

  function isPlainRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function isValidISODate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year
      && parsed.getUTCMonth() === month - 1
      && parsed.getUTCDate() === day;
  }

  function isFiniteNumericInput(value) {
    return (typeof value === 'number' || typeof value === 'string')
      && value !== ''
      && !(typeof value === 'string' && !value.trim())
      && Number.isFinite(Number(value));
  }

  function isValidTimestamp(value) {
    return (typeof value === 'string' || value instanceof Date)
      && String(value).trim() !== ''
      && Number.isFinite(Date.parse(value));
  }

  function validateAndNormalizeBackupPayload(payload, options = {}) {
    const errors = [];
    const warnings = [];
    const currentSchemaVersion = Math.max(1, Number(options.currentSchemaVersion) || 2);
    if (!isPlainRecord(payload)) {
      return {
        ok: false,
        errors: ['備份內容必須是 JSON 物件'],
        warnings,
        data: null,
        servicesIncluded: false
      };
    }

    const schemaVersion = Number(payload.schemaVersion);
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
      errors.push('schemaVersion 缺漏或格式不正確');
    } else if (schemaVersion > currentSchemaVersion) {
      errors.push(`備份版本 v${schemaVersion} 高於系統支援的 v${currentSchemaVersion}`);
    } else if (schemaVersion < currentSchemaVersion) {
      warnings.push(`備份版本 v${schemaVersion} 將以相容模式載入`);
    }

    const requiredArrays = [
      'momo_orders',
      'momo_expenses',
      'momo_inventory',
      'momo_customers',
      'momo_prepaidLedger'
    ];
    const optionalArrays = ['momo_servicesConfig', 'momo_operationLogs'];
    const requiredRecords = ['momo_crmNotes'];
    const optionalRecords = ['momo_crmFormulas', 'momo_closeoutRecords'];

    requiredArrays.forEach(key => {
      if (!Array.isArray(payload[key])) errors.push(`${key} 必須是陣列`);
      else if (payload[key].some(item => !isPlainRecord(item))) errors.push(`${key} 內含無效資料列`);
    });
    optionalArrays.forEach(key => {
      if (payload[key] !== undefined && !Array.isArray(payload[key])) errors.push(`${key} 必須是陣列`);
      else if (Array.isArray(payload[key]) && payload[key].some(item => !isPlainRecord(item))) errors.push(`${key} 內含無效資料列`);
    });
    requiredRecords.forEach(key => {
      if (!isPlainRecord(payload[key])) errors.push(`${key} 必須是物件`);
    });
    optionalRecords.forEach(key => {
      if (payload[key] !== undefined && !isPlainRecord(payload[key])) errors.push(`${key} 必須是物件`);
    });

    const validDate = isValidISODate;
    const nonEmpty = value => typeof value === 'string' && Boolean(value.trim());
    const finiteNumber = isFiniteNumericInput;
    const safeInteger = value => finiteNumber(value) && Number.isSafeInteger(Number(value));
    const validateUniqueIds = (key, rows) => {
      if (!Array.isArray(rows)) return;
      const ids = new Set();
      rows.forEach((row, index) => {
        const id = String(row?.id || '').trim();
        if (!id) errors.push(`${key}[${index}] 缺少 id`);
        else if (ids.has(id)) errors.push(`${key} 含重複 id：${id}`);
        else ids.add(id);
      });
    };

    validateUniqueIds('momo_orders', payload.momo_orders);
    (Array.isArray(payload.momo_orders) ? payload.momo_orders : []).forEach((row, index) => {
      if (!validDate(row?.date)) errors.push(`momo_orders[${index}] 日期格式不正確`);
      if (!nonEmpty(row?.customerName)) errors.push(`momo_orders[${index}] 缺少顧客姓名`);
      if (!nonEmpty(row?.serviceName)) errors.push(`momo_orders[${index}] 缺少服務項目`);
      const amount = finiteNumber(row?.amount) ? Number(row.amount) : NaN;
      const correction = isCorrectionSlip(row);
      if (!Number.isFinite(amount) || (correction ? amount === 0 : amount <= 0)) errors.push(`momo_orders[${index}] 金額格式不正確`);
      if (schemaVersion >= 3 && !safeInteger(row?.amount)) errors.push(`momo_orders[${index}] 金額必須是安全整數`);
      if (![PAYMENT.CASH, PAYMENT.TRANSFER, PAYMENT.PREPAID_DEBIT, PAYMENT.MIXED, PAYMENT.PREPAID_TOPUP].includes(row?.paymentMethod)) {
        errors.push(`momo_orders[${index}] 付款方式不正確`);
      }
      const cashPresent = row?.cashAmount !== null && row?.cashAmount !== undefined && row?.cashAmount !== '';
      if (row?.paymentMethod === PAYMENT.MIXED) {
        if (!finiteNumber(row?.cashAmount) || Number(row.cashAmount) <= 0 || Number(row.cashAmount) >= amount) {
          errors.push(`momo_orders[${index}] 混合付款拆帳不正確`);
        }
        if (schemaVersion >= 3 && !safeInteger(row?.cashAmount)) errors.push(`momo_orders[${index}] 現金拆帳必須是安全整數`);
      } else if (cashPresent) {
        errors.push(`momo_orders[${index}] 非混合付款不可含 cashAmount`);
      }
      const topupChannel = row?.topupChannel;
      if (row?.paymentMethod === PAYMENT.PREPAID_TOPUP) {
        if (![PAYMENT.CASH, PAYMENT.TRANSFER].includes(topupChannel)) errors.push(`momo_orders[${index}] 儲值收款方式不正確`);
      } else if (topupChannel !== null && topupChannel !== undefined && topupChannel !== '') {
        errors.push(`momo_orders[${index}] 非儲值進帳不可含 topupChannel`);
      }
      ['actualDurationMinutes', 'calendarDurationMinutes'].forEach(field => {
        const value = row?.[field];
        if (value !== null && value !== undefined && value !== ''
          && (!safeInteger(value) || Number(value) <= 0)) {
          errors.push(`momo_orders[${index}] ${field} 必須是正整數`);
        }
      });
    });

    validateUniqueIds('momo_customers', payload.momo_customers);
    (Array.isArray(payload.momo_customers) ? payload.momo_customers : []).forEach((row, index) => {
      if (!nonEmpty(row?.name)) errors.push(`momo_customers[${index}] 缺少姓名`);
    });

    const customerRows = Array.isArray(payload.momo_customers) ? payload.momo_customers : [];
    const customerIds = new Set(customerRows.map(row => String(row?.id || '').trim()).filter(Boolean));
    const customerById = new Map(customerRows.map(row => [String(row?.id || '').trim(), row]));
    customerRows.forEach((row, index) => {
      const targetId = String(row?.mergedIntoCustomerId || row?.merged_into_customer_id || '').trim();
      const archivedAt = row?.archivedAt || row?.archived_at || null;
      if (archivedAt && !isValidTimestamp(archivedAt)) errors.push(`momo_customers[${index}] 封存時間格式不正確`);
      if (targetId && (!customerIds.has(targetId) || targetId === String(row?.id || '').trim())) {
        errors.push(`momo_customers[${index}] 合併目標不存在或指向自己`);
      }
      if (targetId && !archivedAt) errors.push(`momo_customers[${index}] 合併後未封存`);
      const visited = new Set();
      let cursor = String(row?.id || '').trim();
      let terminal = null;
      while (cursor && customerById.has(cursor)) {
        if (visited.has(cursor)) {
          errors.push(`momo_customers 合併鏈形成循環：${cursor}`);
          terminal = null;
          break;
        }
        visited.add(cursor);
        terminal = customerById.get(cursor);
        cursor = String(terminal?.mergedIntoCustomerId || terminal?.merged_into_customer_id || '').trim();
      }
      if (targetId && terminal && !cursor && (terminal.archivedAt || terminal.archived_at)) {
        errors.push(`momo_customers[${index}] 合併鏈終點必須是未封存顧客`);
      }
    });

    const orderRows = Array.isArray(payload.momo_orders) ? payload.momo_orders : [];
    const orderIds = new Set(orderRows.map(row => String(row?.id || '').trim()).filter(Boolean));
    orderRows.forEach((row, index) => {
      const customerId = String(row?.customerId || '').trim();
      if (schemaVersion >= 3 && (!customerId || !customerIds.has(customerId))) {
        errors.push(`momo_orders[${index}] 顧客關聯不存在`);
      } else if (customerId && !customerIds.has(customerId)) {
        errors.push(`momo_orders[${index}] 顧客關聯不存在`);
      }
    });

    const ledgerRows = Array.isArray(payload.momo_prepaidLedger) ? payload.momo_prepaidLedger : [];
    validateUniqueIds('momo_prepaidLedger', ledgerRows);
    ledgerRows.forEach((row, index) => {
      if (!nonEmpty(row?.customerId)) errors.push(`momo_prepaidLedger[${index}] 缺少 customerId`);
      if (!finiteNumber(row?.signedAmount) || Number(row.signedAmount) === 0) errors.push(`momo_prepaidLedger[${index}] 金額格式不正確`);
      if (schemaVersion >= 3 && !safeInteger(row?.signedAmount)) errors.push(`momo_prepaidLedger[${index}] 金額必須是安全整數`);
      if (!validDate(row?.date)) errors.push(`momo_prepaidLedger[${index}] 日期格式不正確`);
      if (!['topup', 'debit', 'adjustment', 'reversal'].includes(row?.kind)) errors.push(`momo_prepaidLedger[${index}] kind 不正確`);
      if (!['topup', 'debit'].includes(row?.bucket)) errors.push(`momo_prepaidLedger[${index}] bucket 不正確`);
      const signedAmount = Number(row?.signedAmount);
      if (row?.kind === 'topup' && !(row?.bucket === 'topup' && signedAmount > 0)) errors.push(`momo_prepaidLedger[${index}] 進帳正負號或 bucket 不正確`);
      if (row?.kind === 'debit' && !(row?.bucket === 'debit' && signedAmount < 0)) errors.push(`momo_prepaidLedger[${index}] 扣款正負號或 bucket 不正確`);
      if (row?.customerId && !customerIds.has(String(row.customerId))) errors.push(`momo_prepaidLedger[${index}] 顧客關聯不存在`);
      if (row?.sourceOrderId && !orderIds.has(String(row.sourceOrderId))) errors.push(`momo_prepaidLedger[${index}] 訂單關聯不存在`);
      const reversalId = String(row?.reversalOfEntryId || '').trim();
      if ((row?.kind === 'reversal') !== Boolean(reversalId)) errors.push(`momo_prepaidLedger[${index}] 沖銷關聯不正確`);
    });
    const ledgerById = new Map(ledgerRows.map(row => [String(row?.id || '').trim(), row]));
    const reversalTargets = new Set();
    const transferGroups = new Map();
    ledgerRows.forEach((row, index) => {
      const reversalId = String(row?.reversalOfEntryId || '').trim();
      const original = ledgerById.get(reversalId);
      if (reversalId && !original) errors.push(`momo_prepaidLedger[${index}] 找不到原沖銷分錄`);
      if (reversalId && reversalTargets.has(reversalId)) errors.push(`momo_prepaidLedger 重複沖銷原分錄：${reversalId}`);
      if (reversalId) reversalTargets.add(reversalId);
      if (row?.kind === 'reversal' && original) {
        if (original.kind === 'reversal'
          || original.systemManaged
          || original.transferGroupId
          || original.sourceOrderId
          || row.systemManaged
          || row.transferGroupId
          || row.sourceOrderId
          || String(original.note || '').startsWith('顧客合併')
          || String(original.customerId) !== String(row.customerId)
          || original.bucket !== row.bucket
          || Number(row.signedAmount) !== -Number(original.signedAmount)) {
          errors.push(`momo_prepaidLedger[${index}] 未完整反向沖銷原分錄`);
        }
      }
      if (row?.transferGroupId && !row?.systemManaged) errors.push(`momo_prepaidLedger[${index}] 合併轉移分錄未標記 systemManaged`);
      if (row?.transferGroupId) {
        const key = String(row.transferGroupId);
        if (!transferGroups.has(key)) transferGroups.set(key, []);
        transferGroups.get(key).push(row);
      }
    });
    transferGroups.forEach((rows, groupId) => {
      const customers = new Set(rows.map(row => String(row.customerId)));
      const net = rows.reduce((sum, row) => sum + Number(row.signedAmount || 0), 0);
      const shapeMatches = rows.length === 2
        && customers.size === 2
        && net === 0
        && rows.every(row => row.kind === 'adjustment' && row.systemManaged)
        && rows[0].bucket === rows[1].bucket
        && rows[0].date === rows[1].date
        && String(rows[0].sourceOrderId || '') === String(rows[1].sourceOrderId || '');
      if (!shapeMatches) errors.push(`momo_prepaidLedger 合併轉移組 ${groupId} 必須是兩筆互抵分錄`);
    });

    validateUniqueIds('momo_expenses', payload.momo_expenses);
    (Array.isArray(payload.momo_expenses) ? payload.momo_expenses : []).forEach((row, index) => {
      if (!validDate(row?.date) || !finiteNumber(row?.amount) || Number(row.amount) < 0
        || (schemaVersion >= 3 && !safeInteger(row?.amount))) errors.push(`momo_expenses[${index}] 格式不正確`);
      const paymentMethod = row?.paymentMethod;
      if ((schemaVersion >= 4 && paymentMethod === undefined)
        || (paymentMethod !== undefined && !Object.values(EXPENSE_PAYMENT).includes(paymentMethod))) {
        errors.push(`momo_expenses[${index}] 支出付款方式不正確`);
      }
    });
    validateUniqueIds('momo_inventory', payload.momo_inventory);
    (Array.isArray(payload.momo_inventory) ? payload.momo_inventory : []).forEach((row, index) => {
      if (!nonEmpty(row?.name) || !finiteNumber(row?.stock) || Number(row.stock) < 0
        || (schemaVersion >= 3 && !safeInteger(row?.stock))) errors.push(`momo_inventory[${index}] 格式不正確`);
      if (row?.minStock !== undefined && (!safeInteger(row.minStock) || Number(row.minStock) <= 0)) {
        errors.push(`momo_inventory[${index}] 安全庫存格式不正確`);
      }
    });
    (Array.isArray(payload.momo_servicesConfig) ? payload.momo_servicesConfig : []).forEach((row, index) => {
      if (!nonEmpty(row?.name) || !finiteNumber(row?.duration) || Number(row.duration) <= 0 || !finiteNumber(row?.price) || Number(row.price) < 0
        || (schemaVersion >= 3 && (!safeInteger(row?.duration) || !safeInteger(row?.price)))) {
        errors.push(`momo_servicesConfig[${index}] 格式不正確`);
      }
    });
    if (isPlainRecord(payload.momo_crmNotes)) {
      Object.entries(payload.momo_crmNotes).forEach(([customerId, note]) => {
        if (schemaVersion >= 3 && !customerIds.has(customerId)) errors.push(`momo_crmNotes 顧客關聯不存在：${customerId}`);
        if (typeof note !== 'string') errors.push(`momo_crmNotes[${customerId}] 必須是文字`);
      });
    }
    if (isPlainRecord(payload.momo_crmFormulas)
      && Object.values(payload.momo_crmFormulas).some(value => !isPlainRecord(value))) {
      errors.push('momo_crmFormulas 內含無效顧客資料');
    }
    if (isPlainRecord(payload.momo_crmFormulas)) {
      Object.keys(payload.momo_crmFormulas).forEach(customerId => {
        if (schemaVersion >= 3 && !customerIds.has(customerId)) errors.push(`momo_crmFormulas 顧客關聯不存在：${customerId}`);
      });
    }
    if (isPlainRecord(payload.momo_closeoutRecords)) {
      const moneyFields = [
        'expectedCash', 'countedCash', 'difference', 'cash', 'transfer', 'prepaidOut',
        'prepaidIn', 'cashPrepaidIn', 'transferPrepaidIn', 'serviceRevenue', 'expenses', 'netProfit'
      ];
      if (schemaVersion >= 4) moneyFields.push('openingCash', 'cashExpenses', 'actualCashIn');
      Object.entries(payload.momo_closeoutRecords).forEach(([date, row]) => {
        if (!isPlainRecord(row)) {
          errors.push(`momo_closeoutRecords[${date}] 內含無效日結資料`);
          return;
        }
        if (!validDate(date) || (schemaVersion >= 3 ? row.date !== date : (row.date && row.date !== date))) {
          errors.push(`momo_closeoutRecords[${date}] 日期關聯不正確`);
        }
        moneyFields.forEach(field => {
          const missing = row[field] === undefined || row[field] === null || row[field] === '';
          if ((schemaVersion >= 3 && missing)
            || (!missing && (!finiteNumber(row[field]) || (schemaVersion >= 3 && !safeInteger(row[field]))))) {
            errors.push(`momo_closeoutRecords[${date}] ${field} 格式不正確`);
          }
        });
        if (schemaVersion >= 4 && (Number(row.openingCash) < 0 || Number(row.cashExpenses) < 0)) {
          errors.push(`momo_closeoutRecords[${date}] 開店零用金或現金支出不可為負數`);
        }
        if (schemaVersion >= 4
          && safeInteger(row.openingCash)
          && safeInteger(row.actualCashIn)
          && safeInteger(row.cashExpenses)
          && safeInteger(row.expectedCash)
          && Number(row.expectedCash) !== Number(row.openingCash) + Number(row.actualCashIn) - Number(row.cashExpenses)) {
          errors.push(`momo_closeoutRecords[${date}] 應有現金公式不平衡`);
        }
        if (schemaVersion >= 4
          && safeInteger(row.countedCash)
          && safeInteger(row.expectedCash)
          && safeInteger(row.difference)
          && Number(row.difference) !== Number(row.countedCash) - Number(row.expectedCash)) {
          errors.push(`momo_closeoutRecords[${date}] 帳實差額公式不平衡`);
        }
        ['ordersCount', 'serviceOrdersCount', 'topupCount'].forEach(field => {
          if (row[field] !== undefined && (!safeInteger(row[field]) || Number(row[field]) < 0)) {
            errors.push(`momo_closeoutRecords[${date}] ${field} 格式不正確`);
          }
        });
        if (schemaVersion >= 3 && row.ordersCount === undefined) errors.push(`momo_closeoutRecords[${date}] 缺少 ordersCount`);
        if ((schemaVersion >= 3 && !row.completedAt) || (row.completedAt && !isValidTimestamp(row.completedAt))) {
          errors.push(`momo_closeoutRecords[${date}] completedAt 格式不正確`);
        }
      });
    }
    if (payload.createdAt !== undefined) {
      const createdAt = String(payload.createdAt || '');
      if (!createdAt || Number.isNaN(Date.parse(createdAt))) errors.push('createdAt 格式不正確');
    }
    if (payload.momo_servicesConfigUpdatedAt !== undefined
      && payload.momo_servicesConfigUpdatedAt !== null
      && typeof payload.momo_servicesConfigUpdatedAt !== 'string') {
      errors.push('momo_servicesConfigUpdatedAt 必須是字串或 null');
    }

    if (errors.length) {
      return {
        ok: false,
        errors,
        warnings,
        data: null,
        servicesIncluded: Array.isArray(payload.momo_servicesConfig)
      };
    }

    const normalized = {
      schemaVersion,
      createdAt: payload.createdAt || null
    };
    [...requiredArrays, ...requiredRecords, ...optionalArrays, ...optionalRecords].forEach(key => {
      if (payload[key] !== undefined) normalized[key] = cloneJsonValue(payload[key]);
    });
    normalized.momo_servicesConfigUpdatedAt = payload.momo_servicesConfigUpdatedAt ?? null;

    return {
      ok: true,
      errors,
      warnings,
      data: normalized,
      servicesIncluded: Array.isArray(payload.momo_servicesConfig)
    };
  }

  function evaluatePwaReloadGuard(lastReload = null, now = Date.now(), cooldownMs = 90000) {
    const lastReloadAt = Number(lastReload?.at || 0);
    const currentTime = Number(now);
    const cooldown = Math.max(0, Number(cooldownMs) || 0);
    const elapsed = currentTime - lastReloadAt;
    const blocked = Boolean(lastReloadAt)
      && Number.isFinite(currentTime)
      && Number.isFinite(elapsed)
      && elapsed >= 0
      && elapsed < cooldown;
    return {
      allow: !blocked,
      retryAfterMs: blocked ? Math.max(0, cooldown - elapsed) : 0
    };
  }

  function shouldRetryCalendarSync(options = {}) {
    const retryAttempt = Math.max(0, Number(options.retryAttempt) || 0);
    const status = Math.max(0, Number(options.status) || 0);
    const errorName = String(options.errorName || '');
    if (options.online === false || retryAttempt >= 1) return false;
    if (status) return status >= 500 || [408, 425, 429].includes(status);
    return errorName === 'AbortError' || errorName === 'TypeError';
  }

  // Rows must already be ordered newest-first. Keeping only the visible tail per
  // customer prevents CRM from retaining and re-sorting the full ledger N times.
  function groupRecentRowsByCustomer(rows = [], resolveCustomerId = null, limit = 6) {
    const groups = Object.create(null);
    const maxRows = Math.max(0, Math.floor(Number(limit) || 0));
    if (!maxRows) return groups;
    (Array.isArray(rows) ? rows : []).forEach(row => {
      const rawCustomerId = typeof resolveCustomerId === 'function'
        ? resolveCustomerId(row?.customerId, row)
        : row?.customerId;
      const customerId = String(rawCustomerId || '').trim();
      if (!customerId) return;
      if (!groups[customerId]) groups[customerId] = [];
      if (groups[customerId].length < maxRows) groups[customerId].push(row);
    });
    return groups;
  }

  const CRM_SERVICE_CYCLES = Object.freeze([
    { key: 'cut', label: '剪髮', days: 45, pattern: /剪髮|剪|瀏海/ },
    { key: 'color', label: '染髮', days: 60, pattern: /染髮|特殊色|補染|挑染|漂髮|漂|染/ },
    { key: 'perm', label: '燙髮', days: 120, pattern: /燙髮|縮毛|離子|冷塑|溫塑|熱塑|燙/ },
    { key: 'care', label: '護髮／頭皮', days: 45, pattern: /頭皮調理|頭皮淨化|頭皮|護髮|結構護|水療|保養|修護|養護|護理|療程|護/ }
  ]);

  function crmDateEpoch(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const epoch = Date.UTC(year, month - 1, day);
    const parsed = new Date(epoch);
    if (!Number.isFinite(epoch)
      || parsed.getUTCFullYear() !== year
      || parsed.getUTCMonth() !== month - 1
      || parsed.getUTCDate() !== day) return null;
    return epoch;
  }

  function crmDateDiffDays(laterDate, earlierDate) {
    const later = crmDateEpoch(laterDate);
    const earlier = crmDateEpoch(earlierDate);
    if (later === null || earlier === null) return 0;
    return Math.max(0, Math.floor((later - earlier) / 86400000));
  }

  function crmAddDays(date, days) {
    const epoch = crmDateEpoch(date);
    if (epoch === null) return '';
    return new Date(epoch + Math.max(0, Number(days) || 0) * 86400000).toISOString().slice(0, 10);
  }

  function crmShiftDays(date, days) {
    const epoch = crmDateEpoch(date);
    if (epoch === null) return '';
    return new Date(epoch + (Number(days) || 0) * 86400000).toISOString().slice(0, 10);
  }

  function calculateCustomerOperationKpis(orders = [], todayDate = '', options = {}) {
    const today = crmDateEpoch(todayDate) === null
      ? new Date().toISOString().slice(0, 10)
      : String(todayDate);
    const returnWindowDays = Math.max(1, Math.round(Number(options.returnWindowDays) || 90));
    const fixedWindowDays = Math.max(returnWindowDays, Math.round(Number(options.fixedWindowDays) || 180));
    const dormantDays = Math.max(1, Math.round(Number(options.dormantDays) || 180));
    const fixedVisitCount = Math.max(2, Math.round(Number(options.fixedVisitCount) || 3));
    const currentStart = crmShiftDays(today, -(returnWindowDays - 1));
    const previousEnd = crmShiftDays(currentStart, -1);
    const previousStart = crmShiftDays(currentStart, -returnWindowDays);
    const fixedStart = crmShiftDays(today, -(fixedWindowDays - 1));
    const percent = (numerator, denominator) => denominator > 0
      ? Math.round(numerator / denominator * 100)
      : null;
    const inRange = (date, start, end) => date >= start && date <= end;

    const serviceOrders = (Array.isArray(orders) ? orders : [])
      .filter(order => order && isOrderActive(order)
        && order.paymentMethod !== PAYMENT.PREPAID_TOPUP
        && String(order.customerId || '').trim()
        && crmDateEpoch(order.date) !== null
        && String(order.date) <= today)
      .map(order => ({
        ...order,
        customerId: String(order.customerId).trim(),
        date: String(order.date),
        amount: Number(order.amount) || 0
      }));
    const visits = serviceOrders.filter(order => !isCorrectionSlip(order));
    const visitDatesByCustomer = new Map();
    visits.forEach(order => {
      if (!visitDatesByCustomer.has(order.customerId)) visitDatesByCustomer.set(order.customerId, new Set());
      visitDatesByCustomer.get(order.customerId).add(order.date);
    });

    const customersInRange = (start, end) => {
      const ids = new Set();
      visits.forEach(order => {
        if (inRange(order.date, start, end)) ids.add(order.customerId);
      });
      return ids;
    };
    const previousCustomers = customersInRange(previousStart, previousEnd);
    const currentCustomers = customersInRange(currentStart, today);
    const returnedCustomers = new Set([...previousCustomers].filter(customerId => currentCustomers.has(customerId)));

    const fixedActiveCustomers = customersInRange(fixedStart, today);
    const fixedCustomers = new Set([...fixedActiveCustomers].filter(customerId => {
      const dates = visitDatesByCustomer.get(customerId) || new Set();
      return [...dates].filter(date => inRange(date, fixedStart, today)).length >= fixedVisitCount;
    }));

    const historicalCustomers = new Set(visitDatesByCustomer.keys());
    const dormantCustomers = new Set([...historicalCustomers].filter(customerId => {
      const dates = [...(visitDatesByCustomer.get(customerId) || [])].sort();
      const lastDate = dates[dates.length - 1] || '';
      return lastDate && crmDateDiffDays(today, lastDate) >= dormantDays;
    }));

    const priorCustomers = new Set();
    visits.forEach(order => {
      if (order.date < currentStart) priorCustomers.add(order.customerId);
    });
    const currentRevenueRows = serviceOrders.filter(order => inRange(order.date, currentStart, today));
    const totalServiceRevenue = Math.round(currentRevenueRows.reduce((sum, order) => sum + order.amount, 0));
    const returningRevenueRows = currentRevenueRows.filter(order => priorCustomers.has(order.customerId));
    const returnRevenue = Math.round(returningRevenueRows.reduce((sum, order) => sum + order.amount, 0));
    const revenueReturningCustomers = new Set(returningRevenueRows.map(order => order.customerId));

    return {
      asOf: today,
      returnWindowDays,
      fixedWindowDays,
      dormantDays,
      fixedVisitCount,
      currentStart,
      previousStart,
      previousEnd,
      fixedStart,
      returnRate: {
        value: percent(returnedCustomers.size, previousCustomers.size),
        numerator: returnedCustomers.size,
        denominator: previousCustomers.size
      },
      fixedCustomerRate: {
        value: percent(fixedCustomers.size, fixedActiveCustomers.size),
        numerator: fixedCustomers.size,
        denominator: fixedActiveCustomers.size
      },
      dormantRate: {
        value: percent(dormantCustomers.size, historicalCustomers.size),
        numerator: dormantCustomers.size,
        denominator: historicalCustomers.size
      },
      returnRevenue: {
        value: returnRevenue,
        totalServiceRevenue,
        share: percent(returnRevenue, totalServiceRevenue),
        customerCount: revenueReturningCustomers.size
      }
    };
  }

  function matchingCrmServiceCycles(serviceName = '') {
    const text = String(serviceName || '').trim();
    const matches = CRM_SERVICE_CYCLES.filter(cycle => cycle.pattern.test(text));
    return matches.length ? matches : [{ key: 'other', label: '其他服務', days: 60, pattern: null }];
  }

  function classifyCrmServiceCycle(serviceName = '') {
    const matches = matchingCrmServiceCycles(serviceName);
    const preferredOrder = ['perm', 'color', 'care', 'cut', 'other'];
    return preferredOrder.map(key => matches.find(item => item.key === key)).find(Boolean) || matches[0];
  }

  function buildCrmServiceObservations(orders = [], todayDate = '') {
    const today = crmDateEpoch(todayDate) === null
      ? new Date().toISOString().slice(0, 10)
      : String(todayDate);
    const grouped = Object.create(null);

    (Array.isArray(orders) ? orders : []).forEach(order => {
      const date = String(order?.date || '');
      if (crmDateEpoch(date) === null) return;
      matchingCrmServiceCycles(order?.serviceName).forEach(cycle => {
        if (!grouped[cycle.key]) {
          grouped[cycle.key] = {
            key: cycle.key,
            label: cycle.label,
            cycleDays: cycle.days,
            count: 0,
            totalSpent: 0,
            lastDate: '',
            lastService: ''
          };
        }
        const row = grouped[cycle.key];
        row.count += Math.max(1, Number(order?.count) || 1);
        row.totalSpent += Number(order?.totalAmount ?? order?.amount) || 0;
        if (!row.lastDate || date > row.lastDate) {
          row.lastDate = date;
          row.lastService = String(order?.serviceName || cycle.label);
        }
      });
    });

    const severity = { dormant: 3, overdue: 2, upcoming: 1, stable: 0 };
    return Object.values(grouped).map(row => {
      const daysSince = crmDateDiffDays(today, row.lastDate);
      const dueDate = crmAddDays(row.lastDate, row.cycleDays);
      const overdueDays = Math.max(0, daysSince - row.cycleDays);
      let group = 'stable';
      let statusLabel = '週期內';
      if (daysSince >= Math.max(180, row.cycleDays * 2)) {
        group = 'dormant';
        statusLabel = '久未出現';
      } else if (daysSince > row.cycleDays) {
        group = 'overdue';
        statusLabel = `超過 ${overdueDays} 天`;
      } else if (daysSince >= Math.round(row.cycleDays * 0.8)) {
        group = 'upcoming';
        statusLabel = '接近週期';
      }
      return {
        ...row,
        daysSince,
        dueDate,
        overdueDays,
        group,
        statusLabel,
        progress: Math.min(200, Math.round(daysSince / row.cycleDays * 100))
      };
    }).sort((a, b) => (severity[b.group] || 0) - (severity[a.group] || 0)
      || String(a.dueDate).localeCompare(String(b.dueDate))
      || a.label.localeCompare(b.label, 'zh-Hant'));
  }

  function calculateCrmSpendTrend(orders = []) {
    const rows = (Array.isArray(orders) ? orders : [])
      .filter(order => crmDateEpoch(order?.date) !== null && Number.isFinite(Number(order?.amount)))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id || '').localeCompare(String(a.id || '')));
    const sampleSize = Math.min(3, Math.floor(rows.length / 2));
    if (sampleSize < 2) {
      return { direction: 'insufficient', label: '資料不足', percent: null, recentAverage: 0, previousAverage: 0, sampleSize: 0 };
    }
    const average = list => Math.round(list.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) / list.length);
    const recentAverage = average(rows.slice(0, sampleSize));
    const previousAverage = average(rows.slice(sampleSize, sampleSize * 2));
    const percent = previousAverage > 0 ? Math.round((recentAverage - previousAverage) / previousAverage * 100) : null;
    const direction = percent === null || Math.abs(percent) < 15 ? 'stable' : percent > 0 ? 'up' : 'down';
    const label = direction === 'up' ? '近期客單上升' : direction === 'down' ? '近期客單下降' : '近期客單持平';
    return { direction, label, percent, recentAverage, previousAverage, sampleSize };
  }

  function calculateCrmVisitPaceTrend(orders = []) {
    const dates = [...new Set((Array.isArray(orders) ? orders : [])
      .map(order => String(order?.date || ''))
      .filter(date => crmDateEpoch(date) !== null))]
      .sort((a, b) => b.localeCompare(a));
    if (dates.length < 4) {
      return { direction: 'insufficient', label: '資料不足', recentIntervalDays: 0, baselineIntervalDays: 0, percent: null };
    }
    const recentIntervalDays = crmDateDiffDays(dates[0], dates[1]);
    const baselineIntervals = [];
    for (let index = 1; index < Math.min(dates.length - 1, 4); index += 1) {
      baselineIntervals.push(crmDateDiffDays(dates[index], dates[index + 1]));
    }
    const baselineIntervalDays = Math.max(1, Math.round(baselineIntervals.reduce((sum, days) => sum + days, 0) / baselineIntervals.length));
    const percent = Math.round((recentIntervalDays - baselineIntervalDays) / baselineIntervalDays * 100);
    const direction = percent > 25 ? 'slower' : percent < -25 ? 'faster' : 'stable';
    const label = direction === 'slower' ? '到店間隔變慢' : direction === 'faster' ? '到店間隔變快' : '到店節奏持平';
    return { direction, label, recentIntervalDays, baselineIntervalDays, percent };
  }

  function buildCrmObservationProfile(input = {}) {
    const reasons = [];
    let score = 0;
    const returnGroup = String(input.returnGroup || 'stable');
    const riskGroups = new Set(['overdue', 'inactive', 'dormant', 'prepaidDormant']);
    const groupScores = { upcoming: 6, overdue: 15, inactive: 25, dormant: 35, prepaidDormant: 30 };
    score += groupScores[returnGroup] || 0;
    if (returnGroup === 'upcoming') reasons.push('接近常見整理週期');
    if (returnGroup === 'overdue') reasons.push('已超過常見整理週期');
    if (returnGroup === 'inactive') reasons.push('已超過 90 天未消費');
    if (returnGroup === 'dormant') reasons.push('已超過 180 天未消費');
    if (returnGroup === 'prepaidDormant') reasons.push('仍有儲值餘額且已久未消費');

    const prepaidBalance = Number(input.prepaidBalance) || 0;
    if (prepaidBalance < 0) {
      score += 45;
      reasons.unshift('儲值餘額為負，需先確認帳務');
    } else if (input.prepaidDormant && returnGroup !== 'prepaidDormant') {
      score += 15;
      reasons.push('仍有儲值餘額且已久未消費');
    } else if (input.prepaidLow) {
      score += 5;
      reasons.push('儲值餘額接近一次平均消費');
    }

    if (input.valueTier === 'high' && riskGroups.has(returnGroup)) {
      score += 10;
      reasons.push('屬於高價值顧客且回流放慢');
    }
    if (input.spendTrend?.direction === 'down') {
      score += 8;
      reasons.push(`近期平均客單下降 ${Math.abs(Number(input.spendTrend.percent) || 0)}%`);
    }
    if (input.visitPaceTrend?.direction === 'slower') {
      score += 7;
      reasons.push(`最近到店間隔比過往慢 ${Math.abs(Number(input.visitPaceTrend.percent) || 0)}%`);
    }

    const serviceRisks = (Array.isArray(input.serviceObservations) ? input.serviceObservations : [])
      .filter(row => ['overdue', 'dormant'].includes(row.group));
    if (serviceRisks.length) {
      if (!riskGroups.has(returnGroup)) score += 12;
      const lead = serviceRisks[0];
      reasons.push(`${lead.label}距上次 ${lead.daysSince} 天，已超過 ${lead.cycleDays} 天週期`);
    }

    score = Math.min(100, score);
    const level = score >= 45 ? 'high' : score >= 25 ? 'attention' : score >= 10 ? 'watch' : 'normal';
    const labels = { high: '優先觀察', attention: '需要留意', watch: '持續觀察', normal: '狀態平穩' };
    return {
      score,
      level,
      levelRank: { normal: 0, watch: 1, attention: 2, high: 3 }[level],
      label: labels[level],
      reasons: [...new Set(reasons)].slice(0, 4),
      primaryReason: reasons[0] || '目前回流、消費與儲值狀態平穩'
    };
  }

  function classifyMemoryPressure(sample = {}, thresholds = {}) {
    const usedBytes = Math.max(0, Number(sample.usedBytes) || 0);
    const limitBytes = Math.max(0, Number(sample.limitBytes) || 0);
    const previousUsedBytes = Math.max(0, Number(sample.previousUsedBytes) || 0);
    const elapsedMs = Math.max(0, Number(sample.elapsedMs) || 0);
    const warningRatio = Math.min(1, Math.max(0, Number(thresholds.warningRatio) || 0.75));
    const errorRatio = Math.min(1, Math.max(warningRatio, Number(thresholds.errorRatio) || 0.88));
    const warningGrowthBytes = Math.max(1, Number(thresholds.warningGrowthBytes) || 96 * 1024 * 1024);
    const errorGrowthBytes = Math.max(warningGrowthBytes, Number(thresholds.errorGrowthBytes) || 192 * 1024 * 1024);
    const growthWindowMs = Math.max(1000, Number(thresholds.growthWindowMs) || 120000);
    const supported = usedBytes > 0 && limitBytes > 0;
    const ratio = supported ? usedBytes / limitBytes : 0;
    const percent = supported ? Math.max(0.1, Math.min(100, Math.round(ratio * 1000) / 10)) : null;
    const growthBytes = previousUsedBytes > 0 ? usedBytes - previousUsedBytes : 0;
    const rapidGrowth = previousUsedBytes > 0 && elapsedMs > 0 && elapsedMs <= growthWindowMs;

    let severity = 'ok';
    let reason = supported ? 'normal' : 'unsupported';
    if (supported && ratio >= errorRatio) {
      severity = 'error';
      reason = 'heap_ratio_error';
    } else if (rapidGrowth && growthBytes >= errorGrowthBytes) {
      severity = 'error';
      reason = 'rapid_growth_error';
    } else if (supported && ratio >= warningRatio) {
      severity = 'warning';
      reason = 'heap_ratio_warning';
    } else if (rapidGrowth && growthBytes >= warningGrowthBytes) {
      severity = 'warning';
      reason = 'rapid_growth_warning';
    }

    return { supported, usedBytes, limitBytes, percent, growthBytes, elapsedMs, severity, reason };
  }

  function evaluatePreviousRuntimeSession(session = null, now = Date.now(), maxAgeMs = 24 * 60 * 60 * 1000) {
    if (!session || typeof session !== 'object') return { unclean: false, ageMs: null, reason: 'missing' };
    if (session.closedCleanly) return { unclean: false, ageMs: 0, reason: 'clean' };
    const lastHeartbeatAt = Date.parse(session.lastHeartbeatAt || session.startedAt || '');
    const currentTime = Number(now);
    if (!Number.isFinite(lastHeartbeatAt) || !Number.isFinite(currentTime)) {
      return { unclean: false, ageMs: null, reason: 'invalid_time' };
    }
    const ageMs = currentTime - lastHeartbeatAt;
    if (ageMs < 0 || ageMs > Math.max(1000, Number(maxAgeMs) || 0)) {
      return { unclean: false, ageMs, reason: 'stale' };
    }
    return { unclean: true, ageMs, reason: 'missing_clean_shutdown' };
  }

  function classifyMainThreadStall(lagMs, options = {}) {
    const lag = Math.max(0, Number(lagMs) || 0);
    const warningMs = Math.max(100, Number(options.warningMs) || 1500);
    const errorMs = Math.max(warningMs, Number(options.errorMs) || 5000);
    if (options.visible === false || lag < warningMs) return { detected: false, severity: 'ok', lagMs: lag };
    return { detected: true, severity: lag >= errorMs ? 'error' : 'warning', lagMs: lag };
  }

  return {
    PAYMENT,
    EXPENSE_PAYMENT,
    toMoney,
    normalizeServiceName,
    normalizePotentialDuplicateCustomerName,
    findPotentialDuplicateCustomerGroups,
    buildDataCorrectionQueue,
    buildServiceMetricDictionary,
    resolveServiceMetric,
    calculatePeriodKpis,
    isOrderActive,
    isCorrectionSlip,
    getTopupChannel,
    getMixedCashAmount,
    getMixedPrepaidAmount,
    normalizeExpensePaymentMethod,
    calculateCloseoutTotals,
    upsertGeneratedSalaryExpense,
    sanitizeCsvCellValue,
    escapeCsvCell,
    emptyMoneyVector,
    orderMoneyVector,
    orderCorrectionLinesFromVector,
    buildLockedOrderCorrectionLines,
    getOrderPrepaidBucket,
    prepaidKindForTarget,
    getOrderPrepaidTarget,
    prepaidEntryReversed,
    canReversePrepaidEntry,
    buildPrepaidReversalPayload,
    buildPrepaidLedgerUploadBatches,
    planPrepaidLedgerReconciliation,
    buildOrderPrepaidDateAdjustments,
    resolveEffectiveMinutes,
    calculateEffectiveTimeYield,
    cloneJsonValue,
    isValidISODate,
    isFiniteNumericInput,
    validateAndNormalizeBackupPayload,
    evaluatePwaReloadGuard,
    shouldRetryCalendarSync,
    groupRecentRowsByCustomer,
    calculateCustomerOperationKpis,
    classifyCrmServiceCycle,
    buildCrmServiceObservations,
    calculateCrmSpendTrend,
    calculateCrmVisitPaceTrend,
    buildCrmObservationProfile,
    classifyMemoryPressure,
    evaluatePreviousRuntimeSession,
    classifyMainThreadStall
  };
});
