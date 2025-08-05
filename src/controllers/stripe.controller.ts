import { Request, Response } from "express";
import axios from "axios";
import Stripe from "stripe";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import User from "../models/user.model";
import { UserRequest } from "../interfaces/user.interface";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

const STRIPE_API_VERSION = "2025-06-30.preview";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const createRecipientForDirectBankTransfer = async (
  req: Request,
  res: Response
) => {
  if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
  }
  const user = await User.findById((req as UserRequest).user._id);
  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("User not found"));
  }

  try {
    // 1. Create recipient account on Stripe Global Payouts API
    const createResp = await axios.post(
      "https://api.stripe.com/v2/core/accounts",
      {
        contact_email: user.email,
        display_name: user.name || user.username || "Anonymous User",
        identity: {
          country: "GB",
          // country: "US",
          entity_type: "individual",
        },
        configuration: {
          recipient: {
            capabilities: {
              bank_accounts: {
                local: { requested: true },
              },
            },
          },
        },
        include: ["identity", "configuration.recipient", "requirements"],
      },
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview", // Required preview version
        },
      }
    );

    const recipient = createResp.data;

    // Save recipient ID in user model
    user.recipientId = recipient.id;
    await user.save();

    return res.status(HTTP_STATUS.OK).send(
      success("Recipient created successfully", {
        recipientId: recipient.id,
        requirements: recipient.requirements, // useful for front-end to collect more info if needed
      })
    );
  } catch (error: any) {
    console.error(
      "Error creating recipient (error):",
      error.response?.data || error.message || error
    );
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure(
          "Failed to create recipient",
          error.response?.data || error.message
        )
      );
  }
};

const updateRecipientForDirectBankTransfer = async (
  req: Request,
  res: Response
) => {
  if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
  }

  const user = await User.findById((req as UserRequest).user._id);
  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("User not found"));
  }

  if (!user.recipientId) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Recipient account not found for user"));
  }

  const {
    first_name,
    last_name,
    address_line1,
    city,
    state,
    postal_code,
    country,
  } = req.body;

  if (
    !first_name ||
    !last_name ||
    !address_line1 ||
    !city ||
    !state ||
    !postal_code ||
    !country
  ) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("All required fields must be provided"));
  }

  try {
    // Make update call to Stripe Global Payouts API
    const updateResp = await axios.post(
      `https://api.stripe.com/v2/core/accounts/${user.recipientId}`,
      {
        identity: {
          individual: {
            given_name: first_name,
            surname: last_name,
            address: {
              line1: address_line1,
              city,
              state,
              postal_code,
              country,
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview",
        },
      }
    );

    const updatedRecipient = updateResp.data;

    console.log("Updated recipient:", updatedRecipient);

    if (!updatedRecipient || !updatedRecipient.id) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to update recipient"));
    }

    return res.status(HTTP_STATUS.OK).send(
      success("Recipient info updated successfully", {
        recipientId: updatedRecipient.id,
        requirements: updatedRecipient.requirements,
      })
    );
  } catch (error: any) {
    console.error(
      "Error updating recipient:",
      error.response?.data || error.message
    );
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure(
          "Failed to update recipient",
          error.response?.data || error.message
        )
      );
  }
};

const attachBankAccountToRecipient = async (req: Request, res: Response) => {
  if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
  }

  const user = await User.findById((req as UserRequest).user._id);
  if (!user || !user.recipientId) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Recipient not found"));
  }

  const { routing_number, account_number } = req.body;

  if (!routing_number || !account_number) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Routing number and account number are required"));
  }

  try {
    const vaultResp = await axios.post(
      "https://api.stripe.com/v2/core/vault/us_bank_accounts",
      {
        routing_number,
        account_number,
      },
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Stripe-Version": STRIPE_API_VERSION,
          "Stripe-Context": user.recipientId,
          "Content-Type": "application/json",
        },
      }
    );

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Bank account attached successfully", vaultResp.data));
  } catch (error: any) {
    console.error("Vault error:", error.response?.data || error.message);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure(
          "Failed to attach bank account",
          error.response?.data || error.message
        )
      );
  }
};

const setDefaultPayoutMethod = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as UserRequest).user._id);
    if (!user || !user.recipientId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Missing recipient ID"));
    }

    const { bankAccountId, currency = "usd" } = req.body;
    console.log("bankAccountId:", bankAccountId);
    console.log("currency:", currency);
    const response = await axios.post(
      `https://api.stripe.com/v2/core/recipients/${user.recipientId}/payout_methods`,
      {
        type: "financial_account",
        financial_account: bankAccountId,
        currency: currency.toLowerCase(),
        is_default: true,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview",
        },
      }
    );

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Default payout method set", response.data));
  } catch (error: any) {
    console.error(
      "Set default payout method error:",
      error.response?.data || error.message
    );
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure(
          "Failed to set default payout method",
          error.response?.data || error.message
        )
      );
  }
};

