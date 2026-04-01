'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Question, type Answer } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Plus, Trash2, CheckCircle2, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react'

const ADMIN_PASSWORD = '0852'

type QuestionWithStats = Question & {
  answers: (Answer & { vote_count: number })[]
  total_votes: number
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="text-xs font-semibold tracking-widest text-white/20 uppercase">VRD Questionnaire</div>
      <h1 className="text-2xl font-bold text-white">Admin</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          placeholder="Wachtwoord"
          autoFocus
          className={`rounded-xl px-4 py-3 bg-white/10 text-white placeholder-white/30 outline-none border ${error ? 'border-red-500' : 'border-white/10 focus:border-white/40'} transition-colors`}
        />
        {error && <p className="text-red-400 text-sm text-center">Verkeerd wachtwoord</p>}
        <button
          type="submit"
          className="rounded-xl px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          Inloggen
        </button>
      </form>
    </div>
  )
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

type AnswerWithStats = Answer & { vote_count: number }

function QuestionCard({ q, onActivate, onDelete, isActive }: {
  q: QuestionWithStats
  onActivate: (id: string) => void
  onDelete: (id: string) => void
  isActive: boolean
}) {
  const [expanded, setExpanded] = useState(isActive)

  const chartData = (q.answers as AnswerWithStats[]).map(a => ({
    name: a.text.length > 20 ? a.text.slice(0, 20) + '…' : a.text,
    votes: a.vote_count,
  }))

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${isActive ? 'border-indigo-500/60 bg-indigo-950/30' : 'border-white/10 bg-white/5'}`}>
      {/* Header */}
      <div className="flex items-start gap-3 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
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
              title="Activeer"
              className="p-2 rounded-lg hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(q.id)}
            title="Verwijder"
            className="p-2 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <div className="grid gap-2 mb-6">
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
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
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

          {q.total_votes > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}

function AddQuestionModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [questionText, setQuestionText] = useState('')
  const [answers, setAnswers] = useState(['', ''])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filledAnswers = answers.filter(a => a.trim())
    if (!questionText.trim() || filledAnswers.length < 2) return

    setSaving(true)

    const { data: q } = await supabase
      .from('questions')
      .insert({ text: questionText.trim(), is_active: false })
      .select()
      .single()

    if (q) {
      await supabase.from('answers').insert(
        filledAnswers.map(text => ({ question_id: q.id, text: text.trim() }))
      )
    }

    setSaving(false)
    onAdd()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Nieuwe vraag</h2>
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
              className="w-full rounded-xl px-4 py-3 bg-white/10 text-white placeholder-white/20 outline-none border border-white/10 focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Antwoorden (min. 2)</label>
            <div className="flex flex-col gap-2">
              {answers.map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-white/30 text-sm w-5">{String.fromCharCode(65 + i)}</span>
                  <input
                    value={a}
                    onChange={e => setAnswers(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                    placeholder={`Antwoord ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-xl px-4 py-2.5 bg-white/10 text-white placeholder-white/20 outline-none border border-white/10 focus:border-indigo-500/50 transition-colors"
                  />
                  {answers.length > 2 && (
                    <button type="button" onClick={() => setAnswers(prev => prev.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {answers.length < 6 && (
                <button
                  type="button"
                  onClick={() => setAnswers(prev => [...prev, ''])}
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-1 ml-7"
                >
                  <Plus className="w-4 h-4" /> Antwoord toevoegen
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 bg-white/5 hover:bg-white/10 text-white/60 font-medium transition-colors">
              Annuleer
            </button>
            <button
              type="submit"
              disabled={saving || !questionText.trim() || answers.filter(a => a.trim()).length < 2}
              className="flex-1 rounded-xl py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
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
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs font-semibold tracking-widest text-white/20 uppercase mb-1">VRD Questionnaire</div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nieuwe vraag
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active */}
          {active && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">Actieve vraag</h2>
              <QuestionCard q={active} onActivate={handleActivate} onDelete={handleDelete} isActive />
            </section>
          )}

          {/* Inactive */}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">Vorige vragen</h2>
              <div className="flex flex-col gap-3">
                {inactive.map(q => (
                  <QuestionCard key={q.id} q={q} onActivate={handleActivate} onDelete={handleDelete} isActive={false} />
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

      {showModal && <AddQuestionModal onClose={() => setShowModal(false)} onAdd={fetchQuestions} />}
    </div>
  )
}
