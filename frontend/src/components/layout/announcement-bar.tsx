/**
 * The design's black top bar under a thin Kenyan-flag stripe.
 *
 * Messages are passed in rather than written here: the free-delivery threshold
 * and the payment options are store settings that staff can change (payment
 * timing is switchable by admin, ADR-0012), so they will come from the store
 * settings API in Phase 4. With no messages, only the flag stripe shows.
 */
export interface AnnouncementBarProps {
  messages?: readonly string[];
}

export function FlagStripe() {
  return (
    <div aria-hidden="true" className="flex h-[7px] flex-col">
      <span className="h-[3px] bg-ink" />
      <span className="h-[2px] bg-accent" />
      <span className="h-[2px] bg-brand" />
    </div>
  );
}

export function AnnouncementBar({ messages = [] }: AnnouncementBarProps) {
  return (
    <div className="surface-dark bg-ink text-cream">
      <FlagStripe />
      {messages.length > 0 ? (
        <ul
          aria-label="Store announcements"
          className="mx-auto flex max-w-[calc(var(--container-page)+10rem)] justify-center px-5 py-2 text-small sm:justify-between sm:px-8 lg:px-12 xl:px-20"
        >
          {messages.map((message, index) => (
            // On phones only the first message fits, as in the mobile design.
            <li key={message} className={index > 0 ? "hidden sm:block" : undefined}>
              {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
