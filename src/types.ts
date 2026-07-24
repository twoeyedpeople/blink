export interface Project {
  id: string
  name: string
  colour: string
  archived: boolean
  createdAt: number
  hourlyRate: number
  shareId?: string // powers the read-only client billing link; generated on demand
}

export interface Entry {
  id: string
  projectId: string
  description: string
  start: number
  end: number
  autoStopped?: boolean
  manual?: boolean
  loggedBy?: string
}

export interface Running {
  projectId: string
  description: string
  start: number
  loggedBy?: string
}

export interface Prefs {
  idleMinutes: number
  smartIdle: boolean
}

export const PROJECT_COLOURS = [
  '#FF7119',
  '#C21A88',
  '#3DDA7B',
  '#5F7CFF',
  '#FFB000',
  '#00B8A9',
  '#FF4D6D',
  '#8338EC',
]
