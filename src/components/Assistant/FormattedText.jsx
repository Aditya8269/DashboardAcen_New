// Renders the small subset of markdown the assistant uses (paragraphs, lists,
// **bold**, `code`) as React nodes - no raw HTML is ever injected.

const renderInline = (text, keyPrefix) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>
    return part
  })

const toBlocks = (text) => {
  const blocks = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd()
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/)
    const last = blocks[blocks.length - 1]

    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol'
      const item = (bullet || numbered)[1]
      if (last?.type === type) last.items.push(item)
      else blocks.push({ type, items: [item] })
    } else if (heading) {
      blocks.push({ type: 'h', text: heading[1] })
    } else if (!line.trim()) {
      blocks.push({ type: 'break' })
    } else if (last?.type === 'p') {
      last.lines.push(line)
    } else {
      blocks.push({ type: 'p', lines: [line] })
    }
  }
  return blocks.filter((block) => block.type !== 'break')
}

function FormattedText({ text }) {
  return toBlocks(text).map((block, index) => {
    if (block.type === 'ul' || block.type === 'ol') {
      const List = block.type
      return <List key={index}>{block.items.map((item, i) => <li key={i}>{renderInline(item, `${index}-${i}`)}</li>)}</List>
    }
    if (block.type === 'h') return <p key={index} className="chat-text__heading">{renderInline(block.text, index)}</p>
    return <p key={index}>{block.lines.map((line, i) => <span key={i}>{i > 0 && <br />}{renderInline(line, `${index}-${i}`)}</span>)}</p>
  })
}

export default FormattedText
