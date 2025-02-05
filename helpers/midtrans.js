import midtransClient from "midtrans-client";

// Initialize Midtrans client
const midtrans = new midtransClient.Snap({
  isProduction: false, // Change to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * Create a payment transaction
 * @param {Object} transactionDetails
 */
export const createTransaction = async (transactionDetails) => {
  try {
    const transaction = await midtrans.createTransaction(transactionDetails);
    return transaction;
  } catch (error) {
    console.error(">>> Midtrans Error:", error);
    throw error;
  }
};

/**
 * Verify transaction status
 * @param {string} orderId
 */
export const getTransactionStatus = async (orderId) => {
  console.log("🚀 ~ getTransactionStatus ~ orderId:", orderId);
  try {
    // console.log(
    //   ">>????"
    //   // await midtrans.transaction.status(
    //   //   "SUB-679e41f0d75ac680b2a51eb4-1738430536113"
    //   // )
    //   // await midtrans.transaction.status(
    //   //   "SUB-679e0287f719ef5ef6f8a7df-1738496146793"
    //   // )
    // );

    const status = await midtrans.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error("Midtrans Error: >>>", error);
    throw error;
  }
};
