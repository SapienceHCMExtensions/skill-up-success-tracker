import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";

const Start = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const preferred = localStorage.getItem("preferred_start_route");
    if (preferred && preferred !== "/") {
      navigate(preferred, { replace: true });
    }
  }, [navigate]);

  // Default fallback: Dashboard
  return <Dashboard />;
};

export default Start;
