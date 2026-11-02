import { Fragment } from "react";

/**
 * A heading whose words can be revealed one by one (SiteMotion animates [data-word]). Each word
 * stays real text in order, so the heading's accessible name is the whole sentence.
 */
export function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span data-word className="inline-block will-change-transform">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
