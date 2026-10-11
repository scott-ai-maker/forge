import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const RAG_VCS_DIR = path.resolve(process.cwd(), 'data/rag-resources/vcs')
const AUTH_STATE_PATH = path.resolve(process.cwd(), 'scripts/.nasm-auth-state.json')
const MANIFEST_PATH = path.resolve(RAG_VCS_DIR, 'nasm-vcs-manifest.json')
const MASTER_MD_PATH = path.resolve(RAG_VCS_DIR, 'nasm-vcs-complete-curriculum.md')
const MASTER_PDF_PATH = path.resolve(RAG_VCS_DIR, 'NASM-VCS-Master-Curriculum-Comprehensive.pdf')

const COURSE_SYLLABUS = [
  {
    chapterNum: 1,
    title: 'Introduction to Virtual Coaching',
    lessons: [
      { num: 1, name: 'Welcome to NASM Virtual Coaching' },
      { num: 2, name: 'Virtual Coaching Considerations' },
    ],
  },
  {
    chapterNum: 2,
    title: 'Building a Business',
    lessons: [
      { num: 1, name: 'The Virtual Coaching Business' },
      { num: 2, name: 'Building a Virtual Coaching Business Plan: Part I' },
      { num: 3, name: 'Building a Virtual Coaching Business Plan: Part II' },
    ],
  },
  {
    chapterNum: 3,
    title: 'Technology Considerations',
    lessons: [
      { num: 1, name: 'Hardware Requirements' },
      { num: 2, name: 'Software Requirements' },
      { num: 3, name: 'Computer Peripheral Requirements' },
      { num: 4, name: 'Fitness Programming Software Options' },
    ],
  },
  {
    chapterNum: 4,
    title: 'Communication and Coaching Strategies',
    lessons: [
      { num: 1, name: 'Virtual Coaching 101' },
      { num: 2, name: 'Virtual Accountability Strategies' },
      { num: 3, name: 'Virtual Motivational Interviewing' },
    ],
  },
  {
    chapterNum: 5,
    title: 'Administering Virtual Assessments',
    lessons: [
      { num: 1, name: 'Virtual Pre-Participation Health Screening' },
      { num: 2, name: 'Virtual Physiological Assessments' },
      { num: 3, name: 'Virtual Movement and Mobility Assessments' },
      { num: 4, name: 'Virtual Muscular Endurance Assessments' },
    ],
  },
  {
    chapterNum: 6,
    title: 'Implementing Coaching Sessions',
    lessons: [
      { num: 1, name: 'Session Preparation' },
      { num: 2, name: 'Training Environment' },
      { num: 3, name: 'Client Instruction and Virtual Communication Strategies' },
      { num: 4, name: 'Conducting Small or Large Group Training' },
    ],
  },
  {
    chapterNum: 7,
    title: 'Integrating Wearables Into Virtual Coaching',
    lessons: [
      { num: 1, name: 'Introduction to Fitness Wearables' },
      { num: 2, name: 'Biometric Education' },
      { num: 3, name: 'Building a Program' },
    ],
  },
  {
    chapterNum: 8,
    title: 'Selling Virtual Coaching',
    lessons: [
      { num: 1, name: 'Introduction to Sales, Pricing, and Packaging' },
      { num: 2, name: 'Sales Goals and Process Customization' },
      { num: 3, name: 'The Onboarding Process' },
      { num: 4, name: 'Billing and Collecting Payment' },
    ],
  },
  {
    chapterNum: 9,
    title: 'Marketing Virtual Coaching',
    lessons: [
      { num: 1, name: 'Introduction to Virtual Coaching Marketing' },
      { num: 2, name: 'Online Marketing Vehicles and Strategies' },
      { num: 3, name: 'Evaluating Marketing Efforts' },
    ],
  },
]

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

