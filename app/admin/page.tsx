'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Question, type Answer } from '@/lib/supabase'
import { Plus, Trash2, CheckCircle2, Zap, ChevronDown, ChevronUp, X, Pencil, Sun, Moon } from 'lucide-react'

const ADMIN_PASSWORD = '0852'

type QuestionWithStats = Question & {
  answers: (Answer & { vote_count: number })[]
  total_votes: number
}

type EditableAnswer = {
  id?: string
  text: string
  toDelete?: boolean
}

// ─── Theme helpers ────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'

const t = {
  bg:         (th: Theme) => th === 'dark' ? '#2D2D32' : '#f0f4f7',
  surface:    (th: Theme) => th === 'dark' ? 'rgba(255,255,255,0.04)' : '#ffffff',
  surfaceAct: (th: Theme) => th === 'dark' ? 'rgba(2,87,123,0.2)'     : 'rgba(37,151,188,0.08)',
  border:     (th: Theme) => th === 'dark' ? 'rgba(255,255,255,0.1)'   : 'rgba(0,0,0,0.1)',
  borderAct:  (th: Theme) => th === 'dark' ? 'rgba(37,151,188,0.6)'    : '#2597BC',
  text:       (th: Theme) => th === 'dark' ? '#ffffff'                  : '#2D2D32',
  textMuted:  (th: Theme) => th === 'dark' ? 'rgba(255,255,255,0.3)'   : 'rgba(0,0,0,0.35)',
  input:      (th: Theme) => th === 'dark' ? 'rgba(2,87,123,0.15)'     : '#ffffff',
  inputBorder:(th: Theme) => th === 'dark' ? 'rgba(37,151,188,0.25)'   : 'rgba(37,151,188,0.4)',
  modal:      (th: Theme) => th === 'dark' ? '#1e2a30'                  : '#ffffff',
  bar:        (th: Theme) => th === 'dark' ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.08)',
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === ADMIN_PASSWORD) { onLogin() }
    else { setError(true); setInput('') }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#2D2D32' }}>
      <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#2597BC' }}>VRD Metaalrecycling</div>
      <h1 className="text-2xl font-bold text-white">Questionnaire Admin</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          placeholder="Wachtwoord"
          autoFocus
          className="rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none border transition-colors"
          style={{ background: 'rgba(2,87,123,0.2)', borderColor: error ? '#ef4444' : 'rgba(37,151,188,0.3)' }}
        />
        {error && <p className="text-red-400 text-sm text-center">Verkeerd wachtwoord</p>}
        <button type="submit" className="rounded-xl px-4 py-3 text-white font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}>
          Inloggen
        </button>
      </form>
    </div>
  )
}

// ─── Chart colors ─────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2597BC', '#02577B', '#4db8d4', '#016a94', '#7dd3e8', '#015f84']

