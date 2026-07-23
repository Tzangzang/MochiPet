import { readFileSync } from "node:fs"

const seedData = JSON.parse(readFileSync(process.argv[2], "utf8"))
const refData = JSON.parse(readFileSync(process.argv[3], "utf8"))
const seedByCode = new Map(seedData.map((d) => [d.code, d]))
const refByCode = new Map(refData.map((d) => [d.code, d]))

const META = {
  "01_cat": { style: "quadruped", tail: [0.3, 0.76, "left"], eyes: true },
  "02_dog": { style: "quadruped", tail: [0.79, 0.63, "right"], eyes: true },
  "03_rabbit": { style: "quadruped", tail: [0.78, 0.78, "right", 0.12], eyes: true },
  "04_hamster": { style: "round", tail: null, eyes: true },
  "05_guinea_pig": { style: "round", tail: null, eyes: true },
  "06_ferret": { style: "quadruped", tail: [0.73, 0.56, "right"], eyes: true },
  "07_red_panda": { style: "quadruped", tail: [0.28, 0.73, "left"], eyes: true },
  "08_fox": { style: "quadruped", tail: [0.73, 0.6, "right"], eyes: true },
  "09_raccoon": { style: "quadruped", tail: [0.76, 0.61, "right"], eyes: true },
  "10_hedgehog": { style: "round", tail: null, eyes: true },
  "11_squirrel": { style: "quadruped", tail: [0.72, 0.68, "right"], eyes: false },
  "12_capybara": { style: "quadruped", tail: null, eyes: true, blink: false, tailCue: false },
  "13_panda": { style: "biped", tail: null, eyes: true },
  "14_koala": { style: "biped", tail: null, eyes: false },
  "15_sloth": { style: "biped", tail: null, eyes: true },
  "16_alpaca": { style: "quadruped", tail: [0.8, 0.6, "right", 0.12], eyes: true },
  "17_otter": { style: "quadruped", tail: [0.74, 0.72, "right"], eyes: false },
  "18_penguin": { style: "biped", tail: null, eyes: false },
  "19_axolotl": { style: "aquatic", tail: [0.22, 0.7, "left"], eyes: true },
  "20_seal": { style: "aquatic", tail: [0.78, 0.68, "right"], eyes: false },
  "21_sea_turtle": { style: "aquatic", tail: [0.8, 0.64, "right", 0.12], eyes: true },
  "22_pufferfish": { style: "aquatic", tail: [0.83, 0.55, "right", 0.12], eyes: true },
  "23_octopus": { style: "aquatic", tail: null, eyes: true, tailCue: false },
  "24_dolphin": { style: "aquatic", tail: [0.82, 0.66, "right"], eyes: false },
  "25_baby_dragon": { style: "winged", tail: [0.8, 0.74, "right"], eyes: false },
  "26_unicorn": { style: "quadruped", tail: [0.8, 0.62, "right"], eyes: false },
  "27_phoenix": { style: "winged", tail: [0.78, 0.74, "right"], eyes: true },
  "28_cloud_spirit": { style: "floating", tail: null, eyes: true },
  "29_moon_spirit": { style: "floating", tail: [0.75, 0.73, "right"], eyes: false },
  "30_sprout_spirit": { style: "plant", tail: null, eyes: true },
}

const NO_PAW = new Set(["round", "aquatic", "floating", "plant"])
const r = (v) => Number(v.toFixed(3))

const lines = []
for (const [code, m] of Object.entries(META)) {
  const s = seedByCode.get(code).seed
  const ref = refByCode.get(code)
  const parts = []
  parts.push(`  {`)
  parts.push(`    code: "${code}",`)
  parts.push(`    motionStyle: "${m.style}",`)
  parts.push(`    head: { x: ${r(s.head.x)}, y: ${r(s.head.y)} },`)
  parts.push(`    belly: { x: ${r(s.belly.x)}, y: ${r(s.belly.y)} },`)
  parts.push(`    feet: { x: ${r(s.feet.x)}, y: ${r(s.feet.y)} },`)
  if (m.eyes && ref && ref.eyeL && ref.eyeR) {
    const el = ref.eyeL
    const er = ref.eyeR
    const cx = (el[0] + er[0]) / 2
    const cy = (el[1] + er[1]) / 2
    const width = Math.hypot(er[0] - el[0], er[1] - el[1])
    const rotation = (Math.atan2(er[1] - el[1], er[0] - el[0]) * 180) / Math.PI
    const cl = ref.cheekL
    const cr = ref.cheekR
    parts.push(`    face: {`)
    parts.push(`      center: { x: ${r(cx)}, y: ${r(cy)} },`)
    parts.push(`      width: ${r(width)},`)
    parts.push(`      rotation: ${r(rotation)},`)
    parts.push(`      eyeLeft: { x: ${r(el[0])}, y: ${r(el[1])} },`)
    parts.push(`      eyeRight: { x: ${r(er[0])}, y: ${r(er[1])} },`)
    parts.push(`      cheekLeft: ${cl ? `{ x: ${r(cl[0])}, y: ${r(cl[1])} }` : "null"},`)
    parts.push(`      cheekRight: ${cr ? `{ x: ${r(cr[0])}, y: ${r(cr[1])} }` : "null"},`)
    parts.push(`    },`)
  } else {
    parts.push(`    face: null,`)
  }
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
