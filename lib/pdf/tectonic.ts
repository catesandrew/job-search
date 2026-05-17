import { execFile, execFileSync } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const execFileAsync = promisify(execFile)

export async function isTectonicAvailable(): Promise<boolean> {
  try {
    execFileSync('tectonic', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export async function compileTex(source: string): Promise<Buffer> {
  const id = randomUUID()
  const texPath = join(tmpdir(), `resume-${id}.tex`)
  const pdfPath = join(tmpdir(), `resume-${id}.pdf`)

  await writeFile(texPath, source, 'utf8')

  try {
    await execFileAsync('tectonic', [
      '-X', 'compile',
      '--outfmt', 'pdf',
      '--outdir', tmpdir(),
      '--untrusted',
      texPath,
    ])

    return await readFile(pdfPath)
  } finally {
    await Promise.allSettled([unlink(texPath), unlink(pdfPath)])
  }
}
