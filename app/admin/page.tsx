'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Question, type Answer } from '@/lib/supabase'
import { Plus, Trash2, CheckCircle2, Zap, ChevronDown, ChevronUp, X, Pencil } from 'lucide-react'

const ADMIN_PASSWORD = '0852'

type QuestionWithStats = Question & {
  answers: (Answer & { vote_count: number })[]
  total_votes: number
}

type EditableAnswer = {
  id?: string       // existing answers have an id, new ones don't
  text: string
  toDelete?: boolean
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#2D2D32' }}>
      <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#2597BC' }}>VRD Metaalrecycling</div>
      <h1 className="text-2xl font-bold text-white">Admin</h1>
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
        <button
          type="submit"
          className="rounded-xl px-4 py-3 text-white font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}
        >
          Inloggen
        </button>
      </form>
    </div>
  )
}

const CHART_COLORS = ['#2597BC', '#02577B', '#4db8d4', '#016a94', '#7dd3e8', '#015f84']

type AnswerWithStats = Answer & { vote_count: number }

function QuestionCard({ q, onActivate, onDelete, onEdit, isActive }: {
  q: QuestionWithStats
  onActivate: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (q: QuestionWithStats) => void
  isActive: boolean
}) {
  const [expanded, setExpanded] = useState(isActive)

  return (
    <div
      className="rounded-2xl border transition-all duration-300"
      style={isActive ? {
        borderColor: 'rgba(37,151,188,0.6)',
        background: 'rgba(2,87,123,0.2)',
      } : {
        borderColor: 'rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-start gap-3 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{ background: 'rgba(37,151,188,0.15)', color: '#2597BC', borderColor: 'rgba(37,151,188,0.4)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2597BC' }} />
                Actief
              </span>
            )}
            <span className="text-white/30 text-xs">{q.total_votes} stem{q.total_votes !== 1 ? 'men' : ''}</span>
          </div>
          <p className="text-white font-medium leading-snug">{q.text}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isActive && (
            <button
              onClick={() => onActivate(q.id)}
              title="Activeer deze vraag"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}
            >
              <Zap className="w-3.5 h-3.5" />
              Activeer
            </button>
          )}
          <button
            onClick={() => onEdit(q)}
            title="Bewerk"
            className="p-2 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/10"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(q.id)}
            title="Verwijder"
            className="p-2 rounded-lg transition-colors text-white/20 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-2 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/10"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="grid gap-2">
            {(q.answers as AnswerWithStats[]).map((a, i) => {
              const pct = q.total_votes > 0 ? Math.round((a.vote_count / q.total_votes) * 100) : 0
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-white/40 text-sm w-5 shrink-0">{String.fromCharCode(65 + i)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{a.text}</span>
                      <span className="text-white/40 tabular-nums">{a.vote_count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
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

function QuestionModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void
  onSave: () => void
  initial?: QuestionWithStats
}) {
  const isEdit = !!initial
  const [questionText, setQuestionText] = useState(initial?.text ?? '')
  const [answers, setAnswers] = useState<EditableAnswer[]>(
    initial?.answers.map(a => ({ id: a.id, text: a.text })) ?? [{ text: '' }, { text: '' }]
  )
  const [saving, setSaving] = useState(false)

  const visibleAnswers = answers.filter(a => !a.toDelete)
  const canSave = questionText.trim() && visibleAnswers.filter(a => a.text.trim()).length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)

    if (isEdit && initial) {
      // Update question text
      await supabase.from('questions').update({ text: questionText.trim() }).eq('id', initial.id)

      // Delete removed answers
      const toDelete = answers.filter(a => a.id && a.toDelete)
      for (const a of toDelete) {
        await supabase.from('answers').delete().eq('id', a.id!)
      }

      // Update existing answers
      const toUpdate = answers.filter(a => a.id && !a.toDelete && a.text.trim())
      for (const a of toUpdate) {
        await supabase.from('answers').update({ text: a.text.trim() }).eq('id', a.id!)
      }

      // Insert new answers
      const toInsert = answers.filter(a => !a.id && !a.toDelete && a.text.trim())
      if (toInsert.length > 0) {
        await supabase.from('answers').insert(
          toInsert.map(a => ({ question_id: initial.id, text: a.text.trim() }))
        )
      }
    } else {
      // New question
      const { data: q } = await supabase
        .from('questions')
        .insert({ text: questionText.trim(), is_active: false })
        .select()
        .single()

      if (q) {
        await supabase.from('answers').insert(
          answers.filter(a => a.text.trim()).map(a => ({ question_id: q.id, text: a.text.trim() }))
        )
      }
    }

    setSaving(false)
    onSave()
    onClose()
  }

  const removeAnswer = (i: number) => {
    const a = answers[i]
    if (a.id) {
      // Existing: mark for deletion
      setAnswers(prev => prev.map((v, j) => j === i ? { ...v, toDelete: true } : v))
    } else {
      setAnswers(prev => prev.filter((_, j) => j !== i))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-lg border shadow-2xl" style={{ background: '#1e2a30', borderColor: 'rgba(37,151,188,0.2)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Vraag bewerken' : 'Nieuwe vraag'}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Vraag</label>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Typ hier je vraag..."
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none border transition-colors resize-none"
              style={{ background: 'rgba(2,87,123,0.15)', borderColor: 'rgba(37,151,188,0.25)' }}
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Antwoorden (min. 2)</label>
            <div className="flex flex-col gap-2">
              {answers.map((a, i) => {
                if (a.toDelete) return null
                const visibleIndex = answers.slice(0, i).filter(v => !v.toDelete).length
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-white/30 text-sm w-5">{String.fromCharCode(65 + visibleIndex)}</span>
                    <input
                      value={a.text}
                      onChange={e => setAnswers(prev => prev.map((v, j) => j === i ? { ...v, text: e.target.value } : v))}
                      placeholder={`Antwoord ${String.fromCharCode(65 + visibleIndex)}`}
                      className="flex-1 rounded-xl px-4 py-2.5 text-white placeholder-white/20 outline-none border transition-colors"
                      style={{ background: 'rgba(2,87,123,0.15)', borderColor: 'rgba(37,151,188,0.25)' }}
                    />
                    {visibleAnswers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(i)}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
              {visibleAnswers.length < 6 && (
                <button
                  type="button"
                  onClick={() => setAnswers(prev => [...prev, { text: '' }])}
                  className="flex items-center gap-2 text-sm transition-colors mt-1 ml-7 hover:opacity-80"
                  style={{ color: '#2597BC' }}
                >
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

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 bg-white/5 hover:bg-white/10 text-white/60 font-medium transition-colors">
              Annuleer
            </button>
            <button
              type="submit"
              disabled={saving || !canSave}
              className="flex-1 rounded-xl py-2.5 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [questions, setQuestions] = useState<QuestionWithStats[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState<QuestionWithStats | null>(null)
  const [loading, setLoading] = useState(true)

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
        return {
          ...q,
          answers,
          total_votes: answers.reduce((s: number, a: { vote_count: number }) => s + a.vote_count, 0),
        }
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

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ background: '#2D2D32' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: '#2597BC' }}>VRD Metaalrecycling</div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all shadow-lg hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #2597BC, #02577B)' }}
        >
          <Plus className="w-4 h-4" />
          Nieuwe vraag
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 rounded-full animate-spin" style={{ borderTopColor: '#2597BC' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {active && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3 text-white/30">Actieve vraag</h2>
              <QuestionCard q={active} onActivate={handleActivate} onDelete={handleDelete} onEdit={setEditQuestion} isActive />
            </section>
          )}

          {inactive.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3 text-white/30">Vorige vragen</h2>
              <div className="flex flex-col gap-3">
                {inactive.map(q => (
                  <QuestionCard key={q.id} q={q} onActivate={handleActivate} onDelete={handleDelete} onEdit={setEditQuestion} isActive={false} />
                ))}
              </div>
            </section>
          )}

          {questions.length === 0 && (
            <div className="text-center py-20 text-white/30">
              Nog geen vragen. Klik op &quot;Nieuwe vraag&quot; om te starten.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <QuestionModal onClose={() => setShowModal(false)} onSave={fetchQuestions} />
      )}
      {editQuestion && (
        <QuestionModal onClose={() => setEditQuestion(null)} onSave={fetchQuestions} initial={editQuestion} />
      )}
    </div>
  )
}
