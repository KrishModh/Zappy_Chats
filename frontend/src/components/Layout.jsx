import { useMemo } from 'react';
import Navbar from './Navbar';

const Layout = ({ children, requests = [], onRespond }) => {
  const safeRequests = useMemo(() => requests || [], [requests]);

  return (
    <div className="app-shell">
      <Navbar requests={safeRequests} onRespond={onRespond} />
      <main className="app-main">{children}</main>
    </div>
  );
};

export default Layout;
