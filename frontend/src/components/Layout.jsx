import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Zappy</h1>
        <nav>
          {user && (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/search">Search</Link>
            </>
          )}
          <button onClick={toggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} Mode</button>
          {user && <button onClick={logout}>Logout</button>}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
