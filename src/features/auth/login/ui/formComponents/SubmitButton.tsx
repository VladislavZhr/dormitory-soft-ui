"use client";

import { memo } from "react";

type SubmitButtonProps = {
  loading: boolean;
  children: string;
};

function SubmitButtonImpl({ loading, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white ring-1 ring-blue-200 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
    >
      {loading ? "Вхід…" : children}
    </button>
  );
}

const SubmitButton = memo(SubmitButtonImpl);
export default SubmitButton;
