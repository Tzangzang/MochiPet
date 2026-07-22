import { readFileSync } from "node:fs"

const data = JSON.parse(readFileSync(process.argv[2], "utf8"))
const byCode = new Map(data.map((d) => [d.code, d]))

const META = {
  "01_cat": { style: "quadruped", tail: [0.3, 0.76, "left"], eyeY: -1, faceX: -1, w: -1 },
  "02_dog": { style: "quadruped", tail: [0.79, 0.63, "right"], eyeY: 0.513, faceX: 0.497, w: 0.499 },
  "03_rabbit": { style: "quadruped", tail: [0.78, 0.78, "right", 0.12], eyeY: 0.583, faceX: 0.349, w: 0.476 },
  "04_hamster": { style: "round", tail: null, eyeY: 0.325, faceX: 0.565, w: 0.450 },
  "05_guinea_pig": { style: "round", tail: null, eyeY: -1, faceX: -1, w: -1 },
  "06_ferret": { style: "quadruped", tail: [0.73, 0.56, "right"], eyeY: -1, faceX: -1, w: -1 },
  "07_red_panda": { style: "quadruped", tail: [0.28, 0.73, "left"], eyeY: -1, faceX: -1, w: -1 },
  "08_fox": { style: "quadruped", tail: [0.73, 0.6, "right"], eyeY: 0.502, faceX: 0.378, w: 0.418 },
  "09_raccoon": { style: "quadruped", tail: [0.76, 0.61, "right"], eyeY: -1, faceX: -1, w: -1 },
  "10_hedgehog": { style: "round", tail: null, eyeY: -1, faceX: -1, w: -1, blink: false },
  "11_squirrel": { style: "quadruped", tail: [0.72, 0.68, "right"], eyeY: 0.345, faceX: 0.366, w: 0.445 },
  "12_capybara": { style: "quadruped", tail: null, eyeY: -1, faceX: -1, w: -1, blink: false, tailCue: false },
  "13_panda": { style: "biped", tail: null, eyeY: -1, faceX: -1, w: -1 },
  "14_koala": { style: "biped", tail: null, eyeY: -1, faceX: -1, w: -1, blink: false },
  "15_sloth": { style: "biped", tail: null, eyeY: 0.436, faceX: 0.424, w: 0.411 },
  "16_alpaca": { style: "quadruped", tail: [0.80, 0.6, "right", 0.12], eyeY: 0.264, faceX: 0.487, w: 0.381 },
  "17_otter": { style: "quadruped", tail: [0.74, 0.72, "right"], eyeY: -1, faceX: -1, w: -1 },
  "18_penguin": { style: "biped", tail: null, eyeY: 0.335, faceX: 0.409, w: 0.422 },
  "19_axolotl": { style: "aquatic", tail: [0.22, 0.7, "left"], eyeY: -1, faceX: -1, w: -1 },
  "20_seal": { style: "aquatic", tail: [0.78, 0.68, "right"], eyeY: -1, faceX: -1, w: -1, blink: false },
  "21_sea_turtle": { style: "aquatic", tail: [0.80, 0.64, "right", 0.12], eyeY: -1, faceX: -1, w: -1 },
  "22_pufferfish": { style: "aquatic", tail: [0.83, 0.55, "right", 0.12], eyeY: 0.394, faceX: 0.586, w: 0.564 },
  "23_octopus": { style: "aquatic", tail: null, eyeY: -1, faceX: -1, w: -1, tailCue: false },
  "24_dolphin": { style: "aquatic", tail: [0.82, 0.66, "right"], eyeY: -1, faceX: -1, w: -1 },
  "25_baby_dragon": { style: "winged", tail: [0.8, 0.74, "right"], eyeY: 0.443, faceX: 0.502, w: 0.493 },
  "26_unicorn": { style: "quadruped", tail: [0.8, 0.62, "right"], eyeY: -1, faceX: -1, w: -1 },
  "27_phoenix": { style: "winged", tail: [0.78, 0.74, "right"], eyeY: 0.498, faceX: 0.415, w: 0.410 },
  "28_cloud_spirit": { style: "floating", tail: null, eyeY: 0.409, faceX: 0.571, w: 0.475 },
  "29_moon_spirit": { style: "floating", tail: [0.75, 0.73, "right"], eyeY: -1, faceX: -1, w: -1 },
  "30_sprout_spirit": { style: "plant", tail: null, eyeY: 0.467, faceX: 0.350, w: 0.449 },
}

const NO_PAW = new Set(["round", "aquatic", "floating", "plant"])

const lines = []
for (const [code, m] of Object.entries(META)) {
  const d = byCode.get(code)
  const s = d.seed
  const r = (v) => Number(v.toFixed(3))
  const hasFace = m.faceX >= 0
  const headX = hasFace ? m.faceX : s.centerX
  const parts = []
  parts.push(`  {`)
  parts.push(`    code: "${code}",`)
  parts.push(`    motionStyle: "${m.style}",`)
  parts.push(`    head: { x: ${r(headX)}, y: ${r(s.head.y)} },`)
  parts.push(`    belly: { x: ${r(s.belly.x)}, y: ${r(s.belly.y)} },`)
  parts.push(`    feet: { x: ${r(s.feet.x)}, y: ${r(s.feet.y)} },`)
  parts.push(
    hasFace
      ? `    face: face(${r(m.faceX)}, ${r(m.eyeY)}, ${r(m.w)}),`
      : `    face: null,`,
  )
  if (!NO_PAW.has(m.style)) {
    parts.push(`    frontLeft: { x: ${r(s.feet.x - 0.09)}, y: ${r(s.feet.y - 0.03)} },`)
    parts.push(`    frontRight: { x: ${r(s.feet.x + 0.09)}, y: ${r(s.feet.y - 0.03)} },`)
  }
  if (m.tail) {
    const [tx, ty, dir, len] = m.tail
    parts.push(`    tail: tail(${tx}, ${ty}, "${dir}"${len ? `, ${len}` : ""}),`)
  } else {
    parts.push(`    tail: null,`)
  }
  const ov = []
  if (m.blink === false) ov.push("supportsBlink: false")
  if (m.tailCue === false) ov.push("supportsTailCue: false")
  if (ov.length) parts.push(`    overrides: { ${ov.join(", ")} },`)
  parts.push(`  },`)
  lines.push(parts.join("\n"))
}

process.stdout.write(lines.join("\n") + "\n")
