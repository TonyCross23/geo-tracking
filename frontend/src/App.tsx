import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/AuthLayouts';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

// React Router v7 အသစ်စက်စက် Data Router Configuration ပုံစံ ဖြစ်ပါတယ်
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    // 🔓 ဝင်ပြီးသားသူ ထပ်ဝင်မရအောင် Guest Route ဖြင့် ကာကွယ်ခြင်း
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <Login /> },
    ],
  },
  {
    // 🔒 မဝင်ရသေးသူ ဝင်မရအောင် Protected Route ဖြင့် ကာကွယ်ခြင်း
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}