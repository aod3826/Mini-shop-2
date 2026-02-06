import { useEffect, useState } from 'react'
import { useUserStore } from './stores/userStore'
import CustomerPage from './pages/CustomerPage'
import AdminPage from './pages/AdminPage'
import LoadingSpinner from './components/shared/LoadingSpinner'
import { LogIn } from 'lucide-react'

function App() {
  const { user, profile, loading, initialize, signIn, signUp } = useUserStore()
  const [authMode, setAuthMode] = useState('signin')
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' })
  const [authLoading, setAuthLoading] = useState(false)
  
  useEffect(() => {
    initialize()
  }, [])
  
  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    
    try {
      if (authMode === 'signin') {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) throw error
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ')
        setAuthMode('signin')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }
  
  if (loading) return <LoadingSpinner />
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <LogIn className="mx-auto text-primary mb-4" size={48} />
            <h1 className="text-3xl font-bold text-gray-800">Mini Shop</h1>
            <p className="text-gray-600 mt-2">
              {authMode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}
            
            <input
              type="email"
              placeholder="อีเมล"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              {authLoading ? 'กำลังดำเนินการ...' : authMode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>
          
          <p className="text-center mt-4 text-sm text-gray-600">
            {authMode === 'signin' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}
            {' '}
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              className="text-primary font-medium hover:underline"
            >
              {authMode === 'signin' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </p>
        </div>
      </div>
    )
  }
  
  return profile?.role === 'admin' ? <AdminPage /> : <CustomerPage />
}

export default App
