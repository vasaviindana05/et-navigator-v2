import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = 'pk_test_bGVhZGluZy1sb2JzdGVyLTY3LmNsZXJrLmFjY291bnRzLmRldiQ';

const clerkAppearance = {
  variables: {
    colorPrimary: '#cc0000',
    colorBackground: '#1e1e1e',
    colorText: '#f0ece4',
    colorTextSecondary: '#aaaaaa',
    colorInputBackground: '#2e2e2e',
    colorInputText: '#f0ece4',
    borderRadius: '6px',
    fontFamily: 'Georgia, serif',
  },
  elements: {
    card: {
      backgroundColor: '#1e1e1e',
      border: '1px solid #2a2a2a',
      borderTop: '3px solid #cc0000',
      boxShadow: 'none',
    },
    headerTitle: {
      color: '#f0ece4',
      fontFamily: 'Georgia, serif',
    },
    headerSubtitle: {
      color: '#888888',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#2e2e2e',
      border: '1px solid #444',
      color: '#f0ece4',
    },
    formButtonPrimary: {
      backgroundColor: '#cc0000',
      color: '#ffffff',
    },
    footerActionLink: {
      color: '#cc0000',
    },
    dividerLine: {
      backgroundColor: '#333',
    },
    dividerText: {
      color: '#666',
    },
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
    <App />
  </ClerkProvider>
);