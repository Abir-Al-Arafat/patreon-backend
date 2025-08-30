import transactionModel from "../models/transaction.model";

const createTransaction = async (transaction: any) => {
  return await transactionModel.create(transaction);
};

export { createTransaction };