const createTestBankAccountGBP = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const user = await User.findById((req as UserRequest).user._id);
    if (!user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("User not found"));
    }
    if (!user.recipientId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Recipient ID not found for user"));
    }
    const recipientId = user.recipientId;
    const response = await axios.post(
      `https://api.stripe.com/v2/test_helpers/recipients/${recipientId}/payout_methods`,
      {
        type: "financial_account",
        currency: "gbp",
        is_default: true,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview",
        },
      }
    );
    console.log("✅ Test GBP bank account created:");
    console.log(response.data); // Contains `usba_...` ID

    return res.status(HTTP_STATUS.OK).send(
      success("Test GBP bank account created successfully", {
        id: response.data.id,
      })
    );
  } catch (error: any) {
    console.error("❌ Error creating test GBP bank account:");
    console.error(error.response?.data || error.message);

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure(
          "Failed to create test GBP bank account",
          error.response?.data || error.message
        )
      );
  }
};

const getPayoutMethodId = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }

    const user = await User.findById((req as UserRequest).user._id);
    if (!user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("User not found"));
    }

    const { recipientId } = user;
    if (!recipientId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Missing recipient ID"));
    }

    const response = await axios.get(
      `https://api.stripe.com/v2/money_management/recipients/${recipientId}/payout_methods`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview",
        },
      }
    );

    const payoutMethods = response.data?.data;
    if (!payoutMethods || payoutMethods.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No payout methods found"));
    }

    const payoutMethodId = payoutMethods[0].id;

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Payout method ID fetched", { payoutMethodId }));
  } catch (error: any) {
    console.error(
      "Payout method fetch error:",
      error.response?.data || error.message
    );
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure(
          "Failed to get payout method ID",
          error.response?.data || error.message
        )
      );
  }
};

const sendPayoutToRecipient = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
  }

  const user = await User.findById((req as UserRequest).user._id);
  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("User not found"));
  }

  const { recipientId } = user;
  const {
    amount, // must be number (e.g. 500 for $5)
    bankAccountId,
    currency = "usd",
    description = "Payout from platform",
  } = req.body;

  const platformFinancialAccountId =
    process.env.STRIPE_PLATFORM_FINANCIAL_ACCOUNT_ID;

  if (!recipientId || !amount || !platformFinancialAccountId) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Missing recipient ID, amount, or financial account ID"));
  }

  console.log("currency:", currency);

  try {
    const payoutResponse = await axios.post(
      "https://api.stripe.com/v2/money_management/outbound_payments",
      {
        amount: {
          value: Number(amount),
          currency: currency.toLowerCase(),
          // currency: "usd",
        },
        description,
        from: {
          financial_account: platformFinancialAccountId,
          currency: currency.toLowerCase(),
          // currency: "usd",
        },
        to: {
          recipient: recipientId,
          payout_method: bankAccountId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview",
        },
      }
    );

    return res.status(HTTP_STATUS.OK).send(
      success("Payout sent successfully", {
        payoutId: payoutResponse.data.id,
        status: payoutResponse.data.status,
      })
    );
  } catch (error: any) {
    console.error("Payout error:", error.response?.data || error.message);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure("Failed to send payout", error.response?.data || error.message)
      );
  }
};

const getFinancialAccounts = async (req: Request, res: Response) => {
  try {
    const financialAccounts = await axios.get(
      "https://api.stripe.com/v2/money_management/financial_accounts",
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview",
        },
      }
    );

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Financial accounts fetched", financialAccounts.data));
  } catch (error: any) {
    console.error("Error fetching financial accounts:", error.message);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to fetch financial accounts", error.message));
  }
};

const getFinancialAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const financialAccount = await axios.get(
      `https://api.stripe.com/v2/money_management/financial_addresses`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-07-30.preview",
        },
      }
    );

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Financial account fetched", financialAccount.data));
  } catch (error: any) {
    console.error("Error fetching financial account:", error.message);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to fetch financial account", error.message));
  }
};

export {
  createRecipientForDirectBankTransfer,
  updateRecipientForDirectBankTransfer,
  attachBankAccountToRecipient,
  setDefaultPayoutMethod,
  getPayoutMethodId,
  createTestBankAccountGBP,
  sendPayoutToRecipient,
  getFinancialAccounts,
  getFinancialAddress,
};
