import { useLayoutEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthenticatedLayout from './components/AuthenticatedLayout.jsx';
import Home from './pages/Home.jsx';
import Quiz from './pages/Quiz.jsx';
import Result from './pages/Result.jsx';
import QuizHistory from './pages/QuizHistory.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';

  const shellClass = 'app-shell' + (isAuthPage ? ' app-shell--auth' : '');

  return (
    <div className={shellClass}>
      <ScrollToTop />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/quiz/:quizId" element={<Quiz />} />
              <Route path="/result/:quizId" element={<Result />} />
              <Route path="/history" element={<QuizHistory />} />
            </Route>
          </Route>
        </Routes>
      </main>
    </div>
  );
}
