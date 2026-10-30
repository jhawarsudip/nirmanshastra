import { Fragment } from 'react'

/**
 * Text in which `[[...]]` marks words that stay English on purpose: the names of Excel sheets (they are tabs in the file the
 * customer receives, which is English) and file extensions such as .xlsx. They are written in a lang="en" span so a screen reader
 * says them in English. English text never has the marker, so it comes out exactly as it was typed.
 * No hooks, so it works in a server or a client component.
 */
export function Rich({ text }: { text: string }) {
  if (!text.includes('[[')) return <>{text}</>
  return (
    <>
      {text.split(/(\[\[.+?\]\])/).map((part, i) =>
        part.startsWith('[[') ? <span key={i} lang="en">{part.slice(2, -2)}</span> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  )
}
