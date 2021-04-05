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

  const addProduct = async (productId: number) => {
    try {
      const stockProduct: Stock = await api.get(`stock/${productId}`)
      .then(response => response.data)

      const cartProduct = cart.find(product => product.id === productId)

      if (!cartProduct) {
        const product: Product = await api.get(`products/${productId}`)
        .then(response => response.data)

        const newProduct: Product = { ...product, amount: 1 }

        setCart([...cart, newProduct])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))

      } else if (stockProduct.amount >= cartProduct.amount + 1) {
        cartProduct.amount += 1

        const newCart = cart.filter(product => {
          if (product.id !== productId)
            return product;
          else
            return cartProduct;
        })
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      } else {
        throw 'Quantidade solicitada fora de estoque'
      }
    
    } catch (e) {
      if (e.name) {
        toast.error( 'Erro na adição do produto' )
      } else {
        toast.error(e)
      }
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId)

      if (cartProduct) {
        const newCart = cart.filter(product => product.id !== productId)

        setCart(newCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      } else {
        throw 'Erro na remoção do produto'
      }
    } catch (e) {
      toast.error(e)
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockProduct: Stock = await api.get( `stock/${productId}` )
        .then(response => response.data)
      
      if (amount <= 0) {
        return;

      } else if (stockProduct.amount < amount) {
        throw 'Quantidade solicitada fora de estoque'
        

      } else  {
        const cartProduct = cart.find(product => product.id === productId)

        if (cartProduct) {
          cartProduct.amount = amount
        }

        const newCart = cart.filter( product => {
          if (product.id !== productId)
            return product;
          else
            return cartProduct
        })
        setCart(newCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } 

    } catch (e){
      if (e.name) {
        toast.error( 'Erro na alteração de quantidade do produto' )
      } else {
        toast.error(e)
      }
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
