import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import SearchResults from './pages/SearchResults'
import PropertyDetails from './pages/PropertyDetails'
import PropertyUpload from './pages/PropertyUpload'
import ProtectedRoute from './components/ProtectedRoute'
import EmailConfirmation from './pages/EmailConfirmation'
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/email-confirmation" element={<EmailConfirmation />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-property"
        element={
          <ProtectedRoute>
            <PropertyUpload />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App