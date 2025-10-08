"use client";

import * as React from "react";
import { CgProfile } from "react-icons/cg";

import type { ProfileViewProps } from "../model/types";

// Чиста верстка; форма працює через register/onSubmit із контейнера.
export default function ProfileView({ name, register, errors, isSubmitting, success, error, onSubmit }: ProfileViewProps) {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center border-b border-slate-200 px-6 py-8">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-50 via-sky-50 to-emerald-50 p-1 ring-1 ring-slate-200 shadow">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                  <CgProfile className="h-12 w-12 text-slate-500" aria-hidden />
                </div>
              </div>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">Admin</h2>
          </div>

          <div className="border-t border-slate-200 px-6 py-5">
            <h3 className="mb-4 text-lg font-semibold text-blue-700">Change Password</h3>

            {success ? <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}
            {error ? <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  {...register("currentPassword")}
                  className="mt-1 text-slate-900 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  aria-invalid={Boolean(errors.currentPassword)}
                  aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
                />
                {errors.currentPassword ? (
                  <p id="currentPassword-error" className="mt-1 text-xs text-rose-600">
                    {errors.currentPassword}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  {...register("newPassword")}
                  className="mt-1 w-full text-slate-900 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  aria-invalid={Boolean(errors.newPassword)}
                  aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                />
                {errors.newPassword ? (
                  <p id="newPassword-error" className="mt-1 text-xs text-rose-600">
                    {errors.newPassword}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  {...register("confirmPassword")}
                  className="mt-1 w-full text-slate-900 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                />
                {errors.confirmPassword ? (
                  <p id="confirmPassword-error" className="mt-1 text-xs text-rose-600">
                    {errors.confirmPassword}
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
