    const { createApp, markRaw } = Vue;
    const APP_VERSION = '2026.07.17-data-correction-1';
    if (!window.MomoCore) throw new Error('MomoCore not loaded');
    const MomoCore = window.MomoCore;

    // 空白初始資料；正式資料由行事曆同步或手動建立
    const defaultOrders = [];
    const defaultExpenses = [];
    const defaultInventory = [];
    const defaultCrmNotes = {};

    // 每日一則台式幽默 / 冷知識 / 髮型師語錄 (共 31 則，按日期輪播)
    const dailyGreetings = [
      { title: '今天也是美麗的一天，MOMO', sub: '冷知識：人的頭髮平均每個月長 1.25 公分，一年大約 15 公分喔！' },
      { title: 'MOMO 早安，今天也穩穩營業', sub: '冷笑話：為什麼髮型師都很冷靜？因為他們很會「剪」持。' },
      { title: '歡迎回來營運總部，辛苦的 MOMO', sub: '冷知識：亞洲人的頭髮直徑是歐洲人的兩倍粗。' },
      { title: '嗨 MOMO，今天也把客人整理好', sub: '台式幽默：客人說「隨便剪」，是設計師最大的恐怖片。' },
      { title: '又是忙碌的一天，加油 MOMO', sub: '冷知識：一根頭髮可以承受 100 克的重量，整頭頭髮可以撐住兩頭大象！' },
      { title: 'MOMO 你今天的氣場很穩', sub: '台式幽默：設計師的名言——「你上次是誰剪的？」（無聲的控訴）' },
      { title: '今天的 MOMO 也狀態很好', sub: '冷知識：頭髮是人體上生長第二快的組織，僅次於骨髓。' },
      { title: '來吧 MOMO，今天繼續創造好作品', sub: '冷笑話：頭髮為什麼不會迷路？因為它有「髮」線導航。' },
      { title: '哈囉 MOMO，今天也照節奏走', sub: '冷知識：金髮的人平均有 14 萬根頭髮，黑髮約 10 萬根。' },
      { title: '今天天氣適合好好營業，MOMO', sub: '台式幽默：「我只是想修一下瀏海」——最後變全新造型的開場白。' },
      { title: 'MOMO 駕到，誰與爭鋒！', sub: '冷知識：每天掉 50~100 根頭髮是正常的，不用太擔心啦！' },
      { title: '今天也要用剪刀征服全場，MOMO', sub: '冷笑話：為什麼染髮要很久？因為顏色需要「深入髮」展。' },
      { title: '美好的一天從打開營運總部開始', sub: '冷知識：頭髮在水中可以伸展到原長度的 130%！' },
      { title: 'MOMO～今天也是被需要的一天呢', sub: '台式幽默：客人坐下第一句「我不知道要剪什麼」，設計師內心：我也不知道啊。' },
      { title: '準備好了嗎？今天要爆單囉 MOMO！', sub: '冷知識：世界上最長的頭髮紀錄超過 5 公尺，來自中國！' },
      { title: '每一剪都是藝術，MOMO 你是藝術家', sub: '冷笑話：頭髮說什麼讓吹風機感動？「你讓我飄飄然。」' },
      { title: 'MOMO 今天心情怎麼樣？希望是開心的！', sub: '冷知識：頭髮的主要成分是角蛋白，跟你的指甲成分一樣喔！' },
      { title: '今天的業績就交給穩定的 MOMO', sub: '台式幽默：「我要跟上次一樣就好」——但上次是另一位設計師剪的。' },
      { title: '陽光、微笑、好手藝——MOMO 三大法寶', sub: '冷知識：紅髮是最稀有的天然髮色，全球只有 1 到 2% 的人擁有。' },
      { title: '嘿 MOMO！今天也要讓鏡子裡的客人驚豔', sub: '冷笑話：為什麼設計師從不遲到？因為他們總是很「剪」時。' },
      { title: 'MOMO 的技術就是最好的行銷！', sub: '冷知識：健康的頭髮在乾燥狀態下，彈性可以伸展 20% 不斷裂。' },
      { title: '今天也是讓人變漂亮的好日子', sub: '台式幽默：「幫我剪短一點就好」——短多少算短呢？一公分？十公分？' },
      { title: 'MOMO～你的雙手就是魔法棒', sub: '冷知識：頭髮可以測出你過去幾個月攝取的物質，就像身體的日記本！' },
      { title: '開工啦 MOMO，今天也把節奏顧好', sub: '冷笑話：為什麼護髮素很黏人？因為它離不開你的「髮」絲。' },
      { title: '每位客人離開時的笑容，都是 MOMO 的成績', sub: '冷知識：黑色是全球最常見的髮色，約 75 到 85% 的人是黑髮。' },
      { title: 'MOMO 加油！月底薪水靠今天的你了', sub: '台式幽默：設計師最怕聽到的話——「我朋友說這個顏色很好看」。' },
      { title: '今天的 MOMO 也太好看了吧', sub: '冷知識：一個人的頭髮全部接起來的長度，一輩子可以繞地球好幾圈！' },
      { title: '技術好 + 態度讚 = MOMO 本人！', sub: '冷笑話：「你的頭髮會說話嗎？」「會啊，它每天都在跟我『髮』牢騷。」' },
      { title: '客人開心、MOMO 開心、口袋也開心！', sub: '冷知識：古埃及人用蜂蜜和蓖麻油做護髮，已經有 5000 年歷史了！' },
      { title: 'MOMO 你知道嗎？你笑起來超好看的', sub: '台式幽默：每個設計師心中都有一句話：「你確定要染這個顏色？」' },
      { title: '今天也要元氣滿滿喔，MOMO！', sub: '冷知識：頭髮的生長週期分三階段，一根頭髮可以生長 2~7 年才掉落！' }
    ];

    // 系統預設美髮服務對照字典
    const defaultServicesConfig = [
      { name: '頭皮健康髮浴', duration: 60, price: 600 },
      { name: '[紓壓調理]頭皮健康髮浴', duration: 60, price: 600 },
      { name: '頭皮初淨調理', duration: 120, price: 2000 },
      { name: '孩童剪髮', duration: 30, price: 400 },
      { name: '[精緻剪髮]孩童剪髮', duration: 30, price: 400 },
      { name: '孩童洗+剪', duration: 60, price: 550 },
      { name: '剪髮', duration: 30, price: 600 },
      { name: '洗+剪', duration: 60, price: 800 },
      { name: '健康髮浴+剪', duration: 90, price: 1100 },
      { name: '頭皮初淨調理+剪髮', duration: 150, price: 2200 },
      { name: '男生短髮', duration: 60, price: 1400 },
      { name: '[單色染髮]男生短髮', duration: 60, price: 1400 },
      { name: '短髮染髮', duration: 120, price: 2200 },
      { name: '中長染髮', duration: 150, price: 2500 },
      { name: '長髮染髮', duration: 150, price: 2800 },
      { name: '特長染髮', duration: 150, price: 3100 },
      { name: '特殊色', duration: 600, price: 5000 },
      { name: '[特殊色]特殊色', duration: 600, price: 5000 },
      { name: '髮絲水潤修護', duration: 90, price: 1200 },
      { name: '[髮絲保養]髮絲水潤修護', duration: 90, price: 1200 },
      { name: '結構式護髮', duration: 120, price: 1800 }
    ];

    // 行事曆封鎖時段的識別關鍵字（這些名稱不計入業績與 CRM）
    const BLOCKED_SLOT_KEYWORDS = ['不約', '卡'];
    const safeParse = (value, fallback) => {
      try { return value ? JSON.parse(value) : fallback; }
      catch (error) { return fallback; }
    };

    const momoApp = createApp({
      data() {
        // Init filters
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const [curYear, curMonth] = todayStr.split('-');
        const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);

        return {
          activeTab: 'dashboard',
          navTabs: [
            { id: 'dashboard', label: '總覽' },
            { id: 'orders', label: '業績' },
            { id: 'expenses', label: '支出' },
            { id: 'inventory', label: '庫存' },
            { id: 'crm', label: '顧客' },
            { id: 'report', label: '報表' },
            { id: 'safety', label: '安全' }
          ],
          mobilePrimaryTabs: [
            { id: 'dashboard', label: '總覽' },
            { id: 'orders', label: '業績' },
            { id: 'expenses', label: '支出' }
          ],
          mobileMoreTabs: [
            { id: 'inventory', label: '庫存管理', description: '補貨與安全庫存' },
            { id: 'crm', label: '顧客 CRM', description: '顧客紀錄與配方' },
            { id: 'report', label: '報表', description: '月結與營運分析' },
            { id: 'safety', label: '資料安全', description: '異常、備份與還原' }
          ],
          showMobileMorePages: false,
          orders: [],
          expenses: [],
          inventory: [],
          customers: [],
          prepaidLedger: [],
          dataSchemaVersion: 4,
          todayDate: todayStr,
          crmNotes: {},

          selectedYear: curYear,
          selectedMonth: curMonth,
          lastMonthlySelection: curMonth,

          showDataTools: false,
          showMobileTools: false,
          syncing: false,
          headerSyncFeedback: 'idle',
          headerSyncFeedbackTimer: null,
          apiBaseUrl: '',
          authLoading: true,
          authConfig: {
            configured: false,
            required: false,
            supabaseUrl: '',
            publishableKey: ''
          },
          authSession: safeParse(localStorage.getItem('momo_auth_session'), null),
          authUser: null,
          authError: '',
          showAuthSheet: false,
          localQaRoute: '',
          cloudReady: false,
          cloudMigrationNeeded: false,
          cloudStatus: 'idle',
          cloudMessage: '尚未連接雲端資料',
          cloudLastSync: localStorage.getItem('momo_cloud_last_sync') || null,
          cloudRestorePending: safeParse(localStorage.getItem('momo_cloud_restore_pending'), null),
          cloudSyncTimer: null,
          cloudSyncInFlight: false,
          cloudSyncPending: false,
          cloudApplying: false,
          cloudBaseline: markRaw({}),
          cloudPendingWrite: safeParse(localStorage.getItem('momo_cloud_pending_write'), null),
          cloudConflict: null,
          cloudTopupChannelSupported: true,
          cloudCloseoutBreakdownSupported: true,
          cloudCloseoutCountSupported: true,
          cloudCloseoutCashFlowSupported: true,
          cloudExpensePaymentSupported: true,
          cloudActualTimeSupported: true,
          cloudCorrectionSlipSupported: true,
          cloudVersionPollTimer: null,
          authForm: {
            email: '',
            password: ''
          },
          lastSyncTime: localStorage.getItem('momo_last_sync_time') || null,
          syncReport: safeParse(localStorage.getItem('momo_sync_report'), null),
          syncError: safeParse(localStorage.getItem('momo_sync_error'), null),
          showSyncIssueModal: false,
          syncIssueFilter: 'all',
          calendarAutoSyncState: safeParse(localStorage.getItem('momo_calendar_auto_sync_state'), {}),
          calendarSyncConfigured: null,
          calendarAutoSyncTimer: null,
          calendarSyncRetryTimer: null,
          calendarSyncRetryAt: null,
          calendarSyncFallbackActive: false,
          calendarAutoSyncStatus: 'idle',
          calendarAutoSyncMessage: '',
          backupStatus: 'idle',
          lastBackupAt: localStorage.getItem('momo_last_backup_at') || null,
          lastCloudBackupAt: localStorage.getItem('momo_last_cloud_backup_at') || null,
          backupSnapshots: markRaw(safeParse(localStorage.getItem('momo_backup_snapshots'), [])),
          cloudBackups: safeParse(localStorage.getItem('momo_cloud_backups'), []),
          cloudBackupStatus: 'idle',
          cloudBackupError: '',
          cloudBackupRetentionMessage: '',
          cloudBackupsLoadedAt: localStorage.getItem('momo_cloud_backups_loaded_at') || null,
          cloudBackupRestoringId: null,
          showCloudRestoreModal: false,
          cloudRestoreDraft: null,
          cloudRestoreConfirmText: '',
          cloudRestorePreviewLoading: false,
          storageRecoveryBlocked: null,
          storageRecoveryNotice: safeParse(localStorage.getItem('momo_storage_recovery_notice'), null),
          integrityReport: safeParse(localStorage.getItem('momo_integrity_report'), null),
          safetyReport: safeParse(localStorage.getItem('momo_safety_report'), null),
          safetyChecking: false,
          safetyMaintenanceSection: '',
          safetyMaintenanceView: 'backup',
          safetyShowAllIssues: false,
          dataCorrectionFilter: 'all',
          dataCorrectionShowAll: false,
          dataCorrectionScanning: false,
          safetyShowAllCloudBackups: false,
          safetyShowAllLocalSnapshots: false,
          pendingActionStartDate: '2026-07-01',
          operationLogs: safeParse(localStorage.getItem('momo_operation_logs'), []),
          runtimeDiagnostics: safeParse(localStorage.getItem('momo_runtime_diagnostics'), []),
          runtimeDiagnosticsExpanded: false,
          runtimeHealthSample: null,
          runtimeMonitorStartedAt: null,
          runtimeMonitorTimer: null,
          runtimeMonitorExpectedAt: 0,
          runtimeMonitorTick: 0,
          runtimeLongTaskObserver: null,
          runtimeLongTaskStats: null,
          runtimeLastAnomalyAt: {},
          runtimeErrorHandler: null,
          runtimeRejectionHandler: null,
          runtimeVisibilityHandler: null,
          runtimePageHideHandler: null,
          runtimePageShowHandler: null,
          runtimeMemoryPressureHandler: null,
          runtimeSessionId: '',
          runtimeSessionState: null,
          showOperationLogModal: false,
          closeoutRecords: {},
          closeoutDate: todayStr,
          closeoutOpeningCash: 0,
          closeoutCashCount: null,
          closeoutNote: '',
          editSnapshots: {},
          orderEditDrafts: {},
          expenseEditDrafts: {},
          inventoryEditDrafts: {},
          crmEditDrafts: {},
          crmFormulas: {},
          online: navigator.onLine,
          isIOSDevice,
          iosPerfMode: isIOSDevice,
          iosViewportResizeHandler: null,
          iosViewportRaf: null,
          isStandalone: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
          showIosGuide: false,
          hoveredPoint: null,
          hoveredReportBar: null,
          hideEmptyMonths: false,
          reportBreakdownTab: 'income',
          reportViewMode: 'monthly',
          reportAnalysisTab: 'trend',
          reportShowPrepaidDetails: false,
          reportShowYieldDetails: false,
          reportYieldSort: 'yield_desc',
          reportYieldMinCount: 3,
          appVersion: APP_VERSION,
          updateAvailable: false,
          pendingServiceWorker: null,
          pwaRegistration: null,
          pwaRefreshing: false,
          pwaUpdateApplying: false,
          pwaUpdateDeferred: false,
          pwaCheckingUpdate: false,
          pwaClearingCache: false,
          pwaCacheNames: [],
          pwaLastCheckedAt: null,
          pwaAutoCheckTimer: null,
          pwaAutoCheckInterval: null,
          startupSystemCheckTimer: null,
          startupSystemCheckIdleHandle: null,
          pwaStatus: '初始化中',
          showMobileAddOrderForm: false,
          expandedOrderId: null,
          collapsedOrderDates: {},
          showExpenseForm: false,
          expandedExpenseId: null,
          collapsedExpenseDates: {},
          expenseSearchQuery: '',
          expenseFilterCategory: 'All',
          showInventoryForm: false,
          inventorySearchQuery: '',
          inventoryFilterMode: 'all',
          expandedInventoryId: null,
          showCloseoutSheet: false,
          mobileDashboardSubTab: 'payment',
          formActionBusy: {
            order: false,
            expense: false,
            inventory: false,
            closeout: false,
            serviceConfig: false
          },

          // Service Pricing Dict Configuration Modal
          showServiceConfigModal: false,
          servicesConfig: [],
          tempServicesConfig: [],
          serviceConfigSearchQuery: '',
          crmNotesTimer: null,

          // Toast state
          toast: {
            show: false,
            message: '',
            type: 'success'
          },

          // 自訂確認 Modal（取代瀏覽器原生 confirm()）
          confirmModal: {
            show: false,
            title: '確認操作',
            subtitle: '請確認內容後再繼續',
            message: '',
            tone: 'warning',
            confirmLabel: '確認',
            cancelLabel: '取消',
            loadingLabel: '處理中…',
            busy: false,
            onConfirm: null
          },

          // Form fields
          newOrder: {
            date: todayStr,
            customerId: '',
            customerName: '',
            createNewCustomer: false,
            gender: '女',
            serviceName: '',
            amount: null,
            paymentMethod: '現金',
            cashAmount: null,
            topupChannel: '現金'
          },
          continueAddingOrders: false,
          newExpense: {
            date: todayStr,
            category: '材料費',
            amount: null,
            paymentMethod: '現金',
            notes: ''
          },
          newInventory: {
            name: '',
            stock: null,
            minStock: 3,
            notes: ''
          },

          crmSearchQuery: '',
          crmFilterMode: 'all',
          crmSortMode: 'lastDate',
          crmViewMode: 'customers',
          crmShowInsights: false,
          crmShowMoreFilters: false,
          crmVisibleLimit: 40,
          expandedCrmCustomerName: null,
          mergeTargetByCustomer: {},
          prepaidLedgerSearchQuery: '',
          prepaidLedgerFilter: 'all',
          ordersSearchQuery: '',
          ordersCustomerHistoryId: null,
          ordersFilterCategory: 'All',  // D: 類別篩選
          ordersFilterPayment:  'All',  // D: 付款方式篩選

          // Constants
          paymentMethods: ['現金', '轉帳', '儲值扣款', '現金＋儲值扣款', '儲值進帳'],
          expenseCategories: ['材料費', '房租', '水電費', '行銷費', '薪資', '其他'],
          expenseQuickPresets: [
            { label: '材料進貨', category: '材料費', amount: null, notes: '材料進貨', hint: '金額每次不同', reuseLastAmount: false },
            { label: '房租', category: '房租', amount: null, notes: '房租', hint: '固定支出', reuseLastAmount: true },
            { label: '水電瓦斯', category: '水電費', amount: null, notes: '水電費', hint: '可沿用上次', reuseLastAmount: true },
            { label: '廣告投放', category: '行銷費', amount: null, notes: '廣告投放', hint: '行銷費', reuseLastAmount: true },
            { label: '網路電話', category: '其他', amount: null, notes: '網路電話費', hint: '固定雜支', reuseLastAmount: true },
            { label: '清潔用品', category: '其他', amount: null, notes: '清潔用品', hint: '日常採買', reuseLastAmount: false },
            { label: '臨時雜支', category: '其他', amount: null, notes: '臨時支出', hint: '手動補充', reuseLastAmount: false }
          ],
          crmTagPresets: ['VIP', '固定染髮', '固定燙髮', '儲值客', '頭皮敏感', '怕推銷', '喜歡安靜', '久未回流'],
          formulaFields: [
            { key: 'color', label: '染髮配方 / 色號', placeholder: '例：8N + 8A，1:1' },
            { key: 'perm', label: '燙髮藥水 / 軟化', placeholder: '例：品牌、藥水、軟化時間' },
            { key: 'hair', label: '髮況 / 頭皮狀態', placeholder: '例：細軟、漂後、敏感' },
            { key: 'preference', label: '造型與服務偏好', placeholder: '例：自然、怕太短、溫水' },
            { key: 'caution', label: '過敏與注意事項', placeholder: '例：染劑過敏、避開頭皮' }
          ]
        };
      },
      computed: {
        // Daily rotating greeting based on day of month
        dailyGreeting() {
          const day = new Date().getDate(); // 1~31
          return dailyGreetings[(day - 1) % dailyGreetings.length];
        },
        backupSummaryText() {
          if (this.backupStatus === 'saving') return '雲端備份中';
          if (this.backupStatus === 'error') return '雲端備份失敗';
          if (this.lastCloudBackupAt) return `最近雲端備份 ${this.formatDateTime(this.lastCloudBackupAt)}`;
          if (!this.lastBackupAt) return '尚無正式備份';
          return `最近備份 ${this.formatDateTime(this.lastBackupAt)}`;
        },
        backupReminder() {
          const now = new Date();
          const today = now.toLocaleDateString('sv-SE');
          const lastBackup = this.lastCloudBackupAt || this.lastBackupAt;
          const last = lastBackup ? new Date(lastBackup) : null;
          const validLast = last && !Number.isNaN(last.getTime()) ? last : null;
          const days = validLast ? Math.floor((now - validLast) / 86400000) : null;
          const lastDate = validLast ? validLast.toLocaleDateString('sv-SE') : '';
          const cloudMode = Boolean(this.cloudReady && this.authUser);
          const due = this.backupStatus === 'error'
            || days === null
            || (cloudMode ? lastDate !== today : days >= 7);
          const okMessage = cloudMode
            ? `今天已建立雲端備份 · ${this.formatDateTime(lastBackup)}`
            : `距離上次備份 ${days} 天。建議每 7 天至少備份一次，月底結算前也要備份。`;
          return {
            due,
            days,
            tone: this.backupStatus === 'error' ? 'error' : due ? 'warn' : 'ok',
            title: this.backupStatus === 'error' ? '備份失敗，需要重新建立' : due ? '今天尚未完成正式備份' : '正式備份正常',
            message: days === null
              ? '尚未留下可追蹤的備份時間。建議先建立一次雲端備份或下載 JSON。'
              : due && cloudMode
                ? '今天尚未留下雲端正式備份，開啟系統後會自動嘗試建立，也可以手動補建。'
                : okMessage,
            actionLabel: this.cloudReady && this.authUser ? '立即雲端備份' : '下載 JSON 備份'
          };
        },
        integritySummaryText() {
          if (!this.integrityReport) return '尚未檢查完整性';
          if (this.integrityReport.status === 'ok') return '資料完整';
          return `${this.integrityReport.errorCount || 0} 錯誤、${this.integrityReport.warningCount || 0} 提醒`;
        },
        pwaStatusText() {
          if (!('serviceWorker' in navigator)) return '不支援';
          if (this.updateAvailable) return '有新版待套用';
          if (this.pwaCheckingUpdate) return '檢查中';
          return this.pwaStatus || (this.pwaRegistration ? '已啟用' : '準備中');
        },
        pwaCacheCountText() {
          if (!('caches' in window)) return '不支援';
          const count = Array.isArray(this.pwaCacheNames) ? this.pwaCacheNames.length : 0;
          return count ? `${count} 組` : '尚無快取';
        },
        pwaLastCheckedText() {
          if (!this.pwaLastCheckedAt) return '尚未自動檢查更新';
          return `最後檢查 ${this.formatDateTime(this.pwaLastCheckedAt)}`;
        },
        calendarSyncCaption() {
          if (this.syncing && this.calendarAutoSyncStatus === 'syncing') return '背景同步行事曆…';
          if (this.syncing) return '同步中…';
          if (this.calendarAutoSyncMessage) return this.calendarAutoSyncMessage;
          if (this.lastSyncTime) return `最後同步：${this.lastSyncTime}`;
          return '尚未同步行事曆';
        },
        headerSyncState() {
          if (!this.online) return 'offline';
          if (this.syncing) return 'syncing';
          if (this.headerSyncFeedback === 'success') return 'success';
          if (this.syncError) return 'error';
          return 'idle';
        },
        headerSyncLabel() {
          return {
            offline: '離線',
            syncing: '同步中',
            success: '已同步',
            error: '同步失敗',
            idle: '同步'
          }[this.headerSyncState] || '同步';
        },
        headerSyncTitle() {
          if (this.headerSyncState === 'offline') return '目前離線，恢復網路後即可同步行事曆';
          if (this.headerSyncState === 'error') {
            const detail = this.syncError?.message ? `：${this.syncError.message}` : '';
            return `${this.syncError?.title || '行事曆同步失敗'}${detail}`;
          }
          return this.calendarSyncCaption || '同步行事曆';
        },
        syncIssueItems() {
          const issues = Array.isArray(this.syncReport?.issues) ? [...this.syncReport.issues] : [];
          const diagnostics = this.syncReport?.diagnostics || {};
          const syncedAt = this.syncReport?.syncedAt || '';
          const addDiagnosticIssue = (key, type, message, severity = 'warning') => {
            const count = Number(diagnostics[key]) || 0;
            if (count <= 0) return;
            issues.push({
              id: `diagnostic-${key}-${syncedAt}`,
              type,
              severity,
              message: `${message}：${count} 筆`,
              count,
              at: syncedAt
            });
          };
          addDiagnosticIssue('missing_description', 'missing_description', '行事曆事件缺少描述，未轉成業績');
          addDiagnosticIssue('missing_order_id', 'missing_order_id', '行事曆描述缺少 Order ID，已用 Event ID 去重');
          addDiagnosticIssue('duplicates', 'duplicate_event', '同步期間偵測到重複事件並略過');
          if (this.backupStatus === 'error') {
            issues.push({
              id: `sync-backup-error-${this.lastBackupAt || this.lastCloudBackupAt || 'latest'}`,
              type: 'backup_error',
              code: 'backup_error',
              severity: 'error',
              message: '最近一次雲端備份失敗，請重新建立備份。',
              at: new Date().toISOString(),
              source: 'backup'
            });
          }
          (this.cloudBackupHealth.issues || []).forEach(issue => {
            issues.push({
              ...issue,
              id: `sync-${issue.id || issue.type}`,
              source: 'backup'
            });
          });
          return issues;
        },
        filteredSyncIssueItems() {
          const filter = this.syncIssueFilter || 'all';
          if (filter === 'all') return this.syncIssueItems;
          if (filter === 'pricing') return this.syncIssueItems.filter(issue => issue.type === 'unmatched_service_config');
          if (filter === 'money') return this.syncIssueItems.filter(issue => ['zero_amount', 'invalid_mixed_payment', 'invalid_payment'].includes(issue.type));
          if (filter === 'locked') return this.syncIssueItems.filter(issue => ['date_locked', 'cancelled_locked'].includes(issue.type));
          if (filter === 'backup') return this.syncIssueItems.filter(issue => this.isBackupIssueType(issue.type));
          return this.syncIssueItems.filter(issue => issue.type === filter);
        },
        syncIssueSummary() {
          const issues = this.syncIssueItems;
          const diagnostics = this.syncReport?.diagnostics || {};
          const countType = type => issues.filter(issue => issue.type === type).length;
          return {
            total: issues.length,
            errors: issues.filter(issue => issue.severity === 'error').length,
            warnings: issues.filter(issue => issue.severity !== 'error').length,
            pricing: countType('unmatched_service_config'),
            money: issues.filter(issue => ['zero_amount', 'invalid_mixed_payment', 'invalid_payment'].includes(issue.type)).length,
            locked: issues.filter(issue => ['date_locked', 'cancelled_locked'].includes(issue.type)).length,
            backup: issues.filter(issue => this.isBackupIssueType(issue.type)).length,
            missingEventId: countType('missing_event_id'),
            backendMissingDescription: Number(diagnostics.missing_description) || 0,
            backendMissingOrderId: Number(diagnostics.missing_order_id) || 0,
            backendDuplicates: Number(diagnostics.duplicates) || 0,
            backendCancelled: Number(diagnostics.cancelled) || 0
          };
        },
        priceMatchWorkbenchRows() {
          const configured = new Set((this.servicesConfig || [])
            .map(service => this.normalizeSyncServiceKey(service?.name))
            .filter(Boolean));
          const rows = new Map();
          const addRow = (serviceName, payload = {}) => {
            const name = String(serviceName || '').trim();
            const key = this.normalizeSyncServiceKey(name);
            if (!key || configured.has(key)) return;
            const existing = rows.get(key) || {
              key,
              serviceName: name,
              count: 0,
              latestDate: '',
              customers: new Set(),
              examples: [],
              unmatchedServices: new Set()
            };
            existing.count += Number(payload.count) || 1;
            if (payload.date && payload.date > existing.latestDate) existing.latestDate = payload.date;
            if (payload.customerName) existing.customers.add(payload.customerName);
            if (payload.unmatchedServices) {
              payload.unmatchedServices.forEach(item => existing.unmatchedServices.add(item));
            }
            if (payload.example && existing.examples.length < 3) existing.examples.push(payload.example);
            rows.set(key, existing);
          };

          (this.syncReport?.unmatchedServices || []).forEach(row => {
            addRow(row.serviceName || row.name, {
              count: row.count,
              date: row.latestDate,
              customerName: row.customerName,
              unmatchedServices: row.unmatchedServices || [],
              example: row.example
            });
          });
          this.syncIssueItems
            .filter(issue => issue.type === 'unmatched_service_config')
            .forEach(issue => addRow(issue.serviceName || issue.message, {
              date: issue.date,
              customerName: issue.customerName,
              unmatchedServices: issue.unmatchedServices || [],
              example: issue
            }));
          (this.orders || [])
            .filter(order => this.isOrderActive(order) && (order.pricingSource === 'unmatched_service_config' || (order.pricingUnmatchedServices || []).length))
            .forEach(order => addRow(order.serviceName, {
              date: order.date,
              customerName: order.customerName,
              unmatchedServices: order.pricingUnmatchedServices || [],
              example: order
            }));

          return Array.from(rows.values())
            .map(row => ({
              ...row,
              customers: Array.from(row.customers).slice(0, 4),
              unmatchedServices: Array.from(row.unmatchedServices).filter(Boolean)
            }))
            .sort((a, b) => b.count - a.count || String(b.latestDate).localeCompare(String(a.latestDate)));
        },
        duplicateCustomerGroups() {
          const orderCounts = {};
          (this.orders || []).forEach(order => {
            if (!order?.customerId || !this.isOrderActive(order) || this.isCorrectionSlip(order)) return;
            orderCounts[order.customerId] = (orderCounts[order.customerId] || 0) + 1;
          });
          return MomoCore.findPotentialDuplicateCustomerGroups(this.customers || [], orderCounts);
        },
        dataCorrectionItems() {
          const syncTypes = new Set([
            'zero_amount', 'invalid_mixed_payment', 'invalid_payment', 'unmatched_service_config',
            'ambiguous_customer_name', 'invalid_customer_id', 'unknown_customer_id', 'customer_id_name_mismatch',
            'missing_event_id', 'missing_order_id', 'duplicate_order_id', 'date_locked', 'cancelled_locked'
          ]);
          const syncIssues = (this.syncIssueItems || [])
            .filter(issue => syncTypes.has(issue.type))
            .map(issue => ({
              ...issue,
              code: issue.type,
              severity: issue.severity === 'error' ? 'error' : 'warning'
            }));
          return MomoCore.buildDataCorrectionQueue({
            operationalIssues: this.collectOperationalIssues(),
            integrityIssues: this.integrityReport?.issues || [],
            syncIssues,
            pricingRows: this.priceMatchWorkbenchRows.map(row => ({
              ...row,
              code: 'unmatched_service_config',
              affectedCount: row.count,
              message: `${row.serviceName} 尚未加入價目表，共影響 ${row.count} 筆紀錄`,
              payload: row
            })),
            duplicateCustomerGroups: this.duplicateCustomerGroups
          });
        },
        dataCorrectionSummary() {
          const rows = this.dataCorrectionItems;
          const categoryCount = category => rows.filter(row => row.category === category).length;
          return {
            total: rows.length,
            errorCount: rows.filter(row => row.severity === 'error').length,
            warningCount: rows.filter(row => row.severity !== 'error').length,
            affectedRecords: rows.reduce((sum, row) => sum + Math.max(1, Number(row.affectedCount) || 1), 0),
            money: categoryCount('money'),
            pricing: categoryCount('pricing'),
            customers: categoryCount('customers'),
            duplicates: categoryCount('duplicates'),
            integrity: categoryCount('integrity')
          };
        },
        dataCorrectionFilters() {
          const summary = this.dataCorrectionSummary;
          return [
            { key: 'all', label: '全部', count: summary.total },
            { key: 'money', label: '金額付款', count: summary.money },
            { key: 'pricing', label: '價目服務', count: summary.pricing },
            { key: 'customers', label: '顧客資料', count: summary.customers },
            { key: 'duplicates', label: '重複紀錄', count: summary.duplicates },
            { key: 'integrity', label: '其他完整性', count: summary.integrity }
          ].filter(item => item.key === 'all' || item.count > 0);
        },
        filteredDataCorrectionItems() {
          if (this.dataCorrectionFilter === 'all') return this.dataCorrectionItems;
          return this.dataCorrectionItems.filter(row => row.category === this.dataCorrectionFilter);
        },
        visibleDataCorrectionItems() {
          return this.filteredDataCorrectionItems.slice(0, this.dataCorrectionShowAll ? 50 : 8);
        },
        localDataCount() {
          return (this.orders?.length || 0)
            + (this.expenses?.length || 0)
            + (this.inventory?.length || 0)
            + (this.customers?.length || 0)
            + (this.prepaidLedger?.length || 0)
            + Object.keys(this.closeoutRecords || {}).length;
        },
        safetySummaryText() {
          if (this.safetyChecking) return '檢查中';
          if (!this.safetyReport) return '尚未自動檢查';
          if (this.safetyReport.status === 'ok') return '資料安全正常';
          return `${this.safetyReport.errorCount || 0} 錯誤、${this.safetyReport.warningCount || 0} 提醒`;
        },
        runtimeDiagnosticRows() {
          return (Array.isArray(this.runtimeDiagnostics) ? this.runtimeDiagnostics : [])
            .filter(row => row?.id && row?.at && row?.message)
            .slice(0, 50);
        },
        visibleRuntimeDiagnosticRows() {
          return this.runtimeDiagnosticRows.slice(0, this.runtimeDiagnosticsExpanded ? 20 : 6);
        },
        runtimeMonitorSummary() {
          const sample = this.runtimeHealthSample || {};
          const recentAnomaly = this.runtimeDiagnosticRows.find(row => {
            if (!['performance', 'memory', 'error'].includes(row.category)) return false;
            const at = Date.parse(row.at || '');
            return Number.isFinite(at) && Date.now() - at <= 30 * 60 * 1000;
          });
          if (sample.severity === 'error') {
            return { value: '記憶體危險', detail: `目前使用 ${sample.percent || 0}% · 已留下診斷紀錄`, tone: 'error' };
          }
          if (sample.severity === 'warning') {
            return { value: '記憶體偏高', detail: `目前使用 ${sample.percent || 0}% · 建議關閉其他分頁`, tone: 'warn' };
          }
          if (recentAnomaly) {
            return {
              value: recentAnomaly.category === 'performance' ? '偵測到卡頓' : recentAnomaly.category === 'memory' ? '記憶體提醒' : '程式錯誤',
              detail: `${this.formatDateTime(recentAnomaly.at)} · ${recentAnomaly.message}`,
              tone: recentAnomaly.tone === 'error' ? 'error' : 'warn'
            };
          }
          if (sample.supported) {
            return { value: '監控正常', detail: `記憶體 ${sample.percent || 0}% · 卡頓與錯誤持續監控中`, tone: 'ok' };
          }
          return { value: '監控中', detail: '此瀏覽器不提供記憶體數值；仍會偵測卡頓、崩潰與同步失敗', tone: 'ok' };
        },
        runtimeStatusSummary() {
          if (this.calendarSyncFallbackActive) {
            return {
              value: this.calendarSyncRetryAt ? '等待自動重試' : '使用本機資料',
              detail: this.calendarAutoSyncMessage || '遠端暫時無法回應，本機資料仍可使用',
              tone: 'warn'
            };
          }
          if (this.syncing) {
            return { value: '同步中', detail: this.calendarAutoSyncMessage || '正在更新行事曆資料', tone: 'info' };
          }
          if (this.syncError || this.pwaStatus === '檢查失敗' || this.pwaStatus === '註冊失敗') {
            const detail = this.syncError?.message || this.runtimeDiagnosticRows[0]?.message || '可在下方查看最近紀錄';
            return { value: '最近有異常', detail, tone: 'warn' };
          }
          if (['warning', 'error'].includes(this.runtimeDiagnosticRows[0]?.tone)) {
            return { value: '最近有提醒', detail: this.runtimeDiagnosticRows[0].message, tone: 'warn' };
          }
          return {
            value: '運作穩定',
            detail: this.runtimeDiagnosticRows[0]?.message || '啟動、更新與同步未發現異常',
            tone: 'ok'
          };
        },
        systemStatusTone() {
          if (this.cloudStatus === 'error' || this.cloudStatus === 'conflict' || this.cloudBackupHealth.status === 'error' || this.safetyReport?.status === 'error' || this.runtimeMonitorSummary.tone === 'error') return 'error';
          if (this.updateAvailable || this.cloudRestorePending || this.cloudMigrationNeeded || this.cloudSyncPending || this.backupReminder.due || this.cloudBackupHealth.status === 'warning' || this.safetyReport?.status === 'warning' || this.runtimeStatusSummary.tone === 'warn' || this.runtimeMonitorSummary.tone === 'warn') return 'warn';
          return 'ok';
        },
        systemStatusTitle() {
          if (this.systemStatusTone === 'error') return '需要處理';
          if (this.systemStatusTone === 'warn') return '有提醒';
          return '系統正常';
        },
        systemStatusDetail() {
          if (this.systemStatusTone === 'error') return '資料或雲端狀態有異常，請先處理紅色項目。';
          if (this.systemStatusTone === 'warn') return '目前可使用，但建議先完成提醒項目。';
          return '版本、資料、備份與雲端狀態都正常。';
        },
        systemStatusItems() {
          const cloudTone = this.cloudStatus === 'error' || this.cloudStatus === 'conflict'
            ? 'error'
            : this.cloudRestorePending || this.cloudMigrationNeeded || this.cloudSyncPending || this.cloudSyncInFlight
              ? 'warn'
              : this.cloudReady
                ? 'ok'
                : this.authConfig.configured
                  ? 'warn'
                  : 'neutral';
          const safetyTone = this.safetyReport?.status === 'error'
            ? 'error'
            : this.safetyReport?.status === 'warning'
              ? 'warn'
              : this.safetyReport?.status === 'ok'
                ? 'ok'
                : 'neutral';
          return [
            {
              key: 'version',
              label: '版本',
              value: this.updateAvailable ? '有新版' : this.pwaStatusText,
              detail: `${this.appVersion} · ${this.pwaLastCheckedText}`,
              tone: this.updateAvailable ? 'warn' : 'ok'
            },
            {
              key: 'cloud',
              label: '雲端',
              value: this.cloudStatus === 'syncing' ? '同步中' : this.cloudStatus === 'conflict' ? '衝突待處理' : this.cloudRestorePending ? '還原保護中' : this.cloudMigrationNeeded ? '待搬移' : this.cloudReady ? '已連接' : this.authConfig.configured ? '待確認' : '本機模式',
              detail: this.cloudMessage || (this.cloudReady ? '雲端資料可用' : '目前以本機資料為主'),
              tone: cloudTone
            },
            {
              key: 'runtime',
              label: '啟動與同步',
              value: this.runtimeStatusSummary.value,
              detail: this.runtimeStatusSummary.detail,
              tone: this.runtimeStatusSummary.tone
            },
            {
              key: 'monitor',
              label: '自動監控',
              value: this.runtimeMonitorSummary.value,
              detail: this.runtimeMonitorSummary.detail,
              tone: this.runtimeMonitorSummary.tone
            },
            {
              key: 'backup',
              label: '備份',
              value: this.cloudBackupHealth.status === 'ok' ? '今日完成' : this.backupReminder.due ? '需備份' : '需確認',
              detail: this.cloudReady ? this.cloudBackupHealth.detail : this.backupSummaryText,
              tone: this.cloudBackupHealth.status === 'error' ? 'error' : this.cloudBackupHealth.status === 'warning' ? 'warn' : this.backupReminder.tone
            },
            {
              key: 'safety',
              label: '安全檢查',
              value: this.safetySummaryText,
              detail: this.safetyReport?.checkedAt ? `最後檢查 ${this.formatDateTime(this.safetyReport.checkedAt)}` : `本機資料 ${this.localDataCount} 筆`,
              tone: safetyTone
            }
          ];
        },
        backupSnapshotRows() {
          return (Array.isArray(this.backupSnapshots) ? this.backupSnapshots : [])
            .filter(snapshot => snapshot?.id && snapshot?.createdAt)
            .map(snapshot => {
              const counts = snapshot.counts || {};
              const sizeBytes = Math.max(0, Number(snapshot.sizeBytes) || 0);
              return {
                ...snapshot,
                reasonLabel: this.backupReasonLabel(snapshot.reason),
                totalRecords: Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0),
                counts,
                sizeBytes,
                sizeText: sizeBytes ? this.formatBytes(sizeBytes) : '既有快照',
                tone: snapshot.integrityStatus === 'error' ? 'error' : snapshot.integrityStatus === 'warning' ? 'warn' : 'ok'
              };
            })
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        },
        visibleBackupSnapshotRows() {
          return this.backupSnapshotRows.slice(0, this.safetyShowAllLocalSnapshots ? 50 : 5);
        },
        backupSnapshotSummary() {
          const latest = this.backupSnapshotRows[0] || null;
          return {
            count: this.backupSnapshotRows.length,
            latest,
            title: latest ? `${this.backupSnapshotRows.length} 份本機快照` : '尚無本機快照',
            detail: latest ? `最近 ${this.formatDateTime(latest.createdAt)} · ${latest.reasonLabel}` : '建立快照後，可從此頁下載或還原。'
          };
        },
        cloudRestoreReadyToConfirm() {
          const expected = String(this.cloudRestoreDraft?.backup?.backupDate || '').trim();
          return Boolean(expected
            && String(this.cloudRestoreConfirmText || '').trim() === expected
            && this.cloudRestoreDraft?.preview?.riskTone !== 'error');
        },
        cloudBackupRows() {
          return (Array.isArray(this.cloudBackups) ? this.cloudBackups : [])
            .map(row => this.normalizeCloudBackupRow(row))
            .filter(row => row.backupDate || row.createdAt)
            .sort((a, b) => String(b.backupDate || b.createdAt).localeCompare(String(a.backupDate || a.createdAt))
              || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        },
        visibleCloudBackupRows() {
          return this.cloudBackupRows.slice(0, this.safetyShowAllCloudBackups ? 50 : 5);
        },
        cloudBackupSummary() {
          if (!this.authConfig.configured) {
            return { count: 0, latest: null, status: 'neutral', title: '未啟用雲端', detail: '目前只使用本機快照與 JSON 備份。' };
          }
          if (!this.authUser || !this.authSession?.access_token) {
            return { count: 0, latest: null, status: 'warn', title: '尚未登入', detail: '登入 Supabase 後可查看雲端備份清單。' };
          }
          if (!this.cloudReady) {
            return {
              count: 0,
              latest: null,
              status: this.cloudRestorePending || this.cloudMigrationNeeded ? 'warn' : 'neutral',
              title: this.cloudRestorePending ? '還原保護中' : this.cloudMigrationNeeded ? '待首次搬移' : '雲端待確認',
              detail: this.cloudMessage || '完成雲端初始化後可建立正式備份。'
            };
          }
          if (this.cloudBackupStatus === 'loading') {
            return { count: this.cloudBackupRows.length, latest: this.cloudBackupRows[0] || null, status: 'warn', title: '讀取中', detail: '正在載入 Supabase 備份清單。' };
          }
          if (this.cloudBackupStatus === 'restoring') {
            return { count: this.cloudBackupRows.length, latest: this.cloudBackupRows[0] || null, status: 'warn', title: '還原中', detail: '正在讀取雲端備份並套用到目前裝置。' };
          }
          if (this.cloudBackupStatus === 'error') {
            return { count: this.cloudBackupRows.length, latest: this.cloudBackupRows[0] || null, status: 'error', title: '雲端備份異常', detail: this.cloudBackupError || '備份清單讀取失敗。' };
          }
          const latest = this.cloudBackupRows[0] || null;
          return {
            count: this.cloudBackupRows.length,
            latest,
            status: latest ? 'ok' : 'warn',
            title: latest ? `${this.cloudBackupRows.length} 份雲端備份` : '尚無雲端備份',
            detail: latest
              ? `最近 ${latest.backupDate || this.formatDateTime(latest.createdAt)} · ${latest.totalRecords} 筆`
              : '建立雲端備份後，可從此頁下載或還原。'
          };
        },
        cloudBackupHealth() {
          const today = new Date().toLocaleDateString('sv-SE');
          const rows = this.cloudBackupRows;
          const latest = rows[0] || null;
          const issues = [];
          const addIssue = (severity, type, message, extra = {}) => {
            issues.push({
              id: `backup-${type}-${today}-${issues.length}`,
              type,
              code: type,
              severity,
              message,
              at: new Date().toISOString(),
              ...extra
            });
          };
          const totalFromCounts = counts => ['customers', 'orders', 'prepaidLedger', 'expenses', 'inventory']
            .reduce((sum, key) => sum + (Number(counts?.[key]) || 0), 0);
          const localCounts = {
            customers: this.customers?.length || 0,
            orders: this.orders?.length || 0,
            prepaidLedger: this.prepaidLedger?.length || 0,
            expenses: this.expenses?.length || 0,
            inventory: this.inventory?.length || 0
          };
          const localTotal = totalFromCounts(localCounts);

          if (!this.authConfig.configured) {
            return {
              status: 'neutral',
              title: '雲端未啟用',
              detail: '目前使用本機快照與 JSON 備份。',
              issues,
              latest,
              hasToday: false,
              localTotal
            };
          }
          if (!this.authUser || !this.authSession?.access_token) {
            return {
              status: 'warning',
              title: '雲端未登入',
              detail: '登入後才會自動建立每日雲端備份。',
              issues,
              latest,
              hasToday: false,
              localTotal
            };
          }
          if (!this.cloudReady) {
            return {
              status: this.cloudMigrationNeeded ? 'warning' : 'neutral',
              title: this.cloudMigrationNeeded ? '待首次搬移' : '雲端待確認',
              detail: this.cloudMessage || '完成雲端初始化後會自動檢查備份。',
              issues,
              latest,
              hasToday: false,
              localTotal
            };
          }

          if (this.cloudBackupStatus === 'error') {
            addIssue('error', 'cloud_backup_error', this.cloudBackupError || '雲端備份清單讀取失敗。');
          }
          if (!rows.length) {
            addIssue('warning', 'cloud_backup_empty', '雲端目前沒有可還原的正式備份。');
          }

          const hasToday = rows.some(row => row.backupDate === today);
          if (rows.length && !hasToday) {
            addIssue('warning', 'cloud_backup_missing_today', '今天尚未建立雲端正式備份。');
          }

          if (latest) {
            const latestTotal = Number(latest.totalRecords) || totalFromCounts(latest.counts);
            if (localTotal >= 20 && latestTotal > 0 && latestTotal < Math.floor(localTotal * 0.9)) {
              addIssue('warning', 'cloud_backup_less_than_local', `最新雲端備份 ${latestTotal} 筆，低於目前本機 ${localTotal} 筆，請確認是否為正常還原或刪除。`, {
                backupDate: latest.backupDate,
                totalRecords: latestTotal,
                localTotal
              });
            }

            const previous = rows.find(row => row.id !== latest.id || row.backupDate !== latest.backupDate);
            const previousTotal = previous ? (Number(previous.totalRecords) || totalFromCounts(previous.counts)) : 0;
            if (previousTotal >= 20 && latestTotal < Math.floor(previousTotal * 0.85)) {
              addIssue('warning', 'cloud_backup_volume_drop', `最新雲端備份比上一份少 ${previousTotal - latestTotal} 筆，請確認是否為正常操作。`, {
                backupDate: latest.backupDate,
                totalRecords: latestTotal,
                previousTotal
              });
            }

            ['customers', 'orders', 'prepaidLedger', 'expenses'].forEach(key => {
              const current = Number(latest.counts?.[key]) || 0;
              const prior = Number(previous?.counts?.[key]) || 0;
              if (prior >= 20 && current <= prior - 5 && current < Math.floor(prior * 0.85)) {
                const labels = { customers: '顧客', orders: '業績', prepaidLedger: '儲值帳本', expenses: '支出' };
                addIssue('warning', 'cloud_backup_count_drop', `最新雲端備份的${labels[key]}筆數從 ${prior} 降到 ${current}，請確認是否正常。`, {
                  backupDate: latest.backupDate,
                  countKey: key,
                  current,
                  prior
                });
              }
            });
          }

          const errorCount = issues.filter(issue => issue.severity === 'error').length;
          const warningCount = issues.filter(issue => issue.severity !== 'error').length;
          const status = errorCount ? 'error' : warningCount ? 'warning' : 'ok';
          const retentionText = this.cloudBackupRetentionMessage ? ` · ${this.cloudBackupRetentionMessage}` : '';
          return {
            status,
            title: status === 'ok' ? '今日已備份' : errorCount ? '備份異常' : '備份需確認',
            detail: latest
              ? `最近 ${latest.backupDate} · ${latest.totalRecords} 筆${retentionText}`
              : this.cloudBackupSummary.detail,
            issues,
            latest,
            hasToday,
            localTotal
          };
        },
        localStorageUsageBytes() {
          try { return new Blob(Object.values(localStorage)).size; }
          catch (error) { return 0; }
        },
        localStorageUsagePercent() {
          return Math.min(100, Math.round(this.localStorageUsageBytes / (5 * 1024 * 1024) * 100));
        },
        localStorageUsageText() {
          return this.formatBytes(this.localStorageUsageBytes);
        },
        healthIssueRows() {
          const rows = [];
          const seen = new Set();
          const add = (source, issue = {}) => {
            const message = String(issue.message || '').trim();
            if (!message) return;
            const severity = issue.severity === 'error' ? 'error' : 'warning';
            const key = message.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            rows.push({
              ...issue,
              source,
              severity,
              tone: severity === 'error' ? 'error' : 'warn',
              sourceLabel: source === 'integrity' ? '完整性' : source === 'safety' ? '安全' : source === 'sync' ? '同步' : '營運',
              actionLabel: issue.tab
                ? '前往處理'
                : issue.code === 'backup_due' || issue.code === 'backup_error' || issue.code === 'cloud_backup_empty'
                  ? '建立備份'
                  : issue.code === 'cloud_backup_error'
                    ? '刷新清單'
                    : issue.code === 'pwa_update_available'
                      ? '套用新版'
                      : '查看'
            });
          };

          (this.safetyReport?.issues || [])
            .filter(issue => !['integrity_warning', 'integrity_error'].includes(issue.code))
            .forEach(issue => add('safety', issue));
          (this.integrityReport?.issues || []).forEach(issue => add('integrity', issue));
          (this.pendingActionSummary?.anomalyItems || []).forEach(issue => add('operation', issue));
          (this.syncIssueItems || []).slice(0, 20).forEach(issue => {
            if (issue.severity === 'error' || ['unmatched_service_config', 'zero_amount', 'invalid_mixed_payment', 'date_locked'].includes(issue.type)) {
              add('sync', {
                severity: issue.severity === 'error' ? 'error' : 'warning',
                code: issue.type,
                message: issue.message,
                tab: issue.orderId ? 'orders' : '',
                orderId: issue.orderId,
                customerId: issue.customerId,
                serviceName: issue.serviceName
              });
            }
          });

          const order = { error: 0, warning: 1 };
          return rows.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
        },
        visibleHealthIssueRows() {
          return this.healthIssueRows.slice(0, this.safetyShowAllIssues ? 50 : 3);
        },
        systemHealthIssueRows() {
          const correctionMessages = new Set(this.dataCorrectionItems.map(issue => String(issue.message || '').trim()));
          return this.healthIssueRows.filter(issue => !correctionMessages.has(String(issue.message || '').trim()));
        },
        visibleSystemHealthIssueRows() {
          return this.systemHealthIssueRows.slice(0, this.safetyShowAllIssues ? 50 : 3);
        },
        systemHealthIssueSummary() {
          const errorCount = this.systemHealthIssueRows.filter(issue => issue.severity === 'error').length;
          const warningCount = this.systemHealthIssueRows.filter(issue => issue.severity !== 'error').length;
          return {
            total: this.systemHealthIssueRows.length,
            errorCount,
            warningCount,
            status: errorCount ? 'error' : warningCount ? 'warning' : 'ok'
          };
        },
        healthIssueSummary() {
          const errorCount = this.healthIssueRows.filter(issue => issue.severity === 'error').length;
          const warningCount = this.healthIssueRows.filter(issue => issue.severity !== 'error').length;
          return {
            total: this.healthIssueRows.length,
            errorCount,
            warningCount,
            status: errorCount ? 'error' : warningCount ? 'warning' : 'ok',
            title: errorCount ? `${errorCount} 個錯誤需要修正` : warningCount ? `${warningCount} 個提醒需要確認` : '資料健康正常',
            detail: errorCount || warningCount ? '先處理紅色錯誤，再看黃色提醒。' : '目前沒有阻擋營運的資料問題。'
          };
        },
        mobileMoreActive() {
          return this.showMobileMorePages || this.mobileMoreTabs.some(tab => tab.id === this.activeTab);
        },
        mobileMoreHasAttention() {
          return this.lowStockItems.length > 0 || this.healthIssueSummary.total > 0;
        },
        dataSafetyCards() {
          return [
            {
              key: 'health',
              label: '健康狀態',
              value: this.healthIssueSummary.status === 'ok' ? '正常' : `${this.healthIssueSummary.errorCount} 錯誤`,
              detail: this.healthIssueSummary.status === 'ok' ? this.healthIssueSummary.detail : `${this.healthIssueSummary.warningCount} 提醒 · ${this.integritySummaryText}`,
              tone: this.healthIssueSummary.status === 'error' ? 'error' : this.healthIssueSummary.status === 'warning' ? 'warn' : 'ok'
            },
            {
              key: 'snapshot',
              label: '本機快照',
              value: `${this.backupSnapshotSummary.count} 份`,
              detail: this.backupSnapshotSummary.detail,
              tone: this.backupSnapshotSummary.count ? 'ok' : 'warn'
            },
            {
              key: 'cloud_backup',
              label: '雲端備份',
              value: this.cloudBackupHealth.title,
              detail: this.cloudBackupHealth.detail,
              tone: this.cloudBackupHealth.status === 'error'
                ? 'error'
                : this.cloudBackupHealth.status === 'warning'
                  ? 'warn'
                  : this.cloudBackupHealth.status === 'ok'
                    ? 'ok'
                    : 'neutral'
            },
            {
              key: 'cloud',
              label: '雲端狀態',
              value: this.cloudReady ? '已連接' : this.cloudRestorePending ? '還原保護中' : this.cloudMigrationNeeded ? '待搬移' : this.authConfig.configured ? '待登入' : '本機',
              detail: this.cloudReady ? this.cloudBackupSummary.detail : (this.cloudMessage || '目前以本機資料為主'),
              tone: this.cloudStatus === 'error' || this.cloudStatus === 'conflict' || this.cloudBackupSummary.status === 'error'
                ? 'error'
                : this.cloudRestorePending || this.cloudMigrationNeeded || this.cloudSyncPending || this.cloudBackupSummary.status === 'warn'
                  ? 'warn'
                  : this.cloudReady
                    ? 'ok'
                    : 'neutral'
            },
            {
              key: 'storage',
              label: '本機容量',
              value: this.localStorageUsageText,
              detail: `約使用 ${this.localStorageUsagePercent}% · ${this.localDataCount} 筆業務資料`,
              tone: this.localStorageUsagePercent >= 80 ? 'error' : this.localStorageUsagePercent >= 60 ? 'warn' : 'ok'
            }
          ];
        },
        quickServiceOptions() {
          return this.servicesConfig
            .filter(service => service?.name)
            .slice(0, 8)
            .map(service => ({
              name: service.name,
              price: Number(service.price) || null
            }));
        },
        newOrderWarningsPreview() {
          const amount = Number(this.newOrder.amount) || 0;
          const serviceName = String(this.newOrder.serviceName || '').trim();
          if (!this.newOrder.date || !this.newOrder.customerName || !serviceName || amount <= 0) return [];
          const selected = this.customerMap[this.newOrder.customerId];
          const matches = selected ? [] : this.findCustomersByName(this.newOrder.customerName);
          if (!selected && !this.newOrder.createNewCustomer && matches.length > 1) {
            return [`・找到 ${matches.length} 位同名顧客，請先從清單選擇正確顧客`];
          }
          const customer = selected || (this.newOrder.createNewCustomer ? null : matches[0] || null);
          return this.collectNewOrderWarnings(customer, amount, Number(this.newOrder.cashAmount) || 0, serviceName);
        },
        yearOptions() {
          // 動態產生：當年前後各一年 + 資料中出現的年份
          const curYear = new Date().getFullYear();
          const years = new Set([
            String(curYear - 1),
            String(curYear),
            String(curYear + 1),
            this.selectedYear
          ]);
          this.orders.forEach(o => {
            const y = o.date.split('-')[0];
            if (y) years.add(y);
          });
          return Array.from(years).sort();
        },
        monthOptions() {
          return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        },

        rawCustomerMap() {
          return Object.fromEntries(this.customers.map(customer => [customer.id, customer]));
        },
        customerMap() {
          const map = { ...this.rawCustomerMap };
          this.customers.forEach(customer => {
            const terminalId = customer?.mergedIntoCustomerId ? this.resolveMergedCustomerId(customer.id) : null;
            const target = terminalId ? this.rawCustomerMap[terminalId] : null;
            if (target) map[customer.id] = target;
          });
          return map;
        },
        activeCustomers() {
          return this.customers.filter(customer => !customer?.archivedAt && !customer?.mergedIntoCustomerId);
        },
        customerOptions() {
          return [...this.activeCustomers].sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
        },
        prepaidTotalsByCustomer() {
          const totals = {};
          this.prepaidLedger.forEach(entry => {
            if (!entry.customerId) return;
            const customerId = this.resolveMergedCustomerId(entry.customerId);
            if (!totals[customerId]) totals[customerId] = { balance: 0, topupNet: 0, debitNet: 0 };
            const signedAmount = Number(entry.signedAmount) || 0;
            totals[customerId].balance += signedAmount;
            if (entry.bucket === 'topup') totals[customerId].topupNet += signedAmount;
            if (entry.bucket === 'debit') totals[customerId].debitNet += signedAmount;
          });
          Object.values(totals).forEach(total => {
            total.prepaidIn = Math.max(0, total.topupNet);
            total.prepaidOut = Math.max(0, -total.debitNet);
          });
          return totals;
        },

        // 會計唯一訂單：Calendar 以 Order ID 去重；若舊資料已有重複，
        // 僅採最後同步的一筆，其他列保留供完整性檢查與稽核。
        accountingOrders() {
          const normalOrders = [];
          const calendarByOrderId = new Map();
          const today = new Date().toLocaleDateString('sv-SE');
          (this.orders || []).forEach(order => {
            if (!order || !this.isOrderActive(order)) return;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(order.date || '')) || String(order.date) > today) return;
            const externalId = order.source === 'google_calendar' && order.orderId
              ? String(order.orderId).trim().toLocaleLowerCase('zh-TW')
              : '';
            if (!externalId) {
              normalOrders.push(order);
              return;
            }
            const current = calendarByOrderId.get(externalId);
            const currentStamp = String(current?.lastSyncedAt || current?.updatedAt || current?.createdAt || '');
            const candidateStamp = String(order.lastSyncedAt || order.updatedAt || order.createdAt || '');
            if (!current || candidateStamp > currentStamp || (candidateStamp === currentStamp && String(order.id) < String(current.id))) {
              calendarByOrderId.set(externalId, order);
            }
          });
          return [...normalOrders, ...calendarByOrderId.values()];
        },

        // 當期全部有效業績（不受搜尋與明細篩選影響）
        periodOrders() {
          return this.accountingOrders.filter(o => {
            if (this.ordersCustomerHistoryId) {
              return this.isOrderActive(o)
                && this.resolveMergedCustomerId(o.customerId) === this.resolveMergedCustomerId(this.ordersCustomerHistoryId)
                && o.customerName && o.customerName.trim()
                && !this.isBlockedSlot(o.customerName);
            }
            const [y, m] = o.date.split('-');
            const yearMatch  = y === this.selectedYear;
            const monthMatch = this.selectedMonth === 'All' || m === this.selectedMonth;
            const validName  = this.isOrderActive(o) && o.customerName && o.customerName.trim() && !this.isBlockedSlot(o.customerName);
            return yearMatch && monthMatch && validName;
          }).sort((a, b) => b.date.localeCompare(a.date));
        },
        // 搜尋與篩選後的明細
        filteredOrders() {
          return this.periodOrders.filter(o => {
            const query = String(this.ordersSearchQuery || '').toLowerCase();
            const nameMatch  = !query || `${o.customerName || ''} ${o.serviceName || ''}`.toLowerCase().includes(query);
            const cat = o.category || this.classifyCategory(o.serviceName);
            const catMatch   = this.ordersFilterCategory === 'All' || cat === this.ordersFilterCategory;
            const payMatch   = this.ordersFilterPayment  === 'All' || o.paymentMethod === this.ordersFilterPayment;
            return nameMatch && catMatch && payMatch;
          });
        },
        ordersFilterActive() {
          return Boolean(this.ordersSearchQuery || this.ordersFilterCategory !== 'All' || this.ordersFilterPayment !== 'All');
        },
        filteredOrdersTotal() {
          return this.filteredOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
        },

        // Grouped Orders by Date
        groupedOrders() {
          const groups = {};
          this.filteredOrders.forEach(o => {
            if (!groups[o.date]) {
              groups[o.date] = {
                date: o.date,
                weekday: this.getWeekday(o.date),
                weekKey: this.getWeekStart(o.date),  // E: 所屬週起始日
                orders: [],
                dayTotal: 0
              };
            }
            groups[o.date].orders.push(o);
            groups[o.date].dayTotal += (Number(o.amount) || 0);
          });
          return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
        },
        // 當期全部支出（不受支出頁搜尋與分類篩選影響）
        periodExpenses() {
          return this.expenses.filter(e => {
            const [y, m] = e.date.split('-');
            const yearMatch = y === this.selectedYear;
            const monthMatch = this.selectedMonth === 'All' || m === this.selectedMonth;
            return yearMatch && monthMatch;
          }).sort((a, b) => b.date.localeCompare(a.date));
        },
        filteredExpenses() {
          const query = this.expenseSearchQuery.trim().toLowerCase();
          return this.periodExpenses.filter(expense => {
            const categoryMatch = this.expenseFilterCategory === 'All' || expense.category === this.expenseFilterCategory;
            const searchMatch = !query
              || String(expense.notes || '').toLowerCase().includes(query)
              || String(expense.category || '').toLowerCase().includes(query);
            return categoryMatch && searchMatch;
          });
        },
        expenseFilterActive() {
          return Boolean(this.expenseSearchQuery || this.expenseFilterCategory !== 'All');
        },
        filteredExpensesTotal() {
          return this.filteredExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
        },
        expenseTemplateCards() {
          const validExpenses = [...(this.expenses || [])]
            .filter(expense => expense?.date && Number(expense.amount) > 0)
            .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
          return this.expenseQuickPresets.map((preset) => {
            const lastExpense = validExpenses.find(expense => {
              if (expense.category !== preset.category) return false;
              const note = String(expense.notes || '');
              const keyword = String(preset.notes || preset.label || '').trim();
              return !keyword || note.includes(keyword) || note.includes(String(preset.label || '').trim());
            }) || null;
            const presetAmount = Number(preset.amount) > 0 ? Number(preset.amount) : null;
            const lastAmount = lastExpense ? Number(lastExpense.amount) || null : null;
            const suggestedAmount = presetAmount || (preset.reuseLastAmount ? lastAmount : null);
            return {
              ...preset,
              lastAmount,
              lastDate: lastExpense?.date || '',
              suggestedAmount
            };
          });
        },
        groupedExpenses() {
          const groups = {};
          this.filteredExpenses.forEach(expense => {
            if (!groups[expense.date]) {
              groups[expense.date] = {
                date: expense.date,
                weekday: this.getWeekday(expense.date),
                expenses: [],
                dayTotal: 0
              };
            }
            groups[expense.date].expenses.push(expense);
            groups[expense.date].dayTotal += Number(expense.amount) || 0;
          });
          return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
        },
        expensesSummary() {
          const total = this.periodExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
          const categoryTotals = {};
          this.periodExpenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + (Number(expense.amount) || 0);
          });
          const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
          return { total, count: this.periodExpenses.length, topCategory: topCategory[0], topCategoryAmount: topCategory[1] };
        },
        expenseHealthSummary() {
          const revenue = Number(this.kpis?.revenue) || 0;
          const total = this.expensesSummary.total;
          const count = this.expensesSummary.count;
          const ratio = revenue > 0 ? Math.round(total / revenue * 100) : 0;
          const fixedCategories = ['房租', '水電費', '薪資'];
          const fixed = this.periodExpenses
            .filter(expense => fixedCategories.includes(expense.category))
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
          const material = this.periodExpenses
            .filter(expense => expense.category === '材料費')
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
          const avg = count ? Math.round(total / count) : 0;
          const tone = count === 0 ? 'empty' : ratio > 55 && revenue > 0 ? 'warn' : 'ok';
          return {
            revenue,
            total,
            count,
            ratio,
            fixed,
            material,
            avg,
            anomalies: [],
            tone,
            message: count === 0
              ? '本期尚無支出紀錄'
              : revenue > 0
              ? `支出占營業額 ${ratio}%${tone === 'warn' ? '，可留意本月支出' : ''}`
              : '尚無營業額可比較'
          };
        },
        expenseAnomalies() {
          const today = new Date().toLocaleDateString('sv-SE');
          const total = this.expensesSummary.total;
          return this.periodExpenses.flatMap(expense => {
            const issues = this.expenseWarnings(expense, total);
            return issues.map(issue => ({
              ...issue,
              expenseId: expense.id,
              date: expense.date,
              category: expense.category,
              amount: Number(expense.amount) || 0,
              notes: expense.notes || ''
            }));
          }).filter(issue => issue.date <= today).slice(0, 12);
        },

        // Today's Stats
        todayRevenue() {
          const todayStr = new Date().toLocaleDateString('sv-SE');
          return this.accountingOrders
            .filter(o => this.isOrderActive(o) && o.date === todayStr && o.customerName && !this.isBlockedSlot(o.customerName) && o.paymentMethod !== '儲值進帳')
            .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        },
        todayOrdersCount() {
          const todayStr = new Date().toLocaleDateString('sv-SE');
          return this.accountingOrders.filter(o => !this.isCorrectionSlip(o) && o.date === todayStr && o.customerName && !this.isBlockedSlot(o.customerName) && o.paymentMethod !== '儲值進帳').length;
        },
        todayDateLabel() {
          const d = new Date();
          return `${d.getMonth() + 1}/${d.getDate()} ${this.getWeekday(d.toLocaleDateString('sv-SE'))}`;
        },
        todayOrders() {
          const todayStr = new Date().toLocaleDateString('sv-SE');
          return this.accountingOrders
            .filter(o => this.isOrderActive(o) && o.date === todayStr && o.customerName && !this.isBlockedSlot(o.customerName))
            .sort((a, b) => String(a.id).localeCompare(String(b.id)));
        },
        nextTodayOrder() {
          return this.todayOrders.find(o => !this.isCorrectionSlip(o) && o.paymentMethod !== '儲值進帳') || this.todayOrders[0] || null;
        },
        todayExpenses() {
          const todayStr = new Date().toLocaleDateString('sv-SE');
          return this.expenses
            .filter(e => e.date === todayStr)
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        },
        selectedCloseoutDateLabel() {
          const date = this.closeoutDate || new Date().toLocaleDateString('sv-SE');
          const [, month, day] = String(date).split('-');
          return month && day ? `${Number(month)}/${Number(day)} ${this.getWeekday(date)}` : date;
        },
        selectedCloseoutOrders() {
          const date = this.closeoutDate || new Date().toLocaleDateString('sv-SE');
          return this.accountingOrders
            .filter(o => this.isOrderActive(o) && o.date === date && o.customerName && !this.isBlockedSlot(o.customerName))
            .sort((a, b) => String(a.id).localeCompare(String(b.id)));
        },
        selectedCloseoutExpenses() {
          const date = this.closeoutDate || new Date().toLocaleDateString('sv-SE');
          return this.expenses
            .filter(e => e.date === date)
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        },
        selectedCloseout() {
          return this.calculateCloseoutForDate(
            this.closeoutDate || new Date().toLocaleDateString('sv-SE'),
            this.closeoutOpeningCash
          );
        },
        todayCloseout() {
          return this.calculateCloseoutForDate(new Date().toLocaleDateString('sv-SE'));
        },
        todayCloseoutDifference() {
          if (this.closeoutCashCount === null || this.closeoutCashCount === '') return null;
          return Number(this.closeoutCashCount) - this.selectedCloseout.expectedCash;
        },
        todayCloseoutRecord() {
          return this.closeoutRecords[new Date().toLocaleDateString('sv-SE')] || null;
        },
        selectedCloseoutRecord() {
          return this.closeoutRecords[this.closeoutDate || new Date().toLocaleDateString('sv-SE')] || null;
        },
        unclosedCloseoutDates() {
          const today = new Date().toLocaleDateString('sv-SE');
          const startDate = this.pendingActionStartDate || '2026-07-01';
          const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
          const dates = new Set();

          this.accountingOrders.forEach(order => {
            if (!order || !validDate(order.date) || order.date < startDate || order.date > today) return;
            if (!this.isOrderActive(order) || this.isBlockedSlot(order.customerName)) return;
            dates.add(order.date);
          });

          (this.expenses || []).forEach(expense => {
            if (!expense || !validDate(expense.date) || expense.date < startDate || expense.date > today) return;
            dates.add(expense.date);
          });

          return [...dates]
            .filter(date => !this.closeoutRecords?.[date])
            .sort((a, b) => b.localeCompare(a))
            .map(date => {
              const totals = this.calculateCloseoutForDate(date);
              const [, month, day] = date.split('-');
              return {
                date,
                label: `${Number(month)}/${Number(day)} ${this.getWeekday(date)}`,
                ...totals
              };
            });
        },
        operationalAnomalySummary() {
          const all = this.collectOperationalIssues();
          const items = all.slice(0, 6);
          const total = all.length;
          const blockers = all.filter(item => item.severity === 'error').length;
          return { items, total, blockers };
        },
        pendingActionSummary() {
          const unclosedItems = this.unclosedCloseoutDates.map(item => ({
            severity: 'warning',
            code: `closeout_missing_${item.date}`,
            message: `${item.date} 尚未打烊，應有現金 NT$ ${this.formatNumber(item.expectedCash)}`,
            tab: 'closeout',
            date: item.date
          }));
          const anomalyItems = this.collectOperationalIssues();
          const items = [...unclosedItems, ...anomalyItems].slice(0, 8);
          const total = unclosedItems.length + anomalyItems.length;
          const blockers = [...unclosedItems, ...anomalyItems].filter(item => item.severity === 'error').length;
          return {
            items,
            total,
            blockers,
            unclosedCount: unclosedItems.length,
            anomalyCount: anomalyItems.length,
            anomalyItems: anomalyItems.slice(0, 8)
          };
        },
        homeAttentionRows() {
          const rows = [];
          const seen = new Set();
          const add = (item = {}) => {
            const title = String(item.title || item.message || '').trim();
            const message = String(item.message || title || '').trim();
            if (!title && !message) return;
            const key = item.key || item.code || `${title}:${message}`;
            if (seen.has(key)) return;
            seen.add(key);
            rows.push({
              ...item,
              severity: item.severity === 'error' ? 'error' : 'warning',
              priority: Number(item.priority) || 0,
              key,
              title,
              message,
              action: item.action || 'anomaly',
              actionLabel: item.actionLabel || '處理'
            });
          };

          this.unclosedCloseoutDates.forEach(item => {
            add({
              key: `closeout:${item.date}`,
              severity: 'warning',
              priority: 70,
              title: `${item.label} 尚未打烊`,
              message: `${item.ordersCount || 0} 筆業績 · 應有現金 NT$ ${this.formatNumber(item.expectedCash)} · 支出 NT$ ${this.formatNumber(item.expenses)}`,
              action: 'closeout',
              actionLabel: '打烊',
              date: item.date
            });
          });

          if (this.syncError) {
            add({
              key: `sync-error:${this.syncError.at || this.syncError.title}`,
              severity: 'error',
              priority: 95,
              title: this.syncError.title || '同步失敗',
              message: this.syncError.message || 'Google Calendar 同步失敗，本機資料未受影響。',
              action: 'retry_sync',
              actionLabel: '重試'
            });
          }

          if (this.cloudStatus === 'error' || this.cloudStatus === 'conflict') {
            add({
              key: `cloud-status:${this.cloudStatus}`,
              severity: this.cloudStatus === 'error' ? 'error' : 'warning',
              priority: 90,
              title: this.cloudStatus === 'error' ? '雲端同步失敗' : '雲端資料衝突',
              message: this.cloudMessage || '請到資料安全中心確認雲端狀態。',
              action: 'safety',
              actionLabel: '安全頁'
            });
          }

          if (this.backupStatus === 'error') {
            add({
              key: 'backup-status:error',
              severity: 'error',
              priority: 88,
              title: '雲端備份失敗',
              message: '最近一次雲端備份沒有完成，建議重新建立正式備份。',
              action: 'backup',
              actionLabel: '備份'
            });
          }

          if (['error', 'warning'].includes(this.cloudBackupHealth.status)) {
            add({
              key: `cloud-backup-health:${this.cloudBackupHealth.status}`,
              severity: this.cloudBackupHealth.status === 'error' ? 'error' : 'warning',
              priority: this.cloudBackupHealth.status === 'error' ? 84 : 64,
              title: this.cloudBackupHealth.title,
              message: this.cloudBackupHealth.detail,
              action: 'backup',
              actionLabel: '備份'
            });
          }

          if (this.syncIssueSummary.money) {
            add({
              key: 'sync-money',
              severity: this.syncIssueSummary.errors ? 'error' : 'warning',
              priority: 82,
              title: '金額與付款需確認',
              message: `${this.syncIssueSummary.money} 筆同步資料有金額 0、付款格式或混合付款問題。`,
              action: 'sync',
              actionLabel: '查看',
              filter: 'money'
            });
          }

          if (this.syncIssueSummary.locked) {
            add({
              key: 'sync-locked',
              severity: 'warning',
              priority: 78,
              title: '鎖帳後同步變動',
              message: `${this.syncIssueSummary.locked} 筆行事曆變動碰到已鎖帳月份，需用更正單或沖銷處理。`,
              action: 'sync',
              actionLabel: '查看',
              filter: 'locked'
            });
          }

          if (this.priceMatchWorkbenchRows.length) {
            add({
              key: 'price-match-workbench',
              severity: 'warning',
              priority: 76,
              title: '價目表未匹配',
              message: `${this.priceMatchWorkbenchRows.length} 個行事曆服務名稱尚未加入價目表，會影響同步計價與時間產值。`,
              action: 'pricing',
              actionLabel: '處理',
              filter: 'pricing'
            });
          }

          if (this.syncIssueSummary.backup) {
            add({
              key: 'sync-backup',
              severity: this.cloudBackupHealth.status === 'error' ? 'error' : 'warning',
              priority: 74,
              title: '備份狀態需確認',
              message: `${this.syncIssueSummary.backup} 筆備份健康提醒，請到安全頁確認正式備份。`,
              action: 'backup',
              actionLabel: '備份'
            });
          }

          this.pendingActionSummary.anomalyItems.forEach(item => {
            add({
              ...item,
              key: `operation:${item.code || item.message}`,
              title: item.severity === 'error' ? '帳務資料需修正' : '帳務資料需確認',
              message: item.message,
              priority: item.severity === 'error' ? 72 : 52,
              action: 'anomaly',
              actionLabel: '前往',
              issue: item
            });
          });

          const order = { error: 0, warning: 1 };
          return rows.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9) || b.priority - a.priority);
        },
        homeAttentionSummary() {
          const total = this.homeAttentionRows.length;
          const errors = this.homeAttentionRows.filter(item => item.severity === 'error').length;
          const warnings = total - errors;
          return {
            total,
            errors,
            warnings,
            remaining: Math.max(0, total - 4),
            title: errors ? `${errors} 個錯誤` : `${warnings} 個提醒`
          };
        },

        // KPI Calculations（排除儲值進帳，避免業績虛高）
        kpis() {
          // 更正單影響營收分子，但不增加服務人次分母；與正式月結口徑一致。
          return MomoCore.calculatePeriodKpis(this.periodOrders, this.periodExpenses);
        },

        // Reconciliation
        paymentReconciliation() {
          const dict = { '現金': 0, '轉帳': 0, '儲值扣款': 0, '儲值進帳': 0 };
          dict['其他'] = 0; // 舊版付款方式（LinePay、轉帳）歸類於此
          this.periodOrders.forEach(o => {
            if (o.paymentMethod === '現金＋儲值扣款') {
              dict['現金'] += this.getMixedCashAmount(o);
              dict['儲值扣款'] += this.getMixedPrepaidAmount(o);
            } else {
              const method = dict[o.paymentMethod] !== undefined ? o.paymentMethod : '其他';
              dict[method] += (Number(o.amount) || 0);
            }
          });
          // 金額為 0 的「其他」不顯示
          if (!dict['其他']) delete dict['其他'];
          return dict;
        },

        // Sales Trend Computations（排除儲值進帳，與 KPI 一致）
        salesTrendData() {
          if (this.selectedMonth === 'All') {
            // Annual trend by month
            return Array.from({ length: 12 }, (_, i) => {
              const mStr = String(i + 1).padStart(2, '0');
              const total = this.accountingOrders
                .filter(o => {
                  const [y, m] = o.date.split('-');
                  const notBlocked = o.customerName && !this.isBlockedSlot(o.customerName);
                  return this.isOrderActive(o) && y === this.selectedYear && m === mStr && notBlocked && o.paymentMethod !== '儲值進帳';
                })
                .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
              return { label: `${i + 1}月`, total, key: i + 1 };
            });
          } else {
            // Monthly trend by day
            const year = parseInt(this.selectedYear);
            const month = parseInt(this.selectedMonth);
            const daysInMonth = new Date(year, month, 0).getDate();

            return Array.from({ length: daysInMonth }, (_, i) => {
              const dayStr = `${this.selectedYear}-${this.selectedMonth}-${String(i + 1).padStart(2, '0')}`;
              const total = this.accountingOrders
                .filter(o => this.isOrderActive(o) && o.date === dayStr && o.customerName && !this.isBlockedSlot(o.customerName) && o.paymentMethod !== '儲值進帳')
                .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
              return { label: `${i + 1}日`, total, key: i + 1 };
            });
          }
        },
        trendChartPath() {
          const data = this.salesTrendData;
          if (data.length === 0) return { path: '', fillPath: '', points: [] };

          const maxVal = Math.max(...data.map(d => d.total), 1000);
          const width = 600;
          const height = 120;
          const padding = 15;

          // 只有 1 筆資料時，畫在中央，避免除以零
          const points = data.map((d, i) => {
            const x = data.length === 1
              ? width / 2
              : padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - (d.total / maxVal) * (height - padding * 2);
            return { x, y, label: d.label, total: d.total, key: d.key };
          });

          // Generate smooth curve path
          let path = `M ${points[0].x} ${points[0].y}`;
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i+1];
            const cpX1 = p0.x + (p1.x - p0.x) / 3;
            const cpY1 = p0.y;
            const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
            const cpY2 = p1.y;
            path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
          }

          const firstPoint = points[0];
          const lastPoint = points[points.length - 1];
          const fillPath = `${path} L ${lastPoint.x} ${height - padding} L ${firstPoint.x} ${height - padding} Z`;

          return { path, fillPath, points, maxVal };
        },

        // 業績明細頂部摘要
        ordersSummary() {
          const serviceOrders = this.periodOrders.filter(o => o.paymentMethod !== '儲值進帳');
          const total = serviceOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
          const countableOrders = serviceOrders.filter(o => !this.isCorrectionSlip(o));
          const count = countableOrders.length;
          const avgBase = countableOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
          const avg = count > 0 ? Math.round(avgBase / count) : 0;
          // 最高單日
          const dayMap = {};
          countableOrders.forEach(o => {
            dayMap[o.date] = (dayMap[o.date] || 0) + (Number(o.amount) || 0);
          });
          const best = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
          return {
            total, count, avg,
            bestDayTotal: best ? best[1] : 0,
            bestDayDate:  best ? best[0].slice(5).replace('-', '/') : '-'
          };
        },
        // 最高單日業績（供熱力圖計算）
        maxDayTotal() {
          if (!this.groupedOrders.length) return 1;
          return Math.max(...this.groupedOrders.map(g => g.dayTotal), 1);
        },

        // 服務類別收入佔比
        categoryBreakdown() {
          const cats = { '剪髮': 0, '燙髮': 0, '染髮': 0, '洗護其他': 0, '更正': 0 };
          this.periodOrders
            .filter(o => o.paymentMethod !== '儲值進帳')
            .forEach(o => {
              const cat = this.isCorrectionSlip(o) ? '更正' : (o.category || this.classifyCategory(o.serviceName));
              if (cats[cat] !== undefined) cats[cat] += Number(o.amount) || 0;
              else cats['洗護其他'] += Number(o.amount) || 0;
            });
          return cats;
        },
        donutChartData() {
          const cats = this.categoryBreakdown;
          const total = Object.values(cats).reduce((s, v) => s + v, 0);
          const r = 55;
          const circumference = 2 * Math.PI * r;

          const meta = {
            '剪髮':    { color: '#FF2D55' },
            '燙髮':    { color: '#32ADE6' },
            '染髮':    { color: '#AF52DE' },
            '洗護其他': { color: '#34C759' },
            '更正': { color: '#FF9F0A' }
          };

          let cumulative = 0;
          const allSegments = Object.entries(cats).map(([cat, amount]) => {
            const ratio = total > 0 ? amount / total : 0;
            const percentage = Math.round(ratio * 100);
            return { cat, amount, ratio, percentage, ...meta[cat] };
          });

          const segments = allSegments
            .filter(s => s.amount > 0)
            .map(s => {
              const length = s.ratio * circumference;
              const offset = circumference - cumulative;
              cumulative += length;
              return { ...s, length, offset };
            });

          return { segments, allSegments, total, circumference };
        },

        // Expenses Total
        totalExpenses() {
          return this.periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        },

        // Top 4 Customers in Filtered Period（排除儲值進帳）
        topCustomers() {
          const map = {};
          this.periodOrders.forEach(o => {
            if (o.paymentMethod === '儲值進帳') return;
            const customerId = o.customerId ? this.resolveMergedCustomerId(o.customerId) : o.customerName;
            const name = this.customerMap[customerId]?.name || o.customerName;
            if (!map[customerId]) {
              map[customerId] = { id: o.customerId ? customerId : null, name, gender: o.gender, totalSpent: 0, count: 0 };
            }
            map[customerId].totalSpent += (Number(o.amount) || 0);
            if (!this.isCorrectionSlip(o)) map[customerId].count += 1;
          });

          return Object.values(map)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 4);
        },

        // Hour yield analysis based on the selected period, not the orders-page search/filter state.
        serviceYieldRows() {
          return this.buildServiceYieldRows(this.periodOrders.filter(o => o.paymentMethod !== '儲值進帳' && !this.isCorrectionSlip(o)));
        },
        // Top 5 for overview.
        serviceYieldAnalysis() {
          return this.serviceYieldRows.slice(0, 5);
        },
        yieldSummary() {
          const serviceOrders = this.periodOrders.filter(o => o.paymentMethod !== '儲值進帳' && !this.isCorrectionSlip(o));
          return this.buildYieldSummary(this.serviceYieldRows, serviceOrders);
        },
        reportYieldSortOptions() {
          return [
            { value: 'yield_desc', label: '產值高到低' },
            { value: 'amount_desc', label: '總營收高到低' },
            { value: 'count_desc', label: '筆數高到低' },
            { value: 'duration_desc', label: '平均工時長' },
            { value: 'coverage_desc', label: '工時覆蓋高到低' }
          ];
        },
        reportYieldMinCountOptions() {
          return [
            { value: 1, label: '全部服務' },
            { value: 2, label: '至少 2 筆' },
            { value: 3, label: '至少 3 筆' },
            { value: 5, label: '至少 5 筆' }
          ];
        },
        reportAnnualServiceOrders() {
          return this.accountingOrders.filter(order => {
            if (!order?.date || !String(order.date).startsWith(`${this.selectedYear}-`)) return false;
            return this.isOrderActive(order)
              && !this.isCorrectionSlip(order)
              && order.customerName
              && !this.isBlockedSlot(order.customerName)
              && order.paymentMethod !== '儲值進帳';
          });
        },
        reportAnnualServiceYieldRows() {
          return this.buildServiceYieldRows(this.reportAnnualServiceOrders);
        },
        reportAnnualYieldSummary() {
          return this.buildYieldSummary(this.reportAnnualServiceYieldRows, this.reportAnnualServiceOrders);
        },
        reportServiceYieldRows() {
          const minCount = Math.max(1, Number(this.reportYieldMinCount) || 1);
          const rows = this.reportAnnualServiceYieldRows
            .filter(item => (Number(item.count) || 0) >= minCount)
            .map(item => ({ ...item }));
          const sorters = {
            yield_desc: (a, b) => b.yieldPerHour - a.yieldPerHour || b.totalAmount - a.totalAmount,
            amount_desc: (a, b) => b.totalAmount - a.totalAmount || b.yieldPerHour - a.yieldPerHour,
            count_desc: (a, b) => b.count - a.count || b.totalAmount - a.totalAmount,
            duration_desc: (a, b) => b.averageMinutes - a.averageMinutes || b.totalAmount - a.totalAmount,
            coverage_desc: (a, b) => b.actualCoverage - a.actualCoverage || b.count - a.count
          };
          return rows.sort(sorters[this.reportYieldSort] || sorters.yield_desc);
        },
        crmFilters() {
          return [
            { value: 'all', label: '全部顧客' },
            { value: 'stable', label: '穩定回流' },
            { value: 'upcoming', label: '快到週期' },
            { value: 'overdue', label: '超過週期' },
            { value: 'inactive', label: '90天未回' },
            { value: 'dormant', label: '180天沉睡' },
            { value: 'prepaidDormant', label: '儲值久未來' },
            { value: 'observationHigh', label: '優先觀察' },
            { value: 'observationAttention', label: '需要留意' },
            { value: 'spendDown', label: '客單下降' },
            { value: 'paceSlower', label: '到店變慢' },
            { value: 'vip', label: '高價值/VIP' },
            { value: 'prepaid', label: '有儲值餘額' },
            { value: 'needsTopup', label: '餘額偏低' },
            { value: 'noFormula', label: '未建配方' }
          ];
        },
        crmPrimaryFilters() {
          const shortLabels = {
            all: '全部',
            stable: '穩定',
            upcoming: '快到',
            overdue: '超期'
          };
          return this.crmFilters
            .filter(filter => Object.prototype.hasOwnProperty.call(shortLabels, filter.value))
            .map(filter => ({ ...filter, shortLabel: shortLabels[filter.value] }));
        },
        crmSecondaryFilters() {
          const primaryValues = new Set(this.crmPrimaryFilters.map(filter => filter.value));
          return this.crmFilters.filter(filter => !primaryValues.has(filter.value));
        },
        crmSecondaryFilterActive() {
          return this.crmSecondaryFilters.some(filter => filter.value === this.crmFilterMode);
        },
        crmSecondaryFilterLabel() {
          return this.crmSecondaryFilters.find(filter => filter.value === this.crmFilterMode)?.label || '';
        },

        crmStats() {
          const list = this.crmList;
          return {
            totalCustomers: list.length,
            totalVisits: list.reduce((sum, c) => sum + c.count, 0),
            totalSpent: list.reduce((sum, c) => sum + c.totalSpent, 0),
            prepaidLiability: list.reduce((sum, c) => sum + Math.max(0, c.prepaidBalance), 0),
            inactiveCustomers: list.filter(c => c.daysSinceLastVisit >= 90).length,
            lowPrepaidCustomers: list.filter(c => c.prepaidLow).length,
            formulaCount: list.filter(c => c.hasFormula || c.hasStructuredFormula).length,
            negativeBalanceCount: list.filter(c => c.prepaidBalance < 0).length
          };
        },
        crmReturnSegments() {
          const list = this.crmList;
          const count = key => list.filter(c => c.returnGroup === key).length;
          return [
            { key: 'stable', filter: 'stable', label: '穩定回流', count: count('stable'), tone: 'ok', detail: '仍在常見週期內' },
            { key: 'upcoming', filter: 'upcoming', label: '快到週期', count: count('upcoming'), tone: 'info', detail: '接近常見整理週期' },
            { key: 'overdue', filter: 'overdue', label: '超過週期', count: count('overdue'), tone: 'warn', detail: '已超過服務週期' },
            { key: 'inactive', filter: 'inactive', label: '90天未回', count: count('inactive'), tone: 'warn', detail: '觀察回流變慢' },
            { key: 'dormant', filter: 'dormant', label: '180天沉睡', count: count('dormant'), tone: 'risk', detail: '長期未再消費' },
            { key: 'prepaidDormant', filter: 'prepaidDormant', label: '儲值久未來', count: list.filter(c => c.prepaidDormant).length, tone: 'risk', detail: '仍有餘額但久未來' }
          ];
        },
        crmReturnMatrix() {
          const list = this.crmList.filter(c => c.count > 0);
          const active = customer => !['overdue', 'inactive', 'dormant', 'prepaidDormant'].includes(customer.returnGroup);
          const matrix = [
            {
              key: 'core',
              label: '核心穩定客',
              detail: '高價值且仍穩定回流',
              filter: 'coreStable',
              tone: 'ok',
              customers: list.filter(c => c.valueTier === 'high' && active(c))
            },
            {
              key: 'attention',
              label: '高價值久未來',
              detail: '值得留意的高價值顧客',
              filter: 'highValueAtRisk',
              tone: 'risk',
              customers: list.filter(c => c.valueTier === 'high' && !active(c))
            },
            {
              key: 'regular',
              label: '一般固定客',
              detail: '穩定但消費規模較小',
              filter: 'regularStable',
              tone: 'info',
              customers: list.filter(c => c.valueTier !== 'high' && active(c))
            },
            {
              key: 'natural',
              label: '自然流失觀察',
              detail: '低頻或低消費且久未來',
              filter: 'naturalChurn',
              tone: 'neutral',
              customers: list.filter(c => c.valueTier !== 'high' && !active(c))
            }
          ];
          return matrix.map(item => ({
            ...item,
            count: item.customers.length,
            topNames: item.customers.slice(0, 3).map(c => c.name)
          }));
        },
        crmReturnCycleCards() {
          const definitions = [
            { key: 'cut', label: '剪髮', days: 45 },
            { key: 'color', label: '染髮', days: 60 },
            { key: 'care', label: '護髮／頭皮', days: 45 },
            { key: 'perm', label: '燙髮', days: 120 },
            { key: 'other', label: '其他服務', days: 60 }
          ];
          return definitions.map(definition => {
            const rows = this.crmList
              .map(customer => customer.serviceObservations.find(row => row.key === definition.key))
              .filter(Boolean);
            return {
              ...definition,
              customers: rows.length,
              upcoming: rows.filter(row => row.group === 'upcoming').length,
              overdue: rows.filter(row => ['overdue', 'dormant'].includes(row.group)).length
            };
          });
        },

        crmObservationStats() {
          const list = this.crmList.filter(customer => customer.count > 0);
          return {
            high: list.filter(customer => customer.observationLevel === 'high').length,
            attention: list.filter(customer => customer.observationLevel === 'attention').length,
            watch: list.filter(customer => customer.observationLevel === 'watch').length,
            spendDown: list.filter(customer => customer.spendTrend.direction === 'down').length,
            paceSlower: list.filter(customer => customer.visitPaceTrend.direction === 'slower').length,
            observed: list.filter(customer => customer.observationLevel !== 'normal').length,
            eligible: list.length
          };
        },

        crmObservationLeaders() {
          return this.crmList
            .filter(customer => customer.count > 0 && customer.observationLevel !== 'normal')
            .sort((a, b) => b.observation.levelRank - a.observation.levelRank
              || b.observationScore - a.observationScore
              || b.totalSpent - a.totalSpent)
            .slice(0, 5);
        },

        crmActionRecent() {
          return this.crmList
            .filter(c => c.lastDate)
            .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
            .slice(0, 3);
        },

        crmPrepaidTimelineByCustomer() {
          const grouped = MomoCore.groupRecentRowsByCustomer(
            this.prepaidLedgerEntries,
            customerId => this.resolveMergedCustomerId(customerId),
            6
          );
          const timelines = Object.create(null);
          Object.entries(grouped).forEach(([customerId, entries]) => {
            timelines[customerId] = entries.map(entry => ({
              id: entry.id,
              date: entry.date,
              signedAmount: Number(entry.signedAmount) || 0,
              amount: Math.abs(Number(entry.signedAmount) || 0),
              type: Number(entry.signedAmount) >= 0 ? 'in' : 'out',
              bucket: entry.bucket,
              note: entry.note || entry.serviceName || (entry.bucket === 'topup' ? '儲值進帳' : '儲值扣款'),
              balanceAfter: Number(entry.balanceAfter) || 0
            }));
          });
          return timelines;
        },

        // CRM Aggregation & Grid
        crmList() {
          const map = {};
          const today = new Date(new Date().toLocaleDateString('sv-SE') + 'T00:00:00');

          this.activeCustomers.forEach(customer => {
            map[customer.id] = {
              id: customer.id,
              name: customer.name,
              gender: customer.gender || '女',
              count: 0,
              totalSpent: 0,
              lastDate: '',
              firstDate: '',
              serviceMap: {},
              serviceAmountMap: {},
              serviceLastDateMap: {},
              serviceActualMinutesMap: {},
              serviceStandardMinutesMap: {},
              serviceEffectiveMinutesMap: {},
              serviceTimedAmountMap: {},
              serviceActualCountMap: {},
              serviceStandardCountMap: {},
              actualMinutesTotal: 0,
              actualMinutesCount: 0,
              standardMinutesTotal: 0,
              standardMinutesCount: 0,
              effectiveMinutesTotal: 0,
              effectiveMinutesCount: 0,
              timedAmountTotal: 0,
              recentOrders: []
            };
          });

          // Customer ID 是 CRM 主鍵；姓名只負責顯示，不再決定顧客身分。
          this.accountingOrders.forEach(o => {
            if (!this.isOrderActive(o)) return;
            if (!o.customerId || !o.customerName || this.isBlockedSlot(o.customerName)) return;
            const customerId = this.resolveMergedCustomerId(o.customerId);
            const customer = this.customerMap[customerId];
            if (!map[customerId]) {
              map[customerId] = {
                id: customerId,
                name: customer?.name || o.customerName,
                gender: customer?.gender || o.gender || '女',
                count: 0,
                totalSpent: 0,
                lastDate: '',
                firstDate: '',
                serviceMap: {},
                serviceAmountMap: {},
                serviceLastDateMap: {},
                serviceActualMinutesMap: {},
                serviceStandardMinutesMap: {},
                serviceEffectiveMinutesMap: {},
                serviceTimedAmountMap: {},
                serviceActualCountMap: {},
                serviceStandardCountMap: {},
                actualMinutesTotal: 0,
                actualMinutesCount: 0,
                standardMinutesTotal: 0,
                standardMinutesCount: 0,
                effectiveMinutesTotal: 0,
                effectiveMinutesCount: 0,
                timedAmountTotal: 0,
                recentOrders: []
              };
            }

            const record = map[customerId];
            if (o.gender) record.gender = o.gender;

            if (o.paymentMethod !== '儲值進帳') {
              const amount = Number(o.amount) || 0;
              const serviceName = o.serviceName || '未填服務';
              const standardMinutes = this.getServiceMinutes(serviceName);
              const actualMinutes = this.getOrderActualMinutes(o);
              const effective = MomoCore.resolveEffectiveMinutes(actualMinutes, standardMinutes);
              const basisMinutes = effective.effectiveMinutes;
              const correctionSlip = this.isCorrectionSlip(o);
              record.totalSpent += amount;
              if (!correctionSlip) {
                if (!record.lastDate || o.date > record.lastDate) record.lastDate = o.date;
                if (!record.firstDate || o.date < record.firstDate) record.firstDate = o.date;
                record.count += 1;
                record.serviceMap[serviceName] = (record.serviceMap[serviceName] || 0) + 1;
                record.serviceAmountMap[serviceName] = (record.serviceAmountMap[serviceName] || 0) + amount;
                if (!record.serviceLastDateMap[serviceName] || o.date > record.serviceLastDateMap[serviceName]) {
                  record.serviceLastDateMap[serviceName] = o.date;
                }
                if (standardMinutes) {
                  record.standardMinutesTotal += standardMinutes;
                  record.standardMinutesCount += 1;
                  record.serviceStandardMinutesMap[serviceName] = (record.serviceStandardMinutesMap[serviceName] || 0) + standardMinutes;
                }
                if (actualMinutes) {
                  record.actualMinutesTotal += actualMinutes;
                  record.actualMinutesCount += 1;
                  record.serviceActualMinutesMap[serviceName] = (record.serviceActualMinutesMap[serviceName] || 0) + actualMinutes;
                }
                if (basisMinutes) {
                  record.effectiveMinutesTotal += basisMinutes;
                  record.effectiveMinutesCount += 1;
                  record.timedAmountTotal += amount;
                  record.serviceEffectiveMinutesMap[serviceName] = (record.serviceEffectiveMinutesMap[serviceName] || 0) + basisMinutes;
                  record.serviceTimedAmountMap[serviceName] = (record.serviceTimedAmountMap[serviceName] || 0) + amount;
                  const countMap = effective.source === 'actual' ? record.serviceActualCountMap : record.serviceStandardCountMap;
                  countMap[serviceName] = (countMap[serviceName] || 0) + 1;
                }
                const recentOrder = {
                  id: o.id,
                  date: o.date,
                  serviceName,
                  amount,
                  paymentMethod: o.paymentMethod,
                  standardMinutes,
                  actualMinutes,
                  basisMinutes,
                  timeSource: effective.source,
                  yieldPerHour: basisMinutes ? Math.round(amount / (basisMinutes / 60)) : 0,
                  correctionSlip: false
                };
                record.recentOrders.push(recentOrder);
                record.recentOrders.sort((a, b) => String(b.date).localeCompare(String(a.date))
                  || String(b.id).localeCompare(String(a.id)));
                if (record.recentOrders.length > 8) record.recentOrders.length = 8;
              }
            }
          });

          const ranked = Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);

          return ranked.map((cust, index) => {
            const prepaidTotals = this.prepaidTotalsByCustomer[cust.id] || { balance: 0, prepaidIn: 0, prepaidOut: 0 };
            const prepaidBalance = prepaidTotals.balance;
            const recentOrders = [...cust.recentOrders].sort((a, b) => b.date.localeCompare(a.date));
            const primaryService = Object.entries(cust.serviceMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '尚無服務';
            const lastService = recentOrders[0]?.serviceName || '';
            const avgTicket = cust.count > 0 ? Math.round(cust.totalSpent / cust.count) : 0;
            const lastDateObj = cust.lastDate ? new Date(cust.lastDate + 'T00:00:00') : today;
            const daysSinceLastVisit = Math.max(0, Math.floor((today - lastDateObj) / 86400000));
            const hasFormula = !!(this.crmNotes[cust.id] && this.crmNotes[cust.id].trim());
            const formula = this.crmFormulas[cust.id] || {};
            const hasStructuredFormula = ['color', 'perm', 'hair', 'preference', 'caution']
              .some(key => typeof formula[key] === 'string' && formula[key].trim());
            const autoRevisitDays = this.getCustomerReturnCycleDays(primaryService || lastService);
            const revisitDays = Math.max(1, Number(formula.followupDays) || autoRevisitDays);
            const returnDueDate = cust.lastDate ? this.addDaysToDate(cust.lastDate, revisitDays) : '';
            const tags = Array.isArray(formula.tags) ? formula.tags.filter(Boolean) : [];
            const contact = formula.contact || '';
            const prepaidUsedPercent = prepaidTotals.prepaidIn > 0
              ? Math.min(100, Math.round((prepaidTotals.prepaidOut / prepaidTotals.prepaidIn) * 100))
              : 0;
            const lowPrepaidThreshold = Math.max(500, Math.round((avgTicket || 0) * 0.5));
            const prepaidLow = prepaidTotals.prepaidIn > 0 && prepaidBalance <= lowPrepaidThreshold;
            const prepaidDormant = prepaidBalance > 0 && daysSinceLastVisit >= 90;
            const formulaSummary = this.compactFormulaSummary(formula, this.crmNotes[cust.id]);
            const valueTier = (cust.totalSpent >= 8000 || cust.count >= 5 || avgTicket >= 2500) ? 'high' : cust.count >= 3 ? 'regular' : 'light';
            const valueTierLabel = valueTier === 'high' ? '高價值' : valueTier === 'regular' ? '固定觀察' : '低頻';
            const actualTimeCoverage = cust.count > 0 ? Math.round((cust.actualMinutesCount / cust.count) * 100) : 0;
            const fallbackTimeCount = Math.max(0, cust.effectiveMinutesCount - cust.actualMinutesCount);
            const effectiveTimeCoverage = cust.count > 0
              ? Math.round((cust.effectiveMinutesCount / cust.count) * 100)
              : 0;
            const workMinutes = cust.effectiveMinutesTotal;
            const workHourYield = workMinutes ? Math.round(cust.timedAmountTotal / (workMinutes / 60)) : 0;
            const workTimeLabel = workMinutes ? this.formatMinutesCompact(workMinutes) : '未設定';
            const workTimeBasis = cust.actualMinutesCount && fallbackTimeCount
              ? '混合工時'
              : cust.actualMinutesCount
                ? (cust.actualMinutesCount === cust.count ? '實際工時' : '部分實際工時')
                : fallbackTimeCount
                  ? (fallbackTimeCount === cust.count ? '標準工時' : '部分標準工時')
                  : '無工時';
            const servicePreferenceRows = Object.keys(cust.serviceMap)
              .map(serviceName => {
                const count = cust.serviceMap[serviceName] || 0;
                const totalAmount = cust.serviceAmountMap[serviceName] || 0;
                const minutes = cust.serviceEffectiveMinutesMap[serviceName] || 0;
                const timedAmount = cust.serviceTimedAmountMap[serviceName] || 0;
                const actualCount = cust.serviceActualCountMap[serviceName] || 0;
                const standardCount = cust.serviceStandardCountMap[serviceName] || 0;
                return {
                  serviceName,
                  count,
                  totalAmount,
                  avgAmount: count ? Math.round(totalAmount / count) : 0,
                  minutes,
                  timeLabel: minutes ? this.formatMinutesCompact(minutes) : '未設定',
                  basisLabel: actualCount && standardCount ? '混合' : actualCount ? '實際' : standardCount ? '標準' : '無工時',
                  yieldPerHour: minutes ? Math.round(timedAmount / (minutes / 60)) : 0
                };
              })
              .sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount)
              .slice(0, 4);
            const orderTimeline = recentOrders.slice(0, 8).map(order => ({
              ...order,
              timeLabel: order.basisMinutes
                ? `${order.actualMinutes ? '實際' : '標準'} ${this.formatMinutesCompact(order.basisMinutes)}`
                : '工時未設定'
            }));
            const prepaidTimeline = this.crmPrepaidTimelineByCustomer[cust.id] || [];
            const formulaTimeline = this.buildCustomerFormulaTimeline(cust, formula, recentOrders);
            const serviceObservations = MomoCore.buildCrmServiceObservations(
              Object.keys(cust.serviceMap).map(serviceName => ({
                serviceName,
                date: cust.serviceLastDateMap[serviceName],
                count: cust.serviceMap[serviceName],
                totalAmount: cust.serviceAmountMap[serviceName]
              })),
              today.toLocaleDateString('sv-SE')
            );
            const spendTrend = MomoCore.calculateCrmSpendTrend(recentOrders);
            const visitPaceTrend = MomoCore.calculateCrmVisitPaceTrend(recentOrders);
            const returnStatus = this.getCustomerReturnStatus({
              count: cust.count,
              daysSinceLastVisit,
              revisitDays,
              prepaidDormant,
              prepaidBalance,
              valueTier
            });
            const observation = MomoCore.buildCrmObservationProfile({
              returnGroup: returnStatus.group,
              prepaidBalance,
              prepaidLow,
              prepaidDormant,
              valueTier,
              spendTrend,
              visitPaceTrend,
              serviceObservations
            });

            let statusLabel = returnStatus.label;
            let statusClass = returnStatus.className;
            if (prepaidBalance < 0) {
              statusLabel = '儲值超扣';
              statusClass = 'bg-rose-50 text-rose-600 border-rose-200';
            } else if (prepaidLow && returnStatus.group === 'stable') {
              statusLabel = '餘額偏低';
              statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
            }

            return {
              ...cust,
              rank: index,
              prepaidIn: prepaidTotals.prepaidIn,
              prepaidOut: prepaidTotals.prepaidOut,
              prepaidBalance,
              avgTicket,
              primaryService,
              lastService,
              daysSinceLastVisit,
              hasFormula,
              hasStructuredFormula,
              revisitDays,
              autoRevisitDays,
              returnDueDate,
              returnGroup: returnStatus.group,
              returnLabel: returnStatus.label,
              returnReason: returnStatus.reason,
              returnProgress: returnStatus.progress,
              returnUrgency: returnStatus.urgency,
              observation,
              observationLevel: observation.level,
              observationLabel: observation.label,
              observationScore: observation.score,
              observationReasons: observation.reasons,
              observationReason: observation.primaryReason,
              valueTier,
              valueTierLabel,
              tags,
              contact,
              prepaidUsedPercent,
              lowPrepaidThreshold,
              prepaidLow,
              prepaidDormant,
              formulaSummary,
              actualTimeCoverage,
              effectiveTimeCoverage,
              workMinutes,
              workTimeLabel,
              workTimeBasis,
              workHourYield,
              spendTrend,
              visitPaceTrend,
              serviceObservations,
              servicePreferenceRows,
              orderTimeline,
              prepaidTimeline,
              formulaTimeline,
              recentOrders: recentOrders.slice(0, 3),
              statusLabel,
              statusClass
            };
          });
        },

        // Filtered CRM List based on search, filters, and sort
        filteredCrmList() {
          const query = this.crmSearchQuery.trim().toLowerCase();
          let list = this.crmList.filter(c => {
            const notes = this.crmNotes[c.id] || '';
            const formulaText = Object.values(this.crmFormulas[c.id] || {}).join(' ');
            const tagText = (c.tags || []).join(' ');
            const haystack = `${c.name} ${this.shortCustomerId(c.id)} ${c.gender || ''} ${c.primaryService} ${c.lastService} ${tagText} ${notes} ${formulaText}`.toLowerCase();
            const queryMatch = !query || haystack.includes(query);

            let filterMatch = true;
            if (this.crmFilterMode === 'vip') filterMatch = c.totalSpent >= 8000 || c.count >= 5;
            if (this.crmFilterMode === 'stable') filterMatch = c.returnGroup === 'stable';
            if (this.crmFilterMode === 'upcoming') filterMatch = c.returnGroup === 'upcoming';
            if (this.crmFilterMode === 'overdue') filterMatch = c.returnGroup === 'overdue';
            if (this.crmFilterMode === 'dormant') filterMatch = c.returnGroup === 'dormant';
            if (this.crmFilterMode === 'prepaidDormant') filterMatch = c.prepaidDormant;
            if (this.crmFilterMode === 'observationHigh') filterMatch = c.observationLevel === 'high';
            if (this.crmFilterMode === 'observationAttention') filterMatch = c.observationLevel === 'attention';
            if (this.crmFilterMode === 'spendDown') filterMatch = c.spendTrend.direction === 'down';
            if (this.crmFilterMode === 'paceSlower') filterMatch = c.visitPaceTrend.direction === 'slower';
            if (this.crmFilterMode === 'coreStable') filterMatch = c.valueTier === 'high' && ['stable', 'upcoming'].includes(c.returnGroup);
            if (this.crmFilterMode === 'highValueAtRisk') filterMatch = c.valueTier === 'high' && ['overdue', 'inactive', 'dormant', 'prepaidDormant'].includes(c.returnGroup);
            if (this.crmFilterMode === 'regularStable') filterMatch = c.valueTier !== 'high' && ['stable', 'upcoming'].includes(c.returnGroup);
            if (this.crmFilterMode === 'naturalChurn') filterMatch = c.valueTier !== 'high' && ['overdue', 'inactive', 'dormant', 'prepaidDormant'].includes(c.returnGroup);
            if (this.crmFilterMode === 'prepaid') filterMatch = c.prepaidBalance > 0;
            if (this.crmFilterMode === 'needsTopup') filterMatch = c.prepaidLow;
            if (this.crmFilterMode === 'inactive') filterMatch = c.returnGroup === 'inactive';
            if (this.crmFilterMode === 'noFormula') filterMatch = !c.hasFormula && !c.hasStructuredFormula;

            return queryMatch && filterMatch;
          });

          const sorters = {
            observation: (a, b) => b.observation.levelRank - a.observation.levelRank
              || b.observationScore - a.observationScore
              || b.totalSpent - a.totalSpent,
            lastDate: (a, b) => b.lastDate.localeCompare(a.lastDate),
            totalSpent: (a, b) => b.totalSpent - a.totalSpent,
            prepaidLow: (a, b) => a.prepaidBalance - b.prepaidBalance,
            visits: (a, b) => b.count - a.count,
            name: (a, b) => a.name.localeCompare(b.name, 'zh-Hant')
          };
          return list.sort(sorters[this.crmSortMode] || sorters.lastDate);
        },

        visibleCrmList() {
          return this.filteredCrmList.slice(0, this.crmVisibleLimit);
        },

        crmHasMoreCustomers() {
          return this.crmVisibleLimit < this.filteredCrmList.length;
        },

        prepaidLedgerEntries() {
          const balances = {};
          return this.prepaidLedger
            .map((entry, index) => ({ entry, index }))
            .sort((a, b) => String(a.entry.date).localeCompare(String(b.entry.date))
              || String(a.entry.createdAt).localeCompare(String(b.entry.createdAt))
              || a.index - b.index)
            .map(({ entry }) => {
              const signedAmount = Number(entry.signedAmount) || 0;
              const balanceCustomerId = this.resolveMergedCustomerId(entry.customerId);
              balances[balanceCustomerId] = (balances[balanceCustomerId] || 0) + signedAmount;
              const customer = this.customerMap[entry.customerId];
              return {
                ...entry,
                customerName: customer?.name || entry.customerNameSnapshot || '未知顧客',
                type: signedAmount >= 0 ? 'in' : 'out',
                amount: Math.abs(signedAmount),
                balanceAfter: balances[balanceCustomerId]
              };
            })
            .reverse();
        },

        filteredPrepaidLedger() {
          const query = this.prepaidLedgerSearchQuery.trim().toLowerCase();
          return this.prepaidLedgerEntries.filter(entry => {
            const queryMatch = !query || `${entry.customerName} ${entry.serviceName}`.toLowerCase().includes(query);
            const typeMatch = this.prepaidLedgerFilter === 'all' || entry.type === this.prepaidLedgerFilter;
            return queryMatch && typeMatch;
          });
        },

        prepaidLedgerGroups() {
          const groups = {};
          this.filteredPrepaidLedger.forEach(entry => {
            if (!groups[entry.date]) groups[entry.date] = [];
            groups[entry.date].push(entry);
          });
          return Object.entries(groups).map(([date, entries]) => ({ date, entries }));
        },

        prepaidLedgerSummary() {
          const entries = this.prepaidLedgerEntries;
          const totalIn = Math.max(0, entries.filter(e => e.bucket === 'topup').reduce((sum, e) => sum + (Number(e.signedAmount) || 0), 0));
          const totalOut = Math.max(0, -entries.filter(e => e.bucket === 'debit').reduce((sum, e) => sum + (Number(e.signedAmount) || 0), 0));
          return {
            totalIn,
            totalOut,
            balance: entries.reduce((sum, entry) => sum + (Number(entry.signedAmount) || 0), 0),
            customers: this.crmList.filter(c => c.prepaidIn > 0 || c.prepaidOut > 0).length
          };
        },
        // ── 損益報表（第 6 Tab）──────────────────────────────
        // ── 同比分析 ──────────────────────────────────────────
        lastYearMonthlyData() {
          const lastYear = String(parseInt(this.selectedYear) - 1);
          return Array.from({ length: 12 }, (_, i) => {
            const mStr = String(i + 1).padStart(2, '0');
            const monthOrders = this.accountingOrders.filter(o => {
              const [y, m] = o.date.split('-');
              return y === lastYear && m === mStr
                && this.isOrderActive(o)
                && o.customerName && !this.isBlockedSlot(o.customerName)
                && o.paymentMethod !== '儲值進帳';
            });
            const revenue  = monthOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
            const count = monthOrders.filter(o => !this.isCorrectionSlip(o)).length;
            const expenses = this.expenses
              .filter(e => { const [y, m] = e.date.split('-'); return y === lastYear && m === mStr; })
              .reduce((s, e) => s + (Number(e.amount) || 0), 0);
            return { month: i + 1, revenue, expenses, net: revenue - expenses, count };
          });
        },
        lastYearSummary() {
          const data = this.lastYearMonthlyData;
          const totalRevenue  = data.reduce((s, d) => s + d.revenue, 0);
          const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
          const netProfit     = totalRevenue - totalExpenses;
          const profitMargin  = totalRevenue > 0 ? Math.round(netProfit / totalRevenue * 100) : 0;
          return { totalRevenue, totalExpenses, netProfit, profitMargin };
        },
        // ────────────────────────────────────────────────────

        annualMonthlyData() {
          return Array.from({ length: 12 }, (_, i) => {
            const mStr = String(i + 1).padStart(2, '0');
            const monthOrders = this.accountingOrders.filter(o => {
              const [y, m] = o.date.split('-');
              return y === this.selectedYear && m === mStr
                && this.isOrderActive(o)
                && o.customerName && !this.isBlockedSlot(o.customerName)
                && o.paymentMethod !== '儲值進帳';
            });
            const revenue  = monthOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
            const count    = monthOrders.filter(o => !this.isCorrectionSlip(o)).length;
            const expenses = this.expenses
              .filter(e => {
                const [y, m] = e.date.split('-');
                return y === this.selectedYear && m === mStr;
              })
              .reduce((s, e) => s + (Number(e.amount) || 0), 0);
            return { month: i + 1, label: `${i + 1}月`, revenue, expenses, net: revenue - expenses, count };
          });
        },
        annualSummary() {
          const data = this.annualMonthlyData;
          const totalRevenue  = data.reduce((s, d) => s + d.revenue, 0);
          const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
          const netProfit     = totalRevenue - totalExpenses;
          const activeMonths  = data.filter(d => d.revenue > 0);
          const bestMonth     = activeMonths.reduce((b, d) => d.revenue > (b?.revenue || 0) ? d : b, null);
          const worstMonth    = activeMonths.reduce((w, d) => d.revenue < (w?.revenue ?? Infinity) ? d : w, null);
          const profitMargin  = totalRevenue > 0 ? Math.round(netProfit / totalRevenue * 100) : 0;
          return { totalRevenue, totalExpenses, netProfit, bestMonth, worstMonth, profitMargin };
        },
        reportSettlementMonth() {
          if (this.selectedMonth && this.selectedMonth !== 'All') return String(this.selectedMonth).padStart(2, '0');
          const now = new Date();
          if (this.selectedYear === String(now.getFullYear())) return String(now.getMonth() + 1).padStart(2, '0');
          const latestActive = [...this.annualMonthlyData]
            .reverse()
            .find(month => month.revenue > 0 || month.expenses > 0);
          return latestActive ? String(latestActive.month).padStart(2, '0') : '01';
        },
        reportSettlementPrefix() {
          return `${String(this.selectedYear)}-${this.reportSettlementMonth}`;
        },
        settlementOrders() {
          const prefix = this.reportSettlementPrefix;
          const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
          return this.accountingOrders
            .filter(order => {
              if (!order || !validDate(order.date) || !String(order.date).startsWith(prefix)) return false;
              return this.isOrderActive(order) && order.customerName && !this.isBlockedSlot(order.customerName);
            })
            .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
        },
        settlementServiceOrders() {
          return this.settlementOrders.filter(order => order.paymentMethod !== '儲值進帳' && !this.isCorrectionSlip(order));
        },
        settlementExpenses() {
          const prefix = this.reportSettlementPrefix;
          const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
          return (this.expenses || [])
            .filter(expense => validDate(expense?.date) && String(expense.date).startsWith(prefix))
            .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
        },
        settlementServiceYieldRows() {
          return this.buildServiceYieldRows(this.settlementServiceOrders);
        },
        settlementYieldSummary() {
          return this.buildYieldSummary(this.settlementServiceYieldRows, this.settlementServiceOrders);
        },
        monthlySettlementDailyRows() {
          const prefix = this.reportSettlementPrefix;
          const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
          const dates = new Set();

          this.settlementOrders.forEach(order => {
            if (validDate(order.date)) dates.add(order.date);
          });
          this.settlementExpenses.forEach(expense => {
            if (validDate(expense.date)) dates.add(expense.date);
          });
          Object.entries(this.closeoutRecords || {}).forEach(([key, record]) => {
            const date = record?.date || key;
            if (validDate(date) && String(date).startsWith(prefix)) dates.add(date);
          });

          return [...dates]
            .sort()
            .map(date => this.getSettlementCloseoutForDate(date));
        },
        monthlyPrepaidReconciliation() {
          const [year, month] = this.reportSettlementPrefix.split('-');
          const startDate = `${year}-${month}-01`;
          const rowsByCustomer = {};
          const summary = {
            openingBalance: 0,
            topupIn: 0,
            debitOut: 0,
            adjustments: 0,
            netChange: 0,
            closingBalance: 0,
            topupCount: 0,
            debitCount: 0,
            adjustmentCount: 0
          };
          const ensureRow = customerId => {
            customerId = this.resolveMergedCustomerId(customerId);
            if (!rowsByCustomer[customerId]) {
              const customer = this.customerMap[customerId];
              rowsByCustomer[customerId] = {
                customerId,
                customerName: customer?.name || customerId || '未知顧客',
                openingBalance: 0,
                topupIn: 0,
                debitOut: 0,
                adjustments: 0,
                netChange: 0,
                closingBalance: 0
              };
            }
            return rowsByCustomer[customerId];
          };

          (this.prepaidLedger || []).forEach(entry => {
            if (!entry?.customerId || !/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || ''))) return;
            const amount = Math.round(Number(entry.signedAmount) || 0);
            if (!amount) return;
            const row = ensureRow(entry.customerId);
            if (entry.date < startDate) {
              row.openingBalance += amount;
              summary.openingBalance += amount;
              return;
            }
            if (!String(entry.date).startsWith(this.reportSettlementPrefix)) return;

            row.netChange += amount;
            summary.netChange += amount;
            const isTopupIn = amount > 0 && entry.kind === 'topup' && entry.bucket === 'topup';
            const isDebitOut = amount < 0 && entry.kind === 'debit' && entry.bucket === 'debit';
            if (isTopupIn) {
              row.topupIn += amount;
              summary.topupIn += amount;
              summary.topupCount += 1;
            } else if (isDebitOut) {
              row.debitOut += Math.abs(amount);
              summary.debitOut += Math.abs(amount);
              summary.debitCount += 1;
            } else {
              row.adjustments += amount;
              summary.adjustments += amount;
              summary.adjustmentCount += 1;
            }
          });

          const customerRows = Object.values(rowsByCustomer)
            .map(row => ({
              ...row,
              closingBalance: row.openingBalance + row.netChange
            }))
            .filter(row => row.openingBalance || row.topupIn || row.debitOut || row.adjustments || row.closingBalance)
            .sort((a, b) => Math.abs(b.closingBalance) - Math.abs(a.closingBalance) || String(a.customerName).localeCompare(String(b.customerName), 'zh-Hant'));

          summary.closingBalance = summary.openingBalance + summary.netChange;
          const expectedByOrderCustomer = new Map();
          const ledgerByOrderCustomer = new Map();
          const keyFor = (orderId, customerId) => JSON.stringify([String(orderId), String(customerId)]);

          this.accountingOrders.forEach(order => {
            if (!order?.id || !order.customerId || !String(order.date || '').startsWith(this.reportSettlementPrefix)) return;
            const expected = this.getOrderPrepaidTarget(order);
            if (!expected) return;
            const customerId = this.resolveMergedCustomerId(order.customerId);
            const key = keyFor(order.id, customerId);
            expectedByOrderCustomer.set(key, {
              orderId: String(order.id),
              customerId,
              expected: (expectedByOrderCustomer.get(key)?.expected || 0) + expected,
              order
            });
          });
          (this.prepaidLedger || []).forEach(entry => {
            if (!entry?.sourceOrderId || !entry.customerId || !String(entry.date || '').startsWith(this.reportSettlementPrefix)) return;
            const customerId = this.resolveMergedCustomerId(entry.customerId);
            const key = keyFor(entry.sourceOrderId, customerId);
            const current = ledgerByOrderCustomer.get(key) || {
              orderId: String(entry.sourceOrderId),
              customerId,
              ledger: 0
            };
            current.ledger += Number(entry.signedAmount) || 0;
            ledgerByOrderCustomer.set(key, current);
          });

          const mismatchKeys = new Set([...expectedByOrderCustomer.keys(), ...ledgerByOrderCustomer.keys()]);
          const mismatches = [...mismatchKeys].map(key => {
            const expectedRow = expectedByOrderCustomer.get(key);
            const ledgerRow = ledgerByOrderCustomer.get(key);
            const expected = Math.round(Number(expectedRow?.expected) || 0);
            const ledger = Math.round(Number(ledgerRow?.ledger) || 0);
            const customerId = expectedRow?.customerId || ledgerRow?.customerId || '';
            return {
              orderId: expectedRow?.orderId || ledgerRow?.orderId || '',
              customerId,
              customerName: this.customerMap[customerId]?.name || customerId || '未知顧客',
              expected,
              ledger,
              difference: ledger - expected
            };
          }).filter(row => row.difference !== 0);

          summary.orderExpectedNet = [...expectedByOrderCustomer.values()].reduce((sum, row) => sum + row.expected, 0);
          summary.orderLedgerNet = [...ledgerByOrderCustomer.values()].reduce((sum, row) => sum + row.ledger, 0);
          summary.orderDifference = summary.orderLedgerNet - summary.orderExpectedNet;
          summary.mismatchCount = mismatches.length;
          summary.balanced = mismatches.length === 0;
          return { ...summary, customerRows, mismatches };
        },
        monthlySettlementSummary() {
          const month = this.reportSettlementMonth;
          const year = String(this.selectedYear);
          const today = new Date().toLocaleDateString('sv-SE');
          const startDate = this.pendingActionStartDate || '2026-07-01';
          const dailyRows = this.monthlySettlementDailyRows;
          const totals = {
            cash: 0,
            transfer: 0,
            prepaidOut: 0,
            prepaidIn: 0,
            cashPrepaidIn: 0,
            transferPrepaidIn: 0,
            actualCashIn: 0,
            serviceRevenue: 0,
            expenses: 0,
            netProfit: 0
          };
          let serviceOrdersCount = 0;
          let topupCount = 0;
          dailyRows.forEach(day => {
            totals.cash += day.cash;
            totals.transfer += day.transfer;
            totals.prepaidOut += day.prepaidOut;
            totals.prepaidIn += day.prepaidIn;
            totals.cashPrepaidIn += day.cashPrepaidIn;
            totals.transferPrepaidIn += day.transferPrepaidIn;
            totals.actualCashIn += day.actualCashIn;
            totals.serviceRevenue += day.serviceRevenue;
            totals.expenses += day.expenses;
            totals.netProfit += day.netProfit;
            serviceOrdersCount += day.serviceOrdersCount;
            topupCount += day.topupCount;
          });
          const unclosedDates = dailyRows
            .filter(day => day.date >= startDate && day.date <= today && day.source !== 'snapshot')
            .map(day => day.date)
            .sort();
          const closedDays = dailyRows.filter(day => day.source === 'snapshot').length;
          const liveDays = dailyRows.length - closedDays;
          const profitMargin = totals.serviceRevenue > 0 ? Math.round(totals.netProfit / totals.serviceRevenue * 100) : 0;
          return {
            year,
            month,
            label: `${year}/${Number(month)} 月`,
            ...totals,
            cashIn: totals.cash + totals.cashPrepaidIn,
            transferIn: totals.transfer + totals.transferPrepaidIn,
            ordersCount: serviceOrdersCount,
            topupCount,
            avgTicket: serviceOrdersCount ? Math.round(totals.serviceRevenue / serviceOrdersCount) : 0,
            profitMargin,
            businessDays: dailyRows.length,
            closedDays,
            snapshotDays: closedDays,
            liveDays,
            unclosedDates,
            dailyRows,
            settlementBasis: closedDays
              ? `已打烊 ${closedDays} 天使用固定快照${liveDays ? `，另有 ${liveDays} 天仍為明細暫算` : ''}`
              : `尚無打烊快照，${liveDays} 天皆為明細暫算`,
            ready: unclosedDates.length === 0
          };
        },
        monthlyReportCompleteness() {
          const s = this.monthlySettlementSummary;
          const p = this.monthlyPrepaidReconciliation;
          const syncTotal = Math.max(0, Number(this.syncIssueSummary.total) || 0);
          const pricing = (this.priceMatchWorkbenchRows || []).length;
          const pricingFromSync = Math.max(0, Number(this.syncIssueSummary.pricing) || 0);
          const issueCount = syncTotal + Math.max(0, pricing - pricingFromSync);
          const expenseMissing = s.serviceRevenue > 0 && s.expenses === 0;
          const ready = s.ready && !expenseMissing && issueCount === 0 && p.balanced;
          const items = [
            {
              key: 'closeout',
              label: '打烊快照',
              value: s.ready ? '已完成' : `未完成 ${s.unclosedDates.length} 天`,
              detail: `快照 ${s.snapshotDays} 天 · 暫算 ${s.liveDays} 天`,
              tone: s.ready ? 'good' : 'warn'
            },
            {
              key: 'expenses',
              label: '支出紀錄',
              value: !s.serviceRevenue ? '尚無營收' : expenseMissing ? '尚未記錄' : `NT$ ${this.formatNumber(s.expenses)}`,
              detail: expenseMissing ? '有營收但支出為 0，淨利率暫不判定' : '已納入本月損益',
              tone: expenseMissing ? 'risk' : s.serviceRevenue ? 'good' : 'neutral'
            },
            {
              key: 'sync',
              label: '同步資料',
              value: issueCount ? `${issueCount} 項待確認` : '資料正常',
              detail: pricing ? `包含價目未匹配 ${pricing} 項` : '金額、付款與價目資料可用',
              tone: issueCount ? 'warn' : 'good'
            },
            {
              key: 'prepaid',
              label: '儲值帳本',
              value: p.balanced ? '帳面平衡' : '需要對帳',
              detail: `期末 NT$ ${this.formatNumber(p.closingBalance)}`,
              tone: p.balanced ? 'good' : 'risk'
            }
          ];
          return {
            ready,
            label: ready ? '可封存' : '需確認',
            className: ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
            expenseMissing,
            issueCount,
            items
          };
        },
        monthlyOperationsSummary() {
          const s = this.monthlySettlementSummary;
          const y = this.settlementYieldSummary;
          const monthIndex = Math.max(1, Number(s.month) || 1) - 1;
          const previousMonth = monthIndex > 0
            ? this.annualMonthlyData[monthIndex - 1]
            : this.lastYearMonthlyData[11];
          const previousLabel = monthIndex > 0
            ? `${s.year}/${monthIndex} 月`
            : `${Number(s.year) - 1}/12 月`;
          const previousAverage = previousMonth?.count
            ? Math.round(previousMonth.revenue / previousMonth.count)
            : 0;
          const compare = (current, previous) => {
            if (!previous) return '尚無上一個完整月份可比';
            const change = Math.round((current - previous) / previous * 100);
            return `較 ${previousLabel} ${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%`;
          };
          return {
            previousLabel,
            cards: [
              {
                key: 'revenue',
                label: '營業額',
                value: `NT$ ${this.formatNumber(s.serviceRevenue)}`,
                detail: compare(s.serviceRevenue, previousMonth?.revenue || 0),
                tone: 'brand'
              },
              {
                key: 'orders',
                label: '服務筆數',
                value: `${s.ordersCount} 筆`,
                detail: compare(s.ordersCount, previousMonth?.count || 0),
                tone: 'neutral'
              },
              {
                key: 'ticket',
                label: '平均客單',
                value: `NT$ ${this.formatNumber(s.avgTicket)}`,
                detail: compare(s.avgTicket, previousAverage),
                tone: 'neutral'
              },
              {
                key: 'yield',
                label: '每小時產值',
                value: y.average ? `NT$ ${this.formatNumber(y.average)}` : '尚無',
                detail: y.average ? `${y.actualAverage ? '實際工時' : '預估工時'} · 覆蓋 ${y.actualCoverage}%` : '尚無可用工時',
                tone: 'info'
              }
            ]
          };
        },
        reportComparisons() {
          const percentage = (current, previous) => previous ? Math.round((current - previous) / previous * 100) : 0;
          return {
            revenue: percentage(this.annualSummary.totalRevenue, this.lastYearSummary.totalRevenue),
            expenses: percentage(this.annualSummary.totalExpenses, this.lastYearSummary.totalExpenses),
            net: percentage(this.annualSummary.netProfit, this.lastYearSummary.netProfit)
          };
        },
        reportTrendChart() {
          const data = this.annualMonthlyData;
          const values = data.flatMap(item => [item.revenue, item.expenses, item.net]);
          const min = Math.min(0, ...values);
          const max = Math.max(1000, ...values);
          const range = Math.max(1, max - min);
          const left = 40, right = 575, top = 15, bottom = 128;
          const yFor = value => top + ((max - value) / range) * (bottom - top);
          const points = data.map((item, index) => {
            const x = left + index * ((right - left) / 11);
            return { ...item, x, revenueY: yFor(item.revenue), expenseY: yFor(item.expenses), netY: yFor(item.net) };
          });
          const line = key => points.map(point => `${point.x},${point[key]}`).join(' ');
          return {
            points,
            revenuePoints: line('revenueY'),
            expensePoints: line('expenseY'),
            netPoints: line('netY'),
            zeroY: yFor(0)
          };
        },
        reportBreakdownRows() {
          const source = this.reportBreakdownTab === 'income'
            ? this.annualDonutChartData.allSegments.map(item => ({ label: item.cat, amount: item.amount, percentage: item.percentage }))
            : this.expenseDonutData.allSegments.map(item => ({ label: item.cat, amount: item.amount, percentage: item.percentage }));
          return source.filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount);
        },
        reportMonthlyRows() {
          return this.annualMonthlyData.filter(month => month.revenue > 0 || month.expenses > 0);
        },
        monthRanking() {
          return [...this.annualMonthlyData]
            .filter(d => d.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue);
        },
        annualBarChart() {
          const data         = this.annualMonthlyData;
          const lastYearData = this.lastYearMonthlyData;
          const maxVal = Math.max(
            ...data.map(d => Math.max(d.revenue, d.expenses)),
            ...lastYearData.map(d => d.revenue),
            1000
          );
          const W = 600, H = 110;
          const pad = { t: 10, b: 20 };
          const ch = H - pad.t - pad.b;
          const gw = W / 12;
          return data.map((d, i) => {
            const gx  = i * gw;
            const rh  = Math.max((d.revenue  / maxVal) * ch, d.revenue  > 0 ? 3 : 0);
            const eh  = Math.max((d.expenses / maxVal) * ch, d.expenses > 0 ? 2 : 0);
            const ly  = lastYearData[i].revenue > 0
              ? H - pad.b - (lastYearData[i].revenue / maxVal) * ch
              : null;
            return {
              ...d,
              gx, gw,
              rx: gx + gw * 0.10, rw: gw * 0.40, ry: H - pad.b - rh, rh,
              ex: gx + gw * 0.54, ew: gw * 0.30, ey: H - pad.b - eh, eh,
              lx:  gx + gw / 2,
              lastRevenue: lastYearData[i].revenue,
              lastY: ly
            };
          });
        },
        annualCategoryBreakdown() {
          const cats = { '剪髮': 0, '燙髮': 0, '染髮': 0, '洗護其他': 0, '更正': 0 };
          this.accountingOrders
            .filter(o => {
              const [y] = o.date.split('-');
              return y === this.selectedYear && o.customerName
                && this.isOrderActive(o)
                && !this.isBlockedSlot(o.customerName)
                && o.paymentMethod !== '儲值進帳';
            })
            .forEach(o => {
              const cat = this.isCorrectionSlip(o) ? '更正' : (o.category || this.classifyCategory(o.serviceName));
              if (cats[cat] !== undefined) cats[cat] += Number(o.amount) || 0;
              else cats['洗護其他'] += Number(o.amount) || 0;
            });
          return cats;
        },
        annualDonutChartData() {
          const cats = this.annualCategoryBreakdown;
          const total = Object.values(cats).reduce((s, v) => s + v, 0);
          const r = 55, circumference = 2 * Math.PI * r;
          const meta = {
            '剪髮': { color: '#FF2D55' },
            '燙髮': { color: '#32ADE6' },
            '染髮': { color: '#AF52DE' },
            '洗護其他': { color: '#34C759' },
            '更正': { color: '#FF9F0A' }
          };
          let cumulative = 0;
          const allSegments = Object.entries(cats).map(([cat, amount]) => {
            const ratio = total > 0 ? amount / total : 0;
            return { cat, amount, ratio, percentage: Math.round(ratio * 100), ...meta[cat] };
          });
          const segments = allSegments.filter(s => s.amount > 0).map(s => {
            const length = s.ratio * circumference;
            const offset = circumference - cumulative;
            cumulative += length;
            return { ...s, length, offset };
          });
          return { segments, allSegments, total, circumference };
        },
        expenseDonutData() {
          const cats = {};
          this.expenseCategories.forEach(cat => { cats[cat] = 0; });
          this.expenses
            .filter(e => { const [y] = e.date.split('-'); return y === this.selectedYear; })
            .forEach(e => { cats[e.category] = (cats[e.category] || 0) + (Number(e.amount) || 0); });
          const total = Object.values(cats).reduce((s, v) => s + v, 0);
          const r = 55, circumference = 2 * Math.PI * r;
          const meta = Object.fromEntries(this.expenseCategories.map(cat => {
            const info = this.getExpenseCategoryInfo(cat);
            return [cat, { color: info.chartColor }];
          }));
          let cumulative = 0;
          const allSegments = Object.entries(cats).map(([cat, amount]) => {
            const ratio = total > 0 ? amount / total : 0;
            return { cat, amount, ratio, percentage: Math.round(ratio * 100), ...(meta[cat] || { color: '#8E8E93' }) };
          });
          const segments = allSegments.filter(s => s.amount > 0).map(s => {
            const length = s.ratio * circumference;
            const offset = circumference - cumulative;
            cumulative += length;
            return { ...s, length, offset };
          });
          return { segments, allSegments, total, circumference };
        },
        // ────────────────────────────────────────────────────

        filteredInventory() {
          const query = this.inventorySearchQuery.trim().toLowerCase();
          return this.inventory
            .filter(item => {
              const stock = Number(item.stock) || 0;
              const searchMatch = !query
                || String(item.name || '').toLowerCase().includes(query)
                || String(item.notes || '').toLowerCase().includes(query);
              const statusMatch = this.inventoryFilterMode === 'all'
                || (this.inventoryFilterMode === 'low' && this.isInventoryLow(item))
                || (this.inventoryFilterMode === 'out' && stock === 0);
              return searchMatch && statusMatch;
            })
            .sort((a, b) => {
              const stockDiff = (Number(a.stock) || 0) - (Number(b.stock) || 0);
              return stockDiff || String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant');
            });
        },
        inventoryReplenishmentItems() {
          return this.inventory
            .filter(item => (Number(item.stock) || 0) === 0 || this.isInventoryLow(item))
            .sort((a, b) => {
              const aStock = Number(a.stock) || 0;
              const bStock = Number(b.stock) || 0;
              if (aStock === 0 && bStock !== 0) return -1;
              if (bStock === 0 && aStock !== 0) return 1;
              return (aStock - bStock) || String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant');
            });
        },
        inventorySummary() {
          return {
            items: this.inventory.length,
            units: this.inventory.reduce((sum, item) => sum + Math.max(0, Number(item.stock) || 0), 0),
            low: this.inventory.filter(item => {
              return this.isInventoryLow(item);
            }).length,
            out: this.inventory.filter(item => (Number(item.stock) || 0) === 0).length
          };
        },
        lowStockItems() {
          return this.inventory.filter(item => (Number(item.stock) || 0) === 0 || this.isInventoryLow(item));
        },
        expenseBreakdown() {
          const breakdown = {};
          this.expenseCategories.forEach(cat => {
            breakdown[cat] = 0;
          });
          this.periodExpenses.forEach(e => {
            const cat = e.category;
            if (breakdown[cat] !== undefined) {
              breakdown[cat] += (Number(e.amount) || 0);
            } else {
              breakdown['其他'] = (breakdown['其他'] || 0) + (Number(e.amount) || 0);
            }
          });
          return breakdown;
        },
        serviceDictionary() {
          return MomoCore.buildServiceMetricDictionary(this.servicesConfig, 'duration');
        },
        priceDictionary() {
          return MomoCore.buildServiceMetricDictionary(this.servicesConfig, 'price');
        },
        serviceConfigHasChanges() {
          return JSON.stringify(this.tempServicesConfig || []) !== JSON.stringify(this.servicesConfig || []);
        },
        newOrderDraftDirty() {
          return Boolean(
            String(this.newOrder.customerId || '').trim()
            || String(this.newOrder.customerName || '').trim()
            || String(this.newOrder.serviceName || '').trim()
            || (this.newOrder.amount !== null && this.newOrder.amount !== '')
            || (this.newOrder.cashAmount !== null && this.newOrder.cashAmount !== '')
            || this.newOrder.createNewCustomer
            || this.newOrder.paymentMethod !== '現金'
            || this.newOrder.topupChannel !== '現金'
          );
        },
        newExpenseDraftDirty() {
          return Boolean(
            (this.newExpense.amount !== null && this.newExpense.amount !== '')
            || this.newExpense.paymentMethod !== '現金'
            || String(this.newExpense.notes || '').trim()
          );
        },
        newInventoryDraftDirty() {
          return Boolean(
            String(this.newInventory.name || '').trim()
            || (this.newInventory.stock !== null && this.newInventory.stock !== '')
            || String(this.newInventory.notes || '').trim()
            || Number(this.newInventory.minStock) !== 3
          );
        },
        closeoutDraftDirty() {
          const record = this.selectedCloseoutRecord;
          const currentCount = this.closeoutCashCount === null || this.closeoutCashCount === ''
            ? null
            : Number(this.closeoutCashCount);
          const savedCount = record ? Number(record.countedCash) : null;
          const currentOpeningCash = Math.max(0, Number(this.closeoutOpeningCash) || 0);
          const savedOpeningCash = record ? Math.max(0, Number(record.openingCash) || 0) : 0;
          return currentCount !== savedCount
            || currentOpeningCash !== savedOpeningCash
            || String(this.closeoutNote || '').trim() !== String(record?.note || '').trim();
        },
        hasUnsavedAppWork() {
          const dirtyOrderEdit = Object.entries(this.orderEditDrafts || {}).some(([id, draft]) => {
            const order = this.orders.find(row => String(row.id) === String(id));
            return Boolean(order) && this.orderAuditFields().some(field =>
              JSON.stringify(order?.[field] ?? null) !== JSON.stringify(draft?.[field] ?? null)
            );
          });
          const dirtyExpenseEdit = Object.entries(this.expenseEditDrafts || {}).some(([id, draft]) => {
            const expense = this.expenses.find(row => String(row.id) === String(id));
            return Boolean(expense) && ['date', 'category', 'amount', 'paymentMethod', 'notes'].some(field =>
              JSON.stringify(expense?.[field] ?? null) !== JSON.stringify(draft?.[field] ?? null)
            );
          });
          const dirtyInventoryEdit = Object.entries(this.inventoryEditDrafts || {}).some(([id, draft]) => {
            const item = this.inventory.find(row => String(row.id) === String(id));
            if (!item) return false;
            const current = this.cloneInventoryForDraft(item);
            return ['name', 'stock', 'minStock', 'notes'].some(field =>
              JSON.stringify(current?.[field] ?? null) !== JSON.stringify(draft?.[field] ?? null)
            );
          });
          const dirtyCrmEdit = Object.entries(this.crmEditDrafts || {}).some(([id, draft]) => {
            const customer = this.customerMap[id];
            return Boolean(customer) && JSON.stringify(this.buildCrmDraft(customer)) !== JSON.stringify(draft);
          });
          return this.newOrderDraftDirty
            || this.newExpenseDraftDirty
            || this.newInventoryDraftDirty
            || (this.showCloseoutSheet && this.closeoutDraftDirty)
            || (this.showServiceConfigModal && this.serviceConfigHasChanges)
            || dirtyOrderEdit
            || dirtyExpenseEdit
            || dirtyInventoryEdit
            || dirtyCrmEdit;
        },
        hasProtectedAppActivity() {
          return this.hasUnsavedAppWork
            || Object.values(this.formActionBusy || {}).some(Boolean)
            || Boolean(this.confirmModal?.show)
            || this.syncing
            || this.cloudSyncInFlight
            || this.cloudBackupStatus === 'restoring';
        },
        pwaUpdateMessage() {
          if (this.pwaUpdateApplying) return '正在切換至新版本，請稍候。';
          if (this.hasUnsavedAppWork) return '目前有尚未儲存的內容，完成後再更新。';
          if (this.hasProtectedAppActivity) return '目前正在同步或儲存，完成後再更新。';
          if (this.pwaUpdateDeferred) return '已保留新版，現在可安心套用。';
          return '更新後只會重新載入一次，本機資料仍會保留。';
        },
        filteredTempServicesConfigRows() {
          const query = String(this.serviceConfigSearchQuery || '').trim().toLowerCase();
          return (this.tempServicesConfig || [])
            .map((service, index) => ({ service, index }))
            .filter(row => !query || String(row.service?.name || '').toLowerCase().includes(query));
        }
      },
      watch: {
        activeTab(newVal) {
          this.showMobileMorePages = false;
          if (newVal === 'safety' && this.cloudReady && this.authUser && this.cloudBackupStatus === 'idle') {
            this.fetchCloudBackupList({ silent: true });
          }
          if (newVal !== 'crm') {
            this.expandedCrmCustomerName = null;
            this.crmShowInsights = false;
            this.crmShowMoreFilters = false;
          }
          if (newVal !== 'safety') {
            this.safetyMaintenanceSection = '';
            this.safetyMaintenanceView = 'backup';
            this.safetyShowAllIssues = false;
            this.safetyShowAllCloudBackups = false;
            this.safetyShowAllLocalSnapshots = false;
            this.runtimeDiagnosticsExpanded = false;
          }
          if (newVal !== 'report') {
            this.reportShowPrepaidDetails = false;
            this.reportShowYieldDetails = false;
          }
        },
        crmSearchQuery() {
          this.resetCrmVisibleLimit();
        },
        crmFilterMode() {
          this.resetCrmVisibleLimit();
        },
        crmSortMode() {
          this.resetCrmVisibleLimit();
        },
        crmViewMode(newVal) {
          if (newVal !== 'customers') {
            this.expandedCrmCustomerName = null;
            this.crmShowInsights = false;
            this.crmShowMoreFilters = false;
          }
        },
        'newOrder.customerName'(newVal) {
          if (!this.newOrder.customerId) return;
          const selected = this.customerMap[this.newOrder.customerId];
          if (!selected || this.normalizeCustomerName(selected.name) !== this.normalizeCustomerName(newVal)) {
            this.newOrder.customerId = '';
          }
        },
        'newOrder.serviceName'(newVal) {
          if (newVal) {
            const price = this.getServicePrice(newVal);
            if (price !== null) {
              this.newOrder.amount = price;
            }
          }
        }
      },
      mounted() {
        if (this.iosPerfMode) document.body.classList.add('momo-ios-perf');
        this.loadFromLocalStorage();
        this.startRuntimeMonitoring();
        this.applyLocalRuntimeMonitorQaRoute();
        const startupTone = this.storageRecoveryBlocked ? 'error' : this.storageRecoveryNotice ? 'warning' : 'ok';
        const startupMessage = this.storageRecoveryBlocked
          ? '偵測到中斷的資料寫入，已停止自動同步，請從保護快照還原'
          : this.storageRecoveryNotice
            ? '偵測到中斷的資料寫入，已自動回復上次完整版本'
            : 'App 已開啟，本機資料可立即使用';
        this.recordRuntimeDiagnostic('startup', startupTone, startupMessage, {
          version: this.appVersion,
          localDataCount: this.localDataCount
        });
        if (this.storageRecoveryBlocked) this.showToast(startupMessage, 'error', 10000);
        else if (this.storageRecoveryNotice) {
          this.showToast(startupMessage, 'warning', 8000);
          localStorage.removeItem('momo_storage_recovery_notice');
          this.storageRecoveryNotice = null;
        }
        if (this.storageRecoveryBlocked) {
          this.authLoading = false;
          this.calendarAutoSyncStatus = 'error';
          this.calendarAutoSyncMessage = '資料回復待處理，自動同步已暫停';
        } else {
          this.initAuth()
            .catch((error) => {
              this.recordRuntimeDiagnostic('startup', 'warning', '後端初始化失敗，已保留本機模式', {
                error: String(error?.message || error)
              });
            })
            .finally(() => {
              this.scheduleInitialCalendarAutoSync();
              this.applyLocalRuntimeMonitorQaRoute();
            });
        }
        this.setupPwaUpdateListener();
        this.scheduleStartupSystemCheck();
        window.addEventListener('online', () => {
          this.online = true;
          if (this.storageRecoveryBlocked) return;
          if (this.calendarSyncFallbackActive && !this.calendarSyncRetryTimer) {
            this.scheduleCalendarSyncRetry({ automatic: true, silent: true, retryAttempt: 0 }, 1500, '網路連線已恢復');
          } else {
            this.scheduleInitialCalendarAutoSync(1500);
          }
        });
        window.addEventListener('offline', () => { this.online = false; });
        if (this.isIOSDevice && !this.isStandalone && localStorage.getItem('momo_ios_guide_dismissed') !== '1') {
          setTimeout(() => { this.showIosGuide = true; }, 1200);
        }

        // 關閉 Dropdown（點擊其他地方）
        window.addEventListener('click', (e) => {
          if (!e.target.closest('.relative')) {
            this.showDataTools = false;
          }
        });

        // iOS 鍵盤彈起時隱藏浮動導航，避免跑位遮住輸入框
        if (window.visualViewport) {
          const nav = () => [...document.querySelectorAll('.floating-nav')]
            .find(element => window.getComputedStyle(element).display !== 'none');
          this.iosViewportResizeHandler = () => {
            if (this.iosViewportRaf) cancelAnimationFrame(this.iosViewportRaf);
            this.iosViewportRaf = requestAnimationFrame(() => {
              const keyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;
              const el = nav();
              if (!el) return;
              if (keyboardOpen) {
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                el.style.transform = 'translateX(-50%) translateY(20px)';
              } else {
                el.style.opacity = '1';
                el.style.pointerEvents = '';
                el.style.transform = 'translateX(-50%)';
              }
            });
          };
          window.visualViewport.addEventListener('resize', this.iosViewportResizeHandler, { passive: true });
        }
      },
      beforeUnmount() {
        this.stopRuntimeMonitoring();
        if (this.cloudVersionPollTimer) clearInterval(this.cloudVersionPollTimer);
        if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
        if (this.calendarAutoSyncTimer) clearTimeout(this.calendarAutoSyncTimer);
        if (this.calendarSyncRetryTimer) clearTimeout(this.calendarSyncRetryTimer);
        if (this.headerSyncFeedbackTimer) clearTimeout(this.headerSyncFeedbackTimer);
        if (this.pwaAutoCheckTimer) clearTimeout(this.pwaAutoCheckTimer);
        if (this.pwaAutoCheckInterval) clearInterval(this.pwaAutoCheckInterval);
        if (this.startupSystemCheckTimer) clearTimeout(this.startupSystemCheckTimer);
        if (this.startupSystemCheckIdleHandle && 'cancelIdleCallback' in window) {
          window.cancelIdleCallback(this.startupSystemCheckIdleHandle);
        }
        if (this.iosViewportResizeHandler && window.visualViewport) window.visualViewport.removeEventListener('resize', this.iosViewportResizeHandler);
        if (this.iosViewportRaf) cancelAnimationFrame(this.iosViewportRaf);
        document.body.classList.remove('momo-ios-perf');
      },
      methods: {
        applyLocalRuntimeMonitorQaRoute() {
          if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return false;
          const params = new URLSearchParams(window.location.search);
          const runtimeMonitorCheck = params.get('runtime_monitor_check') === '1';
          const crmObservationCheck = params.get('crm_observation_check') === '1';
          const dataCorrectionCheck = params.get('data_correction_check') === '1';
          if (!runtimeMonitorCheck && !crmObservationCheck && !dataCorrectionCheck) return false;
          this.localQaRoute = dataCorrectionCheck ? 'data-correction' : crmObservationCheck ? 'crm-observation' : 'runtime-monitor';
          this.showAuthSheet = false;
          if (dataCorrectionCheck) {
            this.activeTab = 'safety';
            this.safetyMaintenanceSection = '';
            this.dataCorrectionFilter = 'all';
          } else if (crmObservationCheck) {
            this.activeTab = 'crm';
            this.crmViewMode = 'customers';
            this.crmShowInsights = true;
            this.crmSortMode = 'observation';
          } else {
            this.activeTab = 'safety';
            this.safetyMaintenanceSection = 'maintenance';
            this.safetyMaintenanceView = 'system';
          }
          return true;
        },
        scheduleStartupSystemCheck(delay = 8000) {
          if (this.startupSystemCheckTimer) clearTimeout(this.startupSystemCheckTimer);
          if (this.startupSystemCheckIdleHandle && 'cancelIdleCallback' in window) {
            window.cancelIdleCallback(this.startupSystemCheckIdleHandle);
          }
          const run = () => {
            this.startupSystemCheckTimer = null;
            this.startupSystemCheckIdleHandle = null;
            if (document.hidden) {
              this.startupSystemCheckTimer = setTimeout(() => this.scheduleStartupSystemCheck(0), 5000);
              return;
            }
            this.runSystemStatusCheck(false).catch(error => {
              console.warn('Startup system check skipped:', error);
            });
          };
          this.startupSystemCheckTimer = setTimeout(() => {
            this.startupSystemCheckTimer = null;
            if ('requestIdleCallback' in window) {
              this.startupSystemCheckIdleHandle = window.requestIdleCallback(run, { timeout: 6000 });
            } else {
              run();
            }
          }, Math.max(0, Number(delay) || 0));
        },
        scrollToTopForNavigation() {
          window.scrollTo({ top: 0, behavior: this.iosPerfMode ? 'auto' : 'smooth' });
        },
        scrollElementIntoViewForNavigation(element, options = {}) {
          if (!element) return;
          element.scrollIntoView({
            block: options.block || 'start',
            inline: options.inline || 'nearest',
            behavior: this.iosPerfMode ? 'auto' : 'smooth'
          });
        },
        inventorySafetyStock(item = {}) {
          const value = Number(item.minStock);
          return Number.isFinite(value) && value > 0 ? Math.round(value) : 3;
        },
        inventoryStockPercent(item = {}) {
          const stock = Math.max(0, Number(item.stock) || 0);
          return Math.min(100, Math.round((stock / this.inventorySafetyStock(item)) * 100));
        },
        isInventoryLow(item = {}) {
          const stock = Number(item.stock) || 0;
          return stock > 0 && stock < this.inventorySafetyStock(item);
        },
        calculateCloseoutForDate(date, openingCash = null) {
          const closeoutOrders = this.accountingOrders
            .filter(o => this.isOrderActive(o) && o.date === date && o.customerName && !this.isBlockedSlot(o.customerName));
          const closeoutExpenses = this.expenses.filter(e => e.date === date);
          const savedOpeningCash = this.closeoutRecords?.[date]?.openingCash;
          const resolvedOpeningCash = openingCash === null || openingCash === undefined
            ? savedOpeningCash
            : openingCash;
          return MomoCore.calculateCloseoutTotals(closeoutOrders, closeoutExpenses, {
            openingCash: resolvedOpeningCash
          });
        },
        getSettlementCloseoutForDate(date) {
          const live = this.calculateCloseoutForDate(date);
          const record = this.closeoutRecords?.[date];
          if (!record) {
            return {
              date,
              source: 'live',
              sourceLabel: '明細暫算',
              ...live
            };
          }

          const amount = value => Math.round(Number(value) || 0);
          const cash = amount(record.cash);
          const transfer = amount(record.transfer);
          const prepaidOut = amount(record.prepaidOut);
          const prepaidIn = amount(record.prepaidIn);
          const cashPrepaidIn = amount(record.cashPrepaidIn);
          const transferPrepaidIn = amount(record.transferPrepaidIn);
          const serviceRevenue = amount(record.serviceRevenue);
          const expenses = amount(record.expenses);
          const openingCash = amount(record.openingCash);
          const cashExpenses = record.cashExpenses === undefined || record.cashExpenses === null
            ? Math.max(0, live.cashExpenses)
            : Math.max(0, amount(record.cashExpenses));
          const netProfit = record.netProfit === undefined || record.netProfit === null
            ? serviceRevenue - expenses
            : amount(record.netProfit);
          const ordersCount = Math.max(0, amount(record.ordersCount));
          const rawTopupCount = record.topupCount;
          const rawServiceOrdersCount = record.serviceOrdersCount;
          const topupCount = rawTopupCount === undefined || rawTopupCount === null
            ? Math.max(0, live.topupCount)
            : Math.max(0, amount(rawTopupCount));
          const serviceOrdersCount = rawServiceOrdersCount === undefined || rawServiceOrdersCount === null
            || (ordersCount > 0 && amount(rawServiceOrdersCount) === 0 && amount(rawTopupCount) === 0 && live.serviceOrdersCount > 0)
            ? Math.max(0, ordersCount ? (ordersCount - topupCount || live.serviceOrdersCount) : live.serviceOrdersCount)
            : Math.max(0, amount(rawServiceOrdersCount));
          const actualCashIn = record.actualCashIn === undefined || record.actualCashIn === null
            ? cash + cashPrepaidIn
            : amount(record.actualCashIn);
          const expectedCash = record.expectedCash === undefined || record.expectedCash === null
            ? openingCash + actualCashIn - cashExpenses
            : amount(record.expectedCash);
          const countedCash = record.countedCash === undefined || record.countedCash === null
            ? expectedCash
            : amount(record.countedCash);

          return {
            date,
            source: 'snapshot',
            sourceLabel: '打烊快照',
            openingCash,
            cash,
            transfer,
            prepaidOut,
            prepaidIn,
            cashPrepaidIn,
            transferPrepaidIn,
            other: amount(record.other),
            serviceRevenue,
            actualCashIn,
            cashExpenses,
            expenses,
            netProfit,
            ordersCount,
            serviceOrdersCount,
            topupCount,
            expectedCash,
            countedCash,
            difference: record.difference === undefined || record.difference === null
              ? countedCash - expectedCash
              : amount(record.difference),
            note: record.note || '',
            completedAt: record.completedAt || null
          };
        },
        readRuntimeMemory() {
          const memory = typeof performance !== 'undefined' ? performance.memory : null;
          return {
            usedBytes: Math.max(0, Number(memory?.usedJSHeapSize) || 0),
            limitBytes: Math.max(0, Number(memory?.jsHeapSizeLimit) || 0),
            totalBytes: Math.max(0, Number(memory?.totalJSHeapSize) || 0)
          };
        },
        inferRuntimeCause() {
          if (this.syncing) return { cause: 'calendar_sync', causeLabel: 'Google Calendar 同步' };
          if (this.cloudSyncInFlight) return { cause: 'cloud_sync', causeLabel: 'Supabase 雲端同步' };
          if (['loading', 'saving', 'restoring'].includes(this.cloudBackupStatus) || this.backupStatus === 'saving') {
            return { cause: 'cloud_backup', causeLabel: '雲端備份處理' };
          }
          if (this.safetyChecking) return { cause: 'safety_check', causeLabel: '資料安全檢查' };
          if (this.pwaCheckingUpdate || this.pwaUpdateApplying) return { cause: 'app_update', causeLabel: 'App 更新檢查' };
          if (this.activeTab === 'crm') return { cause: 'crm_render', causeLabel: '顧客 CRM 畫面重算' };
          if (this.activeTab === 'report') return { cause: 'report_render', causeLabel: '報表畫面重算' };
          return { cause: 'unknown', causeLabel: '背景工作或瀏覽器資源不足' };
        },
        normalizeRuntimeDiagnosticMeta(meta = {}) {
          try {
            const json = JSON.stringify(meta, (key, value) => {
              if (/password|token|authorization|publishablekey|apikey/i.test(key)) return '[redacted]';
              if (typeof value === 'string') {
                return value
                  .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [redacted]')
                  .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-jwt]')
                  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
                  .slice(0, 600);
              }
              if (typeof value === 'bigint') return Number(value);
              return value;
            });
            return json ? JSON.parse(json) : {};
          } catch (error) {
            return { metaError: String(error?.message || error).slice(0, 160) };
          }
        },
        captureRuntimeContext(extra = {}) {
          const liveMemory = this.readRuntimeMemory();
          const memory = this.runtimeHealthSample?.supported ? this.runtimeHealthSample : MomoCore.classifyMemoryPressure(liveMemory);
          return this.normalizeRuntimeDiagnosticMeta({
            appVersion: this.appVersion,
            sessionId: this.runtimeSessionId || null,
            page: this.activeTab,
            visible: !document.hidden,
            online: navigator.onLine,
            standalone: this.isStandalone,
            deviceMemoryGb: Number(navigator.deviceMemory) || null,
            hardwareConcurrency: Number(navigator.hardwareConcurrency) || null,
            dataCount: this.localDataCount,
            ordersCount: this.orders?.length || 0,
            customersCount: this.customers?.length || 0,
            prepaidLedgerCount: this.prepaidLedger?.length || 0,
            syncing: Boolean(this.syncing),
            calendarSyncStatus: this.calendarAutoSyncStatus,
            cloudStatus: this.cloudStatus,
            cloudSyncInFlight: Boolean(this.cloudSyncInFlight),
            cloudBackupStatus: this.cloudBackupStatus,
            safetyChecking: Boolean(this.safetyChecking),
            memorySupported: Boolean(memory.supported),
            heapUsedBytes: liveMemory.usedBytes,
            heapLimitBytes: liveMemory.limitBytes,
            heapPercent: memory.percent,
            ...this.inferRuntimeCause(),
            ...extra
          });
        },
        recordRuntimeDiagnostic(category, tone, message, meta = {}) {
          const entry = {
            id: this.generateStableId('diag'),
            at: new Date().toISOString(),
            category: ['startup', 'sync', 'update', 'performance', 'memory', 'error'].includes(category) ? category : 'error',
            tone: ['ok', 'info', 'warning', 'error'].includes(tone) ? tone : 'info',
            message: String(message || '').slice(0, 180),
            meta: this.captureRuntimeContext(meta)
          };
          this.runtimeDiagnostics = [
            entry,
            ...(Array.isArray(this.runtimeDiagnostics) ? this.runtimeDiagnostics : [])
          ].slice(0, 50);
          try {
            localStorage.setItem('momo_runtime_diagnostics', JSON.stringify(this.runtimeDiagnostics));
          } catch (error) {
            this.runtimeDiagnostics = this.runtimeDiagnostics.slice(0, 12);
            try { localStorage.setItem('momo_runtime_diagnostics', JSON.stringify(this.runtimeDiagnostics)); }
            catch (_) {}
          }
          return entry;
        },
        recordRuntimeAnomaly(category, tone, message, meta = {}, cooldownMs = 60000) {
          const now = Date.now();
          const dedupeKey = String(meta.dedupeKey || `${category}:${message}`).slice(0, 120);
          const previousAt = Number(this.runtimeLastAnomalyAt?.[dedupeKey]) || 0;
          if (previousAt && now - previousAt < Math.max(1000, Number(cooldownMs) || 0)) return null;
          this.runtimeLastAnomalyAt = { ...(this.runtimeLastAnomalyAt || {}), [dedupeKey]: now };
          const entry = this.recordRuntimeDiagnostic(category, tone, message, { ...meta, dedupeKey });
          if (this.runtimeSessionState && entry) {
            this.runtimeSessionState = {
              ...this.runtimeSessionState,
              lastAnomaly: { at: entry.at, category: entry.category, tone: entry.tone, message: entry.message, meta: entry.meta }
            };
            try { localStorage.setItem(this.runtimeSessionStorageKey(), JSON.stringify(this.runtimeSessionState)); }
            catch (_) {}
          }
          return entry;
        },
        runtimeDiagnosticLabel(category) {
          return {
            startup: '啟動',
            sync: '同步',
            update: 'App 更新',
            performance: '網頁卡頓',
            memory: '記憶體',
            error: '程式錯誤'
          }[category] || '系統';
        },
        recordCloudSyncFailure(operation, error, meta = {}) {
          return this.recordRuntimeAnomaly('sync', 'error', `${operation}失敗，本機資料已保留`, {
            syncTarget: 'supabase',
            operation,
            error: String(error?.message || error || '未知錯誤').slice(0, 500),
            errorName: error?.name || null,
            status: Number(error?.status) || Number(error?.code) || null,
            stack: String(error?.stack || '').slice(0, 1200),
            cause: 'cloud_sync',
            causeLabel: 'Supabase 雲端同步',
            dedupeKey: `cloud:${operation}:${String(error?.message || error).slice(0, 80)}`,
            ...meta
          }, 60000);
        },
        runtimeDiagnosticMetaText(row = {}) {
          const meta = row.meta || {};
          const pieces = [];
          if (meta.causeLabel) pieces.push(`可能原因：${meta.causeLabel}`);
          if (Number(meta.stallMs) > 0) pieces.push(`卡頓 ${(Number(meta.stallMs) / 1000).toFixed(1)} 秒`);
          if (meta.heapPercent !== null && meta.heapPercent !== undefined && Number.isFinite(Number(meta.heapPercent))) {
            pieces.push(`記憶體 ${Number(meta.heapPercent)}%`);
          }
          if (meta.status) pieces.push(`狀態 ${meta.status}`);
          if (meta.page) pieces.push(`頁面 ${meta.page}`);
          if (Number(meta.dataCount) >= 0) pieces.push(`資料 ${Number(meta.dataCount)} 筆`);
          return pieces.slice(0, 5).join(' · ');
        },
        runtimeSessionStorageKey() {
          return 'momo_runtime_session';
        },
        beginRuntimeSession() {
          const previous = safeParse(localStorage.getItem(this.runtimeSessionStorageKey()), null);
          const previousState = MomoCore.evaluatePreviousRuntimeSession(previous);
          const navigationType = performance.getEntriesByType?.('navigation')?.[0]?.type || 'navigate';
          this.runtimeSessionId = this.generateStableId('session');
          const now = new Date().toISOString();
          this.runtimeSessionState = {
            id: this.runtimeSessionId,
            startedAt: now,
            lastHeartbeatAt: now,
            closedCleanly: false,
            lastSnapshot: this.captureRuntimeContext({ cause: 'session_start', causeLabel: 'App 啟動' })
          };
          this.persistRuntimeSession();
          if (previousState.unclean) {
            const reloaded = navigationType === 'reload';
            this.recordRuntimeDiagnostic('startup', reloaded ? 'info' : 'warning', reloaded
              ? '上次頁面重新載入，已保留重新載入前最後狀態'
              : '上次頁面可能異常關閉，已保留崩潰前最後狀態', {
              ...(previous?.lastSnapshot || {}),
              previousSessionId: previous?.id || null,
              previousAnomaly: previous?.lastAnomaly || null,
              lastHeartbeatAt: previous?.lastHeartbeatAt || null,
              uncleanAgeSeconds: Math.round((previousState.ageMs || 0) / 1000),
              navigationType,
              cause: 'unclean_shutdown',
              causeLabel: reloaded ? '瀏覽器重新載入' : '分頁崩潰、記憶體不足或強制關閉',
              dedupeKey: `unclean:${previous?.id || previous?.startedAt || 'unknown'}`
            });
          }
        },
        persistRuntimeSession(extra = {}) {
          if (!this.runtimeSessionState) return;
          const now = new Date().toISOString();
          this.runtimeSessionState = {
            ...this.runtimeSessionState,
            ...extra,
            lastHeartbeatAt: now,
            lastSnapshot: this.captureRuntimeContext(extra.lastSnapshot || {})
          };
          try { localStorage.setItem(this.runtimeSessionStorageKey(), JSON.stringify(this.runtimeSessionState)); }
          catch (_) {}
        },
        closeRuntimeSession(reason = 'pagehide') {
          if (!this.runtimeSessionState) return;
          this.runtimeSessionState = {
            ...this.runtimeSessionState,
            closedCleanly: true,
            endedAt: new Date().toISOString(),
            endReason: reason,
            lastSnapshot: this.captureRuntimeContext({ cause: 'clean_shutdown', causeLabel: '正常關閉頁面' })
          };
          try { localStorage.setItem(this.runtimeSessionStorageKey(), JSON.stringify(this.runtimeSessionState)); }
          catch (_) {}
        },
        sampleRuntimeMemory({ record = true } = {}) {
          const now = Date.now();
          const current = this.readRuntimeMemory();
          const previous = this.runtimeHealthSample || {};
          const sample = MomoCore.classifyMemoryPressure({
            ...current,
            previousUsedBytes: previous.usedBytes,
            elapsedMs: previous.sampledAt ? now - previous.sampledAt : 0
          });
          this.runtimeHealthSample = { ...sample, totalBytes: current.totalBytes, sampledAt: now };
          if (record && ['warning', 'error'].includes(sample.severity)) {
            const rapidlyGrowing = String(sample.reason).startsWith('rapid_growth');
            this.recordRuntimeAnomaly(
              'memory',
              sample.severity,
              rapidlyGrowing ? '記憶體在短時間內快速增加' : `網頁記憶體使用已達 ${sample.percent || 0}%`,
              {
                heapUsedBytes: sample.usedBytes,
                heapLimitBytes: sample.limitBytes,
                heapPercent: sample.percent,
                growthBytes: sample.growthBytes,
                memoryReason: sample.reason,
                dedupeKey: 'memory_pressure'
              },
              5 * 60 * 1000
            );
          }
          return this.runtimeHealthSample;
        },
        runRuntimeHeartbeat() {
          const now = performance.now();
          const lagMs = this.runtimeMonitorExpectedAt ? Math.max(0, now - this.runtimeMonitorExpectedAt) : 0;
          const stall = MomoCore.classifyMainThreadStall(lagMs, { visible: !document.hidden });
          this.runtimeMonitorTick += 1;
          if (stall.detected) {
            this.recordRuntimeAnomaly('performance', stall.severity, `網頁主畫面曾卡住約 ${(stall.lagMs / 1000).toFixed(1)} 秒`, {
              stallMs: Math.round(stall.lagMs),
              monitor: 'heartbeat',
              dedupeKey: 'main_thread_stall'
            }, 60000);
          }
          if (this.runtimeMonitorTick % 6 === 0) this.sampleRuntimeMemory({ record: true });
          if (this.runtimeMonitorTick % 3 === 0) this.persistRuntimeSession();
          this.runtimeMonitorExpectedAt = performance.now() + 5000;
          this.runtimeMonitorTimer = setTimeout(() => this.runRuntimeHeartbeat(), 5000);
        },
        startRuntimeMonitoring() {
          if (this.runtimeMonitorTimer) return;
          this.runtimeMonitorStartedAt = new Date().toISOString();
          this.beginRuntimeSession();
          this.sampleRuntimeMemory({ record: true });

          this.runtimeErrorHandler = event => {
            const target = event?.target;
            const resourceUrl = target && target !== window ? (target.currentSrc || target.src || target.href || '') : '';
            const rawMessage = String(event?.message || (resourceUrl ? `資源載入失敗：${resourceUrl}` : '瀏覽器回報未知錯誤'));
            const memoryError = /out of memory|not enough memory|allocation failed|memory limit/i.test(rawMessage);
            this.recordRuntimeAnomaly(memoryError ? 'memory' : 'error', 'error', memoryError ? '瀏覽器回報記憶體不足' : rawMessage, {
              errorName: event?.error?.name || null,
              filename: event?.filename || resourceUrl || null,
              line: Number(event?.lineno) || null,
              column: Number(event?.colno) || null,
              stack: String(event?.error?.stack || '').slice(0, 1200),
              dedupeKey: `${memoryError ? 'oom' : 'window_error'}:${rawMessage.slice(0, 80)}`
            }, 60000);
          };
          this.runtimeRejectionHandler = event => {
            const reason = event?.reason;
            const message = String(reason?.message || reason || '未處理的非同步錯誤');
            const memoryError = /out of memory|not enough memory|allocation failed|memory limit/i.test(message);
            this.recordRuntimeAnomaly(memoryError ? 'memory' : 'error', 'error', memoryError ? '非同步工作發生記憶體不足' : message, {
              errorName: reason?.name || null,
              stack: String(reason?.stack || '').slice(0, 1200),
              dedupeKey: `${memoryError ? 'oom_rejection' : 'promise_rejection'}:${message.slice(0, 80)}`
            }, 60000);
          };
          this.runtimeVisibilityHandler = () => {
            this.runtimeMonitorExpectedAt = performance.now() + 5000;
            if (!document.hidden) this.persistRuntimeSession({ closedCleanly: false });
          };
          this.runtimePageHideHandler = () => this.closeRuntimeSession('pagehide');
          this.runtimePageShowHandler = () => this.persistRuntimeSession({ closedCleanly: false, endedAt: null, endReason: null });
          this.runtimeMemoryPressureHandler = () => {
            const sample = this.sampleRuntimeMemory({ record: false });
            this.recordRuntimeAnomaly('memory', 'error', '瀏覽器發出記憶體壓力警告', {
              heapPercent: sample.percent,
              dedupeKey: 'browser_memory_pressure'
            }, 5 * 60 * 1000);
          };
          window.addEventListener('error', this.runtimeErrorHandler, true);
          window.addEventListener('unhandledrejection', this.runtimeRejectionHandler);
          document.addEventListener('visibilitychange', this.runtimeVisibilityHandler);
          window.addEventListener('pagehide', this.runtimePageHideHandler);
          window.addEventListener('beforeunload', this.runtimePageHideHandler);
          window.addEventListener('pageshow', this.runtimePageShowHandler);
          window.addEventListener('memorypressure', this.runtimeMemoryPressureHandler);

          if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
            try {
              this.runtimeLongTaskStats = { windowStartedAt: Date.now(), count: 0, totalMs: 0, maxMs: 0 };
              this.runtimeLongTaskObserver = new PerformanceObserver(list => {
                const now = Date.now();
                if (!this.runtimeLongTaskStats || now - this.runtimeLongTaskStats.windowStartedAt > 30000) {
                  this.runtimeLongTaskStats = { windowStartedAt: now, count: 0, totalMs: 0, maxMs: 0 };
                }
                list.getEntries().forEach(entry => {
                  this.runtimeLongTaskStats.count += 1;
                  this.runtimeLongTaskStats.totalMs += Number(entry.duration) || 0;
                  this.runtimeLongTaskStats.maxMs = Math.max(this.runtimeLongTaskStats.maxMs, Number(entry.duration) || 0);
                });
                const stats = this.runtimeLongTaskStats;
                if (!document.hidden && (stats.maxMs >= 1200 || stats.totalMs >= 2500)) {
                  this.recordRuntimeAnomaly('performance', stats.maxMs >= 5000 ? 'error' : 'warning', '網頁在短時間內執行過多工作', {
                    stallMs: Math.round(stats.maxMs),
                    longTaskCount: stats.count,
                    longTaskTotalMs: Math.round(stats.totalMs),
                    monitor: 'longtask',
                    dedupeKey: 'main_thread_stall'
                  }, 60000);
                  this.runtimeLongTaskStats = { windowStartedAt: now, count: 0, totalMs: 0, maxMs: 0 };
                }
              });
              this.runtimeLongTaskObserver.observe({ type: 'longtask', buffered: false });
            } catch (error) {
              this.runtimeLongTaskObserver = null;
            }
          }
          this.runtimeMonitorExpectedAt = performance.now() + 5000;
          this.runtimeMonitorTimer = setTimeout(() => this.runRuntimeHeartbeat(), 5000);
        },
        stopRuntimeMonitoring() {
          if (this.runtimeMonitorTimer) clearTimeout(this.runtimeMonitorTimer);
          this.runtimeMonitorTimer = null;
          if (this.runtimeLongTaskObserver) this.runtimeLongTaskObserver.disconnect();
          this.runtimeLongTaskObserver = null;
          if (this.runtimeErrorHandler) window.removeEventListener('error', this.runtimeErrorHandler, true);
          if (this.runtimeRejectionHandler) window.removeEventListener('unhandledrejection', this.runtimeRejectionHandler);
          if (this.runtimeVisibilityHandler) document.removeEventListener('visibilitychange', this.runtimeVisibilityHandler);
          if (this.runtimePageHideHandler) window.removeEventListener('pagehide', this.runtimePageHideHandler);
          if (this.runtimePageHideHandler) window.removeEventListener('beforeunload', this.runtimePageHideHandler);
          if (this.runtimePageShowHandler) window.removeEventListener('pageshow', this.runtimePageShowHandler);
          if (this.runtimeMemoryPressureHandler) window.removeEventListener('memorypressure', this.runtimeMemoryPressureHandler);
          this.closeRuntimeSession('app_unmount');
        },
        async runRuntimeMonitorCheck(showResult = true) {
          const sample = this.sampleRuntimeMemory({ record: true });
          let storage = null;
          try {
            if (navigator.storage?.estimate) {
              const estimate = await navigator.storage.estimate();
              storage = { usageBytes: Number(estimate.usage) || 0, quotaBytes: Number(estimate.quota) || 0 };
            }
          } catch (_) {}
          this.persistRuntimeSession({ lastSnapshot: { storage } });
          if (showResult) {
            const message = sample.severity === 'error'
              ? `記憶體使用 ${sample.percent || 0}%，建議先關閉其他分頁`
              : sample.severity === 'warning'
                ? `記憶體使用 ${sample.percent || 0}%，系統會持續觀察`
                : sample.supported
                  ? `監控正常，記憶體使用 ${sample.percent || 0}%`
                  : '監控正常；此瀏覽器不提供記憶體百分比';
            this.showToast(message, sample.severity === 'error' ? 'error' : sample.severity === 'warning' ? 'warning' : 'success', 7000);
          }
          return { sample, storage };
        },
        async exportRuntimeDiagnostics() {
          const current = await this.runRuntimeMonitorCheck(false);
          const report = {
            reportVersion: 1,
            generatedAt: new Date().toISOString(),
            appVersion: this.appVersion,
            environment: {
              userAgent: navigator.userAgent,
              language: navigator.language,
              deviceMemoryGb: Number(navigator.deviceMemory) || null,
              hardwareConcurrency: Number(navigator.hardwareConcurrency) || null,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              standalone: this.isStandalone
            },
            current: this.captureRuntimeContext({ storage: current.storage }),
            session: this.runtimeSessionState,
            diagnostics: this.runtimeDiagnosticRows
          };
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `MOMO系統診斷_${new Date().toLocaleDateString('sv-SE')}.json`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 0);
          this.recordRuntimeDiagnostic('startup', 'info', '已匯出系統診斷報告', { cause: 'manual_export', causeLabel: '手動匯出診斷' });
          this.showToast('系統診斷報告已下載；不包含業績明細、顧客清單或登入資料');
        },
        recordOperation(action, label, detail = '', meta = {}) {
          const log = {
            id: this.generateStableId('log'),
            at: new Date().toISOString(),
            action,
            label,
            detail: String(detail || ''),
            meta
          };
          this.operationLogs = [log, ...(Array.isArray(this.operationLogs) ? this.operationLogs : [])].slice(0, 300);
          localStorage.setItem('momo_operation_logs', JSON.stringify(this.operationLogs));
          this.maybeCreateAutoSnapshotForOperation(log);
          this.maybeCreateCloudBackupForOperation(log);
          return log;
        },
        backupReasonLabel(reason = 'manual') {
          const labels = {
            manual: '手動快照',
            closeout: '打烊後快照',
            locked_correction: '鎖帳更正單',
            locked_delete_correction: '鎖帳刪除沖銷',
            prepaid_reversal: '儲值沖銷',
            monthly_settlement: '月結匯出',
            backup_import: '匯入還原',
            pre_restore: '還原前保護',
            service_config: '價目表更新',
            cloud_restore: '雲端備份還原'
          };
          return labels[reason] || reason || '系統快照';
        },
        maybeCreateAutoSnapshotForOperation(log = {}) {
          const reasonByAction = {
            closeout_save: 'closeout',
            locked_order_correction_slip: 'locked_correction',
            locked_order_delete_correction_slip: 'locked_delete_correction',
            prepaid_ledger_reversal: 'prepaid_reversal',
            monthly_settlement_export: 'monthly_settlement',
            backup_import: 'backup_import',
            service_config_update: 'service_config'
          };
          const reason = reasonByAction[log.action];
          if (!reason) return null;
          return this.createLocalBackupSnapshot(reason, { silent: true, force: true, sourceLogId: log.id });
        },
        maybeCreateCloudBackupForOperation(log = {}) {
          const criticalActions = new Set([
            'closeout_save',
            'locked_order_correction_slip',
            'locked_order_delete_correction_slip',
            'prepaid_ledger_reversal',
            'monthly_settlement_export',
            'service_config_update',
            'backup_import',
            'backup_snapshot_restore',
            'cloud_backup_restore'
          ]);
          if (!criticalActions.has(log.action)) return false;
          if (!this.cloudReady || !this.authUser || !this.authSession?.access_token || this.backupStatus === 'saving') return false;
          setTimeout(() => this.createAutomaticBackup({ force: true, silent: true }), 500);
          return true;
        },
        persistBackupSnapshots(snapshots = []) {
          const normalized = snapshots
            .filter(snapshot => snapshot?.id && snapshot?.createdAt && snapshot?.payload)
            .slice(0, 3);
          let lastError = null;
          for (let keep = normalized.length; keep >= 1; keep -= 1) {
            const candidate = normalized.slice(0, keep);
            try {
              localStorage.setItem('momo_backup_snapshots', JSON.stringify(candidate));
              this.backupSnapshots = markRaw(candidate);
              return candidate;
            } catch (error) {
              lastError = error;
            }
          }
          if (!normalized.length) {
            localStorage.setItem('momo_backup_snapshots', '[]');
            this.backupSnapshots = markRaw([]);
            return [];
          }
          throw lastError || new Error('本機快照容量不足');
        },
        createLocalBackupSnapshot(reason = 'manual', { silent = false, force = true, sourceLogId = null } = {}) {
          if (!force && this.backupSnapshotRows[0]?.createdDate === new Date().toLocaleDateString('sv-SE')) return this.backupSnapshotRows[0];
          const createdAt = new Date().toISOString();
          const payload = this.buildBackupData();
          let sizeBytes = 0;
          try { sizeBytes = new Blob([JSON.stringify(payload)]).size; }
          catch (error) { sizeBytes = 0; }
          const integrity = this.runIntegrityCheck(false);
          const snapshot = {
            id: this.generateStableId('snap'),
            createdAt,
            createdDate: new Date().toLocaleDateString('sv-SE'),
            appVersion: this.appVersion,
            schemaVersion: this.dataSchemaVersion,
            reason,
            sourceLogId,
            counts: integrity.counts,
            integrityStatus: integrity.status,
            errorCount: integrity.errorCount,
            warningCount: integrity.warningCount,
            sizeBytes,
            payload
          };
          const previous = Array.isArray(this.backupSnapshots) ? [...this.backupSnapshots] : [];
          try {
            this.persistBackupSnapshots([snapshot, ...previous]);
            this.lastBackupAt = createdAt;
            localStorage.setItem('momo_last_backup_at', createdAt);
            this.backupStatus = 'ready';
            this.runDataSafetyCheck(false);
            if (!silent) this.showToast(`${this.backupReasonLabel(reason)}已建立`);
            return snapshot;
          } catch (error) {
            console.warn('Local snapshot failed:', error);
            this.backupSnapshots = markRaw(previous);
            this.backupStatus = 'error';
            if (!silent) this.showToast('本機快照建立失敗，請先下載 JSON 備份或清理舊快照', 'error', 7000);
            return null;
          }
        },
        downloadBackupSnapshot(snapshot) {
          if (!snapshot?.payload) {
            this.showToast('找不到快照內容', 'error');
            return;
          }
          const blob = new Blob([JSON.stringify(snapshot.payload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `MOMO本機快照_${snapshot.createdDate || new Date().toLocaleDateString('sv-SE')}_${snapshot.reason || 'snapshot'}.json`;
          link.click();
          URL.revokeObjectURL(url);
          this.showToast('快照 JSON 已下載');
        },
        restoreBackupSnapshot(snapshot) {
          if (!snapshot?.payload) {
            this.showToast('找不到快照內容', 'error');
            return;
          }
          this.showConfirm(`確定還原這份本機快照嗎？\n\n${this.formatDateTime(snapshot.createdAt)} · ${this.backupReasonLabel(snapshot.reason)}\n\n系統會先建立一份還原前保護快照，再覆蓋目前業績、CRM、儲值帳本、支出、庫存、打烊與價目表資料。`, () => {
            try {
              const protection = this.createLocalBackupSnapshot('pre_restore', { silent: true, force: true });
              if (!protection) throw new Error('無法建立還原前保護快照');
              const servicesIncluded = this.applyBackupData(snapshot.payload, { source: 'local_snapshot_restore' });
              this.recordOperation('backup_snapshot_restore', '還原本機快照', `${this.formatDateTime(snapshot.createdAt)} · ${this.backupReasonLabel(snapshot.reason)}`, { snapshotId: snapshot.id, servicesIncluded });
              this.activeTab = 'safety';
              const pendingMessage = this.cloudRestorePending
                ? '本機快照已還原；為避免雲端舊資料回灌，同步已暫停'
                : null;
              this.showToast(pendingMessage || (servicesIncluded ? '本機快照已還原' : '本機快照已還原，但原快照不含價目表'), pendingMessage || !servicesIncluded ? 'warning' : 'success', 8000);
            } catch (error) {
              this.showToast(`快照還原失敗：${error.message}`, 'error', 8000);
            }
          }, { title: '還原本機快照', subtitle: '目前資料將由快照內容取代', tone: 'danger', confirmLabel: '確認還原', loadingLabel: '還原中…' });
        },
        deleteBackupSnapshot(snapshotId) {
          if (!snapshotId) return;
          const snapshot = this.backupSnapshots.find(item => item.id === snapshotId);
          this.showConfirm(`確定刪除這份本機快照嗎？\n\n${snapshot ? `${this.formatDateTime(snapshot.createdAt)} · ${this.backupReasonLabel(snapshot.reason)}` : snapshotId}`, () => {
            this.persistBackupSnapshots(this.backupSnapshots.filter(item => item.id !== snapshotId));
            this.runDataSafetyCheck(false);
            this.showToast('本機快照已刪除');
          }, { title: '刪除本機快照', subtitle: '刪除後無法從清單復原', tone: 'danger', confirmLabel: '刪除快照', loadingLabel: '刪除中…' });
        },
        normalizeCloudBackupRow(row = {}) {
          const counts = row.record_counts || row.counts || {};
          const integrity = row.integrity || {};
          const createdAt = row.created_at || row.createdAt || row.backup_date || row.backupDate || '';
          const backupDate = row.backup_date || row.backupDate || String(createdAt).slice(0, 10);
          const errorCount = Number(integrity.errorCount ?? integrity.error_count ?? row.errorCount ?? 0) || 0;
          const warningCount = Number(integrity.warningCount ?? integrity.warning_count ?? row.warningCount ?? 0) || 0;
          const integrityStatus = integrity.status || row.integrityStatus || (errorCount ? 'error' : warningCount ? 'warning' : 'ok');
          let sizeBytes = 0;
          try { if (row.payload) sizeBytes = new Blob([JSON.stringify(row.payload)]).size; }
          catch (error) { sizeBytes = 0; }
          return {
            id: row.id,
            backupDate,
            createdAt,
            schemaVersion: Number(row.schema_version ?? row.schemaVersion ?? this.dataSchemaVersion) || this.dataSchemaVersion,
            counts,
            integrity,
            integrityStatus,
            errorCount,
            warningCount,
            payload: row.payload || null,
            totalRecords: Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0),
            sizeBytes,
            sizeText: sizeBytes ? this.formatBytes(sizeBytes) : '雲端保存',
            tone: integrityStatus === 'error' ? 'error' : integrityStatus === 'warning' ? 'warn' : 'ok'
          };
        },
        persistCloudBackups(rows = []) {
          const metadata = (Array.isArray(rows) ? rows : []).map(row => {
            const copy = { ...row };
            delete copy.payload;
            return copy;
          }).slice(0, 60);
          this.cloudBackups = metadata;
          localStorage.setItem('momo_cloud_backups', JSON.stringify(metadata));
          this.cloudBackupsLoadedAt = new Date().toISOString();
          localStorage.setItem('momo_cloud_backups_loaded_at', this.cloudBackupsLoadedAt);
          const latest = metadata
            .map(row => row.created_at || row.createdAt)
            .filter(Boolean)
            .sort()
            .pop();
          if (latest) {
            this.lastCloudBackupAt = latest;
            localStorage.setItem('momo_last_cloud_backup_at', latest);
          }
          return metadata;
        },
        async fetchCloudBackupList({ silent = true, refreshSafety = true } = {}) {
          if (!this.authUser || !this.authSession?.access_token) {
            this.cloudBackups = [];
            this.cloudBackupStatus = 'idle';
            if (!silent) this.showToast('請先登入雲端帳號', 'error');
            return [];
          }
          if (this.cloudBackupStatus === 'loading') return this.cloudBackupRows;
          this.cloudBackupStatus = 'loading';
          this.cloudBackupError = '';
          try {
            const rows = await this.cloudRequest('data_backups', {
              query: [
                'select=id,backup_date,schema_version,record_counts,integrity,created_at',
                `owner_id=eq.${encodeURIComponent(this.authUser.id)}`,
                'order=backup_date.desc,created_at.desc',
                'limit=90'
              ].join('&')
            });
            this.persistCloudBackups(Array.isArray(rows) ? rows : []);
            this.cloudBackupStatus = 'ready';
            if (refreshSafety) this.runDataSafetyCheck(false);
            if (!silent) {
              this.showToast(this.cloudBackups.length ? `已載入 ${this.cloudBackups.length} 份雲端備份` : '雲端目前沒有備份', this.cloudBackups.length ? 'success' : 'info');
            }
            return this.cloudBackupRows;
          } catch (error) {
            console.error('Cloud backup list failed:', error);
            this.cloudBackupStatus = 'error';
            this.cloudBackupError = error.message || '雲端備份清單讀取失敗';
            this.recordCloudSyncFailure('讀取雲端備份清單', error);
            if (refreshSafety) this.runDataSafetyCheck(false);
            if (!silent) this.showToast(`雲端備份讀取失敗：${this.cloudBackupError}`, 'error', 8000);
            return [];
          }
        },
        async fetchCloudBackupPayload(backup) {
          const row = this.normalizeCloudBackupRow(backup);
          if (row.payload) return row;
          if (!row.id && !row.backupDate) throw new Error('找不到雲端備份索引');
          const filters = [
            'select=id,backup_date,schema_version,payload,record_counts,integrity,created_at',
            `owner_id=eq.${encodeURIComponent(this.authUser.id)}`
          ];
          if (row.id) filters.push(`id=eq.${encodeURIComponent(row.id)}`);
          else filters.push(`backup_date=eq.${encodeURIComponent(row.backupDate)}`);
          filters.push('limit=1');
          const rows = await this.cloudRequest('data_backups', { query: filters.join('&') });
          const found = Array.isArray(rows) ? rows[0] : null;
          if (!found?.payload) throw new Error('雲端備份內容不存在');
          return this.normalizeCloudBackupRow(found);
        },
        async downloadCloudBackupSnapshot(backup) {
          if (!this.authUser || !this.authSession?.access_token) {
            this.showToast('請先登入雲端帳號', 'error');
            return;
          }
          try {
            const full = await this.fetchCloudBackupPayload(backup);
            const blob = new Blob([JSON.stringify(full.payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `MOMO雲端備份_${full.backupDate || new Date().toLocaleDateString('sv-SE')}.json`;
            link.click();
            URL.revokeObjectURL(url);
            this.showToast('雲端備份 JSON 已下載');
          } catch (error) {
            this.showToast(`雲端備份下載失敗：${error.message}`, 'error', 8000);
          }
        },
        backupRestoreCountLabels() {
          return [
            { key: 'customers', label: '顧客' },
            { key: 'orders', label: '業績' },
            { key: 'prepaidLedger', label: '儲值帳本' },
            { key: 'expenses', label: '支出' },
            { key: 'inventory', label: '庫存' },
            { key: 'closeouts', label: '打烊紀錄' },
            { key: 'serviceConfigs', label: '價目表' },
            { key: 'operationLogs', label: '操作紀錄' }
          ];
        },
        backupComparableCounts(data = null) {
          const source = data || this.buildBackupData();
          return {
            customers: Array.isArray(source.momo_customers) ? source.momo_customers.length : 0,
            orders: Array.isArray(source.momo_orders) ? source.momo_orders.length : 0,
            prepaidLedger: Array.isArray(source.momo_prepaidLedger) ? source.momo_prepaidLedger.length : 0,
            expenses: Array.isArray(source.momo_expenses) ? source.momo_expenses.length : 0,
            inventory: Array.isArray(source.momo_inventory) ? source.momo_inventory.length : 0,
            closeouts: source.momo_closeoutRecords ? Object.keys(source.momo_closeoutRecords || {}).length : 0,
            serviceConfigs: Array.isArray(source.momo_servicesConfig) ? source.momo_servicesConfig.length : 0,
            operationLogs: Array.isArray(source.momo_operationLogs) ? source.momo_operationLogs.length : 0
          };
        },
        businessRestoreTotal(counts = {}) {
          return ['customers', 'orders', 'prepaidLedger', 'expenses', 'inventory']
            .reduce((sum, key) => sum + (Number(counts[key]) || 0), 0);
        },
        buildCloudRestorePreview(full = {}) {
          const localCounts = this.backupComparableCounts();
          const backupCounts = this.backupComparableCounts(full.payload || {});
          const labels = this.backupRestoreCountLabels();
          const rows = labels.map(item => {
            const local = Number(localCounts[item.key]) || 0;
            const backup = Number(backupCounts[item.key]) || 0;
            return {
              ...item,
              local,
              backup,
              delta: backup - local
            };
          });
          const warnings = [];
          const addWarning = (severity, code, message) => warnings.push({ severity, code, message });
          const localTotal = this.businessRestoreTotal(localCounts);
          const backupTotal = this.businessRestoreTotal(backupCounts);
          const validation = MomoCore.validateAndNormalizeBackupPayload(full.payload || {}, {
            currentSchemaVersion: this.dataSchemaVersion
          });
          validation.errors.forEach((message, index) => addWarning('error', `backup_invalid_${index + 1}`, message));
          validation.warnings.forEach((message, index) => addWarning('warning', `backup_warning_${index + 1}`, message));

          if ((Number(full.schemaVersion) || 1) < this.dataSchemaVersion) {
            addWarning('warning', 'schema_old', `這份備份 schema v${full.schemaVersion || 1} 低於目前 v${this.dataSchemaVersion}，還原後會用相容模式載入。`);
          }
          if (!Array.isArray(full.payload?.momo_servicesConfig)) {
            addWarning('warning', 'service_config_missing', '這份備份不含價目表；還原後會保留目前價目表。');
          }
          if (localTotal >= 20 && backupTotal > 0 && backupTotal < Math.floor(localTotal * 0.9)) {
            addWarning('warning', 'business_total_drop', `備份業務資料 ${backupTotal} 筆，低於目前 ${localTotal} 筆，請確認是否要回到較舊狀態。`);
          }
          rows
            .filter(row => ['customers', 'orders', 'prepaidLedger', 'expenses'].includes(row.key))
            .forEach(row => {
              if (row.local >= 20 && row.backup <= row.local - 5 && row.backup < Math.floor(row.local * 0.85)) {
                addWarning('warning', `${row.key}_drop`, `${row.label}將從 ${row.local} 筆變成 ${row.backup} 筆。`);
              }
            });
          if (!full.payload?.momo_orders || !full.payload?.momo_customers) {
            addWarning('error', 'required_payload_missing', '備份內容缺少業績或顧客資料，不建議還原。');
          }

          const errorCount = warnings.filter(item => item.severity === 'error').length;
          const warningCount = warnings.length - errorCount;
          return {
            localCounts,
            backupCounts,
            rows,
            warnings,
            riskTone: errorCount ? 'error' : warningCount ? 'warn' : 'ok',
            riskLabel: errorCount ? `${errorCount} 個高風險` : warningCount ? `${warningCount} 個提醒` : '差異正常',
            localTotal,
            backupTotal
          };
        },
        restoreDiffText(delta) {
          const value = Number(delta) || 0;
          if (!value) return '0';
          return `${value > 0 ? '+' : ''}${this.formatNumber(value)}`;
        },
        restoreCountSummary(counts = {}) {
          return `顧客 ${this.formatNumber(counts.customers)}、業績 ${this.formatNumber(counts.orders)}、儲值 ${this.formatNumber(counts.prepaidLedger)}、支出 ${this.formatNumber(counts.expenses)}、庫存 ${this.formatNumber(counts.inventory)}`;
        },
        closeCloudRestoreModal() {
          if (this.cloudBackupStatus === 'restoring') return;
          this.showCloudRestoreModal = false;
          this.cloudRestoreDraft = null;
          this.cloudRestoreConfirmText = '';
          this.cloudRestorePreviewLoading = false;
        },
        async restoreCloudBackupSnapshot(backup) {
          const row = this.normalizeCloudBackupRow(backup);
          if (!row.id && !row.backupDate) {
            this.showToast('找不到雲端備份資料', 'error');
            return;
          }
          if (!this.authUser || !this.authSession?.access_token) {
            this.showToast('請先登入雲端帳號', 'error');
            return;
          }
          this.cloudRestorePreviewLoading = true;
          this.cloudBackupRestoringId = row.id;
          this.cloudBackupError = '';
          try {
            const full = await this.fetchCloudBackupPayload(row);
            this.cloudRestoreDraft = {
              backup: full,
              preview: this.buildCloudRestorePreview(full)
            };
            this.cloudRestoreConfirmText = '';
            this.showCloudRestoreModal = true;
          } catch (error) {
            console.error('Cloud backup preview failed:', error);
            this.cloudBackupError = error.message || '雲端備份差異預覽失敗';
            this.runDataSafetyCheck(false);
            this.showToast(`雲端備份差異預覽失敗：${this.cloudBackupError}`, 'error', 9000);
          } finally {
            this.cloudRestorePreviewLoading = false;
            this.cloudBackupRestoringId = null;
          }
        },
        async confirmCloudBackupRestore() {
          const full = this.cloudRestoreDraft?.backup;
          const preview = this.cloudRestoreDraft?.preview;
          if (!full?.payload) {
            this.showToast('找不到可還原的雲端備份內容', 'error');
            return;
          }
          if (!this.cloudRestoreReadyToConfirm) {
            this.showToast(`請輸入備份日期 ${full.backupDate} 才能還原`, 'error', 6000);
            return;
          }
          this.cloudBackupStatus = 'restoring';
          this.cloudBackupRestoringId = full.id;
          this.cloudBackupError = '';
          try {
            const beforeCounts = this.backupComparableCounts();
            const protection = this.createLocalBackupSnapshot('pre_restore', { silent: true, force: true });
            if (!protection) throw new Error('無法建立還原前保護快照，已取消還原');
            const servicesIncluded = this.applyBackupData(full.payload, { source: 'cloud_backup_restore' });
            const afterCounts = this.backupComparableCounts();
            const integrity = this.runIntegrityCheck(false);
            const safety = this.runDataSafetyCheck(false);
            this.recordOperation(
              'cloud_backup_restore',
              '還原雲端備份',
              `${full.backupDate} · 還原後 ${this.restoreCountSummary(afterCounts)} · ${integrity.status === 'ok' ? '檢查正常' : `${integrity.errorCount} 錯誤、${integrity.warningCount} 提醒`}`,
              {
                backupId: full.id,
                backupDate: full.backupDate,
                schemaVersion: full.schemaVersion,
                servicesIncluded,
                beforeCounts,
                backupCounts: preview?.backupCounts || this.backupComparableCounts(full.payload),
                afterCounts,
                warnings: preview?.warnings || [],
                integrityStatus: integrity.status,
                safetyStatus: safety.status
              }
            );
            this.activeTab = 'safety';
            this.showCloudRestoreModal = false;
            this.cloudRestoreDraft = null;
            this.cloudRestoreConfirmText = '';
            this.cloudBackupStatus = 'ready';
            this.runDataSafetyCheck(false);
            this.showToast(
              this.cloudRestorePending
                ? '雲端備份已還原到本機；同步已暫停，避免目前雲端資料覆蓋還原版本'
                : servicesIncluded
                  ? (integrity.status === 'ok' ? '雲端備份已還原，健康檢查正常' : '雲端備份已還原，請查看健康檢查提醒')
                  : '雲端備份已還原，但原備份不含價目表',
              this.cloudRestorePending ? 'warning' : (integrity.status === 'ok' && servicesIncluded ? 'success' : 'error'),
              10000
            );
            try {
              await this.fetchCloudBackupList({ silent: true });
            } catch (error) {
              console.warn('Post-restore backup list refresh skipped:', error);
            }
          } catch (error) {
            console.error('Cloud backup restore failed:', error);
            this.cloudBackupStatus = 'error';
            this.cloudBackupError = error.message || '雲端備份還原失敗';
            this.runDataSafetyCheck(false);
            this.showToast(`雲端備份還原失敗：${this.cloudBackupError}`, 'error', 9000);
          } finally {
            this.cloudBackupRestoringId = null;
          }
        },
        exportOperationLogCSV() {
          const headers = ['時間', '動作', '摘要', '細節'];
          const rows = (this.operationLogs || []).map(log => [
            this.formatDateTime(log.at),
            log.action,
            log.label,
            log.detail
          ]);
          this.downloadCSV(`MOMO操作紀錄_${new Date().toLocaleDateString('sv-SE')}.csv`, headers, rows);
          this.showToast('操作紀錄 CSV 已匯出');
        },
        isDateLocked(date) {
          return Boolean(date && this.closeoutRecords && this.closeoutRecords[date]);
        },
        lockMessage(date) {
          return `${date || '這一天'} 已完成打烊鎖帳；原始明細不可直接修改，請用更正單或反向沖銷補登。`;
        },
        assertDateUnlocked(date) {
          if (!this.isDateLocked(date)) return true;
          this.showToast(this.lockMessage(date), 'error', 7000);
          return false;
        },
        isCorrectionSlip(order = {}) {
          return MomoCore.isCorrectionSlip(order);
        },
        orderDraftNotice(order) {
          if (!this.orderDraftHasChanges(order)) return '編輯草稿：修改後不會立即寫入資料';
          return this.isDateLocked(order?.date)
            ? '已鎖帳：確認後會建立更正單，不修改原始明細'
            : '尚未儲存：確認後請按「儲存修正」';
        },
        rememberEditSnapshot(type, row) {
          if (!row?.id) return;
          const key = `${type}:${row.id}`;
          if (!this.editSnapshots[key]) this.editSnapshots[key] = JSON.parse(JSON.stringify(row));
        },
        clearEditSnapshot(type, row) {
          if (row?.id) delete this.editSnapshots[`${type}:${row.id}`];
        },
        restoreEditSnapshot(type, row) {
          const key = `${type}:${row?.id}`;
          const snapshot = this.editSnapshots[key];
          if (snapshot && row) Object.assign(row, JSON.parse(JSON.stringify(snapshot)));
          delete this.editSnapshots[key];
        },
        orderAuditFields() {
          return ['date', 'customerId', 'customerName', 'gender', 'serviceName', 'amount', 'paymentMethod', 'cashAmount', 'topupChannel', 'actualDurationMinutes', 'syncStatus'];
        },
        orderAuditFieldLabel(field) {
          return ({
            date: '日期',
            customerId: '顧客ID',
            customerName: '顧客',
            gender: '性別',
            serviceName: '服務',
            amount: '金額',
            paymentMethod: '付款',
            cashAmount: '現金付款',
            topupChannel: '儲值收款',
            actualDurationMinutes: '實際工時',
            syncStatus: '狀態'
          })[field] || field;
        },
        formatOrderAuditValue(field, value) {
          if (value === null || value === undefined || value === '') return '空白';
          if (field === 'amount' || field === 'cashAmount') return `NT$ ${this.formatNumber(value)}`;
          if (field === 'actualDurationMinutes') return `${this.formatNumber(value)} 分鐘`;
          if (field === 'customerId') return this.shortCustomerId(value);
          return String(value);
        },
        buildOrderCorrectionDetail(before = {}, after = {}, fields = []) {
          const title = `${after.date || before.date || ''} ${after.customerName || before.customerName || ''} ${after.serviceName || before.serviceName || ''}`.trim();
          const changes = fields.map(field => {
            const from = this.formatOrderAuditValue(field, before[field]);
            const to = this.formatOrderAuditValue(field, after[field]);
            return `${this.orderAuditFieldLabel(field)}：${from} → ${to}`;
          });
          return [title, ...changes].filter(Boolean).join('\n');
        },
        orderCorrectionLogs(orderId) {
          return (this.operationLogs || [])
            .filter(log => log?.meta?.orderId === orderId && ['order_correction', 'order_update', 'locked_order_time_update', 'locked_order_correction_slip', 'locked_order_correction_note', 'locked_order_delete_correction_slip'].includes(log.action))
            .slice(0, 3);
        },
        cloneOrderForDraft(order = {}) {
          return {
            id: order.id,
            date: order.date || new Date().toLocaleDateString('sv-SE'),
            customerId: order.customerId || '',
            customerName: order.customerName || '',
            gender: order.gender || '女',
            serviceName: order.serviceName || '',
            amount: Number(order.amount) || 0,
            paymentMethod: order.paymentMethod || '現金',
            cashAmount: order.cashAmount === null || order.cashAmount === undefined ? null : Number(order.cashAmount) || 0,
            topupChannel: order.topupChannel || (order.paymentMethod === '儲值進帳' ? '現金' : null),
            category: order.category || '',
            sourceEventId: order.sourceEventId || null,
            orderId: order.orderId || null,
            source: order.source || null,
            correctionSlip: Boolean(order.correctionSlip),
            correctionForOrderId: order.correctionForOrderId || null,
            correctionForDate: order.correctionForDate || null,
            correctionReason: order.correctionReason || '',
            calendarStart: order.calendarStart || null,
            calendarEnd: order.calendarEnd || null,
            calendarDurationMinutes: this.normalizeMinutes(order.calendarDurationMinutes),
            actualDurationMinutes: this.normalizeMinutes(order.actualDurationMinutes),
            pricingSource: order.pricingSource || null,
            pricingUnmatchedServices: Array.isArray(order.pricingUnmatchedServices) ? [...order.pricingUnmatchedServices] : [],
            serviceConfigUpdatedAt: order.serviceConfigUpdatedAt || null,
            syncStatus: order.syncStatus || 'active',
            createdAt: order.createdAt || null,
            lastSyncedAt: order.lastSyncedAt || null
          };
        },
        beginOrderDraft(order) {
          if (!order?.id) return null;
          if (!this.orderEditDrafts[order.id]) {
            this.orderEditDrafts = {
              ...this.orderEditDrafts,
              [order.id]: this.cloneOrderForDraft(order)
            };
          }
          return this.orderEditDrafts[order.id];
        },
        orderEditDraft(order) {
          return this.beginOrderDraft(order) || this.cloneOrderForDraft(order);
        },
        clearOrderDraft(orderId) {
          if (!orderId || !this.orderEditDrafts[orderId]) return;
          const next = { ...this.orderEditDrafts };
          delete next[orderId];
          this.orderEditDrafts = next;
        },
        cancelOrderDraft(order) {
          this.clearOrderDraft(order?.id);
          this.showToast('已取消本次修正', 'info');
        },
        orderDraftChangedFields(order) {
          const draft = this.orderEditDraft(order);
          return this.orderAuditFields().filter(field =>
            JSON.stringify(order?.[field] ?? null) !== JSON.stringify(draft?.[field] ?? null)
          );
        },
        orderDraftHasChanges(order) {
          return this.orderDraftChangedFields(order).length > 0;
        },
        selectOrderDraftCustomer(order) {
          const draft = this.orderEditDraft(order);
          const customer = this.customerMap[draft.customerId];
          if (!customer) return;
          draft.customerName = customer.name;
          draft.gender = customer.gender || draft.gender || '女';
        },
        normalizeOrderDraft(draft = {}) {
          const actualDurationMinutes = this.normalizeMinutes(draft.actualDurationMinutes);
          return {
            ...draft,
            serviceName: String(draft.serviceName || '').trim(),
            amount: Number(draft.amount) || 0,
            cashAmount: draft.paymentMethod === '現金＋儲值扣款' ? Number(draft.cashAmount) || 0 : null,
            topupChannel: draft.paymentMethod === '儲值進帳' ? (draft.topupChannel || '現金') : null,
            actualDurationMinutes,
            actualDurationSource: actualDurationMinutes ? 'manual' : null
          };
        },
        validateOrderDraft(order, draft, options = {}) {
          if (!options.allowLocked && (!this.assertDateUnlocked(order?.date) || !this.assertDateUnlocked(draft?.date))) return false;
          if (!draft.customerId || !this.customerMap[draft.customerId]) {
            this.showToast('請選擇有效顧客', 'error');
            return false;
          }
          if (!String(draft.serviceName || '').trim()) {
            this.showToast('請輸入服務內容', 'error');
            return false;
          }
          if ((Number(draft.amount) || 0) <= 0) {
            this.showToast('金額必須大於 0', 'error');
            return false;
          }
          if (draft.paymentMethod === '現金＋儲值扣款') {
            const cash = Number(draft.cashAmount) || 0;
            const amount = Number(draft.amount) || 0;
            if (cash <= 0 || cash >= amount) {
              this.showToast('混合付款的現金金額必須大於 0，且小於消費總額', 'error', 5000);
              return false;
            }
          }
          if (draft.paymentMethod === '儲值進帳' && !['現金', '轉帳'].includes(draft.topupChannel)) {
            this.showToast('請選擇儲值收款方式：現金或轉帳', 'error');
            return false;
          }
          if (draft.actualDurationMinutes !== null && draft.actualDurationMinutes !== '') {
            const minutes = Number(draft.actualDurationMinutes);
            if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 1440) {
              this.showToast('實際工時請輸入 1～1440 的整數分鐘；不確定可留白', 'error', 6000);
              return false;
            }
          }
          return true;
        },
        orderMoneyVector(order = {}) {
          return MomoCore.orderMoneyVector(order);
        },
        orderCorrectionLinesFromVector(vector = {}, source = {}, suffix = '差額') {
          return MomoCore.orderCorrectionLinesFromVector(vector, source, suffix);
        },
        buildLockedOrderCorrectionLines(before = {}, after = {}) {
          return MomoCore.buildLockedOrderCorrectionLines(before, after);
        },
        createLockedOrderCorrectionSlip(order, draft) {
          this.selectOrderDraftCustomer(order);
          const before = JSON.parse(JSON.stringify(order));
          const normalizedDraft = this.normalizeOrderDraft(draft);
          const changed = this.orderAuditFields().filter(field =>
            JSON.stringify(before?.[field] ?? null) !== JSON.stringify(normalizedDraft?.[field] ?? null)
          );
          if (!changed.length) {
            this.clearOrderDraft(order.id);
            this.showToast('沒有需要建立更正單的變更', 'info');
            return true;
          }

          const detail = this.buildOrderCorrectionDetail(before, normalizedDraft, changed);
          const correctionDate = new Date().toLocaleDateString('sv-SE');
          if (this.isDateLocked(correctionDate)) {
            this.showToast(`${correctionDate} 也已打烊鎖帳；請先選擇尚未鎖帳的補登日期。`, 'error', 7000);
            return false;
          }

          const lines = this.buildLockedOrderCorrectionLines(before, normalizedDraft);
          if (!lines.length) {
            this.recordOperation('locked_order_correction_note', '鎖帳更正備註', detail, {
              orderId: before.id,
              fields: changed
            });
            this.clearOrderDraft(order.id);
            this.showToast('已記錄鎖帳更正備註；此修正不影響金流');
            return true;
          }

          const linePreview = lines
            .map(line => `・${line.customerName} ${line.paymentMethod}${line.topupChannel ? `(${line.topupChannel})` : ''}：${line.amount >= 0 ? '+' : ''}NT$ ${this.formatNumber(line.amount)}`)
            .join('\n');
          this.showConfirm(
            `${before.date} 已鎖帳，系統會在 ${correctionDate} 建立更正單，不修改原始明細。\n\n${linePreview}\n\n確定建立嗎？`,
            () => {
              const now = new Date().toISOString();
              const correctionOrders = lines.map(line => ({
                id: this.generateStableId('corr'),
                date: correctionDate,
                customerId: line.customerId,
                customerName: line.customerName,
                gender: line.gender || '女',
                serviceName: line.serviceName,
                category: '更正',
                amount: line.amount,
                paymentMethod: line.paymentMethod,
                cashAmount: null,
                topupChannel: line.paymentMethod === '儲值進帳' ? (line.topupChannel || '現金') : null,
                source: 'correction_slip',
                correctionSlip: true,
                correctionForOrderId: before.id,
                correctionForDate: before.date,
                correctionReason: detail,
                syncStatus: 'active',
                createdAt: now,
                updatedAt: now
              }));
              this.orders.push(...correctionOrders);
              this.saveOrders();
              this.recordOperation('locked_order_correction_slip', '建立鎖帳更正單', detail, {
                orderId: before.id,
                correctionOrderIds: correctionOrders.map(item => item.id),
                fields: changed,
                before: this.orderAuditFields().reduce((acc, field) => ({ ...acc, [field]: before?.[field] ?? null }), {}),
                after: this.orderAuditFields().reduce((acc, field) => ({ ...acc, [field]: normalizedDraft?.[field] ?? null }), {})
              });
              this.clearOrderDraft(order.id);
              this.showToast(`已建立 ${correctionOrders.length} 筆更正單`);
            },
            { title: '建立鎖帳更正單', subtitle: `${before.date} 原始帳目保持不變`, tone: 'warning', confirmLabel: '建立更正單', loadingLabel: '建立中…' }
          );
          return false;
        },
        createLockedOrderDeleteCorrection(order) {
          if (!order?.id) return false;
          const correctionDate = new Date().toLocaleDateString('sv-SE');
          if (this.isDateLocked(correctionDate)) {
            this.showToast(`${correctionDate} 已打烊鎖帳，無法在今日新增刪除沖銷更正單`, 'error', 7000);
            return false;
          }
          const before = JSON.parse(JSON.stringify(order));
          const negativeVector = Object.fromEntries(Object.entries(this.orderMoneyVector(before)).map(([key, value]) => [key, -value]));
          const lines = this.orderCorrectionLinesFromVector(negativeVector, before, '刪除沖銷');
          if (!lines.length) {
            this.showToast('此筆沒有可沖銷的金流金額', 'error');
            return false;
          }
          const detail = `${before.date || ''} ${before.customerName || ''} ${before.serviceName || ''}\n刪除已鎖帳原單，改以更正單全額沖銷。`;
          const linePreview = lines
            .map(line => `・${line.customerName} ${line.paymentMethod}${line.topupChannel ? `(${line.topupChannel})` : ''}：${line.amount >= 0 ? '+' : ''}NT$ ${this.formatNumber(line.amount)}`)
            .join('\n');
          this.showConfirm(
            `${before.date} 已鎖帳，不能刪除原始明細。\n\n系統會在 ${correctionDate} 建立刪除沖銷更正單：\n${linePreview}\n\n確定建立嗎？`,
            () => {
              const now = new Date().toISOString();
              const correctionOrders = lines.map(line => ({
                id: this.generateStableId('corr'),
                date: correctionDate,
                customerId: line.customerId,
                customerName: line.customerName,
                gender: line.gender || '女',
                serviceName: line.serviceName,
                category: '更正',
                amount: line.amount,
                paymentMethod: line.paymentMethod,
                cashAmount: null,
                topupChannel: line.paymentMethod === '儲值進帳' ? (line.topupChannel || '現金') : null,
                source: 'correction_slip',
                correctionSlip: true,
                correctionForOrderId: before.id,
                correctionForDate: before.date,
                correctionReason: detail,
                syncStatus: 'active',
                createdAt: now,
                updatedAt: now
              }));
              this.orders.push(...correctionOrders);
              if (this.expandedOrderId === before.id) this.expandedOrderId = null;
              this.clearOrderDraft(before.id);
              this.saveOrders();
              this.recordOperation('locked_order_delete_correction_slip', '建立鎖帳刪除沖銷更正單', detail, {
                orderId: before.id,
                correctionOrderIds: correctionOrders.map(item => item.id)
              });
              this.showToast(`已建立 ${correctionOrders.length} 筆刪除沖銷更正單`);
            },
            { title: '建立刪除沖銷', subtitle: `${before.date} 原始帳目保持不變`, tone: 'danger', confirmLabel: '建立沖銷單', loadingLabel: '建立中…' }
          );
          return false;
        },
        saveOrderDraft(order) {
          const draft = this.orderEditDraft(order);
          const normalizedDraft = this.normalizeOrderDraft(draft);
          const changed = this.orderAuditFields().filter(field =>
            JSON.stringify(order?.[field] ?? null) !== JSON.stringify(normalizedDraft?.[field] ?? null)
          );
          if (this.isDateLocked(order?.date) || this.isDateLocked(draft?.date)) {
            if (!this.validateOrderDraft(order, draft, { allowLocked: true })) return false;
            if (changed.length && changed.every(field => field === 'actualDurationMinutes')) {
              const before = JSON.parse(JSON.stringify(order));
              Object.assign(order, {
                actualDurationMinutes: normalizedDraft.actualDurationMinutes,
                actualDurationSource: normalizedDraft.actualDurationSource,
                updatedAt: new Date().toISOString()
              });
              this.saveOrders();
              this.recordOperation('locked_order_time_update', '補登鎖帳實際工時', this.buildOrderCorrectionDetail(before, order, changed), {
                orderId: order.id,
                fields: changed
              });
              this.clearOrderDraft(order.id);
              this.showToast('實際工時已補登；金流與打烊數字未變更');
              return true;
            }
            return this.createLockedOrderCorrectionSlip(order, draft);
          }
          if (!this.validateOrderDraft(order, draft)) return false;
          this.selectOrderDraftCustomer(order);
          const before = JSON.parse(JSON.stringify(order));
          if (!changed.length) {
            this.clearOrderDraft(order.id);
            this.showToast('沒有需要儲存的修正', 'info');
            return true;
          }
          Object.assign(order, normalizedDraft, { updatedAt: new Date().toISOString() });
          this.saveOrders();
          this.recordOperation('order_correction', '修正業績', this.buildOrderCorrectionDetail(before, order, changed), {
            orderId: order.id,
            fields: changed,
            before: this.orderAuditFields().reduce((acc, field) => ({ ...acc, [field]: before?.[field] ?? null }), {}),
            after: this.orderAuditFields().reduce((acc, field) => ({ ...acc, [field]: order?.[field] ?? null }), {})
          });
          this.clearOrderDraft(order.id);
          this.runIntegrityCheck(false);
          this.showToast('業績修正已儲存');
          return true;
        },
        cloneExpenseForDraft(expense = {}) {
          return {
            id: expense.id,
            date: expense.date || new Date().toLocaleDateString('sv-SE'),
            category: expense.category || this.expenseCategories[0] || '其他',
            amount: Number(expense.amount) || 0,
            paymentMethod: MomoCore.normalizeExpensePaymentMethod(expense.paymentMethod),
            notes: expense.notes || ''
          };
        },
        beginExpenseDraft(expense) {
          if (!expense?.id) return null;
          if (!this.expenseEditDrafts[expense.id]) {
            this.expenseEditDrafts = {
              ...this.expenseEditDrafts,
              [expense.id]: this.cloneExpenseForDraft(expense)
            };
          }
          return this.expenseEditDrafts[expense.id];
        },
        expenseEditDraft(expense) {
          return this.beginExpenseDraft(expense) || this.cloneExpenseForDraft(expense);
        },
        clearExpenseDraft(id) {
          if (!id || !this.expenseEditDrafts[id]) return;
          const next = { ...this.expenseEditDrafts };
          delete next[id];
          this.expenseEditDrafts = next;
        },
        cancelExpenseDraft(expense) {
          this.clearExpenseDraft(expense?.id);
          this.showToast('已取消本次支出修正', 'info');
        },
        expenseDraftHasChanges(expense) {
          const draft = this.expenseEditDraft(expense);
          return ['date', 'category', 'amount', 'paymentMethod', 'notes'].some(field =>
            JSON.stringify(expense?.[field] ?? null) !== JSON.stringify(draft?.[field] ?? null)
          );
        },
        saveExpenseDraft(expense) {
          const draft = this.expenseEditDraft(expense);
          if (!this.assertDateUnlocked(expense?.date) || !this.assertDateUnlocked(draft?.date)) return false;
          if (!draft.category) {
            this.showToast('請選擇支出分類', 'error');
            return false;
          }
          if ((Number(draft.amount) || 0) <= 0) {
            this.showToast('支出金額必須大於 0', 'error');
            return false;
          }
          const before = JSON.parse(JSON.stringify(expense));
          const normalized = {
            ...draft,
            amount: Number(draft.amount) || 0,
            paymentMethod: MomoCore.normalizeExpensePaymentMethod(draft.paymentMethod),
            notes: String(draft.notes || '').trim()
          };
          const changed = ['date', 'category', 'amount', 'paymentMethod', 'notes'].filter(field =>
            JSON.stringify(before?.[field] ?? null) !== JSON.stringify(normalized?.[field] ?? null)
          );
          if (!changed.length) {
            this.clearExpenseDraft(expense.id);
            this.showToast('沒有需要儲存的支出修正', 'info');
            return true;
          }
          Object.assign(expense, normalized, { updatedAt: new Date().toISOString() });
          this.saveExpenses();
          this.recordOperation('expense_update', '修改支出', `${expense.date} ${expense.category || ''} NT$ ${this.formatNumber(expense.amount || 0)} · ${changed.join('、')}`, { expenseId: expense.id });
          this.clearExpenseDraft(expense.id);
          this.runIntegrityCheck(false);
          this.showToast('支出修正已儲存');
          return true;
        },
        cloneInventoryForDraft(item = {}) {
          return {
            id: item.id,
            name: item.name || '',
            stock: Math.max(0, Number(item.stock) || 0),
            minStock: this.inventorySafetyStock(item),
            notes: item.notes || ''
          };
        },
        beginInventoryDraft(item) {
          if (!item?.id) return null;
          if (!this.inventoryEditDrafts[item.id]) {
            this.inventoryEditDrafts = {
              ...this.inventoryEditDrafts,
              [item.id]: this.cloneInventoryForDraft(item)
            };
          }
          return this.inventoryEditDrafts[item.id];
        },
        inventoryEditDraft(item) {
          return this.beginInventoryDraft(item) || this.cloneInventoryForDraft(item);
        },
        clearInventoryDraft(id) {
          if (!id || !this.inventoryEditDrafts[id]) return;
          const next = { ...this.inventoryEditDrafts };
          delete next[id];
          this.inventoryEditDrafts = next;
        },
        cancelInventoryDraft(item) {
          this.clearInventoryDraft(item?.id);
          this.showToast('已取消本次庫存修正', 'info');
        },
        inventoryDraftHasChanges(item) {
          const draft = this.inventoryEditDraft(item);
          const current = this.cloneInventoryForDraft(item);
          return ['name', 'stock', 'minStock', 'notes'].some(field =>
            JSON.stringify(current?.[field] ?? null) !== JSON.stringify(draft?.[field] ?? null)
          );
        },
        saveInventoryDraft(item) {
          const draft = this.inventoryEditDraft(item);
          const normalized = {
            ...draft,
            name: String(draft.name || '').trim(),
            stock: Math.max(0, Number(draft.stock) || 0),
            minStock: Math.max(1, Math.round(Number(draft.minStock) || 3)),
            notes: String(draft.notes || '').trim()
          };
          if (!normalized.name) {
            this.showToast('請輸入商品名稱', 'error');
            return false;
          }
          const before = this.cloneInventoryForDraft(item);
          const changed = ['name', 'stock', 'minStock', 'notes'].filter(field =>
            JSON.stringify(before?.[field] ?? null) !== JSON.stringify(normalized?.[field] ?? null)
          );
          if (!changed.length) {
            this.clearInventoryDraft(item.id);
            this.showToast('沒有需要儲存的庫存修正', 'info');
            return true;
          }
          Object.assign(item, normalized, { updatedAt: new Date().toISOString() });
          this.saveInventory();
          this.recordOperation('inventory_update', '修改庫存', `${item.name} · ${changed.join('、')}`, { itemId: item.id });
          this.clearInventoryDraft(item.id);
          this.showToast('庫存修正已儲存');
          return true;
        },
        buildCrmDraft(customer = {}) {
          const formula = this.crmFormulas[customer.id] || {};
          return {
            customerId: customer.id,
            name: customer.name || '',
            gender: customer.gender || '女',
            note: this.crmNotes[customer.id] || '',
            formula: {
              ...formula,
              tags: Array.isArray(formula.tags) ? [...formula.tags] : []
            }
          };
        },
        crmProfileDraft(cust) {
          const customer = this.customerMap[cust?.id] || cust;
          if (!customer?.id) return { customerId: '', name: '', gender: '女', note: '', formula: { tags: [] } };
          if (!this.crmEditDrafts[customer.id]) {
            this.crmEditDrafts = {
              ...this.crmEditDrafts,
              [customer.id]: this.buildCrmDraft(customer)
            };
          }
          return this.crmEditDrafts[customer.id];
        },
        crmDraftFormula(cust) {
          const draft = this.crmProfileDraft(cust);
          if (!draft.formula) draft.formula = { tags: [] };
          if (!Array.isArray(draft.formula.tags)) draft.formula.tags = [];
          return draft.formula;
        },
        crmDraftHasChanges(cust) {
          const customer = this.customerMap[cust?.id] || cust;
          if (!customer?.id) return false;
          const current = this.buildCrmDraft(customer);
          const draft = this.crmProfileDraft(customer);
          return JSON.stringify(current) !== JSON.stringify(draft);
        },
        toggleCustomerDraftTag(cust, tag) {
          const formula = this.crmDraftFormula(cust);
          const tags = Array.isArray(formula.tags) ? [...formula.tags] : [];
          const index = tags.indexOf(tag);
          if (index >= 0) tags.splice(index, 1);
          else tags.push(tag);
          formula.tags = tags;
        },
        cancelCrmDraft(cust) {
          const id = cust?.id;
          if (!id || !this.crmEditDrafts[id]) return;
          this.clearCrmDraft(id);
          this.showToast('已取消本次 CRM 修正', 'info');
        },
        clearCrmDraft(id) {
          if (!id || !this.crmEditDrafts[id]) return;
          const next = { ...this.crmEditDrafts };
          delete next[id];
          this.crmEditDrafts = next;
        },
        saveCrmDraft(cust) {
          const customer = this.customerMap[cust?.id];
          if (!customer?.id) return false;
          const draft = this.crmProfileDraft(customer);
          const newName = String(draft.name || '').trim();
          if (!newName) {
            this.showToast('顧客姓名不可空白', 'error');
            return false;
          }
          const rollback = this.buildBackupData();
          const before = this.buildCrmDraft(customer);
          customer.name = newName;
          customer.gender = draft.gender || '女';
          customer.updatedAt = new Date().toISOString();
          this.orders.forEach(order => {
            if (order.customerId === customer.id) {
              order.customerName = customer.name;
              order.gender = customer.gender;
            }
          });
          this.prepaidLedger.forEach(entry => {
            if (entry.customerId === customer.id) entry.customerNameSnapshot = customer.name;
          });
          const formula = {
            ...(draft.formula || {}),
            tags: Array.isArray(draft.formula?.tags) ? [...draft.formula.tags] : [],
            updatedAt: new Date().toLocaleDateString('sv-SE')
          };
          this.crmNotes[customer.id] = String(draft.note || '').trim();
          this.crmFormulas[customer.id] = formula;
          try {
            this.persistCurrentStateStrict(localStorage.getItem('momo_servicesConfigUpdatedAt'));
          } catch (error) {
            this.replaceBusinessStateFromBackup(rollback, true);
            throw new Error(`CRM 儲存失敗，原資料已回復：${error.message || error}`);
          }
          this.clearCrmDraft(customer.id);
          this.recordOperation('crm_profile_update', '儲存 CRM 修正', customer.name, {
            customerId: customer.id,
            changed: Object.keys(draft).filter(key => JSON.stringify(before?.[key]) !== JSON.stringify(draft?.[key]))
          });
          this.showToast('CRM 修正已儲存');
          return true;
        },
        guardedSaveOrder(order) {
          const snapshot = this.editSnapshots[`orders:${order?.id}`];
          const oldDate = snapshot?.date || order?.date;
          if (!this.assertDateUnlocked(oldDate) || !this.assertDateUnlocked(order?.date)) {
            this.restoreEditSnapshot('orders', order);
            return false;
          }
          const changed = snapshot
            ? this.orderAuditFields().filter(key => JSON.stringify(snapshot[key] ?? null) !== JSON.stringify(order[key] ?? null))
            : [];
          if (changed.length) order.updatedAt = new Date().toISOString();
          this.clearEditSnapshot('orders', order);
          this.saveOrders();
          if (changed.length) {
            this.recordOperation('order_correction', '修正業績', this.buildOrderCorrectionDetail(snapshot, order, changed), {
              orderId: order.id,
              fields: changed,
              before: this.orderAuditFields().reduce((acc, field) => ({ ...acc, [field]: snapshot?.[field] ?? null }), {}),
              after: this.orderAuditFields().reduce((acc, field) => ({ ...acc, [field]: order?.[field] ?? null }), {})
            });
          }
          return true;
        },
        guardedOrderCustomerChanged(order) {
          const snapshot = this.editSnapshots[`orders:${order?.id}`];
          const oldDate = snapshot?.date || order?.date;
          if (!this.assertDateUnlocked(oldDate) || !this.assertDateUnlocked(order?.date)) {
            this.restoreEditSnapshot('orders', order);
            return false;
          }
          this.onOrderCustomerIdChanged(order);
          const changed = snapshot
            ? this.orderAuditFields().filter(key => JSON.stringify(snapshot[key] ?? null) !== JSON.stringify(order[key] ?? null))
            : [];
          if (changed.length) order.updatedAt = new Date().toISOString();
          if (changed.length) this.saveOrders();
          this.clearEditSnapshot('orders', order);
          if (changed.length) {
            this.recordOperation('order_correction', '修正業績顧客', this.buildOrderCorrectionDetail(snapshot, order, changed), {
              orderId: order.id,
              fields: changed
            });
          }
          return true;
        },
        guardedSaveExpense(expense) {
          const snapshot = this.editSnapshots[`expenses:${expense?.id}`];
          const oldDate = snapshot?.date || expense?.date;
          if (!this.assertDateUnlocked(oldDate) || !this.assertDateUnlocked(expense?.date)) {
            this.restoreEditSnapshot('expenses', expense);
            return false;
          }
          const changed = snapshot ? Object.keys(snapshot).filter(key => JSON.stringify(snapshot[key]) !== JSON.stringify(expense[key])) : [];
          this.clearEditSnapshot('expenses', expense);
          this.saveExpenses();
          if (changed.length) this.recordOperation('expense_update', '修改支出', `${expense.date} ${expense.category || ''} NT$ ${this.formatNumber(expense.amount || 0)} · ${changed.join('、')}`, { expenseId: expense.id });
          return true;
        },
        unlockCloseoutDate(date = new Date().toLocaleDateString('sv-SE')) {
          if (!this.closeoutRecords?.[date]) return;
          this.showConfirm(`確定解除 ${date} 的鎖帳嗎？解除後可修改當日業績與支出，完成修正後請重新打烊。`, async () => {
            if (!this.assertCloudDeleteReady()) return;
            const record = MomoCore.cloneJsonValue(this.closeoutRecords[date]);
            delete this.closeoutRecords[date];
            try {
              this.writeLocalStorageAtomically([['momo_closeoutRecords', JSON.stringify(this.closeoutRecords)]]);
              this.queueCloudSync();
              if (this.cloudReady && this.authUser) {
                const deleted = await this.deleteCloudRecord('closeouts', 'closeout_date', date);
                if (!deleted) throw new Error(this.cloudMessage || '雲端鎖帳紀錄未刪除');
              }
            } catch (error) {
              this.closeoutRecords[date] = record;
              this.writeLocalStorageAtomically([['momo_closeoutRecords', JSON.stringify(this.closeoutRecords)]]);
              this.queueCloudSync();
              throw new Error(`解除鎖帳失敗，原鎖帳已回復：${error.message || error}`);
            }
            this.recordOperation('closeout_unlock', '解除鎖帳', date);
            this.showToast(`已解除 ${date} 鎖帳`);
          }, { title: '解除每日鎖帳', subtitle: `${date} 將恢復可編輯狀態`, tone: 'warning', confirmLabel: '解除鎖帳', loadingLabel: '解除中…' });
        },
        pwaReloadGuardKey() {
          return 'momo_pwa_reload_guard';
        },
        pwaReloadDecision() {
          let lastReload = null;
          try {
            lastReload = safeParse(sessionStorage.getItem(this.pwaReloadGuardKey()), null);
          } catch (error) {
            return { allow: true, retryAfterMs: 0 };
          }
          return MomoCore.evaluatePwaReloadGuard(lastReload, Date.now(), 90000);
        },
        reloadAppOnce(reason = 'manual', delayMs = 0) {
          if (this._pwaReloadRequested) return false;
          const decision = this.pwaReloadDecision();
          if (!decision.allow) {
            const seconds = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
            this.pwaStatus = '已阻止重複載入';
            this.recordRuntimeDiagnostic('update', 'warning', '已阻止短時間內再次重新載入', { reason, retryAfterSeconds: seconds });
            this.showToast('已阻止重複重新整理，請關閉 App 後再開啟', 'warning', 7000);
            return false;
          }
          try {
            sessionStorage.setItem(this.pwaReloadGuardKey(), JSON.stringify({
              at: Date.now(),
              reason,
              version: this.appVersion
            }));
          } catch (error) {
            // Session storage may be unavailable in strict private browsing mode.
          }
          this._pwaReloadRequested = true;
          this.recordRuntimeDiagnostic('update', 'info', 'App 將重新載入一次以完成更新', { reason, version: this.appVersion });
          setTimeout(() => window.location.reload(), Math.max(0, Number(delayMs) || 0));
          return true;
        },
        async refreshPwaCacheStatus() {
          if (!('caches' in window)) {
            this.pwaCacheNames = [];
            return [];
          }
          try {
            const names = await caches.keys();
            this.pwaCacheNames = names;
            return names;
          } catch (error) {
            console.warn('PWA cache status failed:', error);
            this.pwaCacheNames = [];
            return [];
          }
        },
        async checkPwaUpdate(manual = false) {
          if (this.pwaCheckingUpdate) return false;
          this.pwaCheckingUpdate = true;
          this.pwaLastCheckedAt = new Date().toISOString();
          try {
            if (!('serviceWorker' in navigator)) {
              this.pwaStatus = '瀏覽器不支援';
              if (manual) this.showToast('此瀏覽器不支援 App 更新管理', 'error', 5000);
              return false;
            }

            const registration = this.pwaRegistration || await navigator.serviceWorker.getRegistration('/');
            if (!registration) {
              this.pwaStatus = '尚未啟用';
              if (manual) this.showToast('App 更新服務尚未啟用，請重新開啟一次', 'error', 5000);
              return false;
            }

            this.pwaRegistration = registration;
            const updatedRegistration = await registration.update();
            const waitingWorker = updatedRegistration.waiting || registration.waiting;
            if (waitingWorker) {
              this.pendingServiceWorker = waitingWorker;
              this.updateAvailable = true;
              this.pwaStatus = '有新版待套用';
              if (manual) this.showToast('偵測到新版本，可立即套用');
              return true;
            }

            if (updatedRegistration.installing || registration.installing) {
              this.pwaStatus = '新版安裝中';
              if (manual) this.showToast('新版正在安裝，稍後會提示更新');
              return true;
            }

            this.pwaStatus = navigator.serviceWorker.controller ? '已啟用' : '等待啟用';
            if (manual) this.showToast('目前已是最新版', 'info');
            return false;
          } catch (error) {
            console.warn('PWA update check failed:', error);
            this.pwaStatus = '檢查失敗';
            this.recordRuntimeDiagnostic('update', 'warning', 'App 更新檢查失敗', { error: String(error?.message || error) });
            if (manual) this.showToast(`檢查更新失敗：${error.message}`, 'error', 6000);
            return false;
          } finally {
            this.pwaCheckingUpdate = false;
            if (manual || !this.iosPerfMode) this.refreshPwaCacheStatus();
          }
        },
        schedulePwaAutoCheck(delay = 800, force = false) {
          if (!('serviceWorker' in navigator)) return;
          if (this.pwaAutoCheckTimer) clearTimeout(this.pwaAutoCheckTimer);
          this.pwaAutoCheckTimer = setTimeout(() => {
            const run = () => this.runPwaAutoCheck(force);
            if (this.iosPerfMode && 'requestIdleCallback' in window) {
              window.requestIdleCallback(run, { timeout: 2500 });
            } else {
              run();
            }
          }, delay);
        },
        async runPwaAutoCheck(force = false) {
          if (!('serviceWorker' in navigator)) return false;
          if (this.pwaCheckingUpdate || this.updateAvailable) return false;
          if (!force && this.pwaLastCheckedAt) {
            const elapsed = Date.now() - Date.parse(this.pwaLastCheckedAt);
            const minInterval = this.iosPerfMode ? 5 * 60 * 1000 : 2 * 60 * 1000;
            if (Number.isFinite(elapsed) && elapsed < minInterval) return false;
          }
          return this.checkPwaUpdate(false);
        },
        clearPwaCachesAndReload() {
          if (this.hasProtectedAppActivity) {
            this.recordRuntimeDiagnostic('update', 'warning', '清除快取已延後：目前有未完成的修改或同步');
            this.showToast('請先完成目前的修改或同步，再清除舊快取', 'warning', 6500);
            return;
          }
          if (!this.pwaReloadDecision().allow) {
            this.recordRuntimeDiagnostic('update', 'warning', '清除快取已阻止：短時間內曾重新載入');
            this.showToast('剛完成一次重新載入，請關閉 App 後再開啟', 'warning', 6500);
            return;
          }
          this.showConfirm('確定清除 App 舊快取並重新載入嗎？這不會刪除業績、CRM 或備份資料。', async () => {
            this.pwaClearingCache = true;
            try {
              if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
                this.pwaCacheNames = [];
              }
              this.recordOperation('pwa_cache_clear', '清除 App 快取', `版本 ${this.appVersion}`);
              this.showToast('已清除 App 快取，正在重新載入…');
              this.reloadAppOnce('cache_clear', 350);
            } catch (error) {
              console.warn('PWA cache clear failed:', error);
              this.showToast(`清除快取失敗：${error.message}`, 'error', 6000);
              this.pwaClearingCache = false;
            }
          }, { title: '清除 App 舊快取', subtitle: '營運資料與備份不會被刪除', tone: 'info', confirmLabel: '清除並重載', loadingLabel: '清理中…' });
        },
        setupPwaUpdateListener() {
          if (!('serviceWorker' in navigator)) {
            this.pwaStatus = '瀏覽器不支援';
            return;
          }
          window.addEventListener('load', async () => {
            try {
              let hadServiceWorkerController = Boolean(navigator.serviceWorker.controller);
              const registration = await navigator.serviceWorker.register('/service-worker.js');
              this.pwaRegistration = registration;
              this.pwaStatus = navigator.serviceWorker.controller ? '已啟用' : '等待啟用';
              this.refreshPwaCacheStatus();

              const showUpdatePrompt = (worker) => {
                if (!worker) return;
                this.pendingServiceWorker = worker;
                this.updateAvailable = true;
                this.pwaStatus = '有新版待套用';
              };

              if (registration.waiting && navigator.serviceWorker.controller) {
                showUpdatePrompt(registration.waiting);
              }
              this.schedulePwaAutoCheck(this.iosPerfMode ? 3200 : 1500, false);

              registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                if (!worker) return;
                this.pwaStatus = '新版安裝中';
                worker.addEventListener('statechange', () => {
                  if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdatePrompt(worker);
                  } else if (worker.state === 'activated') {
                    this.pwaStatus = '已啟用';
                    this.refreshPwaCacheStatus();
                  }
                });
              });

              navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (this.pwaRefreshing) return;
                const replacedExistingController = hadServiceWorkerController;
                hadServiceWorkerController = true;
                this.pwaRefreshing = true;
                this.pendingServiceWorker = null;
                this.updateAvailable = false;
                this.pwaUpdateApplying = false;
                this.pwaStatus = '已啟用';

                if (!replacedExistingController) {
                  this.recordRuntimeDiagnostic('update', 'ok', 'App 更新服務已啟用', { version: this.appVersion });
                  setTimeout(() => { this.pwaRefreshing = false; }, 1000);
                  return;
                }

                if (this.iosPerfMode || this.hasProtectedAppActivity) {
                  this.pwaUpdateDeferred = this.hasProtectedAppActivity;
                  this.recordRuntimeDiagnostic('update', 'ok', this.hasProtectedAppActivity
                    ? '新版已啟用，因目前有未完成內容而未重新載入'
                    : '新版已啟用，重新開啟 App 後完成切換');
                  this.showToast('App 更新完成，關閉後重新開啟即可使用新版');
                  setTimeout(() => { this.pwaRefreshing = false; }, 1000);
                  return;
                }

                if (!this.reloadAppOnce('service_worker_update')) {
                  setTimeout(() => { this.pwaRefreshing = false; }, 1000);
                }
              });

              document.addEventListener('visibilitychange', () => {
                if (!document.hidden) this.schedulePwaAutoCheck(this.iosPerfMode ? 1600 : 300, false);
              });
              window.addEventListener('focus', () => this.schedulePwaAutoCheck(this.iosPerfMode ? 1800 : 500, false));
              window.addEventListener('pageshow', () => this.schedulePwaAutoCheck(this.iosPerfMode ? 2200 : 800, false));
              this.pwaAutoCheckInterval = setInterval(() => this.runPwaAutoCheck(false), 60 * 60 * 1000);
            } catch (error) {
              console.warn('PWA service worker registration failed:', error);
              this.pwaStatus = '註冊失敗';
              this.recordRuntimeDiagnostic('update', 'warning', 'App 更新服務啟用失敗', { error: String(error?.message || error) });
            }
          });
        },
        applyPwaUpdate() {
          if (this.pwaUpdateApplying) return;
          if (this.hasProtectedAppActivity) {
            this.pwaUpdateDeferred = true;
            this.recordRuntimeDiagnostic('update', 'warning', 'App 更新已延後：目前有未完成的修改或同步');
            this.showToast('請先完成目前的修改或同步，再套用 App 更新', 'warning', 6500);
            return;
          }
          if (!this.pwaReloadDecision().allow) {
            this.recordRuntimeDiagnostic('update', 'warning', 'App 更新已阻止：短時間內曾重新載入');
            this.showToast('剛完成一次更新，請關閉 App 後再開啟', 'warning', 6500);
            return;
          }
          if (!this.pendingServiceWorker) {
            this.checkPwaUpdate(true);
            return;
          }
          this.pwaUpdateDeferred = false;
          this.pwaUpdateApplying = true;
          this.recordRuntimeDiagnostic('update', 'info', '正在套用 App 新版本', { version: this.appVersion });
          this.showToast('正在更新到最新版…', 'loading', 6000);
          try {
            this.pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
          } catch (error) {
            this.pwaUpdateApplying = false;
            this.recordRuntimeDiagnostic('update', 'error', 'App 更新套用失敗', { error: String(error?.message || error) });
            this.showToast('App 更新未完成，請稍後再試', 'error', 6500);
            return;
          }
          setTimeout(() => {
            if (!this.pwaRefreshing) this.pwaUpdateApplying = false;
          }, 10000);
        },
        dismissPwaUpdate() {
          this.updateAvailable = false;
          this.pwaUpdateDeferred = true;
        },
        generateStableId(prefix) {
          const randomPart = window.crypto && crypto.randomUUID
            ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
            : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
          return `${prefix}_${randomPart}`;
        },
        normalizeCustomerName(name) {
          return String(name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('zh-TW');
        },
        shortCustomerId(customerId) {
          return String(customerId || '').replace(/^cust_/, '').slice(-6).toUpperCase();
        },
        resolveMergedCustomerId(customerId) {
          let currentId = String(customerId || '');
          const visited = new Set();
          while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const customer = this.rawCustomerMap?.[currentId]
              || this.customers.find(item => item.id === currentId);
            if (!customer?.mergedIntoCustomerId) break;
            currentId = String(customer.mergedIntoCustomerId);
          }
          return currentId || String(customerId || '');
        },
        findCustomerByName(name) {
          return this.findCustomersByName(name)[0] || null;
        },
        findCustomersByName(name) {
          const normalized = this.normalizeCustomerName(name);
          if (!normalized) return [];
          return this.activeCustomers.filter(customer => this.normalizeCustomerName(customer.name) === normalized);
        },
        findOrCreateCustomer(name, gender = '女', preferredId = null, forceNew = false) {
          const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
          if (!cleanName) return null;
          if (preferredId && this.customerMap[preferredId]) return this.customerMap[preferredId];
          const matches = forceNew ? [] : this.findCustomersByName(cleanName);
          if (!forceNew && matches.length > 1) return null;
          const existing = matches[0] || null;
          if (existing) {
            if (!existing.gender && gender) existing.gender = gender;
            return existing;
          }
          const now = new Date().toISOString();
          const customer = {
            id: preferredId || this.generateStableId('cust'),
            name: cleanName,
            gender: gender || '女',
            createdAt: now,
            updatedAt: now
          };
          this.customers.push(customer);
          return customer;
        },
        selectNewOrderCustomer() {
          const customer = this.customerMap[this.newOrder.customerId];
          if (!customer) return;
          this.newOrder.createNewCustomer = false;
          this.newOrder.customerName = customer.name;
          this.newOrder.gender = customer.gender || '女';
        },
        applyQuickService(service) {
          if (!service?.name) return;
          this.newOrder.serviceName = service.name;
          if (Number(service.price) > 0) this.newOrder.amount = Number(service.price);
        },
        onOrderCustomerIdChanged(order) {
          const customer = this.customerMap[order.customerId];
          if (!customer) return;
          order.customerName = customer.name;
          order.gender = customer.gender || order.gender || '女';
          this.saveOrders();
        },
        migrateCustomerIdentity() {
          const rawCustomers = Array.isArray(this.customers) ? this.customers : [];
          const ids = new Set();
          this.customers = rawCustomers
            .filter(customer => customer && customer.name)
            .map(customer => {
              let id = String(customer.id || '');
              if (!id || ids.has(id)) id = this.generateStableId('cust');
              ids.add(id);
              return {
                id,
                name: String(customer.name).trim(),
                gender: customer.gender || '女',
                mergedIntoCustomerId: customer.mergedIntoCustomerId || customer.merged_into_customer_id || null,
                archivedAt: customer.archivedAt || customer.archived_at || null,
                createdAt: customer.createdAt || new Date().toISOString(),
                updatedAt: customer.updatedAt || customer.createdAt || new Date().toISOString(),
                version: Number(customer.version) || 1
              };
            });

          const validCustomerIds = new Set(this.customers.map(customer => customer.id));
          this.customers.forEach(customer => {
            if (!validCustomerIds.has(customer.mergedIntoCustomerId) || customer.mergedIntoCustomerId === customer.id) {
              customer.mergedIntoCustomerId = null;
              customer.archivedAt = null;
            }
          });
          const customerById = new Map(this.customers.map(customer => [customer.id, customer]));
          this.customers.forEach(customer => {
            if (!customer.mergedIntoCustomerId) return;
            const path = [];
            const seen = new Set();
            let cursor = customer;
            while (cursor?.mergedIntoCustomerId) {
              if (seen.has(cursor.id)) {
                path.forEach(item => {
                  item.mergedIntoCustomerId = null;
                  item.archivedAt = null;
                });
                return;
              }
              seen.add(cursor.id);
              path.push(cursor);
              cursor = customerById.get(cursor.mergedIntoCustomerId);
            }
            if (cursor && cursor.id !== customer.id) {
              customer.archivedAt = customer.archivedAt || customer.updatedAt || new Date().toISOString();
            }
          });

          this.orders.forEach(order => {
            if (!order || !order.customerName || this.isBlockedSlot(order.customerName)) return;
            let customer = order.customerId ? this.customers.find(item => item.id === order.customerId) : null;
            if (!customer) {
              const matches = this.findCustomersByName(order.customerName);
              customer = matches.length === 1 ? matches[0] : (matches.length ? null : this.findOrCreateCustomer(order.customerName, order.gender));
            }
            if (!customer) return;
            order.customerId = customer.id;
            if (!order.customerName) order.customerName = customer.name;
          });

          const migrateKeyedRecords = source => {
            const migrated = {};
            Object.entries(source && typeof source === 'object' ? source : {}).forEach(([key, value]) => {
              const existingCustomer = this.customers.find(customer => customer.id === key);
              const ambiguousLegacyName = !existingCustomer && this.findCustomersByName(key).length > 1;
              const customer = existingCustomer || this.findOrCreateCustomer(key, '女', null, ambiguousLegacyName);
              if (customer && migrated[customer.id] === undefined) migrated[customer.id] = value;
            });
            return migrated;
          };
          this.crmNotes = migrateKeyedRecords(this.crmNotes);
          this.crmFormulas = migrateKeyedRecords(this.crmFormulas);

          this.prepaidLedger = (Array.isArray(this.prepaidLedger) ? this.prepaidLedger : [])
            .filter(entry => entry && entry.customerId)
            .map(entry => {
              const signedAmount = Number(entry.signedAmount ?? (entry.type === 'in' ? entry.amount : -entry.amount)) || 0;
              return {
                ...entry,
                id: entry.id || this.generateStableId('txn'),
                signedAmount,
                amount: Math.abs(signedAmount),
                kind: entry.kind || (signedAmount >= 0 ? 'topup' : 'debit'),
                bucket: entry.bucket || (entry.kind === 'topup' ? 'topup' : entry.kind === 'debit' ? 'debit' : signedAmount >= 0 ? 'topup' : 'debit'),
                reversalOfEntryId: entry.reversalOfEntryId || entry.reversal_of_entry_id || null,
                transferGroupId: entry.transferGroupId || entry.transfer_group_id || null,
                systemManaged: Boolean(entry.systemManaged ?? entry.system_managed),
                createdAt: entry.createdAt || new Date().toISOString()
              };
            });
        },
        appendPrepaidLedgerEntry({ customerId, signedAmount, kind, bucket, date, sourceOrderId, serviceName, paymentMethod, note, reversalOfEntryId, transferGroupId, systemManaged }) {
          const amount = Math.round(Number(signedAmount) || 0);
          if (!customerId || !amount) return null;
          const customer = this.customerMap[customerId];
          const entry = {
            id: this.generateStableId('txn'),
            customerId,
            customerNameSnapshot: customer ? customer.name : '未知顧客',
            signedAmount: amount,
            amount: Math.abs(amount),
            kind: kind || (amount > 0 ? 'topup' : 'debit'),
            bucket: bucket || (amount > 0 ? 'topup' : 'debit'),
            date: date || new Date().toLocaleDateString('sv-SE'),
            sourceOrderId: sourceOrderId || null,
            serviceName: serviceName || (amount > 0 ? '儲值進帳' : '儲值扣款'),
            paymentMethod: paymentMethod || (amount > 0 ? '儲值進帳' : '儲值扣款'),
            note: note || '',
            reversalOfEntryId: reversalOfEntryId || null,
            transferGroupId: transferGroupId || null,
            systemManaged: Boolean(systemManaged),
            createdAt: new Date().toISOString()
          };
          this.prepaidLedger.push(entry);
          return entry;
        },
        getOrderPrepaidBucket(order = {}) {
          return MomoCore.getOrderPrepaidBucket(order);
        },
        prepaidKindForTarget(target, bucket, fallback = 'adjustment') {
          return MomoCore.prepaidKindForTarget(target, bucket, fallback);
        },
        getOrderPrepaidTarget(order) {
          return MomoCore.getOrderPrepaidTarget(order);
        },
        prepaidEntryReversed(entry = {}) {
          return MomoCore.prepaidEntryReversed(this.prepaidLedger, entry);
        },
        canReversePrepaidEntry(entry = {}) {
          return MomoCore.canReversePrepaidEntry(this.prepaidLedger, entry);
        },
        reversePrepaidLedgerEntry(entry = {}) {
          if (!this.canReversePrepaidEntry(entry)) {
            this.showToast(entry.sourceOrderId ? '訂單分錄請直接更正訂單，系統會自動追加差額' : '此儲值分錄已沖銷或不可沖銷', 'error');
            return;
          }
          const today = new Date().toLocaleDateString('sv-SE');
          if (this.isDateLocked(today)) {
            this.showToast(`${today} 已打烊鎖帳，無法在今日新增沖銷分錄`, 'error', 7000);
            return;
          }
          const amount = Math.round(Number(entry.signedAmount) || 0);
          this.showConfirm(
            `確定沖銷這筆儲值帳本嗎？\n\n${entry.date} ${entry.customerName || entry.customerNameSnapshot || ''}\n${this.ledgerKindLabel(entry.kind)}：${amount >= 0 ? '+' : ''}NT$ ${this.formatNumber(amount)}\n\n系統會新增一筆反向分錄，不會刪除原紀錄。`,
            () => {
              const payload = MomoCore.buildPrepaidReversalPayload(entry, today);
              if (!payload || !this.canReversePrepaidEntry(entry)) {
                this.showToast('此分錄已無法沖銷，請重新整理後再確認', 'error');
                return;
              }
              const reversal = this.appendPrepaidLedgerEntry(payload);
              this.saveCustomerData();
              this.recordOperation('prepaid_ledger_reversal', '儲值帳本反向沖銷', `${entry.customerName || entry.customerNameSnapshot || ''} ${this.ledgerKindLabel(entry.kind)} NT$ ${this.formatNumber(amount)}`, {
                ledgerEntryId: entry.id,
                reversalEntryId: reversal?.id || null,
                customerId: entry.customerId
              });
              this.showToast('已新增反向沖銷分錄');
            },
            { title: '儲值帳本反向沖銷', subtitle: '原始分錄會保留供日後對帳', tone: 'warning', confirmLabel: '建立反向分錄', loadingLabel: '建立中…' }
          );
        },
        reconcilePrepaidLedger() {
          const today = new Date().toLocaleDateString('sv-SE');
          this.orders.forEach(order => {
            if (!order || !order.id || !order.customerName || this.isBlockedSlot(order.customerName)) return;
            let customer = order.customerId ? this.rawCustomerMap[order.customerId] : null;
            if (!customer) {
              const matches = this.findCustomersByName(order.customerName);
              customer = matches.length === 1 ? matches[0] : (matches.length ? null : this.findOrCreateCustomer(order.customerName, order.gender));
            }
            if (!customer) return;
            order.customerId = customer.id;
            if (!order.customerName) order.customerName = customer.name;
          });
          const accountingOrderIds = new Set(this.accountingOrders.map(order => String(order.id || '')));
          const planned = MomoCore.planPrepaidLedgerReconciliation(this.orders, this.prepaidLedger, {
            today,
            accountingOrderIds,
            resolveCustomerId: customerId => this.resolveMergedCustomerId(customerId)
          });
          planned.forEach(payload => this.appendPrepaidLedgerEntry(payload));
        },
        saveCustomerData() {
          const previousCustomers = safeParse(localStorage.getItem('momo_customers'), []);
          const previousLedger = safeParse(localStorage.getItem('momo_prepaidLedger'), []);
          try {
            this.writeLocalStorageAtomically([
              ['momo_customers', JSON.stringify(this.customers)],
              ['momo_prepaidLedger', JSON.stringify(this.prepaidLedger)],
              ['momo_data_schema_version', String(this.dataSchemaVersion)]
            ]);
            this.queueCloudSync();
            return true;
          } catch (error) {
            this.customers = Array.isArray(previousCustomers) ? previousCustomers : [];
            this.prepaidLedger = Array.isArray(previousLedger) ? previousLedger : [];
            this.showToast('顧客與儲值帳本儲存失敗，畫面已回復上次完整版本', 'error', 9000);
            throw error;
          }
        },
        // LocalStorage loading
        loadFromLocalStorage() {
          const recovery = this.recoverInterruptedStorageWrite();
          const clone = value => JSON.parse(JSON.stringify(value));
          const storedSchemaVersion = Math.max(1, Number(localStorage.getItem('momo_data_schema_version')) || 1);
          const parsedOrders = safeParse(localStorage.getItem('momo_orders'), clone(defaultOrders));
          const parsedExpenses = safeParse(localStorage.getItem('momo_expenses'), clone(defaultExpenses));
          const parsedInventory = safeParse(localStorage.getItem('momo_inventory'), clone(defaultInventory));
          this.orders = Array.isArray(parsedOrders) ? parsedOrders : clone(defaultOrders);
          this.expenses = (Array.isArray(parsedExpenses) ? parsedExpenses : clone(defaultExpenses)).map(expense => ({
            ...expense,
            paymentMethod: MomoCore.normalizeExpensePaymentMethod(expense?.paymentMethod)
          }));
          this.inventory = Array.isArray(parsedInventory) ? parsedInventory : clone(defaultInventory);
          this.customers = safeParse(localStorage.getItem('momo_customers'), []);
          this.prepaidLedger = safeParse(localStorage.getItem('momo_prepaidLedger'), []);
          this.crmNotes = safeParse(localStorage.getItem('momo_crmNotes'), clone(defaultCrmNotes));
          this.crmFormulas = safeParse(localStorage.getItem('momo_crmFormulas'), {});
          const parsedCloseouts = safeParse(localStorage.getItem('momo_closeoutRecords'), {});
          this.closeoutRecords = Object.fromEntries(Object.entries(parsedCloseouts || {}).map(([date, record]) => {
            const cash = Math.round(Number(record?.cash) || 0);
            const cashPrepaidIn = Math.round(Number(record?.cashPrepaidIn) || 0);
            return [date, {
              ...record,
              openingCash: Math.max(0, Math.round(Number(record?.openingCash) || 0)),
              cashExpenses: Math.max(0, Math.round(Number(record?.cashExpenses) || 0)),
              actualCashIn: record?.actualCashIn === undefined || record?.actualCashIn === null
                ? cash + cashPrepaidIn
                : Math.round(Number(record.actualCashIn) || 0)
            }];
          }));
          const savedServicesConfig = safeParse(localStorage.getItem('momo_servicesConfig'), clone(defaultServicesConfig));
          this.servicesConfig = Array.isArray(savedServicesConfig) ? savedServicesConfig : clone(defaultServicesConfig);
          const todayRecord = this.closeoutRecords[new Date().toLocaleDateString('sv-SE')];
          if (todayRecord) {
            this.closeoutOpeningCash = Math.max(0, Number(todayRecord.openingCash) || 0);
            this.closeoutCashCount = todayRecord.countedCash;
            this.closeoutNote = todayRecord.note || '';
          }
          if (recovery.blocked) return;
          this.migrateLegacyCalendarActualDurations(storedSchemaVersion);

          // 一次性移除舊版內建範例；只比對固定範例 ID／原始內容，不碰正式資料
          if (localStorage.getItem('momo_examples_removed_v1') !== '1') {
            const demoExpenseIds = new Set(['exp_1', 'exp_2', 'exp_3']);
            const demoInventoryIds = new Set(['inv_1', 'inv_2', 'inv_3', 'inv_4']);
            const demoCrmNotes = {
              '怡君': '敏感性頭皮，洗髮時力道要輕，水溫偏好溫涼。\n配方：染髮使用 7-CB 巧克力棕，搭配 6% 雙氧。',
              '冠宇': '鬢角剪短，偏好日系抓整風格。\n配方：挑染使用漂粉1次，上色 8-MT 薄荷灰。',
              '美玲': '喜歡喝熱水。注重髮質保養。\n配方：每兩週做一次結構式護髮，居家搭配護髮素。'
            };

            this.orders = this.orders.filter(order => !String(order.id || '').startsWith('mock_'));
            this.expenses = this.expenses.filter(expense => !demoExpenseIds.has(String(expense.id || '')));
            this.inventory = this.inventory.filter(item => !demoInventoryIds.has(String(item.id || '')));
            Object.entries(demoCrmNotes).forEach(([name, note]) => {
              if (this.crmNotes[name] === note) delete this.crmNotes[name];
            });

            localStorage.setItem('momo_examples_removed_v1', '1');
          }

          this.migrateCustomerIdentity();
          this.reconcilePrepaidLedger();

          this.saveToLocalStorage({ queueCloud: storedSchemaVersion < this.dataSchemaVersion });
        },

        recoverInterruptedStorageWrite() {
          const raw = localStorage.getItem('momo_restore_in_progress');
          if (!raw) return { recovered: false, blocked: false };
          const journal = safeParse(raw, null);
          if (!journal || journal.version !== 1 || !Array.isArray(journal.previous)
            || journal.previous.some(item => !Array.isArray(item) || item.length !== 2 || typeof item[0] !== 'string')) {
            this.storageRecoveryBlocked = {
              detectedAt: new Date().toISOString(),
              reason: 'invalid_restore_journal'
            };
            return { recovered: false, blocked: true };
          }
          try {
            [...journal.previous].reverse().forEach(([key, value]) => {
              if (value === null) localStorage.removeItem(key);
              else localStorage.setItem(key, String(value));
            });
            localStorage.removeItem('momo_restore_in_progress');
            const notice = {
              recoveredAt: new Date().toISOString(),
              interruptedAt: journal.startedAt || null
            };
            localStorage.setItem('momo_storage_recovery_notice', JSON.stringify(notice));
            this.storageRecoveryNotice = notice;
            this.storageRecoveryBlocked = null;
            return { recovered: true, blocked: false };
          } catch (error) {
            this.storageRecoveryBlocked = {
              detectedAt: new Date().toISOString(),
              reason: 'restore_journal_recovery_failed',
              message: String(error?.message || error)
            };
            return { recovered: false, blocked: true };
          }
        },

        // LocalStorage saving (legacy fallback for compatibility)
        saveToLocalStorage(options = {}) {
          return this.persistCurrentStateStrict(
            localStorage.getItem('momo_servicesConfigUpdatedAt'),
            { queueCloud: options.queueCloud === true }
          );
        },
        buildBusinessStorageEntries(servicesUpdatedAt = localStorage.getItem('momo_servicesConfigUpdatedAt')) {
          return [
            ['momo_orders', JSON.stringify(this.orders)],
            ['momo_expenses', JSON.stringify(this.expenses)],
            ['momo_inventory', JSON.stringify(this.inventory)],
            ['momo_customers', JSON.stringify(this.customers)],
            ['momo_prepaidLedger', JSON.stringify(this.prepaidLedger)],
            ['momo_crmNotes', JSON.stringify(this.crmNotes)],
            ['momo_crmFormulas', JSON.stringify(this.crmFormulas)],
            ['momo_closeoutRecords', JSON.stringify(this.closeoutRecords)],
            ['momo_servicesConfig', JSON.stringify(this.servicesConfig)],
            ['momo_operation_logs', JSON.stringify(this.operationLogs)],
            ['momo_data_schema_version', String(this.dataSchemaVersion)],
            ['momo_servicesConfigUpdatedAt', servicesUpdatedAt || null]
          ];
        },
        writeLocalStorageAtomically(entries = []) {
          if (this.storageRecoveryBlocked) {
            throw new Error('資料回復尚未完成，已阻止新的本機寫入');
          }
          const normalized = entries.map(([key, value]) => [String(key), value === null ? null : String(value)]);
          const previous = new Map(normalized.map(([key]) => [key, localStorage.getItem(key)]));
          let rollbackError = null;
          try {
            localStorage.setItem('momo_restore_in_progress', JSON.stringify({
              version: 1,
              startedAt: new Date().toISOString(),
              previous: [...previous.entries()]
            }));
            normalized.forEach(([key, value]) => {
              if (value === null) localStorage.removeItem(key);
              else localStorage.setItem(key, value);
            });
            localStorage.removeItem('momo_restore_in_progress');
          } catch (error) {
            [...previous.entries()].reverse().forEach(([key, value]) => {
              try {
                if (value === null) localStorage.removeItem(key);
                else localStorage.setItem(key, value);
              } catch (rollbackFailure) {
                rollbackError = rollbackError || rollbackFailure;
              }
            });
            if (!rollbackError) {
              try { localStorage.removeItem('momo_restore_in_progress'); } catch (_) {}
            }
            if (rollbackError) {
              this.storageRecoveryBlocked = {
                detectedAt: new Date().toISOString(),
                reason: 'atomic_write_rollback_failed',
                message: String(rollbackError?.message || rollbackError)
              };
              throw new Error(`本機儲存失敗，且回復舊資料時發生錯誤：${rollbackError.message || rollbackError}`);
            }
            throw new Error(`本機儲存空間不足或無法寫入，已完整回復原資料：${error.message || error}`);
          }
        },
        persistCurrentStateStrict(servicesUpdatedAt = localStorage.getItem('momo_servicesConfigUpdatedAt'), options = {}) {
          // All JSON is serialized before the first mutation. A synchronous journal then
          // restores every touched key if any LocalStorage write fails.
          this.reconcilePrepaidLedger();
          const entries = this.buildBusinessStorageEntries(servicesUpdatedAt);
          this.writeLocalStorageAtomically(entries);
          if (options.queueCloud !== false) this.queueCloudSync();
          return true;
        },
        saveOrders() {
          const previousOrders = safeParse(localStorage.getItem('momo_orders'), []);
          const previousCustomers = safeParse(localStorage.getItem('momo_customers'), []);
          const previousLedger = safeParse(localStorage.getItem('momo_prepaidLedger'), []);
          try {
            this.reconcilePrepaidLedger();
            this.writeLocalStorageAtomically([
              ['momo_orders', JSON.stringify(this.orders)],
              ['momo_customers', JSON.stringify(this.customers)],
              ['momo_prepaidLedger', JSON.stringify(this.prepaidLedger)],
              ['momo_data_schema_version', String(this.dataSchemaVersion)]
            ]);
            const used = new Blob(Object.values(localStorage)).size;
            if (used > 4 * 1024 * 1024) { // 超過 4MB 警告
              this.showToast('儲存空間已使用超過 4MB，建議匯出備份後清理舊資料', 'error', 8000);
            }
            this.queueCloudSync();
            return true;
          } catch (error) {
            this.orders = Array.isArray(previousOrders) ? previousOrders : [];
            this.customers = Array.isArray(previousCustomers) ? previousCustomers : [];
            this.prepaidLedger = Array.isArray(previousLedger) ? previousLedger : [];
            this.showToast('業績儲存失敗，畫面已回復上次完整版本；請立即匯出備份', 'error', 9000);
            throw error;
          }
        },
        saveExpenses() {
          const previous = safeParse(localStorage.getItem('momo_expenses'), []);
          try {
            this.writeLocalStorageAtomically([['momo_expenses', JSON.stringify(this.expenses)]]);
            this.queueCloudSync();
            return true;
          } catch (error) {
            this.expenses = Array.isArray(previous) ? previous : [];
            this.showToast('支出儲存失敗，畫面已回復上次完整版本；請立即匯出備份', 'error', 9000);
            throw error;
          }
        },
        saveInventory() {
          const previous = safeParse(localStorage.getItem('momo_inventory'), []);
          try {
            this.writeLocalStorageAtomically([['momo_inventory', JSON.stringify(this.inventory)]]);
            this.queueCloudSync();
            return true;
          } catch (error) {
            this.inventory = Array.isArray(previous) ? previous : [];
            this.showToast('庫存儲存失敗，畫面已回復上次完整版本；請立即匯出備份', 'error', 9000);
            throw error;
          }
        },
        saveServicesConfigOnly() {
          this.writeLocalStorageAtomically([['momo_servicesConfig', JSON.stringify(this.servicesConfig)]]);
          this.queueCloudSync();
          return true;
        },
        // Immediate save for CRM notes
        saveCrmNotesImmediately() {
          if (this.crmNotesTimer) {
            clearTimeout(this.crmNotesTimer);
            this.crmNotesTimer = null;
          }
          this.writeLocalStorageAtomically([['momo_crmNotes', JSON.stringify(this.crmNotes)]]);
          this.queueCloudSync();
          this.recordOperation('crm_note_update', '修改 CRM 備註', '已更新顧客補充紀錄');
        },
        ensureFormula(name) {
          if (!this.crmFormulas[name]) {
            this.crmFormulas[name] = { color: '', perm: '', hair: '', preference: '', caution: '', updatedAt: '' };
          }
          return this.crmFormulas[name];
        },
        setFormulaField(name, key, value) {
          const previous = safeParse(localStorage.getItem('momo_crmFormulas'), {});
          const formula = this.ensureFormula(name);
          formula[key] = value;
          formula.updatedAt = new Date().toLocaleDateString('sv-SE');
          try {
            this.writeLocalStorageAtomically([['momo_crmFormulas', JSON.stringify(this.crmFormulas)]]);
            this.queueCloudSync();
          } catch (error) {
            this.crmFormulas = previous;
            throw error;
          }
        },
        saveCustomerProfile(customer) {
          if (!customer?.id) return;
          customer.name = String(customer.name || '').trim() || '未命名顧客';
          customer.gender = customer.gender || '女';
          customer.updatedAt = new Date().toISOString();
          this.orders.forEach(order => {
            if (order.customerId === customer.id) {
              order.customerName = customer.name;
              order.gender = customer.gender;
            }
          });
          this.prepaidLedger.forEach(entry => {
            if (entry.customerId === customer.id) entry.customerNameSnapshot = customer.name;
          });
          this.saveOrders();
          this.recordOperation('customer_update', '修改顧客資料', `${customer.name} · ${customer.gender}`, { customerId: customer.id });
          this.runIntegrityCheck(false);
          this.showToast('顧客資料已更新');
        },
        toggleCustomerTag(customerId, tag) {
          if (!customerId || !tag) return;
          const formula = this.ensureFormula(customerId);
          const tags = Array.isArray(formula.tags) ? [...formula.tags] : [];
          const index = tags.indexOf(tag);
          if (index >= 0) tags.splice(index, 1);
          else tags.push(tag);
          formula.tags = tags;
          formula.updatedAt = new Date().toLocaleDateString('sv-SE');
          this.saveCrmFormulas(customerId);
          this.recordOperation('crm_tag_update', '修改顧客標籤', `${this.customerMap[customerId]?.name || customerId} · ${tag}`, { customerId });
        },
        mergeCustomerInto(sourceId, targetId) {
          if (!sourceId || !targetId || sourceId === targetId) {
            this.showToast('請先選擇要保留的顧客', 'error');
            return;
          }
          const source = this.rawCustomerMap[sourceId];
          const target = this.rawCustomerMap[targetId];
          if (!source || !target || source.archivedAt || source.mergedIntoCustomerId || target.archivedAt || target.mergedIntoCustomerId) {
            this.showToast('找不到要合併的顧客', 'error');
            return;
          }
          this.showConfirm(`確定把「${source.name}」合併到「${target.name}」嗎？舊顧客會封存，帳務只會新增轉移分錄，不會改寫歷史。`, async () => {
            const rollback = this.buildBackupData();
            const mergedAt = new Date().toISOString();
            const transferDate = new Date().toLocaleDateString('sv-SE');
            const createdLedgerEntries = [];
            const appendTransfer = payload => {
              const entry = this.appendPrepaidLedgerEntry(payload);
              if (entry) createdLedgerEntries.push(entry);
              return entry;
            };

            const orderLinkedGroups = new Map();
            this.prepaidLedger.forEach(entry => {
              if (entry.customerId !== sourceId || !entry.sourceOrderId) return;
              const date = /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || '')) ? entry.date : transferDate;
              const key = JSON.stringify([String(entry.sourceOrderId), date]);
              const group = orderLinkedGroups.get(key) || {
                sourceOrderId: String(entry.sourceOrderId),
                date,
                total: 0,
                latest: entry
              };
              group.total += Number(entry.signedAmount) || 0;
              group.latest = entry;
              orderLinkedGroups.set(key, group);
            });

            orderLinkedGroups.forEach(group => {
              const amount = Math.round(Number(group.total) || 0);
              if (!amount) return;
              const common = {
                bucket: group.latest?.bucket || (amount > 0 ? 'topup' : 'debit'),
                date: group.date,
                sourceOrderId: group.sourceOrderId,
                transferGroupId: this.generateStableId('xfer'),
                systemManaged: true,
                serviceName: group.latest?.serviceName || '顧客合併帳務轉移',
                paymentMethod: group.latest?.paymentMethod || '',
                note: `顧客合併轉移：${source.name} → ${target.name}`
              };
              appendTransfer({ ...common, customerId: sourceId, signedAmount: -amount, kind: 'adjustment' });
              appendTransfer({ ...common, customerId: targetId, signedAmount: amount, kind: 'adjustment' });
            });

            const sourceRemainingBalance = Math.round(this.prepaidLedger
              .filter(entry => entry.customerId === sourceId)
              .reduce((sum, entry) => sum + (Number(entry.signedAmount) || 0), 0));
            if (sourceRemainingBalance) {
              const common = {
                bucket: sourceRemainingBalance > 0 ? 'topup' : 'debit',
                date: transferDate,
                sourceOrderId: null,
                transferGroupId: this.generateStableId('xfer'),
                systemManaged: true,
                serviceName: '顧客合併餘額轉移',
                paymentMethod: '',
                note: `顧客合併餘額轉移：${source.name} → ${target.name}`
              };
              appendTransfer({ ...common, customerId: sourceId, signedAmount: -sourceRemainingBalance, kind: 'adjustment' });
              appendTransfer({ ...common, customerId: targetId, signedAmount: sourceRemainingBalance, kind: 'adjustment' });
            }

            // 歷史訂單保留原顧客 ID；CRM/KPI 查詢時透過合併鏈聚合到最終顧客。

            const sourceNote = String(this.crmNotes[sourceId] || '').trim();
            if (sourceNote) {
              this.crmNotes[targetId] = [this.crmNotes[targetId], `【合併自 ${source.name}】${sourceNote}`].filter(Boolean).join('\n');
            }

            const sourceFormula = this.crmFormulas[sourceId] || {};
            const targetFormula = this.ensureFormula(targetId);
            const mergeHistory = Array.isArray(targetFormula.mergeHistory) ? [...targetFormula.mergeHistory] : [];
            mergeHistory.push({
              sourceCustomerId: sourceId,
              sourceName: source.name,
              mergedAt,
              formula: MomoCore.cloneJsonValue(sourceFormula)
            });
            Object.entries(sourceFormula).forEach(([key, value]) => {
              if (key === 'mergeHistory' || key === 'updatedAt') return;
              if (key === 'tags') {
                const mergedTags = new Set([...(targetFormula.tags || []), ...(Array.isArray(value) ? value : [])]);
                targetFormula.tags = [...mergedTags];
              } else if (value && !targetFormula[key]) {
                targetFormula[key] = value;
              } else if (value && targetFormula[key] && JSON.stringify(value) !== JSON.stringify(targetFormula[key])) {
                const targetText = typeof targetFormula[key] === 'string' ? targetFormula[key] : JSON.stringify(targetFormula[key]);
                const sourceText = typeof value === 'string' ? value : JSON.stringify(value);
                targetFormula[key] = `${targetText}\n【合併自 ${source.name}】${sourceText}`;
              }
            });
            targetFormula.mergeHistory = mergeHistory;
            targetFormula.updatedAt = new Date().toLocaleDateString('sv-SE');

            delete this.crmNotes[sourceId];
            delete this.crmFormulas[sourceId];
            // 保留 A→B→C 的歷史鏈，不改寫已完成合併的指標；查詢時再解析到最終顧客。
            source.mergedIntoCustomerId = targetId;
            source.archivedAt = mergedAt;
            source.updatedAt = mergedAt;
            target.updatedAt = mergedAt;
            delete this.mergeTargetByCustomer[sourceId];
            this.expandedCrmCustomerName = targetId;

            try {
              this.persistCurrentStateStrict(localStorage.getItem('momo_servicesConfigUpdatedAt'));
            } catch (error) {
              this.replaceBusinessStateFromBackup(rollback, true);
              try {
                this.persistCurrentStateStrict(rollback.momo_servicesConfigUpdatedAt || null);
              } catch (rollbackError) {
                console.error('Customer merge rollback failed:', rollbackError);
              }
              this.showToast(`顧客合併失敗，原資料已保留：${error.message || error}`, 'error', 9000);
              return;
            }
            this.recordOperation('customer_merge', '合併顧客', `${source.name} → ${target.name} · 新增 ${createdLedgerEntries.length} 筆轉移分錄`, {
              sourceId,
              targetId,
              transferredLedgerEntryIds: createdLedgerEntries.map(entry => entry.id)
            });
            this.runIntegrityCheck(false);
            if (this.cloudReady && this.authUser) {
              try {
                this.clearQueuedCloudSync();
                const synced = await this.pushCloudSnapshot();
                if (!synced) throw new Error(this.cloudMessage || '雲端同步尚未完成');
              } catch (error) {
                console.error('Cloud customer merge sync failed:', error);
                this.queueCloudSync(3000);
                this.showToast(`本機已合併，雲端同步稍後重試：${error.message}`, 'error', 8000);
                return;
              }
            }
            this.showToast(`已合併到 ${target.name}`);
          }, { title: '合併顧客資料', subtitle: `保留「${target.name}」，來源顧客封存供稽核`, tone: 'warning', confirmLabel: '確認合併', loadingLabel: '合併中…' });
        },
        saveCrmFormulas(name) {
          if (name && this.crmFormulas[name]) this.crmFormulas[name].updatedAt = new Date().toLocaleDateString('sv-SE');
          this.writeLocalStorageAtomically([['momo_crmFormulas', JSON.stringify(this.crmFormulas)]]);
          this.queueCloudSync();
          if (name) this.recordOperation('crm_update', '修改 CRM 配方/回訪', this.customerMap[name]?.name || name, { customerId: name });
        },
        collectOperationalIssues() {
          const issues = [];
          const push = (severity, code, message, target = {}) => {
            if (issues.length < 100) issues.push({ severity, code, message, ...target });
          };
          const orderKeyCounts = {};
          const orderKeyFirst = {};
          const startDate = this.pendingActionStartDate || '2026-07-01';
          const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

          this.orders.forEach(order => {
            if (!order || !this.isOrderActive(order) || this.isBlockedSlot(order.customerName)) return;
            if (validDate(order.date) && order.date < startDate) return;
            const amount = Number(order.amount) || 0;
            const label = `${order.date || '未填日期'} ${order.customerName || '未知顧客'} ${order.serviceName || '未填服務'}`;
            const target = { tab: 'orders', orderId: order.id, customerId: order.customerId };
            const key = [order.date, order.customerId ? this.resolveMergedCustomerId(order.customerId) : this.normalizeCustomerName(order.customerName), order.serviceName, amount].join('|');
            orderKeyCounts[key] = (orderKeyCounts[key] || 0) + 1;
            if (!orderKeyFirst[key]) orderKeyFirst[key] = order;

            if (!order.paymentMethod) push('error', 'order_missing_payment', `${label} 缺少付款方式`, target);
            if (!this.isCorrectionSlip(order) && amount <= 0) push('error', 'order_zero_amount', `${label} 金額為 0，會影響報表`, target);
            if (this.isCorrectionSlip(order) && !amount) push('error', 'correction_zero_amount', `${label} 更正單金額不可為 0`, target);
            if (!this.isCorrectionSlip(order) && order.paymentMethod === '現金＋儲值扣款' && !(Number(order.cashAmount) > 0 && Number(order.cashAmount) < amount)) {
              push('error', 'order_invalid_mixed_payment', `${label} 混合付款現金金額不完整`, target);
            }
            if (order.paymentMethod === '儲值進帳' && !['現金', '轉帳'].includes(this.getTopupChannel(order))) {
              push('error', 'order_invalid_topup_channel', `${label} 儲值進帳缺少收款方式`, target);
            }
            if (order.paymentMethod !== '儲值進帳' && /儲值進帳|儲值入帳|充值|加值/.test(String(order.serviceName || ''))) {
              push('warning', 'topup_marked_as_service', `${label} 看起來像儲值，請確認付款方式`, target);
            }
            if (order.paymentMethod === '現金' && order.source === 'google_calendar' && !order.orderId && !order.sourceEventId) {
              push('warning', 'calendar_payment_default_cash', `${label} 可能是行事曆未標付款，系統預設現金`, target);
            }
          });

          Object.entries(orderKeyCounts).forEach(([key, count]) => {
            if (count > 1) {
              const [date, customerRef, serviceName] = key.split('|');
              push('warning', 'duplicate_same_day_order', `${date} ${customerRef} ${serviceName} 可能重複 ${count} 筆`, { tab: 'orders', orderId: orderKeyFirst[key]?.id, customerId: orderKeyFirst[key]?.customerId });
            }
          });

          Object.entries(this.prepaidTotalsByCustomer || {}).forEach(([customerId, totals]) => {
            if (Number(totals.balance) < 0) {
              const hasRecentLedger = (this.prepaidLedger || []).some(entry => this.resolveMergedCustomerId(entry.customerId) === customerId && validDate(entry.date) && entry.date >= startDate);
              if (!hasRecentLedger) return;
              const customer = this.customerMap[customerId];
              push('warning', 'negative_prepaid_balance', `${customer?.name || customerId} 儲值餘額為負數`, { tab: 'crm', customerId });
            }
          });

          Object.values(this.closeoutRecords || {}).forEach(record => {
            if (!record?.date) return;
            if (validDate(record.date) && record.date < startDate) return;
            if (Number(record.difference || 0) !== 0 && !String(record.note || '').trim()) {
              push('warning', `closeout_difference_no_note_${record.date}`, `${record.date} 打烊有差額但未填備註`, { tab: 'closeout', date: record.date });
            }
          });

          return issues;
        },
        goToAnomaly(issue) {
          if (!issue) return;
          if (issue.tab === 'crm' && issue.customerId) {
            this.goToCustomerCRM(issue.customerId);
            this.showToast('已跳到對應顧客 CRM', 'info');
            return;
          }
          if (issue.tab === 'orders') {
            this.activeTab = 'orders';
            this.ordersCustomerHistoryId = null;
            this.ordersFilterCategory = 'All';
            this.ordersFilterPayment = 'All';
            if (issue.orderId) this.expandedOrderId = issue.orderId;
            this.scrollToTopForNavigation();
            this.showToast(issue.orderId ? '已展開異常業績' : '已跳到業績頁，請依提示查找');
            return;
          }
          if (issue.tab === 'expenses') {
            this.activeTab = 'expenses';
            this.expenseSearchQuery = '';
            this.expenseFilterCategory = 'All';
            if (issue.expenseId) this.expandedExpenseId = issue.expenseId;
            this.scrollToTopForNavigation();
            this.showToast(issue.expenseId ? '已展開異常支出' : '已跳到支出頁，請依提示查找');
            return;
          }
          if (issue.tab === 'closeout') {
            this.openCloseoutSheet(issue.date || new Date().toLocaleDateString('sv-SE'));
            this.showToast('已開啟對應日期打烊');
            return;
          }
          this.activeTab = 'dashboard';
          this.scrollToTopForNavigation();
          this.showToast('已回到今日總覽', 'info');
        },
        handleHealthIssue(issue) {
          if (!issue) return;
          if (issue.code === 'backup_due' || issue.code === 'backup_error' || issue.code === 'cloud_backup_empty' || issue.code === 'cloud_backup_missing_today') {
            this.safetyMaintenanceView = 'backup';
            this.safetyMaintenanceSection = 'maintenance';
            this.handleBackupReminderAction();
            return;
          }
          if (['cloud_backup_error', 'cloud_backup_less_than_local', 'cloud_backup_volume_drop', 'cloud_backup_count_drop'].includes(issue.code)) {
            this.activeTab = 'safety';
            this.safetyMaintenanceView = 'backup';
            this.safetyMaintenanceSection = 'maintenance';
            this.fetchCloudBackupList({ silent: false });
            return;
          }
          if (issue.code === 'pwa_update_available') {
            this.applyPwaUpdate();
            return;
          }
          if (issue.source === 'sync') {
            this.openSyncIssueModal(issue.code === 'unmatched_service_config' ? 'pricing' : 'all');
            return;
          }
          this.goToAnomaly(issue);
        },
        dataCorrectionCategoryLabel(category) {
          return {
            money: '金額付款',
            pricing: '價目服務',
            customers: '顧客資料',
            duplicates: '重複紀錄',
            integrity: '完整性'
          }[category] || '資料';
        },
        async refreshDataCorrectionCenter(showResult = true) {
          if (this.dataCorrectionScanning) return;
          this.dataCorrectionScanning = true;
          try {
            await this.$nextTick();
            this.runIntegrityCheck(false);
            this.dataCorrectionShowAll = false;
            if (showResult) {
              const summary = this.dataCorrectionSummary;
              this.showToast(
                summary.total
                  ? `掃描完成：${summary.errorCount} 個錯誤、${summary.warningCount} 個提醒`
                  : '掃描完成，目前沒有待修正資料',
                summary.errorCount ? 'error' : summary.warningCount ? 'warning' : 'success',
                6500
              );
            }
          } finally {
            this.dataCorrectionScanning = false;
          }
        },
        openDuplicateCustomerGroup(group = {}) {
          const ids = Array.isArray(group.customerIds) ? group.customerIds : [];
          this.activeTab = 'crm';
          this.crmViewMode = 'customers';
          this.crmFilterMode = 'all';
          this.crmSortMode = 'name';
          this.crmVisibleLimit = Math.max(this.crmVisibleLimit || 20, 50);
          this.crmSearchQuery = String(group.displayName || group.normalizedName || '').trim();
          this.expandedCrmCustomerName = ids[0] || null;
          this.scrollToTopForNavigation();
          this.showToast(`找到 ${Math.max(2, Number(group.count) || ids.length)} 筆同名資料，請先比對紀錄，再選擇要保留的顧客`, 'warning', 7500);
        },
        handleDataCorrectionItem(item) {
          if (!item) return;
          if (item.action === 'pricing') {
            this.addUnmatchedServiceToConfig(item.payload || item);
            return;
          }
          if (item.action === 'customer_merge') {
            this.openDuplicateCustomerGroup(item.payload || item);
            return;
          }
          if (item.action === 'sync') {
            this.openSyncIssueModal(item.category === 'pricing' ? 'pricing' : item.category === 'money' ? 'money' : 'all');
            return;
          }
          const target = {
            ...(item.payload || item),
            tab: item.action === 'order' ? 'orders' : item.action === 'expense' ? 'expenses' : item.action === 'customer' ? 'crm' : (item.payload?.tab || item.tab),
            orderId: item.orderId || item.payload?.orderId,
            expenseId: item.expenseId || item.payload?.expenseId,
            customerId: item.customerId || item.payload?.customerId || item.customerIds?.[0]
          };
          if (target.tab) {
            this.goToAnomaly(target);
            return;
          }
          this.showToast('此問題沒有可安全自動定位的欄位，請先重新掃描後查看完整性說明', 'warning', 7000);
        },
        expenseWarnings(expense, periodTotal = this.expensesSummary?.total || 0) {
          const amount = Number(expense?.amount) || 0;
          const notes = String(expense?.notes || '').trim();
          const warnings = [];
          if (!expense?.category) warnings.push({ code: 'missing_category', label: '未分類', tone: 'error' });
          if (!notes) warnings.push({ code: 'missing_note', label: '缺備註', tone: 'warn' });
          if (expense?.category === '其他' && notes.length < 3) warnings.push({ code: 'other_note_short', label: '其他需說明', tone: 'warn' });
          if (amount >= 10000) warnings.push({ code: 'large_amount', label: '大額', tone: 'warn' });
          if (periodTotal > 0 && amount / periodTotal >= 0.5 && amount >= 3000) warnings.push({ code: 'dominant_amount', label: '占比高', tone: 'info' });
          if (expense?.date && expense.date > new Date().toLocaleDateString('sv-SE')) warnings.push({ code: 'future_date', label: '未來日期', tone: 'error' });
          return warnings;
        },
        goToExpense(expenseId) {
          if (!expenseId) return;
          const expense = this.expenses.find(item => item.id === expenseId);
          if (!expense) return;
          this.activeTab = 'expenses';
          this.expenseSearchQuery = '';
          this.expenseFilterCategory = 'All';
          this.collapsedExpenseDates = { ...this.collapsedExpenseDates, [expense.date]: false };
          this.beginExpenseDraft(expense);
          this.expandedExpenseId = expenseId;
          this.scrollToTopForNavigation();
        },
        applyExpensePreset(preset, { openForm = true } = {}) {
          if (!preset) return;
          this.newExpense.date = new Date().toLocaleDateString('sv-SE');
          this.newExpense.category = preset.category || this.newExpense.category || '其他';
          const amount = Number(preset.suggestedAmount ?? preset.amount) || 0;
          this.newExpense.amount = amount > 0 ? amount : null;
          this.newExpense.notes = preset.notes || '';
          if (openForm) this.showExpenseForm = true;
          this.showToast(`已帶入：${preset.label || preset.category}`, 'info');
        },
        expenseTemplateAmountText(template) {
          if (Number(template?.suggestedAmount) > 0) return `帶入 NT$ ${this.formatNumber(template.suggestedAmount)}`;
          return '金額手動輸入';
        },
        expenseTemplateHintText(template) {
          if (!template) return '';
          if (template.lastDate && template.reuseLastAmount && Number(template.suggestedAmount) > 0) return `${template.lastDate} 的金額，可再修改`;
          if (template.lastDate && Number(template.lastAmount) > 0) return `上次 ${template.lastDate} · NT$ ${this.formatNumber(template.lastAmount)}`;
          return template.hint || template.notes || '套用後可修改';
        },
        loadCloseoutFormForDate() {
          const date = this.closeoutDate || new Date().toLocaleDateString('sv-SE');
          const record = this.closeoutRecords[date];
          this.closeoutOpeningCash = record ? Math.max(0, Number(record.openingCash) || 0) : 0;
          this.closeoutCashCount = record ? record.countedCash : null;
          this.closeoutNote = record ? (record.note || '') : '';
        },
        openCloseoutSheet(date = new Date().toLocaleDateString('sv-SE')) {
          this.closeoutDate = date;
          this.loadCloseoutFormForDate();
          this.showCloseoutSheet = true;
        },
        openExpenseFormForToday() {
          this.activeTab = 'expenses';
          this.newExpense.date = new Date().toLocaleDateString('sv-SE');
          this.showExpenseForm = true;
        },
        saveSelectedCloseout() {
          const openingCash = Number(this.closeoutOpeningCash) || 0;
          if (!Number.isSafeInteger(openingCash) || openingCash < 0) {
            this.showToast('開店零用金必須是 0 以上的整數', 'error');
            return false;
          }
          if (this.closeoutCashCount === null || this.closeoutCashCount === '') {
            this.showToast('請先輸入實際盤點現金', 'error');
            return false;
          }
          const countedCash = Number(this.closeoutCashCount);
          if (!Number.isSafeInteger(countedCash) || countedCash < 0) {
            this.showToast('實際盤點現金必須是 0 以上的整數', 'error');
            return false;
          }
          const date = this.closeoutDate || new Date().toLocaleDateString('sv-SE');
          const totals = this.selectedCloseout;
          const difference = countedCash - totals.expectedCash;
          const wasUpdate = Boolean(this.closeoutRecords[date]);
          const previous = wasUpdate ? MomoCore.cloneJsonValue(this.closeoutRecords[date]) : null;
          this.closeoutRecords[date] = {
            date,
            openingCash: totals.openingCash,
            expectedCash: totals.expectedCash,
            countedCash,
            difference,
            cash: totals.cash,
            transfer: totals.transfer,
            prepaidOut: totals.prepaidOut,
            prepaidIn: totals.prepaidIn,
            cashPrepaidIn: totals.cashPrepaidIn,
            transferPrepaidIn: totals.transferPrepaidIn,
            serviceRevenue: totals.serviceRevenue,
            actualCashIn: totals.actualCashIn,
            cashExpenses: totals.cashExpenses,
            expenses: totals.expenses,
            netProfit: totals.netProfit,
            ordersCount: totals.ordersCount,
            serviceOrdersCount: totals.serviceOrdersCount,
            topupCount: totals.topupCount,
            note: this.closeoutNote.trim(),
            completedAt: new Date().toISOString()
          };
          try {
            this.writeLocalStorageAtomically([['momo_closeoutRecords', JSON.stringify(this.closeoutRecords)]]);
          } catch (error) {
            if (previous) this.closeoutRecords[date] = previous;
            else delete this.closeoutRecords[date];
            this.showToast(`打烊儲存失敗，原鎖帳狀態已保留：${error.message || error}`, 'error', 9000);
            return false;
          }
          this.queueCloudSync();
          this.recordOperation('closeout_save', wasUpdate ? '更新打烊' : '完成打烊', `${date} 應有 NT$ ${this.formatNumber(totals.expectedCash)} · 實點 NT$ ${this.formatNumber(this.closeoutCashCount)} · 差額 ${difference > 0 ? '+' : ''}NT$ ${this.formatNumber(difference)}`);
          this.showToast(difference === 0 ? `${date} 打烊完成，現金帳實相符` : `${date} 打烊已記錄，差額 NT$ ${this.formatNumber(difference)}`,
            difference === 0 ? 'success' : 'warning', 5000);
          return true;
        },
        saveTodayCloseout() {
          this.closeoutDate = new Date().toLocaleDateString('sv-SE');
          this.saveSelectedCloseout();
        },
        async completeCloseoutFromSheet() {
          if (this.formActionBusy.closeout) return;
          this.formActionBusy.closeout = true;
          await this.$nextTick();
          try {
            const saved = this.saveSelectedCloseout();
            if (saved) this.showCloseoutSheet = false;
          } finally {
            this.formActionBusy.closeout = false;
          }
        },
        buildCloseoutSummary(record = this.todayCloseoutRecord) {
          if (!record) return '';
          const diff = Number(record.difference) || 0;
          const line = [
            `摸摸頭 momohair 打烊摘要 ${record.date}`,
            `開店零用金：NT$ ${this.formatNumber(record.openingCash || 0)}`,
            `服務營收：NT$ ${this.formatNumber(record.serviceRevenue)}`,
            `現金收入：NT$ ${this.formatNumber(record.cash || 0)}`,
            `轉帳收入：NT$ ${this.formatNumber(record.transfer || 0)}`,
            `儲值扣款：NT$ ${this.formatNumber(record.prepaidOut || 0)}`,
            `儲值進帳：NT$ ${this.formatNumber(record.prepaidIn || 0)}（現金 ${this.formatNumber(record.cashPrepaidIn || 0)}／轉帳 ${this.formatNumber(record.transferPrepaidIn || 0)}）`,
            `今日支出：NT$ ${this.formatNumber(record.expenses)}`,
            `抽屜現金支出：NT$ ${this.formatNumber(record.cashExpenses || 0)}`,
            `工作室淨利：NT$ ${this.formatNumber(record.netProfit ?? ((record.serviceRevenue || 0) - (record.expenses || 0)))}`,
            `應有現金：NT$ ${this.formatNumber(record.expectedCash)}`,
            `實點現金：NT$ ${this.formatNumber(record.countedCash)}`,
            `帳實差額：${diff > 0 ? '+' : ''}NT$ ${this.formatNumber(diff)}`,
            `服務筆數：${record.serviceOrdersCount ?? record.ordersCount ?? 0} 筆`
          ];
          if (record.note) line.push(`備註：${record.note}`);
          return line.join('\n');
        },
        copyTextToClipboard(text, successMessage = '已複製') {
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => this.showToast(successMessage));
          } else {
            const input = document.createElement('textarea');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            input.remove();
            this.showToast(successMessage);
          }
        },
        copyCloseoutSummary(record = null) {
          const text = this.buildCloseoutSummary(record || this.selectedCloseoutRecord || this.todayCloseoutRecord);
          if (!text) {
            this.showToast('尚未建立此日期打烊摘要', 'warning');
            return;
          }
          this.copyTextToClipboard(text, '打烊摘要已複製');
        },
        buildCloseoutDraftRecord() {
          const totals = this.selectedCloseout;
          const counted = this.closeoutCashCount === null || this.closeoutCashCount === '' ? null : Number(this.closeoutCashCount);
          const expected = totals.expectedCash;
          return {
            date: this.closeoutDate || new Date().toLocaleDateString('sv-SE'),
            openingCash: totals.openingCash,
            expectedCash: expected,
            countedCash: counted ?? expected,
            difference: counted === null ? 0 : counted - expected,
            cash: totals.cash,
            transfer: totals.transfer,
            prepaidOut: totals.prepaidOut,
            prepaidIn: totals.prepaidIn,
            cashPrepaidIn: totals.cashPrepaidIn,
            transferPrepaidIn: totals.transferPrepaidIn,
            serviceRevenue: totals.serviceRevenue,
            actualCashIn: totals.actualCashIn,
            cashExpenses: totals.cashExpenses,
            expenses: totals.expenses,
            netProfit: totals.netProfit,
            ordersCount: totals.ordersCount,
            serviceOrdersCount: totals.serviceOrdersCount,
            topupCount: totals.topupCount,
            note: String(this.closeoutNote || '').trim()
          };
        },
        setCloseoutCashToExpected() {
          this.closeoutCashCount = this.selectedCloseout.expectedCash;
          this.showToast('已帶入應有現金', 'info');
        },
        copyCloseoutDraftSummary() {
          this.copyTextToClipboard(this.buildCloseoutSummary(this.buildCloseoutDraftRecord()), '目前打烊摘要已複製');
        },
        copyMonthlySettlementSummary() {
          const s = this.monthlySettlementSummary;
          const p = this.monthlyPrepaidReconciliation;
          const completeness = this.monthlyReportCompleteness;
          const lines = [
            `摸摸頭 momohair 月結摘要 ${s.label}`,
            `營業額：NT$ ${this.formatNumber(s.serviceRevenue)}（${s.ordersCount} 筆，客單 NT$ ${this.formatNumber(s.avgTicket)}）`,
            `支出：NT$ ${this.formatNumber(s.expenses)}`,
            `淨利：NT$ ${this.formatNumber(s.netProfit)}（淨利率 ${completeness.expenseMissing ? '待確認，本月支出為 0' : `${s.profitMargin}%`}）`,
            `現金入帳：NT$ ${this.formatNumber(s.cashIn)}`,
            `轉帳入帳：NT$ ${this.formatNumber(s.transferIn)}`,
            `儲值扣款：NT$ ${this.formatNumber(s.prepaidOut)}`,
            `儲值進帳：NT$ ${this.formatNumber(s.prepaidIn)}`,
            `月結口徑：${s.settlementBasis}`,
            `儲值對帳：期初 NT$ ${this.formatNumber(p.openingBalance)} + 進帳 NT$ ${this.formatNumber(p.topupIn)} - 扣款 NT$ ${this.formatNumber(p.debitOut)} + 調整 NT$ ${this.formatNumber(p.adjustments)} = 期末 NT$ ${this.formatNumber(p.closingBalance)}`,
            `月結狀態：${completeness.label}`
          ];
          if (s.unclosedDates.length) lines.push(`未打烊日期：${s.unclosedDates.join('、')}`);
          this.copyTextToClipboard(lines.join('\n'), '月結摘要已複製');
        },
        addDaysToDate(date, days) {
          if (!date) return '';
          const parsed = new Date(`${date}T00:00:00`);
          if (Number.isNaN(parsed.getTime())) return '';
          parsed.setDate(parsed.getDate() + (Number(days) || 0));
          return parsed.toLocaleDateString('sv-SE');
        },
        getCustomerReturnCycleDays(serviceName = '') {
          return MomoCore.classifyCrmServiceCycle(serviceName).days;
        },
        getCustomerReturnStatus({ count = 0, daysSinceLastVisit = 0, revisitDays = 60, prepaidDormant = false } = {}) {
          const days = Math.max(0, Number(daysSinceLastVisit) || 0);
          const cycle = Math.max(1, Number(revisitDays) || 60);
          const progress = Math.min(200, Math.round(days / cycle * 100));
          if (!count) {
            return {
              group: 'new',
              label: '尚無消費',
              reason: '已建顧客資料，但還沒有服務紀錄。',
              className: 'bg-slate-50 text-slate-600 border-slate-200',
              progress,
              urgency: 0
            };
          }
          if (prepaidDormant) {
            return {
              group: 'prepaidDormant',
              label: '儲值久未來',
              reason: `仍有儲值餘額，且已 ${days} 天未消費。`,
              className: 'bg-violet-50 text-violet-700 border-violet-200',
              progress,
              urgency: 5
            };
          }
          if (days >= 180) {
            return {
              group: 'dormant',
              label: '180天沉睡',
              reason: `距上次消費 ${days} 天，屬長期未回流。`,
              className: 'bg-rose-50 text-rose-600 border-rose-200',
              progress,
              urgency: 4
            };
          }
          if (days >= 90) {
            return {
              group: 'inactive',
              label: '90天未回',
              reason: `距上次消費 ${days} 天，回流節奏明顯變慢。`,
              className: 'bg-amber-50 text-amber-700 border-amber-200',
              progress,
              urgency: 3
            };
          }
          if (days > cycle) {
            return {
              group: 'overdue',
              label: '超過週期',
              reason: `已超過常見 ${cycle} 天整理週期 ${days - cycle} 天。`,
              className: 'bg-orange-50 text-orange-700 border-orange-200',
              progress,
              urgency: 2
            };
          }
          if (days >= Math.round(cycle * 0.8)) {
            return {
              group: 'upcoming',
              label: '快到週期',
              reason: `距常見 ${cycle} 天週期還有 ${Math.max(0, cycle - days)} 天。`,
              className: 'bg-sky-50 text-sky-700 border-sky-200',
              progress,
              urgency: 1
            };
          }
          return {
            group: 'stable',
            label: '穩定回流',
            reason: `仍在常見 ${cycle} 天週期內。`,
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            progress,
            urgency: 0
          };
        },
        compactFormulaSummary(formula = {}, note = '') {
          const chunks = [
            formula.color ? `染：${formula.color}` : '',
            formula.perm ? `燙：${formula.perm}` : '',
            formula.hair ? `髮況：${formula.hair}` : '',
            formula.preference ? `喜好：${formula.preference}` : '',
            formula.caution ? `注意：${formula.caution}` : ''
          ].filter(Boolean);
          if (chunks.length) return chunks.slice(0, 3).join('｜');
          const cleanNote = String(note || '').replace(/\s+/g, ' ').trim();
          return cleanNote ? cleanNote.slice(0, 28) : '尚未建立配方';
        },
        copyCustomerBrief(cust) {
          const prepaidStatus = cust.prepaidDormant ? '儲值久未來' : cust.prepaidLow ? '餘額偏低' : '正常';
          const lines = [
            `${cust.name}｜${cust.gender || '未填性別'}｜${cust.count} 次消費｜${cust.valueTierLabel}｜${cust.returnLabel}`,
            `最近：${cust.lastDate || '未填'} ${cust.lastService || '未填服務'}`,
            `週期：${cust.revisitDays} 天｜預估回流日：${cust.returnDueDate || '尚無'}`,
            `工時產值：${cust.workHourYield ? `NT$ ${this.formatNumber(cust.workHourYield)}/hr` : '尚無'}（${cust.workTimeBasis}）`,
            `儲值：NT$ ${this.formatNumber(cust.prepaidBalance)}（${prepaidStatus}）`,
            `配方：${cust.formulaSummary || '尚未建立配方'}`
          ];
          if (cust.contact) lines.push(`聯絡：${cust.contact}`);
          this.copyTextToClipboard(lines.join('\n'), '顧客摘要已複製');
        },
        copyCalendarCustomerId(cust) {
          if (!cust?.id) {
            this.showToast('找不到 Customer ID', 'error');
            return;
          }
          this.copyTextToClipboard(`Customer ID: ${cust.id}`, 'Calendar Customer ID 已複製');
        },
        dismissIosGuide() {
          this.showIosGuide = false;
          localStorage.setItem('momo_ios_guide_dismissed', '1');
        },

        normalizeSyncServiceKey(value) {
          return String(value || '')
            .replace(/\[.*?\]/g, ' ')
            .replace(/（.*?）/g, ' ')
            .replace(/\(.*?\)/g, ' ')
            .replace(/\s*\+\s*/g, '+')
            .replace(/\s+/g, '')
            .trim()
            .toLowerCase();
        },
        syncIssueFilters() {
          return [
            { key: 'all', label: '全部', count: this.syncIssueSummary.total },
            { key: 'pricing', label: '價目表', count: this.syncIssueSummary.pricing },
            { key: 'money', label: '金額付款', count: this.syncIssueSummary.money },
            { key: 'locked', label: '鎖帳', count: this.syncIssueSummary.locked },
            { key: 'backup', label: '備份', count: this.syncIssueSummary.backup },
            { key: 'missing_event_id', label: '事件ID', count: this.syncIssueSummary.missingEventId }
          ].filter(filter => filter.key === 'all' || filter.count > 0);
        },
        syncIssueTypeLabel(type) {
          return ({
            unmatched_service_config: '價目表未匹配',
            zero_amount: '金額為 0',
            invalid_payment: '付款方式異常',
            invalid_mixed_payment: '混合付款異常',
            date_locked: '已鎖帳跳過',
            cancelled_locked: '取消事件已鎖帳',
            missing_event_id: '缺少 Event ID',
            invalid_required_fields: '必要欄位缺失',
            customer_create_failed: '顧客建立失敗',
            blocked_slot: '封鎖時段',
            missing_description: '缺少描述',
            missing_order_id: '缺少 Order ID',
            duplicate_event: '重複事件',
            cloud_backup_error: '雲端備份異常',
            cloud_backup_empty: '尚無雲端備份',
            cloud_backup_missing_today: '今日備份缺少',
            cloud_backup_less_than_local: '備份筆數偏低',
            cloud_backup_volume_drop: '備份量下降',
            cloud_backup_count_drop: '分類筆數下降',
            backup_error: '備份失敗',
            backup_due: '備份提醒'
          })[type] || type || '同步提醒';
        },
        syncIssueSeverityClass(severity) {
          return severity === 'error'
            ? 'bg-rose-50 text-rose-600 border border-rose-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100';
        },
        isBackupIssueType(type) {
          return /^cloud_backup_|^backup_/.test(String(type || ''));
        },
        toggleSafetyMaintenanceSection(section) {
          const allowed = ['sync', 'maintenance'];
          const next = allowed.includes(section) ? section : '';
          const activeSection = this.safetyMaintenanceSection === next ? '' : next;
          this.safetyMaintenanceSection = activeSection;
          if (activeSection !== 'sync') this.syncIssueFilter = 'all';
          if (activeSection !== 'maintenance') {
            this.safetyShowAllCloudBackups = false;
            this.safetyShowAllLocalSnapshots = false;
          }
        },
        setSafetyMaintenanceView(view) {
          this.safetyMaintenanceView = ['backup', 'system'].includes(view) ? view : 'backup';
          this.safetyShowAllCloudBackups = false;
          this.safetyShowAllLocalSnapshots = false;
        },
        async handleBackupSyncIssue(issue = {}) {
          this.showSyncIssueModal = false;
          this.safetyMaintenanceView = 'backup';
          this.safetyMaintenanceSection = 'maintenance';
          if (['cloud_backup_error', 'cloud_backup_count_drop', 'cloud_backup_volume_drop', 'cloud_backup_less_than_local'].includes(issue.type)) {
            this.activeTab = 'safety';
            await this.fetchCloudBackupList({ silent: false });
            return;
          }
          await this.handleBackupReminderAction();
        },
        openSyncIssueModal(filter = 'all') {
          this.syncIssueFilter = filter || 'all';
          this.showSyncIssueModal = true;
        },
        goToSafetySync(filter = 'all') {
          this.activeTab = 'safety';
          this.syncIssueFilter = filter || 'all';
          this.safetyMaintenanceView = 'backup';
          this.safetyMaintenanceSection = filter === 'backup' ? 'maintenance' : 'sync';
          this.showMobileTools = false;
          this.scrollToTopForNavigation();
        },
        async handleHomeAttentionItem(item = {}) {
          if (item.action === 'closeout') {
            this.openCloseoutSheet(item.date || new Date().toLocaleDateString('sv-SE'));
            return;
          }
          if (item.action === 'retry_sync') {
            await this.retryCalendarSync();
            return;
          }
          if (item.action === 'backup') {
            this.goToSafetySync('backup');
            await this.handleBackupReminderAction();
            return;
          }
          if (item.action === 'safety') {
            this.goToSafetySync('all');
            this.runSystemStatusCheck(false);
            return;
          }
          if (item.action === 'sync') {
            this.goToSafetySync(item.filter || 'all');
            this.openSyncIssueModal(item.filter || 'all');
            return;
          }
          if (item.action === 'pricing') {
            this.goToSafetySync('pricing');
            return;
          }
          this.goToAnomaly(item.issue || item);
        },
        addUnmatchedServiceToConfig(row = {}) {
          const serviceName = String(row.serviceName || row.name || row.message || '').trim();
          if (!serviceName) {
            this.showToast('找不到可加入的服務名稱', 'error');
            return;
          }
          this.tempServicesConfig = JSON.parse(JSON.stringify(this.servicesConfig || []));
          this.serviceConfigSearchQuery = '';
          const key = this.normalizeSyncServiceKey(serviceName);
          const exists = this.tempServicesConfig.some(service => this.normalizeSyncServiceKey(service.name) === key);
          if (!exists) {
            this.tempServicesConfig.push({
              name: serviceName,
              duration: Number(row.duration) || 60,
              price: Number(row.price) || 0
            });
          }
          this.serviceConfigSearchQuery = serviceName;
          this.showServiceConfigModal = true;
          this.showSyncIssueModal = false;
          this.showToast(exists ? '此服務已在價目表中' : '已加入價目表，請補上定價與時長', 'info');
        },
        openOrderFromSyncIssue(issue = {}) {
          this.showSyncIssueModal = false;
          this.activeTab = 'orders';
          this.ordersFilterCategory = 'All';
          this.ordersFilterPayment = 'All';
          this.ordersSearchQuery = issue.customerName || issue.serviceName || '';
          this.expandedOrderId = issue.orderId || null;
          this.scrollToTopForNavigation();
        },
        normalizeMinutes(value) {
          const minutes = Math.round(Number(value) || 0);
          return minutes > 0 ? minutes : null;
        },
        getOrderActualMinutes(order) {
          return this.normalizeMinutes(order?.actualDurationMinutes)
            || this.normalizeMinutes(order?.durationMinutes);
        },
        migrateLegacyCalendarActualDurations(fromSchemaVersion = 1) {
          if (Number(fromSchemaVersion) >= 3) return 0;
          let migrated = 0;
          (this.orders || []).forEach(order => {
            if (order?.source !== 'google_calendar' || order.actualDurationSource) return;
            const actual = this.normalizeMinutes(order.actualDurationMinutes);
            const scheduled = this.normalizeMinutes(order.calendarDurationMinutes);
            if (!actual || !scheduled || actual !== scheduled) return;
            order.actualDurationMinutes = null;
            if (this.normalizeMinutes(order.durationMinutes) === scheduled) order.durationMinutes = null;
            order.actualDurationSource = 'legacy_calendar_schedule_removed';
            migrated += 1;
          });
          return migrated;
        },
        formatHours(value) {
          const hours = Math.round((Number(value) || 0) * 10) / 10;
          return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
        },
        formatMinutesCompact(value) {
          const minutes = Math.round(Number(value) || 0);
          if (minutes <= 0) return '未設定';
          const hours = Math.floor(minutes / 60);
          const rest = minutes % 60;
          if (!hours) return `${rest}分`;
          return rest ? `${hours}小時${rest}分` : `${hours}小時`;
        },
        formatMinuteDelta(value) {
          if (value === null || value === undefined || value === '') return '無對照';
          const minutes = Math.round(Number(value) || 0);
          if (minutes === 0) return '等同標準';
          return `${minutes > 0 ? '+' : ''}${minutes} 分`;
        },
        serviceYieldLevel(value) {
          const yieldPerHour = Number(value) || 0;
          return yieldPerHour >= 1600 ? '高效' : yieldPerHour >= 1000 ? '穩定' : '待優化';
        },
        buildServiceYieldRows(orders = []) {
          const serviceMap = {};
          (orders || [])
            .filter(o => this.isOrderActive(o) && !this.isCorrectionSlip(o) && o.paymentMethod !== '儲值進帳' && o.customerName && !this.isBlockedSlot(o.customerName))
            .forEach(o => {
              const serviceName = o.serviceName || '未填服務';
              const standardMinutes = this.getServiceMinutes(serviceName);
              const actualMinutes = this.getOrderActualMinutes(o);

              if (!serviceMap[serviceName]) {
                serviceMap[serviceName] = {
                  serviceName,
                  totalAmount: 0,
                  standardAmount: 0,
                  actualAmount: 0,
                  count: 0,
                  standardMinutesTotal: 0,
                  actualMinutesTotal: 0,
                  standardMatchedCount: 0,
                  actualMatchedCount: 0,
                  items: []
                };
              }
              const row = serviceMap[serviceName];
              const amount = Number(o.amount) || 0;
              row.totalAmount += amount;
              row.count += 1;
              row.items.push({ amount, actualMinutes, standardMinutes });
              if (standardMinutes) {
                row.standardMinutesTotal += standardMinutes;
                row.standardMatchedCount += 1;
                row.standardAmount += amount;
              }
              if (actualMinutes) {
                row.actualMinutesTotal += actualMinutes;
                row.actualMatchedCount += 1;
                row.actualAmount += amount;
              }
            });

          return Object.values(serviceMap)
            .map(item => {
              const effective = MomoCore.calculateEffectiveTimeYield(item.items);
              const standardHours = item.standardMinutesTotal / 60;
              const actualHours = item.actualMinutesTotal / 60;
              const effectiveHours = effective.effectiveMinutes / 60;
              const standardYieldPerHour = standardHours > 0 ? Math.round(item.standardAmount / standardHours) : 0;
              const actualYieldPerHour = actualHours > 0 ? Math.round(item.actualAmount / actualHours) : 0;
              const yieldPerHour = effective.hourlyYield || 0;
              const minutesPerService = item.standardMatchedCount
                ? Math.round(item.standardMinutesTotal / item.standardMatchedCount)
                : 0;
              const actualMinutesPerService = item.actualMatchedCount
                ? Math.round(item.actualMinutesTotal / item.actualMatchedCount)
                : 0;
              const averageMinutes = effective.coveredCount
                ? Math.round(effective.effectiveMinutes / effective.coveredCount)
                : 0;
              const averageAmount = item.count ? Math.round(item.totalAmount / item.count) : 0;
              const actualCoverage = item.count ? Math.round(item.actualMatchedCount / item.count * 100) : 0;
              const standardCoverage = item.count ? Math.round(item.standardMatchedCount / item.count * 100) : 0;
              const durationDeltaMinutes = actualMinutesPerService && minutesPerService
                ? actualMinutesPerService - minutesPerService
                : null;
              const durationDeltaPercent = durationDeltaMinutes !== null && minutesPerService
                ? Math.round(durationDeltaMinutes / minutesPerService * 100)
                : null;
              const confidenceTone = actualCoverage >= 80 ? 'ok' : actualCoverage > 0 ? 'warn' : 'low';
              const confidenceLabel = actualCoverage >= 80
                ? '高可信'
                : actualCoverage > 0
                  ? '部分實際'
                  : '標準估算';
              const timeBasisLabel = effective.mode === 'actual'
                ? '實際工時'
                : effective.mode === 'mixed'
                  ? '混合工時'
                  : effective.mode === 'standard'
                    ? '標準時長'
                    : '工時缺漏';
              const { items, ...publicItem } = item;
              return {
                ...publicItem,
                averageAmount,
                minutesPerService,
                actualMinutesPerService,
                averageMinutes,
                totalHours: standardHours,
                actualHours,
                effectiveHours,
                effectiveAmount: effective.coveredAmount,
                effectiveCoverage: Math.round(effective.coverageRate * 100),
                standardYieldPerHour,
                actualYieldPerHour,
                yieldPerHour,
                level: this.serviceYieldLevel(yieldPerHour),
                actualCoverage,
                standardCoverage,
                durationDeltaMinutes,
                durationDeltaPercent,
                confidenceTone,
                confidenceLabel,
                timeBasisLabel
              };
            })
            .sort((a, b) => b.yieldPerHour - a.yieldPerHour);
        },
        buildYieldSummary(items = [], serviceOrders = []) {
          const eligibleOrders = (serviceOrders || []).filter(order => this.isOrderActive(order) && !this.isCorrectionSlip(order) && order.paymentMethod !== '儲值進帳');
          const effective = MomoCore.calculateEffectiveTimeYield(eligibleOrders.map(order => ({
            amount: Number(order.amount) || 0,
            actualMinutes: this.getOrderActualMinutes(order),
            standardMinutes: this.getServiceMinutes(order.serviceName)
          })));
          const totalAmount = eligibleOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
          const standardHours = items.reduce((sum, item) => sum + (Number(item.totalHours) || 0), 0);
          const actualHours = items.reduce((sum, item) => sum + (Number(item.actualHours) || 0), 0);
          const serviceRevenue = totalAmount;
          const actualAmount = eligibleOrders
            .filter(order => this.getOrderActualMinutes(order))
            .reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
          const actualAverage = actualHours > 0 ? Math.round(actualAmount / actualHours) : 0;
          const standardAmount = eligibleOrders
            .filter(order => this.getServiceMinutes(order.serviceName))
            .reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
          const standardAverage = standardHours > 0 ? Math.round(standardAmount / standardHours) : 0;
          const unmatched = [...new Set(eligibleOrders
            .filter(o => !this.getServiceMinutes(o.serviceName))
            .map(o => o.serviceName)
            .filter(Boolean))];
          const actualMissing = [...new Set(eligibleOrders
            .filter(o => !this.getOrderActualMinutes(o))
            .map(o => o.serviceName)
            .filter(Boolean))];
          const timeBasisLabel = effective.mode === 'actual'
            ? '實際工時'
            : effective.mode === 'mixed'
              ? '混合工時'
              : effective.mode === 'standard'
                ? '標準工時'
                : '工時未設定';
          return {
            average: effective.hourlyYield || 0,
            actualAverage,
            standardAverage,
            totalAmount,
            totalHours: Math.round(standardHours * 10) / 10,
            actualHours: Math.round(actualHours * 10) / 10,
            effectiveHours: Math.round((effective.effectiveMinutes / 60) * 10) / 10,
            effectiveAmount: effective.coveredAmount,
            effectiveCoverage: Math.round(effective.coverageRate * 100),
            timeBasisLabel,
            actualAmount,
            actualCoverage: effective.totalCount ? Math.round(effective.actualCount / effective.totalCount * 100) : 0,
            unmatched,
            actualMissing,
            highEfficiency: items.filter(item => item.level === '高效').length,
            serviceCount: items.length,
            topService: items[0] || null
          };
        },

        // Helper to match service duration
        getServiceMinutes(name) {
          return MomoCore.resolveServiceMetric(name, this.serviceDictionary);
        },

        // Helper to match service price
        getServicePrice(name) {
          return MomoCore.resolveServiceMetric(name, this.priceDictionary, { allowZero: true });
        },

        buildCalendarSyncPricingPayload() {
          const serviceConfigs = (Array.isArray(this.servicesConfig) ? this.servicesConfig : [])
            .map(service => ({
              name: String(service?.name || '').trim(),
              price: Number(service?.price) || 0,
              duration: Number(service?.duration) || 0
            }))
            .filter(service => service.name && service.price > 0);
          return {
            serviceConfigs,
            serviceConfigUpdatedAt: localStorage.getItem('momo_servicesConfigUpdatedAt') || null
          };
        },
        buildCustomerFormulaTimeline(cust = {}, formula = {}, recentOrders = []) {
          const items = [];
          const summary = this.compactFormulaSummary(formula, this.crmNotes[cust.id]);
          if (summary && summary !== '尚未建立配方') {
            items.push({
              id: `${cust.id || 'customer'}-formula-current`,
              date: formula.updatedAt || cust.lastDate || '',
              title: '目前配方',
              detail: summary,
              type: 'formula'
            });
          }
          (recentOrders || [])
            .filter(order => /染|漂|燙|護|頭皮|縮毛|離子/.test(order.serviceName || ''))
            .slice(0, 3)
            .forEach(order => {
              items.push({
                id: `${order.id || order.date}-formula-order`,
                date: order.date,
                title: order.serviceName || '相關服務',
                detail: `${order.paymentMethod || '未填付款'} · NT$ ${this.formatNumber(order.amount)}`,
                type: 'order'
              });
            });
          return items.slice(0, 4);
        },

        // E: 取得日期所在週的週一（YYYY-MM-DD）
        getWeekStart(dateStr) {
          const d = new Date(dateStr + 'T00:00:00');
          const day = d.getDay();
          const diff = day === 0 ? -6 : 1 - day; // 對齊週一
          d.setDate(d.getDate() + diff);
          return d.toLocaleDateString('sv-SE');
        },
        // E: 取得週標籤，如「6/9 ～ 6/15」
        getWeekLabel(weekKey) {
          const mon = new Date(weekKey + 'T00:00:00');
          const sun = new Date(mon);
          sun.setDate(mon.getDate() + 6);
          return `${mon.getMonth()+1}/${mon.getDate()} ～ ${sun.getMonth()+1}/${sun.getDate()}`;
        },

        // 日業績熱度改以左側色條呈現，保留強弱但不干擾帳本閱讀。
        getDayHeatStyle(dayTotal) {
          const ratio = this.maxDayTotal > 0 ? Math.max(0, dayTotal) / this.maxDayTotal : 0;
          return {
            '--orders-day-strength': (0.4 + ratio * 0.6).toFixed(2)
          };
        },
        // 取得訂單的類別顯示資訊。
        getCategoryInfo(order) {
          const cat = order.category || this.classifyCategory(order.serviceName);
          const map = {
            '剪髮': { key: 'cut', label: '剪髮' },
            '燙髮': { key: 'perm', label: '燙髮' },
            '染髮': { key: 'color', label: '染髮' },
            '洗護其他': { key: 'care', label: '洗護' },
            '更正': { key: 'correction', label: '更正' }
          };
          return map[cat] || map['洗護其他'];
        },

        // 付款標籤只負責顯示，原始付款方式仍保留給對帳與計價邏輯使用。
        getPaymentInfo(method) {
          const map = {
            '現金': { key: 'cash', label: '現金' },
            '轉帳': { key: 'transfer', label: '轉帳' },
            '儲值扣款': { key: 'prepaid', label: '儲值扣款' },
            '現金＋儲值扣款': { key: 'mixed', label: '混合付款' },
            '儲值進帳': { key: 'topup', label: '儲值進帳' }
          };
          return map[method] || { key: 'other', label: method || '未分類' };
        },

        // 支出分類的圖示、色系與報表色彩共用同一份對照。
        getExpenseCategoryInfo(category) {
          const map = {
            '材料費': { key: 'materials', label: '材料費', chartColor: '#00C7BE' },
            '房租': { key: 'rent', label: '房租', chartColor: '#5856D6' },
            '水電費': { key: 'utilities', label: '水電費', chartColor: '#FF9F0A' },
            '行銷費': { key: 'marketing', label: '行銷費', chartColor: '#FF2D55' },
            '薪資': { key: 'salary', label: '薪資', chartColor: '#34C759' },
            '其他': { key: 'other', label: '其他', chartColor: '#8E8E93' }
          };
          return map[category] || { ...map['其他'], label: category || '其他' };
        },

        // 服務名稱分類（同步資料有 category 欄位，手動新增的用此方法補充）
        classifyCategory(serviceName) {
          if (!serviceName) return '洗護其他';
          if (/更正單/.test(serviceName)) return '更正';
          if (/燙/.test(serviceName)) return '燙髮';
          if (/染|特殊色/.test(serviceName)) return '染髮';
          if (/剪/.test(serviceName)) return '剪髮';
          return '洗護其他';
        },

        // 判斷是否為封鎖時段（不約、卡 等行事曆佔位符）
        isBlockedSlot(name) {
          if (!name || !name.trim()) return true;
          return /^(?:不約|卡)(?:$|[\s｜|：:\-—_/])/.test(String(name).trim());
        },

        // 自訂確認對話框（取代瀏覽器原生 confirm()）
        showConfirm(message, onConfirm, options = {}) {
          this.confirmModal.message = message;
          this.confirmModal.onConfirm = onConfirm;
          this.confirmModal.title = options.title || '確認操作';
          this.confirmModal.subtitle = options.subtitle || '請確認內容後再繼續';
          this.confirmModal.tone = ['danger', 'warning', 'info'].includes(options.tone) ? options.tone : 'warning';
          this.confirmModal.confirmLabel = options.confirmLabel || '確認';
          this.confirmModal.cancelLabel = options.cancelLabel || '取消';
          this.confirmModal.loadingLabel = options.loadingLabel || '處理中…';
          this.confirmModal.busy = false;
          this.confirmModal.show = true;
        },
        closeConfirm(force = false) {
          if (this.confirmModal.busy && !force) return;
          this.confirmModal.show = false;
          this.confirmModal.busy = false;
          this.confirmModal.onConfirm = null;
        },
        async doConfirm() {
          if (!this.confirmModal.onConfirm || this.confirmModal.busy) return;
          const onConfirm = this.confirmModal.onConfirm;
          this.confirmModal.busy = true;
          try {
            await Promise.resolve(onConfirm());
            this.closeConfirm(true);
          } catch (error) {
            console.error('Confirmed action failed:', error);
            this.confirmModal.busy = false;
            this.showToast(`操作失敗：${error?.message || '請稍後再試'}`, 'error', 7000);
          }
        },

        // Toast Messages
        showToast(message, type = 'success', duration = 3000) {
          const normalizedType = ['success', 'error', 'warning', 'info', 'loading'].includes(type) ? type : 'info';
          this.toast.message = message;
          this.toast.type = normalizedType;
          this.toast.show = true;
          if (this._toastTimer) clearTimeout(this._toastTimer);
          this._toastTimer = setTimeout(() => {
            this.toast.show = false;
          }, duration);
        },
        closeToast() {
          if (this._toastTimer) clearTimeout(this._toastTimer);
          this._toastTimer = null;
          this.toast.show = false;
        },
        formatDateTime(value) {
          if (!value) return '—';
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return '—';
          return date.toLocaleString('zh-TW', {
            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        },
        setCalendarSyncError(error, status = 0, detail = '', options = {}) {
          const isTimeout = error?.name === 'AbortError';
          const isOffline = !navigator.onLine;
          let title = '行事曆同步失敗';
          let message = detail || error?.message || '伺服器暫時無法回應';
          if (isOffline) {
            title = '目前沒有網路連線';
            message = '恢復網路後按「重新同步」，本機資料仍會保留。';
          } else if (isTimeout) {
            title = '伺服器回應逾時';
            message = options.willRetry
              ? 'Render 可能正在喚醒；已保留本機資料，稍後會自動重試一次。'
              : 'Render 可能正在喚醒；本機資料仍可使用，請稍後重新同步。';
          } else if (status === 401) {
            title = '登入已過期';
            message = '請重新登入 Supabase，再按「重新同步」。';
            this.showAuthSheet = true;
          } else if (status >= 500) {
            title = '雲端伺服器暫時異常';
            message = 'Google Calendar 或 Render 暫時無法回應，請稍後重新同步。';
          }
          if (options.willRetry && !isTimeout && status !== 401) {
            message = '已保留本機資料，系統會在稍後自動重試一次。';
          }
          this.syncError = { title, message: String(message).slice(0, 240), status, at: new Date().toISOString() };
          localStorage.setItem('momo_sync_error', JSON.stringify(this.syncError));
          this.recordRuntimeAnomaly('sync', options.willRetry ? 'warning' : 'error', `${title}：${message}`, {
            syncTarget: 'google_calendar',
            error: String(error?.message || error || message).slice(0, 500),
            errorName: error?.name || null,
            status,
            willRetry: Boolean(options.willRetry),
            cause: 'calendar_sync',
            causeLabel: 'Google Calendar 同步',
            dedupeKey: `calendar:${status || error?.name || 'unknown'}:${title}`
          }, 60000);
          if (!options.silent) this.showToast(`${title}：${message}`, options.willRetry ? 'warning' : 'error', 8000);
        },
        clearCalendarSyncError() {
          this.syncError = null;
          localStorage.removeItem('momo_sync_error');
        },
        retryCalendarSync() {
          if (this.syncing) return this._calendarSyncPromise || false;
          this.cancelCalendarSyncRetry();
          return this.syncFromApi();
        },
        cancelCalendarSyncRetry() {
          if (this.calendarSyncRetryTimer) clearTimeout(this.calendarSyncRetryTimer);
          this.calendarSyncRetryTimer = null;
          this.calendarSyncRetryAt = null;
        },
        scheduleCalendarSyncRetry(options = {}, delayMs = 20000, reason = '遠端暫時無法回應') {
          if (this.storageRecoveryBlocked || this.calendarSyncRetryTimer || !navigator.onLine) return false;
          const delay = Math.max(1000, Number(delayMs) || 20000);
          this.calendarSyncRetryAt = new Date(Date.now() + delay).toISOString();
          this.calendarAutoSyncStatus = 'waiting';
          this.calendarAutoSyncMessage = '伺服器啟動中，先使用本機資料，稍後自動重試';
          this.recordRuntimeDiagnostic('sync', 'warning', '已切回本機資料，排定一次自動重試', {
            reason,
            retryAt: this.calendarSyncRetryAt,
            retryAttempt: Number(options.retryAttempt) || 0
          });
          this.calendarSyncRetryTimer = setTimeout(() => {
            this.calendarSyncRetryTimer = null;
            this.calendarSyncRetryAt = null;
            if (!navigator.onLine) {
              this.calendarSyncFallbackActive = true;
              this.calendarAutoSyncStatus = 'error';
              this.calendarAutoSyncMessage = '離線中，繼續使用本機資料';
              return;
            }
            this.recordRuntimeDiagnostic('sync', 'info', '開始自動重試行事曆同步');
            this.syncFromApi({
              ...options,
              automatic: true,
              silent: true,
              retryAttempt: (Number(options.retryAttempt) || 0) + 1
            });
          }, delay);
          return true;
        },
        activateCalendarSyncFallback(options = {}) {
          if (!this.syncing || this.calendarSyncFallbackActive) return;
          this.calendarSyncFallbackActive = true;
          this.calendarAutoSyncMessage = '伺服器啟動中，先顯示本機資料';
          this.recordRuntimeDiagnostic('sync', 'warning', '遠端回應較慢，畫面繼續使用本機資料', {
            source: options.automatic ? 'auto' : 'manual'
          });
          if (!options.silent) this.showToast('伺服器仍在啟動，畫面可先照常使用', 'info', 6500);
        },
        handleCalendarSyncFailure(error, options = {}, status = 0, detail = '') {
          const retryable = MomoCore.shouldRetryCalendarSync({
            online: navigator.onLine,
            errorName: error?.name,
            status,
            retryAttempt: options.retryAttempt
          });
          this.setCalendarSyncError(error, status, detail, { silent: Boolean(options.silent), willRetry: retryable });
          this.markCalendarSyncFailure(error, options);
          this.calendarSyncFallbackActive = retryable || !navigator.onLine;
          if (retryable) this.scheduleCalendarSyncRetry(options, 20000, error?.message || `HTTP ${status || 0}`);
          return false;
        },
        calendarAutoSyncStorageKey() {
          return 'momo_calendar_auto_sync_state';
        },
        calendarAutoSyncPeriod() {
          return `${this.selectedYear}-${this.selectedMonth}`;
        },
        persistCalendarAutoSyncState(patch = {}) {
          const next = {
            ...(this.calendarAutoSyncState || {}),
            ...patch,
            updatedAt: new Date().toISOString()
          };
          this.calendarAutoSyncState = next;
          localStorage.setItem(this.calendarAutoSyncStorageKey(), JSON.stringify(next));
        },
        calendarAutoSyncDecision() {
          const now = Date.now();
          const state = this.calendarAutoSyncState || {};
          const period = this.calendarAutoSyncPeriod();
          const today = new Date().toLocaleDateString('sv-SE');
          const lastSuccessAt = Date.parse(state.lastSuccessAt || '');
          const lastAttemptAt = Date.parse(state.lastAttemptAt || '');
          const minSuccessInterval = 3 * 60 * 60 * 1000;
          const minRetryInterval = 30 * 60 * 1000;

          if (this.storageRecoveryBlocked) return { run: false, reason: 'storage_recovery_blocked' };
          if (!this.online || !navigator.onLine) return { run: false, reason: 'offline' };
          if (document.hidden) return { run: false, reason: 'hidden' };
          if (this.syncing) return { run: false, reason: 'syncing' };
          if (this.selectedMonth === 'All') return { run: false, reason: 'annual' };
          if (this.authConfig.required && !this.authSession?.access_token) return { run: false, reason: 'auth' };
          if (this.calendarSyncConfigured === false) return { run: false, reason: 'calendar_not_configured' };
          if (this.cloudConflict) return { run: false, reason: 'conflict' };
          if (this.cloudMigrationNeeded) return { run: false, reason: 'migration' };
          if (state.lastAttemptResult === 'error' && lastAttemptAt && now - lastAttemptAt < minRetryInterval) return { run: false, reason: 'recent_error' };
          if (state.period !== period || state.lastSuccessDate !== today) return { run: true, reason: 'new_day_or_period' };
          if (!lastSuccessAt || now - lastSuccessAt >= minSuccessInterval) return { run: true, reason: 'stale' };
          return { run: false, reason: 'fresh' };
        },
        scheduleInitialCalendarAutoSync(delayMs = 3000) {
          if (this.storageRecoveryBlocked) return;
          if (this.calendarAutoSyncTimer) clearTimeout(this.calendarAutoSyncTimer);
          if (this.calendarAutoSyncStatus === 'syncing' || this.syncing) return;
          this.calendarAutoSyncTimer = setTimeout(() => {
            this.calendarAutoSyncTimer = null;
            this.runInitialCalendarAutoSync();
          }, delayMs);
        },
        async runInitialCalendarAutoSync() {
          const decision = this.calendarAutoSyncDecision();
          if (!decision.run) {
            if (decision.reason === 'offline') this.calendarAutoSyncMessage = '離線中，暫停自動同步';
            if (decision.reason === 'recent_error') this.calendarAutoSyncMessage = '自動同步暫停，可手動同步';
            if (decision.reason === 'calendar_not_configured') this.calendarAutoSyncMessage = '行事曆尚未設定，暫停自動同步';
            return false;
          }
          this.calendarAutoSyncStatus = 'syncing';
          this.calendarAutoSyncMessage = '背景同步行事曆…';
          return this.syncFromApi({ automatic: true, silent: true });
        },
        normalizeCalendarSyncOptions(options = {}) {
          if (options && options.type && options.target) return {};
          return options || {};
        },
        markCalendarSyncAttempt(options = {}) {
          if (this.headerSyncFeedbackTimer) clearTimeout(this.headerSyncFeedbackTimer);
          this.headerSyncFeedback = 'idle';
          this.persistCalendarAutoSyncState({
            period: this.calendarAutoSyncPeriod(),
            lastAttemptAt: new Date().toISOString(),
            lastAttemptResult: 'pending',
            source: options.automatic ? 'auto' : 'manual'
          });
        },
        markCalendarSyncSuccess(options = {}) {
          const syncedAt = new Date();
          const timeText = syncedAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
          this.persistCalendarAutoSyncState({
            period: this.calendarAutoSyncPeriod(),
            lastSuccessAt: syncedAt.toISOString(),
            lastSuccessDate: syncedAt.toLocaleDateString('sv-SE'),
            lastAttemptAt: syncedAt.toISOString(),
            lastAttemptResult: 'success',
            source: options.automatic ? 'auto' : 'manual'
          });
          this.calendarAutoSyncStatus = 'synced';
          this.calendarAutoSyncMessage = options.automatic ? `行事曆已自動更新 ${timeText}` : `行事曆已更新 ${timeText}`;
          this.calendarSyncFallbackActive = false;
          this.cancelCalendarSyncRetry();
          this.recordRuntimeDiagnostic('sync', 'ok', options.retryAttempt
            ? '行事曆自動重試成功'
            : '行事曆同步完成', {
            source: options.automatic ? 'auto' : 'manual',
            retryAttempt: Number(options.retryAttempt) || 0
          });
          if (this.headerSyncFeedbackTimer) clearTimeout(this.headerSyncFeedbackTimer);
          this.headerSyncFeedback = 'success';
          this.headerSyncFeedbackTimer = setTimeout(() => {
            this.headerSyncFeedback = 'idle';
            this.headerSyncFeedbackTimer = null;
          }, 1800);
        },
        markCalendarSyncFailure(error, options = {}) {
          if (this.headerSyncFeedbackTimer) clearTimeout(this.headerSyncFeedbackTimer);
          this.headerSyncFeedback = 'idle';
          this.headerSyncFeedbackTimer = null;
          this.persistCalendarAutoSyncState({
            period: this.calendarAutoSyncPeriod(),
            lastAttemptAt: new Date().toISOString(),
            lastAttemptResult: 'error',
            lastErrorAt: new Date().toISOString(),
            lastErrorMessage: String(error?.message || '同步失敗').slice(0, 160),
            source: options.automatic ? 'auto' : 'manual'
          });
          this.calendarAutoSyncStatus = 'error';
          this.calendarAutoSyncMessage = options.automatic ? '自動同步失敗，可手動同步' : '同步失敗，可重新同步';
        },

        // Supabase Authentication
        async fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          try {
            return await fetch(url, { ...options, signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }
        },
        async initAuth() {
          if (this.storageRecoveryBlocked) {
            this.authLoading = false;
            return false;
          }
          this.authLoading = true;
          const productionApi = 'https://mo2-z7d1.onrender.com';
          const candidates = [...new Set([
            window.location.origin === productionApi ? window.location.origin : null,
            'http://127.0.0.1:8000',
            productionApi
          ].filter(Boolean))];
          let config = null;
          for (const baseUrl of candidates) {
            try {
              const response = await this.fetchWithTimeout(`${baseUrl}/api/config`, {}, baseUrl.includes('127.0.0.1') ? 1200 : 12000);
              if (!response.ok) continue;
              config = await response.json();
              this.apiBaseUrl = baseUrl;
              break;
            } catch (error) {
              // 嘗試下一個後端；未部署設定時維持本機模式。
            }
          }

          if (!config) {
            this.authLoading = false;
            this.recordRuntimeDiagnostic('startup', 'warning', '後端尚未回應，已先使用本機資料');
            return;
          }

          this.authConfig = {
            configured: Boolean(config.auth_configured),
            required: Boolean(config.auth_required),
            supabaseUrl: config.supabase_url || '',
            publishableKey: config.supabase_publishable_key || ''
          };
          this.calendarSyncConfigured = config.calendar_configured !== false;
          this.recordRuntimeDiagnostic('startup', 'ok', '後端連線完成', {
            apiBaseUrl: this.apiBaseUrl,
            calendarConfigured: this.calendarSyncConfigured
          });

          if (!this.authConfig.configured) {
            this.authLoading = false;
            if (this.authConfig.required) {
              this.authError = 'Render 尚未設定 Supabase URL 與 Publishable Key';
              this.showAuthSheet = true;
            }
            return;
          }

          if (this.authSession?.access_token) {
            const valid = await this.restoreSupabaseSession();
            if (valid) {
              await this.initializeCloudData();
              this.authLoading = false;
              return;
            }
          }
          this.authLoading = false;
          this.showAuthSheet = this.authConfig.required;
        },
        supabaseHeaders(accessToken = null) {
          const headers = {
            apikey: this.authConfig.publishableKey,
            'Content-Type': 'application/json'
          };
          if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
          return headers;
        },
        persistAuthSession(session) {
          this.authSession = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600)
          };
          localStorage.setItem('momo_auth_session', JSON.stringify(this.authSession));
          this.authUser = session.user || this.authUser;
        },
        async restoreSupabaseSession() {
          const expiresSoon = Number(this.authSession?.expires_at || 0) <= Math.floor(Date.now() / 1000) + 60;
          if (expiresSoon && this.authSession?.refresh_token) return this.refreshSupabaseSession();
          try {
            const response = await this.fetchWithTimeout(
              `${this.authConfig.supabaseUrl}/auth/v1/user`,
              { headers: this.supabaseHeaders(this.authSession.access_token) },
              8000
            );
            if (response.ok) {
              this.authUser = await response.json();
              return true;
            }
          } catch (error) {
            this.authError = '目前無法驗證登入狀態';
          }
          return this.authSession?.refresh_token ? this.refreshSupabaseSession() : false;
        },
        async refreshSupabaseSession() {
          if (!this.authSession?.refresh_token) return false;
          try {
            const response = await this.fetchWithTimeout(
              `${this.authConfig.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
              {
                method: 'POST',
                headers: this.supabaseHeaders(),
                body: JSON.stringify({ refresh_token: this.authSession.refresh_token })
              },
              10000
            );
            if (!response.ok) throw new Error('refresh_failed');
            this.persistAuthSession(await response.json());
            return true;
          } catch (error) {
            localStorage.removeItem('momo_auth_session');
            this.authSession = null;
            this.authUser = null;
            return false;
          }
        },
        async signInWithSupabase() {
          if (!this.authConfig.configured) {
            this.authError = 'Supabase 尚未完成設定';
            return;
          }
          this.authLoading = true;
          this.authError = '';
          try {
            const response = await this.fetchWithTimeout(
              `${this.authConfig.supabaseUrl}/auth/v1/token?grant_type=password`,
              {
                method: 'POST',
                headers: this.supabaseHeaders(),
                body: JSON.stringify({ email: this.authForm.email, password: this.authForm.password })
              },
              12000
            );
            const result = await response.json();
            if (!response.ok) throw new Error(result.error_description || result.msg || 'Email 或密碼錯誤');
            this.persistAuthSession(result);
            this.authForm.password = '';
            this.showAuthSheet = false;
            await this.initializeCloudData();
            this.scheduleInitialCalendarAutoSync();
            this.showToast(this.cloudMigrationNeeded ? '登入成功，請執行首次資料搬移' : '雲端登入成功');
          } catch (error) {
            this.authError = error.message || '登入失敗，請稍後再試';
            this.authForm.password = '';
          } finally {
            this.authLoading = false;
          }
        },
        async signOutSupabase() {
          const token = this.authSession?.access_token;
          if (token && this.authConfig.configured) {
            try {
              await this.fetchWithTimeout(
                `${this.authConfig.supabaseUrl}/auth/v1/logout`,
                { method: 'POST', headers: this.supabaseHeaders(token) },
                5000
              );
            } catch (error) {
              // 即使遠端登出失敗，也清除本機 session。
            }
          }
          localStorage.removeItem('momo_auth_session');
          if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
          if (this.cloudVersionPollTimer) clearInterval(this.cloudVersionPollTimer);
          this.authSession = null;
          this.authUser = null;
          this.cloudReady = false;
          this.cloudMigrationNeeded = false;
          this.cloudStatus = 'idle';
          this.cloudMessage = '尚未連接雲端資料';
          this.cloudBaseline = markRaw({});
          this.cloudConflict = null;
          this.cloudBackups = [];
          this.cloudBackupStatus = 'idle';
          this.cloudBackupError = '';
          this.cloudBackupRetentionMessage = '';
          this.cloudBackupsLoadedAt = null;
          this.cloudBackupRestoringId = null;
          this.lastCloudBackupAt = null;
          localStorage.removeItem('momo_cloud_backups');
          localStorage.removeItem('momo_cloud_backups_loaded_at');
          localStorage.removeItem('momo_last_cloud_backup_at');
          this.showAuthSheet = this.authConfig.required;
          this.showToast('已登出雲端帳號');
        },
        authHeaders() {
          return this.authSession?.access_token
            ? { Authorization: `Bearer ${this.authSession.access_token}` }
            : {};
        },

        // Supabase business data persistence (LocalStorage remains the offline fallback)
        cloudMigrationKey() {
          return this.authUser?.id ? `momo_cloud_migrated_${this.authUser.id}` : 'momo_cloud_migrated';
        },
        hasMeaningfulLocalData() {
          return this.orders.length > 0
            || this.expenses.length > 0
            || this.inventory.length > 0
            || this.customers.length > 0
            || this.prepaidLedger.length > 0
            || Object.keys(this.crmNotes || {}).length > 0
            || Object.keys(this.crmFormulas || {}).length > 0
            || Object.keys(this.closeoutRecords || {}).length > 0;
        },
        createPreCloudBackup() {
          if (!this.hasMeaningfulLocalData()) return;
          try {
            const backup = {
              schemaVersion: this.dataSchemaVersion,
              createdAt: new Date().toISOString(),
              orders: this.orders,
              expenses: this.expenses,
              inventory: this.inventory,
              customers: this.customers,
              prepaidLedger: this.prepaidLedger,
              crmNotes: this.crmNotes,
              crmFormulas: this.crmFormulas,
              closeoutRecords: this.closeoutRecords,
              servicesConfig: this.servicesConfig
            };
            const existingKeys = [];
            for (let index = 0; index < localStorage.length; index += 1) {
              const key = localStorage.key(index);
              if (key?.startsWith('momo_precloud_backup_')) existingKeys.push(key);
            }
            existingKeys.sort().reverse();
            const targetKey = existingKeys[0] || 'momo_precloud_backup_latest';
            localStorage.setItem(targetKey, JSON.stringify(backup));
            existingKeys.slice(1).forEach(key => localStorage.removeItem(key));
          } catch (error) {
            console.warn('Pre-cloud backup skipped:', error);
          }
        },
        async cloudRequest(table, { method = 'GET', query = '', body = null, prefer = '', range = '' } = {}) {
          if (!this.authConfig.configured || !this.authSession?.access_token) {
            throw new Error('尚未登入 Supabase');
          }
          let requestBody = body;
          const execute = () => {
            const headers = this.supabaseHeaders(this.authSession.access_token);
            if (prefer) headers.Prefer = prefer;
            if (range) headers.Range = range;
            return this.fetchWithTimeout(
              `${this.authConfig.supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ''}`,
              {
                method,
                headers,
                body: requestBody === null ? undefined : JSON.stringify(requestBody)
              },
              20000
            );
          };

          let response = await execute();
          if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            const missingTopupChannel = table === 'orders'
              && requestBody
              && /topup_channel/i.test(detail)
              && /(column|schema cache|could not find|PGRST204)/i.test(detail);
            const orderActualTimeColumns = ['actual_duration_minutes', 'calendar_duration_minutes', 'calendar_start_at', 'calendar_end_at'];
            const missingOrderActualTime = table === 'orders'
              && requestBody
              && orderActualTimeColumns.some(column => detail.includes(column))
              && /(column|schema cache|could not find|PGRST204)/i.test(detail);
            const orderCorrectionColumns = ['correction_slip', 'correction_for_order_id', 'correction_for_date', 'correction_reason'];
            const missingOrderCorrectionSlip = table === 'orders'
              && requestBody
              && orderCorrectionColumns.some(column => detail.includes(column))
              && /(column|schema cache|could not find|PGRST204)/i.test(detail);
            const expensePaymentColumns = ['payment_method'];
            const missingExpensePayment = table === 'expenses'
              && requestBody
              && expensePaymentColumns.some(column => detail.includes(column))
              && /(column|schema cache|could not find|PGRST204)/i.test(detail);
            const closeoutBreakdownColumns = ['cash', 'transfer', 'prepaid_out', 'prepaid_in', 'cash_prepaid_in', 'transfer_prepaid_in', 'net_profit', 'orders_count'];
            const closeoutCountColumns = ['service_orders_count', 'topup_count'];
            const closeoutCashFlowColumns = ['opening_cash', 'cash_expenses'];
            const missingCloseoutCashFlow = table === 'closeouts'
              && requestBody
              && closeoutCashFlowColumns.some(column => detail.includes(column))
              && /(column|schema cache|could not find|PGRST204)/i.test(detail);
            const missingCloseoutCounts = table === 'closeouts'
              && requestBody
              && closeoutCountColumns.some(column => detail.includes(column))
              && /(column|schema cache|could not find|PGRST204)/i.test(detail);
            const missingCloseoutBreakdown = table === 'closeouts'
              && requestBody
              && closeoutBreakdownColumns.some(column => detail.includes(column))
              && /(column|schema cache|could not find|PGRST204)/i.test(detail);
            if (missingTopupChannel) {
              this.cloudTopupChannelSupported = false;
              const stripTopupChannel = row => {
                const copy = { ...row };
                delete copy.topup_channel;
                return copy;
              };
              requestBody = Array.isArray(requestBody)
                ? requestBody.map(stripTopupChannel)
                : stripTopupChannel(requestBody);
              response = await execute();
              if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
              if (response.ok) {
                if (response.status === 204) return null;
                const retryText = await response.text();
                return retryText ? JSON.parse(retryText) : null;
              }
            }
            if (missingOrderActualTime) {
              this.cloudActualTimeSupported = false;
              const stripOrderActualTime = row => {
                const copy = { ...row };
                orderActualTimeColumns.forEach(column => delete copy[column]);
                return copy;
              };
              requestBody = Array.isArray(requestBody)
                ? requestBody.map(stripOrderActualTime)
                : stripOrderActualTime(requestBody);
              response = await execute();
              if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
              if (response.ok) {
                if (response.status === 204) return null;
                const retryText = await response.text();
                return retryText ? JSON.parse(retryText) : null;
              }
            }
            if (missingOrderCorrectionSlip) {
              this.cloudCorrectionSlipSupported = false;
              const stripOrderCorrectionSlip = row => {
                const copy = { ...row };
                orderCorrectionColumns.forEach(column => delete copy[column]);
                return copy;
              };
              requestBody = Array.isArray(requestBody)
                ? requestBody.map(stripOrderCorrectionSlip)
                : stripOrderCorrectionSlip(requestBody);
              response = await execute();
              if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
              if (response.ok) {
                if (response.status === 204) return null;
                const retryText = await response.text();
                return retryText ? JSON.parse(retryText) : null;
              }
            }
            if (missingExpensePayment) {
              this.cloudExpensePaymentSupported = false;
              const stripExpensePayment = row => {
                const copy = { ...row };
                expensePaymentColumns.forEach(column => delete copy[column]);
                return copy;
              };
              requestBody = Array.isArray(requestBody)
                ? requestBody.map(stripExpensePayment)
                : stripExpensePayment(requestBody);
              response = await execute();
              if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
              if (response.ok) {
                if (response.status === 204) return null;
                const retryText = await response.text();
                return retryText ? JSON.parse(retryText) : null;
              }
            }
            if (missingCloseoutCashFlow) {
              this.cloudCloseoutCashFlowSupported = false;
              const stripCloseoutCashFlow = row => {
                const copy = { ...row };
                closeoutCashFlowColumns.forEach(column => delete copy[column]);
                return copy;
              };
              requestBody = Array.isArray(requestBody)
                ? requestBody.map(stripCloseoutCashFlow)
                : stripCloseoutCashFlow(requestBody);
              response = await execute();
              if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
              if (response.ok) {
                if (response.status === 204) return null;
                const retryText = await response.text();
                return retryText ? JSON.parse(retryText) : null;
              }
            }
            if (missingCloseoutCounts) {
              this.cloudCloseoutCountSupported = false;
              const stripCloseoutCounts = row => {
                const copy = { ...row };
                closeoutCountColumns.forEach(column => delete copy[column]);
                return copy;
              };
              requestBody = Array.isArray(requestBody)
                ? requestBody.map(stripCloseoutCounts)
                : stripCloseoutCounts(requestBody);
              response = await execute();
              if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
              if (response.ok) {
                if (response.status === 204) return null;
                const retryText = await response.text();
                return retryText ? JSON.parse(retryText) : null;
              }
            }
            if (missingCloseoutBreakdown) {
              this.cloudCloseoutBreakdownSupported = false;
              const stripCloseoutBreakdown = row => {
                const copy = { ...row };
                closeoutBreakdownColumns.forEach(column => delete copy[column]);
                return copy;
              };
              requestBody = Array.isArray(requestBody)
                ? requestBody.map(stripCloseoutBreakdown)
                : stripCloseoutBreakdown(requestBody);
              response = await execute();
              if (response.status === 401 && await this.refreshSupabaseSession()) response = await execute();
              if (response.ok) {
                if (response.status === 204) return null;
                const retryText = await response.text();
                return retryText ? JSON.parse(retryText) : null;
              }
            }
            throw new Error(`Supabase ${table} ${method} 失敗 (${response.status})${detail ? `：${detail.slice(0, 180)}` : ''}`);
          }
          if (response.status === 204) return null;
          const text = await response.text();
          return text ? JSON.parse(text) : null;
        },
        async fetchCloudRows(table) {
          const rows = [];
          const pageSize = 1000;
          for (let offset = 0; ; offset += pageSize) {
            const page = await this.cloudRequest(table, {
              query: 'select=*',
              range: `${offset}-${offset + pageSize - 1}`
            });
            const list = Array.isArray(page) ? page : [];
            rows.push(...list);
            if (list.length < pageSize) break;
          }
          return rows;
        },
        async fetchCloudSnapshot() {
          const tables = ['customers', 'orders', 'prepaid_ledger', 'expenses', 'inventory', 'crm_profiles', 'closeouts', 'service_configs'];
          const results = await Promise.all(tables.map(table => this.fetchCloudRows(table)));
          return Object.fromEntries(tables.map((table, index) => [table, results[index]]));
        },
        versionedTableConfigs() {
          return {
            customers: { keys: ['id'], conflict: 'id', label: '顧客資料' },
            orders: { keys: ['id'], conflict: 'id', label: '業績資料' },
            expenses: { keys: ['id'], conflict: 'id', label: '支出資料' },
            inventory: { keys: ['id'], conflict: 'id', label: '庫存資料' },
            crm_profiles: { keys: ['customer_id'], conflict: 'customer_id', label: 'CRM 配方與備註' },
            closeouts: { keys: ['closeout_date'], conflict: 'owner_id,closeout_date', label: '打烊紀錄' },
            service_configs: { keys: ['name'], conflict: 'owner_id,name', label: '服務定價' }
          };
        },
        cloudRowKey(table, row) {
          const config = this.versionedTableConfigs()[table];
          return config ? config.keys.map(key => String(row?.[key] ?? '')).join('::') : String(row?.id || '');
        },
        cloudFingerprint(row) {
          const clean = {};
          Object.keys(row || {}).sort().forEach(key => {
            if (['owner_id', 'version', 'created_at', 'updated_at', 'id'].includes(key)) return;
            clean[key] = row[key];
          });
          return JSON.stringify(clean);
        },
        captureCloudBaseline(snapshot) {
          const baseline = {};
          const configs = this.versionedTableConfigs();
          Object.keys(configs).forEach(table => {
            baseline[table] = {};
            (snapshot[table] || []).forEach(row => {
              baseline[table][this.cloudRowKey(table, row)] = {
                version: Number(row.version) || 1,
                fingerprint: this.cloudFingerprint(row),
                keyPayload: Object.fromEntries(configs[table].keys.map(key => [key, row?.[key]]))
              };
            });
          });
          this.cloudBaseline = markRaw(baseline);
        },
        setCloudBaselineRow(table, row) {
          if (!this.cloudBaseline[table]) this.cloudBaseline[table] = {};
          const config = this.versionedTableConfigs()[table];
          const key = this.cloudRowKey(table, row);
          this.cloudBaseline[table][key] = {
            version: Number(row.version) || 1,
            fingerprint: this.cloudFingerprint(row),
            keyPayload: Object.fromEntries(config.keys.map(field => [field, row?.[field]]))
          };
          this.applyLocalVersion(table, key, Number(row.version) || 1);
        },
        applyLocalVersion(table, key, version) {
          const configs = {
            customers: this.customers,
            orders: this.orders,
            expenses: this.expenses,
            inventory: this.inventory,
            service_configs: this.servicesConfig
          };
          const rows = configs[table];
          if (Array.isArray(rows)) {
            const config = this.versionedTableConfigs()[table];
            const row = rows.find(item => config.keys.map(field => String(item[field === 'customer_id' ? 'customerId' : field] ?? '')).join('::') === key);
            if (row) row.version = version;
          }
        },
        async fetchCurrentCloudRow(table, payload) {
          const config = this.versionedTableConfigs()[table];
          const filters = [`owner_id=eq.${encodeURIComponent(this.authUser.id)}`];
          config.keys.forEach(key => filters.push(`${encodeURIComponent(key)}=eq.${encodeURIComponent(payload[key])}`));
          const rows = await this.cloudRequest(table, { query: `select=*&${filters.join('&')}` });
          return Array.isArray(rows) ? rows[0] || null : null;
        },
        editableCloudBody(config, payload) {
          const body = { ...payload };
          ['owner_id', 'version', 'created_at', 'updated_at', 'id', ...config.keys].forEach(key => delete body[key]);
          return body;
        },
        makeVersionConflict(table, payload, cloudRow, operation = 'update') {
          const error = new Error('另一台裝置已修改這筆資料');
          error.code = 'VERSION_CONFLICT';
          error.conflict = {
            table,
            key: this.cloudRowKey(table, payload),
            label: this.versionedTableConfigs()[table]?.label || table,
            localPayload: payload,
            cloudRow,
            operation
          };
          return error;
        },
        cloudConflictFieldConfigs() {
          return {
            customers: [
              ['name', '顧客姓名'],
              ['gender', '性別'],
              ['merged_into_customer_id', '合併至顧客'],
              ['archived_at', '封存時間']
            ],
            orders: [
              ['order_date', '日期'],
              ['customer_id', '顧客'],
              ['service_name', '服務'],
              ['amount', '金額'],
              ['payment_method', '付款方式'],
              ['cash_amount', '現金付款'],
              ['topup_channel', '儲值收款'],
              ['correction_slip', '更正單'],
              ['correction_for_order_id', '更正原訂單'],
              ['correction_for_date', '更正原日期'],
              ['correction_reason', '更正原因'],
              ['actual_duration_minutes', '實際工時'],
              ['calendar_duration_minutes', '行事曆工時'],
              ['sync_status', '資料狀態']
            ],
            expenses: [
              ['expense_date', '日期'],
              ['category', '分類'],
              ['amount', '金額'],
              ['notes', '備註']
            ],
            inventory: [
              ['name', '品項'],
              ['stock', '庫存'],
              ['notes', '備註']
            ],
            crm_profiles: [
              ['customer_id', '顧客'],
              ['notes', 'CRM 備註'],
              ['formula', '配方與偏好']
            ],
            closeouts: [
              ['closeout_date', '日期'],
              ['expected_cash', '應有現金'],
              ['counted_cash', '實點現金'],
              ['difference', '帳實差額'],
              ['service_revenue', '服務營收'],
              ['cash', '現金'],
              ['transfer', '轉帳'],
              ['prepaid_out', '儲值扣款'],
              ['prepaid_in', '儲值進帳'],
              ['expenses', '支出'],
              ['net_profit', '淨利'],
              ['orders_count', '總筆數'],
              ['service_orders_count', '服務筆數'],
              ['topup_count', '儲值筆數'],
              ['note', '備註']
            ],
            service_configs: [
              ['name', '服務名稱'],
              ['duration_minutes', '預估時間'],
              ['price', '定價']
            ]
          };
        },
        cloudConflictFields(conflict = this.cloudConflict) {
          if (!conflict) return [];
          const configured = this.cloudConflictFieldConfigs()[conflict.table];
          if (configured) return configured;
          const excluded = new Set(['owner_id', 'version', 'created_at', 'updated_at', 'id']);
          const keys = new Set([
            ...Object.keys(conflict.localPayload || {}),
            ...Object.keys(conflict.cloudRow || {})
          ]);
          return [...keys].filter(key => !excluded.has(key)).map(key => [key, key]);
        },
        normalizeCloudCompareValue(value) {
          if (value === undefined || value === null || value === '') return null;
          if (typeof value === 'number') return Number.isFinite(value) ? value : null;
          if (typeof value === 'object') {
            return JSON.stringify(Object.keys(value).sort().reduce((acc, key) => {
              acc[key] = this.normalizeCloudCompareValue(value[key]);
              return acc;
            }, {}));
          }
          return String(value);
        },
        formatCloudConflictValue(table, field, value, conflict = this.cloudConflict, side = 'local') {
          if (conflict?.operation === 'delete' && side === 'local') return '本機要刪除此筆';
          if (value === undefined || value === null || value === '') return '空白';
          if (field === 'customer_id') {
            const customer = this.customerMap[value];
            return customer ? `${customer.name}（${this.shortCustomerId(value)}）` : this.shortCustomerId(value);
          }
          if (field === 'formula') {
            return this.compactFormulaSummary(value) || '尚未建立配方';
          }
          const moneyFields = new Set([
            'amount', 'cash_amount', 'expected_cash', 'counted_cash', 'difference',
            'service_revenue', 'cash', 'transfer', 'prepaid_out', 'prepaid_in',
            'cash_prepaid_in', 'transfer_prepaid_in', 'expenses', 'net_profit', 'price'
          ]);
          if (moneyFields.has(field)) return `NT$ ${this.formatNumber(value)}`;
          if (['duration_minutes', 'actual_duration_minutes', 'calendar_duration_minutes'].includes(field)) return `${this.formatNumber(value)} 分鐘`;
          if (field === 'stock') return `${this.formatNumber(value)} 件`;
          if (['orders_count', 'service_orders_count', 'topup_count'].includes(field)) return `${this.formatNumber(value)} 筆`;
          if (typeof value === 'object') return JSON.stringify(value, null, 2);
          return String(value);
        },
        cloudConflictRows(conflict = this.cloudConflict) {
          if (!conflict) return [];
          return this.cloudConflictFields(conflict).map(([field, label]) => {
            const localRaw = conflict.localPayload?.[field];
            const cloudRaw = conflict.cloudRow?.[field];
            const changed = conflict.operation === 'delete'
              || this.normalizeCloudCompareValue(localRaw) !== this.normalizeCloudCompareValue(cloudRaw);
            return {
              field,
              label,
              changed,
              local: this.formatCloudConflictValue(conflict.table, field, localRaw, conflict, 'local'),
              cloud: this.formatCloudConflictValue(conflict.table, field, cloudRaw, conflict, 'cloud')
            };
          }).filter(row => row.local !== '空白' || row.cloud !== '空白');
        },
        cloudConflictChangedCount(conflict = this.cloudConflict) {
          return this.cloudConflictRows(conflict).filter(row => row.changed).length;
        },
        cloudConflictSummaryText(conflict = this.cloudConflict) {
          if (!conflict) return '';
          const rows = this.cloudConflictRows(conflict);
          const preferred = rows.find(row => ['顧客姓名', '顧客', '日期', '服務', '品項', '服務名稱'].includes(row.label) && row.local !== '空白');
          const operationLabel = conflict.operation === 'delete' ? '刪除衝突' : '修改衝突';
          return `${conflict.label} · ${operationLabel}${preferred ? ` · ${preferred.local}` : ''}`;
        },
        async syncVersionedRow(table, payload, baselineRefreshed = false) {
          const config = this.versionedTableConfigs()[table];
          const key = this.cloudRowKey(table, payload);
          const baseline = this.cloudBaseline[table]?.[key];
          if (baseline && baseline.fingerprint === this.cloudFingerprint(payload)) return false;

          if (!baseline) {
            const rows = await this.cloudRequest(table, {
              method: 'POST',
              query: `on_conflict=${encodeURIComponent(config.conflict)}`,
              body: [{ ...payload, version: 1 }],
              prefer: 'resolution=ignore-duplicates,return=representation'
            });
            if (!Array.isArray(rows) || !rows.length) {
              const cloudRow = await this.fetchCurrentCloudRow(table, payload);
              throw this.makeVersionConflict(table, payload, cloudRow);
            }
            this.setCloudBaselineRow(table, rows[0]);
            return true;
          }

          const filters = [`owner_id=eq.${encodeURIComponent(this.authUser.id)}`, `version=eq.${baseline.version}`];
          config.keys.forEach(field => filters.push(`${encodeURIComponent(field)}=eq.${encodeURIComponent(payload[field])}`));
          const rows = await this.cloudRequest(table, {
            method: 'PATCH',
            query: filters.join('&'),
            body: this.editableCloudBody(config, payload),
            prefer: 'return=representation'
          });
          if (!Array.isArray(rows) || !rows.length) {
            const cloudRow = await this.fetchCurrentCloudRow(table, payload);
            const cloudFingerprint = this.cloudFingerprint(cloudRow);
            const payloadFingerprint = this.cloudFingerprint(payload);
            if (cloudRow && baseline && !baselineRefreshed && cloudFingerprint === baseline.fingerprint) {
              this.setCloudBaselineRow(table, cloudRow);
              return this.syncVersionedRow(table, payload, true);
            }
            if (cloudRow && cloudFingerprint === payloadFingerprint) {
              this.setCloudBaselineRow(table, cloudRow);
              return false;
            }
            throw this.makeVersionConflict(table, payload, cloudRow);
          }
          this.setCloudBaselineRow(table, rows[0]);
          return true;
        },
        async forceOverwriteCloudRow(table, payload) {
          const config = this.versionedTableConfigs()[table];
          const rows = await this.cloudRequest(table, {
            method: 'POST',
            query: `on_conflict=${encodeURIComponent(config.conflict)}`,
            body: [payload],
            prefer: 'resolution=merge-duplicates,return=representation'
          });
          if (!Array.isArray(rows) || !rows.length) {
            throw new Error('雲端覆蓋失敗，請稍後再試');
          }
          this.setCloudBaselineRow(table, rows[0]);
          return rows[0];
        },
        async forceDeleteCloudRow(table, payload) {
          const config = this.versionedTableConfigs()[table];
          const filters = [`owner_id=eq.${encodeURIComponent(this.authUser.id)}`];
          config.keys.forEach(field => filters.push(`${encodeURIComponent(field)}=eq.${encodeURIComponent(payload[field])}`));
          await this.cloudRequest(table, {
            method: 'DELETE',
            query: filters.join('&'),
            prefer: 'return=minimal'
          });
          if (this.cloudBaseline[table]) delete this.cloudBaseline[table][this.cloudRowKey(table, payload)];
        },
        clearQueuedCloudSync() {
          if (this.cloudSyncTimer) {
            clearTimeout(this.cloudSyncTimer);
            this.cloudSyncTimer = null;
          }
          this.cloudSyncPending = false;
        },
        markCloudPendingWrite(reason = 'local_change') {
          if (this.cloudApplying || !this.cloudLastSync) return null;
          const pending = {
            at: new Date().toISOString(),
            reason,
            ownerId: this.authUser?.id || null
          };
          this.cloudPendingWrite = pending;
          try {
            localStorage.setItem('momo_cloud_pending_write', JSON.stringify(pending));
          } catch (error) {
            this.cloudStatus = 'error';
            this.cloudMessage = '本機已儲存，但無法建立雲端待同步保護標記；請先匯出 JSON';
            this.showToast(this.cloudMessage, 'error', 9000);
          }
          return pending;
        },
        clearCloudPendingWrite() {
          this.cloudPendingWrite = null;
          localStorage.removeItem('momo_cloud_pending_write');
        },
        buildPendingWriteConflict(snapshot = {}) {
          const payloads = this.buildCloudPayloads();
          for (const table of Object.keys(this.versionedTableConfigs())) {
            const remoteByKey = new Map((snapshot[table] || []).map(row => [this.cloudRowKey(table, row), row]));
            const localByKey = new Map((payloads[table] || []).map(row => [this.cloudRowKey(table, row), row]));
            const keys = new Set([...remoteByKey.keys(), ...localByKey.keys()]);
            for (const key of keys) {
              const localPayload = localByKey.get(key) || {};
              const cloudRow = remoteByKey.get(key) || null;
              if (this.cloudFingerprint(localPayload) !== this.cloudFingerprint(cloudRow)) {
                return {
                  table,
                  key,
                  label: `${this.versionedTableConfigs()[table]?.label || table}（上次同步未完成）`,
                  localPayload,
                  cloudRow,
                  operation: 'resume'
                };
              }
            }
          }
          const remoteLedger = new Map((snapshot.prepaid_ledger || []).map(row => [String(row.id), this.cloudFingerprint(row)]));
          const localLedger = payloads.prepaid_ledger || [];
          const ledgerRow = localLedger.find(row => remoteLedger.get(String(row.id)) !== this.cloudFingerprint(row));
          if (ledgerRow) {
            return {
              table: 'prepaid_ledger',
              key: String(ledgerRow.id),
              label: '儲值帳本（上次同步未完成）',
              localPayload: ledgerRow,
              cloudRow: (snapshot.prepaid_ledger || []).find(row => String(row.id) === String(ledgerRow.id)) || null,
              operation: 'resume'
            };
          }
          return null;
        },
        localVersionedChangePayloads(payloads = null) {
          const source = payloads || this.buildCloudPayloads();
          const changes = {};
          Object.keys(this.versionedTableConfigs()).forEach(table => {
            changes[table] = (source[table] || []).filter(row => {
              const baseline = this.cloudBaseline[table]?.[this.cloudRowKey(table, row)];
              return !baseline || baseline.fingerprint !== this.cloudFingerprint(row);
            });
          });
          return changes;
        },
        async forceOverwriteLocalVersionedChanges() {
          const changes = this.localVersionedChangePayloads();
          let changed = 0;
          for (const table of Object.keys(this.versionedTableConfigs())) {
            for (const payload of changes[table] || []) {
              await this.forceOverwriteCloudRow(table, payload);
              changed += 1;
            }
          }
          return changed;
        },
        async syncVersionedChanges(payloads) {
          let changed = 0;
          for (const table of Object.keys(this.versionedTableConfigs())) {
            for (const payload of payloads[table] || []) {
              if (await this.syncVersionedRow(table, payload)) changed += 1;
            }
          }
          await this.upsertCloudRows('prepaid_ledger', payloads.prepaid_ledger, 'id', true);
          return changed;
        },
        hasLocalVersionedChanges() {
          if (!this.authUser || !Object.keys(this.cloudBaseline || {}).length) return false;
          const payloads = this.buildCloudPayloads();
          return Object.keys(this.versionedTableConfigs()).some(table =>
            (payloads[table] || []).some(row => {
              const baseline = this.cloudBaseline[table]?.[this.cloudRowKey(table, row)];
              return !baseline || baseline.fingerprint !== this.cloudFingerprint(row);
            })
          );
        },
        startCloudVersionPolling() {
          if (this.cloudVersionPollTimer) clearInterval(this.cloudVersionPollTimer);
          this.cloudVersionPollTimer = setInterval(() => this.checkRemoteVersions(), 60000);
        },
        async checkRemoteVersions() {
          if (this.storageRecoveryBlocked || this.cloudRestorePending || this.cloudPendingWrite || this.cloudSyncTimer
            || !this.cloudReady || this.cloudApplying || this.cloudSyncInFlight || this.cloudConflict || document.hidden) return;
          try {
            const configs = this.versionedTableConfigs();
            let changed = false;
            for (const [table, config] of Object.entries(configs)) {
              const fields = [...config.keys, 'version'].join(',');
              const rows = await this.cloudRequest(table, { query: `select=${fields}` });
              const remote = Object.fromEntries((rows || []).map(row => [this.cloudRowKey(table, row), Number(row.version) || 1]));
              const local = this.cloudBaseline[table] || {};
              if (Object.keys(remote).length !== Object.keys(local).length
                || Object.entries(remote).some(([key, version]) => local[key]?.version !== version)) {
                changed = true;
                break;
              }
            }
            if (!changed) return;
            if (this.hasLocalVersionedChanges()) {
              this.cloudMessage = '另一台裝置有更新；完成本機修改時會進行版本檢查';
              return;
            }
            const snapshot = await this.fetchCloudSnapshot();
            this.applyCloudSnapshot(snapshot);
            this.cloudMessage = `已接收其他裝置更新 · ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
            this.showToast('已載入另一台裝置的最新資料');
          } catch (error) {
            console.warn('Remote version check skipped:', error);
          }
        },
        applyCloudSnapshot(snapshot, options = {}) {
          if (this.cloudRestorePending && !options.force) return false;
          this.cloudApplying = true;
          try {
            this.customers = (snapshot.customers || []).map(row => ({
              id: row.id,
              name: row.name,
              gender: row.gender || '女',
              mergedIntoCustomerId: row.merged_into_customer_id || null,
              archivedAt: row.archived_at || null,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              version: Number(row.version) || 1
            }));
            const customerById = new Map(this.customers.map(customer => [customer.id, customer]));
            this.orders = (snapshot.orders || []).map(row => {
              const customer = customerById.get(row.customer_id);
              return {
                id: row.id,
                date: row.order_date,
                customerId: row.customer_id,
                customerName: customer?.name || '未知顧客',
                gender: customer?.gender || '女',
                serviceName: row.service_name,
                category: row.category || '',
                amount: Number(row.amount) || 0,
                paymentMethod: row.payment_method,
                cashAmount: row.cash_amount === null ? null : Number(row.cash_amount),
                topupChannel: row.topup_channel || (row.payment_method === '儲值進帳' ? '現金' : null),
                source: row.source || null,
                correctionSlip: Boolean(row.correction_slip),
                correctionForOrderId: row.correction_for_order_id || null,
                correctionForDate: row.correction_for_date || null,
                correctionReason: row.correction_reason || '',
                calendarStart: row.calendar_start_at || null,
                calendarEnd: row.calendar_end_at || null,
                calendarDurationMinutes: this.normalizeMinutes(row.calendar_duration_minutes),
                actualDurationMinutes: this.normalizeMinutes(row.actual_duration_minutes),
                sourceEventId: row.source_event_id || null,
                orderId: row.external_order_id || row.id,
                syncStatus: row.sync_status || 'active',
                lastSyncedAt: row.updated_at || row.created_at,
                version: Number(row.version) || 1
              };
            });
            this.prepaidLedger = (snapshot.prepaid_ledger || []).map(row => ({
              id: row.id,
              customerId: row.customer_id,
              customerNameSnapshot: row.customer_name_snapshot,
              signedAmount: Number(row.signed_amount) || 0,
              amount: Math.abs(Number(row.signed_amount) || 0),
              kind: row.kind,
              bucket: row.bucket,
              date: row.effective_date,
              sourceOrderId: row.source_order_id || null,
              serviceName: row.service_name || '',
              paymentMethod: row.payment_method || '',
              note: row.note || '',
              reversalOfEntryId: row.reversal_of_entry_id || null,
              transferGroupId: row.transfer_group_id || null,
              systemManaged: Boolean(row.system_managed),
              createdAt: row.created_at
            }));
            this.expenses = (snapshot.expenses || []).map(row => ({
              id: row.id,
              date: row.expense_date,
              category: row.category,
              amount: Number(row.amount) || 0,
              paymentMethod: MomoCore.normalizeExpensePaymentMethod(row.payment_method),
              notes: row.notes || '',
              version: Number(row.version) || 1
            }));
            const localInventorySafety = Object.fromEntries((this.inventory || []).map(item => [item.id, this.inventorySafetyStock(item)]));
            this.inventory = (snapshot.inventory || []).map(row => ({
              id: row.id,
              name: row.name,
              stock: Number(row.stock) || 0,
              minStock: localInventorySafety[row.id] || 3,
              notes: row.notes || '',
              version: Number(row.version) || 1
            }));
            this.crmNotes = {};
            this.crmFormulas = {};
            (snapshot.crm_profiles || []).forEach(row => {
              this.crmNotes[row.customer_id] = row.notes || '';
              this.crmFormulas[row.customer_id] = row.formula || {};
            });
            this.closeoutRecords = Object.fromEntries((snapshot.closeouts || []).map(row => [row.closeout_date, {
              date: row.closeout_date,
              openingCash: Math.max(0, Number(row.opening_cash) || 0),
              expectedCash: Number(row.expected_cash) || 0,
              countedCash: Number(row.counted_cash) || 0,
              difference: Number(row.difference) || 0,
              cash: Number(row.cash) || 0,
              transfer: Number(row.transfer) || 0,
              prepaidOut: Number(row.prepaid_out) || 0,
              prepaidIn: Number(row.prepaid_in) || 0,
              cashPrepaidIn: Number(row.cash_prepaid_in) || 0,
              transferPrepaidIn: Number(row.transfer_prepaid_in) || 0,
              actualCashIn: Number(row.cash) + Number(row.cash_prepaid_in) || 0,
              cashExpenses: Math.max(0, Number(row.cash_expenses) || 0),
              serviceRevenue: Number(row.service_revenue) || 0,
              expenses: Number(row.expenses) || 0,
              netProfit: Number(row.net_profit) || 0,
              ordersCount: Number(row.orders_count) || 0,
              ...(row.service_orders_count !== undefined ? { serviceOrdersCount: Number(row.service_orders_count) || 0 } : {}),
              ...(row.topup_count !== undefined ? { topupCount: Number(row.topup_count) || 0 } : {}),
              note: row.note || '',
              completedAt: row.completed_at,
              version: Number(row.version) || 1
            }]));
            if ((snapshot.service_configs || []).length) {
              this.servicesConfig = snapshot.service_configs.map(row => ({
                name: row.name,
                duration: Number(row.duration_minutes) || 0,
                price: Number(row.price) || 0,
                version: Number(row.version) || 1
              }));
              const latestServiceConfigUpdate = snapshot.service_configs
                .map(row => row.updated_at)
                .filter(Boolean)
                .sort()
                .pop();
              if (latestServiceConfigUpdate) {
                localStorage.setItem('momo_servicesConfigUpdatedAt', latestServiceConfigUpdate);
              }
            }
            this.captureCloudBaseline(snapshot);
            this.saveToLocalStorage();
            return true;
          } finally {
            this.cloudApplying = false;
          }
        },
        async initializeCloudData() {
          if (!this.authUser || !this.authSession?.access_token) return;
          if (this.storageRecoveryBlocked) {
            this.cloudReady = false;
            this.cloudStatus = 'error';
            this.cloudMessage = '資料回復待處理，已停止雲端載入與同步';
            return;
          }
          if (this.cloudRestorePending) {
            this.cloudReady = false;
            this.cloudMigrationNeeded = false;
            this.cloudStatus = 'restore_pending';
            this.cloudMessage = '本機還原版本已保護，雲端同步暫停；可下載 JSON，或重新載入雲端。';
            return;
          }
          this.cloudStatus = 'loading';
          this.cloudMessage = '正在檢查 Supabase 資料…';
          try {
            const snapshot = await this.fetchCloudSnapshot();
            const cloudBusinessCount = ['customers', 'orders', 'prepaid_ledger', 'expenses', 'inventory', 'crm_profiles', 'closeouts']
              .reduce((sum, table) => sum + (snapshot[table] || []).length, 0);
            const migratedHere = localStorage.getItem(this.cloudMigrationKey()) === '1';
            if (migratedHere && this.cloudPendingWrite) {
              this.createPreCloudBackup();
              this.captureCloudBaseline(snapshot);
              const pendingConflict = this.buildPendingWriteConflict(snapshot);
              if (pendingConflict) {
                this.cloudReady = true;
                this.cloudMigrationNeeded = false;
                this.cloudConflict = pendingConflict;
                this.cloudStatus = 'conflict';
                this.cloudMessage = '偵測到上次未完成的同步；為避免覆蓋本機資料，請選擇保留本機或載入雲端';
                this.showToast('上次同步尚未完成，本機資料已保留且未被雲端覆蓋', 'warning', 9000);
                return;
              }
              this.clearCloudPendingWrite();
            }
            if ((cloudBusinessCount > 0 || (snapshot.service_configs || []).length > 0)
              && this.hasMeaningfulLocalData() && !migratedHere) {
              this.cloudReady = false;
              this.cloudMigrationNeeded = true;
              this.cloudStatus = 'migration';
              this.cloudMessage = '本機與雲端都有資料，首次搬移會依 ID 安全合併';
              return;
            }
            if (cloudBusinessCount > 0 || (snapshot.service_configs || []).length > 0) {
              if (!localStorage.getItem(this.cloudMigrationKey())) this.createPreCloudBackup();
              this.applyCloudSnapshot(snapshot);
              localStorage.setItem(this.cloudMigrationKey(), '1');
              this.cloudReady = true;
              this.cloudMigrationNeeded = false;
              this.cloudStatus = 'synced';
              this.cloudLastSync = new Date().toISOString();
              localStorage.setItem('momo_cloud_last_sync', this.cloudLastSync);
              this.cloudMessage = `雲端資料已載入 · ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
              this.runIntegrityCheck(false);
              await this.runStartupCloudBackup();
              this.startCloudVersionPolling();
              return;
            }

            this.cloudMigrationNeeded = this.hasMeaningfulLocalData();
            this.cloudReady = false;
            this.cloudStatus = this.cloudMigrationNeeded ? 'migration' : 'synced';
            this.cloudMessage = this.cloudMigrationNeeded
              ? 'Supabase 尚無資料，請執行首次搬移'
              : '雲端已連接；新增或匯入資料後需確認首次搬移';
          } catch (error) {
            console.error('Cloud initialization failed:', error);
            this.cloudReady = false;
            this.cloudStatus = 'error';
            this.cloudMessage = '雲端載入失敗，仍使用本機資料';
            this.recordCloudSyncFailure('初始載入雲端資料', error);
            this.showToast(`雲端載入失敗：${error.message}`, 'error', 7000);
          }
        },
        buildCloudPayloads() {
          const ownerId = this.authUser.id;
          const now = new Date().toISOString();
          const customerIds = new Set(this.customers.map(customer => customer.id));
          return {
            customers: this.customers
              .filter(customer => customer.id && customer.name)
              .sort((a, b) => Number(Boolean(a.mergedIntoCustomerId)) - Number(Boolean(b.mergedIntoCustomerId)))
              .map(customer => ({
              id: customer.id,
              owner_id: ownerId,
              name: customer.name,
              gender: customer.gender || '女',
              merged_into_customer_id: customer.mergedIntoCustomerId || null,
              archived_at: customer.archivedAt || null,
              created_at: customer.createdAt || now,
              updated_at: customer.updatedAt || now
            })),
            orders: this.orders.filter(order => order.id && customerIds.has(order.customerId)).map(order => {
              const correctionSlip = this.isCorrectionSlip(order);
              const amount = correctionSlip
                ? Math.round(Number(order.amount) || 0)
                : Math.max(0, Math.round(Number(order.amount) || 0));
              let paymentMethod = order.paymentMethod || '現金';
              let cashAmount = paymentMethod === '現金＋儲值扣款' ? Math.round(Number(order.cashAmount) || 0) : null;
              if (!correctionSlip && paymentMethod === '現金＋儲值扣款' && cashAmount <= 0) {
                paymentMethod = '儲值扣款';
                cashAmount = null;
              } else if (!correctionSlip && paymentMethod === '現金＋儲值扣款' && cashAmount >= amount) {
                paymentMethod = '現金';
                cashAmount = null;
              }
              return {
                id: order.id,
                owner_id: ownerId,
                customer_id: order.customerId,
                order_date: order.date,
                service_name: order.serviceName || '',
                category: order.category || null,
                amount,
                payment_method: paymentMethod,
                cash_amount: cashAmount,
                ...(this.cloudTopupChannelSupported ? { topup_channel: paymentMethod === '儲值進帳' ? this.getTopupChannel(order) : null } : {}),
                ...(this.cloudCorrectionSlipSupported ? {
                  correction_slip: correctionSlip,
                  correction_for_order_id: order.correctionForOrderId || null,
                  correction_for_date: order.correctionForDate || null,
                  correction_reason: order.correctionReason || null
                } : {}),
                ...(this.cloudActualTimeSupported ? {
                  actual_duration_minutes: this.normalizeMinutes(order.actualDurationMinutes),
                  calendar_duration_minutes: this.normalizeMinutes(order.calendarDurationMinutes),
                  calendar_start_at: order.calendarStart || null,
                  calendar_end_at: order.calendarEnd || null
                } : {}),
                source: order.sourceEventId ? 'google_calendar' : (correctionSlip ? 'correction_slip' : 'manual'),
                source_event_id: order.sourceEventId || null,
                external_order_id: order.orderId || null,
                sync_status: order.syncStatus || 'active',
                created_at: order.createdAt || order.lastSyncedAt || now,
                updated_at: order.updatedAt || order.lastSyncedAt || now
              };
            }),
            prepaid_ledger: this.prepaidLedger.filter(entry => entry.id && customerIds.has(entry.customerId) && Number(entry.signedAmount)).map(entry => ({
              id: entry.id,
              owner_id: ownerId,
              customer_id: entry.customerId,
              signed_amount: Math.round(Number(entry.signedAmount)),
              kind: entry.kind || (Number(entry.signedAmount) > 0 ? 'topup' : 'debit'),
              bucket: entry.bucket || (Number(entry.signedAmount) > 0 ? 'topup' : 'debit'),
              effective_date: entry.date,
              source_order_id: entry.sourceOrderId || null,
              service_name: entry.serviceName || null,
              payment_method: entry.paymentMethod || null,
              note: entry.note || '',
              reversal_of_entry_id: entry.reversalOfEntryId || null,
              transfer_group_id: entry.transferGroupId || null,
              system_managed: Boolean(entry.systemManaged),
              customer_name_snapshot: entry.customerNameSnapshot || this.customerMap[entry.customerId]?.name || '未知顧客',
              created_at: entry.createdAt || now
            })),
            expenses: this.expenses.filter(expense => expense.id && expense.date).map(expense => ({
              id: expense.id,
              owner_id: ownerId,
              expense_date: expense.date,
              category: expense.category || '其他',
              amount: Math.max(0, Math.round(Number(expense.amount) || 0)),
              ...(this.cloudExpensePaymentSupported ? {
                payment_method: MomoCore.normalizeExpensePaymentMethod(expense.paymentMethod)
              } : {}),
              notes: expense.notes || '',
              created_at: expense.createdAt || now,
              updated_at: now
            })),
            inventory: this.inventory.filter(item => item.id && item.name).map(item => ({
              id: item.id,
              owner_id: ownerId,
              name: item.name,
              stock: Math.max(0, Math.round(Number(item.stock) || 0)),
              notes: item.notes || '',
              created_at: item.createdAt || now,
              updated_at: now
            })),
            crm_profiles: this.customers.map(customer => ({
              customer_id: customer.id,
              owner_id: ownerId,
              notes: this.crmNotes[customer.id] || '',
              formula: this.crmFormulas[customer.id] || {},
              updated_at: now
            })),
            closeouts: Object.values(this.closeoutRecords || {}).filter(record => record?.date).map(record => ({
              owner_id: ownerId,
              closeout_date: record.date,
              ...(this.cloudCloseoutCashFlowSupported ? {
                opening_cash: Math.max(0, Math.round(Number(record.openingCash) || 0)),
                cash_expenses: Math.max(0, Math.round(Number(record.cashExpenses) || 0))
              } : {}),
              expected_cash: Math.round(Number(record.expectedCash) || 0),
              counted_cash: Math.round(Number(record.countedCash) || 0),
              difference: Math.round(Number(record.difference) || 0),
              ...(this.cloudCloseoutBreakdownSupported ? {
                cash: Math.round(Number(record.cash) || 0),
                transfer: Math.round(Number(record.transfer) || 0),
                prepaid_out: Math.round(Number(record.prepaidOut) || 0),
                prepaid_in: Math.round(Number(record.prepaidIn) || 0),
                cash_prepaid_in: Math.round(Number(record.cashPrepaidIn) || 0),
                transfer_prepaid_in: Math.round(Number(record.transferPrepaidIn) || 0),
                net_profit: Math.round(Number(record.netProfit) || 0),
                orders_count: Math.max(0, Math.round(Number(record.ordersCount) || 0))
              } : {}),
              ...(this.cloudCloseoutCountSupported ? {
                service_orders_count: Math.max(0, Math.round(Number(record.serviceOrdersCount) || 0)),
                topup_count: Math.max(0, Math.round(Number(record.topupCount) || 0))
              } : {}),
              service_revenue: Math.round(Number(record.serviceRevenue) || 0),
              expenses: Math.round(Number(record.expenses) || 0),
              note: record.note || '',
              completed_at: record.completedAt || now
            })),
            service_configs: this.servicesConfig.filter(service => service.name).map(service => ({
              owner_id: ownerId,
              name: service.name,
              duration_minutes: Math.max(1, Math.round(Number(service.duration) || 1)),
              price: Math.max(0, Math.round(Number(service.price) || 0)),
              updated_at: now
            }))
          };
        },
        async upsertCloudRows(table, rows, conflict, ignoreDuplicates = false) {
          if (!rows.length) return;
          const batchSize = 200;
          let batches = [];
          if (table === 'prepaid_ledger') {
            // DB 的 deferred transfer constraint 要求同一轉移組在同一 transaction。
            // 同時先送原分錄再送 reversal，避免 BEFORE INSERT 找不到原分錄。
            batches = MomoCore.buildPrepaidLedgerUploadBatches(rows, batchSize);
          } else {
            for (let offset = 0; offset < rows.length; offset += batchSize) {
              batches.push(rows.slice(offset, offset + batchSize));
            }
          }
          for (const batch of batches) {
            await this.cloudRequest(table, {
              method: 'POST',
              query: `on_conflict=${encodeURIComponent(conflict)}`,
              body: batch,
              prefer: `${ignoreDuplicates ? 'resolution=ignore-duplicates' : 'resolution=merge-duplicates'},return=minimal`
            });
          }
        },
        async pushCloudSnapshot(initialMigration = false) {
          if (!this.authUser || !this.authSession?.access_token) return false;
          if (this.storageRecoveryBlocked || this.cloudRestorePending) return false;
          if (!initialMigration && (!this.cloudReady || this.cloudApplying)) return false;
          if (!initialMigration && this.cloudConflict) return false;
          if (this.cloudSyncInFlight) {
            this.cloudSyncPending = true;
            return false;
          }
          this.cloudSyncInFlight = true;
          this.cloudStatus = 'syncing';
          this.cloudMessage = initialMigration ? '正在搬移本機資料到 Supabase…' : '正在同步雲端資料…';
          try {
            const payloads = this.buildCloudPayloads();
            if (initialMigration) {
              await this.upsertCloudRows('customers', payloads.customers, 'id');
              await this.upsertCloudRows('orders', payloads.orders, 'id');
              await this.upsertCloudRows('prepaid_ledger', payloads.prepaid_ledger, 'id', true);
              await this.upsertCloudRows('expenses', payloads.expenses, 'id');
              await this.upsertCloudRows('inventory', payloads.inventory, 'id');
              await this.upsertCloudRows('crm_profiles', payloads.crm_profiles, 'customer_id');
              await this.upsertCloudRows('closeouts', payloads.closeouts, 'owner_id,closeout_date');
              await this.upsertCloudRows('service_configs', payloads.service_configs, 'owner_id,name');
            } else {
              await this.syncVersionedChanges(payloads);
            }
            this.cloudReady = true;
            this.cloudMigrationNeeded = false;
            this.cloudStatus = 'synced';
            this.cloudLastSync = new Date().toISOString();
            localStorage.setItem(this.cloudMigrationKey(), '1');
            localStorage.setItem('momo_cloud_last_sync', this.cloudLastSync);
            this.cloudMessage = `雲端已同步 · ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
            this.runIntegrityCheck(false);
            await this.createAutomaticBackup({ force: true, silent: true });
            this.clearCloudPendingWrite();
            return true;
          } catch (error) {
            console.error('Cloud sync failed:', error);
            this.recordCloudSyncFailure('寫入雲端資料', error, {
              initialMigration: Boolean(initialMigration),
              versionConflict: error.code === 'VERSION_CONFLICT'
            });
            if (error.code === 'VERSION_CONFLICT') {
              this.cloudConflict = error.conflict;
              this.cloudStatus = 'conflict';
              this.cloudMessage = '偵測到其他裝置修改，請選擇要保留的版本';
              this.showToast('另一台裝置已修改同一筆資料，同步已暫停', 'error', 8000);
            } else {
              this.cloudStatus = 'error';
              this.cloudMessage = '雲端同步失敗，本機資料已保留';
              this.showToast(`雲端同步失敗：${error.message}`, 'error', 7000);
            }
            return false;
          } finally {
            this.cloudSyncInFlight = false;
            if (this.cloudSyncPending) {
              const shouldRetry = !this.cloudConflict;
              this.cloudSyncPending = false;
              if (shouldRetry) this.queueCloudSync(300);
            }
          }
        },
        queueCloudSync(delay = 1200) {
          if (this.storageRecoveryBlocked || this.cloudRestorePending) return;
          this.markCloudPendingWrite('local_change');
          if (this.cloudApplying || !this.authUser) return;
          if (this.cloudConflict) return;
          if (!this.cloudReady) {
            if (this.hasMeaningfulLocalData()) {
              this.cloudMigrationNeeded = true;
              this.cloudStatus = 'migration';
              this.cloudMessage = '本機已有資料，請確認首次搬移到 Supabase';
            }
            return;
          }
          if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
          this.cloudSyncTimer = setTimeout(() => {
            this.cloudSyncTimer = null;
            this.pushCloudSnapshot();
          }, delay);
        },
        assertCloudDeleteReady() {
          if (this.cloudLastSync && (!this.cloudReady || !this.authUser)) {
            this.showToast('此裝置曾同步雲端；請先恢復登入與連線，再執行刪除，避免資料之後復活', 'error', 9000);
            return false;
          }
          return true;
        },
        async deleteCloudRecord(table, column, value) {
          if (!this.cloudReady || !this.authUser || !value) return false;
          try {
            const config = this.versionedTableConfigs()[table];
            const key = String(value);
            const baseline = this.cloudBaseline[table]?.[key];
            const filters = [
              `${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`,
              `owner_id=eq.${encodeURIComponent(this.authUser.id)}`
            ];
            if (baseline) filters.push(`version=eq.${baseline.version}`);
            const rows = await this.cloudRequest(table, {
              method: 'DELETE',
              query: filters.join('&'),
              prefer: 'return=representation'
            });
            if (baseline && (!Array.isArray(rows) || !rows.length)) {
              const payload = baseline.keyPayload || { [column]: value };
              const cloudRow = await this.fetchCurrentCloudRow(table, payload);
              const error = this.makeVersionConflict(table, payload, cloudRow, 'delete');
              this.cloudConflict = error.conflict;
              this.cloudStatus = 'conflict';
              this.cloudMessage = '刪除前偵測到其他裝置修改，請選擇版本';
              return false;
            }
            if (this.cloudBaseline[table]) delete this.cloudBaseline[table][key];
            return true;
          } catch (error) {
            console.error(`Cloud delete failed for ${table}:`, error);
            this.cloudStatus = 'error';
            this.cloudMessage = '雲端刪除失敗，請稍後重新同步';
            this.recordCloudSyncFailure('刪除雲端資料', error, { table });
            return false;
          }
        },
        async useCloudConflictVersion() {
          this.clearQueuedCloudSync();
          this.cloudConflict = null;
          const success = await this.reloadCloudData();
          if (success) this.clearCloudPendingWrite();
        },
        async keepLocalConflictVersion() {
          const conflict = this.cloudConflict;
          if (!conflict) return;
          this.clearQueuedCloudSync();
          this.cloudStatus = 'syncing';
          this.cloudMessage = '正在用本機版本覆蓋所有待同步資料…';
          try {
            if (conflict.operation === 'delete') {
              await this.forceDeleteCloudRow(conflict.table, conflict.localPayload);
            }
            const payloads = this.buildCloudPayloads();
            const changed = await this.forceOverwriteLocalVersionedChanges();
            await this.upsertCloudRows('prepaid_ledger', payloads.prepaid_ledger, 'id', true);
            this.cloudConflict = null;
            this.cloudReady = true;
            this.cloudStatus = 'synced';
            this.cloudLastSync = new Date().toISOString();
            localStorage.setItem('momo_cloud_last_sync', this.cloudLastSync);
            this.clearCloudPendingWrite();
            this.cloudMessage = `已用本機覆蓋雲端 ${changed} 筆 · ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
            this.recordOperation('cloud_conflict_overwrite', '保留本機並覆蓋雲端', `${conflict.label} 衝突已處理；覆蓋待同步資料 ${changed} 筆`, { table: conflict.table, key: conflict.key, changed });
            this.showToast(`已保留本機版本並覆蓋雲端 ${changed} 筆`);
          } catch (error) {
            console.error('Cloud conflict overwrite failed:', error);
            this.cloudConflict = conflict;
            this.cloudStatus = 'conflict';
            this.cloudMessage = '覆蓋雲端失敗，請確認網路後再試';
            this.showToast(`覆蓋雲端失敗：${error.message}`, 'error', 7000);
          }
        },
        async migrateLocalDataToSupabase() {
          if (this.storageRecoveryBlocked || !this.cloudMigrationNeeded || this.cloudStatus === 'syncing') return;
          const success = await this.pushCloudSnapshot(true);
          if (success) {
            try {
              const snapshot = await this.fetchCloudSnapshot();
              this.applyCloudSnapshot(snapshot);
              this.startCloudVersionPolling();
            } catch (error) {
              console.warn('Post-migration reload skipped:', error);
            }
            this.showToast('本機與雲端資料已安全合併', 'success', 6000);
          }
          else this.cloudMigrationNeeded = true;
        },
        async reloadCloudData(force = false, discardRestoredLocal = false) {
          if (this.storageRecoveryBlocked) {
            this.showToast('資料回復尚未完成，已阻止載入雲端覆蓋本機', 'error', 8000);
            return false;
          }
          if (this.cloudStatus === 'loading' || this.cloudStatus === 'syncing') return;
          if (this.cloudRestorePending && !discardRestoredLocal) {
            this.showConfirm('目前裝置正在保護剛還原的本機版本。重新載入雲端會放棄這份本機還原內容；建議先下載 JSON 留存。確定繼續嗎？', async () => {
              await this.reloadCloudData(true, true);
            }, { title: '放棄本機還原版本', subtitle: '目前資料將由 Supabase 最新內容取代', tone: 'danger', confirmLabel: '載入雲端', loadingLabel: '載入中…' });
            return;
          }
          if (!this.authSession?.access_token) {
            this.showAuthSheet = true;
            this.showToast('請先登入雲端帳號，再載入雲端資料', 'error', 5000);
            return;
          }
          if (!this.authUser) {
            const restored = await this.restoreSupabaseSession();
            if (!restored || !this.authUser) {
              this.showAuthSheet = true;
              this.showToast('登入狀態已過期，請重新登入後載入雲端資料', 'error', 5000);
              return;
            }
          }
          if (!force && !this.cloudReady) return;
          this.cloudStatus = 'loading';
          this.cloudMessage = '正在重新載入雲端資料…';
          try {
            await this.restoreSupabaseSession();
            const snapshot = await this.fetchCloudSnapshot();
            this.createPreCloudBackup();
            this.applyCloudSnapshot(snapshot, { force: discardRestoredLocal });
            if (discardRestoredLocal) this.clearCloudRestorePending();
            this.startCloudVersionPolling();
            localStorage.setItem(this.cloudMigrationKey(), '1');
            this.cloudReady = true;
            this.cloudMigrationNeeded = false;
            this.cloudStatus = 'synced';
            this.cloudLastSync = new Date().toISOString();
            localStorage.setItem('momo_cloud_last_sync', this.cloudLastSync);
            this.cloudMessage = `雲端資料已重新載入 · ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
            this.runIntegrityCheck(false);
            await this.createAutomaticBackup({ silent: true });
            this.showToast('已重新載入 Supabase 資料');
            return true;
          } catch (error) {
            this.cloudStatus = this.cloudRestorePending ? 'restore_pending' : 'error';
            this.cloudMessage = this.cloudRestorePending
              ? '雲端載入失敗，本機還原版本仍受保護且未被覆蓋'
              : '雲端重新載入失敗，本機資料未變更';
            this.recordCloudSyncFailure('重新載入雲端資料', error, { restorePending: Boolean(this.cloudRestorePending) });
            this.showToast(`雲端載入失敗：${error.message}`, 'error', 7000);
            return false;
          }
        },

        // API Sync & Data washing
        shiftMonth(direction) {
          this.ordersCustomerHistoryId = null;
          const step = direction < 0 ? -1 : 1;
          if (this.selectedMonth === 'All') {
            this.selectedYear = String(Number(this.selectedYear) + step);
            return;
          }
          let year = Number(this.selectedYear);
          let month = Number(this.selectedMonth) + step;
          if (month < 1) {
            month = 12;
            year -= 1;
          } else if (month > 12) {
            month = 1;
            year += 1;
          }
          this.selectedYear = String(year);
          this.selectedMonth = String(month).padStart(2, '0');
          this.lastMonthlySelection = this.selectedMonth;
        },
        toggleAnnualView() {
          this.ordersCustomerHistoryId = null;
          if (this.selectedMonth === 'All') {
            this.selectedMonth = this.lastMonthlySelection || new Date().toLocaleDateString('sv-SE').slice(5, 7);
          } else {
            this.lastMonthlySelection = this.selectedMonth;
            this.selectedMonth = 'All';
          }
        },
        async fetchCalendarSyncResponse(baseUrl, queryString, payload, timeoutMs = 45000) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          try {
            return await fetch(`${baseUrl}/api/sync${queryString}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
              body: JSON.stringify(payload),
              signal: controller.signal
            });
          } finally {
            clearTimeout(timeoutId);
          }
        },
        syncFromApi(options = {}) {
          const syncOptions = this.normalizeCalendarSyncOptions(options);
          if (this.storageRecoveryBlocked) {
            if (!syncOptions.silent) this.showToast('資料回復尚未完成，行事曆同步已暫停', 'error', 8000);
            return Promise.resolve(false);
          }
          if (this._calendarSyncPromise) {
            if (!syncOptions.silent && !syncOptions.automatic) {
              const now = Date.now();
              if (!this._calendarSyncJoinNotifiedAt || now - this._calendarSyncJoinNotifiedAt > 2500) {
                this._calendarSyncJoinNotifiedAt = now;
                this.showToast('行事曆已在同步中，會沿用同一次連線', 'info', 3500);
              }
            }
            return this._calendarSyncPromise;
          }
          const trackedPromise = this._syncFromApiOnce(syncOptions).finally(() => {
            if (this._calendarSyncPromise === trackedPromise) this._calendarSyncPromise = null;
          });
          this._calendarSyncPromise = trackedPromise;
          return trackedPromise;
        },
        async _syncFromApiOnce(syncOptions = {}) {
          const silent = Boolean(syncOptions.silent);
          if (this.storageRecoveryBlocked) return false;
          if (this.authConfig.required && !this.authSession?.access_token) {
            this.authError = '請先登入後再同步行事曆';
            if (!silent) this.showAuthSheet = true;
            const error = new Error('尚未登入');
            this.setCalendarSyncError(error, 401, '', { silent });
            this.markCalendarSyncFailure(error, syncOptions);
            return false;
          }
          // 全年模式下提示用戶選擇月份
          if (this.selectedMonth === 'All') {
            if (!silent) this.showToast('請先選擇特定月份再同步，全年模式下後端只會回傳當月資料', 'error', 5000);
            return false;
          }

          this.syncing = true;
          this.cancelCalendarSyncRetry();
          this.calendarSyncFallbackActive = false;
          this.markCalendarSyncAttempt(syncOptions);
          if (silent) {
            this.calendarAutoSyncStatus = 'syncing';
            this.calendarAutoSyncMessage = '背景同步行事曆…';
          } else {
            this.calendarAutoSyncStatus = 'syncing';
            this.calendarAutoSyncMessage = '同步中…';
            this.showToast('正在向伺服器同步資料…', 'loading', 8000);
          }
          const slowResponseTimer = setTimeout(() => this.activateCalendarSyncFallback(syncOptions), 10000);

          // 根據當前選擇的年月份建立 Query 參數，讓同步能配合當前檢視區間
          const params = [];
          if (this.selectedYear) {
            params.push(`year=${this.selectedYear}`);
          }
          if (this.selectedMonth && this.selectedMonth !== 'All') {
            params.push(`month=${parseInt(this.selectedMonth, 10)}`);
          }
          const queryString = params.length > 0 ? `?${params.join('&')}` : '';

          let response;
          const productionApi = 'https://mo2-z7d1.onrender.com';
          const primaryApi = this.apiBaseUrl || (window.location.origin === productionApi ? window.location.origin : productionApi);
          const syncPayload = this.buildCalendarSyncPricingPayload();
          try {
            // 正式站直接使用同網域 API；本機開發時沿用偵測到的本機 API。
            response = await this.fetchCalendarSyncResponse(
              primaryApi,
              queryString,
              syncPayload,
              primaryApi.includes('127.0.0.1') ? 1500 : 45000
            );
            console.log(`成功連線至 ${primaryApi} 同步！`);
          } catch (e) {
            if (primaryApi === productionApi) {
              console.error('API Sync Error:', e);
              clearTimeout(slowResponseTimer);
              this.syncing = false;
              return this.handleCalendarSyncFailure(e, syncOptions);
            }
            console.log('本機後端未啟動或連線超時，切換為 Render 雲端後端...');
            if (!silent) this.showToast('連線雲端伺服器，冷啟動約需 30 秒，請稍候…', 'info', 8000);
            try {
              response = await this.fetchCalendarSyncResponse(productionApi, queryString, syncPayload, 45000);
            } catch (err) {
              console.error('API Sync Error:', err);
              clearTimeout(slowResponseTimer);
              this.syncing = false;
              return this.handleCalendarSyncFailure(err, syncOptions);
            }
          }

          try {
            if (!response.ok) {
              const detail = await response.text().catch(() => '');
              const error = new Error(`HTTP ${response.status}`);
              error.httpStatus = response.status;
              error.detail = detail;
              throw error;
            }

            const resData = await response.json();
            const orders = resData.orders || (resData.data && resData.data.orders);
            if (resData && Array.isArray(orders)) {
              const cancelledEventIds = resData.cancelledEventIds || (resData.data && resData.data.cancelledEventIds) || [];
              const backendIssues = resData.issues || (resData.data && resData.data.issues) || [];
              const quarantinedEvents = resData.quarantinedEvents || (resData.data && resData.data.quarantinedEvents) || [];
              const acceptedOrderIds = new Set((Array.isArray(orders) ? orders : [])
                .map(order => String(order?.orderId || order?.order_id || '').trim().toLocaleLowerCase('zh-TW'))
                .filter(Boolean));
              const quarantinedEventIds = (Array.isArray(quarantinedEvents) ? quarantinedEvents : [])
                .map(event => String(event?.sourceEventId || '').trim())
                .filter(Boolean);
              const quarantinedOrderIds = (Array.isArray(quarantinedEvents) ? quarantinedEvents : [])
                .map(event => String(event?.orderId || '').trim().toLocaleLowerCase('zh-TW'))
                .filter(orderId => orderId && !acceptedOrderIds.has(orderId));
              const report = this.washAndMergeOrders(orders, cancelledEventIds, {
                silent,
                quarantinedEventIds,
                quarantinedOrderIds
              });
              const normalizedBackendIssues = (Array.isArray(backendIssues) ? backendIssues : []).map((issue, index) => ({
                ...issue,
                id: issue.id || `${new Date().toISOString()}-backend-${index + 1}`,
                type: issue.type || issue.code || 'calendar_quarantine',
                severity: issue.severity || 'error',
                message: issue.message || '行事曆事件未通過入帳規則，已隔離。',
                source: 'backend'
              }));
              report.issues = [...normalizedBackendIssues, ...(report.issues || [])];
              report.quarantined = Array.isArray(quarantinedEvents) ? quarantinedEvents.length : 0;
              report.quarantinedEvents = Array.isArray(quarantinedEvents) ? quarantinedEvents : [];
              report.skipped += report.quarantined;
              report.warnings += normalizedBackendIssues.filter(issue => issue.severity === 'warning').length;
              this.lastSyncTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
              localStorage.setItem('momo_last_sync_time', this.lastSyncTime);
              this.syncReport = {
                ...report,
                diagnostics: resData.diagnostics || (resData.data && resData.data.diagnostics) || {},
                syncedAt: new Date().toISOString(),
                period: `${this.selectedYear}-${this.selectedMonth}`
              };
              localStorage.setItem('momo_sync_report', JSON.stringify(this.syncReport));
              this.clearCalendarSyncError();
              this.markCalendarSyncSuccess(syncOptions);
              this.runIntegrityCheck(false);
              await this.createAutomaticBackup({ force: true, silent: true });
              return true;
            } else {
              throw new Error('伺服器回傳之資料格式有誤');
            }
          } catch (e) {
            console.error('API Sync Error:', e);
            let detail = e.detail || '';
            try {
              const parsed = detail ? JSON.parse(detail) : null;
              detail = parsed?.detail || detail;
            } catch (_) {}
            return this.handleCalendarSyncFailure(e, syncOptions, e.httpStatus || 0, detail);
          } finally {
            clearTimeout(slowResponseTimer);
            this.syncing = false;
          }
        },

        washAndMergeOrders(rawOrders, cancelledEventIds = [], options = {}) {
          if (this.storageRecoveryBlocked) {
            throw new Error('資料回復尚未完成，已阻止 Calendar 改寫本機資料');
          }
          const rollback = this.buildBackupData();
          let mergedCount = 0;
          let updatedCount = 0;
          let unchangedCount = 0;
          let cancelledCount = 0;
          let skippedCount = 0;
          let warningCount = 0;
          const issues = [];
          const unmatchedServices = new Map();
          let issueSeq = 0;
          const syncRunAt = new Date().toISOString();
          const addIssue = (type, severity, message, context = {}) => {
            const issue = {
              id: `${syncRunAt}-${++issueSeq}`,
              type,
              severity,
              message,
              at: syncRunAt,
              ...context
            };
            issues.push(issue);
            return issue;
          };
          const addUnmatchedService = (serviceName, context = {}) => {
            const name = String(serviceName || '').trim();
            const key = this.normalizeSyncServiceKey(name);
            if (!key) return;
            const row = unmatchedServices.get(key) || {
              key,
              serviceName: name,
              count: 0,
              latestDate: '',
              customers: [],
              unmatchedServices: [],
              example: null
            };
            row.count += 1;
            if (context.date && context.date > row.latestDate) row.latestDate = context.date;
            if (context.customerName && !row.customers.includes(context.customerName)) row.customers.push(context.customerName);
            (context.unmatchedServices || []).forEach(item => {
              if (item && !row.unmatchedServices.includes(item)) row.unmatchedServices.push(item);
            });
            if (!row.example) row.example = { ...context, serviceName: name };
            unmatchedServices.set(key, row);
          };
          const bySourceEventId = new Map(
            this.orders
              .filter(order => order.sourceEventId)
              .map(order => [String(order.sourceEventId), order])
          );
          const byExternalOrderId = new Map(
            this.orders
              .filter(order => order.orderId)
              .map(order => [String(order.orderId).trim().toLocaleLowerCase('zh-TW'), order])
          );
          const seenIncomingOrderIds = new Set();

          rawOrders.forEach(raw => {
            // Backend output is already accounting-normalized. Preserve legitimate
            // spaces in names instead of truncating `王 小美` to `王`.
            const rawName = String(raw.customerName || raw.name || '');
            const customerName = rawName.trim().replace(/\s+/g, ' ');

            if (this.isBlockedSlot(customerName)) {
              skippedCount++;
              return; // Skip sync for block slots
            }

            // Preserve service tokens; only normalize explicit plus separators and notes.
            const rawService = String(raw.serviceName || raw.service || '');
            let serviceName = rawService.replace(/Service:\s*/gi, '');
            // 移除 [大分類] 與 (圓括號備註)
            serviceName = serviceName.replace(/\[.*?\]/g, ' ');
            serviceName = serviceName.replace(/（.*?）/g, ' ');
            serviceName = serviceName.replace(/\(.*?\)/g, ' ');
            serviceName = serviceName
              .replace(/\s*[+＋]\s*/g, ' + ')
              .replace(/\s+/g, ' ')
              .trim();

            // 3. Gender determination: 只從姓名判斷，避免「男生短髮」污染女客性別
            const isMale = /[先生哥男\u{1F466}]/u.test(rawName);
            const gender = isMale ? '男' : '女';

            // 4. 付款方式必須由行事曆明確提供，不把缺漏誤判成現金。
            const paymentMethod = String(raw.paymentMethod || '').trim();
            const topupChannel = paymentMethod === '儲值進帳'
              ? (['現金', '轉帳'].includes(raw.topupChannel) ? raw.topupChannel : null)
              : null;

            // Extract amount & date
            const amount = Number(raw.amount) || 0;
            const cashAmount = Number(raw.cashAmount) || 0;
            const date = String(raw.date || '').trim();
            const sourceEventId = String(raw.sourceEventId || raw.eventId || '').trim();
            const orderId = String(raw.orderId || raw.order_id || '').trim() || null;
            const normalizedOrderId = orderId ? orderId.toLocaleLowerCase('zh-TW') : '';
            const calendarCustomerId = String(raw.customerId || raw.customer_id || '').trim();
            const actualDurationMinutes = this.normalizeMinutes(raw.actualDurationMinutes);
            const calendarDurationMinutes = this.normalizeMinutes(raw.calendarDurationMinutes);
            const calendarStart = raw.calendarStart || raw.calendar_start_at || null;
            const calendarEnd = raw.calendarEnd || raw.calendar_end_at || null;
            const pricingSource = raw.pricingSource || raw.pricing_source || null;
            const rawUnmatchedServices = raw.pricingUnmatchedServices || raw.pricing_unmatched_services || [];
            const pricingUnmatchedServices = Array.isArray(rawUnmatchedServices)
              ? rawUnmatchedServices.map(item => String(item || '').trim()).filter(Boolean)
              : [];
            const serviceConfigUpdatedAt = raw.serviceConfigUpdatedAt || raw.service_config_updated_at || null;

            const validPaymentMethods = ['現金', '轉帳', '儲值扣款', '現金＋儲值扣款', '儲值進帳'];
            const today = new Date().toLocaleDateString('sv-SE');
            const calendarEndMs = calendarEnd ? Date.parse(calendarEnd) : NaN;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !customerName.trim() || !serviceName.trim()) {
              skippedCount++;
              addIssue('invalid_required_fields', 'error', '行事曆資料缺少日期、顧客或服務名稱，已隔離且未入帳。', {
                date,
                customerName,
                serviceName,
                sourceEventId,
                rawService
              });
              return;
            }
            if (!sourceEventId || !orderId) {
              skippedCount++;
              addIssue(!orderId ? 'missing_order_id' : 'missing_event_id', 'error', !orderId
                ? '行事曆事件缺少 Order ID，已隔離且未入帳。'
                : '行事曆事件缺少 Event ID，已隔離且未入帳。', {
                date,
                customerName,
                serviceName,
                sourceEventId,
                orderId,
                amount
              });
              return;
            }
            if (date > today || (Number.isFinite(calendarEndMs) && calendarEndMs > Date.now())) {
              skippedCount++;
              addIssue('future_or_incomplete_event', 'error', '尚未完成的未來預約不會提前列入營收。', {
                date,
                customerName,
                serviceName,
                sourceEventId,
                orderId
              });
              return;
            }
            if (amount <= 0) {
              skippedCount++;
              addIssue('invalid_amount', 'error', `服務「${serviceName}」缺少有效正金額，已隔離且未入帳。`, {
                date,
                customerName,
                serviceName,
                sourceEventId,
                orderId,
                amount,
                pricingSource,
                unmatchedServices: pricingUnmatchedServices
              });
              return;
            }
            if (!validPaymentMethods.includes(paymentMethod)) {
              skippedCount++;
              addIssue('invalid_payment', 'error', `付款方式「${paymentMethod || '未填'}」無效，已隔離且未入帳。`, {
                date,
                customerName,
                serviceName,
                sourceEventId,
                orderId,
                amount,
                paymentMethod
              });
              return;
            }
            if (paymentMethod === '儲值進帳' && !topupChannel) {
              skippedCount++;
              addIssue('missing_topup_channel', 'error', '儲值進帳必須明確標示現金或轉帳收款，該事件未入帳。', {
                date,
                customerName,
                serviceName,
                sourceEventId,
                orderId,
                amount
              });
              return;
            }
            if (paymentMethod === '現金＋儲值扣款' && (cashAmount <= 0 || cashAmount >= amount)) {
              skippedCount++;
              addIssue('invalid_mixed_payment', 'error', '混合付款的現金金額需大於 0 且小於消費總額，該事件未入帳。', {
                date,
                customerName,
                serviceName,
                sourceEventId,
                orderId,
                amount,
                cashAmount,
                paymentMethod
              });
              return;
            }
            if (seenIncomingOrderIds.has(normalizedOrderId)) {
              skippedCount++;
              warningCount++;
              addIssue('duplicate_order_id', 'warning', `Order ID「${orderId}」重複，後續事件已去重且未重複入帳。`, {
                date,
                customerName,
                serviceName,
                sourceEventId,
                orderId,
                amount
              });
              return;
            }
            // 先辨識既有來源，再判斷鎖帳。完全相同的舊事件應計為 unchanged，
            // 只有鎖帳日的新事件才需要逐筆警告。
            let existing = byExternalOrderId.get(normalizedOrderId) || bySourceEventId.get(sourceEventId) || null;
            if (!existing && sourceEventId) {
              const legacyCandidates = this.orders.filter(order =>
                !order.sourceEventId
                && String(order.id || '').startsWith('sync_')
                && order.date === date
                && order.customerName === customerName
                && (Number(order.amount) === amount || (order.source === 'google_calendar' && Number(order.amount) > 0))
                && order.serviceName === serviceName
              );
              if (legacyCandidates.length === 1) existing = legacyCandidates[0];
            }
            if (this.isDateLocked(date) && !existing) {
              skippedCount++;
              warningCount++;
              addIssue('date_locked', 'warning', `${date} 已打烊鎖帳，同步資料已跳過。`, {
                date,
                customerName,
                serviceName,
                sourceEventId,
                amount
              });
              return;
            }
            if (pricingSource === 'unmatched_service_config' || pricingUnmatchedServices.length) {
              warningCount++;
              const unmatched = pricingUnmatchedServices.length ? pricingUnmatchedServices : [serviceName];
              addUnmatchedService(serviceName, { date, customerName, unmatchedServices: unmatched, sourceEventId, amount });
              addIssue('unmatched_service_config', 'warning', `服務「${serviceName}」找不到系統價目表，請補定價。`, {
                date,
                customerName,
                serviceName,
                sourceEventId,
                amount,
                pricingSource,
                unmatchedServices: unmatched
              });
            }
            // Order ID 是會計唯一鍵；Event ID 只用來追蹤來源事件。
            let syncedCustomer = null;
            if (calendarCustomerId) {
              const referencedCustomer = this.rawCustomerMap[calendarCustomerId];
              if (!referencedCustomer) {
                skippedCount++;
                addIssue('unknown_customer_id', 'error', `Customer ID「${calendarCustomerId}」不存在，為避免扣錯同名顧客，該事件已隔離。`, {
                  date,
                  customerName,
                  customerId: calendarCustomerId,
                  serviceName,
                  sourceEventId,
                  orderId,
                  amount
                });
                return;
              }
              syncedCustomer = this.rawCustomerMap[this.resolveMergedCustomerId(referencedCustomer.id)] || referencedCustomer;
              if (this.normalizeCustomerName(syncedCustomer.name) !== this.normalizeCustomerName(customerName)) {
                warningCount++;
                addIssue('customer_id_name_mismatch', 'warning', `Calendar 姓名「${customerName}」與 Customer ID 顧客「${syncedCustomer.name}」不同，已依 Customer ID 入帳。`, {
                  date,
                  customerName,
                  customerId: calendarCustomerId,
                  serviceName,
                  sourceEventId,
                  orderId,
                  amount
                });
              }
            } else {
              const existingIdentity = existing?.customerId ? this.rawCustomerMap[existing.customerId] : null;
              const incomingNameKey = this.normalizeCustomerName(customerName);
              const existingNameMatches = existingIdentity && [existing.customerName, existingIdentity.name]
                .some(name => this.normalizeCustomerName(name) === incomingNameKey);
              if (existingNameMatches) {
                syncedCustomer = this.rawCustomerMap[this.resolveMergedCustomerId(existingIdentity.id)] || existingIdentity;
              }
            }
            if (!syncedCustomer && !calendarCustomerId) {
              const nameMatches = this.findCustomersByName(customerName);
              if (nameMatches.length > 1) {
                skippedCount++;
                addIssue('ambiguous_customer_name', 'error', `顧客「${customerName}」有 ${nameMatches.length} 位同名資料，請在 Calendar 描述加入 Customer ID 後再同步。`, {
                  date,
                  customerName,
                  customerIds: nameMatches.map(customer => customer.id),
                  serviceName,
                  sourceEventId,
                  orderId,
                  amount
                });
                return;
              }
              syncedCustomer = nameMatches[0] || this.findOrCreateCustomer(customerName, gender);
            }
            if (!syncedCustomer) {
              skippedCount++;
              addIssue('customer_create_failed', 'error', `顧客「${customerName}」建立失敗，該筆同步已跳過。`, {
                date,
                customerName,
                serviceName,
                sourceEventId,
                amount
              });
              return;
            }
            const customerId = syncedCustomer.id;
            seenIncomingOrderIds.add(normalizedOrderId);

            if (existing && this.isDateLocked(existing.date)) {
              const lockedIncoming = {
                date,
                customerId,
                customerName: syncedCustomer.name,
                gender: syncedCustomer.gender || gender,
                serviceName,
                amount,
                paymentMethod,
                cashAmount: paymentMethod === '現金＋儲值扣款' ? cashAmount : null,
                topupChannel
              };
              const lockedChangedFields = ['date', 'customerId', 'customerName', 'gender', 'serviceName', 'amount', 'paymentMethod', 'cashAmount', 'topupChannel']
                .filter(key => JSON.stringify(existing[key] ?? null) !== JSON.stringify(lockedIncoming[key] ?? null));
              if (lockedChangedFields.length) {
                skippedCount++;
                warningCount++;
                addIssue('locked_calendar_change', 'warning', `${existing.date} 已打烊鎖帳；Calendar 異動未改寫原單，請用更正單處理。`, {
                  date: existing.date,
                  incomingDate: date,
                  customerName: existing.customerName,
                  serviceName: existing.serviceName,
                  sourceEventId,
                  orderId,
                  amount,
                  fields: lockedChangedFields
                });
              } else {
                unchangedCount++;
              }
              return;
            }

            const syncedFields = {
              date,
              customerId,
              customerName: syncedCustomer.name,
              gender: syncedCustomer.gender || gender,
              serviceName,
              amount,
              paymentMethod,
              cashAmount: paymentMethod === '現金＋儲值扣款' ? cashAmount : null,
              topupChannel,
              source: 'google_calendar',
              sourceEventId: sourceEventId || null,
              orderId,
              calendarStart,
              calendarEnd,
              calendarDurationMinutes,
              actualDurationMinutes,
              pricingSource,
              pricingUnmatchedServices,
              serviceConfigUpdatedAt,
              syncStatus: 'active',
              lastSyncedAt: new Date().toISOString()
            };

            if (!existing) {
              const newOrder = {
                id: `gcal_${sourceEventId}`,
                ...syncedFields
              };
              this.orders.push(newOrder);
              bySourceEventId.set(sourceEventId, newOrder);
              byExternalOrderId.set(normalizedOrderId, newOrder);
              mergedCount++;
            } else {
              const mergedFields = {
                ...syncedFields,
                // Calendar provides scheduled occupancy, not actual chair time. Preserve
                // a manually-entered actual duration when a later sync returns null.
                actualDurationMinutes: actualDurationMinutes ?? existing.actualDurationMinutes ?? null
              };
              const changed = ['date', 'customerId', 'customerName', 'gender', 'serviceName', 'amount', 'paymentMethod', 'cashAmount', 'topupChannel', 'sourceEventId', 'orderId', 'calendarStart', 'calendarEnd', 'calendarDurationMinutes', 'actualDurationMinutes', 'pricingSource', 'pricingUnmatchedServices', 'serviceConfigUpdatedAt', 'syncStatus']
                .some(key => JSON.stringify(existing[key] ?? null) !== JSON.stringify(mergedFields[key] ?? null));
              Object.assign(existing, mergedFields);
              bySourceEventId.set(sourceEventId, existing);
              byExternalOrderId.set(normalizedOrderId, existing);
              changed ? updatedCount++ : unchangedCount++;
            }
          });

          const cancelledSet = new Set(cancelledEventIds.map(String));
          const quarantinedSet = new Set((options.quarantinedEventIds || []).map(String));
          const quarantinedOrderSet = new Set((options.quarantinedOrderIds || [])
            .map(value => String(value || '').trim().toLocaleLowerCase('zh-TW'))
            .filter(Boolean));
          this.orders.forEach(order => {
            const sourceEventId = String(order.sourceEventId || '');
            const externalOrderId = String(order.orderId || '').trim().toLocaleLowerCase('zh-TW');
            const shouldDeactivate = cancelledSet.has(sourceEventId)
              || quarantinedSet.has(sourceEventId)
              || (externalOrderId && quarantinedOrderSet.has(externalOrderId));
            if (order.source === 'google_calendar' && sourceEventId && shouldDeactivate) {
              if (this.isDateLocked(order.date)) {
                skippedCount++;
                warningCount++;
                addIssue('cancelled_locked', 'warning', `${order.date} 已打烊鎖帳，行事曆取消事件未套用到帳本。`, {
                  date: order.date,
                  customerName: order.customerName,
                  serviceName: order.serviceName,
                  sourceEventId: order.sourceEventId,
                  orderId: order.id,
                  amount: Number(order.amount) || 0
                });
                return;
              }
              if (order.syncStatus !== 'cancelled') cancelledCount++;
              order.syncStatus = 'cancelled';
              order.syncQuarantineReason = quarantinedSet.has(sourceEventId) ? 'calendar_validation_failed' : null;
              order.lastSyncedAt = new Date().toISOString();
            }
          });

          try {
            this.persistCurrentStateStrict(localStorage.getItem('momo_servicesConfigUpdatedAt'));
          } catch (error) {
            this.replaceBusinessStateFromBackup(rollback, true);
            try {
              this.persistCurrentStateStrict(rollback.momo_servicesConfigUpdatedAt || null);
            } catch (rollbackError) {
              console.error('Calendar sync rollback failed:', rollbackError);
            }
            throw new Error(`Calendar 同步無法完整儲存，已回復同步前資料：${error.message || error}`);
          }
          if (!options.silent) {
            if (mergedCount || updatedCount || cancelledCount) {
              this.showToast(`同步完成：新增 ${mergedCount}、更新 ${updatedCount}、取消 ${cancelledCount} 筆`);
            } else {
              this.showToast('同步完成，行事曆資料沒有變更');
            }
          }
          return {
            received: rawOrders.length,
            merged: mergedCount,
            updated: updatedCount,
            unchanged: unchangedCount,
            cancelled: cancelledCount,
            skipped: skippedCount,
            warnings: warningCount,
            issues,
            unmatchedServices: Array.from(unmatchedServices.values())
          };
        },

        // Navigate from dashboard customer rank to CRM profile
        goToCustomerCRM(customerRef) {
          const customer = this.customerMap[customerRef] || this.findCustomerByName(customerRef);
          const name = customer?.name || String(customerRef || '');
          this.activeTab = 'crm';
          this.crmViewMode = 'customers';
          this.crmFilterMode = 'all';
          this.crmSortMode = 'lastDate';
          this.crmSearchQuery = name;
          this.expandedCrmCustomerName = customer?.id || null;
          this.scrollToTopForNavigation();
        },
        toggleCrmCustomer(customerId) {
          const shouldOpen = this.expandedCrmCustomerName !== customerId;
          this.expandedCrmCustomerName = shouldOpen ? customerId : null;
          if (shouldOpen) {
            this.$nextTick(() => {
              const card = document.getElementById(`crm-card-${customerId}`);
              if (card) card.scrollTop = 0;
            });
          }
        },
        resetCrmVisibleLimit() {
          this.crmVisibleLimit = 40;
        },
        showMoreCrmCustomers() {
          this.crmVisibleLimit = Math.min(this.crmVisibleLimit + 40, this.filteredCrmList.length);
        },
        startOrderForCustomer(cust) {
          this.newOrder.date = new Date().toLocaleDateString('sv-SE');
          this.newOrder.customerId = cust.id;
          this.newOrder.customerName = cust.name;
          this.newOrder.createNewCustomer = false;
          this.newOrder.gender = cust.gender || '女';
          this.newOrder.serviceName = cust.lastService || '';
          this.newOrder.amount = null;
          this.newOrder.paymentMethod = '現金';
          this.newOrder.cashAmount = null;
          this.newOrder.topupChannel = '現金';
          this.showMobileAddOrderForm = true;
          this.activeTab = 'orders';
          this.ordersSearchQuery = cust.name;
          this.showToast(`已帶入 ${cust.name}，可直接新增本次業績`, 'info');
          this.$nextTick(() => {
            if (this.$refs.customerNameInput) this.$refs.customerNameInput.focus();
          });
        },
        startPrepaidForCustomer(cust) {
          this.newOrder.date = new Date().toLocaleDateString('sv-SE');
          this.newOrder.customerId = cust.id;
          this.newOrder.customerName = cust.name;
          this.newOrder.createNewCustomer = false;
          this.newOrder.gender = cust.gender || '女';
          this.newOrder.serviceName = '儲值進帳';
          this.newOrder.amount = null;
          this.newOrder.paymentMethod = '儲值進帳';
          this.newOrder.cashAmount = null;
          this.newOrder.topupChannel = '現金';
          this.showMobileAddOrderForm = true;
          this.activeTab = 'orders';
          this.ordersSearchQuery = cust.name;
          this.showToast(`已帶入 ${cust.name}，請輸入本次儲值金額`, 'info');
          this.$nextTick(() => {
            if (this.$refs.customerNameInput) this.$refs.customerNameInput.focus();
          });
        },
        openCustomerOrders(customerRef) {
          const customer = this.customerMap[customerRef] || this.findCustomerByName(customerRef);
          const name = customer?.name || String(customerRef || '');
          this.ordersCustomerHistoryId = customer?.id || null;
          this.ordersSearchQuery = name;
          this.ordersFilterCategory = 'All';
          this.ordersFilterPayment = 'All';
          this.activeTab = 'orders';
          this.scrollToTopForNavigation();
        },
        closeCustomerHistory() {
          this.ordersCustomerHistoryId = null;
          this.ordersSearchQuery = '';
        },

        resetNewOrderDraft() {
          Object.assign(this.newOrder, {
            date: new Date().toLocaleDateString('sv-SE'),
            customerId: '',
            customerName: '',
            createNewCustomer: false,
            gender: '女',
            serviceName: '',
            amount: null,
            paymentMethod: '現金',
            cashAmount: null,
            topupChannel: '現金'
          });
        },
        resetNewExpenseDraft() {
          Object.assign(this.newExpense, {
            date: new Date().toLocaleDateString('sv-SE'),
            category: '材料費',
            amount: null,
            notes: ''
          });
        },
        resetNewInventoryDraft() {
          Object.assign(this.newInventory, {
            name: '',
            stock: null,
            minStock: 3,
            notes: ''
          });
        },
        requestCloseOrderForm() {
          if (!this.newOrderDraftDirty) {
            this.showMobileAddOrderForm = false;
            return;
          }
          this.showConfirm('這筆業績尚未新增。確定要放棄目前輸入內容嗎？', () => {
            this.resetNewOrderDraft();
            this.showMobileAddOrderForm = false;
          }, { title: '放棄業績草稿', subtitle: '尚未新增的內容將會清除', tone: 'warning', confirmLabel: '放棄草稿' });
        },
        requestCloseExpenseForm() {
          if (!this.newExpenseDraftDirty) {
            this.showExpenseForm = false;
            return;
          }
          this.showConfirm('這筆支出尚未新增。確定要放棄目前輸入內容嗎？', () => {
            this.resetNewExpenseDraft();
            this.showExpenseForm = false;
          }, { title: '放棄支出草稿', subtitle: '尚未新增的內容將會清除', tone: 'warning', confirmLabel: '放棄草稿' });
        },
        requestCloseInventoryForm() {
          if (!this.newInventoryDraftDirty) {
            this.showInventoryForm = false;
            return;
          }
          this.showConfirm('這項商品尚未建立。確定要放棄目前輸入內容嗎？', () => {
            this.resetNewInventoryDraft();
            this.showInventoryForm = false;
          }, { title: '放棄庫存草稿', subtitle: '尚未建立的內容將會清除', tone: 'warning', confirmLabel: '放棄草稿' });
        },
        requestCloseCloseoutSheet() {
          if (!this.closeoutDraftDirty) {
            this.showCloseoutSheet = false;
            return;
          }
          this.showConfirm('打烊盤點尚未完成。確定要放棄目前輸入內容嗎？', () => {
            this.loadCloseoutFormForDate();
            this.showCloseoutSheet = false;
          }, { title: '放棄打烊草稿', subtitle: '盤點現金與備註將恢復為上次紀錄', tone: 'warning', confirmLabel: '放棄草稿' });
        },

        // Dictionary Modal Methods
        openServiceConfigModal(seedService = null) {
          this.tempServicesConfig = JSON.parse(JSON.stringify(this.servicesConfig));
          this.serviceConfigSearchQuery = '';
          const serviceName = String(seedService?.serviceName || seedService?.name || '').trim();
          if (serviceName) {
            const key = this.normalizeSyncServiceKey(serviceName);
            const exists = this.tempServicesConfig.some(service => this.normalizeSyncServiceKey(service.name) === key);
            if (!exists) {
              this.tempServicesConfig.push({
                name: serviceName,
                duration: Number(seedService.duration) || 60,
                price: Number(seedService.price) || 0
              });
            }
            this.serviceConfigSearchQuery = serviceName;
          }
          this.showSyncIssueModal = false;
          this.showServiceConfigModal = true;
        },
        closeServiceConfigModal() {
          if (this.serviceConfigHasChanges) {
            this.showConfirm('價目表有尚未儲存的修改，確定要放棄並關閉嗎？', () => {
              this.showServiceConfigModal = false;
              this.tempServicesConfig = JSON.parse(JSON.stringify(this.servicesConfig || []));
              this.serviceConfigSearchQuery = '';
            }, { title: '放棄價目表修改', subtitle: '尚未儲存的內容將會消失', tone: 'warning', confirmLabel: '放棄修改' });
            return;
          }
          this.showServiceConfigModal = false;
          this.serviceConfigSearchQuery = '';
        },
        addTempService() {
          this.serviceConfigSearchQuery = '';
          this.tempServicesConfig.unshift({ name: '', duration: 60, price: 1000 });
        },
        removeTempService(index) {
          this.tempServicesConfig.splice(index, 1);
        },
        resetServicesConfigToDefault() {
          this.showConfirm('確定要將所有服務項目重設為系統預設值嗎？目前的自訂定價與時長將被覆蓋。', () => {
            this.serviceConfigSearchQuery = '';
            this.tempServicesConfig = JSON.parse(JSON.stringify(defaultServicesConfig));
          }, { title: '重設服務價目表', subtitle: '自訂定價與標準時間將被覆蓋', tone: 'danger', confirmLabel: '重設預設值' });
        },
        async saveServicesConfig() {
          if (!this.serviceConfigHasChanges || this.formActionBusy.serviceConfig) return;
          this.formActionBusy.serviceConfig = true;
          await this.$nextTick();
          try {
          // Filter out items with empty names
          const filtered = this.tempServicesConfig.filter(s => s.name && s.name.trim()).map(service => ({
            ...service,
            name: String(service.name).trim(),
            duration: Math.round(Number(service.duration) || 0),
            price: Math.round(Number(service.price) || 0)
          }));
          if (filtered.some(service => service.duration <= 0 || service.price < 0)) {
            this.showToast('每個服務都需要正確的標準時間與非負定價', 'error', 7000);
            return;
          }
          const keys = filtered.map(service => MomoCore.normalizeServiceName(service.name));
          if (new Set(keys).size !== keys.length) {
            this.showToast('價目表有重複服務名稱（空格或全形＋視為同一項），請合併後再儲存', 'error', 8000);
            return;
          }
          const previous = MomoCore.cloneJsonValue(this.servicesConfig);
          const updatedAt = new Date().toISOString();
          this.servicesConfig = JSON.parse(JSON.stringify(filtered));
          this.tempServicesConfig = JSON.parse(JSON.stringify(filtered));
          try {
            this.writeLocalStorageAtomically([
              ['momo_servicesConfig', JSON.stringify(this.servicesConfig)],
              ['momo_servicesConfigUpdatedAt', updatedAt]
            ]);
          } catch (error) {
            this.servicesConfig = previous;
            this.tempServicesConfig = MomoCore.cloneJsonValue(previous);
            throw error;
          }
          this.queueCloudSync();
          this.recordOperation('service_config_update', '更新服務定價', `服務項目 ${this.servicesConfig.length} 項`);
          this.showToast('服務價目表已儲存');
          } finally {
            this.formActionBusy.serviceConfig = false;
          }
        },

        // --- 損益報表 ---
        setReportViewMode(mode) {
          const nextMode = mode === 'annual' ? 'annual' : 'monthly';
          if (nextMode === this.reportViewMode) return;
          this.reportViewMode = nextMode;
          this.reportShowPrepaidDetails = false;
          this.reportShowYieldDetails = false;
        },
        prevReportYear() {
          const y = parseInt(this.selectedYear) - 1;
          this.selectedYear = String(y);
        },
        nextReportYear() {
          const y = parseInt(this.selectedYear) + 1;
          this.selectedYear = String(y);
        },
        openReportMonth(month) {
          this.ordersCustomerHistoryId = null;
          this.selectedMonth = String(month).padStart(2, '0');
          this.activeTab = 'orders';
          this.scrollToTopForNavigation();
        },
        requestMonthlySettlementExport() {
          const summary = this.monthlySettlementSummary;
          const unclosedCount = summary.unclosedDates?.length || 0;
          const statusMessage = unclosedCount
            ? `仍有 ${unclosedCount} 天尚未打烊；匯出內容會將這些日期標示為暫算。`
            : '本月營業日期皆已完成打烊，正式月結會使用固定快照。';
          this.showConfirm(
            `${summary.label}\n\n服務營收：NT$ ${this.formatNumber(summary.serviceRevenue)}\n淨利：NT$ ${this.formatNumber(summary.netProfit)}\n\n${statusMessage}`,
            () => this.exportMonthlySettlementReport(),
            {
              title: '匯出正式月結',
              subtitle: unclosedCount ? '月結仍包含暫算日期' : '打烊快照已完整',
              tone: unclosedCount ? 'warning' : 'info',
              confirmLabel: '確認匯出',
              loadingLabel: '準備報表中…'
            }
          );
        },
        exportMonthlySettlementReport() {
          const s = this.monthlySettlementSummary;
          const p = this.monthlyPrepaidReconciliation;
          const completeness = this.monthlyReportCompleteness;
          const operations = this.monthlyOperationsSummary;
          const sections = [
            {
              title: `帳務完整度與本月營運 ${s.label}`,
              headers: ['項目', '數值'],
              rows: [
                ['月結狀態', completeness.label],
                ...completeness.items.map(item => [item.label, `${item.value}｜${item.detail}`]),
                ['營業額比較', operations.cards[0].detail],
                ['服務筆數比較', operations.cards[1].detail],
                ['平均客單比較', operations.cards[2].detail],
                ['時間產值(NT$/hr)', this.settlementYieldSummary.average || ''],
                ['實際工時覆蓋率', `${this.settlementYieldSummary.actualCoverage}%`]
              ]
            },
            {
              title: `正式月結摘要 ${s.label}`,
              headers: ['項目', '數值'],
              rows: [
                ['月份', s.label],
                ['報表口徑', '完整月結資料，不受畫面搜尋、分類、付款篩選影響；已打烊日期優先使用固定快照，未打烊日期暫用明細計算'],
                ['月結來源', s.settlementBasis],
                ['月結狀態', s.ready ? '已完整' : `未打烊 ${s.unclosedDates.length} 天`],
                ['營業額(NT$)', s.serviceRevenue],
                ['服務筆數', s.ordersCount],
                ['平均客單(NT$)', s.avgTicket],
                ['現金入帳(NT$)', s.cashIn],
                ['轉帳入帳(NT$)', s.transferIn],
                ['現金服務(NT$)', s.cash],
                ['現金儲值(NT$)', s.cashPrepaidIn],
                ['轉帳服務(NT$)', s.transfer],
                ['轉帳儲值(NT$)', s.transferPrepaidIn],
                ['儲值扣款(NT$)', s.prepaidOut],
                ['儲值進帳(NT$)', s.prepaidIn],
                ['支出(NT$)', s.expenses],
                ['淨利(NT$)', s.netProfit],
                ['淨利率', completeness.expenseMissing ? '待確認（本月支出為 0）' : `${s.profitMargin}%`],
                ['有資料日期', s.businessDays],
                ['已打烊日期', s.closedDays],
                ['快照天數', s.snapshotDays],
                ['暫算天數', s.liveDays],
                ['未打烊日期', s.unclosedDates.join('、')]
              ]
            },
            {
              title: '每日月結口徑',
              headers: ['日期', '資料來源', '營業額(NT$)', '現金服務(NT$)', '轉帳服務(NT$)', '儲值扣款(NT$)', '儲值進帳(NT$)', '支出(NT$)', '淨利(NT$)', '服務筆數', '儲值筆數', '打烊時間', '備註'],
              rows: s.dailyRows.map(day => [
                day.date,
                day.sourceLabel,
                day.serviceRevenue,
                day.cash,
                day.transfer,
                day.prepaidOut,
                day.prepaidIn,
                day.expenses,
                day.netProfit,
                day.serviceOrdersCount,
                day.topupCount,
                day.completedAt ? this.formatDateTime(day.completedAt) : '',
                day.note || ''
              ])
            },
            {
              title: '儲值期間對帳總表',
              headers: ['項目', '金額或數量'],
              rows: [
                ['期初儲值餘額(NT$)', p.openingBalance],
                ['本期儲值進帳(NT$)', p.topupIn],
                ['本期儲值扣款(NT$)', p.debitOut],
                ['調整/沖銷(NT$)', p.adjustments],
                ['期末儲值餘額(NT$)', p.closingBalance],
                ['對帳公式', `${p.openingBalance} + ${p.topupIn} - ${p.debitOut} + ${p.adjustments} = ${p.closingBalance}`],
                ['對帳狀態', p.balanced ? '平衡' : '需檢查'],
                ['進帳筆數', p.topupCount],
                ['扣款筆數', p.debitCount],
                ['調整/沖銷筆數', p.adjustmentCount]
              ]
            },
            {
              title: '儲值顧客明細',
              headers: ['顧客ID', '顧客姓名', '期初(NT$)', '本期進帳(NT$)', '本期扣款(NT$)', '調整/沖銷(NT$)', '期末(NT$)'],
              rows: p.customerRows.map(row => [
                row.customerId,
                row.customerName,
                row.openingBalance,
                row.topupIn,
                row.debitOut,
                row.adjustments,
                row.closingBalance
              ])
            },
            {
              title: '完整業績明細',
              headers: ['日期', '顧客姓名', '服務項目', '服務分類', '金額(NT$)', '付款方式', '儲值收款方式', '現金金額(NT$)', '儲值扣款(NT$)', '列入營業額', '預估分鐘', '實際分鐘', '實際每小時產值'],
              rows: this.settlementOrders.map(order => {
                const amount = Number(order.amount) || 0;
                const actualMinutes = this.getOrderActualMinutes(order);
                return [
                  order.date,
                  order.customerName,
                  order.serviceName,
                  order.category || this.classifyCategory(order.serviceName),
                  amount,
                  order.paymentMethod,
                  order.paymentMethod === '儲值進帳' ? this.getTopupChannel(order) : '',
                  order.paymentMethod === '現金＋儲值扣款' ? this.getMixedCashAmount(order) : (order.paymentMethod === '現金' ? amount : 0),
                  order.paymentMethod === '現金＋儲值扣款' ? this.getMixedPrepaidAmount(order) : (order.paymentMethod === '儲值扣款' ? amount : 0),
                  order.paymentMethod !== '儲值進帳' ? '是' : '否',
                  this.getServiceMinutes(order.serviceName) || '',
                  actualMinutes || '',
                  actualMinutes ? Math.round(amount / (actualMinutes / 60)) : ''
                ];
              })
            },
            {
              title: '支出明細',
              headers: ['日期', '支出分類', '付款來源', '金額(NT$)', '備註'],
              rows: this.settlementExpenses.map(expense => [
                expense.date,
                expense.category,
                MomoCore.normalizeExpensePaymentMethod(expense.paymentMethod),
                expense.amount,
                expense.notes || ''
              ])
            },
            {
              title: '時間產值分析',
              headers: ['服務項目', '筆數', '總額(NT$)', '平均客單(NT$)', '平均工時(分)', '實際工時(hr)', '標準工時(hr)', '每小時產值(NT$)', '實際每小時(NT$)', '標準每小時(NT$)', '標準差異(分)', '覆蓋率', '資料口徑'],
              rows: this.settlementServiceYieldRows.map(row => [
                row.serviceName,
                row.count,
                row.totalAmount,
                row.averageAmount,
                row.averageMinutes,
                this.formatHours(row.actualHours),
                this.formatHours(row.totalHours),
                row.yieldPerHour || '',
                row.actualYieldPerHour || '',
                row.standardYieldPerHour || '',
                row.durationDeltaMinutes === null ? '' : row.durationDeltaMinutes,
                `${row.actualCoverage}%`,
                row.timeBasisLabel
              ])
            }
          ];
          this.downloadSectionedCSV(`MOMO正式月結_${s.year}-${s.month}.csv`, sections);
          this.recordOperation('monthly_settlement_export', '匯出正式月結', `${s.label} · 營業額 NT$ ${this.formatNumber(s.serviceRevenue)} · 淨利 NT$ ${this.formatNumber(s.netProfit)}`, { year: s.year, month: s.month });
          this.showToast(`${s.label} 正式月結 CSV 已匯出`);
        },
        exportAnnualReport() {
          const headers = ['月份', '收入(NT$)', '支出(NT$)', '淨利(NT$)', '淨利率', '服務人次', '資料狀態'];
          const rows = this.annualMonthlyData.map(m => [
            m.label,
            m.revenue || 0,
            m.expenses || 0,
            m.net || 0,
            m.revenue > 0 && m.expenses === 0 ? '待確認' : m.revenue > 0 ? Math.round(m.net / m.revenue * 100) + '%' : '-',
            m.count || 0,
            m.revenue > 0 && m.expenses === 0 ? '支出為 0，淨利率待確認' : m.revenue > 0 ? '已包含支出資料' : '尚無資料'
          ]);
          rows.push(['全年合計',
            this.annualSummary.totalRevenue,
            this.annualSummary.totalExpenses,
            this.annualSummary.netProfit,
            this.annualSummary.totalRevenue > 0 && this.annualSummary.totalExpenses === 0 ? '待確認' : this.annualSummary.profitMargin + '%',
            this.annualMonthlyData.reduce((s, m) => s + m.count, 0),
            this.annualSummary.totalRevenue > 0 && this.annualSummary.totalExpenses === 0 ? '全年支出為 0，淨利率待確認' : '已包含支出資料'
          ]);
          this.downloadSectionedCSV(`MOMO損益報表_${this.selectedYear}年.csv`, [{
            title: `${this.selectedYear} 年 年度損益報表`,
            headers,
            rows
          }]);
          this.showToast(`${this.selectedYear} 年度損益報表已匯出`);
        },
        exportAnnualReportCSV() {
          return this.exportAnnualReport();
        },
        exportServiceYieldCSV() {
          const headers = [
            '排行',
            '服務項目',
            '筆數',
            '總營收(NT$)',
            '平均客單(NT$)',
            '平均工時(分)',
            '每小時產值(NT$)',
            '實際每小時(NT$)',
            '標準每小時(NT$)',
            '實際工時(hr)',
            '標準工時(hr)',
            '實際工時覆蓋率',
            '標準差異(分)',
            '標準差異%',
            '效率等級',
            '資料可信度',
            '資料口徑'
          ];
          const rows = this.reportServiceYieldRows.map((row, index) => [
            index + 1,
            row.serviceName,
            row.count,
            row.totalAmount,
            row.averageAmount,
            row.averageMinutes,
            row.yieldPerHour,
            row.actualYieldPerHour || '',
            row.standardYieldPerHour || '',
            this.formatHours(row.actualHours),
            this.formatHours(row.totalHours),
            `${row.actualCoverage}%`,
            row.durationDeltaMinutes === null ? '' : row.durationDeltaMinutes,
            row.durationDeltaPercent === null ? '' : `${row.durationDeltaPercent}%`,
            row.level,
            row.confidenceLabel,
            row.timeBasisLabel
          ]);
          this.downloadCSV(`MOMO服務時間產值排行_${this.selectedYear}-年度.csv`, headers, rows);
          this.showToast('服務時間產值排行 CSV 已匯出');
        },

        // --- 薪水匯入 ---
        importMomoSalary() {
          if (this.selectedMonth === 'All' || this.kpis.momoSalary === 0) return;

          const year  = this.selectedYear;
          const month = String(this.selectedMonth).padStart(2, '0');
          const salary = this.kpis.momoSalary;
          const revenue = this.kpis.revenue;
          const date = `${year}-${month}-01`;
          if (!this.assertDateUnlocked(date)) return;
          const salaryId = `salary_${year}${month}`;

          // 只更新系統產生的固定 ID，保留使用者手動新增的薪資紀錄。
          const existing = this.expenses.find(e => e.id === salaryId);

          const doImport = () => {
            const result = MomoCore.upsertGeneratedSalaryExpense(this.expenses, {
              year,
              month,
              salary,
              revenue
            });
            this.expenses = result.expenses;
            this.saveExpenses();
            this.showExpenseForm = false;
            this.showToast(`薪水 NT$ ${salary.toLocaleString()} 已寫入 ${parseInt(month)} 月支出！`);
          };

          if (existing) {
            this.showConfirm(
              `${parseInt(month)} 月已有系統薪資紀錄（NT$ ${existing.amount.toLocaleString()}），確定要用本月最新業績重新計算嗎？手動薪資紀錄不會被刪除。`,
              doImport,
              { title: '更新本月薪資支出', subtitle: '現有薪資紀錄將被最新計算取代', tone: 'warning', confirmLabel: '重新計算並覆蓋' }
            );
          } else {
            doImport();
          }
        },

        // --- Tab 2: Orders CRUD ---
        addOrder() {
          if (!this.assertDateUnlocked(this.newOrder.date)) return;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(String(this.newOrder.date || '')) || this.newOrder.date > this.todayDate) {
            this.showToast('業績日期不可晚於今天；未完成預約不會提前入帳', 'error', 6000);
            return;
          }
          const totalAmount = Number(this.newOrder.amount) || 0;
          const cashAmount = Number(this.newOrder.cashAmount) || 0;
          const serviceName = String(this.newOrder.serviceName || '').trim();
          if (!serviceName) {
            this.showToast('請輸入服務內容', 'error');
            return;
          }
          if (totalAmount <= 0) {
            this.showToast('金額必須大於 0', 'error');
            return;
          }
          if (this.newOrder.paymentMethod === '儲值進帳' && !['現金', '轉帳'].includes(this.newOrder.topupChannel)) {
            this.showToast('請選擇儲值收款方式：現金或轉帳', 'error');
            return;
          }
          if (this.newOrder.paymentMethod === '現金＋儲值扣款' && (cashAmount <= 0 || cashAmount >= totalAmount)) {
            this.showToast('混合付款的現金金額必須大於 0，且小於消費總額', 'error', 5000);
            return;
          }
          const selectedCustomer = this.customerMap[this.newOrder.customerId];
          const sameNameCustomers = selectedCustomer ? [] : this.findCustomersByName(this.newOrder.customerName);
          if (!selectedCustomer && !this.newOrder.createNewCustomer && sameNameCustomers.length > 1) {
            this.showToast(`找到 ${sameNameCustomers.length} 位同名顧客，請從清單選擇正確顧客；儲值扣款不會猜測綁定`, 'error', 8000);
            return;
          }
          const existingCustomer = selectedCustomer
            || (this.newOrder.createNewCustomer ? null : sameNameCustomers[0] || null);
          const warnings = this.collectNewOrderWarnings(existingCustomer, totalAmount, cashAmount, serviceName);
          if (warnings.length) {
            this.showConfirm(`新增前請確認：\n\n${warnings.join('\n')}\n\n仍要寫入這筆業績嗎？`, () => this.createOrderFromForm(), {
              title: '業績內容需要確認',
              subtitle: '系統偵測到可能影響對帳的內容',
              tone: 'warning',
              confirmLabel: '仍要新增'
            });
            return;
          }
          this.createOrderFromForm();
        },
        collectNewOrderWarnings(customer, totalAmount, cashAmount, serviceName) {
          const warnings = [];
          const date = this.newOrder.date;
          const normalizedName = this.normalizeCustomerName(customer?.name || this.newOrder.customerName);
          const duplicate = this.orders.find(order => {
            if (!this.isOrderActive(order) || order.date !== date) return false;
            const sameCustomer = order.customerId && customer?.id
              ? this.resolveMergedCustomerId(order.customerId) === this.resolveMergedCustomerId(customer.id)
              : this.normalizeCustomerName(order.customerName) === normalizedName;
            return sameCustomer
              && String(order.serviceName || '').trim() === serviceName
              && Number(order.amount || 0) === totalAmount;
          });
          if (duplicate) warnings.push(`・疑似重複：${date} ${customer?.name || this.newOrder.customerName}／${serviceName}／NT$ ${this.formatNumber(totalAmount)}`);
          if (totalAmount >= 20000) warnings.push(`・金額偏高：NT$ ${this.formatNumber(totalAmount)}，請確認沒有多打一個 0`);

          const prepaidUse = this.newOrder.paymentMethod === '儲值扣款'
            ? totalAmount
            : this.newOrder.paymentMethod === '現金＋儲值扣款'
              ? Math.max(0, totalAmount - cashAmount)
              : 0;
          if (prepaidUse > 0) {
            if (!customer?.id) {
              warnings.push('・此筆會扣儲值，但目前尚未對應到既有顧客');
            } else {
              const balance = Number(this.prepaidTotalsByCustomer?.[customer.id]?.balance || 0);
              if (balance < prepaidUse) warnings.push(`・儲值餘額不足：目前 NT$ ${this.formatNumber(balance)}，本次需扣 NT$ ${this.formatNumber(prepaidUse)}`);
            }
          }
          return warnings;
        },
        async createOrderFromForm() {
          if (this.formActionBusy.order) return;
          this.formActionBusy.order = true;
          await this.$nextTick();
          try {
          const totalAmount = Number(this.newOrder.amount) || 0;
          const cashAmount = Number(this.newOrder.cashAmount) || 0;
          const selectedCustomer = this.customerMap[this.newOrder.customerId];
          const customer = selectedCustomer || this.findOrCreateCustomer(
            this.newOrder.customerName,
            this.newOrder.gender,
            null,
            this.newOrder.createNewCustomer
          );
          if (!customer) {
            this.showToast('請輸入有效的顧客姓名', 'error');
            return;
          }
          const id = 'ord_' + Math.random().toString(36).substr(2, 9);
          const order = {
            id,
            date: this.newOrder.date,
            customerId: customer.id,
            customerName: customer.name,
            gender: customer.gender || this.newOrder.gender,
            serviceName: this.newOrder.serviceName.trim(),
            amount: totalAmount,
            paymentMethod: this.newOrder.paymentMethod,
            cashAmount: this.newOrder.paymentMethod === '現金＋儲值扣款' ? cashAmount : null,
            topupChannel: this.newOrder.paymentMethod === '儲值進帳' ? this.newOrder.topupChannel : null
          };
          this.orders.push(order);

          this.saveOrders();
          this.recordOperation('order_create', '新增業績', `${order.date} ${order.customerName} ${order.serviceName} · NT$ ${this.formatNumber(order.amount)}`, { orderId: id });
          this.showToast('業績新增成功');

          // Reset inputs except date
          this.newOrder.customerId = '';
          this.newOrder.customerName = '';
          this.newOrder.createNewCustomer = false;
          this.newOrder.serviceName = '';
          this.newOrder.amount = null;
          this.newOrder.paymentMethod = '現金';
          this.newOrder.cashAmount = null;
          this.newOrder.topupChannel = '現金';

          // 新增完成後：可選擇連續新增，減少手機反覆開啟表單
          if (this.continueAddingOrders) {
            this.showMobileAddOrderForm = true;
            this.$nextTick(() => {
              if (this.$refs.customerNameInput) this.$refs.customerNameInput.focus();
            });
          } else {
            this.showMobileAddOrderForm = false;
          }
          this.activeTab = 'orders';
          } finally {
            this.formActionBusy.order = false;
          }
        },
        deleteOrder(id) {
          const order = this.orders.find(o => o.id === id);
          if (this.isDateLocked(order?.date)) {
            this.createLockedOrderDeleteCorrection(order);
            return;
          }
          if (!this.assertDateUnlocked(order?.date)) return;
          this.showConfirm('確定要刪除這筆業績紀錄嗎？系統會保留稽核資料並自動沖回相關儲值分錄。', () => {
            order.syncStatus = 'cancelled';
            order.deletedAt = new Date().toISOString();
            order.updatedAt = order.deletedAt;
            if (this.expandedOrderId === id) this.expandedOrderId = null;
            this.saveOrders();
            this.recordOperation('order_delete', '刪除業績（保留稽核）', `${order?.date || ''} ${order?.customerName || ''} ${order?.serviceName || ''} · NT$ ${this.formatNumber(order?.amount || 0)}`, { orderId: id });
            this.showToast('業績已刪除');
          }, { title: '刪除業績紀錄', subtitle: `${order?.date || ''} ${order?.customerName || ''} · 原資料保留供稽核`.trim(), tone: 'danger', confirmLabel: '刪除業績' });
        },
        toggleOrderDate(date) {
          this.collapsedOrderDates = {
            ...this.collapsedOrderDates,
            [date]: !this.collapsedOrderDates[date]
          };
        },
        toggleOrderEditor(id) {
          if (this.expandedOrderId === id) {
            this.clearOrderDraft(id);
            this.expandedOrderId = null;
            return;
          }
          const order = this.orders.find(item => item.id === id);
          if (order) this.beginOrderDraft(order);
          this.expandedOrderId = id;
        },

        // --- Tab 3: Expenses CRUD ---
        async addExpense() {
          if (this.formActionBusy.expense) return;
          this.formActionBusy.expense = true;
          await this.$nextTick();
          try {
          if (!this.assertDateUnlocked(this.newExpense.date)) return;
          const id = 'exp_' + Math.random().toString(36).substr(2, 9);
          const expense = {
            id,
            date: this.newExpense.date,
            category: this.newExpense.category,
            amount: Number(this.newExpense.amount) || 0,
            paymentMethod: MomoCore.normalizeExpensePaymentMethod(this.newExpense.paymentMethod),
            notes: this.newExpense.notes.trim()
          };
          this.expenses.push(expense);

          this.saveExpenses();
          this.recordOperation('expense_create', '新增支出', `${expense.date} ${expense.category} · ${expense.paymentMethod} NT$ ${this.formatNumber(expense.amount)}`, { expenseId: id });
          this.showToast('支出新增成功！');

          // Reset inputs except date
          this.newExpense.notes = '';
          this.newExpense.amount = null;
          this.showExpenseForm = false;
          } finally {
            this.formActionBusy.expense = false;
          }
        },
        deleteExpense(id) {
          const expense = this.expenses.find(e => e.id === id);
          if (!this.assertDateUnlocked(expense?.date)) return;
          this.showConfirm('確定要刪除這筆支出嗎？', async () => {
            if (!this.assertCloudDeleteReady()) return;
            const previous = MomoCore.cloneJsonValue(this.expenses);
            this.expenses = this.expenses.filter(e => e.id !== id);
            if (this.expandedExpenseId === id) this.expandedExpenseId = null;
            try {
              this.saveExpenses();
              if (this.cloudReady && this.authUser) {
                const deleted = await this.deleteCloudRecord('expenses', 'id', id);
                if (!deleted) throw new Error(this.cloudMessage || '雲端支出未刪除');
              }
            } catch (error) {
              this.expenses = previous;
              this.saveExpenses();
              throw new Error(`刪除支出失敗，原紀錄已回復：${error.message || error}`);
            }
            this.recordOperation('expense_delete', '刪除支出', `${expense?.date || ''} ${expense?.category || ''} · NT$ ${this.formatNumber(expense?.amount || 0)}`, { expenseId: id });
            this.showToast('支出已刪除');
          }, { title: '刪除支出紀錄', subtitle: `${expense?.date || ''} ${expense?.category || ''}`.trim(), tone: 'danger', confirmLabel: '刪除支出' });
        },
        toggleExpenseDate(date) {
          this.collapsedExpenseDates = {
            ...this.collapsedExpenseDates,
            [date]: !this.collapsedExpenseDates[date]
          };
        },
        toggleExpenseEditor(id) {
          if (this.expandedExpenseId === id) {
            this.clearExpenseDraft(id);
            this.expandedExpenseId = null;
            return;
          }
          const expense = this.expenses.find(item => item.id === id);
          if (expense) this.beginExpenseDraft(expense);
          this.expandedExpenseId = id;
        },

        // --- Tab 4: Inventory CRUD ---
        async addInventoryItem() {
          if (this.formActionBusy.inventory) return;
          this.formActionBusy.inventory = true;
          await this.$nextTick();
          try {
          const id = 'inv_' + Math.random().toString(36).substr(2, 9);
          this.inventory.push({
            id,
            name: this.newInventory.name.trim(),
            stock: Number(this.newInventory.stock) || 0,
            minStock: Math.max(1, Math.round(Number(this.newInventory.minStock) || 3)),
            notes: this.newInventory.notes.trim()
          });

          this.saveInventory();
          this.showToast('商品已建檔');

          this.newInventory.name = '';
          this.newInventory.stock = null;
          this.newInventory.minStock = 3;
          this.newInventory.notes = '';
          this.showInventoryForm = false;
          } finally {
            this.formActionBusy.inventory = false;
          }
        },
        async adjustStock(item, diff) {
          this.clearInventoryDraft(item?.id);
          const previousStock = Number(item.stock) || 0;
          item.stock = Math.max(0, previousStock + diff);
          localStorage.setItem('momo_inventory', JSON.stringify(this.inventory));
          if (!this.cloudReady || !this.authUser) {
            this.saveInventory();
            return;
          }
          try {
            const result = await this.cloudRequest('rpc/adjust_inventory_stock', {
              method: 'POST',
              body: { p_item_id: item.id, p_delta: diff }
            });
            const row = Array.isArray(result) ? result[0] : result;
            if (!row?.id) throw new Error('庫存更新未回傳資料');
            item.stock = Number(row.stock) || 0;
            item.version = Number(row.version) || item.version || 1;
            this.setCloudBaselineRow('inventory', row);
            localStorage.setItem('momo_inventory', JSON.stringify(this.inventory));
          } catch (error) {
            item.stock = previousStock;
            localStorage.setItem('momo_inventory', JSON.stringify(this.inventory));
            this.showToast(`庫存更新失敗：${error.message}`, 'error', 7000);
          }
        },
        setInventoryStock(item, targetStock) {
          if (!item?.id) return;
          const target = Math.max(0, Math.round(Number(targetStock) || 0));
          const current = Math.max(0, Math.round(Number(item.stock) || 0));
          const diff = target - current;
          if (diff === 0) {
            this.showToast('庫存數量未變更', 'info');
            return;
          }
          this.adjustStock(item, diff);
        },
        refillInventoryToSafety(item) {
          this.setInventoryStock(item, this.inventorySafetyStock(item));
        },
        markInventoryOut(item) {
          this.setInventoryStock(item, 0);
        },
        toggleInventoryEditor(id) {
          if (this.expandedInventoryId === id) {
            this.clearInventoryDraft(id);
            this.expandedInventoryId = null;
            return;
          }
          const item = this.inventory.find(entry => entry.id === id);
          if (item) this.beginInventoryDraft(item);
          this.expandedInventoryId = id;
        },
        getInventoryStatus(item) {
          const stock = Number(item.stock) || 0;
          if (stock === 0) return { key: 'out', label: '缺貨' };
          if (this.isInventoryLow(item)) return { key: 'low', label: '低庫存' };
          return { key: 'ok', label: '庫存正常' };
        },
        deleteInventoryItem(id) {
          this.showConfirm('確定要刪除此庫存品項嗎？', async () => {
            if (!this.assertCloudDeleteReady()) return;
            const previous = MomoCore.cloneJsonValue(this.inventory);
            this.inventory = this.inventory.filter(i => i.id !== id);
            if (this.expandedInventoryId === id) this.expandedInventoryId = null;
            try {
              this.saveInventory();
              if (this.cloudReady && this.authUser) {
                const deleted = await this.deleteCloudRecord('inventory', 'id', id);
                if (!deleted) throw new Error(this.cloudMessage || '雲端庫存未刪除');
              }
            } catch (error) {
              this.inventory = previous;
              this.saveInventory();
              throw new Error(`刪除庫存失敗，原品項已回復：${error.message || error}`);
            }
            this.showToast('商品已從庫存移除');
          }, { title: '刪除庫存品項', subtitle: '刪除後不再顯示於庫存清單', tone: 'danger', confirmLabel: '刪除品項' });
        },

        // --- Tab 5: CRM Notes Saving ---
        saveNotes() {
          // Debounced save to prevent lag while typing
          if (this.crmNotesTimer) {
            clearTimeout(this.crmNotesTimer);
          }
          this.crmNotesTimer = setTimeout(() => {
            try {
              this.writeLocalStorageAtomically([['momo_crmNotes', JSON.stringify(this.crmNotes)]]);
              this.queueCloudSync();
            } catch (error) {
              this.showToast(`CRM 備註儲存失敗：${error.message || error}`, 'error', 8000);
            } finally {
              this.crmNotesTimer = null;
            }
          }, 1000); // 1-second debounce
        },

        crmCustomerStatusTone(customer = {}) {
          const group = String(customer.returnGroup || '');
          if (Number(customer.prepaidBalance) < 0 || group === 'dormant') return 'is-danger';
          if (customer.prepaidLow || ['inactive', 'overdue'].includes(group)) return 'is-warn';
          if (['upcoming', 'prepaidDormant'].includes(group)) return 'is-info';
          if (group === 'stable') return 'is-ok';
          return 'is-neutral';
        },
        statusToneClasses(tone, type = 'pill') {
          const toneMap = {
            ok: 'ok',
            good: 'ok',
            info: 'info',
            warn: 'warn',
            warning: 'warn',
            error: 'danger',
            risk: 'danger',
            danger: 'danger',
            neutral: 'neutral'
          };
          const status = toneMap[tone] || 'neutral';
          return `${type === 'dot' ? 'momo-status-dot' : 'momo-status-badge'} momo-status-tone is-${status}`;
        },
        buildDataSafetyReport() {
          const issues = [];
          const addIssue = (severity, code, message) => issues.push({ severity, code, message });
          const localDataCount = this.localDataCount;
          const storageBytes = (() => {
            try { return new Blob(Object.values(localStorage)).size; }
            catch (error) { return 0; }
          })();
          const integrity = this.runIntegrityCheck(false);

          if (!this.hasMeaningfulLocalData()) {
            addIssue('warning', 'no_local_data', '目前沒有可用的本機業務資料；若不是新裝置，請先重新載入雲端或匯入備份。');
          }
          if (this.storageRecoveryBlocked) addIssue('error', 'storage_recovery_blocked', '偵測到未完成的本機寫入回復；雲端與 Calendar 已暫停，請使用還原前保護快照。');
          if (integrity.status === 'error') addIssue('error', 'integrity_error', `完整性檢查有 ${integrity.errorCount} 個錯誤。`);
          if (integrity.status === 'warning') addIssue('warning', 'integrity_warning', `完整性檢查有 ${integrity.warningCount} 個提醒。`);
          if (this.backupStatus === 'error') addIssue('error', 'backup_error', '最近一次雲端備份失敗，請重新建立備份。');
          else if (this.backupReminder.due) addIssue('warning', 'backup_due', this.backupReminder.message);
          (this.cloudBackupHealth.issues || []).forEach(issue => addIssue(issue.severity, issue.code || issue.type, issue.message));
          if (this.cloudStatus === 'conflict' || this.cloudConflict) addIssue('error', 'cloud_conflict', '雲端有版本衝突，請先選擇保留雲端或保留本機。');
          if (this.cloudStatus === 'error') addIssue('error', 'cloud_error', this.cloudMessage || '雲端同步狀態異常。');
          if (this.cloudRestorePending) addIssue('warning', 'cloud_restore_pending', '本機還原版本正在受保護，雲端同步已暫停；請先下載 JSON 或明確載回雲端。');
          if (this.cloudPendingWrite) addIssue('warning', 'cloud_pending_write', '本機有尚未完成的雲端同步；重開 App 時不會自動用雲端覆蓋。');
          if (this.cloudMigrationNeeded) addIssue('warning', 'cloud_migration', '本機資料尚未完成首次搬移到 Supabase。');
          if (this.cloudSyncPending || this.cloudSyncInFlight) addIssue('warning', 'cloud_pending', '有本機修改正在等待雲端同步。');
          try {
            if (this.hasLocalVersionedChanges()) addIssue('warning', 'local_version_changes', '偵測到本機資料與雲端基準不同，建議同步完成後再關閉 App。');
          } catch (error) {
            // Baseline may not be ready yet; skip this optional check.
          }
          if (this.updateAvailable) addIssue('warning', 'pwa_update_available', '已有新版可套用，建議更新後再繼續使用。');
          if (storageBytes > 4 * 1024 * 1024) addIssue('warning', 'storage_large', '本機儲存空間已接近上限，建議先匯出 JSON 備份。');

          const errorCount = issues.filter(issue => issue.severity === 'error').length;
          const warningCount = issues.filter(issue => issue.severity === 'warning').length;
          return {
            status: errorCount ? 'error' : warningCount ? 'warning' : 'ok',
            errorCount,
            warningCount,
            checkedAt: new Date().toISOString(),
            localDataCount,
            storageBytes,
            issues: issues.slice(0, 20)
          };
        },
        runDataSafetyCheck(showResult = true) {
          this.safetyChecking = true;
          try {
            const report = this.buildDataSafetyReport();
            this.safetyReport = report;
            try { localStorage.setItem('momo_safety_report', JSON.stringify(report)); } catch (_) {}
            if (showResult) {
              const firstIssue = report.issues?.[0]?.message;
              this.showToast(
                report.status === 'ok'
                  ? '資料安全檢查通過'
                  : `資料安全檢查：${report.errorCount} 錯誤、${report.warningCount} 提醒${firstIssue ? `｜${firstIssue}` : ''}`,
                report.status === 'ok' ? 'success' : 'error',
                9000
              );
            }
            return report;
          } finally {
            this.safetyChecking = false;
          }
        },
        async runSystemStatusCheck(showResult = true) {
          if (this.safetyChecking || this.pwaCheckingUpdate) return this.safetyReport;
          this.safetyChecking = true;
          try {
            await this.checkPwaUpdate(false);
            if (this.cloudReady && this.authUser && this.cloudBackupStatus !== 'loading' && this.cloudBackupStatus !== 'restoring') {
              await this.fetchCloudBackupList({ silent: true, refreshSafety: false });
            }
            const report = this.buildDataSafetyReport();
            this.safetyReport = report;
            localStorage.setItem('momo_safety_report', JSON.stringify(report));
            if (showResult) {
              const firstIssue = report.issues?.[0]?.message;
              this.showToast(
                report.status === 'ok'
                  ? '系統狀態檢查完成：目前正常'
                  : `系統狀態檢查：${report.errorCount} 錯誤、${report.warningCount} 提醒${firstIssue ? `｜${firstIssue}` : ''}`,
                report.status === 'ok' ? 'success' : 'error',
                9000
              );
            }
            return report;
          } finally {
            this.safetyChecking = false;
          }
        },
        buildBackupData() {
          return MomoCore.cloneJsonValue({
            schemaVersion: this.dataSchemaVersion,
            createdAt: new Date().toISOString(),
            momo_orders: this.orders,
            momo_expenses: this.expenses,
            momo_inventory: this.inventory,
            momo_customers: this.customers,
            momo_prepaidLedger: this.prepaidLedger,
            momo_crmNotes: this.crmNotes,
            momo_crmFormulas: this.crmFormulas,
            momo_closeoutRecords: this.closeoutRecords,
            momo_servicesConfig: this.servicesConfig,
            momo_servicesConfigUpdatedAt: localStorage.getItem('momo_servicesConfigUpdatedAt') || null,
            momo_operationLogs: this.operationLogs
          });
        },
        replaceBusinessStateFromBackup(payload = {}, servicesIncluded = true) {
          this.orders = MomoCore.cloneJsonValue(payload.momo_orders || []);
          this.expenses = MomoCore.cloneJsonValue(payload.momo_expenses || []).map(expense => ({
            ...expense,
            paymentMethod: MomoCore.normalizeExpensePaymentMethod(expense?.paymentMethod)
          }));
          this.inventory = MomoCore.cloneJsonValue(payload.momo_inventory || []);
          this.customers = MomoCore.cloneJsonValue(payload.momo_customers || []);
          this.prepaidLedger = MomoCore.cloneJsonValue(payload.momo_prepaidLedger || []);
          this.crmNotes = MomoCore.cloneJsonValue(payload.momo_crmNotes || {});
          this.crmFormulas = MomoCore.cloneJsonValue(payload.momo_crmFormulas || {});
          const restoredCloseouts = MomoCore.cloneJsonValue(payload.momo_closeoutRecords || {});
          this.closeoutRecords = Object.fromEntries(Object.entries(restoredCloseouts).map(([date, record]) => {
            const cash = Math.round(Number(record?.cash) || 0);
            const cashPrepaidIn = Math.round(Number(record?.cashPrepaidIn) || 0);
            return [date, {
              ...record,
              openingCash: Math.max(0, Math.round(Number(record?.openingCash) || 0)),
              cashExpenses: Math.max(0, Math.round(Number(record?.cashExpenses) || 0)),
              actualCashIn: record?.actualCashIn === undefined || record?.actualCashIn === null
                ? cash + cashPrepaidIn
                : Math.round(Number(record.actualCashIn) || 0)
            }];
          }));
          this.operationLogs = MomoCore.cloneJsonValue(payload.momo_operationLogs || []);
          if (servicesIncluded) this.servicesConfig = MomoCore.cloneJsonValue(payload.momo_servicesConfig || []);
          this.migrateLegacyCalendarActualDurations(payload.schemaVersion || 1);
          this.migrateCustomerIdentity();
          this.reconcilePrepaidLedger();
        },
        shouldPauseCloudAfterRestore() {
          return Boolean(this.cloudReady || this.cloudLastSync || localStorage.getItem('momo_cloud_last_sync'));
        },
        markCloudRestorePending(source = 'backup_restore') {
          if (!this.shouldPauseCloudAfterRestore()) return false;
          const pending = {
            at: new Date().toISOString(),
            source,
            ownerId: this.authUser?.id || null
          };
          localStorage.setItem('momo_cloud_restore_pending', JSON.stringify(pending));
          this.cloudRestorePending = pending;
          this.cloudReady = false;
          this.cloudMigrationNeeded = false;
          this.cloudSyncPending = false;
          if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
          this.cloudSyncTimer = null;
          if (this.cloudVersionPollTimer) clearInterval(this.cloudVersionPollTimer);
          this.cloudVersionPollTimer = null;
          this.cloudStatus = 'restore_pending';
          this.cloudMessage = '本機還原版本已保護，雲端同步暫停；可先下載 JSON，或重新載入雲端放棄本機還原。';
          return true;
        },
        clearCloudRestorePending() {
          localStorage.removeItem('momo_cloud_restore_pending');
          this.cloudRestorePending = null;
        },
        applyBackupData(data, options = {}) {
          const validation = MomoCore.validateAndNormalizeBackupPayload(data, {
            currentSchemaVersion: this.dataSchemaVersion
          });
          if (!validation.ok) throw new Error(validation.errors.join('；'));

          const rollback = this.buildBackupData();
          try {
            this.replaceBusinessStateFromBackup(validation.data, validation.servicesIncluded);
            const integrity = this.runIntegrityCheck(false);
            if (integrity.errorCount > 0) {
              throw new Error(`備份完整性檢查未通過（${integrity.errorCount} 個錯誤）`);
            }
            const servicesUpdatedAt = validation.servicesIncluded
              ? (validation.data.momo_servicesConfigUpdatedAt || validation.data.createdAt || new Date().toISOString())
              : localStorage.getItem('momo_servicesConfigUpdatedAt');
            this.persistCurrentStateStrict(servicesUpdatedAt);
            this.markCloudRestorePending(options.source || 'backup_restore');
            this.runDataSafetyCheck(false);
            return validation.servicesIncluded;
          } catch (error) {
            try {
              this.replaceBusinessStateFromBackup(rollback, true);
              this.persistCurrentStateStrict(rollback.momo_servicesConfigUpdatedAt || null);
            } catch (rollbackError) {
              console.error('Backup rollback failed:', rollbackError);
              throw new Error(`${error.message || error}；回復原資料也失敗：${rollbackError.message || rollbackError}`);
            }
            throw error;
          }
        },
        runIntegrityCheck(showResult = true) {
          const issues = [];
          const addIssue = (severity, code, message, extra = {}) => {
            if (issues.length < 100) issues.push({ severity, code, message, ...extra });
          };
          const validDate = MomoCore.isValidISODate;
          const checkDuplicateIds = (label, rows) => {
            const seen = new Set();
            (rows || []).forEach(row => {
              if (!row?.id) addIssue('error', `${label}_missing_id`, `${label}有缺少 ID 的資料`);
              else if (seen.has(row.id)) addIssue('error', `${label}_duplicate_id`, `${label}出現重複 ID：${row.id}`);
              else seen.add(row.id);
            });
          };

          checkDuplicateIds('顧客', this.customers);
          checkDuplicateIds('業績', this.orders);
          checkDuplicateIds('支出', this.expenses);
          checkDuplicateIds('庫存', this.inventory);
          checkDuplicateIds('儲值帳本', this.prepaidLedger);

          const customerIds = new Set(this.customers.map(customer => customer.id).filter(Boolean));
          const sourceEvents = new Set();
          const externalOrderIds = new Set();
          const reversedEntryIds = new Set();
          this.customers.forEach(customer => {
            if (!String(customer.name || '').trim()) addIssue('error', 'customer_missing_name', `顧客 ${customer.id || '未知'} 缺少姓名`, { tab: 'crm', customerId: customer.id });
            if (customer.mergedIntoCustomerId && !customerIds.has(customer.mergedIntoCustomerId)) addIssue('error', 'customer_merge_target_missing', `封存顧客 ${customer.id || '未知'} 的合併目標不存在`, { tab: 'crm', customerId: customer.id });
            if (customer.mergedIntoCustomerId && !customer.archivedAt) addIssue('warning', 'customer_merge_not_archived', `顧客 ${customer.id || '未知'} 已合併但尚未標記封存`, { tab: 'crm', customerId: customer.id });
          });
          this.orders.forEach(order => {
            const target = { tab: 'orders', orderId: order.id, customerId: order.customerId };
            if (!customerIds.has(order.customerId)) addIssue('error', 'order_orphan_customer', `業績 ${order.id || '未知'} 找不到對應顧客`, target);
            if (!validDate(order.date)) addIssue('error', 'order_invalid_date', `業績 ${order.id || '未知'} 日期格式錯誤`, target);
            if (!MomoCore.isFiniteNumericInput(order.amount)
              || (!this.isCorrectionSlip(order) && Number(order.amount) < 0)
              || (this.isCorrectionSlip(order) && Number(order.amount) === 0)) {
              addIssue('error', 'order_invalid_amount', `業績 ${order.id || '未知'} 金額錯誤`, target);
            }
            if (!['現金', '轉帳', '儲值扣款', '現金＋儲值扣款', '儲值進帳'].includes(order.paymentMethod)) addIssue('error', 'order_invalid_payment', `業績 ${order.id || '未知'} 付款方式錯誤`, target);
            if (order.paymentMethod === '儲值進帳' && !['現金', '轉帳'].includes(order.topupChannel)) addIssue('error', 'order_invalid_topup_channel', `業績 ${order.id || '未知'} 儲值收款方式錯誤`, target);
            if (!this.isCorrectionSlip(order) && order.paymentMethod === '現金＋儲值扣款' && !(Number(order.cashAmount) > 0 && Number(order.cashAmount) < Number(order.amount))) {
              addIssue('error', 'order_invalid_mixed_payment', `業績 ${order.id || '未知'} 混合付款金額錯誤`, target);
            }
            if (order.sourceEventId) {
              if (sourceEvents.has(order.sourceEventId)) addIssue('error', 'duplicate_calendar_event', `Google 行事曆事件重複：${order.sourceEventId}`, target);
              sourceEvents.add(order.sourceEventId);
            }
            if (order.orderId && order.source === 'google_calendar' && this.isOrderActive(order)) {
              const accountingKey = String(order.orderId).trim().toLocaleLowerCase('zh-TW');
              if (externalOrderIds.has(accountingKey)) addIssue('error', 'duplicate_calendar_order_id', `Google 行事曆 Order ID 重複：${order.orderId}`, target);
              externalOrderIds.add(accountingKey);
            }
          });
          this.expenses.forEach(expense => {
            const target = { tab: 'expenses', expenseId: expense.id };
            if (!validDate(expense.date)) addIssue('error', 'expense_invalid_date', `支出 ${expense.id || '未知'} 日期格式錯誤`, target);
            if (!MomoCore.isFiniteNumericInput(expense.amount) || Number(expense.amount) < 0) addIssue('error', 'expense_invalid_amount', `支出 ${expense.id || '未知'} 金額錯誤`, target);
            if (!Object.values(MomoCore.EXPENSE_PAYMENT).includes(expense.paymentMethod)) addIssue('error', 'expense_invalid_payment', `支出 ${expense.id || '未知'} 付款來源錯誤`, target);
          });
          this.inventory.forEach(item => {
            if (!String(item.name || '').trim()) addIssue('error', 'inventory_missing_name', `庫存 ${item.id || '未知'} 缺少品名`);
            if (!MomoCore.isFiniteNumericInput(item.stock) || !Number.isInteger(Number(item.stock)) || Number(item.stock) < 0) addIssue('error', 'inventory_invalid_stock', `庫存「${item.name || item.id}」數量錯誤`);
          });
          this.prepaidLedger.forEach(entry => {
            const target = { tab: 'crm', customerId: entry.customerId };
            if (!customerIds.has(entry.customerId)) addIssue('error', 'ledger_orphan_customer', `儲值帳本 ${entry.id || '未知'} 找不到對應顧客`, target);
            if (!validDate(entry.date)) addIssue('error', 'ledger_invalid_date', `儲值帳本 ${entry.id || '未知'} 日期格式錯誤`, target);
            if (!MomoCore.isFiniteNumericInput(entry.signedAmount) || Number(entry.signedAmount) === 0) addIssue('error', 'ledger_invalid_amount', `儲值帳本 ${entry.id || '未知'} 金額錯誤`, target);
            if (entry.reversalOfEntryId) {
              if (reversedEntryIds.has(entry.reversalOfEntryId)) addIssue('error', 'ledger_duplicate_reversal', `儲值帳本分錄 ${entry.reversalOfEntryId} 被重複沖銷`, target);
              reversedEntryIds.add(entry.reversalOfEntryId);
            }
          });
          Object.keys(this.crmNotes || {}).forEach(customerId => {
            if (!customerIds.has(customerId)) addIssue('warning', 'orphan_crm_note', `CRM 備註找不到顧客：${customerId}`, { tab: 'crm', customerId });
          });
          Object.entries(this.prepaidTotalsByCustomer || {}).forEach(([customerId, totals]) => {
            if (Number(totals.balance) < 0) addIssue('warning', 'negative_prepaid_balance', `${this.customerMap[customerId]?.name || customerId} 儲值餘額為負數`, { tab: 'crm', customerId });
          });
          this.collectOperationalIssues().forEach(issue => {
            const exists = issues.some(existing => existing.code === issue.code && existing.message === issue.message);
            if (!exists) addIssue(issue.severity, issue.code, issue.message, issue);
          });

          const errorCount = issues.filter(issue => issue.severity === 'error').length;
          const warningCount = issues.filter(issue => issue.severity === 'warning').length;
          const report = {
            status: errorCount ? 'error' : warningCount ? 'warning' : 'ok',
            errorCount,
            warningCount,
            checkedAt: new Date().toISOString(),
            counts: {
              customers: this.customers.length,
              orders: this.orders.length,
              prepaidLedger: this.prepaidLedger.length,
              expenses: this.expenses.length,
              inventory: this.inventory.length
            },
            issues
          };
          this.integrityReport = report;
          try { localStorage.setItem('momo_integrity_report', JSON.stringify(report)); } catch (_) {}
          if (showResult) {
            const preview = issues.slice(0, 2).map(issue => issue.message).join('；');
            this.showToast(
              report.status === 'ok' ? '資料完整性檢查通過' : `完整性檢查：${errorCount} 錯誤、${warningCount} 提醒${preview ? `｜${preview}` : ''}`,
              report.status === 'ok' ? 'success' : 'error',
              9000
            );
          }
          return report;
        },
        cloudBackupRetentionDays() {
          return 14;
        },
        cloudBackupAgeDays(backupDate, today = new Date().toLocaleDateString('sv-SE')) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(String(backupDate || ''))) return null;
          const start = Date.parse(`${backupDate}T00:00:00`);
          const end = Date.parse(`${today}T00:00:00`);
          if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
          return Math.floor((end - start) / 86400000);
        },
        cloudBackupMonthKey(backupDate) {
          return /^\d{4}-\d{2}-\d{2}$/.test(String(backupDate || '')) ? String(backupDate).slice(0, 7) : '';
        },
        async fetchCloudBackupMetadata(limit = 365) {
          return this.cloudRequest('data_backups', {
            query: [
              'select=id,backup_date,schema_version,record_counts,integrity,created_at',
              `owner_id=eq.${encodeURIComponent(this.authUser.id)}`,
              'order=backup_date.desc,created_at.desc',
              `limit=${Math.max(1, Math.min(1000, Number(limit) || 365))}`
            ].join('&')
          });
        },
        async pruneCloudBackups({ silent = true } = {}) {
          if (!this.authUser || !this.authSession?.access_token) return { deleted: 0, kept: this.cloudBackupRows.length };
          const retentionDays = this.cloudBackupRetentionDays();
          const today = new Date().toLocaleDateString('sv-SE');
          try {
            const rows = await this.fetchCloudBackupMetadata(365);
            const normalized = (Array.isArray(rows) ? rows : [])
              .map(row => this.normalizeCloudBackupRow(row))
              .filter(row => row.id);
            const keepIds = new Set();
            const monthlyLatest = new Map();

            normalized.forEach(row => {
              const age = this.cloudBackupAgeDays(row.backupDate, today);
              if (age === null || age < 0 || age < retentionDays) {
                keepIds.add(row.id);
                return;
              }
              const monthKey = this.cloudBackupMonthKey(row.backupDate);
              if (!monthKey) {
                keepIds.add(row.id);
                return;
              }
              const current = monthlyLatest.get(monthKey);
              if (!current
                || String(row.backupDate).localeCompare(String(current.backupDate)) > 0
                || (row.backupDate === current.backupDate && String(row.createdAt || '').localeCompare(String(current.createdAt || '')) > 0)) {
                monthlyLatest.set(monthKey, row);
              }
            });
            monthlyLatest.forEach(row => keepIds.add(row.id));

            const deleteRows = normalized.filter(row => !keepIds.has(row.id));
            for (let index = 0; index < deleteRows.length; index += 25) {
              const ids = deleteRows.slice(index, index + 25).map(row => encodeURIComponent(row.id)).join(',');
              if (!ids) continue;
              await this.cloudRequest('data_backups', {
                method: 'DELETE',
                query: `owner_id=eq.${encodeURIComponent(this.authUser.id)}&id=in.(${ids})`,
                prefer: 'return=minimal'
              });
            }

            this.cloudBackupRetentionMessage = deleteRows.length
              ? `保留近 ${retentionDays} 天與每月最後一份，已清理 ${deleteRows.length} 份`
              : `保留近 ${retentionDays} 天與每月最後一份`;
            if (!silent && deleteRows.length) this.showToast(`已清理 ${deleteRows.length} 份舊雲端備份`);
            return { deleted: deleteRows.length, kept: normalized.length - deleteRows.length };
          } catch (error) {
            console.warn('Cloud backup retention prune failed:', error);
            this.cloudBackupRetentionMessage = '保留策略檢查失敗';
            if (!silent) this.showToast(`雲端備份保留策略失敗：${error.message}`, 'error', 8000);
            return { deleted: 0, kept: this.cloudBackupRows.length, error };
          }
        },
        cleanupStartupBackupMarkers(today = new Date().toLocaleDateString('sv-SE')) {
          if (!this.authUser?.id) return;
          const prefix = `momo_cloud_startup_backup_${this.authUser.id}_`;
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix) && key !== `${prefix}${today}`) localStorage.removeItem(key);
          });
        },
        async runStartupCloudBackup() {
          if (!this.cloudReady || !this.authUser || !this.authSession?.access_token) return false;
          const today = new Date().toLocaleDateString('sv-SE');
          const markerKey = `momo_cloud_startup_backup_${this.authUser.id}_${today}`;
          this.cleanupStartupBackupMarkers(today);
          if (localStorage.getItem(markerKey) === '1' && this.lastCloudBackupAt && new Date(this.lastCloudBackupAt).toLocaleDateString('sv-SE') === today) {
            if (this.cloudBackupStatus === 'idle') await this.fetchCloudBackupList({ silent: true });
            return true;
          }
          const ok = await this.createAutomaticBackup({ silent: true });
          if (ok) localStorage.setItem(markerKey, '1');
          return ok;
        },
        async createAutomaticBackup({ force = false, silent = true } = {}) {
          if (!this.cloudReady || !this.authUser || !this.authSession?.access_token) return false;
          const today = new Date().toLocaleDateString('sv-SE');
          const previousDate = this.lastCloudBackupAt ? new Date(this.lastCloudBackupAt).toLocaleDateString('sv-SE') : '';
          if (!force && previousDate === today) {
            if (this.cloudBackupStatus === 'idle') this.fetchCloudBackupList({ silent: true });
            return true;
          }

          this.backupStatus = 'saving';
          try {
            const payload = this.buildBackupData();
            const integrity = this.runIntegrityCheck(false);
            const createdAt = new Date().toISOString();
            const createdRows = await this.cloudRequest('data_backups', {
              method: 'POST',
              body: [{
                owner_id: this.authUser.id,
                backup_date: today,
                schema_version: this.dataSchemaVersion,
                payload,
                record_counts: integrity.counts,
                integrity,
                created_at: createdAt
              }],
              prefer: 'return=representation'
            });
            if (!Array.isArray(createdRows) || !createdRows[0]?.id || !createdRows[0]?.payload) {
              throw new Error('雲端未回傳可驗證的備份內容');
            }
            await this.pruneCloudBackups({ silent: true });
            this.lastBackupAt = createdAt;
            this.lastCloudBackupAt = createdAt;
            localStorage.setItem('momo_last_backup_at', createdAt);
            localStorage.setItem('momo_last_cloud_backup_at', createdAt);
            this.backupStatus = 'ready';
            this.runDataSafetyCheck(false);
            try {
              await this.fetchCloudBackupList({ silent: true, refreshSafety: false });
            } catch (error) {
              console.warn('Cloud backup list refresh skipped:', error);
            }
            if (!silent) this.showToast(`雲端備份已建立，${this.cloudBackupRetentionMessage || '保留近 14 天與每月最後一份'}`);
            return true;
          } catch (error) {
            console.error('Automatic backup failed:', error);
            this.backupStatus = 'error';
            this.recordCloudSyncFailure('建立雲端備份', error);
            if (!silent) this.showToast(`雲端備份失敗：${error.message}`, 'error', 8000);
            return false;
          }
        },
        async handleBackupReminderAction() {
          if (this.cloudReady && this.authUser) {
            await this.createAutomaticBackup({ force: true, silent: false });
            return;
          }
          this.exportBackup();
        },

        // --- Data Tools Actions ---
        exportBackup() {
          const data = this.buildBackupData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const dateStr = new Date().toLocaleDateString('sv-SE');
          link.href = url;
          link.download = `MOMO營運總部_備份_${dateStr}.json`;
          link.click();
          URL.revokeObjectURL(url);
          const createdAt = new Date().toISOString();
          this.lastBackupAt = createdAt;
          localStorage.setItem('momo_last_backup_at', createdAt);
          this.backupStatus = 'ready';
          this.runDataSafetyCheck(false);
          this.recordOperation('backup_export', '匯出正式備份', link.download);
          this.showToast('備份 JSON 檔案已下載');
          this.showDataTools = false;
        },
        importBackup(event) {
          const file = event.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = JSON.parse(e.target.result);
              const validation = MomoCore.validateAndNormalizeBackupPayload(data, { currentSchemaVersion: this.dataSchemaVersion });
              if (!validation.ok) throw new Error(validation.errors.join('；'));
              const protection = this.createLocalBackupSnapshot('pre_restore', { silent: true, force: true });
              if (!protection) throw new Error('無法建立還原前保護快照，已取消匯入');
              const servicesIncluded = this.applyBackupData(data, { source: 'json_import_restore' });
              this.recordOperation('backup_import', '匯入備份還原', `訂單 ${this.orders.length} 筆、顧客 ${this.customers.length} 位`);
              const pendingMessage = this.cloudRestorePending
                ? 'JSON 備份已還原；為避免雲端舊資料回灌，同步已暫停'
                : null;
              this.showToast(
                pendingMessage || (servicesIncluded ? '備份還原成功，系統已更新資料' : '備份還原完成，但此備份不含服務定價設定，已保留現有定價'),
                pendingMessage || !servicesIncluded ? 'warning' : 'success',
                pendingMessage ? 8000 : (servicesIncluded ? 3000 : 6000)
              );
            } catch (err) {
              this.showToast(`備份還原失敗：${err.message || '請上傳正確的 MOMO 備份 JSON 檔案'}`, 'error', 8000);
            }
          };
          reader.readAsText(file);
          this.showDataTools = false;
          // reset input
          event.target.value = '';
        },
        exportCSV() {
          const headers = ['日期', '顧客姓名', '性別', '服務項目', '服務分類', '金額(NT$)', '付款方式', '儲值收款方式', '現金金額(NT$)', '儲值扣款(NT$)', '預估分鐘', '預估每小時產值', '實際分鐘', '實際每小時產值'];
          const rows = this.filteredOrders.map(o => {
            const standardMinutes = this.getServiceMinutes(o.serviceName);
            const actualMinutes = this.getOrderActualMinutes(o);
            const amount = Number(o.amount) || 0;
            return [
              o.date,
              o.customerName,
              o.gender,
              o.serviceName,
              o.category || this.classifyCategory(o.serviceName),
              o.amount,
              o.paymentMethod,
              o.paymentMethod === '儲值進帳' ? this.getTopupChannel(o) : '',
              o.paymentMethod === '現金＋儲值扣款' ? this.getMixedCashAmount(o) : (o.paymentMethod === '現金' ? amount : 0),
              o.paymentMethod === '現金＋儲值扣款' ? this.getMixedPrepaidAmount(o) : (o.paymentMethod === '儲值扣款' ? amount : 0),
              standardMinutes || '',
              standardMinutes ? Math.round(amount / (standardMinutes / 60)) : '',
              actualMinutes || '',
              actualMinutes ? Math.round(amount / (actualMinutes / 60)) : ''
            ];
          });
          const dateStr = this.selectedMonth === 'All'
            ? `${this.selectedYear}-全年度`
            : `${this.selectedYear}-${this.selectedMonth}`;
          this.downloadCSV(`MOMO業績明細_${dateStr}.csv`, headers, rows);
          this.showToast('業績 CSV 檔案已匯出');
          this.showDataTools = false;
        },
        exportCrmCSV() {
          const headers = ['顧客ID', '顧客姓名', '性別', '來訪次數', '累計消費', '平均客單', '最後來訪', '距今天數', '偏好服務', '儲值餘額', '回流狀態', '觀察層級', '觀察分數', '系統觀察原因', '近期客單趨勢', '到店間隔趨勢', '各服務週期', '價值分群', '建議週期(天)', '預估回流日', '染髮配方', '燙髮藥水', '髮況', '喜好', '注意事項'];
          const rows = this.crmList.map(c => {
            const f = this.crmFormulas[c.id] || {};
            const serviceSummary = c.serviceObservations.map(row => `${row.label}:${row.statusLabel}(上次${row.lastDate})`).join('；');
            return [c.id, c.name, c.gender, c.count, c.totalSpent, c.avgTicket, c.lastDate, c.daysSinceLastVisit, c.primaryService, c.prepaidBalance, c.returnLabel, c.observationLabel, c.observationScore, c.observationReasons.join('；'), c.spendTrend.label, c.visitPaceTrend.label, serviceSummary, c.valueTierLabel, c.revisitDays, c.returnDueDate, f.color || '', f.perm || '', f.hair || '', f.preference || '', f.caution || ''];
          });
          this.downloadCSV(`MOMO顧客CRM_${new Date().toLocaleDateString('sv-SE')}.csv`, headers, rows);
          this.showToast('CRM 顧客 CSV 已匯出');
          this.showDataTools = false;
        },
        exportExpensesCSV() {
          const headers = ['日期', '支出分類', '付款來源', '金額(NT$)', '備註'];
          const rows = this.filteredExpenses.map(e => [e.date, e.category, MomoCore.normalizeExpensePaymentMethod(e.paymentMethod), e.amount, e.notes || '']);
          this.downloadCSV(`MOMO支出明細_${this.selectedYear}-${this.selectedMonth}.csv`, headers, rows);
          this.showToast('支出明細 CSV 已匯出');
          this.showDataTools = false;
        },
        downloadCSV(filename, headers, rows) {
          const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(MomoCore.escapeCsvCell).join(',')).join('\r\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 0);
        },
        downloadSectionedCSV(filename, sections) {
          const lines = [];
          (sections || []).forEach((section, index) => {
            if (index > 0) lines.push([]);
            lines.push([section.title || '']);
            if (section.headers?.length) lines.push(section.headers);
            (section.rows || []).forEach(row => lines.push(row));
          });
          const csvContent = '\uFEFF' + lines.map(row => row.map(MomoCore.escapeCsvCell).join(',')).join('\r\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 0);
        },

        // Helper presentation functions
        formatNumber(val) {
          return Math.round(Number(val) || 0).toLocaleString();
        },
        formatBytes(bytes) {
          const value = Number(bytes) || 0;
          if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
          if (value >= 1024) return `${Math.round(value / 1024)} KB`;
          return `${Math.round(value)} B`;
        },
        isOrderActive(order) {
          return MomoCore.isOrderActive(order);
        },
        getMixedCashAmount(order) {
          return MomoCore.getMixedCashAmount(order);
        },
        getMixedPrepaidAmount(order) {
          return MomoCore.getMixedPrepaidAmount(order);
        },
        getTopupChannel(order) {
          return MomoCore.getTopupChannel(order);
        },
        getWeekday(dateStr) {
          const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
          const d = new Date(dateStr + 'T00:00:00');
          return days[d.getDay()];
        },
        ledgerKindLabel(kind) {
          return ({ topup: '儲值進帳', debit: '服務扣款', adjustment: '帳務調整', reversal: '沖銷' })[kind] || '帳務異動';
        },
        getRankBg(idx) {
          switch (idx) {
            case 0: return 'bg-gradient-to-tr from-amber-400 to-yellow-300';
            case 1: return 'bg-gradient-to-tr from-slate-400 to-slate-300';
            case 2: return 'bg-gradient-to-tr from-amber-700 to-amber-600';
            default: return 'bg-slate-300';
          }
        }
      }
    });
    momoApp.config.errorHandler = (error, instance, info) => {
      try {
        const reporter = typeof instance?.recordRuntimeAnomaly === 'function' ? instance : instance?.$root;
        reporter?.recordRuntimeAnomaly('error', 'error', String(error?.message || error || 'Vue 畫面錯誤'), {
          errorName: error?.name || null,
          stack: String(error?.stack || '').slice(0, 1200),
          vueInfo: String(info || '').slice(0, 240),
          cause: 'vue_render',
          causeLabel: 'Vue 畫面運算或元件事件',
          dedupeKey: `vue:${String(error?.message || error).slice(0, 80)}`
        }, 60000);
      } catch (_) {}
      console.error('Vue runtime error:', error, info);
    };
    const momoVm = momoApp.mount('#app');
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      window.__MOMO_QA_APP__ = momoVm;
    }
