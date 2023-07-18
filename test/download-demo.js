//const response = await fetch('https://rawcdn.githack.com/chxngeme/fdist/8d840bc51de63ae5fc3d671aa005e43d84ad17a4/h2demo.zip')
// const buffer = await response.arrayBuffer()
// console.log(buffer)
import { openDB, deleteDB, wrap, unwrap } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';
import {
  BlobReader,
  BlobWriter,
  ZipReader,
  ZipWriter,
} from "https://deno.land/x/zipjs/index.js"

const dbName = "/persistent"
const objectStoreName = "FILE_DATA"
const modefile = 33206
const modefolder = 16832
const dirs = ["/persistent/maps", "/persistent/data", "/persistent/files", "/persistent/files/data"]
const sources = [{
  link: 'https://rawcdn.githack.com/chxngeme/fdist/8d840bc51de63ae5fc3d671aa005e43d84ad17a4/h2demo.zip',
  type: 'archive',
  files: [
  {
    src: 'data/heroes2.agg',
    target: '/persistent/data/fheroes2.agg',
  },
  {
    src: 'maps/brokena.mp2',
    target: '/persistent/maps/brokena.mp2',
  },
]
}, {
  link: 'https://rawcdn.githack.com/ihhub/fheroes2/2563ba5fa7cd602b97d7f69579fe59f9ddba3e1d/files/data/resurrection.h2d',
  type: 'raw',
  target: '/persistent/files/data/resurrection.h2d'
}]

//https://rawcdn.githack.com/ihhub/fheroes2/2563ba5fa7cd602b97d7f69579fe59f9ddba3e1d/files/data/resurrection.h2d

const db = await openDB("/persistent", undefined)
for (const [, v] of Object.entries(dirs)) {
  const obj = {
    timestamp: new Date(),
    mode: modefolder
  }
  await db.put(objectStoreName, obj, v)
}
for (const [, v] of Object.entries(sources)) {
  if (await accountedfor(v)) continue
  console.log('Starting fetch')
  if (v.type === 'archive') {
    const response = await fetch(v.link)
    const bb = await response.blob()
    const zipFileReader = new BlobReader(bb)
    const zipReader = new ZipReader(zipFileReader)
    const entries = await zipReader.getEntries()
    for (const [, e] of Object.entries(v.files)) {
      const store = db.transaction(objectStoreName).objectStore(objectStoreName)
      const test = await store.get(e.target)
      if (test !== undefined) continue
      const lowersrc = e.src.toLocaleLowerCase()
      const agg = entries.filter((x) => x.filename.toLocaleLowerCase().endsWith(lowersrc)).pop()
      const h = new BlobWriter()
      const data = await agg.getData(h)
      console.log(data)
      const buff = await data.arrayBuffer()
      console.log(buff)
      const u = new Uint8Array(buff)
      await put(u, e.target)
    }
  } else if (v.type === 'raw') {
    const response = await fetch(v.link)
    const buf = await response.arrayBuffer()
    const u = new Uint8Array(buf)
    put(u, v.target)
  }
}

async function put(data, path) {

  // link: 'https://rawcdn.githack.com/chxngeme/fdist/8d840bc51de63ae5fc3d671aa005e43d84ad17a4/h2demo.zip'
  // name: heroes2.agg
  // path: /persistent/heroes2.agg
  const obj = {
    timestamp: new Date(),
    contents: data,
    mode: modefile
  }
  await db.put(objectStoreName, obj, path)
}

async function accountedfor(source) {
  if (source.type === 'archive') {
    for (const [, e] of Object.entries(source.files)) {
      const store = db.transaction(objectStoreName).objectStore(objectStoreName)
      const test = await store.get(e.target)
      if (test === undefined) return false
    }
    return true
  } else if (source.type === 'raw') {
    const store = db.transaction(objectStoreName).objectStore(objectStoreName)
    const test = await store.get(source.target)
    return test !== undefined
  } else {
    return true
  }
}