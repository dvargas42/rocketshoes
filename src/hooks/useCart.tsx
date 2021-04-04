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
      const stockProduct: Stock = await api.get(`stock/${productId}`)
        .then(response => response.data)
      
      const cartProduct = cart.find(product => product.id === productId)

      if (!cartProduct) {
        const product = await api.get(`products/${productId}`)
        .then(response => response.data)

        const newProduct: Product = { ...product, amount: 1 }

        setCart([...cart, newProduct])

      } else if (stockProduct.amount >= cartProduct.amount + 1) {
        const newProduct = { ...cartProduct }
        newProduct.amount += 1;

        const newCart = cart.filter(product => {
          if (product.id !== productId)
            return product;
          else
            return newProduct;
        })
        setCart(newCart);
        
      } else {
        throw 'Quantidade solicitada fora de estoque'
      }
    
    } catch (e) {
      if (e.name) {
        toast.error( 'Erro na adição de produto' )
      } else {
        toast.error(e)
      }
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId)
      setCart(newCart)

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockProductAmount = await api.get( `stock/${productId}` )
        .then(response => response.data.amount)

      const cartProduct = cart.find( product => product.id === productId )

      if (!cartProduct) {
        throw 'Erro na alteração de quantidade do produto'

      } else if (amount + cartProduct.amount <= stockProductAmount) {
        const newCartProduct = { ...cartProduct }
        newCartProduct.amount += amount;

        const newCart = cart.filter( product => {
          if (product.id !== productId)
            return product;
          else
            return newCartProduct
        })
        setCart(newCart)

      } else {
        throw 'Erro na alteraação de quantidade do produto'
      }

    } catch (e){
      toast.error(e)
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
