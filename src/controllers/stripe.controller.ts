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

// const financialAccounts = async () => {
//   try {
//     const financialAccounts = await stripe.v2.moneyManagement.financialAccounts.list();
//   } catch (error: any) {
//     console.error("Error fetching financial accounts:", error.message);
//   }
// };

// const createRecipient = async (req: Request, res: Response) => {
//   if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
//     return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
//   }
//   const user = await User.findById((req as UserRequest).user._id);
//   if (!user) {
//     return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("User not found"));
//   }

//   try {
//     const account = await stripe.v2.core.accounts.create({
//   contact_email: 'jenny.rosen@example.com',
//   display_name: 'Jenny Rosen',
//   identity: {
//     country: 'us',
//     entity_type: 'individual',
//   },
//   configuration: {
//     recipient: {
//       capabilities: {
//         bank_accounts: {
//           local: {
//             requested: true,
//           },
//         },
//       },
//     },
//   },
//   include: ['identity', 'configuration.recipient', 'requirements'],
// });
//     return res.status(HTTP_STATUS.OK).send(success("Financial accounts fetched successfully", account));
//   } catch (error: any) {
//     console.error("Error fetching financial accounts:", error.message);
//     return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(failure("Failed to fetch financial accounts", error.message));
//   }
// };

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
          country: "US",
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

// const sendPayoutToRecipient = async (req: Request, res: Response) => {
//   if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
//     return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
//   }

//   const user = await User.findById((req as UserRequest).user._id);
//   if (!user || !user.recipientId) {
//     return res
//       .status(HTTP_STATUS.BAD_REQUEST)
//       .send(failure("Recipient not found"));
//   }

//   let { amount, currency, financialAccountId } = req.body;

//   financialAccountId = `fa_test_${Math.random().toString(36).substr(2, 14)}`;

//   if (!amount || !currency || !financialAccountId) {
//     return res
//       .status(HTTP_STATUS.BAD_REQUEST)
//       .send(failure("Amount, currency, and financial account ID are required"));
//   }

//   try {
//     const payoutResp = await axios.post(
//       "https://api.stripe.com/v2/core/outbound_payments",
//       {
//         amount,
//         currency,
//         recipient: {
//           id: user.recipientId,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
//           "Stripe-Version": STRIPE_API_VERSION,
//           "Stripe-Context": financialAccountId,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Payout sent successfully", payoutResp.data));
//   } catch (error: any) {
//     console.error("Payout error:", error.response?.data || error.message);
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(
//         failure("Failed to send payout", error.response?.data || error.message)
//       );
//   }
// };
// const sendPayoutToRecipient = async (req: Request, res: Response) => {
//   if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
//     return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
//   }

//   const user = await User.findById((req as UserRequest).user._id);
//   if (!user) {
//     return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("User not found"));
//   }

//   // You should store this in DB when attaching bank account
//   const { recipientId } = user;
//   const {
//     amount,
//     currency = "usd",
//     description = "Payout from platform",
//     bankAccountId,
//   } = req.body;

//   if (!recipientId || !bankAccountId || !amount) {
//     return res
//       .status(HTTP_STATUS.BAD_REQUEST)
//       .send(failure("Missing recipient, bank account ID, or amount"));
//   }

//   try {
//     const payoutResponse = await axios.post(
//       // "https://api.stripe.com/v2/core/payouts",
//       "https://api.stripe.com/v2/core/recipient_transfers",
//       {
//         amount, // e.g. 500 for $5.00
//         currency,
//         destination: bankAccountId, // e.g. usba_...
//         description,
//         recipient: recipientId,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
//           "Content-Type": "application/json",
//           "Stripe-Version": "2025-03-31.preview", // Required for Global Payouts
//         },
//       }
//     );

//     return res.status(HTTP_STATUS.OK).send(
//       success("Payout sent successfully", {
//         payoutId: payoutResponse.data.id,
//         status: payoutResponse.data.status,
//       })
//     );
//   } catch (error: any) {
//     console.error("Payout error:", error.response?.data || error.message);
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(
//         failure("Failed to send payout", error.response?.data || error.message)
//       );
//   }
// };

const sendPayoutToRecipient = async (req: Request, res: Response) => {
  if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
  }

  const user = await User.findById((req as UserRequest).user._id);
  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("User not found"));
  }

  const { recipientId } = user;
  const {
    amount,
    currency = "usd",
    description = "Payout from platform",
    bankAccountId, // usba_...
  } = req.body;

  if (!recipientId || !bankAccountId || !amount) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Missing recipient, bank account ID, or amount"));
  }

  try {
    const payoutResponse = await axios.post(
      "https://api.stripe.com/v2/core/outbound_payments", // ✅ Correct endpoint
      {
        amount,
        currency,
        destination: bankAccountId,
        description,
        recipient: recipientId,
      },
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview", // ✅ Required for Global Payouts
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
    const financialAccounts = await stripe.treasury.financialAccounts.list({
      limit: 10,
    });

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

export {
  createRecipientForDirectBankTransfer,
  updateRecipientForDirectBankTransfer,
  attachBankAccountToRecipient,
  sendPayoutToRecipient,
  getFinancialAccounts,
};
