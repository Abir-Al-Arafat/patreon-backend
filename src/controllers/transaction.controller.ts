import Stripe from "stripe";
import { ObjectId } from "mongoose";
import { Request, Response } from "express";
import axios from "axios";
import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";
import User from "../models/user.model";
import Service from "../models/service.model";
import Transaction from "../models/transaction.model";
import Notification from "../models/notification.model";

import { createTransaction as createTransactionService } from "../services/transaction.service";

import { getWalletByUserId } from "../services/wallet.service";
import { getUserById } from "../services/user.service";
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

const createStripeCustomConnectAccount = async (
  req: Request,
  res: Response
) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as UserRequest).user._id;
    const user = await User.findById(userId);

    if (!user || !user.email) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    // if (user.stripeCustomConnectAccountId) {
    //   return res
    //     .status(HTTP_STATUS.BAD_REQUEST)
    //     .send(failure("Custom Connect account already exists"));
    // }

    const account = await stripe.accounts.create({
      type: "custom",
      country: "US", // or the country of the user
      email: user.email,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log("Stripe custom account:", account);

    if (!account.id) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to create Stripe account"));
    }

    user.stripeCustomConnectAccountId = account.id;
    await user.save();
    if (!process.env.CLIENT_URL) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Client URL is not configured"));
    }
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeCustomConnectAccountId,
      refresh_url: `${process.env.CLIENT_URL}/onboarding/refresh`,
      return_url: `${process.env.CLIENT_URL}/onboarding/complete`,
      type: "account_onboarding",
    });

    console.log("Account link:", accountLink);

    if (accountLink.url) {
      return res.status(HTTP_STATUS.OK).send(
        success("Onboarding link created", {
          url: accountLink.url,
        })
      );
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("successfully created custom connect account", account));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to create onboarding link", error.message));
  }
};

const getStripeCustomConnectAccountByUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId = (req as UserRequest).user._id;
    const user = await User.findById(userId);

    if (!user || !user.stripeCustomConnectAccountId) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const account = await stripe.accounts.retrieve(
      user.stripeCustomConnectAccountId
    );

    if (!account) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Stripe account not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Stripe account retrieved", account));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to get Stripe account", error.message));
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

    if (!account) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Stripe account not found"));
    }

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

    const user = await getUserById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    if (!serviceId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service ID is required"));
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

    const contributor: any = service.contributor;

    if (!contributor) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Contributor not found"));
    }

    const totalAmount = service.price * 100;

    if (!contributor.stripeAccountId) {
      if (!contributor.wallet) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .send(
            failure(
              "service is not available yet",
              "Contributor has not completed Stripe onboarding and does not have a wallet too"
            )
          );
      }

      const wallet = await getWalletByUserId(contributor._id);

      if (!wallet) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .send(
            failure(
              "service is not available yet",
              "Contributor has not completed Stripe onboarding and does not have a wallet too"
            )
          );
      }

      const contributorShare = Math.floor(totalAmount * 0.7);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "gbp",
              unit_amount: service.price! * 100,
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
          contributorId: contributor?._id.toString(),
        },
      } as Stripe.Checkout.SessionCreateParams);

      if (!session || !session.url) {
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .send(failure("Failed to create checkout session"));
      }

      // wallet.balance += contributorShare / 100;
      // await wallet.save();

      // const notification = new Notification({
      //   contributor: contributor._id,
      //   // admin: admin._id,
      //   serviceId: service._id,
      //   user: userId,
      //   message: `payment received for service: ${service.title}`,
      //   type: "wallet",
      // });

      // await notification.save();

      return res
        .status(HTTP_STATUS.OK)
        .json({ success: true, url: session.url });
    }

    const adminShare = Math.floor(totalAmount * 0.3); // 30% admin cut
    const admin = await User.findOne({ roles: { $in: ["admin"] } });
    if (!admin) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Admin account not found"));
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            // currency: "usd", // or contributor.preferredCurrency
            currency: "gbp", // or contributor.preferredCurrency
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
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to create checkout session", error.message));
  }
};

const getUserCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide session id"));
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paidCurrency =
      session.presentment_details?.presentment_currency || session.currency;
    const paidAmount = session.amount_total; // in smallest unit of paidCurrency

    let amountInGBP = paidAmount;

    // if (paidCurrency?.toLowerCase() !== "gbp") {
    //   const exchangeRates = await stripe.exchangeRates.list();
    //   const rates = exchangeRates.data[0].rates; // base is USD

    //   const usdToBdt = rates["bdt"];
    //   const usdToGbp = rates["gbp"];

    //   if (!usdToBdt || !usdToGbp) {
    //     throw new Error("Required exchange rates not found");
    //   }

    //   const bdtToGbp = usdToGbp / usdToBdt;

    //   const amountInBdt = paidAmount! / 100; // if paidAmount in cents
    //   const amountInGbp = amountInBdt * bdtToGbp;
    //   const amountInGbpCents = Math.round(amountInGbp * 100);
    // }
    // const paymentIntent = await stripe.paymentIntents.retrieve(
    //   session.payment_intent as string
    // );

    // const chargeId = paymentIntent.latest_charge;
    // const charge = await stripe.charges.retrieve(chargeId as string);
    // const balanceTransactionId = charge.balance_transaction;
    // const balanceTransaction = await stripe.balanceTransactions.retrieve(
    //   balanceTransactionId as string
    // );
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Checkout session retrieved", { session }));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to retrieve checkout session", error.message));
  }
};

