import { useState } from 'react'
import { Package, Settings, FileText } from 'lucide-react'
import Header from '../components/shared/Header'
import OrderManagement from '../components/admin/OrderManagement'
import StoreSettings from '../components/admin/StoreSettings'
import ActivityLogs from '../components/admin/ActivityLogs'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('orders')
  
  const tabs = [
    { id: 'orders', label: 'คำสั่งซื้อ', icon: Package },
    { id: 'settings', label: 'ตั้งค่าร้าน', icon: Settings },
    { id: 'logs', label: 'Activity Logs', icon: FileText }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCartClick={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        
        <div>
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'settings' && <StoreSettings />}
          {activeTab === 'logs' && <ActivityLogs />}
        </div>
      </div>
    </div>
  )
}
