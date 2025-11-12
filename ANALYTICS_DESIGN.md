# Analytics Feature Design Document

## Overview

Design comprehensive cash flow and financial analytics functionality for Protocol Bank, enabling users to analyze income, expenses, and financial trends on monthly and yearly basis.

## Feature Requirements

### Core Features
1. **Cash Flow Analysis**
   - Monthly income vs expenses
   - Yearly income vs expenses
   - Net cash flow calculation
   - Cash flow trends over time

2. **Financial Reports**
   - Income breakdown by category
   - Expense breakdown by category
   - Top income sources
   - Top expense categories
   - Month-over-month growth

3. **Time Period Selection**
   - Monthly view
   - Yearly view
   - Custom date range
   - Quick filters (Last 30 days, Last 90 days, Last year)

4. **Visualizations**
   - Line charts for cash flow trends
   - Bar charts for income/expense comparison
   - Pie charts for category distribution
   - Area charts for cumulative cash flow

5. **Export Functionality**
   - Export to PDF
   - Export to CSV
   - Print-friendly reports

## Data Model

### Transaction Data Structure
```typescript
interface Transaction {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  recipient?: string;
  sender?: string;
  status: 'completed' | 'pending' | 'failed';
  currency: string;
  network?: string;
}
```

### Analytics Data Structure
```typescript
interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    transactionCount: number;
    avgTransactionSize: number;
  };
  monthlyData: MonthlyData[];
  yearlyData: YearlyData[];
  categoryBreakdown: CategoryData[];
  trends: TrendData;
}

interface MonthlyData {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  netFlow: number;
  transactionCount: number;
}

interface YearlyData {
  year: number;
  income: number;
  expense: number;
  netFlow: number;
  transactionCount: number;
  monthlyAverage: number;
}

interface CategoryData {
  category: string;
  type: 'income' | 'expense';
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface TrendData {
  growthRate: number;
  trend: 'up' | 'down' | 'stable';
  prediction: number[];
}
```

## UI Components

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  Header: Analytics Dashboard                            │
│  [Monthly/Yearly Toggle] [Date Range] [Export]         │
├─────────────────────────────────────────────────────────┤
│  Summary Cards                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Total    │ │ Total    │ │ Net Cash │ │ Avg      │ │
│  │ Income   │ │ Expense  │ │ Flow     │ │ Trans.   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────┤
│  Cash Flow Trend Chart (Line/Area)                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │          [Income/Expense Line Chart]             │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Income vs Expense Comparison (Bar Chart)              │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │          [Monthly/Yearly Bar Chart]              │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Category Breakdown                                     │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Income by        │  │ Expense by       │          │
│  │ Category         │  │ Category         │          │
│  │ (Pie Chart)      │  │ (Pie Chart)      │          │
│  └──────────────────┘  └──────────────────┘          │
├─────────────────────────────────────────────────────────┤
│  Transaction List (Paginated Table)                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Date | Type | Category | Amount | Status         │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme (Dark Theme)
- Background: `bg-black` / `bg-gray-900`
- Cards: `bg-gray-800` / `bg-gray-900` with border
- Text: `text-white` / `text-gray-300`
- Income: `text-green-500` / `bg-green-500/10`
- Expense: `text-red-500` / `bg-red-500/10`
- Net Positive: `text-blue-500` / `bg-blue-500/10`
- Charts: Use Recharts with custom dark theme colors

## Technical Implementation

### Libraries to Use
1. **Recharts** (already in dependencies)
   - Line charts
   - Bar charts
   - Pie charts
   - Area charts
   - Responsive containers

2. **date-fns** (for date manipulation)
   - Format dates
   - Calculate date ranges
   - Group by month/year

3. **Existing UI Components**
   - Card, CardContent from shadcn/ui
   - Button from shadcn/ui
   - Maintain existing design system

### Mock Data Generator
Create realistic mock financial data:
- 12 months of transaction history
- Mix of income and expenses
- Multiple categories
- Realistic amounts and patterns
- Various payment networks

### Component Structure
```
UnifiedAnalytics.jsx (Enhanced)
├── AnalyticsSummary.jsx (Summary cards)
├── CashFlowChart.jsx (Line/Area chart)
├── IncomeExpenseChart.jsx (Bar chart)
├── CategoryBreakdown.jsx (Pie charts)
├── TransactionTable.jsx (Data table)
└── ExportControls.jsx (PDF/CSV export)
```

## Implementation Steps

1. Create mock data generator with realistic financial transactions
2. Build analytics calculation engine
3. Implement summary cards component
4. Create cash flow trend chart with Recharts
5. Build income vs expense comparison chart
6. Implement category breakdown pie charts
7. Add transaction list table
8. Integrate export functionality
9. Add time period filters
10. Style all components with dark theme
11. Test with mock data
12. Document changes

## Success Criteria

- ✅ Analytics page loads instantly with mock data
- ✅ Monthly/yearly toggle works correctly
- ✅ All charts render properly in dark theme
- ✅ Export to PDF/CSV functions work
- ✅ UI matches existing design system
- ✅ Responsive on all screen sizes
- ✅ No console errors
- ✅ Performance is smooth (< 100ms render time)
