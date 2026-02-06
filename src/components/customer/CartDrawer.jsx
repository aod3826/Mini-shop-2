import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../lib/formatters'

export default function CartDrawer({ isOpen, onClose, onCheckout }) {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore()
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-primary" size={24} />
            <h2 className="text-xl font-bold">ตะกร้าสินค้า</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag size={64} className="mx-auto mb-4 opacity-50" />
              <p>ตะกร้าสินค้าว่างเปล่า</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag size={32} className="text-gray-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-primary font-bold">
                      {formatCurrency(item.price)}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded transition"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded transition"
                      >
                        <Plus size={16} />
                      </button>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-1 hover:bg-red-100 text-danger rounded transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>ยอดรวม</span>
              <span className="text-primary">{formatCurrency(getTotal())}</span>
            </div>
            
            <button
              onClick={onCheckout}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              ดำเนินการสั่งซื้อ
            </button>
          </div>
        )}
      </div>
    </>
  )
}
