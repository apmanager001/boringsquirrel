import { Mail } from "lucide-react";
import { ContactForm } from "@/app/contact/contact-form";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Send a message to Boring Squirrel through the contact form or the site email addresses.",
  path: "/contact",
  keywords: ["contact", "boring squirrel", "game feedback", "site support"],
});

export default function ContactPage() {
  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] items-center">
        <div className="space-y-6">
          <p className="section-kicker">Contact</p>
          <div className="space-y-4">
            <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
              Reach out for any inquiries, feedback, or just to say hi!
            </h1>
            {/* <p className="max-w-3xl text-lg leading-8 text-base-content/80">
              Send ideas, bug reports, collaboration notes, or requests for
              future posts and games. The form is already wired for Mongo
              storage and Zoho delivery.
            </p> */}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="card-surface rounded-[1.6rem] p-5">
            <p className="section-kicker before:w-6">Email</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-base-content/78">
              <p className="inline-flex items-center gap-2 font-semibold text-base-content/85">
                <Mail className="size-4 text-primary" />
                contact@boringsquirrel.com
              </p>
            </div>
          </div>

          {/* <div className="card-surface rounded-[1.6rem] p-5 text-sm leading-7 text-base-content/78">
            <p className="section-kicker before:w-6">What happens</p>
            <p className="mt-4">
              Contact submissions are stored for admin review in the site inbox,
              and they are also emailed to your contact inbox whenever SMTP is
              active.
            </p>
          </div> */}
        </aside>
      </section>

      <section className="mt-12">
        <ContactForm />
      </section>
    </main>
  );
}
