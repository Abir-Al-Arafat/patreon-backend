import Stripe from "stripe";
import { Request, Response } from "express";
import axios from "axios";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import User from "../models/user.model";
import Service from "../models/service.model";

import { UserRequest } from "../interfaces/user.interface";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const createPaddleCheckout = async (req: Request, res: Response) => {
  try {
    const { customer_email, price, product_name } = req.body;

    const response = await axios.post(
      "https://sandbox-api.paddle.com/checkout/sessions",
      {
        customer: {
          email: customer_email,
        },
        items: [
          {
            price_id: price, // this should be a Paddle `price_id`, not a raw number
            quantity: 1,
          },
        ],
        return_url: "https://yourdomain.com/thank-you",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(HTTP_STATUS.OK).send(
      success("Paddle checkout session created", {
        checkout_url: response.data.data.checkout_url,
      })
    );
  } catch (err: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(
        failure(
          "Failed to create Paddle checkout",
          err?.response?.data || err.message
        )
      );
  }
};

// Controller to create Stripe Connect onboarding link for contributors
const createStripeAccountLink = async (req: Request, res: Response) => {
  try {
    if ((req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as UserRequest).user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    if (!user.stripeAccountId) {
      // Create a new Express account for the contributor
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      console.log("Stripe account:", account);

      if (!account.id) {
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .send(failure("Failed to create Stripe account"));
      }

      user.stripeAccountId = account.id;
      await user.save();
    }

    if (!process.env.CLIENT_URL) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Client URL is not configured"));
    }

    // Create an account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/onboarding/refresh`,
      return_url: `${process.env.CLIENT_URL}/onboarding/complete`,
      type: "account_onboarding",
    });

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Onboarding link created", { url: accountLink.url }));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to create onboarding link", error.message));
  }
};

// Controller to handle subscriptions with split payments via Stripe Connect
const subscribeToService = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    if (!req.params.serviceId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service ID is required"));
    }
    const { serviceId } = req.params;
    const userId = (req as UserRequest).user._id; // assumed from auth middleware

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("User ID is required"));
    }

    const service = await Service.findById(serviceId).populate("contributor");
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }

    if (!service.price || service.price <= 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Invalid service price"));
    }

    if (!service.contributor || !service.contributor._id) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service does not have a contributor"));
    }

    const contributor: any = service.contributor;
    const admin = await User.findOne({ roles: { $in: ["admin"] } });

    if (!admin) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Admin not found"));
    }

    if (!contributor.stripeAccountId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Contributor has not completed Stripe onboarding"));
    }

    const totalAmount = service.price * 100; // Stripe expects cents
    const adminShare = Math.floor(totalAmount * 0.2);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      payment_method_types: ["card"],
      application_fee_amount: adminShare,
      transfer_data: {
        destination: contributor.stripeAccountId,
      },
      metadata: {
        serviceId: service._id.toString(),
        contributorId: contributor._id.toString(),
        adminId: admin._id.toString(),
        userId: userId.toString(), // Store the user ID who is subscribing,
      },
    });

    if (!paymentIntent || !paymentIntent.client_secret) {
      console.error("Payment Intent creation failed:", paymentIntent);
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to create payment intent"));
    }

    console.log("Payment Intent created:", paymentIntent);

    return res.status(HTTP_STATUS.OK).send(
      success("Payment intent created", {
        clientSecret: paymentIntent.client_secret,
      })
    );
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Subscription failed", error.message));
  }
};

// Webhook handler for Stripe
const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const metadata = event.data.object.metadata;
    const { userId, serviceId } = metadata;

    await Service.findByIdAndUpdate(serviceId, {
      $addToSet: { subscribers: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { subscriptions: serviceId },
    });
  }

  res.status(200).json({ received: true });
};

export {
  createPaddleCheckout,
  createStripeAccountLink,
  subscribeToService,
  handleStripeWebhook,
};
