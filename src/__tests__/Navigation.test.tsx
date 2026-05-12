import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';
import { AppProvider, useAppContext } from '@/context/AppContext';

// Wrapper to auto-login for navigation tests
const TestWrapper = () => {
  const { login } = useAppContext();
  React.useEffect(() => {
    login();
  }, []);
  return <Home />;
};

describe('Navigation Flow', () => {
  it('navigates between views using sidebar', () => {
    render(
      <AppProvider>
        <TestWrapper />
      </AppProvider>
    );
    
    // Initially dashboard should be visible
    expect(screen.getByTestId('view-dashboard')).toBeInTheDocument();
    
    // Click Turfs in sidebar
    fireEvent.click(screen.getByTestId('nav-turfs'));
    expect(screen.queryByTestId('view-dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('view-turfs')).toBeInTheDocument();
    
    // Click Coaches
    fireEvent.click(screen.getByTestId('nav-coaches'));
    expect(screen.getByTestId('view-coaches')).toBeInTheDocument();

    // Click Logout
    fireEvent.click(screen.getByTestId('logout-btn'));
    expect(screen.getByTestId('auth-view')).toBeInTheDocument();
  });

  it('toggles chatbot widget', () => {
    render(
      <AppProvider>
        <TestWrapper />
      </AppProvider>
    );
    
    // Chatbot should not be open initially
    expect(screen.queryByTestId('chatbot-widget')).not.toBeInTheDocument();
    
    // Click FAB to open
    fireEvent.click(screen.getByTestId('chatbot-fab'));
    expect(screen.getByTestId('chatbot-widget')).toBeInTheDocument();
    
    // Click close button
    fireEvent.click(screen.getByTestId('close-chatbot'));
    expect(screen.queryByTestId('chatbot-widget')).not.toBeInTheDocument();
  });
});
