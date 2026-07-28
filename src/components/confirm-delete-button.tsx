"use client";

export function ConfirmDeleteButton({
  action,
  label,
  confirmMessage,
}: {
  action: () => void | Promise<void>;
  label: string;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 hover:underline dark:text-red-400"
      >
        {label}
      </button>
    </form>
  );
}
