"use client";

export function DeleteDeckButton({
  action,
}: {
  action: () => void | Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this deck and all its cards? This can't be undone, and it will remove any student progress tied to it."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 hover:underline dark:text-red-400"
      >
        Delete this deck
      </button>
    </form>
  );
}
