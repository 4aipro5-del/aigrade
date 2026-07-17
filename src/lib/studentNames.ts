const STORAGE_KEY = 'student-name-map'

type NameMap = Record<string, string>

function readMap(): NameMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as NameMap) : {}
  } catch {
    return {}
  }
}

function writeMap(map: NameMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getStudentName(studentId: string): string | undefined {
  return readMap()[studentId]
}

export function setStudentName(studentId: string, name: string) {
  const map = readMap()
  map[studentId] = name
  writeMap(map)
}

export function getDisplayName(studentId: string, pseudoLabel: string): string {
  return getStudentName(studentId) ?? pseudoLabel
}
