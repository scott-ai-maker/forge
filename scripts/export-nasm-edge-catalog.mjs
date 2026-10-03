import fs from 'fs'

const NASM_EDGE_PLAYLIST_ID = 'PLeVb1RGNTvdfb_UAXU22VNxHQmE0jHvbE'

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizePlaylistTitle(value) {
  return normalizeText(value)
    .replace(/^NASM\s*Edge\s*[:\-]\s*/i, '')
    .replace(/^NASM\s*[:\-]\s*/i, '')
    .replace(/\s*\|\s*NASM(\s*Edge)?$/i, '')
    .replace(/\s*-\s*NASM(\s*Edge)?$/i, '')
    .trim()
}

async function fetchNasmEdgePlaylistEntries() {
  console.log('Fetching NASM Edge official playlist...')
  const playlistPageResponse = await fetch(`https://www.youtube.com/playlist?list=${NASM_EDGE_PLAYLIST_ID}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!playlistPageResponse.ok) {
    console.error(`Failed to load YouTube playlist page: ${playlistPageResponse.status}`)
    return []
  }

  const html = await playlistPageResponse.text()
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1]
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? '2.20240101.00.00'
  const initialDataMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});/)

  if (!apiKey || !initialDataMatch) {
    console.error('Failed to parse YouTube playlist page payload.')
    return []
  }

  const initialData = JSON.parse(initialDataMatch[1])

  function collectContinuationTokens(node, out = new Set()) {
    if (!node || typeof node !== 'object') return out

    if (Array.isArray(node)) {
      for (const value of node) {
        collectContinuationTokens(value, out)
      }
      return out
    }

    if (node.continuationCommand?.token) {
      out.add(node.continuationCommand.token)
    }
    if (node.nextContinuationData?.continuation) {
      out.add(node.nextContinuationData.continuation)
    }

    for (const value of Object.values(node)) {
      collectContinuationTokens(value, out)
    }

    return out
  }

  function readInitialPlaylistItems(root) {
    return root?.contents?.twoColumnBrowseResultsRenderer?.tabs
      ?.map(tab => tab.tabRenderer)
      ?.find(tab => tab?.selected)
      ?.content?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents?.[0]
      ?.playlistVideoListRenderer?.contents ?? []
  }

  function parsePlaylistEntriesFromItems(items) {
    const entries = []

    for (const item of items) {
      const renderer = item?.playlistVideoRenderer
      if (!renderer?.videoId) continue

      const rawTitle = normalizeText(renderer?.title?.runs?.[0]?.text || renderer?.title?.simpleText)
      const cleanTitle = normalizePlaylistTitle(rawTitle)

      entries.push({
        videoId: renderer.videoId,
        title: cleanTitle,
        rawTitle,
      })
    }

    return entries
  }

  async function fetchContinuationPage(token) {
    const response = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion,
          },
        },
        continuation: token,
      }),
    })

    if (!response.ok) return { entries: [], nextToken: null }
    const payload = await response.json()
    const actions = [
      ...(Array.isArray(payload?.onResponseReceivedActions) ? payload.onResponseReceivedActions : []),
      ...(Array.isArray(payload?.onResponseReceivedEndpoints) ? payload.onResponseReceivedEndpoints : []),
    ]

    const items = []
    for (const action of actions) {
      const append = action?.appendContinuationItemsAction?.continuationItems
      if (Array.isArray(append)) items.push(...append)
      const reload = action?.reloadContinuationItemsCommand?.continuationItems
      if (Array.isArray(reload)) items.push(...reload)
    }

    const entries = parsePlaylistEntriesFromItems(items)
    const tokens = [...collectContinuationTokens(payload)]
    const nextToken = tokens.find(candidate => candidate !== token) ?? null

    return { entries, nextToken }
  }

  const initialItems = readInitialPlaylistItems(initialData)
  const playlistEntries = parsePlaylistEntriesFromItems(initialItems)

  const candidateTokens = [...collectContinuationTokens(initialData)]
  let bootstrapEntries = []
  let nextTokenAfterBootstrap = null

  for (const token of candidateTokens) {
    const probe = await fetchContinuationPage(token)
    if (probe.entries.length === 0) continue

    bootstrapEntries = probe.entries
    nextTokenAfterBootstrap = probe.nextToken
    break
  }

  if (bootstrapEntries.length > 0) {
    playlistEntries.push(...bootstrapEntries)
  }

  let nextToken = nextTokenAfterBootstrap
  let pageGuard = 0

  while (nextToken && pageGuard < 40) {
    pageGuard += 1
    const page = await fetchContinuationPage(nextToken)
    playlistEntries.push(...page.entries)
    nextToken = page.nextToken
  }

  console.log(`Fetched ${playlistEntries.length} official NASM Edge videos from playlist!`)
  return playlistEntries
}

async function main() {
  const entries = await fetchNasmEdgePlaylistEntries()
  fs.writeFileSync('scripts/nasm-edge-scraped.json', JSON.stringify(entries, null, 2))
  console.log('Saved to scripts/nasm-edge-scraped.json')
  console.log('Total entries:', entries.length)
}

main()
