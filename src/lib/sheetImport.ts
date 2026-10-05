import type { LaunchTaskStatus } from '@/lib/launchTemplate'
import { LAUNCH_GROUPS, LAUNCH_TEMPLATE } from '@/lib/launchTemplate'

export interface ImportedTask {
  taskKey: string
  title: string
  status: LaunchTaskStatus
  note?: string
  dueDate?: string
}

export interface UnmatchedRow {
  title: string
  status?: string
  note?: string
}

export interface ChecklistImport {
  suggestedName: string
  /** Statuses, notes, or dates that differ from a fresh project. */
  tasks: ImportedTask[]
  matchedCount: number
  unmatched: UnmatchedRow[]
}

const TASK_HEADERS = ['task', 'task name', 'checklist item', 'item', 'action', 'step', 'milestone', 'deliverable', 'activity', 'description', 'to do', 'todo']
const STATUS_HEADERS = ['status', 'state', 'progress', 'completed', 'complete', 'done', 'checkbox']
const NOTE_HEADERS = ['notes', 'note', 'comments', 'comment', 'details']
const DUE_HEADERS = ['due', 'due date', 'target date', 'date']
const NAME_HEADERS = ['association', 'organization', 'org', 'client', 'project', 'name']

const GROUP_NAMES = new Set(
  [...LAUNCH_GROUPS.map((group) => normalize(group.title)), 'prelaunch', 'pre launch', 'launch', 'after launch', 'go live', 'go-live']
)

export function parseChecklist(text: string, filename = ''): ChecklistImport {
  const rows = parseTable(text).map((row) => row.map((cell) => cell.trim())).filter((row) => row.some(Boolean))
  if (rows.length === 0) {
    return { suggestedName: nameFromFilename(filename), tasks: [], matchedCount: 0, unmatched: [] }
  }

  const headerIndex = findHeaderRow(rows)
  const header = headerIndex >= 0 ? rows[headerIndex].map((cell) => normalize(cell)) : null
  const body = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows
  const columns = header ? columnsFromHeader(header) : columnsFromBody(body)

  const tasks: ImportedTask[] = []
  const unmatched: UnmatchedRow[] = []
  const used = new Set<string>()
  let matchedCount = 0

  for (const row of body) {
    const title = cell(row, columns.task)
    if (!title || GROUP_NAMES.has(normalize(title))) continue
    const statusRaw = cell(row, columns.status)
    const note = cell(row, columns.note)
    const dueDate = parseDue(cell(row, columns.due))
    const match = matchTask(title, used)
    if (!match) {
      unmatched.push({ title, status: statusRaw || undefined, note: note || undefined })
      continue
    }
    used.add(match.key)
    matchedCount += 1
    const status = parseStatus(statusRaw) ?? match.defaultStatus
    const changed = status !== match.defaultStatus || Boolean(note) || Boolean(dueDate)
    if (!changed) continue
    tasks.push({
      taskKey: match.key,
      title: match.title,
      status,
      note: note || undefined,
      dueDate: dueDate || undefined,
    })
  }

  let sheetName = headerIndex > 0 ? titleFromPreamble(rows.slice(0, headerIndex)) : ''
  if (!sheetName && columns.name >= 0) {
    const names = [...new Set(body.map((row) => cell(row, columns.name)).filter(Boolean))]
    if (names.length === 1) sheetName = names[0]
  }
  return {
    suggestedName: sheetName || nameFromFilename(filename),
    tasks,
    matchedCount,
    unmatched,
  }
}

function titleFromPreamble(rows: string[][]): string {
  for (const row of rows) {
    const filled = row.filter(Boolean)
    if (filled.length !== 1) continue
    const value = filled[0]
    if (value.length < 3 || value.length > 80) continue
    if (GROUP_NAMES.has(normalize(value))) continue
    if (TASK_HEADERS.includes(normalize(value)) || STATUS_HEADERS.includes(normalize(value))) continue
    return value
  }
  return ''
}

