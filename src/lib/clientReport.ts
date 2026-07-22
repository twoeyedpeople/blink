import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import type { Entry, Project } from '../types'
import { billedMinutes, toDateInput } from './time'

const INK = 'FF111111'
const PINK_SOFT = 'FFFFEDF9'

async function loadLogo(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch('/Logo_black.png')
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

// Client-facing report: billed hours only, no actual/raw time, no internal notes
// (auto-stopped flags etc). Descriptions are included as typed, they're client-eyes copy.
export async function downloadClientReport(project: Project, entries: Entry[]) {
  const projectEntries = entries
    .filter((e) => e.projectId === project.id)
    .sort((a, b) => a.start - b.start)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Two-Eyed People'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Time report', {
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' },
  })

  sheet.getColumn(1).width = 16
  sheet.getColumn(2).width = 70
  sheet.getColumn(3).width = 16

  const logoBuffer = await loadLogo()
  if (logoBuffer) {
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' })
    sheet.addImage(imageId, { tl: { col: 0, row: 0.2 }, ext: { width: 130, height: 42 } })
  }
  sheet.getRow(1).height = 40
  sheet.getRow(2).height = 8

  const titleRow = sheet.addRow(['Time report'])
  titleRow.font = { name: 'Arial', size: 18, bold: true, color: { argb: INK } }
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 3)

  const projectRow = sheet.addRow([project.name])
  projectRow.font = { name: 'Arial', size: 13, bold: true, color: { argb: INK } }
  sheet.mergeCells(projectRow.number, 1, projectRow.number, 3)

  const genRow = sheet.addRow([`Generated ${format(new Date(), 'd MMMM yyyy')}`])
  genRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF666666' } }
  sheet.mergeCells(genRow.number, 1, genRow.number, 3)

  sheet.addRow([])

  const headerRow = sheet.addRow(['Date', 'Description', 'Billed hours'])
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } }
    cell.alignment = { vertical: 'middle' }
  })

  let totalMinutes = 0
  for (const entry of projectEntries) {
    const mins = billedMinutes(entry.end - entry.start)
    totalMinutes += mins
    const row = sheet.addRow([toDateInput(entry.start), entry.description || '(no description)', mins / 60])
    row.getCell(1).font = { name: 'Arial', size: 11 }
    row.getCell(2).font = { name: 'Arial', size: 11 }
    row.getCell(3).font = { name: 'Arial', size: 11 }
    row.getCell(3).numFmt = '0.0"h"'
  }

  if (projectEntries.length === 0) {
    const emptyRow = sheet.addRow(['—', 'Nothing tracked yet', 0])
    emptyRow.font = { name: 'Arial', italic: true, color: { argb: 'FF999999' } }
    emptyRow.getCell(3).numFmt = '0.0"h"'
  }

  sheet.addRow([])
  const totalRow = sheet.addRow(['', 'Total', totalMinutes / 60])
  totalRow.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: INK } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PINK_SOFT } }
    cell.border = { top: { style: 'medium', color: { argb: INK } } }
  })
  totalRow.getCell(3).numFmt = '0.0"h"'

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const safeName = project.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, ' ')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Blink - ${safeName} - Time Report.xlsx`
  a.click()
  URL.revokeObjectURL(a.href)
}
