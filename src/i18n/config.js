import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
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
        connect: 'Connect Wallet',
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
      },
      
      // Test Mode
      testMode: {
        enabled: 'Test Mode Enabled',
        description: 'Currently displaying mock data with {suppliers} suppliers and {payments} payment records for demonstration purposes.',
        demoCase: 'Demo Case',
        simple: 'Simple (HQ → Suppliers)',
        twoTier: 'Two-Tier (HQ → Subsidiaries → Suppliers)',
        threeTier: 'Three-Tier (HQ → Regional → Branches → Suppliers)',
        complex: 'Complex (Multiple Companies)',
      },
    },
  },
  
  zh: {
    translation: {
      nav: {
        dashboard: '仪表板',
        payments: '支付',
        flowPayment: '流支付',
        flowPaymentStake: '流支付（质押）',
        batchPayment: '批量支付',
        scheduledPayment: '定时支付',
        suppliers: '供应商',
        analytics: '分析',
      },
      
      categories: {
        all: '全部',
        logistics: 'Logistics',
        consulting: 'Consulting Services',
        technical: 'Technical Services',
        cloud: 'Cloud Computing',
        design: 'Design Services',
        marketing: 'Marketing',
        materials: 'Raw Materials',
      },
      
      common: {
        search: '搜索',
        connect: '连接钱包',
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
      },
      
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
      },
      
      testMode: {
        enabled: '测试模式已启用',
        description: '当前显示模拟数据，包含 {suppliers} 个供应商和 {payments} 条支付记录用于演示。',
        demoCase: '演示案例',
        simple: '简单（总部 → 供应商）',
        twoTier: '两层（总部 → 子公司 → 供应商）',
        threeTier: '三层（总部 → 区域 → 分支 → 供应商）',
        complex: '复杂（多公司）',
      },
    },
  },
  
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
        analytics: 'Análisis',
      },
      
      categories: {
        all: 'Todos',
        logistics: 'Logística',
        consulting: 'Servicios de Consultoría',
        technical: 'Servicios Técnicos',
        cloud: 'Computación en la Nube',
        design: 'Servicios de Diseño',
        marketing: 'Marketing',
        materials: 'Materias Primas',
      },
      
      common: {
        search: 'Buscar',
        connect: 'Conectar Billetera',
        disconnect: 'Desconectar',
        loading: 'Cargando...',
        refresh: 'Actualizar',
        export: 'Exportar',
        save: 'Guardar',
        cancel: 'Cancelar',
        submit: 'Enviar',
        delete: 'Eliminar',
        edit: 'Editar',
        view: 'Ver',
        close: 'Cerrar',
      },
      
      payment: {
        totalPayments: 'Pagos Totales',
        totalAmount: 'Cantidad Total',
        suppliers: 'Proveedores',
        averagePayment: 'Pago Promedio',
        category: 'Categoría',
        amount: 'Cantidad',
        status: 'Estado',
        txHash: 'Hash de TX',
        date: 'Fecha',
        supplier: 'Proveedor',
        purpose: 'Propósito',
        createPayment: 'Crear Pago',
        paymentHistory: 'Historial de Pagos',
        transactions: 'transacciones',
      },
      
      testMode: {
        enabled: 'Modo de Prueba Activado',
        description: 'Actualmente mostrando datos simulados con {suppliers} proveedores y {payments} registros de pago para fines de demostración.',
        demoCase: 'Caso de Demostración',
        simple: 'Simple (HQ → Proveedores)',
        twoTier: 'Dos Niveles (HQ → Subsidiarias → Proveedores)',
        threeTier: 'Tres Niveles (HQ → Regional → Sucursales → Proveedores)',
        complex: 'Complejo (Múltiples Empresas)',
      },
    },
  },
  
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
      },
      
      categories: {
        all: 'Tous',
        logistics: 'Logistique',
        consulting: 'Services de Conseil',
        technical: 'Services Techniques',
        cloud: 'Cloud Computing',
        design: 'Services de Design',
        marketing: 'Marketing',
        materials: 'Matières Premières',
      },
      
      common: {
        search: 'Rechercher',
        connect: 'Connecter le Portefeuille',
        disconnect: 'Déconnecter',
        loading: 'Chargement...',
        refresh: 'Actualiser',
        export: 'Exporter',
        save: 'Enregistrer',
        cancel: 'Annuler',
        submit: 'Soumettre',
        delete: 'Supprimer',
        edit: 'Modifier',
        view: 'Voir',
        close: 'Fermer',
      },
      
      payment: {
        totalPayments: 'Paiements Totaux',
        totalAmount: 'Montant Total',
        suppliers: 'Fournisseurs',
        averagePayment: 'Paiement Moyen',
        category: 'Catégorie',
        amount: 'Montant',
        status: 'Statut',
        txHash: 'Hash TX',
        date: 'Date',
        supplier: 'Fournisseur',
        purpose: 'Objectif',
        createPayment: 'Créer un Paiement',
        paymentHistory: 'Historique des Paiements',
        transactions: 'transactions',
      },
      
      testMode: {
        enabled: 'Mode Test Activé',
        description: 'Affichage actuellement de données simulées avec {suppliers} fournisseurs et {payments} enregistrements de paiement à des fins de démonstration.',
        demoCase: 'Cas de Démonstration',
        simple: 'Simple (Siège → Fournisseurs)',
        twoTier: 'Deux Niveaux (Siège → Filiales → Fournisseurs)',
        threeTier: 'Trois Niveaux (Siège → Régional → Succursales → Fournisseurs)',
        complex: 'Complexe (Plusieurs Entreprises)',
      },
    },
  },
  
  de: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        payments: 'Zahlungen',
        flowPayment: 'Flow-Zahlung',
        flowPaymentStake: 'Flow-Zahlung (Stake)',
        batchPayment: 'Stapelzahlung',
        scheduledPayment: 'Geplante Zahlung',
        suppliers: 'Lieferanten',
        analytics: 'Analytik',
      },
      
      categories: {
        all: 'Alle',
        logistics: 'Logistik',
        consulting: 'Beratungsdienste',
        technical: 'Technische Dienste',
        cloud: 'Cloud Computing',
        design: 'Design-Dienste',
        marketing: 'Marketing',
        materials: 'Rohstoffe',
      },
      
      common: {
        search: 'Suchen',
        connect: 'Wallet Verbinden',
        disconnect: 'Trennen',
        loading: 'Laden...',
        refresh: 'Aktualisieren',
        export: 'Exportieren',
        save: 'Speichern',
        cancel: 'Abbrechen',
        submit: 'Senden',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        view: 'Ansehen',
        close: 'Schließen',
      },
      
      payment: {
        totalPayments: 'Gesamtzahlungen',
        totalAmount: 'Gesamtbetrag',
        suppliers: 'Lieferanten',
        averagePayment: 'Durchschnittliche Zahlung',
        category: 'Kategorie',
        amount: 'Betrag',
        status: 'Status',
        txHash: 'TX Hash',
        date: 'Datum',
        supplier: 'Lieferant',
        purpose: 'Zweck',
        createPayment: 'Zahlung Erstellen',
        paymentHistory: 'Zahlungshistorie',
        transactions: 'Transaktionen',
      },
      
      testMode: {
        enabled: 'Testmodus Aktiviert',
        description: 'Derzeit werden Scheindaten mit {suppliers} Lieferanten und {payments} Zahlungsdatensätzen zu Demonstrationszwecken angezeigt.',
        demoCase: 'Demo-Fall',
        simple: 'Einfach (Zentrale → Lieferanten)',
        twoTier: 'Zwei Ebenen (Zentrale → Tochtergesellschaften → Lieferanten)',
        threeTier: 'Drei Ebenen (Zentrale → Regional → Filialen → Lieferanten)',
        complex: 'Komplex (Mehrere Unternehmen)',
      },
    },
  },
  
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
      },
      
      categories: {
        all: 'すべて',
        logistics: '物流',
        consulting: 'コンサルティングサービス',
        technical: '技術サービス',
        cloud: 'クラウドコンピューティング',
        design: 'デザインサービス',
        marketing: 'マーケティング',
        materials: 'Raw Materials',
      },
      
      common: {
        search: '検索',
        connect: 'ウォレット接続',
        disconnect: '切断',
        loading: '読み込み中...',
        refresh: '更新',
        export: 'エクスポート',
        save: '保存',
        cancel: 'キャンセル',
        submit: '送信',
        delete: '削除',
        edit: '編集',
        view: '表示',
        close: '閉じる',
      },
      
      payment: {
        totalPayments: '総支払い数',
        totalAmount: '総額',
        suppliers: 'サプライヤー',
        averagePayment: '平均支払い',
        category: 'カテゴリ',
        amount: '金額',
        status: 'ステータス',
        txHash: 'TXハッシュ',
        date: '日付',
        supplier: 'サプライヤー',
        purpose: '目的',
        createPayment: '支払いを作成',
        paymentHistory: '支払い履歴',
        transactions: '件の取引',
      },
      
      testMode: {
        enabled: 'テストモード有効',
        description: 'デモンストレーション目的で、{suppliers}のサプライヤーと{payments}の支払い記録を含むモックデータを表示しています。',
        demoCase: 'デモケース',
        simple: 'シンプル（本社 → サプライヤー）',
        twoTier: '2層（本社 → 子会社 → サプライヤー）',
        threeTier: '3層（本社 → 地域 → 支店 → サプライヤー）',
        complex: '複雑（複数企業）',
      },
    },
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser language
      caches: ['localStorage'], // Cache language selection
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;