export function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ')
  const stripped = base
    .replace(/\b(launch|checklist|check list|implementation|tracker|plan|sheet|export|template)\b/gi, '')
    .replace(/[-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped
}

function findHeaderRow(rows: string[][]): number {
  const limit = Math.min(rows.length, 12)
  for (let index = 0; index < limit; index += 1) {
    const normalized = rows[index].map((cell) => normalize(cell))
    const hasTask = normalized.some((cell) => matchesHeader(cell, TASK_HEADERS))
    const hasStatus = normalized.some((cell) => matchesHeader(cell, STATUS_HEADERS))
    if (hasTask && hasStatus) return index
    if (hasTask && normalized.some((cell) => matchesHeader(cell, NOTE_HEADERS) || matchesHeader(cell, DUE_HEADERS))) return index
  }
  return -1
}

function columnsFromHeader(header: string[]) {
  return {
    task: indexOfHeader(header, TASK_HEADERS),
    status: indexOfHeader(header, STATUS_HEADERS),
    note: indexOfHeader(header, NOTE_HEADERS),
    due: indexOfHeader(header, DUE_HEADERS),
    name: indexOfHeader(header, NAME_HEADERS),
  }
}

function columnsFromBody(rows: string[][]) {
  const width = Math.max(0, ...rows.map((row) => row.length))
  let status = -1
  let bestStatusScore = 0
  for (let column = 0; column < width; column += 1) {
    const score = rows.reduce((sum, row) => sum + (parseStatus(row[column] ?? '') ? 1 : 0), 0)
    if (score > bestStatusScore) {
      bestStatusScore = score
      status = column
    }
  }
  let task = 0
  let bestLength = -1
  for (let column = 0; column < width; column += 1) {
    if (column === status) continue
    const length = rows.reduce((sum, row) => sum + (row[column]?.length ?? 0), 0)
    if (length > bestLength) {
      bestLength = length
      task = column
    }
  }
  return { task, status, note: -1, due: -1, name: -1 }
}

function matchesHeader(cell: string, names: string[]) {
  return names.some((name) => cell === name || cell.startsWith(`${name} `))
}

function indexOfHeader(header: string[], names: string[]) {
  for (const name of names) {
    const index = header.findIndex((cell) => cell === name || cell.startsWith(`${name} `))
    if (index >= 0) return index
  }
  return -1
}

function cell(row: string[], index: number) {
  if (index < 0) return ''
  return row[index]?.trim() ?? ''
}

function matchTask(title: string, used: Set<string>) {
  const wanted = normalize(title)
  if (!wanted) return null
  const available = LAUNCH_TEMPLATE.filter((task) => !used.has(task.key))
  const exact = available.find((task) => normalize(task.title) === wanted)
  if (exact) return exact

  let best: (typeof LAUNCH_TEMPLATE)[number] | null = null
  let bestScore = 0
  for (const task of available) {
    const score = similarity(wanted, normalize(task.title))
    if (score > bestScore) {
      bestScore = score
      best = task
    }
  }
  return bestScore >= 0.72 ? best : null
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0
  if (a === b) return 1
  if ((a.length > 18 && b.includes(a)) || (b.length > 18 && a.includes(b))) return 0.9
  const left = new Set(tokens(a))
  const right = new Set(tokens(b))
  if (left.size === 0 || right.size === 0) return 0
  let shared = 0
  for (const token of left) if (right.has(token)) shared += 1
  return shared / Math.max(left.size, right.size)
}

function tokens(value: string) {
  const stop = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'with'])
  return value.split(' ').filter((token) => token.length > 2 && !stop.has(token))
}

export function parseStatus(value: string): LaunchTaskStatus | null {
  const text = normalize(value)
  if (!text) return null
  if (['true', 'yes', 'y', 'done', 'complete', 'completed', 'finished', 'checked', 'x'].includes(text)) {
    return 'complete'
  }
  if (['in progress', 'started', 'working', 'wip', 'partial', 'doing'].includes(text)) return 'in_progress'
  if (['na', 'n a', 'not applicable', 'not needed', 'skipped'].includes(text)) return 'na'
  if (['as needed', 'optional', 'if needed', 'when needed'].includes(text)) return 'as_needed'
  if (['not started', 'to do', 'todo', 'pending', 'open', 'not done', 'no', 'false'].includes(text)) {
    return 'not_started'
  }
  return null
}

function parseDue(value: string) {
  if (!value) return ''
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  const us = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (!us) return ''
  const year = us[3].length === 2 ? `20${us[3]}` : us[3]
  return `${year}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function parseTable(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const delimiter = detectDelimiter(source)
  const rows: string[][] = []
  let row: string[] = []
  let cellValue = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cellValue += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cellValue += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === delimiter) {
      row.push(cellValue)
      cellValue = ''
      continue
    }
    if (char === '\n') {
      row.push(cellValue)
      rows.push(row)
      row = []
      cellValue = ''
      continue
    }
    cellValue += char
  }
  if (cellValue.length > 0 || row.length > 0) {
    row.push(cellValue)
    rows.push(row)
  }
  return rows
}

function detectDelimiter(text: string) {
  const lines = text.slice(0, 8000).split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 20)
  const score = (char: string) => {
    const counts = lines.map((line) => line.split(char).length - 1).filter((count) => count > 0)
    if (counts.length < 2) return 0
    const ordered = [...counts].sort((a, b) => a - b)
    const mode = ordered[Math.floor(ordered.length / 2)]
    const consistent = counts.filter((count) => count === mode).length
    if (consistent < Math.ceil(counts.length * 0.6)) return 0
    return counts.length * 10 + mode
  }
  const tab = score('\t')
  const semi = score(';')
  const comma = score(',')
  if (tab > 0 && tab >= semi && tab >= comma) return '\t'
  if (semi > comma && semi > 0) return ';'
  return ','
}
