'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Question, type Answer } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'

export default function ConsumerPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [voted, setVoted] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

    const channel = supabase
      .channel('active-question')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        setVoted(null)
        fetchActiveQuestion()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchActiveQuestion])

  const handleVote = async (answer: Answer) => {
    if (voted) return
    setVoted(answer.id)
    await supabase.from('votes').insert({ answer_id: answer.id })
    setTimeout(() => setVoted(null), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#2D2D32' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#2597BC] rounded-full animate-spin" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#2D2D32' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style={{ background: 'rgba(37,151,188,0.1)' }}>⏳</div>
        <p className="text-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>Geen actieve vraag op dit moment.</p>
      </div>
    )
  }

  const answers = question.answers ?? []

  return (
    <div className="min-h-screen flex flex-col items-center px-8 py-6 relative overflow-hidden" style={{ background: '#2D2D32' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(2,87,123,0.25) 0%, transparent 60%)' }} />

      {/* Branding */}
      <div className="mt-2 mb-1 text-sm font-bold tracking-widest uppercase" style={{ color: '#2597BC' }}>
        VRD Metaalrecycling
      </div>
      <div className="mb-6 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Wij betalen voor oude metalen
      </div>

      {/* Question */}
      <h1 className="text-center text-5xl font-bold text-white mb-6 max-w-4xl leading-tight">
        {question.text}
      </h1>

      {/* Answers — fixed height so buttons don't overflow */}
      <div
        className={`w-full grid gap-4 ${answers.length <= 2 ? 'grid-cols-2' : answers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
        style={{ height: '52vh' }}
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
                background: 'rgba(255,255,255,0.04)',
                border: '2px solid rgba(255,255,255,0.06)',
              } : {
                background: 'rgba(2,87,123,0.25)',
                border: '2px solid rgba(37,151,188,0.35)',
              }}
              className={`
                relative w-full h-full rounded-3xl px-8 text-3xl font-bold text-center
                transition-all duration-300 select-none flex flex-col items-center justify-center gap-2
                ${isVoted
                  ? 'text-white scale-[1.01]'
                  : isDisabled
                    ? 'cursor-default'
                    : 'text-white cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                }
              `}
            >
              {isVoted && (
                <CheckCircle className="absolute top-5 right-5 w-7 h-7 text-white/80" />
              )}
              <span
                className="text-lg font-semibold"
                style={{ color: isVoted ? 'rgba(255,255,255,0.65)' : 'rgba(37,151,188,0.8)' }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ color: isDisabled && !isVoted ? 'rgba(255,255,255,0.2)' : 'white' }}>
                {answer.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Feedback */}
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
