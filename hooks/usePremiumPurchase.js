import { useEffect } from 'react';
import * as InAppPurchases from 'expo-in-app-purchases';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../contexts/UserContext';

const PRODUCT_ID = 'premium_access';

export default function usePremiumPurchase() {
  const { user, updateUser } = useUser();

  useEffect(() => {
    let purchaseListener;
    const setup = async () => {
      try {
        await InAppPurchases.connectAsync();
        purchaseListener = InAppPurchases.setPurchaseListener(async ({ responseCode, results }) => {
          if (responseCode === InAppPurchases.IAPResponseCode.OK) {
            for (const purchase of results) {
              if (!purchase.acknowledged) {
                await InAppPurchases.finishTransactionAsync(purchase, true);
                if (user?.uid) {
                  await updateDoc(doc(db, 'users', user.uid), { isPremium: true });
                  updateUser({ isPremium: true });
                }
              }
            }
          }
        });
      } catch (e) {
        console.log('IAP setup failed', e);
      }
    };
    setup();
    return () => {
      if (purchaseListener) purchaseListener.remove();
      InAppPurchases.disconnectAsync();
    };
  }, [user?.uid, updateUser]);

  const purchase = async () => {
    try {
      await InAppPurchases.getProductsAsync([PRODUCT_ID]);
      await InAppPurchases.purchaseItemAsync(PRODUCT_ID);
    } catch (e) {
      console.warn('Purchase error', e);
    }
  };

  return { purchase };
}