async function renderHtmlToPdf(browser, title, chapterLabel, htmlContent, outputPath) {
  const page = await browser.newPage()
  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: letter;
          margin: 20mm 15mm 20mm 15mm;
          @bottom-right {
            content: counter(page);
          }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          line-height: 1.65;
          font-size: 11pt;
          margin: 0;
          padding: 0;
        }
        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .header h1 {
          color: #1e3a8a;
          margin: 0 0 6px 0;
          font-size: 20pt;
        }
        .header .subtitle {
          color: #64748b;
          font-size: 10.5pt;
          font-weight: 500;
        }
        .badge {
          display: inline-block;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: 600;
          margin-bottom: 8px;
        }
        h2 {
          color: #1e3a8a;
          font-size: 14pt;
          margin-top: 26px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          page-break-after: avoid;
        }
        h3 {
          color: #0f172a;
          font-size: 12pt;
          margin-top: 18px;
          margin-bottom: 6px;
          page-break-after: avoid;
        }
        h4, h5 {
          color: #334155;
          margin-top: 12px;
          margin-bottom: 4px;
          page-break-after: avoid;
        }
        p {
          margin: 8px 0;
          orphans: 3;
          widows: 3;
        }
        ul, ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        li {
          margin: 4px 0;
        }
        .page-break {
          page-break-before: always;
        }
        .section-box {
          background: #f8fafc;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          margin: 16px 0;
          border-radius: 0 6px 6px 0;
        }
        img {
          max-width: 100%;
          page-break-inside: avoid;
        }
        .footer {
          margin-top: 36px;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          font-size: 9pt;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="badge">NASM VIRTUAL COACHING SPECIALIST (VCS)</div>
        <h1>${chapterLabel}: ${title}</h1>
        <div class="subtitle">National Academy of Sports Medicine — Evidence-Based Telehealth Curriculum</div>
      </div>
      ${htmlContent}
      <div class="footer">
        Forge Athletic Sports Science RAG Architecture • National Academy of Sports Medicine (NASM-VCS)
      </div>
    </body>
    </html>
  `
  await page.setContent(styledHtml, { waitUntil: 'load' })
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  })
  await page.close()
}

async function scrapeAllSyllabusLessons() {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    console.error('No auth session found. Run authentication first!')
    process.exit(1)
  }

  if (!fs.existsSync(RAG_VCS_DIR)) {
    fs.mkdirSync(RAG_VCS_DIR, { recursive: true })
  }

  console.log('[Scraper] Launching Chromium with saved session...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: AUTH_STATE_PATH,
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  })

  const page = await context.newPage()

  console.log('[Scraper] Initializing SCORM session at mod/scorm/view.php?id=66610...')
  await page.goto('https://nasmu.nasm.org/mod/scorm/view.php?id=66610', {
    waitUntil: 'networkidle',
    timeout: 45000,
  })

  // Handle "Yes/No" resume prompt
  const yesBtn = page.locator('button, input[type="submit"]').filter({ hasText: /^Yes$/i }).first()
  if (await yesBtn.count() > 0) {
    console.log('[Scraper] Found resume prompt, clicking Yes...')
    await yesBtn.click()
    await page.waitForTimeout(3000)
  }

  const manifestItems = []
  let masterMarkdown = `# NASM Virtual Coaching Specialization (VCS)\n\nOfficial Curriculum and Practice Standards.\n\n---\n\n`
  let masterHtml = ''
  let grandTotalPages = 0

  for (const chapter of COURSE_SYLLABUS) {
    const chNum = chapter.chapterNum
    const chTitle = chapter.title
    console.log(`\n======================================================`)
    console.log(`📚 CHAPTER ${chNum}: ${chTitle} (${chapter.lessons.length} Lessons)`)
    console.log(`======================================================`)

    const chapterPages = []
    let chapterMarkdown = `# Chapter ${chNum}: ${chTitle}\n\n`
    let chapterHtml = ''

    for (const lesson of chapter.lessons) {
      console.log(`\n[Chapter ${chNum}] Navigating to Lesson ${lesson.num}: "${lesson.name}"...`)

      // Click lesson link in app-side-nav via evaluate
      const clicked = await page.evaluate(targetName => {
        const links = Array.from(document.querySelectorAll('app-side-nav a.nav-link'))
        const target = links.find(a =>
          a.innerText.toLowerCase().includes(targetName.toLowerCase().slice(0, 20))
        )
        if (target) {
          target.click()
          return true
        }
        return false
      }, lesson.name)

      if (!clicked) {
        console.warn(`[Chapter ${chNum}] Could not locate lesson link for "${lesson.name}". Retrying with menu toggle...`)
        await page.evaluate(() => {
          const btn = document.querySelector('button[title="Course Menu"], .btn.menu')
          if (btn) btn.click()
        })
        await page.waitForTimeout(1500)
        await page.evaluate(targetName => {
          const links = Array.from(document.querySelectorAll('app-side-nav a.nav-link'))
          const target = links.find(a =>
            a.innerText.toLowerCase().includes(targetName.toLowerCase().slice(0, 20))
          )
          if (target) target.click()
        }, lesson.name)
      }

      await page.waitForTimeout(3000)

      // Click Begin Lesson if present
      const beginBtn = page.locator('button, a, input').filter({ hasText: /BEGIN LESSON|BEGIN CHAPTER/i }).first()
      if (await beginBtn.count() > 0 && (await beginBtn.isVisible())) {
        console.log(`[Chapter ${chNum} L${lesson.num}] Clicking BEGIN LESSON...`)
        await beginBtn.click()
        await page.waitForTimeout(2500)
      }

      // Loop through all pages of this lesson
      let hasNextPage = true
      let pageIndex = 1
      const visitedInLesson = new Set()

      while (hasNextPage && pageIndex <= 35) {
        const currentUrl = page.url()
        await page.waitForTimeout(1500)

        // Extract content from .content-wrapper div.container.padded
        const extracted = await page.evaluate(() => {
          const container =
            document.querySelector('.content-wrapper div.container.padded') ||
            document.querySelector('.content-wrapper .container') ||
            document.querySelector('.content-wrapper')

          if (!container) return null

          const clone = container.cloneNode(true)
          const toRemove = clone.querySelectorAll(
            'app-site-header, nav.page-menu, .pagination, #paginationMenu, .nav-buttons'
          )
          toRemove.forEach(el => el.remove())

          // Open all details/accordions
          clone.querySelectorAll('details').forEach(d => { d.open = true })

          const headings = Array.from(clone.querySelectorAll('h1, h2, h3, h4'))
            .map(h => h.innerText.trim())
            .filter(Boolean)

          return {
            html: clone.innerHTML,
            text: clone.innerText.trim(),
            headings,
          }
        })

        if (extracted && extracted.text.length > 20) {
          const pageSignature = `${currentUrl}::${extracted.headings[0] || ''}`
          if (!visitedInLesson.has(pageSignature)) {
            visitedInLesson.add(pageSignature)
            chapterPages.push(extracted)
            grandTotalPages++

            const headingLabel = extracted.headings[0] || 'Content'
            console.log(
              `  ✓ [Ch ${chNum} L${lesson.num} P${pageIndex}] ${headingLabel} (${extracted.text.length} chars)`
            )

            chapterMarkdown += `### ${headingLabel}\n\n${extracted.text}\n\n---\n\n`
            chapterHtml += `<div class="page-section">${extracted.html}</div><div class="page-break"></div>`
          }
        }

        // Try clicking Next Page button in pagination menu
        const nextClicked = await page.evaluate(() => {
          const nextBtn =
            document.querySelector('nav.page-menu a.page-link[aria-label="Next Page"]') ||
            Array.from(document.querySelectorAll('nav.page-menu a.page-link')).find(
              a => a.innerText.trim().toLowerCase() === 'next'
            )
          if (nextBtn) {
            nextBtn.click()
            return true
          }
          return false
        })

        if (nextClicked) {
          await page.waitForTimeout(2000)
          pageIndex++
        } else {
          hasNextPage = false
        }
      }

      console.log(`[Chapter ${chNum} L${lesson.num}] Lesson complete (${visitedInLesson.size} pages captured).`)
    }

    // Save Chapter Markdown & PDF
    const chFilename = `NASM-VCS-Ch0${chNum}-${sanitizeFilename(chTitle)}.pdf`
    const chPdfPath = path.join(RAG_VCS_DIR, chFilename)
    const chMdPath = path.join(RAG_VCS_DIR, `ch0${chNum}-${sanitizeFilename(chTitle).toLowerCase()}.md`)

    fs.writeFileSync(chMdPath, chapterMarkdown, 'utf-8')
    console.log(`[Compiler] Saved Chapter ${chNum} Markdown: ${chMdPath}`)

    if (chapterPages.length > 0) {
      await renderHtmlToPdf(browser, chTitle, `Chapter ${chNum}`, chapterHtml, chPdfPath)
      const sizeKb = (fs.statSync(chPdfPath).size / 1024).toFixed(1)
      console.log(`[Compiler] ✅ Saved Chapter ${chNum} PDF: ${chFilename} (${sizeKb} KB, ${chapterPages.length} pages)`)

      masterMarkdown += chapterMarkdown
      masterHtml += `<div class="chapter-container"><h1>Chapter ${chNum}: ${chTitle}</h1>${chapterHtml}</div><div class="page-break"></div>`

      // Extract unique key concepts
      const allHeadings = chapterPages.flatMap(p => p.headings).filter(h => h.length > 3 && h.length < 50)
      const uniqueConcepts = Array.from(new Set(allHeadings)).slice(0, 6)

      manifestItems.push({
        id: `vcs_ch0${chNum}`,
        filename: `vcs/${chFilename}`,
        title: `Chapter ${chNum}: ${chTitle}`,
        category: 'Virtual Coaching Protocol',
        goalCategory: 'Virtual Coaching & Remote Telehealth',
        chapterNumber: chNum,
        pageCount: chapterPages.length,
        summary:
          chapterPages[0]?.text?.slice(0, 350).replace(/\s+/g, ' ').trim() ||
          `NASM Virtual Coaching Specialization Chapter ${chNum}: ${chTitle}.`,
        keyConcepts:
          uniqueConcepts.length > 0 ? uniqueConcepts : ['Virtual Coaching', 'Telehealth', 'Adherence'],
      })
    }
  }

  // Save Master Curriculum Markdown
  fs.writeFileSync(MASTER_MD_PATH, masterMarkdown, 'utf-8')
  console.log(`\n[Compiler] Master curriculum markdown written to: ${MASTER_MD_PATH}`)

  // Render Master Curriculum PDF
  console.log(`[Compiler] Rendering Consolidated Master PDF...`)
  await renderHtmlToPdf(browser, 'Master Curriculum Comprehensive', 'Specialization Overview', masterHtml, MASTER_PDF_PATH)
  const masterSizeKb = (fs.statSync(MASTER_PDF_PATH).size / 1024).toFixed(1)
  console.log(`[Compiler] ✅ Saved Master PDF: ${path.basename(MASTER_PDF_PATH)} (${masterSizeKb} KB)`)

  manifestItems.unshift({
    id: 'vcs_master_curriculum',
    filename: 'vcs/NASM-VCS-Master-Curriculum-Comprehensive.pdf',
    title: 'NASM Virtual Coaching Specialization: Master Curriculum Comprehensive',
    category: 'Virtual Coaching Protocol',
    goalCategory: 'Virtual Coaching & Remote Telehealth',
    chapterNumber: 0,
    pageCount: grandTotalPages,
    summary:
      'Complete evidence-based curriculum for virtual coaching, digital client onboarding, telehealth communication, remote movement assessments, and wearable integration.',
    keyConcepts: [
      'Virtual Coaching Architecture',
      'Remote Biomechanical Assessments',
      'Telehealth Consultation Standards',
      'Wearable Telemetry Integration',
      'Virtual Client Retention',
    ],
  })

  // Write final manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifestItems, null, 2), 'utf-8')
  console.log(`[Compiler] Manifest saved with ${manifestItems.length} indexed documents to: ${MANIFEST_PATH}`)
  console.log(`\n🎉 Grand Total Pages Captured: ${grandTotalPages}`)

  await browser.close()
  return manifestItems
}

scrapeAllSyllabusLessons().catch(err => {
  console.error('[Fatal Error]', err)
  process.exit(1)
})