const getPaymentDetailsOfUser = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;
    if (!paymentIntentId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide session id"));
    }
    //     const paymentIntent = await stripe.paymentIntents.retrieve(
    //   payment_intent as string
    // );
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Checkout session retrieved", paymentIntentId));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to retrieve checkout session", error.message));
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

    const { serviceId, sessionId } = req.body;
    if (!serviceId || !sessionId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide serviceId and sessionId"));
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== "paid") {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("session not found or not paid"));
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }

    const amount_in_gbp = session.amount_total! / 100;

    // if (!["created", "succeeded", "failed"].includes(status)) {
    //   return res
    //     .status(HTTP_STATUS.BAD_REQUEST)
    //     .send(failure("Invalid status value"));
    // }

    const transactionExists = await Transaction.findOne({
      payment_intent: session.payment_intent,
      session_id: session.id,
    });
    if (transactionExists) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Transaction already exists"));
    }

    // In createTransaction function, after creating the transaction:
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const transaction = await Transaction.create({
      payment_intent: session.payment_intent,
      userId: (req as UserRequest).user._id,
      serviceId,
      contributorId: service.contributor,
      session_id: session.id,
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      amount_in_gbp,
      status: "succeeded",
      expiresAt: oneMonthFromNow,
    });

    console.log("Transaction created:", transaction);
    console.log("amount_in_gbp", amount_in_gbp);

    if (!transaction) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to create transaction"));
    }

    service.subscribers.push((req as any).user._id);

    await service.save();

    user.subscriptions.push(serviceId);
    await user.save();

    const wallet = await getWalletByUserId(service?.contributor as any);

    if (!wallet) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Wallet not found"));
    }

    wallet.transactions.push(transaction._id);
    wallet.balance += amount_in_gbp * 0.7;
    await wallet.save();

    const notificationPurchaseBuyer = await Notification.create({
      buyer: (req as UserRequest).user._id,
      contributor: service.contributor,
      user: (req as UserRequest).user._id,
      type: "transaction",
      message: `service ${service.title} purchased successfully.`,
      transaction: transaction._id,
    });

    if (!notificationPurchaseBuyer) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to create notification for buyer"));
    }
    const notificationPurchaseContributor = await Notification.create({
      buyer: (req as UserRequest).user._id,
      contributor: service.contributor,
      user: service.contributor,
      type: "transaction",
      message: `service ${service.title} purchased successfully.`,
      transaction: transaction._id,
    });

    if (!notificationPurchaseContributor) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to create notification for contributor"));
    }

    const notificationWallet = await Notification.create({
      buyer: (req as UserRequest).user._id,
      contributor: service.contributor,
      user: service.contributor,
      type: "wallet",
      message: `${amount_in_gbp} added to your wallet for service ${service.title}.`,
      transaction: transaction._id,
    });

    if (!notificationWallet) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(failure("Failed to create notification"));
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

const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    console.log(
      "Fetching subscription status for user:",
      (req as UserRequest).user._id
    );
    const user = await User.findById((req as UserRequest).user._id);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const userId = (req as UserRequest).user._id;
    const subscriptions = await Transaction.find({
      userId,
      status: "succeeded",
      isExpired: false,
      expiresAt: { $gt: new Date() },
    }).populate("serviceId");

    return res.status(HTTP_STATUS.OK).send(
      success(
        "Active subscriptions",
        subscriptions.map((sub: any) => ({
          service: sub.serviceId,
          expiresAt: sub.expiresAt,
          daysRemaining: Math.ceil(
            (new Date(sub.expiresAt).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }))
      )
    );
  } catch (error: any) {
    console.error("Error fetching subscription status:", error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to get user", error.message));
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
  getSubscriptionStatus,
  createCheckoutSession,
  getUserCheckoutSession,
  createStripeCustomConnectAccount,
  getStripeCustomConnectAccountByUser,
  createTransaction,
  onboardingComplete,
  onboardingRefresh,
  deleteStripeConnectAccount,
  getConnectedAccount,
  generatestripeExpressAccountLoginLink,
};
