import React from 'react';
import { useParams } from 'react-router-dom';
import { MenuItem } from '../components/Menu';
import { Header } from '../components/Header';
import { Cart } from '../components/Cart';
import { useCart } from '../hooks/useCart';
import { useMenu } from '../hooks/useMenu';

interface BranchMenuPageProps {
  branchId?: string;
}

export const BranchMenuPage: React.FC<BranchMenuPageProps> = ({ branchId }) => {
  const { branchId: paramBranchId } = useParams<{ branchId: string }>();
  const currentBranchId = branchId || paramBranchId || '';
  
  const { cartItems, addToCart, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart();
  const { menuItems, categories, loading, error } = useMenu();
  
  // Determine if this is مستر كريسبي based on branch or restaurant context
  const isMisterCrispy = true; // This should be determined based on the actual branch/restaurant data

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#55421A] mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل القائمة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">حدث خطأ في تحميل القائمة</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#55421A] text-white px-4 py-2 rounded-lg hover:bg-[#3d2f12]"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Menu 
          menuItems={menuItems}
          categories={categories}
          onAddToCart={addToCart}
          isMisterCrispy={isMisterCrispy}
        />
      </main>
      <Cart
        items={cartItems}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        totalPrice={getTotalPrice()}
        totalItems={getTotalItems()}
      />
    </div>
  );
};