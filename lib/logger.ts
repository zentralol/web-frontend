function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export const logger = {
  error: (message: string, context: Record<string, unknown> = {}) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        ...context,
        error: formatError(context.error),
      }),
    );
  },
};
