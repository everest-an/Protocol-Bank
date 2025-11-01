const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Firefly III 集成服务
 * 用于将Protocol Bank的交易数据同步到Firefly III进行财务分析
 */
class FireflyService {
  constructor() {
    this.baseURL = process.env.FIREFLY_API_URL || 'http://localhost:8081/api/v1';
    this.apiToken = process.env.FIREFLY_API_TOKEN || '';
    this.enabled = process.env.FIREFLY_ENABLED === 'true';
    
    if (this.enabled && !this.apiToken) {
      logger.warn('Firefly III is enabled but API token is not configured');
      this.enabled = false;
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * 检查Firefly III连接状态
   */
  async checkConnection() {
    if (!this.enabled) {
      return { connected: false, message: 'Firefly III integration is disabled' };
    }

    try {
      const response = await this.client.get('/about');
      return {
        connected: true,
        version: response.data.data.version,
        api_version: response.data.data.api_version
      };
    } catch (error) {
      logger.error('Failed to connect to Firefly III:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * 同步账户到Firefly III
   * @param {Object} account - Protocol Bank账户对象
   */
  async syncAccount(account) {
    if (!this.enabled) return null;

    try {
      // 检查账户是否已存在
      const existingAccount = await this.findAccountByExternalId(account.account_id);
      
      if (existingAccount) {
        // 更新现有账户
        return await this.updateAccount(existingAccount.id, account);
      } else {
        // 创建新账户
        return await this.createAccount(account);
      }
    } catch (error) {
      logger.error('Failed to sync account to Firefly III:', error.message);
      throw error;
    }
  }

  /**
   * 创建Firefly III账户
   */
  async createAccount(account) {
    try {
      const response = await this.client.post('/accounts', {
        name: `Protocol Bank - ${account.username}`,
        type: 'asset',
        account_role: 'defaultAsset',
        currency_code: account.currency || 'USD',
        current_balance: parseFloat(account.balance) || 0,
        notes: `Synced from Protocol Bank\nAccount ID: ${account.account_id}\nEmail: ${account.email}`,
        external_id: account.account_id
      });

      logger.info(`Created Firefly III account for ${account.username}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to create Firefly III account:', error.message);
      throw error;
    }
  }

  /**
   * 更新Firefly III账户
   */
  async updateAccount(fireflyAccountId, account) {
    try {
      const response = await this.client.put(`/accounts/${fireflyAccountId}`, {
        name: `Protocol Bank - ${account.username}`,
        currency_code: account.currency || 'USD',
        current_balance: parseFloat(account.balance) || 0,
        notes: `Synced from Protocol Bank\nAccount ID: ${account.account_id}\nEmail: ${account.email}`
      });

      logger.info(`Updated Firefly III account ${fireflyAccountId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to update Firefly III account:', error.message);
      throw error;
    }
  }

  /**
   * 根据外部ID查找账户
   */
  async findAccountByExternalId(externalId) {
    try {
      const response = await this.client.get('/accounts', {
        params: {
          type: 'asset'
        }
      });

      const accounts = response.data.data;
      const account = accounts.find(acc => 
        acc.attributes.notes && acc.attributes.notes.includes(externalId)
      );

      return account ? { id: account.id, ...account.attributes } : null;
    } catch (error) {
      logger.error('Failed to find account by external ID:', error.message);
      return null;
    }
  }

  /**
   * 同步交易到Firefly III
   * @param {Object} transaction - Protocol Bank交易对象
   */
  async syncTransaction(transaction) {
    if (!this.enabled) return null;

    try {
      // 获取源账户和目标账户的Firefly III ID
      const sourceAccount = await this.findAccountByExternalId(transaction.from_account_id);
      const destinationAccount = await this.findAccountByExternalId(transaction.to_account_id);

      if (!sourceAccount || !destinationAccount) {
        logger.warn('Source or destination account not found in Firefly III');
        return null;
      }

      // 检查交易是否已存在
      const existingTransaction = await this.findTransactionByExternalId(transaction.transaction_id);
      
      if (existingTransaction) {
        logger.info(`Transaction ${transaction.transaction_id} already synced to Firefly III`);
        return existingTransaction;
      }

      // 创建新交易
      return await this.createTransaction(transaction, sourceAccount.id, destinationAccount.id);
    } catch (error) {
      logger.error('Failed to sync transaction to Firefly III:', error.message);
      throw error;
    }
  }

  /**
   * 创建Firefly III交易
   */
  async createTransaction(transaction, sourceAccountId, destinationAccountId) {
    try {
      const response = await this.client.post('/transactions', {
        error_if_duplicate_hash: false,
        apply_rules: true,
        fire_webhooks: true,
        transactions: [{
          type: 'transfer',
          date: transaction.created_at || new Date().toISOString(),
          amount: parseFloat(transaction.amount).toFixed(2),
          description: transaction.description || `Protocol Bank Transfer`,
          source_id: sourceAccountId.toString(),
          destination_id: destinationAccountId.toString(),
          currency_code: transaction.currency || 'USD',
          external_id: transaction.transaction_id,
          notes: `Synced from Protocol Bank\nTransaction ID: ${transaction.transaction_id}\nStatus: ${transaction.status}`,
          tags: ['protocol-bank', 'automated']
        }]
      });

      logger.info(`Created Firefly III transaction for ${transaction.transaction_id}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to create Firefly III transaction:', error.message);
      throw error;
    }
  }

  /**
   * 根据外部ID查找交易
   */
  async findTransactionByExternalId(externalId) {
    try {
      const response = await this.client.get('/transactions', {
        params: {
          limit: 50
        }
      });

      const transactions = response.data.data;
      const transaction = transactions.find(tx => 
        tx.attributes.transactions[0].external_id === externalId
      );

      return transaction || null;
    } catch (error) {
      logger.error('Failed to find transaction by external ID:', error.message);
      return null;
    }
  }

  /**
   * 批量同步交易
   * @param {Array} transactions - 交易数组
   */
  async syncBatchTransactions(transactions) {
    if (!this.enabled) return { synced: 0, failed: 0 };

    const results = {
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const transaction of transactions) {
      try {
        await this.syncTransaction(transaction);
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          transaction_id: transaction.transaction_id,
          error: error.message
        });
      }
    }

    logger.info(`Batch sync completed: ${results.synced} synced, ${results.failed} failed`);
    return results;
  }

  /**
   * 获取财务分析数据
   * @param {String} accountId - Protocol Bank账户ID
   * @param {String} startDate - 开始日期
   * @param {String} endDate - 结束日期
   */
  async getFinancialInsights(accountId, startDate, endDate) {
    if (!this.enabled) {
      return { error: 'Firefly III integration is disabled' };
    }

    try {
      const account = await this.findAccountByExternalId(accountId);
      if (!account) {
        return { error: 'Account not found in Firefly III' };
      }

      // 获取账户余额
      const balanceResponse = await this.client.get(`/accounts/${account.id}`, {
        params: { start: startDate, end: endDate }
      });

      // 获取支出统计
      const expenseResponse = await this.client.get('/insight/expense/expense', {
        params: { start: startDate, end: endDate }
      });

      // 获取收入统计
      const incomeResponse = await this.client.get('/insight/income/revenue', {
        params: { start: startDate, end: endDate }
      });

      return {
        account: balanceResponse.data.data.attributes,
        expenses: expenseResponse.data,
        income: incomeResponse.data,
        period: { start: startDate, end: endDate }
      };
    } catch (error) {
      logger.error('Failed to get financial insights:', error.message);
      throw error;
    }
  }

  /**
   * 获取预算信息
   * @param {String} startDate - 开始日期
   * @param {String} endDate - 结束日期
   */
  async getBudgetInfo(startDate, endDate) {
    if (!this.enabled) {
      return { error: 'Firefly III integration is disabled' };
    }

    try {
      const response = await this.client.get('/budgets', {
        params: { start: startDate, end: endDate }
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get budget info:', error.message);
      throw error;
    }
  }

  /**
   * 获取分类统计
   * @param {String} startDate - 开始日期
   * @param {String} endDate - 结束日期
   */
  async getCategoryStatistics(startDate, endDate) {
    if (!this.enabled) {
      return { error: 'Firefly III integration is disabled' };
    }

    try {
      const response = await this.client.get('/categories', {
        params: { start: startDate, end: endDate }
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get category statistics:', error.message);
      throw error;
    }
  }
}

module.exports = new FireflyService();
