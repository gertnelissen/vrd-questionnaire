'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Question, type Answer } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'

type Theme = 'dark' | 'light'

const colors = {
  bg:       (th: Theme) => th === 'dark' ? '#2D2D32' : '#f0f4f7',
  text:     (th: Theme) => th === 'dark' ? '#ffffff'  : '#2D2D32',
  textMid:  (th: Theme) => th === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
  btnBg:    (th: Theme) => th === 'dark' ? 'rgba(2,87,123,0.25)'    : 'rgba(37,151,188,0.12)',
  btnBorder:(th: Theme) => th === 'dark' ? 'rgba(37,151,188,0.35)'  : 'rgba(37,151,188,0.5)',
  btnDimBg: (th: Theme) => th === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  btnDimBorder:(th: Theme) => th === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  labelColor:(th: Theme) => th === 'dark' ? 'rgba(37,151,188,0.9)'  : '#2597BC',
}

export default function ConsumerPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [voted, setVoted] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    document.body.style.background = colors.bg(theme)
  }, [theme])

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'theme').single()
      .then(({ data }) => { if (data) setTheme(data.value as Theme) })

    const channel = supabase
      .channel('settings-theme-consumer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'key=eq.theme' },
        ({ new: row }) => setTheme((row as { value: Theme }).value))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchActiveQuestion = useCallback(async () => {
    const { data } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('is_active', true)
      .maybeSingle()
    setQuestion(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchActiveQuestion()

    const questionChannel = supabase
      .channel('active-question')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        setVoted(null)
        fetchActiveQuestion()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(questionChannel)
    }
  }, [fetchActiveQuestion])

  const handleVote = async (answer: Answer) => {
    if (voted) return
    setVoted(answer.id)
    await supabase.from('votes').insert({ answer_id: answer.id })
    setTimeout(() => setVoted(null), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg(theme) }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#2597BC] rounded-full animate-spin" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: colors.bg(theme) }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style={{ background: 'rgba(37,151,188,0.1)' }}>⏳</div>
        <p className="text-lg" style={{ color: colors.textMid(theme) }}>Geen actieve vraag op dit moment.</p>
      </div>
    )
  }

  const answers = question.answers ?? []

  return (
    <div className="min-h-screen flex flex-col items-center px-8 py-6 relative overflow-hidden" style={{ background: colors.bg(theme) }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(2,87,123,0.2) 0%, transparent 60%)' }} />

      <div className="mt-2 mb-1 text-sm font-bold tracking-widest uppercase" style={{ color: '#2597BC' }}>
        VRD Metaalrecycling
      </div>
      <div className="mb-6 text-sm font-medium" style={{ color: colors.textMid(theme) }}>
        Wij betalen voor oude metalen
      </div>

      <h1 className="text-center text-6xl font-bold mb-5 max-w-4xl leading-tight" style={{ color: colors.text(theme) }}>
        {question.text}
      </h1>

      <div
        className={`w-full grid gap-4 ${answers.length <= 2 ? 'grid-cols-2' : answers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
        style={{ height: '58vh' }}
      >
        {answers.map((answer, i) => {
          const isVoted = voted === answer.id
          const isDisabled = voted !== null

          return (
            <button
              key={answer.id}
              onClick={() => handleVote(answer)}
              disabled={isDisabled}
              style={isVoted ? {
                background: '#2597BC',
                boxShadow: '0 0 60px rgba(37,151,188,0.45)',
                border: '2px solid #2597BC',
              } : isDisabled ? {
                background: colors.btnDimBg(theme),
                border: `2px solid ${colors.btnDimBorder(theme)}`,
              } : {
                background: colors.btnBg(theme),
                border: `2px solid ${colors.btnBorder(theme)}`,
              }}
              className={`
                relative w-full h-full rounded-3xl px-6 text-center
                transition-all duration-300 select-none flex flex-col items-center justify-center gap-3
                ${isVoted ? 'scale-[1.01]' : isDisabled ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'}
              `}
            >
              {isVoted && <CheckCircle className="absolute top-5 right-5 w-8 h-8 text-white/80" />}
              <span className="text-2xl font-bold" style={{ color: isVoted ? 'rgba(255,255,255,0.65)' : colors.labelColor(theme) }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span
                className="font-bold leading-tight"
                style={{
                  fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)',
                  color: isVoted ? 'white' : isDisabled ? colors.textMid(theme) : colors.text(theme),
                }}
              >
                {answer.text}
              </span>
            </button>
          )
        })}
      </div>

      <div
        className={`mt-5 text-base font-semibold transition-opacity duration-500 flex items-center gap-2 ${voted ? 'opacity-100' : 'opacity-0'}`}
        style={{ color: '#2597BC' }}
      >
        <CheckCircle className="w-5 h-5" />
        Jouw antwoord is geregistreerd!
      </div>
    </div>
  )
}
