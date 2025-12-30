import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import GoldManagement from "./pages/GoldManagement";
import { useEffect } from "react";
import api from "./api/axios";

// Component to handle Zerodha Callback
const CallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const requestToken = searchParams.get("request_token");
    if (requestToken) {
      api
        .post("/zerodha/callback", { requestToken })
        .then(async () => {
          // Start a fetch sync immediately after login
          await api.get("/zerodha/holdings");
          navigate("/");
        })
        .catch((err) => {
          console.error("Login failed", err);
          alert("Login Failed");
          navigate("/");
        });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Authenticating...
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/gold" element={<GoldManagement />} />
      <Route path="/callback" element={<CallbackHandler />} />
    </Routes>
  );
}

export default App;
