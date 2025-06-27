import Stripe from "stripe";

import { Request, Response } from "express";
import axios from "axios";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import User from "../models/user.model";
import Service from "../models/service.model";
import Transaction from "../models/transaction.model";

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
    console.log(
      "Creating Stripe account link...",
      req.body,
      (req as UserRequest).user
    );
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as UserRequest).user._id;
    const user = await User.findById(userId);

    if (!user || !user.email) {
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

const getConnectedAccount = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as UserRequest).user._id;
    const user = await User.findById(userId);

    if (!user || !user.stripeAccountId) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Stripe account retrieved", account));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to get Stripe account", error.message));
  }
};

const onboardingComplete = async (req: Request, res: Response) => {
  try {
    return res.status(HTTP_STATUS.OK).send(success("Onboarding Completed"));
    // if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    //   return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    // }
    // const userId = (req as UserRequest).user._id;
    // const user = await User.findById(userId);

    // if (!user || !user.stripeAccountId) {
    //   return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    // }

    // const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // if (!account) {
    //   return res
    //     .status(HTTP_STATUS.NOT_FOUND)
    //     .send(failure("Stripe account not found"));
    // }

    // if (account.details_submitted) {
    //   return res
    //     .status(HTTP_STATUS.BAD_REQUEST)
    //     .send(failure("Account details already submitted"));
    // }

    // await stripe.accounts.update(user.stripeAccountId, {
    //   capabilities: {
    //     transfers: { requested: true },
    //   },
    // });

    // return res
    //   .status(HTTP_STATUS.OK)
    //   .send(success("Account details submitted"));
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      success: false,
      message: "Failed to complete onboarding",
      error: error.message,
    });
  }
};

const onboardingRefresh = async (req: Request, res: Response) => {
  try {
    return res.status(HTTP_STATUS.OK).send(success("Onboarding Refreshed"));
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      success: false,
      message: "Failed to refresh onboarding",
      error: error.message,
    });
  }
};

