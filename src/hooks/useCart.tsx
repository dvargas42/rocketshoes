import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  localStorage.setItem('@RocketShoes:cart', JSON.stringify( cart ))

  const addProduct = async (productId: number) => {
    try {
      const stockProductAmount = await api.get(`stocks/${productId}`)
        .then(response => response.data.amount)
      
      const cartProductIndex = cart.findIndex(product => product.id === productId)

      if (cartProductIndex === -1){
        const productData: Product = await api.get(`products/${productId}`)
          .then(response => response.data)

        setCart( [...cart, {...productData, amount: 1}] )

      } else if (cart[ cartProductIndex ].amount + 1 <= stockProductAmount) {
          const newCart = cart.filter( product => product.id !== productId )
          const newProduct = {...cart[ cartProductIndex ]}

          newProduct.amount += 1
          
          setCart([...newCart, newProduct])

      } else {
        throw 'Quantidade solicitada fora de estoque'
      }
     
    } catch (e) {
      if (e.name) {
        toast.error('Erro na adição de produto')
      } else {
        toast.error(e)
      }
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
