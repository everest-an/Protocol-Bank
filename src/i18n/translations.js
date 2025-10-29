/**
 * 完整的多语言翻译资源
 * 
 * 支持的语言：
 * - en: English (英语)
 * - zh: Chinese Simplified (简体中文)
 * - es: Spanish (西班牙语)
 * - fr: French (法语)
 * - de: German (德语)
 * - ja: Japanese (日语)
 */

export const translations = {
  // ============================================================================
  // English (英语)
  // ============================================================================
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        payments: 'Payments',
        flowPayment: 'Flow Payment',
        flowPaymentStake: 'Flow Payment (Stake)',
        batchPayment: 'Batch Payment',
        scheduledPayment: 'Scheduled Payment',
        suppliers: 'Suppliers',
        analytics: 'Analytics',
        agentMarket: 'Agent Market',
        settings: 'Settings',
      },

      // Categories
      categories: {
        all: 'All',
        logistics: 'Logistics',
        consulting: 'Consulting Services',
        technical: 'Technical Services',
        cloud: 'Cloud Computing',
        design: 'Design Services',
        marketing: 'Marketing',
        materials: 'Raw Materials',
      },

      // Common
      common: {
        search: 'Search',
        searchPlaceholder: 'Search transactions...',
        connect: 'Connect Wallet',
        connecting: 'Connecting...',
        disconnect: 'Disconnect',
        loading: 'Loading...',
        refresh: 'Refresh',
        export: 'Export',
        save: 'Save',
        cancel: 'Cancel',
        submit: 'Submit',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        close: 'Close',
        next: 'Next',
        previous: 'Previous',
        finish: 'Finish',
        confirm: 'Confirm',
        back: 'Back',
        yes: 'Yes',
        no: 'No',
      },

      // Payment related
      payment: {
        totalPayments: 'Total Payments',
        totalAmount: 'Total Amount',
        suppliers: 'Suppliers',
        averagePayment: 'Average Payment',
        category: 'Category',
        amount: 'Amount',
        status: 'Status',
        txHash: 'TX Hash',
        date: 'Date',
        supplier: 'Supplier',
        purpose: 'Purpose',
        createPayment: 'Create Payment',
        paymentHistory: 'Payment History',
        transactions: 'transactions',
        pending: 'Pending',
        completed: 'Completed',
        failed: 'Failed',
      },

      // Flow Payment
      flowPayment: {
        title: 'Flow Payment Network',
        subtitle: 'Real-time payment network visualization on Sepolia',
        registerSupplier: 'Register Supplier',
        totalPayments: 'Total Payments',
        totalAmount: 'Total Amount',
        suppliers: 'Suppliers',
        averagePayment: 'Average Payment',
        paymentTransactions: 'Payment Transactions',
        transactions: 'transactions',
        dragToPan: 'Drag to pan',
        scrollToZoom: 'Scroll to zoom',
        clickNodes: 'Click nodes for details',
      },

      // Test Mode
      testMode: {
        enter: 'Test Mode',
        exit: 'Exit Test Mode',
        enabled: 'Test Mode Enabled',
        description: 'Currently displaying mock data with {{suppliers}} suppliers and {{payments}} payment records for demonstration purposes.',
        demoCase: 'Demo Case',
        simple: 'Simple (HQ → Suppliers)',
        twoTier: 'Two-Tier (HQ → Subsidiaries → Suppliers)',
        threeTier: 'Three-Tier (HQ → Regional → Branches → Suppliers)',
        complex: 'Complex (Multiple Companies)',
      },

      // ERC-8004 Agent
      agent: {
        title: 'Trustless Agents',
        subtitle: 'Decentralized AI Agent marketplace based on ERC-8004',
        register: 'Register Agent',
        myAgents: 'My Agents',
        allAgents: 'All Agents',
        agentId: 'Agent ID',
        agentName: 'Agent Name',
        description: 'Description',
        reputation: 'Reputation',
        reviews: 'reviews',
        noReviews: 'No reviews',
        validated: 'Validated',
        selectAgent: 'Select Payment Executor Agent',
        
        // Registration
        registration: {
          title: 'Register New Agent',
          step1: 'Basic Information',
          step2: 'Service Configuration',
          step3: 'Confirm Registration',
          step4: 'Success',
          
          name: 'Agent Name',
          namePlaceholder: 'e.g., Payment Executor Pro',
          description: 'Description',
          descriptionPlaceholder: 'Describe your agent\'s capabilities...',
          imageUrl: 'Image URL',
          imageUrlPlaceholder: 'https://...',
          agentType: 'Agent Type',
          
          supportedPayments: 'Supported Payment Types',
          scheduledPayments: 'Scheduled Payments',
          batchPayments: 'Batch Payments',
          flowPayments: 'Flow Payments',
          
          reviewInfo: 'Please review your agent information',
          registering: 'Registering...',
          uploadingToIPFS: 'Uploading to IPFS...',
          waitingConfirmation: 'Waiting for confirmation...',
          
          success: 'Agent registered successfully!',
          yourAgentId: 'Your Agent ID',
          transactionHash: 'Transaction Hash',
          ipfsUri: 'IPFS URI',
          viewOnExplorer: 'View on Explorer',
          backToMarket: 'Back to Market',
        },

        // Reputation
        reputation: {
          giveFeedback: 'Give Feedback',
          score: 'Score',
          comment: 'Comment',
          commentPlaceholder: 'Share your experience with this agent...',
          serviceType: 'Service Type',
          transactionHash: 'Transaction Hash',
          submit: 'Submit Feedback',
          submitting: 'Submitting...',
          success: 'Feedback submitted successfully!',
          
          averageScore: 'Average Score',
          totalReviews: 'Total Reviews',
          byTag: 'By Tag',
          payment: 'Payment',
          scheduled: 'Scheduled',
          batch: 'Batch',
          flow: 'Flow',
          success: 'Success',
          failure: 'Failure',
        },

        // Validation
        validation: {
          requestValidation: 'Request Validation',
          validator: 'Validator',
          evidence: 'Evidence',
          evidencePlaceholder: 'Provide evidence for validation...',
          request: 'Request',
          requesting: 'Requesting...',
          
          respond: 'Respond to Validation',
          validationScore: 'Validation Score',
          response: 'Response',
          responsePlaceholder: 'Provide your validation response...',
          submit: 'Submit Response',
          
          pending: 'Pending',
          completed: 'Completed',
          validationHistory: 'Validation History',
        },
      },

      // Scheduled Payments
      scheduledPayment: {
        title: 'Scheduled Payments',
        subtitle: 'Create automated payment flows with visual programming',
        flowBuilder: 'Flow Builder',
        flowList: 'Flow List',
        
        createFlow: 'Create Flow',
        deployFlow: 'Deploy Flow',
        deploying: 'Deploying...',
        deployed: 'Deployed',
        
        flowName: 'Flow Name',
        flowDescription: 'Description',
        status: 'Status',
        active: 'Active',
        paused: 'Paused',
        nextExecution: 'Next Execution',
        lastExecution: 'Last Execution',
        executedCount: 'Executed Count',
        
        selectExecutor: 'Select Executor Agent',
        noAgentSelected: 'No agent selected',
        agentSelected: 'Agent selected',
      },

      // Batch Payment
      batchPayment: {
        title: 'Batch Payment',
        subtitle: 'Process multiple payments at once',
        uploadCSV: 'Upload CSV',
        addManually: 'Add Manually',
        processPayments: 'Process Payments',
        processing: 'Processing...',
        
        recipient: 'Recipient',
        amount: 'Amount',
        token: 'Token',
        note: 'Note',
        
        totalRecipients: 'Total Recipients',
        totalAmount: 'Total Amount',
        estimatedGas: 'Estimated Gas',
      },

      // Analytics
      analytics: {
        title: 'Data Analytics',
        subtitle: 'Comprehensive payment analytics and insights',
        overview: 'Overview',
        trends: 'Trends',
        categories: 'Categories',
        suppliers: 'Suppliers',
        
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        thisYear: 'This Year',
        allTime: 'All Time',
        
        paymentVolume: 'Payment Volume',
        transactionCount: 'Transaction Count',
        averageTransaction: 'Average Transaction',
        topSuppliers: 'Top Suppliers',
        topCategories: 'Top Categories',
      },

      // Suppliers
      suppliers: {
        title: 'Suppliers',
        subtitle: 'Manage your supplier network',
        addSupplier: 'Add Supplier',
        supplierName: 'Supplier Name',
        address: 'Address',
        category: 'Category',
        totalPaid: 'Total Paid',
        lastPayment: 'Last Payment',
        actions: 'Actions',
      },

      // Errors
      errors: {
        walletNotConnected: 'Wallet not connected',
        networkMismatch: 'Please switch to Sepolia network',
        transactionFailed: 'Transaction failed',
        insufficientBalance: 'Insufficient balance',
        userRejected: 'User rejected transaction',
        invalidAddress: 'Invalid address',
        invalidAmount: 'Invalid amount',
        unknown: 'Unknown error occurred',
      },

      // Success messages
      success: {
        transactionSent: 'Transaction sent successfully',
        transactionConfirmed: 'Transaction confirmed',
        dataSaved: 'Data saved successfully',
        agentRegistered: 'Agent registered successfully',
        feedbackSubmitted: 'Feedback submitted successfully',
        validationRequested: 'Validation requested successfully',
      },
    },
  },

  // ============================================================================
  // Chinese Simplified (简体中文)
  // ============================================================================
  zh: {
    translation: {
      // 导航
      nav: {
        dashboard: '仪表板',
        payments: '支付',
        flowPayment: '流支付',
        flowPaymentStake: '流支付（质押）',
        batchPayment: '批量支付',
        scheduledPayment: '定时支付',
        suppliers: '供应商',
        analytics: '数据分析',
        agentMarket: 'Agent 市场',
        settings: '设置',
      },

      // 分类
      categories: {
        all: '全部',
        logistics: '物流运输',
        consulting: '咨询服务',
        technical: '技术服务',
        cloud: '云计算',
        design: '设计服务',
        marketing: '市场营销',
        materials: '原材料',
      },

      // 通用
      common: {
        search: '搜索',
        searchPlaceholder: '搜索交易...',
        connect: '连接钱包',
        connecting: '连接中...',
        disconnect: '断开连接',
        loading: '加载中...',
        refresh: '刷新',
        export: '导出',
        save: '保存',
        cancel: '取消',
        submit: '提交',
        delete: '删除',
        edit: '编辑',
        view: '查看',
        close: '关闭',
        next: '下一步',
        previous: '上一步',
        finish: '完成',
        confirm: '确认',
        back: '返回',
        yes: '是',
        no: '否',
      },

      // 支付相关
      payment: {
        totalPayments: '总支付数',
        totalAmount: '总金额',
        suppliers: '供应商',
        averagePayment: '平均支付',
        category: '分类',
        amount: '金额',
        status: '状态',
        txHash: '交易哈希',
        date: '日期',
        supplier: '供应商',
        purpose: '用途',
        createPayment: '创建支付',
        paymentHistory: '支付历史',
        transactions: '笔交易',
        pending: '待处理',
        completed: '已完成',
        failed: '失败',
      },

      // 流支付
      flowPayment: {
        title: '流支付网络',
        subtitle: '基于 Sepolia 的实时支付网络可视化',
        registerSupplier: '注册供应商',
        totalPayments: '总支付数',
        totalAmount: '总金额',
        suppliers: '供应商',
        averagePayment: '平均支付',
        paymentTransactions: '支付交易',
        transactions: '笔交易',
        dragToPan: '拖动平移',
        scrollToZoom: '滚动缩放',
        clickNodes: '点击节点查看详情',
      },

      // 测试模式
      testMode: {
        enter: '测试模式',
        exit: '退出测试模式',
        enabled: '测试模式已启用',
        description: '当前显示模拟数据，包含 {{suppliers}} 个供应商和 {{payments}} 条支付记录用于演示。',
        demoCase: '演示案例',
        simple: '简单（总部 → 供应商）',
        twoTier: '两层（总部 → 子公司 → 供应商）',
        threeTier: '三层（总部 → 区域 → 分支 → 供应商）',
        complex: '复杂（多家公司）',
      },

      // ERC-8004 Agent
      agent: {
        title: '无需信任的 Agent',
        subtitle: '基于 ERC-8004 的去中心化 AI Agent 市场',
        register: '注册 Agent',
        myAgents: '我的 Agent',
        allAgents: '所有 Agent',
        agentId: 'Agent ID',
        agentName: 'Agent 名称',
        description: '描述',
        reputation: '声誉',
        reviews: '条评价',
        noReviews: '暂无评价',
        validated: '已验证',
        selectAgent: '选择支付执行器 Agent',
        
        // 注册
        registration: {
          title: '注册新 Agent',
          step1: '基本信息',
          step2: '服务配置',
          step3: '确认注册',
          step4: '成功',
          
          name: 'Agent 名称',
          namePlaceholder: '例如：专业支付执行器',
          description: '描述',
          descriptionPlaceholder: '描述您的 Agent 的能力...',
          imageUrl: '图片 URL',
          imageUrlPlaceholder: 'https://...',
          agentType: 'Agent 类型',
          
          supportedPayments: '支持的支付类型',
          scheduledPayments: '定时支付',
          batchPayments: '批量支付',
          flowPayments: '流支付',
          
          reviewInfo: '请审查您的 Agent 信息',
          registering: '注册中...',
          uploadingToIPFS: '上传到 IPFS...',
          waitingConfirmation: '等待确认...',
          
          success: 'Agent 注册成功！',
          yourAgentId: '您的 Agent ID',
          transactionHash: '交易哈希',
          ipfsUri: 'IPFS URI',
          viewOnExplorer: '在浏览器中查看',
          backToMarket: '返回市场',
        },

        // 声誉
        reputation: {
          giveFeedback: '提供反馈',
          score: '评分',
          comment: '评论',
          commentPlaceholder: '分享您对这个 Agent 的体验...',
          serviceType: '服务类型',
          transactionHash: '交易哈希',
          submit: '提交反馈',
          submitting: '提交中...',
          success: '反馈提交成功！',
          
          averageScore: '平均评分',
          totalReviews: '总评价数',
          byTag: '按标签',
          payment: '支付',
          scheduled: '定时',
          batch: '批量',
          flow: '流',
          success: '成功',
          failure: '失败',
        },

        // 验证
        validation: {
          requestValidation: '请求验证',
          validator: '验证者',
          evidence: '证据',
          evidencePlaceholder: '提供验证证据...',
          request: '请求',
          requesting: '请求中...',
          
          respond: '响应验证',
          validationScore: '验证评分',
          response: '响应',
          responsePlaceholder: '提供您的验证响应...',
          submit: '提交响应',
          
          pending: '待处理',
          completed: '已完成',
          validationHistory: '验证历史',
        },
      },

      // 定时支付
      scheduledPayment: {
        title: '定时支付',
        subtitle: '使用可视化编程创建自动化支付流程',
        flowBuilder: '流程构建器',
        flowList: '流程列表',
        
        createFlow: '创建流程',
        deployFlow: '部署流程',
        deploying: '部署中...',
        deployed: '已部署',
        
        flowName: '流程名称',
        flowDescription: '描述',
        status: '状态',
        active: '活跃',
        paused: '暂停',
        nextExecution: '下次执行',
        lastExecution: '上次执行',
        executedCount: '执行次数',
        
        selectExecutor: '选择执行器 Agent',
        noAgentSelected: '未选择 Agent',
        agentSelected: '已选择 Agent',
      },

      // 批量支付
      batchPayment: {
        title: '批量支付',
        subtitle: '一次处理多笔支付',
        uploadCSV: '上传 CSV',
        addManually: '手动添加',
        processPayments: '处理支付',
        processing: '处理中...',
        
        recipient: '收款人',
        amount: '金额',
        token: '代币',
        note: '备注',
        
        totalRecipients: '总收款人数',
        totalAmount: '总金额',
        estimatedGas: '预估 Gas',
      },

      // 数据分析
      analytics: {
        title: '数据分析',
        subtitle: '全面的支付分析和洞察',
        overview: '概览',
        trends: '趋势',
        categories: '分类',
        suppliers: '供应商',
        
        thisMonth: '本月',
        lastMonth: '上月',
        thisYear: '今年',
        allTime: '全部时间',
        
        paymentVolume: '支付量',
        transactionCount: '交易数量',
        averageTransaction: '平均交易',
        topSuppliers: '顶级供应商',
        topCategories: '顶级分类',
      },

      // 供应商
      suppliers: {
        title: '供应商',
        subtitle: '管理您的供应商网络',
        addSupplier: '添加供应商',
        supplierName: '供应商名称',
        address: '地址',
        category: '分类',
        totalPaid: '总支付',
        lastPayment: '最后支付',
        actions: '操作',
      },

      // 错误
      errors: {
        walletNotConnected: '钱包未连接',
        networkMismatch: '请切换到 Sepolia 网络',
        transactionFailed: '交易失败',
        insufficientBalance: '余额不足',
        userRejected: '用户拒绝交易',
        invalidAddress: '无效地址',
        invalidAmount: '无效金额',
        unknown: '发生未知错误',
      },

      // 成功消息
      success: {
        transactionSent: '交易发送成功',
        transactionConfirmed: '交易已确认',
        dataSaved: '数据保存成功',
        agentRegistered: 'Agent 注册成功',
        feedbackSubmitted: '反馈提交成功',
        validationRequested: '验证请求成功',
      },
    },
  },

  // ============================================================================
  // Spanish (西班牙语) - 基础翻译
  // ============================================================================
  es: {
    translation: {
      nav: {
        dashboard: 'Panel',
        payments: 'Pagos',
        flowPayment: 'Pago de Flujo',
        flowPaymentStake: 'Pago de Flujo (Stake)',
        batchPayment: 'Pago por Lotes',
        scheduledPayment: 'Pago Programado',
        suppliers: 'Proveedores',
        analytics: 'Analítica',
        agentMarket: 'Mercado de Agentes',
        settings: 'Configuración',
      },
      common: {
        search: 'Buscar',
        connect: 'Conectar Billetera',
        loading: 'Cargando...',
        refresh: 'Actualizar',
        save: 'Guardar',
        cancel: 'Cancelar',
        submit: 'Enviar',
      },
      payment: {
        totalPayments: 'Pagos Totales',
        totalAmount: 'Cantidad Total',
        suppliers: 'Proveedores',
        averagePayment: 'Pago Promedio',
      },
    },
  },

  // ============================================================================
  // French (法语) - 基础翻译
  // ============================================================================
  fr: {
    translation: {
      nav: {
        dashboard: 'Tableau de Bord',
        payments: 'Paiements',
        flowPayment: 'Paiement de Flux',
        flowPaymentStake: 'Paiement de Flux (Stake)',
        batchPayment: 'Paiement par Lots',
        scheduledPayment: 'Paiement Programmé',
        suppliers: 'Fournisseurs',
        analytics: 'Analytique',
        agentMarket: 'Marché des Agents',
        settings: 'Paramètres',
      },
      common: {
        search: 'Rechercher',
        connect: 'Connecter le Portefeuille',
        loading: 'Chargement...',
        refresh: 'Actualiser',
        save: 'Enregistrer',
        cancel: 'Annuler',
        submit: 'Soumettre',
      },
      payment: {
        totalPayments: 'Paiements Totaux',
        totalAmount: 'Montant Total',
        suppliers: 'Fournisseurs',
        averagePayment: 'Paiement Moyen',
      },
    },
  },

  // ============================================================================
  // German (德语) - 基础翻译
  // ============================================================================
  de: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        payments: 'Zahlungen',
        flowPayment: 'Flow-Zahlung',
        flowPaymentStake: 'Flow-Zahlung (Stake)',
        batchPayment: 'Batch-Zahlung',
        scheduledPayment: 'Geplante Zahlung',
        suppliers: 'Lieferanten',
        analytics: 'Analytik',
        agentMarket: 'Agenten-Markt',
        settings: 'Einstellungen',
      },
      common: {
        search: 'Suchen',
        connect: 'Wallet Verbinden',
        loading: 'Laden...',
        refresh: 'Aktualisieren',
        save: 'Speichern',
        cancel: 'Abbrechen',
        submit: 'Einreichen',
      },
      payment: {
        totalPayments: 'Gesamtzahlungen',
        totalAmount: 'Gesamtbetrag',
        suppliers: 'Lieferanten',
        averagePayment: 'Durchschnittliche Zahlung',
      },
    },
  },

  // ============================================================================
  // Japanese (日语) - 基础翻译
  // ============================================================================
  ja: {
    translation: {
      nav: {
        dashboard: 'ダッシュボード',
        payments: '支払い',
        flowPayment: 'フロー支払い',
        flowPaymentStake: 'フロー支払い（ステーク）',
        batchPayment: 'バッチ支払い',
        scheduledPayment: 'スケジュール支払い',
        suppliers: 'サプライヤー',
        analytics: '分析',
        agentMarket: 'エージェントマーケット',
        settings: '設定',
      },
      common: {
        search: '検索',
        connect: 'ウォレット接続',
        loading: '読み込み中...',
        refresh: '更新',
        save: '保存',
        cancel: 'キャンセル',
        submit: '送信',
      },
      payment: {
        totalPayments: '総支払い数',
        totalAmount: '総額',
        suppliers: 'サプライヤー',
        averagePayment: '平均支払い',
      },
    },
  },
};

export default translations;

