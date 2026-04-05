"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveProfileSocialLinks } from "@/app/settings/actions";

type ProfileSocialLinksFormProps = {
  steamHandle: string;
  discordHandle: string;
  xboxHandle: string;
  playstationHandle: string;
  twitchHandle: string;
};

export function ProfileSocialLinksForm({
  steamHandle,
  discordHandle,
  xboxHandle,
  playstationHandle,
  twitchHandle,
}: ProfileSocialLinksFormProps) {
  const initialState = {
    status: "idle" as const,
    message: "",
  };
  const [state, formAction, pending] = useActionState(
    saveProfileSocialLinks,
    initialState,
  );

  return (
    <form action={formAction} className="card-surface rounded-[1.8rem] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-kicker before:w-6">Public accounts</p>
          <h2 className="display-font mt-3 text-3xl font-semibold">
            Share screen names
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-base-content/78">
            These screen names appear on your public profile with a copy button
            beside each platform.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
            <Image
              src="/socialIcons/steam.svg"
              alt="Steam"
              width={18}
              height={18}
              className="w-4 h-4"
            />
            Steam screen name
          </span>
          <input
            name="steamHandle"
            type="text"
            defaultValue={steamHandle}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="boringsquirrel"
          />
          <span className="text-xs leading-6 text-base-content/55">
            Enter only the name other players should copy.
          </span>
          {state.errors?.steamHandle ? (
            <span className="text-sm text-error">
              {state.errors.steamHandle}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
            <Image
              src="/socialIcons/discord.svg"
              alt="Discord"
              width={18}
              height={18}
              className="w-4 h-4"
            />
            Discord username
          </span>
          <input
            name="discordHandle"
            type="text"
            defaultValue={discordHandle}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="boringsquirrel"
          />
          <span className="text-xs leading-6 text-base-content/55">
            Enter the username friends should add or message.
          </span>
          {state.errors?.discordHandle ? (
            <span className="text-sm text-error">
              {state.errors.discordHandle}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
            <Image
              src="/socialIcons/xbox.svg"
              alt="Xbox"
              width={18}
              height={18}
              className="w-4 h-4"
            />
            Xbox gamertag
          </span>
          <input
            name="xboxHandle"
            type="text"
            defaultValue={xboxHandle}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="Boring Squirrel"
          />
          <span className="text-xs leading-6 text-base-content/55">
            Spaces are fine if they are part of your gamertag.
          </span>
          {state.errors?.xboxHandle ? (
            <span className="text-sm text-error">
              {state.errors.xboxHandle}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
            <Image
              src="/socialIcons/playstation.svg"
              alt="PlayStation"
              width={18}
              height={18}
              className="w-4 h-4"
            />
            PlayStation online ID
          </span>
          <input
            name="playstationHandle"
            type="text"
            defaultValue={playstationHandle}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="BoringSquirrel"
          />
          <span className="text-xs leading-6 text-base-content/55">
            Enter the ID you want other players to copy.
          </span>
          {state.errors?.playstationHandle ? (
            <span className="text-sm text-error">
              {state.errors.playstationHandle}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
            <Image
              src="/socialIcons/twitch.svg"
              alt="Twitch"
              width={18}
              height={18}
              className="w-4 h-4"
            />
            Twitch username
          </span>
          <input
            name="twitchHandle"
            type="text"
            defaultValue={twitchHandle}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="boringsquirrel"
          />
          <span className="text-xs leading-6 text-base-content/55">
            Enter the username.
          </span>
          {state.errors?.twitchHandle ? (
            <span className="text-sm text-error">
              {state.errors.twitchHandle}
            </span>
          ) : null}
        </label>
      </div>

      {state.message ? (
        <div
          className={`mt-5 rounded-[1.4rem] px-4 py-3 text-sm leading-7 ${
            state.status === "success"
              ? "bg-success/15 text-success"
              : "bg-error/15 text-error"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm leading-7 text-base-content/70">
          Changes update your public profile immediately after save.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary rounded-full px-6"
        >
          <Save className="size-4" />
          {pending ? "Saving..." : "Save screen names"}
        </button>
      </div>
    </form>
  );
}
