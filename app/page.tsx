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
        <p className="text-white/40 text-lg">Geen actieve vraag op dit moment.</p>
      </div>
    )
  }

  const answers = question.answers ?? []

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-6 relative overflow-hidden" style={{ background: '#2D2D32' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(2,87,123,0.3) 0%, transparent 60%)' }} />

      {/* Branding */}
      <div className="mt-2 mb-0.5 text-xs font-semibold tracking-widest uppercase" style={{ color: '#2597BC' }}>
        VRD Metaalrecycling
      </div>
      <div className="mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Wij betalen voor oude metalen
      </div>

      {/* Question */}
      <h1 className="text-center text-4xl font-bold text-white mb-5 max-w-4xl leading-snug">
        {question.text}
      </h1>

      {/* Answers */}
      <div className={`w-full flex-1 grid gap-4 ${answers.length <= 2 ? 'grid-cols-2' : answers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                boxShadow: '0 0 60px rgba(37,151,188,0.5)',
                border: '2px solid #2597BC',
              } : isDisabled ? {
                background: 'rgba(255,255,255,0.04)',
                border: '2px solid rgba(255,255,255,0.06)',
              } : {
                background: 'rgba(2,87,123,0.25)',
                border: '2px solid rgba(37,151,188,0.3)',
              }}
              className={`
                relative rounded-3xl px-8 text-3xl font-semibold text-center
                transition-all duration-300 select-none flex flex-col items-center justify-center
                ${isVoted
                  ? 'text-white scale-[1.01]'
                  : isDisabled
                    ? 'text-white/25 cursor-default'
                    : 'text-white cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                }
              `}
            >
              {isVoted && (
                <CheckCircle className="absolute top-5 right-5 w-7 h-7 text-white/80" />
              )}
              <span className="block text-base font-normal mb-3" style={{ color: isVoted ? 'rgba(255,255,255,0.6)' : 'rgba(37,151,188,0.7)' }}>
                {String.fromCharCode(65 + i)}
              </span>
              {answer.text}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      <div
        className={`mt-4 text-sm font-medium transition-opacity duration-500 flex items-center gap-2 ${voted ? 'opacity-100' : 'opacity-0'}`}
        style={{ color: '#2597BC' }}
      >
        <CheckCircle className="w-4 h-4" />
        Jouw antwoord is geregistreerd!
      </div>
    </div>
  )
}
