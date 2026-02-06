import { ShoppingCart, Package } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import { useCartStore } from '../../stores/cartStore'

export default function ProductCard({ product }) {
  const addItem = useCartStore(state => state.addItem)
  
  const handleAddToCart = () => {
    addItem(product, 1)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={64} className="text-gray-400" />
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              product.stock > 0
                ? 'bg-primary text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={18} />
            {product.stock > 0 ? 'เพิ่ม' : 'สินค้าหมด'}
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          คงเหลือ: {product.stock} ชิ้น
        </div>
      </div>
    </div>
  )
}
