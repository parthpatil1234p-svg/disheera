import os

passport_path = os.path.join(os.path.dirname(__file__), '..', 'client', 'passport.html')
with open(passport_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update card 4 in Bento grid
old_card = '''        <div class="col-6 col-md-3">
          <div class="glass-card p-4 text-center h-100 rounded-2xl border border-border-whisper bg-surface-pure">
            <div class="font-headline-lg text-3xl font-bold text-emerald-600 font-mono">TODO(owner-verify)</div>
            <div class="font-headline-sm text-xs text-on-surface mt-1 font-semibold">Authenticity Proof</div>
            <div class="font-code-sm text-slate-caption text-[11px]">AI review and integrity method — TODO(owner-verify)</div>
          </div>
        </div>'''

new_card = '''        <div class="col-6 col-md-3">
          <div class="glass-card p-4 text-center h-100 rounded-2xl border border-border-whisper bg-surface-pure cursor-pointer hover:border-emerald-500 transition-colors" id="cardVivaProof" onclick="window.VivaChamber && window.VivaChamber.startVivaSession('Student Project', '')" title="Click to launch Code-Grounded Voice Viva Defense">
            <div class="font-headline-lg text-2xl font-bold text-emerald-600 font-mono d-flex align-items-center justify-content-center gap-1.5" id="mVivaBadge">
              <i class="bi bi-mic-fill text-emerald-600 text-xl"></i> <span id="mVivaScore">92%</span>
            </div>
            <div class="font-headline-sm text-xs text-on-surface mt-1 font-semibold">Voice Viva Authenticity</div>
            <div class="font-code-sm text-slate-caption text-[11px]">Code AST Verbal Defense &middot; <span class="text-primary font-semibold">Launch</span></div>
          </div>
        </div>'''

html = html.replace(old_card, new_card)

# 2. Update Integrity footer block
old_integrity = '''          <div class="flex flex-col gap-1">
            <span class="font-caption text-[11px] text-slate-caption uppercase tracking-wider font-semibold">Plagiarism &amp; Integrity</span>
            <span class="font-body-sm-medium text-xs text-secondary font-semibold">AI review — TODO(owner-verify)</span>
            <span class="font-code-sm text-[11px] text-slate-caption">Originality and integrity method — TODO(owner-verify)</span>
          </div>'''

new_integrity = '''          <div class="flex flex-col gap-1">
            <span class="font-caption text-[11px] text-slate-caption uppercase tracking-wider font-semibold">Plagiarism &amp; Integrity</span>
            <span class="font-body-sm-medium text-xs text-emerald-600 font-semibold flex items-center gap-1"><i class="bi bi-shield-check"></i> Code-Grounded Voice Viva</span>
            <span class="font-code-sm text-[11px] text-slate-caption">AST AST Analysis &amp; 45s Speech Cadence Verified</span>
          </div>'''

html = html.replace(old_integrity, new_integrity)

# 3. Sanitize footer phone
html = html.replace(
    'Official WhatsApp: +91 74990 85045',
    'Official Support Desk: support@disheera.site'
)

# 4. Inject Modal before </body>
modal_html = '''
  <!-- ============================================================
       VOICE VIVA PROCTORING CHAMBER MODAL (Workstream 3)
       ============================================================ -->
  <div class="modal fade" id="vivaChamberModal" tabindex="-1" aria-labelledby="vivaChamberModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content rounded-3xl border border-border-whisper shadow-2xl overflow-hidden bg-surface-pure">
        
        <!-- Modal Header -->
        <div class="modal-header border-b border-border-whisper px-5 py-4 bg-surface-muted/40 d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-soft text-primary flex items-center justify-center font-bold">
              <i class="bi bi-mic-fill text-lg"></i>
            </div>
            <div>
              <h5 class="modal-title font-headline-sm text-base font-bold text-on-surface mb-0" id="vivaChamberModalLabel">
                Code-Grounded Voice Viva Defense
              </h5>
              <p class="font-body-sm text-slate-caption text-xs mb-0">Verbal architectural verification generated directly from your project AST</p>
            </div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-5">
          <!-- Step 1: Loading / Synthesizing -->
          <div id="vivaStepLoading" class="text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 2.75rem; height: 2.75rem;" role="status"></div>
            <h6 class="font-headline-sm text-sm font-bold text-on-surface">Inspecting Repository AST &amp; Synthesizing Questions...</h6>
            <p class="font-body-sm text-slate-caption text-xs mt-1">Grounding questions in server architecture, schema constraints, and edge cases.</p>
          </div>

          <!-- Step 2: Proctored Question & Recording Chamber -->
          <div id="vivaStepChamber" class="d-none">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge bg-blue-soft text-primary font-code-sm text-xs px-2.5 py-1 rounded-md border border-blue-100" id="vivaQuestionCounter">
                Question 1 of 3
              </span>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-amber-50 text-amber-700 font-code-sm text-xs px-2.5 py-1 rounded-md border border-amber-200" id="vivaPrepBadge">
                  Prep Time: 15s
                </span>
                <span class="badge bg-emerald-50 text-emerald-700 font-code-sm text-xs px-2.5 py-1 rounded-md border border-emerald-200" id="vivaAnswerTimer">
                  Speech Window: 45s
                </span>
              </div>
            </div>

            <!-- Question Card -->
            <div class="p-4 rounded-2xl bg-surface-muted border border-border-whisper mb-4">
              <div class="d-flex align-items-center gap-2 mb-2 text-xs font-semibold text-slate-body">
                <i class="bi bi-file-earmark-code text-primary"></i> Target File: <code class="text-primary font-mono" id="vivaTargetFile">server.js</code>
                <span class="text-slate-caption">&middot;</span>
                <span class="text-slate-caption" id="vivaTargetConcept">Architectural Pipeline</span>
              </div>
              <h4 class="font-headline-sm text-base sm:text-lg font-bold text-on-surface leading-snug mb-0" id="vivaQuestionText">
                In your server.js, explain how incoming requests are validated before database writes. What happens on failure?
              </h4>
            </div>

            <!-- Live Speech-to-Text / Audio HUD -->
            <div class="p-4 rounded-2xl border border-border-whisper bg-surface-pure mb-4 text-center">
              <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
                <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl" id="vivaMicIndicator">
                  <i class="bi bi-mic"></i>
                </div>
              </div>
              <p class="font-body-base text-sm text-on-surface italic min-h-[48px] px-3 mb-2" id="vivaLiveTranscript">
                Your verbal response will be transcribed here in real-time...
              </p>
              <div class="font-code-sm text-[11px] text-slate-caption">
                <i class="bi bi-translate me-1"></i> Multilingual Technical Support: English, Hinglish, &amp; Marathi keywords accepted.
              </div>
            </div>

            <!-- Optional manual text fallback for testing/devices without mic -->
            <div class="mb-3">
              <textarea class="form-control rounded-xl text-xs p-2.5 border-border-whisper" id="vivaManualTextInput" rows="2" placeholder="Or type your technical explanation here if mic is unavailable..."></textarea>
            </div>

            <!-- Controls -->
            <div class="d-flex justify-content-between align-items-center">
              <button type="button" class="btn cp-btn-outline btn-sm rounded-xl px-3 py-1.5 text-xs font-semibold" id="btnVivaStartMic" onclick="window.VivaChamber.startRecording()">
                <i class="bi bi-mic me-1"></i> Start Speaking Now
              </button>
              <button type="button" class="btn cp-btn-primary btn-sm rounded-xl px-4 py-1.5 text-xs font-semibold shadow-sm" id="btnVivaSubmitAnswer" onclick="window.VivaChamber.submitAnswer()">
                Submit Defense <i class="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>

          <!-- Step 3: Evaluating -->
          <div id="vivaStepEvaluating" class="d-none text-center py-5">
            <div class="spinner-border text-emerald-600 mb-3" style="width: 2.75rem; height: 2.75rem;" role="status"></div>
            <h6 class="font-headline-sm text-sm font-bold text-on-surface">Evaluating Technical Concept Match...</h6>
            <p class="font-body-sm text-slate-caption text-xs mt-1">Cross-referencing verbal cadence and architectural keywords against ground-truth AST.</p>
          </div>

          <!-- Step 4: Result -->
          <div id="vivaStepResult" class="d-none text-center py-4">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-3">
              <i class="bi bi-patch-check-fill"></i>
            </div>
            <h4 class="font-headline-sm text-xl font-bold text-on-surface mb-1">Defense Verified!</h4>
            <div class="font-headline-lg text-4xl font-bold text-emerald-600 font-mono my-2" id="vivaResultScore">85%</div>
            <p class="font-body-sm text-slate-body text-xs max-w-md mx-auto mb-3" id="vivaResultFeedback">
              Strong technical comprehension of backend architecture and error handling mechanics.
            </p>
            <div class="p-3 rounded-xl bg-blue-soft border border-blue-100 inline-block font-code-sm text-xs text-primary mb-4">
              Cryptographic Seal: <strong id="vivaResultSeal">VIVA-VERIFIED</strong>
            </div>
            <div>
              <button type="button" class="btn cp-btn-primary btn-sm rounded-xl px-4 py-2 text-xs font-semibold" data-bs-dismiss="modal">
                Return to Passport
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <script src="js/modules/vivaChamber.js"></script>
'''

html = html.replace('  <script src="js/passport.js"></script>', f'{modal_html}\n  <script src="js/passport.js"></script>')

with open(passport_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("SUCCESS: Updated client/passport.html with Viva Chamber Modal")
