import { Request, Response } from "express";
import axios from "axios";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import User from "../models/user.model";
import { UserRequest } from "../interfaces/user.interface";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

const STRIPE_API_VERSION = "2025-06-30.preview";

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

export {
  createRecipientForDirectBankTransfer,
  updateRecipientForDirectBankTransfer,
  attachBankAccountToRecipient,
};
