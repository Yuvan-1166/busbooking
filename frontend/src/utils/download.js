/**
 * Saves a fetched binary to the user's downloads folder.
 *
 * The object URL is revoked on the next tick rather than immediately — some
 * browsers abort the download if the URL disappears before the click is
 * processed.
 */
export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
