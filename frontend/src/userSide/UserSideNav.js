// src/components/UserSideNav.js

import { useLocation } from "react-router-dom";
import "./UserSideNav.css";
import theme from "../theme";

const UserSideNav = () => {
  const location = useLocation();

  const links = [
    { path: "/dashboard", label: " Dashboard" },
    { path: "/tournaments", label: " Tournaments" },
    { path: "/history", label: " History" },
    { path: "/payments", label: " Payments" }, // added
    { path: "/profile", label: " Profile" },
  ];

  return (
    <div className="user-side-nav" style={{border: theme.borders.activeLink,}}>
      <div className="nav-links">
        {links.map((link) => (
          <a
            key={link.path}
            href={link.path}
            className={location.pathname === link.path ? "active-link" : ""}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default UserSideNav;
