import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <header>
        <h1>AI Travel Assistant</h1>
        <p>Speak or type your flight details for instant booking information</p>
      </header>
      <main>
        {children}
      </main>
      <footer>
        <p>© {new Date().getFullYear()} | AI Travel Assistant</p>
      </footer>
    </div>
  );
};

export default Layout; 