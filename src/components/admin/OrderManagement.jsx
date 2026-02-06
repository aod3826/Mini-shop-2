import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, Truck, AlertCircle, Ban } from 'lucide-react'
import { useOrderStore } from '../../stores/orderStore'
import { formatCurrency, formatDate } from '../../lib/formatters'

const STATUS_CONFIG = {
  pending: { label: 'รอชำระเงิน', icon: Clock, color: 'text-warning bg-warning/10' },
  confirmed: { label: 'ยืนยันแล้ว', icon: CheckCircle, color: 'text-success bg-success/10' },
  shipping: { label: 'กำลังจัดส่ง', icon: Truck, color: 'text-primary bg-primary/10' },
  delivered: { label: 'จัดส่งแล้ว', icon: Package, color: 'text-gray-600 bg-gray-100' },
  problem: { label: 'มีปัญหา', icon: AlertCircle, color: 'text-danger bg-danger/10' },
  cancelled: { label: 'ยกเลิก', icon: Ban, color: 'text-gray-400 bg-gray-100' }
}

export default function OrderManagement() {
  const { orders, fetchOrders, updateOrderStatus, loading } = useOrderStore()
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    fetchOrders()
  }, [])
  
  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.order_status === filter)
  
  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">จัดการคำสั่งซื้อ</h2>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
        >
          <option value="all">ทั้งหมด ({orders.length})</option>
          <option value="pending">รอชำระเงิน</option>
          <option value="confirmed">ยืนยันแล้ว</option>
          <option value="shipping">กำลังจัดส่ง</option>
          <option value="delivered">จัดส่งแล้ว</option>
          <option value="problem">มีปัญหา</option>
        </select>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const statusInfo = STATUS_CONFIG[order.order_status]
            const Icon = statusInfo.icon
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{order.order_number}</h3>
                    <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.color}`}>
                    <Icon size={16} />
                    <span className="text-sm font-medium">{statusInfo.label}</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">ลูกค้า</p>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm">{order.customer_phone}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">ที่อยู่จัดส่ง</p>
                    <p className="text-sm">{order.customer_address}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between text-sm">
                    <span>ค่าจัดส่ง</span>
                    <span>{formatCurrency(order.shipping_fee)}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>ยอดรวม</span>
                    <span className="text-primary">{formatCurrency(order.total)}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  {order.order_status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'confirmed')}
                      className="px-4 py-2 bg-success text-white rounded-lg hover:bg-green-600 transition"
                    >
                      ยืนยันคำสั่งซื้อ
                    </button>
                  )}
                  
                  {order.order_status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'shipping')}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      เริ่มจัดส่ง
                    </button>
                  )}
                  
                  {order.order_status === 'shipping' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'delivered')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                      จัดส่งเรียบร้อย
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleStatusChange(order.id, 'problem')}
                    className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition"
                  >
                    แจ้งปัญหา
                  </button>
                </div>
              </div>
            )
          })}
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              ไม่มีคำสั่งซื้อ
            </div>
          )}
        </div>
      )}
    </div>
  )
}
