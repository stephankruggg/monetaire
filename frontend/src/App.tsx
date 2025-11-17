import { Component } from 'solid-js';
import ExpensesPage from './pages/ExpensesPage';

const App: Component = () => {
  return (
    <div style={{
      'min-height': '100vh',
      'background-color': '#f5f5f5'
    }}>
      <header style={{
        'background-color': '#2563eb',
        'color': 'white',
        'padding': '1rem 2rem',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 'font-size': '1.5rem', 'font-weight': 'bold' }}>
          Monetaire
        </h1>
        <p style={{ 'font-size': '0.875rem', 'opacity': '0.9' }}>
          Personal Expense Tracker
        </p>
      </header>

      <main style={{ padding: '2rem' }}>
        <ExpensesPage />
      </main>
    </div>
  );
};

export default App;
