import React from 'react';
import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <div>
      <header>
        <h1>My Blog</h1>
      </header>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
        </ul>
      </nav>
      <div className="container">
        {children}
      </div>
      <footer>
        <p>&copy; {new Date().getFullYear()} My Blog</p>
      </footer>
    </div>
  );
}

export default Layout;