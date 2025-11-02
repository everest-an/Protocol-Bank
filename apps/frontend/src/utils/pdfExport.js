// PDF Export Utility for Protocol Bank
// Uses browser-based PDF generation without external dependencies

export const generateAnalyticsPDF = (analytics, categoryArray, monthlyArray) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Protocol Bank - Financial Analytics Report</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          color: #1f2937;
          line-height: 1.5;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 14px;
          color: #6b7280;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
        }
        
        .metric-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .metric-change {
          font-size: 12px;
          color: #10b981;
          margin-top: 4px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th {
          background-color: #f9fafb;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
        }
        
        td {
          padding: 12px;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .bar-container {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .bar-fill {
          height: 100%;
          border-radius: 4px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Protocol Bank</h1>
        <p>Financial Analytics Report</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">Summary Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Spent</div>
            <div class="metric-value">$${analytics.totalSpent.toLocaleString()}</div>
            <div class="metric-change">↑ 12.5% vs last period</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Active Suppliers</div>
            <div class="metric-value">${analytics.supplierCount}</div>
            <div class="metric-change">↑ 8 new this month</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Avg Payment</div>
            <div class="metric-value">$${analytics.avgPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div class="metric-change">${analytics.paymentCount} transactions</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Concentration Risk</div>
            <div class="metric-value">${analytics.concentrationRisk.toFixed(1)}%</div>
            <div class="metric-change">Top 5 suppliers</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Spending by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
              <th>Suppliers</th>
              <th>Payments</th>
            </tr>
          </thead>
          <tbody>
            ${categoryArray.map(category => {
              const percentage = (category.amount / analytics.totalSpent) * 100;
              return `
                <tr>
                  <td><strong>${category.name}</strong></td>
                  <td>$${category.amount.toLocaleString()}</td>
                  <td>${percentage.toFixed(1)}%</td>
                  <td>${category.suppliers}</td>
                  <td>${category.count}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="page-break"></div>
      
      <div class="section">
        <h2 class="section-title">Top 10 Suppliers</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Category</th>
              <th>Total Amount</th>
              <th>Payments</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.topSuppliers.map((supplier, index) => `
              <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${supplier.name}</td>
                <td>${supplier.category}</td>
                <td>$${supplier.totalAmount.toLocaleString()}</td>
                <td>${supplier.paymentCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2 class="section-title">Monthly Spending Trend</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Amount</th>
              <th>Payments</th>
              <th>Avg Payment</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyArray.slice(-12).map(month => `
              <tr>
                <td><strong>${month.month}</strong></td>
                <td>$${month.amount.toLocaleString()}</td>
                <td>${month.count}</td>
                <td>$${(month.amount / month.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2 class="section-title">Payment Size Distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Range</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Small Payments</strong></td>
              <td>< $1,000</td>
              <td>${analytics.paymentsByAmount.small}</td>
              <td>${((analytics.paymentsByAmount.small / analytics.paymentCount) * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td><strong>Medium Payments</strong></td>
              <td>$1,000 - $10,000</td>
              <td>${analytics.paymentsByAmount.medium}</td>
              <td>${((analytics.paymentsByAmount.medium / analytics.paymentCount) * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td><strong>Large Payments</strong></td>
              <td>> $10,000</td>
              <td>${analytics.paymentsByAmount.large}</td>
              <td>${((analytics.paymentsByAmount.large / analytics.paymentCount) * 100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>This report was generated by Protocol Bank Analytics</p>
        <p>For more information, visit https://www.protocolbanks.com/</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          // Close window after printing or if user cancels
          setTimeout(function() {
            window.close();
          }, 100);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generateStakeReportPDF = (poolData, whitelist, payments) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Protocol Bank - Flow Payment (Stake) Report</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          color: #1f2937;
          line-height: 1.5;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 14px;
          color: #6b7280;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .info-item {
          padding: 12px;
          background-color: #f9fafb;
          border-radius: 6px;
        }
        
        .info-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th {
          background-color: #f9fafb;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
        }
        
        td {
          padding: 12px;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-approved {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Protocol Bank</h1>
        <p>Flow Payment (Stake) Report</p>
        <p>Pool ID: ${poolData?.poolId || 'N/A'}</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">Pool Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Staker (VC/LP)</div>
            <div class="info-value">${poolData?.staker ? poolData.staker.slice(0, 10) + '...' + poolData.staker.slice(-8) : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Company</div>
            <div class="info-value">${poolData?.company ? poolData.company.slice(0, 10) + '...' + poolData.company.slice(-8) : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total Staked</div>
            <div class="info-value">${poolData?.totalStaked || '0'} ETH</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total Spent</div>
            <div class="info-value">${poolData?.totalSpent || '0'} ETH</div>
          </div>
          <div class="info-item">
            <div class="info-label">Available Balance</div>
            <div class="info-value">${poolData?.availableBalance || '0'} ETH</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">${poolData?.active ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Whitelist (${whitelist?.length || 0} entries)</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${whitelist && whitelist.length > 0 ? whitelist.map(entry => `
              <tr>
                <td><strong>${entry.name}</strong></td>
                <td>${entry.address.slice(0, 10)}...${entry.address.slice(-8)}</td>
                <td>${entry.category}</td>
                <td>
                  <span class="status-badge ${entry.approved ? 'status-approved' : 'status-pending'}">
                    ${entry.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="4" style="text-align: center; color: #6b7280;">No whitelist entries</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div class="page-break"></div>
      
      <div class="section">
        <h2 class="section-title">Payment History (${payments?.length || 0} payments)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>To</th>
              <th>Amount</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            ${payments && payments.length > 0 ? payments.map(payment => `
              <tr>
                <td>${new Date(payment.timestamp * 1000).toLocaleString()}</td>
                <td>${payment.to.slice(0, 10)}...${payment.to.slice(-8)}</td>
                <td><strong>${payment.amount} ETH</strong></td>
                <td>${payment.purpose || 'N/A'}</td>
              </tr>
            `).join('') : '<tr><td colspan="4" style="text-align: center; color: #6b7280;">No payments yet</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>This report was generated by Protocol Bank Flow Payment (Stake)</p>
        <p>Smart Contract: 0x44a55360BaBc86d6443471Aa473E9Fa693037f04 (Sepolia)</p>
        <p>For more information, visit https://www.protocolbanks.com/</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 100);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

