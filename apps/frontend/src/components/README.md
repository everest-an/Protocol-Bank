# Protocol Bank Frontend Components

This directory contains reusable React components for the Protocol Bank application.

## Component Categories

### 🎨 UI Components

#### ErrorBoundary
Catches JavaScript errors in the component tree and displays a fallback UI.

```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### LoadingOverlay
Full-screen or inline loading indicator.

```jsx
<LoadingOverlay message="Processing transaction..." />
<InlineLoading message="Loading data..." size="md" />
<ButtonLoading message="Submitting..." />
```

#### Toast
Notification system for success, error, warning, and info messages.

```jsx
import { useToast } from './components/Toast';

const toast = useToast();
toast.success('Payment successful!');
toast.error('Transaction failed');
toast.warning('Low balance');
toast.info('New feature available');
```

### 💳 Payment Components

#### CreateStreamPaymentForm
Modal form for creating a single stream payment.

**Props:**
- `isOpen` (boolean): Whether the modal is open
- `onClose` (function): Callback when modal is closed
- `onSuccess` (function): Callback when stream is created successfully
- `account` (string): User's wallet address
- `provider` (object): ethers.js provider

```jsx
<CreateStreamPaymentForm
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={handleSuccess}
  account={account}
  provider={provider}
/>
```

#### BatchCreateStreamModal
Modal for batch creating stream payments via CSV import.

**Props:**
- `isOpen` (boolean): Whether the modal is open
- `onClose` (function): Callback when modal is closed
- `onSuccess` (function): Callback when streams are created successfully

```jsx
<BatchCreateStreamModal
  isOpen={showBatchModal}
  onClose={() => setShowBatchModal(false)}
  onSuccess={handleBatchSuccess}
/>
```

### 📊 Dashboard Components

#### StreamPaymentDashboard
Displays stream payment statistics and visualizations.

**Props:**
- `streams` (array): Array of stream payment objects
- `etherscanData` (object): Optional Etherscan data

```jsx
<StreamPaymentDashboard
  streams={streams}
  etherscanData={etherscanData}
/>
```

## Best Practices

### Component Structure

1. **Props Validation**: Use PropTypes or TypeScript for type checking
2. **Default Props**: Always provide sensible defaults
3. **Error Handling**: Wrap components in ErrorBoundary
4. **Loading States**: Use LoadingOverlay for async operations
5. **Accessibility**: Include ARIA labels and keyboard navigation

### Styling

- Use Tailwind CSS utility classes
- Follow the dark mode design system
- Maintain consistent spacing and colors
- Use the glassmorphism effect for cards

### State Management

- Use React Hooks (useState, useEffect, useContext)
- Keep state as local as possible
- Use custom hooks for shared logic
- Avoid prop drilling with Context API

### Performance

- Use React.memo for expensive components
- Implement code splitting with React.lazy
- Optimize re-renders with useCallback and useMemo
- Lazy load images and heavy components

## Component Checklist

When creating a new component:

- [ ] Add JSDoc comments
- [ ] Include usage examples
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Add accessibility features
- [ ] Test on mobile devices
- [ ] Test in dark mode
- [ ] Add to this README

## Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [ethers.js](https://docs.ethers.org/)
