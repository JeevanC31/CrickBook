import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';
import { AppProvider } from '@/context/AppContext';

describe('Authentication Flow', () => {
  it('renders auth view initially', () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>
    );
    expect(screen.getByTestId('auth-view')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('logs in and displays the main app layout', () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>
    );
    
    // Fill in email and password
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'player@example.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    // Auth view should be gone, app layout should be visible
    expect(screen.queryByTestId('auth-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    
    // Default view is dashboard
    expect(screen.getByTestId('view-dashboard')).toBeInTheDocument();
  });
});
