import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Transaction management routes
  transactions: router({
    analyzeTransaction: protectedProcedure
      .input(z.number())
      .mutation(async ({ input: transactionId }) => {
        const { getTransactionById, createAuditLog } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");

        const transaction = await getTransactionById(transactionId);
        if (!transaction) {
          throw new Error("Transaction not found");
        }

        // Prepare transaction data for AI analysis
        const prompt = `Analyze this blockchain transaction for potential anomalies and risks:

Transaction Details:
- Hash: ${transaction.txHash}
- From: ${transaction.fromAddress}
- To: ${transaction.toAddress}
- Amount: ${transaction.amount} ${transaction.currency}
- Type: ${transaction.type}
- Current Status: ${transaction.status}
- Risk Score: ${transaction.riskScore}/100
- Block Number: ${transaction.blockNumber}
- Gas Used: ${transaction.gasUsed}
- Gas Fee: ${transaction.gasFee}
- Created At: ${transaction.createdAt}

Please provide:
1. A detailed risk assessment (1-3 sentences)
2. Specific anomaly indicators found (if any)
3. Recommended action (approve/flag/reject)
4. Confidence level (high/medium/low)

Format your response as JSON with these fields: riskAssessment, anomalyIndicators (array), recommendedAction, confidenceLevel, reasoning`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert blockchain transaction analyst specializing in fraud detection and risk assessment. Provide detailed, actionable analysis.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "transaction_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  riskAssessment: {
                    type: "string",
                    description: "Overall risk assessment summary",
                  },
                  anomalyIndicators: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description: "List of specific anomaly indicators",
                  },
                  recommendedAction: {
                    type: "string",
                    enum: ["approve", "flag", "reject"],
                    description: "Recommended action",
                  },
                  confidenceLevel: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level of the analysis",
                  },
                  reasoning: {
                    type: "string",
                    description: "Detailed reasoning for the recommendation",
                  },
                },
                required: ["riskAssessment", "anomalyIndicators", "recommendedAction", "confidenceLevel", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const analysis = JSON.parse(typeof content === "string" ? content : "{}");

        return {
          transaction,
          analysis,
        };
      }),

    list: protectedProcedure
      .input(
        z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          status: z.string().optional(),
          type: z.string().optional(),
          search: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getTransactions } = await import("./db");
        return await getTransactions(input);
      }),

    getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
      const { getTransactionById } = await import("./db");
      return await getTransactionById(input);
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "confirmed", "failed", "flagged"]),
          flaggedReason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { updateTransactionStatus, createAuditLog } = await import("./db");
        await updateTransactionStatus(input.id, input.status, ctx.user.id, input.flaggedReason);

        // Log the action
        await createAuditLog({
          adminId: ctx.user.id,
          action: "update_transaction_status",
          entityType: "transaction",
          entityId: input.id,
          changes: JSON.stringify({ status: input.status, flaggedReason: input.flaggedReason }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.get("user-agent"),
        });

        return { success: true };
      }),
  }),

  // Account management routes
  accounts: router({
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          search: z.string().optional(),
          status: z.string().optional(),
          kycStatus: z.string().optional(),
          riskLevel: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { getAccounts } = await import("./db");
        return await getAccounts(input);
      }),

    getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
      const { getAccountById } = await import("./db");
      return await getAccountById(input);
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "frozen", "suspended", "closed"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { updateAccountStatus, createAuditLog } = await import("./db");
        await updateAccountStatus(input.id, input.status);

        await createAuditLog({
          adminId: ctx.user.id,
          action: "update_account_status",
          entityType: "account",
          entityId: input.id,
          changes: JSON.stringify({ status: input.status }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.get("user-agent"),
        });

        return { success: true };
      }),

    batchUpdateRiskLevel: protectedProcedure
      .input(
        z.object({
          accountIds: z.array(z.number()),
          riskLevel: z.enum(["low", "medium", "high", "critical"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { batchUpdateAccountRiskLevel, createAuditLog } = await import("./db");
        const result = await batchUpdateAccountRiskLevel(input.accountIds, input.riskLevel);

        await createAuditLog({
          adminId: ctx.user.id,
          action: "batch_update_risk_level",
          entityType: "account",
          entityId: 0,
          changes: JSON.stringify({ accountIds: input.accountIds, riskLevel: input.riskLevel }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.get("user-agent"),
        });

        return result;
      }),

    batchUpdateStatus: protectedProcedure
      .input(
        z.object({
          accountIds: z.array(z.number()),
          status: z.enum(["active", "frozen", "suspended", "closed"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { batchUpdateAccountStatus, createAuditLog } = await import("./db");
        const result = await batchUpdateAccountStatus(input.accountIds, input.status);

        await createAuditLog({
          adminId: ctx.user.id,
          action: "batch_update_status",
          entityType: "account",
          entityId: 0,
          changes: JSON.stringify({ accountIds: input.accountIds, status: input.status }),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.get("user-agent"),
        });

        return result;
      }),

    getByIds: protectedProcedure
      .input(z.array(z.number()))
      .query(async ({ input }) => {
        const { getAccountsByIds } = await import("./db");
        return await getAccountsByIds(input);
      }),
  }),

  // Dashboard and analytics routes
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      const { getDashboardStats } = await import("./db");
      return await getDashboardStats();
    }),

    activeAccountsByRisk: protectedProcedure
      .input(
        z.object({
          riskLevel: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getActiveAccountsByRisk } = await import("./db");
        return await getActiveAccountsByRisk(input.riskLevel);
      }),

    analytics: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getAnalyticsSnapshots } = await import("./db");
        return await getAnalyticsSnapshots(input);
      }),
  }),

  // Audit log routes
  auditLogs: router({
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          adminId: z.number().optional(),
          entityType: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getAuditLogs } = await import("./db");
        return await getAuditLogs(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
