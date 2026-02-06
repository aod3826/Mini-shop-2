import { ShoppingCart, User, LogOut } from 'lucide-react'
import { useUserStore } from '../../stores/userStore'
import { useCartStore } from '../../stores/cartStore'

export default function Header({ onCartClick }) {
  const { user, profile, signOut } = useUserStore()
  const itemCount = useCartStore(state => state.getItemCount())
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">Mini Shop</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                onClick={onCartClick}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-2">
                <User size={20} />
                <span className="text-sm">{profile?.full_name || user.email}</span>
                <button
                  onClick={signOut}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