const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    if (!(req as any).user || !(req as any).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as any).user?._id;
    const { serviceId } = req.params;

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("User ID is required"));
    }

    if (!serviceId) {
      return res
        .status(400)
        .json({ success: false, message: "Service ID is required" });
    }

    const service = await Service.findById(serviceId).populate("contributor");

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    if (!service.price || service.price <= 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(failure("Invalid service price"));
    }

    const user = await User.findById(userId);
    const contributor: any = service.contributor;

    if (!contributor || !contributor.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: "Contributor has not completed Stripe onboarding",
      });
    }

    const totalAmount = service.price * 100;
    const adminShare = Math.floor(totalAmount * 0.2); // 20% admin cut
    const admin = await User.findOne({ roles: { $in: ["admin"] } });
    if (!admin) {
      return res
        .status(500)
        .json({ success: false, message: "Admin account not found" });
    }

    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ["card"],
    //   mode: "payment",
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: "usd",
    //         unit_amount: service.price! * 100,
    //         product_data: {
    //           name: service.title,
    //           description: service.description,
    //         },
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   success_url: `${process.env.CLIENT_URL}?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.CLIENT_URL}`,
    //   metadata: {
    //     userId: userId.toString(),
    //     serviceId: service._id.toString(),
    //     contributorId: contributor?._id.toString(),
    //   },
    // } as Stripe.Checkout.SessionCreateParams);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // or contributor.preferredCurrency
            unit_amount: totalAmount,
            product_data: {
              name: service.title,
              description: service.title,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}`,
      metadata: {
        userId: userId.toString(),
        serviceId: service._id.toString(),
        contributorId: contributor._id.toString(),
        adminId: admin._id.toString(),
      },
      payment_intent_data: {
        application_fee_amount: adminShare,
        transfer_data: {
          destination: contributor.stripeAccountId,
        },
      },
    } as Stripe.Checkout.SessionCreateParams);

    return res.status(HTTP_STATUS.OK).json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Session error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

const generatestripeExpressAccountLoginLink = async (
  req: Request,
  res: Response
) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as UserRequest).user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    if (!user.stripeAccountId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not have a Stripe express account"));
    }

    const loginLink = await stripe.accounts.createLoginLink(
      user.stripeAccountId
    );

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Stripe account link created", { url: loginLink.url }));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to create Stripe account link", error.message));
  }
};

// Controller to handle subscriptions with split payments via Stripe Connect
const subscribeToService = async (req: Request, res: Response) => {
  try {
    console.log("Subscribing to service...");
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

    console.log("Service found:", service);

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
  console.log("sig", sig);
  if (!sig) {
    return res.status(400).send("Missing Stripe signature");
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send("Stripe webhook secret is not configured");
  }
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  console.log("req.body", req.body);
  console.log("event", event);
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Webhook event received:", event);

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    if (event.type === "payment_intent.created") {
      console.log("✅ PaymentIntent created:", paymentIntent.id);

      // Log to DB
      const newTransaction = await Transaction.create({
        paymentIntentId: paymentIntent.id,
        userId: paymentIntent.metadata?.userId || null,
        serviceId: paymentIntent.metadata?.serviceId || null,
        amount: paymentIntent.amount,
        status: "created",
        metadata: paymentIntent.metadata || {},
      });

      if (!newTransaction) {
        console.error("Failed to create transaction");
      }

      console.log("Transaction created:", newTransaction);
    }

    if (event.type === "payment_intent.succeeded") {
      const metadata = event.data.object.metadata;
      const { userId, serviceId } = metadata;

      const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        {
          $addToSet: { subscribers: userId },
        },
        { new: true }
      );

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { subscriptions: serviceId },
        },
        { new: true }
      );
      console.log("Service updated:", updatedService);
      console.log("User updated:", updatedUser);

      if (!updatedService || !updatedUser) {
        return res.status(404).send("Service or User not found");
      }

      // Update transaction status to succeeded
      let updatedTransaction = await Transaction.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { status: "succeeded" },
        { new: true }
      );
      if (!updatedTransaction) {
        console.error("Transaction not found for update");
        console.log("Creating new transaction for succeeded payment intent");
        updatedTransaction = await Transaction.create({
          paymentIntentId: paymentIntent.id,
          userId: paymentIntent.metadata?.userId || null,
          serviceId: paymentIntent.metadata?.serviceId || null,
          amount: paymentIntent.amount,
          status: "succeeded",
          metadata: paymentIntent.metadata || {},
        });
      }
      console.log("Transaction updated:", updatedTransaction);
    }

    if (event.type === "payment_intent.payment_failed") {
      console.warn("⚠️ PaymentIntent failed:", paymentIntent.id);
    }

    if (event.type === "payment_intent.canceled") {
      console.warn("⚠️ PaymentIntent canceled:", paymentIntent.id);
    }

    if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;
      console.log("✅ Charge succeeded:", charge.id);
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find({}).sort({ createdAt: -1 });
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Transactions found", transactions));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to get transactions", error.message));
  }
};

const getTransactionById = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Transaction found", transaction));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to get transaction", error.message));
  }
};

const getTransactionByUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = (req as UserRequest).user._id;
    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("User ID is required"));
    }

    const { month } = req.query;
    let query: any = { userId };
    if (month) {
      const monthNumber = Number(month);
      if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 5) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .send(failure("Month has to be a number and between 1 and 5"));
      }
      const date = new Date();
      date.setMonth(date.getMonth() - monthNumber + 1);
      date.setDate(1); // Set to the first day of the month
      query.createdAt = { $gte: date };
    }

    const transactions = await Transaction.find(query).sort({
      createdAt: -1,
    });

    const totalTransactions = transactions.reduce(
      (total, curr) => total + curr.amount!,
      0
    );

    return res
      .status(HTTP_STATUS.OK)
      .send(
        success(
          `Transactions found for user${
            month
              ? ` in last ${month} month${Number(month) > 1 ? "s" : ""}`
              : ""
          }`,
          { totalTransactions, transactions }
        )
      );
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to get user transactions", error.message));
  }
};

const createTransaction = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const user = await User.findById((req as UserRequest).user._id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const { serviceId, amount, status } = req.body;
    if (!serviceId || !amount || !status) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide serviceId, amount, and status"));
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }

    if (!["created", "succeeded", "failed"].includes(status)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Invalid status value"));
    }

    const transaction = await Transaction.create({
      paymentIntentId: req.body.paymentIntentId || null,
      userId: (req as UserRequest).user._id,
      serviceId,
      amount,
      status,
    });

    console.log("Transaction created:", transaction);

    if (!transaction) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to create transaction"));
    }

    service.subscribers.push((req as any).user._id);

    await service.save();

    if (user) {
      user.subscriptions.push(serviceId);
      await user.save();
    }

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Transaction created and user subscribed", transaction));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to create transaction", error.message));
  }
};

const deleteStripeConnectAccount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as UserRequest).user._id;
    const user = await User.findById(userId);

    if (!user || !user.stripeAccountId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User or Stripe account not found"));
    }

    await stripe.accounts.del(user.stripeAccountId);
    user.stripeAccountId = null;
    await user.save();

    return res.status(HTTP_STATUS.OK).send(success("Stripe account deleted"));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to delete Stripe account", error.message));
  }
};

export {
  createPaddleCheckout,
  createStripeAccountLink,
  subscribeToService,
  handleStripeWebhook,
  getAllTransactions,
  getTransactionById,
  getTransactionByUser,
  createCheckoutSession,
  createTransaction,
  onboardingComplete,
  onboardingRefresh,
  deleteStripeConnectAccount,
  getConnectedAccount,
  generatestripeExpressAccountLoginLink,
};