type AnswerWithStats = Answer & { vote_count: number }

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({ q, onActivate, onDelete, onEdit, isActive, theme }: {
  q: QuestionWithStats
  onActivate: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (q: QuestionWithStats) => void
  isActive: boolean
  theme: Theme
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-2xl border transition-all duration-300" style={{
      borderColor: isActive ? t.borderAct(theme) : t.border(theme),
      background: isActive ? t.surfaceAct(theme) : t.surface(theme),
    }}>
      <div className="flex items-start gap-3 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{ background: 'rgba(37,151,188,0.15)', color: '#2597BC', borderColor: 'rgba(37,151,188,0.4)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2597BC' }} />
                Actief
              </span>
            )}
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: t.bar(theme), color: t.textMuted(theme) }}>
              {q.total_votes} stem{q.total_votes !== 1 ? 'men' : ''}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: t.bar(theme), color: t.textMuted(theme) }}>
              {q.answers.length} {q.answers.length === 1 ? 'antwoord' : 'antwoorden'}
            </span>
          </div>
          <p className="font-medium leading-snug" style={{ color: t.text(theme) }}>{q.text}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isActive && (
            <button onClick={() => onActivate(q.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}>
              <Zap className="w-3.5 h-3.5" /> Activeer
            </button>
          )}
          <button onClick={() => onEdit(q)}
            className="p-2 rounded-lg transition-colors hover:bg-black/10"
            style={{ color: t.textMuted(theme) }}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(q.id)}
            className="p-2 rounded-lg transition-colors hover:text-red-400 hover:bg-red-500/10"
            style={{ color: t.textMuted(theme) }}>
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="p-2 rounded-lg transition-colors hover:bg-black/10"
            style={{ color: t.textMuted(theme) }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: t.border(theme) }}>
          <div className="grid gap-2">
            {(q.answers as AnswerWithStats[]).map((a, i) => {
              const pct = q.total_votes > 0 ? Math.round((a.vote_count / q.total_votes) * 100) : 0
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-sm w-5 shrink-0" style={{ color: t.textMuted(theme) }}>{String.fromCharCode(65 + i)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: t.text(theme) }}>{a.text}</span>
                      <span className="tabular-nums" style={{ color: t.textMuted(theme) }}>{a.vote_count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: t.bar(theme) }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Question modal (add + edit) ──────────────────────────────────────────────

function QuestionModal({ onClose, onSave, initial, theme }: {
  onClose: () => void
  onSave: (activate?: boolean) => void
  initial?: QuestionWithStats
  theme: Theme
}) {
  const isEdit = !!initial
  const [questionText, setQuestionText] = useState(initial?.text ?? '')
  const [answers, setAnswers] = useState<EditableAnswer[]>(
    initial?.answers.map(a => ({ id: a.id, text: a.text })) ?? [{ text: '' }, { text: '' }]
  )
  const [saving, setSaving] = useState<'save' | 'activate' | null>(null)

  const visibleAnswers = answers.filter(a => !a.toDelete)
  const canSave = questionText.trim() && visibleAnswers.filter(a => a.text.trim()).length >= 2

  const handleSubmit = async (activate = false) => {
    if (!canSave) return
    setSaving(activate ? 'activate' : 'save')

    if (isEdit && initial) {
      await supabase.from('questions').update({ text: questionText.trim() }).eq('id', initial.id)
      const toDelete = answers.filter(a => a.id && a.toDelete)
      for (const a of toDelete) await supabase.from('answers').delete().eq('id', a.id!)
      const toUpdate = answers.filter(a => a.id && !a.toDelete && a.text.trim())
      for (const a of toUpdate) await supabase.from('answers').update({ text: a.text.trim() }).eq('id', a.id!)
      const toInsert = answers.filter(a => !a.id && !a.toDelete && a.text.trim())
      if (toInsert.length > 0) {
        await supabase.from('answers').insert(toInsert.map(a => ({ question_id: initial.id, text: a.text.trim() })))
      }
      if (activate) {
        await supabase.from('questions').update({ is_active: false }).neq('id', initial.id)
        await supabase.from('questions').update({ is_active: true }).eq('id', initial.id)
      }
    } else {
      const { data: q } = await supabase
        .from('questions')
        .insert({ text: questionText.trim(), is_active: activate })
        .select().single()
      if (q) {
        await supabase.from('answers').insert(
          answers.filter(a => a.text.trim()).map(a => ({ question_id: q.id, text: a.text.trim() }))
        )
        if (activate) {
          await supabase.from('questions').update({ is_active: false }).neq('id', q.id)
          await supabase.from('questions').update({ is_active: true }).eq('id', q.id)
        }
      }
    }

    setSaving(null)
    onSave(activate)
    onClose()
  }

  const removeAnswer = (i: number) => {
    const a = answers[i]
    if (a.id) setAnswers(prev => prev.map((v, j) => j === i ? { ...v, toDelete: true } : v))
    else setAnswers(prev => prev.filter((_, j) => j !== i))
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-lg border shadow-2xl" style={{ background: t.modal(theme), borderColor: 'rgba(37,151,188,0.2)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: t.border(theme) }}>
          <h2 className="text-lg font-semibold" style={{ color: t.text(theme) }}>
            {isEdit ? 'Vraag bewerken' : 'Nieuwe vraag'}
          </h2>
          <button onClick={onClose} className="transition-colors hover:opacity-60" style={{ color: t.textMuted(theme) }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: t.textMuted(theme) }}>Vraag</label>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Typ hier je vraag..."
              rows={2}
              className="w-full rounded-xl px-4 py-3 outline-none border transition-colors resize-none"
              style={{ background: t.input(theme), borderColor: t.inputBorder(theme), color: t.text(theme) }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ color: t.textMuted(theme) }}>Antwoorden (min. 2)</label>
            <div className="flex flex-col gap-2">
              {answers.map((a, i) => {
                if (a.toDelete) return null
                const visibleIndex = answers.slice(0, i).filter(v => !v.toDelete).length
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-sm w-5" style={{ color: t.textMuted(theme) }}>{String.fromCharCode(65 + visibleIndex)}</span>
                    <input
                      value={a.text}
                      onChange={e => setAnswers(prev => prev.map((v, j) => j === i ? { ...v, text: e.target.value } : v))}
                      placeholder={`Antwoord ${String.fromCharCode(65 + visibleIndex)}`}
                      className="flex-1 rounded-xl px-4 py-2.5 outline-none border transition-colors"
                      style={{ background: t.input(theme), borderColor: t.inputBorder(theme), color: t.text(theme) }}
                    />
                    {visibleAnswers.length > 2 && (
                      <button type="button" onClick={() => removeAnswer(i)} className="transition-colors hover:text-red-400" style={{ color: t.textMuted(theme) }}>
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
              {visibleAnswers.length < 6 && (
                <button type="button" onClick={() => setAnswers(prev => [...prev, { text: '' }])}
                  className="flex items-center gap-2 text-sm transition-colors mt-1 ml-7 hover:opacity-80"
                  style={{ color: '#2597BC' }}>
                  <Plus className="w-4 h-4" /> Antwoord toevoegen
                </button>
              )}
            </div>
          </div>

          {isEdit && answers.some(a => a.toDelete && a.id) && (
            <p className="text-xs text-amber-400/70">
              Verwijderde antwoorden en hun stemmen worden permanent gewist bij opslaan.
            </p>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl py-2.5 font-medium transition-colors"
                style={{ background: t.bar(theme), color: t.textMuted(theme) }}>
                Annuleer
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={saving !== null || !canSave}
                className="flex-1 rounded-xl py-2.5 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}>
                {saving === 'save' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Opslaan
              </button>
            </div>
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving !== null || !canSave}
              className="w-full rounded-xl py-2.5 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 border"
              style={{ background: 'rgba(37,151,188,0.15)', borderColor: 'rgba(37,151,188,0.4)', color: '#2597BC' }}>
              {saving === 'activate' ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
              Opslaan en meteen activeren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Admin page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [questions, setQuestions] = useState<QuestionWithStats[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState<QuestionWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    document.body.style.background = t.bg(theme)
  }, [theme])

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'theme').single()
      .then(({ data }) => { if (data) setTheme(data.value as Theme) })

    const channel = supabase
      .channel('settings-theme')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'key=eq.theme' },
        ({ new: row }) => setTheme((row as { value: Theme }).value))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleTheme = useCallback(async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    await supabase.from('settings').update({ value: next }).eq('key', 'theme')
  }, [theme])

  const fetchQuestions = useCallback(async () => {
    const { data: qs } = await supabase
      .from('questions')
      .select('*, answers(*, votes(id))')
      .order('created_at', { ascending: false })

    if (qs) {
      const withStats: QuestionWithStats[] = qs.map(q => {
        const answers = (q.answers ?? []).map((a: Answer & { votes: { id: string }[] }) => ({
          ...a,
          vote_count: (a.votes ?? []).length,
        }))
        return { ...q, answers, total_votes: answers.reduce((s: number, a: { vote_count: number }) => s + a.vote_count, 0) }
      })
      setQuestions(withStats)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchQuestions()
    const channel = supabase
      .channel('admin-votes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, fetchQuestions)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [authed, fetchQuestions])

  const handleActivate = async (id: string) => {
    await supabase.from('questions').update({ is_active: false }).neq('id', id)
    await supabase.from('questions').update({ is_active: true }).eq('id', id)
    fetchQuestions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Vraag en alle stemmen verwijderen?')) return
    await supabase.from('questions').delete().eq('id', id)
    fetchQuestions()
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  const active = questions.find(q => q.is_active)
  const inactive = questions.filter(q => !q.is_active)
  const inactiveTotalVotes = inactive.reduce((s, q) => s + q.total_votes, 0)

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ background: t.bg(theme) }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: '#2597BC' }}>VRD Metaalrecycling</div>
          <h1 className="text-2xl font-bold" style={{ color: t.text(theme) }}>Questionnaire Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-black/10"
            style={{ color: t.textMuted(theme), border: `1px solid ${t.border(theme)}` }}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? 'Licht thema' : 'Donker thema'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all shadow-lg hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}>
            <Plus className="w-4 h-4" /> Nieuwe vraag
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 rounded-full animate-spin" style={{ borderTopColor: '#2597BC' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {active && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: t.textMuted(theme) }}>Actieve vraag</h2>
              <QuestionCard q={active} onActivate={handleActivate} onDelete={handleDelete} onEdit={setEditQuestion} isActive theme={theme} />
            </section>
          )}

          {inactive.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: t.textMuted(theme) }}>
                Vorige vragen ({inactive.length} {inactive.length === 1 ? 'vraag' : 'vragen'}, {inactiveTotalVotes} {inactiveTotalVotes === 1 ? 'stem' : 'stemmen'})
              </h2>
              <div className="flex flex-col gap-3">
                {inactive.map(q => (
                  <QuestionCard key={q.id} q={q} onActivate={handleActivate} onDelete={handleDelete} onEdit={setEditQuestion} isActive={false} theme={theme} />
                ))}
              </div>
            </section>
          )}

          {questions.length === 0 && (
            <div className="text-center py-20" style={{ color: t.textMuted(theme) }}>
              Nog geen vragen. Klik op &quot;Nieuwe vraag&quot; om te starten.
            </div>
          )}
        </div>
      )}

      {showModal && <QuestionModal onClose={() => setShowModal(false)} onSave={fetchQuestions} theme={theme} />}
      {editQuestion && <QuestionModal onClose={() => setEditQuestion(null)} onSave={fetchQuestions} initial={editQuestion} theme={theme} />}
    </div>
  )
}
